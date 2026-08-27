import {
  Canvas,
  Rect,
  Circle,
  Line,
  Textbox,
  FabricObject,
  Point,
  Polyline,
  Group,
  FabricImage,
  PencilBrush,
  Shadow,
  TPointerEventInfo,
  ActiveSelection,
} from 'fabric'

export type GridType = 'dot' | 'line' | 'none'

export interface WhiteboardConfig {
  gridType?: GridType
  gridSize?: number
  snapToGrid?: boolean
  snapThreshold?: number
  darkMode?: boolean
}

export interface CanvasSnapshot {
  version: string
  objects: ReturnType<Canvas['toJSON']>
  viewport: number[]
}

export class WhiteboardEngine {
  canvas!: Canvas
  container!: HTMLElement
  gridType: GridType = 'dot'
  gridSize = 20
  snapToGrid = false
  snapThreshold = 8
  darkMode = false

  private isPanning = false
  private lastPanPoint: Point | null = null
  private spacePressed = false
  private gridOverlay: HTMLCanvasElement | null = null
  private gridCtx: CanvasRenderingContext2D | null = null

  // Laser pointer
  laserDot: Circle | null = null
  laserTimeout: ReturnType<typeof setTimeout> | null = null

  // Event callbacks
  onZoomChange?: (zoom: number) => void
  onObjectModified?: () => void

  createCanvas(container: HTMLElement, config: WhiteboardConfig = {}): Canvas {
    this.container = container
    this.gridType = config.gridType ?? 'dot'
    this.gridSize = config.gridSize ?? 20
    this.snapToGrid = config.snapToGrid ?? false
    this.snapThreshold = config.snapThreshold ?? 8
    this.darkMode = config.darkMode ?? false

    const rect = container.getBoundingClientRect()
    const w = rect.width || window.innerWidth
    const h = rect.height || window.innerHeight

    this.canvas = new Canvas('whiteboard-canvas', {
      width: w,
      height: h,
      backgroundColor: this.darkMode ? '#1a1a2e' : '#ffffff',
      selection: true,
      preserveObjectStacking: true,
    })

    this.setupPanZoom()
    this.setupGrid()
    this.setupDragDrop()

    return this.canvas
  }

