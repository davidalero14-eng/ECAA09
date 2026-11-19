/**
 * Marmitaê - Aplicação Principal e Inicialização do Sistema
 * Conecta UI, Carrinho, Checkout, Agente LLM, Eventos do DOM, Som, Síntese de Voz,
 * Catálogo Interativo, Rastreador de Pedidos e Simulador de Dia da Semana.
 */

import { Carrinho } from './cart.js';
import { CheckoutManager } from './checkout.js';
import { AgentManager } from './agent.js';
import { ChatbotUI } from './chatbot.js';
import { formatarMoeda, escaparHTML } from './utils.js';
import { somService } from './sound.js';
import { CARDAPIO, buscarProdutoPorId, setDiaSimulado, getDiaAtual, DIAS_SEMANA_NOMES, inicializarMenu, consultarCardapio } from './menu.js';

class MarmitaeApp {
  constructor() {
    this.carrinho = new Carrinho();
    this.checkout = new CheckoutManager(this.carrinho);
    this.agent = new AgentManager(this.carrinho, this.checkout);
    this.chatUI = new ChatbotUI('chat-messages', 'chat-digitando');

    this.etapaTrackerAtual = 1;
    this.ultimoPedidoFinalizado = null;

    this.initDOM();
    this.initEvents();
    this.atualizarStatusModoUI();
    this.atualizarBotaoSomUI();
    this.atualizarBotaoVozUI();
    this.carrinho.setOnChange(() => this.renderizarCarrinho());
    this.renderizarCarrinho();
    this.enviarBoasVindas();
  }

