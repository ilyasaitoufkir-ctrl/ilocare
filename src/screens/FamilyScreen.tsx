import React, { useState } from 'react'
import { Header } from '../components/Header'
import type { AppState } from '../types'

interface FamilyScreenProps {
  state: AppState
  onBack: () => void
}

function StatusRow({ emoji, label, value, ok }: { emoji: string; label: string; value: string; ok: boolean }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '14px',
      borderRadius: '16px', padding: '14px 16px',
      background: ok ? 'rgba(220,252,231,0.9)' : 'rgba(254,243,199,0.9)',
      border: `1.5px solid ${ok ? '#86efac' : '#fcd34d'}`,
    }}>
      <span style={{ fontSize: '1.6rem', lineHeight: 1, flexShrink: 0 }}>{emoji}</span>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1a4a44', margin: 0 }}>{label}</p>
        <p style={{ fontSize: '1rem', fontWeight: 800, color: ok ? '#166534' : '#92400e', margin: 0 }}>{value}</p>
      </div>
      <span style={{ fontSize: '1.3rem' }}>{ok ? '✅' : '⚠️'}</span>
    </div>
  )
}

export function FamilyScreen({ state, onBack }: FamilyScreenProps) {
  const [enteredCode, setEnteredCode] = useState('')
  const [unlocked, setUnlocked] = useState(false)
  const [error, setError] = useState(false)
  const digits = ['1','2','3','4','5','6','7','8','9','','0','⌫']

  function handleDigit(d: string) {
    if (enteredCode.length >= 4) return
    const next = enteredCode + d
    setEnteredCode(next)
    if (next.length === 4) {
      if (next === state.familyCode || next === state.adminPin) {
        setUnlocked(true)
      } else {
        setError(true)
        setTimeout(() => { setEnteredCode(''); setError(false) }, 900)
      }
    }
  }

  const medsTakenToday = state.medications.length > 0 &&
    state.medications.every(m => m.doses.every(d => d.taken))
  const medsPendingCount = state.medications.reduce((n, m) => n + m.doses.filter(d => !d.taken).length, 0)

  const lastOk = localStorage.getItem('ilocare_last_ok')
  const today = new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const now = new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })

  if (!unlocked) {
    return (
      <div className="screen">
        <Header title="👨‍👩‍👧 Familienansicht" onBack={onBack} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', gap: '24px' }}>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '3rem' }}>🔒</span>
            <p style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0d2b27', margin: '8px 0 4px' }}>Familiencode eingeben</p>
            <p style={{ fontSize: '0.9rem', color: '#1a4a44', margin: 0 }}>Code in den Einstellungen festlegbar</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            {[0,1,2,3].map(i => (
              <div key={i} style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: i < enteredCode.length ? (error ? '#ef4444' : '#7ececa') : '#b5e3e3', border: '2px solid #7ececa' }} />
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', width: '100%', maxWidth: '280px' }}>
            {digits.map((d, i) => (
              <button key={i}
                onClick={() => d === '⌫' ? setEnteredCode(p => p.slice(0, -1)) : d ? handleDigit(d) : undefined}
                disabled={!d}
                style={{
                  height: '72px', borderRadius: '18px', fontSize: '1.6rem', fontWeight: 700,
                  backgroundColor: d ? '#fff' : 'transparent',
                  border: d ? '2px solid #b5e3e3' : 'none',
                  color: '#0d2b27',
                  visibility: d ? 'visible' : 'hidden',
                }}
              >{d}</button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="screen">
      <Header title={`👨‍👩‍👧 Status von ${state.userName}`} onBack={onBack} />

      <div className="scroll-zone" style={{ padding: '14px 16px', paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)', display: 'flex', flexDirection: 'column', gap: '12px' }}>

        {/* Header Info */}
        <div style={{ borderRadius: '20px', padding: '16px', background: 'linear-gradient(135deg, #1a7a6e, #2a9d8f)', textAlign: 'center' }}>
          <p style={{ fontSize: '1.6rem', margin: 0 }}>👤</p>
          <p style={{ fontSize: '1.3rem', fontWeight: 900, color: '#fff', margin: '4px 0 2px' }}>{state.userName}</p>
          <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)', margin: 0, fontWeight: 600 }}>Stand: {today} · {now} Uhr</p>
        </div>

        <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'rgba(255,255,255,0.75)', margin: 0, letterSpacing: '2px', textTransform: 'uppercase' }}>
          Heutiger Status
        </p>

        <StatusRow
          emoji="✅"
          label="OK-Meldung"
          value={lastOk ? `Heute um ${lastOk} Uhr gemeldet` : 'Noch keine Meldung heute'}
          ok={!!lastOk}
        />

        <StatusRow
          emoji="💊"
          label="Medikamente"
          value={
            state.medications.length === 0 ? 'Keine Medikamente eingetragen' :
            medsTakenToday ? 'Alle eingenommen ✅' :
            `Noch ${medsPendingCount} Einnahme(n) ausstehend`
          }
          ok={state.medications.length === 0 || medsTakenToday}
        />

        <StatusRow
          emoji="📍"
          label="Letzter bekannter Standort"
          value={
            state.lastKnownLocation
              ? `${state.lastKnownLocation.address || 'Standort bekannt'} · ${state.lastKnownLocation.timestamp}`
              : 'Noch nicht freigegeben'
          }
          ok={!!state.lastKnownLocation}
        />

        {state.lastKnownLocation && (
          <button
            onClick={() => { const l = state.lastKnownLocation!; window.open(`https://maps.google.com/maps?q=${l.lat},${l.lon}`, '_blank') }}
            style={{ borderRadius: '16px', padding: '12px', background: 'rgba(255,255,255,0.88)', border: '1.5px solid rgba(255,255,255,0.65)', fontSize: '0.95rem', fontWeight: 700, color: '#0d2b27' }}
          >
            📍 Auf Karte anzeigen
          </button>
        )}

        {/* Medications Detail */}
        {state.medications.length > 0 && (
          <div style={{ borderRadius: '20px', padding: '16px', background: 'rgba(255,255,255,0.92)', border: '1.5px solid rgba(255,255,255,0.65)' }}>
            <p style={{ fontSize: '1rem', fontWeight: 800, color: '#0d2b27', margin: '0 0 10px' }}>💊 Medikamentendetails</p>
            {state.medications.map(m => (
              <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0d2b27' }}>{m.name}</span>
                <span style={{ fontSize: '0.85rem', color: m.doses.every(d => d.taken) ? '#16a34a' : '#92400e', fontWeight: 700 }}>
                  {m.doses.filter(d => d.taken).length}/{m.doses.length} ✓
                </span>
              </div>
            ))}
          </div>
        )}

        <div style={{ borderRadius: '16px', padding: '12px 16px', background: 'rgba(255,255,255,0.7)', border: '1.5px solid rgba(255,255,255,0.5)', textAlign: 'center' }}>
          <p style={{ fontSize: '0.8rem', color: '#1a4a44', margin: 0, lineHeight: 1.5 }}>
            ℹ️ Diese Ansicht zeigt den aktuellen Status lokal auf dem Gerät.
            Für Echtzeit-Updates bitte {state.userName} direkt kontaktieren.
          </p>
        </div>

      </div>
    </div>
  )
}
