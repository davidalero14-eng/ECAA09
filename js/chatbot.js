/**
 * Marmitaê - Gerenciador da Interface do Chatbot
 * Renderiza mensagens, balões com efeito de entrada suave, horários,
 * indicador de digitação, cartões ricos de produtos e botões de atalho.
 */

import { formatarTextoMensagem, getHoraAtual, escaparHTML, formatarMoeda } from './utils.js';

export class ChatbotUI {
  constructor(containerMensagensId, digitandoId) {
    this.container = document.getElementById(containerMensagensId);
    this.digitandoEl = document.getElementById(digitandoId);
  }

  /**
   * Adiciona mensagem do usuário na tela.
   * @param {string} texto 
   */
  adicionarMensagemUsuario(texto) {
    const el = document.createElement('div');
    el.className = 'message message-user';
    el.innerHTML = `
      <div class="message-avatar">
        <div class="avatar-circle">👤</div>
      </div>
      <div class="message-content">
        <p>${escaparHTML(texto)}</p>
        <span class="message-time">${getHoraAtual()}</span>
      </div>
    `;
    this.container.appendChild(el);
    this.rolarParaFinal();
  }

  /**
   * Adiciona mensagem do agente (bot) com badge indicando o modo de processamento.
   * Suporta renderização opcional de cards visuais de produtos.
   * @param {string} texto 
   * @param {string} modoUsado 'llm', 'demo', 'deterministico', 'eliza', 'guardrails' ou 'fallback'
   * @param {Array<object>} cardsProdutos Lista opcional de produtos para exibir cards visuais
   */
  adicionarMensagemBot(texto, modoUsado = 'deterministico', cardsProdutos = null) {
    const el = document.createElement('div');
    el.className = 'message message-bot';

    let badgeHtml = '';
    if (modoUsado === 'llm') {
      badgeHtml = '<span class="mode-badge badge-llm" title="Processado por IA (Google Gemini)"><i class="fa-solid fa-sparkles"></i> IA Gemini</span>';
    } else if (modoUsado === 'eliza') {
      badgeHtml = '<span class="mode-badge badge-eliza" title="Processado por ELIZA (Padrões de Conversação Clássicos)"><i class="fa-solid fa-robot"></i> ELIZA</span>';
    } else if (modoUsado === 'deterministico' || modoUsado === 'demo' || modoUsado === 'sem_llm') {
      badgeHtml = '<span class="mode-badge badge-deterministico" title="Processado 100% Client-Side por Regras + NLP + TF-IDF + Cosseno"><i class="fa-solid fa-cube"></i> NLP Clássico</span>';
    } else if (modoUsado === 'guardrails') {
      badgeHtml = '<span class="mode-badge badge-guardrail" title="Filtro Ativo de Segurança e Integridade"><i class="fa-solid fa-shield-halved"></i> Guardrail Ativo</span>';
    } else if (modoUsado === 'fallback') {
      badgeHtml = '<span class="mode-badge badge-fallback" title="Fallback gracioso local acionado"><i class="fa-solid fa-arrows-rotate"></i> Fallback</span>';
    }

    let cardsHtml = '';
    if (cardsProdutos && Array.isArray(cardsProdutos) && cardsProdutos.length > 0) {
      cardsHtml = `
        <div class="cards-container">
          ${cardsProdutos.map(prod => `
            <article class="card-chat" data-id="${prod.id}" role="listitem">
              <div class="card-chat-header">
                <span class="card-chat-tag">${prod.categoria.toUpperCase()}</span>
                <span class="card-chat-price">${formatarMoeda(prod.preco)}</span>
              </div>
              <h3 class="card-chat-name">${escaparHTML(prod.nome)}</h3>
              <p class="card-chat-desc">${escaparHTML(prod.descricao)}</p>
              <button type="button" class="btn-card-pedir" data-id="${prod.id}" aria-label="Pedir ${escaparHTML(prod.nome)}">
                <i class="fa-solid fa-plus" aria-hidden="true"></i>
                Pedir
              </button>
            </article>
          `).join('')}
        </div>
      `;
    }

    el.innerHTML = `
      <div class="message-avatar">
        <div class="avatar-circle">🍲</div>
      </div>
      <div class="message-content">
        <div class="message-header">
          <span class="message-author">Marmitaê</span>
          ${badgeHtml}
        </div>
        <div class="message-texto">${formatarTextoMensagem(texto)}</div>
        ${cardsHtml}
        <span class="message-time">${getHoraAtual()}</span>
      </div>
    `;
    this.container.appendChild(el);
    this.rolarParaFinal();
  }

  /**
   * Exibe ou oculta animação de digitação (...)
   */
  mostrarDigitando(visivel = true) {
    if (this.digitandoEl) {
      if (visivel) {
        this.digitandoEl.classList.remove('hidden');
        this.rolarParaFinal();
      } else {
        this.digitandoEl.classList.add('hidden');
      }
    }
  }

  /**
   * Limpa todas as mensagens da tela.
   */
  limparMensagens() {
    this.container.innerHTML = '';
  }

  /**
   * Faz scroll suave para a última mensagem.
   */
  rolarParaFinal() {
    setTimeout(() => {
      this.container.scrollTop = this.container.scrollHeight;
    }, 40);
  }
}
