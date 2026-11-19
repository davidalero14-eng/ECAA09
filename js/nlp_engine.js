/**
 * Marmitaê - Processador de Linguagem Natural (NLP) e Vetorização Científica
 * Baseado na arquitetura clássica:
 * 1. Normalização (minúsculas, remoção de acentos e pontuações)
 * 2. Segmentação em tokens léxicos
 * 3. Filtragem de Stopwords (artigos, preposições sem peso semântico)
 * 4. Stemming morfológico (RSLP simplificado para Língua Portuguesa)
 * 5. Vocabulário Global e Vetorização TF-IDF
 * 6. Similaridade de Cosseno (Álgebra Linear Aplicada)
 * 100% Client-Side no Navegador, sem servidores ou bibliotecas externas.
 */

// Lista rigorosa de stopwords em português (palavras sem peso semântico para classificação de intenções)
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

/**
 * Módulo de NLP Clássico para o Português
 */
export class NLPProcessor {
  /**
   * 1. Normalização: Converte para minúsculas e remove acentuações e caracteres especiais.
   * @param {string} texto 
   * @returns {string}
   */
  static normalizar(texto) {
    if (!texto || typeof texto !== 'string') return '';
    return texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove marcas diacríticas (acentos e cedilhas)
      .replace(/[^a-z0-9\s]/g, ' ')   // substitui pontuações por espaços
      .replace(/\s+/g, ' ')           // colapsa múltiplos espaços
      .trim();
  }

  /**
   * 2. Segmentação: Quebra da frase em unidades léxicas (tokens).
   * @param {string} texto 
   * @returns {Array<string>}
   */
  static segmentar(texto) {
    const normalizado = this.normalizar(texto);
    if (!normalizado) return [];
    return normalizado.split(' ').filter(token => token.length > 0);
  }

  /**
   * 3. Stopwords: Remoção de palavras vazias e sem valor semântico.
   * @param {Array<string>} tokens 
   * @returns {Array<string>}
   */
  static removerStopwords(tokens) {
    return tokens.filter(t => !STOPWORDS_PT.has(t) && t.length > 1);
  }

  /**
   * 4. Stemming (Radicalização morfológica para Português):
   * Reduz palavras flexionadas ao seu radical invariável.
   * Exemplo: 'cancelar' -> 'cancel', 'matricula' -> 'matricul', 'marmitas' -> 'marmit', 'bebidas' -> 'bebid'
   * @param {string} palavra 
   * @returns {string}
   */
  static stem(palavra) {
    if (!palavra || palavra.length <= 3) return palavra;

    let stem = palavra;

    // Regras de plurais e gênero
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

    // Regras de sufixos verbais e nominais comuns
    const sufixos = [
      'izacoes', 'izacao', 'amentos', 'amento', 'imentos', 'imento',
      'idades', 'idade', 'adores', 'adora', 'ador', 'adeiras', 'adeira',
      'ancias', 'ancia', 'encias', 'encia', 'ismos', 'ismo', 'istas', 'ista',
      'mentes', 'mente', 'issimo', 'issima',
      'ariamos', 'eriamos', 'iriamos', 'assemos', 'essemos', 'issemos',
      'aremos', 'eremos', 'iremos', 'aramos', 'eramos', 'iramos',
      'avam', 'avam', 'ando', 'endo', 'indo', 'aram', 'eram', 'iram',
      'aria', 'erie', 'iria', 'asse', 'esse', 'isse',
      'ava', 'ara', 'era', 'ira',
      'ava', 'ou', 'eu', 'iu', 'ar', 'er', 'ir'
    ];

    for (const suf of sufixos) {
      if (stem.length - suf.length >= 3 && stem.endsWith(suf)) {
        stem = stem.slice(0, -suf.length);
        break;
      }
    }

    // Remoção de vogal temática final se radical restante tiver ao menos 3 caracteres
    if (stem.length > 3 && (stem.endsWith('a') || stem.endsWith('e') || stem.endsWith('o'))) {
      stem = stem.slice(0, -1);
    }

    return stem;
  }

