/**
 * Marmitaê - Gerenciador do Fluxo de Checkout e Dados do Cliente
 * Valida dados obrigatórios de entrega e formas de pagamento antes da finalização.
 */

import { gerarNumeroPedido } from './utils.js';

export const FORMAS_PAGAMENTO = {
  PIX: 'PIX',
  DINHEIRO: 'Dinheiro',
  CREDITO: 'Cartão de Crédito',
  DEBITO: 'Cartão de Débito'
};

export class CheckoutManager {
  constructor(carrinho) {
    this.carrinho = carrinho;
    this.reset();
  }

  reset() {
    this.cliente = {
      nome: '',
      endereco: {
        rua: '',
        numero: '',
        complemento: '',
        bairro: '',
        cidade: 'Cidade Local'
      },
      formaPagamento: '',
      trocoPara: null,
      observacoesEntrega: ''
    };
    this.pedidoFinalizado = null;
    this.aguardandoConfirmacaoFinal = false;
  }

  setNomeCliente(nome) {
    if (nome) {
      this.cliente.nome = String(nome).trim();
    }
  }

  /**
   * Atualiza os dados de entrega.
   */
  setEndereco(dados) {
    if (typeof dados === 'string') {
      // Se vier uma string corrida com endereço
      this.cliente.endereco.rua = dados.trim();
    } else if (typeof dados === 'object' && dados !== null) {
      if (dados.rua) this.cliente.endereco.rua = dados.rua.trim();
      if (dados.numero) this.cliente.endereco.numero = dados.numero.trim();
      if (dados.complemento) this.cliente.endereco.complemento = dados.complemento.trim();
      if (dados.bairro) this.cliente.endereco.bairro = dados.bairro.trim();
    }
  }

  /**
   * Define forma de pagamento com validação e normalização.
   */
  setFormaPagamento(forma, trocoPara = null) {
    const fNorm = String(forma).toUpperCase();
    if (fNorm.includes('PIX')) {
      this.cliente.formaPagamento = FORMAS_PAGAMENTO.PIX;
      this.cliente.trocoPara = null;
    } else if (fNorm.includes('DINHEIRO')) {
      this.cliente.formaPagamento = FORMAS_PAGAMENTO.DINHEIRO;
      if (trocoPara) {
        const valTroco = parseFloat(String(trocoPara).replace(',', '.'));
        if (!isNaN(valTroco)) {
          this.cliente.trocoPara = valTroco;
        }
      }
    } else if (fNorm.includes('DEBITO') || fNorm.includes('DÉBITO')) {
      this.cliente.formaPagamento = FORMAS_PAGAMENTO.DEBITO;
      this.cliente.trocoPara = null;
    } else if (fNorm.includes('CREDITO') || fNorm.includes('CRÉDITO') || fNorm.includes('CARTAO') || fNorm.includes('CARTÃO')) {
      this.cliente.formaPagamento = FORMAS_PAGAMENTO.CREDITO;
      this.cliente.trocoPara = null;
    } else {
      this.cliente.formaPagamento = forma;
    }
  }

  /**
   * Identifica quais informações ainda faltam para que o pedido possa ser concluído.
   * @returns {Array<string>} Lista de campos faltantes ('itens', 'nome', 'endereco', 'formaPagamento', 'troco')
   */
  obterPendencias() {
    const pendencias = [];
    const estadoCarrinho = this.carrinho.obterEstado();

    if (estadoCarrinho.vazio) {
      pendencias.push('itens');
      return pendencias;
    }

    if (!this.cliente.nome || this.cliente.nome.length < 2) {
      pendencias.push('nome');
    }

    if (this.carrinho.tipoEntrega === 'entrega') {
      const temRua = !!this.cliente.endereco.rua;
      if (!temRua) {
        pendencias.push('endereco');
      }
    }

    if (!this.cliente.formaPagamento) {
      pendencias.push('formaPagamento');
    }

    return pendencias;
  }

  /**
   * Gera o resumo estruturado para apresentação final.
   */
  gerarResumoCompleto() {
    const estado = this.carrinho.obterEstado();
    const linhasItens = estado.itens.map(it => {
      let desc = `• ${it.quantidade}x ${it.nome} - R$ ${(it.precoUnitario * it.quantidade).toFixed(2).replace('.', ',')}`;
      if (it.personalizacoes && it.personalizacoes.length > 0) {
        desc += `\n    Personalização: ${it.personalizacoes.join(', ')}`;
      }
      if (it.observacoes) {
        desc += `\n    Obs: ${it.observacoes}`;
      }
      return desc;
    }).join('\n');

    let infoEntrega = '';
    if (this.carrinho.tipoEntrega === 'retirada') {
      infoEntrega = 'Retirada no Balcão Marmitaê (Taxa: Grátis)';
    } else {
      const e = this.cliente.endereco;
      const endStr = `${e.rua || 'A combinar'}${e.numero ? ', ' + e.numero : ''}${e.complemento ? ' (' + e.complemento + ')' : ''}${e.bairro ? ' - ' + e.bairro : ''}`;
      infoEntrega = `Entrega em: ${endStr} (Taxa: R$ ${estado.taxaEntrega.toFixed(2).replace('.', ',')})`;
    }

    let infoPagamento = this.cliente.formaPagamento || 'Não informada';
    if (this.cliente.formaPagamento === FORMAS_PAGAMENTO.DINHEIRO && this.cliente.trocoPara) {
      infoPagamento += ` (Troco para R$ ${this.cliente.trocoPara.toFixed(2).replace('.', ',')})`;
    }

    return {
      clienteNome: this.cliente.nome || 'Cliente',
      itensTexto: linhasItens,
      subtotal: estado.subtotal,
      taxaEntrega: estado.taxaEntrega,
      total: estado.total,
      tipoEntrega: this.carrinho.tipoEntrega,
      infoEntrega,
      infoPagamento,
      itens: estado.itens
    };
  }

  /**
   * Finaliza o pedido após confirmação explícita.
   * Valida tudo antes de emitir o comprovante.
   */
  confirmarEFinalizar() {
    const pendencias = this.obterPendencias();
    if (pendencias.length > 0) {
      return {
        sucesso: false,
        pendencias,
        erro: `Ainda faltam informações para concluir: ${pendencias.join(', ')}.`
      };
    }

    const resumo = this.gerarResumoCompleto();
    const numeroPedido = gerarNumeroPedido();
    const dataHora = new Date().toLocaleString('pt-BR');

    this.pedidoFinalizado = {
      numeroPedido,
      dataHora,
      ...resumo
    };

    // Após finalizar, esvazia carrinho e reseta
    this.carrinho.limpar();
    this.aguardandoConfirmacaoFinal = false;

    return {
      sucesso: true,
      pedido: this.pedidoFinalizado
    };
  }
}
