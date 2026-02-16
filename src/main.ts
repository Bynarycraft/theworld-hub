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

const canvas = document.querySelector<HTMLCanvasElement>('#renderCanvas')
if (!canvas) {
  throw new Error('Missing renderCanvas element')
}

const engine = new Engine(canvas, true, { antialias: true })
const scene = new Scene(engine)

function requireElement<T extends HTMLElement>(selector: string) {
  const element = document.querySelector<T>(selector)
  if (!element) {
    throw new Error(`Missing element: ${selector}`)
  }
  return element
}

const uiTitle = requireElement<HTMLDivElement>('#uiTitle')
const uiSubtitle = requireElement<HTMLDivElement>('#uiSubtitle')
const uiObjective = requireElement<HTMLDivElement>('#uiObjective')
const uiProgress = requireElement<HTMLDivElement>('#uiProgress')
const uiHint = requireElement<HTMLDivElement>('#uiHint')
const uiAction = requireElement<HTMLButtonElement>('#uiAction')
const uiToast = requireElement<HTMLDivElement>('#uiToast')
const uiChoices = requireElement<HTMLDivElement>('#uiChoices')
const uiCrosshair = requireElement<HTMLDivElement>('#uiCrosshair')
const uiTutorial = requireElement<HTMLDivElement>('#uiTutorial')
const uiTutorialBody = requireElement<HTMLDivElement>('#uiTutorialBody')
const uiTutorialClose = requireElement<HTMLButtonElement>('#uiTutorialClose')
const uiRecap = requireElement<HTMLDivElement>('#uiRecap')
const uiRecapTitle = requireElement<HTMLDivElement>('#uiRecapTitle')
const uiRecapBody = requireElement<HTMLDivElement>('#uiRecapBody')
const uiRecapClose = requireElement<HTMLButtonElement>('#uiRecapClose')

let audioContext: AudioContext | null = null
let ambientOscillator: OscillatorNode | null = null
let ambientGain: GainNode | null = null
let audioEnabled = false

type GameState = 'hub' | 'africa' | 'nigeria' | 'village' | 'festival'
type Tribe = 'Igbo' | 'Yoruba' | 'Hausa'

let state: GameState = 'hub'
let selectedTribe: Tribe | null = null
let currentAction: (() => void) | null = null
let desiredTarget = new Vector3(0, 0, 0)
let desiredRadius = 16

const igboMission = {
  yamsCollected: 0,
  kolaCollected: 0,
  yamsNeeded: 5,
  kolaNeeded: 3,
  cookingStage: 0,
  cookingDone: false,
  delivered: false,
  storyStage: 0,
  storyDone: false,
}

const yorubaMission = {
  sticksCollected: 0,
  sticksNeeded: 2,
  rhythmHits: 0,
  rhythmNeeded: 5,
  rhythmActive: false,
  rhythmDone: false,
}

const hausaMission = {
  fabricCollected: 0,
  fabricNeeded: 3,
  flagsCollected: 0,
  flagsNeeded: 3,
  arranged: false,
}

function setAction(label: string | null, handler: (() => void) | null) {
  if (label && handler) {
    uiAction.textContent = label
    uiAction.classList.remove('hidden')
    currentAction = handler
  } else {
    uiAction.classList.add('hidden')
    uiAction.textContent = ''
    currentAction = null
  }
}

function setHint(text: string) {
  uiHint.textContent = text
}

function setObjective(text: string, progress = '') {
  uiObjective.textContent = text
  uiProgress.textContent = progress
}

function setTitle(title: string, subtitle: string) {
  uiTitle.textContent = title
  uiSubtitle.textContent = subtitle
}

function getActiveTribe() {
  return selectedTribe ?? 'Igbo'
}

function showToast(text: string) {
  uiToast.textContent = text
  uiToast.classList.remove('hidden')
  window.setTimeout(() => uiToast.classList.add('hidden'), 2200)
}

function enableAudio() {
  if (!audioContext) {
    audioContext = new AudioContext()
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume()
  }
  audioEnabled = true
  updateAmbientForState()
}

