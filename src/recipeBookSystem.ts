// Cultural recipe books system

import type { Tribe } from './types'

export interface RecipeBook {
  id: string
  title: string
  region: string
  tribe: Tribe
  dishName: string
  ingredients: string[]
  steps: string[]
  unlocked: boolean
  unlockedAt?: number
}

export class RecipeBookSystem {
  private recipes: Map<string, RecipeBook> = new Map()
  private unlocked: Set<string> = new Set()
  private listeners: Array<(recipe: RecipeBook) => void> = []

  constructor() {
    this.initializeRecipes()
  }

  private initializeRecipes(): void {
    const definitions: RecipeBook[] = [
      {
        id: 'igbo-jollof-rice',
        title: 'Igbo Festival Kitchen',
        region: 'Nigeria',
        tribe: 'Igbo',
        dishName: 'Jollof Rice (Festival Style)',
        ingredients: ['Rice', 'Tomatoes', 'Pepper', 'Onion', 'Stock', 'Oil'],
        steps: [
          'Blend tomatoes, pepper, and onion into a smooth base.',
          'Cook the base with oil and stock until reduced and aromatic.',
          'Add washed rice and simmer covered until fluffy and flavorful.',
        ],
        unlocked: false,
      },
      {
        id: 'yoruba-amala-ewedu',
        title: 'Yoruba Heritage Recipe',
        region: 'Nigeria',
        tribe: 'Yoruba',
        dishName: 'Amala with Ewedu',
        ingredients: ['Yam flour', 'Ewedu leaves', 'Locust beans', 'Seasoning'],
        steps: [
          'Whisk yam flour into hot water until smooth and thick.',
          'Blend and simmer ewedu leaves with seasonings for a silky soup.',
          'Serve amala hot with ewedu and preferred stew pairing.',
        ],
        unlocked: false,
      },
      {
        id: 'hausa-tuwo',
        title: 'Hausa Culinary Traditions',
        region: 'Nigeria',
        tribe: 'Hausa',
        dishName: 'Tuwo Shinkafa',
        ingredients: ['Soft rice', 'Water', 'Leafy soup or stew'],
        steps: [
          'Cook soft rice in plenty of water until very tender.',
          'Mash and stir continuously to form a smooth, stretchy dough.',
          'Shape portions and serve with miyan kuka or vegetable soup.',
        ],
        unlocked: false,
      },
      {
        id: 'maasai-mursik',
        title: 'Maasai Nourishment Guide',
        region: 'Kenya',
        tribe: 'Maasai',
        dishName: 'Mursik (Fermented Milk)',
        ingredients: ['Fresh milk', 'Smoked gourd container', 'Starter culture'],
        steps: [
          'Prepare and smoke the gourd to impart traditional flavor.',
          'Pour fresh milk and add starter culture.',
          'Ferment for 1–2 days until tangy and lightly thickened.',
        ],
        unlocked: false,
      },
      {
        id: 'egyptian-koshari',
        title: 'Egyptian Street Classics',
        region: 'Egypt',
        tribe: 'Egyptian',
        dishName: 'Koshari',
        ingredients: ['Rice', 'Lentils', 'Pasta', 'Tomato sauce', 'Crispy onions'],
        steps: [
          'Cook rice and lentils separately until tender.',
          'Prepare pasta and rich tomato-garlic sauce.',
          'Layer rice, lentils, pasta, sauce, and crispy onions.',
        ],
        unlocked: false,
      },
      {
        id: 'berber-tagine',
        title: 'Berber Mountain Kitchen',
        region: 'Morocco',
        tribe: 'Berber',
        dishName: 'Vegetable Tagine',
        ingredients: ['Carrot', 'Potato', 'Zucchini', 'Tomato', 'Cumin', 'Saffron'],
        steps: [
          'Layer vegetables in a tagine pot with oil and spices.',
          'Add a small amount of water and cook slowly over low heat.',
          'Serve when vegetables are tender and sauce is concentrated.',
        ],
        unlocked: false,
      },
      {
        id: 'zulu-phuthu',
        title: 'Zulu Home Cooking',
        region: 'South Africa',
        tribe: 'Zulu',
        dishName: 'Phuthu (Maize Crumble)',
        ingredients: ['Maize meal', 'Water', 'Salt'],
        steps: [
          'Steam maize meal gently while stirring to avoid clumps.',
          'Add water gradually and cook to a dry, crumbly texture.',
          'Serve with stew, amasi, or leafy relish.',
        ],
        unlocked: false,
      },
      {
        id: 'xhosa-umngqusho',
        title: 'Xhosa Community Meals',
        region: 'South Africa',
        tribe: 'Xhosa',
        dishName: 'Umngqusho',
        ingredients: ['Samp', 'Beans', 'Onion', 'Butter or oil', 'Salt'],
        steps: [
          'Soak samp and beans overnight for even cooking.',
          'Boil slowly until soft and creamy.',
          'Finish with sautéed onion and seasoning before serving.',
        ],
        unlocked: false,
      },
      {
        id: 'amhara-injera',
        title: 'Amhara Table Traditions',
        region: 'Ethiopia',
        tribe: 'Amhara',
        dishName: 'Injera',
        ingredients: ['Teff flour', 'Water', 'Starter culture'],
        steps: [
          'Mix teff flour and water and ferment until lightly sour.',
          'Pour batter in spirals onto a hot flat griddle.',
          'Cover briefly, steam-cook, and cool before stacking.',
        ],
        unlocked: false,
      },
      {
        id: 'oromo-buna-qalaa',
        title: 'Oromo Ritual Flavors',
        region: 'Ethiopia',
        tribe: 'Oromo',
        dishName: 'Buna Qalaa',
        ingredients: ['Coffee beans', 'Clarified butter', 'Spices'],
        steps: [
          'Roast coffee beans until aromatic and dark.',
          'Grind beans and mix with clarified butter.',
          'Blend into a smooth paste and serve ceremonially.',
        ],
        unlocked: false,
      },
      {
        id: 'indian-masala-chai',
        title: 'Indian Home Kitchen',
        region: 'India',
        tribe: 'Indian',
        dishName: 'Masala Chai',
        ingredients: ['Black tea', 'Milk', 'Cardamom', 'Ginger', 'Cinnamon', 'Sugar'],
        steps: [
          'Crush spices and simmer them in water for aroma extraction.',
          'Add tea leaves and milk, then boil briefly until rich and fragrant.',
          'Strain into cups and sweeten to taste before serving hot.',
        ],
        unlocked: false,
      },
      {
        id: 'chinese-vegetable-stirfry',
        title: 'Chinese Wok Traditions',
        region: 'China',
        tribe: 'Chinese',
        dishName: 'Vegetable Stir-Fry',
        ingredients: ['Mixed vegetables', 'Garlic', 'Ginger', 'Soy sauce', 'Sesame oil'],
        steps: [
          'Heat a wok until very hot and add oil with garlic and ginger.',
          'Stir-fry vegetables quickly to preserve texture and color.',
          'Season with soy sauce and finish with a light sesame oil drizzle.',
        ],
        unlocked: false,
      },
      {
        id: 'japanese-miso-soup',
        title: 'Japanese Seasonal Table',
        region: 'Japan',
        tribe: 'Japanese',
        dishName: 'Miso Soup',
        ingredients: ['Dashi broth', 'Miso paste', 'Tofu', 'Seaweed', 'Scallions'],
        steps: [
          'Warm dashi broth gently without rapid boiling.',
          'Dissolve miso paste in a ladle of broth, then return it to the pot.',
          'Add tofu and seaweed, then finish with sliced scallions before serving.',
        ],
        unlocked: false,
      },
    ]

    definitions.forEach(recipe => {
      this.recipes.set(recipe.id, recipe)
    })
  }