  /**
   * Pipeline completo de pré-processamento linguístico:
   * Texto Bruto -> Normalização -> Segmentação -> Remoção de Stopwords -> Stemming.
   * @param {string} texto 
   * @returns {Array<string>} Lista de radicais processados
   */
  static processarTexto(texto) {
    const tokens = this.segmentar(texto);
    const semStopwords = this.removerStopwords(tokens);
    return semStopwords.map(t => this.stem(t));
  }

  /**
   * Pipeline de diagnóstico - retorna todos os passos intermediários do processamento NLP.
   * @param {string} texto 
   * @returns {object} Objeto com todos os passos do processamento
   */
  static diagnosticar(texto) {
    const original = texto;
    const normalizado = this.normalizar(texto);
    const tokens = this.segmentar(texto);
    const stopwordsEncontradas = tokens.filter(t => STOPWORDS_PT.has(t) || t.length <= 1);
    const semStopwords = this.removerStopwords(tokens);
    const radicais = semStopwords.map(t => ({ original: t, radical: this.stem(t) }));

    return {
      original,
      normalizado,
      tokens,
      stopwordsEncontradas,
      semStopwords,
      radicais: radicais.map(r => r.radical),
      detalhesRadicais: radicais
    };
  }
}

/**
 * Mecanismo de Vetorização de Texto e Similaridade de Cosseno (Álgebra Linear)
 */
export class VectorEngine {
  /**
   * Constrói o vocabulário global a partir de um conjunto de documentos de treino.
   * @param {Array<Array<string>>} documentosTokens Lista de listas de radicais
   * @returns {Array<string>} Vocabulário ordenado
   */
  static construirVocabulario(documentosTokens) {
    const vocabSet = new Set();
    documentosTokens.forEach(doc => {
      doc.forEach(token => vocabSet.add(token));
    });
    return Array.from(vocabSet).sort();
  }

  /**
   * Calcula a Frequência do Termo (Term Frequency - TF) simples.
   * @param {Array<string>} docTokens Radicais do documento
   * @param {Array<string>} vocabulario Vocabulário global
   * @returns {Array<number>} Vetor BoW de frequências
   */
  static calcularBoW(docTokens, vocabulario) {
    const freqMap = new Map();
    docTokens.forEach(t => freqMap.set(t, (freqMap.get(t) || 0) + 1));

    return vocabulario.map(termo => freqMap.get(termo) || 0);
  }

  /**
   * Calcula o IDF (Inverse Document Frequency) para cada termo do vocabulário.
   * idf(t) = ln( (N + 1) / (df(t) + 1) ) + 1
   * @param {Array<Array<string>>} documentosTokens Coleção de documentos
   * @param {Array<string>} vocabulario 
   * @returns {Array<number>} Vetor IDF alinhado ao vocabulário
   */
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

  /**
   * Converte uma lista de radicais em um vetor ponderado TF-IDF com normalização L2.
   * @param {Array<string>} docTokens 
   * @param {Array<string>} vocabulario 
   * @param {Array<number>} idfVector 
   * @returns {Array<number>} Vetor unitário TF-IDF
   */
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

  /**
   * Normaliza um vetor euclidiano (L2 norm) para comprimento unitário (||v|| = 1).
   * @param {Array<number>} vetor 
   * @returns {Array<number>}
   */
  static normalizarVetorL2(vetor) {
    const somaQuadrados = vetor.reduce((acc, val) => acc + (val * val), 0);
    const norma = Math.sqrt(somaQuadrados);
    if (norma === 0) return vetor;
    return vetor.map(val => val / norma);
  }

  /**
   * Calcula a Similaridade de Cosseno entre dois vetores:
   * cos(theta) = (A . B) / (||A|| * ||B||)
   * Varia de 0.0 (ortogonais/sem relação) até 1.0 (vetores idênticos).
   * @param {Array<number>} vetorA 
   * @param {Array<number>} vetorB 
   * @returns {number} Similaridade [0.0 a 1.0]
   */
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
    return Math.max(0, Math.min(1, sim)); // clamp [0, 1]
  }
}

