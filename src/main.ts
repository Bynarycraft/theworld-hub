import './style.css'
import {
  ArcRotateCamera,
  Color3,
  DynamicTexture,
  Engine,
  HemisphericLight,
  Mesh,
  MeshBuilder,
  PointerEventTypes,
  Scene,
  StandardMaterial,
  TransformNode,
  UniversalCamera,
  Vector3,
} from '@babylonjs/core'
import { uiManager } from './uiManager'
import { audioSystem as _audioSystem } from './audioSystem'
import { culturalAudio } from './culturalAudio'
import { saveSystem } from './saveSystem'
import { achievementSystem } from './achievementSystem'
import { missionManager } from './missionManager'
import { factCardSystem } from './factCardSystem'
import { languageLessonSystem } from './languageLessonSystem'
import { timelineSystem } from './timelineSystem'
import { recipeBookSystem } from './recipeBookSystem'
import { elderStorySystem } from './elderStorySystem'
import { loadTexture, preloadTextures } from './assetLoader'
import { registerRegionLoader, loadRegion } from './regionLoaders'
import type { GameState, Tribe, IgboLGA } from './types'

const canvas = document.querySelector<HTMLCanvasElement>('#renderCanvas')
if (!canvas) {
  throw new Error('Missing renderCanvas element')
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Ignore registration failures
    })
  })
}

const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
const mobileControls = document.querySelector<HTMLElement>('#uiMobileControls')
const subtitleOverlay = document.querySelector<HTMLElement>('#uiSubtitles')
const accessibilityPanel = document.querySelector<HTMLElement>('#uiAccessibility')
const accessibilityButton = document.querySelector<HTMLButtonElement>('#btnAccessibility')
const accessibilityClose = document.querySelector<HTMLButtonElement>('#btnCloseAccessibility')
const subtitlesToggle = document.querySelector<HTMLInputElement>('#toggleSubtitles')
const colorblindToggle = document.querySelector<HTMLInputElement>('#toggleColorblind')
const photoTools = document.querySelector<HTMLElement>('#uiPhotoTools')
const screenshotButton = document.querySelector<HTMLButtonElement>('#btnScreenshot')
const photoFilterButtons = document.querySelectorAll<HTMLButtonElement>('.photo-btn[data-filter]')
const guestbookPanel = document.querySelector<HTMLElement>('#uiGuestbook')
const guestbookButton = document.querySelector<HTMLButtonElement>('#btnGuestbook')
const guestbookClose = document.querySelector<HTMLButtonElement>('#btnCloseGuestbook')
const guestbookForm = document.querySelector<HTMLFormElement>('#guestbookForm')
const guestNameInput = document.querySelector<HTMLInputElement>('#guestName')
const guestMessageInput = document.querySelector<HTMLTextAreaElement>('#guestMessage')
const guestbookList = document.querySelector<HTMLElement>('#guestbookList')
const badgesPanel = document.querySelector<HTMLElement>('#uiBadges')
const badgesButton = document.querySelector<HTMLButtonElement>('#btnBadges')
const badgesClose = document.querySelector<HTMLButtonElement>('#btnCloseBadges')
const badgesList = document.querySelector<HTMLElement>('#badgesList')

const accessibilityKey = 'theworld-hub-accessibility'
const guestbookKey = 'theworld-hub-guestbook'
const defaultAccessibility = { subtitles: true, colorblind: false }
let accessibilityPrefs = { ...defaultAccessibility }

function loadAccessibilityPrefs() {
  try {
    const saved = localStorage.getItem(accessibilityKey)
    if (saved) {
      accessibilityPrefs = { ...defaultAccessibility, ...JSON.parse(saved) }
    }
  } catch {
    accessibilityPrefs = { ...defaultAccessibility }
  }
}

function saveAccessibilityPrefs() {
  try {
    localStorage.setItem(accessibilityKey, JSON.stringify(accessibilityPrefs))
  } catch {
    // Ignore storage failures
  }
}

function applyAccessibilityPrefs() {
  document.body.classList.toggle('colorblind-mode', accessibilityPrefs.colorblind)
  if (subtitleOverlay) {
    subtitleOverlay.classList.toggle('hidden', !accessibilityPrefs.subtitles)
  }
  if (subtitlesToggle) subtitlesToggle.checked = accessibilityPrefs.subtitles
  if (colorblindToggle) colorblindToggle.checked = accessibilityPrefs.colorblind
}

type GuestbookEntry = {
  id: string
  name: string
  message: string
  timestamp: number
}

function loadGuestbook(): GuestbookEntry[] {
  try {
    const saved = localStorage.getItem(guestbookKey)
    if (!saved) return []
    return JSON.parse(saved) as GuestbookEntry[]
  } catch {
    return []
  }
}

function saveGuestbook(entries: GuestbookEntry[]) {
  try {
    localStorage.setItem(guestbookKey, JSON.stringify(entries))
  } catch {
    // Ignore storage failures
  }
}

function renderGuestbook(entries: GuestbookEntry[]) {
  if (!guestbookList) return
  guestbookList.innerHTML = ''
  entries.slice(0, 20).forEach((entry) => {
    const item = document.createElement('div')
    item.className = 'guestbook-entry'
    const date = new Date(entry.timestamp)
    item.innerHTML = `<strong>${entry.name}</strong>${entry.message}<div>${date.toLocaleDateString()}</div>`
    guestbookList.appendChild(item)
  })
}

function renderBadges() {
  if (!badgesList) return
  const achievements = achievementSystem.getAll()
  badgesList.innerHTML = ''

  achievements.forEach((achievement) => {
    if (!achievement.unlocked) return
    const item = document.createElement('div')
    item.className = 'badge-item'

    const shareText = `I unlocked "${achievement.title}" in Heritage by AEVON! 🏛️`

    const copyButton = document.createElement('button')
    copyButton.className = 'photo-btn'
    copyButton.textContent = 'Copy Share Text'
    copyButton.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(shareText)
        showToast('Share text copied')
      } catch {
        showToast('Unable to copy text')
      }
    })

    const downloadButton = document.createElement('button')
    downloadButton.className = 'photo-btn'
    downloadButton.textContent = 'Download Badge'
    downloadButton.addEventListener('click', () => {
      try {
        const badgeCanvas = document.createElement('canvas')
        badgeCanvas.width = 540
        badgeCanvas.height = 320
        const ctx = badgeCanvas.getContext('2d')
        if (!ctx) return

        ctx.fillStyle = '#1b1a17'
        ctx.fillRect(0, 0, badgeCanvas.width, badgeCanvas.height)
        ctx.fillStyle = '#f5d48b'
        ctx.fillRect(20, 20, badgeCanvas.width - 40, badgeCanvas.height - 40)
        ctx.fillStyle = '#1b1a17'
        ctx.font = 'bold 28px Palatino'
        ctx.textAlign = 'center'
        ctx.fillText('Achievement Unlocked', badgeCanvas.width / 2, 80)
        ctx.font = 'bold 32px Palatino'
        ctx.fillText(achievement.title, badgeCanvas.width / 2, 140)
        ctx.font = '18px Palatino'
        ctx.fillText('Heritage · AEVON', badgeCanvas.width / 2, 190)
        ctx.font = '24px Palatino'
        ctx.fillText(achievement.icon, badgeCanvas.width / 2, 240)

        const link = document.createElement('a')
        link.href = badgeCanvas.toDataURL('image/png')
        link.download = `badge-${achievement.id}.png`
        document.body.appendChild(link)
        link.click()
        link.remove()
        showToast('Badge downloaded')
      } catch {
        showToast('Unable to create badge')
      }
    })

    item.innerHTML = `
      <div class="badge-title">${achievement.icon} ${achievement.title}</div>
      <div>${achievement.description}</div>
    `

    const actions = document.createElement('div')
    actions.className = 'badge-actions'
    actions.appendChild(copyButton)
    actions.appendChild(downloadButton)
    item.appendChild(actions)
    badgesList.appendChild(item)
  })

  if (badgesList.children.length === 0) {
    const empty = document.createElement('div')
    empty.className = 'badge-item'
    empty.textContent = 'Unlock achievements to generate shareable badges.'
    badgesList.appendChild(empty)
  }
}

let subtitleTimeout: number | undefined
function showSubtitle(text: string, duration = 4200) {
  if (!accessibilityPrefs.subtitles || !subtitleOverlay) return
  subtitleOverlay.textContent = text
  subtitleOverlay.classList.add('show')
  if (subtitleTimeout) window.clearTimeout(subtitleTimeout)
  subtitleTimeout = window.setTimeout(() => {
    subtitleOverlay.classList.remove('show')
  }, duration)
}

const engine = new Engine(canvas, true, { antialias: true })
const scene = new Scene(engine)

// Initialize UI close handlers
uiManager.setupCloseHandlers(
  () => uiManager.hideTutorial(),
  () => uiManager.hideRecap(),
  () => uiManager.hideCulturalPopup()
)

// Setup achievement notifications
achievementSystem.onUnlock((achievement) => {
  uiManager.showAchievement(achievement.title, achievement.description, achievement.icon)
  culturalAudio.playAchievementSound()
  
  // Update gallery if open
  const progress = achievementSystem.getProgress()
  uiManager.updateAchievementsGallery(achievementSystem.getAll(), progress)
  if (badgesPanel && !badgesPanel.classList.contains('hidden')) {
    renderBadges()
  }
})

// Setup achievements gallery
uiManager.setupAchievementsGallery(() => {
  const progress = achievementSystem.getProgress()
  uiManager.updateAchievementsGallery(achievementSystem.getAll(), progress)
  culturalAudio.playInteractionSound(600, 0.1)
})

// Setup fact cards gallery
uiManager.setupFactCardsGallery(() => {
  const progress = factCardSystem.getProgress()
  uiManager.updateFactCardsGallery(factCardSystem.getAll(), progress)
  culturalAudio.playInteractionSound(520, 0.1)
})

uiManager.setupLessonsGallery(() => {
  const progress = languageLessonSystem.getProgress()
  uiManager.updateLessonsGallery(languageLessonSystem.getAll(), progress)
  culturalAudio.playInteractionSound(560, 0.1)
})

uiManager.setupTimelinesGallery(() => {
  const progress = timelineSystem.getProgress()
  uiManager.updateTimelinesGallery(timelineSystem.getAll(), progress)
  culturalAudio.playInteractionSound(500, 0.1)
})

uiManager.setupRecipesGallery(() => {
  const progress = recipeBookSystem.getProgress()
  uiManager.updateRecipesGallery(recipeBookSystem.getAll(), progress)
  culturalAudio.playInteractionSound(640, 0.1)
})

// Load saved game if available
const savedGame = saveSystem.load()
let state: GameState = savedGame?.state || 'hub'
let selectedTribe: Tribe | null = savedGame?.selectedTribe || null
let selectedLGA: IgboLGA | null = savedGame?.selectedLGA || null

if (savedGame) {
  missionManager.loadFromSave(savedGame.missions)
  achievementSystem.loadUnlocked(savedGame.achievements)
  factCardSystem.loadUnlocked(savedGame.factCards ?? [])
  languageLessonSystem.loadUnlocked(savedGame.languageLessons ?? [])
  timelineSystem.loadUnlocked(savedGame.historicalTimelines ?? [])
  recipeBookSystem.loadUnlocked(savedGame.recipeBooks ?? [])
  elderStorySystem.loadUnlocked(savedGame.elderStories ?? [])
  console.log('Game loaded from save')
}

factCardSystem.onUnlock((card) => {
  uiManager.showToast(`📚 Fact Card Collected: ${card.title}`, 2500)
  const progress = factCardSystem.getProgress()
  uiManager.updateFactCardsGallery(factCardSystem.getAll(), progress)

  if (progress.unlocked === progress.total) {
    achievementSystem.unlock('cultural-scholar')
  }
})

languageLessonSystem.onUnlock((lesson) => {
  uiManager.showToast(`🗣️ Language Lesson Learned: ${lesson.title}`, 2500)
  const progress = languageLessonSystem.getProgress()
  uiManager.updateLessonsGallery(languageLessonSystem.getAll(), progress)

  showCulturalPopup(
    `Language Mini-Lesson: ${lesson.title}`,
    `${lesson.region} · ${lesson.tribe}`,
    `${lesson.phrase} (${lesson.pronunciation}) means "${lesson.meaning}". Try repeating it to practice pronunciation and cultural greeting etiquette.`
  )
})

timelineSystem.onUnlock((timeline) => {
  uiManager.showToast(`🕰️ Timeline Collected: ${timeline.title}`, 2500)
  const progress = timelineSystem.getProgress()
  uiManager.updateTimelinesGallery(timelineSystem.getAll(), progress)

  const preview = timeline.entries
    .map(entry => `${entry.yearLabel}: ${entry.event}`)
    .join(' · ')

  showCulturalPopup(
    `Historical Timeline: ${timeline.title}`,
    `${timeline.region} · ${timeline.tribe}`,
    preview
  )
})

recipeBookSystem.onUnlock((recipe) => {
  uiManager.showToast(`🍲 Recipe Book Collected: ${recipe.title}`, 2500)
  const progress = recipeBookSystem.getProgress()
  uiManager.updateRecipesGallery(recipeBookSystem.getAll(), progress)

  const ingredientText = recipe.ingredients.join(', ')
  const stepText = recipe.steps
    .map((step, index) => `${index + 1}. ${step}`)
    .join(' ')

  showCulturalPopup(
    `Recipe Book: ${recipe.dishName}`,
    `${recipe.region} · ${recipe.tribe}`,
    `Ingredients: ${ingredientText}. Instructions: ${stepText}`
  )
})

elderStorySystem.onUnlock((story) => {
  uiManager.showToast(`🎙️ Elder Story Unlocked: ${story.title}`, 2800)
  showCulturalPopup(
    `Elder Voiceover: ${story.title}`,
    `${story.region} · ${story.tribe}`,
    story.narration
  )
  showSubtitle(story.narration)
  elderStorySystem.speak(story)
})

// Setup auto-save every 30 seconds
saveSystem.autoSave(() => ({
  state,
  selectedTribe,
  selectedLGA,
  missions: missionManager.exportForSave(),
  achievements: achievementSystem.getUnlockedIds(),
  factCards: factCardSystem.getUnlockedIds(),
  languageLessons: languageLessonSystem.getUnlockedIds(),
  historicalTimelines: timelineSystem.getUnlockedIds(),
  recipeBooks: recipeBookSystem.getUnlockedIds(),
  elderStories: elderStorySystem.getUnlockedIds(),
  collectiblesFound: missionManager.getTotalCollectibles(),
  missionsCompleted: missionManager.getTotalMissionsCompleted(),
}))

let photoModeActive = false
let photoModeCamera: UniversalCamera | null = null
let currentAction: (() => void) | null = null
let desiredTarget = new Vector3(0, 0, 0)
let desiredRadius = 16
let desiredAlpha = Math.PI * 0.8
let desiredBeta = Math.PI / 2.5
let globeCloudLayer: Mesh | null = null
let isArcAutoZooming = false

// Mission state is now managed by missionManager
const igboMission = missionManager.igbo
const arochukwuMission = missionManager.arochukwu
const yorubaMission = missionManager.yoruba
const hausaMission = missionManager.hausa
const maasaiMission = missionManager.maasai
const egyptianMission = missionManager.egyptian
const berberMission = missionManager.berber
const amharaMission = missionManager.amhara
const oromoMission = missionManager.oromo
const indianMission = missionManager.indian
const chineseMission = missionManager.chinese
const japaneseMission = missionManager.japanese

function setAction(label: string | null, handler: (() => void) | null) {
  if (label && handler) {
    uiManager.get('uiAction').textContent = label
    uiManager.get('uiAction').classList.remove('hidden')
    currentAction = handler
  } else {
    uiManager.get('uiAction').classList.add('hidden')
    uiManager.get('uiAction').textContent = ''
    currentAction = null
  }
}

function setHint(text: string) {
  uiManager.setHint(text)
}

function setObjective(text: string, progress = '') {
  uiManager.setObjective(text)
  uiManager.setProgress(progress)
}

function setTitle(title: string, subtitle: string) {
  uiManager.setTitle(title)
  uiManager.setSubtitle(subtitle)
}

function getActiveTribe() {
  return selectedTribe ?? 'Igbo'
}

function showToast(text: string) {
  uiManager.showToast(text, 2200)
}

function enableAudio() {
  culturalAudio.enable()
  updateAmbientForState()
}

function playTone(frequency: number, duration = 0.12, _type: OscillatorType = 'sine', _volume = 0.05) {
  culturalAudio.playInteractionSound(frequency, duration)
}

// Unused legacy function - kept for potential future use
/*
function stopAmbient() {
  culturalAudio.stop()
}
*/

function updateAmbientForState() {
  if (!culturalAudio.isEnabled()) return
  
  const activeTribe = getActiveTribe()
  
  if (state === 'hub') {
    culturalAudio.playHubAmbient()
  } else if (state === 'africa') {
    culturalAudio.playAfricaAmbient()
  } else if (state === 'nigeria' || state === 'kenya' || state === 'egypt' || state === 'morocco' || state === 'southafrica' || state === 'ethiopia' || state === 'lga-select' || state === 'asia' || state === 'india' || state === 'china' || state === 'japan') {
    culturalAudio.playAfricaAmbient()
  } else if (state === 'village') {
    // Play culture-specific ambient based on tribe
    if (activeTribe === 'Igbo') {
      culturalAudio.playIgboAmbient()
    } else if (activeTribe === 'Yoruba') {
      culturalAudio.playYorubaAmbient()
    } else if (activeTribe === 'Hausa') {
      culturalAudio.playHausaAmbient()
    } else if (activeTribe === 'Maasai') {
      culturalAudio.playMaasaiAmbient()
    } else if (activeTribe === 'Egyptian') {
      culturalAudio.playEgyptianAmbient()
    } else if (activeTribe === 'Berber') {
      culturalAudio.playBerberAmbient()
    } else if (activeTribe === 'Zulu') {
      culturalAudio.playZuluAmbient()
    } else if (activeTribe === 'Xhosa') {
      culturalAudio.playXhosaAmbient()
    } else if (activeTribe === 'Amhara') {
      culturalAudio.playAmharaAmbient()
    } else if (activeTribe === 'Oromo') {
      culturalAudio.playOromoAmbient()
    } else {
      culturalAudio.playAfricaAmbient()
    }
  } else if (state === 'festival') {
    culturalAudio.playFestivalAmbient(activeTribe)
  }
}

function setTutorial(text: string) {
  uiManager.get('uiTutorialBody').textContent = text
}

function setRecapVisible(visible: boolean) {
  if (visible) {
    uiManager.get('uiRecap').classList.remove('hidden')
  } else {
    uiManager.get('uiRecap').classList.add('hidden')
  }
}

function showRecap(tribe: Tribe) {
  let body = ''
  if (tribe === 'Igbo') {
    body = 'You gathered yams and kola nuts, prepared the feast, and honored the elders. The New Yam Festival celebrates harvest and gratitude.'
  } else if (tribe === 'Yoruba') {
    body = 'You collected drum sticks and completed the talking drum rhythm. The beats carry stories and connect the community.'
  } else if (tribe === 'Hausa') {
    body = 'You collected fabric and flags, then arranged the Durbar parade. This celebration showcases culture, equestrian skills, and community pride.'
  } else if (tribe === 'Maasai') {
    body = 'You traded beads and participated in the warrior dance. The ceremony honors tradition and strengthens bonds.'
  } else if (tribe === 'Egyptian') {
    body = 'You collected ancient artifacts and aligned the celestial temple. The wisdom of the pharaohs guides your journey.'
  } else if (tribe === 'Berber') {
    body = 'You honored Berber artistry through carpet weaving, henna body art, mint tea ceremony, and tagine cooking traditions.'
  } else if (tribe === 'Zulu') {
    body = 'You crafted a shield, trained with spears, herded cattle, and completed the Umemulo ceremony of coming-of-age.'
  } else if (tribe === 'Xhosa') {
    body = 'You created symbolic beadwork, prepared ochre body art, practiced stick fighting, and honored ancestral offerings.'
  } else if (tribe === 'Amhara') {
    body = 'You completed the coffee ceremony, injera preparation, cross carving, and manuscript preservation in Ethiopia\'s highlands.'
  } else if (tribe === 'Oromo') {
    body = 'You joined the Gada council, prepared Irreecha offerings, brewed butter coffee, and honored the sacred sycamore ritual.'
  } else if (tribe === 'Indian') {
    body = 'You gathered spices, practiced tala rhythm, chanted mantras, and reflected at the Taj Mahal-inspired courtyard.'
  } else if (tribe === 'Chinese') {
    body = 'You gathered silk, carved woodblocks, completed scroll painting, and honored the Great Wall-inspired heritage circle.'
  } else if (tribe === 'Japanese') {
    body = 'You prepared tea, tended bonsai, practiced calligraphy, and completed a temple pilgrimage of harmony.'
  }
  
  uiManager.showRecap(`${tribe} Festival Recap`, body)
  setRecapVisible(true)
}

function showCulturalPopup(title: string, subtitle: string, body: string) {
  uiManager.showCulturalPopup(title, subtitle, body)
}

function hideCulturalPopup() {
  uiManager.hideCulturalPopup()
}

function togglePhotoMode() {
  photoModeActive = !photoModeActive

  if (photoModeActive) {
    // Enter photo mode: create a free-floating camera
    if (!photoModeCamera) {
      photoModeCamera = new UniversalCamera('photoModeCamera', walkCamera.position.clone(), scene)
      photoModeCamera.speed = 0.5
      photoModeCamera.angularSensibility = 3000
      photoModeCamera.minZ = 0.1
    }
    photoModeCamera.position = walkCamera.position.clone()
    photoModeCamera.rotation = walkCamera.rotation.clone()
    scene.activeCamera = photoModeCamera
    photoModeCamera.attachControl(canvas, true)
    walkCamera.detachControl()
    uiManager.hideActionButton()
    uiManager.hideCrosshair()
    uiManager.get('uiObjective').classList.add('hidden')
    uiManager.get('uiHint').classList.add('hidden')
    if (photoTools) {
      photoTools.classList.remove('hidden')
    }
    setTitle('Photo Mode', 'Press P again to exit. WASD to move freely.')
    showToast('📸 Photo Mode Active - WASD to fly around, click to look. Press P to exit.')
    playTone(880, 0.2, 'sine', 0.06)
  } else {
    // Exit photo mode: return to walk camera
    walkCamera.position = photoModeCamera!.position.clone()
    walkCamera.rotation = photoModeCamera!.rotation.clone()
    scene.activeCamera = walkCamera
    walkCamera.attachControl(canvas, true)
    photoModeCamera!.detachControl()
    uiManager.get('uiAction').classList.remove('hidden')
    uiManager.get('uiObjective').classList.remove('hidden')
    uiManager.get('uiHint').classList.remove('hidden')
    if (photoTools) {
      photoTools.classList.add('hidden')
    }
    updateMissionUI()
    updateInteractions()
    playTone(440, 0.2, 'sine', 0.06)
    showToast('✓ Photo Mode Exited')
  }
}

function setPhotoFilter(filter: 'none' | 'sepia' | 'cool' | 'vignette' | 'film' | 'mono') {
  document.body.classList.remove('filter-sepia', 'filter-cool', 'filter-vignette', 'filter-film', 'filter-mono')
  if (filter === 'sepia') {
    document.body.classList.add('filter-sepia')
  }
  if (filter === 'cool') {
    document.body.classList.add('filter-cool')
  }
  if (filter === 'vignette') {
    document.body.classList.add('filter-vignette')
  }
  if (filter === 'film') {
    document.body.classList.add('filter-film')
  }
  if (filter === 'mono') {
    document.body.classList.add('filter-mono')
  }
}

if (screenshotButton) {
  screenshotButton.addEventListener('click', () => {
    try {
      const dataUrl = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.href = dataUrl
      link.download = `world-museum-${Date.now()}.png`
      document.body.appendChild(link)
      link.click()
      link.remove()
      showToast('Screenshot saved')
    } catch {
      showToast('Unable to save screenshot')
    }
  })
}

photoFilterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const filter = button.dataset.filter as 'none' | 'sepia' | 'cool' | 'vignette' | 'film' | 'mono' | undefined
    if (!filter) return
    setPhotoFilter(filter)
  })
})

uiManager.get('uiTutorialClose').addEventListener('click', () => {
  uiManager.get('uiTutorial').style.display = 'none'
})

uiManager.get('uiRecapClose').addEventListener('click', () => {
  setRecapVisible(false)
})

uiManager.get('uiCulturalClose').addEventListener('click', () => {
  hideCulturalPopup()
})

window.addEventListener('pointerdown', () => enableAudio(), { once: true })
window.addEventListener('keydown', () => enableAudio(), { once: true })

uiManager.get('uiAction').addEventListener('click', () => {
  currentAction?.()
})

window.addEventListener('keydown', (event) => {
  if (event.key.toLowerCase() === 'e') {
    currentAction?.()
  }
  
  if (event.key.toLowerCase() === 'p') {
    if (state === 'village' || state === 'festival') {
      togglePhotoMode()
    }
  }
})

window.addEventListener('keydown', (event) => {
  if (event.code === 'KeyW') walkInput.forward = true
  if (event.code === 'KeyS') walkInput.back = true
  if (event.code === 'KeyA') walkInput.left = true
  if (event.code === 'KeyD') walkInput.right = true
  if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') walkInput.sprint = true
})

window.addEventListener('keyup', (event) => {
  if (event.code === 'KeyW') walkInput.forward = false
  if (event.code === 'KeyS') walkInput.back = false
  if (event.code === 'KeyA') walkInput.left = false
  if (event.code === 'KeyD') walkInput.right = false
  if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') walkInput.sprint = false
})

window.addEventListener('blur', () => {
  walkInput.forward = false
  walkInput.back = false
  walkInput.left = false
  walkInput.right = false
  walkInput.sprint = false
})

const light = new HemisphericLight('light', new Vector3(0, 1, 0), scene)
light.intensity = 0.95

const arcCamera = new ArcRotateCamera('arcCamera', Math.PI * 0.8, Math.PI / 2.5, 16, Vector3.Zero(), scene)
arcCamera.attachControl(canvas, true)
arcCamera.lowerRadiusLimit = 8
arcCamera.upperRadiusLimit = 20
arcCamera.wheelPrecision = 40
arcCamera.panningSensibility = 0
arcCamera.angularSensibilityX = 1200
arcCamera.angularSensibilityY = 1200
const defaultArcBeta = arcCamera.beta

const walkCamera = new UniversalCamera('walkCamera', new Vector3(0, 2, -10), scene)
walkCamera.speed = 0
walkCamera.angularSensibility = 3200
walkCamera.minZ = 0.1
walkCamera.inertia = 0
walkCamera.keysUp.length = 0
walkCamera.keysDown.length = 0
walkCamera.keysLeft.length = 0
walkCamera.keysRight.length = 0

const walkInput = {
  forward: false,
  back: false,
  left: false,
  right: false,
  sprint: false,
}

function setWalkInput(move: string, active: boolean) {
  if (move === 'forward') walkInput.forward = active
  if (move === 'back') walkInput.back = active
  if (move === 'left') walkInput.left = active
  if (move === 'right') walkInput.right = active
}

function setupMobileControls() {
  if (!isTouchDevice || !mobileControls) return

  mobileControls.classList.add('visible')
  const buttons = mobileControls.querySelectorAll<HTMLButtonElement>('button')

  buttons.forEach((button) => {
    const move = button.dataset.move
    const action = button.dataset.action

    const handlePress = (active: boolean) => {
      if (move) {
        setWalkInput(move, active)
      }
      if (action === 'sprint') {
        walkInput.sprint = active
      }
      if (action === 'interact' && active) {
        currentAction?.()
      }
    }

    button.addEventListener('pointerdown', (event) => {
      event.preventDefault()
      handlePress(true)
    })

    button.addEventListener('pointerup', (event) => {
      event.preventDefault()
      handlePress(false)
    })

    button.addEventListener('pointerleave', () => {
      handlePress(false)
    })

    button.addEventListener('pointercancel', () => {
      handlePress(false)
    })
  })
}

loadAccessibilityPrefs()
applyAccessibilityPrefs()

if (accessibilityButton && accessibilityPanel) {
  accessibilityButton.addEventListener('click', () => {
    accessibilityPanel.classList.toggle('hidden')
  })
}

if (accessibilityClose && accessibilityPanel) {
  accessibilityClose.addEventListener('click', () => {
    accessibilityPanel.classList.add('hidden')
  })
}

if (subtitlesToggle) {
  subtitlesToggle.addEventListener('change', () => {
    accessibilityPrefs.subtitles = subtitlesToggle.checked
    applyAccessibilityPrefs()
    saveAccessibilityPrefs()
  })
}

if (colorblindToggle) {
  colorblindToggle.addEventListener('change', () => {
    accessibilityPrefs.colorblind = colorblindToggle.checked
    applyAccessibilityPrefs()
    saveAccessibilityPrefs()
  })
}

if (guestbookButton && guestbookPanel) {
  guestbookButton.addEventListener('click', () => {
    guestbookPanel.classList.toggle('hidden')
  })
}

if (guestbookClose && guestbookPanel) {
  guestbookClose.addEventListener('click', () => {
    guestbookPanel.classList.add('hidden')
  })
}

const guestbookEntries = loadGuestbook()
renderGuestbook(guestbookEntries)

if (guestbookForm && guestNameInput && guestMessageInput) {
  guestbookForm.addEventListener('submit', (event) => {
    event.preventDefault()
    const name = guestNameInput.value.trim() || 'Visitor'
    const message = guestMessageInput.value.trim()
    if (!message) {
      showToast('Please enter a message')
      return
    }
    guestbookEntries.unshift({
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name: name.slice(0, 20),
      message: message.slice(0, 120),
      timestamp: Date.now(),
    })
    saveGuestbook(guestbookEntries)
    renderGuestbook(guestbookEntries)
    guestMessageInput.value = ''
    showToast('Message signed')
  })
}

if (badgesButton && badgesPanel) {
  badgesButton.addEventListener('click', () => {
    renderBadges()
    badgesPanel.classList.toggle('hidden')
  })
}

if (badgesClose && badgesPanel) {
  badgesClose.addEventListener('click', () => {
    badgesPanel.classList.add('hidden')
  })
}

const walkVelocity = new Vector3(0, 0, 0)
const walkConfig = {
  accel: 12,
  damping: 14,
  maxSpeed: 4.2,
  sprintMultiplier: 1.6,
  eyeHeight: 2,
}

setupMobileControls()

scene.activeCamera = arcCamera

const sharedRoot = new TransformNode('sharedRoot', scene)
const hubMarkersRoot = new TransformNode('hubMarkersRoot', scene)
const africaMarkersRoot = new TransformNode('africaMarkersRoot', scene)
const asiaRoot = new TransformNode('asiaRoot', scene)
const nigeriaRoot = new TransformNode('nigeriaRoot', scene)
const kenyaRoot = new TransformNode('kenyaRoot', scene)
const egyptRoot = new TransformNode('egyptRoot', scene)
const moroccoRoot = new TransformNode('moroccoRoot', scene)
const southafricaRoot = new TransformNode('southafricaRoot', scene)
const ethiopiaRoot = new TransformNode('ethiopiaRoot', scene)
const villageRoot = new TransformNode('villageRoot', scene)
const indianVillageRoot = new TransformNode('indianVillageRoot', scene)
const chineseVillageRoot = new TransformNode('chineseVillageRoot', scene)
const japaneseVillageRoot = new TransformNode('japaneseVillageRoot', scene)
const indiaRoot = new TransformNode('indiaRoot', scene)
const chinaRoot = new TransformNode('chinaRoot', scene)
const japanRoot = new TransformNode('japanRoot', scene)
const igboRoot = new TransformNode('igboRoot', scene)
const owrerriZone = new TransformNode('owrerriZone', scene)
const arochukwuZone = new TransformNode('arochukwuZone', scene)
const onitshZone = new TransformNode('onitshZone', scene)
const yorubaRoot = new TransformNode('yorubaRoot', scene)
const hausaRoot = new TransformNode('hausaRoot', scene)
const maasaiRoot = new TransformNode('maasaiRoot', scene)
const egyptianRoot = new TransformNode('egyptianRoot', scene)
const berberRoot = new TransformNode('berberRoot', scene)
const zuluRoot = new TransformNode('zuluRoot', scene)
const xhosaRoot = new TransformNode('xhosaRoot', scene)
const amharaRoot = new TransformNode('amharaRoot', scene)
const oromoRoot = new TransformNode('oromoRoot', scene)
const festivalRoot = new TransformNode('festivalRoot', scene)

