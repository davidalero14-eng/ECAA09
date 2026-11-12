/**
 * Marmitaê - Orquestrador Central do Agente de Inteligência Artificial
 * Gerencia histórico de conversação, decisão entre Modo Gemini (LLM + Function Calling)
 * e Modo Demonstração Determinístico, validação por Guardrails e execução de ferramentas.
 */

import { SYSTEM_PROMPT_MARMITAE, FERRAMENTAS_AGENTE } from './agent_tools.js';
import { GeminiService } from './llm.js';
import { DeterministicAgent } from './deterministic_agent.js';
import { Guardrails } from './guardrails.js';
import { CARDAPIO, consultarCardapio, getDiaAtual } from './menu.js';

export class AgentManager {
  constructor(carrinho, checkout, onToolExecuted = null) {
    this.carrinho = carrinho;
    this.checkout = checkout;
    this.onToolExecuted = onToolExecuted;

    this.gemini = new GeminiService();
    this.deterministicAgent = new DeterministicAgent(carrinho, checkout);

    // Histórico de mensagens no padrão Gemini: { role: 'user'|'model', parts: [{ text: ... }] }
    this.historico = [];
    this.modoAtual = this.gemini.temApiKey() ? 'llm' : 'demo'; // 'llm' ou 'demo'
  }

  setModo(modo) {
    if (modo === 'llm' && !this.gemini.temApiKey()) {
      throw new Error('Para usar o Modo IA Gemini, configure uma chave de API válida primeiro.');
    }
    this.modoAtual = modo;
  }

  getModo() {
    return this.modoAtual;
  }

  limparHistorico() {
    this.historico = [];
    this.deterministicAgent.reset();
  }

  /**
   * Processa a mensagem do usuário com todas as camadas de proteção e inteligência.
   * @param {string} mensagemTexto
   * @returns {Promise<{ resposta: string, acoesExecutadas: Array, modoUsado: string }>}
   */
  async processarMensagem(mensagemTexto) {
    // CAMADA 1: GUARDRAILS DE ENTRADA
    const validacaoEntrada = Guardrails.validarEntradaUsuario(mensagemTexto);
    if (!validacaoEntrada.seguro) {
      return {
        resposta: validacaoEntrada.respostaPadrao || 'Mensagem não pôde ser processada por motivos de segurança.',
        acoesExecutadas: [],
        modoUsado: 'guardrails'
      };
    }

    // Se estiver no MODO DEMO DETERMINÍSTICO (Sem Chave)
    if (this.modoAtual === 'demo') {
      const resultadoDemo = this.deterministicAgent.processarMensagem(mensagemTexto);
      return {
        resposta: resultadoDemo.resposta,
        acoesExecutadas: resultadoDemo.acoesExecutadas,
        modoUsado: 'demo'
      };
    }

    // MODO GEMINI (LLM com Chamada de Ferramentas / Function Calling)
    try {
      // Adiciona mensagem do usuário ao histórico Gemini
      this.historico.push({
        role: 'user',
        parts: [{ text: mensagemTexto }]
      });

      // Contexto do carrinho injetado no prompt de sistema
      const estadoCarrinho = this.carrinho.obterEstado();
      const pendencias = this.checkout.obterPendencias();
      const contextoDinamico = `
${SYSTEM_PROMPT_MARMITAE}

SITUAÇÃO ATUAL DO PEDIDO:
- Dia da semana: ${getDiaAtual()}
- Itens no carrinho: ${JSON.stringify(estadoCarrinho.itens)}
- Subtotal: R$ ${estadoCarrinho.subtotal.toFixed(2)} | Frete: R$ ${estadoCarrinho.taxaEntrega.toFixed(2)} | Total: R$ ${estadoCarrinho.total.toFixed(2)}
- Tipo de entrega: ${this.carrinho.tipoEntrega}
- Cliente: Nome="${this.checkout.cliente.nome || ''}", Endereço="${this.checkout.cliente.endereco.rua || ''}", Pagamento="${this.checkout.cliente.formaPagamento || ''}"
- Informações pendentes para fechar: ${pendencias.join(', ') || 'nenhuma (pronto para confirmação)'}
- Aguardando confirmação final do cliente: ${this.checkout.aguardandoConfirmacaoFinal ? 'SIM' : 'NÃO'}
`;

      // Chamada HTTP ao Google Gemini
      const resultadoLLM = await this.gemini.gerarResposta(
        contextoDinamico,
        this.historico,
        FERRAMENTAS_AGENTE
      );

      const acoesExecutadas = [];

      // Processa chamadas de função retornadas pelo modelo
      if (resultadoLLM.toolCalls && resultadoLLM.toolCalls.length > 0) {
        for (const tc of resultadoLLM.toolCalls) {
          const resultadoAcao = this.executarAcaoValidada(tc.name, tc.args);
          acoesExecutadas.push({ nome: tc.name, args: tc.args, resultado: resultadoAcao });
        }
      }

      // Sanitiza resposta textual para evitar vazamentos
      let respostaFinal = Guardrails.sanitizarRespostaLLM(resultadoLLM.respostaTexto);

      // Se o modelo só executou ferramenta e não deu texto explicativo, gera resposta amigável
      if (!respostaFinal && acoesExecutadas.length > 0) {
        respostaFinal = this.gerarFeedbackParaAcoes(acoesExecutadas);
      }

      // Salva resposta do modelo no histórico
      this.historico.push({
        role: 'model',
        parts: [{ text: respostaFinal }]
      });

      return {
        resposta: respostaFinal,
        acoesExecutadas,
        modoUsado: 'llm'
      };
    } catch (err) {
      console.warn('[AgentManager] Falha no Gemini, acionando fallback determinístico:', err.message);
      // Fallback gracioso: não quebra a experiência do usuário se a API cair
      const resultadoFallback = this.deterministicAgent.processarMensagem(mensagemTexto);
      return {
        resposta: resultadoFallback.resposta + '\n\n*(Nota: Resposta gerada via motor local devido a oscilação na API)*',
        acoesExecutadas: resultadoFallback.acoesExecutadas,
        modoUsado: 'fallback'
      };
    }
  }