/**
 * Base de Conhecimento e Classificador Semântico 100% Client-Side
 * Carrega a base JSON de intenções em memória, constrói vocabulário e matrizes TF-IDF.
 */
export class SemanticMatcher {
  /**
   * @param {Array<{ tag: string, exemplos: Array<string>, resposta: string, acao?: string, limiar?: number }>} baseIntencoes 
   */
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

    // 1. Construir Vocabulário Global
    this.vocabulario = VectorEngine.construirVocabulario(todosDocs);

    // 2. Calcular Pesos IDF
    this.idfVector = VectorEngine.calcularIDF(todosDocs, this.vocabulario);

    // 3. Vetorizar todos os exemplos de treino da base
    this.exemplosProcessados.forEach(ex => {
      ex.vetor = VectorEngine.calcularTFIDF(ex.tokens, this.vocabulario, this.idfVector);
    });
  }

  /**
   * Classifica a mensagem do usuário encontrando a intenção de maior similaridade de cosseno.
   * @param {string} entradaUsuario 
   * @param {number} limiarMinimo Padrão conforme slide: 0.65
   * @returns {{ match: boolean, item?: object, score: number, tag?: string, tokens?: Array<string> }}
   */
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

  /**
   * Método de diagnóstico - retorna detalhes completos da classificação semântica.
   * @param {string} entradaUsuario 
   * @param {number} limiarMinimo Padrão conforme slide: 0.65
   * @returns {object} Detalhes completos da classificação
   */
  diagnosticar(entradaUsuario, limiarMinimo = 0.65) {
    const diagnosticoNLP = NLPProcessor.diagnosticar(entradaUsuario);
    const tokensEntrada = diagnosticoNLP.radicais;
    
    if (tokensEntrada.length === 0) {
      return {
        ...diagnosticoNLP,
        match: false,
        score: 0,
        limiarAplicado: limiarMinimo,
        metodo: 'NLP (entrada vazia após processamento)',
        vetorEntrada: [],
        vocabulario: this.vocabulario,
        idfVector: this.idfVector,
        similaridades: []
      };
    }

    const vetorEntrada = VectorEngine.calcularTFIDF(tokensEntrada, this.vocabulario, this.idfVector);
    const vetorBoW = VectorEngine.calcularBoW(tokensEntrada, this.vocabulario);

    let maiorScore = 0;
    let melhorExemplo = null;
    const similaridades = [];

    for (const ex of this.exemplosProcessados) {
      const score = VectorEngine.similaridadeCosseno(vetorEntrada, ex.vetor);
      similaridades.push({
        tag: ex.tag,
        textoOriginal: ex.textoOriginal,
        score: score,
        tokens: ex.tokens
      });
      if (score > maiorScore) {
        maiorScore = score;
        melhorExemplo = ex;
      }
    }

    const itemBase = melhorExemplo ? this.base[melhorExemplo.itemIndex] : null;
    const limiarAplicado = (itemBase && itemBase.limiar !== undefined) ? itemBase.limiar : limiarMinimo;
    const match = maiorScore >= limiarAplicado && itemBase;

    return {
      ...diagnosticoNLP,
      match,
      score: maiorScore,
      tag: itemBase ? itemBase.tag : null,
      limiarAplicado,
      metodo: match ? 'NLP (TF-IDF + Cosseno >= ' + limiarAplicado.toFixed(2) + ')' : 'Fallback (nenhuma intenção atingiu o limiar)',
      vetorEntrada: vetorEntrada.map(v => Number(v.toFixed(6))),
      vetorBoW,
      vocabulario: this.vocabulario,
      idfVector: this.idfVector.map(v => Number(v.toFixed(6))),
      similaridades: similaridades.map(s => ({
        tag: s.tag,
        textoOriginal: s.textoOriginal,
        score: Number(s.score.toFixed(6))
      })).sort((a, b) => b.score - a.score),
      exemploMaisProximo: melhorExemplo ? melhorExemplo.textoOriginal : null,
      itemCorrespondente: itemBase ? {
        tag: itemBase.tag,
        resposta: itemBase.resposta,
        acao: itemBase.acao
      } : null
    };
  }
}
