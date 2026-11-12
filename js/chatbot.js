/**
 * Marmitaê - Gerenciador da Interface do Chatbot
 * Renderiza mensagens, balões, horários, indicador de digitação e botões de atalho.
 */

import { formatarTextoMensagem, getHoraAtual, escaparHTML } from './utils.js';

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
   * Adiciona mensagem do agente (bot) com badge opcional indicando modo.
   * @param {string} texto 
   * @param {string} modoUsado 'llm', 'demo', 'guardrails' ou 'fallback'
   */
  adicionarMensagemBot(texto, modoUsado = 'demo') {
    const el = document.createElement('div');
    el.className = 'mensagem mensagem-bot';

    let badgeHtml = '';
    if (modoUsado === 'llm') {
      badgeHtml = '<span class="badge-modo badge-ia" title="Resposta gerada por IA (Google Gemini)"><i class="fa-solid fa-sparkles"></i> IA Gemini</span>';
    } else if (modoUsado === 'demo') {
      badgeHtml = '<span class="badge-modo badge-demo" title="Resposta determinística de demonstração"><i class="fa-solid fa-cube"></i> Modo Demo</span>';
    } else if (modoUsado === 'guardrails') {
      badgeHtml = '<span class="badge-modo badge-guardrail" title="Filtro de segurança e proteção"><i class="fa-solid fa-shield-halved"></i> Guardrail</span>';
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
   * Faz scroll automático suave para a última mensagem.
   */
  rolarParaFinal() {
    setTimeout(() => {
      this.container.scrollTop = this.container.scrollHeight;
    }, 50);
  }
}
