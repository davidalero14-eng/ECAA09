/**
 * Marmitaê - Gerenciador de Áudio e Acessibilidade por Voz (Text-to-Speech)
 * Utiliza a Web Audio API nativa para efeitos sonoros e Web Speech API para síntese de voz
 * em português brasileiro sem requisições de arquivos de mídia externos.
 */

class SoundService {
  constructor() {
    this.audioCtx = null;
    this.somHabilitado = localStorage.getItem('marmitae_som_habilitado') !== 'false';
    this.vozHabilitada = localStorage.getItem('marmitae_voz_habilitada') === 'true';
    this.synth = window.speechSynthesis || null;
  }

  init() {
    if (!this.audioCtx && (window.AudioContext || window.webkitAudioContext)) {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioCtxClass();
    }
  }

  toggleSom() {
    this.somHabilitado = !this.somHabilitado;
    localStorage.setItem('marmitae_som_habilitado', String(this.somHabilitado));
    return this.somHabilitado;
  }

  isSomHabilitado() {
    return this.somHabilitado;
  }

  toggleVoz() {
    this.vozHabilitada = !this.vozHabilitada;
    localStorage.setItem('marmitae_voz_habilitada', String(this.vozHabilitada));
    if (!this.vozHabilitada && this.synth) {
      this.synth.cancel();
    }
    return this.vozHabilitada;
  }

  isVozHabilitada() {
    return this.vozHabilitada;
  }

  /**
   * Toca som sutil de mensagem recebida (duplo sino suave)
   */
  tocarMensagemRecebida() {
    if (!this.somHabilitado) return;
    try {
      this.init();
      if (!this.audioCtx) return;
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const agora = this.audioCtx.currentTime;

      // Primeiro tom (D5)
      const osc1 = this.audioCtx.createOscillator();
      const gain1 = this.audioCtx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, agora);
      gain1.gain.setValueAtTime(0.08, agora);
      gain1.gain.exponentialRampToValueAtTime(0.001, agora + 0.15);
      osc1.connect(gain1);
      gain1.connect(this.audioCtx.destination);
      osc1.start(agora);
      osc1.stop(agora + 0.15);

      // Segundo tom (A5)
      const osc2 = this.audioCtx.createOscillator();
      const gain2 = this.audioCtx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, agora + 0.08);
      gain2.gain.setValueAtTime(0.08, agora + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, agora + 0.3);
      osc2.connect(gain2);
      gain2.connect(this.audioCtx.destination);
      osc2.start(agora + 0.08);
      osc2.stop(agora + 0.3);
    } catch (e) {
      // Ignora silenciosamente se o navegador bloquear autoplay
    }
  }

  /**
   * Toca tom alegre ao adicionar item no carrinho
   */
  tocarAdicionarItem() {
    if (!this.somHabilitado) return;
    try {
      this.init();
      if (!this.audioCtx) return;
      if (this.audioCtx.state === 'suspended') this.audioCtx.resume();

      const agora = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, agora); // A4
      osc.frequency.exponentialRampToValueAtTime(880, agora + 0.12); // A5

      gain.gain.setValueAtTime(0.07, agora);
      gain.gain.exponentialRampToValueAtTime(0.001, agora + 0.15);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(agora);
      osc.stop(agora + 0.15);
    } catch (e) {}
  }

  /**
   * Toca fanfarra curta ao confirmar pedido final
   */
  tocarSucessoPedido() {
    if (!this.somHabilitado) return;
    try {
      this.init();
      if (!this.audioCtx) return;
      if (this.audioCtx.state === 'suspended') this.audioCtx.resume();

      const agora = this.audioCtx.currentTime;
      const notas = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notas.forEach((freq, idx) => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, agora + (idx * 0.09));
        gain.gain.setValueAtTime(0.08, agora + (idx * 0.09));
        gain.gain.exponentialRampToValueAtTime(0.001, agora + (idx * 0.09) + 0.25);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(agora + (idx * 0.09));
        osc.stop(agora + (idx * 0.09) + 0.25);
      });
    } catch (e) {}
  }

  /**
   * Fala a mensagem do robô usando SpeechSynthesis (PT-BR)
   * @param {string} texto
   */
  falarTexto(texto) {
    if (!this.vozHabilitada || !this.synth) return;
    try {
      this.synth.cancel(); // Cancela falas anteriores para não acumular
      
      // Limpa markdown e emojis do texto para leitura natural
      const textoLimpo = texto
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/__(.*?)__/g, '$1')
        .replace(/•/g, '')
        .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
        .replace(/R\$\s*(\d+)[,\.](\d+)/g, '$1 reais e $2 centavos')
        .slice(0, 300); // Limita tamanho da fala

      const utterance = new SpeechSynthesisUtterance(textoLimpo);
      utterance.lang = 'pt-BR';
      utterance.rate = 1.05; // Levemente dinâmico
      utterance.pitch = 1.0;

      // Tenta selecionar voz em português se disponível
      const voices = this.synth.getVoices();
      const ptVoice = voices.find(v => v.lang.includes('pt-BR') || v.lang.includes('pt'));
      if (ptVoice) {
        utterance.voice = ptVoice;
      }

      this.synth.speak(utterance);
    } catch (e) {
      // Ignora erro de síntese
    }
  }
}

export const somService = new SoundService();
