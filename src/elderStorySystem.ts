import type { Tribe } from './types'

export interface ElderStory {
  id: string
  title: string
  region: string
  tribe: Tribe
  narration: string
  unlocked: boolean
  unlockedAt?: number
}

export class ElderStorySystem {
  private stories: Map<string, ElderStory> = new Map()
  private unlocked: Set<string> = new Set()
  private listeners: Array<(story: ElderStory) => void> = []

  constructor() {
    this.initializeStories()
  }

  private initializeStories(): void {
    const definitions: ElderStory[] = [
      {
        id: 'igbo-elder-story',
        title: 'Igbo Elder Wisdom',
        region: 'Nigeria',
        tribe: 'Igbo',
        narration: 'Our yam harvest reminds us that prosperity begins with gratitude. We first honor the land, then we celebrate together as one community.',
        unlocked: false,
      },
      {
        id: 'yoruba-elder-story',
        title: 'Yoruba Elder Wisdom',
        region: 'Nigeria',
        tribe: 'Yoruba',
        narration: 'The talking drum is more than rhythm. It is memory, message, and identity, carrying the voice of our ancestors across generations.',
        unlocked: false,
      },
      {
        id: 'hausa-elder-story',
        title: 'Hausa Elder Wisdom',
        region: 'Nigeria',
        tribe: 'Hausa',
        narration: 'At Durbar we ride with dignity, not to boast, but to show that discipline, honor, and unity build a strong people.',
        unlocked: false,
      },
      {
        id: 'maasai-elder-story',
        title: 'Maasai Elder Wisdom',
        region: 'Kenya',
        tribe: 'Maasai',
        narration: 'Every bead color teaches responsibility: courage, balance, and care for the land. A warrior protects both people and tradition.',
        unlocked: false,
      },
      {
        id: 'egyptian-elder-story',
        title: 'Egyptian Elder Wisdom',
        region: 'Egypt',
        tribe: 'Egyptian',
        narration: 'Stone temples align with the heavens to remind us that wisdom joins earth and sky, action and reflection, labor and legacy.',
        unlocked: false,
      },
      {
        id: 'berber-elder-story',
        title: 'Berber Elder Wisdom',
        region: 'Morocco',
        tribe: 'Berber',
        narration: 'Tea poured with care, patterns woven by hand, and shared meals all carry the same lesson: hospitality is a form of respect.',
        unlocked: false,
      },
      {
        id: 'zulu-elder-story',
        title: 'Zulu Elder Wisdom',
        region: 'South Africa',
        tribe: 'Zulu',
        narration: 'Strength is not only in the spear. It is in self-control, loyalty, and the courage to stand for your family and community.',
        unlocked: false,
      },
      {
        id: 'xhosa-elder-story',
        title: 'Xhosa Elder Wisdom',
        region: 'South Africa',
        tribe: 'Xhosa',
        narration: 'Our beadwork speaks when words are few. Pattern and color remind us that identity is built with patience and purpose.',
        unlocked: false,
      },
      {
        id: 'amhara-elder-story',
        title: 'Amhara Elder Wisdom',
        region: 'Ethiopia',
        tribe: 'Amhara',
        narration: 'Coffee ceremony teaches us to slow down, listen, and honor each guest. Time shared in peace is itself a blessing.',
        unlocked: false,
      },
      {
        id: 'oromo-elder-story',
        title: 'Oromo Elder Wisdom',
        region: 'Ethiopia',
        tribe: 'Oromo',
        narration: 'Under the council tree we learn that leadership rotates, but responsibility remains. Community thrives when every voice matters.',
        unlocked: false,
      },
      {
        id: 'indian-elder-story',
        title: 'Indian Elder Wisdom',
        region: 'India',
        tribe: 'Indian',
        narration: 'When we blend spices, keep rhythm, and chant together, we learn that knowledge is shared through taste, sound, and devotion. Tradition lives when we practice it with care.',
        unlocked: false,
      },
      {
        id: 'chinese-elder-story',
        title: 'Chinese Elder Wisdom',
        region: 'China',
        tribe: 'Chinese',
        narration: 'Silk, ink, and carved wood all teach patience. A careful hand and steady mind can preserve memory for generations and turn craft into wisdom.',
        unlocked: false,
      },
      {
        id: 'japanese-elder-story',
        title: 'Japanese Elder Wisdom',
        region: 'Japan',
        tribe: 'Japanese',
        narration: 'In tea, bonsai, and calligraphy, small actions matter. Harmony comes from attention to each moment, each gesture, and each living relationship.',
        unlocked: false,
      },
    ]

    definitions.forEach(story => {
      this.stories.set(story.id, story)
    })
  }

  onUnlock(callback: (story: ElderStory) => void): void {
    this.listeners.push(callback)
  }

  unlock(storyId: string): boolean {
    if (this.unlocked.has(storyId)) {
      return false
    }

    const story = this.stories.get(storyId)
    if (!story) {
      return false
    }

    story.unlocked = true
    story.unlockedAt = Date.now()
    this.unlocked.add(storyId)
    this.listeners.forEach(listener => listener(story))
    return true
  }

  unlockForTribe(tribe: Tribe): ElderStory | null {
    const story = Array.from(this.stories.values()).find(item => item.tribe === tribe)
    if (!story) {
      return null
    }

    const wasUnlocked = this.unlock(story.id)
    return wasUnlocked ? story : null
  }

  speak(story: ElderStory): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return
    }

    const utterance = new SpeechSynthesisUtterance(story.narration)
    utterance.rate = 0.92
    utterance.pitch = 0.96
    utterance.volume = 0.9
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
  }

  getAll(): ElderStory[] {
    return Array.from(this.stories.values())
  }

  getUnlockedIds(): string[] {
    return Array.from(this.unlocked)
  }

  loadUnlocked(unlockedIds: string[]): void {
    unlockedIds.forEach(id => {
      const story = this.stories.get(id)
      if (story) {
        story.unlocked = true
        this.unlocked.add(id)
      }
    })
  }

  getProgress(): { unlocked: number; total: number; percentage: number } {
    const total = this.stories.size
    const unlocked = this.unlocked.size
    return {
      unlocked,
      total,
      percentage: Math.round((unlocked / total) * 100),
    }
  }
}

export const elderStorySystem = new ElderStorySystem()
