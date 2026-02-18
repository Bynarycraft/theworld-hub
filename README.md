# Heritage (AEVON)

Heritage is an AEVON Babylon.js 3D cultural exploration game featuring multiple regions and tribal missions. Players journey through interactive villages, complete cultural challenges, and learn about diverse traditions.

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

4. **Asia Gallery**
   - **India**
     - Spice Collection: Gather market spices
     - Tala Practice: Complete rhythm training
     - Mantra Recitation: Collect and chant sacred fragments
     - Marble Court Reflection: Complete the final ritual
   - **China**
     - Silk Collection: Gather and dye silk spools
     - Woodblock Printing: Carve and print traditional blocks
     - Scroll Art: Complete painted scroll traditions
   - **Japan**
     - Tea Ceremony: Gather leaves and perform chanoyu
     - Bonsai Pruning: Complete garden shaping tasks
     - Calligraphy Practice: Compose character art
     - Temple Pilgrimage: Complete seal collection and final rite

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
- **Cultural Fact Cards**: Collectible lore cards with a dedicated gallery and progress tracking
- **Language Mini-Lessons**: Region/tribe greeting lessons with pronunciation and progress tracking
- **Historical Timelines**: Collectible timeline cards for each culture with progression persistence
- **Recipe Books**: Culture-specific recipes with ingredients and practical step-by-step instructions
- **Elder Story Voiceovers**: Tribe-based narrated stories with automatic playback on unlock
- **Mobile Touch Controls**: On-screen movement and interaction buttons for touch devices
- **Accessibility Settings**: Subtitles for voiceovers and a high-contrast color mode
- **Photo Mode Enhancements**: Screenshot capture and multiple visual filters
- **Guestbook**: Local community messages with persistent entries
- **Shareable Achievement Badges**: Copy/share text and downloadable badge cards
- **Asia Expansion**: Interactive Asia gallery with India, China, and Japan mission paths
- **Performance Optimization**: Manual code-splitting for Babylon.js bundles
- **Performance Optimization**: Deferred globe detail textures for faster initial load
- **Asset Loading System**: Cached texture loading and preloading helpers
- **Offline Caching**: Service worker caches core assets for faster repeat loads
- **Offline Caching**: Globe texture assets are pre-cached for quicker startup
- **Region Lazy-Loading**: Modular region loader infrastructure for deferred mesh creation
- **Modular Architecture**: Split into reusable modules (types, saveSystem, achievementSystem, audioSystem, uiManager, missionManager, regionLoaders)

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
**Phase 18 Completed (Current)**
- ✅ Region lazy-loading infrastructure with registry pattern
- ✅ loadRegion() async pattern for deferred mesh creation
- ✅ Automatic region loading on state transitions (nigeria, kenya, egypt, morocco, southafrica, ethiopia)
- ✅ Foundation for splitting region mesh creation into separate loader modules
- 🔄 Next: Refactor region mesh creation into lazy loader functions

**Phase 16-17 Completed**
- ✅ Modular code architecture (8 TypeScript modules)
- ✅ Save/Load system with auto-save
- ✅ Achievement system with 20 achievements
- ✅ Achievements gallery UI
- ✅ Cultural fact cards gallery with persistent collection progress
- ✅ Language mini-lessons gallery with persistent lesson unlocks
- ✅ Interactive historical timeline cards with persistent unlocks
- ✅ Recipe books gallery with persistent unlocks and instruction previews
- ✅ Elder storytelling voiceovers with persistent unlocks
- ✅ Basic mobile touch controls for movement and interaction
- ✅ Accessibility settings (subtitles + high-contrast mode)
- ✅ Photo mode screenshot + filter tools (sepia, cool, vignette, film, mono)
- ✅ Guestbook panel with local persistence
- ✅ Shareable achievement badges with copy/download actions
- ✅ Initial performance optimization with manual chunking
- ✅ Deferred globe detail texture loading
- ✅ Cached asset loader for textures
- ✅ Service worker caching for core assets
- ✅ Core globe textures pre-cached for offline use
- ✅ Asia gallery + playable India, China, and Japan mission chains
- ✅ China/Japan tribal mission progression and achievement integration
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