  /**
   * Executa a ferramenta solicitada pelo LLM sob validação estrita do JavaScript.
   */
  executarAcaoValidada(nomeAcao, args = {}) {
    const validacao = Guardrails.validarChamadaAcao(nomeAcao, args);
    if (!validacao.valido) {
      console.warn('[Guardrails Bloqueou Ação]', validacao.erro);
      return { erro: validacao.erro };
    }

    const { argsSanitizados } = validacao;

    switch (nomeAcao) {
      case 'consultar_cardapio': {
        const dia = argsSanitizados.dia || getDiaAtual();
        const categoria = argsSanitizados.categoria || null;
        return { itensDisponiveis: consultarCardapio(dia, categoria) };
      }

      case 'adicionar_item': {
        return this.carrinho.adicionarItem(
          argsSanitizados.produto_id,
          argsSanitizados.quantidade || 1,
          argsSanitizados.personalizacoes || [],
          argsSanitizados.observacoes || ''
        );
      }

      case 'remover_item': {
        return this.carrinho.removerItem(argsSanitizados.produto_id || argsSanitizados.id_item);
      }

      case 'personalizar_item': {
        return this.carrinho.personalizarItem(
          argsSanitizados.produto_id || null,
          argsSanitizados.personalizacoes || [],
          argsSanitizados.observacoes || null
        );
      }

      case 'alterar_quantidade': {
        return this.carrinho.alterarQuantidade(argsSanitizados.produto_id, argsSanitizados.quantidade);
      }

      case 'consultar_carrinho': {
        return this.carrinho.obterEstado();
      }

      case 'definir_entrega': {
        if (argsSanitizados.tipo) {
          this.carrinho.definirTipoEntrega(argsSanitizados.tipo);
        }
        if (argsSanitizados.nome_cliente) {
          this.checkout.setNomeCliente(argsSanitizados.nome_cliente);
        }
        if (argsSanitizados.endereco) {
          this.checkout.setEndereco(argsSanitizados.endereco);
        }
        return { sucesso: true, estado: this.carrinho.obterEstado() };
      }

      case 'definir_pagamento': {
        this.checkout.setFormaPagamento(
          argsSanitizados.forma_pagamento,
          argsSanitizados.troco_para || null
        );
        return { sucesso: true, forma: this.checkout.cliente.formaPagamento };
      }

      case 'finalizar_pedido': {
        if (argsSanitizados.confirmado_pelo_cliente === true) {
          return this.checkout.confirmarEFinalizar();
        }
        return { sucesso: false, erro: 'Confirmação do cliente não foi explícita.' };
      }

      default:
        return { erro: `Ação desconhecida: ${nomeAcao}` };
    }
  }

  gerarFeedbackParaAcoes(acoes) {
    const nomes = acoes.map(a => a.nome).join(', ');
    return `Ação realizada com sucesso (${nomes})! Como posso continuar te atendendo? 😊`;
  }
}
