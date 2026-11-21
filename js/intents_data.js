/**
 * Marmitaê - Base de Intenções para Classificação Semântica Vetorial (TF-IDF + Cosseno)
 * 100% estático e síncrono em memória (Client-Side), zero fetch, zero backend.
 */

export const BASE_INTENCOES = [
  {
    tag: 'consultar_cardapio',
    exemplos: [
      'qual o cardapio de hoje',
      'me mostra o menu',
      'quais os pratos disponiveis',
      'o que voces tem pra hoje',
      'quais sao as marmitas do dia',
      'gostaria de ver o cardapio completo',
      'quero olhar as opcoes de comida',
      'cardapio por favor',
      'quais opcoes voces servem hoje'
    ],
    acao: 'consultar_cardapio',
    resposta: 'Aqui estão as nossas deliciosas opções preparadas para hoje no Marmitaê! Você pode clicar em **Pedir este** em qualquer card ou me pedir diretamente:'
  },
  {
    tag: 'recomendar_prato',
    exemplos: [
      'o que voce recomenda',
      'qual o prato mais vendido',
      'qual a marmita mais pedida',
      'qual e a melhor marmita',
      'sugestao do chef',
      'qual prato sai mais',
      'me indica alguma coisa gostosa',
      'qual o mais saboroso'
    ],
    resposta: 'Nossos campeões de pedidos são o suculento **Bife Acebolado com Batata Frita** (R$ 24,90) e a cremosa **Parmegiana de Frango** (R$ 27,90)! 🥩🍗\n\nSe preferir uma opção saudável e equilibrada, nosso **Frango Grelhado com Legumes** (R$ 21,90) é perfeito! Qual deles te agrada mais?'
  },
  {
    tag: 'opcao_vegetariana',
    exemplos: [
      'tem comida vegetariana',
      'opcao sem carne',
      'prato vegetariano disponivel',
      'tem marmita fit ou legumes',
      'sou vegetariano o que posso comer',
      'tem prato vegano ou com ovo'
    ],
    acao: 'consultar_vegetariana',
    resposta: 'Com certeza! Temos a nossa deliciosa **Marmita Vegetariana** com omelete fresquinho, feijão especial, arroz e mix de legumes por apenas **R$ 21,90**. Uma refeição completa e saborosa!'
  },
  {
    tag: 'consultar_bebidas',
    exemplos: [
      'quais sao as bebidas',
      'o que tem de beber',
      'tem refrigerante e suco',
      'quais sucos voces tem',
      'tem coca cola gelada',
      'me mostra as bebidas disponiveis',
      'tem agua mineral'
    ],
    acao: 'consultar_bebidas',
    resposta: 'Temos bebidas geladinhas para acompanhar sua refeição:\n• **Refrigerante lata 350ml** - R$ 6,00\n• **Suco natural 300ml** - R$ 7,00\n• **Água mineral 500ml** - R$ 3,50\n• **Refrigerante 600ml** - R$ 8,00'
  },
  {
    tag: 'consultar_sobremesas',
    exemplos: [
      'tem sobremesa hoje',
      'quais os doces',
      'tem pudim ou brigadeiro',
      'quero ver as sobremesas',
      'tem mousse de sobremesa',
      'quais doces voces servem'
    ],
    acao: 'consultar_sobremesas',
    resposta: 'Para adoçar seu dia com muito carinho, temos sobremesas caseiras imperdíveis:\n• **Pudim tradicional de leite condensado** - R$ 7,00\n• **Mousse aerado de maracujá** - R$ 6,50\n• **Brigadeiro artesanal gourmet** - R$ 4,00'
  },
  {
    tag: 'consultar_cupons',
    exemplos: [
      'tem algum cupom de desconto',
      'quais os cupons ativos',
      'como consigo desconto',
      'tem promocao hoje',
      'qual o codigo do cupom',
      'como pagar menos'
    ],
    resposta: 'Temos cupons imperdíveis ativos hoje no Marmitaê! 🎟️\n\n• **PRIMEIRACOMPRA**: R$ 5,00 de desconto no seu pedido!\n• **MARMITAE10**: 10% de desconto nos pratos!\n• **FRETEGRATIS**: Isenção total da taxa de entrega!\n\nPara aplicar, basta me dizer: *"Aplica o cupom PRIMEIRACOMPRA"*!'
  },
  {
    tag: 'horario_funcionamento',
    exemplos: [
      'qual o horario de funcionamento',
      'que horas voces abrem',
      'ate que horas entrega',
      'funciona de noite ou sabado',
      'qual o horario de entrega das marmitas',
      'esta aberto agora'
    ],
    resposta: 'Nosso horário de funcionamento para almoço é de **Segunda a Sábado, das 11h00 às 15h00**! Aos domingos nosso restaurante é fechado para descanso da equipe. ⏰'
  },
  {
    tag: 'taxa_entrega_localizacao',
    exemplos: [
      'quanto custa a entrega',
      'qual o valor do frete',
      'quanto cobra para entregar',
      'onde fica o restaurante de voces',
      'onde e o endereco para retirar',
      'qual o preco da entrega'
    ],
    resposta: 'Nossa taxa de entrega é fixa em **R$ 5,00** para toda a região! 🛵\nE se preferir **retirar no nosso balcão**, a taxa é **100% grátis (R$ 0,00)**! Nosso balcão fica na Rua Central, 450 - Centro.'
  },
  {
    tag: 'cancelar_limpar_carrinho',
    exemplos: [
      'quero cancelar tudo',
      'limpar meu carrinho',
      'apagar meu pedido',
      'comecar de novo do zero',
      'desistir da compra',
      'esvaziar carrinho'
    ],
    acao: 'limpar_carrinho',
    resposta: 'Prontinho! Esvaziei seu carrinho e reiniciei seu atendimento. Quando quiser, é só me dizer qual refeição deliciosa você gostaria de montar! 😄'
  },
  {
    tag: 'agradecimento',
    exemplos: [
      'muito obrigado valeu',
      'agradecido pelo atendimento',
      'otimo atendimento obrigado',
      'show valeu',
      'valeu demais',
      'obrigado pela ajuda'
    ],
    resposta: 'Por nada! Estou sempre aqui para te servir a melhor comida caseira com rapidez, latência zero e total carinho. Bom apetite! 😄🍲'
  }
];
