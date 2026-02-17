// Type definitions for The World Museum Hub

export type GameState = 'hub' | 'africa' | 'nigeria' | 'kenya' | 'egypt' | 'lga-select' | 'village' | 'festival'
export type Tribe = 'Igbo' | 'Yoruba' | 'Hausa' | 'Maasai' | 'Egyptian'
export type IgboLGA = 'Owerri' | 'Arochukwu' | 'Onitsha'

export interface IgboMission {
  yamsCollected: number
  kolaCollected: number
  yamsNeeded: number
  kolaNeeded: number
  cookingStage: number
  cookingDone: boolean
  delivered: boolean
  storyStage: number
  storyDone: boolean
  fabricWoven: number
  fabricNeeded: number
}

export interface ArochukwuMission {
  stonesFound: number
  stonesNeeded: number
  stonePuzzleDone: boolean
  storyUnlocked: boolean
}

export interface YorubaMission {
  sticksCollected: number
  sticksNeeded: number
  sticksDone: boolean
  drumCompleted: boolean
}

export interface HausaMission {
  fabricCollected: number
  fabricNeeded: number
  flagsCollected: number
  flagsNeeded: number
  paradeArranged: boolean
  paradeComplete: boolean
}

export interface MaasaiMission {
  beadsRed: number
  beadsYellow: number
  beadsBlue: number
  beadsNeeded: number
  beadTradingDone: boolean
  warriorDanceDone: boolean
}

export interface EgyptianMission {
  chalicesCollected: number
  chalicesNeeded: number
  scarabsCollected: number
  scarabsNeeded: number
  tabletsCollected: number
  tabletsNeeded: number
  celestialAlignmentDone: boolean
}

export interface WalkInput {
  forward: boolean
  backward: boolean
  left: boolean
  right: boolean
  sprint: boolean
}

export interface GameSave {
  version: string
  timestamp: number
  state: GameState
  selectedTribe: Tribe | null
  selectedLGA: IgboLGA | null
  missions: {
    igbo: IgboMission
    arochukwu: ArochukwuMission
    yoruba: YorubaMission
    hausa: HausaMission
    maasai: MaasaiMission
    egyptian: EgyptianMission
  }
  achievements: string[]
  stats: {
    totalPlayTime: number
    regionsVisited: string[]
    collectiblesFound: number
    missionsCompleted: number
  }
}

export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  unlocked: boolean
  unlockedAt?: number
}
