/**
 * Marmitaê - Processador de Linguagem Natural (NLP) e Vetorização Científica
 * Baseado na arquitetura clássica:
 * 1. Normalização (minúsculas, remoção de acentos e pontuações)
 * 2. Segmentação em tokens léxicos
 * 3. Filtragem de Stopwords (artigos, preposições sem peso semântico)
 * 4. Stemming morfológico (RSLP simplificado para Língua Portuguesa)
 * 5. Vocabulário Global e Vetorização TF-IDF
 * 6. Similaridade de Cosseno (Álgebra Linear Aplicada)
 * 100% Client-Side no Navegador, síncrono e sem dependências externas.
 */

export const STOPWORDS_PT = new Set([
  'a', 'o', 'as', 'os', 'um', 'uma', 'uns', 'umas',
  'de', 'do', 'da', 'dos', 'das', 'dum', 'duma', 'duns', 'dumas',
  'em', 'no', 'na', 'nos', 'nas', 'num', 'numa', 'nuns', 'numas',
  'por', 'pelo', 'pela', 'pelos', 'pelas', 'para', 'pra', 'pro', 'pras', 'pros',
  'com', 'como', 'sem', 'sob', 'sobre', 'tras', 'ate', 'apos', 'desde',
  'e', 'ou', 'mas', 'porem', 'contudo', 'todavia', 'que', 'se', 'porque', 'pois',
  'eu', 'tu', 'ele', 'ela', 'nos', 'vos', 'eles', 'elas', 'voce', 'voces',
  'me', 'te', 'se', 'lhe', 'lhes', 'mim', 'ti', 'si',
  'meu', 'minha', 'meus', 'minhas', 'teu', 'tua', 'teus', 'tuas', 'seu', 'sua', 'seus', 'suas',
  'nosso', 'nossa', 'nossos', 'nossas',
  'este', 'esta', 'estes', 'estas', 'esse', 'essa', 'esses', 'essas', 'aquele', 'aquela',
  'isto', 'isso', 'aquilo',
  'muito', 'muita', 'pouco', 'pouca', 'bastante',
  'ser', 'estar', 'ter', 'haver', 'fazer', 'ir',
  'sou', 'e', 'somos', 'sao', 'era', 'eram', 'fui', 'foi', 'fomos', 'foram',
  'estou', 'esta', 'estamos', 'estao', 'estava', 'esteve',
  'tenho', 'tem', 'temos', 'tem', 'tinha', 'teve',
  'ai', 'la', 'aqui', 'ali', 'ca'
]);

export class NLPProcessor {
  static normalizar(texto) {
    if (!texto || typeof texto !== 'string') return '';
    return texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  static segmentar(texto) {
    const normalizado = this.normalizar(texto);
    if (!normalizado) return [];
    return normalizado.split(' ').filter(token => token.length > 0);
  }

  static removerStopwords(tokens) {
    return tokens.filter(t => !STOPWORDS_PT.has(t) && t.length > 1);
  }

  static stem(palavra) {
    if (!palavra || palavra.length <= 3) return palavra;
    let stem = palavra;

    if (stem.endsWith('oes')) stem = stem.slice(0, -3) + 'ao';
    else if (stem.endsWith('aos')) stem = stem.slice(0, -3) + 'ao';
    else if (stem.endsWith('ais')) stem = stem.slice(0, -3) + 'al';
    else if (stem.endsWith('eis')) stem = stem.slice(0, -3) + 'el';
    else if (stem.endsWith('ois')) stem = stem.slice(0, -3) + 'ol';
    else if (stem.endsWith('uis')) stem = stem.slice(0, -3) + 'ul';
    else if (stem.endsWith('les')) stem = stem.slice(0, -2);
    else if (stem.endsWith('res')) stem = stem.slice(0, -2);
    else if (stem.endsWith('zes')) stem = stem.slice(0, -2);
    else if (stem.endsWith('ns')) stem = stem.slice(0, -2) + 'm';
    else if (stem.endsWith('s') && !stem.endsWith('ss')) stem = stem.slice(0, -1);

    const sufixos = [
      'izacoes', 'izacao', 'amentos', 'amento', 'imentos', 'imento',
      'idades', 'idade', 'adores', 'adora', 'ador', 'adeiras', 'adeira',
      'ancias', 'ancia', 'encias', 'encia', 'ismos', 'ismo', 'istas', 'ista',
      'mentes', 'mente', 'issimo', 'issima',
      'ariamos', 'eriamos', 'iriamos', 'assemos', 'essemos', 'issemos',
      'aremos', 'eremos', 'iremos', 'aramos', 'eramos', 'iramos',
      'avam', 'ando', 'endo', 'indo', 'aram', 'eram', 'iram',
      'aria', 'erie', 'iria', 'asse', 'esse', 'isse',
      'ava', 'ara', 'era', 'ira',
      'ou', 'eu', 'iu', 'ar', 'er', 'ir'
    ];

    for (const suf of sufixos) {
      if (stem.length - suf.length >= 3 && stem.endsWith(suf)) {
        stem = stem.slice(0, -suf.length);
        break;
      }
    }

    if (stem.length > 3 && (stem.endsWith('a') || stem.endsWith('e') || stem.endsWith('o'))) {
      stem = stem.slice(0, -1);
    }

    return stem;
  }

  static processarTexto(texto) {
    const tokens = this.segmentar(texto);
    const semStopwords = this.removerStopwords(tokens);
    return semStopwords.map(t => this.stem(t));
  }
}

export class VectorEngine {
  static construirVocabulario(documentosTokens) {
    const vocabSet = new Set();
    documentosTokens.forEach(doc => {
      doc.forEach(token => vocabSet.add(token));
    });
    return Array.from(vocabSet).sort();
  }

