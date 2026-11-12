/**
 * Marmitaê - Comunicação HTTP Direta com a API do Google Gemini
 * Utiliza o modelo gemini-1.5-flash com chamada de ferramentas (Function Calling / Tool Use).
 * Chave mantida exclusivamente em sessionStorage ou memória volátil.
 */

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
const CHAVE_STORAGE_KEY = 'marmitae_gemini_api_key';

export class GeminiService {
  constructor() {
    this.apiKey = sessionStorage.getItem(CHAVE_STORAGE_KEY) || '';
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

    const endpoint = `${GEMINI_API_URL}?key=${encodeURIComponent(this.apiKey)}`;

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
