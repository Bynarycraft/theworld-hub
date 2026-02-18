// UI management module

export class UIManager {
  private elements: Map<string, HTMLElement> = new Map()

  constructor() {
    this.initializeElements()
  }

  private initializeElements(): void {
    const elementIds = [
      'uiTitle',
      'uiSubtitle',
      'uiObjective',
      'uiProgress',
      'uiHint',
      'uiAction',
      'uiToast',
      'uiChoices',
      'uiCrosshair',
      'uiTutorial',
      'uiTutorialBody',
      'uiTutorialClose',
      'uiRecap',
      'uiRecapTitle',
      'uiRecapBody',
      'uiRecapClose',
      'uiCulturalPopup',
      'uiCulturalTitle',
      'uiCulturalSubtitle',
      'uiCulturalBody',
      'uiCulturalClose',
      'btnAchievements',
      'uiAchievements',
      'achievementProgress',
      'achievementsList',
      'btnCloseAchievements',
      'btnFactCards',
      'uiFactCards',
      'factCardProgress',
      'factCardsList',
      'btnCloseFactCards',
      'btnLessons',
      'uiLessons',
      'lessonProgress',
      'lessonsList',
      'btnCloseLessons',
      'btnTimelines',
      'uiTimelines',
      'timelineProgress',
      'timelinesList',
      'btnCloseTimelines',
      'btnRecipes',
      'uiRecipes',
      'recipeProgress',
      'recipesList',
      'btnCloseRecipes',
    ]

    elementIds.forEach(id => {
      const element = document.querySelector<HTMLElement>(`#${id}`)
      if (!element) {
        throw new Error(`Missing UI element: #${id}`)
      }
      this.elements.set(id, element)
    })
  }

  get(id: string): HTMLElement {
    const element = this.elements.get(id)
    if (!element) {
      throw new Error(`UI element not found: ${id}`)
    }
    return element
  }

  setTitle(text: string): void {
    this.get('uiTitle').textContent = text
  }

  setSubtitle(text: string): void {
    this.get('uiSubtitle').textContent = text
  }

  setObjective(text: string): void {
    this.get('uiObjective').textContent = text
  }

  setProgress(text: string): void {
    this.get('uiProgress').textContent = text
  }

  setHint(text: string): void {
    this.get('uiHint').textContent = text
  }

  showToast(message: string, duration = 2000): void {
    const toast = this.get('uiToast')
    toast.textContent = message
    toast.classList.add('show')
    setTimeout(() => {
      toast.classList.remove('show')
    }, duration)
  }

  showCulturalPopup(title: string, subtitle: string, body: string): void {
    const popup = this.get('uiCulturalPopup')
    this.get('uiCulturalTitle').textContent = title
    this.get('uiCulturalSubtitle').textContent = subtitle
    this.get('uiCulturalBody').textContent = body
    popup.classList.add('show')
  }

  hideCulturalPopup(): void {
    this.get('uiCulturalPopup').classList.remove('show')
  }

  showTutorial(body: string): void {
    const tutorial = this.get('uiTutorial')
    this.get('uiTutorialBody').textContent = body
    tutorial.classList.add('show')
  }

  hideTutorial(): void {
    this.get('uiTutorial').classList.remove('show')
  }

  showRecap(title: string, body: string): void {
    const recap = this.get('uiRecap')
    this.get('uiRecapTitle').textContent = title
    this.get('uiRecapBody').textContent = body
    recap.classList.add('show')
  }

  hideRecap(): void {
    this.get('uiRecap').classList.remove('show')
  }

  showCrosshair(): void {
    this.get('uiCrosshair').classList.add('show')
  }

  hideCrosshair(): void {
    this.get('uiCrosshair').classList.remove('show')
  }

  setActionButton(text: string, onClick: () => void): void {
    const button = this.get('uiAction') as HTMLButtonElement
    button.textContent = text
    button.onclick = onClick
    button.classList.add('show')
  }

  hideActionButton(): void {
    const button = this.get('uiAction')
    button.classList.remove('show')
    button.onclick = null
  }

  clearChoices(): void {
    this.get('uiChoices').innerHTML = ''
  }

  addChoice(text: string, onClick: () => void): void {
    const choices = this.get('uiChoices')
    const button = document.createElement('button')
    button.textContent = text
    button.className = 'choice-button'
    button.onclick = onClick
    choices.appendChild(button)
  }

  showAchievement(title: string, description: string, icon: string): void {
    const container = document.createElement('div')
    container.className = 'achievement-notification'
    container.innerHTML = `
      <div class="achievement-icon">${icon}</div>
      <div class="achievement-content">
        <div class="achievement-title">🏆 ${title}</div>
        <div class="achievement-description">${description}</div>
      </div>
    `
    document.body.appendChild(container)

    setTimeout(() => container.classList.add('show'), 100)
    setTimeout(() => {
      container.classList.remove('show')
      setTimeout(() => container.remove(), 300)
    }, 4000)
  }

