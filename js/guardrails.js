/**
 * Marmitaê - Guardrails e Camada de Segurança Multicamadas
 * Protege contra Prompt Injection direto e indireto, Jailbreaks (DAN, Roleplay malicioso, Obfuscation),
 * Fuga de escopo comercial (programação, redações, política, religião, medicina, matemática, RPG),
 * Vazamento de instruções internas/prompts do sistema, tentativas de alteração arbitrária de preços/descontos,
 * Detecção de dados sensíveis (cartões, CPF, senhas), Sanitização estrita contra XSS e Rate Limiting client-side.
 */

import { CARDAPIO, CUPONS_VALIDOS } from './menu.js';

// 1. Padrões de Prompt Injection, Jailbreak, Bypass e Manipulação de Persona
const PADROES_INJECTION = [
  // Comandos de esquecer instruções e reset
  /ignore\s+(all\s+|todas\s+|qualquer\s+)?(as\s+)?(instru[cç][oõ]es|instructions|regras|diretrizes|sistema)/i,
  /desconsidere\s+(tudo|suas\s+regras|o\s+que\s+foi\s+dito|as\s+instru)/i,
  /esque[cç](a|a-se|er)\s+(tudo|suas\s+regras|que\s+voc[eê]\s+[eé]|todas\s+as)/i,
  /novo\s+papel|nova\s+persona|agora\s+voc[eê]\s+[eé]|a\s+partir\s+de\s+agora\s+aja\s+como/i,
  /reset\s+system|clear\s+instructions|system\s+override/i,
  
  // Tentativas de engenharia reversa e extração de prompt
  /mostre\s+(seu|o)\s+(prompt|sistema|system\s+prompt|instru[cç][oõ]es\s+internas|c[oó]digo\s+fonte)/i,
  /revele\s+(seu|suas|os)\s+(segredos|prompt|instru[cç][oõ]es|configura[cç][oõ]es|prompts)/i,
  /repita\s+(o\s+texto\s+acima|suas\s+instru[cç][oõ]es|o\s+prompt\s+inicial)/i,
  /quais\s+(s[aã]o|foram)\s+(as\s+)?(suas\s+instru[cç][oõ]es|suas\s+diretrizes|regras\s+iniciais)/i,
  /qual\s+[eé]\s+o\s+seu\s+(prompt|system\s+prompt|sistema)/i,
  /print\s+system\s+prompt|display\s+instructions/i,
  
  // Tags e prefixos falsos de sistema
  /\[system\]|\[inst\]|<<sys>>|<\|im_start\|>|<\|im_end\|>|human:|assistant:/i,
  
  // Personificação de autoridade ou invasão
  /finja\s+que\s+voc[eê]\s+[eé]\s+(um\s+)?(admin|administrador|dono|gerente|root|desenvolvedor|programador|hacker|ceo)/i,
  /sou\s+o\s+(desenvolvedor|criador|dono|administrador|gerente|patr[aã]o)\s+d[oe]/i,
  /modo\s+(dan|jailbreak|developer|dev|unrestricted|bypass|superusu[aá]rio)/i,
  /voce\s+agora\s+esta\s+desbloqueado|sem\s+restricoes|no\s+filter/i,
  
  // Fraude comercial e manipulação de valores
  /altere\s+o\s+pre[cç]o\s+de/i,
  /mude\s+o\s+valor\s+para\s+zero/i,
  /de\s+gra[cç]a|gratuitamente|tudo\s+gr[aá]tis|100%\s+de\s+desconto|coloque\s+r\$\s*0/i,
  /me\s+d[eê]\s+(todas\s+as\s+marmitas\s+)?de\s+gra[cç]a/i,
  /cupom\s+hack|desconto\s+infinito/i,
  
  // Execução remota / script injection
  /execute\s+o\s+(c[oó]digo|script|comando|payload)/i,
  /<script[\s\S]*?>[\s\S]*?<\/script>/i,
  /javascript\s*:/i,
  /onerror\s*=/i,
  /onload\s*=/i,
  /DROP\s+TABLE|SELECT\s+\*\s+FROM|UNION\s+SELECT/i,
  /eval\(|alert\(|document\.cookie/i
];

// 2. Detecção Abrangente de FUGA DE ESCOPO (Temas sem relação com alimentação/marmitaria)
const PADROES_FUGA_ESCOPO = [
  // Criação de código / programação / suporte técnico de TI
  /\b(crie|fa[cç]a|escreva|desenvolva)\s+(um|uma)?\s*(c[oó]digo|programa|fun[cç][aã]o|script|algoritmo|classe|software|api|banco\s+de\s+dados)\b/i,
  /\b(em|usando)\s+(python|java|c\+\+|c#|php|rust|typescript|assembly|sql|html|css)\b/i,
  /\b(como\s+programar|como\s+fazer\s+um\s+site|resolva\s+esse\s+bug|compilar\s+codigo)\b/i,
  
  // Redação de redações escolares, poemas, músicas e ficção externa
  /\b(escreva|redija|fa[cç]a)\s+(uma\s+reda[cç][aã]o|um\s+poema|uma\s+poesia|uma\s+m[uú]sica|uma\s+letra\s+de\s+rap|um\s+ensaio|uma\s+historia\s+sobre)\b/i,
  /\b(resumo\s+do\s+livro|resumo\s+de\s+dom\s+casmurro|enem\s+nota\s+mil)\b/i,
  /\b(quem\s+foi|quem\s+ganhou|hist[oó]ria\s+da\s+segunda\s+guerra|capital\s+da|fale\s+sobre\s+o\s+universo)\b/i,
  
  // Debates políticos, ideologias e governantes
  /\b(elei[cç][oõ]es|lula|bolsonaro|comunismo|capitalismo|partido\s+pol[ií]tico|voto\s+em|governo\s+federal)\b/i,
  
  // Consultas médicas e diagnósticos de saúde
  /\b(estou\s+com\s+febre|dor\s+de\s+cabe[cç]a|qual\s+rem[eé]dio\s+tomar|diagn[oó]stico\s+m[eé]dico|estou\s+doente)\b/i,
  
  // Cálculos matemáticos complexos aleatórios
  /\b(calcule\s+a\s+derivada|integral\s+de|f[oó]rmula\s+de\s+bhaskara|equa[cç][aã]o\s+diferencial|raiz\s+quadrada\s+de\s+\d+)\b/i,
  
  // Roleplay / Jogos de Fantasia desconectados
  /\b(finja\s+que\s+somos\s+piratas|aja\s+como\s+um\s+mago|vamos\s+jogar\s+rpg|voce\s+e\s+um\s+cavaleiro)\b/i,
  
  // Fuga para outros idiomas exigindo sair do papel
  /\b(translate\s+to\s+english\s+and\s+forget|talk\s+in\s+french\s+about\s+cars|habla\s+en\s+espanol\s+sobre\s+futbol)\b/i
];

// 3. Padrões de dados sensíveis que o cliente nunca deve enviar no chat
const PADROES_DADOS_SENSIVEIS = [
  /\b\d{4}[ -]?\d{4}[ -]?\d{4}[ -]?\d{4}\b/, // Número de cartão 16 dígitos
  /\bcvv\s*[:=]?\s*\d{3,4}\b/i,              // CVV
  /\bvalidade\s*[:=]?\s*\d{2}\/\d{2,4}\b/i,  // Validade de cartão
  /\bsenha\s*[:=]?\s*\S+/i,                  // Senhas
  /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/         // CPF
];

export class Guardrails {
  static historicoEnvios = [];
  static MAX_MENSAGENS_POR_JANELA = 8;
  static JANELA_TEMPO_MS = 15000; // 15 segundos

  /**
   * Normaliza o texto para neutralizar técnicas de ofuscação (leetspeak, espaçamento entre letras, pontuações dispersas).
   * @param {string} texto
   * @returns {string}
   */
  static normalizarParaAnalise(texto) {
    if (!texto) return '';
    let limpo = texto.toLowerCase();
    
    // Converte leetspeak comum
    limpo = limpo
      .replace(/0/g, 'o')
      .replace(/1/g, 'i')
      .replace(/3/g, 'e')
      .replace(/4/g, 'a')
      .replace(/5/g, 's')
      .replace(/7/g, 't')
      .replace(/@/g, 'a')
      .replace(/\$/g, 's');

    // Remove acentos
    limpo = limpo.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    // Descompacta letras espaçadas propositalmente (Ex: "i g n o r e" -> "ignore")
    limpo = limpo.replace(/(\b\w)\s+(\w\b)/g, '$1$2');

    return limpo;
  }

  /**
   * Valida taxa de envio de mensagens do usuário (Client-side rate limit).
   */
  static verificarRateLimit() {
    const agora = Date.now();
    this.historicoEnvios = this.historicoEnvios.filter(ts => agora - ts < this.JANELA_TEMPO_MS);
    if (this.historicoEnvios.length >= this.MAX_MENSAGENS_POR_JANELA) {
      return {
        bloqueado: true,
        resposta: '⏳ Calma lá! Você está enviando mensagens muito rápido. Aguarde alguns segundos para continuarmos nosso atendimento com calma e cuidado! 😊'
      };
    }
    this.historicoEnvios.push(agora);
    return { bloqueado: false };
  }

  /**
   * Analisa a mensagem do usuário antes de enviar ao modelo ou motor local.
   * @param {string} texto
   * @returns {{ seguro: boolean, motivo?: string, respostaPadrao?: string }}
   */
  static validarEntradaUsuario(texto) {
    if (!texto || typeof texto !== 'string') {
      return { seguro: false, motivo: 'Entrada vazia ou inválida.' };
    }

    const textoLimpo = texto.trim();
    const textoNormalizado = this.normalizarParaAnalise(textoLimpo);

    // 1. Validação de Rate Limiting
    const rateCheck = this.verificarRateLimit();
    if (rateCheck.bloqueado) {
      return {
        seguro: false,
        motivo: 'Rate limit excedido (spam detectado).',
        respostaPadrao: rateCheck.resposta
      };
    }

    // 2. Limite de tamanho de caracteres (evita estouro de contexto e abuso)
    if (textoLimpo.length > 400) {
      return {
        seguro: false,
        motivo: 'Mensagem excede o limite permitido (400 caracteres).',
        respostaPadrao: 'Sua mensagem é um pouco longa! Para agilizar seu pedido com precisão, por favor envie frases curtas com os itens ou dúvidas que deseja. 😊'
      };
    }

    // 3. Detecção de Prompt Injection, Jailbreak e Engenharia Reversa (no texto cru e normalizado)
    for (const padrao of PADROES_INJECTION) {
      if (padrao.test(textoLimpo) || padrao.test(textoNormalizado)) {
        return {
          seguro: false,
          motivo: 'Tentativa de manipulação ou desvio de escopo (Injection/Jailbreak) detectada.',
          respostaPadrao: 'Sou o assistente de vendas do **Marmitaê** e meu papel é exclusivamente te ajudar com nosso cardápio, pedidos de marmitas e bebidas! 🍲✨ Como posso te atender hoje?'
        };
      }
    }

    // 4. Detecção de Fuga de Escopo (Perguntas fora de alimentação/pedidos)
    for (const padrao of PADROES_FUGA_ESCOPO) {
      if (padrao.test(textoLimpo) || padrao.test(textoNormalizado)) {
        return {
          seguro: false,
          motivo: 'Pergunta fora do escopo comercial do restaurante (Fuga de Escopo detectada).',
          respostaPadrao: 'Meu foco aqui no **Marmitaê** é preparar e servir refeições caseiras deliciosas! 🍛 Não consigo te ajudar com temas fora da nossa cozinha (como programação, redações, política ou diagnósticos), mas posso te apresentar o cardápio do dia! Que tal uma marmita caprichada hoje?'
        };
      }
    }

    // 5. Detecção de dados sensíveis (Proteção ativa de privacidade do cliente)
    for (const padrao of PADROES_DADOS_SENSIVEIS) {
      if (padrao.test(textoLimpo)) {
        return {
          seguro: false,
          motivo: 'Envio desnecessário de dados bancários/sensíveis.',
          respostaPadrao: 'Por questões da sua segurança e proteção de dados, não compartilhe senhas, CPF ou números de cartão de crédito aqui. O pagamento é realizado na entrega (ou via PIX) com total segurança! 👍'
        };
      }
    }

    return { seguro: true };
  }

  /**
   * Valida a integridade de qualquer chamada de ferramenta (Action / Function Call)
   * garantindo que nenhum preço, produto inventado ou quantidade absurda seja executado.
   * @param {string} nomeAcao
   * @param {object} args
   * @returns {{ valido: boolean, erro?: string, argsSanitizados: object }}
   */
  static validarChamadaAcao(nomeAcao, args = {}) {
    const argsSanitizados = { ...args };

    switch (nomeAcao) {
      case 'adicionar_item': {
        const { produto_id, quantidade, personalizacoes } = argsSanitizados;
        
        // Valida se o ID existe de fato no cardápio
        const produtoExiste = CARDAPIO.some(p => p.id === produto_id);
        if (!produtoExiste) {
          return {
            valido: false,
            erro: `O produto com ID "${produto_id}" não existe no cardápio oficial.`,
            argsSanitizados
          };
        }

        // Valida quantidade (limite entre 1 e 20)
        let qtd = parseInt(quantidade, 10);
        if (isNaN(qtd) || qtd <= 0) qtd = 1;
        if (qtd > 20) qtd = 20; // Proteção contra quantidades abusivas
        argsSanitizados.quantidade = qtd;

        // Sanitiza personalizações
        if (personalizacoes && !Array.isArray(personalizacoes)) {
          argsSanitizados.personalizacoes = [String(personalizacoes).slice(0, 60)];
        } else if (Array.isArray(personalizacoes)) {
          argsSanitizados.personalizacoes = personalizacoes.map(p => String(p).slice(0, 60));
        }
        break;
      }

      case 'remover_item': {
        if (!argsSanitizados.produto_id && !argsSanitizados.id_item) {
          return { valido: false, erro: 'Identificador do item ausente para remoção.', argsSanitizados };
        }
        break;
      }

      case 'personalizar_item': {
        if (argsSanitizados.personalizacoes && Array.isArray(argsSanitizados.personalizacoes)) {
          argsSanitizados.personalizacoes = argsSanitizados.personalizacoes.map(p => String(p).slice(0, 80));
        }
        break;
      }

      case 'aplicar_cupom': {
        const cod = String(argsSanitizados.codigo || '').toUpperCase().trim();
        if (!CUPONS_VALIDOS[cod]) {
          return {
            valido: false,
            erro: `O cupom "${cod}" não existe na base cadastrada do restaurante.`,
            argsSanitizados
          };
        }
        argsSanitizados.codigo = cod;
        break;
      }

      case 'definir_entrega': {
        const tipo = String(argsSanitizados.tipo || '').toLowerCase();
        if (tipo !== 'retirada' && tipo !== 'entrega') {
          argsSanitizados.tipo = 'entrega';
        }
        if (argsSanitizados.nome_cliente) {
          argsSanitizados.nome_cliente = String(argsSanitizados.nome_cliente).slice(0, 50).trim();
        }
        if (argsSanitizados.endereco) {
          argsSanitizados.endereco = String(argsSanitizados.endereco).slice(0, 150).trim();
        }
        break;
      }

      case 'definir_pagamento': {
        if (argsSanitizados.troco_para) {
          let troco = parseFloat(String(argsSanitizados.troco_para).replace(',', '.'));
          if (isNaN(troco) || troco <= 0 || troco > 1000) troco = null;
          argsSanitizados.troco_para = troco;
        }
        break;
      }
    }

    return { valido: true, argsSanitizados };
  }

  /**
   * Valida e sanitiza a resposta do LLM antes de exibir ao usuário,
   * prevenindo vazamentos de prompt de sistema, fuga para blocos de código ou quebra de persona.
   * @param {string} respostaTexto
   * @returns {string} Resposta tratada e segura
   */
  static sanitizarRespostaLLM(respostaTexto) {
    if (!respostaTexto || typeof respostaTexto !== 'string') {
      return 'Desculpe, tive um probleminha para entender essa solicitação. Pode me dizer o que gostaria de pedir do cardápio? 🍲';
    }

    const t = respostaTexto;

    // Se o modelo cuspir partes das diretrizes de sistema
    if (
      t.includes('DIRETRIZES FUNDAMENTAIS DO MARMITAÊ') ||
      t.includes('SYSTEM INSTRUCTIONS') ||
      t.includes('Você é o atendente virtual') ||
      t.includes('GUARDRAILS MANDATÓRIOS') ||
      t.includes('systemInstruction')
    ) {
      return 'Sou o assistente de pedidos do Marmitaê! Como posso te ajudar hoje com as nossas deliciosas marmitas? 🍛';
    }

    // Se tentar responder blocos de código ou coisas desconexas (fuga não interceptada na entrada)
    if (
      t.includes('```python') || 
      t.includes('```javascript') || 
      t.includes('def main():') || 
      t.includes('function(') ||
      t.includes('import ') ||
      t.includes('SELECT * FROM')
    ) {
      return 'Sou especializado exclusivamente nas nossas marmitas e bebidas! Posso te apresentar os pratos mais pedidos de hoje? 🍲';
    }

    return respostaTexto;
  }
}
