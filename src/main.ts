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
import { audioSystem } from './audioSystem'
import { saveSystem } from './saveSystem'
import { achievementSystem } from './achievementSystem'
import { missionManager } from './missionManager'
import type { GameState, Tribe, IgboLGA } from './types'

const canvas = document.querySelector<HTMLCanvasElement>('#renderCanvas')
if (!canvas) {
  throw new Error('Missing renderCanvas element')
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
  audioSystem.playTone(800, 0.3)
  setTimeout(() => audioSystem.playTone(1000, 0.3), 150)
  
  // Update gallery if open
  const progress = achievementSystem.getProgress()
  uiManager.updateAchievementsGallery(achievementSystem.getAll(), progress)
})

// Setup achievements gallery
uiManager.setupAchievementsGallery(() => {
  const progress = achievementSystem.getProgress()
  uiManager.updateAchievementsGallery(achievementSystem.getAll(), progress)
  audioSystem.playTone(600, 0.1)
})

// Load saved game if available
const savedGame = saveSystem.load()
let state: GameState = savedGame?.state || 'hub'
let selectedTribe: Tribe | null = savedGame?.selectedTribe || null
let selectedLGA: IgboLGA | null = savedGame?.selectedLGA || null

if (savedGame) {
  missionManager.loadFromSave(savedGame.missions)
  achievementSystem.loadUnlocked(savedGame.achievements)
  console.log('Game loaded from save')
}

// Setup auto-save every 30 seconds
saveSystem.autoSave(() => ({
  state,
  selectedTribe,
  selectedLGA,
  missions: missionManager.exportForSave(),
  achievements: achievementSystem.getUnlockedIds(),
  collectiblesFound: missionManager.getTotalCollectibles(),
  missionsCompleted: missionManager.getTotalMissionsCompleted(),
}))

let photoModeActive = false
let photoModeCamera: UniversalCamera | null = null
let currentAction: (() => void) | null = null
let desiredTarget = new Vector3(0, 0, 0)
let desiredRadius = 16

// Mission state is now managed by missionManager
const igboMission = missionManager.igbo
const arochukwuMission = missionManager.arochukwu
const yorubaMission = missionManager.yoruba
const hausaMission = missionManager.hausa
const maasaiMission = missionManager.maasai
const egyptianMission = missionManager.egyptian

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
  audioSystem.enable()
  updateAmbientForState()
}

function playTone(frequency: number, duration = 0.12, type: OscillatorType = 'sine', volume = 0.05) {
  audioSystem.playTone(frequency, duration)
}

function stopAmbient() {
  audioSystem.stopAmbient()
}

function startAmbient(frequency: number, type: OscillatorType, volume: number) {
  if (!audioSystem.isEnabled()) return
  audioSystem.setAmbientTone(frequency)
}

function updateAmbientForState() {
  if (!audioSystem.isEnabled()) return
  if (state === 'hub') {
    startAmbient(110, 'sine', 0.02)
  } else if (state === 'africa' || state === 'nigeria') {
    startAmbient(140, 'triangle', 0.022)
  } else if (state === 'village') {
    startAmbient(190, 'triangle', 0.025)
  } else if (state === 'festival') {
    startAmbient(260, 'sawtooth', 0.02)
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
    uiObjective.classList.add('hidden')
    uiHint.classList.add('hidden')
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
    uiAction.classList.remove('hidden')
    uiObjective.classList.remove('hidden')
    uiHint.classList.remove('hidden')
    updateMissionUI()
    updateInteractions()
    playTone(440, 0.2, 'sine', 0.06)
    showToast('✓ Photo Mode Exited')
  }
}

uiTutorialClose.addEventListener('click', () => {
  uiTutorial.style.display = 'none'
})

uiRecapClose.addEventListener('click', () => {
  setRecapVisible(false)
})

uiCulturalClose.addEventListener('click', () => {
  hideCulturalPopup()
})

window.addEventListener('pointerdown', () => enableAudio(), { once: true })
window.addEventListener('keydown', () => enableAudio(), { once: true })

