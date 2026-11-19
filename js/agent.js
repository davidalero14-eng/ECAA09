/**
 * Marmitaê - Orquestrador Central do Agente de Inteligência Artificial
 * Gerencia histórico de conversação, validação por Guardrails e execução de ferramentas.
 * Versão exclusivamente determinística (sem LLM) - NLP Clássico + Regras + TF-IDF + Cosseno.
 */

import { DeterministicAgent } from './deterministic_agent.js';
import { Guardrails } from './guardrails.js';

export class AgentManager {
  constructor(carrinho, checkout, onToolExecuted = null) {
    this.carrinho = carrinho;
    this.checkout = checkout;
    this.onToolExecuted = onToolExecuted;

    this.deterministicAgent = new DeterministicAgent(carrinho, checkout);

    this.historico = [];
    this.modoAtual = 'deterministico';
    this._inicializado = false;
  }

  async inicializar() {
    if (this._inicializado) return;
    await this.deterministicAgent.inicializar();
    this._inicializado = true;
  }

  setModo(modo) {
    // Modo fixo para determinístico - ignorar tentativas de mudança
    this.modoAtual = 'deterministico';
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
   * @returns {Promise<{ resposta: string, acoesExecutadas: Array, modoUsado: string, cards?: Array }>}
   */
  async processarMensagem(mensagemTexto) {
    // Garante inicialização antes de processar
    await this.inicializar();
    
    // CAMADA 1: GUARDRAILS DE ENTRADA (Filtra Injection, Jailbreak, Rate Limit, Fuga de Escopo e Dados Sensíveis)
    const validacaoEntrada = Guardrails.validarEntradaUsuario(mensagemTexto);
    if (!validacaoEntrada.seguro) {
      return {
        resposta: validacaoEntrada.respostaPadrao || 'Mensagem não pôde ser processada por motivos de segurança.',
        acoesExecutadas: [],
        modoUsado: 'guardrails'
      };
    }

    // MODO DETERMINÍSTICO EXCLUSIVO (Regras + NLP + Vetorização + Cosseno 100% Client-Side)
    const resultadoDemo = this.deterministicAgent.processarMensagem(mensagemTexto);
    return {
      resposta: resultadoDemo.resposta,
      acoesExecutadas: resultadoDemo.acoesExecutadas,
      modoUsado: 'deterministico',
      cards: resultadoDemo.cards || null
    };
  }

  /**
   * Retorna diagnóstico completo do processamento NLP para uma mensagem.
   * @param {string} mensagemTexto
   * @returns {object} Diagnóstico detalhado
   */
  diagnosticarNLP(mensagemTexto) {
    if (!this._inicializado) {
      return { erro: 'Agente não inicializado' };
    }
    return this.deterministicAgent.diagnosticarNLP(mensagemTexto);
  }
}
