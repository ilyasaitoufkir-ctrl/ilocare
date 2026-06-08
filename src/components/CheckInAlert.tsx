import React from 'react'

interface CheckInAlertProps {
  userName: string
  onCheckIn: () => void
  onDismiss: () => void
}

export function CheckInAlert({ userName, onCheckIn, onDismiss }: CheckInAlertProps) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
      <div
        className="flex flex-col items-center gap-6 w-full rounded-3xl p-8"
        style={{ backgroundColor: '#fdf6f0', maxWidth: '380px', border: '4px solid #e8a0a0' }}
      >
        <span style={{ fontSize: '4rem' }}>👋</span>
        <p style={{ fontSize: '1.5rem', fontWeight: 900, color: '#2d1a1a', textAlign: 'center', margin: 0 }}>
          Guten Morgen, {userName}!
        </p>
        <p style={{ fontSize: '1.1rem', color: '#6b4a4a', textAlign: 'center', margin: 0, lineHeight: 1.5 }}>
          Bitte täglichen Check-in bestätigen, damit die Familie weiß, dass alles in Ordnung ist.
        </p>
        <button
          onClick={onCheckIn}
          className="w-full rounded-3xl"
          style={{ backgroundColor: '#4ade80', border: '3px solid #16a34a', minHeight: '90px', fontSize: '1.4rem', fontWeight: 900, color: '#14532d' }}
        >
          ✅ Alles gut!
        </button>
        <button
          onClick={onDismiss}
          style={{ fontSize: '1rem', color: '#c87070', background: 'none', fontWeight: 600 }}
        >
          Später erinnern
        </button>
      </div>
    </div>
  )
}