  onUnlock(callback: (recipe: RecipeBook) => void): void {
    this.listeners.push(callback)
  }

  unlock(recipeId: string): boolean {
    if (this.unlocked.has(recipeId)) {
      return false
    }

    const recipe = this.recipes.get(recipeId)
    if (!recipe) {
      return false
    }

    recipe.unlocked = true
    recipe.unlockedAt = Date.now()
    this.unlocked.add(recipeId)
    this.listeners.forEach(listener => listener(recipe))
    return true
  }

  unlockForTribe(tribe: Tribe): RecipeBook | null {
    const recipe = Array.from(this.recipes.values()).find(item => item.tribe === tribe)
    if (!recipe) {
      return null
    }

    const wasUnlocked = this.unlock(recipe.id)
    return wasUnlocked ? recipe : null
  }

  getAll(): RecipeBook[] {
    return Array.from(this.recipes.values())
  }

  getUnlockedIds(): string[] {
    return Array.from(this.unlocked)
  }

  loadUnlocked(unlockedIds: string[]): void {
    unlockedIds.forEach(id => {
      const recipe = this.recipes.get(id)
      if (recipe) {
        recipe.unlocked = true
        this.unlocked.add(id)
      }
    })
  }

  getProgress(): { unlocked: number; total: number; percentage: number } {
    const total = this.recipes.size
    const unlocked = this.unlocked.size
    return {
      unlocked,
      total,
      percentage: Math.round((unlocked / total) * 100),
    }
  }
}

export const recipeBookSystem = new RecipeBookSystem()
