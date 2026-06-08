import React from 'react'

interface NightModeAlertProps {
  time: string
  contacts: { phone: string }[]
  userName: string
  onDismiss: () => void
}

export function NightModeAlert({ time, contacts, userName, onDismiss }: NightModeAlertProps) {
  function notifyFamily() {
    const phones = contacts.filter(c => c.phone).map(c => c.phone).join(',')
    const msg = `🌙 ${userName} ist um ${time} Uhr aktiv – alles OK?`
    if (phones) window.location.href = `sms:${phones}?body=${encodeURIComponent(msg)}`
    onDismiss()
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6" style={{ backgroundColor: 'rgba(15,23,42,0.9)' }}>
      <div
        className="flex flex-col items-center gap-5 w-full rounded-3xl p-8"
        style={{ backgroundColor: '#1e293b', maxWidth: '380px', border: '3px solid #475569' }}
      >
        <span style={{ fontSize: '4rem' }}>🌙</span>
        <p style={{ fontSize: '1.4rem', fontWeight: 900, color: '#f1f5f9', textAlign: 'center', margin: 0 }}>
          Nacht-Modus aktiv
        </p>
        <p style={{ fontSize: '1.1rem', color: '#94a3b8', textAlign: 'center', margin: 0, lineHeight: 1.5 }}>
          Es ist {time} Uhr. Die Familie kann informiert werden, dass du aktiv bist.
        </p>
        <button
          onClick={notifyFamily}
          className="w-full rounded-3xl"
          style={{ backgroundColor: '#3b82f6', minHeight: '80px', fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}
        >
          📱 Familie informieren
        </button>
        <button
          onClick={onDismiss}
          className="w-full rounded-3xl"
          style={{ backgroundColor: '#334155', minHeight: '70px', fontSize: '1.1rem', fontWeight: 700, color: '#94a3b8' }}
        >
          Nicht nötig, weiter
        </button>
      </div>
    </div>
  )
}