igboRoot.parent = villageRoot
owrerriZone.parent = igboRoot
arochukwuZone.parent = igboRoot
onitshZone.parent = igboRoot
yorubaRoot.parent = villageRoot
hausaRoot.parent = villageRoot
maasaiRoot.parent = villageRoot
egyptianRoot.parent = villageRoot
berberRoot.parent = villageRoot
zuluRoot.parent = villageRoot
xhosaRoot.parent = villageRoot
amharaRoot.parent = villageRoot
oromoRoot.parent = villageRoot
indianVillageRoot.parent = villageRoot
chineseVillageRoot.parent = villageRoot
japaneseVillageRoot.parent = villageRoot

function createSkyDome() {
  const texture = new DynamicTexture('skyTexture', { width: 512, height: 512 }, scene, false)
  const ctx = texture.getContext()
  const gradient = ctx.createLinearGradient(0, 0, 0, 512)
  gradient.addColorStop(0, '#102a3f')
  gradient.addColorStop(0.6, '#2b5671')
  gradient.addColorStop(1, '#f0c07a')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 512, 512)
  texture.update()

  const material = new StandardMaterial('skyMaterial', scene)
  material.backFaceCulling = false
  material.disableLighting = true
  material.emissiveTexture = texture

  const dome = MeshBuilder.CreateSphere('skyDome', { diameter: 200 }, scene)
  dome.material = material
  dome.isPickable = false
  dome.infiniteDistance = true
}

function sphericalPosition(radius: number, latDeg: number, lonDeg: number) {
  const lat = (latDeg * Math.PI) / 180
  const lon = (lonDeg * Math.PI) / 180
  const x = radius * Math.cos(lat) * Math.cos(lon)
  const y = radius * Math.sin(lat)
  const z = radius * Math.cos(lat) * Math.sin(lon)
  return new Vector3(x, y, z)
}

function focusArcOnWorldPoint(point: Vector3, zoomRadius = 8.2) {
  const direction = point.clone().normalize()
  const clampedY = Math.max(-1, Math.min(1, direction.y))
  desiredAlpha = Math.atan2(direction.z, direction.x)
  desiredBeta = Math.max(0.35, Math.min(Math.PI - 0.35, Math.acos(clampedY)))
  desiredTarget = Vector3.Zero()
  desiredRadius = zoomRadius
  isArcAutoZooming = true
}

function createMarker(name: string, color: Color3, position: Vector3, root: TransformNode, onPick: () => void) {
  const marker = MeshBuilder.CreateCylinder(`${name}-marker`, { diameter: 0.4, height: 0.6 }, scene)
  marker.position = position
  marker.lookAt(Vector3.Zero())
  marker.rotation.x += Math.PI / 2
  marker.parent = root
  marker.metadata = { onPick }

  const mat = new StandardMaterial(`${name}-material`, scene)
  mat.diffuseColor = color
  mat.emissiveColor = color.scale(0.3)
  marker.material = mat
  return marker
}

function createLabel(
  text: string,
  position: Vector3,
  root: TransformNode,
  color: string,
  options?: { billboard?: boolean; alignToGlobe?: boolean; scale?: number }
) {
  const texture = new DynamicTexture(`label-${text}`, { width: 384, height: 192 }, scene, false)
  const ctx = texture.getContext() as CanvasRenderingContext2D
  const width = 384
  const height = 192
  const radius = 22
  const lines = text.length > 12 && text.includes(' ')
    ? [text.split(' ').slice(0, Math.ceil(text.split(' ').length / 2)).join(' '), text.split(' ').slice(Math.ceil(text.split(' ').length / 2)).join(' ')]
    : [text]

  ctx.clearRect(0, 0, width, height)
  ctx.fillStyle = 'rgba(10, 16, 22, 0.78)'
  ctx.beginPath()
  ctx.moveTo(radius, 12)
  ctx.lineTo(width - radius, 12)
  ctx.quadraticCurveTo(width - 12, 12, width - 12, radius)
  ctx.lineTo(width - 12, height - radius)
  ctx.quadraticCurveTo(width - 12, height - 12, width - radius, height - 12)
  ctx.lineTo(radius, height - 12)
  ctx.quadraticCurveTo(12, height - 12, 12, height - radius)
  ctx.lineTo(12, radius)
  ctx.quadraticCurveTo(12, 12, radius, 12)
  ctx.closePath()
  ctx.fill()

  ctx.strokeStyle = 'rgba(245, 230, 190, 0.35)'
  ctx.lineWidth = 2
  ctx.stroke()

  ctx.fillStyle = color
  ctx.font = lines.length > 1 ? 'bold 34px Palatino' : 'bold 40px Palatino'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.shadowColor = 'rgba(0,0,0,0.55)'
  ctx.shadowBlur = 4
  if (lines.length > 1) {
    ctx.fillText(lines[0], width / 2, height / 2 - 24)
    ctx.fillText(lines[1], width / 2, height / 2 + 24)
  } else {
    ctx.fillText(lines[0], width / 2, height / 2)
  }
  ctx.shadowBlur = 0
  texture.update()

  const scale = options?.scale ?? 1
  const plane = MeshBuilder.CreatePlane(`labelPlane-${text}`, { width: 3.0 * scale, height: 1.5 * scale }, scene)
  plane.position = position
  const useBillboard = options?.billboard ?? true
  if (useBillboard) {
    plane.billboardMode = Mesh.BILLBOARDMODE_ALL
  }
  plane.parent = root
  plane.isPickable = false

  if (options?.alignToGlobe) {
    const outward = position.clone().normalize()
    plane.lookAt(position.add(outward))
  }

  const mat = new StandardMaterial(`labelMat-${text}`, scene)
  mat.diffuseTexture = texture
  mat.emissiveTexture = texture
  mat.opacityTexture = texture
  mat.disableLighting = true
  plane.material = mat
  return plane
}

const detailTextureDelayMs = 500

function createGlobe() {
  const globe = MeshBuilder.CreateSphere('globe', { diameter: 10, segments: 24 }, scene)
  const globeMaterial = new StandardMaterial('globeMaterial', scene)
  globeMaterial.specularPower = 80
  globeMaterial.specularColor = new Color3(0.35, 0.35, 0.35)
  globeMaterial.emissiveColor = new Color3(0.03, 0.03, 0.03)
  globe.material = globeMaterial
  globe.parent = sharedRoot

  loadTexture(scene, '/earth_atmos_2048.jpg')
    .then((texture) => {
      globeMaterial.diffuseTexture = texture
    })
    .catch(() => {
      // Fallback to a subtle emissive glow if the texture fails
      globeMaterial.emissiveColor = new Color3(0.08, 0.08, 0.08)
    })

  // Load detail textures and clouds after initial render to reduce startup cost.
  window.setTimeout(() => {
    preloadTextures(scene, ['/earth_specular_2048.jpg', '/earth_normal_2048.jpg', '/earth_clouds_1024.png'])
      .then(async () => {
        const earthSpecular = await loadTexture(scene, '/earth_specular_2048.jpg')
        const earthNormal = await loadTexture(scene, '/earth_normal_2048.jpg')
        globeMaterial.specularTexture = earthSpecular
        globeMaterial.bumpTexture = earthNormal

        const cloudTexture = await loadTexture(scene, '/earth_clouds_1024.png')
        const clouds = MeshBuilder.CreateSphere('globeClouds', { diameter: 10.12, segments: 24 }, scene)
        const cloudsMaterial = new StandardMaterial('globeCloudsMaterial', scene)
        cloudsMaterial.diffuseTexture = cloudTexture
        cloudsMaterial.opacityTexture = cloudTexture
        cloudsMaterial.emissiveColor = new Color3(0.12, 0.12, 0.12)
        cloudsMaterial.backFaceCulling = false
        cloudsMaterial.alpha = 0.55
        clouds.material = cloudsMaterial
        clouds.parent = sharedRoot
        clouds.isPickable = false
        globeCloudLayer = clouds
      })
      .catch(() => {
        // Optional details failed to load; keep base globe.
      })
  }, detailTextureDelayMs)

  return globe
}

const continentZoomTransitionMs = 900
const countryZoomTransitionMs = 800

createSkyDome()
const globe = createGlobe()

// Keep continent/country markers and labels attached to the globe surface
hubMarkersRoot.parent = globe
africaMarkersRoot.parent = globe

const africaMarker = createMarker(
  'africa',
  new Color3(0.9, 0.65, 0.28),
  sphericalPosition(5.3, 8, 20),
  hubMarkersRoot,
  () => {
    focusArcOnWorldPoint(sphericalPosition(5, 8, 20), 7.6)
    setTimeout(() => setState('africa'), continentZoomTransitionMs)
  }
)
createLabel('Africa', africaMarker.position.add(new Vector3(0, 0.9, 0)), hubMarkersRoot, '#f9e6be', { billboard: true, scale: 1.05 })

const europeMarker = createMarker(
  'europe',
  new Color3(0.5, 0.5, 0.5),
  sphericalPosition(5.3, 35, 10),
  hubMarkersRoot,
  () => {
    focusArcOnWorldPoint(sphericalPosition(5, 35, 10), 7.8)
    showToast('Europe gallery coming soon')
  }
)
createLabel('Europe', europeMarker.position.add(new Vector3(0, 0.9, 0)), hubMarkersRoot, '#c9c9c9', { billboard: true, scale: 1.05 })

const asiaMarker = createMarker(
  'asia',
  new Color3(0.85, 0.5, 0.2),
  sphericalPosition(5.3, 25, 90),
  hubMarkersRoot,
  () => {
    focusArcOnWorldPoint(sphericalPosition(5, 25, 90), 7.6)
    setTimeout(() => setState('asia'), continentZoomTransitionMs)
  }
)
createLabel('Asia', asiaMarker.position.add(new Vector3(0, 0.9, 0)), hubMarkersRoot, '#f9e6be', { billboard: true, scale: 1.05 })

const northAmericaMarker = createMarker(
  'north-america',
  new Color3(0.5, 0.5, 0.5),
  sphericalPosition(5.3, 40, -100),
  hubMarkersRoot,
  () => {
    focusArcOnWorldPoint(sphericalPosition(5, 40, -100), 7.8)
    showToast('North America gallery coming soon')
  }
)
createLabel('North America', northAmericaMarker.position.add(new Vector3(0, 0.95, 0)), hubMarkersRoot, '#c9c9c9', { billboard: true, scale: 1.08 })

const southAmericaMarker = createMarker(
  'south-america',
  new Color3(0.5, 0.5, 0.5),
  sphericalPosition(5.3, -15, -60),
  hubMarkersRoot,
  () => {
    focusArcOnWorldPoint(sphericalPosition(5, -15, -60), 7.8)
    showToast('South America gallery coming soon')
  }
)
createLabel('South America', southAmericaMarker.position.add(new Vector3(0, 0.95, 0)), hubMarkersRoot, '#c9c9c9', { billboard: true, scale: 1.08 })

const oceaniaMarker = createMarker(
  'oceania',
  new Color3(0.5, 0.5, 0.5),
  sphericalPosition(5.3, -20, 140),
  hubMarkersRoot,
  () => {
    focusArcOnWorldPoint(sphericalPosition(5, -20, 140), 7.8)
    showToast('Oceania gallery coming soon')
  }
)
createLabel('Oceania', oceaniaMarker.position.add(new Vector3(0, 0.9, 0)), hubMarkersRoot, '#c9c9c9', { billboard: true, scale: 1.05 })

africaMarker.isPickable = true
europeMarker.isPickable = true
asiaMarker.isPickable = true
northAmericaMarker.isPickable = true
southAmericaMarker.isPickable = true
oceaniaMarker.isPickable = true

const nigeriaMarker = createMarker(
  'nigeria',
  new Color3(0.18, 0.5, 0.25),
  sphericalPosition(5.35, 9, 10),
  africaMarkersRoot,
  () => {
    focusArcOnWorldPoint(sphericalPosition(5, 9, 10), 7.2)
    setTimeout(() => setState('nigeria'), countryZoomTransitionMs)
  }
)
nigeriaMarker.isPickable = true
createLabel('Nigeria', nigeriaMarker.position.add(new Vector3(0, 0.9, 0)), africaMarkersRoot, '#e9f7e0')

const kenyaMarker = createMarker(
  'kenya',
  new Color3(0.25, 0.55, 0.3),
  sphericalPosition(5.35, 0, 37),
  africaMarkersRoot,
  () => {
    focusArcOnWorldPoint(sphericalPosition(5, 0, 37), 7.2)
    setTimeout(() => setState('kenya'), countryZoomTransitionMs)
  }
)
kenyaMarker.isPickable = true
createLabel('Kenya', kenyaMarker.position.add(new Vector3(0, 0.9, 0)), africaMarkersRoot, '#d4f1d4')

const egyptMarker = createMarker(
  'egypt',
  new Color3(0.8, 0.7, 0.2),
  sphericalPosition(5.35, 20, 30),
  africaMarkersRoot,
  () => {
    focusArcOnWorldPoint(sphericalPosition(5, 20, 30), 7.2)
    setTimeout(() => setState('egypt'), countryZoomTransitionMs)
  }
)
egyptMarker.isPickable = true
createLabel('Egypt', egyptMarker.position.add(new Vector3(0, 0.9, 0)), africaMarkersRoot, '#fff9e6')

const moroccoMarker = createMarker(
  'morocco',
  new Color3(0.85, 0.65, 0.4),
  sphericalPosition(5.35, 32, 5),
  africaMarkersRoot,
  () => {
    focusArcOnWorldPoint(sphericalPosition(5, 32, 5), 7.2)
    setTimeout(() => setState('morocco'), countryZoomTransitionMs)
  }
)
moroccoMarker.isPickable = true
createLabel('Morocco', moroccoMarker.position.add(new Vector3(0, 0.9, 0)), africaMarkersRoot, '#f5e6d3')

const southafricaMarker = createMarker(
  'southafrica',
  new Color3(0.3, 0.6, 0.4),
  sphericalPosition(5.35, -30, 25),
  africaMarkersRoot,
  () => {
    focusArcOnWorldPoint(sphericalPosition(5, -30, 25), 7.2)
    setTimeout(() => setState('southafrica'), countryZoomTransitionMs)
  }
)
southafricaMarker.isPickable = true
createLabel('South Africa', southafricaMarker.position.add(new Vector3(0, 0.9, 0)), africaMarkersRoot, '#e8f4e0')

const ethiopiaMarker = createMarker(
  'ethiopia',
  new Color3(0.35, 0.58, 0.38),
  sphericalPosition(5.35, 9, 40),
  africaMarkersRoot,
  () => {
    focusArcOnWorldPoint(sphericalPosition(5, 9, 40), 7.2)
    setTimeout(() => setState('ethiopia'), countryZoomTransitionMs)
  }
)
ethiopiaMarker.isPickable = true
createLabel('Ethiopia', ethiopiaMarker.position.add(new Vector3(0, 0.9, 0)), africaMarkersRoot, '#e7f5e8')

const nigeriaBase = MeshBuilder.CreateBox('nigeriaBase', { width: 12, height: 0.5, depth: 8 }, scene)
nigeriaBase.position = new Vector3(0, -0.3, 0)
const nigeriaBaseMat = new StandardMaterial('nigeriaBaseMat', scene)
nigeriaBaseMat.diffuseColor = new Color3(0.12, 0.18, 0.16)
nigeriaBaseMat.specularColor = new Color3(0.1, 0.1, 0.1)
nigeriaBase.material = nigeriaBaseMat
nigeriaBase.parent = nigeriaRoot

const nigeriaMapTexture = new DynamicTexture('nigeriaMapTexture', { width: 512, height: 512 }, scene, false)
const nigeriaMapCtx = nigeriaMapTexture.getContext() as CanvasRenderingContext2D
nigeriaMapCtx.fillStyle = '#0f2a22'
nigeriaMapCtx.fillRect(0, 0, 512, 512)
nigeriaMapCtx.strokeStyle = '#f0e1b8'
nigeriaMapCtx.lineWidth = 6
nigeriaMapCtx.strokeRect(20, 20, 472, 472)
nigeriaMapCtx.fillStyle = '#19543f'
nigeriaMapCtx.fillRect(60, 70, 160, 180)
nigeriaMapCtx.fillStyle = '#3f6d4f'
nigeriaMapCtx.fillRect(230, 140, 200, 160)
nigeriaMapCtx.fillStyle = '#6a8a4e'
nigeriaMapCtx.fillRect(140, 280, 200, 150)
nigeriaMapCtx.fillStyle = '#f8e8c8'
nigeriaMapCtx.font = 'bold 42px Palatino'
nigeriaMapCtx.textAlign = 'center'
nigeriaMapCtx.fillText('NIGERIA', 256, 50)
nigeriaMapCtx.font = 'bold 28px Palatino'
nigeriaMapCtx.fillText('Hausa', 140, 160)
nigeriaMapCtx.fillText('Yoruba', 330, 210)
nigeriaMapCtx.fillText('Igbo', 250, 350)
nigeriaMapTexture.update()

const nigeriaMap = MeshBuilder.CreateGround('nigeriaMap', { width: 11, height: 7 }, scene)
nigeriaMap.position = new Vector3(0, 0.01, 0)
const nigeriaMapMat = new StandardMaterial('nigeriaMapMat', scene)
nigeriaMapMat.diffuseTexture = nigeriaMapTexture
nigeriaMapMat.emissiveTexture = nigeriaMapTexture
nigeriaMap.material = nigeriaMapMat
nigeriaMap.parent = nigeriaRoot

const tribeMarkersRoot = new TransformNode('tribeMarkersRoot', scene)
tribeMarkersRoot.parent = nigeriaRoot

function createTribeMarker(name: string, color: Color3, position: Vector3, onPick: () => void) {
  const marker = MeshBuilder.CreateSphere(`${name}-tribe`, { diameter: 0.6 }, scene)
  marker.position = position
  const mat = new StandardMaterial(`${name}-tribe-mat`, scene)
  mat.diffuseColor = color
  mat.emissiveColor = color.scale(0.3)
  marker.material = mat
  marker.metadata = { onPick }
  marker.parent = tribeMarkersRoot
  createLabel(name, position.add(new Vector3(0, 0.7, 0)), tribeMarkersRoot, '#f9e6be')
  return marker
}

createTribeMarker('Hausa', new Color3(0.82, 0.6, 0.2), new Vector3(-2.8, 0.6, -1.2), () => {
  selectedTribe = 'Hausa'
  resetTribeMission('Hausa')
  setState('village')
  walkCamera.position = new Vector3(8, 2, -18)
})

createTribeMarker('Yoruba', new Color3(0.3, 0.6, 0.78), new Vector3(2.2, 0.6, -0.4), () => {
  selectedTribe = 'Yoruba'
  resetTribeMission('Yoruba')
  setState('village')
  walkCamera.position = new Vector3(-6, 2, -18)
})

createTribeMarker('Igbo', new Color3(0.36, 0.72, 0.36), new Vector3(0.6, 0.6, 2), () => {
  selectedTribe = 'Igbo'
  setState('lga-select')
  selectedLGA = null
})

const lgaMarkersRoot = new TransformNode('lgaMarkersRoot', scene)
lgaMarkersRoot.parent = nigeriaRoot

function createLGAMarker(name: IgboLGA, color: Color3, position: Vector3, onPick: () => void) {
  const marker = MeshBuilder.CreateSphere(`${name}-lga`, { diameter: 0.5 }, scene)
  marker.position = position
  const mat = new StandardMaterial(`${name}-lga-mat`, scene)
  mat.diffuseColor = color
  mat.emissiveColor = color.scale(0.3)
  marker.material = mat
  marker.metadata = { onPick }
  marker.parent = lgaMarkersRoot
  marker.isPickable = true
  createLabel(name, position.add(new Vector3(0, 0.6, 0)), lgaMarkersRoot, '#f9e6be')
  return marker
}

createLGAMarker('Owerri', new Color3(0.4, 0.65, 0.35), new Vector3(-2, 0.5, 3), () => {
  selectedLGA = 'Owerri'
  resetTribeMission('Igbo')
  setState('village')
  walkCamera.position = new Vector3(8, 2, -18)
})

createLGAMarker('Arochukwu', new Color3(0.5, 0.58, 0.4), new Vector3(0.5, 0.5, 4.5), () => {
  selectedLGA = 'Arochukwu'
  resetTribeMission('Igbo')
  setState('village')
  walkCamera.position = new Vector3(20, 2, -15)
})

createLGAMarker('Onitsha', new Color3(0.45, 0.6, 0.5), new Vector3(3, 0.5, 2), () => {
  selectedLGA = 'Onitsha'
  resetTribeMission('Igbo')
  setState('village')
  walkCamera.position = new Vector3(-8, 2, -20)
})

// Kenya setup
const kenyaBase = MeshBuilder.CreateBox('kenyaBase', { width: 12, height: 0.5, depth: 8 }, scene)
kenyaBase.position = new Vector3(0, -0.3, 0)
const kenyaBaseMat = new StandardMaterial('kenyaBaseMat', scene)
kenyaBaseMat.diffuseColor = new Color3(0.15, 0.2, 0.12)
kenyaBaseMat.specularColor = new Color3(0.1, 0.1, 0.1)
kenyaBase.material = kenyaBaseMat
kenyaBase.parent = kenyaRoot

const kenyaMapTexture = new DynamicTexture('kenyaMapTexture', { width: 512, height: 512 }, scene, false)
const kenyaMapCtx = kenyaMapTexture.getContext() as CanvasRenderingContext2D
kenyaMapCtx.fillStyle = '#1a3a2a'
kenyaMapCtx.fillRect(0, 0, 512, 512)
kenyaMapCtx.strokeStyle = '#d4c5a4'
kenyaMapCtx.lineWidth = 6
kenyaMapCtx.strokeRect(20, 20, 472, 472)
kenyaMapCtx.fillStyle = '#8b6f47'
kenyaMapCtx.fillRect(80, 100, 140, 160)
kenyaMapCtx.fillStyle = '#d4a574'
kenyaMapCtx.fillRect(240, 80, 180, 200)
kenyaMapCtx.fillStyle = '#f8e8c8'
kenyaMapCtx.font = 'bold 42px Palatino'
kenyaMapCtx.textAlign = 'center'
kenyaMapCtx.fillText('KENYA', 256, 50)
kenyaMapCtx.font = 'bold 28px Palatino'
kenyaMapCtx.fillText('Maasai', 150, 180)
kenyaMapCtx.fillText('Samburu', 330, 180)
kenyaMapTexture.update()

const kenyaMap = MeshBuilder.CreateGround('kenyaMap', { width: 11, height: 7 }, scene)
kenyaMap.position = new Vector3(0, 0.01, 0)
const kenyaMapMat = new StandardMaterial('kenyaMapMat', scene)
kenyaMapMat.diffuseTexture = kenyaMapTexture
kenyaMapMat.emissiveTexture = kenyaMapTexture
kenyaMap.material = kenyaMapMat
kenyaMap.parent = kenyaRoot

const kenyaTribeMarkersRoot = new TransformNode('kenyaTribeMarkersRoot', scene)
kenyaTribeMarkersRoot.parent = kenyaRoot

function createKenyaTribeMarker(name: Tribe, color: Color3, position: Vector3, onPick: () => void) {
  const marker = MeshBuilder.CreateSphere(`${name}-kenya-tribe`, { diameter: 0.6 }, scene)
  marker.position = position
  const mat = new StandardMaterial(`${name}-kenya-tribe-mat`, scene)
  mat.diffuseColor = color
  mat.emissiveColor = color.scale(0.3)
  marker.material = mat
  marker.metadata = { onPick }
  marker.parent = kenyaTribeMarkersRoot
  createLabel(name, position.add(new Vector3(0, 0.7, 0)), kenyaTribeMarkersRoot, '#f9e6be')
  return marker
}

createKenyaTribeMarker('Maasai', new Color3(0.8, 0.2, 0.2), new Vector3(-1.5, 0.6, 1), () => {
  selectedTribe = 'Maasai'
  resetTribeMission('Maasai')
  setState('village')
  walkCamera.position = new Vector3(0, 2, -18)
})

// Egypt setup
const egyptBase = MeshBuilder.CreateBox('egyptBase', { width: 12, height: 0.5, depth: 8 }, scene)
egyptBase.position = new Vector3(0, -0.3, 0)
const egyptBaseMat = new StandardMaterial('egyptBaseMat', scene)
egyptBaseMat.diffuseColor = new Color3(0.8, 0.7, 0.2)
egyptBaseMat.specularColor = new Color3(0.2, 0.18, 0.1)
egyptBase.material = egyptBaseMat
egyptBase.parent = egyptRoot

const egyptMapTexture = new DynamicTexture('egyptMapTexture', { width: 512, height: 512 }, scene, false)
const egyptMapCtx = egyptMapTexture.getContext() as CanvasRenderingContext2D
egyptMapCtx.fillStyle = '#d4a574'
egyptMapCtx.fillRect(0, 0, 512, 512)

// Draw Nile river
egyptMapCtx.fillStyle = '#4a90e2'
egyptMapCtx.beginPath()
egyptMapCtx.moveTo(256, 50)
egyptMapCtx.quadraticCurveTo(260, 200, 256, 400)
egyptMapCtx.lineWidth = 40
egyptMapCtx.stroke()

// Draw pyramid region markers
egyptMapCtx.fillStyle = '#e8c547'
egyptMapCtx.beginPath()
egyptMapCtx.arc(150, 150, 60, 0, Math.PI * 2)
egyptMapCtx.fill()
egyptMapCtx.fillStyle = '#333'
egyptMapCtx.font = 'bold 24px Arial'
egyptMapCtx.textAlign = 'center'
egyptMapCtx.textBaseline = 'middle'
egyptMapCtx.fillText('Giza', 150, 150)

// Draw pharaoh temple area
egyptMapCtx.fillStyle = '#d4a238'
egyptMapCtx.beginPath()
egyptMapCtx.arc(350, 200, 50, 0, Math.PI * 2)
egyptMapCtx.fill()
egyptMapCtx.fillStyle = '#333'
egyptMapCtx.fillText('Temples', 350, 200)

// Title
egyptMapCtx.fillStyle = '#333'
egyptMapCtx.font = 'bold 32px Arial'
egyptMapCtx.fillText('EGYPT', 256, 450)

egyptMapTexture.update()
const egyptMap = MeshBuilder.CreateBox('egyptMap', { width: 12, height: 8, depth: 0.1 }, scene)
egyptMap.position = new Vector3(0, 3, -0.05)
const egyptMapMat = new StandardMaterial('egyptMapMat', scene)
egyptMapMat.emissiveTexture = egyptMapTexture
egyptMap.material = egyptMapMat
egyptMap.parent = egyptRoot

const egyptTribeMarkersRoot = new TransformNode('egyptTribeMarkersRoot', scene)
egyptTribeMarkersRoot.parent = egyptRoot

function createEgyptTribeMarker(name: Tribe, color: Color3, position: Vector3, onPick: () => void) {
  const marker = MeshBuilder.CreateSphere(`${name}-egypt-tribe`, { diameter: 0.6 }, scene)
  marker.position = position
  const mat = new StandardMaterial(`${name}-egypt-tribe-mat`, scene)
  mat.diffuseColor = color
  mat.emissiveColor = color.scale(0.3)
  marker.material = mat
  marker.metadata = { onPick }
  marker.parent = egyptTribeMarkersRoot
  createLabel(name, position.add(new Vector3(0, 0.7, 0)), egyptTribeMarkersRoot, '#f9e6be')
  return marker
}

createEgyptTribeMarker('Egyptian', new Color3(0.85, 0.7, 0.2), new Vector3(-1.2, 0.6, 1), () => {
  selectedTribe = 'Egyptian'
  resetTribeMission('Egyptian')
  setState('village')
  walkCamera.position = new Vector3(0, 2, -18)
})

// Morocco setup
const moroccoBase = MeshBuilder.CreateBox('moroccoBase', { width: 12, height: 0.5, depth: 8 }, scene)
moroccoBase.position = new Vector3(0, -0.3, 0)
const moroccoBaseMat = new StandardMaterial('moroccoBaseMat', scene)
moroccoBaseMat.diffuseColor = new Color3(0.85, 0.65, 0.4)
moroccoBaseMat.specularColor = new Color3(0.2, 0.15, 0.1)
moroccoBase.material = moroccoBaseMat
moroccoBase.parent = moroccoRoot

const moroccoMapTexture = new DynamicTexture('moroccoMapTexture', { width: 512, height: 512 }, scene, false)
const moroccoMapCtx = moroccoMapTexture.getContext() as CanvasRenderingContext2D
moroccoMapCtx.fillStyle = '#d4a574'
moroccoMapCtx.fillRect(0, 0, 512, 512)

// Draw Atlas Mountains
moroccoMapCtx.fillStyle = '#8b7355'
moroccoMapCtx.beginPath()
moroccoMapCtx.moveTo(50, 200)
moroccoMapCtx.lineTo(100, 150)
moroccoMapCtx.lineTo(150, 170)
moroccoMapCtx.lineTo(200, 140)
moroccoMapCtx.lineTo(250, 160)
moroccoMapCtx.lineTo(300, 130)
moroccoMapCtx.lineTo(350, 150)
moroccoMapCtx.lineTo(400, 180)
moroccoMapCtx.lineTo(450, 200)
moroccoMapCtx.lineTo(450, 250)
moroccoMapCtx.lineTo(50, 250)
moroccoMapCtx.closePath()
moroccoMapCtx.fill()

// Draw Atlantic coast
moroccoMapCtx.fillStyle = '#4a8fbb'
moroccoMapCtx.fillRect(0, 0, 80, 512)

// Draw Berber region marker
moroccoMapCtx.fillStyle = '#c89664'
moroccoMapCtx.beginPath()
moroccoMapCtx.arc(280, 200, 70, 0, Math.PI * 2)
moroccoMapCtx.fill()
moroccoMapCtx.fillStyle = '#333'
moroccoMapCtx.font = 'bold 24px Arial'
moroccoMapCtx.textAlign = 'center'
moroccoMapCtx.textBaseline = 'middle'
moroccoMapCtx.fillText('Berber', 280, 195)
moroccoMapCtx.fillText('Region', 280, 220)

// Draw oasis
moroccoMapCtx.fillStyle = '#5ab55e'
moroccoMapCtx.beginPath()
moroccoMapCtx.arc(160, 350, 45, 0, Math.PI * 2)
moroccoMapCtx.fill()
moroccoMapCtx.fillStyle = '#4a8fbb'
moroccoMapCtx.beginPath()
moroccoMapCtx.arc(160, 350, 25, 0, Math.PI * 2)
moroccoMapCtx.fill()

// Title
moroccoMapCtx.fillStyle = '#333'
moroccoMapCtx.font = 'bold 32px Arial'
moroccoMapCtx.fillText('MOROCCO', 280, 450)

moroccoMapTexture.update()
const moroccoMap = MeshBuilder.CreateBox('moroccoMap', { width: 12, height: 8, depth: 0.1 }, scene)
moroccoMap.position = new Vector3(0, 3, -0.05)
const moroccoMapMat = new StandardMaterial('moroccoMapMat', scene)
moroccoMapMat.emissiveTexture = moroccoMapTexture
moroccoMap.material = moroccoMapMat
moroccoMap.parent = moroccoRoot

const moroccoTribeMarkersRoot = new TransformNode('moroccoTribeMarkersRoot', scene)
moroccoTribeMarkersRoot.parent = moroccoRoot

function createMoroccoTribeMarker(name: Tribe, color: Color3, position: Vector3, onPick: () => void) {
  const marker = MeshBuilder.CreateSphere(`${name}-morocco-tribe`, { diameter: 0.6 }, scene)
  marker.position = position
  const mat = new StandardMaterial(`${name}-morocco-tribe-mat`, scene)
  mat.diffuseColor = color
  mat.emissiveColor = color.scale(0.3)
  marker.material = mat
  marker.metadata = { onPick }
  marker.parent = moroccoTribeMarkersRoot
  createLabel(name, position.add(new Vector3(0, 0.7, 0)), moroccoTribeMarkersRoot, '#f5e6d3')
  return marker
}

createMoroccoTribeMarker('Berber', new Color3(0.85, 0.65, 0.4), new Vector3(0, 0.6, 0.5), () => {
  selectedTribe = 'Berber'
  resetTribeMission('Berber')
  setState('village')
  walkCamera.position = new Vector3(0, 2, -18)
})

// South Africa setup
const southafricaBase = MeshBuilder.CreateBox('southafricaBase', { width: 12, height: 0.5, depth: 8 }, scene)
southafricaBase.position = new Vector3(0, -0.3, 0)
const southafricaBaseMat = new StandardMaterial('southafricaBaseMat', scene)
southafricaBaseMat.diffuseColor = new Color3(0.3, 0.6, 0.4)
southafricaBaseMat.specularColor = new Color3(0.15, 0.2, 0.15)
southafricaBase.material = southafricaBaseMat
southafricaBase.parent = southafricaRoot

