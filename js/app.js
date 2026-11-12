/**
 * Marmitaê - Aplicação Principal e Inicialização do Sistema
 * Conecta UI, Carrinho, Checkout, Agente LLM, Eventos do DOM e Responsividade.
 */

import { Carrinho } from './cart.js';
import { CheckoutManager } from './checkout.js';
import { AgentManager } from './agent.js';
import { ChatbotUI } from './chatbot.js';
import { formatarMoeda, escaparHTML } from './utils.js';

class MarmitaeApp {
  constructor() {
    this.carrinho = new Carrinho();
    this.checkout = new CheckoutManager(this.carrinho);
    this.agent = new AgentManager(this.carrinho, this.checkout);
    this.chatUI = new ChatbotUI('chat-messages', 'chat-digitando');

    this.initDOM();
    this.initEvents();
    this.atualizarStatusModoUI();
    this.carrinho.setOnChange(() => this.renderizarCarrinho());
    this.renderizarCarrinho();
    this.enviarBoasVindas();
  }

  initDOM() {
    // Elementos do Chat
    this.chatForm = document.getElementById('chat-form');
    this.chatInput = document.getElementById('chat-input');
    this.btnLimparChat = document.getElementById('btn-limpar-chat');
    this.quickSuggestions = document.getElementById('quick-suggestions');

    // Elementos do Carrinho
    this.cartItemsList = document.getElementById('cart-items-list');
    this.cartSubtotal = document.getElementById('cart-subtotal');
    this.cartTaxaEntrega = document.getElementById('cart-taxa-entrega');
    this.cartLabelEntrega = document.getElementById('cart-label-entrega');
    this.cartTotal = document.getElementById('cart-total');
    this.badgeQtdCarrinho = document.getElementById('badge-qtd-carrinho');
    this.btnFinalizarPedido = document.getElementById('btn-finalizar-pedido');
    this.sidePanel = document.getElementById('side-panel-carrinho');
    this.cartBackdrop = document.getElementById('cart-backdrop');
    this.btnToggleCarrinho = document.getElementById('btn-toggle-carrinho');
    this.btnFecharCarrinhoMobile = document.getElementById('btn-fechar-carrinho-mobile');

    // Elementos do Modal de Configuração
    this.btnStatusModo = document.getElementById('btn-status-modo');
    this.btnAbrirConfig = document.getElementById('btn-abrir-config');
    this.modalConfig = document.getElementById('modal-config');
    this.btnFecharModal = document.getElementById('btn-fechar-modal-config');
    this.btnCancelarModal = document.getElementById('btn-cancelar-modal');
    this.btnSalvarChave = document.getElementById('btn-salvar-chave');
    this.btnLimparChave = document.getElementById('btn-limpar-chave');
    this.inputApiKey = document.getElementById('input-api-key');
    this.radioDemo = document.getElementById('radio-demo');
    this.radioLLM = document.getElementById('radio-llm');
    this.textoModo = document.getElementById('texto-modo');
    this.iconeModo = document.getElementById('icone-modo');
  }

