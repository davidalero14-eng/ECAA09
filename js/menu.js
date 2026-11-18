/**
 * Marmitaê - Cardápio Estruturado, Regras de Negócio e Tabela de Cupons
 * Contém categorias, produtos, acompanhamentos permitidos, personalizações,
 * disponibilidade diária, simulação de dia da semana e validação de cupons.
 */

export const DIAS_SEMANA = [
  'domingo',
  'segunda',
  'terca',
  'quarta',
  'quinta',
  'sexta',
  'sabado'
];

export const DIAS_SEMANA_NOMES = {
  domingo: 'Domingo',
  segunda: 'Segunda-feira',
  terca: 'Terça-feira',
  quarta: 'Quarta-feira',
  quinta: 'Quinta-feira',
  sexta: 'Sexta-feira',
  sabado: 'Sábado'
};

export const TAXA_ENTREGA_PADRAO = 5.00;

export const CATEGORIAS = {
  MARMITAS: 'marmitas',
  BEBIDAS: 'bebidas',
  SOBREMESAS: 'sobremesas'
};

// Cupons promocionais oficiais aceitos pelo sistema
export const CUPONS_VALIDOS = {
  'PRIMEIRACOMPRA': {
    codigo: 'PRIMEIRACOMPRA',
    tipo: 'fixo',
    valor: 5.00,
    descricao: 'R$ 5,00 de desconto de boas-vindas'
  },
  'MARMITAE10': {
    codigo: 'MARMITAE10',
    tipo: 'porcentagem',
    valor: 0.10, // 10%
    descricao: '10% de desconto no total dos pratos'
  },
  'FRETEGRATIS': {
    codigo: 'FRETEGRATIS',
    tipo: 'frete_gratis',
    valor: 5.00,
    descricao: 'Taxa de entrega gratuita'
  }
};

// Estado da simulação de dia da semana (útil para testes acadêmicos e auditoria)
let _diaSimulado = null;

export function setDiaSimulado(dia) {
  if (!dia || dia === 'auto') {
    _diaSimulado = null;
  } else {
    const diaNorm = String(dia).toLowerCase().trim();
    if (DIAS_SEMANA.includes(diaNorm)) {
      _diaSimulado = diaNorm;
    }
  }
}

export function getDiaSimulado() {
  return _diaSimulado;
}

/**
 * Retorna o dia da semana atual (ou simulado para testes).
 * @param {string|null} diaForcado
 * @returns {string} nome do dia em minúsculas (ex: 'quarta')
 */
export function getDiaAtual(diaForcado = null) {
  if (diaForcado && DIAS_SEMANA.includes(diaForcado.toLowerCase())) {
    return diaForcado.toLowerCase();
  }
  if (_diaSimulado && DIAS_SEMANA.includes(_diaSimulado)) {
    return _diaSimulado;
  }
  const hojeIndex = new Date().getDay();
  return DIAS_SEMANA[hojeIndex];
}