  setupCloseHandlers(
    onTutorialClose: () => void,
    onRecapClose: () => void,
    onCulturalClose: () => void
  ): void {
    this.get('uiTutorialClose').onclick = onTutorialClose
    this.get('uiRecapClose').onclick = onRecapClose
    this.get('uiCulturalClose').onclick = onCulturalClose
  }

  setupAchievementsGallery(onOpen: () => void): void {
    this.get('btnAchievements').onclick = () => {
      this.toggleAchievementsGallery()
      onOpen()
    }
    this.get('btnCloseAchievements').onclick = () => {
      this.hideAchievementsGallery()
    }
  }

  setupFactCardsGallery(onOpen: () => void): void {
    this.get('btnFactCards').onclick = () => {
      this.toggleFactCardsGallery()
      onOpen()
    }
    this.get('btnCloseFactCards').onclick = () => {
      this.hideFactCardsGallery()
    }
  }

  setupLessonsGallery(onOpen: () => void): void {
    this.get('btnLessons').onclick = () => {
      this.toggleLessonsGallery()
      onOpen()
    }
    this.get('btnCloseLessons').onclick = () => {
      this.hideLessonsGallery()
    }
  }

  setupTimelinesGallery(onOpen: () => void): void {
    this.get('btnTimelines').onclick = () => {
      this.toggleTimelinesGallery()
      onOpen()
    }
    this.get('btnCloseTimelines').onclick = () => {
      this.hideTimelinesGallery()
    }
  }

  setupRecipesGallery(onOpen: () => void): void {
    this.get('btnRecipes').onclick = () => {
      this.toggleRecipesGallery()
      onOpen()
    }
    this.get('btnCloseRecipes').onclick = () => {
      this.hideRecipesGallery()
    }
  }

  toggleAchievementsGallery(): void {
    const gallery = this.get('uiAchievements')
    gallery.classList.toggle('hidden')
  }

  showAchievementsGallery(): void {
    this.get('uiAchievements').classList.remove('hidden')
  }

  hideAchievementsGallery(): void {
    this.get('uiAchievements').classList.add('hidden')
  }

  toggleFactCardsGallery(): void {
    const gallery = this.get('uiFactCards')
    gallery.classList.toggle('hidden')
  }

  showFactCardsGallery(): void {
    this.get('uiFactCards').classList.remove('hidden')
  }

  hideFactCardsGallery(): void {
    this.get('uiFactCards').classList.add('hidden')
  }

  toggleLessonsGallery(): void {
    const gallery = this.get('uiLessons')
    gallery.classList.toggle('hidden')
  }

  showLessonsGallery(): void {
    this.get('uiLessons').classList.remove('hidden')
  }

  hideLessonsGallery(): void {
    this.get('uiLessons').classList.add('hidden')
  }

  toggleTimelinesGallery(): void {
    const gallery = this.get('uiTimelines')
    gallery.classList.toggle('hidden')
  }

  showTimelinesGallery(): void {
    this.get('uiTimelines').classList.remove('hidden')
  }

  hideTimelinesGallery(): void {
    this.get('uiTimelines').classList.add('hidden')
  }

  toggleRecipesGallery(): void {
    const gallery = this.get('uiRecipes')
    gallery.classList.toggle('hidden')
  }

  showRecipesGallery(): void {
    this.get('uiRecipes').classList.remove('hidden')
  }

  hideRecipesGallery(): void {
    this.get('uiRecipes').classList.add('hidden')
  }

  updateAchievementsGallery(achievements: any[], progress: { unlocked: number; total: number; percentage: number }): void {
    const progressEl = this.get('achievementProgress')
    progressEl.textContent = `${progress.unlocked} / ${progress.total} Unlocked (${progress.percentage}%)`

    const listEl = this.get('achievementsList')
    listEl.innerHTML = ''

    achievements.forEach(ach => {
      const item = document.createElement('div')
      item.className = `achievement-item ${ach.unlocked ? 'unlocked' : 'locked'}`
      
      item.innerHTML = `
        <div class="achievement-item-icon">${ach.icon}</div>
        <div class="achievement-item-content">
          <div class="achievement-item-title">${ach.unlocked ? ach.title : '???'}</div>
          <div class="achievement-item-description">${ach.unlocked ? ach.description : 'Locked - Complete tasks to unlock'}</div>
        </div>
        ${ach.unlocked ? '<div class="achievement-badge">Unlocked</div>' : ''}
      `
      
      listEl.appendChild(item)
    })
  }

