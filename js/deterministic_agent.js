/**
 * Marmitaê - Motor Determinístico de Atendimento Conversacional Inteligente
 * Gerencia máquina de estados de conversação (nome, endereço, pagamento, troco),
 * interpreta linguagem natural contextual, recomendações, dúvidas do cardápio,
 * cupons promocionais, personalizações e cards visuais de produtos.
 */

import { CARDAPIO, consultarCardapio, buscarProdutoPorNome, buscarProdutoPorId, getDiaAtual, DIAS_SEMANA_NOMES, CUPONS_VALIDOS } from './menu.js';
import { FORMAS_PAGAMENTO } from './checkout.js';

export class DeterministicAgent {
  constructor(carrinho, checkout) {
    this.carrinho = carrinho;
    this.checkout = checkout;
    this.ultimoItemMencionadoId = null;
    this.aguardandoDado = null; // 'nome' | 'endereco' | 'formaPagamento' | 'troco' | 'sugestao'
  }

  reset() {
    this.ultimoItemMencionadoId = null;
    this.aguardandoDado = null;
  }

  /**
   * Processa a mensagem do cliente e retorna a resposta com ações executadas e eventuais cards.
   * @param {string} mensagemTexto
   * @returns {{ resposta: string, acoesExecutadas: Array, cards?: Array }}
   */
  processarMensagem(mensagemTexto) {
    const raw = mensagemTexto.trim();
    const texto = raw.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const acoes = [];

    // =========================================================================
    // 0. GESTÃO DE ESTADO ATIVO (QUANDO O ROBÔ PERGUNTOU UM DADO ESPECÍFICO)
    // =========================================================================

    // A. Aguardando Nome do Cliente
    if (this.aguardandoDado === 'nome') {
      let nomeLimpo = raw
        .replace(/^(meu nome [eé]|sou o|sou a|me chamo|pode me chamar de|chama de|nome:\s*)/i, '')
        .replace(/[!.,?]/g, '')
        .trim();

      if (nomeLimpo.length >= 2 && !this.ehIntencaoDeMudancaGeral(texto)) {
        // Formata Primeira Letra Maiúscula
        nomeLimpo = nomeLimpo.split(' ')
          .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(' ');

        this.checkout.setNomeCliente(nomeLimpo);
        this.aguardandoDado = null;
        acoes.push({ tipo: 'definir_nome', nome: nomeLimpo });

        // Continua o fluxo imediatamente para o próximo dado pendente
        return this.gerarPromptResumoConfirmacao(acoes, `Prazer em te atender, **${nomeLimpo}**! 😄`);
      }
    }

    // B. Aguardando Endereço de Entrega
    if (this.aguardandoDado === 'endereco') {
      if (!this.ehIntencaoDeMudancaGeral(texto) && raw.length >= 4) {
        this.carrinho.definirTipoEntrega('entrega');
        this.checkout.setEndereco(raw);
        this.aguardandoDado = null;
        acoes.push({ tipo: 'definir_entrega', tipo: 'entrega', endereco: raw });

        return this.gerarPromptResumoConfirmacao(acoes, `Endereço de entrega anotado com sucesso! 🛵 (Taxa de entrega: R$ 5,00).`);
      }
    }

    // C. Aguardando Forma de Pagamento
    if (this.aguardandoDado === 'formaPagamento') {
      if (texto.includes('pix') || texto.includes('dinheiro') || texto.includes('credito') || texto.includes('debito') || texto.includes('cartao')) {
        let troco = null;
        const matchTroco = texto.match(/troco\s*(?:para|pra)?\s*(?:r\$)?\s*(\d+)/i);
        if (matchTroco) {
          troco = parseFloat(matchTroco[1]);
        }

        if (texto.includes('pix')) this.checkout.setFormaPagamento('PIX');
        else if (texto.includes('dinheiro')) this.checkout.setFormaPagamento('Dinheiro', troco);
        else if (texto.includes('credito')) this.checkout.setFormaPagamento('Cartão de Crédito');
        else if (texto.includes('debito')) this.checkout.setFormaPagamento('Cartão de Débito');
        else this.checkout.setFormaPagamento('Cartão');

        acoes.push({ tipo: 'definir_pagamento', forma: this.checkout.cliente.formaPagamento });
        this.aguardandoDado = null;

        if (this.checkout.cliente.formaPagamento === 'Dinheiro' && !troco && !texto.includes('sem troco') && !texto.includes('nao precisa')) {
          this.aguardandoDado = 'troco';
          return {
            resposta: 'Anotado, pagamento em dinheiro! 💵 Você vai precisar de troco? Se sim, para quanto?',
            acoesExecutadas: acoes
          };
        }

        return this.gerarPromptResumoConfirmacao(acoes, `Forma de pagamento registrada: **${this.checkout.cliente.formaPagamento}**.`);
      }
    }

    // D. Aguardando Informação de Troco
    if (this.aguardandoDado === 'troco') {
      const matchNum = texto.match(/\b\d+([,.]\d{2})?\b/);
      if (matchNum) {
        const valTroco = parseFloat(matchNum[0].replace(',', '.'));
        this.checkout.cliente.trocoPara = valTroco;
      }
      this.aguardandoDado = null;
      return this.gerarPromptResumoConfirmacao(acoes, `Perfeito! Levamos troco certinho.`);
    }

    // E. Aguardando Resposta a uma Sugestão Adicional (bebida, sobremesa, etc.)
    if (this.aguardandoDado === 'sugestao') {
      const ehRecusa = /^(nao|não|n|nao quero|não quero|so isso|só isso|somente isso|sem sobremesa|sem bebida|mais nada|nada|deixa assim|deixa so|dispensa)$/i.test(texto) ||
                       texto.includes('nao quero') || texto.includes('não quero') || texto.includes('so isso') || texto.includes('mais nada');
      if (ehRecusa) {
        this.aguardandoDado = null;
        return this.gerarPromptResumoConfirmacao(acoes, 'Sem problemas! Vamos prosseguir com o seu pedido. 👍');
      }
    }

    // =========================================================================
    // 1. CONFIRMAÇÃO FINAL DE PEDIDO
    // =========================================================================
    if (this.checkout.aguardandoConfirmacaoFinal) {
      if (/^(sim|s|confirmo|pode confirmar|pode fechar|ta certo|tá certo|isso|bora|fechar|ok|positivo|manda)$/i.test(texto) ||
          texto.includes('pode confirmar') || texto.includes('pode fechar') || texto.includes('esta certo') || texto.includes('esta correto')) {
        const resultado = this.checkout.confirmarEFinalizar();
        if (resultado.sucesso) {
          const ped = resultado.pedido;
          acoes.push({ tipo: 'pedido_finalizado', dados: ped });
          this.aguardandoDado = null;
          return {
            resposta: `🎉 **Pedido Confirmado com Sucesso!**\n\nNúmero do Pedido: **${ped.numeroPedido}**\nCliente: **${ped.clienteNome}**\nTotal: **R$ ${ped.total.toFixed(2).replace('.', ',')}**\nForma de Pagamento: **${ped.infoPagamento}**\n${ped.infoEntrega}\n\nSeu pedido já foi enviado para a cozinha com todo carinho! Tempo estimado de preparo/entrega: 35 a 50 minutos. 🍲✨\n\nMuito obrigado pela preferência! Caso queira fazer outro pedido, basta me avisar.`,
            acoesExecutadas: acoes
          };
        } else {
          return {
            resposta: `Ops! Ainda temos um detalhe pendente antes de fechar: ${resultado.erro}. Pode me informar?`,
            acoesExecutadas: acoes
          };
        }
      } else if (texto.includes('nao') || texto.includes('espera') || texto.includes('mudar') || texto.includes('cancelar')) {
        this.checkout.aguardandoConfirmacaoFinal = false;
        return {
          resposta: 'Sem problemas! O que você gostaria de alterar no seu pedido? Posso trocar itens, quantidades, acompanhamentos, cupom ou forma de pagamento.',
          acoesExecutadas: acoes
        };
      }
    }

    // =========================================================================
    // 2. EXTRAÇÃO PASSIVA DE NOME ("meu nome é David", "sou o Carlos")
    // =========================================================================
    const matchNomePassivo = raw.match(/(?:meu nome [eé]|sou o|sou a|me chamo|pode me chamar de|nome:\s*)\s*([a-zA-ZÀ-ÿ]+)/i);
    if (matchNomePassivo) {
      const nomeEncontrado = matchNomePassivo[1].charAt(0).toUpperCase() + matchNomePassivo[1].slice(1).toLowerCase();
      this.checkout.setNomeCliente(nomeEncontrado);
      acoes.push({ tipo: 'definir_nome', nome: nomeEncontrado });
    }

    // =========================================================================
    // 3. CUPONS DE DESCONTO ("tem cupom", "aplica cupom", "codigo primeira compra")
    // =========================================================================
    if (texto.includes('cupom') || texto.includes('desconto') || texto.includes('promocao') || texto.includes('promoção')) {
      let cupomMencionado = null;
      if (texto.includes('primeiracompra') || texto.includes('primeira compra')) {
        cupomMencionado = 'PRIMEIRACOMPRA';
      } else if (texto.includes('marmitae10') || texto.includes('10%')) {
        cupomMencionado = 'MARMITAE10';
      } else if (texto.includes('fretegratis') || texto.includes('frete gratis')) {
        cupomMencionado = 'FRETEGRATIS';
      }

      if (cupomMencionado) {
        const resCupom = this.carrinho.aplicarCupom(cupomMencionado);
        if (resCupom.sucesso) {
          acoes.push({ tipo: 'aplicar_cupom', cupom: resCupom.cupom });
          const totalAtual = this.carrinho.calcularTotal();
          return {
            resposta: `🎉 Oba! Cupom **${resCupom.cupom.codigo}** aplicado com sucesso!\nBenefício: **${resCupom.cupom.descricao}**.\n\nTotal atualizado do seu pedido: **R$ ${totalAtual.toFixed(2).replace('.', ',')}**. Podemos continuar? 😄`,
            acoesExecutadas: acoes
          };
        }
      } else {
        return {
          resposta: `Temos ótimos cupons disponíveis hoje! 🎟️\n\n• **PRIMEIRACOMPRA**: R$ 5,00 de desconto no seu pedido!\n• **MARMITAE10**: 10% de desconto no total dos pratos!\n• **FRETEGRATIS**: Entrega grátis na sua casa!\n\nPara aplicar, basta me dizer: *"Aplica o cupom PRIMEIRACOMPRA"* ou o código que preferir! 😊`,
          acoesExecutadas: acoes
        };
      }
    }

    // =========================================================================
    // 4. MUDANÇA DE QUANTIDADE ("na verdade quero 3", "muda para duas", "quero mais uma")
    // =========================================================================
    const querMaisUma = texto.includes('mais uma') || texto.includes('quero outra') || texto.includes('adiciona mais um');
    
    if (querMaisUma && this.ultimoItemMencionadoId) {
      const prod = buscarProdutoPorId(this.ultimoItemMencionadoId);
      if (prod) {
        this.carrinho.incrementarQuantidade(this.ultimoItemMencionadoId, 1);
        acoes.push({ tipo: 'adicionar_item', produtoId: prod.id });
        return {
          resposta: `Adicionei mais uma unidade de **${prod.nome}** ao seu carrinho! 🛍️\n\nQuer escolher uma bebida bem geladinha para acompanhar ou gostaria de ver o valor atual?`,
          acoesExecutadas: acoes
        };
      }
    }

    if (texto.includes('na verdade') && (texto.includes('quero') || texto.includes('tres') || texto.includes('duas') || /\b\d+\b/.test(texto)) && this.ultimoItemMencionadoId) {
      let novaQtd = 1;
      if (texto.includes('3') || texto.includes('tres')) novaQtd = 3;
      else if (texto.includes('2') || texto.includes('duas') || texto.includes('dois')) novaQtd = 2;
      else if (texto.includes('4') || texto.includes('quatro')) novaQtd = 4;
      else if (texto.includes('1') || texto.includes('uma') || texto.includes('um')) novaQtd = 1;

      const prod = buscarProdutoPorId(this.ultimoItemMencionadoId);
      this.carrinho.alterarQuantidade(this.ultimoItemMencionadoId, novaQtd);
      acoes.push({ tipo: 'alterar_quantidade', produtoId: this.ultimoItemMencionadoId, novaQtd });
      return {
        resposta: `Perfeito! Atualizei para **${novaQtd}x ${prod ? prod.nome : 'itens'}** no seu carrinho. 😊\n\nDeseja adicionar mais alguma coisa ou vamos para o endereço de entrega?`,
        acoesExecutadas: acoes
      };
    }

    // =========================================================================
    // 5. REMOÇÃO DE ITEM ("cancela a bebida", "tira o refrigerante", "remove o pudim")
    // =========================================================================
    if (texto.includes('cancela') || texto.includes('tira') || texto.includes('remove') || texto.includes('exclui')) {
      if (texto.includes('bebida') || texto.includes('refri') || texto.includes('coca') || texto.includes('suco') || texto.includes('agua')) {
        const itemBebida = this.carrinho.itens.find(i => i.categoria === 'bebidas');
        if (itemBebida) {
          this.carrinho.removerItem(itemBebida.idItem);
          acoes.push({ tipo: 'remover_item', item: itemBebida });
          return {
            resposta: `Prontinho, retirei **${itemBebida.nome}** do seu carrinho. 👍\n\nSeu total agora é de R$ ${this.carrinho.calcularTotal().toFixed(2).replace('.', ',')}. Deseja fechar o pedido ou escolher outro item?`,
            acoesExecutadas: acoes
          };
        }
      }
      if (texto.includes('sobremesa') || texto.includes('pudim') || texto.includes('mousse') || texto.includes('brigadeiro')) {
        const itemSobremesa = this.carrinho.itens.find(i => i.categoria === 'sobremesas');
        if (itemSobremesa) {
          this.carrinho.removerItem(itemSobremesa.idItem);
          acoes.push({ tipo: 'remover_item', item: itemSobremesa });
          return {
            resposta: `Sobremesa removida com sucesso! Total atualizado: R$ ${this.carrinho.calcularTotal().toFixed(2).replace('.', ',')}.`,
            acoesExecutadas: acoes
          };
        }
      }
    }

    // =========================================================================
    // 6. DÚVIDAS E PERGUNTAS FREQUENTES (RECOMENDAÇÕES, HORÁRIO, INGREDIENTES)
    // =========================================================================
    if (texto.includes('mais pedid') || texto.includes('mais vendid') || texto.includes('recomenda') || texto.includes('sugestao')) {
      return {
        resposta: `Nossos pratos campeões de pedidos são o suculento **Bife Acebolado com Batata Frita** (R$ 24,90) e a cremosa **Parmegiana de Frango** (R$ 27,90)! 🥩🍗\n\nSe preferir uma opção mais leve e saudável, o **Frango Grelhado com Legumes** (R$ 21,90) é perfeito! Qual deles te agrada mais?`,
        acoesExecutadas: acoes
      };
    }

    if (texto.includes('vegetariana') || texto.includes('sem carne') || texto.includes('opcao vegetariana') || texto.includes('vegan')) {
      const veg = CARDAPIO.find(p => p.id === 'marmita-vegetariana');
      return {
        resposta: `Temos uma opção deliciosa sem carne! 🥗\n\n🍛 **${veg.nome}** (R$ ${veg.preco.toFixed(2).replace('.', ',')}):\n${veg.descricao}\n\nVocê também pode pedir para trocar ou retirar ingredientes. Gostaria de adicionar uma marmita vegetariana?`,
        acoesExecutadas: acoes,
        cards: [veg]
      };
    }

    if (texto.includes('horario') || texto.includes('que horas abre') || texto.includes('que horas fecha') || texto.includes('funcionamento')) {
      return {
        resposta: `⏰ **Horário de Atendimento Marmitaê:**\n• De **Segunda a Sábado**, das **11:00 às 15:00**.\n• Aos Domingos descansamos para recarregar as energias!\n\nAs entregas saem quentinhas durante todo o horário de almoço. Posso anotar seu pedido? 😊`,
        acoesExecutadas: acoes
      };
    }

    if (texto.includes('taxa de entrega') || texto.includes('quanto e o frete') || texto.includes('valor do frete') || texto.includes('valor da entrega')) {
      return {
        resposta: `🛵 **Taxa de Entrega:**\n• Entrega em domicílio: taxa fixa de apenas **R$ 5,00** para qualquer bairro atendido!\n• Retirada no balcão: **Grátis (R$ 0,00)**!\n• Dica: use o cupom **FRETEGRATIS** no seu pedido para entrega sem custo! 🎟️`,
        acoesExecutadas: acoes
      };
    }

    if (texto.includes('onde fica') || texto.includes('endereco de voces') || texto.includes('localizacao') || texto.includes('onde retirar')) {
      return {
        resposta: `📍 O restaurante e balcão de retirada do **Marmitaê** fica na **Av. Central das Marmitas, nº 500 - Centro**.\nVocê pode escolher entrega em casa ou retirada rápida no balcão!`,
        acoesExecutadas: acoes
      };
    }

    if (texto.includes('formas de pagamento') || texto.includes('como posso pagar') || texto.includes('aceita cartao') || texto.includes('aceita pix')) {
      return {
        resposta: `💳 **Formas de Pagamento Aceitas:**\n• **PIX** (chave fornecida na confirmação)\n• **Cartão de Crédito ou Débito** na maquininha na entrega\n• **Dinheiro** (com troco se precisar)\n\nQual forma você prefere utilizar hoje?`,
        acoesExecutadas: acoes
      };
    }

    // =========================================================================
    // 7. CONSULTA DE CARDÁPIO GERAL OU DO DIA
    // =========================================================================
    if (
      texto.includes('cardapio') || texto.includes('opcoes') || texto.includes('opções') ||
      texto.includes('o que tem') || texto.includes('quais sao os pratos') || texto.includes('marmitas de hoje')
    ) {
      const diaAtual = getDiaAtual();
      const disponiveisHoje = consultarCardapio(diaAtual, 'marmitas');
      const nomeDia = DIAS_SEMANA_NOMES[diaAtual] || 'Hoje';

      return {
        resposta: `Hoje é **${nomeDia}** e preparamos estas opções fresquinhas para você no Marmitaê! Você pode clicar em **Pedir este** abaixo ou me dizer com suas próprias palavras:`,
        acoesExecutadas: acoes,
        cards: disponiveisHoje
      };
    }

    // =========================================================================
    // 8. CONSULTA DE BEBIDAS OU SOBREMESAS
    // =========================================================================
    if (texto.includes('bebida') && !texto.includes('adiciona') && !texto.includes('coloca') && !texto.includes('quero')) {
      const bebidas = CARDAPIO.filter(p => p.categoria === 'bebidas');
      return {
        resposta: `Temos essas bebidas bem geladinhas para acompanhar sua refeição:`,
        acoesExecutadas: acoes,
        cards: bebidas
      };
    }

    if (texto.includes('sobremesa') && !texto.includes('adiciona') && !texto.includes('coloca') && !texto.includes('quero')) {
      const doces = CARDAPIO.filter(p => p.categoria === 'sobremesas');
      return {
        resposta: `Para adoçar seu dia com muito sabor, temos estas sobremesas caseiras:`,
        acoesExecutadas: acoes,
        cards: doces
      };
    }

    // =========================================================================
    // 9. PERSONALIZAÇÃO DE ITEM JÁ EXISTENTE OU RECENTE
    // =========================================================================
    const ehPersonalizacaoIsolada = 
      (texto.includes('troca') || texto.includes('sem ') || texto.includes('tira ') || texto.includes('com ') || texto.includes('passado') || texto.includes('pure no lugar')) &&
      !texto.includes('marmita de') && !texto.includes('quero uma');

    if (ehPersonalizacaoIsolada && this.carrinho.itens.length > 0) {
      const personalizacoesExtraidas = this.extrairPersonalizacoes(raw);
      if (personalizacoesExtraidas.length > 0) {
        this.carrinho.personalizarItem(null, personalizacoesExtraidas);
        acoes.push({ tipo: 'personalizar_item', personalizacoes: personalizacoesExtraidas });
        return {
          resposta: `Perfeito! Anotei a personalização no seu prato: **${personalizacoesExtraidas.join(', ')}**. 👍\n\nDeseja adicionar uma bebida ou sobremesa para acompanhar?`,
          acoesExecutadas: acoes
        };
      }
    }

    // =========================================================================
    // 10. INCLUSÃO DE ITENS (Marmitas, Bebidas, Sobremesas)
    // =========================================================================
    const pedidosDetectados = this.detectarMultiplosPedidos(raw);
    if (pedidosDetectados.length > 0) {
      let respostasPartes = [];
      for (const itemPedido of pedidosDetectados) {
        const diaAtual = getDiaAtual();
        const estaDisponivelHoje = itemPedido.produto.diasDisponiveis.includes(diaAtual);

        if (!estaDisponivelHoje) {
          const alternativos = consultarCardapio(diaAtual, itemPedido.produto.categoria);
          return {
            resposta: `O prato **${itemPedido.produto.nome}** é especial de outros dias e não está disponível hoje (${DIAS_SEMANA_NOMES[diaAtual]}). 😔\n\nMas hoje temos pratos incríveis disponíveis! Veja as opções abaixo:`,
            acoesExecutadas: acoes,
            cards: alternativos
          };
        }

        this.carrinho.adicionarItem(
          itemPedido.produto.id,
          itemPedido.quantidade,
          itemPedido.personalizacoes,
          itemPedido.observacoes
        );
        this.ultimoItemMencionadoId = itemPedido.produto.id;
        acoes.push({ tipo: 'adicionar_item', produtoId: itemPedido.produto.id, quantidade: itemPedido.quantidade });

        let detalhePers = itemPedido.personalizacoes.length > 0 ? ` (${itemPedido.personalizacoes.join(', ')})` : '';
        respostasPartes.push(`${itemPedido.quantidade}x **${itemPedido.produto.nome}**${detalhePers}`);
      }

      const temBebida = this.carrinho.itens.some(i => i.categoria === 'bebidas');
      let sugestao = '';
      if (!temBebida) {
        this.aguardandoDado = 'sugestao';
        sugestao = `\n\nQue tal um **Suco natural** geladinho (R$ 7,00) ou um **Refrigerante lata** (R$ 6,00) para acompanhar?`;
      } else {
        const temSobremesa = this.carrinho.itens.some(i => i.categoria === 'sobremesas');
        if (!temSobremesa) {
          this.aguardandoDado = 'sugestao';
          sugestao = `\n\nPara fechar com chave de ouro, gostaria de um **Pudim** tradicional (R$ 7,00) de sobremesa?`;
        } else {
          this.aguardandoDado = null;
        }
      }

      return {
        resposta: `Excelente escolha! Adicionei ao seu pedido: ${respostasPartes.join(' e ')}. 😄${sugestao}`,
        acoesExecutadas: acoes
      };
    }

    // =========================================================================
    // 11. TIPO DE ENTREGA / RETIRADA
    // =========================================================================
    if (texto.includes('retirar') || texto.includes('retirada') || texto.includes('buscar no local') || texto.includes('passo ai') || texto.includes('pegar ai')) {
      this.carrinho.definirTipoEntrega('retirada');
      acoes.push({ tipo: 'definir_entrega', tipo: 'retirada' });
      return {
        resposta: `Combinado! Seu pedido será preparado para **retirada no balcão** do Marmitaê e a taxa de entrega ficou **grátis (R$ 0,00)**! 🛍️\n\nQual é o seu nome e qual será a forma de pagamento (PIX, Cartão ou Dinheiro)?`,
        acoesExecutadas: acoes
      };
    }

    if (texto.includes('entrega') || texto.includes('entregar') || texto.includes('rua') || texto.includes('av.') || texto.includes('avenida') || texto.includes('bairro')) {
      this.carrinho.definirTipoEntrega('entrega');
      this.checkout.setEndereco(raw);
      this.extrairNomeCliente(raw);
      acoes.push({ tipo: 'definir_entrega', tipo: 'entrega' });

      if (!this.checkout.cliente.formaPagamento) {
        return {
          resposta: `Anotado o endereço para entrega! 🛵 (Taxa de entrega fixa: R$ 5,00).\n\nQual será a forma de pagamento? Aceitamos **PIX**, **Cartão de Crédito/Débito** na entrega ou **Dinheiro** (se precisar de troco, me informe para quanto).`,
          acoesExecutadas: acoes
        };
      }
    }

    // =========================================================================
    // 12. FORMA DE PAGAMENTO ("vou pagar no pix", "cartao de credito", "dinheiro, troco pra 50")
    // =========================================================================
    if (texto.includes('pix') || texto.includes('dinheiro') || texto.includes('credito') || texto.includes('debito') || texto.includes('cartao')) {
      let troco = null;
      const matchTroco = texto.match(/troco\s*(?:para|pra)?\s*(?:r\$)?\s*(\d+)/i);
      if (matchTroco) {
        troco = parseFloat(matchTroco[1]);
      }

      if (texto.includes('pix')) this.checkout.setFormaPagamento('PIX');
      else if (texto.includes('dinheiro')) this.checkout.setFormaPagamento('Dinheiro', troco);
      else if (texto.includes('credito')) this.checkout.setFormaPagamento('Cartão de Crédito');
      else if (texto.includes('debito')) this.checkout.setFormaPagamento('Cartão de Débito');
      else this.checkout.setFormaPagamento('Cartão');

      acoes.push({ tipo: 'definir_pagamento', forma: this.checkout.cliente.formaPagamento });

      if (this.carrinho.tipoEntrega === 'entrega' && !this.checkout.cliente.endereco.rua) {
        this.aguardandoDado = 'endereco';
        return {
          resposta: `Forma de pagamento registrada como **${this.checkout.cliente.formaPagamento}**! 👍\n\nAgora só preciso do seu **nome** e **endereço de entrega** completo (rua, número e bairro) para calcularmos tudo.`,
          acoesExecutadas: acoes
        };
      }

      return this.gerarPromptResumoConfirmacao(acoes);
    }

    // =========================================================================
    // 13. CONSULTA DE VALOR / TOTAL / CARRINHO
    // =========================================================================
    if (texto.includes('quanto') || texto.includes('total') || texto.includes('carrinho') || texto.includes('valor')) {
      const estado = this.carrinho.obterEstado();
      if (estado.vazio) {
        return {
          resposta: 'Seu carrinho ainda está vazio! Que tal darmos uma olhada nas nossas marmitas de hoje para escolher uma refeição deliciosa? 🍲',
          acoesExecutadas: acoes
        };
      }

      const resumo = this.carrinho.gerarResumoTexto();
      return {
        resposta: `Aqui está o resumo do seu carrinho até o momento:\n\n${resumo}\n\nPodemos fechar o pedido ou quer adicionar mais alguma coisa?`,
        acoesExecutadas: acoes
      };
    }

    // =========================================================================
    // 14. FINALIZAÇÃO / CHECKOUT
    // =========================================================================
    if (texto.includes('finalizar') || texto.includes('fechar') || texto.includes('concluir') || texto.includes('tudo certo')) {
      return this.gerarPromptResumoConfirmacao(acoes);
    }

    // =========================================================================
    // 15. CUMPRIMENTOS E AGRADECIMENTOS
    // =========================================================================
    if (texto.includes('ola') || texto.includes('oi') || texto.includes('boa tarde') || texto.includes('bom dia') || texto.includes('boa noite')) {
      const saudacaoNome = this.checkout.cliente.nome ? `, **${this.checkout.cliente.nome}**` : '';
      return {
        resposta: `Olá${saudacaoNome}! Seja muito bem-vindo ao **Marmitaê**! 😄\nHoje temos pratos deliciosos feitos com tempero caseiro e ingredientes selecionados.\n\nVocê prefere opções com frango, carne bovina ou gostaria de conhecer nosso cardápio completo de hoje?`,
        acoesExecutadas: acoes
      };
    }

    if (texto.includes('obrigad') || texto.includes('valeu') || texto.includes('agradec')) {
      return {
        resposta: 'Por nada! Estou sempre aqui para te servir a melhor comida caseira com muito carinho. Precisando, é só chamar! 😄🍲',
        acoesExecutadas: acoes
      };
    }

    // =========================================================================
    // 16. RESPOSTAS CURTAS DE RECUSA OU PROSSEGUIMENTO ("não", "so isso", "pode ser")
    // =========================================================================
    const ehRecusaGenerica = /^(nao|não|n|nao quero|não quero|so isso|só isso|somente isso|sem sobremesa|sem bebida|mais nada|nada|deixa assim|deixa so|dispensa)$/i.test(texto);
    if (ehRecusaGenerica && this.carrinho.itens.length > 0) {
      return this.gerarPromptResumoConfirmacao(acoes, 'Combinado! Vamos prosseguir com os itens já adicionados. 👍');
    }

    // =========================================================================
    // 17. RESPOSTA PADRÃO ACOLHEDORA E CONTEXTUALIZADA
    // =========================================================================
    return {
      resposta: 'Entendido! Como posso te atender agora? Posso te apresentar o cardápio do dia, adicionar bebidas, personalizar marmitas, aplicar cupons ou fechar seu pedido! 😊',
      acoesExecutadas: acoes
    };
  }