export const CARDAPIO = [
  // --- MARMITAS ---
  {
    id: 'marmita-frango-grelhado',
    nome: 'Frango Grelhado',
    categoria: CATEGORIAS.MARMITAS,
    descricao: 'Filé de frango grelhado suculento, arroz branco, feijão carioca e legumes no vapor.',
    preco: 21.90,
    disponibilidade: true,
    diasDisponiveis: ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'],
    ingredientesPadrao: ['Frango grelhado', 'Arroz branco', 'Feijão carioca', 'Legumes no vapor'],
    acompanhamentosPermitidos: ['Arroz branco', 'Arroz integral', 'Feijão carioca', 'Feijão preto', 'Legumes no vapor', 'Batata frita', 'Purê de batata', 'Salada da casa'],
    personalizacoesPossiveis: {
      remocoes: ['sem feijão', 'sem arroz', 'sem legumes', 'sem sal', 'pouco sal', 'sem alho'],
      trocas: [
        { de: 'Arroz branco', para: ['Arroz integral'] },
        { de: 'Feijão carioca', para: ['Feijão preto'] },
        { de: 'Legumes no vapor', para: ['Purê de batata', 'Batata frita', 'Salada da casa'] }
      ],
      pontosCarne: null
    },
    sugestoesHarmonizacao: ['suco-natural-300ml', 'pudim-tradicional']
  },
  {
    id: 'marmita-bife-acebolado',
    nome: 'Bife Acebolado',
    categoria: CATEGORIAS.MARMITAS,
    descricao: 'Bife bovino macio acebolado, arroz soltinho, feijão caseiro e batata frita crocante.',
    preco: 24.90,
    disponibilidade: true,
    diasDisponiveis: ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'],
    ingredientesPadrao: ['Bife bovino', 'Cebola fatiada', 'Arroz branco', 'Feijão carioca', 'Batata frita'],
    acompanhamentosPermitidos: ['Arroz branco', 'Arroz integral', 'Feijão carioca', 'Feijão preto', 'Batata frita', 'Purê de batata', 'Salada da casa', 'Legumes no vapor'],
    personalizacoesPossiveis: {
      remocoes: ['sem cebola', 'sem feijão', 'sem arroz', 'sem batata', 'sem sal', 'pouco sal', 'pouco óleo'],
      trocas: [
        { de: 'Batata frita', para: ['Purê de batata', 'Salada da casa', 'Legumes no vapor'] },
        { de: 'Feijão carioca', para: ['Feijão preto'] },
        { de: 'Arroz branco', para: ['Arroz integral'] }
      ],
      pontosCarne: ['mal passado', 'ao ponto', 'bem passado']
    },
    sugestoesHarmonizacao: ['refri-lata-350ml', 'pudim-tradicional']
  },
  {
    id: 'marmita-strogonoff-frango',
    nome: 'Strogonoff de Frango',
    categoria: CATEGORIAS.MARMITAS,
    descricao: 'Strogonoff de frango cremoso com champignon suave, arroz branco e batata palha artesanal.',
    preco: 23.90,
    disponibilidade: true,
    diasDisponiveis: ['segunda', 'quarta', 'sexta', 'sabado'],
    ingredientesPadrao: ['Strogonoff de frango', 'Arroz branco', 'Batata palha'],
    acompanhamentosPermitidos: ['Arroz branco', 'Arroz integral', 'Batata palha', 'Purê de batata', 'Salada da casa'],
    personalizacoesPossiveis: {
      remocoes: ['sem champignon', 'sem batata palha', 'sem arroz', 'mais molho', 'pouco molho'],
      trocas: [
        { de: 'Batata palha', para: ['Purê de batata', 'Salada da casa'] },
        { de: 'Arroz branco', para: ['Arroz integral'] }
      ],
      pontosCarne: null
    },
    sugestoesHarmonizacao: ['suco-natural-300ml', 'mousse-maracuja']
  },
  {
    id: 'marmita-carne-panela',
    nome: 'Carne de Panela',
    categoria: CATEGORIAS.MARMITAS,
    descricao: 'Carne bovina de panela cozida lentamente ao molho encorpado, arroz, feijão e purê de batatas.',
    preco: 25.90,
    disponibilidade: true,
    diasDisponiveis: ['terca', 'quinta', 'sabado'],
    ingredientesPadrao: ['Carne cozida com molho', 'Arroz branco', 'Feijão carioca', 'Purê de batata'],
    acompanhamentosPermitidos: ['Arroz branco', 'Arroz integral', 'Feijão carioca', 'Feijão preto', 'Purê de batata', 'Batata frita', 'Legumes no vapor', 'Salada da casa'],
    personalizacoesPossiveis: {
      remocoes: ['sem molho', 'pouco molho', 'sem cebola', 'sem feijão', 'sem purê', 'sem arroz'],
      trocas: [
        { de: 'Purê de batata', para: ['Batata frita', 'Legumes no vapor', 'Salada da casa'] },
        { de: 'Feijão carioca', para: ['Feijão preto'] }
      ],
      pontosCarne: null
    },
    sugestoesHarmonizacao: ['refri-600ml', 'brigadeiro-gourmet']
  },
  {
    id: 'marmita-parmegiana-frango',
    nome: 'Parmegiana de Frango',
    categoria: CATEGORIAS.MARMITAS,
    descricao: 'Filé de frango empanado, coberto com queijo derretido e molho de tomate rústico, arroz e batata frita.',
    preco: 27.90,
    disponibilidade: true,
    diasDisponiveis: ['segunda', 'quarta', 'sexta', 'sabado'],
    ingredientesPadrao: ['Filé de frango empanado', 'Queijo muçarela', 'Molho de tomate', 'Arroz branco', 'Batata frita'],
    acompanhamentosPermitidos: ['Arroz branco', 'Arroz integral', 'Batata frita', 'Purê de batata', 'Salada da casa'],
    personalizacoesPossiveis: {
      remocoes: ['molho separado', 'sem batata frita', 'sem arroz'],
      trocas: [
        { de: 'Batata frita', para: ['Purê de batata', 'Salada da casa'] },
        { de: 'Arroz branco', para: ['Arroz integral'] }
      ],
      pontosCarne: null
    },
    sugestoesHarmonizacao: ['refri-lata-350ml', 'mousse-maracuja']
  },
  {
    id: 'marmita-vegetariana',
    nome: 'Marmita Vegetariana',
    categoria: CATEGORIAS.MARMITAS,
    descricao: 'Omelete de forno com ervas finas, mix de legumes frescos salteados no azeite, arroz branco e feijão.',
    preco: 21.90,
    disponibilidade: true,
    diasDisponiveis: ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'],
    ingredientesPadrao: ['Omelete de forno', 'Legumes salteados', 'Arroz branco', 'Feijão carioca'],
    acompanhamentosPermitidos: ['Arroz branco', 'Arroz integral', 'Feijão carioca', 'Feijão preto', 'Legumes salteados', 'Purê de batata', 'Salada da casa'],
    personalizacoesPossiveis: {
      remocoes: ['sem cebola', 'sem alho', 'pouco sal', 'sem feijão', 'sem arroz'],
      trocas: [
        { de: 'Arroz branco', para: ['Arroz integral'] },
        { de: 'Feijão carioca', para: ['Feijão preto'] },
        { de: 'Legumes salteados', para: ['Salada da casa', 'Purê de batata'] }
      ],
      pontosCarne: null
    },
    sugestoesHarmonizacao: ['agua-mineral-500ml', 'suco-natural-300ml', 'pudim-tradicional']
  },

  // --- BEBIDAS ---
  {
    id: 'refri-lata-350ml',
    nome: 'Refrigerante lata 350 ml',
    categoria: CATEGORIAS.BEBIDAS,
    descricao: 'Coca-Cola, Guaraná Antarctica ou Coca Zero geladinhos (informe a preferência).',
    preco: 6.00,
    disponibilidade: true,
    diasDisponiveis: ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'],
    ingredientesPadrao: ['Refrigerante lata 350 ml'],
    acompanhamentosPermitidos: [],
    personalizacoesPossiveis: {
      opcoesSabor: ['Coca-Cola Normal', 'Coca-Cola Zero', 'Guaraná Antarctica', 'Guaraná Zero']
    }
  },
  {
    id: 'suco-natural-300ml',
    nome: 'Suco natural 300 ml',
    categoria: CATEGORIAS.BEBIDAS,
    descricao: 'Suco natural feito na hora de Laranja, Limão ou Maracujá.',
    preco: 7.00,
    disponibilidade: true,
    diasDisponiveis: ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'],
    ingredientesPadrao: ['Suco natural 300 ml'],
    acompanhamentosPermitidos: [],
    personalizacoesPossiveis: {
      opcoesSabor: ['Laranja', 'Limão', 'Maracujá'],
      remocoes: ['sem açúcar', 'com adoçante', 'sem gelo']
    }
  },
  {
    id: 'agua-mineral-500ml',
    nome: 'Água mineral 500 ml',
    categoria: CATEGORIAS.BEBIDAS,
    descricao: 'Água mineral fresca garrafa 500 ml, com ou sem gás.',
    preco: 3.50,
    disponibilidade: true,
    diasDisponiveis: ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'],
    ingredientesPadrao: ['Água mineral 500 ml'],
    acompanhamentosPermitidos: [],
    personalizacoesPossiveis: {
      opcoesSabor: ['Sem gás', 'Com gás']
    }
  },
  {
    id: 'refri-600ml',
    nome: 'Refrigerante 600 ml',
    categoria: CATEGORIAS.BEBIDAS,
    descricao: 'Garrafa 600 ml de Coca-Cola ou Guaraná Antarctica para matar a sede.',
    preco: 8.00,
    disponibilidade: true,
    diasDisponiveis: ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'],
    ingredientesPadrao: ['Refrigerante garrafa 600 ml'],
    acompanhamentosPermitidos: [],
    personalizacoesPossiveis: {
      opcoesSabor: ['Coca-Cola Normal', 'Coca-Cola Zero', 'Guaraná Antarctica']
    }
  },

  // --- SOBREMESAS ---
  {
    id: 'pudim-tradicional',
    nome: 'Pudim',
    categoria: CATEGORIAS.SOBREMESAS,
    descricao: 'Fatia generosa de pudim de leite condensado tradicional com calda de caramelo dourada.',
    preco: 7.00,
    disponibilidade: true,
    diasDisponiveis: ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'],
    ingredientesPadrao: ['Leite condensado', 'Leite', 'Ovos', 'Calda de caramelo'],
    acompanhamentosPermitidos: [],
    personalizacoesPossiveis: {}
  },
  {
    id: 'mousse-maracuja',
    nome: 'Mousse de maracujá',
    categoria: CATEGORIAS.SOBREMESAS,
    descricao: 'Mousse aerado de maracujá com sementinhas e calda azedinha deliciosa.',
    preco: 6.50,
    disponibilidade: true,
    diasDisponiveis: ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'],
    ingredientesPadrao: ['Polpa de maracujá', 'Creme de leite', 'Leite condensado'],
    acompanhamentosPermitidos: [],
    personalizacoesPossiveis: {}
  },
  {
    id: 'brigadeiro-gourmet',
    nome: 'Brigadeiro',
    categoria: CATEGORIAS.SOBREMESAS,
    descricao: 'Unidade grande (40g) de brigadeiro de panela com chocolate nobre e confeitos crocantes.',
    preco: 4.00,
    disponibilidade: true,
    diasDisponiveis: ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'],
    ingredientesPadrao: ['Chocolate', 'Leite condensado', 'Manteiga'],
    acompanhamentosPermitidos: [],
    personalizacoesPossiveis: {}
  }
];

