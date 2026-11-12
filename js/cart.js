/**
 * Marmitaê - Gerenciador do Carrinho de Compras
 * Todos os cálculos de subtotais e totais são calculados com base estrita no menu.js.
 */

import { buscarProdutoPorId, TAXA_ENTREGA_PADRAO } from './menu.js';
import { gerarIdUnico } from './utils.js';

export class Carrinho {
  constructor(onChangeCallback = null) {
    this.itens = []; // Array de itens { idItem, produtoId, nome, precoUnitario, quantidade, personalizacoes: [], observacoes: '' }
    this.tipoEntrega = 'entrega'; // 'entrega' ou 'retirada'
    this.taxaEntrega = TAXA_ENTREGA_PADRAO;
    this.onChangeCallback = onChangeCallback;
  }

  /**
   * Registra callback para atualizações visuais
   */
  setOnChange(callback) {
    this.onChangeCallback = callback;
  }

  notificar() {
    if (typeof this.onChangeCallback === 'function') {
      this.onChangeCallback(this.obterEstado());
    }
  }

  /**
   * Adiciona um item ao carrinho ou incrementa se já existir idêntico (mesmas personalizações).
   * @param {string} produtoId
   * @param {number} quantidade
   * @param {Array<string>} personalizacoes
   * @param {string} observacoes
   * @returns {object} { sucesso: boolean, item: object, erro?: string }
   */
  adicionarItem(produtoId, quantidade = 1, personalizacoes = [], observacoes = '') {
    const produto = buscarProdutoPorId(produtoId);
    if (!produto) {
      return { sucesso: false, erro: `Produto "${produtoId}" não encontrado no cardápio.` };
    }

    const qtd = Math.max(1, parseInt(quantidade, 10) || 1);
    const persLimpa = Array.isArray(personalizacoes) 
      ? personalizacoes.map(p => String(p).trim()).filter(Boolean).sort()
      : [];
    const obsLimpa = observacoes ? String(observacoes).trim() : '';

    // Verifica se já existe um item com o mesmo produtoId e EXATAMENTE as mesmas personalizações
    const itemExistente = this.itens.find(it => 
      it.produtoId === produto.id &&
      JSON.stringify(it.personalizacoes.slice().sort()) === JSON.stringify(persLimpa) &&
      it.observacoes === obsLimpa
    );

    if (itemExistente) {
      itemExistente.quantidade += qtd;
      itemExistente.subtotal = itemExistente.quantidade * itemExistente.precoUnitario;
      this.notificar();
      return { sucesso: true, item: itemExistente, alterado: 'incrementado' };
    }

    const novoItem = {
      idItem: gerarIdUnico('cart_item'),
      produtoId: produto.id,
      nome: produto.nome,
      categoria: produto.categoria,
      precoUnitario: produto.preco, // Sempre baseado no cadastro oficial!
      quantidade: qtd,
      personalizacoes: persLimpa,
      observacoes: obsLimpa,
      subtotal: qtd * produto.preco
    };

    this.itens.push(novoItem);
    this.notificar();
    return { sucesso: true, item: novoItem, alterado: 'adicionado' };
  }

  /**
   * Altera a quantidade de um item pelo seu idItem ou pelo produtoId.
   */
  alterarQuantidade(identificador, novaQuantidade) {
    const item = this.itens.find(it => it.idItem === identificador || it.produtoId === identificador);
    if (!item) {
      return { sucesso: false, erro: 'Item não encontrado no carrinho.' };
    }

    const qtd = parseInt(novaQuantidade, 10);
    if (isNaN(qtd) || qtd <= 0) {
      return this.removerItem(item.idItem);
    }

    item.quantidade = qtd;
    item.subtotal = item.quantidade * item.precoUnitario;
    this.notificar();
    return { sucesso: true, item };
  }

  /**
   * Incrementa ou decrementa a quantidade.
   */
  incrementarQuantidade(idItem, delta = 1) {
    const item = this.itens.find(it => it.idItem === idItem);
    if (!item) return { sucesso: false };
    const novaQtd = item.quantidade + delta;
    return this.alterarQuantidade(idItem, novaQtd);
  }

  /**
   * Remove item pelo idItem ou produtoId.
   */
  removerItem(identificador) {
    const index = this.itens.findIndex(it => it.idItem === identificador || it.produtoId === identificador);
    if (index === -1) {
      return { sucesso: false, erro: 'Item não encontrado no carrinho para remoção.' };
    }
    const [removido] = this.itens.splice(index, 1);
    this.notificar();
    return { sucesso: true, itemRemovido: removido };
  }

