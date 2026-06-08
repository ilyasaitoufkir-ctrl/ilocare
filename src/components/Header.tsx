import React from 'react'
import { ArrowLeft } from 'lucide-react'

interface HeaderProps {
  title: string
  onBack?: () => void
  rightAction?: React.ReactNode
}

export function Header({ title, onBack, rightAction }: HeaderProps) {
  return (
    <div
      className="flex items-center justify-between px-4 py-3 sticky top-0 z-10"
      style={{ backgroundColor: '#f8e8e8', borderBottom: '2px solid #e8a0a0', paddingTop: 'calc(env(safe-area-inset-top) + 12px)' }}
    >
      <div style={{ width: '56px' }}>
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center justify-center rounded-2xl"
            style={{ width: '56px', height: '56px', backgroundColor: '#ffffff', border: '2px solid #e8a0a0' }}
          >
            <ArrowLeft size={28} color="#2d1a1a" />
          </button>
        )}
      </div>
      <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#2d1a1a', margin: 0, textAlign: 'center' }}>
        {title}
      </h1>
      <div style={{ width: '56px', display: 'flex', justifyContent: 'flex-end' }}>
        {rightAction}
      </div>
    </div>
  )
}
