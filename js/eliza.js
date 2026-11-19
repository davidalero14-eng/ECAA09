/**
 * Marmitaê - Implementação Clássica do Algoritmo ELIZA
 * Baseado no trabalho original de Joseph Weizenbaum (1966)
 * Adaptado para português brasileiro e contexto de restaurante de marmitas
 * 100% Client-Side, sem dependências externas
 */

// ============================================================================
// REFLEXÃO DE PRONOMES E EXPRESSÕES (Português Brasileiro)
// ============================================================================
const REFLEXOES = [
  // Primeira pessoa → Segunda pessoa
  { padrao: /\beu\b/gi, substituicao: 'você' },
  { padrao: /\bmeu\b/gi, substituicao: 'seu' },
  { padrao: /\bminha\b/gi, substituicao: 'sua' },
  { padrao: /\bmeus\b/gi, substituicao: 'seus' },
  { padrao: /\bminhas\b/gi, substituicao: 'suas' },
  { padrao: /\bcomigo\b/gi, substituicao: 'com você' },
  { padrao: /\bpara mim\b/gi, substituicao: 'para você' },
  { padrao: /\bem mim\b/gi, substituicao: 'em você' },
  { padrao: /\bme\b/gi, substituicao: 'te' },
  { padrao: /\bnos\b/gi, substituicao: 'vocês' },
  { padrao: /\bnosso\b/gi, substituicao: 'seu' },
  { padrao: /\bnossa\b/gi, substituicao: 'sua' },
  { padrao: /\bnossos\b/gi, substituicao: 'seus' },
  { padrao: /\bnossas\b/gi, substituicao: 'suas' },

  // Segunda pessoa → Primeira pessoa (para reflexão inversa quando necessário)
  { padrao: /\bvocê\b/gi, substituicao: 'eu' },
  { padrao: /\bseu\b/gi, substituicao: 'meu' },
  { padrao: /\bsua\b/gi, substituicao: 'minha' },
  { padrao: /\bseus\b/gi, substituicao: 'meus' },
  { padrao: /\bsuas\b/gi, substituicao: 'minhas' },
  { padrao: /\bcom você\b/gi, substituicao: 'comigo' },
  { padrao: /\bpara você\b/gi, substituicao: 'para mim' },
  { padrao: /\bem você\b/gi, substituicao: 'em mim' },
  { padrao: /\bte\b/gi, substituicao: 'me' },
  { padrao: /\bvocês\b/gi, substituicao: 'nós' },

  // Verbos - primeira pessoa → terceira pessoa
  { padrao: /\bestou\b/gi, substituicao: 'está' },
  { padrao: /\bsou\b/gi, substituicao: 'é' },
  { padrao: /\btenho\b/gi, substituicao: 'tem' },
  { padrao: /\bquero\b/gi, substituicao: 'quer' },
  { padrao: /\bgosto\b/gi, substituicao: 'gosta' },
  { padrao: /\bpreciso\b/gi, substituicao: 'precisa' },
  { padrao: /\bvou\b/gi, substituicao: 'vai' },
  { padrao: /\bpenso\b/gi, substituicao: 'pensa' },
  { padrao: /\bsinto\b/gi, substituicao: 'sente' },
  { padrao: /\bsei\b/gi, substituicao: 'sabe' },
  { padrao: /\bposso\b/gi, substituicao: 'pode' },
  { padrao: /\bdevo\b/gi, substituicao: 'deve' },

  // Verbos - terceira pessoa → primeira pessoa
  { padrao: /\besta\b/gi, substituicao: 'estou' },
  { padrao: /\btem\b/gi, substituicao: 'tenho' },
  { padrao: /\bquer\b/gi, substituicao: 'quero' },
  { padrao: /\bgosta\b/gi, substituicao: 'gosto' },
  { padrao: /\bprecisa\b/gi, substituicao: 'preciso' },
  { padrao: /\bvai\b/gi, substituicao: 'vou' },
  { padrao: /\bpensa\b/gi, substituicao: 'penso' },
  { padrao: /\bsente\b/gi, substituicao: 'sinto' },
  { padrao: /\bsabe\b/gi, substituicao: 'sei' },
  { padrao: /\bpode\b/gi, substituicao: 'posso' },
  { padrao: /\bdeve\b/gi, substituicao: 'devo' },

  // Negação
  { padrao: /\bnão\b/gi, substituicao: 'não' },
  { padrao: /\bnao\b/gi, substituicao: 'não' },
  { padrao: /\bnem\b/gi, substituicao: 'nem' },

  // Temporais
  { padrao: /\bhoje\b/gi, substituicao: 'hoje' },
  { padrao: /\bamanha\b/gi, substituicao: 'amanhã' },
  { padrao: /\bontem\b/gi, substituicao: 'ontem' },
  { padrao: /\bagora\b/gi, substituicao: 'agora' },
  { padrao: /\bdepois\b/gi, substituicao: 'depois' },
  { padrao: /\bantes\b/gi, substituicao: 'antes' },
];

