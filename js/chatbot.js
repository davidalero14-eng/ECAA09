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
    el.className = 'mensagem mensagem-usuario';
    el.innerHTML = `
      <div class="mensagem-conteudo">
        <p>${escaparHTML(texto)}</p>
        <span class="mensagem-hora">${getHoraAtual()}</span>
      </div>
    `;
    this.container.appendChild(el);
    this.rolarParaFinal();
  }

  /**
   * Adiciona mensagem do agente (bot) com badge indicando o modo de processamento.
   * Suporta renderização opcional de cards visuais de produtos.
   * @param {string} texto 
   * @param {string} modoUsado 'llm', 'demo', 'guardrails' ou 'fallback'
   * @param {Array<object>} cardsProdutos Lista opcional de produtos para exibir cards visuais
   */
  adicionarMensagemBot(texto, modoUsado = 'demo', cardsProdutos = null) {
    const el = document.createElement('div');
    el.className = 'mensagem mensagem-bot';

    let badgeHtml = '';
    if (modoUsado === 'llm') {
      badgeHtml = '<span class="badge-modo badge-ia" title="Processado por IA (Google Gemini)"><i class="fa-solid fa-sparkles"></i> IA Gemini</span>';
    } else if (modoUsado === 'demo' || modoUsado === 'sem_llm') {
      badgeHtml = '<span class="badge-modo badge-demo" title="Processado 100% Client-Side por Regras + NLP + TF-IDF + Cosseno"><i class="fa-solid fa-cube"></i> IA Local (Sem LLM)</span>';
    } else if (modoUsado === 'guardrails') {
      badgeHtml = '<span class="badge-modo badge-guardrail" title="Filtro Ativo de Segurança e Integridade"><i class="fa-solid fa-shield-halved"></i> Guardrail Ativo</span>';
    } else if (modoUsado === 'fallback') {
      badgeHtml = '<span class="badge-modo badge-fallback" title="Fallback gracioso local acionado"><i class="fa-solid fa-arrows-rotate"></i> Fallback</span>';
    }

    let cardsHtml = '';
    if (cardsProdutos && Array.isArray(cardsProdutos) && cardsProdutos.length > 0) {
      cardsHtml = `
        <div class="cards-produtos-container">
          ${cardsProdutos.map(prod => `
            <div class="card-produto-chat" data-id="${prod.id}">
              <div class="card-produto-header">
                <span class="card-produto-tag">${prod.categoria.toUpperCase()}</span>
                <span class="card-produto-preco">${formatarMoeda(prod.preco)}</span>
              </div>
              <div class="card-produto-nome">${escaparHTML(prod.nome)}</div>
              <div class="card-produto-desc">${escaparHTML(prod.descricao)}</div>
              <button type="button" class="btn-card-pedir" data-id="${prod.id}">
                <i class="fa-solid fa-plus"></i> Pedir este
              </button>
            </div>
          `).join('')}
        </div>
      `;
    }

    el.innerHTML = `
      <div class="mensagem-avatar">
        <div class="avatar-circulo">🍲</div>
      </div>
      <div class="mensagem-conteudo">
        <div class="mensagem-cabecalho">
          <span class="mensagem-autor">Marmitaê</span>
          ${badgeHtml}
        </div>
        <div class="mensagem-texto">${formatarTextoMensagem(texto)}</div>
        ${cardsHtml}
        <span class="mensagem-hora">${getHoraAtual()}</span>
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
        this.digitandoEl.classList.remove('oculto');
        this.rolarParaFinal();
      } else {
        this.digitandoEl.classList.add('oculto');
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
