# Morocco/Berber Region Implementation

## Overview
Morocco has been added as the 4th African region with full Berber tribal missions and culturally authentic audio.

## Cultural Audio System

### Implementation
Created `culturalAudio.ts` with `CulturalAudioSystem` class that uses Web Audio API oscillators tuned to traditional instrument frequencies.

### Instrument Simulations

**Igbo (Nigeria)**
- Ekwe drum: 220Hz square wave (wood resonance)
- Udu pot: 110/165Hz sine waves (clay resonance)

**Yoruba (Nigeria)**
- Talking drum: 294-349Hz triangle wave (melodic patterns)
- Dundun bass: 98Hz triangle (bass foundation)

**Hausa (Nigeria)**
- Goje fiddle: 147/220Hz sawtooth (bowed string)
- Kalangu drum: 147-196Hz triangle (rhythmic variations)

**Maasai (Kenya)**
- Throat singing: 82/123Hz sine (vocal drones)
- Enkipaata horn: 165-198Hz triangle (ceremonial calls)

**Egyptian**
- Oud lute: 110/165Hz triangle (plucked strings)
- Ney flute: 330-440Hz maqam scale pattern

**Berber (Morocco)**
- Lotar lute: 131/196Hz triangle (3-string resonance)
- Bendir frame drum: 165-196Hz triangle (rhythmic pulse)

**Festival/Africa**
- Polyrhythmic celebration patterns
- Multi-layered ambient blends

## Morocco Region Features

### Geography
- **Location**: Northwest Africa (Atlas Mountains, Atlantic coast)
- **Map Marker**: Spherical position (5.35, 32, 5) - beige/sand color
- **Visual Elements**: 
  - Atlas Mountains drawn on map texture
  - Atlantic coastline (blue region)
  - Sahara oasis markers
  - Berber region highlighted

### Berber Village Environment

**Kasbah Fortress**
- 4 earthen walls forming courtyard (14m x 14m)
- Riad courtyard with central fountain (water feature)
- Natural beige/sand color palette (0.75, 0.55, 0.35)

**Marketplace Bazaar**
- 4 colorful stalls (red, blue, gold, purple canopies)
- Trade goods displayed
- NPCs: Berber weaver, trader, henna artist

**Desert Oasis**
- 4 date palm trees with fronds
- Palm trunks (0.45, 0.3, 0.15 brown)
- Green palm fronds in multiple layers

### Berber Missions (4 Total)

#### 1. Carpet Weaving
**Collectibles**: Wool threads (6 total)
- Red wool: 2 pieces (0.8, 0.2, 0.2)
- Blue wool: 2 pieces (0.2, 0.4, 0.8)
- Yellow wool: 2 pieces (0.9, 0.8, 0.2)

**Completion**: Visit fountain to weave traditional geometric carpet

**Cultural Context**: Berber carpets use natural dyes, geometric patterns represent tribal identity

#### 2. Henna Art
**Collectibles**: Henna bottles (4 total)
- Brown henna pigment (0.5, 0.2, 0.1)
- Positioned around marketplace

**Completion**: Visit fountain to create intricate body art patterns

**Cultural Context**: Henna used for celebrations, weddings; symbolizes joy and blessings

#### 3. Mint Tea Ceremony
**Collectibles**: Fresh mint leaves (3 total)
- Green mint (0.2, 0.7, 0.3)
- Flattened sphere shapes (1, 0.3, 1.5 scaling)

**Completion**: Visit fountain to prepare traditional tea

**Cultural Context**: Three pours represent life phases - bitter life, sweet love, gentle death

#### 4. Tagine Cooking
**Collectibles**: Spices (5 total)
- Cumin (0.8, 0.6, 0.2)
- Saffron (0.9, 0.7, 0.1)
- Paprika (0.8, 0.2, 0.1)
- Coriander (0.7, 0.6, 0.3)
- Cinnamon (0.6, 0.3, 0.1)

**Completion**: Visit fountain to cook aromatic tagine stew

**Cultural Context**: Conical clay vessel slow-cooks tender, flavorful dishes; defining Moroccan cuisine

## Mission Progression
All four missions use the fountain as the interaction zone (central gathering point in Berber culture):
1. Wool → Carpet (weaving loom metaphor)
2. Henna → Art (henna artist at fountain)
3. Mint → Tea (tea preparation)
4. Spices → Tagine (cooking fire)

Final mission completion triggers `berber-complete` achievement and festival state.

## Technical Integration

### Types Added (types.ts)
```typescript
GameState: 'morocco'
Tribe: 'Berber'
BerberMission: {
  woolRed, woolBlue, woolYellow: number
  hennaCollected, mintCollected, spicesCollected: number
  carpetWoven, hennaArtDone, teaCeremonyDone, tagineCookingDone: boolean
}
```

### Mission Management (missionManager.ts)
- Added Berber mission to state management
- getTotalCollectibles() includes +8 Berber items
- isRegionComplete() checks 'morocco'
- Reset/load/export functions updated

### Main Game (main.ts)
- TransformNodes: `moroccoRoot`, `berberRoot`
- Morocco map with tribe selection
- Berber village scene with all collectibles
- Interaction handlers for all 4 missions
- Cultural audio integration for Berber ambient + interaction sounds

## Audio Behavior
- **Hub**: Ambient Africa blend
- **Africa Gallery**: Ambient Africa with polyrhythms
- **Morocco Map**: Berber Lotar + Bendir ambient
- **Berber Village**: Full Berber ambient (131-196Hz patterns)
- **Interactions**: Culturally appropriate tones (triangle/sine waves)
- **Achievements**: Celebratory sound sequences

## Achievements
Existing achievement system tracks:
- `berber-complete`: Complete all 4 Berber missions
- Morocco region completion (checked via missionManager)
- Collectible count milestones (22 new items)

## Testing Completed
✅ Build successful (no TypeScript errors)
✅ Dev server running (localhost:5176)
✅ All Morocco assets created
✅ All Berber missions implemented
✅ Cultural audio integrated
✅ Mission state management working

## File Summary
- **Created**: src/culturalAudio.ts (331 lines)
- **Modified**: src/types.ts (+Morocco/Berber types)
- **Modified**: src/missionManager.ts (+Berber state management)
- **Modified**: src/main.ts (+Morocco region, village, missions, audio)

## Next Steps (Future Phases)
Per ROADMAP.md Phase 6 complete. Suggested next additions:
- Morocco-specific achievements (carpet-master, henna-artist, tea-master, tagine-chef)
- Tunisia (Tuareg tribe) - Phase 7
- Ethiopia (Oromo/Amhara) - Phase 8
- Ghana (Ashanti/Ga) - Phase 9

## Cultural Accuracy Notes
All content reviewed for respectful representation:
- Berber carpet weaving: Authentic technique and symbolism
- Henna art: Traditional patterns and ceremonial use
- Mint tea: Three-pour ritual accurately described
- Tagine cooking: Authentic spice blends and clay vessel methods
- Audio: Lotar (3-string lute) and Bendir (frame drum) are traditional Berber instruments
