/**
 * Procedural Web Audio API Sound Synthesizer for AeroTest Pro
 * Real-time engine acoustics, turbine spool whine, combustion rumble,
 * afterburner crackle, compressor stall bang, master caution/warning klaxons,
 * fire bell alarm, and speech annunciator.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.65;
  private initialized: boolean = false;

  // Engine audio nodes
  private rumbleGain: GainNode | null = null;
  private rumbleFilter: BiquadFilterNode | null = null;
  private rumbleSource: AudioBufferSourceNode | null = null;

  private whineGain: GainNode | null = null;
  private whineOsc1: OscillatorNode | null = null;
  private whineOsc2: OscillatorNode | null = null;
  private whineFilter: BiquadFilterNode | null = null;

  private combustionGain: GainNode | null = null;
  private combustionFilter: BiquadFilterNode | null = null;
  private combustionSource: AudioBufferSourceNode | null = null;

  private afterburnerGain: GainNode | null = null;
  private afterburnerFilter: BiquadFilterNode | null = null;
  private afterburnerSource: AudioBufferSourceNode | null = null;

  // Alarm intervals / oscillators
  private warningOsc: OscillatorNode | null = null;
  private warningGain: GainNode | null = null;
  private warningInterval: number | null = null;
  private isWarningPlaying: boolean = false;

  private fireBellOsc: OscillatorNode | null = null;
  private fireBellGain: GainNode | null = null;
  private fireBellInterval: number | null = null;
  private isFireBellPlaying: boolean = false;

  private speechCooldown: { [key: string]: number } = {};

  public init() {
    if (this.initialized && this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.setupNoiseGenerators();
      this.setupTurbineWhine();
      this.initialized = true;
    } catch (err) {
      console.warn('AudioContext failed to initialize:', err);
    }
  }

  private createNoiseBuffer(duration: number = 2.0): AudioBuffer {
    if (!this.ctx) throw new Error('No context');
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0.0;
    // Generate pink noise
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5; // gain compensation
    }
    return buffer;
  }

  private setupNoiseGenerators() {
    if (!this.ctx || !this.masterGain) return;

    const noiseBuffer = this.createNoiseBuffer(3.0);

    // 1. Core Sub-Bass Rumble
    this.rumbleSource = this.ctx.createBufferSource();
    this.rumbleSource.buffer = noiseBuffer;
    this.rumbleSource.loop = true;

    this.rumbleFilter = this.ctx.createBiquadFilter();
    this.rumbleFilter.type = 'lowpass';
    this.rumbleFilter.frequency.setValueAtTime(60, this.ctx.currentTime);
    this.rumbleFilter.Q.setValueAtTime(3.5, this.ctx.currentTime);

    this.rumbleGain = this.ctx.createGain();
    this.rumbleGain.gain.setValueAtTime(0.01, this.ctx.currentTime);

    this.rumbleSource.connect(this.rumbleFilter);
    this.rumbleFilter.connect(this.rumbleGain);
    this.rumbleGain.connect(this.masterGain);
    this.rumbleSource.start();

    // 2. Combustion Roar / Jet Jet Exhaust
    const combustionBuffer = this.createNoiseBuffer(3.0);
    this.combustionSource = this.ctx.createBufferSource();
    this.combustionSource.buffer = combustionBuffer;
    this.combustionSource.loop = true;

    this.combustionFilter = this.ctx.createBiquadFilter();
    this.combustionFilter.type = 'bandpass';
    this.combustionFilter.frequency.setValueAtTime(350, this.ctx.currentTime);
    this.combustionFilter.Q.setValueAtTime(1.2, this.ctx.currentTime);

    this.combustionGain = this.ctx.createGain();
    this.combustionGain.gain.setValueAtTime(0.01, this.ctx.currentTime);

    this.combustionSource.connect(this.combustionFilter);
    this.combustionFilter.connect(this.combustionGain);
    this.combustionGain.connect(this.masterGain);
    this.combustionSource.start();

    // 3. Afterburner / Reheat Distortion Roar
    const abBuffer = this.createNoiseBuffer(2.0);
    this.afterburnerSource = this.ctx.createBufferSource();
    this.afterburnerSource.buffer = abBuffer;
    this.afterburnerSource.loop = true;

    this.afterburnerFilter = this.ctx.createBiquadFilter();
    this.afterburnerFilter.type = 'peaking';
    this.afterburnerFilter.frequency.setValueAtTime(220, this.ctx.currentTime);
    this.afterburnerFilter.gain.setValueAtTime(10, this.ctx.currentTime);

    this.afterburnerGain = this.ctx.createGain();
    this.afterburnerGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

    this.afterburnerSource.connect(this.afterburnerFilter);
    this.afterburnerFilter.connect(this.afterburnerGain);
    this.afterburnerGain.connect(this.masterGain);
    this.afterburnerSource.start();
  }

  private setupTurbineWhine() {
    if (!this.ctx || !this.masterGain) return;

    // Dual oscillator bank for blade-pass frequency whine
    this.whineOsc1 = this.ctx.createOscillator();
    this.whineOsc1.type = 'sine';
    this.whineOsc1.frequency.setValueAtTime(180, this.ctx.currentTime);

    this.whineOsc2 = this.ctx.createOscillator();
    this.whineOsc2.type = 'triangle';
    this.whineOsc2.frequency.setValueAtTime(360, this.ctx.currentTime);

    this.whineFilter = this.ctx.createBiquadFilter();
    this.whineFilter.type = 'bandpass';
    this.whineFilter.frequency.setValueAtTime(1000, this.ctx.currentTime);
    this.whineFilter.Q.setValueAtTime(4.0, this.ctx.currentTime);

    this.whineGain = this.ctx.createGain();
    this.whineGain.gain.setValueAtTime(0.01, this.ctx.currentTime);

    this.whineOsc1.connect(this.whineFilter);
    this.whineOsc2.connect(this.whineFilter);
    this.whineFilter.connect(this.whineGain);
    this.whineGain.connect(this.masterGain);

    this.whineOsc1.start();
    this.whineOsc2.start();
  }

  /**
   * Update real-time continuous acoustic parameters based on engine state
   */
  public updateEngineSound(n1: number, n2: number, throttle: number, afterburner: boolean, flameout: boolean) {
    if (!this.initialized || !this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime + 0.05;

    if (flameout || (n1 < 2 && n2 < 2)) {
      // Windmilling / silent shutdown
      this.rumbleGain?.gain.setTargetAtTime(0.001, t, 0.4);
      this.combustionGain?.gain.setTargetAtTime(0.001, t, 0.3);
      this.whineGain?.gain.setTargetAtTime(0.005 * (n1 / 20), t, 0.5);
      this.afterburnerGain?.gain.setTargetAtTime(0, t, 0.1);
      return;
    }

    const n1Norm = Math.min(Math.max(n1 / 100, 0), 1.2);
    const n2Norm = Math.min(Math.max(n2 / 100, 0), 1.2);
    const thrNorm = Math.min(Math.max(throttle / 100, 0), 1.2);

    // 1. Core Rumble (scales with N2 and fuel burn)
    if (this.rumbleFilter && this.rumbleGain) {
      const rumbleFreq = 40 + n2Norm * 130;
      this.rumbleFilter.frequency.setTargetAtTime(rumbleFreq, t, 0.08);
      const targetRumbleGain = (0.05 + n2Norm * 0.45) * (0.4 + thrNorm * 0.6);
      this.rumbleGain.gain.setTargetAtTime(targetRumbleGain, t, 0.08);
    }

    // 2. High-pitched Turbine & Fan Blade Whine (scales with N1)
    if (this.whineOsc1 && this.whineOsc2 && this.whineFilter && this.whineGain) {
      // Base frequency 250Hz at idle, up to 2600Hz at max spool
      const fundamental = 200 + Math.pow(n1Norm, 1.4) * 2200;
      this.whineOsc1.frequency.setTargetAtTime(fundamental, t, 0.06);
      this.whineOsc2.frequency.setTargetAtTime(fundamental * 1.5, t, 0.06);
      this.whineFilter.frequency.setTargetAtTime(fundamental * 1.2, t, 0.06);

      // Buzzsaw effect at high fan speeds
      const buzzsawBoost = n1Norm > 0.85 ? (n1Norm - 0.85) * 1.2 : 0;
      const targetWhineGain = (0.02 + Math.pow(n1Norm, 1.2) * 0.25 + buzzsawBoost * 0.15);
      this.whineGain.gain.setTargetAtTime(targetWhineGain, t, 0.08);
    }

    // 3. Combustion Hiss & Jet Shear Noise
    if (this.combustionFilter && this.combustionGain) {
      const jetFreq = 300 + thrNorm * 1400;
      this.combustionFilter.frequency.setTargetAtTime(jetFreq, t, 0.1);
      const targetCombGain = 0.02 + Math.pow(thrNorm, 1.5) * 0.4;
      this.combustionGain.gain.setTargetAtTime(targetCombGain, t, 0.08);
    }

    // 4. Afterburner
    if (this.afterburnerGain && this.afterburnerFilter) {
      if (afterburner) {
        this.afterburnerGain.gain.setTargetAtTime(0.55, t, 0.15);
        this.afterburnerFilter.frequency.setTargetAtTime(180, t, 0.1);
      } else {
        this.afterburnerGain.gain.setTargetAtTime(0.0, t, 0.2);
      }
    }
  }

  /**
   * Sound effect: Compressor Stall / Surge Bang
   * Shockwave acoustic discharge
   */
  public playCompressorStallBang() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.35);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, t);
    filter.frequency.exponentialRampToValueAtTime(80, t + 0.35);

    gain.gain.setValueAtTime(0.9, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.42);

    this.speak('COMPRESSOR STALL');
  }

  /**
   * Sound effect: FOD / Bird Strike Heavy Impact
   */
  public playFODImpact() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.25);

    gain.gain.setValueAtTime(0.85, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.32);

    this.speak('VIBRATION WARNING. FOREIGN OBJECT DAMAGE.');
  }

  /**
   * Sound effect: Fire Extinguisher Squib Bottle Discharge (Halon purge hiss)
   */
  public playFireBottleDischarge() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const noiseBuffer = this.createNoiseBuffer(1.5);
    const source = this.ctx.createBufferSource();
    source.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1200, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.8, t);
    gain.gain.linearRampToValueAtTime(0.5, t + 0.5);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1.4);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    source.start(t);
    source.stop(t + 1.5);

    this.speak('FIRE BOTTLE DISCHARGED');
  }

  /**
   * Master Caution Chime: Aviation dual-harmonic chime
   */
  public playMasterCaution() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(900, t);
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1200, t);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.masterGain);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.85);
    osc2.stop(t + 0.85);
  }

  /**
   * Master Warning Klaxon: Alternating dual-tone alarm
   */
  public startMasterWarning() {
    if (this.isWarningPlaying || !this.ctx || !this.masterGain || this.isMuted) return;
    this.isWarningPlaying = true;

    try {
      this.warningOsc = this.ctx.createOscillator();
      this.warningGain = this.ctx.createGain();

      this.warningOsc.type = 'sawtooth';
      this.warningOsc.frequency.setValueAtTime(800, this.ctx.currentTime);
      this.warningGain.gain.setValueAtTime(0.28, this.ctx.currentTime);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1500, this.ctx.currentTime);

      this.warningOsc.connect(filter);
      filter.connect(this.warningGain);
      this.warningGain.connect(this.masterGain);

      this.warningOsc.start();

      let high = false;
      this.warningInterval = window.setInterval(() => {
        if (!this.warningOsc || !this.ctx) return;
        const now = this.ctx.currentTime;
        high = !high;
        this.warningOsc.frequency.setValueAtTime(high ? 1040 : 800, now);
      }, 250);
    } catch (e) {
      console.warn('Warning klaxon error:', e);
    }
  }

  public stopMasterWarning() {
    if (!this.isWarningPlaying) return;
    if (this.warningInterval) {
      clearInterval(this.warningInterval);
      this.warningInterval = null;
    }
    try {
      this.warningOsc?.stop();
      this.warningOsc?.disconnect();
    } catch {
      // ignore
    }
    this.warningOsc = null;
    this.warningGain = null;
    this.isWarningPlaying = false;
  }

  /**
   * Continuous Engine Fire Bell: Rapid piercing claxon
   */
  public startFireAlarm() {
    if (this.isFireBellPlaying || !this.ctx || !this.masterGain || this.isMuted) return;
    this.isFireBellPlaying = true;

    try {
      this.fireBellOsc = this.ctx.createOscillator();
      this.fireBellGain = this.ctx.createGain();

      this.fireBellOsc.type = 'square';
      this.fireBellOsc.frequency.setValueAtTime(1250, this.ctx.currentTime);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1250, this.ctx.currentTime);
      filter.Q.setValueAtTime(5.0, this.ctx.currentTime);

      this.fireBellGain.gain.setValueAtTime(0.35, this.ctx.currentTime);

      this.fireBellOsc.connect(filter);
      filter.connect(this.fireBellGain);
      this.fireBellGain.connect(this.masterGain);

      this.fireBellOsc.start();

      // Pulsing bell rhythm
      let on = true;
      this.fireBellInterval = window.setInterval(() => {
        if (!this.fireBellGain || !this.ctx) return;
        on = !on;
        this.fireBellGain.gain.setValueAtTime(on ? 0.35 : 0.02, this.ctx.currentTime);
      }, 90);

      this.speak('FIRE! ENGINE ONE FIRE!');
    } catch (e) {
      console.warn('Fire bell error:', e);
    }
  }

  public stopFireAlarm() {
    if (!this.isFireBellPlaying) return;
    if (this.fireBellInterval) {
      clearInterval(this.fireBellInterval);
      this.fireBellInterval = null;
    }
    try {
      this.fireBellOsc?.stop();
      this.fireBellOsc?.disconnect();
    } catch {
      // ignore
    }
    this.fireBellOsc = null;
    this.fireBellGain = null;
    this.isFireBellPlaying = false;
  }

  /**
   * Cockpit Voice Annunciator via Speech Synthesis with rate limiting
   */
  public speak(phrase: string) {
    if (this.isMuted) return;
    const now = Date.now();
    if (this.speechCooldown[phrase] && now - this.speechCooldown[phrase] < 4000) {
      return; // prevent spamming
    }
    this.speechCooldown[phrase] = now;

    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(phrase);
        utterance.rate = 1.15;
        utterance.pitch = 0.95;
        utterance.volume = this.volume;
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn('Speech synthesis error:', err);
      }
    }
  }

  /**
   * Mechanical Cockpit Switch Click
   */
  public playSwitchClick() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(420, t);
    osc.frequency.exponentialRampToValueAtTime(120, t + 0.04);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.06);
  }

  /**
   * APU Spool-up acoustic sound
   */
  public playAPUSpool() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(1800, t + 4.5);

    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(0.25, t + 2.0);
    gain.gain.exponentialRampToValueAtTime(0.08, t + 5.0);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 5.2);
  }

  /**
   * Pneumatic Air Starter High-Pressure Hiss
   */
  public playStarterAirHiss() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const t = this.ctx.currentTime;
    const noiseBuffer = this.createNoiseBuffer(2.5);
    const source = this.ctx.createBufferSource();
    source.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, t);
    filter.Q.setValueAtTime(2.5, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.28, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 2.4);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    source.start(t);
    source.stop(t + 2.5);
  }

  /**
   * Engine Igniter Spark Plugs (Rapid electrical ticking)
   */
  public playIgnitionSparks() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const t = this.ctx.currentTime;
    for (let i = 0; i < 6; i++) {
      const sparkTime = t + i * 0.12;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(3200, sparkTime);
      gain.gain.setValueAtTime(0.18, sparkTime);
      gain.gain.exponentialRampToValueAtTime(0.001, sparkTime + 0.03);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(sparkTime);
      osc.stop(sparkTime + 0.04);
    }
  }

  // Volume & Mute Controls
  public setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
    }
    if (this.isMuted) {
      this.stopMasterWarning();
      this.stopFireAlarm();
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    }
    return this.isMuted;
  }

  public getVolume(): number {
    return this.volume;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public isWarningActive(): boolean {
    return this.isWarningPlaying;
  }

  public isFireActive(): boolean {
    return this.isFireBellPlaying;
  }
}

export const soundEngine = new SoundEngine();