  /**
   * Atualiza as personalizações do último item adicionado ou de um item específico.
   */
  personalizarItem(identificador, novasPersonalizacoes = [], novasObservacoes = null) {
    let item = null;
    if (identificador) {
      item = this.itens.find(it => it.idItem === identificador || it.produtoId === identificador);
    }
    if (!item && this.itens.length > 0) {
      item = this.itens[this.itens.length - 1]; // Aplica no último se não especificado
    }

    if (!item) {
      return { sucesso: false, erro: 'Nenhum item encontrado no carrinho para personalizar.' };
    }

    if (Array.isArray(novasPersonalizacoes) && novasPersonalizacoes.length > 0) {
      // Mescla ou substitui personalizações
      const unificadas = Array.from(new Set([...item.personalizacoes, ...novasPersonalizacoes]));
      item.personalizacoes = unificadas;
    }

    if (novasObservacoes !== null) {
      item.observacoes = String(novasObservacoes).trim();
    }

    this.notificar();
    return { sucesso: true, item };
  }

  /**
   * Define o tipo de entrega ('entrega' ou 'retirada') e ajusta a taxa.
   */
  definirTipoEntrega(tipo) {
    const tipoNorm = String(tipo).toLowerCase().trim();
    if (tipoNorm === 'retirada' || tipoNorm === 'buscar') {
      this.tipoEntrega = 'retirada';
      this.taxaEntrega = 0.00;
    } else {
      this.tipoEntrega = 'entrega';
      this.taxaEntrega = TAXA_ENTREGA_PADRAO;
    }
    this.notificar();
    return { sucesso: true, tipoEntrega: this.tipoEntrega, taxaEntrega: this.taxaEntrega };
  }

  /**
   * Esvazia o carrinho completamente.
   */
  limpar() {
    this.itens = [];
    this.tipoEntrega = 'entrega';
    this.taxaEntrega = TAXA_ENTREGA_PADRAO;
    this.notificar();
  }

  /**
   * Calcula o subtotal de todos os itens.
   */
  calcularSubtotal() {
    return this.itens.reduce((acc, it) => acc + (it.precoUnitario * it.quantidade), 0);
  }

  /**
   * Calcula o valor total final com frete/taxa.
   */
  calcularTotal() {
    const subtotal = this.calcularSubtotal();
    if (subtotal === 0) return 0;
    return subtotal + this.taxaEntrega;
  }

  /**
   * Retorna contagem total de unidades de itens.
   */
  obterQuantidadeTotal() {
    return this.itens.reduce((acc, it) => acc + it.quantidade, 0);
  }

  /**
   * Retorna uma cópia limpa do estado atual do carrinho.
   */
  obterEstado() {
    const subtotal = this.calcularSubtotal();
    const total = this.calcularTotal();
    return {
      itens: JSON.parse(JSON.stringify(this.itens)),
      quantidadeTotalItens: this.obterQuantidadeTotal(),
      tipoEntrega: this.tipoEntrega,
      taxaEntrega: this.taxaEntrega,
      subtotal,
      total,
      vazio: this.itens.length === 0
    };
  }

  /**
   * Gera texto formatado para o resumo no chat.
   */
  gerarResumoTexto() {
    if (this.itens.length === 0) {
      return 'Seu carrinho está vazio.';
    }

    const linhas = [];
    this.itens.forEach(it => {
      let linha = `• ${it.quantidade}x ${it.nome} - R$ ${(it.precoUnitario * it.quantidade).toFixed(2).replace('.', ',')}`;
      if (it.personalizacoes && it.personalizacoes.length > 0) {
        linha += `\n   ↪ Personalização: ${it.personalizacoes.join(', ')}`;
      }
      if (it.observacoes) {
        linha += `\n   ↪ Obs: ${it.observacoes}`;
      }
      linhas.push(linha);
    });

    const subtotal = this.calcularSubtotal();
    const total = this.calcularTotal();

    linhas.push('');
    linhas.push(`Subtotal: R$ ${subtotal.toFixed(2).replace('.', ',')}`);
    if (this.tipoEntrega === 'retirada') {
      linhas.push(`Retirada no restaurante: Grátis (R$ 0,00)`);
    } else {
      linhas.push(`Taxa de entrega: R$ ${this.taxaEntrega.toFixed(2).replace('.', ',')}`);
    }
    linhas.push(`Total a pagar: R$ ${total.toFixed(2).replace('.', ',')}`);

    return linhas.join('\n');
  }
}
