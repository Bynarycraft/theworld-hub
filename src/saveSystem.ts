// Save system using localStorage

import type { GameSave, GameState, Tribe, IgboLGA } from './types'

const SAVE_KEY = 'theworld-hub-save'
const SAVE_VERSION = '1.0.0'

export class SaveSystem {
  private startTime: number = Date.now()
  private regionsVisited: Set<string> = new Set()

  save(data: {
    state: GameState
    selectedTribe: Tribe | null
    selectedLGA: IgboLGA | null
    missions: any
    achievements: string[]
    collectiblesFound: number
    missionsCompleted: number
  }): void {
    const playTime = Date.now() - this.startTime
    
    const saveData: GameSave = {
      version: SAVE_VERSION,
      timestamp: Date.now(),
      state: data.state,
      selectedTribe: data.selectedTribe,
      selectedLGA: data.selectedLGA,
      missions: data.missions,
      achievements: data.achievements,
      stats: {
        totalPlayTime: this.getExistingPlayTime() + playTime,
        regionsVisited: Array.from(this.regionsVisited),
        collectiblesFound: data.collectiblesFound,
        missionsCompleted: data.missionsCompleted,
      },
    }

    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(saveData))
      console.log('Game saved successfully')
    } catch (error) {
      console.error('Failed to save game:', error)
    }
  }

  load(): GameSave | null {
    try {
      const savedData = localStorage.getItem(SAVE_KEY)
      if (!savedData) {
        return null
      }

      const save: GameSave = JSON.parse(savedData)
      
      // Version check
      if (save.version !== SAVE_VERSION) {
        console.warn('Save version mismatch, migration may be needed')
      }

      // Restore stats
      if (save.stats.regionsVisited) {
        this.regionsVisited = new Set(save.stats.regionsVisited)
      }

      console.log('Game loaded successfully')
      return save
    } catch (error) {
      console.error('Failed to load game:', error)
      return null
    }
  }

  deleteSave(): void {
    try {
      localStorage.removeItem(SAVE_KEY)
      console.log('Save deleted')
    } catch (error) {
      console.error('Failed to delete save:', error)
    }
  }

  hasSave(): boolean {
    return localStorage.getItem(SAVE_KEY) !== null
  }

  visitRegion(region: string): void {
    this.regionsVisited.add(region)
  }

  private getExistingPlayTime(): number {
    const save = this.load()
    return save?.stats.totalPlayTime || 0
  }

  autoSave(getData: () => any): void {
    // Auto-save every 30 seconds
    setInterval(() => {
      const data = getData()
      this.save(data)
    }, 30000)
  }

  exportSave(): string {
    const savedData = localStorage.getItem(SAVE_KEY)
    return savedData || '{}'
  }

  importSave(saveString: string): boolean {
    try {
      const save = JSON.parse(saveString)
      if (!save.version || !save.missions) {
        throw new Error('Invalid save data')
      }
      localStorage.setItem(SAVE_KEY, saveString)
      return true
    } catch (error) {
      console.error('Failed to import save:', error)
      return false
    }
  }
}

export const saveSystem = new SaveSystem()