  // ─── Pan & Zoom ───
  private setupPanZoom() {
    // Mouse wheel zoom
    this.canvas.on('mouse:wheel', (opt) => {
      const e = opt.e as WheelEvent
      e.preventDefault()
      e.stopPropagation()

      const delta = e.deltaY
      let zoom = this.canvas.getZoom()
      zoom *= 0.999 ** delta
      zoom = Math.min(Math.max(0.05, zoom), 20)

      this.canvas.zoomToPoint(
        new Point(e.offsetX, e.offsetY),
        zoom
      )

      this.onZoomChange?.(Math.round(zoom * 100))
      this.renderGrid()
      this.canvas.requestRenderAll()
    })

    // Middle click pan
    this.canvas.on('mouse:down', (opt) => {
      const e = opt.e as MouseEvent
      if (e.button === 1 || this.spacePressed) {
        this.isPanning = true
        this.lastPanPoint = new Point(e.clientX, e.clientY)
        this.canvas.selection = false
        this.canvas.setCursor('grabbing')
        e.preventDefault()
      }
    })

    this.canvas.on('mouse:move', (opt) => {
      const e = opt.e as MouseEvent
      if (this.isPanning && this.lastPanPoint) {
        const dx = e.clientX - this.lastPanPoint.x
        const dy = e.clientY - this.lastPanPoint.y
        this.canvas.relativePan(new Point(dx, dy))
        this.lastPanPoint = new Point(e.clientX, e.clientY)
        this.renderGrid()
      }
    })

    this.canvas.on('mouse:up', () => {
      if (this.isPanning) {
        this.isPanning = false
        this.lastPanPoint = null
        this.canvas.selection = true
        this.canvas.setCursor('default')
      }
    })

    // Spacebar pan
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && !e.repeat && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
          this.spacePressed = true
          this.canvas.setCursor('grab')
        }
      })
      window.addEventListener('keyup', (e) => {
        if (e.code === 'Space') {
          this.spacePressed = false
          if (!this.isPanning) {
            this.canvas.setCursor('default')
          }
        }
      })
    }
  }

  setSpacePressed(pressed: boolean) {
    this.spacePressed = pressed
    if (pressed) {
      this.canvas.setCursor('grab')
    } else if (!this.isPanning) {
      this.canvas.setCursor('default')
    }
  }

  // ─── Grid Rendering ───
  private setupGrid() {
    const overlay = document.createElement('canvas')
    overlay.id = 'grid-overlay'
    overlay.style.cssText = 'position:absolute;top:0;left:0;pointer-events:none;z-index:0;'
    this.container.style.position = 'relative'
    this.container.insertBefore(overlay, this.container.firstChild)

    this.gridOverlay = overlay
    this.gridCtx = overlay.getContext('2d')
    this.resizeGridOverlay()
    this.renderGrid()

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', () => {
        this.resizeCanvas()
        this.resizeGridOverlay()
        this.renderGrid()
      })
    }
  }

  private resizeGridOverlay() {
    if (!this.gridOverlay) return
    const rect = this.container.getBoundingClientRect()
    this.gridOverlay.width = rect.width
    this.gridOverlay.height = rect.height
  }

  renderGrid() {
    if (!this.gridCtx || !this.gridOverlay) return
    const ctx = this.gridCtx
    const w = this.gridOverlay.width
    const h = this.gridOverlay.height
    const zoom = this.canvas.getZoom()
    const vpt = this.canvas.viewportTransform
    const gridSize = this.gridSize

    ctx.clearRect(0, 0, w, h)
    if (this.gridType === 'none') return

    const offsetX = vpt[4]
    const offsetY = vpt[5]
    const scaledGrid = gridSize * zoom

    if (scaledGrid < 4) return // Don't render grid when too zoomed out

    const startX = offsetX % scaledGrid
    const startY = offsetY % scaledGrid

    if (this.gridType === 'dot') {
      ctx.fillStyle = this.darkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'
      const dotSize = Math.max(1, zoom * 1.2)
      for (let x = startX; x < w; x += scaledGrid) {
        for (let y = startY; y < h; y += scaledGrid) {
          ctx.beginPath()
          ctx.arc(x, y, dotSize, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    } else if (this.gridType === 'line') {
      ctx.strokeStyle = this.darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'
      ctx.lineWidth = 0.5
      ctx.beginPath()
      for (let x = startX; x < w; x += scaledGrid) {
        ctx.moveTo(x, 0)
        ctx.lineTo(x, h)
      }
      for (let y = startY; y < h; y += scaledGrid) {
        ctx.moveTo(0, y)
        ctx.lineTo(w, y)
      }
      ctx.stroke()
    }
  }

  // ─── Drag & Drop ───
  private setupDragDrop() {
    this.container.addEventListener('dragover', (e) => {
      e.preventDefault()
    })
    this.container.addEventListener('drop', (e) => {
      e.preventDefault()
      const files = Array.from(e.dataTransfer?.files || [])
      for (const file of files) {
        if (file.type.startsWith('image/')) {
          const rect = this.container.getBoundingClientRect()
          const x = (e.clientX - rect.left - this.canvas.viewportTransform[4]) / this.canvas.getZoom()
          const y = (e.clientY - rect.top - this.canvas.viewportTransform[5]) / this.canvas.getZoom()
          this.addImageFromFile(file, x, y)
        }
      }
    })
  }

  // ─── Image Upload ───
  addImageFromFile(file: File, x?: number, y?: number): Promise<FabricImage> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const dataUrl = reader.result as string
        FabricImage.fromURL(dataUrl).then((img) => {
          const maxSize = 600
          const scale = Math.min(maxSize / (img.width || 1), maxSize / (img.height || 1), 1)
          img.set({
            left: x ?? (this.canvas.width / 2 - (img.width || 0) * scale / 2) / this.canvas.getZoom(),
            top: y ?? (this.canvas.height / 2 - (img.height || 0) * scale / 2) / this.canvas.getZoom(),
            scaleX: scale,
            scaleY: scale,
          })
          this.canvas.add(img)
          this.canvas.setActiveObject(img)
          this.canvas.requestRenderAll()
          this.onObjectModified?.()
          resolve(img)
        }).catch(reject)
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  // ─── Snap to Grid ───
  snapPoint(x: number, y: number): { x: number; y: number } {
    if (!this.snapToGrid) return { x, y }
    return {
      x: Math.round(x / this.gridSize) * this.gridSize,
      y: Math.round(y / this.gridSize) * this.gridSize,
    }
  }

  // ─── Zoom Controls ───
  zoomIn() {
    let zoom = this.canvas.getZoom() * 1.2
    zoom = Math.min(zoom, 20)
    const center = new Point(this.canvas.width / 2, this.canvas.height / 2)
    this.canvas.zoomToPoint(center, zoom)
    this.onZoomChange?.(Math.round(zoom * 100))
    this.renderGrid()
    this.canvas.requestRenderAll()
  }

  zoomOut() {
    let zoom = this.canvas.getZoom() / 1.2
    zoom = Math.max(zoom, 0.05)
    const center = new Point(this.canvas.width / 2, this.canvas.height / 2)
    this.canvas.zoomToPoint(center, zoom)
    this.onZoomChange?.(Math.round(zoom * 100))
    this.renderGrid()
    this.canvas.requestRenderAll()
  }

  zoomReset() {
    this.canvas.setViewportTransform([1, 0, 0, 1, 0, 0])
    this.onZoomChange?.(100)
    this.renderGrid()
    this.canvas.requestRenderAll()
  }

  zoomToFit() {
    const objects = this.canvas.getObjects()
    if (objects.length === 0) {
      this.zoomReset()
      return
    }
    const group = new Group(objects)
    const bounds = group.getBoundingRect(true)
    group.destroy()

    const padding = 60
    const zx = (this.canvas.width - padding * 2) / (bounds.width || 1)
    const zy = (this.canvas.height - padding * 2) / (bounds.height || 1)
    const zoom = Math.min(zx, zy, 3)

    const cx = bounds.left + (bounds.width || 0) / 2
    const cy = bounds.top + (bounds.height || 0) / 2

    this.canvas.setViewportTransform([1, 0, 0, 1, 0, 0])
    this.canvas.zoomToPoint(new Point(cx, cy), zoom)

    const vpt = [...this.canvas.viewportTransform]
    vpt[4] = this.canvas.width / 2 - cx * zoom
    vpt[5] = this.canvas.height / 2 - cy * zoom
    this.canvas.setViewportTransform(vpt)

    this.onZoomChange?.(Math.round(zoom * 100))
    this.renderGrid()
    this.canvas.requestRenderAll()
  }

  getZoom(): number {
    return Math.round(this.canvas.getZoom() * 100)
  }

  // ─── Serialization ───
  getSnapshot(): CanvasSnapshot {
    return {
      version: '1.0',
      objects: this.canvas.toJSON(),
      viewport: [...this.canvas.viewportTransform],
    }
  }

  async loadSnapshot(snapshot: CanvasSnapshot) {
    this.canvas.selection = false
    await this.canvas.loadFromJSON(snapshot.objects)
    if (snapshot.viewport) {
      this.canvas.setViewportTransform(snapshot.viewport)
    }
    this.canvas.selection = true
    this.canvas.requestRenderAll()
    this.renderGrid()
  }

  // ─── Export ───
  exportPNG(): string {
    return this.canvas.toDataURL({ format: 'png', quality: 1, multiplier: 2 })
  }

  exportSVG(): string {
    return this.canvas.toSVG()
  }

  exportJSON(): string {
    return JSON.stringify(this.getSnapshot(), null, 2)
  }

  // ─── Dark Mode ───
  setDarkMode(dark: boolean) {
    this.darkMode = dark
    this.canvas.backgroundColor = dark ? '#1a1a2e' : '#ffffff'
    this.renderGrid()
    this.canvas.requestRenderAll()
  }

  // ─── Arrange ───
  bringToFront() {
    const active = this.canvas.getActiveObjects()
    active.forEach((obj) => this.canvas.bringToFront(obj))
    this.canvas.requestRenderAll()
    this.onObjectModified?.()
  }

  sendToBack() {
    const active = this.canvas.getActiveObjects()
    active.forEach((obj) => this.canvas.sendToBack(obj))
    this.canvas.requestRenderAll()
    this.onObjectModified?.()
  }

  groupObjects() {
    const active = this.canvas.getActiveObject()
    if (!active || active.type !== 'activeSelection') return
    const sel = active as ReturnType<Canvas['getActiveObject']>
    const objects = sel.getObjects()
    if (objects.length < 2) return
    const group = new Group(objects)
    this.canvas.remove(...objects)
    this.canvas.add(group)
    this.canvas.setActiveObject(group)
    this.canvas.requestRenderAll()
    this.onObjectModified?.()
  }

  ungroupObjects() {
    const active = this.canvas.getActiveObject()
    if (!active || active.type !== 'group') return
    const group = active as Group
    const objects = group.getObjects()
    group.destroy()
    this.canvas.remove(group)
    objects.forEach((obj) => this.canvas.add(obj))
    this.canvas.discardActiveObject()
    this.canvas.requestRenderAll()
    this.onObjectModified?.()
  }

  toggleLock() {
    const active = this.canvas.getActiveObjects()
    active.forEach((obj) => {
      obj.set({
        lockMovementX: !obj.lockMovementX,
        lockMovementY: !obj.lockMovementY,
        lockScalingX: !obj.lockScalingX,
        lockScalingY: !obj.lockScalingY,
        lockRotation: !obj.lockRotation,
        hasControls: obj.lockMovementX,
        selectable: !obj.selectable || obj.lockMovementX,
      })
    })
    this.canvas.requestRenderAll()
  }

  selectAll() {
    this.canvas.discardActiveObject()
    const sel = new ActiveSelection(
      this.canvas.getObjects(),
      { canvas: this.canvas }
    )
    this.canvas.setActiveObject(sel)
    this.canvas.requestRenderAll()
  }

  deleteSelected() {
    const active = this.canvas.getActiveObjects()
    if (active.length === 0) return
    active.forEach((obj) => this.canvas.remove(obj))
    this.canvas.discardActiveObject()
    this.canvas.requestRenderAll()
    this.onObjectModified?.()
  }

  duplicateSelected() {
    const active = this.canvas.getActiveObjects()
    active.forEach((obj) => {
      obj.clone().then((cloned) => {
        cloned.set({ left: (cloned.left || 0) + 20, top: (cloned.top || 0) + 20 })
        this.canvas.add(cloned)
        this.canvas.setActiveObject(cloned)
        this.canvas.requestRenderAll()
      })
    })
    this.onObjectModified?.()
  }

  // ─── Laser Pointer ───
  showLaser(x: number, y: number) {
    if (!this.laserDot) {
      this.laserDot = new Circle({
        radius: 6,
        fill: 'rgba(255, 50, 50, 0.8)',
        originX: 'center',
        originY: 'center',
        selectable: false,
        evented: false,
        shadow: new Shadow({ color: 'red', blur: 15 }),
      }) as Circle
    }
    this.laserDot.set({ left: x, top: y, visible: true })
    if (!this.laserDot.canvas) {
      this.canvas.add(this.laserDot)
    }
    this.canvas.bringToFront(this.laserDot)
    this.canvas.requestRenderAll()

    if (this.laserTimeout) clearTimeout(this.laserTimeout)
    this.laserTimeout = setTimeout(() => {
      if (this.laserDot) {
        this.laserDot.set({ visible: false })
        this.canvas.requestRenderAll()
      }
    }, 800)
  }

  // ─── Canvas Resize ───
  resizeCanvas() {
    const rect = this.container.getBoundingClientRect()
    this.canvas.setDimensions({ width: rect.width, height: rect.height })
    this.canvas.requestRenderAll()
  }

  // ─── Cleanup ───
  dispose() {
    if (this.gridOverlay) {
      this.gridOverlay.remove()
      this.gridOverlay = null
      this.gridCtx = null
    }
    if (this.laserTimeout) clearTimeout(this.laserTimeout)
    this.canvas.dispose()
  }
}

export const engine = new WhiteboardEngine()
