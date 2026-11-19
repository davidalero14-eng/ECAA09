/**
 * Marmitaê - Carregador da Base de Intenções
 * Carrega intenções do arquivo JSON local (data/intents.json)
 */

let _intentsCache = null;
let _promessaIntents = null;

/**
 * Carrega as intenções do arquivo JSON
 * @returns {Promise<Array>} Array de intenções
 */
async function carregarIntents() {
  if (_intentsCache) return _intentsCache;
  
  if (!_promessaIntents) {
    _promessaIntents = (async () => {
      try {
        const response = await fetch('data/intents.json');
        if (!response.ok) {
          throw new Error(`Erro ao carregar intents.json: ${response.status}`);
        }
        const dados = await response.json();
        _intentsCache = dados.intents;
        return _intentsCache;
      } catch (err) {
        console.error('[intents_data.js] Falha ao carregar intents:', err);
        throw err;
      }
    })();
  }
  
  return _promessaIntents;
}

/**
 * Inicializa o módulo de intenções
 * @returns {Promise<void>}
 */
export async function inicializarIntents() {
  await carregarIntents();
}

/**
 * Retorna a base de intenções (síncrono - deve ser chamado após inicialização)
 * @returns {Array|null}
 */
export function getBaseIntencoes() {
  return _intentsCache;
}

// Exportação síncrona para compatibilidade - usa Proxy para acesso dinâmico
export const BASE_INTENCOES = new Proxy([], {
  get(target, prop) {
    const intents = getBaseIntencoes();
    if (intents) {
      if (prop === 'length') return intents.length;
      if (prop === Symbol.iterator) return () => intents[Symbol.iterator]();
      return intents[prop];
    }
    return undefined;
  },
  ownKeys() {
    const intents = getBaseIntencoes();
    if (intents) {
      return intents.map((_, i) => String(i)).concat(['length']);
    }
    return ['length'];
  },
  getOwnPropertyDescriptor(target, prop) {
    const intents = getBaseIntencoes();
    if (intents && prop in intents) {
      return { configurable: true, enumerable: true, value: intents[prop] };
    }
    if (prop === 'length') {
      const intents = getBaseIntencoes();
      return { configurable: true, enumerable: false, value: intents ? intents.length : 0 };
    }
    return undefined;
  }
});