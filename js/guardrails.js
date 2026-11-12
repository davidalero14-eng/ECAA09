/**
 * Marmitaê - Guardrails e Camada de Segurança
 * Filtra Prompt Injection, tentativas de jailbreak, mensagens fora de escopo,
 * valida limites técnicos e sanitiza entradas/saídas antes e depois do LLM.
 */

import { CARDAPIO } from './menu.js';

// Expressões regulares de alta prioridade para detecção de jailbreak e prompt injection
const PADROES_INJECTION = [
  /ignore\s+(all\s+|todas\s+|qualquer\s+)?(as\s+)?(instrucoes|instructions|regras|diretrizes)/i,
  /esque(ça|ca)\s+(tudo|suas\s+regras|que\s+voce\s+e)/i,
  /mostre\s+(seu|o)\s+(prompt|sistema|system\s+prompt|instrucoes\s+internas)/i,
  /revele\s+(seu|suas|os)\s+(segredos|prompt|instrucoes|configuracoes)/i,
  /finja\s+que\s+voc[eê]\s+[eé]\s+(um\s+)?(admin|administrador|dono|gerente|root|desenvolvedor|hacker)/i,
  /altere\s+o\s+pre[cç]o\s+de\s+todos/i,
  /de\s+gra[cç]a|gratuitamente|tudo\s+gratis|gr[aá]tis/i,
  /execute\s+o\s+(c[oó]digo|script|comando)/i,
  /sou\s+o\s+(desenvolvedor|criador|dono|administrador)\s+do\s+sistema/i,
  /modo\s+dan|jailbreak|bypass|unrestricted/i,
  /<script[\s\S]*?>[\s\S]*?<\/script>/i,
  /javascript\s*:/i,
  /DROP\s+TABLE|SELECT\s+\*\s+FROM/i
];

// Padrões de dados sensíveis proibidos
const PADROES_DADOS_SENSIVEIS = [
  /\b\d{4}[ -]?\d{4}[ -]?\d{4}[ -]?\d{4}\b/, // Número completo de cartão
  /\bcvv\s*[:=]?\s*\d{3,4}\b/i,
  /\bsenha\s*[:=]?\s*\S+/i
];

export class Guardrails {
  /**
   * Analisa a mensagem do usuário antes de enviar ao modelo ou processar.
   * @param {string} texto
   * @returns {{ seguro: boolean, motivo?: string, respostaPadrao?: string }}
   */
  static validarEntradaUsuario(texto) {
    if (!texto || typeof texto !== 'string') {
      return { seguro: false, motivo: 'Entrada vazia ou inválida.' };
    }

    const textoLimpo = texto.trim();

    // 1. Limite de tamanho de caracteres (evita estouro de contexto e abuso)
    if (textoLimpo.length > 500) {
      return {
        seguro: false,
        motivo: 'Mensagem excede o limite permitido (500 caracteres).',
        respostaPadrao: 'Sua mensagem é um pouco longa! Para agilizar seu pedido, por favor envie mensagens mais curtas com o que deseja pedir. 😊'
      };
    }

    // 2. Detecção de Prompt Injection e Jailbreak
    for (const padrao of PADROES_INJECTION) {
      if (padrao.test(textoLimpo)) {
        return {
          seguro: false,
          motivo: 'Tentativa de manipulação ou desvio de escopo detectada.',
          respostaPadrao: 'Sou o assistente de vendas do Marmitaê e meu único objetivo é te ajudar a escolher e pedir marmitas e bebidas deliciosas do nosso cardápio! 🍲 Como posso te atender hoje?'
        };
      }
    }

    // 3. Detecção de dados sensíveis que o usuário não deve enviar (ex: cartão completo ou senhas)
    for (const padrao of PADROES_DADOS_SENSIVEIS) {
      if (padrao.test(textoLimpo)) {
        return {
          seguro: false,
          motivo: 'Envio desnecessário de dados bancários/sensíveis.',
          respostaPadrao: 'Por questões da sua segurança e privacidade, não compartilhe senhas ou o número completo do seu cartão. O pagamento é realizado na entrega (ou via PIX) de forma direta e protegida! 👍'
        };
      }
    }

    return { seguro: true };
  }

