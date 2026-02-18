// Language mini-lessons system

import type { Tribe } from './types'

export interface LanguageLesson {
  id: string
  title: string
  region: string
  tribe: Tribe
  phrase: string
  pronunciation: string
  meaning: string
  unlocked: boolean
  unlockedAt?: number
}

export class LanguageLessonSystem {
  private lessons: Map<string, LanguageLesson> = new Map()
  private unlocked: Set<string> = new Set()
  private listeners: Array<(lesson: LanguageLesson) => void> = []

  constructor() {
    this.initializeLessons()
  }

  private initializeLessons(): void {
    const lessonDefinitions: LanguageLesson[] = [
      {
        id: 'igbo-greeting',
        title: 'Igbo Greeting',
        region: 'Nigeria',
        tribe: 'Igbo',
        phrase: 'Ndewo',
        pronunciation: 'N-DEH-WOH',
        meaning: 'Hello / Greetings',
        unlocked: false,
      },
      {
        id: 'yoruba-greeting',
        title: 'Yoruba Greeting',
        region: 'Nigeria',
        tribe: 'Yoruba',
        phrase: 'Ẹ káàbọ̀',
        pronunciation: 'EH KAA-BOH',
        meaning: 'Welcome',
        unlocked: false,
      },
      {
        id: 'hausa-greeting',
        title: 'Hausa Greeting',
        region: 'Nigeria',
        tribe: 'Hausa',
        phrase: 'Sannu',
        pronunciation: 'SAHN-NOO',
        meaning: 'Hello',
        unlocked: false,
      },
      {
        id: 'maasai-greeting',
        title: 'Maa Greeting',
        region: 'Kenya',
        tribe: 'Maasai',
        phrase: 'Supa',
        pronunciation: 'SOO-PAH',
        meaning: 'Hello (to one person)',
        unlocked: false,
      },
      {
        id: 'egyptian-arabic-greeting',
        title: 'Egyptian Arabic Greeting',
        region: 'Egypt',
        tribe: 'Egyptian',
        phrase: 'Ahlan',
        pronunciation: 'AH-LAN',
        meaning: 'Hello / Welcome',
        unlocked: false,
      },
      {
        id: 'berber-greeting',
        title: 'Amazigh Greeting',
        region: 'Morocco',
        tribe: 'Berber',
        phrase: 'Azul',
        pronunciation: 'AH-ZOOL',
        meaning: 'Hello / Peace',
        unlocked: false,
      },
      {
        id: 'zulu-greeting',
        title: 'Zulu Greeting',
        region: 'South Africa',
        tribe: 'Zulu',
        phrase: 'Sawubona',
        pronunciation: 'SAH-WOO-BOH-NAH',
        meaning: 'I see you (Hello)',
        unlocked: false,
      },
      {
        id: 'xhosa-greeting',
        title: 'Xhosa Greeting',
        region: 'South Africa',
        tribe: 'Xhosa',
        phrase: 'Molo',
        pronunciation: 'MOH-LOH',
        meaning: 'Hello',
        unlocked: false,
      },
      {
        id: 'amharic-greeting',
        title: 'Amharic Greeting',
        region: 'Ethiopia',
        tribe: 'Amhara',
        phrase: 'Selam',
        pronunciation: 'SEH-LAHM',
        meaning: 'Peace / Hello',
        unlocked: false,
      },
      {
        id: 'oromo-greeting',
        title: 'Afaan Oromo Greeting',
        region: 'Ethiopia',
        tribe: 'Oromo',
        phrase: 'Akkam',
        pronunciation: 'AH-KAHM',
        meaning: 'How are you? / Greeting',
        unlocked: false,
      },
      {
        id: 'indian-greeting',
        title: 'Hindi Greeting',
        region: 'India',
        tribe: 'Indian',
        phrase: 'Namaste',
        pronunciation: 'NAH-MAH-STEH',
        meaning: 'I bow to you / Hello',
        unlocked: false,
      },
      {
        id: 'chinese-greeting',
        title: 'Mandarin Greeting',
        region: 'China',
        tribe: 'Chinese',
        phrase: 'Nǐ hǎo',
        pronunciation: 'NEE HAO',
        meaning: 'Hello',
        unlocked: false,
      },
      {
        id: 'japanese-greeting',
        title: 'Japanese Greeting',
        region: 'Japan',
        tribe: 'Japanese',
        phrase: 'Konnichiwa',
        pronunciation: 'KOH-NEE-CHEE-WAH',
        meaning: 'Good day / Hello',
        unlocked: false,
      },
    ]

    lessonDefinitions.forEach(lesson => {
      this.lessons.set(lesson.id, lesson)
    })
  }

  onUnlock(callback: (lesson: LanguageLesson) => void): void {
    this.listeners.push(callback)
  }

  unlock(lessonId: string): boolean {
    if (this.unlocked.has(lessonId)) {
      return false
    }

    const lesson = this.lessons.get(lessonId)
    if (!lesson) {
      return false
    }

    lesson.unlocked = true
    lesson.unlockedAt = Date.now()
    this.unlocked.add(lessonId)
    this.listeners.forEach(listener => listener(lesson))
    return true
  }

  unlockForTribe(tribe: Tribe): LanguageLesson | null {
    const lesson = Array.from(this.lessons.values()).find(item => item.tribe === tribe)
    if (!lesson) {
      return null
    }

    const wasUnlocked = this.unlock(lesson.id)
    return wasUnlocked ? lesson : null
  }

  getAll(): LanguageLesson[] {
    return Array.from(this.lessons.values())
  }

  getUnlockedIds(): string[] {
    return Array.from(this.unlocked)
  }

  loadUnlocked(unlockedIds: string[]): void {
    unlockedIds.forEach(lessonId => {
      const lesson = this.lessons.get(lessonId)
      if (lesson) {
        lesson.unlocked = true
        this.unlocked.add(lessonId)
      }
    })
  }

  getProgress(): { unlocked: number; total: number; percentage: number } {
    const total = this.lessons.size
    const unlocked = this.unlocked.size
    return {
      unlocked,
      total,
      percentage: Math.round((unlocked / total) * 100),
    }
  }
}

export const languageLessonSystem = new LanguageLessonSystem()
