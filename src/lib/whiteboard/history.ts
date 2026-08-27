import type { WhiteboardEngine } from './engine'

export interface HistoryCommand {
  execute: () => void
  undo: () => void
  description: string
}

export class HistoryManager {
  private engine: WhiteboardEngine
  private undoStack: CanvasSnapshot[] = []
  private redoStack: CanvasSnapshot[] = []
  private maxHistory = 50

  constructor(engine: WhiteboardEngine) {
    this.engine = engine
  }

  saveState() {
    const snapshot = this.engine.getSnapshot()
    this.undoStack.push(snapshot)
    if (this.undoStack.length > this.maxHistory) {
      this.undoStack.shift()
    }
    // Clear redo stack on new action
    this.redoStack = []
  }

  async undo() {
    if (!this.canUndo()) return
    // Save current state to redo
    const currentSnapshot = this.engine.getSnapshot()
    this.redoStack.push(currentSnapshot)
    // Restore previous state
    const prevSnapshot = this.undoStack.pop()!
    await this.engine.loadSnapshot(prevSnapshot)
  }

  async redo() {
    if (!this.canRedo()) return
    // Save current state to undo
    const currentSnapshot = this.engine.getSnapshot()
    this.undoStack.push(currentSnapshot)
    // Restore next state
    const nextSnapshot = this.redoStack.pop()!
    await this.engine.loadSnapshot(nextSnapshot)
  }

  canUndo(): boolean {
    return this.undoStack.length > 0
  }

  canRedo(): boolean {
    return this.redoStack.length > 0
  }

  clear() {
    this.undoStack = []
    this.redoStack = []
  }

  getUndoCount(): number {
    return this.undoStack.length
  }

  getRedoCount(): number {
    return this.redoStack.length
  }
}
