// Cultural fact cards system

import type { Tribe } from './types'

export interface FactCard {
  id: string
  title: string
  region: string
  tribe: Tribe | 'Global'
  body: string
  unlocked: boolean
  unlockedAt?: number
}

export class FactCardSystem {
  private cards: Map<string, FactCard> = new Map()
  private unlocked: Set<string> = new Set()
  private listeners: Array<(card: FactCard) => void> = []

  constructor() {
    this.initializeCards()
  }

  private initializeCards(): void {
    const cardDefinitions: FactCard[] = [
      {
        id: 'igbo-yam-festival',
        title: 'New Yam Festival',
        region: 'Nigeria',
        tribe: 'Igbo',
        body: 'The Igbo New Yam Festival marks the start of harvest season. Communities offer the first yams in gratitude before sharing food, dance, and storytelling.',
        unlocked: false,
      },
      {
        id: 'yoruba-talking-drum',
        title: 'Talking Drum Language',
        region: 'Nigeria',
        tribe: 'Yoruba',
        body: 'Yoruba talking drums imitate tonal speech. Skilled drummers transmit praise poetry, messages, and historical memory through rhythm and pitch.',
        unlocked: false,
      },
      {
        id: 'hausa-durbar',
        title: 'Durbar Procession',
        region: 'Nigeria',
        tribe: 'Hausa',
        body: 'Durbar is a ceremonial parade known for colorful regalia, mounted horse traditions, and public celebration of cultural identity.',
        unlocked: false,
      },
      {
        id: 'maasai-bead-symbolism',
        title: 'Maasai Bead Symbolism',
        region: 'Kenya',
        tribe: 'Maasai',
        body: 'Maasai bead colors carry meaning: red for bravery, blue for sky and energy, and green for land and growth. Beadwork expresses status and community values.',
        unlocked: false,
      },
      {
        id: 'egypt-celestial-wisdom',
        title: 'Egyptian Celestial Rituals',
        region: 'Egypt',
        tribe: 'Egyptian',
        body: 'Ancient Egyptian temples often aligned with stars and solar cycles, connecting architecture, ritual practice, and cosmology.',
        unlocked: false,
      },
      {
        id: 'berber-tea-tradition',
        title: 'Berber Mint Tea Ritual',
        region: 'Morocco',
        tribe: 'Berber',
        body: 'In many Berber communities, mint tea is hospitality in ritual form. Preparing and pouring tea reflects welcome, respect, and social connection.',
        unlocked: false,
      },
      {
        id: 'zulu-umemulo',
        title: 'Zulu Umemulo',
        region: 'South Africa',
        tribe: 'Zulu',
        body: 'Umemulo is a coming-of-age celebration honoring maturity, family support, and community continuity through dance, dress, and ceremony.',
        unlocked: false,
      },
      {
        id: 'xhosa-bead-language',
        title: 'Xhosa Bead Language',
        region: 'South Africa',
        tribe: 'Xhosa',
        body: 'Xhosa bead patterns can communicate identity and social meaning through color, arrangement, and form, making adornment a cultural language.',
        unlocked: false,
      },
      {
        id: 'amhara-coffee-ceremony',
        title: 'Amhara Coffee Ceremony',
        region: 'Ethiopia',
        tribe: 'Amhara',
        body: 'Ethiopian coffee ceremonies involve roasting, grinding, and brewing in stages. The ritual emphasizes patience, hospitality, and shared dialogue.',
        unlocked: false,
      },
      {
        id: 'oromo-gada-system',
        title: 'Oromo Gada Tradition',
        region: 'Ethiopia',
        tribe: 'Oromo',
        body: 'The Oromo Gada system is a long-standing social and governance tradition structured around age sets, consensus, and community responsibility.',
        unlocked: false,
      },
      {
        id: 'indian-spice-route',
        title: 'Indian Spice Route Heritage',
        region: 'India',
        tribe: 'Indian',
        body: 'For centuries, Indian spice networks connected local growers, ocean trade routes, and global cuisines. Spices carried culinary value, medicinal use, and cultural symbolism.',
        unlocked: false,
      },
      {
        id: 'chinese-silk-road',
        title: 'Chinese Silk and Exchange',
        region: 'China',
        tribe: 'Chinese',
        body: 'Silk production and long-distance exchange routes helped link East Asia with Central Asia and beyond, spreading textiles, ideas, and artistic techniques.',
        unlocked: false,
      },
      {
        id: 'japanese-tea-aesthetics',
        title: 'Japanese Tea and Aesthetics',
        region: 'Japan',
        tribe: 'Japanese',
        body: 'Japanese tea ceremony emphasizes harmony, respect, purity, and tranquility. Everyday acts—serving tea, arranging space, and mindful movement—become cultural art.',
        unlocked: false,
      },
      {
        id: 'indian-mantra-practice',
        title: 'Indian Mantra Practice',
        region: 'India',
        tribe: 'Indian',
        body: 'Mantra recitation in many Indian traditions combines breath, rhythm, and intention. Repetition supports concentration, memory, and a shared spiritual atmosphere.',
        unlocked: false,
      },
      {
        id: 'chinese-woodblock-printing',
        title: 'Chinese Woodblock Printing',
        region: 'China',
        tribe: 'Chinese',
        body: 'Woodblock printing enabled large-scale reproduction of texts and images, helping preserve literature, ritual manuals, and educational materials across regions.',
        unlocked: false,
      },
      {
        id: 'japanese-temple-pilgrimage',
        title: 'Japanese Temple Pilgrimage',
        region: 'Japan',
        tribe: 'Japanese',
        body: 'Temple pilgrimage routes connect movement, reflection, and devotion. Collecting seals marks each visit and records a personal journey through sacred spaces.',
        unlocked: false,
      },
      {
        id: 'asia-museum-hub',
        title: 'Asia Gallery Insight',
        region: 'Asia Hub',
        tribe: 'Global',
        body: 'The Asia gallery highlights how foodways, writing traditions, ritual arts, and architecture carry values across generations while adapting to changing societies.',
        unlocked: false,
      },
      {
        id: 'africa-museum-hub',
        title: 'Museum Hub Insight',
        region: 'Africa Hub',
        tribe: 'Global',
        body: 'The World Museum Hub connects diverse cultural practices through play, helping players compare traditions while respecting local context.',
        unlocked: false,
      },
    ]

    cardDefinitions.forEach(card => {
      this.cards.set(card.id, card)
    })
  }

