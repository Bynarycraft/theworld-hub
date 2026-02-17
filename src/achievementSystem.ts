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
    }
    const achievementId = regionMap[region.toLowerCase()]
    if (achievementId) {
      this.unlock(achievementId)
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
