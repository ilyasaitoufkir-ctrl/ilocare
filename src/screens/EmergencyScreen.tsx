import React, { useState, useEffect } from 'react'
import { Header } from '../components/Header'
import { ConfirmDialog } from '../components/ConfirmDialog'
import type { Contact } from '../types'

interface EmergencyScreenProps {
  contacts: Contact[]
  userName: string
  onBack: () => void
}

type EmergencyState = 'idle' | 'confirm-ok' | 'confirm-notgood' | 'confirm-sos-1' | 'confirm-sos-2' | 'done-ok' | 'done-notgood' | 'calling-sos'

function sendWhatsAppToAll(contacts: Contact[], message: string) {
  const firstContact = contacts[0]
  if (firstContact?.phone) {
    const url = `https://wa.me/${firstContact.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`
    window.open(url, '_blank')
  }
}

function callFirstContact(contacts: Contact[]) {
  const emergency = contacts.find(c => c.isEmergency) ?? contacts[0]
  if (emergency?.phone) {
    window.location.href = `tel:${emergency.phone}`
  }
}

function getCurrentTime() {
  return new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
}

export function EmergencyScreen({ contacts, userName, onBack }: EmergencyScreenProps) {
  const [uiState, setUiState] = useState<EmergencyState>('idle')
  const [lastOkTime, setLastOkTime] = useState<string | null>(
    localStorage.getItem('ilocare_last_ok')
  )

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>
    if (uiState === 'done-ok' || uiState === 'done-notgood') {
      timeout = setTimeout(() => setUiState('idle'), 5000)
    }
    return () => clearTimeout(timeout)
  }, [uiState])

  function handleOkConfirmed() {
    const time = getCurrentTime()
    setLastOkTime(time)
    localStorage.setItem('ilocare_last_ok', time)
    sendWhatsAppToAll(contacts, `✅ ${userName} geht es gut – ${time} Uhr`)
    setUiState('done-ok')
  }

  function handleNotGoodConfirmed() {
    const time = getCurrentTime()
    sendWhatsAppToAll(contacts, `⚠️ ${userName} fühlt sich heute nicht gut – ${time} Uhr`)
    setUiState('done-notgood')
  }

  function handleSOSStep2() {
    setUiState('calling-sos')
    const time = getCurrentTime()
    sendWhatsAppToAll(contacts, `🚨 NOTFALL – ${userName} braucht Hilfe! – ${time} Uhr`)
    setTimeout(() => {
      callFirstContact(contacts)
    }, 800)
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: '#fdf6f0' }}>
      <Header title="🆘 Notfall" onBack={onBack} />

      {/* Confirm Dialogs */}
      {uiState === 'confirm-ok' && (
        <ConfirmDialog
          message="Bist du sicher, dass es dir gut geht? ✅"
          onYes={handleOkConfirmed}
          onNo={() => setUiState('idle')}
        />
      )}
      {uiState === 'confirm-notgood' && (
        <ConfirmDialog
          message="Soll die Familie informiert werden, dass es dir nicht gut geht? 🟡"
          onYes={handleNotGoodConfirmed}
          onNo={() => setUiState('idle')}
        />
      )}
      {uiState === 'confirm-sos-1' && (
        <ConfirmDialog
          message="⚠️ Erste Bestätigung: Wirklich Notfall auslösen?"
          onYes={() => setUiState('confirm-sos-2')}
          onNo={() => setUiState('idle')}
        />
      )}
      {uiState === 'confirm-sos-2' && (
        <ConfirmDialog
          message="🚨 Letzte Bestätigung! Familie wird sofort alarmiert und angerufen!"
          onYes={handleSOSStep2}
          onNo={() => setUiState('idle')}
        />
      )}

      <div className="flex flex-col gap-5 p-5 flex-1" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 20px)' }}>

        {/* Letzter OK Status */}
        {lastOkTime && (
          <div
            className="rounded-2xl px-5 py-4 text-center"
            style={{ backgroundColor: '#f0fdf4', border: '2px solid #86efac' }}
          >
            <p style={{ fontSize: '1rem', color: '#166534', margin: 0, fontWeight: 600 }}>
              ✅ Letzter OK-Status: heute {lastOkTime} Uhr
            </p>
          </div>
        )}

        {/* Erfolgs-Banner OK */}
        {uiState === 'done-ok' && (
          <div
            className="rounded-2xl px-5 py-5 text-center"
            style={{ backgroundColor: '#dcfce7', border: '3px solid #4ade80' }}
          >
            <p style={{ fontSize: '1.3rem', fontWeight: 800, color: '#166534', margin: 0 }}>
              ✅ Nachricht gesendet!{'\n'}"{userName} geht es gut – {lastOkTime} Uhr"
            </p>
          </div>
        )}

        {/* Erfolgs-Banner Nicht gut */}
        {uiState === 'done-notgood' && (
          <div
            className="rounded-2xl px-5 py-5 text-center"
            style={{ backgroundColor: '#fef9c3', border: '3px solid #fde047' }}
          >
            <p style={{ fontSize: '1.3rem', fontWeight: 800, color: '#92400e', margin: 0 }}>
              ⚠️ Familie wurde informiert!
            </p>
          </div>
        )}

        {/* SOS aktiv */}
        {uiState === 'calling-sos' && (
          <div
            className="rounded-2xl px-5 py-5 text-center animate-pulse"
            style={{ backgroundColor: '#fef2f2', border: '3px solid #f87171' }}
          >
            <p style={{ fontSize: '1.4rem', fontWeight: 800, color: '#dc2626', margin: 0 }}>
              🚨 NOTFALL AUSGELÖST!{'\n'}Notfallkontakt wird angerufen...
            </p>
          </div>
        )}

        {/* 🟢 OK Button */}
        <button
          onClick={() => setUiState('confirm-ok')}
          className="w-full flex flex-col items-center justify-center rounded-3xl active:scale-95 transition-all shadow-lg"
          style={{
            backgroundColor: '#4ade80',
            border: '4px solid #16a34a',
            minHeight: '130px',
            padding: '20px',
          }}
        >
          <span style={{ fontSize: '3rem' }}>✅</span>
          <span style={{ fontSize: '1.6rem', fontWeight: 900, color: '#14532d', marginTop: '8px' }}>
            Mir geht es gut
          </span>
          <span style={{ fontSize: '1rem', color: '#166534', marginTop: '4px' }}>
            Familie informieren
          </span>
        </button>

        {/* 🟡 Nicht gut Button */}
        <button
          onClick={() => setUiState('confirm-notgood')}
          className="w-full flex flex-col items-center justify-center rounded-3xl active:scale-95 transition-all shadow-lg"
          style={{
            backgroundColor: '#fde047',
            border: '4px solid #ca8a04',
            minHeight: '130px',
            padding: '20px',
          }}
        >
          <span style={{ fontSize: '3rem' }}>😔</span>
          <span style={{ fontSize: '1.6rem', fontWeight: 900, color: '#78350f', marginTop: '8px' }}>
            Mir geht es nicht gut
          </span>
          <span style={{ fontSize: '1rem', color: '#92400e', marginTop: '4px' }}>
            Familie benachrichtigen
          </span>
        </button>

        {/* 🔴 SOS Button */}
        <button
          onClick={() => setUiState('confirm-sos-1')}
          className="w-full flex flex-col items-center justify-center rounded-3xl shadow-xl"
          style={{
            backgroundColor: '#ef4444',
            border: '4px solid #991b1b',
            minHeight: '150px',
            padding: '20px',
            animation: 'none',
          }}
        >
          <span style={{ fontSize: '3.5rem' }}>🚨</span>
          <span style={{ fontSize: '1.8rem', fontWeight: 900, color: '#ffffff', marginTop: '8px', letterSpacing: '2px' }}>
            SOS – NOTFALL
          </span>
          <span style={{ fontSize: '1rem', color: '#fecaca', marginTop: '4px' }}>
            Notfallkontakt wird angerufen
          </span>
        </button>
      </div>
    </div>
  )
}
