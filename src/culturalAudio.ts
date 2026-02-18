// Cultural audio system with instrument simulations

export class CulturalAudioSystem {
  private audioContext: AudioContext | null = null
  private masterGain: GainNode | null = null
  private activeOscillators: OscillatorNode[] = []
  private activeGains: GainNode[] = []
  private rhythmInterval: number | null = null
  private enabled = false

  init(): void {
    if (this.audioContext) return

    this.audioContext = new AudioContext()
    this.masterGain = this.audioContext.createGain()
    this.masterGain.connect(this.audioContext.destination)
    this.masterGain.gain.value = 0.15
    this.enabled = true
  }

  stop(): void {
    this.stopAll()
    if (this.rhythmInterval) {
      clearInterval(this.rhythmInterval)
      this.rhythmInterval = null
    }
  }

  private stopAll(): void {
    this.activeOscillators.forEach(osc => {
      try {
        osc.stop()
        osc.disconnect()
      } catch (e) {
        // Already stopped
      }
    })
    this.activeGains.forEach(gain => gain.disconnect())
    this.activeOscillators = []
    this.activeGains = []
  }

  private createTone(freq: number, type: OscillatorType, volume: number, duration?: number): void {
    if (!this.audioContext || !this.masterGain || !this.enabled) return

    const osc = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()
    
    osc.type = type
    osc.frequency.value = freq
    gain.gain.value = volume
    
    osc.connect(gain)
    gain.connect(this.masterGain)
    
    osc.start()
    
    if (duration) {
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration)
      osc.stop(this.audioContext.currentTime + duration)
    } else {
      this.activeOscillators.push(osc)
      this.activeGains.push(gain)
    }
  }

  // Nigerian Igbo - Ekwe drum patterns
  playIgboAmbient(): void {
    this.stop()
    if (!this.audioContext || !this.enabled) return

    // Base drone (like Udu drum resonance)
    this.createTone(110, 'sine', 0.08)
    this.createTone(165, 'sine', 0.05)
    
    // Ekwe rhythm pattern (wooden slit drum)
    const ekwePattern = [220, 0, 220, 0, 165, 0, 220, 0]
    let beatIndex = 0
    
    this.rhythmInterval = window.setInterval(() => {
      const freq = ekwePattern[beatIndex % ekwePattern.length]
      if (freq > 0) {
        this.createTone(freq, 'square', 0.06, 0.15)
      }
      beatIndex++
    }, 600)
  }

  // Yoruba - Talking drum patterns
  playYorubaAmbient(): void {
    this.stop()
    if (!this.audioContext || !this.enabled) return

    // Bass tone (like Dundun bass drum)
    this.createTone(98, 'sine', 0.09)
    
    // Talking drum melody (variable pitch)
    const talkingDrumPattern = [294, 330, 294, 262, 294, 330, 349, 294]
    let beatIndex = 0
    
    this.rhythmInterval = window.setInterval(() => {
      const freq = talkingDrumPattern[beatIndex % talkingDrumPattern.length]
      this.createTone(freq, 'triangle', 0.07, 0.2)
      beatIndex++
    }, 500)
  }

  // Hausa - Kalangu and goje (fiddle) blend
  playHausaAmbient(): void {
    this.stop()
    if (!this.audioContext || !this.enabled) return

    // Goje (one-string fiddle) drone
    this.createTone(147, 'sawtooth', 0.06)
    this.createTone(220, 'sawtooth', 0.04)
    
    // Kalangu (hourglass drum) rhythm
    const kalangu = [196, 0, 196, 0, 147, 196, 0, 147]
    let beatIndex = 0
    
    this.rhythmInterval = window.setInterval(() => {
      const freq = kalangu[beatIndex % kalangu.length]
      if (freq > 0) {
        this.createTone(freq, 'square', 0.08, 0.18)
      }
      beatIndex++
    }, 550)
  }

  // Maasai - Deep vocals and enkipaata (horn) patterns
  playMaasaiAmbient(): void {
    this.stop()
    if (!this.audioContext || !this.enabled) return

    // Deep vocal drone (throat singing style)
    this.createTone(82, 'sine', 0.10)
    this.createTone(123, 'sine', 0.06)
    
    // Enkipaata (horn) calls
    const hornPattern = [198, 0, 0, 198, 0, 165, 0, 198]
    let beatIndex = 0
    
    this.rhythmInterval = window.setInterval(() => {
      const freq = hornPattern[beatIndex % hornPattern.length]
      if (freq > 0) {
        this.createTone(freq, 'triangle', 0.09, 0.25)
      }
      beatIndex++
    }, 700)
  }

  // Egyptian - Oud and Ney flute patterns
  playEgyptianAmbient(): void {
    this.stop()
    if (!this.audioContext || !this.enabled) return

    // Oud (lute) drone
    this.createTone(110, 'triangle', 0.07)
    this.createTone(165, 'triangle', 0.05)
    
    // Ney flute melody (maqam scale)
    const neyMelody = [330, 370, 392, 440, 392, 370, 330, 294]
    let melodyIndex = 0
    
    this.rhythmInterval = window.setInterval(() => {
      const freq = neyMelody[melodyIndex % neyMelody.length]
      this.createTone(freq, 'sine', 0.08, 0.4)
      melodyIndex++
    }, 800)
  }

  // Berber/Moroccan - Bendir drum and lotar lute
  playBerberAmbient(): void {
    this.stop()
    if (!this.audioContext || !this.enabled) return

    // Lotar (lute) drone
    this.createTone(131, 'triangle', 0.08)
    this.createTone(196, 'triangle', 0.05)
    
    // Bendir (frame drum) pattern
    const bendirPattern = [165, 0, 165, 196, 0, 165, 0, 196]
    let beatIndex = 0
    
    this.rhythmInterval = window.setInterval(() => {
      const freq = bendirPattern[beatIndex % bendirPattern.length]
      if (freq > 0) {
        this.createTone(freq, 'square', 0.09, 0.2)
      }
      beatIndex++
    }, 520)
  }

  // Zulu - Uhadi musical bow + Isicathamiya vocals
  playZuluAmbient(): void {
    this.stop()
    if (!this.audioContext || !this.enabled) return

    // Uhadi musical bow (mouth resonator - overtone harmonics)
    this.createTone(98, 'sine', 0.08)      // Fundamental
    this.createTone(196, 'sine', 0.06)     // Octave harmonic
    this.createTone(294, 'triangle', 0.04) // Third harmonic
    
    // Isicathamiya vocal pattern (harmonized rhythm)
    const vocalPattern = [294, 330, 349, 392, 349, 330, 294, 262]
    let beatIndex = 0
    
    this.rhythmInterval = window.setInterval(() => {
      const freq = vocalPattern[beatIndex % vocalPattern.length]
      this.createTone(freq, 'sine', 0.07, 0.25)
      beatIndex++
    }, 750)
  }

  // Xhosa - Click percussion + vocal traditions
  playXhosaAmbient(): void {
    this.stop()
    if (!this.audioContext || !this.enabled) return

    // Bass drone (ceremonial drum foundation)
    this.createTone(110, 'sine', 0.08)
    this.createTone(165, 'triangle', 0.05)
    
    // Click-inspired percussive pattern (high frequency pops)
    const clickPattern = [1320, 0, 1760, 0, 1320, 1760, 0, 1320]
    let beatIndex = 0
    
    this.rhythmInterval = window.setInterval(() => {
      const freq = clickPattern[beatIndex % clickPattern.length]
      if (freq > 0) {
        // Very short percussive click sound
        this.createTone(freq, 'square', 0.04, 0.05)
      }
      beatIndex++
    }, 600)
  }

  // Amhara - masenqo-inspired strings and church chant tones
  playAmharaAmbient(): void {
    this.stop()
    if (!this.audioContext || !this.enabled) return

    this.createTone(147, 'triangle', 0.07)
    this.createTone(220, 'sine', 0.05)

    const chantPattern = [294, 330, 349, 330, 294, 262, 294, 247]
    let beatIndex = 0

    this.rhythmInterval = window.setInterval(() => {
      const freq = chantPattern[beatIndex % chantPattern.length]
      this.createTone(freq, 'sine', 0.07, 0.28)
      beatIndex++
    }, 700)
  }

  // Oromo - low drum pulse and flute-like melody
  playOromoAmbient(): void {
    this.stop()
    if (!this.audioContext || !this.enabled) return

    this.createTone(98, 'sine', 0.08)
    this.createTone(147, 'triangle', 0.05)

    const oromoPattern = [247, 262, 294, 262, 247, 220, 247, 196]
    let beatIndex = 0

    this.rhythmInterval = window.setInterval(() => {
      const freq = oromoPattern[beatIndex % oromoPattern.length]
      this.createTone(freq, 'triangle', 0.07, 0.22)
      beatIndex++
    }, 620)
  }

  // Hub - Gentle world ambiance
  playHubAmbient(): void {
    this.stop()
    if (!this.audioContext || !this.enabled) return

    // Calm drone
    this.createTone(110, 'sine', 0.06)
    this.createTone(220, 'sine', 0.03)
  }

  // Africa gallery - Pan-African blend
  playAfricaAmbient(): void {
    this.stop()
    if (!this.audioContext || !this.enabled) return

    // Layered African tones
    this.createTone(110, 'sine', 0.07)
    this.createTone(165, 'triangle', 0.05)
    this.createTone(220, 'sine', 0.04)
    
    // Simple rhythm
    const pattern = [220, 0, 165, 0]
    let beatIndex = 0
    
    this.rhythmInterval = window.setInterval(() => {
      const freq = pattern[beatIndex % pattern.length]
      if (freq > 0) {
        this.createTone(freq, 'triangle', 0.06, 0.15)
      }
      beatIndex++
    }, 650)
  }

  // Festival celebration - Joyful polyrhythm
  playFestivalAmbient(_culture: string): void {
    this.stop()
    if (!this.audioContext || !this.enabled) return

    // Rich harmonic base
    this.createTone(196, 'sine', 0.09)
    this.createTone(294, 'triangle', 0.06)
    this.createTone(392, 'sine', 0.04)
    
    // Celebration rhythm (faster, more complex)
    const festivalPattern = [294, 330, 392, 330, 294, 392, 440, 392]
    let beatIndex = 0
    
    this.rhythmInterval = window.setInterval(() => {
      const freq = festivalPattern[beatIndex % festivalPattern.length]
      this.createTone(freq, 'triangle', 0.08, 0.15)
      beatIndex++
    }, 300)
  }

  // Interaction sound
  playInteractionSound(frequency: number, duration = 0.12): void {
    this.createTone(frequency, 'sine', 0.12, duration)
  }

  // Collectible sound
  playCollectSound(): void {
    if (!this.audioContext || !this.enabled) return
    
    this.createTone(523, 'sine', 0.1, 0.08)
    setTimeout(() => this.createTone(659, 'sine', 0.08, 0.08), 80)
  }

  // Success sound
  playSuccessSound(): void {
    if (!this.audioContext || !this.enabled) return
    
    this.createTone(523, 'sine', 0.1, 0.1)
    setTimeout(() => this.createTone(659, 'sine', 0.1, 0.1), 100)
    setTimeout(() => this.createTone(784, 'sine', 0.12, 0.15), 200)
  }

  // Achievement unlock sound
  playAchievementSound(): void {
    if (!this.audioContext || !this.enabled) return
    
    this.createTone(659, 'sine', 0.1, 0.1)
    setTimeout(() => this.createTone(784, 'sine', 0.1, 0.1), 100)
    setTimeout(() => this.createTone(880, 'sine', 0.1, 0.1), 200)
    setTimeout(() => this.createTone(1046, 'sine', 0.12, 0.2), 300)
  }

  isEnabled(): boolean {
    return this.enabled
  }

  enable(): void {
    this.init()
  }

  disable(): void {
    this.stop()
    this.enabled = false
  }
}

export const culturalAudio = new CulturalAudioSystem()