const southafricaMapTexture = new DynamicTexture('southafricaMapTexture', { width: 512, height: 512 }, scene, false)
const southafricaMapCtx = southafricaMapTexture.getContext() as CanvasRenderingContext2D
southafricaMapCtx.fillStyle = '#85b085'
southafricaMapCtx.fillRect(0, 0, 512, 512)

// Draw Drakensberg Mountains
southafricaMapCtx.fillStyle = '#6a8a6a'
southafricaMapCtx.beginPath()
southafricaMapCtx.moveTo(350, 100)
southafricaMapCtx.lineTo(380, 80)
southafricaMapCtx.lineTo(410, 95)
southafricaMapCtx.lineTo(440, 75)
southafricaMapCtx.lineTo(470, 90)
southafricaMapCtx.lineTo(490, 100)
southafricaMapCtx.lineTo(490, 200)
southafricaMapCtx.lineTo(350, 200)
southafricaMapCtx.closePath()
southafricaMapCtx.fill()

// Draw coastline (Atlantic + Indian Ocean)
southafricaMapCtx.fillStyle = '#4a7095'
southafricaMapCtx.fillRect(0, 350, 512, 162)

// Savanna grasslands
southafricaMapCtx.fillStyle = '#b8d4a0'
southafricaMapCtx.fillRect(50, 150, 250, 150)

// Draw Zulu region marker
southafricaMapCtx.fillStyle = '#d4a574'
southafricaMapCtx.beginPath()
southafricaMapCtx.arc(150, 220, 60, 0, Math.PI * 2)
southafricaMapCtx.fill()
southafricaMapCtx.fillStyle = '#333'
southafricaMapCtx.font = 'bold 24px Arial'
southafricaMapCtx.textAlign = 'center'
southafricaMapCtx.textBaseline = 'middle'
southafricaMapCtx.fillText('Zulu', 150, 220)

// Draw Xhosa region marker
southafricaMapCtx.fillStyle = '#c89670'
southafricaMapCtx.beginPath()
southafricaMapCtx.arc(350, 280, 60, 0, Math.PI * 2)
southafricaMapCtx.fill()
southafricaMapCtx.fillStyle = '#333'
southafricaMapCtx.fillText('Xhosa', 350, 280)

// Title
southafricaMapCtx.fillStyle = '#333'
southafricaMapCtx.font = 'bold 32px Arial'
southafricaMapCtx.fillText('SOUTH AFRICA', 256, 40)

southafricaMapTexture.update()
const southafricaMap = MeshBuilder.CreateBox('southafricaMap', { width: 12, height: 8, depth: 0.1 }, scene)
southafricaMap.position = new Vector3(0, 3, -0.05)
const southafricaMapMat = new StandardMaterial('southafricaMapMat', scene)
southafricaMapMat.emissiveTexture = southafricaMapTexture
southafricaMap.material = southafricaMapMat
southafricaMap.parent = southafricaRoot

const southafricaTribeMarkersRoot = new TransformNode('southafricaTribeMarkersRoot', scene)
southafricaTribeMarkersRoot.parent = southafricaRoot

function createSouthafricaTribeMarker(name: Tribe, color: Color3, position: Vector3, onPick: () => void) {
  const marker = MeshBuilder.CreateSphere(`${name}-southafrica-tribe`, { diameter: 0.6 }, scene)
  marker.position = position
  const mat = new StandardMaterial(`${name}-southafrica-tribe-mat`, scene)
  mat.diffuseColor = color
  mat.emissiveColor = color.scale(0.3)
  marker.material = mat
  marker.metadata = { onPick }
  marker.parent = southafricaTribeMarkersRoot
  createLabel(name, position.add(new Vector3(0, 0.7, 0)), southafricaTribeMarkersRoot, '#e8f4e0')
  return marker
}

createSouthafricaTribeMarker('Zulu', new Color3(0.75, 0.55, 0.35), new Vector3(-1.5, 0.6, 0.5), () => {
  selectedTribe = 'Zulu'
  resetTribeMission('Zulu')
  setState('village')
  walkCamera.position = new Vector3(0, 2, -18)
})

createSouthafricaTribeMarker('Xhosa', new Color3(0.65, 0.45, 0.3), new Vector3(1.5, 0.6, 0.5), () => {
  selectedTribe = 'Xhosa'
  resetTribeMission('Xhosa')
  setState('village')
  walkCamera.position = new Vector3(0, 2, -18)
})

// Ethiopia setup
const ethiopiaBase = MeshBuilder.CreateBox('ethiopiaBase', { width: 12, height: 0.5, depth: 8 }, scene)
ethiopiaBase.position = new Vector3(0, -0.3, 0)
const ethiopiaBaseMat = new StandardMaterial('ethiopiaBaseMat', scene)
ethiopiaBaseMat.diffuseColor = new Color3(0.35, 0.58, 0.38)
ethiopiaBaseMat.specularColor = new Color3(0.16, 0.2, 0.14)
ethiopiaBase.material = ethiopiaBaseMat
ethiopiaBase.parent = ethiopiaRoot

const ethiopiaMapTexture = new DynamicTexture('ethiopiaMapTexture', { width: 512, height: 512 }, scene, false)
const ethiopiaMapCtx = ethiopiaMapTexture.getContext() as CanvasRenderingContext2D
ethiopiaMapCtx.fillStyle = '#87ab7f'
ethiopiaMapCtx.fillRect(0, 0, 512, 512)

ethiopiaMapCtx.fillStyle = '#6f8a67'
ethiopiaMapCtx.fillRect(60, 90, 380, 220)

ethiopiaMapCtx.fillStyle = '#c8a067'
ethiopiaMapCtx.beginPath()
ethiopiaMapCtx.arc(180, 220, 60, 0, Math.PI * 2)
ethiopiaMapCtx.fill()
ethiopiaMapCtx.fillStyle = '#333'
ethiopiaMapCtx.font = 'bold 22px Arial'
ethiopiaMapCtx.textAlign = 'center'
ethiopiaMapCtx.fillText('Amhara', 180, 225)

ethiopiaMapCtx.fillStyle = '#9f7f54'
ethiopiaMapCtx.beginPath()
ethiopiaMapCtx.arc(340, 260, 60, 0, Math.PI * 2)
ethiopiaMapCtx.fill()
ethiopiaMapCtx.fillStyle = '#333'
ethiopiaMapCtx.fillText('Oromo', 340, 265)

ethiopiaMapCtx.fillStyle = '#4a7095'
ethiopiaMapCtx.fillRect(0, 360, 512, 152)

ethiopiaMapCtx.fillStyle = '#333'
ethiopiaMapCtx.font = 'bold 32px Arial'
ethiopiaMapCtx.fillText('ETHIOPIA', 256, 45)

ethiopiaMapTexture.update()
const ethiopiaMap = MeshBuilder.CreateBox('ethiopiaMap', { width: 12, height: 8, depth: 0.1 }, scene)
ethiopiaMap.position = new Vector3(0, 3, -0.05)
const ethiopiaMapMat = new StandardMaterial('ethiopiaMapMat', scene)
ethiopiaMapMat.emissiveTexture = ethiopiaMapTexture
ethiopiaMap.material = ethiopiaMapMat
ethiopiaMap.parent = ethiopiaRoot

const ethiopiaTribeMarkersRoot = new TransformNode('ethiopiaTribeMarkersRoot', scene)
ethiopiaTribeMarkersRoot.parent = ethiopiaRoot

function createEthiopiaTribeMarker(name: Tribe, color: Color3, position: Vector3, onPick: () => void) {
  const marker = MeshBuilder.CreateSphere(`${name}-ethiopia-tribe`, { diameter: 0.6 }, scene)
  marker.position = position
  const mat = new StandardMaterial(`${name}-ethiopia-tribe-mat`, scene)
  mat.diffuseColor = color
  mat.emissiveColor = color.scale(0.3)
  marker.material = mat
  marker.metadata = { onPick }
  marker.parent = ethiopiaTribeMarkersRoot
  createLabel(name, position.add(new Vector3(0, 0.7, 0)), ethiopiaTribeMarkersRoot, '#e7f5e8')
  return marker
}

createEthiopiaTribeMarker('Amhara', new Color3(0.72, 0.56, 0.38), new Vector3(-1.5, 0.6, 0.5), () => {
  selectedTribe = 'Amhara'
  resetTribeMission('Amhara')
  setState('village')
  walkCamera.position = new Vector3(0, 2, -18)
})

createEthiopiaTribeMarker('Oromo', new Color3(0.62, 0.46, 0.3), new Vector3(1.5, 0.6, 0.5), () => {
  selectedTribe = 'Oromo'
  resetTribeMission('Oromo')
  setState('village')
  walkCamera.position = new Vector3(0, 2, -18)
})

// Asia setup
const asiaBase = MeshBuilder.CreateBox('asiaBase', { width: 12, height: 0.5, depth: 8 }, scene)
asiaBase.position = new Vector3(0, -0.3, 0)
const asiaBaseMat = new StandardMaterial('asiaBaseMat', scene)
asiaBaseMat.diffuseColor = new Color3(0.22, 0.24, 0.32)
asiaBaseMat.specularColor = new Color3(0.12, 0.12, 0.16)
asiaBase.material = asiaBaseMat
asiaBase.parent = asiaRoot

const asiaMapTexture = new DynamicTexture('asiaMapTexture', { width: 512, height: 512 }, scene, false)
const asiaMapCtx = asiaMapTexture.getContext() as CanvasRenderingContext2D
asiaMapCtx.fillStyle = '#1a2432'
asiaMapCtx.fillRect(0, 0, 512, 512)
asiaMapCtx.fillStyle = '#31445e'
asiaMapCtx.fillRect(30, 60, 452, 360)
asiaMapCtx.fillStyle = '#d6b574'
asiaMapCtx.fillRect(90, 140, 100, 120)
asiaMapCtx.fillStyle = '#8fae7a'
asiaMapCtx.fillRect(220, 110, 160, 150)
asiaMapCtx.fillStyle = '#cf8f7a'
asiaMapCtx.fillRect(360, 210, 80, 100)
asiaMapCtx.fillStyle = '#f4e9d2'
asiaMapCtx.font = 'bold 34px Palatino'
asiaMapCtx.textAlign = 'center'
asiaMapCtx.fillText('ASIA', 256, 45)
asiaMapCtx.font = 'bold 24px Palatino'
asiaMapCtx.fillText('India', 140, 210)
asiaMapCtx.fillText('China', 300, 195)
asiaMapCtx.fillText('Japan', 400, 275)
asiaMapTexture.update()

const asiaMap = MeshBuilder.CreateGround('asiaMap', { width: 11, height: 7 }, scene)
asiaMap.position = new Vector3(0, 0.01, 0)
const asiaMapMat = new StandardMaterial('asiaMapMat', scene)
asiaMapMat.diffuseTexture = asiaMapTexture
asiaMapMat.emissiveTexture = asiaMapTexture
asiaMap.material = asiaMapMat
asiaMap.parent = asiaRoot

const asiaCountryMarkersRoot = new TransformNode('asiaCountryMarkersRoot', scene)
asiaCountryMarkersRoot.parent = asiaRoot

function createAsiaCountryMarker(name: string, color: Color3, position: Vector3, onPick: () => void) {
  const marker = MeshBuilder.CreateSphere(`${name}-asia-country`, { diameter: 0.6 }, scene)
  marker.position = position
  const mat = new StandardMaterial(`${name}-asia-country-mat`, scene)
  mat.diffuseColor = color
  mat.emissiveColor = color.scale(0.3)
  marker.material = mat
  marker.metadata = { onPick }
  marker.parent = asiaCountryMarkersRoot
  createLabel(name, position.add(new Vector3(0, 0.7, 0)), asiaCountryMarkersRoot, '#f7edd8')
  return marker
}

createAsiaCountryMarker('India', new Color3(0.86, 0.62, 0.28), new Vector3(-2.6, 0.6, -0.6), () => {
  setState('india')
})
createAsiaCountryMarker('China', new Color3(0.66, 0.74, 0.46), new Vector3(0.8, 0.6, -0.4), () => {
  setState('china')
})
createAsiaCountryMarker('Japan', new Color3(0.82, 0.48, 0.42), new Vector3(2.8, 0.6, 1.2), () => {
  setState('japan')
})

