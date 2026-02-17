# The World Museum Hub

A Babylon.js 3D cultural exploration game featuring multiple African regions and tribal missions. Players journey through interactive villages, complete cultural challenges, and learn about diverse traditions.

## Current Game Structure

### Regions & Tribes
1. **Nigeria** (3 Tribal Regions)
   - **Igbo** (3 LGAs: Enugu, Nsukka, Arochukwu)
     - Harvest Mission: Collect yams and kola nuts
     - Cooking Challenge: Prepare traditional dishes
     - Elder Delivery: Serve the community
     - Arochukwu Puzzle: Ancient oracle stone sequence
   - **Yoruba**
     - Instrument Collection: Gather drum sticks
     - Talking Drum Rhythm: Master traditional percussion
   - **Hausa**
     - Durbar Preparation: Collect fabric and flags
     - Parade Arrangement: Organize ceremonial display

2. **Kenya** (Maasai Tribe)
   - Bead Trading: Collect red, yellow, and blue beads
   - Warrior Dance: Complete fire circle ceremony

3. **Egypt** (Ancient Egyptian)
   - Artifact Recovery: Find golden chalices and scarabs
   - Temple Tablets: Collect sacred inscriptions
   - Celestial Alignment: Pyramid temple exploration

### Game Flow
1. **Hub Globe**: Rotate and select Africa continent
2. **Africa Gallery**: Choose from Nigeria, Kenya, or Egypt
3. **Country Map**: Select tribal region or LGA (Nigeria only)
4. **Village/Temple**: Complete cultural missions
5. **Festival**: Celebration and unity message

## Controls
- **Hub/Africa/Maps**: Click and drag to rotate, click markers to select
- **Villages**: 
  - WASD: Movement (with sprint acceleration)
  - Shift: Sprint (1.6x speed)
  - Mouse: Look around
  - E: Interact with objectives

## Features
- **Custom Movement System**: Smooth acceleration-based WASD controls with sprint
- **Dynamic Missions**: Collectible-based objectives with real-time tracking
- **Cultural Authenticity**: Region-specific artifacts, ceremonies, and traditions
- **Visual Feedback**: Emissive highlighting, floating labels, and toast notifications
- **Audio System**: Ambient soundscapes and interaction feedback tones
- **Multi-Region Support**: Expandable architecture for adding new cultures
- **Save/Load System**: Automatic progress saving with localStorage (auto-save every 30s)
- **Achievement System**: 20 unlockable achievements across explorer, mission, collectible, and special categories
- **Achievements Gallery**: Trophy button with detailed view of all achievements and progress tracking
- **Modular Architecture**: Split into reusable modules (types, saveSystem, achievementSystem, audioSystem, uiManager, missionManager)

## Technical Architecture
- **Engine**: Babylon.js (WebGL 3D rendering)
- **Camera System**: 
  - ArcRotateCamera (hub/map navigation)
  - UniversalCamera (first-person village exploration)
- **State Machine**: 7 game states (hub, africa, nigeria, kenya, egypt, lga-select, village, festival)
- **Mission Framework**: Centralized MissionManager with progress tracking
- **Collectible System**: 13+ collectible types with spatial positioning and interaction zones
- **Save System**: localStorage with versioning and auto-save
- **Achievement System**: Event-driven unlocks with notification UI

## Run Locally
```bash
npm install        # Install dependencies
npm run dev        # Start dev server (localhost:5173)
npm run build      # Production build
```

## Development Status
**Phase 16-17 Completed (Current)**
- ✅ Modular code architecture (8 TypeScript modules)
- ✅ Save/Load system with auto-save
- ✅ Achievement system with 20 achievements
- ✅ Achievements gallery UI
- ✅ Progress statistics tracking

**Previous Phases**
- ✅ Phase 5: Egypt region, Movement overhaul, Arochukwu puzzle
- ✅ Phase 4: Kenya/Maasai expansion
- ✅ Phase 1-3: Nigeria foundation (Igbo, Yoruba, Hausa)

**Roadmap**
- Phase 6: Additional African nations (Morocco, South Africa, Ethiopia)
- Phase 7: Asian continent (India, China, Japan)
- Phase 18: Social features and educational enhancements
- Phase 19: Technical optimizations and mobile support
- Phase 20+: Global expansion (Europe, Middle East, Oceania, Americas)

## Project Structure
```
theworld-hub/
├── src/
│   └── main.ts          # Main game logic (2405 lines)
├── public/              # Static assets
├── .github/
│   └── copilot-instructions.md
├── index.html           # Entry point
├── package.json         # Dependencies
└── README.md            # Documentation
```
