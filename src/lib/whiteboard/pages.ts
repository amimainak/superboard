import type { WhiteboardEngine, CanvasSnapshot } from './engine'
import { v4 as uuidv4 } from 'uuid'

export interface Page {
  id: string
  name: string
  order: number
  snapshot: CanvasSnapshot | null
}

export class PageManager {
  private engine: WhiteboardEngine
  private pages: Page[] = []
  private currentPageId: string = ''
  private maxPages = 50

  onPageChange?: (page: Page) => void
  onPagesListChange?: (pages: Page[]) => void

  constructor(engine: WhiteboardEngine) {
    this.engine = engine
  }

  addPage(name?: string): Page {
    if (this.pages.length >= this.maxPages) {
      throw new Error(`Maximum ${this.maxPages} pages allowed`)
    }
    const page: Page = {
      id: uuidv4(),
      name: name || `Page ${this.pages.length + 1}`,
      order: this.pages.length,
      snapshot: null,
    }
    this.pages.push(page)
    this.onPagesListChange?.(this.pages)
    return page
  }

  deletePage(id: string) {
    if (this.pages.length <= 1) return // Keep at least one page
    const idx = this.pages.findIndex((p) => p.id === id)
    if (idx === -1) return

    // Save current page before deleting
    if (this.currentPageId === id) {
      this.saveCurrentPage()
    }

    this.pages.splice(idx, 1)
    // Re-order
    this.pages.forEach((p, i) => (p.order = i))

    // If deleted current page, switch to adjacent
    if (this.currentPageId === id) {
      const newIdx = Math.min(idx, this.pages.length - 1)
      this.switchToPage(this.pages[newIdx].id)
    }

    this.onPagesListChange?.(this.pages)
  }

  async switchToPage(id: string) {
    // Save current page
    if (this.currentPageId) {
      this.saveCurrentPage()
    }

    const page = this.pages.find((p) => p.id === id)
    if (!page) return

    this.currentPageId = id

    // Clear canvas and load new page
    this.engine.canvas.clear()
    this.engine.canvas.backgroundColor = this.engine.darkMode ? '#1a1a2e' : '#ffffff'

    if (page.snapshot) {
      await this.engine.loadSnapshot(page.snapshot)
    }

    this.onPageChange?.(page)
  }

  saveCurrentPage() {
    const page = this.pages.find((p) => p.id === this.currentPageId)
    if (page) {
      page.snapshot = this.engine.getSnapshot()
    }
  }

  getCurrentPage(): Page | undefined {
    return this.pages.find((p) => p.id === this.currentPageId)
  }

  getPages(): Page[] {
    return [...this.pages]
  }

  renamePage(id: string, name: string) {
    const page = this.pages.find((p) => p.id === id)
    if (page) {
      page.name = name
      this.onPagesListChange?.(this.pages)
    }
  }

  getCurrentPageId(): string {
    return this.currentPageId
  }
}
