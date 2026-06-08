import React from 'react'

interface CheckInAlertProps {
  userName: string
  onCheckIn: () => void
  onDismiss: () => void
}

export function CheckInAlert({ userName, onCheckIn, onDismiss }: CheckInAlertProps) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6"
      style={{ backgroundColor: 'rgba(13,43,39,0.65)', backdropFilter: 'blur(4px)' }}>
      <div
        className="flex flex-col items-center gap-6 w-full rounded-3xl p-8"
        style={{
          background: 'rgba(255,255,255,0.96)',
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          border: '1.5px solid rgba(255,255,255,0.7)',
          boxShadow: '0 16px 48px rgba(42,157,143,0.3)',
          maxWidth: '380px',
        }}
      >
        <span style={{ fontSize: '4rem' }}>👋</span>
        <p style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0d2b27', textAlign: 'center', margin: 0 }}>
          Guten Morgen, {userName}!
        </p>
        <p style={{ fontSize: '1.1rem', color: '#1a4a44', textAlign: 'center', margin: 0, lineHeight: 1.5 }}>
          Bitte täglichen Check-in bestätigen, damit die Familie weiß, dass alles in Ordnung ist.
        </p>
        <button
          onClick={onCheckIn}
          className="w-full rounded-3xl"
          style={{
            background: 'linear-gradient(135deg, #52d68a, #8fe03a)',
            border: '1.5px solid rgba(255,255,255,0.5)',
            minHeight: '90px', fontSize: '1.4rem', fontWeight: 900, color: '#0d2b27',
            boxShadow: '0 6px 20px rgba(82,214,138,0.35)',
          }}
        >
          ✅ Alles gut!
        </button>
        <button
          onClick={onDismiss}
          style={{ fontSize: '1rem', color: '#2a9d8f', background: 'none', fontWeight: 600 }}
        >
          Später erinnern
        </button>
      </div>
    </div>
  )
}
