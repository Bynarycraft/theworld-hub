import type { Scene } from '@babylonjs/core'
import { Texture } from '@babylonjs/core'

const textureCache = new Map<string, Texture>()

export async function loadTexture(scene: Scene, url: string): Promise<Texture> {
  const cached = textureCache.get(url)
  if (cached) {
    return cached
  }

  return new Promise<Texture>((resolve, reject) => {
    const texture = new Texture(
      url,
      scene,
      false,
      true,
      undefined,
      () => {
        textureCache.set(url, texture)
        resolve(texture)
      },
      (message, exception) => {
        reject(new Error(message || exception?.message || `Failed to load texture: ${url}`))
      }
    )
  })
}

export async function preloadTextures(scene: Scene, urls: string[]): Promise<void> {
  await Promise.all(
    urls.map(async (url) => {
      try {
        await loadTexture(scene, url)
      } catch {
        // Ignore individual preload failures
      }
    })
  )
}
