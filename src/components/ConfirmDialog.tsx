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
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
    >
      <div
        className="w-full max-w-sm rounded-3xl p-8 flex flex-col gap-6"
        style={{ backgroundColor: '#fdf6f0', maxWidth: '380px' }}
      >
        <p style={{ fontSize: '1.4rem', fontWeight: 700, color: '#2d1a1a', textAlign: 'center', margin: 0 }}>
          {message}
        </p>
        <div className="flex flex-col gap-4">
          <BigButton onClick={onYes} label="Ja ✅" color="#4ade80" textColor="#14532d" />
          <BigButton onClick={onNo} label="Nein ❌" color="#f8e8e8" textColor="#2d1a1a" />
        </div>
      </div>
    </div>
  )
}
