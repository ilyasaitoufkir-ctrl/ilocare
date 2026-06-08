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
      className="flex items-center justify-between"
      style={{
        background: 'linear-gradient(135deg, #1e8c7e, #2a9d8f 50%, #3db88a)',
        padding: '12px 16px',
        flexShrink: 0,
        boxShadow: '0 2px 20px rgba(30, 140, 126, 0.35)',
      }}
    >
      <div style={{ width: '52px' }}>
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center justify-center rounded-2xl"
            style={{
              width: '52px', height: '52px',
              backgroundColor: 'rgba(255,255,255,0.22)',
              border: '1.5px solid rgba(255,255,255,0.45)',
            }}
          >
            <ArrowLeft size={26} color="#ffffff" />
          </button>
        )}
      </div>
      <h1 style={{
        fontSize: '1.5rem', fontWeight: 800, color: '#ffffff',
        margin: 0, textAlign: 'center',
        textShadow: '0 1px 6px rgba(0,0,0,0.12)',
      }}>
        {title}
      </h1>
      <div style={{ width: '52px', display: 'flex', justifyContent: 'flex-end' }}>
        {rightAction}
      </div>
    </div>
  )
}
