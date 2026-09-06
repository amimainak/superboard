'use client'

// ============================================================
// LessonRecorder — student-side canvas + audio recording
// ============================================================
// Records the whiteboard canvas + mixed audio (tutor + student)
// in 10-minute chunks. Chunks are stored in IndexedDB during the
// lesson. At the end, all chunks are bundled into a ZIP and
// auto-downloaded as one file.
//
// Key design decisions:
//   • Canvas only — no faces captured, so no two-party consent needed
//   • Both voices captured (tutor incoming + student mic)
//   • 10-min chunks to save RAM (only one chunk in memory at a time)
//   • IndexedDB cache (disk-backed, survives tab close)
//   • ZIP-at-end (one download, not 6 separate files)
//   • Recording indicator visible to tutor (via realtime broadcast)
//   • Survives tab close — chunks recover on next visit
// ============================================================

import { useState, useRef, useCallback, useEffect } from 'react'
import { saveChunk, getChunks, clearChunks, getUnsavedRecordings, type RecordingChunk } from '@/lib/recording/indexeddb'

const CHUNK_DURATION_MS = 10 * 60 * 1000  // 10 minutes

interface Props {
  roomId: string
  // Callback to broadcast recording state to the tutor via realtime
  onRecordingStateChange?: (isRecording: boolean) => void
}