function playTone(frequency: number, duration = 0.12, type: OscillatorType = 'sine', volume = 0.05) {
  if (!audioContext || !audioEnabled) return
  const osc = audioContext.createOscillator()
  const gain = audioContext.createGain()
  osc.type = type
  osc.frequency.value = frequency
  gain.gain.value = volume
  osc.connect(gain)
  gain.connect(audioContext.destination)
  osc.start()
  gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + duration)
  osc.stop(audioContext.currentTime + duration)
}

function stopAmbient() {
  if (ambientOscillator) {
    ambientOscillator.stop()
    ambientOscillator.disconnect()
    ambientOscillator = null
  }
  if (ambientGain) {
    ambientGain.disconnect()
    ambientGain = null
  }
}

function startAmbient(frequency: number, type: OscillatorType, volume: number) {
  if (!audioContext || !audioEnabled) return
  stopAmbient()
  ambientOscillator = audioContext.createOscillator()
  ambientGain = audioContext.createGain()
  ambientOscillator.type = type
  ambientOscillator.frequency.value = frequency
  ambientGain.gain.value = volume
  ambientOscillator.connect(ambientGain)
  ambientGain.connect(audioContext.destination)
  ambientOscillator.start()
}

function updateAmbientForState() {
  if (!audioEnabled) return
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
  uiTutorialBody.textContent = text
}

function setRecapVisible(visible: boolean) {
  if (visible) {
    uiRecap.classList.remove('hidden')
  } else {
    uiRecap.classList.add('hidden')
  }
}

function showRecap(tribe: Tribe) {
  uiRecapTitle.textContent = `${tribe} Festival Recap`
  if (tribe === 'Igbo') {
    uiRecapBody.textContent = 'You gathered yams and kola nuts, prepared the feast, and honored the elders. The New Yam Festival celebrates harvest and gratitude.'
  } else if (tribe === 'Yoruba') {
    uiRecapBody.textContent = 'You collected drum sticks and completed the talking drum rhythm. The beats carry stories and connect the community.'
  } else {
    uiRecapBody.textContent = 'You prepared fabric and flags, then arranged the Durbar parade. The procession honors heritage, leadership, and unity.'
  }
  setRecapVisible(true)
}

uiTutorialClose.addEventListener('click', () => {
  uiTutorial.style.display = 'none'
})

