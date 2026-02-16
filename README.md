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

## Technical Architecture
- **Engine**: Babylon.js (WebGL 3D rendering)
- **Camera System**: 
  - ArcRotateCamera (hub/map navigation)
  - UniversalCamera (first-person village exploration)
- **State Machine**: 7 game states (hub, africa, nigeria, kenya, egypt, lga-select, village, festival)
- **Mission Framework**: Object-based tracking with completion flags and counts
- **Collectible System**: 13+ collectible types with spatial positioning and interaction zones

## Run Locally
```bash
npm install        # Install dependencies
npm run dev        # Start dev server (localhost:5173)
npm run build      # Production build
```

## Development Status
**Phase 5 Completed (Current)**
- ✅ Egypt region with pyramid temple
- ✅ Kenya/Maasai expansion  
- ✅ Movement system overhaul
- ✅ Arochukwu puzzle refinements

**Roadmap**
- Phase 6: Additional African nations (Morocco, South Africa, Ethiopia)
- Phase 7: Asian continent (India, China, Japan)
- Phase 8: Save system and achievement tracking
- Phase 9: Multiplayer cultural exchange hub

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