  async initApp() {
    await inicializarMenu();
    await this.agent.inicializar();
  }

initDOM() {
    // Elementos do Chat
    this.chatForm = document.getElementById('chat-form');
    this.chatInput = document.getElementById('chat-input');
    this.btnLimparChat = document.getElementById('btn-limpar-chat');
    this.quickSuggestions = document.getElementById('quick-suggestions');
    this.chatMessagesContainer = document.getElementById('chat-messages');

    // Botões de Áudio e Voz
    this.btnToggleSom = document.getElementById('btn-toggle-som');
    this.iconeSom = document.getElementById('icone-som');
    this.btnToggleVoz = document.getElementById('btn-toggle-voz');
    this.iconeVoz = document.getElementById('icone-voz');

    // Simulador de Dia da Semana
    this.selectDiaSimulado = document.getElementById('select-dia-simulado');

    // Botão Catálogo de Cardápio
    this.btnVerCardapioModal = document.getElementById('btn-ver-cardapio-modal');

    // Hero Section
    this.btnHeroComecar = document.getElementById('btn-hero-comecar');
    this.destaqueDiaNome = document.getElementById('destaque-dia-nome');
    this.destaqueGrid = document.getElementById('destaque-grid');
    this.btnDiaAnterior = document.getElementById('btn-dia-anterior');
    this.btnDiaProximo = document.getElementById('btn-dia-proximo');

    // Elementos do Carrinho
    this.cartItemsList = document.getElementById('cart-items-list');
    this.cartSubtotal = document.getElementById('cart-subtotal');
    this.cartRowDesconto = document.getElementById('cart-row-desconto');
    this.cartDesconto = document.getElementById('cart-desconto');
    this.cartTaxaEntrega = document.getElementById('cart-taxa-entrega');
    this.cartLabelEntrega = document.getElementById('cart-label-entrega');
    this.cartTotal = document.getElementById('cart-total');
    this.badgeQtdCarrinho = document.getElementById('badge-qtd-carrinho');
    this.btnFinalizarPedido = document.getElementById('btn-finalizar-pedido');
    this.sidePanel = document.getElementById('side-panel-carrinho');
    this.cartBackdrop = document.getElementById('cart-backdrop');
    this.btnToggleCarrinho = document.getElementById('btn-toggle-carrinho');
    this.btnFecharCarrinhoMobile = document.getElementById('btn-fechar-carrinho-mobile');

    // Cupons no Carrinho
    this.inputCupom = document.getElementById('input-cupom');
    this.btnAplicarCupom = document.getElementById('btn-aplicar-cupom');
    this.couponInputGroup = document.getElementById('coupon-input-group');
    this.couponAppliedGroup = document.getElementById('coupon-applied-group');
    this.couponAppliedText = document.getElementById('coupon-applied-text');
    this.btnRemoverCupom = document.getElementById('btn-remover-cupom');

    // Indicador de Modo (apenas visual - modo determinístico fixo)
    this.textoModo = document.getElementById('texto-modo');
    this.iconeModo = document.getElementById('icone-modo');

    // Modal de Cardápio Completo
    this.modalCardapio = document.getElementById('modal-cardapio');
    this.btnFecharModalCardapio = document.getElementById('btn-fechar-modal-cardapio');
    this.btnFecharModalCardapioRodape = document.getElementById('btn-fechar-modal-cardapio-rodape');
    this.modalMenuGrid = document.getElementById('modal-menu-grid');
    this.inputBuscaCardapio = document.getElementById('input-busca-cardapio');
    this.menuTabBtns = document.querySelectorAll('.menu-tab');

    // Modal de Rastreador de Pedido
    this.modalTracker = document.getElementById('modal-tracker');
    this.btnFecharModalTracker = document.getElementById('btn-fechar-modal-tracker');
    this.btnFecharModalTrackerRodape = document.getElementById('btn-fechar-modal-tracker-rodape');
    this.btnAvancarEtapaTracker = document.getElementById('btn-avancar-etapa-tracker');
    this.trackerNumeroPedido = document.getElementById('tracker-numero-pedido');
    this.trackerClienteInfo = document.getElementById('tracker-cliente-info');
    this.trackerStatusMensagem = document.getElementById('tracker-status-mensagem');
    this.trackerProgressLine = document.getElementById('tracker-progress-line');

    // Modal de Diagnóstico NLP
    this.modalDiagnostico = document.getElementById('modal-diagnostico');
    this.btnDiagnosticoNLP = document.getElementById('btn-diagnostico-nlp');
    this.btnFecharModalDiagnostico = document.getElementById('btn-fechar-modal-diagnostico');
    this.btnFecharModalDiagnosticoRodape = document.getElementById('btn-fechar-modal-diagnostico-rodape');
    
    // Elementos do Diagnóstico
    this.diagMensagemOriginal = document.getElementById('diag-mensagem-original');
    this.diagMensagemNormalizada = document.getElementById('diag-mensagem-normalizada');
    this.diagTokens = document.getElementById('diag-tokens');
    this.diagStopwords = document.getElementById('diag-stopwords');
    this.diagRadicais = document.getElementById('diag-radicais');
    this.diagBow = document.getElementById('diag-bow');
    this.diagTfidf = document.getElementById('diag-tfidf');
    this.diagIntencao = document.getElementById('diag-intencao');
    this.diagCosseno = document.getElementById('diag-cosseno');
    this.diagLimiar = document.getElementById('diag-limiar');
    this.diagMetodo = document.getElementById('diag-metodo');

    // Elementos do Diagnóstico ELIZA
    this.diagElizaKeyword = document.getElementById('diag-eliza-keyword');
    this.diagElizaPrioridade = document.getElementById('diag-eliza-prioridade');
    this.diagElizaPadrao = document.getElementById('diag-eliza-padrao');
    this.diagElizaGrupos = document.getElementById('diag-eliza-grupos');
    this.diagElizaReflexoes = document.getElementById('diag-eliza-reflexoes');
    this.diagElizaRemontagem = document.getElementById('diag-eliza-remontagem');
    this.diagElizaResposta = document.getElementById('diag-eliza-resposta');

    // Navegação de Dias (Hero Section)
    this.btnDiaAnterior = document.getElementById('btn-dia-anterior');
    this.btnDiaProximo = document.getElementById('btn-dia-proximo');
    this.destaqueDiaNome = document.getElementById('destaque-dia-nome');
    this.destaqueGrid = document.getElementById('destaque-grid');

    // Container de Toasts
    this.toastContainer = document.getElementById('toast-container');
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

    // Clique no botão "Pedir este" dos Cards de Produtos do Chat
    this.chatMessagesContainer.addEventListener('click', (e) => {
      const btnPedir = e.target.closest('.btn-card-pedir');
      if (btnPedir && btnPedir.dataset.id) {
        const prodId = btnPedir.dataset.id;
        const prod = buscarProdutoPorId(prodId);
        if (prod) {
          this.chatInput.value = `Quero pedir 1 ${prod.nome}`;
          this.enviarMensagemUsuario();
          somService.tocarAdicionarItem();
        }
      }
    });

    // Alternar Som de Notificação
    this.btnToggleSom.addEventListener('click', () => {
      somService.toggleSom();
      this.atualizarBotaoSomUI();
      if (somService.isSomHabilitado()) {
        somService.tocarMensagemRecebida();
        this.mostrarToast('Efeitos sonoros ativados!', 'info');
      } else {
        this.mostrarToast('Efeitos sonoros desativados.', 'info');
      }
    });

    // Alternar Leitura de Voz (Text-to-Speech)
    this.btnToggleVoz.addEventListener('click', () => {
      somService.toggleVoz();
      this.atualizarBotaoVozUI();
      if (somService.isVozHabilitada()) {
        somService.falarTexto('Leitura em voz alta ativada no Marmitaê!');
        this.mostrarToast('Voz ativada! O bot lerá as respostas em voz alta.', 'success');
      } else {
        this.mostrarToast('Leitura em voz alta desativada.', 'info');
      }
    });

    // Simulador de Dia da Semana
    this.selectDiaSimulado.addEventListener('change', () => {
      const val = this.selectDiaSimulado.value;
      setDiaSimulado(val);
      const diaAtivo = getDiaAtual();
      const nomeDia = DIAS_SEMANA_NOMES[diaAtivo];
      this.mostrarToast(`Dia simulado alterado para: ${nomeDia}`, 'info');
      this.chatUI.adicionarMensagemBot(`📅 O dia da semana foi ajustado para **${nomeDia}**. As disponibilidades dos pratos foram atualizadas!`, 'demo');
      this.atualizarDestaqueDia();
    });

    // Hero Section - Botão "Começar meu pedido"
    this.btnHeroComecar.addEventListener('click', () => {
      this.chatInput.focus();
      this.chatInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      this.mostrarToast('Digite seu pedido ou use as sugestões rápidas!', 'info');
    });

    // Navegação de Dias (Hero Section)
    this.btnDiaAnterior.addEventListener('click', () => this.navegarDia(-1));
    this.btnDiaProximo.addEventListener('click', () => this.navegarDia(1));

    // Modal de Cardápio Completo
    this.btnVerCardapioModal.addEventListener('click', () => this.abrirModalCardapio());
    this.btnFecharModalCardapio.addEventListener('click', () => this.fecharModalCardapio());
    this.btnFecharModalCardapioRodape.addEventListener('click', () => this.fecharModalCardapio());
    
    // Filtros de Categoria no Modal do Cardápio
    this.menuTabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.menuTabBtns.forEach(b => b.classList.remove('ativo'));
        btn.classList.add('ativo');
        this.renderizarGradeCardapioModal();
      });
    });

    // Campo de Busca no Modal do Cardápio
    this.inputBuscaCardapio.addEventListener('input', () => this.renderizarGradeCardapioModal());

    // Botão Limpar Chat / Reiniciar Atendimento
    this.btnLimparChat.addEventListener('click', () => {
      if (confirm('Deseja realmente reiniciar o atendimento e limpar o carrinho?')) {
        this.reiniciarAtendimento();
        this.mostrarToast('Atendimento reiniciado com sucesso.', 'info');
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

    // Aplicação e Remoção de Cupom no Carrinho
    this.btnAplicarCupom.addEventListener('click', () => this.processarAplicacaoCupom());
    this.inputCupom.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.processarAplicacaoCupom();
      }
    });
    this.btnRemoverCupom.addEventListener('click', () => {
      this.carrinho.removerCupom();
      this.mostrarToast('Cupom removido.', 'info');
    });

    // Responsividade Drawer Carrinho
    this.btnToggleCarrinho.addEventListener('click', () => this.abrirCarrinhoMobile());
    this.btnFecharCarrinhoMobile.addEventListener('click', () => this.fecharCarrinhoMobile());
    this.cartBackdrop.addEventListener('click', () => this.fecharCarrinhoMobile());

    // Modal de Rastreador de Pedidos
    this.btnFecharModalTracker.addEventListener('click', () => this.fecharModalTracker());
    this.btnFecharModalTrackerRodape.addEventListener('click', () => this.fecharModalTracker());
    this.btnAvancarEtapaTracker.addEventListener('click', () => this.avancarEtapaTracker());

    // Modal de Diagnóstico NLP
    this.btnDiagnosticoNLP.addEventListener('click', () => this.abrirModalDiagnostico());
    this.btnFecharModalDiagnostico.addEventListener('click', () => this.fecharModalDiagnostico());
    this.btnFecharModalDiagnosticoRodape.addEventListener('click', () => this.fecharModalDiagnostico());

    // Ações dentro da lista do carrinho (Delegação de eventos)
    this.cartItemsList.addEventListener('click', (e) => {
      const btnRemover = e.target.closest('.btn-remove-item');
      if (btnRemover) {
        const idItem = btnRemover.dataset.id;
        this.carrinho.removerItem(idItem);
        this.mostrarToast('Item removido do pedido.', 'info');
        return;
      }

      const btnQtd = e.target.closest('.btn-qty');
      if (btnQtd) {
        const idItem = btnQtd.dataset.id;
        const action = btnQtd.dataset.action;
        if (action === 'decrease') {
          this.carrinho.incrementarQuantidade(idItem, -1);
        } else if (action === 'increase') {
          this.carrinho.incrementarQuantidade(idItem, 1);
          somService.tocarAdicionarItem();
        }
        return;
      }
    });
  }

  mostrarToast(mensagem, tipo = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${tipo}`;
    toast.innerHTML = `<i class="fa-solid fa-circle-info"></i> <span>${escaparHTML(mensagem)}</span>`;
    this.toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  processarAplicacaoCupom() {
    const codigo = this.inputCupom.value.trim();
    if (!codigo) return;
    const res = this.carrinho.aplicarCupom(codigo);
    if (res.sucesso) {
      this.mostrarToast(`Cupom ${res.cupom.codigo} aplicado com sucesso!`, 'success');
      this.inputCupom.value = '';
      somService.tocarAdicionarItem();
    } else {
      this.mostrarToast(res.erro, 'warn');
    }
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
      this.chatUI.adicionarMensagemBot(resultado.resposta, resultado.modoUsado, resultado.cards);
      
      somService.tocarMensagemRecebida();
      somService.falarTexto(resultado.resposta);

      // Verifica se houve pedido finalizado para acionar rastreador
      const acaoFinalizacao = resultado.acoesExecutadas.find(a => a.tipo === 'pedido_finalizado');
      if (acaoFinalizacao && acaoFinalizacao.dados) {
        this.ultimoPedidoFinalizado = acaoFinalizacao.dados;
        somService.tocarSucessoPedido();
        setTimeout(() => this.abrirModalTracker(this.ultimoPedidoFinalizado), 1200);
      }
    } catch (err) {
      this.chatUI.mostrarDigitando(false);
      this.chatUI.adicionarMensagemBot(`Tive uma instabilidade momentânea: ${err.message}. Mas pode falar comigo que continuaremos!`, 'fallback');
      somService.tocarMensagemRecebida();
    }
  }

  enviarBoasVindas() {
    const diaAtual = DIAS_SEMANA_NOMES[getDiaAtual()];
    const mensagemInicial = `Olá! 👋 Seja muito bem-vindo ao **Marmitaê**!\n\nHoje é **${diaAtual}** e temos marmitas frescas e saborosas preparadas no capricho.\n\nVocê pode pedir suas marmitas, personalizar ingredientes, conferir os cupons do dia ou fechar sua compra diretamente por aqui.\n\nO que vamos pedir hoje? 😄`;
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

    // Linha de Desconto de Cupom
    if (estado.cupom && estado.desconto > 0) {
      this.cartRowDesconto.classList.remove('hidden');
      this.cartDesconto.textContent = `- ${formatarMoeda(estado.desconto)}`;
      this.couponInputGroup.classList.add('hidden');
      this.couponAppliedGroup.classList.remove('hidden');
      this.couponAppliedText.textContent = `Cupom: ${estado.cupom.codigo} (-${formatarMoeda(estado.desconto)})`;
    } else if (estado.cupom && estado.cupom.tipo === 'frete_gratis') {
      this.cartRowDesconto.classList.remove('hidden');
      this.cartDesconto.textContent = `Frete Grátis aplicado!`;
      this.couponInputGroup.classList.add('hidden');
      this.couponAppliedGroup.classList.remove('hidden');
      this.couponAppliedText.textContent = `Cupom: FRETEGRATIS`;
    } else {
      this.cartRowDesconto.classList.add('hidden');
      this.couponInputGroup.classList.remove('hidden');
      this.couponAppliedGroup.classList.add('hidden');
    }

    if (estado.tipoEntrega === 'retirada' || (estado.cupom && estado.cupom.tipo === 'frete_gratis')) {
      this.cartLabelEntrega.textContent = estado.tipoEntrega === 'retirada' ? 'Retirada no balcão' : 'Taxa de entrega (Cupom)';
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
          <div class="cart-item-custom">
            <i class="fa-solid fa-pen-to-square"></i> ${escaparHTML(item.personalizacoes.join(', '))}
          </div>
        ` : ''}
  
        ${item.observacoes ? `
          <div class="cart-item-custom">
            <i class="fa-solid fa-note-sticky"></i> ${escaparHTML(item.observacoes)}
          </div>
        ` : ''}
  
        <div class="cart-item-controls">
          <div class="cart-qty">
            <button class="btn-qty" data-id="${item.idItem}" data-action="decrease" title="Diminuir quantidade" aria-label="Diminuir quantidade">-</button>
            <span class="qty-value">${item.quantidade}</span>
            <button class="btn-qty" data-id="${item.idItem}" data-action="increase" title="Aumentar quantidade" aria-label="Aumentar quantidade">+</button>
          </div>
          <button class="btn-remove-item" data-id="${item.idItem}" title="Remover item" aria-label="Remover item">
            <i class="fa-solid fa-trash" aria-hidden="true"></i>
          </button>
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

  // --- MODAL DE CONFIGURAÇÃO DA API ---
  atualizarStatusModoUI() {
    // Modo exclusivamente determinístico (sem LLM)
    this.textoModo.textContent = 'NLP Clássico';
    this.iconeModo.className = 'fa-solid fa-cube';
    this.iconeModo.style.color = 'var(--primary)';
  }

  atualizarBotaoSomUI() {
    const hab = somService.isSomHabilitado();
    if (hab) {
      this.iconeSom.className = 'fa-solid fa-volume-high';
      this.btnToggleSom.title = 'Som ativado (clique para silenciar)';
      this.btnToggleSom.classList.remove('som-desativado');
    } else {
      this.iconeSom.className = 'fa-solid fa-volume-xmark';
      this.btnToggleSom.title = 'Som silenciado (clique para ativar)';
      this.btnToggleSom.classList.add('som-desativado');
    }
  }

  atualizarBotaoVozUI() {
    const voz = somService.isVozHabilitada();
    if (voz) {
      this.btnToggleVoz.classList.add('ativo');
      this.btnToggleVoz.title = 'Voz do Bot ativada (clique para desativar)';
      this.iconeVoz.className = 'fa-solid fa-volume-high';
    } else {
      this.btnToggleVoz.classList.remove('ativo');
      this.btnToggleVoz.title = 'Voz do Bot desativada (clique para ativar Text-to-Speech)';
      this.iconeVoz.className = 'fa-solid fa-comment-dots';
    }
  }

  // --- MODAL CARDÁPIO COMPLETO ---
  abrirModalCardapio() {
    this.renderizarGradeCardapioModal();
    this.modalCardapio.classList.remove('hidden');
  }

  fecharModalCardapio() {
    this.modalCardapio.classList.add('hidden');
  }

  renderizarGradeCardapioModal() {
    const categoriaAtiva = document.querySelector('.menu-tab.active').dataset.categoria;
    const busca = this.inputBuscaCardapio.value.toLowerCase().trim();
    const diaAtual = getDiaAtual();

    const filtrados = CARDAPIO.filter(item => {
      const bateCat = categoriaAtiva === 'todos' || item.categoria === categoriaAtiva;
      const bateBusca = !busca || item.nome.toLowerCase().includes(busca) || item.descricao.toLowerCase().includes(busca);
      return bateCat && bateBusca;
    });

    if (filtrados.length === 0) {
      this.modalMenuGrid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: var(--text-muted);">
          Nenhum produto encontrado com os filtros selecionados.
        </div>
      `;
      return;
    }

    this.modalMenuGrid.innerHTML = filtrados.map(prod => {
      const disponivelHoje = prod.disponibilidade && prod.diasDisponiveis.includes(diaAtual);
      return `
        <div class="menu-item-card ${disponivelHoje ? '' : 'indisponivel'}">
          <div class="menu-item-card-top">
            <span class="menu-badge-dia ${disponivelHoje ? 'disponivel' : 'indisponivel'}">
              ${disponivelHoje ? 'Disponível Hoje' : 'Outros dias'}
            </span>
            <span class="card-produto-preco">${formatarMoeda(prod.preco)}</span>
          </div>
          <div class="card-produto-nome">${escaparHTML(prod.nome)}</div>
          <div class="card-produto-desc">${escaparHTML(prod.descricao)}</div>
          <button type="button" class="btn-card-pedir" onclick="window.app.pedirPeloCardapio('${prod.id}')">
            <i class="fa-solid fa-plus"></i> Pedir
          </button>
        </div>
      `;
    }).join('');
  }

  pedirPeloCardapio(produtoId) {
    const prod = buscarProdutoPorId(produtoId);
    if (!prod) return;
    this.fecharModalCardapio();
    this.chatInput.value = `Quero pedir 1 ${prod.nome}`;
    this.enviarMensagemUsuario();
    somService.tocarAdicionarItem();
  }

  // --- MODAL RASTREADOR DE PEDIDO AO VIVO ---
  abrirModalTracker(dadosPedido = null) {
    const p = dadosPedido || this.ultimoPedidoFinalizado;
    if (!p) return;

    this.trackerNumeroPedido.textContent = p.numeroPedido || '#MAR-1001';
    this.trackerClienteInfo.textContent = `Cliente: ${p.clienteNome || 'Cliente'} • Total: ${formatarMoeda(p.total)}`;
    this.etapaTrackerAtual = 1;
    this.atualizarEtapaTrackerVisual(1);
    this.modalTracker.classList.remove('hidden');
  }

  fecharModalTracker() {
    this.modalTracker.classList.add('hidden');
  }

  avancarEtapaTracker() {
    this.etapaTrackerAtual = (this.etapaTrackerAtual % 4) + 1;
    this.atualizarEtapaTrackerVisual(this.etapaTrackerAtual);
  }

  atualizarEtapaTrackerVisual(etapa) {
    const steps = [
      document.getElementById('step-1'),
      document.getElementById('step-2'),
      document.getElementById('step-3'),
      document.getElementById('step-4')
    ];

    const mensagens = {
      1: '📝 <strong>Pedido Recebido com Sucesso!</strong> Nossa equipe já conferiu os dados e o pedido foi encaminhado para a cozinha.',
      2: '👨‍🍳 <strong>Na Cozinha!</strong> Seus alimentos estão sendo preparados e embalados com todo o carinho e higiene.',
      3: '🛵 <strong>Saiu para Entrega!</strong> O entregador já recolheu sua marmita e está a caminho do seu endereço.',
      4: '✅ <strong>Entregue com Sucesso!</strong> Bom apetite! Esperamos que ame sua refeição do Marmitaê.'
    };

    const larguras = { 1: '10%', 2: '40%', 3: '70%', 4: '100%' };
    this.trackerProgressLine.style.width = larguras[etapa];
    this.trackerStatusMensagem.innerHTML = mensagens[etapa];

    steps.forEach((st, idx) => {
      st.classList.remove('ativo', 'concluido');
      if (idx + 1 < etapa) {
        st.classList.add('concluido');
      } else if (idx + 1 === etapa) {
        st.classList.add('ativo');
      }
    });

    if (etapa === 4) {
      somService.tocarSucessoPedido();
      this.mostrarToast('Pedido entregue com sucesso! Bom apetite!', 'success');
    }
}
  
  // --- HERO SECTION & DESTAQUES DO DIA ---
  
  atualizarDestaqueDia() {
    const diaAtual = getDiaAtual();
    const nomeDia = DIAS_SEMANA_NOMES[diaAtual];
    
    // Atualiza o nome do dia no hero
    if (this.destaqueDiaNome) {
      this.destaqueDiaNome.textContent = diaAtual === 'domingo' ? 'Domingo (Fechado)' : nomeDia;
    }
    
    // Renderiza os cards de destaque do dia
    this.renderizarDestaquesDia(diaAtual);
    
    // Atualiza botões de navegação
    this.atualizarBotoesNavegacaoDia(diaAtual);
  }
  
  renderizarDestaquesDia(dia) {
    if (!this.destaqueGrid) return;
    
    const disponiveisHoje = consultarCardapio(dia, 'marmitas');
    
    if (disponiveisHoje.length === 0) {
      this.destaqueGrid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-muted);">
          <i class="fa-solid fa-calendar-xmark" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;"></i>
          <p style="font-size: 1.125rem; margin-bottom: 0.5rem;">Restaurante fechado hoje</p>
          <p>Volte de Segunda a Sábado para nossas marmitas caseiras!</p>
        </div>
      `;
      return;
    }
    
    this.destaqueGrid.innerHTML = disponiveisHoje.map(prod => {
      return `
        <article class="destaque-card" role="listitem">
          <span class="destaque-badge marmita">Marmitas</span>
          <div class="destaque-content">
            <h3 class="destaque-name">${escaparHTML(prod.nome)}</h3>
            <p class="destaque-desc">${escaparHTML(prod.descricao)}</p>
          </div>
          <div class="destaque-footer">
            <span class="destaque-price">${formatarMoeda(prod.preco)}</span>
            <button type="button" class="destaque-btn" onclick="window.app.pedirPeloDestaque('${prod.id}')">
              <i class="fa-solid fa-plus" aria-hidden="true"></i>
              Adicionar
            </button>
          </div>
        </article>
      `;
    }).join('');
  }
  
  atualizarBotoesNavegacaoDia(diaAtual) {
    if (!this.btnDiaAnterior || !this.btnDiaProximo) return;
    
    const diasOrdem = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'];
    const idxAtual = diasOrdem.indexOf(diaAtual);
    
    const diaAnterior = diasOrdem[(idxAtual - 1 + diasOrdem.length) % diasOrdem.length];
    const diaProximo = diasOrdem[(idxAtual + 1) % diasOrdem.length];
    
    this.btnDiaAnterior.disabled = false;
    this.btnDiaProximo.disabled = false;
    this.btnDiaAnterior.title = DIAS_SEMANA_NOMES[diaAnterior];
    this.btnDiaProximo.title = DIAS_SEMANA_NOMES[diaProximo];
  }
  
  navegarDia(direcao) {
    const diasOrdem = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'];
    const diaAtual = getDiaAtual();
    const idxAtual = diasOrdem.indexOf(diaAtual);
    const novoIdx = (idxAtual + direcao + diasOrdem.length) % diasOrdem.length;
    const novoDia = diasOrdem[novoIdx];
    
    setDiaSimulado(novoDia);
    this.selectDiaSimulado.value = novoDia;
    
    const nomeDia = DIAS_SEMANA_NOMES[novoDia];
    this.mostrarToast(`Dia alterado para: ${nomeDia}`, 'info');
    this.chatUI.adicionarMensagemBot(`📅 O dia da semana foi ajustado para **${nomeDia}**. As disponibilidades dos pratos foram atualizadas!`, 'demo');
    
    this.atualizarDestaqueDia();
  }
  
  pedirPeloDestaque(produtoId) {
    const prod = buscarProdutoPorId(produtoId);
    if (!prod) return;
    
    this.chatInput.value = `Quero pedir 1 ${prod.nome}`;
    this.enviarMensagemUsuario();
    somService.tocarAdicionarItem();
    
    // Scroll para o chat
    this.chatInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  
  // --- MODAL DIAGNÓSTICO NLP ---
  abrirModalDiagnostico() {
    const ultimaMensagem = this.chatMessagesContainer.querySelector('.message-user:last-child');
    const texto = ultimaMensagem ? ultimaMensagem.textContent.trim() : '';
    
    if (texto) {
      this.atualizarDiagnostico(texto);
    } else {
      this.limparDiagnostico();
    }
    
    this.modalDiagnostico.classList.remove('hidden');
  }
  
  fecharModalDiagnostico() {
    this.modalDiagnostico.classList.add('hidden');
  }
  
  atualizarDiagnostico(mensagemTexto) {
    const diag = this.agent.diagnosticarNLP(mensagemTexto);
    
    if (diag.erro) {
      this.limparDiagnostico();
      this.diagMensagemOriginal.textContent = 'Erro: ' + diag.erro;
      return;
    }
  
    this.diagMensagemOriginal.textContent = diag.original || '';
    this.diagMensagemNormalizada.textContent = diag.normalizado || '';
    this.diagTokens.textContent = JSON.stringify(diag.tokens || [], null, 2);
    this.diagStopwords.textContent = JSON.stringify(diag.stopwordsEncontradas || [], null, 2);
    this.diagRadicais.textContent = JSON.stringify(diag.radicais || [], null, 2);
    this.diagBow.textContent = JSON.stringify(diag.vetorBoW || [], null, 2);
    this.diagTfidf.textContent = JSON.stringify(diag.vetorEntrada || [], null, 2);
    
    if (diag.itemCorrespondente) {
      this.diagIntencao.textContent = JSON.stringify({
        tag: diag.itemCorrespondente.tag,
        resposta: diag.itemCorrespondente.resposta.substring(0, 100) + '...',
        acao: diag.itemCorrespondente.acao
      }, null, 2);
    } else {
      this.diagIntencao.textContent = 'Nenhuma intenção correspondente encontrada (fallback)';
    }
    
    this.diagCosseno.textContent = JSON.stringify({
      score: diag.score,
      limiarAplicado: diag.limiarAplicado,
      match: diag.match,
      topSimilaridades: (diag.similaridades || []).slice(0, 5).map(s => ({
        tag: s.tag,
        texto: s.textoOriginal.substring(0, 50),
        score: s.score
      }))
    }, null, 2);
    
    this.diagLimiar.textContent = `Limiar mínimo: ${diag.limiarAplicado.toFixed(2)}`;
    this.diagMetodo.textContent = diag.metodoUsado || 'desconhecido';
  
    // ELIZA Diagnóstico
    if (diag.eliza) {
      this.diagElizaKeyword.textContent = diag.eliza.palavraChaveIdentificada || 'nenhuma';
      this.diagElizaPrioridade.textContent = diag.eliza.prioridade || 0;
      this.diagElizaPadrao.textContent = diag.eliza.padraoDecomposicao || 'nenhum';
      this.diagElizaGrupos.textContent = JSON.stringify(diag.eliza.gruposCapturados || [], null, 2);
      this.diagElizaReflexoes.textContent = JSON.stringify(diag.eliza.reflexoesRealizadas || [], null, 2);
      this.diagElizaRemontagem.textContent = diag.eliza.remontagemSelecionada || 'nenhuma';
      this.diagElizaResposta.textContent = diag.eliza.respostaProduzida || 'nenhuma';
    } else {
      this.diagElizaKeyword.textContent = 'não executado';
      this.diagElizaPrioridade.textContent = '-';
      this.diagElizaPadrao.textContent = '-';
      this.diagElizaGrupos.textContent = '-';
      this.diagElizaReflexoes.textContent = '-';
      this.diagElizaRemontagem.textContent = '-';
      this.diagElizaResposta.textContent = '-';
    }
  }
  
  limparDiagnostico() {
    this.diagMensagemOriginal.textContent = '';
    this.diagMensagemNormalizada.textContent = '';
    this.diagTokens.textContent = '';
    this.diagStopwords.textContent = '';
    this.diagRadicais.textContent = '';
    this.diagBow.textContent = '';
    this.diagTfidf.textContent = '';
    this.diagIntencao.textContent = '';
    this.diagCosseno.textContent = '';
    this.diagLimiar.textContent = '';
    this.diagMetodo.textContent = '';
  
    // ELIZA
    this.diagElizaKeyword.textContent = '';
    this.diagElizaPrioridade.textContent = '';
    this.diagElizaPadrao.textContent = '';
    this.diagElizaGrupos.textContent = '';
    this.diagElizaReflexoes.textContent = '';
    this.diagElizaRemontagem.textContent = '';
    this.diagElizaResposta.textContent = '';
  }
}

// Inicializa a aplicação ao carregar a página
document.addEventListener('DOMContentLoaded', async () => {
  window.app = new MarmitaeApp();
  await window.app.initApp();
});