  ehIntencaoDeMudancaGeral(texto) {
    return texto.includes('cancela') || texto.includes('cardapio') || texto.includes('marmita') || texto.includes('quero');
  }

  extrairNomeCliente(texto) {
    const match = texto.match(/(?:meu nome [eé]|sou o|sou a|me chamo|nome:\s*)\s*([a-zA-ZÀ-ÿ]+)/i);
    if (match) {
      const nomeFormatado = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
      this.checkout.setNomeCliente(nomeFormatado);
    }
  }

  detectarMultiplosPedidos(texto) {
    const pedidos = [];
    const textoNorm = texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    if (textoNorm.includes('uma de carne') && textoNorm.includes('outra de frango')) {
      const bife = CARDAPIO.find(p => p.id === 'marmita-bife-acebolado');
      const frango = CARDAPIO.find(p => p.id === 'marmita-frango-grelhado');
      if (bife) pedidos.push({ produto: bife, quantidade: 1, personalizacoes: [], observacoes: '' });
      if (frango) pedidos.push({ produto: frango, quantidade: 1, personalizacoes: [], observacoes: '' });
      return pedidos;
    }

    for (const prod of CARDAPIO) {
      let encontrou = false;

      if (prod.id === 'marmita-bife-acebolado' && (textoNorm.includes('bife') || textoNorm.includes('acebolado') || textoNorm.includes('carne bovina'))) {
        encontrou = true;
      } else if (prod.id === 'marmita-frango-grelhado' && (textoNorm.includes('frango grelhado') || (textoNorm.includes('frango') && !textoNorm.includes('strogonoff') && !textoNorm.includes('parmegiana')))) {
        encontrou = true;
      } else if (prod.id === 'marmita-strogonoff-frango' && (textoNorm.includes('strog') || textoNorm.includes('estrog'))) {
        encontrou = true;
      } else if (prod.id === 'marmita-carne-panela' && (textoNorm.includes('panela') || textoNorm.includes('carne cozida'))) {
        encontrou = true;
      } else if (prod.id === 'marmita-parmegiana-frango' && textoNorm.includes('parmeg')) {
        encontrou = true;
      } else if (prod.id === 'marmita-vegetariana' && (textoNorm.includes('vegetar') || textoNorm.includes('omelete'))) {
        encontrou = true;
      } else if (prod.id === 'refri-lata-350ml' && (textoNorm.includes('coca') || textoNorm.includes('guarana') || textoNorm.includes('refrigerante lata') || textoNorm.includes('refri lata'))) {
        encontrou = true;
      } else if (prod.id === 'refri-600ml' && (textoNorm.includes('600ml') || textoNorm.includes('600 ml'))) {
        encontrou = true;
      } else if (prod.id === 'suco-natural-300ml' && textoNorm.includes('suco')) {
        encontrou = true;
      } else if (prod.id === 'agua-mineral-500ml' && textoNorm.includes('agua')) {
        encontrou = true;
      } else if (prod.id === 'pudim-tradicional' && textoNorm.includes('pudim')) {
        encontrou = true;
      } else if (prod.id === 'mousse-maracuja' && textoNorm.includes('mousse')) {
        encontrou = true;
      } else if (prod.id === 'brigadeiro-gourmet' && textoNorm.includes('brigadeiro')) {
        encontrou = true;
      }

      if (encontrou) {
        let qtd = 1;
        const matchQtd = textoNorm.match(new RegExp(`(\\d+|uma?|duas?|tres|quatro)\\s*(?:marmitas?\\s*|unidades?\\s*|latas?\\s*)?(?:de\\s*)?${prod.nome.split(' ')[0].toLowerCase()}`, 'i'));
        if (matchQtd) {
          const val = matchQtd[1];
          if (val === 'uma' || val === 'um' || val === '1') qtd = 1;
          else if (val === 'duas' || val === 'dois' || val === '2') qtd = 2;
          else if (val === 'tres' || val === '3') qtd = 3;
          else if (val === 'quatro' || val === '4') qtd = 4;
          else qtd = parseInt(val, 10) || 1;
        }

        const personalizacoes = this.extrairPersonalizacoes(texto);
        pedidos.push({
          produto: prod,
          quantidade: qtd,
          personalizacoes,
          observacoes: ''
        });
      }
    }

    return pedidos;
  }

