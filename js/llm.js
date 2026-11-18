/**
 * Marmitaê - Comunicação HTTP Direta com a API do Google Gemini
 * Suporta fallback inteligente de modelos (gemini-2.0-flash, gemini-1.5-flash, gemini-1.5-pro)
 * com chamada de ferramentas (Function Calling / Tool Use).
 * Chave mantida exclusivamente em sessionStorage ou memória volátil.
 */

// Lista de modelos ordenados por prioridade / compatibilidade
const MODELOS_COMPATIVEIS = [
  'gemini-2.0-flash',
  'gemini-1.5-flash-latest',
  'gemini-1.5-flash',
  'gemini-1.5-pro'
];

const CHAVE_STORAGE_KEY = 'marmitae_gemini_api_key';

export class GeminiService {
  constructor() {
    this.apiKey = sessionStorage.getItem(CHAVE_STORAGE_KEY) || '';
    this.modeloAtivo = 'gemini-2.0-flash';
  }

  setApiKey(key) {
    const limpa = String(key || '').trim();
    this.apiKey = limpa;
    if (limpa) {
      sessionStorage.setItem(CHAVE_STORAGE_KEY, limpa);
    } else {
      sessionStorage.removeItem(CHAVE_STORAGE_KEY);
    }
  }

  getApiKey() {
    return this.apiKey;
  }

  limparApiKey() {
    this.apiKey = '';
    sessionStorage.removeItem(CHAVE_STORAGE_KEY);
  }

  temApiKey() {
    return !!this.apiKey && this.apiKey.length > 10;
  }

  /**
   * Valida a chave de API testando os modelos compatíveis até encontrar o ativo na conta do usuário.
   * @param {string} chaveParaTestar
   * @returns {Promise<{ valido: boolean, mensagem: string, modelo?: string }>}
   */
  async testarConexao(chaveParaTestar = null) {
    const key = chaveParaTestar || this.apiKey;
    if (!key || key.length < 10) {
      return { valido: false, mensagem: 'Chave não informada ou tamanho inválido.' };
    }

    // Primeiro tenta descobrir quais modelos estão disponíveis listando-os
    try {
      const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`;
      const listResp = await fetch(listUrl);
      if (listResp.ok) {
        const listData = await listResp.json();
        const models = (listData.models || [])
          .filter(m => (m.supportedGenerationMethods || []).includes('generateContent'))
          .map(m => m.name.replace('models/', ''));

        // Procura o melhor modelo disponível
        const modeloEscolhido = MODELOS_COMPATIVEIS.find(m => models.includes(m)) ||
          models.find(m => m.includes('flash')) ||
          models[0];

        if (modeloEscolhido) {
          this.modeloAtivo = modeloEscolhido;
          return {
            valido: true,
            mensagem: `Conexão estabelecida com sucesso! Modelo ativo: ${this.modeloAtivo}`,
            modelo: this.modeloAtivo
          };
        }
      }
    } catch (e) {
      // Se list_models falhar (ex: restrição CORS ou firewall), continua para o teste direto
    }

    // Fallback: Teste direto nos modelos compatíveis
    let ultimoErro = '';
    for (const model of MODELOS_COMPATIVEIS) {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;
      const bodyTeste = {
        contents: [{ role: 'user', parts: [{ text: 'Ola' }] }],
        generationConfig: { maxOutputTokens: 5 }
      };

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyTeste)
        });

        if (response.ok) {
          this.modeloAtivo = model;
          return {
            valido: true,
            mensagem: `Chave válida e conectada com sucesso! (Modelo: ${model})`,
            modelo: model
          };
        } else {
          const errData = await response.json().catch(() => ({}));
          ultimoErro = errData.error?.message || response.statusText;
          // Se for erro de autenticação (400 ou 403 de API key inválida), não adianta testar outros modelos
          if (response.status === 400 && ultimoErro.toLowerCase().includes('api key not valid')) {
            return { valido: false, mensagem: `Chave de API inválida: ${ultimoErro}` };
          }
        }
      } catch (err) {
        ultimoErro = err.message;
      }
    }

    return { valido: false, mensagem: `Erro na validação da chave: ${ultimoErro}` };
  }

  /**
   * Envia a conversa e as definições de ferramentas para o Google Gemini.
   * @param {string} systemInstruction
   * @param {Array} contents Histórico no formato Gemini: [{ role: 'user'|'model', parts: [{ text: ... }] }]
   * @param {Array} tools Definições de functionDeclarations
   * @returns {Promise<{ respostaTexto: string, toolCalls: Array, erro?: string }>}
   */
  async gerarResposta(systemInstruction, contents, tools = []) {
    if (!this.temApiKey()) {
      throw new Error('Chave de API do Gemini não configurada.');
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${this.modeloAtivo}:generateContent?key=${encodeURIComponent(this.apiKey)}`;

    const requestBody = {
      systemInstruction: {
        parts: [{ text: systemInstruction }]
      },
      contents: contents,
      generationConfig: {
        temperature: 0.3,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 800
      }
    };

    if (tools && tools.length > 0) {
      requestBody.tools = tools;
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const status = response.status;
        const msg = errorData.error?.message || response.statusText;

        if (status === 400 || status === 403) {
          throw new Error(`Chave de API inválida ou sem permissão (${status}): ${msg}`);
        } else if (status === 429) {
          throw new Error('Limite de requisições excedido na API Gemini (Rate Limit). Aguarde um instante.');
        } else {
          throw new Error(`Erro na API Gemini (${status}): ${msg}`);
        }
      }

      const data = await response.json();
      const candidate = data.candidates?.[0];

      if (!candidate) {
        return {
          respostaTexto: 'Não consegui formular uma resposta no momento. Pode tentar novamente?',
          toolCalls: []
        };
      }

      const parts = candidate.content?.parts || [];
      let respostaTexto = '';
      const toolCalls = [];

      for (const part of parts) {
        if (part.text) {
          respostaTexto += part.text;
        }
        if (part.functionCall) {
          toolCalls.push(part.functionCall);
        }
      }

      return {
        respostaTexto: respostaTexto.trim(),
        toolCalls: toolCalls
      };
    } catch (err) {
      console.error('[GeminiService Error]', err);
      throw err;
    }
  }
}
