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
      style={{
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        padding: '12px 16px',
        flexShrink: 0,
        borderBottom: '1px solid rgba(255,255,255,0.8)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <div style={{ width: '48px' }}>
        {onBack && (
          <button
            onClick={onBack}
            style={{
              width: '44px', height: '44px', borderRadius: '12px',
              backgroundColor: '#e8fff8',
              border: '1.5px solid #a7f3d0',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <ArrowLeft size={22} color="#00c896" strokeWidth={2.5} />
          </button>
        )}
      </div>
      <h1 style={{
        fontSize: '1.15rem', fontWeight: 800, color: '#1a1a2e',
        margin: 0, textAlign: 'center',
        letterSpacing: '-0.02em',
        fontFamily: "'Inter', -apple-system, sans-serif",
      }}>
        {title}
      </h1>
      <div style={{ width: '48px', display: 'flex', justifyContent: 'flex-end' }}>
        {rightAction}
      </div>
    </div>
  )
}