  extrairPersonalizacoes(texto) {
    const list = [];
    const t = texto.toLowerCase();

    if (t.includes('sem cebola')) list.push('Sem cebola');
    if (t.includes('sem feijao') || t.includes('sem feijão')) list.push('Sem feijão');
    if (t.includes('sem arroz')) list.push('Sem arroz');
    if (t.includes('sem alho')) list.push('Sem alho');
    if (t.includes('pouco sal')) list.push('Pouco sal');
    if (t.includes('bem passado') || t.includes('bem passada')) list.push('Bife bem passado');
    if (t.includes('ao ponto')) list.push('Ao ponto');
    if (t.includes('mal passado')) list.push('Mal passado');
    if (t.includes('pure no lugar da batata') || t.includes('troca a batata por pure') || t.includes('troca a batata por purê')) {
      list.push('Purê no lugar da batata frita');
    }
    if (t.includes('salada no lugar da batata')) list.push('Salada no lugar da batata');
    if (t.includes('coca zero')) list.push('Coca-Cola Zero');
    if (t.includes('mais molho')) list.push('Mais molho');

    return list;
  }

  gerarPromptResumoConfirmacao(acoes, mensagemPrefacio = '') {
    const estado = this.carrinho.obterEstado();
    if (estado.vazio) {
      return {
        resposta: 'Seu carrinho ainda está vazio. Escolha pelo menos uma marmita ou bebida para fecharmos seu pedido!',
        acoesExecutadas: acoes
      };
    }

    const pendencias = this.checkout.obterPendencias();

    // 1. Falta o Nome
    if (pendencias.includes('nome')) {
      this.aguardandoDado = 'nome';
      const pref = mensagemPrefacio ? `${mensagemPrefacio}\n\n` : '';
      return {
        resposta: `${pref}Ótimo! Antes de fecharmos o resumo, **como posso te chamar?** (Informe seu nome por favor).`,
        acoesExecutadas: acoes
      };
    }

    // 2. Falta o Endereço (se for entrega)
    if (pendencias.includes('endereco') && this.carrinho.tipoEntrega === 'entrega') {
      this.aguardandoDado = 'endereco';
      const pref = mensagemPrefacio ? `${mensagemPrefacio}\n\n` : '';
      return {
        resposta: `${pref}Maravilha, **${this.checkout.cliente.nome}**! Por favor, me informe o **endereço de entrega** completo (Rua, Número e Bairro). 🛵`,
        acoesExecutadas: acoes
      };
    }

    // 3. Falta a Forma de Pagamento
    if (pendencias.includes('formaPagamento')) {
      this.aguardandoDado = 'formaPagamento';
      const pref = mensagemPrefacio ? `${mensagemPrefacio}\n\n` : '';
      return {
        resposta: `${pref}Perfeito, **${this.checkout.cliente.nome}**! Como você gostaria de realizar o pagamento? Aceitamos:\n• **PIX**\n• **Cartão de Crédito ou Débito** na entrega\n• **Dinheiro** (informe se precisar de troco)`,
        acoesExecutadas: acoes
      };
    }

    // Tudo preenchido! Apresenta o resumo para conferência
    this.aguardandoDado = null;
    this.checkout.aguardandoConfirmacaoFinal = true;
    const resumo = this.checkout.gerarResumoCompleto();

    let linhaCupom = '';
    if (resumo.cupom) {
      linhaCupom = `Cupom aplicado: **${resumo.cupom.codigo}** (-R$ ${resumo.desconto.toFixed(2).replace('.', ',')})\n`;
    }

    const pref = mensagemPrefacio ? `${mensagemPrefacio}\n\n` : '';
    const textoResumo = `${pref}Fechando seu pedido! 😄\n\n**Resumo do Pedido:**\n${resumo.itensTexto}\n\nSubtotal: R$ ${resumo.subtotal.toFixed(2).replace('.', ',')}\n${linhaCupom}Taxa: R$ ${resumo.taxaEntrega.toFixed(2).replace('.', ',')}\n**Total: R$ ${resumo.total.toFixed(2).replace('.', ',')}**\n\n**Forma de Pagamento:** ${resumo.infoPagamento}\n**${resumo.infoEntrega}**\n\nEstá tudo certinho? **Posso confirmar seu pedido?** (Responda "Sim" para confirmar)`;

    return {
      resposta: textoResumo,
      acoesExecutadas: acoes
    };
  }
}
