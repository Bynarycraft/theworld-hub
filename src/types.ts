// Type definitions for The World Museum Hub

export type GameState = 'hub' | 'africa' | 'nigeria' | 'kenya' | 'egypt' | 'morocco' | 'southafrica' | 'ethiopia' | 'asia' | 'india' | 'china' | 'japan' | 'lga-select' | 'village' | 'festival'
export type Tribe = 'Igbo' | 'Yoruba' | 'Hausa' | 'Maasai' | 'Egyptian' | 'Berber' | 'Zulu' | 'Xhosa' | 'Amhara' | 'Oromo' | 'Indian' | 'Chinese' | 'Japanese'
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
  rhythmHits: number
  rhythmNeeded: number
  rhythmActive: boolean
  rhythmDone: boolean
}

export interface HausaMission {
  fabricCollected: number
  fabricNeeded: number
  flagsCollected: number
  flagsNeeded: number
  paradeArranged: boolean
  paradeComplete: boolean
  arranged: boolean
}

export interface MaasaiMission {
  beadsRed: number
  beadsYellow: number
  beadsGreen: number
  beadsBlue: number
  beadsNeeded: number
  beadTradingDone: boolean
  warriorDanceDone: boolean
  danceSteps: number
  ceremonyDone: boolean
}

export interface EgyptianMission {
  chalicesCollected: number
  chalicesNeeded: number
  scarabsCollected: number
  scarabsNeeded: number
  tabletsCollected: number
  tabletsNeeded: number
  celestialAlignmentDone: boolean
  celestialDone: boolean
  alignmentSteps: number
}

export interface BerberMission {
  woolRed: number
  woolBlue: number
  woolYellow: number
  woolNeeded: number
  carpetWoven: boolean
  hennaCollected: number
  hennaNeeded: number
  hennaArtDone: boolean
  mintCollected: number
  mintNeeded: number
  teaCeremonyDone: boolean
  spicesCollected: number
  spicesNeeded: number
  tagineCookingDone: boolean
}

export interface ZuluMission {
  cowhideCollected: number
  cowhideNeeded: number
  woodCollected: number
  woodNeeded: number
  shieldCrafted: boolean
  spearsCollected: number
  spearsNeeded: number
  spearTrainingDone: boolean
  cattleHerded: number
  cattleNeeded: number
  herdingDone: boolean
  ceremonyPreparationDone: boolean
  umemuloDone: boolean
}

export interface XhosaMission {
  beadsWhite: number
  beadsRed: number
  beadsBlack: number
  beadsNeeded: number
  beadworkDone: boolean
  ochreCollected: number
  ochreNeeded: number
  bodyPaintingDone: boolean
  stickFightingSteps: number
  stickFightingDone: boolean
  ritualItemsCollected: number
  ritualItemsNeeded: number
  ancestralOfferingDone: boolean
}

export interface AmharaMission {
  coffeeBeansCollected: number
  coffeeBeansNeeded: number
  coffeeCeremonyDone: boolean
  teffCollected: number
  teffNeeded: number
  injeraDone: boolean
  crossesCarved: number
  crossesNeeded: number
  crossCarvingDone: boolean
  manuscriptsOrganized: number
  manuscriptsNeeded: number
  manuscriptDone: boolean
}

export interface OromoMission {
  councilParticipationDone: boolean
  irreechaOfferingsCollected: number
  irreechaOfferingsNeeded: number
  irreechaDone: boolean
  butterCoffeeIngredientsCollected: number
  butterCoffeeIngredientsNeeded: number
  butterCoffeeDone: boolean
  sycamoreRitualItemsCollected: number
  sycamoreRitualItemsNeeded: number
  sycamoreRitualDone: boolean
}

export interface IndianMission {
  spicesCollected: number
  spicesNeeded: number
  spiceMixingDone: boolean
  talaMeasuresDone: boolean
  mantrasChanted: number
  mantrasNeeded: number
  mantraDone: boolean
  tajMahalContemplationDone: boolean
}

export interface ChineseMission {
  silkSpoolsCollected: number
  silkSpoolsNeeded: number
  silkDyedDone: boolean
  woodBlocksCarved: number
  woodBlocksNeeded: number
  woodblockPrintingDone: boolean
  paintedScrollsCollected: number
  paintedScrollsNeeded: number
  artworkCompleteDone: boolean
}

export interface JapaneseMission {
  teaLeavesGathered: number
  teaLeavesNeeded: number
  teaCeremonyDone: boolean
  bonsaiTrimmed: number
  bonsaiNeeded: number
  bonsaiPruningDone: boolean
  calligraphyCharactersWritten: number
  calligraphyNeeded: number
  calligraphyArtDone: boolean
  templesVisited: number
  templesNeeded: number
  templePilgrimageDone: boolean
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
    berber: BerberMission
    zulu: ZuluMission
    xhosa: XhosaMission
    amhara: AmharaMission
    oromo: OromoMission
  }
  achievements: string[]
  factCards?: string[]
  languageLessons?: string[]
  historicalTimelines?: string[]
  recipeBooks?: string[]
  elderStories?: string[]
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
