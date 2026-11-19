/**
 * Marmitaê - Cardápio Estruturado, Regras de Negócio e Tabela de Cupons
 * Carrega dados de arquivos JSON locais (data/produtos.json e data/intents.json)
 * Contém categorias, produtos, acompanhamentos permitidos, personalizações,
 * disponibilidade diária, simulação de dia da semana e validação de cupons.
 */

// Estado da simulação de dia da semana (útil para testes acadêmicos e auditoria)
let _diaSimulado = null;

// Cache dos dados carregados
let _dadosCarregados = null;
let _promessaCarregamento = null;

/**
 * Carrega os dados dos arquivos JSON (produtos e configurações)
 * @returns {Promise<object>} Dados carregados
 */
async function carregarDados() {
  if (_dadosCarregados) return _dadosCarregados;
  
  if (!_promessaCarregamento) {
    _promessaCarregamento = (async () => {
      try {
        const response = await fetch('data/produtos.json');
        if (!response.ok) {
          throw new Error(`Erro ao carregar produtos.json: ${response.status}`);
        }
        const dados = await response.json();
        _dadosCarregados = dados;
        return dados;
      } catch (err) {
        console.error('[menu.js] Falha ao carregar dados JSON:', err);
        throw err;
      }
    })();
  }
  
  return _promessaCarregamento;
}

/**
 * Retorna os dados carregados (síncrono - deve ser chamado após inicialização)
 * @returns {object|null}
 */
function obterDados() {
  return _dadosCarregados;
}

/**
 * Inicializa o módulo carregando os dados JSON
 * @returns {Promise<void>}
 */
export async function inicializarMenu() {
  await carregarDados();
}

// Exportações síncronas para compatibilidade (constantes que não mudam)
export const DIAS_SEMANA = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];

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

// Cupons - getter dinâmico que usa cache após inicialização
export const CUPONS_VALIDOS = new Proxy({}, {
  get(target, prop) {
    const dados = obterDados();
    if (dados && dados.configuracoes && dados.configuracoes.cupons_validos) {
      return dados.configuracoes.cupons_validos[prop];
    }
    // Fallback para valores padrão caso não tenha carregado ainda
    const cuponsPadrao = {
      'PRIMEIRACOMPRA': { codigo: 'PRIMEIRACOMPRA', tipo: 'fixo', valor: 5.00, descricao: 'R$ 5,00 de desconto de boas-vindas' },
      'MARMITAE10': { codigo: 'MARMITAE10', tipo: 'porcentagem', valor: 0.10, descricao: '10% de desconto no total dos pratos' },
      'FRETEGRATIS': { codigo: 'FRETEGRATIS', tipo: 'frete_gratis', valor: 5.00, descricao: 'Taxa de entrega gratuita' }
    };
    return cuponsPadrao[prop];
  },
  ownKeys() {
    const dados = obterDados();
    if (dados && dados.configuracoes && dados.configuracoes.cupons_validos) {
      return Object.keys(dados.configuracoes.cupons_validos);
    }
    return ['PRIMEIRACOMPRA', 'MARMITAE10', 'FRETEGRATIS'];
  },
  getOwnPropertyDescriptor(target, prop) {
    const dados = obterDados();
    if (dados && dados.configuracoes && dados.configuracoes.cupons_validos && dados.configuracoes.cupons_validos[prop]) {
      return { configurable: true, enumerable: true, value: dados.configuracoes.cupons_validos[prop] };
    }
    const cuponsPadrao = {
      'PRIMEIRACOMPRA': { codigo: 'PRIMEIRACOMPRA', tipo: 'fixo', valor: 5.00, descricao: 'R$ 5,00 de desconto de boas-vindas' },
      'MARMITAE10': { codigo: 'MARMITAE10', tipo: 'porcentagem', valor: 0.10, descricao: '10% de desconto no total dos pratos' },
      'FRETEGRATIS': { codigo: 'FRETEGRATIS', tipo: 'frete_gratis', valor: 5.00, descricao: 'Taxa de entrega gratuita' }
    };
    if (cuponsPadrao[prop]) {
      return { configurable: true, enumerable: true, value: cuponsPadrao[prop] };
    }
    return undefined;
  }
});

