// Achievement system

import type { Achievement } from './types'

export class AchievementSystem {
  private achievements: Map<string, Achievement> = new Map()
  private unlocked: Set<string> = new Set()
  private listeners: Array<(achievement: Achievement) => void> = []

  constructor() {
    this.initializeAchievements()
  }

  private initializeAchievements(): void {
    const achievementDefs: Achievement[] = [
      // Explorer Achievements
      {
        id: 'first-steps',
        title: 'First Steps',
        description: 'Enter your first village',
        icon: '👣',
        unlocked: false,
      },
      {
        id: 'world-traveler',
        title: 'World Traveler',
        description: 'Visit all three African regions',
        icon: '🌍',
        unlocked: false,
      },
      {
        id: 'nigeria-complete',
        title: 'Nigeria Explorer',
        description: 'Complete all Nigerian tribal missions',
        icon: '🇳🇬',
        unlocked: false,
      },
      {
        id: 'kenya-complete',
        title: 'Kenyan Warrior',
        description: 'Complete all Maasai missions',
        icon: '🇰🇪',
        unlocked: false,
      },
      {
        id: 'egypt-complete',
        title: 'Pharaoh\'s Blessing',
        description: 'Complete all Egyptian missions',
        icon: '🇪🇬',
        unlocked: false,
      },
      {
        id: 'morocco-complete',
        title: 'Berber Heritage Keeper',
        description: 'Complete all Berber missions in Morocco',
        icon: '🇲🇦',
        unlocked: false,
      },
      {
        id: 'southafrica-complete',
        title: 'Southern Traditions',
        description: 'Complete all Zulu and Xhosa missions',
        icon: '🇿🇦',
        unlocked: false,
      },
      {
        id: 'ethiopia-complete',
        title: 'Highland Wisdom',
        description: 'Complete all Amhara and Oromo missions',
        icon: '🇪🇹',
        unlocked: false,
      },
      {
        id: 'asia-complete',
        title: 'Asia Cultural Constellation',
        description: 'Complete India, China, and Japan regional journeys',
        icon: '🗺️',
        unlocked: false,
      },
      {
        id: 'india-complete',
        title: 'India Harmony Path',
        description: 'Complete all Indian cultural missions',
        icon: '🇮🇳',
        unlocked: false,
      },
      {
        id: 'china-complete',
        title: 'Middle Kingdom Artisan',
        description: 'Complete all Chinese cultural missions',
        icon: '🇨🇳',
        unlocked: false,
      },
      {
        id: 'japan-complete',
        title: 'Way of Harmony',
        description: 'Complete all Japanese cultural missions',
        icon: '🇯🇵',
        unlocked: false,
      },

      // Mission Achievements
      {
        id: 'harvest-master',
        title: 'Harvest Master',
        description: 'Collect all yams and kola nuts in Igbo village',
        icon: '🌾',
        unlocked: false,
      },
      {
        id: 'drum-virtuoso',
        title: 'Drum Virtuoso',
        description: 'Master the talking drum rhythm',
        icon: '🥁',
        unlocked: false,
      },
      {
        id: 'parade-organizer',
        title: 'Parade Organizer',
        description: 'Arrange the perfect Durbar parade',
        icon: '🎪',
        unlocked: false,
      },
      {
        id: 'oracle-wisdom',
        title: 'Oracle\'s Wisdom',
        description: 'Solve the Arochukwu stone puzzle',
        icon: '🗿',
        unlocked: false,
      },
      {
        id: 'bead-trader',
        title: 'Bead Trader',
        description: 'Complete the Maasai bead collection',
        icon: '📿',
        unlocked: false,
      },
      {
        id: 'warrior-dance',
        title: 'Warrior\'s Dance',
        description: 'Participate in the Maasai fire circle ceremony',
        icon: '🔥',
        unlocked: false,
      },
      {
        id: 'archaeologist',
        title: 'Archaeologist',
        description: 'Collect all Egyptian artifacts',
        icon: '🏺',
        unlocked: false,
      },
      {
        id: 'celestial-alignment',
        title: 'Celestial Alignment',
        description: 'Complete the pyramid temple ceremony',
        icon: '⭐',
        unlocked: false,
      },
      {
        id: 'berber-complete',
        title: 'Kasbah Artisan',
        description: 'Complete all Berber cultural activities',
        icon: '🧶',
        unlocked: false,
      },
      {
        id: 'zulu-complete',
        title: 'Zulu Warrior Path',
        description: 'Complete the Zulu warrior journey',
        icon: '🛡️',
        unlocked: false,
      },
      {
        id: 'xhosa-complete',
        title: 'Xhosa Ancestor\'s Honor',
        description: 'Complete the Xhosa ancestral path',
        icon: '🪘',
        unlocked: false,
      },
      {
        id: 'amhara-complete',
        title: 'Amhara Legacy',
        description: 'Complete the Amhara ceremonial path',
        icon: '☕',
        unlocked: false,
      },
      {
        id: 'oromo-complete',
        title: 'Oromo Council Keeper',
        description: 'Complete the Oromo ritual path',
        icon: '🌿',
        unlocked: false,
      },
      {
        id: 'indian-complete',
        title: 'Spice Route Sage',
        description: 'Complete the Indian ceremonial mission chain',
        icon: '🪔',
        unlocked: false,
      },
      {
        id: 'chinese-complete',
        title: 'Silk and Scroll Master',
        description: 'Complete the Chinese artisan mission chain',
        icon: '🏮',
        unlocked: false,
      },
      {
        id: 'japanese-complete',
        title: 'Tea and Temple Keeper',
        description: 'Complete the Japanese harmony mission chain',
        icon: '⛩️',
        unlocked: false,
      },

      // Collectible Achievements
      {
        id: 'collector-bronze',
        title: 'Bronze Collector',
        description: 'Collect 10 items across all regions',
        icon: '🥉',
        unlocked: false,
      },
      {
        id: 'collector-silver',
        title: 'Silver Collector',
        description: 'Collect 25 items across all regions',
        icon: '🥈',
        unlocked: false,
      },
      {
        id: 'collector-gold',
        title: 'Gold Collector',
        description: 'Collect 50 items across all regions',
        icon: '🥇',
        unlocked: false,
      },

      // Special Achievements
      {
        id: 'speed-runner',
        title: 'Speed Runner',
        description: 'Complete a region in under 3 minutes',
        icon: '⚡',
        unlocked: false,
      },
      {
        id: 'cultural-scholar',
        title: 'Cultural Scholar',
        description: 'Read all cultural information popups',
        icon: '📚',
        unlocked: false,
      },
      {
        id: 'unity-champion',
        title: 'Unity Champion',
        description: 'Reach the festival celebration',
        icon: '🎉',
        unlocked: false,
      },
      {
        id: 'completionist',
        title: 'Completionist',
        description: 'Complete all missions in all regions',
        icon: '👑',
        unlocked: false,
      },
    ]

    achievementDefs.forEach(ach => {
      this.achievements.set(ach.id, ach)
    })
  }

