import React from 'react'
import { BigButton } from './BigButton'

interface ConfirmDialogProps {
  message: string
  onYes: () => void
  onNo: () => void
}

export function ConfirmDialog({ message, onYes, onNo }: ConfirmDialogProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ backgroundColor: 'rgba(13,43,39,0.6)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="w-full max-w-sm rounded-3xl p-8 flex flex-col gap-6"
        style={{
          background: 'rgba(255,255,255,0.96)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1.5px solid rgba(255,255,255,0.7)',
          boxShadow: '0 16px 48px rgba(42,157,143,0.25)',
          maxWidth: '380px',
        }}
      >
        <p style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0d2b27', textAlign: 'center', margin: 0 }}>
          {message}
        </p>
        <div className="flex flex-col gap-4">
          <BigButton onClick={onYes} label="Ja ✅" color="#52d68a" textColor="#0d2b27" />
          <BigButton onClick={onNo} label="Nein ❌" color="rgba(255,255,255,0.9)" textColor="#1a4a44" />
        </div>
      </div>
    </div>
  )
}
