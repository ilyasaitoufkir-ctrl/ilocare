import React, { useState } from 'react'
import { Header } from '../components/Header'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { useLocation } from '../hooks/useLocation'
import type { Contact } from '../types'

interface EmergencyScreenProps {
  contacts: Contact[]
  userName: string
  onBack: () => void
}

type UIState = 'idle' | 'confirm-ok' | 'confirm-notgood' | 'sos-1' | 'sos-2' | 'done-ok' | 'done-notgood' | 'calling-sos'

function getTime() {
  return new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
}

function openSMS(phones: string[], body: string) {
  const numbers = phones.filter(Boolean).join(',')
  if (!numbers) return
  window.location.href = `sms:${numbers}?body=${encodeURIComponent(body)}`
}

export function EmergencyScreen({ contacts, userName, onBack }: EmergencyScreenProps) {
  const [uiState, setUiState] = useState<UIState>('idle')
  const [lastOk, setLastOk] = useState(localStorage.getItem('ilocare_last_ok'))
  const { getLocation, loading: gpsLoading } = useLocation()
  const [sosActive, setSosActive] = useState(false)

  const allPhones = contacts.map(c => c.phone).filter(Boolean)
  const emergencyContact = contacts.find(c => c.isEmergency) ?? contacts[0]

  async function handleSOSConfirmed() {
    setSosActive(true)
    setUiState('calling-sos')

    let locationText = 'Standort nicht ermittelbar'
    try {
      const pos = await getLocation()
      locationText = pos.mapsUrl
    } catch { /* GPS not available */ }

    const msg = `🚨 NOTFALL! ${userName} braucht SOFORT Hilfe!\n📍 Standort: ${locationText}\n⏰ ${getTime()} Uhr`
    openSMS(allPhones, msg)

    setTimeout(() => {
      if (emergencyContact?.phone) {
        window.location.href = `tel:${emergencyContact.phone}`
      }
    }, 2000)
  }

  function handleOkConfirmed() {
    const t = getTime()
    setLastOk(t)
    localStorage.setItem('ilocare_last_ok', t)
    const msg = `✅ ${userName} geht es gut – ${t} Uhr`
    openSMS(allPhones, msg)
    setUiState('done-ok')
    setTimeout(() => setUiState('idle'), 5000)
  }

  function handleNotGoodConfirmed() {
    const msg = `⚠️ ${userName} fühlt sich heute nicht gut. – ${getTime()} Uhr`
    openSMS(allPhones, msg)
    setUiState('done-notgood')
    setTimeout(() => setUiState('idle'), 5000)
  }

  return (
    <div className="screen">
      <Header title="🆘 Notfall" onBack={onBack} />

      {uiState === 'confirm-ok' && (
        <ConfirmDialog message="Bist du sicher, dass es dir gut geht? ✅" onYes={handleOkConfirmed} onNo={() => setUiState('idle')} />
      )}
      {uiState === 'confirm-notgood' && (
        <ConfirmDialog message="Soll die Familie informiert werden? 🟡" onYes={handleNotGoodConfirmed} onNo={() => setUiState('idle')} />
      )}
      {uiState === 'sos-1' && (
        <ConfirmDialog message="⚠️ Wirklich Notruf auslösen? Erste Bestätigung." onYes={() => setUiState('sos-2')} onNo={() => setUiState('idle')} />
      )}
      {uiState === 'sos-2' && (
        <ConfirmDialog message="🚨 LETZTE BESTÄTIGUNG! Familie + Notrufnummer werden sofort kontaktiert!" onYes={handleSOSConfirmed} onNo={() => setUiState('idle')} />
      )}

      <div className="scroll-zone" style={{ padding: '16px 20px', paddingBottom: 'calc(env(safe-area-inset-bottom) + 20px)', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Letzter OK Status */}
        {lastOk && uiState === 'idle' && (
          <div className="rounded-2xl px-5 py-3 text-center" style={{ backgroundColor: '#f0fdf4', border: '2px solid #86efac' }}>
            <p style={{ fontSize: '1rem', color: '#166534', margin: 0, fontWeight: 600 }}>
              ✅ Letzter OK-Status heute um {lastOk} Uhr
            </p>
          </div>
        )}

        {/* SOS aktiv */}
        {uiState === 'calling-sos' && (
          <div
            className="rounded-3xl py-6 text-center"
            style={{ backgroundColor: '#fef2f2', border: '4px solid #ef4444', animation: 'pulse 1s infinite' }}
          >
            <p style={{ fontSize: '1.4rem', fontWeight: 900, color: '#dc2626', margin: 0 }}>
              🚨 NOTFALL AUSGELÖST!
            </p>
            <p style={{ fontSize: '1rem', color: '#dc2626', margin: '8px 0 0' }}>
              {gpsLoading ? '📍 GPS wird ermittelt...' : '📱 Notfallkontakt wird angerufen...'}
            </p>
          </div>
        )}

        {/* Done OK */}
        {uiState === 'done-ok' && (
          <div className="rounded-3xl py-6 text-center" style={{ backgroundColor: '#dcfce7', border: '3px solid #4ade80' }}>
            <p style={{ fontSize: '1.3rem', fontWeight: 800, color: '#166534', margin: 0 }}>
              ✅ Familie wurde informiert!<br />„{userName} geht es gut"
            </p>
          </div>
        )}

        {/* Done not good */}
        {uiState === 'done-notgood' && (
          <div className="rounded-3xl py-6 text-center" style={{ backgroundColor: '#fef9c3', border: '3px solid #fde047' }}>
            <p style={{ fontSize: '1.3rem', fontWeight: 800, color: '#92400e', margin: 0 }}>
              ⚠️ Familie wurde benachrichtigt!
            </p>
          </div>
        )}

        {/* ✅ OK Button */}
        {!sosActive && (
          <button
            onClick={() => setUiState('confirm-ok')}
            className="w-full flex flex-col items-center justify-center rounded-3xl active:scale-95 transition-all shadow-lg"
            style={{ backgroundColor: '#4ade80', border: '4px solid #16a34a', minHeight: '130px', padding: '20px' }}
          >
            <span style={{ fontSize: '3rem', lineHeight: 1 }}>✅</span>
            <span style={{ fontSize: '1.6rem', fontWeight: 900, color: '#14532d', marginTop: '10px' }}>
              Mir geht es gut
            </span>
            <span style={{ fontSize: '1rem', color: '#166534', marginTop: '4px' }}>Familie per SMS informieren</span>
          </button>
        )}

        {/* 🟡 Nicht gut Button */}
        {!sosActive && (
          <button
            onClick={() => setUiState('confirm-notgood')}
            className="w-full flex flex-col items-center justify-center rounded-3xl active:scale-95 transition-all shadow-lg"
            style={{ backgroundColor: '#fde047', border: '4px solid #ca8a04', minHeight: '130px', padding: '20px' }}
          >
            <span style={{ fontSize: '3rem', lineHeight: 1 }}>😔</span>
            <span style={{ fontSize: '1.6rem', fontWeight: 900, color: '#78350f', marginTop: '10px' }}>
              Mir geht es nicht gut
            </span>
            <span style={{ fontSize: '1rem', color: '#92400e', marginTop: '4px' }}>Familie benachrichtigen</span>
          </button>
        )}

        {/* 🔴 SOS Button */}
        {!sosActive && (
          <button
            onClick={() => setUiState('sos-1')}
            className="w-full flex flex-col items-center justify-center rounded-3xl shadow-2xl"
            style={{ backgroundColor: '#ef4444', border: '5px solid #991b1b', minHeight: '160px', padding: '24px' }}
          >
            <span style={{ fontSize: '3.5rem', lineHeight: 1 }}>🚨</span>
            <span style={{ fontSize: '2rem', fontWeight: 900, color: '#ffffff', marginTop: '10px', letterSpacing: '2px' }}>
              SOS – NOTRUF
            </span>
            <span style={{ fontSize: '1rem', color: '#fecaca', marginTop: '6px', textAlign: 'center' }}>
              GPS-Standort + SMS an Familie{'\n'}Notfallkontakt wird automatisch angerufen
            </span>
          </button>
        )}

        {/* GPS Hinweis */}
        <div className="rounded-2xl px-4 py-3" style={{ backgroundColor: '#f8e8e8', border: '2px solid #e8d0d0' }}>
          <p style={{ fontSize: '0.9rem', color: '#6b4a4a', margin: 0, lineHeight: 1.5, textAlign: 'center' }}>
            📍 Beim SOS-Alarm wird dein GPS-Standort automatisch mitgeschickt.
          </p>
        </div>
      </div>
    </div>
  )
}
