// Interactive historical timelines system

import type { Tribe } from './types'

export interface TimelineEntry {
  yearLabel: string
  event: string
}

export interface TimelineCard {
  id: string
  title: string
  region: string
  tribe: Tribe
  entries: TimelineEntry[]
  unlocked: boolean
  unlockedAt?: number
}

export class TimelineSystem {
  private timelines: Map<string, TimelineCard> = new Map()
  private unlocked: Set<string> = new Set()
  private listeners: Array<(timeline: TimelineCard) => void> = []

  constructor() {
    this.initializeTimelines()
  }

  private initializeTimelines(): void {
    const definitions: TimelineCard[] = [
      {
        id: 'igbo-timeline',
        title: 'Igbo Community Timeline',
        region: 'Nigeria',
        tribe: 'Igbo',
        entries: [
          { yearLabel: 'Precolonial Era', event: 'Village republic governance and market networks flourish.' },
          { yearLabel: '19th Century', event: 'Long-distance trade and ritual institutions expand.' },
          { yearLabel: 'Today', event: 'Festivals and language traditions remain central to identity.' },
        ],
        unlocked: false,
      },
      {
        id: 'yoruba-timeline',
        title: 'Yoruba Cultural Timeline',
        region: 'Nigeria',
        tribe: 'Yoruba',
        entries: [
          { yearLabel: 'Classical Period', event: 'Urban centers and artistic bronze traditions develop.' },
          { yearLabel: '18th–19th Century', event: 'Court music and drumming systems gain regional influence.' },
          { yearLabel: 'Today', event: 'Language, drumming, and festivals continue globally.' },
        ],
        unlocked: false,
      },
      {
        id: 'hausa-timeline',
        title: 'Hausa Heritage Timeline',
        region: 'Nigeria',
        tribe: 'Hausa',
        entries: [
          { yearLabel: 'Early City-States', event: 'Walled Hausa states emerge as trade hubs.' },
          { yearLabel: 'Trans-Sahel Trade', event: 'Caravan exchange links communities across regions.' },
          { yearLabel: 'Today', event: 'Durbar and craftsmanship traditions remain celebrated.' },
        ],
        unlocked: false,
      },
      {
        id: 'maasai-timeline',
        title: 'Maasai Pastoral Timeline',
        region: 'Kenya',
        tribe: 'Maasai',
        entries: [
          { yearLabel: 'Historical Migrations', event: 'Pastoral communities settle across East African plains.' },
          { yearLabel: 'Colonial Era', event: 'Land-use shifts impact grazing routes and settlement.' },
          { yearLabel: 'Today', event: 'Ceremonial age-set culture and beadwork remain vital.' },
        ],
        unlocked: false,
      },
      {
        id: 'egyptian-timeline',
        title: 'Egyptian Civilization Timeline',
        region: 'Egypt',
        tribe: 'Egyptian',
        entries: [
          { yearLabel: 'c. 3000 BCE', event: 'Early dynastic unification forms ancient state traditions.' },
          { yearLabel: 'c. 1500 BCE', event: 'Monumental temple culture and ritual life reach new scale.' },
          { yearLabel: 'Today', event: 'Archaeological heritage inspires global historical study.' },
        ],
        unlocked: false,
      },
      {
        id: 'berber-timeline',
        title: 'Amazigh (Berber) Timeline',
        region: 'Morocco',
        tribe: 'Berber',
        entries: [
          { yearLabel: 'Ancient North Africa', event: 'Amazigh communities shape mountain and caravan cultures.' },
          { yearLabel: 'Medieval Period', event: 'Regional dynasties and trade corridors expand influence.' },
          { yearLabel: 'Today', event: 'Language revival and artisanal traditions remain active.' },
        ],
        unlocked: false,
      },
      {
        id: 'zulu-timeline',
        title: 'Zulu Timeline',
        region: 'South Africa',
        tribe: 'Zulu',
        entries: [
          { yearLabel: '18th Century', event: 'Chiefdom consolidation strengthens military organization.' },
          { yearLabel: '19th Century', event: 'Regional conflicts and alliances reshape governance.' },
          { yearLabel: 'Today', event: 'Dance, language, and ceremony continue across generations.' },
        ],
        unlocked: false,
      },
      {
        id: 'xhosa-timeline',
        title: 'Xhosa Timeline',
        region: 'South Africa',
        tribe: 'Xhosa',
        entries: [
          { yearLabel: 'Early Settlements', event: 'Agro-pastoral communities establish enduring homelands.' },
          { yearLabel: '18th–19th Century', event: 'Frontier interactions transform regional life and politics.' },
          { yearLabel: 'Today', event: 'Language, oral literature, and beadwork traditions persist.' },
        ],
        unlocked: false,
      },
      {
        id: 'amhara-timeline',
        title: 'Amhara Timeline',
        region: 'Ethiopia',
        tribe: 'Amhara',
        entries: [
          { yearLabel: 'Medieval Era', event: 'Highland kingdoms and church scholarship gain prominence.' },
          { yearLabel: 'Early Modern Period', event: 'Court culture and manuscript traditions deepen.' },
          { yearLabel: 'Today', event: 'Coffee ceremony and liturgical heritage continue widely.' },
        ],
        unlocked: false,
      },
      {
        id: 'oromo-timeline',
        title: 'Oromo Timeline',
        region: 'Ethiopia',
        tribe: 'Oromo',
        entries: [
          { yearLabel: 'Historical Expansion', event: 'Oromo communities spread and adapt across diverse regions.' },
          { yearLabel: 'Gada Cycles', event: 'Governance rotates through age-set leadership structures.' },
          { yearLabel: 'Today', event: 'Language, ritual gatherings, and community governance endure.' },
        ],
        unlocked: false,
      },
      {
        id: 'indian-timeline',
        title: 'Indian Cultural Timeline',
        region: 'India',
        tribe: 'Indian',
        entries: [
          { yearLabel: 'Ancient Period', event: 'Urban centers, philosophy schools, and ritual traditions expand.' },
          { yearLabel: 'Classical Era', event: 'Music, mathematics, and literary traditions influence broad regions.' },
          { yearLabel: 'Today', event: 'Plural languages, festivals, and culinary arts continue to evolve globally.' },
        ],
        unlocked: false,
      },
      {
        id: 'chinese-timeline',
        title: 'Chinese Cultural Timeline',
        region: 'China',
        tribe: 'Chinese',
        entries: [
          { yearLabel: 'Early Dynasties', event: 'Statecraft, writing systems, and ritual institutions develop.' },
          { yearLabel: 'Imperial Era', event: 'Silk exchange, printing, and scholarship shape regional networks.' },
          { yearLabel: 'Today', event: 'Classical arts and modern innovation coexist in cultural life.' },
        ],
        unlocked: false,
      },
      {
        id: 'japanese-timeline',
        title: 'Japanese Cultural Timeline',
        region: 'Japan',
        tribe: 'Japanese',
        entries: [
          { yearLabel: 'Early Courts', event: 'Court ritual, poetry, and imported ideas form lasting traditions.' },
          { yearLabel: 'Medieval to Early Modern', event: 'Warrior governance and refined arts evolve side by side.' },
          { yearLabel: 'Today', event: 'Tea, design, and seasonal festivals remain central cultural practices.' },
        ],
        unlocked: false,
      },
    ]

    definitions.forEach(card => {
      this.timelines.set(card.id, card)
    })
  }

