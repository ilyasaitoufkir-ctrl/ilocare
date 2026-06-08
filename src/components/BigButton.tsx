import React from 'react'

interface BigButtonProps {
  onClick: () => void
  emoji?: string
  label: string
  sublabel?: string
  color?: string
  textColor?: string
  disabled?: boolean
  className?: string
}

export function BigButton({
  onClick,
  emoji,
  label,
  sublabel,
  color = '#ffffff',
  textColor = '#0d2b27',
  disabled = false,
  className = '',
}: BigButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex flex-col items-center justify-center rounded-3xl shadow-md active:shadow-sm transition-all duration-100 ${className}`}
      style={{
        backgroundColor: color,
        color: textColor,
        minHeight: '90px',
        padding: '20px 16px',
        border: '2px solid rgba(0,0,0,0.08)',
      }}
    >
      {emoji && <span style={{ fontSize: '2.5rem', lineHeight: 1 }}>{emoji}</span>}
      <span style={{ fontSize: '1.4rem', fontWeight: 700, marginTop: emoji ? '8px' : 0, lineHeight: 1.2 }}>
        {label}
      </span>
      {sublabel && (
        <span style={{ fontSize: '1rem', marginTop: '4px', opacity: 0.75 }}>
          {sublabel}
        </span>
      )}
    </button>
  )
}