// ============================================================================
// RESPOSTAS GENÉRICAS (Fallback quando nenhum padrão casa)
// ============================================================================
const RESPOSTAS_GENERICAS = [
  'Entendo. Conte-me mais sobre isso.',
  'Interessante. Como isso te faz sentir?',
  'Por que você diz isso?',
  'Pode elaborar um pouco mais?',
  'O que mais você pensa sobre isso?',
  'Hum, entendi. E o que mais?',
  'Isso é importante para você?',
  'Como você lidaria com essa situação?',
  'O que você faria no meu lugar?',
  'Por que você acha que isso acontece?',
];

// ============================================================================
// BASE DE CONHECIMENTO ELIZA - PADRÕES DE CONVERSAÇÃO
// ============================================================================
// Cada entrada: { keyword, prioridade, decomposicoes }
// decomposicoes: array de { padrao: RegExp, remontagens: string[] }

const CONHECIMENTO_ELIZA = [
  // ------------------------------------------------------------
  // PALAVRAS-CHAVE DE SAUDAÇÃO E INÍCIO
  // ------------------------------------------------------------
  {
    keyword: 'ola',
    prioridade: 10,
    decomposicoes: [
      {
        padrao: /^(?:ola|oi|opa|e ai|eae|tudo bem|como vai|beleza)(?:\s.*)?$/i,
        remontagens: [
          'Olá! Como posso te ajudar hoje?',
          'Oi! Tudo bem? Em que posso ser útil?',
          'Olá! Seja bem-vindo ao Marmitaê!',
          'Oi! Está com fome? Posso te mostrar nossas marmitas.',
        ]
      }
    ]
  },

  // ------------------------------------------------------------
  // FOME E DESEJO DE COMER
  // ------------------------------------------------------------
  {
    keyword: 'fome',
    prioridade: 9,
    decomposicoes: [
      {
        padrao: /(?:estou|to|tô)\s+(?:com|muita|bastante)\s+fome/i,
        remontagens: [
          'O que costuma fazer quando sente muita fome?',
          'A fome está grande! Que tipo de comida te agrada agora?',
          'Entendo. Uma marmita bem servida resolve isso rapidinho.',
          'Fome de leão! Nossas marmitas são perfeitas para isso.'
        ]
      },
      {
        padrao: /fome/i,
        remontagens: [
          'A fome bateu? Posso te sugerir algo gostoso.',
          'Quando a fome aperta, uma marmita caseira cai bem.',
          'O que você costuma comer quando está com fome?'
        ]
      }
    ]
  },

  // ------------------------------------------------------------
  // GOSTO / PREFERÊNCIA ALIMENTAR
  // ------------------------------------------------------------
  {
    keyword: 'gosto',
    prioridade: 8,
    decomposicoes: [
      {
        padrao: /(?:eu\s+)?gosto\s+(?:muito\s+)?de\s+(.+)/i,
        remontagens: [
          'O que faz você gostar tanto de $1?',
          'Interessante! $1 é mesmo uma delícia.',
          'Desde quando você gosta de $1?',
          '$1 é uma ótima escolha. Prefere como acompanhamento?'
        ]
      },
      {
        padrao: /gosto/i,
        remontagens: [
          'O que você mais gosta de comer?',
          'Todo mundo tem suas preferências. Qual a sua?',
          'Gostos não se discutem, se respeitam! Qual o seu prato favorito?'
        ]
      }
    ]
  },

  {
    keyword: 'prefiro',
    prioridade: 8,
    decomposicoes: [
      {
        padrao: /prefiro\s+(.+)/i,
        remontagens: [
          'Entendo, você prefere $1. Tem algum motivo especial?',
          '$1 é uma boa escolha. Gostaria de ver opções com isso?',
          'Prefere $1 ao invés do que?'
        ]
      }
    ]
  },

  // ------------------------------------------------------------
  // NÃO GOSTO / AVERSÃO / RESTRIÇÃO
  // ------------------------------------------------------------
  {
    keyword: 'nao gosto',
    prioridade: 9,
    decomposicoes: [
      {
        padrao: /(?:não|nao)\s+gosto\s+de\s+(.+)/i,
        remontagens: [
          'Por que você não gosta de $1?',
          'Entendo. $1 não é para todo mundo mesmo.',
          'Não gosta de $1? Podemos substituir por outra coisa.',
          'Muitos não gostam de $1. O que prefere no lugar?'
        ]
      },
      {
        padrao: /(?:não|nao)\s+gosto/i,
        remontagens: [
          'O que especificamente você não gosta?',
          'Tem alguma restrição alimentar?',
          'Podemos adaptar o prato do seu jeito.'
        ]
      }
    ]
  },

  {
    keyword: 'sem',
    prioridade: 7,
    decomposicoes: [
      {
        padrao: /sem\s+(.+)/i,
        remontagens: [
          'Sem $1, anotado. Alguma outra preferência?',
          'Entendido: sem $1. Quer que eu anote no pedido?',
          'Ok, sem $1. Mais alguma restrição?'
        ]
      }
    ]
  },

  {
    keyword: 'alergia',
    prioridade: 10,
    decomposicoes: [
      {
        padrao: /alergia\s+(?:a|à|ao)\s+(.+)/i,
        remontagens: [
          'Importante saber da alergia a $1. Vamos evitar completamente.',
          'Alergia a $1 anotada com destaque. Segurança em primeiro lugar.',
          'Obrigado por avisar sobre a alergia a $1. O cozinha será informada.'
        ]
      },
      {
        padrao: /alergia/i,
        remontagens: [
          'Tem alguma alergia alimentar que eu deva saber?',
          'Alergias são sérias. Me conte quais são as suas.',
          'Por favor, me informe qualquer alergia para sua segurança.'
        ]
      }
    ]
  },

  // ------------------------------------------------------------
  // PEDIDOS E INTENÇÃO DE COMPRA
  // ------------------------------------------------------------
  {
    keyword: 'quero',
    prioridade: 6,
    decomposicoes: [
      {
        padrao: /quero\s+(?:uma?\s+)?(.+)/i,
        remontagens: [
          'Você gostaria de pedir $1?',
          'Entendi, quer $1. Vamos preparar pra você.',
          '$1 é uma ótima escolha! Quer ver as opções disponíveis?'
        ]
      },
      {
        padrao: /quero/i,
        remontagens: [
          'O que você gostaria de pedir hoje?',
          'Pode me dizer o que tem vontade de comer?',
          'Estou aqui para ajudar no seu pedido!'
        ]
      }
    ]
  },

  {
    keyword: 'pedir',
    prioridade: 6,
    decomposicoes: [
      {
        padrao: /(?:vou|vamo|quero)\s+pedir\s+(.+)/i,
        remontagens: [
          'Vai pedir $1? Boa escolha!',
          'Pedindo $1... mais alguma coisa?',
          '$1 vai direto pro seu pedido.'
        ]
      },
      {
        padrao: /pedir/i,
        remontagens: [
          'O que deseja pedir?',
          'Pode fazer seu pedido quando quiser.',
          'Estou pronto para anotar seu pedido.'
        ]
      }
    ]
  },

  // ------------------------------------------------------------
  // CARNE / BIFE / PROTEÍNAS
  // ------------------------------------------------------------
  {
    keyword: 'carne',
    prioridade: 7,
    decomposicoes: [
      {
        padrao: /carne/i,
        remontagens: [
          'Gosta de carne? Temos bife acebolado, carne de panela e parmegiana.',
          'Carne é sempre uma boa pedida. Qual corte prefere?',
          'Nossas carnes são preparadas na hora. Quer conhecer as opções?'
        ]
      }
    ]
  },

  {
    keyword: 'bife',
    prioridade: 7,
    decomposicoes: [
      {
        padrao: /bife/i,
        remontagens: [
          'Nosso bife acebolado é um dos mais pedidos! Quer um?',
          'Bife acebolado com batata frita ou prefere purê?',
          'O bife vem suculento no ponto que você preferir.'
        ]
      }
    ]
  },

  {
    keyword: 'frango',
    prioridade: 7,
    decomposicoes: [
      {
        padrao: /frango/i,
        remontagens: [
          'Temos frango grelhado, strogonoff e parmegiana de frango. Qual prefere?',
          'Frango é leve e saboroso. Quer grelhado ou empanado?',
          'Nossas opções de frango são sucesso garantido!'
        ]
      }
    ]
  },

  // ------------------------------------------------------------
  // ACOMPANHAMENTOS E PERSONALIZAÇÕES
  // ------------------------------------------------------------
  {
    keyword: 'batata',
    prioridade: 5,
    decomposicoes: [
      {
        padrao: /batata\s+(?:frita|pure|puré)/i,
        remontagens: [
          'Batata frita crocante ou purê cremoso? Os dois são deliciosos.',
          'A batata é o acompanhamento clássico. Qual você prefere?',
          'Pode trocar a batata por salada ou legumes se quiser algo mais leve.'
        ]
      },
      {
        padrao: /batata/i,
        remontagens: [
          'Batata frita, purê ou salada? Você escolhe.',
          'A batata acompanha a maioria das marmitas. Tem preferência?'
        ]
      }
    ]
  },

  {
    keyword: 'arroz',
    prioridade: 5,
    decomposicoes: [
      {
        padrao: /arroz\s+(?:branco|integral)/i,
        remontagens: [
          'Arroz branco soltinho ou integral mais nutritivo?',
          'Pode escolher o arroz que preferir.'
        ]
      },
      {
        padrao: /sem\s+arroz/i,
        remontagens: [
          'Sem arroz, anotado. Quer mais feijão ou legumes no lugar?',
          'Ok, tiramos o arroz. O que coloca no lugar?'
        ]
      }
    ]
  },

  {
    keyword: 'feijao',
    prioridade: 5,
    decomposicoes: [
      {
        padrao: /feijao|feijão/i,
        remontagens: [
          'Feijão carioca ou preto? Os dois são caseiros.',
          'O feijão é temperado na hora. Quer sem feijão?'
        ]
      }
    ]
  },

  {
    keyword: 'salada',
    prioridade: 5,
    decomposicoes: [
      {
        padrao: /salada/i,
        remontagens: [
          'Salada fresca da casa para acompanhar? Ótima escolha.',
          'Nossa salada é feita na hora. Quer adicionar?'
        ]
      }
    ]
  },

  // ------------------------------------------------------------
  // PONTO DA CARNE
  // ------------------------------------------------------------
  {
    keyword: 'ponto',
    prioridade: 6,
    decomposicoes: [
      {
        padrao: /(?:bem\s+passado|bem passado)/i,
        remontagens: [
          'Bife bem passado, sem sangue nenhum. Anotado!',
          'Bem passado fica suculento por dentro. Confirmado.'
        ]
      },
      {
        padrao: /ao\s+ponto/i,
        retomagens: [
          'Ao ponto: rosado por dentro, perfeito!'
        ]
      },
      {
        padrao: /mal\s+passado/i,
        remontagens: [
          'Mal passado: selado por fora, vermelho por dentro. Entendido!'
        ]
      },
      {
        padrao: /ponto/i,
        remontagens: [
          'Como prefere o ponto da carne? Mal, ao ponto ou bem passado?'
        ]
      }
    ]
  },

  // ------------------------------------------------------------
  // VEGETARIANO / SEM CARNE
  // ------------------------------------------------------------
  {
    keyword: 'vegetariano',
    prioridade: 8,
    decomposicoes: [
      {
        padrao: /vegetariano|vegetariana|sem\s+carne/i,
        remontagens: [
          'Temos marmita vegetariana deliciosa: omelete, legumes, arroz e feijão!',
          'Opção sem carne? Nossa vegetariana é completa e saborosa.',
          'Vegetariana ou vegana? Temos omelete de forno com legumes frescos.'
        ]
      }
    ]
  },

  // ------------------------------------------------------------
  // BEBIDAS
  // ------------------------------------------------------------
  {
    keyword: 'bebida',
    prioridade: 5,
    decomposicoes: [
      {
        padrao: /bebida|refrigerante|suco|agua|água|coca|guarana|guaraná/i,
        remontagens: [
          'Temos refrigerante lata (Coca, Guaraná), suco natural, água e refri 600ml.',
          'Quer uma bebida gelada para acompanhar?',
          'Refri, suco ou água? Qual sua preferência?'
        ]
      }
    ]
  },

  {
    keyword: 'coca',
    prioridade: 5,
    decomposicoes: [
      {
        padrao: /coca\s+(?:zero|normal)?/i,
        remontagens: [
          'Coca-Cola normal ou Zero? As duas estão geladinhas.',
          'Coca-Cola vai bem com qualquer marmita!'
        ]
      }
    ]
  },

  // ------------------------------------------------------------
  // SOBREMESAS
  // ------------------------------------------------------------
  {
    keyword: 'sobremesa',
    prioridade: 5,
    decomposicoes: [
      {
        padrao: /sobremesa|pudim|mousse|brigadeiro|doce/i,
        remontagens: [
          'Para adoçar: pudim tradicional, mousse de maracujá ou brigadeiro gourmet.',
          'Sobremesa caseira faz toda a diferença! Qual te tenta mais?',
          'Nosso pudim de leite condensado é tradição da casa.'
        ]
      }
    ]
  },

  // ------------------------------------------------------------
  // PREÇO / VALOR / QUANTO CUSTA
  // ------------------------------------------------------------
  {
    keyword: 'preco',
    prioridade: 5,
    decomposicoes: [
      {
        padrao: /(?:quanto|preco|preço|custa|valor)\s+(?:custa|é|fica)?/i,
        remontagens: [
          'Nossas marmitas variam de R$ 21,90 a R$ 27,90. Bebidas de R$ 3,50 a R$ 8,00.',
          'Os preços são bem acessíveis. Quer ver o cardápio completo com valores?',
          'Marmitas a partir de R$ 21,90. Qual te interessa?'
        ]
      }
    ]
  },

  // ------------------------------------------------------------
  // ENTREGA / RETIRADA / FRETE
  // ------------------------------------------------------------
  {
    keyword: 'entrega',
    prioridade: 5,
    decomposicoes: [
      {
        padrao: /entrega|frete|entregar/i,
        remontagens: [
          'Entrega taxa fixa R$ 5,00. Ou retirada no balcão grátis!',
          'Entregamos em toda a região. Qual seu endereço?',
          'Prefere entrega (R$ 5,00) ou retirada no balcão (grátis)?'
        ]
      }
    ]
  },

  {
    keyword: 'retirada',
    prioridade: 5,
    decomposicoes: [
      {
        padrao: /retirada|retirar|buscar|passo\s+ai|pego\s+ai/i,
        remontagens: [
          'Retirada no balcão é grátis! Fica na Rua Central, 450 - Centro.',
          'Passa lá que seu pedido estará quentinho te esperando.',
          'Retirar no local economiza o frete. Combinado!'
        ]
      }
    ]
  },

  // ------------------------------------------------------------
  // PAGAMENTO
  // ------------------------------------------------------------
  {
    keyword: 'pagamento',
    prioridade: 5,
    decomposicoes: [
      {
        padrao: /pagamento|pagar|pix|cartao|cartão|dinheiro/i,
        remontagens: [
          'Aceitamos PIX, cartão (crédito/débito) na entrega ou dinheiro com troco.',
          'Como prefere pagar? PIX é rapidinho!',
          'Dinheiro, cartão ou PIX? Você escolhe.'
        ]
      }
    ]
  },

  // ------------------------------------------------------------
  // CUPONS / DESCONTO
  // ------------------------------------------------------------
  {
    keyword: 'cupom',
    prioridade: 5,
    decomposicoes: [
      {
        padrao: /cupom|desconto|promocao|promoção/i,
        remontagens: [
          'Temos cupons: PRIMEIRACOMPRA (R$ 5 OFF), MARMITAE10 (10% OFF), FRETEGRATIS.',
          'Quer aplicar algum cupom? É só me dizer o código!',
          'Cupons ativos: PRIMEIRACOMPRA, MARMITAE10, FRETEGRATIS. Qual vai usar?'
        ]
      }
    ]
  },

  // ------------------------------------------------------------
  // HORÁRIO / FUNCIONAMENTO
  // ------------------------------------------------------------
  {
    keyword: 'horario',
    prioridade: 5,
    decomposicoes: [
      {
        padrao: /horario|horário|abre|fecha|funciona|aberto/i,
        remontagens: [
          'Funcionamos de Segunda a Sábado, das 11h às 15h. Domingo fechamos.',
          'Nosso horário é almoço: 11h às 15h, seg a sáb.',
          'Aberto agora? Depende do dia. Seg a sáb 11h-15h.'
        ]
      }
    ]
  },

  // ------------------------------------------------------------
  // LOCALIZAÇÃO / ENDEREÇO
  // ------------------------------------------------------------
  {
    keyword: 'onde',
    prioridade: 5,
    decomposicoes: [
      {
        padrao: /onde\s+(?:fica|e|é)/i,
        remontagens: [
          'Ficamos na Rua Central, 450 - Centro. Fácil de encontrar!',
          'Rua Central, 450. Ponto de referência: perto da praça principal.',
          'Nosso balcão é na Rua Central, 450. Vem nos visitar!'
        ]
      }
    ]
  },

  // ------------------------------------------------------------
  // AGRADECIMENTO
  // ------------------------------------------------------------
  {
    keyword: 'obrigado',
    prioridade: 5,
    decomposicoes: [
      {
        padrao: /obrigado|obrigada|valeu|agradeco|agradeço/i,
        remontagens: [
          'Por nada! Estou aqui para ajudar.',
          'Disponha! Bom apetite!',
          'Foi um prazer atender. Volte sempre!',
          'Valeu! Qualquer coisa, é só chamar.'
        ]
      }
    ]
  },

  // ------------------------------------------------------------
  // TCHAU / DESPEDIDA
  // ------------------------------------------------------------
  {
    keyword: 'tchau',
    prioridade: 5,
    decomposicoes: [
      {
        padrao: /tchau|ate\s+mais|até\s+mais|falou|flw|xau|bye/i,
        remontagens: [
          'Tchau! Bom apetite e volte sempre!',
          'Até mais! Foi um prazer atender.',
          'Tchau tchau! Se precisar, é só chamar.',
          'Até a próxima! Aproveite sua refeição.'
        ]
      }
    ]
  },

  // ------------------------------------------------------------
  // SIM / CONFIRMAÇÃO
  // ------------------------------------------------------------
  {
    keyword: 'sim',
    prioridade: 4,
    decomposicoes: [
      {
        padrao: /^(?:sim|s|com certeza|claro|exato|isso\s+ai|isso\s+ae|bora|vamo)$/i,
        remontagens: [
          'Perfeito! Vamos em frente.',
          'Ótimo! Continuando...',
          'Confirmado! Mais alguma coisa?'
        ]
      }
    ]
  },

  // ------------------------------------------------------------
  // NÃO / NEGAÇÃO
  // ------------------------------------------------------------
  {
    keyword: 'nao',
    prioridade: 4,
    decomposicoes: [
      {
        padrao: /^(?:não|nao|n|nao\s+quero|não\s+quero|so\s+isso|só\s+isso|mais\s+nada|nada|deixa\s+assim|dispensa)$/i,
        remontagens: [
          'Sem problemas! Vamos do jeito que você preferir.',
          'Entendido. O que você gostaria então?',
          'Ok, sem isso. Mais alguma coisa?'
        ]
      }
    ]
  },

  // ------------------------------------------------------------
  // FINALIZAR / FECHAR PEDIDO
  // ------------------------------------------------------------
  {
    keyword: 'finalizar',
    prioridade: 6,
    decomposicoes: [
      {
        padrao: /finalizar|fechar|concluir|confirmar\s+pedido/i,
        remontagens: [
          'Para finalizar, preciso confirmar seu nome, endereço (se entrega) e forma de pagamento.',
          'Vamos fechar o pedido! Me confirma os dados.',
          'Finalizando... só preciso das informações de entrega e pagamento.'
        ]
      }
    ]
  },

  // ------------------------------------------------------------
  // CARRINHO / VER PEDIDO
  // ------------------------------------------------------------
  {
    keyword: 'carrinho',
    prioridade: 5,
    decomposicoes: [
      {
        padrao: /carrinho|meu\s+pedido|o\s+que\s+pedi/i,
        remontagens: [
          'Seu carrinho está lá no painel lateral. Quer que eu leia pra você?',
          'Pode ver seu pedido no carrinho. Precisa alterar algo?',
          'O carrinho mostra tudo: itens, personalizações, total.'
        ]
      }
    ]
  },

  // ------------------------------------------------------------
  // NOME / IDENTIFICAÇÃO
  // ------------------------------------------------------------
  {
    keyword: 'nome',
    prioridade: 5,
    decomposicoes: [
      {
        padrao: /meu\s+nome\s+(?:e|é)\s+(.+)/i,
        remontagens: [
          'Prazer, $1! Anotado aqui.',
          'Oi $1! Nome registrado para o pedido.',
          '$1, nome bonito! Já anotei.'
        ]
      },
      {
        padrao: /(?:sou\s+o|sou\s+a|me\s+chamo)\s+(.+)/i,
        remontagens: [
          'Prazer, $1! Bem-vindo ao Marmitaê.',
          'Oi $1! Anotado para o seu pedido.'
        ]
      },
      {
        padrao: /nome/i,
        remontagens: [
          'Como posso te chamar?',
          'Qual seu nome para o pedido?'
        ]
      }
    ]
  },

  // ------------------------------------------------------------
  // CANSADO / ESTRESSE / DIA DIFÍCIL
  // ------------------------------------------------------------
  {
    keyword: 'cansado',
    prioridade: 5,
    decomposicoes: [
      {
        padrao: /cansado|cansada|estresse|estressado|estressada|dia\s+dificil|dia\s+difícil/i,
        remontagens: [
          'Dias assim pedem uma comidinha caseira reconfortante. O que te animaria?',
          'Entendo. Nada como uma marmita quentinha pra melhorar o dia.',
          'Tome um tempo pra você almoçar com calma. Posso sugerir algo leve?'
        ]
      }
    ]
  },

  // ------------------------------------------------------------
  // FAMÍLIA / CASA / ALMOÇO
  // ------------------------------------------------------------
  {
    keyword: 'familia',
    prioridade: 4,
    decomposicoes: [
      {
        padrao: /familia|família|casa|almoco|almoço/i,
        remontagens: [
          'Comida caseira lembra família mesmo. Nossas marmitas têm esse tempero.',
          'Almoço em família é sagrado. Quer pedir para mais gente?',
          'Nada como almoço de mãe... ou da Marmitaê!'
        ]
      }
    ]
  },

  // ------------------------------------------------------------
  // CATCH-ALL (prioridade mínima para capturar resto)
  // ------------------------------------------------------------
  {
    keyword: 'xnone',
    prioridade: 0,
    decomposicoes: [
      {
        padrao: /.*/i,
        remontagens: RESPOSTAS_GENERICAS
      }
    ]
  }
];

