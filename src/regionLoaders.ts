import {
  Color3,
  DynamicTexture,
  Mesh,
  MeshBuilder,
  Scene,
  StandardMaterial,
  TransformNode,
  Vector3,
} from '@babylonjs/core'

/**
 * Lazy-loaded region loader module
 * Manages deferred creation and setup of region meshes to reduce startup load
 */

type RegionLoaderMap = {
  [key: string]: () => Promise<void>
}

const regionLoaders: RegionLoaderMap = {}
const loadedRegions = new Set<string>()

/**
 * Register a region loader function
 */
export function registerRegionLoader(regionName: string, loaderFn: () => Promise<void>) {
  regionLoaders[regionName] = loaderFn
}

/**
 * Load a region's meshes on-demand
 */
export async function loadRegion(regionName: string) {
  if (loadedRegions.has(regionName)) {
    return // Already loaded
  }

  const loader = regionLoaders[regionName]
  if (!loader) {
    console.warn(`No loader registered for region: ${regionName}`)
    return
  }

  try {
    await loader()
    loadedRegions.add(regionName)
  } catch (error) {
    console.error(`Failed to load region ${regionName}:`, error)
  }
}

/**
 * Check if a region has been loaded
 */
export function isRegionLoaded(regionName: string): boolean {
  return loadedRegions.has(regionName)
}

/**
 * Create a custom DynamicTexture for a map
 */
export function createMapTexture(
  name: string,
  size: number,
  drawFn: (ctx: CanvasRenderingContext2D, width: number, height: number) => void,
  scene: Scene
): DynamicTexture {
  const texture = new DynamicTexture(`${name}-texture`, { width: size, height: size }, scene, false)
  const ctx = texture.getContext() as CanvasRenderingContext2D
  drawFn(ctx, size, size)
  texture.update()
  return texture
}

/**
 * Create a tribe marker sphere with label
 */
export function createTribeMarkerMesh(
  name: string,
  color: Color3,
  position: Vector3,
  parent: TransformNode,
  scene: Scene
): Mesh {
  const marker = MeshBuilder.CreateSphere(`${name}-tribe`, { diameter: 0.6 }, scene)
  marker.position = position
  const mat = new StandardMaterial(`${name}-tribe-mat`, scene)
  mat.diffuseColor = color
  mat.emissiveColor = color.scale(0.3)
  marker.material = mat
  marker.parent = parent
  return marker
}

/**
 * Create a label plane above a position
 */
export function createLabelMesh(
  text: string,
  position: Vector3,
  parent: TransformNode,
  scene: Scene,
  bgColor = '#3a3a3a'
): Mesh {
  const scale = text.length > 10 ? 1.2 : 1
  const plane = MeshBuilder.CreatePlane(`labelPlane-${text}`, { width: 3.0 * scale, height: 1.5 * scale }, scene)
  plane.position = position

  const texture = new DynamicTexture(`labelTexture-${text}`, { width: 512, height: 256 }, scene, false)
  const ctx = texture.getContext() as CanvasRenderingContext2D

  ctx.fillStyle = bgColor
  ctx.fillRect(0, 0, 512, 256)

  ctx.fillStyle = '#fff'
  ctx.font = 'bold 48px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, 256, 128)

  texture.update()

  const mat = new StandardMaterial(`labelMat-${text}`, scene)
  mat.emissiveTexture = texture
  mat.backFaceCulling = false
  plane.material = mat
  plane.parent = parent

  return plane
}

/**
 * Create a hut mesh at a given position
 */
export function createHutMesh(position: Vector3, parent: TransformNode, scene: Scene): TransformNode {
  const hutGroup = new TransformNode(`hut-${position.x}-${position.z}`, scene)
  hutGroup.position = position
  hutGroup.parent = parent

  const base = MeshBuilder.CreateBox('hutBase', { width: 3, height: 2, depth: 3 }, scene)
  const baseMat = new StandardMaterial('hutBaseMat', scene)
  baseMat.diffuseColor = new Color3(0.7, 0.52, 0.34)
  base.material = baseMat
  base.parent = hutGroup
  base.position.y = 1

  const roof = MeshBuilder.CreateCylinder('hutRoof', { diameter: 3.5, height: 2.2 }, scene)
  const roofMat = new StandardMaterial('hutRoofMat', scene)
  roofMat.diffuseColor = new Color3(0.5, 0.2, 0.1)
  roof.material = roofMat
  roof.parent = hutGroup
  roof.position.y = 2

  const door = MeshBuilder.CreateBox('hutDoor', { width: 0.8, height: 1.6, depth: 0.1 }, scene)
  const doorMat = new StandardMaterial('hutDoorMat', scene)
  doorMat.diffuseColor = new Color3(0.4, 0.25, 0.1)
  door.material = doorMat
  door.parent = hutGroup
  door.position = new Vector3(0, 0.8, 1.5)

  return hutGroup
}

/**
 * Create an NPC character mesh
 */
export function createNpcMesh(name: string, position: Vector3, color: Color3, parent: TransformNode, scene: Scene): TransformNode {
  const npcGroup = new TransformNode(`npc-${name}`, scene)
  npcGroup.position = position
  npcGroup.parent = parent

  const head = MeshBuilder.CreateSphere('npcHead', { diameter: 0.6 }, scene)
  head.position.y = 1.5
  const headMat = new StandardMaterial('npcHeadMat', scene)
  headMat.diffuseColor = color
  head.material = headMat
  head.parent = npcGroup

  const body = MeshBuilder.CreateBox('npcBody', { width: 0.5, height: 1, depth: 0.3 }, scene)
  body.position.y = 0.8
  const bodyMat = new StandardMaterial('npcBodyMat', scene)
  bodyMat.diffuseColor = color.scale(0.8)
  body.material = bodyMat
  body.parent = npcGroup

  return npcGroup
}

/**
 * Create village ground mesh
 */
export function createVillageGroundMesh(parent: TransformNode, scene: Scene): Mesh {
  const ground = MeshBuilder.CreateGround('villageGround', { width: 80, height: 80 }, scene)
  ground.position = new Vector3(0, 0, 0)
  ground.parent = parent

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

  return ground
}
