import React, { useState, useEffect } from 'react'

interface FallAlertProps {
  onDismiss: () => void
  onSOS: () => void
  countdownSeconds: number
}

export function FallAlert({ onDismiss, onSOS, countdownSeconds }: FallAlertProps) {
  const [remaining, setRemaining] = useState(countdownSeconds)

  useEffect(() => {
    if (remaining <= 0) { onSOS(); return }
    const id = setTimeout(() => setRemaining(r => r - 1), 1000)
    return () => clearTimeout(id)
  }, [remaining, onSOS])

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6" style={{ backgroundColor: 'rgba(239,68,68,0.92)' }}>
      <div className="flex flex-col items-center gap-6 w-full max-w-sm">
        <span style={{ fontSize: '5rem' }}>⚠️</span>
        <p style={{ fontSize: '1.6rem', fontWeight: 900, color: '#fff', textAlign: 'center', margin: 0 }}>
          Sturz erkannt!{'\n'}Bist du OK?
        </p>
        <div
          className="rounded-full flex items-center justify-center"
          style={{ width: '100px', height: '100px', backgroundColor: 'rgba(255,255,255,0.2)', border: '4px solid #fff' }}
        >
          <span style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fff' }}>{remaining}</span>
        </div>
        <p style={{ fontSize: '1.1rem', color: '#fecaca', margin: 0, textAlign: 'center' }}>
          SOS in {remaining} Sekunden → Familie wird informiert
        </p>
        <button
          onClick={onDismiss}
          className="w-full rounded-3xl"
          style={{ backgroundColor: '#4ade80', minHeight: '90px', fontSize: '1.5rem', fontWeight: 900, color: '#14532d' }}
        >
          ✅ Ja, ich bin OK!
        </button>
      </div>
    </div>
  )
}