/**
 * Consulta itens disponíveis para um determinado dia da semana.
 * @param {string|null} dia
 * @param {string|null} categoria
 * @returns {Array} lista de produtos disponíveis
 */
export function consultarCardapio(dia = null, categoria = null) {
  const diaAlvo = getDiaAtual(dia);
  return CARDAPIO.filter(item => {
    const disponivelHoje = item.disponibilidade && item.diasDisponiveis.includes(diaAlvo);
    const bateCategoria = categoria ? item.categoria === categoria : true;
    return disponivelHoje && bateCategoria;
  });
}

/**
 * Busca produto por ID exato.
 * @param {string} id
 * @returns {object|null}
 */
export function buscarProdutoPorId(id) {
  return CARDAPIO.find(p => p.id === id) || null;
}

/**
 * Busca produto por nome aproximado / termos de busca.
 * @param {string} termo
 * @returns {object|null}
 */
export function buscarProdutoPorNome(termo) {
  if (!termo) return null;
  const normalizado = termo.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

  // Mapeamento de sinônimos comuns
  if (normalizado.includes('frango') && normalizado.includes('parmeg')) {
    return CARDAPIO.find(p => p.id === 'marmita-parmegiana-frango');
  }
  if (normalizado.includes('strog') || normalizado.includes('estrog')) {
    return CARDAPIO.find(p => p.id === 'marmita-strogonoff-frango');
  }
  if (normalizado.includes('panela') || normalizado.includes('cozida')) {
    return CARDAPIO.find(p => p.id === 'marmita-carne-panela');
  }
  if (normalizado.includes('bife') || normalizado.includes('acebolado') || normalizado.includes('carne bovina')) {
    return CARDAPIO.find(p => p.id === 'marmita-bife-acebolado');
  }
  if (normalizado.includes('vegetar') || normalizado.includes('omelete')) {
    return CARDAPIO.find(p => p.id === 'marmita-vegetariana');
  }
  if (normalizado.includes('frango')) {
    return CARDAPIO.find(p => p.id === 'marmita-frango-grelhado');
  }
  if (normalizado.includes('coca') || normalizado.includes('guarana') || (normalizado.includes('refri') && normalizado.includes('lata'))) {
    return CARDAPIO.find(p => p.id === 'refri-lata-350ml');
  }
  if (normalizado.includes('refri') && normalizado.includes('600')) {
    return CARDAPIO.find(p => p.id === 'refri-600ml');
  }
  if (normalizado.includes('suco')) {
    return CARDAPIO.find(p => p.id === 'suco-natural-300ml');
  }
  if (normalizado.includes('agua')) {
    return CARDAPIO.find(p => p.id === 'agua-mineral-500ml');
  }
  if (normalizado.includes('pudim')) {
    return CARDAPIO.find(p => p.id === 'pudim-tradicional');
  }
  if (normalizado.includes('mousse')) {
    return CARDAPIO.find(p => p.id === 'mousse-maracuja');
  }
  if (normalizado.includes('brigadeiro')) {
    return CARDAPIO.find(p => p.id === 'brigadeiro-gourmet');
  }

  // Busca genérica por substring no nome
  return CARDAPIO.find(p => {
    const nomeNorm = p.nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return nomeNorm.includes(normalizado) || normalizado.includes(nomeNorm);
  }) || null;
}