  unlock(achievementId: string): boolean {
    if (this.unlocked.has(achievementId)) {
      return false // Already unlocked
    }

    const achievement = this.achievements.get(achievementId)
    if (!achievement) {
      console.warn(`Achievement not found: ${achievementId}`)
      return false
    }

    achievement.unlocked = true
    achievement.unlockedAt = Date.now()
    this.unlocked.add(achievementId)

    // Notify listeners
    this.listeners.forEach(listener => listener(achievement))

    console.log(`🏆 Achievement Unlocked: ${achievement.title}`)
    return true
  }

  isUnlocked(achievementId: string): boolean {
    return this.unlocked.has(achievementId)
  }

  getAll(): Achievement[] {
    return Array.from(this.achievements.values())
  }

  getUnlocked(): Achievement[] {
    return this.getAll().filter(ach => ach.unlocked)
  }

  getProgress(): { unlocked: number; total: number; percentage: number } {
    const total = this.achievements.size
    const unlocked = this.unlocked.size
    return {
      unlocked,
      total,
      percentage: Math.round((unlocked / total) * 100),
    }
  }

  onUnlock(callback: (achievement: Achievement) => void): void {
    this.listeners.push(callback)
  }

  loadUnlocked(unlockedIds: string[]): void {
    unlockedIds.forEach(id => {
      const achievement = this.achievements.get(id)
      if (achievement) {
        achievement.unlocked = true
        this.unlocked.add(id)
      }
    })
  }

  getUnlockedIds(): string[] {
    return Array.from(this.unlocked)
  }

  // Helper methods for common achievement checks
  checkCollectibleCount(count: number): void {
    if (count >= 10) this.unlock('collector-bronze')
    if (count >= 25) this.unlock('collector-silver')
    if (count >= 50) this.unlock('collector-gold')
  }

  checkRegionComplete(region: string): void {
    const regionMap: Record<string, string> = {
      'nigeria': 'nigeria-complete',
      'kenya': 'kenya-complete',
      'egypt': 'egypt-complete',
      'morocco': 'morocco-complete',
      'southafrica': 'southafrica-complete',
      'ethiopia': 'ethiopia-complete',
      'india': 'india-complete',
      'china': 'china-complete',
      'japan': 'japan-complete',
    }
    const achievementId = regionMap[region.toLowerCase()]
    if (achievementId) {
      this.unlock(achievementId)

      const asiaRegionAchievements = ['india-complete', 'china-complete', 'japan-complete']
      const hasAllAsiaRegions = asiaRegionAchievements.every((id) => this.unlocked.has(id))
      if (hasAllAsiaRegions) {
        this.unlock('asia-complete')
      }
    }
  }

  checkMissionComplete(missionType: string): void {
    const missionMap: Record<string, string> = {
      'igbo-harvest': 'harvest-master',
      'yoruba-drum': 'drum-virtuoso',
      'hausa-parade': 'parade-organizer',
      'arochukwu-puzzle': 'oracle-wisdom',
      'maasai-beads': 'bead-trader',
      'maasai-dance': 'warrior-dance',
      'egypt-artifacts': 'archaeologist',
      'egypt-celestial': 'celestial-alignment',
    }
    const achievementId = missionMap[missionType]
    if (achievementId) {
      this.unlock(achievementId)
    }
  }
}

export const achievementSystem = new AchievementSystem()