  static calcularBoW(docTokens, vocabulario) {
    const freqMap = new Map();
    docTokens.forEach(t => freqMap.set(t, (freqMap.get(t) || 0) + 1));
    return vocabulario.map(termo => freqMap.get(termo) || 0);
  }

  static calcularIDF(documentosTokens, vocabulario) {
    const N = documentosTokens.length;
    return vocabulario.map(termo => {
      let df = 0;
      documentosTokens.forEach(doc => {
        if (doc.includes(termo)) df++;
      });
      return Math.log((N + 1) / (df + 1)) + 1;
    });
  }

  static calcularTFIDF(docTokens, vocabulario, idfVector) {
    const totalTokens = docTokens.length || 1;
    const freqMap = new Map();
    docTokens.forEach(t => freqMap.set(t, (freqMap.get(t) || 0) + 1));

    const vetor = vocabulario.map((termo, i) => {
      const count = freqMap.get(termo) || 0;
      const tf = count / totalTokens;
      const idf = idfVector[i] || 1;
      return tf * idf;
    });

    return this.normalizarVetorL2(vetor);
  }

  static normalizarVetorL2(vetor) {
    const somaQuadrados = vetor.reduce((acc, val) => acc + (val * val), 0);
    const norma = Math.sqrt(somaQuadrados);
    if (norma === 0) return vetor;
    return vetor.map(val => val / norma);
  }

  static similaridadeCosseno(vetorA, vetorB) {
    if (!vetorA || !vetorB || vetorA.length !== vetorB.length) return 0;
    let produtoEscalar = 0;
    let normaA = 0;
    let normaB = 0;

    for (let i = 0; i < vetorA.length; i++) {
      produtoEscalar += vetorA[i] * vetorB[i];
      normaA += vetorA[i] * vetorA[i];
      normaB += vetorB[i] * vetorB[i];
    }

    normaA = Math.sqrt(normaA);
    normaB = Math.sqrt(normaB);
    if (normaA === 0 || normaB === 0) return 0;

    const sim = produtoEscalar / (normaA * normaB);
    return Math.max(0, Math.min(1, sim));
  }
}

export class SemanticMatcher {
  constructor(baseIntencoes) {
    this.base = baseIntencoes;
    this.treinar();
  }

  treinar() {
    this.exemplosProcessados = [];
    const todosDocs = [];

    this.base.forEach((item, indexItem) => {
      item.exemplos.forEach(ex => {
        const tokens = NLPProcessor.processarTexto(ex);
        this.exemplosProcessados.push({
          itemIndex: indexItem,
          tag: item.tag,
          textoOriginal: ex,
          tokens: tokens
        });
        todosDocs.push(tokens);
      });
    });

    this.vocabulario = VectorEngine.construirVocabulario(todosDocs);
    this.idfVector = VectorEngine.calcularIDF(todosDocs, this.vocabulario);

    this.exemplosProcessados.forEach(ex => {
      ex.vetor = VectorEngine.calcularTFIDF(ex.tokens, this.vocabulario, this.idfVector);
    });
  }

  classificar(entradaUsuario, limiarMinimo = 0.65) {
    const tokensEntrada = NLPProcessor.processarTexto(entradaUsuario);
    if (tokensEntrada.length === 0) {
      return { match: false, score: 0, tokens: [] };
    }

    const vetorEntrada = VectorEngine.calcularTFIDF(tokensEntrada, this.vocabulario, this.idfVector);
    let maiorScore = 0;
    let melhorExemplo = null;

    for (const ex of this.exemplosProcessados) {
      const score = VectorEngine.similaridadeCosseno(vetorEntrada, ex.vetor);
      if (score > maiorScore) {
        maiorScore = score;
        melhorExemplo = ex;
      }
    }

    const itemBase = melhorExemplo ? this.base[melhorExemplo.itemIndex] : null;
    const limiarAplicado = (itemBase && itemBase.limiar !== undefined) ? itemBase.limiar : limiarMinimo;

    if (maiorScore >= limiarAplicado && itemBase) {
      return {
        match: true,
        item: itemBase,
        score: maiorScore,
        tag: itemBase.tag,
        exemploMaisProximo: melhorExemplo.textoOriginal,
        tokens: tokensEntrada
      };
    }

    return {
      match: false,
      score: maiorScore,
      melhorTagAproximada: itemBase ? itemBase.tag : null,
      tokens: tokensEntrada
    };
  }
}
