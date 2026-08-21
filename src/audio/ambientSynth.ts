import { VibeType } from '../types';

class AmbientSoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private noiseNode: AudioBufferSourceNode | null = null;
  private noiseFilter: BiquadFilterNode | null = null;
  private droneOsc1: OscillatorNode | null = null;
  private droneOsc2: OscillatorNode | null = null;
  private droneGain: GainNode | null = null;
  private lfoOsc: OscillatorNode | null = null;
  private lfoGain: GainNode | null = null;
  private isRunning: boolean = false;
  private currentVibe: VibeType = 'calm-breeze';

  public init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    } catch {
      console.warn('Web Audio API not supported or initialized');
    }
  }

  public setVolume(vol: number) {
    if (!this.masterGain || !this.ctx) return;
    const clamped = Math.max(0, Math.min(1, vol));
    this.masterGain.gain.setTargetAtTime(clamped * 0.4, this.ctx.currentTime, 0.1);
  }

  public start(vibe: VibeType, volume: number = 0.5) {
    this.init();
    if (!this.ctx || !this.masterGain) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    if (this.isRunning) {
      this.setVibe(vibe);
      this.setVolume(volume);
      return;
    }

    this.isRunning = true;
    this.currentVibe = vibe;

    // Create noise generator buffer (10s stereo pink/white noise)
    const bufferSize = this.ctx.sampleRate * 5;
    const noiseBuffer = this.ctx.createBuffer(2, bufferSize, this.ctx.sampleRate);
    for (let channel = 0; channel < 2; channel++) {
      const output = noiseBuffer.getChannelData(channel);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04;
        b6 = white * 0.115926;
      }
    }

    this.noiseNode = this.ctx.createBufferSource();
    this.noiseNode.buffer = noiseBuffer;
    this.noiseNode.loop = true;

    this.noiseFilter = this.ctx.createBiquadFilter();
    this.noiseFilter.type = 'lowpass';
    this.noiseFilter.frequency.setValueAtTime(450, this.ctx.currentTime);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.3, this.ctx.currentTime);

    this.noiseNode.connect(this.noiseFilter);
    this.noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    // Warm Harmonic Drone
    this.droneOsc1 = this.ctx.createOscillator();
    this.droneOsc2 = this.ctx.createOscillator();
    this.droneGain = this.ctx.createGain();

    this.droneOsc1.type = 'sine';
    this.droneOsc2.type = 'triangle';
    this.droneOsc1.frequency.setValueAtTime(110, this.ctx.currentTime); // A2
    this.droneOsc2.frequency.setValueAtTime(164.81, this.ctx.currentTime); // E3

    this.droneGain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    this.droneOsc1.connect(this.droneGain);
    this.droneOsc2.connect(this.droneGain);
    this.droneGain.connect(this.masterGain);

    // LFO to create gentle wave breathing
    this.lfoOsc = this.ctx.createOscillator();
    this.lfoGain = this.ctx.createGain();
    this.lfoOsc.frequency.setValueAtTime(0.12, this.ctx.currentTime); // ~8s cycle
    this.lfoGain.gain.setValueAtTime(150, this.ctx.currentTime);
    this.lfoOsc.connect(this.noiseFilter.frequency);

    this.noiseNode.start();
    this.droneOsc1.start();
    this.droneOsc2.start();
    this.lfoOsc.start();

    this.applyVibeAcoustics(vibe);
    this.setVolume(volume);
  }

  public setVibe(vibe: VibeType) {
    this.currentVibe = vibe;
    if (this.isRunning && this.ctx) {
      this.applyVibeAcoustics(vibe);
    }
  }

  private applyVibeAcoustics(vibe: VibeType) {
    if (!this.ctx || !this.noiseFilter || !this.droneOsc1 || !this.droneOsc2 || !this.droneGain || !this.lfoOsc) return;

    const t = this.ctx.currentTime;
    switch (vibe) {
      case 'calm-breeze':
        this.noiseFilter.type = 'lowpass';
        this.noiseFilter.frequency.setTargetAtTime(380, t, 0.8);
        this.droneOsc1.frequency.setTargetAtTime(146.83, t, 0.8); // D3
        this.droneOsc2.frequency.setTargetAtTime(220.0, t, 0.8); // A3
        this.droneGain.gain.setTargetAtTime(0.12, t, 0.5);
        this.lfoOsc.frequency.setTargetAtTime(0.08, t, 0.5);
        break;

      case 'electric-storm':
        this.noiseFilter.type = 'bandpass';
        this.noiseFilter.frequency.setTargetAtTime(180, t, 0.4);
        this.droneOsc1.frequency.setTargetAtTime(55.0, t, 0.4); // A1 sub
        this.droneOsc2.frequency.setTargetAtTime(82.4, t, 0.4); // E2
        this.droneGain.gain.setTargetAtTime(0.25, t, 0.5);
        this.lfoOsc.frequency.setTargetAtTime(0.35, t, 0.5);
        break;

      case 'melancholy-rain':
        this.noiseFilter.type = 'bandpass';
        this.noiseFilter.frequency.setTargetAtTime(950, t, 0.8);
        this.droneOsc1.frequency.setTargetAtTime(98.0, t, 0.8); // G2
        this.droneOsc2.frequency.setTargetAtTime(146.83, t, 0.8); // D3
        this.droneGain.gain.setTargetAtTime(0.08, t, 0.5);
        this.lfoOsc.frequency.setTargetAtTime(0.15, t, 0.5);
        break;

      case 'radiant-heat':
        this.noiseFilter.type = 'lowpass';
        this.noiseFilter.frequency.setTargetAtTime(250, t, 0.8);
        this.droneOsc1.frequency.setTargetAtTime(130.81, t, 0.8); // C3
        this.droneOsc2.frequency.setTargetAtTime(196.0, t, 0.8); // G3
        this.droneGain.gain.setTargetAtTime(0.18, t, 0.5);
        this.lfoOsc.frequency.setTargetAtTime(0.05, t, 0.5);
        break;

      case 'aurora-borealis':
        this.noiseFilter.type = 'lowpass';
        this.noiseFilter.frequency.setTargetAtTime(600, t, 0.8);
        this.droneOsc1.frequency.setTargetAtTime(174.61, t, 0.8); // F3
        this.droneOsc2.frequency.setTargetAtTime(261.63, t, 0.8); // C4
        this.droneGain.gain.setTargetAtTime(0.14, t, 0.5);
        this.lfoOsc.frequency.setTargetAtTime(0.06, t, 0.5);
        break;
    }
  }

  public triggerLightningStrike() {
    if (!this.ctx || !this.masterGain || !this.isRunning) return;
    try {
      const t = this.ctx.currentTime;
      // High crackle burst followed by low rumble
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, t);
      osc.frequency.exponentialRampToValueAtTime(30, t + 0.6);
      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.85);
    } catch {
      // Ignored
    }
  }

  public stop() {
    if (!this.masterGain || !this.ctx) return;
    this.masterGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.2);
    setTimeout(() => {
      if (this.noiseNode) {
        try { this.noiseNode.stop(); } catch {}
        this.noiseNode.disconnect();
        this.noiseNode = null;
      }
      if (this.droneOsc1) {
        try { this.droneOsc1.stop(); } catch {}
        this.droneOsc1.disconnect();
        this.droneOsc1 = null;
      }
      if (this.droneOsc2) {
        try { this.droneOsc2.stop(); } catch {}
        this.droneOsc2.disconnect();
        this.droneOsc2 = null;
      }
      if (this.lfoOsc) {
        try { this.lfoOsc.stop(); } catch {}
        this.lfoOsc.disconnect();
        this.lfoOsc = null;
      }
      this.isRunning = false;
    }, 250);
  }
}

export const ambientSynth = new AmbientSoundEngine();
