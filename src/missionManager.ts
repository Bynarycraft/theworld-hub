// Mission state management

import type {
  IgboMission,
  ArochukwuMission,
  YorubaMission,
  HausaMission,
  MaasaiMission,
  EgyptianMission,
  BerberMission,
  ZuluMission,
  XhosaMission,
  AmharaMission,
  OromoMission,
  IndianMission,
  ChineseMission,
  JapaneseMission,
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
    rhythmDone: false,
    rhythmHits: 0,
    rhythmNeeded: 5,
    rhythmActive: false,
  }

  hausa: HausaMission = {
    fabricCollected: 0,
    fabricNeeded: 5,
    flagsCollected: 0,
    flagsNeeded: 3,
    paradeArranged: false,
    paradeComplete: false,
    arranged: false,
  }

  maasai: MaasaiMission = {
    beadsRed: 0,
    beadsYellow: 0,
    beadsBlue: 0,
    beadsNeeded: 3,
    beadTradingDone: false,
    warriorDanceDone: false,
    beadsGreen: 0,
    danceSteps: 0,
    ceremonyDone: false,
  }

  egyptian: EgyptianMission = {
    chalicesCollected: 0,
    chalicesNeeded: 3,
    scarabsCollected: 0,
    scarabsNeeded: 4,
    tabletsCollected: 0,
    tabletsNeeded: 2,
    celestialAlignmentDone: false,
    celestialDone: false,
    alignmentSteps: 0,
  }

  berber: BerberMission = {
    woolRed: 0,
    woolBlue: 0,
    woolYellow: 0,
    woolNeeded: 3,
    carpetWoven: false,
    hennaCollected: 0,
    hennaNeeded: 4,
    hennaArtDone: false,
    mintCollected: 0,
    mintNeeded: 3,
    teaCeremonyDone: false,
    spicesCollected: 0,
    spicesNeeded: 5,
    tagineCookingDone: false,
  }

  zulu: ZuluMission = {
    cowhideCollected: 0,
    cowhideNeeded: 2,
    woodCollected: 0,
    woodNeeded: 3,
    shieldCrafted: false,
    spearsCollected: 0,
    spearsNeeded: 3,
    spearTrainingDone: false,
    cattleHerded: 0,
    cattleNeeded: 5,
    herdingDone: false,
    ceremonyPreparationDone: false,
    umemuloDone: false,
  }

  xhosa: XhosaMission = {
    beadsWhite: 0,
    beadsRed: 0,
    beadsBlack: 0,
    beadsNeeded: 3,
    beadworkDone: false,
    ochreCollected: 0,
    ochreNeeded: 4,
    bodyPaintingDone: false,
    stickFightingSteps: 0,
    stickFightingDone: false,
    ritualItemsCollected: 0,
    ritualItemsNeeded: 3,
    ancestralOfferingDone: false,
  }

  amhara: AmharaMission = {
    coffeeBeansCollected: 0,
    coffeeBeansNeeded: 3,
    coffeeCeremonyDone: false,
    teffCollected: 0,
    teffNeeded: 4,
    injeraDone: false,
    crossesCarved: 0,
    crossesNeeded: 3,
    crossCarvingDone: false,
    manuscriptsOrganized: 0,
    manuscriptsNeeded: 3,
    manuscriptDone: false,
  }

  oromo: OromoMission = {
    councilParticipationDone: false,
    irreechaOfferingsCollected: 0,
    irreechaOfferingsNeeded: 3,
    irreechaDone: false,
    butterCoffeeIngredientsCollected: 0,
    butterCoffeeIngredientsNeeded: 3,
    butterCoffeeDone: false,
    sycamoreRitualItemsCollected: 0,
    sycamoreRitualItemsNeeded: 3,
    sycamoreRitualDone: false,
  }

  indian: IndianMission = {
    spicesCollected: 0,
    spicesNeeded: 5,
    spiceMixingDone: false,
    talaMeasuresDone: false,
    mantrasChanted: 0,
    mantrasNeeded: 5,
    mantraDone: false,
    tajMahalContemplationDone: false,
  }

  chinese: ChineseMission = {
    silkSpoolsCollected: 0,
    silkSpoolsNeeded: 4,
    silkDyedDone: false,
    woodBlocksCarved: 0,
    woodBlocksNeeded: 3,
    woodblockPrintingDone: false,
    paintedScrollsCollected: 0,
    paintedScrollsNeeded: 4,
    artworkCompleteDone: false,
  }

  japanese: JapaneseMission = {
    teaLeavesGathered: 0,
    teaLeavesNeeded: 3,
    teaCeremonyDone: false,
    bonsaiTrimmed: 0,
    bonsaiNeeded: 3,
    bonsaiPruningDone: false,
    calligraphyCharactersWritten: 0,
    calligraphyNeeded: 5,
    calligraphyArtDone: false,
    templesVisited: 0,
    templesNeeded: 3,
    templePilgrimageDone: false,
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
      this.arochukwu.stonesFound +
      this.berber.woolRed +
      this.berber.woolBlue +
      this.berber.woolYellow +
      this.berber.hennaCollected +
      this.berber.mintCollected +
      this.berber.spicesCollected +
      this.zulu.cowhideCollected +
      this.zulu.woodCollected +
      this.zulu.spearsCollected +
      this.zulu.cattleHerded +
      this.xhosa.beadsWhite +
      this.xhosa.beadsRed +
      this.xhosa.beadsBlack +
      this.xhosa.ochreCollected +
      this.xhosa.ritualItemsCollected +
      this.amhara.coffeeBeansCollected +
      this.amhara.teffCollected +
      this.amhara.crossesCarved +
      this.amhara.manuscriptsOrganized +
      this.oromo.irreechaOfferingsCollected +
      this.oromo.butterCoffeeIngredientsCollected +
      this.oromo.sycamoreRitualItemsCollected +
      this.indian.spicesCollected +
      this.chinese.silkSpoolsCollected +
      this.chinese.woodBlocksCarved +
      this.chinese.paintedScrollsCollected +
      this.japanese.teaLeavesGathered +
      this.japanese.bonsaiTrimmed +
      this.japanese.calligraphyCharactersWritten +
      this.japanese.templesVisited
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
    if (this.berber.tagineCookingDone) count++
    if (this.zulu.umemuloDone) count++
    if (this.xhosa.ancestralOfferingDone) count++
    if (this.amhara.manuscriptDone) count++
    if (this.oromo.sycamoreRitualDone) count++
    if (this.indian.tajMahalContemplationDone) count++
    if (this.chinese.artworkCompleteDone) count++
    if (this.japanese.templePilgrimageDone) count++
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
      case 'Berber':
        return this.berber.tagineCookingDone
      case 'Zulu':
        return this.zulu.umemuloDone
      case 'Xhosa':
        return this.xhosa.ancestralOfferingDone
      case 'Amhara':
        return this.amhara.manuscriptDone
      case 'Oromo':
        return this.oromo.sycamoreRitualDone
      case 'Indian':
        return this.indian.tajMahalContemplationDone
      case 'Chinese':
        return this.chinese.artworkCompleteDone
      case 'Japanese':
        return this.japanese.templePilgrimageDone
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
      case 'morocco':
        return this.isTribeComplete('Berber')
      case 'southafrica':
        return this.isTribeComplete('Zulu') && this.isTribeComplete('Xhosa')
      case 'ethiopia':
        return this.isTribeComplete('Amhara') && this.isTribeComplete('Oromo')
      case 'india':
        return this.isTribeComplete('Indian')
      case 'china':
        return this.isTribeComplete('Chinese')
      case 'japan':
        return this.isTribeComplete('Japanese')
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
      rhythmDone: false,
      rhythmHits: 0,
      rhythmNeeded: 5,
      rhythmActive: false,
    }

    this.hausa = {
      fabricCollected: 0,
      fabricNeeded: 5,
      flagsCollected: 0,
      flagsNeeded: 3,
      paradeArranged: false,
      paradeComplete: false,
      arranged: false,
    }

    this.maasai = {
      beadsRed: 0,
      beadsYellow: 0,
      beadsBlue: 0,
      beadsNeeded: 3,
      beadTradingDone: false,
      warriorDanceDone: false,
      beadsGreen: 0,
      danceSteps: 0,
      ceremonyDone: false,
    }

    this.egyptian = {
      chalicesCollected: 0,
      chalicesNeeded: 3,
      scarabsCollected: 0,
      scarabsNeeded: 4,
      tabletsCollected: 0,
      tabletsNeeded: 2,
      celestialAlignmentDone: false,
      celestialDone: false,
      alignmentSteps: 0,
    }

    this.berber = {
      woolRed: 0,
      woolBlue: 0,
      woolYellow: 0,
      woolNeeded: 3,
      carpetWoven: false,
      hennaCollected: 0,
      hennaNeeded: 4,
      hennaArtDone: false,
      mintCollected: 0,
      mintNeeded: 3,
      teaCeremonyDone: false,
      spicesCollected: 0,
      spicesNeeded: 5,
      tagineCookingDone: false,
    }

    this.zulu = {
      cowhideCollected: 0,
      cowhideNeeded: 2,
      woodCollected: 0,
      woodNeeded: 3,
      shieldCrafted: false,
      spearsCollected: 0,
      spearsNeeded: 3,
      spearTrainingDone: false,
      cattleHerded: 0,
      cattleNeeded: 5,
      herdingDone: false,
      ceremonyPreparationDone: false,
      umemuloDone: false,
    }

    this.xhosa = {
      beadsWhite: 0,
      beadsRed: 0,
      beadsBlack: 0,
      beadsNeeded: 3,
      beadworkDone: false,
      ochreCollected: 0,
      ochreNeeded: 4,
      bodyPaintingDone: false,
      stickFightingSteps: 0,
      stickFightingDone: false,
      ritualItemsCollected: 0,
      ritualItemsNeeded: 3,
      ancestralOfferingDone: false,
    }

    this.amhara = {
      coffeeBeansCollected: 0,
      coffeeBeansNeeded: 3,
      coffeeCeremonyDone: false,
      teffCollected: 0,
      teffNeeded: 4,
      injeraDone: false,
      crossesCarved: 0,
      crossesNeeded: 3,
      crossCarvingDone: false,
      manuscriptsOrganized: 0,
      manuscriptsNeeded: 3,
      manuscriptDone: false,
    }

    this.oromo = {
      councilParticipationDone: false,
      irreechaOfferingsCollected: 0,
      irreechaOfferingsNeeded: 3,
      irreechaDone: false,
      butterCoffeeIngredientsCollected: 0,
      butterCoffeeIngredientsNeeded: 3,
      butterCoffeeDone: false,
      sycamoreRitualItemsCollected: 0,
      sycamoreRitualItemsNeeded: 3,
      sycamoreRitualDone: false,
    }

    this.indian = {
      spicesCollected: 0,
      spicesNeeded: 5,
      spiceMixingDone: false,
      talaMeasuresDone: false,
      mantrasChanted: 0,
      mantrasNeeded: 5,
      mantraDone: false,
      tajMahalContemplationDone: false,
    }

    this.chinese = {
      silkSpoolsCollected: 0,
      silkSpoolsNeeded: 4,
      silkDyedDone: false,
      woodBlocksCarved: 0,
      woodBlocksNeeded: 3,
      woodblockPrintingDone: false,
      paintedScrollsCollected: 0,
      paintedScrollsNeeded: 4,
      artworkCompleteDone: false,
    }

    this.japanese = {
      teaLeavesGathered: 0,
      teaLeavesNeeded: 3,
      teaCeremonyDone: false,
      bonsaiTrimmed: 0,
      bonsaiNeeded: 3,
      bonsaiPruningDone: false,
      calligraphyCharactersWritten: 0,
      calligraphyNeeded: 5,
      calligraphyArtDone: false,
      templesVisited: 0,
      templesNeeded: 3,
      templePilgrimageDone: false,
    }
  }

  loadFromSave(missions: any): void {
    if (missions.igbo) Object.assign(this.igbo, missions.igbo)
    if (missions.arochukwu) Object.assign(this.arochukwu, missions.arochukwu)
    if (missions.yoruba) Object.assign(this.yoruba, missions.yoruba)
    if (missions.hausa) Object.assign(this.hausa, missions.hausa)
    if (missions.maasai) Object.assign(this.maasai, missions.maasai)
    if (missions.egyptian) Object.assign(this.egyptian, missions.egyptian)
    if (missions.berber) Object.assign(this.berber, missions.berber)
    if (missions.zulu) Object.assign(this.zulu, missions.zulu)
    if (missions.xhosa) Object.assign(this.xhosa, missions.xhosa)
    if (missions.amhara) Object.assign(this.amhara, missions.amhara)
    if (missions.oromo) Object.assign(this.oromo, missions.oromo)
    if (missions.indian) Object.assign(this.indian, missions.indian)
    if (missions.chinese) Object.assign(this.chinese, missions.chinese)
    if (missions.japanese) Object.assign(this.japanese, missions.japanese)
  }

  exportForSave(): any {
    return {
      igbo: this.igbo,
      arochukwu: this.arochukwu,
      yoruba: this.yoruba,
      hausa: this.hausa,
      maasai: this.maasai,
      egyptian: this.egyptian,
      berber: this.berber,
      zulu: this.zulu,
      xhosa: this.xhosa,
      amhara: this.amhara,
      oromo: this.oromo,
      indian: this.indian,
      chinese: this.chinese,
      japanese: this.japanese,
    }
  }
}

export const missionManager = new MissionManager()

