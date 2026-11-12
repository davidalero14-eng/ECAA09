/**
 * Marmitaê - Motor Determinístico de Atendimento (Modo Demonstração)
 * Simula um agente conversacional robusto sem necessitar de chave de API externa.
 * Interpreta linguagem natural por regex/regras semânticas, manipula carrinho,
 * gerencia contexto da conversa, personalizações e etapas de checkout.
 */

import { CARDAPIO, consultarCardapio, buscarProdutoPorNome, buscarProdutoPorId, getDiaAtual, DIAS_SEMANA_NOMES } from './menu.js';
import { FORMAS_PAGAMENTO } from './checkout.js';

export class DeterministicAgent {
  constructor(carrinho, checkout) {
    this.carrinho = carrinho;
    this.checkout = checkout;
    this.ultimoItemMencionadoId = null;
  }

  reset() {
    this.ultimoItemMencionadoId = null;
  }

  /**
   * Processa a mensagem do cliente e retorna a resposta com ações executadas.
   * @param {string} mensagemTexto
   * @returns {{ resposta: string, acoesExecutadas: Array }}
   */
  processarMensagem(mensagemTexto) {
    const raw = mensagemTexto.trim();
    const texto = raw.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const acoes = [];

    // 1. CONFIRMAÇÃO FINAL DE PEDIDO
    if (this.checkout.aguardandoConfirmacaoFinal) {
      if (/^(sim|s|confirmo|pode confirmar|pode fechar|ta certo|tá certo|isso|bora|fechar|ok)$/i.test(texto) ||
          texto.includes('pode confirmar') || texto.includes('pode fechar') || texto.includes('esta certo') || texto.includes('esta correto')) {
        const resultado = this.checkout.confirmarEFinalizar();
        if (resultado.sucesso) {
          const ped = resultado.pedido;
          acoes.push({ tipo: 'pedido_finalizado', dados: ped });
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
          resposta: 'Sem problemas! O que você gostaria de alterar no seu pedido? Posso trocar itens, quantidades ou acompanhamentos.',
          acoesExecutadas: acoes
        };
      }
    }

    // 2. MUDANÇA DE QUANTIDADE ("na verdade quero 3", "muda para duas", "quero mais uma")
    const matchMudaQtd = texto.match(/(?:na verdade\s+)?(?:quero|muda|altera|troca|coloca)?\s*(?:para\s+)?(\d+|uma?|duas?|tres|quatro|cinco)\s*(?:marmitas?|unidades?|itens?)?/i);
    const querMaisUma = texto.includes('mais uma') || texto.includes('quero outra') || texto.includes('adiciona mais um');
    
    if (querMaisUma && this.ultimoItemMencionadoId) {
      const prod = buscarProdutoPorId(this.ultimoItemMencionadoId);
      if (prod) {
        this.carrinho.incrementarQuantidade(this.ultimoItemMencionadoId, 1);
        acoes.push({ tipo: 'adicionar_item', produtoId: prod.id });
        return {
          resposta: `Adicionei mais uma marmita de **${prod.nome}** ao seu carrinho! 🛍️\n\nQuer escolher uma bebida para acompanhar ou gostaria de ver o valor atual?`,
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

    // 3. REMOÇÃO DE ITEM ("cancela a bebida", "tira o refrigerante", "remove o pudim")
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

    // 4. CONSULTA DE CARDÁPIO GERAL OU DO DIA
    if (
      texto.includes('cardapio') || texto.includes('opcoes') || texto.includes('opções') ||
      texto.includes('o que tem') || texto.includes('quais sao os pratos') || texto.includes('marmitas de hoje')
    ) {
      const diaAtual = getDiaAtual();
      const disponiveisHoje = consultarCardapio(diaAtual, 'marmitas');
      const nomeDia = DIAS_SEMANA_NOMES[diaAtual] || 'Hoje';

      let textoResp = `Hoje é **${nomeDia}** e temos essas delícias fresquinhas saindo no Marmitaê:\n\n`;
      disponiveisHoje.forEach(p => {
        textoResp += `🍛 **${p.nome}** - R$ ${p.preco.toFixed(2).replace('.', ',')}\n   ${p.descricao}\n`;
      });
      textoResp += `\nQual dessas te deu mais água na boca? Se preferir, você também pode personalizar ingredientes e acompanhamentos! 😄`;
      return { resposta: textoResp, acoesExecutadas: acoes };
    }

    // 5. CONSULTA DE BEBIDAS OU SOBREMESAS
    if (texto.includes('bebida') && !texto.includes('adiciona') && !texto.includes('coloca') && !texto.includes('quero')) {
      const bebidas = CARDAPIO.filter(p => p.categoria === 'bebidas');
      let resp = `Temos essas bebidas bem geladinhas para acompanhar sua marmita:\n\n`;
      bebidas.forEach(b => {
        resp += `🥤 **${b.nome}** - R$ ${b.preco.toFixed(2).replace('.', ',')} (${b.descricao})\n`;
      });
      resp += `\nGostaria de incluir alguma no seu pedido?`;
      return { resposta: resp, acoesExecutadas: acoes };
    }

    if (texto.includes('sobremesa') && !texto.includes('adiciona') && !texto.includes('coloca') && !texto.includes('quero')) {
      const doces = CARDAPIO.filter(p => p.categoria === 'sobremesas');
      let resp = `Para adoçar o seu dia, temos sobremesas caseiras deliciosas:\n\n`;
      doces.forEach(d => {
        resp += `🍮 **${d.nome}** - R$ ${d.preco.toFixed(2).replace('.', ',')} (${d.descricao})\n`;
      });
      resp += `\nQual você vai querer?`;
      return { resposta: resp, acoesExecutadas: acoes };
    }

    // 6. PERSONALIZAÇÃO DE ITEM JÁ EXISTENTE OU RECENTE
    // Ex: "troca a batata por pure", "sem cebola", "bem passado", "tira a cebola"
    const ehPersonalizacaoIsolada = 
      (texto.includes('troca') || texto.includes('sem ') || texto.includes('tira ') || texto.includes('com ') || texto.includes('passado') || texto.includes('pure no lugar')) &&
      !texto.includes('marmita de') && !texto.includes('quero uma');

    if (ehPersonalizacaoIsolada && this.carrinho.itens.length > 0) {
      const personalizacoesExtraidas = this.extrairPersonalizacoes(raw);
      if (personalizacoesExtraidas.length > 0) {
        this.carrinho.personalizarItem(null, personalizacoesExtraidas);
        acoes.push({ tipo: 'personalizar_item', personalizacoes: personalizacoesExtraidas });
        return {
          resposta: `Perfeito! Anotei a personalização no seu pedido: **${personalizacoesExtraidas.join(', ')}**. 👍\n\nDeseja adicionar uma bebida ou sobremesa para acompanhar?`,
          acoesExecutadas: acoes
        };
      }
    }

    // 7. INCLUSÃO DE ITENS (Marmitas, Bebidas, Sobremesas)
    // Detecta quantidade ("duas de bife", "uma de frango", "me ve uma de carne e outra de frango")
    const pedidosDetectados = this.detectarMultiplosPedidos(raw);
    if (pedidosDetectados.length > 0) {
      let respostasPartes = [];
      for (const itemPedido of pedidosDetectados) {
        // Verifica disponibilidade do dia
        const diaAtual = getDiaAtual();
        const estaDisponivelHoje = itemPedido.produto.diasDisponiveis.includes(diaAtual);

        if (!estaDisponivelHoje) {
          const alternativos = consultarCardapio(diaAtual, itemPedido.produto.categoria);
          const nomesAlt = alternativos.map(a => a.nome).join(', ');
          return {
            resposta: `O prato **${itemPedido.produto.nome}** é especial de outros dias e não está disponível hoje (${DIAS_SEMANA_NOMES[diaAtual]}). 😔\n\nMas hoje temos opções maravilhosas como: **${nomesAlt}**!\nQual delas você prefere?`,
            acoesExecutadas: acoes
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

      // Sugestão de venda cruzada inteligente (se não pediu bebida, sugere; se não pediu sobremesa, sugere)
      const temBebida = this.carrinho.itens.some(i => i.categoria === 'bebidas');
      let sugestao = '';
      if (!temBebida) {
        sugestao = `\n\nQue tal um **Suco natural** geladinho (R$ 7,00) ou um **Refrigerante lata** (R$ 6,00) para acompanhar?`;
      } else {
        sugestao = `\n\nPara fechar com chave de ouro, gostaria de um **Pudim** caseiro (R$ 7,00) de sobremesa?`;
      }

      return {
        resposta: `Excelente escolha! Adicionei ao seu pedido: ${respostasPartes.join(' e ')}. 😄${sugestao}`,
        acoesExecutadas: acoes
      };
    }

    // 8. TIPO DE ENTREGA / RETIRADA
    if (texto.includes('retirar') || texto.includes('retirada') || texto.includes('buscar no local') || texto.includes('passo ai')) {
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
      // Extrai nome se fornecido
      this.extrairNomeCliente(raw);
      acoes.push({ tipo: 'definir_entrega', tipo: 'entrega' });

      if (!this.checkout.cliente.formaPagamento) {
        return {
          resposta: `Anotado o endereço para entrega! 🛵 (Taxa de entrega: R$ 5,00).\n\nQual será a forma de pagamento? Aceitamos **PIX**, **Cartão de Crédito/Débito** na entrega ou **Dinheiro** (se precisar de troco, me avise o valor).`,
          acoesExecutadas: acoes
        };
      }
    }

    // 9. FORMA DE PAGAMENTO ("vou pagar no pix", "cartao de credito", "dinheiro, troco pra 50")
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

      // Se ainda não tiver endereço
      if (this.carrinho.tipoEntrega === 'entrega' && !this.checkout.cliente.endereco.rua) {
        return {
          resposta: `Forma de pagamento registrada como **${this.checkout.cliente.formaPagamento}**! 👍\n\nAgora só preciso do seu **nome completo** e **endereço de entrega** (rua, número e bairro) para calcularmos tudo.`,
          acoesExecutadas: acoes
        };
      }

      // Se já tiver tudo, apresenta o resumo prévio
      return this.gerarPromptResumoConfirmacao(acoes);
    }

    // 10. CONSULTA DE VALOR / TOTAL / CARRINHO ("quanto ficou", "qual o total", "ver meu carrinho")
    if (texto.includes('quanto') || texto.includes('total') || texto.includes('carrinho') || texto.includes('valor')) {
      const estado = this.carrinho.obterEstado();
      if (estado.vazio) {
        return {
          resposta: 'Seu carrinho ainda está vazio! Que tal darmos uma olhada no cardápio de hoje para escolher uma refeição deliciosa? 🍲',
          acoesExecutadas: acoes
        };
      }

      const resumo = this.carrinho.gerarResumoTexto();
      return {
        resposta: `Aqui está o resumo do seu carrinho até o momento:\n\n${resumo}\n\nPodemos fechar o pedido ou quer adicionar mais alguma coisa?`,
        acoesExecutadas: acoes
      };
    }

    // 11. FINALIZAÇÃO / CHECKOUT ("quero finalizar", "fecha o pedido", "pode mandar")
    if (texto.includes('finalizar') || texto.includes('fechar') || texto.includes('concluir') || texto.includes('tudo certo')) {
      return this.gerarPromptResumoConfirmacao(acoes);
    }

    // 12. CUMPRIMENTOS INICIAIS
    if (texto.includes('ola') || texto.includes('oi') || texto.includes('boa tarde') || texto.includes('bom dia') || texto.includes('boa noite')) {
      return {
        resposta: 'Olá! Seja muito bem-vindo ao Marmitaê! 😄 Hoje temos pratos deliciosos feitos com ingredientes frescos e tempero caseiro.\n\nVocê prefere opções com frango, carne bovina ou gostaria de conhecer nosso cardápio completo de hoje?',
        acoesExecutadas: acoes
      };
    }

    // Resposta padrão contextualizada
    return {
      resposta: 'Entendido! Posso te ajudar a escolher uma marmita saborosa, adicionar bebidas ou personalizar seu prato. Deseja ver as opções de hoje ou adicionar algum item ao carrinho? 😊',
      acoesExecutadas: acoes
    };
  }

  /**
   * Extrai nome de clientes de frases naturais
   */
  extrairNomeCliente(texto) {
    const match = texto.match(/(?:meu nome [eé]|sou o|sou a|me chamo|nome:\s*)\s*([a-zA-ZÀ-ÿ]+)/i);
    if (match) {
      this.checkout.setNomeCliente(match[1]);
    }
  }

  /**
   * Identifica pedidos múltiplos ou individuais com suas personalizações
   */
  detectarMultiplosPedidos(texto) {
    const pedidos = [];
    const textoNorm = texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    // Padrões específicos de múltiplos pratos na mesma mensagem
    // Ex: "uma de carne e outra de frango", "duas marmitas de bife"
    if (textoNorm.includes('uma de carne') && textoNorm.includes('outra de frango')) {
      const bife = CARDAPIO.find(p => p.id === 'marmita-bife-acebolado');
      const frango = CARDAPIO.find(p => p.id === 'marmita-frango-grelhado');
      if (bife) pedidos.push({ produto: bife, quantidade: 1, personalizacoes: [], observacoes: '' });
      if (frango) pedidos.push({ produto: frango, quantidade: 1, personalizacoes: [], observacoes: '' });
      return pedidos;
    }

    // Procura por produtos individuais
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

  /**
   * Extrai preferências de preparo e substituições
   */
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

  /**
   * Gera a mensagem do resumo e solicita a confirmação explícita.
   */
  gerarPromptResumoConfirmacao(acoes) {
    const estado = this.carrinho.obterEstado();
    if (estado.vazio) {
      return {
        resposta: 'Seu carrinho ainda está vazio. Escolha pelo menos uma marmita ou bebida para fecharmos seu pedido!',
        acoesExecutadas: acoes
      };
    }

    const pendencias = this.checkout.obterPendencias();

    // Se faltar dados vitais, solicita um de cada vez sem sobrecarregar
    if (pendencias.includes('nome')) {
      return {
        resposta: 'Ótimo! Antes de fecharmos o resumo, **como posso te chamar?** (Informe seu nome por favor).',
        acoesExecutadas: acoes
      };
    }

    if (pendencias.includes('endereco') && this.carrinho.tipoEntrega === 'entrega') {
      return {
        resposta: `Maravilha, ${this.checkout.cliente.nome}! Por favor, me informe o **endereço de entrega** completo (Rua, Número e Bairro).`,
        acoesExecutadas: acoes
      };
    }

    if (pendencias.includes('formaPagamento')) {
      return {
        resposta: `Perfeito! Como você gostaria de realizar o pagamento? Aceitamos:\n• **PIX**\n• **Cartão de Crédito ou Débito** na entrega\n• **Dinheiro** (informe se precisar de troco)`,
        acoesExecutadas: acoes
      };
    }

    // Tudo pronto para conferência!
    this.checkout.aguardandoConfirmacaoFinal = true;
    const resumo = this.checkout.gerarResumoCompleto();

    const textoResumo = `Fechando seu pedido! 😄\n\n**Resumo do Pedido:**\n${resumo.itensTexto}\n\nSubtotal: R$ ${resumo.subtotal.toFixed(2).replace('.', ',')}\nTaxa: R$ ${resumo.taxaEntrega.toFixed(2).replace('.', ',')}\n**Total: R$ ${resumo.total.toFixed(2).replace('.', ',')}**\n\n**Forma de Pagamento:** ${resumo.infoPagamento}\n**${resumo.infoEntrega}**\n\nEstá tudo certinho? **Posso confirmar seu pedido?** (Responda "Sim" para confirmar)`;

    return {
      resposta: textoResumo,
      acoesExecutadas: acoes
    };
  }
}
