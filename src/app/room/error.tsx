'use client'

export default function RoomError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 16, fontFamily: 'system-ui, sans-serif', background: '#0f172a', color: '#e2e8f0' }} >
      <h2 style={{ fontSize: 20, fontWeight: 600 }}>Something went wrong</h2>
      <p style={{ fontSize: 14, color: '#94a3b8', maxWidth: 400, textAlign: 'center' }} >The whiteboard encountered an error. Your work has been auto-saved.</p>
      <button onClick={reset} style={{ padding: '8px 20px', borderRadius: 8, fontSize: 14, fontWeight: 500, background: '#059669', color: 'white', border: 'none', cursor: 'pointer' }} >Retry</button>
    </div>
  )
}
