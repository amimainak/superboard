// ============================================================
// Superboard — Recording Widget
// Client-side session recording using SVG-to-canvas + MediaRecorder.
// COPPA-compliant: all data stays in browser (auto-downloaded in
// 15-minute segments to prevent memory buildup).
// No server storage, no external dependencies.
// ============================================================

'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useWhiteboardStore } from '@/lib/whiteboard/store'

interface RecordingWidgetProps {
  roomId: string
}

/** Format seconds into MM:SS string */
function formatTime(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60
  return String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0')
}

/** Format bytes to human readable */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

const FRAME_INTERVAL = 1000 / 15 // ~66ms for 15fps
const MAX_SEGMENT_SECONDS = 15 * 60 // 15 minutes per segment
const SPLIT_WARNING_SECONDS = 30 // warn 30s before auto-split

export function RecordingWidget({ roomId: _roomId }: RecordingWidgetProps) {
  const isDark = useWhiteboardStore((s) => s.isDark)
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null)
  const [includeAudio, setIncludeAudio] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isTutor] = useState(() => {
    if (typeof window === 'undefined') return false
    try {
      return localStorage.getItem('sb-role') === 'tutor'
    } catch {
      return false
    }
  })

  // Segment state
  const [segmentCount, setSegmentCount] = useState(1)
  const [showSplitWarning, setShowSplitWarning] = useState(false)
  const [isSplitting, setIsSplitting] = useState(false)
  const [downloadedParts, setDownloadedParts] = useState<number[]>([])

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined)
  const rafRef = useRef<number>(0)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const svgUrlRef = useRef<string | null>(null)

  // Segment tracking refs
  const totalSecondsRef = useRef(0)
  const segmentSecondsRef = useRef(0)
  const segmentCountRef = useRef(1)
  const isSplittingRef = useRef(false)
  const streamRef = useRef<MediaStream | null>(null)
  const mimeTypeRef = useRef<string>('')
  const downloadedPartsRef = useRef<number[]>([])

  const lastRedrawTimeRef = useRef(0)

  // Ref for the redraw loop function (to avoid self-reference in useCallback)
  const redrawLoopRef = useRef<() => void>(() => {})

  /** Find the SVG element in the whiteboard canvas */
  const findSvgElement = useCallback((): SVGSVGElement | null => {
    const root = document.querySelector('.whiteboard-root')
    if (!root) return null
    return root.querySelector('svg')
  }, [])

  /** Draw the SVG content to the canvas */
  const drawSvgToCanvas = useCallback((
    svgElement: SVGSVGElement,
    canvas: HTMLCanvasElement,
  ) => {
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const isDark = document.querySelector('.whiteboard-root')?.classList.contains('dark') ||
      document.querySelector('.whiteboard-root')?.querySelector('[style*="0f172a"]') !== null
    ctx.fillStyle = isDark ? '#0f172a' : '#f8fafc'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    const svgData = new XMLSerializer().serializeToString(svgElement)
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(svgBlob)

    if (svgUrlRef.current) URL.revokeObjectURL(svgUrlRef.current)
    svgUrlRef.current = url

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    }
    img.src = url
  }, [])

  /** Stop the redraw loop */
  const stopRedrawLoop = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = 0
    }
  }, [])

  // Setup the redraw loop function using refs (no self-reference in useCallback)
  useEffect(() => {
    redrawLoopRef.current = () => {
      const root = document.querySelector('.whiteboard-root')
      const svgElement = root?.querySelector('svg') ?? null
      const canvas = canvasRef.current
      if (!svgElement || !canvas) return

      const now = performance.now()
      if (now - lastRedrawTimeRef.current >= FRAME_INTERVAL) {
        const ctx = canvas.getContext('2d')
        if (ctx) {
          const isDark = root?.classList.contains('dark') ||
            root?.querySelector('[style*="0f172a"]') !== null
          ctx.fillStyle = isDark ? '#0f172a' : '#f8fafc'
          ctx.fillRect(0, 0, canvas.width, canvas.height)

          const svgData = new XMLSerializer().serializeToString(svgElement)
          const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
          const url = URL.createObjectURL(svgBlob)
          if (svgUrlRef.current) URL.revokeObjectURL(svgUrlRef.current)
          svgUrlRef.current = url

          const img = new Image()
          img.crossOrigin = 'anonymous'
          img.onload = () => {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
          }
          img.src = url
        }
        lastRedrawTimeRef.current = now
      }

      rafRef.current = requestAnimationFrame(redrawLoopRef.current)
    }
  }, [])

  /** Auto-download a segment blob */
  const autoDownloadSegment = useCallback((blob: Blob, partNumber: number) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const dateStr = new Date().toISOString().slice(0, 10)
    a.download = 'superboard-part' + partNumber + '-' + dateStr + '.webm'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 1000)

    const updated = [...downloadedPartsRef.current, partNumber]
    downloadedPartsRef.current = updated
    setDownloadedParts(updated)
  }, [])

  /** Full cleanup: stop loop, remove canvas, release stream */
  const fullCleanup = useCallback(() => {
    stopRedrawLoop()
    if (canvasRef.current) {
      canvasRef.current.remove()
      canvasRef.current = null
    }
    if (svgUrlRef.current) {
      URL.revokeObjectURL(svgUrlRef.current)
      svgUrlRef.current = null
    }
    streamRef.current = null
  }, [stopRedrawLoop])

  /** Start a new MediaRecorder on the existing stream (reused across segments) */
  const startNewRecorder = useCallback(() => {
    const stream = streamRef.current
    if (!stream) return

    const mimeType = mimeTypeRef.current
    const recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: 2_000_000,
    })

    chunksRef.current = []

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        chunksRef.current.push(e.data)
      }
    }

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType })

      if (isSplittingRef.current) {
        // === AUTO-SPLIT: download this segment and continue ===
        const partNum = segmentCountRef.current
        autoDownloadSegment(blob, partNum)

        // Reset segment counter, increment part number
        segmentSecondsRef.current = 0
        segmentCountRef.current += 1
        setSegmentCount(segmentCountRef.current)
        isSplittingRef.current = false
        setIsSplitting(false)

        // Start next segment recorder on the same stream
        startNewRecorder()
      } else {
        // === FINAL STOP: keep blob for manual download, full cleanup ===
        setRecordingBlob(blob)
        fullCleanup()
      }
    }

    recorder.onerror = () => {
      if (!isSplittingRef.current) {
        setError('Recording error occurred. Please try again.')
        fullCleanup()
        setIsRecording(false)
        setIsPaused(false)
        if (timerRef.current) clearInterval(timerRef.current)
      }
    }

    mediaRecorderRef.current = recorder
    recorder.start(1000)
  }, [autoDownloadSegment, fullCleanup])

  /** Trigger an auto-split (called by timer when segment reaches 15 min) */
  const triggerSplit = useCallback(() => {
    const recorder = mediaRecorderRef.current
    if (!recorder || recorder.state === 'inactive' || isSplittingRef.current) return

    isSplittingRef.current = true
    setIsSplitting(true)
    setShowSplitWarning(false)
    recorder.stop() // onstop will handle download + restart
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRedrawLoop()
      if (timerRef.current) clearInterval(timerRef.current)
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }
      if (svgUrlRef.current) URL.revokeObjectURL(svgUrlRef.current)
    }
  }, [stopRedrawLoop])

  // Warn before navigating away during recording
  useEffect(() => {
    if (!isRecording) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isRecording])

  /** Start recording */
  const startRecording = useCallback(async () => {
    setError(null)
    chunksRef.current = []
    totalSecondsRef.current = 0
    segmentSecondsRef.current = 0
    segmentCountRef.current = 1
    isSplittingRef.current = false
    downloadedPartsRef.current = []
    setRecordingTime(0)
    setRecordingBlob(null)
    setSegmentCount(1)
    setDownloadedParts([])
    setShowSplitWarning(false)
    setIsSplitting(false)

    const svgElement = findSvgElement()
    if (!svgElement) {
      setError('Could not find whiteboard canvas. Make sure the whiteboard is visible.')
      return
    }

    try {
      const rect = svgElement.getBoundingClientRect()
      const width = Math.max(rect.width, 800)
      const height = Math.max(rect.height, 600)

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      canvas.style.display = 'none'
      document.body.appendChild(canvas)
      canvasRef.current = canvas

      drawSvgToCanvas(svgElement, canvas)

      const stream = canvas.captureStream(15)
      streamRef.current = stream

      // Try to capture audio from any active media elements
      if (includeAudio) {
        try {
          const audioElements = document.querySelectorAll('audio, video')
          for (const el of Array.from(audioElements)) {
            const mediaEl = el as HTMLMediaElement & { captureStream?: () => MediaStream }
            if (mediaEl.captureStream) {
              try {
                const audioStream = mediaEl.captureStream()
                const audioTracks = audioStream.getAudioTracks()
                audioTracks.forEach((track: MediaStreamTrack) => stream.addTrack(track))
              } catch {
                // Element may not allow capture, skip
              }
            }
          }
        } catch {
          // Audio capture is best-effort
        }
      }

      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : MediaRecorder.isTypeSupported('video/webm;codecs=vp8')
          ? 'video/webm;codecs=vp8'
          : 'video/webm'

      mimeTypeRef.current = mimeType

      // Start redraw loop
      lastRedrawTimeRef.current = 0
      rafRef.current = requestAnimationFrame(redrawLoopRef.current)

      // Start the first recorder
      startNewRecorder()

      setIsRecording(true)
      setIsPaused(false)

      // Timer: increments both total and segment counters
      timerRef.current = setInterval(() => {
        totalSecondsRef.current += 1
        segmentSecondsRef.current += 1
        setRecordingTime(totalSecondsRef.current)

        // Show warning 30s before split
        if (segmentSecondsRef.current === MAX_SEGMENT_SECONDS - SPLIT_WARNING_SECONDS) {
          setShowSplitWarning(true)
        }

        // Auto-split at 15 minutes
        if (segmentSecondsRef.current >= MAX_SEGMENT_SECONDS) {
          triggerSplit()
        }
      }, 1000)
    } catch (err) {
      setError('Failed to start recording. Your browser may not support this feature.')
      console.error('Recording start error:', err)
    }
  }, [findSvgElement, drawSvgToCanvas, startNewRecorder, triggerSplit, includeAudio])

  /** Pause/Resume recording */
  const togglePause = useCallback(() => {
    const recorder = mediaRecorderRef.current
    if (!recorder || isSplitting) return

    if (isPaused) {
      recorder.resume()
      setIsPaused(false)
      timerRef.current = setInterval(() => {
        totalSecondsRef.current += 1
        segmentSecondsRef.current += 1
        setRecordingTime(totalSecondsRef.current)

        if (segmentSecondsRef.current === MAX_SEGMENT_SECONDS - SPLIT_WARNING_SECONDS) {
          setShowSplitWarning(true)
        }
        if (segmentSecondsRef.current >= MAX_SEGMENT_SECONDS) {
          triggerSplit()
        }
      }, 1000)
    } else {
      recorder.pause()
      setIsPaused(true)
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isPaused, isSplitting, triggerSplit])

  /** Stop recording (final) */
  const stopRecording = useCallback(() => {
    // Ignore if a split is in progress
    if (isSplittingRef.current) return

    const recorder = mediaRecorderRef.current
    if (!recorder || recorder.state === 'inactive') return

    recorder.stop() // onstop will do full cleanup (isSplittingRef is false)
    setIsRecording(false)
    setIsPaused(false)
    if (timerRef.current) clearInterval(timerRef.current)
  }, [])

  /** Download the last segment blob (manual) */
  const downloadRecording = useCallback(() => {
    if (!recordingBlob) return
    const url = URL.createObjectURL(recordingBlob)
    const a = document.createElement('a')
    a.href = url
    const dateStr = new Date().toISOString().slice(0, 10)
    const partLabel = downloadedParts.length > 0
      ? 'part' + (downloadedParts.length + 1) + '-'
      : 'lesson-'
    a.download = 'superboard-' + partLabel + dateStr + '.webm'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [recordingBlob, downloadedParts])

  /** Discard the recorded blob */
  const discardRecording = useCallback(() => {
    setRecordingBlob(null)
    chunksRef.current = []
    totalSecondsRef.current = 0
    segmentSecondsRef.current = 0
    segmentCountRef.current = 1
    downloadedPartsRef.current = []
    setRecordingTime(0)
    setSegmentCount(1)
    setDownloadedParts([])
  }, [])

  return (
    <div className="widget-content">
      <div className="recording-widget">
        {/* Header */}
        <div className={'recording-header ' + (isDark ? '' : 'recording-header-light')}>
          <span className={'recording-header-icon ' + (isDark ? '' : 'recording-header-icon-light')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="3" />
              <line x1="12" y1="2" x2="12" y2="6" />
              <line x1="12" y1="18" x2="12" y2="22" />
              <line x1="2" y1="12" x2="6" y2="12" />
              <line x1="18" y1="12" x2="22" y2="12" />
            </svg>
          </span>
          <span className={'recording-header-title ' + (isDark ? '' : 'recording-header-title-light')}>Session Recording</span>
        </div>

        <div className="recording-body">
          {/* Error message */}
          {error && (
            <div className="recording-error">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Idle state: Start button */}
          {!isRecording && !recordingBlob && (
            <div className="recording-idle">
              <div className="recording-idle-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 7l-7 5 7 5V7z" />
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                </svg>
              </div>
              <p className={'recording-idle-desc ' + (isDark ? '' : 'recording-idle-desc-light')}>
                Record the whiteboard session. Auto-saves every 15 minutes as a separate file — nothing is uploaded.
              </p>
              <div className="recording-options">
                <label className={'recording-option ' + (isDark ? '' : 'recording-option-light')}>
                  <input
                    type="checkbox"
                    checked={includeAudio}
                    onChange={(e) => setIncludeAudio(e.target.checked)}
                    disabled={isRecording}
                  />
                  <span>Include audio</span>
                </label>
              </div>
              <button className="recording-start-btn" onClick={startRecording}>
                <span className="recording-btn-dot recording-btn-dot-red" />
                Start Recording
              </button>
            </div>
          )}

          {/* Recording state: Timer + Pause/Stop */}
          {isRecording && (
            <div className="recording-active">
              {/* Split warning */}
              {showSplitWarning && !isSplitting && (
                <div className="recording-split-warning">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  <span>Auto-saving Part {segmentCount} in {SPLIT_WARNING_SECONDS}s...</span>
                </div>
              )}

              {/* Splitting indicator */}
              {isSplitting && (
                <div className="recording-splitting">
                  <div className="recording-split-spinner" />
                  <span>Saving Part {segmentCount}...</span>
                </div>
              )}

              {/* Segment badge + Timer */}
              <div className="recording-timer-row">
                <span className="recording-pulse-dot" />
                <span className="recording-timer-label">
                  {isPaused ? 'Paused' : 'Recording...'}
                </span>
                <span className={'recording-timer ' + (isDark ? '' : 'recording-timer-light')}>
                  {formatTime(recordingTime)}
                </span>
              </div>

              {/* Segment info */}
              {segmentCount > 1 && (
                <div className="recording-segment-info">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7,10 12,15 17,10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  <span>{downloadedParts.length} part{downloadedParts.length !== 1 ? 's' : ''} saved</span>
                </div>
              )}

              <div className="recording-controls">
                <button
                  className="recording-ctrl-btn recording-ctrl-pause"
                  onClick={togglePause}
                  disabled={isSplitting}
                  title={isPaused ? 'Resume' : 'Pause'}
                >
                  {isPaused ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="5,3 19,12 5,21" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="6" y="4" width="4" height="16" />
                      <rect x="14" y="4" width="4" height="16" />
                    </svg>
                  )}
                  <span>{isPaused ? 'Resume' : 'Pause'}</span>
                </button>
                <button
                  className="recording-ctrl-btn recording-ctrl-stop"
                  onClick={stopRecording}
                  disabled={isSplitting}
                  title="Stop recording"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="6" width="12" height="12" rx="2" />
                  </svg>
                  <span>Stop</span>
                </button>
              </div>
            </div>
          )}

          {/* Post-recording state: Download/Discard */}
          {recordingBlob && !isRecording && (
            <div className="recording-done">
              <div className="recording-done-preview">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 7l-7 5 7 5V7z" />
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                </svg>
              </div>
              <div className="recording-done-info">
                <span className={'recording-done-duration ' + (isDark ? '' : 'recording-done-duration-light')}>Duration: {formatTime(recordingTime)}</span>
                <span className={'recording-done-size ' + (isDark ? '' : 'recording-done-size-light')}>Size: {formatFileSize(recordingBlob.size)}</span>
              </div>

              {/* Show previously auto-downloaded parts */}
              {downloadedParts.length > 0 && (
                <div className="recording-saved-parts">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22,4 12,14.01 9,11.01" />
                  </svg>
                  <span>Parts 1-{downloadedParts.length} auto-saved to your downloads</span>
                </div>
              )}

              <div className="recording-done-actions">
                <button className="recording-download-btn" onClick={downloadRecording}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7,10 12,15 17,10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Download Part {downloadedParts.length + 1}
                </button>
                <button className={'recording-discard-btn ' + (isDark ? '' : 'recording-discard-btn-light')} onClick={discardRecording}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3,6 5,6 21,6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                  Discard
                </button>
              </div>
            </div>
          )}

          {/* Tutor: remind student to download */}
          {isTutor && !isRecording && (
            <div className={'recording-tutor-remind ' + (isDark ? '' : 'recording-tutor-remind-light')}>
              <button
                className="recording-remind-btn"
                onClick={() => {
                  const msg = recordingBlob
                    ? 'Please download your recording before leaving!'
                    : 'Remember to start recording the session for your notes.'
                  alert(msg)
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {recordingBlob ? 'Remind student to download' : 'Remind student to record'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