  /**
   * Valida a integridade de qualquer chamada de ferramenta (Action / Function Call)
   * garantindo que nenhum preço, produto inventado ou quantidade absurda seja executado.
   * @param {string} nomeAcao
   * @param {object} args
   * @returns {{ valido: boolean, erro?: string, argsSanitizados: object }}
   */
  static validarChamadaAcao(nomeAcao, args = {}) {
    const argsSanitizados = { ...args };

    switch (nomeAcao) {
      case 'adicionar_item': {
        const { produto_id, quantidade, personalizacoes } = argsSanitizados;
        
        // Valida se o ID existe de fato no cardápio
        const produtoExiste = CARDAPIO.some(p => p.id === produto_id);
        if (!produtoExiste) {
          return {
            valido: false,
            erro: `O produto com ID "${produto_id}" não existe no cardápio oficial.`,
            argsSanitizados
          };
        }

        // Valida quantidade (limite são entre 1 e 30)
        let qtd = parseInt(quantidade, 10);
        if (isNaN(qtd) || qtd <= 0) qtd = 1;
        if (qtd > 30) qtd = 30; // Proteção contra quantidades abusivas
        argsSanitizados.quantidade = qtd;

        // Sanitiza personalizações
        if (personalizacoes && !Array.isArray(personalizacoes)) {
          argsSanitizados.personalizacoes = [String(personalizacoes)];
        }
        break;
      }

      case 'remover_item': {
        if (!argsSanitizados.produto_id && !argsSanitizados.id_item) {
          return { valido: false, erro: 'Identificador do item ausente para remoção.', argsSanitizados };
        }
        break;
      }

      case 'personalizar_item': {
        // Assegura que personalizações não injetem scripts
        if (argsSanitizados.personalizacoes && Array.isArray(argsSanitizados.personalizacoes)) {
          argsSanitizados.personalizacoes = argsSanitizados.personalizacoes.map(p => String(p).slice(0, 80));
        }
        break;
      }

      case 'definir_entrega': {
        const tipo = String(argsSanitizados.tipo || '').toLowerCase();
        if (tipo !== 'retirada' && tipo !== 'entrega') {
          argsSanitizados.tipo = 'entrega';
        }
        break;
      }

      case 'definir_pagamento': {
        // Impede que o LLM altere valores de troco de forma maliciosa
        if (argsSanitizados.troco_para) {
          let troco = parseFloat(String(argsSanitizados.troco_para).replace(',', '.'));
          if (isNaN(troco) || troco <= 0) troco = null;
          argsSanitizados.troco_para = troco;
        }
        break;
      }
    }

    return { valido: true, argsSanitizados };
  }

  /**
   * Valida a resposta do LLM antes de exibir ao usuário, assegurando
   * que nenhum vazamento de prompt interno ocorreu.
   * @param {string} respostaTexto
   * @returns {string} Resposta tratada e segura
   */
  static sanitizarRespostaLLM(respostaTexto) {
    if (!respostaTexto) return 'Desculpe, tive um probleminha para processar sua mensagem. Pode repetir?';

    // Se o modelo alucinar e cuspir o prompt de sistema
    if (
      respostaTexto.includes('DIRETRIZES FUNDAMENTAIS DO MARMITAÊ') ||
      respostaTexto.includes('SYSTEM INSTRUCTIONS') ||
      respostaTexto.includes('Você é o assistente virtual do restaurante Marmitaê')
    ) {
      return 'Sou o assistente de pedidos do Marmitaê! Como posso te ajudar hoje com as nossas deliciosas marmitas? 🍛';
    }

    return respostaTexto;
  }
}
