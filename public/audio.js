(() => {
  class MillionaireAudio {
    constructor() {
      this.enabled = false;
      this.music = null;
      this.ctx = null;
      this.master = null;
    }

    getMusic() {
      if (!this.music) {
        this.music = document.getElementById('bgMusic');
        if (this.music) {
          this.music.volume = 0.80;
          this.music.loop = true;
          this.music.muted = false;
        }
      }
      return this.music;
    }

    async enable() {
      const music = this.getMusic();
      this.enabled = true;
      if (!music) return false;
      music.muted = false;
      music.volume = 0.80;
      try {
        await music.play();
        return true;
      } catch (err) {
        console.error('Error reproduciendo la música:', err);
        return false;
      }
    }

    disable() {
      this.enabled = false;
      const music = this.getMusic();
      if (music) music.pause();
    }

    async ensureFxContext() {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return false;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.32;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') {
        try { await this.ctx.resume(); } catch (_) {}
      }
      return true;
    }

    tone(freq, duration = 0.25, gain = 0.10, type = 'triangle', when = 0) {
      if (!this.enabled) return;
      this.ensureFxContext().then((ok) => {
        if (!ok || !this.ctx || !this.master) return;
        const now = this.ctx.currentTime + when;
        const osc = this.ctx.createOscillator();
        const amp = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, now);
        amp.gain.setValueAtTime(0.0001, now);
        amp.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), now + 0.02);
        amp.gain.exponentialRampToValueAtTime(0.0001, now + duration);
        osc.connect(amp);
        amp.connect(this.master);
        osc.start(now);
        osc.stop(now + duration + 0.05);
      });
    }

    playLobby() { if (this.enabled) this.enable(); }
    playQuestion() { if (this.enabled) this.enable(); }
    playReveal() {
      if (!this.enabled) return;
      [523.25, 659.25, 783.99].forEach((f, i) => this.tone(f, 0.30, 0.10, 'triangle', i * 0.09));
    }
    playFinal() {
      if (!this.enabled) return;
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => this.tone(f, 0.45, 0.11, 'triangle', i * 0.11));
    }
  }
  window.millionaireAudio = new MillionaireAudio();
})();
