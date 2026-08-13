'use client'

import { Tldraw } from 'tldraw'
import 'tldraw/tldraw.css'

export default function Home() {
  return (
    <div style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh' }}>
      <Tldraw />
    </div>
  )
}