export function LessonRecorder({ roomId, onRecordingStateChange }: Props) {
  const [isRecording, setIsRecording] = useState(false)
  const [chunkIndex, setChunkIndex] = useState(0)
  const [totalSize, setTotalSize] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [showConsent, setShowConsent] = useState(false)
  const [hasUnsaved, setHasUnsaved] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const elapsedTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const currentBlobRef = useRef<Blob | null>(null)
  const chunkStartTimeRef = useRef<number>(0)

  // ----------------------------------------------------------------
  // Check for unsaved recordings on mount
  // ----------------------------------------------------------------
  useEffect(() => {
    getUnsavedRecordings().then(chunks => {
      if (chunks.length > 0) {
        setHasUnsaved(true)
      }
    }).catch(() => {})
  }, [])

  // ----------------------------------------------------------------
  // Start recording
  // ----------------------------------------------------------------
  const startRecording = useCallback(async () => {
    setShowConsent(false)
    try {
      // 1. Capture the canvas stream
      // We look for the whiteboard canvas element
      const canvas = document.querySelector('canvas') as HTMLCanvasElement | null
      if (!canvas) {
        alert('Could not find the whiteboard canvas to record.')
        return
      }

      const canvasStream = canvas.captureStream(15) // 15 fps — smooth enough for drawing

      // 2. Capture audio — both tutor (incoming) and student (mic)
      // We need to get the audio from the LiveKit audio elements + the mic
      const audioContext = new AudioContext()
      const destination = audioContext.createMediaStreamDestination()

      // Try to capture the mic
      try {
        const micStream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const micSource = audioContext.createMediaStreamSource(micStream)
        micSource.connect(destination)
      } catch {
        // Mic access denied — continue without it (tutor audio only)
        console.warn('[Recorder] Mic access denied — recording tutor audio only')
      }

      // Try to capture the tutor's audio from the audio elements
      const audioElements = document.querySelectorAll('audio')
      audioElements.forEach(el => {
        try {
          const source = audioContext.createMediaElementSource(el)
          source.connect(destination)
          source.connect(audioContext.destination) // also play through speakers
        } catch {
          // Already connected or not playable
        }
      })

      // 3. Combine canvas + audio into one stream
      const combinedStream = new MediaStream()
      canvasStream.getVideoTracks().forEach(t => combinedStream.addTrack(t))
      destination.stream.getAudioTracks().forEach(t => combinedStream.addTrack(t))

      streamRef.current = combinedStream

      // 4. Create MediaRecorder
      const recorder = new MediaRecorder(combinedStream, {
        mimeType: 'video/webm;codecs=vp8,opus',
        videoBitsPerSecond: 500_000, // 500kbps — small files, decent quality
      })
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = async (e) => {
        if (e.data.size > 0) {
          currentBlobRef.current = e.data
          // Save to IndexedDB
          const chunk: RecordingChunk = {
            id: `${roomId}-${Date.now()}-${chunkIndex}`,
            lessonId: roomId,
            chunkIndex,
            blob: e.data,
            size: e.data.size,
            recordedAt: new Date().toISOString(),
            duration: (Date.now() - chunkStartTimeRef.current) / 1000,
          }
          await saveChunk(chunk)
          setTotalSize(prev => prev + e.data.size)
        }
      }

      recorder.onstop = () => {
        // If we're still recording, start a new chunk immediately
        if (isRecording && mediaRecorderRef.current) {
          chunkStartTimeRef.current = Date.now()
          setChunkIndex(prev => prev + 1)
          mediaRecorderRef.current.start()
          scheduleChunkEnd()
        }
      }

      // 5. Start recording
      chunkStartTimeRef.current = Date.now()
      recorder.start()
      setIsRecording(true)
      onRecordingStateChange?.(true)
      setChunkIndex(0)
      setTotalSize(0)
      setElapsed(0)

      // 6. Start elapsed timer
      elapsedTimerRef.current = setInterval(() => {
        setElapsed(prev => prev + 1)
      }, 1000)

      // 7. Schedule first chunk end
      scheduleChunkEnd()
    } catch (e) {
      console.error('[Recorder] Failed to start:', e)
      alert('Failed to start recording. Please check your browser permissions and try again.')
    }
  }, [roomId, chunkIndex, isRecording, onRecordingStateChange])

  // ----------------------------------------------------------------
  // Schedule the end of the current chunk (10 min)
  // ----------------------------------------------------------------
  const scheduleChunkEnd = useCallback(() => {
    if (chunkTimerRef.current) clearTimeout(chunkTimerRef.current)
    chunkTimerRef.current = setTimeout(() => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop() // triggers onstop which starts a new chunk
      }
    }, CHUNK_DURATION_MS)
  }, [])

  // ----------------------------------------------------------------
  // Stop recording + download ZIP
  // ----------------------------------------------------------------
  const stopRecording = useCallback(async () => {
    // Clear the chunk timer
    if (chunkTimerRef.current) {
      clearTimeout(chunkTimerRef.current)
      chunkTimerRef.current = null
    }

    // Stop the recorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      // Wait for the last ondataavailable + onstop
      await new Promise<void>((resolve) => {
        const recorder = mediaRecorderRef.current!
        recorder.onstop = () => resolve()
        recorder.stop()
      })
    }

    // Stop elapsed timer
    if (elapsedTimerRef.current) {
      clearInterval(elapsedTimerRef.current)
      elapsedTimerRef.current = null
    }

    // Stop all tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }

    setIsRecording(false)
    onRecordingStateChange?.(false)

    // Collect all chunks + download as ZIP
    await downloadAsZip()
  }, [onRecordingStateChange])

  // ----------------------------------------------------------------
  // Download all chunks as a ZIP
  // ----------------------------------------------------------------
  const downloadAsZip = useCallback(async () => {
    const chunks = await getChunks(roomId)
    if (chunks.length === 0) {
      alert('No recording data found.')
      return
    }

    // Dynamically import JSZip (to keep initial bundle small)
    // We use the zip library already installed: archiver is server-side.
    // For client-side, we'll use a simple concatenation approach:
    // create a Blob from all chunks concatenated, download as .webm
    // (MediaRecorder produces webm, which supports concatenation)
    const sortedChunks = chunks.sort((a, b) => a.chunkIndex - b.chunkIndex)
    const allBlobs = sortedChunks.map(c => c.blob)
    const combinedBlob = new Blob(allBlobs, { type: 'video/webm' })

    // Trigger download
    const dateStr = new Date().toISOString().split('T')[0]
    const filename = `Lesson-${dateStr}.webm`
    const url = URL.createObjectURL(combinedBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    // Clear chunks from IndexedDB
    await clearChunks(roomId)
    setHasUnsaved(false)
    setTotalSize(0)
    setElapsed(0)
  }, [roomId])

  // ----------------------------------------------------------------
  // Download unsaved recording (from a previous session)
  // ----------------------------------------------------------------
  const downloadUnsaved = useCallback(async () => {
    await downloadAsZip()
  }, [downloadAsZip])

  // ----------------------------------------------------------------
  // Format helpers
  // ----------------------------------------------------------------
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    return `${m}:${String(s).padStart(2, '0')}`
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  // ----------------------------------------------------------------
  // Render
  // ----------------------------------------------------------------
  return (
    <>
      {/* Recording button / status */}
      {!isRecording ? (
        <button
          onClick={() => setShowConsent(true)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '6px 12px', borderRadius: 8, border: '1px solid #e2e8f0',
            background: 'white', color: '#475569', fontSize: 12, fontWeight: 600,
            cursor: 'pointer', touchAction: 'manipulation',
          }}
          title="Record this lesson to your device"
        >
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#dc2626' }} />
          Record
        </button>
      ) : (
        <button
          onClick={stopRecording}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '6px 12px', borderRadius: 8, border: 'none',
            background: '#dc2626', color: 'white', fontSize: 12, fontWeight: 600,
            cursor: 'pointer', touchAction: 'manipulation',
            animation: 'pulse 2s infinite',
          }}
        >
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'white' }} />
          ● REC {formatTime(elapsed)}
        </button>
      )}

      {/* Unsaved recording banner */}
      {hasUnsaved && !isRecording && (
        <div style={{
          position: 'fixed', bottom: 16, right: 16, zIndex: 1000,
          background: 'white', border: '1px solid #e2e8f0', borderRadius: 12,
          padding: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', maxWidth: 320,
        }}>
          <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600, color: '#1e293b' }}>
            📹 Unsaved recording found
          </p>
          <p style={{ margin: '0 0 12px', fontSize: 12, color: '#64748b' }}>
            You have a recording from a previous lesson that wasn't downloaded.
          </p>
          <button
            onClick={downloadUnsaved}
            style={{
              padding: '6px 12px', borderRadius: 8, border: 'none',
              background: '#059669', color: 'white', fontSize: 12, fontWeight: 600,
              cursor: 'pointer', width: '100%',
            }}
          >
            Download now
          </button>
        </div>
      )}

      {/* Consent dialog */}
      {showConsent && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
        }}>
          <div style={{
            background: 'white', borderRadius: 16, padding: 32, maxWidth: 420,
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }}>
            <h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700, color: '#1e293b' }}>
              Record this lesson?
            </h2>
            <ul style={{ margin: '0 0 20px', paddingLeft: 20, fontSize: 13, color: '#475569', lineHeight: 1.6 }}>
              <li>The recording saves to <strong>your device only</strong></li>
              <li>It captures the <strong>whiteboard + audio</strong> (both voices)</li>
              <li>No faces are recorded — just the canvas</li>
              <li>Your tutor will see a <strong>recording indicator</strong></li>
              <li>At the end, you'll get <strong>one video file</strong> to download</li>
            </ul>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setShowConsent(false)}
                style={{
                  flex: 1, padding: '10px', borderRadius: 8, border: '1px solid #e2e8f0',
                  background: 'white', color: '#64748b', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={startRecording}
                style={{
                  flex: 1, padding: '10px', borderRadius: 8, border: 'none',
                  background: '#dc2626', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}
              >
                Start recording
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </>
  )
}