  updateFactCardsGallery(cards: Array<{ title: string; region: string; body: string; unlocked: boolean }>, progress: { unlocked: number; total: number; percentage: number }): void {
    const progressEl = this.get('factCardProgress')
    progressEl.textContent = `${progress.unlocked} / ${progress.total} Collected (${progress.percentage}%)`

    const listEl = this.get('factCardsList')
    listEl.innerHTML = ''

    cards.forEach(card => {
      const item = document.createElement('div')
      item.className = `achievement-item ${card.unlocked ? 'unlocked' : 'locked'}`

      item.innerHTML = `
        <div class="achievement-item-icon">${card.unlocked ? '📖' : '🔒'}</div>
        <div class="achievement-item-content">
          <div class="achievement-item-title">${card.unlocked ? card.title : 'Unknown Cultural Insight'}</div>
          <div class="achievement-item-description">${card.unlocked ? `${card.region}: ${card.body}` : 'Locked - Visit more regions and tribes to discover this fact card.'}</div>
        </div>
        ${card.unlocked ? '<div class="achievement-badge">Collected</div>' : ''}
      `

      listEl.appendChild(item)
    })
  }

  updateLessonsGallery(
    lessons: Array<{ title: string; region: string; phrase: string; pronunciation: string; meaning: string; unlocked: boolean }>,
    progress: { unlocked: number; total: number; percentage: number }
  ): void {
    const progressEl = this.get('lessonProgress')
    progressEl.textContent = `${progress.unlocked} / ${progress.total} Learned (${progress.percentage}%)`

    const listEl = this.get('lessonsList')
    listEl.innerHTML = ''

    lessons.forEach(lesson => {
      const item = document.createElement('div')
      item.className = `achievement-item ${lesson.unlocked ? 'unlocked' : 'locked'}`

      item.innerHTML = `
        <div class="achievement-item-icon">${lesson.unlocked ? '🗣️' : '🔒'}</div>
        <div class="achievement-item-content">
          <div class="achievement-item-title">${lesson.unlocked ? lesson.title : 'Unknown Lesson'}</div>
          <div class="achievement-item-description">${lesson.unlocked ? `${lesson.region}: ${lesson.phrase} (${lesson.pronunciation}) — ${lesson.meaning}` : 'Locked - Visit this culture to unlock the lesson.'}</div>
        </div>
        ${lesson.unlocked ? '<div class="achievement-badge">Learned</div>' : ''}
      `

      listEl.appendChild(item)
    })
  }

  updateTimelinesGallery(
    timelines: Array<{ title: string; region: string; entries: Array<{ yearLabel: string; event: string }>; unlocked: boolean }>,
    progress: { unlocked: number; total: number; percentage: number }
  ): void {
    const progressEl = this.get('timelineProgress')
    progressEl.textContent = `${progress.unlocked} / ${progress.total} Collected (${progress.percentage}%)`

    const listEl = this.get('timelinesList')
    listEl.innerHTML = ''

    timelines.forEach(timeline => {
      const item = document.createElement('div')
      item.className = `achievement-item ${timeline.unlocked ? 'unlocked' : 'locked'}`

      const timelineText = timeline.entries
        .map(entry => `${entry.yearLabel}: ${entry.event}`)
        .join(' · ')

      item.innerHTML = `
        <div class="achievement-item-icon">${timeline.unlocked ? '🕰️' : '🔒'}</div>
        <div class="achievement-item-content">
          <div class="achievement-item-title">${timeline.unlocked ? timeline.title : 'Unknown Timeline'}</div>
          <div class="achievement-item-description">${timeline.unlocked ? `${timeline.region}: ${timelineText}` : 'Locked - Visit this culture to unlock its timeline.'}</div>
        </div>
        ${timeline.unlocked ? '<div class="achievement-badge">Collected</div>' : ''}
      `

      listEl.appendChild(item)
    })
  }

  updateRecipesGallery(
    recipes: Array<{ title: string; region: string; dishName: string; ingredients: string[]; steps: string[]; unlocked: boolean }>,
    progress: { unlocked: number; total: number; percentage: number }
  ): void {
    const progressEl = this.get('recipeProgress')
    progressEl.textContent = `${progress.unlocked} / ${progress.total} Collected (${progress.percentage}%)`

    const listEl = this.get('recipesList')
    listEl.innerHTML = ''

    recipes.forEach(recipe => {
      const item = document.createElement('div')
      item.className = `achievement-item ${recipe.unlocked ? 'unlocked' : 'locked'}`

      const previewIngredients = recipe.ingredients.slice(0, 4).join(', ')
      const previewSteps = recipe.steps.slice(0, 2).join(' → ')

      item.innerHTML = `
        <div class="achievement-item-icon">${recipe.unlocked ? '🍲' : '🔒'}</div>
        <div class="achievement-item-content">
          <div class="achievement-item-title">${recipe.unlocked ? `${recipe.title} · ${recipe.dishName}` : 'Unknown Recipe Book'}</div>
          <div class="achievement-item-description">${recipe.unlocked ? `${recipe.region}: Ingredients (${previewIngredients}). Steps: ${previewSteps}.` : 'Locked - Visit this culture to unlock its recipe book.'}</div>
        </div>
        ${recipe.unlocked ? '<div class="achievement-badge">Collected</div>' : ''}
      `

      listEl.appendChild(item)
    })
  }
}

export const uiManager = new UIManager()
