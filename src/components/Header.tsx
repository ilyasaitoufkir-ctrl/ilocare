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
        background: '#ffffff',
        padding: '10px 16px',
        flexShrink: 0,
        boxShadow: '0 2px 12px rgba(77,184,158,0.15)',
        borderBottom: '1px solid #e6f7f2',
      }}
    >
      <div style={{ width: '48px' }}>
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center justify-center"
            style={{
              width: '44px', height: '44px', borderRadius: '12px',
              backgroundColor: '#f0faf5',
              border: '1.5px solid #c8ede4',
            }}
          >
            <ArrowLeft size={22} color="#4db89e" />
          </button>
        )}
      </div>
      <h1 style={{
        fontSize: '1.2rem', fontWeight: 800, color: '#2d3748',
        margin: 0, textAlign: 'center',
      }}>
        {title}
      </h1>
      <div style={{ width: '48px', display: 'flex', justifyContent: 'flex-end' }}>
        {rightAction}
      </div>
    </div>
  )
}