uiRecapClose.addEventListener('click', () => {
  setRecapVisible(false)
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
walkCamera.speed = 0.35
walkCamera.angularSensibility = 4000
walkCamera.minZ = 0.1
walkCamera.keysUp.push(87)
walkCamera.keysDown.push(83)
walkCamera.keysLeft.push(65)
walkCamera.keysRight.push(68)

scene.activeCamera = arcCamera

const sharedRoot = new TransformNode('sharedRoot', scene)
const hubMarkersRoot = new TransformNode('hubMarkersRoot', scene)
const africaMarkersRoot = new TransformNode('africaMarkersRoot', scene)
const nigeriaRoot = new TransformNode('nigeriaRoot', scene)
const villageRoot = new TransformNode('villageRoot', scene)
const igboRoot = new TransformNode('igboRoot', scene)
const yorubaRoot = new TransformNode('yorubaRoot', scene)
const hausaRoot = new TransformNode('hausaRoot', scene)
const festivalRoot = new TransformNode('festivalRoot', scene)

igboRoot.parent = villageRoot
yorubaRoot.parent = villageRoot
hausaRoot.parent = villageRoot

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
  resetTribeMission('Igbo')
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
}

resetIgboCollectibles()
resetYorubaCollectibles()
resetHausaCollectibles()

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

function setState(next: GameState) {
  state = next
  const activeTribe = getActiveTribe()

  hubMarkersRoot.setEnabled(state === 'hub')
  africaMarkersRoot.setEnabled(state === 'africa')
  sharedRoot.setEnabled(state === 'hub' || state === 'africa')
  villageRoot.setEnabled(state === 'village' || state === 'festival')
  festivalRoot.setEnabled(state === 'festival')
  nigeriaRoot.setEnabled(state === 'nigeria')
  igboRoot.setEnabled(state === 'village' || state === 'festival' ? activeTribe === 'Igbo' : false)
  yorubaRoot.setEnabled(state === 'village' || state === 'festival' ? activeTribe === 'Yoruba' : false)
  hausaRoot.setEnabled(state === 'village' || state === 'festival' ? activeTribe === 'Hausa' : false)

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

  if (state === 'village') {
    scene.activeCamera = walkCamera
    walkCamera.attachControl(canvas, true)
    uiCrosshair.classList.remove('hidden')
    uiChoices.classList.add('hidden')
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

  if (activeTribe === 'Igbo') {
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

    if (activeTribe === 'Igbo') {
      if (yamMeshes.includes(pickedMesh)) {
        pickedMesh.dispose()
        igboMission.yamsCollected += 1
        updateMissionUI()
        showToast('Yam collected')
        playTone(520, 0.12, 'triangle', 0.05)
        if (igboMission.yamsCollected >= igboMission.yamsNeeded && igboMission.kolaCollected >= igboMission.kolaNeeded) {
          showToast('All ingredients collected')
          playTone(740, 0.18, 'triangle', 0.05)
        }
      }

      if (kolaMeshes.includes(pickedMesh)) {
        pickedMesh.dispose()
        igboMission.kolaCollected += 1
        updateMissionUI()
        showToast('Kola nut collected')
        playTone(560, 0.12, 'triangle', 0.05)
        if (igboMission.yamsCollected >= igboMission.yamsNeeded && igboMission.kolaCollected >= igboMission.kolaNeeded) {
          showToast('All ingredients collected')
          playTone(740, 0.18, 'triangle', 0.05)
        }
      }

      if (storyStones.includes(pickedMesh) && !igboMission.storyDone && igboMission.storyStage > 0) {
        const symbol = metadata?.symbol
        const expected = storySymbols[igboMission.storyStage - 1]
        if (symbol === expected) {
          igboMission.storyStage += 1
          showToast(`Story stone: ${symbol}`)
          if (igboMission.storyStage > storySymbols.length) {
            igboMission.storyDone = true
            setHint('Arochukwu stories speak of unity and sacred heritage.')
            setAction(null, null)
            playTone(820, 0.2, 'sine', 0.06)
          }
        } else {
          igboMission.storyStage = 1
          showToast('The story resets. Try the first symbol again.')
          playTone(220, 0.12, 'sine', 0.04)
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
      }
    }

    if (activeTribe === 'Hausa') {
      if (fabricMeshes.includes(pickedMesh)) {
        pickedMesh.dispose()
        hausaMission.fabricCollected += 1
        updateMissionUI()
        showToast('Fabric collected')
        playTone(480, 0.12, 'triangle', 0.05)
      }

      if (flagMeshes.includes(pickedMesh)) {
        pickedMesh.dispose()
        hausaMission.flagsCollected += 1
        updateMissionUI()
        showToast('Flag collected')
        playTone(500, 0.12, 'triangle', 0.05)
      }
    }
  }
})

function updateInteractions() {
  if (state !== 'village') return

  const activeTribe = getActiveTribe()
  const playerPos = walkCamera.position

  if (activeTribe === 'Igbo') {
    if (igboMission.cookingStage > 0 && !igboMission.cookingDone) {
      return
    }

    const distanceToCooking = Vector3.Distance(playerPos, cookingStation.position)
    const distanceToElder = Vector3.Distance(playerPos, elder.position)
    const distanceToStory = Vector3.Distance(playerPos, storyCircle.position)

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
        setState('festival')
      })
      return
    }

    if (!igboMission.storyDone && igboMission.storyStage === 0 && distanceToStory < 5) {
      setAction('Start story puzzle', () => {
        igboMission.storyStage = 1
        setHint('Tap the stones in this order: Moon, River, Mask.')
        setAction(null, null)
      })
      return
    }
  }

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
          showToast('Parade is ready')
          playTone(760, 0.18, 'sine', 0.06)
          setState('festival')
        })
        return
      }
    }
  }

  setAction(null, null)
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

scene.onBeforeRenderObservable.add(() => {
  globe.rotation.y += 0.0006
  if (state === 'village') {
    updateInteractions()
  }

  if (scene.activeCamera === arcCamera) {
    const lerp = 0.06
    arcCamera.setTarget(Vector3.Lerp(arcCamera.target, desiredTarget, lerp))
    arcCamera.radius = arcCamera.radius + (desiredRadius - arcCamera.radius) * lerp
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