  initEvents() {
    // Envio de mensagem pelo formulário
    this.chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.enviarMensagemUsuario();
    });

    // Clique em chips de sugestões rápidas
    this.quickSuggestions.addEventListener('click', (e) => {
      const btn = e.target.closest('.chip-btn');
      if (btn && btn.dataset.msg) {
        this.chatInput.value = btn.dataset.msg;
        this.enviarMensagemUsuario();
      }
    });

    // Botão Limpar Chat / Reiniciar Atendimento
    this.btnLimparChat.addEventListener('click', () => {
      if (confirm('Deseja realmente reiniciar o atendimento e limpar o carrinho?')) {
        this.reiniciarAtendimento();
      }
    });

    // Botão "Fechar Pedido no Chat" no rodapé do carrinho
    this.btnFinalizarPedido.addEventListener('click', () => {
      this.chatInput.value = 'Quero fechar meu pedido';
      this.enviarMensagemUsuario();
      if (window.innerWidth <= 992) {
        this.fecharCarrinhoMobile();
      }
    });

    // Responsividade Drawer Carrinho
    this.btnToggleCarrinho.addEventListener('click', () => this.abrirCarrinhoMobile());
    this.btnFecharCarrinhoMobile.addEventListener('click', () => this.fecharCarrinhoMobile());
    this.cartBackdrop.addEventListener('click', () => this.fecharCarrinhoMobile());

    // Configuração de API e Modos
    this.btnStatusModo.addEventListener('click', () => this.abrirModalConfig());
    this.btnAbrirConfig.addEventListener('click', () => this.abrirModalConfig());
    this.btnFecharModal.addEventListener('click', () => this.fecharModalConfig());
    this.btnCancelarModal.addEventListener('click', () => this.fecharModalConfig());
    this.btnSalvarChave.addEventListener('click', () => this.salvarConfiguracaoApi());
    this.btnLimparChave.addEventListener('click', () => this.limparConfiguracaoApi());

    // Ações dentro da lista do carrinho (Delegação de eventos para quantidade e remover)
    this.cartItemsList.addEventListener('click', (e) => {
      const btnRemover = e.target.closest('.btn-remove-item');
      if (btnRemover) {
        const idItem = btnRemover.dataset.id;
        this.carrinho.removerItem(idItem);
        return;
      }

      const btnMenos = e.target.closest('.btn-diminuir');
      if (btnMenos) {
        const idItem = btnMenos.dataset.id;
        this.carrinho.incrementarQuantidade(idItem, -1);
        return;
      }

      const btnMais = e.target.closest('.btn-aumentar');
      if (btnMais) {
        const idItem = btnMais.dataset.id;
        this.carrinho.incrementarQuantidade(idItem, 1);
        return;
      }
    });
  }

  async enviarMensagemUsuario() {
    const texto = this.chatInput.value.trim();
    if (!texto) return;

    this.chatInput.value = '';
    this.chatUI.adicionarMensagemUsuario(texto);
    this.chatUI.mostrarDigitando(true);

    try {
      const resultado = await this.agent.processarMensagem(texto);
      this.chatUI.mostrarDigitando(false);
      this.chatUI.adicionarMensagemBot(resultado.resposta, resultado.modoUsado);
    } catch (err) {
      this.chatUI.mostrarDigitando(false);
      this.chatUI.adicionarMensagemBot(`Tive uma instabilidade momentânea: ${err.message}. Mas pode falar comigo que continuaremos!`, 'fallback');
    }
  }

  enviarBoasVindas() {
    const mensagemInicial = `Olá! 👋 Seja bem-vindo ao **Marmitaê**!\n\nSou seu assistente virtual e estou aqui para ajudar com seu pedido.\n\nVocê pode consultar nosso cardápio, escolher suas marmitas, personalizar os ingredientes e finalizar sua compra por aqui.\n\nO que vamos pedir hoje? 😄`;
    this.chatUI.adicionarMensagemBot(mensagemInicial, this.agent.getModo());
  }

  reiniciarAtendimento() {
    this.chatUI.limparMensagens();
    this.carrinho.limpar();
    this.checkout.reset();
    this.agent.limparHistorico();
    this.enviarBoasVindas();
  }

  renderizarCarrinho() {
    const estado = this.carrinho.obterEstado();
    this.badgeQtdCarrinho.textContent = estado.quantidadeTotalItens;
    this.cartSubtotal.textContent = formatarMoeda(estado.subtotal);
    this.cartTotal.textContent = formatarMoeda(estado.total);

    if (estado.tipoEntrega === 'retirada') {
      this.cartLabelEntrega.textContent = 'Retirada no balcão';
      this.cartTaxaEntrega.textContent = 'Grátis (R$ 0,00)';
    } else {
      this.cartLabelEntrega.textContent = 'Taxa de entrega';
      this.cartTaxaEntrega.textContent = formatarMoeda(estado.taxaEntrega);
    }

    if (estado.vazio) {
      this.cartItemsList.innerHTML = `
        <div class="cart-empty">
          <div class="cart-empty-icon">🛍️</div>
          <p>Seu carrinho está vazio.</p>
          <small>Peça marmitas ou bebidas no chat para adicionar itens automaticamente!</small>
        </div>
      `;
      this.btnFinalizarPedido.disabled = true;
      this.btnFinalizarPedido.style.opacity = '0.5';
      this.btnFinalizarPedido.style.cursor = 'not-allowed';
      return;
    }

    this.btnFinalizarPedido.disabled = false;
    this.btnFinalizarPedido.style.opacity = '1';
    this.btnFinalizarPedido.style.cursor = 'pointer';

    this.cartItemsList.innerHTML = estado.itens.map(item => `
      <div class="cart-item" data-id="${item.idItem}">
        <div class="cart-item-top">
          <div class="cart-item-name">${escaparHTML(item.nome)}</div>
          <div class="cart-item-price">${formatarMoeda(item.subtotal)}</div>
        </div>

        ${item.personalizacoes && item.personalizacoes.length > 0 ? `
          <div class="cart-item-customizations">
            <i class="fa-solid fa-pen-to-square"></i> ${escaparHTML(item.personalizacoes.join(', '))}
          </div>
        ` : ''}

        ${item.observacoes ? `
          <div class="cart-item-customizations">
            <i class="fa-solid fa-note-sticky"></i> ${escaparHTML(item.observacoes)}
          </div>
        ` : ''}

        <div class="cart-item-bottom">
          <div class="cart-qty-control">
            <button class="btn-qty btn-diminuir" data-id="${item.idItem}" title="Diminuir quantidade">-</button>
            <span class="qty-number">${item.quantidade}</span>
            <button class="btn-qty btn-aumentar" data-id="${item.idItem}" title="Aumentar quantidade">+</button>
          </div>
          <button class="btn-remove-item" data-id="${item.idItem}">
            <i class="fa-solid fa-trash-can"></i> Remover
          </button>
        </div>
      </div>
    `).join('');
  }

  abrirCarrinhoMobile() {
    this.sidePanel.classList.add('aberto');
    this.cartBackdrop.classList.add('visivel');
  }

  fecharCarrinhoMobile() {
    this.sidePanel.classList.remove('aberto');
    this.cartBackdrop.classList.remove('visivel');
  }

  abrirModalConfig() {
    this.inputApiKey.value = this.agent.gemini.getApiKey();
    if (this.agent.getModo() === 'llm') {
      this.radioLLM.checked = true;
    } else {
      this.radioDemo.checked = true;
    }
    this.modalConfig.classList.remove('oculto');
  }

  fecharModalConfig() {
    this.modalConfig.classList.add('oculto');
  }

  salvarConfiguracaoApi() {
    const key = this.inputApiKey.value.trim();
    const modoEscolhido = document.querySelector('input[name="modo_operacao"]:checked').value;

    if (modoEscolhido === 'llm' && !key) {
      alert('Para ativar o Modo IA Gemini, por favor insira sua chave de API.');
      return;
    }

    if (key) {
      this.agent.gemini.setApiKey(key);
    }

    try {
      this.agent.setModo(modoEscolhido);
    } catch (err) {
      alert(err.message);
      return;
    }

    this.atualizarStatusModoUI();
    this.fecharModalConfig();
  }

  limparConfiguracaoApi() {
    this.agent.gemini.limparApiKey();
    this.inputApiKey.value = '';
    this.radioDemo.checked = true;
    this.agent.setModo('demo');
    this.atualizarStatusModoUI();
    this.fecharModalConfig();
  }

  atualizarStatusModoUI() {
    const modo = this.agent.getModo();
    if (modo === 'llm') {
      this.textoModo.textContent = 'IA Gemini';
      this.iconeModo.className = 'fa-solid fa-sparkles';
      this.iconeModo.style.color = '#7c3aed';
    } else {
      this.textoModo.textContent = 'Modo Demo';
      this.iconeModo.className = 'fa-solid fa-cube';
      this.iconeModo.style.color = 'var(--primary)';
    }
  }
}

// Inicializa a aplicação ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
  window.app = new MarmitaeApp();
});