// ============================================================================
// CLASSE PRINCIPAL ELIZA
// ============================================================================

export class Eliza {
  constructor() {
    this.historico = [];
    this.ultimaRespostaIdx = new Map(); // Para evitar repetições
    this.inicializarConhecimento();
  }

  inicializarConhecimento() {
    // Ordena por prioridade decrescente
    this.conhecimento = [...CONHECIMENTO_ELIZA].sort((a, b) => b.prioridade - a.prioridade);
    
    // Compila regex das decomposições
    this.conhecimento.forEach(item => {
      item.decomposicoes.forEach(dec => {
        if (typeof dec.padrao === 'string') {
          dec.regex = new RegExp(dec.padrao, 'i');
        } else {
          dec.regex = dec.padrao;
        }
        // Índice de uso para alternar respostas
        dec.ultimoIndice = -1;
      });
    });
  }

  /**
   * Reflete pronomes e expressões na frase
   */
  refletir(texto) {
    let resultado = texto;
    for (const reflexao of REFLEXOES) {
      resultado = resultado.replace(reflexao.padrao, reflexao.substituicao);
    }
    return resultado;
  }

  /**
   * Seleciona uma remontagem evitando repetições recentes
   */
  selecionarRemontagem(remontagens, chaveContexto) {
    if (!remontagens || remontagens.length === 0) {
      return 'Entendo. Conte-me mais.';
    }

    const historico = this.ultimaRespostaIdx.get(chaveContexto) || -1;
    let indice = (historico + 1) % remontagens.length;
    this.ultimaRespostaIdx.set(chaveContexto, indice);
    return remontagens[indice];
  }

