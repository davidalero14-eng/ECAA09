/**
 * Marmitaê - Utilitários de Formatação, Sanitização e Manipulação do DOM
 */

/**
 * Formata um valor numérico para Moeda Brasileira (BRL).
 * @param {number} valor 
 * @returns {string} Ex: "R$ 24,90"
 */
export function formatarMoeda(valor) {
  if (typeof valor !== 'number' || isNaN(valor)) {
    return 'R$ 0,00';
  }
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

/**
 * Sanitiza texto para evitar XSS ao injetar no DOM.
 * @param {string} str 
 * @returns {string}
 */
export function escaparHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Gera um ID único simples para itens de pedido ou conversas.
 * @param {string} prefixo 
 * @returns {string}
 */
export function gerarIdUnico(prefixo = 'item') {
  return `${prefixo}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
}

/**
 * Gera um código de pedido amigável (Ex: #MAR-7842).
 * @returns {string}
 */
export function gerarNumeroPedido() {
  const aleatorio = Math.floor(1000 + Math.random() * 9000);
  return `#MAR-${aleatorio}`;
}

/**
 * Retorna a hora atual formatada (HH:MM).
 * @returns {string}
 */
export function getHoraAtual() {
  const agora = new Date();
  return agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Converte quebras de linha e markdown simples (negrito, itálico) em HTML seguro.
 * @param {string} texto 
 * @returns {string}
 */
export function formatarTextoMensagem(texto) {
  if (!texto) return '';
  let seguro = escaparHTML(texto);

  // Negrito **texto** ou __texto__
  seguro = seguro.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  seguro = seguro.replace(/__(.*?)__/g, '<strong>$1</strong>');

  // Itálico *texto* ou _texto_
  seguro = seguro.replace(/\*([^\*]+)\*/g, '<em>$1</em>');

  // Quebras de linha
  seguro = seguro.replace(/\n/g, '<br>');

  return seguro;
}