// CARDAPIO - getter dinâmico via Proxy
export const CARDAPIO = new Proxy([], {
  get(target, prop) {
    const dados = obterDados();
    const cardapio = dados ? dados.produtos : [];
    if (prop === 'length') return cardapio.length;
    if (prop === Symbol.iterator) return () => cardapio[Symbol.iterator]();
    return cardapio[prop];
  },
  ownKeys() {
    const dados = obterDados();
    const cardapio = dados ? dados.produtos : [];
    return cardapio.map((_, i) => String(i)).concat(['length']);
  },
  getOwnPropertyDescriptor(target, prop) {
    const dados = obterDados();
    const cardapio = dados ? dados.produtos : [];
    if (prop in cardapio) {
      return { configurable: true, enumerable: true, value: cardapio[prop] };
    }
    if (prop === 'length') {
      return { configurable: true, enumerable: false, value: cardapio.length };
    }
    return undefined;
  }
});

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

/**
 * Consulta itens disponíveis para um determinado dia da semana.
 * @param {string|null} dia
 * @param {string|null} categoria
 * @returns {Array} lista de produtos disponíveis
 */
export function consultarCardapio(dia = null, categoria = null) {
  const diaAlvo = getDiaAtual(dia);
  const cardapio = CARDAPIO;
  return cardapio.filter(item => {
    const disponivelHoje = item.disponibilidade && item.dias_disponiveis.includes(diaAlvo);
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
  const cardapio = CARDAPIO;
  return cardapio.find(p => p.id === id) || null;
}

/**
 * Busca produto por nome aproximado / termos de busca.
 * @param {string} termo
 * @returns {object|null}
 */
export function buscarProdutoPorNome(termo) {
  if (!termo) return null;
  const normalizado = termo.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  const cardapio = CARDAPIO;

  // Mapeamento de sinônimos comuns
  if (normalizado.includes('frango') && normalizado.includes('parmeg')) {
    return cardapio.find(p => p.id === 'marmita-parmegiana-frango');
  }
  if (normalizado.includes('strog') || normalizado.includes('estrog')) {
    return cardapio.find(p => p.id === 'marmita-strogonoff-frango');
  }
  if (normalizado.includes('panela') || normalizado.includes('cozida')) {
    return cardapio.find(p => p.id === 'marmita-carne-panela');
  }
  if (normalizado.includes('bife') || normalizado.includes('acebolado') || normalizado.includes('carne bovina')) {
    return cardapio.find(p => p.id === 'marmita-bife-acebolado');
  }
  if (normalizado.includes('vegetar') || normalizado.includes('omelete')) {
    return cardapio.find(p => p.id === 'marmita-vegetariana');
  }
  if (normalizado.includes('frango')) {
    return cardapio.find(p => p.id === 'marmita-frango-grelhado');
  }
  if (normalizado.includes('coca') || normalizado.includes('guarana') || (normalizado.includes('refri') && normalizado.includes('lata'))) {
    return cardapio.find(p => p.id === 'refri-lata-350ml');
  }
  if (normalizado.includes('refri') && normalizado.includes('600')) {
    return cardapio.find(p => p.id === 'refri-600ml');
  }
  if (normalizado.includes('suco')) {
    return cardapio.find(p => p.id === 'suco-natural-300ml');
  }
  if (normalizado.includes('agua')) {
    return cardapio.find(p => p.id === 'agua-mineral-500ml');
  }
  if (normalizado.includes('pudim')) {
    return cardapio.find(p => p.id === 'pudim-tradicional');
  }
  if (normalizado.includes('mousse')) {
    return cardapio.find(p => p.id === 'mousse-maracuja');
  }
  if (normalizado.includes('brigadeiro')) {
    return cardapio.find(p => p.id === 'brigadeiro-gourmet');
  }

  // Busca genérica por substring no nome
  return cardapio.find(p => {
    const nomeNorm = p.nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return nomeNorm.includes(normalizado) || normalizado.includes(nomeNorm);
  }) || null;
}

/**
 * Retorna a configuração de cupons (carregada do JSON)
 * @returns {object}
 */
export function getCuponsValidos() {
  const dados = obterDados();
  return dados ? dados.configuracoes.cupons_validos : {};
}