  onUnlock(callback: (card: FactCard) => void): void {
    this.listeners.push(callback)
  }

  unlock(cardId: string): boolean {
    if (this.unlocked.has(cardId)) {
      return false
    }

    const card = this.cards.get(cardId)
    if (!card) {
      return false
    }

    card.unlocked = true
    card.unlockedAt = Date.now()
    this.unlocked.add(cardId)
    this.listeners.forEach(listener => listener(card))
    return true
  }

  unlockForTribe(tribe: Tribe): FactCard | null {
    const card = Array.from(this.cards.values()).find(item => item.tribe === tribe)
    if (!card) {
      return null
    }

    const wasUnlocked = this.unlock(card.id)
    return wasUnlocked ? card : null
  }

  unlockHubInsight(): FactCard | null {
    const cardId = 'africa-museum-hub'
    const wasUnlocked = this.unlock(cardId)
    if (!wasUnlocked) {
      return null
    }
    return this.cards.get(cardId) ?? null
  }

  unlockAsiaInsight(): FactCard | null {
    const cardId = 'asia-museum-hub'
    const wasUnlocked = this.unlock(cardId)
    if (!wasUnlocked) {
      return null
    }
    return this.cards.get(cardId) ?? null
  }

  getAll(): FactCard[] {
    return Array.from(this.cards.values())
  }

  getUnlockedIds(): string[] {
    return Array.from(this.unlocked)
  }

  loadUnlocked(unlockedIds: string[]): void {
    unlockedIds.forEach(cardId => {
      const card = this.cards.get(cardId)
      if (card) {
        card.unlocked = true
        this.unlocked.add(cardId)
      }
    })
  }

  getProgress(): { unlocked: number; total: number; percentage: number } {
    const total = this.cards.size
    const unlocked = this.unlocked.size
    return {
      unlocked,
      total,
      percentage: Math.round((unlocked / total) * 100),
    }
  }
}

export const factCardSystem = new FactCardSystem()