function createCountryMap(root: TransformNode, id: string, title: string, accent: Color3, labelColor: string) {
  const base = MeshBuilder.CreateBox(`${id}Base`, { width: 12, height: 0.5, depth: 8 }, scene)
  base.position = new Vector3(0, -0.3, 0)
  const baseMat = new StandardMaterial(`${id}BaseMat`, scene)
  baseMat.diffuseColor = accent.scale(0.55)
  baseMat.specularColor = new Color3(0.12, 0.12, 0.12)
  base.material = baseMat
  base.parent = root

  const tex = new DynamicTexture(`${id}MapTexture`, { width: 512, height: 512 }, scene, false)
  const ctx = tex.getContext() as CanvasRenderingContext2D
  ctx.fillStyle = '#162231'
  ctx.fillRect(0, 0, 512, 512)
  ctx.fillStyle = '#2e3f57'
  ctx.fillRect(56, 88, 400, 250)
  ctx.fillStyle = `rgb(${Math.floor(accent.r * 255)}, ${Math.floor(accent.g * 255)}, ${Math.floor(accent.b * 255)})`
  ctx.beginPath()
  ctx.arc(256, 220, 72, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#f5ead6'
  ctx.font = 'bold 34px Palatino'
  ctx.textAlign = 'center'
  ctx.fillText(title.toUpperCase(), 256, 52)
  tex.update()

  const map = MeshBuilder.CreateGround(`${id}Map`, { width: 11, height: 7 }, scene)
  map.position = new Vector3(0, 0.01, 0)
  const mapMat = new StandardMaterial(`${id}MapMat`, scene)
  mapMat.diffuseTexture = tex
  mapMat.emissiveTexture = tex
  map.material = mapMat
  map.parent = root

  createLabel(title, new Vector3(0, 1.3, 2.8), root, labelColor)
}

createCountryMap(indiaRoot, 'india', 'India', new Color3(0.86, 0.62, 0.28), '#f9e8c7')
createCountryMap(chinaRoot, 'china', 'China', new Color3(0.66, 0.74, 0.46), '#eaf5d9')
createCountryMap(japanRoot, 'japan', 'Japan', new Color3(0.82, 0.48, 0.42), '#fae0db')

const indiaTribeMarkersRoot = new TransformNode('indiaTribeMarkersRoot', scene)
indiaTribeMarkersRoot.parent = indiaRoot

function createIndiaTribeMarker(name: Tribe, color: Color3, position: Vector3, onPick: () => void) {
  const marker = MeshBuilder.CreateSphere(`${name}-india-tribe`, { diameter: 0.6 }, scene)
  marker.position = position
  const mat = new StandardMaterial(`${name}-india-tribe-mat`, scene)
  mat.diffuseColor = color
  mat.emissiveColor = color.scale(0.3)
  marker.material = mat
  marker.metadata = { onPick }
  marker.parent = indiaTribeMarkersRoot
  createLabel(name, position.add(new Vector3(0, 0.7, 0)), indiaTribeMarkersRoot, '#f7edd8')
  return marker
}

createIndiaTribeMarker('Indian', new Color3(0.9, 0.62, 0.2), new Vector3(0, 0.6, 0), () => {
  selectedTribe = 'Indian'
  resetTribeMission('Indian')
  setState('village')
  walkCamera.position = new Vector3(0, 2, -18)
})

const chinaTribeMarkersRoot = new TransformNode('chinaTribeMarkersRoot', scene)
chinaTribeMarkersRoot.parent = chinaRoot

function createChinaTribeMarker(name: Tribe, color: Color3, position: Vector3, onPick: () => void) {
  const marker = MeshBuilder.CreateSphere(`${name}-china-tribe`, { diameter: 0.6 }, scene)
  marker.position = position
  const mat = new StandardMaterial(`${name}-china-tribe-mat`, scene)
  mat.diffuseColor = color
  mat.emissiveColor = color.scale(0.3)
  marker.material = mat
  marker.metadata = { onPick }
  marker.parent = chinaTribeMarkersRoot
  createLabel(name, position.add(new Vector3(0, 0.7, 0)), chinaTribeMarkersRoot, '#eaf5d9')
  return marker
}

createChinaTribeMarker('Chinese', new Color3(0.66, 0.74, 0.46), new Vector3(0, 0.6, 0), () => {
  selectedTribe = 'Chinese'
  resetTribeMission('Chinese')
  setState('village')
  walkCamera.position = new Vector3(0, 2, -18)
})

const japanTribeMarkersRoot = new TransformNode('japanTribeMarkersRoot', scene)
japanTribeMarkersRoot.parent = japanRoot

function createJapanTribeMarker(name: Tribe, color: Color3, position: Vector3, onPick: () => void) {
  const marker = MeshBuilder.CreateSphere(`${name}-japan-tribe`, { diameter: 0.6 }, scene)
  marker.position = position
  const mat = new StandardMaterial(`${name}-japan-tribe-mat`, scene)
  mat.diffuseColor = color
  mat.emissiveColor = color.scale(0.3)
  marker.material = mat
  marker.metadata = { onPick }
  marker.parent = japanTribeMarkersRoot
  createLabel(name, position.add(new Vector3(0, 0.7, 0)), japanTribeMarkersRoot, '#fae0db')
  return marker
}

createJapanTribeMarker('Japanese', new Color3(0.82, 0.48, 0.42), new Vector3(0, 0.6, 0), () => {
  selectedTribe = 'Japanese'
  resetTribeMission('Japanese')
  setState('village')
  walkCamera.position = new Vector3(0, 2, -18)
})

const ground = MeshBuilder.CreateGround('villageGround', { width: 80, height: 80 }, scene)
ground.position = new Vector3(0, 0, 0)
ground.parent = villageRoot
const groundTexture = new DynamicTexture('groundTexture', { width: 512, height: 512 }, scene, false)
const groundCtx = groundTexture.getContext()
groundCtx.fillStyle = '#d2b27b'
groundCtx.fillRect(0, 0, 512, 512)
groundCtx.strokeStyle = 'rgba(112, 88, 54, 0.35)'
groundCtx.lineWidth = 4
for (let i = 0; i < 512; i += 64) {
  groundCtx.beginPath()
  groundCtx.moveTo(0, i)
  groundCtx.lineTo(512, i)
  groundCtx.stroke()
  groundCtx.beginPath()
  groundCtx.moveTo(i, 0)
  groundCtx.lineTo(i, 512)
  groundCtx.stroke()
}
groundTexture.update()
const groundMat = new StandardMaterial('groundMat', scene)
groundMat.diffuseTexture = groundTexture
groundMat.specularColor = new Color3(0.1, 0.1, 0.1)
ground.material = groundMat

function createHut(position: Vector3, root: TransformNode = villageRoot) {
  const base = MeshBuilder.CreateBox('hutBase', { width: 3, height: 2, depth: 3 }, scene)
  base.position = position
  base.position.y = 1
  const baseMat = new StandardMaterial('hutBaseMat', scene)
  baseMat.diffuseColor = new Color3(0.7, 0.52, 0.34)
  base.material = baseMat
  base.parent = root

  const roof = MeshBuilder.CreateCylinder('hutRoof', { diameterTop: 0, diameterBottom: 3.4, height: 1.6, tessellation: 4 }, scene)
  roof.position = position.add(new Vector3(0, 2.1, 0))
  const roofMat = new StandardMaterial('roofMat', scene)
  roofMat.diffuseColor = new Color3(0.45, 0.28, 0.16)
  roof.material = roofMat
  roof.parent = root
}

function createTree(position: Vector3, root: TransformNode = villageRoot) {
  const trunk = MeshBuilder.CreateCylinder('trunk', { diameter: 0.5, height: 3 }, scene)
  trunk.position = position.add(new Vector3(0, 1.5, 0))
  const trunkMat = new StandardMaterial('trunkMat', scene)
  trunkMat.diffuseColor = new Color3(0.35, 0.2, 0.1)
  trunk.material = trunkMat
  trunk.parent = root

  const crown = MeshBuilder.CreateSphere('crown', { diameter: 2.6 }, scene)
  crown.position = position.add(new Vector3(0, 3.2, 0))
  const crownMat = new StandardMaterial('crownMat', scene)
  crownMat.diffuseColor = new Color3(0.18, 0.4, 0.2)
  crown.material = crownMat
  crown.parent = root
}

function createNpc(name: string, position: Vector3, color: Color3, root: TransformNode) {
  const body = MeshBuilder.CreateCapsule(name, { height: 2.2, radius: 0.45 }, scene)
  body.position = position
  const mat = new StandardMaterial(`${name}-mat`, scene)
  mat.diffuseColor = color
  body.material = mat
  body.parent = root
  return body
}

function createMarketStall(position: Vector3, root: TransformNode) {
  const base = MeshBuilder.CreateBox('stallBase', { width: 2.8, height: 1, depth: 2 }, scene)
  base.position = position.add(new Vector3(0, 0.5, 0))
  const baseMat = new StandardMaterial('stallBaseMat', scene)
  baseMat.diffuseColor = new Color3(0.6, 0.46, 0.28)
  base.material = baseMat
  base.parent = root

  const canopy = MeshBuilder.CreateBox('stallCanopy', { width: 3.2, height: 0.3, depth: 2.4 }, scene)
  canopy.position = position.add(new Vector3(0, 1.6, 0))
  const canopyMat = new StandardMaterial('stallCanopyMat', scene)
  canopyMat.diffuseColor = new Color3(0.74, 0.2, 0.16)
  canopy.material = canopyMat
  canopy.parent = root
}

function createMaskStand(position: Vector3, root: TransformNode) {
  const pole = MeshBuilder.CreateCylinder('maskPole', { diameter: 0.2, height: 2.2 }, scene)
  pole.position = position.add(new Vector3(0, 1.1, 0))
  const poleMat = new StandardMaterial('maskPoleMat', scene)
  poleMat.diffuseColor = new Color3(0.35, 0.22, 0.12)
  pole.material = poleMat
  pole.parent = root

  const mask = MeshBuilder.CreateBox('mask', { width: 0.8, height: 1.2, depth: 0.3 }, scene)
  mask.position = position.add(new Vector3(0, 1.6, 0.4))
  const maskMat = new StandardMaterial('maskMat', scene)
  maskMat.diffuseColor = new Color3(0.85, 0.78, 0.6)
  mask.material = maskMat
  mask.parent = root
}

function createBannerPoles(position: Vector3, root: TransformNode) {
  const poleLeft = MeshBuilder.CreateCylinder('bannerPoleLeft', { diameter: 0.2, height: 3 }, scene)
  poleLeft.position = position.add(new Vector3(-0.8, 1.5, 0))
  const poleRight = MeshBuilder.CreateCylinder('bannerPoleRight', { diameter: 0.2, height: 3 }, scene)
  poleRight.position = position.add(new Vector3(0.8, 1.5, 0))
  const poleMat = new StandardMaterial('bannerPoleMat', scene)
  poleMat.diffuseColor = new Color3(0.4, 0.26, 0.12)
  poleLeft.material = poleMat
  poleRight.material = poleMat
  poleLeft.parent = root
  poleRight.parent = root

  const banner = MeshBuilder.CreateBox('bannerCloth', { width: 2, height: 1.4, depth: 0.05 }, scene)
  banner.position = position.add(new Vector3(0, 2.2, 0))
  const bannerMat = new StandardMaterial('bannerMat', scene)
  bannerMat.diffuseColor = new Color3(0.2, 0.5, 0.2)
  banner.material = bannerMat
  banner.parent = root
}

createHut(new Vector3(-12, 0, -8))
createHut(new Vector3(-5, 0, -15))
createHut(new Vector3(8, 0, -12))
createTree(new Vector3(15, 0, 10))
createTree(new Vector3(-18, 0, 6))
createTree(new Vector3(4, 0, 18))
createNpc('villagerA', new Vector3(2, 1.1, 10), new Color3(0.28, 0.28, 0.36), villageRoot)
createNpc('villagerB', new Vector3(-8, 1.1, 4), new Color3(0.3, 0.24, 0.18), villageRoot)
createNpc('villagerC', new Vector3(10, 1.1, -2), new Color3(0.22, 0.3, 0.2), villageRoot)

const cookingStation = MeshBuilder.CreateCylinder('cookingStation', { diameter: 3, height: 0.6 }, scene)
cookingStation.position = new Vector3(10, 0.3, 6)
const cookMat = new StandardMaterial('cookMat', scene)
cookMat.diffuseColor = new Color3(0.45, 0.3, 0.2)
cookMat.emissiveColor = new Color3(0.15, 0.08, 0.04)
cookingStation.material = cookMat
cookingStation.parent = igboRoot

const elderSpot = MeshBuilder.CreateCylinder('elderSpot', { diameter: 4, height: 0.2 }, scene)
elderSpot.position = new Vector3(-14, 0.1, 12)
const elderMat = new StandardMaterial('elderMat', scene)
elderMat.diffuseColor = new Color3(0.5, 0.38, 0.22)
elderSpot.material = elderMat
elderSpot.parent = igboRoot

const elder = MeshBuilder.CreateCapsule('elder', { height: 2.4, radius: 0.5 }, scene)
elder.position = new Vector3(-14, 1.2, 12)
const elderBodyMat = new StandardMaterial('elderBodyMat', scene)
elderBodyMat.diffuseColor = new Color3(0.2, 0.2, 0.3)
elder.material = elderBodyMat
elder.parent = igboRoot

const storyCircle = MeshBuilder.CreateCylinder('storyCircle', { diameter: 5, height: 0.1 }, scene)
storyCircle.position = new Vector3(20, 0.05, -18)
const storyMat = new StandardMaterial('storyMat', scene)
storyMat.diffuseColor = new Color3(0.3, 0.26, 0.22)
storyCircle.material = storyMat
storyCircle.parent = igboRoot

const storyStones: Mesh[] = []
const storySymbols = ['Moon', 'River', 'Mask']
const storyPositions = [
  new Vector3(18, 0.6, -16),
  new Vector3(22, 0.6, -16),
  new Vector3(20, 0.6, -20),
]

createMarketStall(new Vector3(-2, 0, 6), igboRoot)
createNpc('igboElder', new Vector3(-10, 1.1, 12), new Color3(0.2, 0.22, 0.3), igboRoot)

storyPositions.forEach((pos, index) => {
  const stone = MeshBuilder.CreateBox(`storyStone-${index}`, { width: 1.4, height: 1, depth: 1.4 }, scene)
  stone.position = pos
  const stoneMat = new StandardMaterial(`storyStoneMat-${index}`, scene)
  stoneMat.diffuseColor = new Color3(0.4, 0.32, 0.28)
  stone.material = stoneMat
  stone.parent = igboRoot
  stone.metadata = { symbol: storySymbols[index] }
  storyStones.push(stone)
})

// Arochukwu zone: ancient story stones with deeper cultural lessons
const arochukwuCircle = MeshBuilder.CreateCylinder('arochukwuCircle', { diameter: 6, height: 0.1 }, scene)
arochukwuCircle.position = new Vector3(20, 0.05, -18)
const arochukwuCircleMat = new StandardMaterial('arochukwuCircleMat', scene)
arochukwuCircleMat.diffuseColor = new Color3(0.28, 0.24, 0.2)
arochukwuCircle.material = arochukwuCircleMat
arochukwuCircle.parent = arochukwuZone

const arochukwuStones: Mesh[] = []
const arochukwuSymbols = ['Oracle', 'Pilgrimage', 'Unity']
const arochukwuPositions = [
  new Vector3(16, 0.7, -16),
  new Vector3(24, 0.7, -14),
  new Vector3(20, 0.7, -22),
]

arochukwuPositions.forEach((pos, index) => {
  const stone = MeshBuilder.CreateBox(`arochukwuStone-${index}`, { width: 1.5, height: 1.1, depth: 1.5 }, scene)
  stone.position = pos
  const stoneMat = new StandardMaterial(`arochukwuStoneMat-${index}`, scene)
  stoneMat.diffuseColor = new Color3(0.35, 0.28, 0.22)
  stoneMat.emissiveColor = new Color3(0.1, 0.08, 0.06)
  stone.material = stoneMat
  stone.parent = arochukwuZone
  stone.metadata = { symbol: arochukwuSymbols[index] }
  arochukwuStones.push(stone)
  createLabel(arochukwuSymbols[index], pos.add(new Vector3(0, 1.2, 0)), arochukwuZone, '#f2e9d4')
})

function updateArochukwuHighlight() {
  const expected = arochukwuSymbols[arochukwuMission.stonesFound]
  arochukwuStones.forEach((stone) => {
    const symbol = (stone.metadata as { symbol?: string } | undefined)?.symbol
    const mat = stone.material as StandardMaterial
    if (!mat) return
    if (symbol && symbol === expected) {
      mat.emissiveColor = new Color3(0.6, 0.45, 0.25)
    } else {
      mat.emissiveColor = new Color3(0.1, 0.08, 0.06)
    }
  })
}

// Onitsha zone: river trade and fabric weaving
const riverMarker = MeshBuilder.CreateCylinder('riverMarker', { diameter: 8, height: 0.1 }, scene)
riverMarker.position = new Vector3(-10, 0.05, -16)
const riverMat = new StandardMaterial('riverMat', scene)
riverMat.diffuseColor = new Color3(0.15, 0.35, 0.45)
riverMarker.material = riverMat
riverMarker.parent = onitshZone

const weavingLoom = MeshBuilder.CreateBox('weavingLoom', { width: 2.5, height: 2, depth: 1 }, scene)
weavingLoom.position = new Vector3(-10, 1.1, -8)
const loomMat = new StandardMaterial('loomMat', scene)
loomMat.diffuseColor = new Color3(0.5, 0.35, 0.2)
weavingLoom.material = loomMat
weavingLoom.parent = onitshZone

// Onitsha trade goods: indigo dye cloths
const indigoMeshes: Mesh[] = []

function createIndigoCloth(position: Vector3, parent: TransformNode) {
  const cloth = MeshBuilder.CreateBox('indigo', { width: 1.4, height: 0.4, depth: 1.4 }, scene)
  cloth.position = position
  const mat = new StandardMaterial('indigo-mat', scene)
  mat.diffuseColor = new Color3(0.1, 0.2, 0.4)
  mat.emissiveColor = new Color3(0.05, 0.1, 0.25)
  cloth.material = mat
  cloth.parent = parent
  indigoMeshes.push(cloth)
  return cloth
}

createIndigoCloth(new Vector3(-14, 0.5, -20), onitshZone)
createIndigoCloth(new Vector3(-6, 0.5, -22), onitshZone)
createIndigoCloth(new Vector3(-12, 0.5, -10), onitshZone)

const yorubaDrumRing = MeshBuilder.CreateCylinder('yorubaDrumRing', { diameter: 4.5, height: 0.2 }, scene)
yorubaDrumRing.position = new Vector3(-10, 0.1, 14)
const drumRingMat = new StandardMaterial('drumRingMat', scene)
drumRingMat.diffuseColor = new Color3(0.2, 0.25, 0.4)
yorubaDrumRing.material = drumRingMat
yorubaDrumRing.parent = yorubaRoot

const yorubaDrum = MeshBuilder.CreateCylinder('yorubaDrum', { diameter: 1.6, height: 1.4 }, scene)
yorubaDrum.position = new Vector3(-10, 0.9, 14)
const yorubaDrumMat = new StandardMaterial('yorubaDrumMat', scene)
yorubaDrumMat.diffuseColor = new Color3(0.48, 0.3, 0.14)
yorubaDrum.material = yorubaDrumMat
yorubaDrum.parent = yorubaRoot

createMaskStand(new Vector3(-14, 0, 10), yorubaRoot)
createNpc('yorubaDrummer', new Vector3(-12, 1.1, 14), new Color3(0.2, 0.28, 0.42), yorubaRoot)

const hausaParadeSpot = MeshBuilder.CreateCylinder('hausaParadeSpot', { diameter: 5.5, height: 0.2 }, scene)
hausaParadeSpot.position = new Vector3(16, 0.1, -14)
const paradeMat = new StandardMaterial('paradeMat', scene)
paradeMat.diffuseColor = new Color3(0.25, 0.3, 0.2)
hausaParadeSpot.material = paradeMat
hausaParadeSpot.parent = hausaRoot

const paradeMarker = MeshBuilder.CreateBox('paradeMarker', { width: 1.2, height: 2.6, depth: 1.2 }, scene)
paradeMarker.position = new Vector3(16, 1.4, -14)
const paradeMarkerMat = new StandardMaterial('paradeMarkerMat', scene)
paradeMarkerMat.diffuseColor = new Color3(0.5, 0.32, 0.12)
paradeMarker.material = paradeMarkerMat
paradeMarker.parent = hausaRoot

createBannerPoles(new Vector3(18, 0, -10), hausaRoot)
createNpc('hausaLeader', new Vector3(14, 1.1, -12), new Color3(0.34, 0.24, 0.18), hausaRoot)

const yamMeshes: Mesh[] = []
const kolaMeshes: Mesh[] = []
const stickMeshes: Mesh[] = []
const fabricMeshes: Mesh[] = []
const flagMeshes: Mesh[] = []
const beadRedMeshes: Mesh[] = []
const beadGreenMeshes: Mesh[] = []
const beadBlueMeshes: Mesh[] = []
const chaliceMeshes: Mesh[] = []
const scarabMeshes: Mesh[] = []
const tabletMeshes: Mesh[] = []

function createCollectible(name: string, color: Color3, position: Vector3, targetArray: Mesh[]) {
  const item = MeshBuilder.CreateSphere(name, { diameter: 0.8 }, scene)
  item.position = position
  const mat = new StandardMaterial(`${name}-mat`, scene)
  mat.diffuseColor = color
  mat.emissiveColor = color.scale(0.25)
  item.material = mat
  item.parent = igboRoot
  targetArray.push(item)
  return item
}

function createStick(position: Vector3) {
  const stick = MeshBuilder.CreateCylinder('stick', { diameter: 0.2, height: 1.4 }, scene)
  stick.position = position
  stick.rotation.z = Math.PI / 2
  const mat = new StandardMaterial('stick-mat', scene)
  mat.diffuseColor = new Color3(0.45, 0.28, 0.14)
  mat.emissiveColor = new Color3(0.12, 0.06, 0.02)
  stick.material = mat
  stick.parent = yorubaRoot
  stickMeshes.push(stick)
  return stick
}

function createFabric(position: Vector3) {
  const fabric = MeshBuilder.CreateBox('fabric', { width: 1.2, height: 0.3, depth: 1.2 }, scene)
  fabric.position = position
  const mat = new StandardMaterial('fabric-mat', scene)
  mat.diffuseColor = new Color3(0.72, 0.16, 0.2)
  mat.emissiveColor = new Color3(0.2, 0.04, 0.05)
  fabric.material = mat
  fabric.parent = hausaRoot
  fabricMeshes.push(fabric)
  return fabric
}

function createFlagBundle(position: Vector3) {
  const flag = MeshBuilder.CreateBox('flag', { width: 1.1, height: 0.5, depth: 0.2 }, scene)
  flag.position = position
  const mat = new StandardMaterial('flag-mat', scene)
  mat.diffuseColor = new Color3(0.2, 0.5, 0.2)
  mat.emissiveColor = new Color3(0.08, 0.18, 0.08)
  flag.material = mat
  flag.parent = hausaRoot
  flagMeshes.push(flag)
  return flag
}

function createBead(position: Vector3, color: Color3, targetArray: Mesh[]) {
  const bead = MeshBuilder.CreateSphere('bead', { diameter: 0.6 }, scene)
  bead.position = position
  const mat = new StandardMaterial('bead-mat', scene)
  mat.diffuseColor = color
  mat.emissiveColor = color.scale(0.4)
  bead.material = mat
  bead.parent = maasaiRoot
  targetArray.push(bead)
  return bead
}

// Maasai village: Ceremonial dance circle and bead trading area
const manyattaCircle = MeshBuilder.CreateCylinder('manyattaCircle', { diameter: 12, height: 0.1 }, scene)
manyattaCircle.position = new Vector3(0, 0.05, 0)
const manyattaCircleMat = new StandardMaterial('manyattaCircleMat', scene)
manyattaCircleMat.diffuseColor = new Color3(0.5, 0.38, 0.28)
manyattaCircle.material = manyattaCircleMat
manyattaCircle.parent = maasaiRoot

// Fire circle (dance interaction zone)
const fireCircle = MeshBuilder.CreateCylinder('fireCircle', { diameter: 3, height: 0.15 }, scene)
fireCircle.position = new Vector3(0, 0.08, 0)
const fireCircleMat = new StandardMaterial('fireCircleMat', scene)
fireCircleMat.diffuseColor = new Color3(1, 0.5, 0.2)
fireCircleMat.emissiveColor = new Color3(0.4, 0.15, 0.05)
fireCircle.material = fireCircleMat
fireCircle.parent = maasaiRoot
fireCircle.metadata = { isFireCircle: true }

// Manyatta huts (warrior dwellings) arranged in semicircle
const hutPositions = [
  new Vector3(-5, 1.5, -6),
  new Vector3(0, 1.5, -8),
  new Vector3(5, 1.5, -6),
  new Vector3(-6, 1.5, 2),
  new Vector3(6, 1.5, 2),
]

hutPositions.forEach((pos, idx) => {
  const hutWall = MeshBuilder.CreateCylinder(`hutWall-${idx}`, { diameter: 3, height: 2.2 }, scene)
  hutWall.position = pos
  const hutMat = new StandardMaterial(`hutMat-${idx}`, scene)
  hutMat.diffuseColor = new Color3(0.6, 0.45, 0.3)
  hutWall.material = hutMat
  hutWall.parent = maasaiRoot

  const hutRoof = MeshBuilder.CreateSphere(`hutRoof-${idx}`, { diameter: 3.2 }, scene)
  hutRoof.position = new Vector3(pos.x, pos.y + 1.8, pos.z)
  hutRoof.scaling = new Vector3(1, 0.6, 1)
  const roofMat = new StandardMaterial(`roofMat-${idx}`, scene)
  roofMat.diffuseColor = new Color3(0.45, 0.35, 0.2)
  hutRoof.material = roofMat
  hutRoof.parent = maasaiRoot
})

// Maasai warriors
createNpc('maasaiLeader', new Vector3(-3, 1.1, 3), new Color3(0.8, 0.3, 0.2), maasaiRoot)
createNpc('warrior1', new Vector3(2, 1.1, 4), new Color3(0.75, 0.28, 0.18), maasaiRoot)
createNpc('warrior2', new Vector3(-5, 1.1, -3), new Color3(0.7, 0.25, 0.15), maasaiRoot)

// Bead trading positions with colored beads
const redBeadPos = [
  new Vector3(-2, 0.5, 4),
  new Vector3(2, 0.5, 5),
  new Vector3(-4, 0.5, 2),
]

const greenBeadPos = [
  new Vector3(3, 0.5, 3),
  new Vector3(1, 0.5, 6),
  new Vector3(-6, 0.5, 4),
]

const blueBeadPos = [
  new Vector3(-1, 0.5, 2),
  new Vector3(4, 0.5, 2),
  new Vector3(0, 0.5, 5),
]

redBeadPos.forEach(pos => createBead(pos, new Color3(0.8, 0.2, 0.2), beadRedMeshes))
greenBeadPos.forEach(pos => createBead(pos, new Color3(0.2, 0.7, 0.2), beadGreenMeshes))
blueBeadPos.forEach(pos => createBead(pos, new Color3(0.2, 0.4, 0.8), beadBlueMeshes))

// Egyptian temple village
const templeGround = MeshBuilder.CreateCylinder('templeGround', { diameter: 15, height: 0.1 }, scene)
templeGround.position = new Vector3(0, 0.05, 0)
const templeGroundMat = new StandardMaterial('templeGroundMat', scene)
templeGroundMat.diffuseColor = new Color3(0.8, 0.75, 0.65)
templeGround.material = templeGroundMat
templeGround.parent = egyptianRoot

// Central pyramid structure
const pyramidBase = MeshBuilder.CreateCylinder('pyramidBase', { diameter: 6, height: 0.5 }, scene)
pyramidBase.position = new Vector3(0, 0.25, 0)
const pyramidBaseMat = new StandardMaterial('pyramidBaseMat', scene)
pyramidBaseMat.diffuseColor = new Color3(0.9, 0.85, 0.75)
pyramidBase.material = pyramidBaseMat
pyramidBase.parent = egyptianRoot

const pyramidPoint = MeshBuilder.CreateSphere('pyramidPoint', { diameter: 6 }, scene)
pyramidPoint.position = new Vector3(0, 3, 0)
pyramidPoint.scaling = new Vector3(1, 1.5, 1)
const pyramidPointMat = new StandardMaterial('pyramidPointMat', scene)
pyramidPointMat.diffuseColor = new Color3(0.95, 0.88, 0.72)
pyramidPoint.material = pyramidPointMat
pyramidPoint.parent = egyptianRoot

// Temple columns (seated at pyramid base)
const templeColumnPositions = [
  new Vector3(-2.5, 1.5, -2),
  new Vector3(2.5, 1.5, -2),
  new Vector3(-2.5, 1.5, 2),
  new Vector3(2.5, 1.5, 2),
]

templeColumnPositions.forEach((pos, idx) => {
  const column = MeshBuilder.CreateCylinder(`templeColumn-${idx}`, { diameter: 0.8, height: 3 }, scene)
  column.position = pos
  const colMat = new StandardMaterial(`colMat-${idx}`, scene)
  colMat.diffuseColor = new Color3(0.85, 0.8, 0.7)
  column.material = colMat
  column.parent = egyptianRoot
})

// Celestial alignment markers (sun and star stones) around pyramid
const celestialMarkerPositions = [
  new Vector3(0, 0.3, -4),     // North (sun)
  new Vector3(4, 0.3, 0),       // East (star 1)
  new Vector3(0, 0.3, 4),       // South (star 2)
  new Vector3(-4, 0.3, 0),      // West (star 3)
]

celestialMarkerPositions.forEach((pos, idx) => {
  const marker = MeshBuilder.CreateBox(`celestialMarker-${idx}`, { width: 1, height: 0.5, depth: 1 }, scene)
  marker.position = pos
  const markerMat = new StandardMaterial(`celestialMarkerMat-${idx}`, scene)
  markerMat.diffuseColor = new Color3(0.8, 0.7, 0.2)
  markerMat.emissiveColor = new Color3(0.2, 0.15, 0.05)
  marker.material = markerMat
  marker.parent = egyptianRoot
  marker.metadata = { isCelestialMarker: true, index: idx }
})

// Egyptian priests
createNpc('pharaoh', new Vector3(-1, 1.1, 1), new Color3(0.85, 0.7, 0.2), egyptianRoot)
createNpc('priest1', new Vector3(1.5, 1.1, -1), new Color3(0.75, 0.6, 0.15), egyptianRoot)
createNpc('priest2', new Vector3(-1.5, 1.1, -2), new Color3(0.7, 0.55, 0.1), egyptianRoot)

// Artifact collectible positions
const chalicePos = [
  new Vector3(-3, 0.5, -5),
  new Vector3(3, 0.5, -5),
  new Vector3(0, 0.5, -7),
]

const scarabPos = [
  new Vector3(-4, 0.5, 2),
  new Vector3(4, 0.5, 2),
  new Vector3(0, 0.5, 4),
]

const tabletPos = [
  new Vector3(-2, 0.5, 5),
  new Vector3(2, 0.5, 5),
  new Vector3(0, 0.5, 6),
]

function createArtifact(position: Vector3, color: Color3, shape: string, targetArray: Mesh[]) {
  const artifact = shape === 'chalice'
    ? MeshBuilder.CreateCylinder(`${shape}`, { diameter: 0.5, height: 0.8 }, scene)
    : MeshBuilder.CreateBox(`${shape}`, { width: 0.6, height: 0.3, depth: 0.6 }, scene)
  
  artifact.position = position
  const mat = new StandardMaterial(`${shape}-mat`, scene)
  mat.diffuseColor = color
  mat.emissiveColor = color.scale(0.35)
  artifact.material = mat
  artifact.parent = egyptianRoot
  targetArray.push(artifact)
  return artifact
}

chalicePos.forEach(pos => createArtifact(pos, new Color3(1, 0.84, 0), 'chalice', chaliceMeshes))
scarabPos.forEach(pos => createArtifact(pos, new Color3(0.6, 0.4, 0.1), 'scarab', scarabMeshes))
tabletPos.forEach(pos => createArtifact(pos, new Color3(0.75, 0.7, 0.6), 'tablet', tabletMeshes))

// Berber village (Morocco): Kasbah, marketplace, desert oasis
const kasbaGround = MeshBuilder.CreateCylinder('kasbaGround', { diameter: 18, height: 0.1 }, scene)
kasbaGround.position = new Vector3(0, 0.05, 0)
const kasbaGroundMat = new StandardMaterial('kasbaGroundMat', scene)
kasbaGroundMat.diffuseColor = new Color3(0.85, 0.7, 0.5)
kasbaGround.material = kasbaGroundMat
kasbaGround.parent = berberRoot

// Kasbah fortress walls (4 walls forming courtyard)
const kasbaWallPositions = [
  { pos: new Vector3(0, 2.5, -7), size: { w: 14, h: 5, d: 1 } },      // North
  { pos: new Vector3(0, 2.5, 7), size: { w: 14, h: 5, d: 1 } },       // South
  { pos: new Vector3(-7, 2.5, 0), size: { w: 1, h: 5, d: 14 } },      // West
  { pos: new Vector3(7, 2.5, 0), size: { w: 1, h: 5, d: 14 } },       // East
]

kasbaWallPositions.forEach((wall, idx) => {
  const kasbaWall = MeshBuilder.CreateBox(`kasbaWall-${idx}`, { width: wall.size.w, height: wall.size.h, depth: wall.size.d }, scene)
  kasbaWall.position = wall.pos
  const wallMat = new StandardMaterial(`kasbaWallMat-${idx}`, scene)
  wallMat.diffuseColor = new Color3(0.75, 0.55, 0.35)
  kasbaWall.material = wallMat
  kasbaWall.parent = berberRoot
})

// Riad courtyard fountain (center)
const fountain = MeshBuilder.CreateCylinder('fountain', { diameter: 2, height: 0.8 }, scene)
fountain.position = new Vector3(0, 0.4, 0)
const fountainMat = new StandardMaterial('fountainMat', scene)
fountainMat.diffuseColor = new Color3(0.5, 0.7, 0.8)
fountainMat.emissiveColor = new Color3(0.1, 0.2, 0.3)
fountain.material = fountainMat
fountain.parent = berberRoot

// Moroccan marketplace stalls (colorful bazaar)
const bazaarStallPositions = [
  { pos: new Vector3(-4, 0, -3), color: new Color3(0.9, 0.3, 0.2) },    // Red stall
  { pos: new Vector3(4, 0, -3), color: new Color3(0.3, 0.5, 0.8) },     // Blue stall
  { pos: new Vector3(-4, 0, 3), color: new Color3(0.9, 0.7, 0.2) },     // Gold stall
  { pos: new Vector3(4, 0, 3), color: new Color3(0.5, 0.3, 0.7) },      // Purple stall
]

bazaarStallPositions.forEach((stall, idx) => {
  const base = MeshBuilder.CreateBox(`bazaarBase-${idx}`, { width: 2.5, height: 1, depth: 2 }, scene)
  base.position = stall.pos.add(new Vector3(0, 0.5, 0))
  const baseMat = new StandardMaterial(`bazaarBaseMat-${idx}`, scene)
  baseMat.diffuseColor = new Color3(0.6, 0.46, 0.28)
  base.material = baseMat
  base.parent = berberRoot

  const canopy = MeshBuilder.CreateBox(`bazaarCanopy-${idx}`, { width: 3, height: 0.3, depth: 2.5 }, scene)
  canopy.position = stall.pos.add(new Vector3(0, 1.6, 0))
  const canopyMat = new StandardMaterial(`bazaarCanopyMat-${idx}`, scene)
  canopyMat.diffuseColor = stall.color
  canopy.material = canopyMat
  canopy.parent = berberRoot
})

// Date palm trees (desert oasis style)
const palmPositions = [
  new Vector3(-10, 0, -5),
  new Vector3(10, 0, -5),
  new Vector3(-10, 0, 5),
  new Vector3(10, 0, 5),
]

palmPositions.forEach((pos, idx) => {
  const trunk = MeshBuilder.CreateCylinder(`palmTrunk-${idx}`, { diameter: 0.5, height: 4 }, scene)
  trunk.position = pos.add(new Vector3(0, 2, 0))
  const trunkMat = new StandardMaterial(`palmTrunkMat-${idx}`, scene)
  trunkMat.diffuseColor = new Color3(0.45, 0.3, 0.15)
  trunk.material = trunkMat
  trunk.parent = berberRoot

  // Palm fronds (simplified as spheres)
  for (let i = 0; i < 5; i++) {
    const frond = MeshBuilder.CreateSphere(`palmFrond-${idx}-${i}`, { diameter: 1.5 }, scene)
    const angle = (i / 5) * Math.PI * 2
    frond.position = pos.add(new Vector3(Math.cos(angle) * 0.8, 4.5, Math.sin(angle) * 0.8))
    frond.scaling = new Vector3(2, 0.3, 0.5)
    const frondMat = new StandardMaterial(`palmFrondMat-${idx}-${i}`, scene)
    frondMat.diffuseColor = new Color3(0.2, 0.5, 0.2)
    frond.material = frondMat
    frond.parent = berberRoot
  }
})

// Berber NPCs
createNpc('berberWeaver', new Vector3(-2, 1.1, 1), new Color3(0.85, 0.65, 0.4), berberRoot)
createNpc('berberTrader', new Vector3(2, 1.1, -2), new Color3(0.75, 0.55, 0.35), berberRoot)
createNpc('berberHennaArtist', new Vector3(0, 1.1, 3), new Color3(0.7, 0.5, 0.3), berberRoot)

// Berber collectibles arrays
const woolRedMeshes: Mesh[] = []
const woolBlueMeshes: Mesh[] = []
const woolYellowMeshes: Mesh[] = []
const hennaMeshes: Mesh[] = []
const mintMeshes: Mesh[] = []
const spiceMeshes: Mesh[] = []

// Zulu village: Beehive huts (um uzi), cattle kraal, savanna
const zuluGround = MeshBuilder.CreateCylinder('zuluGround', { diameter: 20, height: 0.1 }, scene)
zuluGround.position = new Vector3(0, 0.05, 0)
const zuluGroundMat = new StandardMaterial('zuluGroundMat', scene)
zuluGroundMat.diffuseColor = new Color3(0.65, 0.55, 0.35)
zuluGround.material = zuluGroundMat
zuluGround.parent = zuluRoot

// Beehive huts (traditional Zulu architecture)
const zuluHutPositions = [
  new Vector3(-4, 1.5, -3),
  new Vector3(4, 1.5, -3),
  new Vector3(-4, 1.5, 3),
  new Vector3(4, 1.5, 3),
  new Vector3(0, 1.5, -6),
  new Vector3(0, 1.5, 6),
]

zuluHutPositions.forEach((pos, idx) => {
  const hutWall = MeshBuilder.CreateCylinder(`zuluHut-${idx}`, { diameter: 3, height: 2.5 }, scene)
  hutWall.position = pos
  const hutMat = new StandardMaterial(`zuluHutMat-${idx}`, scene)
  hutMat.diffuseColor = new Color3(0.7, 0.5, 0.3)
  hutWall.material = hutMat
  hutWall.parent = zuluRoot

  // Dome roof (beehive shape)
  const hutRoof = MeshBuilder.CreateSphere(`zuluHutRoof-${idx}`, { diameter: 3.2 }, scene)
  hutRoof.position = new Vector3(pos.x, pos.y + 1.8, pos.z)
  hutRoof.scaling = new Vector3(1, 0.8, 1)
  const roofMat = new StandardMaterial(`zuluRoofMat-${idx}`, scene)
  roofMat.diffuseColor = new Color3(0.6, 0.4, 0.2)
  hutRoof.material = roofMat
  hutRoof.parent = zuluRoot
})

// Cattle kraal (circular livestock enclosure)
const kraalRadius = 5
const kraalSegments = 12
for (let i = 0; i < kraalSegments; i++) {
  const angle = (i / kraalSegments) * Math.PI * 2
  const x = Math.cos(angle) * kraalRadius
  const z = Math.sin(angle) * kraalRadius
  const post = MeshBuilder.CreateCylinder(`kraalPost-${i}`, { diameter: 0.3, height: 1.5 }, scene)
  post.position = new Vector3(x + 8, 0.75, z)
  const postMat = new StandardMaterial(`kraalPostMat-${i}`, scene)
  postMat.diffuseColor = new Color3(0.5, 0.35, 0.2)
  post.material = postMat
  post.parent = zuluRoot
}

// Shield crafting area
const shieldStation = MeshBuilder.CreateCylinder('shieldStation', { diameter: 2, height: 0.3 }, scene)
shieldStation.position = new Vector3(-6, 0.15, 0)
const shieldStationMat = new StandardMaterial('shieldStationMat', scene)
shieldStationMat.diffuseColor = new Color3(0.6, 0.4, 0.25)
shieldStation.material = shieldStationMat
shieldStation.parent = zuluRoot

// Zulu warriors
createNpc('zuluChief', new Vector3(0, 1.1, 0), new Color3(0.75, 0.55, 0.35), zuluRoot)
createNpc('zuluWarrior1', new Vector3(-3, 1.1, -1), new Color3(0.7, 0.5, 0.3), zuluRoot)
createNpc('zuluWarrior2', new Vector3(3, 1.1, 1), new Color3(0.68, 0.48, 0.28), zuluRoot)

// Zulu collectibles arrays
const cowhideMeshes: Mesh[] = []
const woodMeshes: Mesh[] = []
const spearMeshes: Mesh[] = []

// Xhosa village: Rock formations, traditional dwellings, ancestral areas
const xhosaGround = MeshBuilder.CreateCylinder('xhosaGround', { diameter: 20, height: 0.1 }, scene)
xhosaGround.position = new Vector3(0, 0.05, 0)
const xhosaGroundMat = new StandardMaterial('xhosaGroundMat', scene)
xhosaGroundMat.diffuseColor = new Color3(0.6, 0.5, 0.4)
xhosaGround.material = xhosaGroundMat
xhosaGround.parent = xhosaRoot

// Xhosa circular dwellings (rondavels)
const xhosaHutPositions = [
  new Vector3(-5, 1.2, -2),
  new Vector3(5, 1.2, -2),
  new Vector3(-5, 1.2, 4),
  new Vector3(5, 1.2, 4),
]

xhosaHutPositions.forEach((pos, idx) => {
  const hut = MeshBuilder.CreateCylinder(`xhosaHut-${idx}`, { diameter: 3, height: 2.4 }, scene)
  hut.position = pos
  const hutMat = new StandardMaterial(`xhosaHutMat-${idx}`, scene)
  hutMat.diffuseColor = new Color3(0.65, 0.45, 0.3)
  hut.material = hutMat
  hut.parent = xhosaRoot

  // Conical thatched roof
  const roof = MeshBuilder.CreateCylinder(`xhosaRoof-${idx}`, { diameterTop: 0.5, diameterBottom: 3.5, height: 1.8, tessellation: 6 }, scene)
  roof.position = new Vector3(pos.x, pos.y + 2.1, pos.z)
  const roofMat = new StandardMaterial(`xhosaRoofMat-${idx}`, scene)
  roofMat.diffuseColor = new Color3(0.55, 0.4, 0.25)
  roof.material = roofMat
  roof.parent = xhosaRoot
})

// Ancestral altar (sacred space)
const altar = MeshBuilder.CreateBox('ancestralAltar', { width: 2, height: 0.8, depth: 2 }, scene)
altar.position = new Vector3(0, 0.4, -6)
const altarMat = new StandardMaterial('altarMat', scene)
altarMat.diffuseColor = new Color3(0.5, 0.4, 0.35)
altar.material = altarMat
altar.parent = xhosaRoot

// Stick fighting training area
const fightingCircle = MeshBuilder.CreateCylinder('fightingCircle', { diameter: 6, height: 0.1 }, scene)
fightingCircle.position = new Vector3(0, 0.06, 6)
const fightingCircleMat = new StandardMaterial('fightingCircleMat', scene)
fightingCircleMat.diffuseColor = new Color3(0.7, 0.6, 0.5)
fightingCircle.material = fightingCircleMat
fightingCircle.parent = xhosaRoot

// Xhosa elders and community members
createNpc('xhosaElder', new Vector3(0, 1.1, -4), new Color3(0.65, 0.45, 0.3), xhosaRoot)
createNpc('xhosaInitiate1', new Vector3(-3, 1.1, 2), new Color3(0.6, 0.4, 0.25), xhosaRoot)
createNpc('xhosaInitiate2', new Vector3(3, 1.1, 2), new Color3(0.58, 0.38, 0.23), xhosaRoot)

// Xhosa collectibles arrays
// Xhosa collectibles arrays
const xhosaBeadWhiteMeshes: Mesh[] = []
const xhosaBeadRedMeshes: Mesh[] = []
const xhosaBeadBlackMeshes: Mesh[] = []
const ochreMeshes: Mesh[] = []
const ritualItemMeshes: Mesh[] = []

// Amhara village: highland church, coffee hut, teff plots
const amharaGround = MeshBuilder.CreateCylinder('amharaGround', { diameter: 22, height: 0.1 }, scene)
amharaGround.position = new Vector3(0, 0.05, 0)
const amharaGroundMat = new StandardMaterial('amharaGroundMat', scene)
amharaGroundMat.diffuseColor = new Color3(0.58, 0.5, 0.36)
amharaGround.material = amharaGroundMat
amharaGround.parent = amharaRoot

const amharaChurch = MeshBuilder.CreateCylinder('amharaChurch', { diameter: 4.5, height: 4 }, scene)
amharaChurch.position = new Vector3(-6, 2, -4)
const amharaChurchMat = new StandardMaterial('amharaChurchMat', scene)
amharaChurchMat.diffuseColor = new Color3(0.68, 0.62, 0.55)
amharaChurch.material = amharaChurchMat
amharaChurch.parent = amharaRoot

const coffeeHut = MeshBuilder.CreateCylinder('coffeeHut', { diameter: 3.5, height: 2.6 }, scene)
coffeeHut.position = new Vector3(4, 1.3, 2)
const coffeeHutMat = new StandardMaterial('coffeeHutMat', scene)
coffeeHutMat.diffuseColor = new Color3(0.64, 0.48, 0.3)
coffeeHut.material = coffeeHutMat
coffeeHut.parent = amharaRoot

const manuscriptTable = MeshBuilder.CreateBox('manuscriptTable', { width: 2.5, height: 0.8, depth: 1.2 }, scene)
manuscriptTable.position = new Vector3(0, 0.4, -6)
const manuscriptTableMat = new StandardMaterial('manuscriptTableMat', scene)
manuscriptTableMat.diffuseColor = new Color3(0.5, 0.36, 0.22)
manuscriptTable.material = manuscriptTableMat
manuscriptTable.parent = amharaRoot

createNpc('amharaElder', new Vector3(-3, 1.1, -2), new Color3(0.7, 0.52, 0.35), amharaRoot)
createNpc('amharaPriest', new Vector3(-6, 1.1, -6), new Color3(0.62, 0.46, 0.28), amharaRoot)

// Oromo village: council tree, ritual circle, community huts
const oromoGround = MeshBuilder.CreateCylinder('oromoGround', { diameter: 22, height: 0.1 }, scene)
oromoGround.position = new Vector3(0, 0.05, 0)
const oromoGroundMat = new StandardMaterial('oromoGroundMat', scene)
oromoGroundMat.diffuseColor = new Color3(0.56, 0.48, 0.34)
oromoGround.material = oromoGroundMat
oromoGround.parent = oromoRoot

const odaTreeTrunk = MeshBuilder.CreateCylinder('odaTreeTrunk', { diameter: 1.2, height: 5.5 }, scene)
odaTreeTrunk.position = new Vector3(0, 2.75, -3)
const odaTreeTrunkMat = new StandardMaterial('odaTreeTrunkMat', scene)
odaTreeTrunkMat.diffuseColor = new Color3(0.42, 0.28, 0.16)
odaTreeTrunk.material = odaTreeTrunkMat
odaTreeTrunk.parent = oromoRoot

const odaTreeCrown = MeshBuilder.CreateSphere('odaTreeCrown', { diameter: 6.2 }, scene)
odaTreeCrown.position = new Vector3(0, 6.2, -3)
const odaTreeCrownMat = new StandardMaterial('odaTreeCrownMat', scene)
odaTreeCrownMat.diffuseColor = new Color3(0.2, 0.45, 0.22)
odaTreeCrown.material = odaTreeCrownMat
odaTreeCrown.parent = oromoRoot

const councilCircle = MeshBuilder.CreateCylinder('councilCircle', { diameter: 6.5, height: 0.1 }, scene)
councilCircle.position = new Vector3(0, 0.06, 2)
const councilCircleMat = new StandardMaterial('councilCircleMat', scene)
councilCircleMat.diffuseColor = new Color3(0.66, 0.56, 0.42)
councilCircle.material = councilCircleMat
councilCircle.parent = oromoRoot

createNpc('oromoCouncilLead', new Vector3(0, 1.1, 2), new Color3(0.68, 0.5, 0.32), oromoRoot)
createNpc('oromoCommunity1', new Vector3(-2.5, 1.1, 3), new Color3(0.62, 0.46, 0.3), oromoRoot)
createNpc('oromoCommunity2', new Vector3(2.5, 1.1, 3), new Color3(0.58, 0.42, 0.28), oromoRoot)

// India village setup
createHut(new Vector3(-5, 0, 2), indianVillageRoot)
createHut(new Vector3(4, 0, -2), indianVillageRoot)
createTree(new Vector3(-10, 0, 7), indianVillageRoot)
createTree(new Vector3(9, 0, -8), indianVillageRoot)

const indiaPond = MeshBuilder.CreateCylinder('indiaPond', { diameter: 6, height: 0.1 }, scene)
indiaPond.position = new Vector3(0, 0.05, 4)
const indiaPondMat = new StandardMaterial('indiaPondMat', scene)
indiaPondMat.diffuseColor = new Color3(0.18, 0.36, 0.54)
indiaPondMat.emissiveColor = new Color3(0.04, 0.08, 0.12)
indiaPond.material = indiaPondMat
indiaPond.parent = indianVillageRoot

const indiaRangoli = MeshBuilder.CreateDisc('indiaRangoli', { radius: 2.5, tessellation: 48 }, scene)
indiaRangoli.position = new Vector3(0, 0.06, -1)
indiaRangoli.rotation.x = Math.PI / 2
const indiaRangoliMat = new StandardMaterial('indiaRangoliMat', scene)
indiaRangoliMat.diffuseColor = new Color3(0.86, 0.46, 0.26)
indiaRangoliMat.emissiveColor = new Color3(0.18, 0.08, 0.04)
indiaRangoli.material = indiaRangoliMat
indiaRangoli.parent = indianVillageRoot

const indiaShrine = MeshBuilder.CreateBox('indiaShrine', { width: 2.2, height: 3.2, depth: 1.8 }, scene)
indiaShrine.position = new Vector3(6, 1.6, 5)
const indiaShrineMat = new StandardMaterial('indiaShrineMat', scene)
indiaShrineMat.diffuseColor = new Color3(0.84, 0.72, 0.46)
indiaShrine.material = indiaShrineMat
indiaShrine.parent = indianVillageRoot

const indiaTajPlinth = MeshBuilder.CreateCylinder('indiaTajPlinth', { diameter: 5.5, height: 0.25 }, scene)
indiaTajPlinth.position = new Vector3(0, 0.15, -8)
const indiaTajMat = new StandardMaterial('indiaTajMat', scene)
indiaTajMat.diffuseColor = new Color3(0.88, 0.88, 0.9)
indiaTajMat.emissiveColor = new Color3(0.08, 0.08, 0.1)
indiaTajPlinth.material = indiaTajMat
indiaTajPlinth.parent = indianVillageRoot

createNpc('indianElder', new Vector3(0, 1.1, -7.4), new Color3(0.66, 0.46, 0.24), indianVillageRoot)
createNpc('indianMusician', new Vector3(-3, 1.1, -1.8), new Color3(0.8, 0.52, 0.24), indianVillageRoot)
createNpc('indianPriest', new Vector3(6, 1.1, 5.5), new Color3(0.86, 0.74, 0.44), indianVillageRoot)

// China village setup
createHut(new Vector3(-4, 0, 3), chineseVillageRoot)
createHut(new Vector3(5, 0, -3), chineseVillageRoot)
createTree(new Vector3(-9, 0, -6), chineseVillageRoot)
createTree(new Vector3(10, 0, 7), chineseVillageRoot)

const chinaGate = MeshBuilder.CreateBox('chinaGate', { width: 4.5, height: 3.2, depth: 1.2 }, scene)
chinaGate.position = new Vector3(0, 1.6, 6)
const chinaGateMat = new StandardMaterial('chinaGateMat', scene)
chinaGateMat.diffuseColor = new Color3(0.6, 0.18, 0.14)
chinaGate.material = chinaGateMat
chinaGate.parent = chineseVillageRoot

const chinaWallMarker = MeshBuilder.CreateCylinder('chinaWallMarker', { diameter: 4.6, height: 0.15 }, scene)
chinaWallMarker.position = new Vector3(0, 0.08, -8)
const chinaWallMat = new StandardMaterial('chinaWallMat', scene)
chinaWallMat.diffuseColor = new Color3(0.44, 0.52, 0.3)
chinaWallMarker.material = chinaWallMat
chinaWallMarker.parent = chineseVillageRoot

createNpc('chineseArtisan', new Vector3(-2, 1.1, -1.5), new Color3(0.66, 0.46, 0.24), chineseVillageRoot)
createNpc('chineseScholar', new Vector3(3, 1.1, 1.8), new Color3(0.48, 0.6, 0.28), chineseVillageRoot)

// Japan village setup
createHut(new Vector3(-4, 0, 2), japaneseVillageRoot)
createHut(new Vector3(5, 0, -2), japaneseVillageRoot)
createTree(new Vector3(-9, 0, 6), japaneseVillageRoot)
createTree(new Vector3(9, 0, -7), japaneseVillageRoot)

const zenGarden = MeshBuilder.CreateGround('zenGarden', { width: 6, height: 4 }, scene)
zenGarden.position = new Vector3(0, 0.03, 3)
const zenGardenMat = new StandardMaterial('zenGardenMat', scene)
zenGardenMat.diffuseColor = new Color3(0.84, 0.82, 0.74)
zenGarden.material = zenGardenMat
zenGarden.parent = japaneseVillageRoot

const toriiGate = MeshBuilder.CreateBox('toriiGate', { width: 3.8, height: 3.4, depth: 1 }, scene)
toriiGate.position = new Vector3(6, 1.7, -5)
const toriiGateMat = new StandardMaterial('toriiGateMat', scene)
toriiGateMat.diffuseColor = new Color3(0.72, 0.2, 0.18)
toriiGate.material = toriiGateMat
toriiGate.parent = japaneseVillageRoot

const teaCircle = MeshBuilder.CreateDisc('teaCircle', { radius: 2.1, tessellation: 42 }, scene)
teaCircle.position = new Vector3(-5, 0.05, -3)
teaCircle.rotation.x = Math.PI / 2
const teaCircleMat = new StandardMaterial('teaCircleMat', scene)
teaCircleMat.diffuseColor = new Color3(0.4, 0.56, 0.34)
teaCircle.material = teaCircleMat
teaCircle.parent = japaneseVillageRoot

createNpc('japaneseMonk', new Vector3(6, 1.1, -4.3), new Color3(0.62, 0.46, 0.32), japaneseVillageRoot)
createNpc('japaneseCalligrapher', new Vector3(1.5, 1.1, -1.5), new Color3(0.68, 0.54, 0.4), japaneseVillageRoot)

// Ethiopia collectibles arrays
const coffeeBeanMeshes: Mesh[] = []
const teffMeshes: Mesh[] = []
const crossMeshes: Mesh[] = []
const manuscriptMeshes: Mesh[] = []
const irreechaOfferingMeshes: Mesh[] = []
const butterCoffeeMeshes: Mesh[] = []
const sycamoreRitualMeshes: Mesh[] = []
const indianSpiceMeshes: Mesh[] = []
const indianMantraMeshes: Mesh[] = []
const chineseSilkMeshes: Mesh[] = []
const chineseWoodblockMeshes: Mesh[] = []
const chineseScrollMeshes: Mesh[] = []
const japaneseTeaMeshes: Mesh[] = []
const japaneseBonsaiMeshes: Mesh[] = []
const japaneseCalligraphyMeshes: Mesh[] = []
const japaneseTempleSealMeshes: Mesh[] = []

const yamPositions = [
  new Vector3(6, 0.6, 14),
  new Vector3(12, 0.6, -4),
  new Vector3(-6, 0.6, 8),
  new Vector3(-2, 0.6, -6),
  new Vector3(16, 0.6, 2),
]

const kolaPositions = [
  new Vector3(-10, 0.6, -2),
  new Vector3(-16, 0.6, -8),
  new Vector3(2, 0.6, -18),
]

const stickPositions = [
  new Vector3(-8, 0.6, 6),
  new Vector3(6, 0.6, -10),
]

const fabricPositions = [
  new Vector3(14, 0.5, 14),
  new Vector3(18, 0.5, 2),
  new Vector3(10, 0.5, -6),
]

const flagPositions = [
  new Vector3(-6, 0.5, 20),
  new Vector3(-12, 0.5, 16),
  new Vector3(-18, 0.5, 12),
]

function resetIgboCollectibles() {
  yamMeshes.splice(0).forEach((mesh) => mesh.dispose())
  kolaMeshes.splice(0).forEach((mesh) => mesh.dispose())
  yamPositions.forEach((pos) => createCollectible('yam', new Color3(0.7, 0.36, 0.2), pos, yamMeshes))
  kolaPositions.forEach((pos) => createCollectible('kola', new Color3(0.36, 0.22, 0.12), pos, kolaMeshes))
}

function resetYorubaCollectibles() {
  stickMeshes.splice(0).forEach((mesh) => mesh.dispose())
  stickPositions.forEach((pos) => createStick(pos))
}

function resetHausaCollectibles() {
  fabricMeshes.splice(0).forEach((mesh) => mesh.dispose())
  flagMeshes.splice(0).forEach((mesh) => mesh.dispose())
  fabricPositions.forEach((pos) => createFabric(pos))
  flagPositions.forEach((pos) => createFlagBundle(pos))
}

function resetMaasaiCollectibles() {
  beadRedMeshes.splice(0).forEach((mesh) => mesh.dispose())
  beadGreenMeshes.splice(0).forEach((mesh) => mesh.dispose())
  beadBlueMeshes.splice(0).forEach((mesh) => mesh.dispose())
  redBeadPos.forEach(pos => createBead(pos, new Color3(0.8, 0.2, 0.2), beadRedMeshes))
  greenBeadPos.forEach(pos => createBead(pos, new Color3(0.2, 0.7, 0.2), beadGreenMeshes))
  blueBeadPos.forEach(pos => createBead(pos, new Color3(0.2, 0.4, 0.8), beadBlueMeshes))
}

function resetEgyptianCollectibles() {
  chaliceMeshes.splice(0).forEach((mesh) => mesh.dispose())
  scarabMeshes.splice(0).forEach((mesh) => mesh.dispose())
  tabletMeshes.splice(0).forEach((mesh) => mesh.dispose())
  chalicePos.forEach(pos => createArtifact(pos, new Color3(1, 0.84, 0), 'chalice', chaliceMeshes))
  scarabPos.forEach(pos => createArtifact(pos, new Color3(0.6, 0.4, 0.1), 'scarab', scarabMeshes))
  tabletPos.forEach(pos => createArtifact(pos, new Color3(0.75, 0.7, 0.6), 'tablet', tabletMeshes))
}

// Berber collectible positions
const woolRedPos = [
  new Vector3(-5, 0.5, -4),
  new Vector3(5, 0.5, -4),
]

const woolBluePos = [
  new Vector3(-5, 0.5, 4),
  new Vector3(5, 0.5, 4),
]

const woolYellowPos = [
  new Vector3(-6, 0.5, 0),
  new Vector3(6, 0.5, 0),
]

const hennaPos = [
  new Vector3(-2, 0.5, 2),
  new Vector3(2, 0.5, 2),
  new Vector3(0, 0.5, 4),
  new Vector3(0, 0.5, -4),
]

const mintPos = [
  new Vector3(1, 0.5, 1),
  new Vector3(-1, 0.5, 1),
  new Vector3(0, 0.5, 2),
]

const spicePos = [
  new Vector3(-3, 0.5, -2),
  new Vector3(3, 0.5, -2),
  new Vector3(-3, 0.5, 2),
  new Vector3(3, 0.5, 2),
  new Vector3(0, 0.5, -2),
]

function createWool(position: Vector3, color: Color3, targetArray: Mesh[]) {
  const wool = MeshBuilder.CreateSphere('wool', { diameter: 0.7 }, scene)
  wool.position = position
  const mat = new StandardMaterial('wool-mat', scene)
  mat.diffuseColor = color
  mat.emissiveColor = color.scale(0.3)
  wool.material = mat
  wool.parent = berberRoot
  targetArray.push(wool)
  return wool
}

function createHennaBottle(position: Vector3) {
  const henna = MeshBuilder.CreateCylinder('henna', { diameter: 0.4, height: 0.7 }, scene)
  henna.position = position
  const mat = new StandardMaterial('henna-mat', scene)
  mat.diffuseColor = new Color3(0.5, 0.2, 0.1)
  mat.emissiveColor = new Color3(0.15, 0.06, 0.03)
  henna.material = mat
  henna.parent = berberRoot
  hennaMeshes.push(henna)
  return henna
}

function createMintLeaf(position: Vector3) {
  const mint = MeshBuilder.CreateSphere('mint', { diameter: 0.5 }, scene)
  mint.position = position
  mint.scaling = new Vector3(1, 0.3, 1.5)
  const mat = new StandardMaterial('mint-mat', scene)
  mat.diffuseColor = new Color3(0.2, 0.7, 0.3)
  mat.emissiveColor = new Color3(0.05, 0.2, 0.08)
  mint.material = mat
  mint.parent = berberRoot
  mintMeshes.push(mint)
  return mint
}

function createSpice(position: Vector3, color: Color3) {
  const spice = MeshBuilder.CreateBox('spice', { width: 0.5, height: 0.3, depth: 0.5 }, scene)
  spice.position = position
  const mat = new StandardMaterial('spice-mat', scene)
  mat.diffuseColor = color
  mat.emissiveColor = color.scale(0.4)
  spice.material = mat
  spice.parent = berberRoot
  spiceMeshes.push(spice)
  return spice
}

function resetBerberCollectibles() {
  woolRedMeshes.splice(0).forEach((mesh) => mesh.dispose())
  woolBlueMeshes.splice(0).forEach((mesh) => mesh.dispose())
  woolYellowMeshes.splice(0).forEach((mesh) => mesh.dispose())
  hennaMeshes.splice(0).forEach((mesh) => mesh.dispose())
  mintMeshes.splice(0).forEach((mesh) => mesh.dispose())
  spiceMeshes.splice(0).forEach((mesh) => mesh.dispose())
  
  woolRedPos.forEach(pos => createWool(pos, new Color3(0.8, 0.2, 0.2), woolRedMeshes))
  woolBluePos.forEach(pos => createWool(pos, new Color3(0.2, 0.4, 0.8), woolBlueMeshes))
  woolYellowPos.forEach(pos => createWool(pos, new Color3(0.9, 0.8, 0.2), woolYellowMeshes))
  hennaPos.forEach(pos => createHennaBottle(pos))
  mintPos.forEach(pos => createMintLeaf(pos))
  
  // Spices with varied colors (cumin, saffron, paprika, coriander, cinnamon)
  const spiceColors = [
    new Color3(0.8, 0.6, 0.2),  // Cumin (brown)
    new Color3(0.9, 0.7, 0.1),  // Saffron (gold)
    new Color3(0.8, 0.2, 0.1),  // Paprika (red)
    new Color3(0.7, 0.6, 0.3),  // Coriander (tan)
    new Color3(0.6, 0.3, 0.1),  // Cinnamon (brown)
  ]
  spicePos.forEach((pos, idx) => createSpice(pos, spiceColors[idx]))
}

// Zulu collectible positions
const cowhidePos = [
  new Vector3(-5, 0.5, 4),
  new Vector3(6, 0.5, -3),
]

const zuluWoodPos = [
  new Vector3(-7, 0.5, -2),
  new Vector3(4, 0.5, 5),
  new Vector3(-3, 0.5, -6),
]

const spearPos = [
  new Vector3(2, 0.5, -4),
  new Vector3(-6, 0.5, 2),
  new Vector3(5, 0.5, -6),
]

function createCowhide(position: Vector3) {
  const cowhide = MeshBuilder.CreateBox('cowhide', { width: 1.2, height: 0.2, depth: 1.5 }, scene)
  cowhide.position = position
  cowhide.rotation.y = Math.random() * Math.PI
  const mat = new StandardMaterial('cowhide-mat', scene)
  mat.diffuseColor = new Color3(0.65, 0.5, 0.35)
  mat.emissiveColor = new Color3(0.18, 0.14, 0.1)
  cowhide.material = mat
  cowhide.parent = zuluRoot
  cowhideMeshes.push(cowhide)
  return cowhide
}

function createZuluWood(position: Vector3) {
  const wood = MeshBuilder.CreateCylinder('zuluWood', { diameter: 0.3, height: 1.6 }, scene)
  wood.position = position
  wood.rotation.z = Math.PI / 2
  const mat = new StandardMaterial('zuluWood-mat', scene)
  mat.diffuseColor = new Color3(0.5, 0.32, 0.18)
  mat.emissiveColor = new Color3(0.15, 0.1, 0.05)
  wood.material = mat
  wood.parent = zuluRoot
  woodMeshes.push(wood)
  return wood
}

function createZuluSpear(position: Vector3) {
  const spear = MeshBuilder.CreateCylinder('zuluSpear', { diameterTop: 0.05, diameterBottom: 0.15, height: 2 }, scene)
  spear.position = position.add(new Vector3(0, 0.8, 0))
  spear.rotation.z = Math.PI / 6
  const mat = new StandardMaterial('zuluSpear-mat', scene)
  mat.diffuseColor = new Color3(0.45, 0.28, 0.14)
  mat.emissiveColor = new Color3(0.15, 0.1, 0.05)
  spear.material = mat
  spear.parent = zuluRoot
  spearMeshes.push(spear)
  return spear
}

function resetZuluCollectibles() {
  cowhideMeshes.splice(0).forEach((mesh) => mesh.dispose())
  woodMeshes.splice(0).forEach((mesh) => mesh.dispose())
  spearMeshes.splice(0).forEach((mesh) => mesh.dispose())
  cowhidePos.forEach(pos => createCowhide(pos))
  zuluWoodPos.forEach(pos => createZuluWood(pos))
  spearPos.forEach(pos => createZuluSpear(pos))
}

// Xhosa collectible positions
const xhosaBeadWhitePos = [
  new Vector3(-4, 0.5, 3),
  new Vector3(3, 0.5, -2),
  new Vector3(-2, 0.5, -5),
]

const xhosaBeadRedPos = [
  new Vector3(5, 0.5, 4),
  new Vector3(-5, 0.5, -3),
  new Vector3(2, 0.5, 6),
]

const xhosaBeadBlackPos = [
  new Vector3(-6, 0.5, 1),
  new Vector3(4, 0.5, -5),
  new Vector3(-1, 0.5, 5),
]

const ochrePos = [
  new Vector3(6, 0.5, 2),
  new Vector3(-3, 0.5, 4),
  new Vector3(1, 0.5, -6),
]

const ritualItemPos = [
  new Vector3(-7, 0.5, -1),
  new Vector3(5, 0.5, -4),
  new Vector3(-2, 0.5, 6),
]

function createXhosaBead(position: Vector3, color: Color3, targetArray: Mesh[]) {
  const bead = MeshBuilder.CreateSphere('xhosaBead', { diameter: 0.6 }, scene)
  bead.position = position
  const mat = new StandardMaterial('xhosaBead-mat', scene)
  mat.diffuseColor = color
  mat.emissiveColor = color.scale(0.35)
  bead.material = mat
  bead.parent = xhosaRoot
  targetArray.push(bead)
  return bead
}

function createOchre(position: Vector3) {
  const ochre = MeshBuilder.CreateBox('ochre', { width: 0.6, height: 0.4, depth: 0.6 }, scene)
  ochre.position = position
  ochre.rotation.y = Math.random() * Math.PI
  const mat = new StandardMaterial('ochre-mat', scene)
  mat.diffuseColor = new Color3(0.8, 0.35, 0.15)
  mat.emissiveColor = new Color3(0.25, 0.12, 0.05)
  ochre.material = mat
  ochre.parent = xhosaRoot
  ochreMeshes.push(ochre)
  return ochre
}

function createRitualItem(position: Vector3) {
  const item = MeshBuilder.CreateCylinder('ritualItem', { diameter: 0.5, height: 0.7 }, scene)
  item.position = position
  const mat = new StandardMaterial('ritualItem-mat', scene)
  mat.diffuseColor = new Color3(0.55, 0.45, 0.35)
  mat.emissiveColor = new Color3(0.18, 0.15, 0.12)
  item.material = mat
  item.parent = xhosaRoot
  ritualItemMeshes.push(item)
  return item
}

function resetXhosaCollectibles() {
  xhosaBeadWhiteMeshes.splice(0).forEach((mesh) => mesh.dispose())
  xhosaBeadRedMeshes.splice(0).forEach((mesh) => mesh.dispose())
  xhosaBeadBlackMeshes.splice(0).forEach((mesh) => mesh.dispose())
  ochreMeshes.splice(0).forEach((mesh) => mesh.dispose())
  ritualItemMeshes.splice(0).forEach((mesh) => mesh.dispose())
  xhosaBeadWhitePos.forEach(pos => createXhosaBead(pos, new Color3(0.95, 0.95, 0.95), xhosaBeadWhiteMeshes))
  xhosaBeadRedPos.forEach(pos => createXhosaBead(pos, new Color3(0.85, 0.15, 0.15), xhosaBeadRedMeshes))
  xhosaBeadBlackPos.forEach(pos => createXhosaBead(pos, new Color3(0.15, 0.15, 0.15), xhosaBeadBlackMeshes))
  ochrePos.forEach(pos => createOchre(pos))
  ritualItemPos.forEach(pos => createRitualItem(pos))
}

const coffeeBeanPos = [new Vector3(-5, 0.5, -2), new Vector3(2, 0.5, 2), new Vector3(5, 0.5, -4)]
const teffPos = [new Vector3(-3, 0.5, 4), new Vector3(1, 0.5, 5), new Vector3(4, 0.5, 4), new Vector3(6, 0.5, 2)]
const crossPos = [new Vector3(-7, 0.5, -5), new Vector3(-2, 0.5, -6), new Vector3(2, 0.5, -5)]
const manuscriptPos = [new Vector3(-1, 0.5, -4), new Vector3(1.5, 0.5, -4), new Vector3(0, 0.5, -7)]
const irreechaOfferingPos = [new Vector3(-4, 0.5, 1), new Vector3(0, 0.5, 4), new Vector3(4, 0.5, 1)]
const butterCoffeePos = [new Vector3(-5, 0.5, -2), new Vector3(0, 0.5, -1), new Vector3(5, 0.5, -2)]
const sycamoreRitualPos = [new Vector3(-3, 0.5, -5), new Vector3(0, 0.5, -6), new Vector3(3, 0.5, -5)]
const indianSpicePos = [
  new Vector3(-6, 0.5, 2),
  new Vector3(-3, 0.5, 4),
  new Vector3(0, 0.5, 5),
  new Vector3(3, 0.5, 4),
  new Vector3(6, 0.5, 2),
]
const indianMantraPos = [
  new Vector3(-2, 0.5, -2),
  new Vector3(0, 0.5, -1),
  new Vector3(2, 0.5, -2),
  new Vector3(0, 0.5, -4),
  new Vector3(0, 0.5, -6),
]
const chineseSilkPos = [
  new Vector3(-6, 0.5, 2),
  new Vector3(-2, 0.5, 3),
  new Vector3(2, 0.5, 2),
  new Vector3(6, 0.5, 1),
]
const chineseWoodblockPos = [
  new Vector3(-4, 0.5, -2),
  new Vector3(0, 0.5, -3),
  new Vector3(4, 0.5, -2),
]
const chineseScrollPos = [
  new Vector3(-3, 0.5, -6),
  new Vector3(-1, 0.5, -7),
  new Vector3(2, 0.5, -6),
  new Vector3(4, 0.5, -7),
]
const japaneseTeaPos = [
  new Vector3(-6, 0.5, -2),
  new Vector3(-4, 0.5, -4),
  new Vector3(-2, 0.5, -2),
]
const japaneseBonsaiPos = [
  new Vector3(0, 0.5, 2),
  new Vector3(2, 0.5, 3),
  new Vector3(4, 0.5, 2),
]
const japaneseCalligraphyPos = [
  new Vector3(1, 0.5, -1),
  new Vector3(2, 0.5, -2),
  new Vector3(3, 0.5, -1),
  new Vector3(4, 0.5, -2),
  new Vector3(5, 0.5, -1),
]
const japaneseTempleSealPos = [
  new Vector3(6, 0.5, -6),
  new Vector3(7, 0.5, -5),
  new Vector3(5, 0.5, -4),
]

function createEthiopiaCollectible(name: string, color: Color3, position: Vector3, root: TransformNode, targetArray: Mesh[]) {
  const item = MeshBuilder.CreateSphere(name, { diameter: 0.6 }, scene)
  item.position = position
  const mat = new StandardMaterial(`${name}-mat`, scene)
  mat.diffuseColor = color
  mat.emissiveColor = color.scale(0.28)
  item.material = mat
  item.parent = root
  targetArray.push(item)
  return item
}

function resetAmharaCollectibles() {
  coffeeBeanMeshes.splice(0).forEach((mesh) => mesh.dispose())
  teffMeshes.splice(0).forEach((mesh) => mesh.dispose())
  crossMeshes.splice(0).forEach((mesh) => mesh.dispose())
  manuscriptMeshes.splice(0).forEach((mesh) => mesh.dispose())
  coffeeBeanPos.forEach(pos => createEthiopiaCollectible('coffeeBean', new Color3(0.38, 0.24, 0.14), pos, amharaRoot, coffeeBeanMeshes))
  teffPos.forEach(pos => createEthiopiaCollectible('teff', new Color3(0.75, 0.68, 0.45), pos, amharaRoot, teffMeshes))
  crossPos.forEach(pos => createEthiopiaCollectible('cross', new Color3(0.8, 0.72, 0.5), pos, amharaRoot, crossMeshes))
  manuscriptPos.forEach(pos => createEthiopiaCollectible('manuscript', new Color3(0.7, 0.62, 0.45), pos, amharaRoot, manuscriptMeshes))
}

function resetOromoCollectibles() {
  irreechaOfferingMeshes.splice(0).forEach((mesh) => mesh.dispose())
  butterCoffeeMeshes.splice(0).forEach((mesh) => mesh.dispose())
  sycamoreRitualMeshes.splice(0).forEach((mesh) => mesh.dispose())
  irreechaOfferingPos.forEach(pos => createEthiopiaCollectible('irreechaOffering', new Color3(0.34, 0.58, 0.34), pos, oromoRoot, irreechaOfferingMeshes))
  butterCoffeePos.forEach(pos => createEthiopiaCollectible('butterCoffee', new Color3(0.72, 0.56, 0.3), pos, oromoRoot, butterCoffeeMeshes))
  sycamoreRitualPos.forEach(pos => createEthiopiaCollectible('sycamoreRitual', new Color3(0.62, 0.5, 0.36), pos, oromoRoot, sycamoreRitualMeshes))
}

function resetIndianCollectibles() {
  indianSpiceMeshes.splice(0).forEach((mesh) => mesh.dispose())
  indianMantraMeshes.splice(0).forEach((mesh) => mesh.dispose())
  indianSpicePos.forEach(pos => createEthiopiaCollectible('indianSpice', new Color3(0.88, 0.56, 0.24), pos, indianVillageRoot, indianSpiceMeshes))
  indianMantraPos.forEach(pos => createEthiopiaCollectible('indianMantra', new Color3(0.72, 0.44, 0.72), pos, indianVillageRoot, indianMantraMeshes))
}

function resetChineseCollectibles() {
  chineseSilkMeshes.splice(0).forEach((mesh) => mesh.dispose())
  chineseWoodblockMeshes.splice(0).forEach((mesh) => mesh.dispose())
  chineseScrollMeshes.splice(0).forEach((mesh) => mesh.dispose())
  chineseSilkPos.forEach(pos => createEthiopiaCollectible('chineseSilk', new Color3(0.78, 0.64, 0.3), pos, chineseVillageRoot, chineseSilkMeshes))
  chineseWoodblockPos.forEach(pos => createEthiopiaCollectible('chineseWoodblock', new Color3(0.54, 0.4, 0.26), pos, chineseVillageRoot, chineseWoodblockMeshes))
  chineseScrollPos.forEach(pos => createEthiopiaCollectible('chineseScroll', new Color3(0.78, 0.74, 0.62), pos, chineseVillageRoot, chineseScrollMeshes))
}

function resetJapaneseCollectibles() {
  japaneseTeaMeshes.splice(0).forEach((mesh) => mesh.dispose())
  japaneseBonsaiMeshes.splice(0).forEach((mesh) => mesh.dispose())
  japaneseCalligraphyMeshes.splice(0).forEach((mesh) => mesh.dispose())
  japaneseTempleSealMeshes.splice(0).forEach((mesh) => mesh.dispose())
  japaneseTeaPos.forEach(pos => createEthiopiaCollectible('japaneseTea', new Color3(0.48, 0.66, 0.3), pos, japaneseVillageRoot, japaneseTeaMeshes))
  japaneseBonsaiPos.forEach(pos => createEthiopiaCollectible('japaneseBonsai', new Color3(0.34, 0.5, 0.3), pos, japaneseVillageRoot, japaneseBonsaiMeshes))
  japaneseCalligraphyPos.forEach(pos => createEthiopiaCollectible('japaneseCalligraphy', new Color3(0.86, 0.84, 0.78), pos, japaneseVillageRoot, japaneseCalligraphyMeshes))
  japaneseTempleSealPos.forEach(pos => createEthiopiaCollectible('japaneseSeal', new Color3(0.78, 0.34, 0.3), pos, japaneseVillageRoot, japaneseTempleSealMeshes))
}

function resetTribeMission(tribe: Tribe) {
  if (tribe === 'Igbo') {
    igboMission.yamsCollected = 0
    igboMission.kolaCollected = 0
    igboMission.cookingStage = 0
    igboMission.cookingDone = false
    igboMission.delivered = false
    igboMission.storyStage = 0
    igboMission.storyDone = false
    resetIgboCollectibles()
  }

  if (tribe === 'Yoruba') {
    yorubaMission.sticksCollected = 0
    yorubaMission.rhythmHits = 0
    yorubaMission.rhythmActive = false
    yorubaMission.rhythmDone = false
    resetYorubaCollectibles()
  }

  if (tribe === 'Hausa') {
    hausaMission.fabricCollected = 0
    hausaMission.flagsCollected = 0
    hausaMission.arranged = false
    resetHausaCollectibles()
  }

  if (tribe === 'Maasai') {
    maasaiMission.beadsRed = 0
    maasaiMission.beadsGreen = 0
    maasaiMission.beadsBlue = 0
    maasaiMission.danceSteps = 0
    maasaiMission.ceremonyDone = false
    resetMaasaiCollectibles()
  }

  if (tribe === 'Egyptian') {
    egyptianMission.chalicesCollected = 0
    egyptianMission.scarabsCollected = 0
    egyptianMission.tabletsCollected = 0
    egyptianMission.celestialDone = false
    egyptianMission.alignmentSteps = 0
    resetEgyptianCollectibles()
  }

  if (tribe === 'Berber') {
    berberMission.woolRed = 0
    berberMission.woolBlue = 0
    berberMission.woolYellow = 0
    berberMission.hennaCollected = 0
    berberMission.mintCollected = 0
    berberMission.spicesCollected = 0
    berberMission.carpetWoven = false
    berberMission.hennaArtDone = false
    berberMission.teaCeremonyDone = false
    berberMission.tagineCookingDone = false
    resetBerberCollectibles()
  }

  if (tribe === 'Zulu') {
    missionManager.zulu.cowhideCollected = 0
    missionManager.zulu.woodCollected = 0
    missionManager.zulu.shieldCrafted = false
    missionManager.zulu.spearsCollected = 0
    missionManager.zulu.spearTrainingDone = false
    missionManager.zulu.cattleHerded = 0
    missionManager.zulu.herdingDone = false
    missionManager.zulu.ceremonyPreparationDone = false
    missionManager.zulu.umemuloDone = false
    resetZuluCollectibles()
  }

  if (tribe === 'Xhosa') {
    missionManager.xhosa.beadsWhite = 0
    missionManager.xhosa.beadsRed = 0
    missionManager.xhosa.beadsBlack = 0
    missionManager.xhosa.beadworkDone = false
    missionManager.xhosa.ochreCollected = 0
    missionManager.xhosa.bodyPaintingDone = false
    missionManager.xhosa.stickFightingSteps = 0
    missionManager.xhosa.stickFightingDone = false
    missionManager.xhosa.ritualItemsCollected = 0
    missionManager.xhosa.ancestralOfferingDone = false
    resetXhosaCollectibles()
  }

  if (tribe === 'Amhara') {
    amharaMission.coffeeBeansCollected = 0
    amharaMission.coffeeCeremonyDone = false
    amharaMission.teffCollected = 0
    amharaMission.injeraDone = false
    amharaMission.crossesCarved = 0
    amharaMission.crossCarvingDone = false
    amharaMission.manuscriptsOrganized = 0
    amharaMission.manuscriptDone = false
    resetAmharaCollectibles()
  }

  if (tribe === 'Oromo') {
    oromoMission.councilParticipationDone = false
    oromoMission.irreechaOfferingsCollected = 0
    oromoMission.irreechaDone = false
    oromoMission.butterCoffeeIngredientsCollected = 0
    oromoMission.butterCoffeeDone = false
    oromoMission.sycamoreRitualItemsCollected = 0
    oromoMission.sycamoreRitualDone = false
    resetOromoCollectibles()
  }

  if (tribe === 'Indian') {
    missionManager.indian.spicesCollected = 0
    missionManager.indian.spiceMixingDone = false
    missionManager.indian.talaMeasuresDone = false
    missionManager.indian.mantrasChanted = 0
    missionManager.indian.mantraDone = false
    missionManager.indian.tajMahalContemplationDone = false
    resetIndianCollectibles()
  }

  if (tribe === 'Chinese') {
    missionManager.chinese.silkSpoolsCollected = 0
    missionManager.chinese.silkDyedDone = false
    missionManager.chinese.woodBlocksCarved = 0
    missionManager.chinese.woodblockPrintingDone = false
    missionManager.chinese.paintedScrollsCollected = 0
    missionManager.chinese.artworkCompleteDone = false
    resetChineseCollectibles()
  }

  if (tribe === 'Japanese') {
    missionManager.japanese.teaLeavesGathered = 0
    missionManager.japanese.teaCeremonyDone = false
    missionManager.japanese.bonsaiTrimmed = 0
    missionManager.japanese.bonsaiPruningDone = false
    missionManager.japanese.calligraphyCharactersWritten = 0
    missionManager.japanese.calligraphyArtDone = false
    missionManager.japanese.templesVisited = 0
    missionManager.japanese.templePilgrimageDone = false
    resetJapaneseCollectibles()
  }
}

resetIgboCollectibles()
resetYorubaCollectibles()
resetHausaCollectibles()
resetMaasaiCollectibles()
resetEgyptianCollectibles()
resetBerberCollectibles()
resetZuluCollectibles()
resetXhosaCollectibles()
resetAmharaCollectibles()
resetOromoCollectibles()
resetIndianCollectibles()
resetChineseCollectibles()
resetJapaneseCollectibles()

const festivalStage = MeshBuilder.CreateCylinder('festivalStage', { diameter: 10, height: 0.4 }, scene)
festivalStage.position = new Vector3(2, 0.2, 6)
const festivalMat = new StandardMaterial('festivalMat', scene)
festivalMat.diffuseColor = new Color3(0.6, 0.2, 0.2)
festivalMat.emissiveColor = new Color3(0.2, 0.05, 0.05)
festivalStage.material = festivalMat
festivalStage.parent = festivalRoot

const festivalDrum = MeshBuilder.CreateCylinder('festivalDrum', { diameter: 1.4, height: 1.4 }, scene)
festivalDrum.position = new Vector3(2, 1, 6)
const drumMat = new StandardMaterial('drumMat', scene)
drumMat.diffuseColor = new Color3(0.5, 0.3, 0.1)
drumMat.emissiveColor = new Color3(0.2, 0.1, 0.04)
festivalDrum.material = drumMat
festivalDrum.parent = festivalRoot

// Ambient animations: banner sway and drum glow pulse
let bannerSwayTime = 0
let drumGlowTime = 0

/**
 * Lazy-load regions based on game state transitions
 * Ensures meshes are created only when needed
 */
async function loadStateRegions(newState: GameState) {
  const regionsToLoad: string[] = []

  // Map states to regions that need loading
  if (newState === 'nigeria' || newState === 'lga-select' || newState === 'village') {
    regionsToLoad.push('nigeria')
  }
  if (newState === 'kenya' || (newState === 'village' && selectedTribe === 'Maasai')) {
    regionsToLoad.push('kenya')
  }
  if (newState === 'egypt' || (newState === 'village' && selectedTribe === 'Egyptian')) {
    regionsToLoad.push('egypt')
  }
  if (newState === 'morocco' || (newState === 'village' && selectedTribe === 'Berber')) {
    regionsToLoad.push('morocco')
  }
  if (newState === 'southafrica' || (newState === 'village' && (selectedTribe === 'Zulu' || selectedTribe === 'Xhosa'))) {
    regionsToLoad.push('southafrica')
  }
  if (newState === 'ethiopia' || (newState === 'village' && (selectedTribe === 'Amhara' || selectedTribe === 'Oromo'))) {
    regionsToLoad.push('ethiopia')
  }
  if (newState === 'asia') {
    regionsToLoad.push('asia')
  }
  if (newState === 'india' || (newState === 'village' && selectedTribe === 'Indian')) {
    regionsToLoad.push('india')
  }
  if (newState === 'china' || (newState === 'village' && selectedTribe === 'Chinese')) {
    regionsToLoad.push('china')
  }
  if (newState === 'japan' || (newState === 'village' && selectedTribe === 'Japanese')) {
    regionsToLoad.push('japan')
  }

  // Load all needed regions in parallel
  await Promise.all(regionsToLoad.map(region => loadRegion(region)))
}

function setState(next: GameState) {
  state = next
  const activeTribe = getActiveTribe()
  const activeLGA = selectedLGA ?? 'Owerri'

  // Trigger async region loading
  loadStateRegions(next).catch(err => console.error('Region loading failed:', err))

  hubMarkersRoot.setEnabled(state === 'hub')
  africaMarkersRoot.setEnabled(state === 'africa')
  asiaRoot.setEnabled(state === 'asia')
  sharedRoot.setEnabled(state === 'hub' || state === 'africa')
  nigeriaRoot.setEnabled(state === 'nigeria' || state === 'lga-select')
  kenyaRoot.setEnabled(state === 'kenya')
  egyptRoot.setEnabled(state === 'egypt')
  moroccoRoot.setEnabled(state === 'morocco')
  southafricaRoot.setEnabled(state === 'southafrica')
  ethiopiaRoot.setEnabled(state === 'ethiopia')
  indiaRoot.setEnabled(state === 'india')
  chinaRoot.setEnabled(state === 'china')
  japanRoot.setEnabled(state === 'japan')
  lgaMarkersRoot.setEnabled(state === 'lga-select')
  villageRoot.setEnabled(state === 'village' || state === 'festival')
  festivalRoot.setEnabled(state === 'festival')
  igboRoot.setEnabled(state === 'village' || state === 'festival' ? activeTribe === 'Igbo' : false)
  owrerriZone.setEnabled(activeTribe === 'Igbo' && activeLGA === 'Owerri' && (state === 'village' || state === 'festival'))
  arochukwuZone.setEnabled(activeTribe === 'Igbo' && activeLGA === 'Arochukwu' && (state === 'village' || state === 'festival'))
  onitshZone.setEnabled(activeTribe === 'Igbo' && activeLGA === 'Onitsha' && (state === 'village' || state === 'festival'))
  yorubaRoot.setEnabled(state === 'village' || state === 'festival' ? activeTribe === 'Yoruba' : false)
  hausaRoot.setEnabled(state === 'village' || state === 'festival' ? activeTribe === 'Hausa' : false)
  maasaiRoot.setEnabled(state === 'village' || state === 'festival' ? activeTribe === 'Maasai' : false)
  egyptianRoot.setEnabled(state === 'village' || state === 'festival' ? activeTribe === 'Egyptian' : false)
  berberRoot.setEnabled(state === 'village' || state === 'festival' ? activeTribe === 'Berber' : false)
  zuluRoot.setEnabled(state === 'village' || state === 'festival' ? activeTribe === 'Zulu' : false)
  xhosaRoot.setEnabled(state === 'village' || state === 'festival' ? activeTribe === 'Xhosa' : false)
  amharaRoot.setEnabled(state === 'village' || state === 'festival' ? activeTribe === 'Amhara' : false)
  oromoRoot.setEnabled(state === 'village' || state === 'festival' ? activeTribe === 'Oromo' : false)
  indianVillageRoot.setEnabled(state === 'village' || state === 'festival' ? activeTribe === 'Indian' : false)
  chineseVillageRoot.setEnabled(state === 'village' || state === 'festival' ? activeTribe === 'Chinese' : false)
  japaneseVillageRoot.setEnabled(state === 'village' || state === 'festival' ? activeTribe === 'Japanese' : false)

  if (state === 'hub') {
    scene.activeCamera = arcCamera
    arcCamera.attachControl(canvas, true)
    walkCamera.detachControl()
    arcCamera.beta = defaultArcBeta
    desiredAlpha = arcCamera.alpha
    desiredBeta = arcCamera.beta
    uiManager.get('uiCrosshair').classList.add('hidden')
    uiManager.get('uiChoices').classList.add('hidden')
    setTitle('Heritage', 'An AEVON cultural journey. Choose a continent to begin.')
    setObjective('Explore the hub world.')
    setHint('Tip: Drag to rotate the globe, then click Africa.')
    setAction(null, null)
    desiredTarget = Vector3.Zero()
    desiredRadius = 16
    setTutorial('Drag to rotate the globe. Click Africa to begin the demo.')
    setRecapVisible(false)
  }

  if (state === 'africa') {
    scene.activeCamera = arcCamera
    arcCamera.attachControl(canvas, true)
    walkCamera.detachControl()
    arcCamera.beta = defaultArcBeta
    desiredAlpha = arcCamera.alpha
    desiredBeta = arcCamera.beta
    uiManager.get('uiCrosshair').classList.add('hidden')
    uiManager.get('uiChoices').classList.add('hidden')
    desiredTarget = africaMarker.position
    desiredRadius = 11
    setTitle('Africa Gallery', 'Zoom in to select a nation.')
    setObjective('Select Nigeria to continue.')
    setHint('Nigeria leads to the Festival of Unity demo.')
    setAction('Back to Hub', () => setState('hub'))
    setTutorial('Click Nigeria to open the cultural map.')
    setRecapVisible(false)

    factCardSystem.unlockHubInsight()
  }

  if (state === 'nigeria') {
    scene.activeCamera = arcCamera
    arcCamera.attachControl(canvas, true)
    walkCamera.detachControl()
    uiManager.get('uiCrosshair').classList.add('hidden')
    uiManager.get('uiChoices').classList.add('hidden')
    arcCamera.beta = Math.PI / 3.2
    desiredAlpha = arcCamera.alpha
    desiredBeta = arcCamera.beta
    desiredTarget = new Vector3(0, 0, 0)
    desiredRadius = 12
    setTitle('Nigeria', 'Choose a tribe to personalize your journey.')
    setObjective('Click a tribe marker on the map to begin the festival preparation.')
    setHint('Igbo, Yoruba, and Hausa paths are available in this demo.')
    setAction('Back to Africa', () => setState('africa'))
    setTutorial('Choose a tribe marker to enter its mission.')
    setRecapVisible(false)
  }

  if (state === 'kenya') {
    scene.activeCamera = arcCamera
    arcCamera.attachControl(canvas, true)
    walkCamera.detachControl()
    uiManager.get('uiCrosshair').classList.add('hidden')
    uiManager.get('uiChoices').classList.add('hidden')
    arcCamera.beta = Math.PI / 3.2
    desiredAlpha = arcCamera.alpha
    desiredBeta = arcCamera.beta
    desiredTarget = new Vector3(0, 0, 0)
    desiredRadius = 12
    setTitle('Kenya', 'Meet the Maasai people.')
    setObjective('Click the Maasai warrior marker to begin bead trading and warrior dance training.')
    setHint('The Maasai are renowned warriors and pastoralists of East Africa.')
    setAction('Back to Africa', () => setState('africa'))
    setTutorial('Click the Maasai marker to enter their ceremonial village.')
    setRecapVisible(false)
  }

  if (state === 'egypt') {
    scene.activeCamera = arcCamera
    arcCamera.attachControl(canvas, true)
    walkCamera.detachControl()
    uiManager.get('uiCrosshair').classList.add('hidden')
    uiManager.get('uiChoices').classList.add('hidden')
    arcCamera.beta = Math.PI / 3.2
    desiredAlpha = arcCamera.alpha
    desiredBeta = arcCamera.beta
    desiredTarget = new Vector3(0, 0, 0)
    desiredRadius = 12
    setTitle('Egypt', 'Discover the wisdom of the Pharaohs.')
    setObjective('Click the Pharaoh marker to begin artifact gathering and celestial alignment.')
    setHint('Ancient Egypt was home to monumental temples and sacred mysteries.')
    setAction('Back to Africa', () => setState('africa'))
    setTutorial('Click the Pharaoh marker to enter the temple and begin your journey.')
    setRecapVisible(false)
  }

  if (state === 'morocco') {
    scene.activeCamera = arcCamera
    arcCamera.attachControl(canvas, true)
    walkCamera.detachControl()
    uiManager.get('uiCrosshair').classList.add('hidden')
    uiManager.get('uiChoices').classList.add('hidden')
    arcCamera.beta = Math.PI / 3.2
    desiredAlpha = arcCamera.alpha
    desiredBeta = arcCamera.beta
    desiredTarget = new Vector3(0, 0, 0)
    desiredRadius = 12
    setTitle('Morocco', 'Journey into Berber traditions.')
    setObjective('Click the Berber marker to explore carpet weaving, henna art, mint tea ceremony, and tagine cooking.')
    setHint('The Berber people are the indigenous inhabitants of North Africa, known for vibrant textiles and culinary arts.')
    setAction('Back to Africa', () => setState('africa'))
    setTutorial('Click the Berber marker to enter the kasbah marketplace.')
    setRecapVisible(false)
  }

  if (state === 'southafrica') {
    scene.activeCamera = arcCamera
    arcCamera.attachControl(canvas, true)
    walkCamera.detachControl()
    uiManager.get('uiCrosshair').classList.add('hidden')
    uiManager.get('uiChoices').classList.add('hidden')
    arcCamera.beta = Math.PI / 3.2
    desiredAlpha = arcCamera.alpha
    desiredBeta = arcCamera.beta
    desiredTarget = new Vector3(0, 0, 0)
    desiredRadius = 12
    setTitle('South Africa', 'Experience Zulu and Xhosa traditions.')
    setObjective('Click a tribe marker: Zulu for shield crafting & warrior training, or Xhosa for beadwork & ancestral rituals.')
    setHint('The Zulu and Xhosa people have rich warrior cultures, beadwork traditions, and deep ancestral connections.')
    setAction('Back to Africa', () => setState('africa'))
    setTutorial('Choose Zulu or Xhosa to explore their unique cultural practices.')
    setRecapVisible(false)
  }

  if (state === 'ethiopia') {
    scene.activeCamera = arcCamera
    arcCamera.attachControl(canvas, true)
    walkCamera.detachControl()
    uiManager.get('uiCrosshair').classList.add('hidden')
    uiManager.get('uiChoices').classList.add('hidden')
    arcCamera.beta = Math.PI / 3.2
    desiredAlpha = arcCamera.alpha
    desiredBeta = arcCamera.beta
    desiredTarget = new Vector3(0, 0, 0)
    desiredRadius = 12
    setTitle('Ethiopia', 'Explore Amhara and Oromo highland traditions.')
    setObjective('Click a tribe marker: Amhara for coffee and manuscripts, or Oromo for council and ritual missions.')
    setHint('Ethiopia blends ancient liturgical heritage with vibrant indigenous ceremonial traditions.')
    setAction('Back to Africa', () => setState('africa'))
    setTutorial('Choose Amhara or Oromo to begin your Ethiopian cultural journey.')
    setRecapVisible(false)
  }

  if (state === 'asia') {
    scene.activeCamera = arcCamera
    arcCamera.attachControl(canvas, true)
    walkCamera.detachControl()
    arcCamera.beta = defaultArcBeta
    desiredAlpha = arcCamera.alpha
    desiredBeta = arcCamera.beta
    uiManager.get('uiCrosshair').classList.add('hidden')
    uiManager.get('uiChoices').classList.add('hidden')
    desiredTarget = asiaMarker.position
    desiredRadius = 11
    setTitle('Asia Gallery', 'Explore three great Asian cultural centers.')
    setObjective('Select India, China, or Japan to learn ancient traditions.')
    setHint('Each nation offers unique artistic, spiritual, and culinary heritage.')
    setAction('Back to Hub', () => setState('hub'))
    setTutorial('Click on a nation marker to explore Asian cultures.')
    setRecapVisible(false)

    factCardSystem.unlockAsiaInsight()
  }

  if (state === 'india') {
    scene.activeCamera = arcCamera
    arcCamera.attachControl(canvas, true)
    walkCamera.detachControl()
    uiManager.get('uiCrosshair').classList.add('hidden')
    uiManager.get('uiChoices').classList.add('hidden')
    arcCamera.beta = Math.PI / 3.2
    desiredAlpha = arcCamera.alpha
    desiredBeta = arcCamera.beta
    desiredTarget = new Vector3(0, 0, 0)
    desiredRadius = 12
    setTitle('India', 'Discover the spiritual heart of Asia.')
    setObjective('Click the Indian marker to learn spice trade, classical music, and Taj Mahal wisdom.')
    setHint('India\'s diverse traditions span millenia of artistic and spiritual refinement.')
    setAction('Back to Asia', () => setState('asia'))
    setTutorial('Click the Indian marker to begin the spice trading mission.')
    setRecapVisible(false)
  }

  if (state === 'china') {
    scene.activeCamera = arcCamera
    arcCamera.attachControl(canvas, true)
    walkCamera.detachControl()
    uiManager.get('uiCrosshair').classList.add('hidden')
    uiManager.get('uiChoices').classList.add('hidden')
    arcCamera.beta = Math.PI / 3.2
    desiredAlpha = arcCamera.alpha
    desiredBeta = arcCamera.beta
    desiredTarget = new Vector3(0, 0, 0)
    desiredRadius = 12
    setTitle('China', 'Master the art of the Middle Kingdom.')
    setObjective('Click the Chinese marker to learn silk production, woodblock printing, and scroll painting.')
    setHint('China\'s Great Wall and Silk Road represent centuries of innovation and cultural exchange.')
    setAction('Back to Asia', () => setState('asia'))
    setTutorial('Click the Chinese marker to begin the silk weaving mission.')
    setRecapVisible(false)
  }

  if (state === 'japan') {
    scene.activeCamera = arcCamera
    arcCamera.attachControl(canvas, true)
    walkCamera.detachControl()
    uiManager.get('uiCrosshair').classList.add('hidden')
    uiManager.get('uiChoices').classList.add('hidden')
    arcCamera.beta = Math.PI / 3.2
    desiredAlpha = arcCamera.alpha
    desiredBeta = arcCamera.beta
    desiredTarget = new Vector3(0, 0, 0)
    desiredRadius = 12
    setTitle('Japan', 'Experience the Way of harmony and beauty.')
    setObjective('Click the Japanese marker to learn tea ceremony, bonsai, calligraphy, and temple pilgrimage.')
    setHint('Japan\'s zen aesthetics and martial traditions represent centuries of refined craftsmanship.')
    setAction('Back to Asia', () => setState('asia'))
    setTutorial('Click the Japanese marker to begin the tea ceremony mission.')
    setRecapVisible(false)
  }

  if (state === 'lga-select') {
    scene.activeCamera = arcCamera
    arcCamera.attachControl(canvas, true)
    walkCamera.detachControl()
    uiManager.get('uiCrosshair').classList.add('hidden')
    uiManager.get('uiChoices').classList.add('hidden')
    arcCamera.beta = Math.PI / 3.2
    desiredAlpha = arcCamera.alpha
    desiredBeta = arcCamera.beta
    desiredTarget = new Vector3(0, 0, 0)
    desiredRadius = 12
    setTitle('Nigeria - Igbo', 'Choose a Local Government Area.')
    setObjective('Select Owerri, Arochukwu, or Onitsha.')
    setHint('Each LGA has its own cultural mission.')
    setAction('Back to Nigeria', () => setState('nigeria'))
    setTutorial('Each LGA offers distinct cultural missions. Choose one to begin.')
    setRecapVisible(false)
  }

  if (state === 'village') {
    scene.activeCamera = walkCamera
    walkCamera.attachControl(canvas, true)
    uiManager.get('uiCrosshair').classList.remove('hidden')
    uiManager.get('uiChoices').classList.add('hidden')
    
    // Track first village visit
    if (!achievementSystem.isUnlocked('first-steps')) {
      achievementSystem.unlock('first-steps')
    }
    
    // Track region visits
    if (selectedTribe === 'Maasai') {
      saveSystem.visitRegion('kenya')
    } else if (selectedTribe === 'Egyptian') {
      saveSystem.visitRegion('egypt')
    } else if (selectedTribe === 'Berber') {
      saveSystem.visitRegion('morocco')
    } else if (selectedTribe === 'Zulu' || selectedTribe === 'Xhosa') {
      saveSystem.visitRegion('southafrica')
    } else if (selectedTribe === 'Amhara' || selectedTribe === 'Oromo') {
      saveSystem.visitRegion('ethiopia')
    } else {
      saveSystem.visitRegion('nigeria')
    }

    const regionTitle = selectedTribe === 'Maasai'
      ? 'Kenya'
      : selectedTribe === 'Egyptian'
        ? 'Egypt'
        : selectedTribe === 'Berber'
          ? 'Morocco'
          : selectedTribe === 'Zulu' || selectedTribe === 'Xhosa'
            ? 'South Africa'
            : selectedTribe === 'Amhara' || selectedTribe === 'Oromo'
              ? 'Ethiopia'
              : 'Nigeria'

      if (selectedTribe) {
        factCardSystem.unlockForTribe(selectedTribe)
        languageLessonSystem.unlockForTribe(selectedTribe)
        timelineSystem.unlockForTribe(selectedTribe)
        recipeBookSystem.unlockForTribe(selectedTribe)
        elderStorySystem.unlockForTribe(selectedTribe)
      }

    setTitle(`${regionTitle} - ${activeTribe}`, 'Festival of Unity: cultural preparation.')
    setHint(isTouchDevice ? 'Use on-screen controls to move. Tap E to interact.' : 'WASD to move. Click to look around, press E to interact.')
    updateMissionUI()
    setTutorial(isTouchDevice ? 'Use the on-screen controls to move and tap E to interact.' : 'WASD to move. Press E or use the action button near key spots.')
    setRecapVisible(false)
  }

  if (state === 'festival') {
    scene.activeCamera = walkCamera
    walkCamera.attachControl(canvas, true)
    uiManager.get('uiCrosshair').classList.remove('hidden')
    uiManager.get('uiChoices').classList.add('hidden')
    
    // Track festival achievement
    achievementSystem.unlock('unity-champion')
    
    setTitle(`Festival of Unity - ${activeTribe}`, 'Celebration begins as the sun sets.')
    setObjective('Enjoy the festival and explore the village.')
    setHint('Nigeria is home to hundreds of cultures. This is only the beginning.')
    setAction('Return to Hub', () => setState('hub'))
    setTutorial('Celebrate the festival, then return to the hub when ready.')
    showRecap(activeTribe)
  }

  updateAmbientForState()
}

function updateMissionUI() {
  if (state !== 'village') return
  const activeTribe = getActiveTribe()
  const activeLGA = selectedLGA ?? 'Owerri'

  if (activeTribe === 'Igbo') {
    if (activeLGA === 'Owerri') {
      // Owerri: Original yam and kola collection mission
      if (igboMission.cookingStage > 0 && !igboMission.cookingDone) {
        return
      }

      if (!igboMission.cookingDone) {
        const progress = `Yams ${igboMission.yamsCollected}/${igboMission.yamsNeeded} · Kola ${igboMission.kolaCollected}/${igboMission.kolaNeeded}`
        setObjective('Collect yams and kola nuts for the New Yam Festival.', progress)
        return
      }

      if (!igboMission.delivered) {
        setObjective('Deliver the prepared dishes to the elders.', 'Find the elders near the village circle.')
        return
      }

      setObjective('The festival is ready!', 'Celebrate and explore the village.')
      return
    }

    if (activeLGA === 'Arochukwu') {
      // Arochukwu: Story stones puzzle
      if (arochukwuMission.stonePuzzleDone) {
        setObjective('The mysteries are unlocked!', 'Visit the Oracle shrine to honor the pillars of unity.')
        return
      }

      if (arochukwuMission.stonesFound > 0) {
        updateArochukwuHighlight()
        const progress = `Symbols found ${arochukwuMission.stonesFound}/${arochukwuMission.stonesNeeded}`
        setObjective('Complete the ancient stone puzzle.', progress)
        return
      }

      updateArochukwuHighlight()
      setObjective('Seek the wisdom of Arochukwu.', 'Look for the labels above the stones and tap: Oracle → Pilgrimage → Unity.')
      return
    }

    if (activeLGA === 'Onitsha') {
      // Onitsha: River trade and indigo weaving
      if (igboMission.fabricWoven >= igboMission.fabricNeeded) {
        setObjective('The indigo trade is complete!', 'Celebrate the successful commerce and craftsmanship.')
        return
      }

      const progress = `Indigo cloths collected ${igboMission.fabricWoven}/${igboMission.fabricNeeded}`
      setObjective('Collect indigo cloths from the river traders.', progress)
      return
    }
  }

  // Yoruba and Hausa remain unchanged
  if (activeTribe === 'Yoruba') {
    if (!yorubaMission.rhythmDone) {
      if (yorubaMission.sticksCollected < yorubaMission.sticksNeeded) {
        const progress = `Sticks ${yorubaMission.sticksCollected}/${yorubaMission.sticksNeeded}`
        setObjective('Collect drum sticks for the Talking Drum.', progress)
        return
      }

      setObjective('Bring the sticks to the drum circle.', 'Start the rhythm mini-game at the drum.')
      return
    }

    setObjective('The rhythm is ready!', 'Join the festival celebration.')
    return
  }

  if (activeTribe === 'Hausa') {
    if (!hausaMission.arranged) {
      const progress = `Fabric ${hausaMission.fabricCollected}/${hausaMission.fabricNeeded} · Flags ${hausaMission.flagsCollected}/${hausaMission.flagsNeeded}`
      if (hausaMission.fabricCollected < hausaMission.fabricNeeded || hausaMission.flagsCollected < hausaMission.flagsNeeded) {
        setObjective('Collect fabric and flags for the Durbar parade.', progress)
        return
      }

      setObjective('Arrange the parade flags.', 'Visit the parade marker to finalize the setup.')
      return
    }

    setObjective('The Durbar parade is ready!', 'Celebrate and explore the village.')
  }

  if (activeTribe === 'Maasai') {
    const beadProgress = `Red ${maasaiMission.beadsRed}/3 · Green ${maasaiMission.beadsGreen}/3 · Blue ${maasaiMission.beadsBlue}/3`
    
    if (maasaiMission.beadsRed < 3 || maasaiMission.beadsGreen < 3 || maasaiMission.beadsBlue < 3) {
      setObjective('Collect red, green, and blue beads for the warrior ceremony.', beadProgress)
      return
    }

    if (!maasaiMission.ceremonyDone) {
      setObjective('The beads are gathered!', 'Visit the fire circle to perform the warrior dance.')
      return
    }

    setObjective('The ceremony is complete!', 'The warrior initiation has been honored.')
  }

  if (activeTribe === 'Egyptian') {
    const artifactProgress = `Chalices ${egyptianMission.chalicesCollected}/3 · Scarabs ${egyptianMission.scarabsCollected}/3 · Tablets ${egyptianMission.tabletsCollected}/3`
    
    if (egyptianMission.chalicesCollected < 3 || egyptianMission.scarabsCollected < 3 || egyptianMission.tabletsCollected < 3) {
      setObjective('Gather ancient artifacts: golden chalices, sacred scarabs, and wisdom tablets.', artifactProgress)
      return
    }

    if (!egyptianMission.celestialDone) {
      setObjective('The treasures are collected!', 'Align the celestial stones to unlock the pyramid\'s secrets.')
      return
    }

    setObjective('The pyramid\'s mysteries are revealed!', 'The wisdom of the ancient pharaohs is yours.')
  }

  if (activeTribe === 'Berber') {
    const woolProgress = `Red ${berberMission.woolRed}/2 · Blue ${berberMission.woolBlue}/2 · Yellow ${berberMission.woolYellow}/2`
    const hennaProgress = `Henna ${berberMission.hennaCollected}/4`
    const mintProgress = `Mint ${berberMission.mintCollected}/3`
    const spiceProgress = `Spices ${berberMission.spicesCollected}/5`
    
    if (berberMission.woolRed < 2 || berberMission.woolBlue < 2 || berberMission.woolYellow < 2) {
      setObjective('Gather colored wool threads for the Berber carpet.', woolProgress)
      return
    }

    if (!berberMission.carpetWoven) {
      setObjective('All wool collected!', 'Visit the weaving loom near the fountain to craft the carpet.')
      return
    }

    if (berberMission.hennaCollected < 4) {
      setObjective('Collect henna bottles for the traditional body art.', hennaProgress)
      return
    }

    if (!berberMission.hennaArtDone) {
      setObjective('All henna collected!', 'Visit the henna artist to create the art.')
      return
    }

    if (berberMission.mintCollected < 3) {
      setObjective('Gather fresh mint leaves for the traditional tea ceremony.', mintProgress)
      return
    }

    if (!berberMission.teaCeremonyDone) {
      setObjective('All mint collected!', 'Visit the tea preparation area near the fountain.')
      return
    }

    if (berberMission.spicesCollected < 5) {
      setObjective('Collect five spices for the authentic tagine cooking.', spiceProgress)
      return
    }

    if (!berberMission.tagineCookingDone) {
      setObjective('All spices gathered!', 'Visit the cooking fire to prepare the tagine.')
      return
    }

    setObjective('The Berber traditions are complete!', 'All four missions honored.')
  }

  if (activeTribe === 'Zulu') {
    const zuluMission = missionManager.zulu
    const cowhideProgress = `Cowhide ${zuluMission.cowhideCollected}/${zuluMission.cowhideNeeded}`
    const woodProgress = `Wood ${zuluMission.woodCollected}/${zuluMission.woodNeeded}`
    const spearProgress = `Spears ${zuluMission.spearsCollected}/${zuluMission.spearsNeeded}`
    const cattleProgress = `Cattle ${zuluMission.cattleHerded}/${zuluMission.cattleNeeded}`

    if (zuluMission.cowhideCollected < zuluMission.cowhideNeeded || zuluMission.woodCollected < zuluMission.woodNeeded) {
      const resourceProgress = `${cowhideProgress} · ${woodProgress}`
      setObjective('Gather materials for the warrior shield.', resourceProgress)
      return
    }

    if (!zuluMission.shieldCrafted) {
      setObjective('Materials ready!', 'Visit the shield crafting station to forge your warrior shield.')
      return
    }

    if (zuluMission.spearsCollected < zuluMission.spearsNeeded) {
      setObjective('Collect training spears for warrior preparation.', spearProgress)
      return
    }

    if (!zuluMission.spearTrainingDone) {
      setObjective('Spears gathered!', 'Complete the spear throwing training at the training ground.')
      return
    }

    if (zuluMission.cattleHerded < zuluMission.cattleNeeded) {
      setObjective('Herd cattle to demonstrate pastoral skills.', cattleProgress)
      return
    }

    if (!zuluMission.herdingDone) {
      setObjective('Cattle duties complete!', 'Approach the kraal to complete the herding task.')
      return
    }

    if (!zuluMission.ceremonyPreparationDone) {
      setObjective('Prepare for the Umemulo ceremony.', 'Visit the ceremony area to begin preparations.')
      return
    }

    if (!zuluMission.umemuloDone) {
      setObjective('Ceremony preparations ready!', 'Complete the Umemulo coming-of-age ceremony.')
      return
    }

    setObjective('Zulu warrior traditions honored!', 'All missions complete.')
  }

  if (activeTribe === 'Xhosa') {
    const xhosaMission = missionManager.xhosa
    const beadProgress = `White ${xhosaMission.beadsWhite}/${xhosaMission.beadsNeeded} · Red ${xhosaMission.beadsRed}/${xhosaMission.beadsNeeded} · Black ${xhosaMission.beadsBlack}/${xhosaMission.beadsNeeded}`
    const ochreProgress = `Ochre ${xhosaMission.ochreCollected}/${xhosaMission.ochreNeeded}`
    const ritualProgress = `Items ${xhosaMission.ritualItemsCollected}/${xhosaMission.ritualItemsNeeded}`

    if (xhosaMission.beadsWhite < xhosaMission.beadsNeeded || xhosaMission.beadsRed < xhosaMission.beadsNeeded || xhosaMission.beadsBlack < xhosaMission.beadsNeeded) {
      setObjective('Gather beads for traditional Xhosa beadwork.', beadProgress)
      return
    }

    if (!xhosaMission.beadworkDone) {
      setObjective('Beads collected!', 'Visit the beadwork station to create traditional patterns.')
      return
    }

    if (xhosaMission.ochreCollected < xhosaMission.ochreNeeded) {
      setObjective('Collect ochre for ceremonial body painting.', ochreProgress)
      return
    }

    if (!xhosaMission.bodyPaintingDone) {
      setObjective('Ochre gathered!', 'Visit the painting area to apply traditional body art.')
      return
    }

    if (xhosaMission.stickFightingSteps < 3) {
      const fightingProgress = `Steps ${xhosaMission.stickFightingSteps}/3`
      setObjective('Learn traditional stick fighting techniques.', fightingProgress)
      return
    }

    if (!xhosaMission.stickFightingDone) {
      setObjective('Fighting skills learned!', 'Complete the stick fighting demonstration.')
      return
    }

    if (xhosaMission.ritualItemsCollected < xhosaMission.ritualItemsNeeded) {
      setObjective('Gather items for the ancestral offering.', ritualProgress)
      return
    }

    if (!xhosaMission.ancestralOfferingDone) {
      setObjective('Ritual items ready!', 'Visit the ancestral altar to complete the offering.')
      return
    }

    setObjective('Xhosa traditions honored!', 'All missions complete.')
  }

  if (activeTribe === 'Amhara') {
    const coffeeProgress = `Coffee beans ${amharaMission.coffeeBeansCollected}/${amharaMission.coffeeBeansNeeded}`
    const teffProgress = `Teff grain ${amharaMission.teffCollected}/${amharaMission.teffNeeded}`
    const crossProgress = `Crosses ${amharaMission.crossesCarved}/${amharaMission.crossesNeeded}`
    const manuscriptProgress = `Manuscripts ${amharaMission.manuscriptsOrganized}/${amharaMission.manuscriptsNeeded}`

    if (amharaMission.coffeeBeansCollected < amharaMission.coffeeBeansNeeded) {
      setObjective('Collect coffee beans for the buna ceremony.', coffeeProgress)
      return
    }

    if (!amharaMission.coffeeCeremonyDone) {
      setObjective('Coffee gathered!', 'Visit the ceremony hut to roast and prepare buna.')
      return
    }

    if (amharaMission.teffCollected < amharaMission.teffNeeded) {
      setObjective('Gather teff grain for injera baking.', teffProgress)
      return
    }

    if (!amharaMission.injeraDone) {
      setObjective('Teff ready!', 'Prepare injera at the baking station.')
      return
    }

    if (amharaMission.crossesCarved < amharaMission.crossesNeeded) {
      setObjective('Collect sacred cross pieces for carving.', crossProgress)
      return
    }

    if (!amharaMission.crossCarvingDone) {
      setObjective('Cross pieces ready!', 'Carve Orthodox crosses near the church courtyard.')
      return
    }

    if (amharaMission.manuscriptsOrganized < amharaMission.manuscriptsNeeded) {
      setObjective('Collect manuscripts for preservation.', manuscriptProgress)
      return
    }

    if (!amharaMission.manuscriptDone) {
      setObjective('Manuscripts gathered!', 'Organize the texts at the preservation table.')
      return
    }

    setObjective('Amhara traditions honored!', 'All missions complete.')
  }

  if (activeTribe === 'Oromo') {
    const irreechaProgress = `Offerings ${oromoMission.irreechaOfferingsCollected}/${oromoMission.irreechaOfferingsNeeded}`
    const butterProgress = `Ingredients ${oromoMission.butterCoffeeIngredientsCollected}/${oromoMission.butterCoffeeIngredientsNeeded}`
    const sycamoreProgress = `Ritual items ${oromoMission.sycamoreRitualItemsCollected}/${oromoMission.sycamoreRitualItemsNeeded}`

    if (!oromoMission.councilParticipationDone) {
      setObjective('Join the Gada council under the Oda tree.', 'Approach the council circle to participate.')
      return
    }

    if (oromoMission.irreechaOfferingsCollected < oromoMission.irreechaOfferingsNeeded) {
      setObjective('Collect Irreecha thanksgiving offerings.', irreechaProgress)
      return
    }

    if (!oromoMission.irreechaDone) {
      setObjective('Offerings ready!', 'Perform the Irreecha ritual at the gathering circle.')
      return
    }

    if (oromoMission.butterCoffeeIngredientsCollected < oromoMission.butterCoffeeIngredientsNeeded) {
      setObjective('Collect ingredients for buna qalaa (butter coffee).', butterProgress)
      return
    }

    if (!oromoMission.butterCoffeeDone) {
      setObjective('Ingredients gathered!', 'Prepare the butter coffee at the ceremony station.')
      return
    }

    if (oromoMission.sycamoreRitualItemsCollected < oromoMission.sycamoreRitualItemsNeeded) {
      setObjective('Gather ritual items for the sacred Oda tree.', sycamoreProgress)
      return
    }

    if (!oromoMission.sycamoreRitualDone) {
      setObjective('Ritual items ready!', 'Complete the sycamore tree honoring ritual.')
      return
    }

    setObjective('Oromo traditions honored!', 'All missions complete.')
  }

  if (activeTribe === 'Indian') {
    const spiceProgress = `Spices ${indianMission.spicesCollected}/${indianMission.spicesNeeded}`
    const mantraProgress = `Mantras ${indianMission.mantrasChanted}/${indianMission.mantrasNeeded}`

    if (indianMission.spicesCollected < indianMission.spicesNeeded) {
      setObjective('Collect spices from the village market path.', spiceProgress)
      return
    }

    if (!indianMission.spiceMixingDone) {
      setObjective('Spices gathered!', 'Visit the rangoli circle to prepare a festival masala blend.')
      return
    }

    if (!indianMission.talaMeasuresDone) {
      setObjective('Practice tala rhythm patterns.', 'Visit the musician circle to complete rhythm training.')
      return
    }

    if (indianMission.mantrasChanted < indianMission.mantrasNeeded) {
      setObjective('Collect mantra scroll fragments near the shrine path.', mantraProgress)
      return
    }

    if (!indianMission.mantraDone) {
      setObjective('Scrolls gathered!', 'Return to the shrine to complete mantra recitation.')
      return
    }

    if (!indianMission.tajMahalContemplationDone) {
      setObjective('Complete your reflection ritual.', 'Approach the marble courtyard to honor memory and unity.')
      return
    }

    setObjective('Indian traditions honored!', 'All missions complete.')
  }

  if (activeTribe === 'Chinese') {
    const silkProgress = `Silk ${chineseMission.silkSpoolsCollected}/${chineseMission.silkSpoolsNeeded}`
    const woodblockProgress = `Woodblocks ${chineseMission.woodBlocksCarved}/${chineseMission.woodBlocksNeeded}`
    const scrollProgress = `Scrolls ${chineseMission.paintedScrollsCollected}/${chineseMission.paintedScrollsNeeded}`

    if (chineseMission.silkSpoolsCollected < chineseMission.silkSpoolsNeeded) {
      setObjective('Collect silk spools from artisan stations.', silkProgress)
      return
    }

    if (!chineseMission.silkDyedDone) {
      setObjective('Silk gathered!', 'Visit the dye basin to complete silk dyeing.')
      return
    }

    if (chineseMission.woodBlocksCarved < chineseMission.woodBlocksNeeded) {
      setObjective('Gather carving woodblocks for printing.', woodblockProgress)
      return
    }

    if (!chineseMission.woodblockPrintingDone) {
      setObjective('Woodblocks ready!', 'Visit the print table to perform woodblock printing.')
      return
    }

    if (chineseMission.paintedScrollsCollected < chineseMission.paintedScrollsNeeded) {
      setObjective('Collect painted scroll materials.', scrollProgress)
      return
    }

    if (!chineseMission.artworkCompleteDone) {
      setObjective('Materials gathered!', 'Complete the scroll artwork near the wall marker.')
      return
    }

    setObjective('Chinese traditions honored!', 'All missions complete.')
  }

  if (activeTribe === 'Japanese') {
    const teaProgress = `Tea leaves ${japaneseMission.teaLeavesGathered}/${japaneseMission.teaLeavesNeeded}`
    const bonsaiProgress = `Bonsai ${japaneseMission.bonsaiTrimmed}/${japaneseMission.bonsaiNeeded}`
    const calligraphyProgress = `Characters ${japaneseMission.calligraphyCharactersWritten}/${japaneseMission.calligraphyNeeded}`
    const templeProgress = `Temple seals ${japaneseMission.templesVisited}/${japaneseMission.templesNeeded}`

    if (japaneseMission.teaLeavesGathered < japaneseMission.teaLeavesNeeded) {
      setObjective('Collect tea leaves for chanoyu.', teaProgress)
      return
    }

    if (!japaneseMission.teaCeremonyDone) {
      setObjective('Tea leaves gathered!', 'Visit the tea circle to perform the ceremony.')
      return
    }

    if (japaneseMission.bonsaiTrimmed < japaneseMission.bonsaiNeeded) {
      setObjective('Gather bonsai tools and branches.', bonsaiProgress)
      return
    }

    if (!japaneseMission.bonsaiPruningDone) {
      setObjective('Bonsai materials ready!', 'Prune bonsai at the garden station.')
      return
    }

    if (japaneseMission.calligraphyCharactersWritten < japaneseMission.calligraphyNeeded) {
      setObjective('Collect calligraphy brush marks.', calligraphyProgress)
      return
    }

    if (!japaneseMission.calligraphyArtDone) {
      setObjective('Brush marks gathered!', 'Complete calligraphy at the writing table.')
      return
    }

    if (japaneseMission.templesVisited < japaneseMission.templesNeeded) {
      setObjective('Gather temple seals during pilgrimage.', templeProgress)
      return
    }

    if (!japaneseMission.templePilgrimageDone) {
      setObjective('Temple seals complete!', 'Finish pilgrimage at the torii gate.')
      return
    }

    setObjective('Japanese traditions honored!', 'All missions complete.')
  }
}

uiManager.get('uiChoices').querySelectorAll<HTMLButtonElement>('.choice').forEach((button) => {
  button.addEventListener('click', () => {
    const tribe = button.dataset.tribe as Tribe
    selectedTribe = tribe
    resetTribeMission(tribe)
    setState('village')
    walkCamera.position = new Vector3(0, 2, -18)
  })
})

scene.onPointerObservable.add((pointerInfo) => {
  if (pointerInfo.type !== PointerEventTypes.POINTERPICK) return
  const pickedMesh = pointerInfo.pickInfo?.pickedMesh as Mesh | null
  if (!pickedMesh) return

  const metadata = pickedMesh.metadata as { onPick?: () => void; symbol?: string } | undefined
  if (metadata?.onPick) {
    metadata.onPick()
    return
  }

  if (state === 'hub' && pickedMesh === globe && pointerInfo.pickInfo?.pickedPoint) {
    focusArcOnWorldPoint(pointerInfo.pickInfo.pickedPoint, 7.4)
    return
  }

  if (state === 'village') {
    const activeTribe = getActiveTribe()
    const activeLGA = selectedLGA ?? 'Owerri'

    if (activeTribe === 'Igbo') {
      if (activeLGA === 'Owerri') {
        // Owerri: Yams, Kola, Story stones
        if (yamMeshes.includes(pickedMesh)) {
          pickedMesh.dispose()
          igboMission.yamsCollected += 1
          achievementSystem.checkCollectibleCount(missionManager.getTotalCollectibles())
          updateMissionUI()
          showToast('Yam collected')
          playTone(520, 0.12, 'triangle', 0.05)
          
          if (igboMission.yamsCollected === 1) {
            showCulturalPopup(
              'New Yam Festival',
              'Igbo Tradition',
              'The New Yam Festival marks the annual harvest season when yams—a staple crop—are first eaten ceremonially. Families gather to give thanks for abundance and to honor their ancestors. This tradition reinforces community bonds and celebrates agricultural success.'
            )
          }
          
          if (igboMission.yamsCollected >= igboMission.yamsNeeded && igboMission.kolaCollected >= igboMission.kolaNeeded) {
            showToast('All ingredients collected')
            playTone(740, 0.18, 'triangle', 0.05)
          }
        }

        if (kolaMeshes.includes(pickedMesh)) {
          pickedMesh.dispose()
          igboMission.kolaCollected += 1
          achievementSystem.checkCollectibleCount(missionManager.getTotalCollectibles())
          updateMissionUI()
          showToast('Kola nut collected')
          playTone(560, 0.12, 'triangle', 0.05)
          
          if (igboMission.kolaCollected === 1) {
            showCulturalPopup(
              'Kola Nut Ceremony',
              'Igbo Tradition',
              'Kola nuts hold deep spiritual significance in Igbo culture. Offering kola is a symbol of welcome, respect, and hospitality. Breaking and sharing kola nuts opens conversations and seals agreements. During festivals, kola is presented to elders and guests as a sign of honor.'
            )
          }
          
          if (igboMission.yamsCollected >= igboMission.yamsNeeded && igboMission.kolaCollected >= igboMission.kolaNeeded) {
            showToast('All ingredients collected')
            playTone(740, 0.18, 'triangle', 0.05)
          }
        }
      }

      if (activeLGA === 'Arochukwu') {
        // Arochukwu: Story stones
        if (arochukwuStones.includes(pickedMesh) && !arochukwuMission.stonePuzzleDone) {
          const symbol = metadata?.symbol
          const expected = arochukwuSymbols[arochukwuMission.stonesFound]
          if (symbol && symbol === expected) {
            arochukwuMission.stonesFound += 1
            showToast(`Story symbol: ${symbol}`)
            playTone(620, 0.12, 'sine', 0.05)
            updateArochukwuHighlight()
            
            if (arochukwuMission.stonesFound === 2) {
              showCulturalPopup(
                'Sacred Pilgrimage',
                'Arochukwu Mysteries',
                'Arochukwu was a powerful spiritual center where pilgrims journeyed to seek wisdom and blessing. The Ibini Ukpabi (the oracle) was consulted for guidance during difficult times. Pilgrims traveled from distant lands to participate in sacred rituals and receive divine counsel.'
              )
            }
            
            if (arochukwuMission.stonesFound >= arochukwuSymbols.length) {
              arochukwuMission.stonePuzzleDone = true
              achievementSystem.unlock('oracle-wisdom')
              achievementSystem.checkMissionComplete('arochukwu-puzzle')
              setHint('Arochukwu stories speak of sacred pilgrimages and unity beyond borders.')
              showCulturalPopup(
                'Arochukwu Unity',
                'Ancient Wisdom',
                'The oracle at Arochukwu brought together diverse peoples in spiritual unity. Regardless of tribe or origin, all came to seek truth and justice. This tradition of seeking wisdom collectively shaped the cultural identity of the Igbo people.'
              )
              playTone(820, 0.2, 'sine', 0.06)
              updateMissionUI()
            }
          } else {
            arochukwuMission.stonesFound = 0
            setHint('Tap the stones: Oracle → Pilgrimage → Unity.')
            showToast('The sequence resets. Start with Oracle.')
            playTone(220, 0.12, 'sine', 0.04)
            updateArochukwuHighlight()
            updateMissionUI()
          }
        }
      }

      if (activeLGA === 'Onitsha') {
        // Onitsha: Indigo cloths
        if (indigoMeshes.includes(pickedMesh)) {
          pickedMesh.dispose()
          igboMission.fabricWoven += 1
          updateMissionUI()
          showToast('Indigo cloth collected')
          playTone(480, 0.12, 'triangle', 0.05)
          
          if (igboMission.fabricWoven === 1) {
            showCulturalPopup(
              'Indigo Trade',
              'Onitsha Commerce',
              'Onitsha sits on the Niger River, making it a major trading hub for centuries. Indigo-dyed cloth was a premium trade good, highly valued for its rich color and cultural significance. Weavers and traders transformed Onitsha into a center of commerce connecting inland communities with river traders.'
            )
          }
          
          if (igboMission.fabricWoven >= igboMission.fabricNeeded) {
            showToast('All trade goods collected!')
            playTone(740, 0.18, 'triangle', 0.05)
          }
        }
      }
    }

    if (activeTribe === 'Yoruba') {
      if (stickMeshes.includes(pickedMesh)) {
        pickedMesh.dispose()
        yorubaMission.sticksCollected += 1
        updateMissionUI()
        showToast('Drum stick collected')
        playTone(640, 0.12, 'triangle', 0.05)
        
        if (yorubaMission.sticksCollected === 1) {
          showCulturalPopup(
            'Talking Drum',
            'Yoruba Tradition',
            'The talking drum (dundun) is central to Yoruba communication and culture. Skilled drummers use tonal variations to "speak" messages across distances. Instead of words, the drum conveys meaning through rhythm and pitch, making it a sophisticated language of its own.'
          )
        }
      }
    }

    if (activeTribe === 'Hausa') {
      if (fabricMeshes.includes(pickedMesh)) {
        pickedMesh.dispose()
        hausaMission.fabricCollected += 1
        updateMissionUI()
        showToast('Fabric collected')
        playTone(480, 0.12, 'triangle', 0.05)
        
        if (hausaMission.fabricCollected === 1) {
          showCulturalPopup(
            'Adire & Durbar',
            'Hausa Tradition',
            'The Durbar Festival is a grand procession celebrating Hausa leadership, heritage, and community pride. Horses are adorned with richly colored fabrics, and participants wear traditional indigo and embroidered garments. The festival honors the Emir and brings the entire community together in celebration.'
          )
        }
      }

      if (flagMeshes.includes(pickedMesh)) {
        pickedMesh.dispose()
        hausaMission.flagsCollected += 1
        updateMissionUI()
        showToast('Flag collected')
        playTone(500, 0.12, 'triangle', 0.05)
      }
    }

    if (activeTribe === 'Maasai') {
      if (beadRedMeshes.includes(pickedMesh)) {
        pickedMesh.dispose()
        maasaiMission.beadsRed += 1
        updateMissionUI()
        showToast('Red bead collected')
        playTone(520, 0.12, 'triangle', 0.05)
        
        if (maasaiMission.beadsRed === 1) {
          showCulturalPopup(
            'Maasai Beadwork',
            'Maasai Tradition',
            'Beadwork is integral to Maasai identity and storytelling. Each bead color carries deep meaning: red represents bravery and strength, green symbolizes land and growth, and blue represents energy and sky. Warriors wear beaded ornaments to display their status, achievements, and cultural heritage.'
          )
        }
      }

      if (beadGreenMeshes.includes(pickedMesh)) {
        pickedMesh.dispose()
        maasaiMission.beadsGreen += 1
        updateMissionUI()
        showToast('Green bead collected')
        playTone(540, 0.12, 'triangle', 0.05)
      }

      if (beadBlueMeshes.includes(pickedMesh)) {
        pickedMesh.dispose()
        maasaiMission.beadsBlue += 1
        updateMissionUI()
        showToast('Blue bead collected')
        playTone(560, 0.12, 'triangle', 0.05)
      }
    }

    if (activeTribe === 'Egyptian') {
      if (chaliceMeshes.includes(pickedMesh)) {
        pickedMesh.dispose()
        egyptianMission.chalicesCollected += 1
        updateMissionUI()
        showToast('Golden chalice found!')
        playTone(880, 0.15, 'sine', 0.06)
        
        if (egyptianMission.chalicesCollected === 1) {
          showCulturalPopup(
            'Sacred Vessels',
            'Ancient Egypt',
            'Golden chalices were used in sacred rituals and ceremonies honoring the gods. Pharaohs believed these vessels held divine power and used them to offer libations (drink offerings) to the deities. The craftsmanship of Egyptian goldsmiths was legendary throughout the ancient world.'
          )
        }
      }

      if (scarabMeshes.includes(pickedMesh)) {
        pickedMesh.dispose()
        egyptianMission.scarabsCollected += 1
        updateMissionUI()
        showToast('Sacred scarab revealed')
        playTone(660, 0.15, 'sine', 0.06)
        
        if (egyptianMission.scarabsCollected === 1) {
          showCulturalPopup(
            'Scarab of Transformation',
            'Ancient Egypt',
            'The scarab beetle symbolized rebirth and transformation in Egyptian mythology. Egyptians carved scarabs from stone and semi-precious gems, wearing them as amulets for protection. The scarab\'s journey rolling the sun across the sky represented the eternal cycle of regeneration and divine power.'
          )
        }
      }

      if (tabletMeshes.includes(pickedMesh)) {
        pickedMesh.dispose()
        egyptianMission.tabletsCollected += 1
        updateMissionUI()
        showToast('Ancient tablet discovered')
        playTone(740, 0.15, 'sine', 0.06)
        
        if (egyptianMission.tabletsCollected === 1) {
          showCulturalPopup(
            'Wisdom of the Pyramids',
            'Ancient Egypt',
            'Stone tablets recorded the names, titles, and deeds of pharaohs and the spells meant to protect them in the afterlife. These inscriptions, carved with meticulous precision, preserved the knowledge and spiritual understanding of ancient Egypt for eternity. Each symbol carried layers of meaning rooted in divine law and cosmic harmony.'
          )
        }
      }
    }

    if (activeTribe === 'Berber') {
      if (woolRedMeshes.includes(pickedMesh)) {
        pickedMesh.dispose()
        berberMission.woolRed += 1
        updateMissionUI()
        showToast('Red wool collected')
        culturalAudio.playInteractionSound(520, 0.12)
        
        if (berberMission.woolRed === 1) {
          showCulturalPopup(
            'Berber Carpet Weaving',
            'Moroccan Tradition',
            'Berber carpets are renowned for their vibrant colors and geometric patterns, each design telling a story and representing tribal identity. Women pass down weaving techniques through generations, using natural dyes from plants and minerals. These textiles are both functional art and cultural heritage.'
          )
        }
      }

      if (woolBlueMeshes.includes(pickedMesh)) {
        pickedMesh.dispose()
        berberMission.woolBlue += 1
        updateMissionUI()
        showToast('Blue wool collected')
        culturalAudio.playInteractionSound(560, 0.12)
      }

      if (woolYellowMeshes.includes(pickedMesh)) {
        pickedMesh.dispose()
        berberMission.woolYellow += 1
        updateMissionUI()
        showToast('Yellow wool collected')
        culturalAudio.playInteractionSound(600, 0.12)
      }

      if (hennaMeshes.includes(pickedMesh)) {
        pickedMesh.dispose()
        berberMission.hennaCollected += 1
        updateMissionUI()
        showToast('Henna bottle found')
        culturalAudio.playInteractionSound(660, 0.12)
        
        if (berberMission.hennaCollected === 1) {
          showCulturalPopup(
            'Henna Art Tradition',
            'Moroccan Culture',
            'Henna body art is an ancient tradition in Morocco, used for celebrations, weddings, and special occasions. The intricate patterns symbolize joy, beauty, and blessings. Artists apply natural henna paste that stains the skin with warm brown tones lasting several weeks.'
          )
        }
      }

      if (mintMeshes.includes(pickedMesh)) {
        pickedMesh.dispose()
        berberMission.mintCollected += 1
        updateMissionUI()
        showToast('Fresh mint collected')
        culturalAudio.playInteractionSound(700, 0.12)
        
        if (berberMission.mintCollected === 1) {
          showCulturalPopup(
            'Moroccan Mint Tea',
            'Berber Hospitality',
            'Moroccan mint tea is a symbol of hospitality and friendship. Prepared with green tea, fresh mint, and sugar, it is poured from a height to create a frothy top. The three pours represent life phases: the first is bitter like life, the second sweet like love, the third gentle like death.'
          )
        }
      }

      if (spiceMeshes.includes(pickedMesh)) {
        pickedMesh.dispose()
        berberMission.spicesCollected += 1
        updateMissionUI()
        showToast('Spice collected')
        culturalAudio.playInteractionSound(740, 0.12)
        
        if (berberMission.spicesCollected === 1) {
          showCulturalPopup(
            'Tagine Cooking',
            'Moroccan Cuisine',
            'The tagine is a traditional clay cooking vessel that shapes Moroccan cuisine. Slow-cooked stews blend aromatic spices like cumin, saffron, cinnamon, and coriander with meat, vegetables, and dried fruits. The conical lid returns condensed moisture, creating tender, flavorful dishes.'
          )
        }
      }
    }

    if (activeTribe === 'Zulu') {
      const zuluMission = missionManager.zulu

      if (cowhideMeshes.includes(pickedMesh)) {
        pickedMesh.dispose()
        zuluMission.cowhideCollected += 1
        updateMissionUI()
        showToast('Cowhide collected')
        culturalAudio.playInteractionSound(480, 0.12)

        if (zuluMission.cowhideCollected === 1) {
          showCulturalPopup(
            'Zulu Shield Crafting',
            'Warrior Tradition',
            'The Zulu war shield (isihlangu) is crafted from cowhide stretched over a wooden frame. Warriors decorate their shields with distinctive patterns representing their regiment. The shield serves both as protection in battle and as a symbol of warrior identity and honor.'
          )
        }
      }

      if (woodMeshes.includes(pickedMesh)) {
        pickedMesh.dispose()
        zuluMission.woodCollected += 1
        updateMissionUI()
        showToast('Wood collected')
        culturalAudio.playInteractionSound(520, 0.12)
      }

      if (spearMeshes.includes(pickedMesh)) {
        pickedMesh.dispose()
        zuluMission.spearsCollected += 1
        updateMissionUI()
        showToast('Training spear collected')
        culturalAudio.playInteractionSound(560, 0.12)

        if (zuluMission.spearsCollected === 1) {
          showCulturalPopup(
            'Assegai Spear',
            'Zulu Warfare',
            'The assegai is the iconic Zulu short stabbing spear, revolutionized by King Shaka in the early 1800s. Unlike throwing spears, the assegai was designed for close combat with a short shaft and broad blade. Warriors trained extensively in spear techniques and the famous "bull horn" formation.'
          )
        }
      }
    }

    if (activeTribe === 'Xhosa') {
      const xhosaMission = missionManager.xhosa

      if (xhosaBeadWhiteMeshes.includes(pickedMesh)) {
        pickedMesh.dispose()
        xhosaMission.beadsWhite += 1
        updateMissionUI()
        showToast('White bead collected')
        culturalAudio.playInteractionSound(600, 0.12)

        if (xhosaMission.beadsWhite === 1) {
          showCulturalPopup(
            'Xhosa Beadwork',
            'Cultural Language',
            'Xhosa beadwork is a visual language where colors communicate specific meanings. White represents purity and spiritual energy, red embodies blood and sacrifice, black symbolizes marriage and spiritual maturity. Young women create intricate beadwork patterns that tell stories of identity, status, and relationships.'
          )
        }
      }

      if (xhosaBeadRedMeshes.includes(pickedMesh)) {
        pickedMesh.dispose()
        xhosaMission.beadsRed += 1
        updateMissionUI()
        showToast('Red bead collected')
        culturalAudio.playInteractionSound(640, 0.12)
      }

      if (xhosaBeadBlackMeshes.includes(pickedMesh)) {
        pickedMesh.dispose()
        xhosaMission.beadsBlack += 1
        updateMissionUI()
        showToast('Black bead collected')
        culturalAudio.playInteractionSound(680, 0.12)
      }

      if (ochreMeshes.includes(pickedMesh)) {
        pickedMesh.dispose()
        xhosaMission.ochreCollected += 1
        updateMissionUI()
        showToast('Ochre collected')
        culturalAudio.playInteractionSound(720, 0.12)

        if (xhosaMission.ochreCollected === 1) {
          showCulturalPopup(
            'Ochre Body Painting',
            'Xhosa Ritual',
            'Red ochre (imbola) is central to Xhosa culture and spiritual practice. Mixed with animal fat, the vibrant paste is applied to the skin during initiation ceremonies, marking transitions from childhood to adulthood. The color represents the earth, ancestors, and life force that connects all Xhosa people.'
          )
        }
      }

      if (ritualItemMeshes.includes(pickedMesh)) {
        pickedMesh.dispose()
        xhosaMission.ritualItemsCollected += 1
        updateMissionUI()
        showToast('Ritual item collected')
        culturalAudio.playInteractionSound(760, 0.12)

        if (xhosaMission.ritualItemsCollected === 1) {
          showCulturalPopup(
            'Ancestral Offering',
            'Xhosa Spirituality',
            'The Xhosa maintain deep spiritual connections with their ancestors (amadlozi) who guide and protect the living. Offerings at sacred sites honor these connections, seeking guidance, blessings, and healing. Rituals involve traditional items, prayers, and sometimes animal sacrifices to maintain harmony between worlds.'
          )
        }
      }
    }

    if (activeTribe === 'Amhara') {
      if (coffeeBeanMeshes.includes(pickedMesh)) {
        pickedMesh.dispose()
        amharaMission.coffeeBeansCollected += 1
        updateMissionUI()
        showToast('Coffee beans collected')
        culturalAudio.playInteractionSound(620, 0.12)

        if (amharaMission.coffeeBeansCollected === 1) {
          showCulturalPopup(
            'Ethiopian Coffee Ceremony',
            'Buna Tradition',
            'Ethiopia is considered the birthplace of coffee. The buna ceremony is a ritual of roasting, grinding, and brewing beans in three rounds that symbolize blessing and community. Sharing coffee is a sacred social bond that welcomes guests and honors kinship.'
          )
        }
      }

      if (teffMeshes.includes(pickedMesh)) {
        pickedMesh.dispose()
        amharaMission.teffCollected += 1
        updateMissionUI()
        showToast('Teff grain collected')
        culturalAudio.playInteractionSound(660, 0.12)
      }

      if (crossMeshes.includes(pickedMesh)) {
        pickedMesh.dispose()
        amharaMission.crossesCarved += 1
        updateMissionUI()
        showToast('Cross piece collected')
        culturalAudio.playInteractionSound(700, 0.12)
      }

      if (manuscriptMeshes.includes(pickedMesh)) {
        pickedMesh.dispose()
        amharaMission.manuscriptsOrganized += 1
        updateMissionUI()
        showToast('Manuscript recovered')
        culturalAudio.playInteractionSound(740, 0.12)
      }
    }

    if (activeTribe === 'Oromo') {
      if (irreechaOfferingMeshes.includes(pickedMesh)) {
        pickedMesh.dispose()
        oromoMission.irreechaOfferingsCollected += 1
        updateMissionUI()
        showToast('Irreecha offering collected')
        culturalAudio.playInteractionSound(640, 0.12)

        if (oromoMission.irreechaOfferingsCollected === 1) {
          showCulturalPopup(
            'Irreecha Festival',
            'Oromo Thanksgiving',
            'Irreecha is a major Oromo thanksgiving festival honoring Waaqa (God) and nature for life, rain, and harvest. Participants gather with grasses and flowers near water to give thanks and pray for peace, unity, and prosperity.'
          )
        }
      }

      if (butterCoffeeMeshes.includes(pickedMesh)) {
        pickedMesh.dispose()
        oromoMission.butterCoffeeIngredientsCollected += 1
        updateMissionUI()
        showToast('Butter coffee ingredient found')
        culturalAudio.playInteractionSound(680, 0.12)
      }

      if (sycamoreRitualMeshes.includes(pickedMesh)) {
        pickedMesh.dispose()
        oromoMission.sycamoreRitualItemsCollected += 1
        updateMissionUI()
        showToast('Sycamore ritual item collected')
        culturalAudio.playInteractionSound(720, 0.12)
      }
    }

    if (activeTribe === 'Indian') {
      if (indianSpiceMeshes.includes(pickedMesh)) {
        pickedMesh.dispose()
        indianMission.spicesCollected += 1
        updateMissionUI()
        showToast('Spice collected')
        culturalAudio.playInteractionSound(650, 0.12)

        if (indianMission.spicesCollected === 1) {
          showCulturalPopup(
            'Indian Spice Traditions',
            'Culinary Heritage',
            'Spice blending has shaped Indian cuisine, medicine, and global trade for centuries. Regional masalas combine aroma, heat, and healing properties to create layered flavors and communal identity.'
          )
        }
      }

      if (indianMantraMeshes.includes(pickedMesh)) {
        pickedMesh.dispose()
        indianMission.mantrasChanted += 1
        updateMissionUI()
        showToast('Mantra fragment collected')
        culturalAudio.playInteractionSound(700, 0.12)

        if (indianMission.mantrasChanted === 1) {
          factCardSystem.unlock('indian-mantra-practice')
        }
      }
    }

    if (activeTribe === 'Chinese') {
      if (chineseSilkMeshes.includes(pickedMesh)) {
        pickedMesh.dispose()
        chineseMission.silkSpoolsCollected += 1
        updateMissionUI()
        showToast('Silk spool collected')
        culturalAudio.playInteractionSound(660, 0.12)

        if (chineseMission.silkSpoolsCollected === 1) {
          showCulturalPopup(
            'Silk Craft Traditions',
            'Chinese Heritage',
            'Sericulture in China developed over millennia and shaped textile craftsmanship, diplomacy, and exchange routes. Silk making combines precise labor, seasonal knowledge, and artisanal refinement.'
          )
        }
      }

      if (chineseWoodblockMeshes.includes(pickedMesh)) {
        pickedMesh.dispose()
        chineseMission.woodBlocksCarved += 1
        updateMissionUI()
        showToast('Woodblock collected')
        culturalAudio.playInteractionSound(710, 0.12)

        if (chineseMission.woodBlocksCarved === 1) {
          factCardSystem.unlock('chinese-woodblock-printing')
          showCulturalPopup(
            'Woodblock Printing',
            'Chinese Scholarship',
            'Woodblock printing helped circulate religious, literary, and educational texts across East Asia. Reproducible prints made knowledge more accessible and preserved artistic traditions.'
          )
        }
      }

      if (chineseScrollMeshes.includes(pickedMesh)) {
        pickedMesh.dispose()
        chineseMission.paintedScrollsCollected += 1
        updateMissionUI()
        showToast('Scroll material collected')
        culturalAudio.playInteractionSound(760, 0.12)
      }
    }

    if (activeTribe === 'Japanese') {
      if (japaneseTeaMeshes.includes(pickedMesh)) {
        pickedMesh.dispose()
        japaneseMission.teaLeavesGathered += 1
        updateMissionUI()
        showToast('Tea leaves collected')
        culturalAudio.playInteractionSound(640, 0.12)

        if (japaneseMission.teaLeavesGathered === 1) {
          showCulturalPopup(
            'Tea Ceremony Principles',
            'Japanese Practice',
            'Chanoyu frames tea preparation as mindful practice. Harmony, respect, purity, and tranquility guide movement, conversation, and the shared experience of the gathering.'
          )
        }
      }

      if (japaneseBonsaiMeshes.includes(pickedMesh)) {
        pickedMesh.dispose()
        japaneseMission.bonsaiTrimmed += 1
        updateMissionUI()
        showToast('Bonsai material collected')
        culturalAudio.playInteractionSound(690, 0.12)
      }

      if (japaneseCalligraphyMeshes.includes(pickedMesh)) {
        pickedMesh.dispose()
        japaneseMission.calligraphyCharactersWritten += 1
        updateMissionUI()
        showToast('Calligraphy stroke collected')
        culturalAudio.playInteractionSound(740, 0.12)
      }

      if (japaneseTempleSealMeshes.includes(pickedMesh)) {
        pickedMesh.dispose()
        japaneseMission.templesVisited += 1
        updateMissionUI()
        showToast('Temple seal collected')
        culturalAudio.playInteractionSound(790, 0.12)

        if (japaneseMission.templesVisited === 1) {
          factCardSystem.unlock('japanese-temple-pilgrimage')
          showCulturalPopup(
            'Temple Pilgrimage Stamps',
            'Japanese Devotional Route',
            'Many temple routes include collecting seals as records of prayer, travel, and reflection. The practice links spiritual discipline with memory, place, and personal growth.'
          )
        }
      }
    }
  }
})

function updateInteractions() {
  if (state !== 'village') return

  const activeTribe = getActiveTribe()
  const activeLGA = selectedLGA ?? 'Owerri'
  const playerPos = walkCamera.position

  if (activeTribe === 'Igbo') {
    if (activeLGA === 'Owerri') {
      // Owerri: Yam/kola collection and cooking
      if (igboMission.cookingStage > 0 && !igboMission.cookingDone) {
        return
      }

      const distanceToCooking = Vector3.Distance(playerPos, cookingStation.position)
      const distanceToElder = Vector3.Distance(playerPos, elder.position)

      if (!igboMission.cookingDone && igboMission.yamsCollected >= igboMission.yamsNeeded && igboMission.kolaCollected >= igboMission.kolaNeeded) {
        setObjective('Bring your ingredients to the kitchen.', 'Step to the cooking station.')
        if (distanceToCooking < 4) {
          setAction('Start cooking', () => {
            igboMission.cookingStage = 1
            updateCookingStep()
          })
          return
        }
      }

      if (igboMission.cookingDone && !igboMission.delivered && distanceToElder < 4) {
        setAction('Deliver dishes', () => {
          igboMission.delivered = true
          achievementSystem.unlock('harvest-master')
          achievementSystem.checkMissionComplete('igbo-harvest')
          if (missionManager.isRegionComplete('nigeria')) {
            achievementSystem.checkRegionComplete('nigeria')
          }
          showToast('Feast delivered to the elders!')
          setState('festival')
        })
        return
      }

      setAction(null, null)
      return
    }

    if (activeLGA === 'Arochukwu') {
      // Arochukwu: Story stones puzzle
      const distanceToCircle = Vector3.Distance(playerPos, arochukwuCircle.position)

      if (!arochukwuMission.stonePuzzleDone && distanceToCircle < 5) {
        if (arochukwuMission.stonesFound === 0) {
          setAction('Begin the puzzle', () => {
            setHint('Tap the stones: Oracle → Pilgrimage → Unity.')
            showToast('Start with the Oracle stone.')
            updateArochukwuHighlight()
          })
        } else {
          setAction(null, null)
        }
        return
      }

      if (arochukwuMission.stonePuzzleDone) {
        setAction('Complete mission', () => {
          setState('festival')
        })
      } else {
        setAction(null, null)
      }
      return
    }

    if (activeLGA === 'Onitsha') {
      // Onitsha: Indigo cloth collection
      if (igboMission.fabricWoven >= igboMission.fabricNeeded) {
        setAction('Complete trade', () => {
          setState('festival')
        })
        return
      }

      const distanceToLoom = Vector3.Distance(playerPos, weavingLoom.position)
      if (distanceToLoom < 4) {
        setAction('Collect indigo', () => {
          if (igboMission.fabricWoven < igboMission.fabricNeeded) {
            igboMission.fabricWoven += 1
            updateMissionUI()
            showToast('Indigo cloth collected')
            playTone(540, 0.12, 'triangle', 0.05)
          }
        })
        return
      }

      setAction(null, null)
      return
    }
  }

  // Yoruba and Hausa remain unchanged
  if (activeTribe === 'Yoruba') {
    if (yorubaMission.rhythmActive) {
      return
    }

    const distanceToDrum = Vector3.Distance(playerPos, yorubaDrum.position)
    if (!yorubaMission.rhythmDone && yorubaMission.sticksCollected >= yorubaMission.sticksNeeded && distanceToDrum < 4) {
      setAction('Start rhythm', () => {
        yorubaMission.rhythmActive = true
        yorubaMission.rhythmHits = 0
        setObjective('Rhythm: match the talking drum beat.', 'Press the action button 5 times.')
        setAction('Beat', () => {
          yorubaMission.rhythmHits += 1
          setHint(`Beat ${yorubaMission.rhythmHits}/${yorubaMission.rhythmNeeded}`)
          playTone(300 + yorubaMission.rhythmHits * 40, 0.08, 'square', 0.04)
          if (yorubaMission.rhythmHits >= yorubaMission.rhythmNeeded) {
            yorubaMission.rhythmActive = false
            yorubaMission.rhythmDone = true
            achievementSystem.unlock('drum-virtuoso')
            achievementSystem.checkMissionComplete('yoruba-drum')
            if (missionManager.isRegionComplete('nigeria')) {
              achievementSystem.checkRegionComplete('nigeria')
            }
            showToast('Rhythm complete')
            playTone(880, 0.2, 'sine', 0.06)
            setState('festival')
          }
        })
      })
      return
    }
  }

  if (activeTribe === 'Hausa') {
    const distanceToParade = Vector3.Distance(playerPos, hausaParadeSpot.position)
    if (!hausaMission.arranged && hausaMission.fabricCollected >= hausaMission.fabricNeeded && hausaMission.flagsCollected >= hausaMission.flagsNeeded) {
      if (distanceToParade < 5) {
        setAction('Arrange flags', () => {
          hausaMission.arranged = true
          achievementSystem.unlock('parade-organizer')
          achievementSystem.checkMissionComplete('hausa-parade')
          if (missionManager.isRegionComplete('nigeria')) {
            achievementSystem.checkRegionComplete('nigeria')
          }
          showToast('Parade is ready')
          playTone(760, 0.18, 'sine', 0.06)
          setState('festival')
        })
        return
      }
    }
  }

  if (activeTribe === 'Maasai') {
    const distanceToFire = Vector3.Distance(playerPos, fireCircle.position)
    if (maasaiMission.beadsRed >= 3 && maasaiMission.beadsGreen >= 3 && maasaiMission.beadsBlue >= 3 && !maasaiMission.ceremonyDone) {
      if (distanceToFire < 5) {
        setAction('Perform warrior dance', () => {
          maasaiMission.danceSteps = 0
          updateMaasaiDance()
        })
        return
      }
    }
  }

  if (activeTribe === 'Egyptian') {
    const distanceToPyramid = Vector3.Distance(playerPos, new Vector3(0, 2, 0))
    if (egyptianMission.chalicesCollected >= 3 && egyptianMission.scarabsCollected >= 3 && egyptianMission.tabletsCollected >= 3 && !egyptianMission.celestialDone) {
      if (distanceToPyramid < 8) {
        setAction('Align the stars', () => {
          egyptianMission.alignmentSteps = 0
          updateCelestialAlignment()
        })
        return
      }
    }
  }

  if (activeTribe === 'Berber') {
    const distanceToFountain = Vector3.Distance(playerPos, fountain.position)
    
    // Carpet weaving (all wool collected)
    if (berberMission.woolRed >= 2 && berberMission.woolBlue >= 2 && berberMission.woolYellow >= 2 && !berberMission.carpetWoven) {
      if (distanceToFountain < 5) {
        setAction('Weave carpet', () => {
          berberMission.carpetWoven = true
          updateMissionUI()
          showToast('Beautiful Berber carpet woven!')
          culturalAudio.playInteractionSound(880, 0.2)
        })
        return
      }
    }

    // Henna art (all henna collected)
    if (berberMission.hennaCollected >= 4 && !berberMission.hennaArtDone && berberMission.carpetWoven) {
      if (distanceToFountain < 5) {
        setAction('Create henna art', () => {
          berberMission.hennaArtDone = true
          updateMissionUI()
          showToast('Intricate henna patterns completed!')
          culturalAudio.playInteractionSound(920, 0.2)
        })
        return
      }
    }

    // Tea ceremony (all mint collected)
    if (berberMission.mintCollected >= 3 && !berberMission.teaCeremonyDone && berberMission.hennaArtDone) {
      if (distanceToFountain < 5) {
        setAction('Prepare mint tea', () => {
          berberMission.teaCeremonyDone = true
          updateMissionUI()
          showToast('Traditional tea ceremony complete!')
          culturalAudio.playInteractionSound(960, 0.2)
        })
        return
      }
    }

    // Tagine cooking (all spices collected)
    if (berberMission.spicesCollected >= 5 && !berberMission.tagineCookingDone && berberMission.teaCeremonyDone) {
      if (distanceToFountain < 5) {
        setAction('Cook tagine', () => {
          berberMission.tagineCookingDone = true
          achievementSystem.unlock('berber-complete')
          if (missionManager.isRegionComplete('morocco')) {
            achievementSystem.checkRegionComplete('morocco')
          }
          updateMissionUI()
          showToast('Fragrant tagine ready to serve!')
          culturalAudio.playInteractionSound(1000, 0.25)
          setState('festival')
        })
        return
      }
    }
  }

  if (activeTribe === 'Zulu') {
    const zuluMission = missionManager.zulu
    // Shield station is near (0, 0, 0) in Zulu village
    const distanceToShieldStation = Vector3.Distance(playerPos, new Vector3(0, 2, 0))
    // Training ground approximately at (-5, 0, 0)
    const distanceToTrainingGround = Vector3.Distance(playerPos, new Vector3(-5, 2, 0))
    // Cattle kraal at (8, 0, 0)
    const distanceToKraal = Vector3.Distance(playerPos, new Vector3(8, 2, 0))
    // Ceremony area at (0, 0, -6)
    const distanceToCeremony = Vector3.Distance(playerPos, new Vector3(0, 2, -6))

    // Shield crafting (cowhide + wood collected)
    if (zuluMission.cowhideCollected >= 2 && zuluMission.woodCollected >= 3 && !zuluMission.shieldCrafted) {
      if (distanceToShieldStation < 4) {
        setAction('Craft shield', () => {
          zuluMission.shieldCrafted = true
          updateMissionUI()
          showToast('Warrior shield crafted with honor!')
          culturalAudio.playInteractionSound(880, 0.2)
        })
        return
      }
    }

    // Spear training (spears collected)
    if (zuluMission.spearsCollected >= 3 && !zuluMission.spearTrainingDone && zuluMission.shieldCrafted) {
      if (distanceToTrainingGround < 4) {
        setAction('Train with spear', () => {
          zuluMission.spearTrainingDone = true
          updateMissionUI()
          showToast('Spear throwing mastered!')
          culturalAudio.playInteractionSound(920, 0.2)
        })
        return
      }
    }

    // Cattle herding (simplified - just approach kraal)
    if (zuluMission.cattleHerded < 5 && zuluMission.spearTrainingDone) {
      if (distanceToKraal < 5) {
        setAction('Herd cattle', () => {
          zuluMission.cattleHerded += 1
          if (zuluMission.cattleHerded >= 5) {
            zuluMission.herdingDone = true
            showToast('All cattle herded successfully!')
            culturalAudio.playInteractionSound(960, 0.2)
          } else {
            showToast(`Cattle ${zuluMission.cattleHerded}/5 herded`)
            culturalAudio.playInteractionSound(700, 0.12)
          }
          updateMissionUI()
        })
        return
      }
    }

    // Umemulo ceremony preparation
    if (zuluMission.herdingDone && !zuluMission.ceremonyPreparationDone) {
      if (distanceToCeremony < 4) {
        setAction('Prepare ceremony', () => {
          zuluMission.ceremonyPreparationDone = true
          updateMissionUI()
          showToast('Ceremony preparations complete!')
          culturalAudio.playInteractionSound(1000, 0.2)
        })
        return
      }
    }

    // Umemulo ceremony completion
    if (zuluMission.ceremonyPreparationDone && !zuluMission.umemuloDone) {
      if (distanceToCeremony < 4) {
        setAction('Complete Umemulo', () => {
          zuluMission.umemuloDone = true
          achievementSystem.unlock('zulu-complete')
          if (missionManager.isRegionComplete('southafrica')) {
            achievementSystem.checkRegionComplete('southafrica')
          }
          updateMissionUI()
          showToast('Umemulo ceremony honored - Warrior status achieved!')
          culturalAudio.playInteractionSound(1040, 0.25)
          setState('festival')
        })
        return
      }
    }
  }

  if (activeTribe === 'Xhosa') {
    const xhosaMission = missionManager.xhosa
    // Beadwork station near (0, 0, 3) in Xhosa village
    const distanceToBeadwork = Vector3.Distance(playerPos, new Vector3(0, 2, 3))
    // Painting area at (-5, 0, 0)
    const distanceToPainting = Vector3.Distance(playerPos, new Vector3(-5, 2, 0))
    // Fighting circle at (5, 0, -3)
    const distanceToFighting = Vector3.Distance(playerPos, new Vector3(5, 2, -3))
    // Ancestral altar at (0, 0, -6)
    const distanceToAltar = Vector3.Distance(playerPos, new Vector3(0, 2, -6))

    // Beadwork creation (all beads collected)
    if (xhosaMission.beadsWhite >= 3 && xhosaMission.beadsRed >= 3 && xhosaMission.beadsBlack >= 3 && !xhosaMission.beadworkDone) {
      if (distanceToBeadwork < 4) {
        setAction('Create beadwork', () => {
          xhosaMission.beadworkDone = true
          updateMissionUI()
          showToast('Traditional beadwork patterns completed!')
          culturalAudio.playInteractionSound(880, 0.2)
        })
        return
      }
    }

    // Ochre body painting (ochre collected)
    if (xhosaMission.ochreCollected >= 3 && !xhosaMission.bodyPaintingDone && xhosaMission.beadworkDone) {
      if (distanceToPainting < 4) {
        setAction('Apply body paint', () => {
          xhosaMission.bodyPaintingDone = true
          updateMissionUI()
          showToast('Sacred ochre markings applied!')
          culturalAudio.playInteractionSound(920, 0.2)
        })
        return
      }
    }

    // Stick fighting training
    if (xhosaMission.stickFightingSteps < 3 && xhosaMission.bodyPaintingDone) {
      if (distanceToFighting < 4) {
        setAction('Practice stick fighting', () => {
          xhosaMission.stickFightingSteps += 1
          if (xhosaMission.stickFightingSteps >= 3) {
            xhosaMission.stickFightingDone = true
            showToast('Stick fighting techniques mastered!')
            culturalAudio.playInteractionSound(960, 0.2)
          } else {
            showToast(`Fighting step ${xhosaMission.stickFightingSteps}/3 completed`)
            culturalAudio.playInteractionSound(700, 0.12)
          }
          updateMissionUI()
        })
        return
      }
    }

    // Ancestral offering (ritual items collected)
    if (xhosaMission.ritualItemsCollected >= 3 && !xhosaMission.ancestralOfferingDone && xhosaMission.stickFightingDone) {
      if (distanceToAltar < 4) {
        setAction('Complete offering', () => {
          xhosaMission.ancestralOfferingDone = true
          achievementSystem.unlock('xhosa-complete')
          if (missionManager.isRegionComplete('southafrica')) {
            achievementSystem.checkRegionComplete('southafrica')
          }
          updateMissionUI()
          showToast('Ancestors honored - Blessings received!')
          culturalAudio.playInteractionSound(1000, 0.25)
          setState('festival')
        })
        return
      }
    }
  }

  if (activeTribe === 'Amhara') {
    const distanceToCoffeeHut = Vector3.Distance(playerPos, new Vector3(4, 2, 2))
    const distanceToBaking = Vector3.Distance(playerPos, new Vector3(2, 2, 4))
    const distanceToChurchYard = Vector3.Distance(playerPos, new Vector3(-6, 2, -4))
    const distanceToManuscriptTable = Vector3.Distance(playerPos, new Vector3(0, 2, -6))

    if (amharaMission.coffeeBeansCollected >= amharaMission.coffeeBeansNeeded && !amharaMission.coffeeCeremonyDone && distanceToCoffeeHut < 4) {
      setAction('Perform coffee ceremony', () => {
        amharaMission.coffeeCeremonyDone = true
        updateMissionUI()
        showToast('Traditional buna ceremony completed!')
        culturalAudio.playInteractionSound(900, 0.2)
      })
      return
    }

    if (amharaMission.teffCollected >= amharaMission.teffNeeded && amharaMission.coffeeCeremonyDone && !amharaMission.injeraDone && distanceToBaking < 4) {
      setAction('Bake injera', () => {
        amharaMission.injeraDone = true
        updateMissionUI()
        showToast('Injera prepared successfully!')
        culturalAudio.playInteractionSound(940, 0.2)
      })
      return
    }

    if (amharaMission.crossesCarved >= amharaMission.crossesNeeded && amharaMission.injeraDone && !amharaMission.crossCarvingDone && distanceToChurchYard < 4) {
      setAction('Carve crosses', () => {
        amharaMission.crossCarvingDone = true
        updateMissionUI()
        showToast('Orthodox crosses carved!')
        culturalAudio.playInteractionSound(980, 0.2)
      })
      return
    }

    if (amharaMission.manuscriptsOrganized >= amharaMission.manuscriptsNeeded && amharaMission.crossCarvingDone && !amharaMission.manuscriptDone && distanceToManuscriptTable < 4) {
      setAction('Preserve manuscripts', () => {
        amharaMission.manuscriptDone = true
        achievementSystem.unlock('amhara-complete')
        if (missionManager.isRegionComplete('ethiopia')) {
          achievementSystem.checkRegionComplete('ethiopia')
        }
        updateMissionUI()
        showToast('Ancient manuscripts preserved!')
        culturalAudio.playInteractionSound(1020, 0.25)
        setState('festival')
      })
      return
    }
  }

  if (activeTribe === 'Oromo') {
    const distanceToCouncil = Vector3.Distance(playerPos, new Vector3(0, 2, 2))
    const distanceToIrreecha = Vector3.Distance(playerPos, new Vector3(0, 2, 4))
    const distanceToCoffee = Vector3.Distance(playerPos, new Vector3(0, 2, -1))
    const distanceToOdaTree = Vector3.Distance(playerPos, new Vector3(0, 2, -3))

    if (!oromoMission.councilParticipationDone && distanceToCouncil < 4) {
      setAction('Join Gada council', () => {
        oromoMission.councilParticipationDone = true
        updateMissionUI()
        showToast('Gada council participation complete!')
        culturalAudio.playInteractionSound(900, 0.2)
      })
      return
    }

    if (oromoMission.irreechaOfferingsCollected >= oromoMission.irreechaOfferingsNeeded && oromoMission.councilParticipationDone && !oromoMission.irreechaDone && distanceToIrreecha < 4) {
      setAction('Perform Irreecha', () => {
        oromoMission.irreechaDone = true
        updateMissionUI()
        showToast('Irreecha thanksgiving complete!')
        culturalAudio.playInteractionSound(940, 0.2)
      })
      return
    }

    if (oromoMission.butterCoffeeIngredientsCollected >= oromoMission.butterCoffeeIngredientsNeeded && oromoMission.irreechaDone && !oromoMission.butterCoffeeDone && distanceToCoffee < 4) {
      setAction('Prepare butter coffee', () => {
        oromoMission.butterCoffeeDone = true
        updateMissionUI()
        showToast('Buna qalaa prepared!')
        culturalAudio.playInteractionSound(980, 0.2)
      })
      return
    }

    if (oromoMission.sycamoreRitualItemsCollected >= oromoMission.sycamoreRitualItemsNeeded && oromoMission.butterCoffeeDone && !oromoMission.sycamoreRitualDone && distanceToOdaTree < 4) {
      setAction('Honor Oda tree', () => {
        oromoMission.sycamoreRitualDone = true
        achievementSystem.unlock('oromo-complete')
        if (missionManager.isRegionComplete('ethiopia')) {
          achievementSystem.checkRegionComplete('ethiopia')
        }
        updateMissionUI()
        showToast('Sacred sycamore ritual completed!')
        culturalAudio.playInteractionSound(1020, 0.25)
        setState('festival')
      })
      return
    }
  }

  if (activeTribe === 'Indian') {
    const distanceToRangoli = Vector3.Distance(playerPos, new Vector3(0, 2, -1))
    const distanceToMusician = Vector3.Distance(playerPos, new Vector3(-3, 2, -1.8))
    const distanceToShrine = Vector3.Distance(playerPos, new Vector3(6, 2, 5))
    const distanceToMarbleCourt = Vector3.Distance(playerPos, new Vector3(0, 2, -8))

    if (indianMission.spicesCollected >= indianMission.spicesNeeded && !indianMission.spiceMixingDone && distanceToRangoli < 4) {
      setAction('Blend festival spices', () => {
        indianMission.spiceMixingDone = true
        updateMissionUI()
        showToast('Masala blend prepared!')
        culturalAudio.playInteractionSound(910, 0.2)
      })
      return
    }

    if (indianMission.spiceMixingDone && !indianMission.talaMeasuresDone && distanceToMusician < 4) {
      setAction('Practice tala rhythm', () => {
        indianMission.talaMeasuresDone = true
        updateMissionUI()
        showToast('Tala rhythm mastered!')
        culturalAudio.playInteractionSound(950, 0.2)
      })
      return
    }

    if (indianMission.mantrasChanted >= indianMission.mantrasNeeded && indianMission.talaMeasuresDone && !indianMission.mantraDone && distanceToShrine < 4) {
      setAction('Chant mantras', () => {
        indianMission.mantraDone = true
        updateMissionUI()
        showToast('Mantra recitation completed!')
        culturalAudio.playInteractionSound(990, 0.2)
      })
      return
    }

    if (indianMission.mantraDone && !indianMission.tajMahalContemplationDone && distanceToMarbleCourt < 4) {
      setAction('Contemplate at marble court', () => {
        indianMission.tajMahalContemplationDone = true
        achievementSystem.unlock('indian-complete')
        if (missionManager.isRegionComplete('india')) {
          achievementSystem.checkRegionComplete('india')
        }
        updateMissionUI()
        showToast('Reflection ritual complete!')
        culturalAudio.playInteractionSound(1030, 0.25)
        setState('festival')
      })
      return
    }
  }

  if (activeTribe === 'Chinese') {
    const distanceToDyeBasin = Vector3.Distance(playerPos, new Vector3(-2, 2, -1.5))
    const distanceToPrintTable = Vector3.Distance(playerPos, new Vector3(3, 2, 1.8))
    const distanceToWallMarker = Vector3.Distance(playerPos, new Vector3(0, 2, -8))

    if (chineseMission.silkSpoolsCollected >= chineseMission.silkSpoolsNeeded && !chineseMission.silkDyedDone && distanceToDyeBasin < 4) {
      setAction('Dye silk', () => {
        chineseMission.silkDyedDone = true
        updateMissionUI()
        showToast('Silk dyed in traditional colors!')
        culturalAudio.playInteractionSound(920, 0.2)
      })
      return
    }

    if (chineseMission.woodBlocksCarved >= chineseMission.woodBlocksNeeded && chineseMission.silkDyedDone && !chineseMission.woodblockPrintingDone && distanceToPrintTable < 4) {
      setAction('Print with woodblocks', () => {
        chineseMission.woodblockPrintingDone = true
        updateMissionUI()
        showToast('Woodblock print complete!')
        culturalAudio.playInteractionSound(960, 0.2)
      })
      return
    }

    if (chineseMission.paintedScrollsCollected >= chineseMission.paintedScrollsNeeded && chineseMission.woodblockPrintingDone && !chineseMission.artworkCompleteDone && distanceToWallMarker < 4) {
      setAction('Complete scroll artwork', () => {
        chineseMission.artworkCompleteDone = true
        achievementSystem.unlock('chinese-complete')
        if (missionManager.isRegionComplete('china')) {
          achievementSystem.checkRegionComplete('china')
        }
        updateMissionUI()
        showToast('Scroll artwork finalized!')
        culturalAudio.playInteractionSound(1000, 0.25)
        setState('festival')
      })
      return
    }
  }

  if (activeTribe === 'Japanese') {
    const distanceToTeaCircle = Vector3.Distance(playerPos, new Vector3(-5, 2, -3))
    const distanceToZenGarden = Vector3.Distance(playerPos, new Vector3(2, 2, 2))
    const distanceToCalligraphyTable = Vector3.Distance(playerPos, new Vector3(3, 2, -1.5))
    const distanceToTorii = Vector3.Distance(playerPos, new Vector3(6, 2, -5))

    if (japaneseMission.teaLeavesGathered >= japaneseMission.teaLeavesNeeded && !japaneseMission.teaCeremonyDone && distanceToTeaCircle < 4) {
      setAction('Perform tea ceremony', () => {
        japaneseMission.teaCeremonyDone = true
        updateMissionUI()
        showToast('Tea ceremony complete!')
        culturalAudio.playInteractionSound(910, 0.2)
      })
      return
    }

    if (japaneseMission.bonsaiTrimmed >= japaneseMission.bonsaiNeeded && japaneseMission.teaCeremonyDone && !japaneseMission.bonsaiPruningDone && distanceToZenGarden < 4) {
      setAction('Prune bonsai', () => {
        japaneseMission.bonsaiPruningDone = true
        updateMissionUI()
        showToast('Bonsai pruning complete!')
        culturalAudio.playInteractionSound(950, 0.2)
      })
      return
    }

    if (japaneseMission.calligraphyCharactersWritten >= japaneseMission.calligraphyNeeded && japaneseMission.bonsaiPruningDone && !japaneseMission.calligraphyArtDone && distanceToCalligraphyTable < 4) {
      setAction('Compose calligraphy', () => {
        japaneseMission.calligraphyArtDone = true
        updateMissionUI()
        showToast('Calligraphy artwork complete!')
        culturalAudio.playInteractionSound(990, 0.2)
      })
      return
    }

    if (japaneseMission.templesVisited >= japaneseMission.templesNeeded && japaneseMission.calligraphyArtDone && !japaneseMission.templePilgrimageDone && distanceToTorii < 4) {
      setAction('Complete pilgrimage', () => {
        japaneseMission.templePilgrimageDone = true
        achievementSystem.unlock('japanese-complete')
        if (missionManager.isRegionComplete('japan')) {
          achievementSystem.checkRegionComplete('japan')
        }
        updateMissionUI()
        showToast('Temple pilgrimage complete!')
        culturalAudio.playInteractionSound(1030, 0.25)
        setState('festival')
      })
      return
    }
  }

  setAction(null, null)
}

function updateWalkMovement() {
  if (state !== 'village' && state !== 'festival') return
  if (scene.activeCamera !== walkCamera || photoModeActive) return

  const deltaSeconds = scene.getEngine().getDeltaTime() / 1000
  const inputX = (walkInput.right ? 1 : 0) - (walkInput.left ? 1 : 0)
  const inputZ = (walkInput.forward ? 1 : 0) - (walkInput.back ? 1 : 0)
  const inputLength = Math.hypot(inputX, inputZ)

  if (inputLength > 0) {
    const forward = walkCamera.getDirection(new Vector3(0, 0, 1))
    const right = walkCamera.getDirection(new Vector3(1, 0, 0))
    forward.y = 0
    right.y = 0
    forward.normalize()
    right.normalize()

    const moveDirection = right.scale(inputX).addInPlace(forward.scale(inputZ)).normalize()
    const speed = walkConfig.maxSpeed * (walkInput.sprint ? walkConfig.sprintMultiplier : 1)
    const desiredVelocity = moveDirection.scale(speed)
    const lerpAmount = 1 - Math.exp(-walkConfig.accel * deltaSeconds)
    walkVelocity.copyFrom(Vector3.Lerp(walkVelocity, desiredVelocity, lerpAmount))
  } else {
    const lerpAmount = 1 - Math.exp(-walkConfig.damping * deltaSeconds)
    walkVelocity.copyFrom(Vector3.Lerp(walkVelocity, Vector3.Zero(), lerpAmount))
  }

  walkCamera.position.addInPlace(walkVelocity.scale(deltaSeconds))
  walkCamera.position.y = walkConfig.eyeHeight
}

function updateCookingStep() {
  if (igboMission.cookingStage === 1) {
    setObjective('Cooking: Chop the yams.', 'Press the action button 3 times.')
    let chops = 0
    setAction('Chop', () => {
      chops += 1
      setHint(`Chopping ${chops}/3`)
      if (chops >= 3) {
        igboMission.cookingStage = 2
        updateCookingStep()
      }
    })
    return
  }

  if (igboMission.cookingStage === 2) {
    setObjective('Cooking: Blend spices.', 'Press the action button 2 times.')
    let blends = 0
    setAction('Blend', () => {
      blends += 1
      setHint(`Blending ${blends}/2`)
      if (blends >= 2) {
        igboMission.cookingStage = 3
        updateCookingStep()
      }
    })
    return
  }

  if (igboMission.cookingStage === 3) {
    setObjective('Cooking: Simmer the feast.', 'Press the action button to finish.')
    setAction('Serve', () => {
      igboMission.cookingDone = true
      setHint('Carry the dishes to the elders.')
      setAction(null, null)
      updateMissionUI()
    })
  }
}

function updateMaasaiDance() {
  const danceSteps = ['Lift', 'Jump', 'Turn', 'Leap']
  const currentStep = maasaiMission.danceSteps
  
  if (currentStep < 4) {
    setObjective(`Warrior Dance: Step ${currentStep + 1}`, `Press the action button to ${danceSteps[currentStep]}.`)
    let performedStep = false
    setAction(danceSteps[currentStep], () => {
      if (!performedStep) {
        performedStep = true
        maasaiMission.danceSteps += 1
        showToast(`${danceSteps[currentStep]} complete!`)
        playTone(300 + currentStep * 80, 0.1, 'sine', 0.05)
        
        if (maasaiMission.danceSteps < 4) {
          setTimeout(() => updateMaasaiDance(), 400)
        } else {
          maasaiMission.ceremonyDone = true
          achievementSystem.unlock('warrior-dance')
          achievementSystem.checkMissionComplete('maasai-dance')
          achievementSystem.checkRegionComplete('kenya')
          showToast('Warrior ceremony complete!')
          playTone(880, 0.25, 'sine', 0.08)
          setState('festival')
        }
      }
    })
  }
}

function updateCelestialAlignment() {
  const alignmentSteps = ['Align North (Sun)', 'Align East (Star)', 'Align South (Star)']
  const currentStep = egyptianMission.alignmentSteps
  
  if (currentStep < 3) {
    setObjective(`Celestial Alignment: ${alignmentSteps[currentStep]}`, 'Press the action button to invoke cosmic harmony.')
    let performedAlignment = false
    setAction('Align', () => {
      if (!performedAlignment) {
        performedAlignment = true
        egyptianMission.alignmentSteps += 1
        showToast(`${alignmentSteps[currentStep]} aligned!`)
        playTone(528 + currentStep * 111, 0.15, 'sine', 0.08)
        
        if (egyptianMission.alignmentSteps < 3) {
          setTimeout(() => updateCelestialAlignment(), 500)
        } else {
          egyptianMission.celestialDone = true
          achievementSystem.unlock('celestial-alignment')
          achievementSystem.checkMissionComplete('egypt-celestial')
          achievementSystem.checkRegionComplete('egypt')
          showToast('The pyramid is unlocked!')
          playTone(963, 0.3, 'sine', 0.1)
          setState('festival')
        }
      }
    })
  }
}

scene.onBeforeRenderObservable.add(() => {
  globe.rotation.y += 0.0006
  if (globeCloudLayer) {
    globeCloudLayer.rotation.y += 0.0009
  }
  updateWalkMovement()
  if (state === 'village') {
    updateInteractions()
  }

  if (scene.activeCamera === arcCamera) {
    const lerp = 0.045
    arcCamera.setTarget(Vector3.Lerp(arcCamera.target, desiredTarget, lerp))
    arcCamera.radius = arcCamera.radius + (desiredRadius - arcCamera.radius) * lerp
    if (isArcAutoZooming) {
      arcCamera.alpha = arcCamera.alpha + (desiredAlpha - arcCamera.alpha) * lerp
      arcCamera.beta = arcCamera.beta + (desiredBeta - arcCamera.beta) * lerp

      const alphaDone = Math.abs(arcCamera.alpha - desiredAlpha) < 0.005
      const betaDone = Math.abs(arcCamera.beta - desiredBeta) < 0.005
      const radiusDone = Math.abs(arcCamera.radius - desiredRadius) < 0.02
      if (alphaDone && betaDone && radiusDone) {
        isArcAutoZooming = false
      }
    } else {
      desiredAlpha = arcCamera.alpha
      desiredBeta = arcCamera.beta
    }
  }

  // Ambient animations
  if (state === 'village' || state === 'festival') {
    bannerSwayTime += 0.01
    drumGlowTime += 0.015

    // Banner sway: subtle rotation side-to-side
    const banners = scene.getMeshesById('bannerCloth')
    banners.forEach((banner) => {
      banner.rotation.z = Math.sin(bannerSwayTime) * 0.05
    })

    // Drum glow pulse: oscillating emissive intensity
    const drums = [yorubaDrum, festivalDrum]
    drums.forEach((drum) => {
      if (drum && drum.material instanceof StandardMaterial) {
        const glowIntensity = 0.04 + Math.sin(drumGlowTime) * 0.06
        drum.material.emissiveColor = new Color3(0.2 * (1 + glowIntensity), 0.1 * (1 + glowIntensity), 0.04 * (1 + glowIntensity))
      }
    })
  }
})

canvas.addEventListener('click', () => {
  if (!isTouchDevice && (state === 'village' || state === 'festival') && document.pointerLockElement !== canvas) {
    canvas.requestPointerLock()
  }
})

engine.runRenderLoop(() => {
  scene.render()
})

window.addEventListener('resize', () => {
  engine.resize()
})

/**
 * Register region loaders for lazy loading
 * Currently, all regions are initialized upfront. To fully implement lazy loading,
 * mesh creation code for each region would be extracted into these loader functions.
 * This infrastructure is in place for future optimization phases.
 */
registerRegionLoader('nigeria', async () => {
  // Nigeria region meshes are already created upfront
  // Future: Move createTribeMarker, createLGAMarker, and Nigeria map meshes here
})

registerRegionLoader('kenya', async () => {
  // Kenya region meshes are already created upfront
})

registerRegionLoader('egypt', async () => {
  // Egypt region meshes are already created upfront
})

registerRegionLoader('morocco', async () => {
  // Morocco region meshes are already created upfront
})

registerRegionLoader('southafrica', async () => {
  // South Africa region meshes are already created upfront
})

registerRegionLoader('ethiopia', async () => {
  // Ethiopia region meshes are already created upfront
})

registerRegionLoader('asia', async () => {
  // Asia gallery (country selection)
  // Loads when entering asia state for the first time
})

registerRegionLoader('india', async () => {
  // India region meshes and tribe setup
  // Phase 7: To be expanded with detailed village structures and missions
})

registerRegionLoader('china', async () => {
  // China region meshes and tribe setup
  // Phase 7: To be expanded with detailed village structures and missions
})

registerRegionLoader('japan', async () => {
  // Japan region meshes and tribe setup
  // Phase 7: To be expanded with detailed village structures and missions
})

