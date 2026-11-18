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
import { CARDAPIO, buscarProdutoPorId, setDiaSimulado, getDiaAtual, DIAS_SEMANA_NOMES } from './menu.js';

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

    // Modal de Configuração
    this.btnStatusModo = document.getElementById('btn-status-modo');
    this.btnAbrirConfig = document.getElementById('btn-abrir-config');
    this.modalConfig = document.getElementById('modal-config');
    this.btnFecharModal = document.getElementById('btn-fechar-modal-config');
    this.btnCancelarModal = document.getElementById('btn-cancelar-modal');
    this.btnSalvarChave = document.getElementById('btn-salvar-chave');
    this.btnLimparChave = document.getElementById('btn-limpar-chave');
    this.btnTestarConexao = document.getElementById('btn-testar-conexao');
    this.statusTesteConexao = document.getElementById('status-teste-conexao');
    this.inputApiKey = document.getElementById('input-api-key');
    this.radioDemo = document.getElementById('radio-demo');
    this.radioLLM = document.getElementById('radio-llm');
    this.textoModo = document.getElementById('texto-modo');
    this.iconeModo = document.getElementById('icone-modo');

    // Modal de Cardápio Completo
    this.modalCardapio = document.getElementById('modal-cardapio');
    this.btnFecharModalCardapio = document.getElementById('btn-fechar-modal-cardapio');
    this.btnFecharModalCardapioRodape = document.getElementById('btn-fechar-modal-cardapio-rodape');
    this.modalMenuGrid = document.getElementById('modal-menu-grid');
    this.inputBuscaCardapio = document.getElementById('input-busca-cardapio');
    this.menuTabBtns = document.querySelectorAll('.menu-tab-btn');

    // Modal de Rastreador de Pedido
    this.modalTracker = document.getElementById('modal-tracker');
    this.btnFecharModalTracker = document.getElementById('btn-fechar-modal-tracker');
    this.btnFecharModalTrackerRodape = document.getElementById('btn-fechar-modal-tracker-rodape');
    this.btnAvancarEtapaTracker = document.getElementById('btn-avancar-etapa-tracker');
    this.trackerNumeroPedido = document.getElementById('tracker-numero-pedido');
    this.trackerClienteInfo = document.getElementById('tracker-cliente-info');
    this.trackerStatusMensagem = document.getElementById('tracker-status-mensagem');
    this.trackerProgressLine = document.getElementById('tracker-progress-line');

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
    });

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

    // Configuração de API e Modos
    this.btnStatusModo.addEventListener('click', () => this.abrirModalConfig());
    this.btnAbrirConfig.addEventListener('click', () => this.abrirModalConfig());
    this.btnFecharModal.addEventListener('click', () => this.fecharModalConfig());
    this.btnCancelarModal.addEventListener('click', () => this.fecharModalConfig());
    this.btnSalvarChave.addEventListener('click', () => this.salvarConfiguracaoApi());
    this.btnLimparChave.addEventListener('click', () => this.limparConfiguracaoApi());
    this.btnTestarConexao.addEventListener('click', () => this.testarConexaoApi());

    // Modal de Rastreador de Pedidos
    this.btnFecharModalTracker.addEventListener('click', () => this.fecharModalTracker());
    this.btnFecharModalTrackerRodape.addEventListener('click', () => this.fecharModalTracker());
    this.btnAvancarEtapaTracker.addEventListener('click', () => this.avancarEtapaTracker());

    // Ações dentro da lista do carrinho (Delegação de eventos)
    this.cartItemsList.addEventListener('click', (e) => {
      const btnRemover = e.target.closest('.btn-remove-item');
      if (btnRemover) {
        const idItem = btnRemover.dataset.id;
        this.carrinho.removerItem(idItem);
        this.mostrarToast('Item removido do pedido.', 'info');
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
        somService.tocarAdicionarItem();
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

  async testarConexaoApi() {
    const chave = this.inputApiKey.value.trim();
    this.statusTesteConexao.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Testando conectividade com o Google Gemini...';
    this.statusTesteConexao.style.color = 'var(--text-muted)';

    const res = await this.agent.gemini.testarConexao(chave);
    if (res.valido) {
      this.statusTesteConexao.innerHTML = '✅ ' + res.mensagem;
      this.statusTesteConexao.style.color = '#2e7d32';
      this.mostrarToast('Chave de API validada com sucesso!', 'success');
    } else {
      this.statusTesteConexao.innerHTML = '❌ ' + res.mensagem;
      this.statusTesteConexao.style.color = '#c62828';
      this.mostrarToast('Falha na validação da chave.', 'warn');
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
      this.cartRowDesconto.classList.remove('oculto');
      this.cartDesconto.textContent = `- ${formatarMoeda(estado.desconto)}`;
      this.couponInputGroup.classList.add('oculto');
      this.couponAppliedGroup.classList.remove('oculto');
      this.couponAppliedText.textContent = `Cupom: ${estado.cupom.codigo} (-${formatarMoeda(estado.desconto)})`;
    } else if (estado.cupom && estado.cupom.tipo === 'frete_gratis') {
      this.cartRowDesconto.classList.remove('oculto');
      this.cartDesconto.textContent = `Frete Grátis aplicado!`;
      this.couponInputGroup.classList.add('oculto');
      this.couponAppliedGroup.classList.remove('oculto');
      this.couponAppliedText.textContent = `Cupom: FRETEGRATIS`;
    } else {
      this.cartRowDesconto.classList.add('oculto');
      this.couponInputGroup.classList.remove('oculto');
      this.couponAppliedGroup.classList.add('oculto');
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

  // --- MODAL DE CONFIGURAÇÃO DA API ---
  abrirModalConfig() {
    this.inputApiKey.value = this.agent.gemini.getApiKey();
    this.statusTesteConexao.textContent = '';
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
    this.mostrarToast(`Modo alterado para: ${modoEscolhido === 'llm' ? 'IA Gemini' : 'Modo Demo'}`, 'success');
  }

  limparConfiguracaoApi() {
    this.agent.gemini.limparApiKey();
    this.inputApiKey.value = '';
    this.radioDemo.checked = true;
    this.agent.setModo('demo');
    this.atualizarStatusModoUI();
    this.fecharModalConfig();
    this.mostrarToast('Chave de API removida com sucesso.', 'info');
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
    this.modalCardapio.classList.remove('oculto');
  }

  fecharModalCardapio() {
    this.modalCardapio.classList.add('oculto');
  }

  renderizarGradeCardapioModal() {
    const categoriaAtiva = document.querySelector('.menu-tab-btn.ativo').dataset.categoria;
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
    this.modalTracker.classList.remove('oculto');
  }

  fecharModalTracker() {
    this.modalTracker.classList.add('oculto');
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
}

// Inicializa a aplicação ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
  window.app = new MarmitaeApp();
});
