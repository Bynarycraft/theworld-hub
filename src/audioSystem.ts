// Audio system module

export class AudioSystem {
  private audioContext: AudioContext | null = null
  private ambientOscillator: OscillatorNode | null = null
  private ambientGain: GainNode | null = null
  private audioEnabled = false

  init(): void {
    if (this.audioContext) return

    this.audioContext = new AudioContext()
    this.ambientGain = this.audioContext.createGain()
    this.ambientGain.connect(this.audioContext.destination)
    this.ambientGain.gain.value = 0.08
    this.audioEnabled = true
  }

  playTone(frequency: number, duration = 0.15): void {
    if (!this.audioEnabled || !this.audioContext) return

    const osc = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()
    osc.type = 'sine'
    osc.frequency.value = frequency
    gain.gain.value = 0.12
    osc.connect(gain)
    gain.connect(this.audioContext.destination)
    osc.start()
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration)
    osc.stop(this.audioContext.currentTime + duration)
  }

  setAmbientTone(frequency: number): void {
    if (!this.audioEnabled || !this.audioContext || !this.ambientGain) return

    if (this.ambientOscillator) {
      this.ambientOscillator.stop()
      this.ambientOscillator = null
    }

    this.ambientOscillator = this.audioContext.createOscillator()
    this.ambientOscillator.type = 'sine'
    this.ambientOscillator.frequency.value = frequency
    this.ambientOscillator.connect(this.ambientGain)
    this.ambientOscillator.start()
  }

  stopAmbient(): void {
    if (this.ambientOscillator) {
      this.ambientOscillator.stop()
      this.ambientOscillator = null
    }
  }

  isEnabled(): boolean {
    return this.audioEnabled
  }

  enable(): void {
    this.init()
  }

  disable(): void {
    this.stopAmbient()
    this.audioEnabled = false
  }
}

export const audioSystem = new AudioSystem()
