// Mission state management

import type {
  IgboMission,
  ArochukwuMission,
  YorubaMission,
  HausaMission,
  MaasaiMission,
  EgyptianMission,
  Tribe,
} from './types'

export class MissionManager {
  igbo: IgboMission = {
    yamsCollected: 0,
    kolaCollected: 0,
    yamsNeeded: 5,
    kolaNeeded: 3,
    cookingStage: 0,
    cookingDone: false,
    delivered: false,
    storyStage: 0,
    storyDone: false,
    fabricWoven: 0,
    fabricNeeded: 2,
  }

  arochukwu: ArochukwuMission = {
    stonesFound: 0,
    stonesNeeded: 3,
    stonePuzzleDone: false,
    storyUnlocked: false,
  }

  yoruba: YorubaMission = {
    sticksCollected: 0,
    sticksNeeded: 2,
    sticksDone: false,
    drumCompleted: false,
  }

  hausa: HausaMission = {
    fabricCollected: 0,
    fabricNeeded: 5,
    flagsCollected: 0,
    flagsNeeded: 3,
    paradeArranged: false,
    paradeComplete: false,
  }

  maasai: MaasaiMission = {
    beadsRed: 0,
    beadsYellow: 0,
    beadsBlue: 0,
    beadsNeeded: 3,
    beadTradingDone: false,
    warriorDanceDone: false,
  }

  egyptian: EgyptianMission = {
    chalicesCollected: 0,
    chalicesNeeded: 3,
    scarabsCollected: 0,
    scarabsNeeded: 4,
    tabletsCollected: 0,
    tabletsNeeded: 2,
    celestialAlignmentDone: false,
  }

  getTotalCollectibles(): number {
    return (
      this.igbo.yamsCollected +
      this.igbo.kolaCollected +
      this.yoruba.sticksCollected +
      this.hausa.fabricCollected +
      this.hausa.flagsCollected +
      this.maasai.beadsRed +
      this.maasai.beadsYellow +
      this.maasai.beadsBlue +
      this.egyptian.chalicesCollected +
      this.egyptian.scarabsCollected +
      this.egyptian.tabletsCollected +
      this.arochukwu.stonesFound
    )
  }

  getTotalMissionsCompleted(): number {
    let count = 0
    if (this.igbo.delivered) count++
    if (this.yoruba.drumCompleted) count++
    if (this.hausa.paradeComplete) count++
    if (this.arochukwu.stonePuzzleDone) count++
    if (this.maasai.warriorDanceDone) count++
    if (this.egyptian.celestialAlignmentDone) count++
    return count
  }

  isTribeComplete(tribe: Tribe): boolean {
    switch (tribe) {
      case 'Igbo':
        return this.igbo.delivered && this.arochukwu.stonePuzzleDone
      case 'Yoruba':
        return this.yoruba.drumCompleted
      case 'Hausa':
        return this.hausa.paradeComplete
      case 'Maasai':
        return this.maasai.warriorDanceDone
      case 'Egyptian':
        return this.egyptian.celestialAlignmentDone
      default:
        return false
    }
  }

  isRegionComplete(region: string): boolean {
    switch (region.toLowerCase()) {
      case 'nigeria':
        return (
          this.isTribeComplete('Igbo') &&
          this.isTribeComplete('Yoruba') &&
          this.isTribeComplete('Hausa')
        )
      case 'kenya':
        return this.isTribeComplete('Maasai')
      case 'egypt':
        return this.isTribeComplete('Egyptian')
      default:
        return false
    }
  }

  reset(): void {
    this.igbo = {
      yamsCollected: 0,
      kolaCollected: 0,
      yamsNeeded: 5,
      kolaNeeded: 3,
      cookingStage: 0,
      cookingDone: false,
      delivered: false,
      storyStage: 0,
      storyDone: false,
      fabricWoven: 0,
      fabricNeeded: 2,
    }

    this.arochukwu = {
      stonesFound: 0,
      stonesNeeded: 3,
      stonePuzzleDone: false,
      storyUnlocked: false,
    }

    this.yoruba = {
      sticksCollected: 0,
      sticksNeeded: 2,
      sticksDone: false,
      drumCompleted: false,
    }

    this.hausa = {
      fabricCollected: 0,
      fabricNeeded: 5,
      flagsCollected: 0,
      flagsNeeded: 3,
      paradeArranged: false,
      paradeComplete: false,
    }

    this.maasai = {
      beadsRed: 0,
      beadsYellow: 0,
      beadsBlue: 0,
      beadsNeeded: 3,
      beadTradingDone: false,
      warriorDanceDone: false,
    }

    this.egyptian = {
      chalicesCollected: 0,
      chalicesNeeded: 3,
      scarabsCollected: 0,
      scarabsNeeded: 4,
      tabletsCollected: 0,
      tabletsNeeded: 2,
      celestialAlignmentDone: false,
    }
  }

  loadFromSave(missions: any): void {
    if (missions.igbo) Object.assign(this.igbo, missions.igbo)
    if (missions.arochukwu) Object.assign(this.arochukwu, missions.arochukwu)
    if (missions.yoruba) Object.assign(this.yoruba, missions.yoruba)
    if (missions.hausa) Object.assign(this.hausa, missions.hausa)
    if (missions.maasai) Object.assign(this.maasai, missions.maasai)
    if (missions.egyptian) Object.assign(this.egyptian, missions.egyptian)
  }

  exportForSave(): any {
    return {
      igbo: this.igbo,
      arochukwu: this.arochukwu,
      yoruba: this.yoruba,
      hausa: this.hausa,
      maasai: this.maasai,
      egyptian: this.egyptian,
    }
  }
}

export const missionManager = new MissionManager()