  /**
   * Aplica remontagem substituindo $1, $2, etc por grupos capturados
   */
  aplicarRemontagem(template, grupos) {
    if (!grupos || grupos.length === 0) return template;
    
    return template.replace(/\$(\d+)/g, (match, num) => {
      const idx = parseInt(num, 10) - 1;
      return grupos[idx] ? this.refletir(grupos[idx]) : match;
    });
  }

  /**
   * Processa uma mensagem e retorna a resposta do ELIZA
   * @param {string} mensagem - Mensagem do usuário
   * @returns {object} { resposta, diagnostico }
   */
  processar(mensagem) {
    const original = mensagem;
    const normalizada = this.normalizar(mensagem);
    
    const diagnostico = {
      original,
      normalizada,
      palavraChaveIdentificada: null,
      prioridade: 0,
      padraoDecomposicao: null,
      gruposCapturados: [],
      reflexoesRealizadas: [],
      remontagemSelecionada: null,
      respostaProduzida: null,
      moduloResponsavel: 'eliza'
    };

    // Procura palavra-chave com maior prioridade que tenha match
    let melhorMatch = null;
    let melhorPrioridade = -1;
    let melhorDecomposicao = null;
    let melhoresGrupos = [];

    for (const item of this.conhecimento) {
      for (const dec of item.decomposicoes) {
        const match = normalizada.match(dec.regex);
        if (match) {
          if (item.prioridade > melhorPrioridade) {
            melhorMatch = item;
            melhorPrioridade = item.prioridade;
            melhorDecomposicao = dec;
            melhoresGrupos = match.slice(1); // Grupos capturados (sem o match completo)
            
            // Se for prioridade máxima, pode parar
            if (item.prioridade >= 10) break;
          }
        }
      }
      if (melhorPrioridade >= 10) break;
    }

    // Se não encontrou nada, usa xnone (catch-all)
    if (!melhorMatch) {
      const xnone = this.conhecimento.find(k => k.keyword === 'xnone');
      if (xnone) {
        melhorMatch = xnone;
        melhorDecomposicao = xnone.decomposicoes[0];
        melhoresGrupos = [];
      }
    }

    if (melhorMatch && melhorDecomposicao) {
      // Registra diagnóstico
      diagnostico.palavraChaveIdentificada = melhorMatch.keyword;
      diagnostico.prioridade = melhorPrioridade;
      diagnostico.padraoDecomposicao = melhorDecomposicao.regex.source;
      diagnostico.gruposCapturados = melhoresGrupos;
      
      // Aplica reflexão nos grupos capturados
      const gruposRefletidos = melhoresGrupos.map(g => {
        const refletido = this.refletir(g);
        diagnostico.reflexoesRealizadas.push({ original: g, refletido });
        return refletido;
      });

      // Seleciona remontagem
      const chaveContexto = `${melhorMatch.keyword}_${melhorDecomposicao.regex.source}`;
      const template = this.selecionarRemontagem(melhorDecomposicao.remontagens, chaveContexto);
      diagnostico.remontagemSelecionada = template;

      // Aplica remontagem com grupos refletidos
      const resposta = this.aplicarRemontagem(template, gruposRefletidos);
      diagnostico.respostaProduzida = resposta;

      return { resposta, diagnostico };
    }

    // Fallback absoluto
    diagnostico.respostaProduzida = 'Entendo. Como posso te ajudar?';
    return { resposta: diagnostico.respostaProduzida, diagnostico };
  }

  /**
   * Normaliza texto para matching (minúsculas, sem acentos, pontuação simplificada)
   */
  normalizar(texto) {
    if (!texto) return '';
    return texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[!?.,;:]/g, '') // Remove pontuação
      .replace(/\s+/g, ' ') // Colapsa espaços
      .trim();
  }

  /**
   * Reseta o estado da conversa
   */
  reset() {
    this.historico = [];
    this.ultimaRespostaIdx.clear();
  }

  /**
   * Retorna diagnóstico da última mensagem processada
   */
  getUltimoDiagnostico() {
    return this.historico[this.historico.length - 1] || null;
  }
}

// Instância singleton para uso global
export const eliza = new Eliza();