uiAction.addEventListener('click', () => {
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

const walkVelocity = new Vector3(0, 0, 0)
const walkConfig = {
  accel: 12,
  damping: 14,
  maxSpeed: 4.2,
  sprintMultiplier: 1.6,
  eyeHeight: 2,
}

scene.activeCamera = arcCamera

const sharedRoot = new TransformNode('sharedRoot', scene)
const hubMarkersRoot = new TransformNode('hubMarkersRoot', scene)
const africaMarkersRoot = new TransformNode('africaMarkersRoot', scene)
const nigeriaRoot = new TransformNode('nigeriaRoot', scene)
const kenyaRoot = new TransformNode('kenyaRoot', scene)
const egyptRoot = new TransformNode('egyptRoot', scene)
const villageRoot = new TransformNode('villageRoot', scene)
const igboRoot = new TransformNode('igboRoot', scene)
const owrerriZone = new TransformNode('owrerriZone', scene)
const arochukwuZone = new TransformNode('arochukwuZone', scene)
const onitshZone = new TransformNode('onitshZone', scene)
const yorubaRoot = new TransformNode('yorubaRoot', scene)
const hausaRoot = new TransformNode('hausaRoot', scene)
const maasaiRoot = new TransformNode('maasaiRoot', scene)
const egyptianRoot = new TransformNode('egyptianRoot', scene)
const festivalRoot = new TransformNode('festivalRoot', scene)

igboRoot.parent = villageRoot
owrerriZone.parent = igboRoot
arochukwuZone.parent = igboRoot
onitshZone.parent = igboRoot
yorubaRoot.parent = villageRoot
hausaRoot.parent = villageRoot
maasaiRoot.parent = villageRoot
egyptianRoot.parent = villageRoot

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

function createLabel(text: string, position: Vector3, root: TransformNode, color: string) {
  const texture = new DynamicTexture(`label-${text}`, { width: 256, height: 128 }, scene, false)
  const ctx = texture.getContext() as CanvasRenderingContext2D
  ctx.clearRect(0, 0, 256, 128)
  ctx.fillStyle = 'rgba(12, 18, 24, 0.65)'
  ctx.fillRect(0, 0, 256, 128)
  ctx.fillStyle = color
  ctx.font = 'bold 36px Palatino'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, 128, 64)
  texture.update()

  const plane = MeshBuilder.CreatePlane(`labelPlane-${text}`, { width: 2.6, height: 1.3 }, scene)
  plane.position = position
  plane.billboardMode = Mesh.BILLBOARDMODE_ALL
  plane.parent = root
  plane.isPickable = false

  const mat = new StandardMaterial(`labelMat-${text}`, scene)
  mat.diffuseTexture = texture
  mat.emissiveTexture = texture
  mat.opacityTexture = texture
  mat.disableLighting = true
  plane.material = mat
  return plane
}

function createGlobe() {
  const globe = MeshBuilder.CreateSphere('globe', { diameter: 10, segments: 24 }, scene)
  const globeMaterial = new StandardMaterial('globeMaterial', scene)
  globeMaterial.diffuseColor = new Color3(0.09, 0.22, 0.32)
  globeMaterial.specularColor = new Color3(0.12, 0.12, 0.12)
  globeMaterial.emissiveColor = new Color3(0.02, 0.08, 0.11)
  globe.material = globeMaterial
  globe.parent = sharedRoot

  const continentMaterial = new StandardMaterial('continentMaterial', scene)
  continentMaterial.diffuseColor = new Color3(0.66, 0.48, 0.26)
  continentMaterial.emissiveColor = new Color3(0.2, 0.12, 0.02)

  const africaPatch = MeshBuilder.CreateDisc('africaPatch', { radius: 1.4, tessellation: 6 }, scene)
  africaPatch.position = sphericalPosition(5.1, 10, 20)
  africaPatch.lookAt(Vector3.Zero())
  africaPatch.rotation.x += Math.PI / 2
  africaPatch.material = continentMaterial
  africaPatch.parent = sharedRoot

  return globe
}

createSkyDome()
const globe = createGlobe()

const africaMarker = createMarker(
  'africa',
  new Color3(0.9, 0.65, 0.28),
  sphericalPosition(5.3, 8, 20),
  hubMarkersRoot,
  () => setState('africa')
)
createLabel('Africa', africaMarker.position.add(new Vector3(0, 0.8, 0)), hubMarkersRoot, '#f9e6be')

const europeMarker = createMarker(
  'europe',
  new Color3(0.5, 0.5, 0.5),
  sphericalPosition(5.3, 35, 10),
  hubMarkersRoot,
  () => showToast('Europe gallery coming soon')
)
createLabel('Europe', europeMarker.position.add(new Vector3(0, 0.8, 0)), hubMarkersRoot, '#c9c9c9')

const asiaMarker = createMarker(
  'asia',
  new Color3(0.5, 0.5, 0.5),
  sphericalPosition(5.3, 25, 90),
  hubMarkersRoot,
  () => showToast('Asia gallery coming soon')
)
createLabel('Asia', asiaMarker.position.add(new Vector3(0, 0.8, 0)), hubMarkersRoot, '#c9c9c9')

const americasMarker = createMarker(
  'americas',
  new Color3(0.5, 0.5, 0.5),
  sphericalPosition(5.3, 10, -90),
  hubMarkersRoot,
  () => showToast('Americas gallery coming soon')
)
createLabel('Americas', americasMarker.position.add(new Vector3(0, 0.8, 0)), hubMarkersRoot, '#c9c9c9')

const oceaniaMarker = createMarker(
  'oceania',
  new Color3(0.5, 0.5, 0.5),
  sphericalPosition(5.3, -20, 140),
  hubMarkersRoot,
  () => showToast('Oceania gallery coming soon')
)
createLabel('Oceania', oceaniaMarker.position.add(new Vector3(0, 0.8, 0)), hubMarkersRoot, '#c9c9c9')

africaMarker.isPickable = true
europeMarker.isPickable = true
asiaMarker.isPickable = true
americasMarker.isPickable = true
oceaniaMarker.isPickable = true

const nigeriaMarker = createMarker(
  'nigeria',
  new Color3(0.18, 0.5, 0.25),
  sphericalPosition(5.35, 9, 10),
  africaMarkersRoot,
  () => setState('nigeria')
)
nigeriaMarker.isPickable = true
createLabel('Nigeria', nigeriaMarker.position.add(new Vector3(0, 0.9, 0)), africaMarkersRoot, '#e9f7e0')

const kenyaMarker = createMarker(
  'kenya',
  new Color3(0.25, 0.55, 0.3),
  sphericalPosition(5.35, 0, 37),
  africaMarkersRoot,
  () => setState('kenya')
)
kenyaMarker.isPickable = true
createLabel('Kenya', kenyaMarker.position.add(new Vector3(0, 0.9, 0)), africaMarkersRoot, '#d4f1d4')

const egyptMarker = createMarker(
  'egypt',
  new Color3(0.8, 0.7, 0.2),
  sphericalPosition(5.35, 20, 30),
  africaMarkersRoot,
  () => setState('egypt')
)
egyptMarker.isPickable = true
createLabel('Egypt', egyptMarker.position.add(new Vector3(0, 0.9, 0)), africaMarkersRoot, '#fff9e6')

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

function createHut(position: Vector3) {
  const base = MeshBuilder.CreateBox('hutBase', { width: 3, height: 2, depth: 3 }, scene)
  base.position = position
  base.position.y = 1
  const baseMat = new StandardMaterial('hutBaseMat', scene)
  baseMat.diffuseColor = new Color3(0.7, 0.52, 0.34)
  base.material = baseMat
  base.parent = villageRoot

  const roof = MeshBuilder.CreateCylinder('hutRoof', { diameterTop: 0, diameterBottom: 3.4, height: 1.6, tessellation: 4 }, scene)
  roof.position = position.add(new Vector3(0, 2.1, 0))
  const roofMat = new StandardMaterial('roofMat', scene)
  roofMat.diffuseColor = new Color3(0.45, 0.28, 0.16)
  roof.material = roofMat
  roof.parent = villageRoot
}

function createTree(position: Vector3) {
  const trunk = MeshBuilder.CreateCylinder('trunk', { diameter: 0.5, height: 3 }, scene)
  trunk.position = position.add(new Vector3(0, 1.5, 0))
  const trunkMat = new StandardMaterial('trunkMat', scene)
  trunkMat.diffuseColor = new Color3(0.35, 0.2, 0.1)
  trunk.material = trunkMat
  trunk.parent = villageRoot

  const crown = MeshBuilder.CreateSphere('crown', { diameter: 2.6 }, scene)
  crown.position = position.add(new Vector3(0, 3.2, 0))
  const crownMat = new StandardMaterial('crownMat', scene)
  crownMat.diffuseColor = new Color3(0.18, 0.4, 0.2)
  crown.material = crownMat
  crown.parent = villageRoot
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
}

resetIgboCollectibles()
resetYorubaCollectibles()
resetHausaCollectibles()
resetMaasaiCollectibles()
resetEgyptianCollectibles()

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

function setState(next: GameState) {
  state = next
  const activeTribe = getActiveTribe()
  const activeLGA = selectedLGA ?? 'Owerri'

  hubMarkersRoot.setEnabled(state === 'hub')
  africaMarkersRoot.setEnabled(state === 'africa')
  sharedRoot.setEnabled(state === 'hub' || state === 'africa')
  nigeriaRoot.setEnabled(state === 'nigeria' || state === 'lga-select')
  kenyaRoot.setEnabled(state === 'kenya')
  egyptRoot.setEnabled(state === 'egypt')
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

  if (state === 'hub') {
    scene.activeCamera = arcCamera
    arcCamera.attachControl(canvas, true)
    walkCamera.detachControl()
    arcCamera.beta = defaultArcBeta
    uiCrosshair.classList.add('hidden')
    uiChoices.classList.add('hidden')
    setTitle('The World Museum', 'Choose a continent to begin your journey.')
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
    uiCrosshair.classList.add('hidden')
    uiChoices.classList.add('hidden')
    desiredTarget = africaMarker.position
    desiredRadius = 11
    setTitle('Africa Gallery', 'Zoom in to select a nation.')
    setObjective('Select Nigeria to continue.')
    setHint('Nigeria leads to the Festival of Unity demo.')
    setAction('Back to Hub', () => setState('hub'))
    setTutorial('Click Nigeria to open the cultural map.')
    setRecapVisible(false)
  }

  if (state === 'nigeria') {
    scene.activeCamera = arcCamera
    arcCamera.attachControl(canvas, true)
    walkCamera.detachControl()
    uiCrosshair.classList.add('hidden')
    uiChoices.classList.add('hidden')
    arcCamera.beta = Math.PI / 3.2
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
    uiCrosshair.classList.add('hidden')
    uiChoices.classList.add('hidden')
    arcCamera.beta = Math.PI / 3.2
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
    uiCrosshair.classList.add('hidden')
    uiChoices.classList.add('hidden')
    arcCamera.beta = Math.PI / 3.2
    desiredTarget = new Vector3(0, 0, 0)
    desiredRadius = 12
    setTitle('Egypt', 'Discover the wisdom of the Pharaohs.')
    setObjective('Click the Pharaoh marker to begin artifact gathering and celestial alignment.')
    setHint('Ancient Egypt was home to monumental temples and sacred mysteries.')
    setAction('Back to Africa', () => setState('africa'))
    setTutorial('Click the Pharaoh marker to enter the temple and begin your journey.')
    setRecapVisible(false)
  }

  if (state === 'lga-select') {
    scene.activeCamera = arcCamera
    arcCamera.attachControl(canvas, true)
    walkCamera.detachControl()
    uiCrosshair.classList.add('hidden')
    uiChoices.classList.add('hidden')
    arcCamera.beta = Math.PI / 3.2
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
    uiCrosshair.classList.remove('hidden')
    uiChoices.classList.add('hidden')
    
    // Track first village visit
    if (!achievementSystem.isUnlocked('first-steps')) {
      achievementSystem.unlock('first-steps')
    }
    
    // Track region visits
    if (selectedTribe === 'Maasai') {
      saveSystem.visitRegion('kenya')
    } else if (selectedTribe === 'Egyptian') {
      saveSystem.visitRegion('egypt')
    } else {
      saveSystem.visitRegion('nigeria')
    }
    
    setTitle(`Nigeria - ${activeTribe}`, 'Festival of Unity: cultural preparation.')
    setHint('WASD to move. Click to look around, press E to interact.')
    updateMissionUI()
    setTutorial('WASD to move. Press E or use the action button near key spots.')
    setRecapVisible(false)
  }

  if (state === 'festival') {
    scene.activeCamera = walkCamera
    walkCamera.attachControl(canvas, true)
    uiCrosshair.classList.remove('hidden')
    uiChoices.classList.add('hidden')
    
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
}

uiChoices.querySelectorAll<HTMLButtonElement>('.choice').forEach((button) => {
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
  updateWalkMovement()
  if (state === 'village') {
    updateInteractions()
  }

  if (scene.activeCamera === arcCamera) {
    const lerp = 0.06
    arcCamera.setTarget(Vector3.Lerp(arcCamera.target, desiredTarget, lerp))
    arcCamera.radius = arcCamera.radius + (desiredRadius - arcCamera.radius) * lerp
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
  if ((state === 'village' || state === 'festival') && document.pointerLockElement !== canvas) {
    canvas.requestPointerLock()
  }
})

engine.runRenderLoop(() => {
  scene.render()
})

window.addEventListener('resize', () => {
  engine.resize()
})

setState('hub')