  onUnlock(callback: (timeline: TimelineCard) => void): void {
    this.listeners.push(callback)
  }

  unlock(timelineId: string): boolean {
    if (this.unlocked.has(timelineId)) {
      return false
    }

    const timeline = this.timelines.get(timelineId)
    if (!timeline) {
      return false
    }

    timeline.unlocked = true
    timeline.unlockedAt = Date.now()
    this.unlocked.add(timelineId)
    this.listeners.forEach(listener => listener(timeline))
    return true
  }

  unlockForTribe(tribe: Tribe): TimelineCard | null {
    const timeline = Array.from(this.timelines.values()).find(item => item.tribe === tribe)
    if (!timeline) {
      return null
    }

    const wasUnlocked = this.unlock(timeline.id)
    return wasUnlocked ? timeline : null
  }

  getAll(): TimelineCard[] {
    return Array.from(this.timelines.values())
  }

  getUnlockedIds(): string[] {
    return Array.from(this.unlocked)
  }

  loadUnlocked(unlockedIds: string[]): void {
    unlockedIds.forEach(id => {
      const timeline = this.timelines.get(id)
      if (timeline) {
        timeline.unlocked = true
        this.unlocked.add(id)
      }
    })
  }

  getProgress(): { unlocked: number; total: number; percentage: number } {
    const total = this.timelines.size
    const unlocked = this.unlocked.size
    return {
      unlocked,
      total,
      percentage: Math.round((unlocked / total) * 100),
    }
  }
}

export const timelineSystem = new TimelineSystem()
