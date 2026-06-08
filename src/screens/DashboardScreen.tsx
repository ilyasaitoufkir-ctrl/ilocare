import React, { useState } from 'react'
import { useClock } from '../hooks/useClock'
import { useWeather } from '../hooks/useWeather'
import { useNews } from '../hooks/useNews'
import { ConfirmDialog } from '../components/ConfirmDialog'
import type { Medication, Screen, Contact } from '../types'

interface DashboardScreenProps {
  userName: string
  weatherCity: string
  medications: Medication[]
  contacts: Contact[]
  checkedInToday: boolean
  lastCheckInTime?: string
  onNavigate: (screen: Screen) => void
  onOkSend: () => void
}

function getNextDose(medications: Medication[]): { name: string; time: string } | null {
  const nowMins = new Date().getHours() * 60 + new Date().getMinutes()
  let soonest: { name: string; time: string; mins: number } | null = null
  for (const med of medications) {
    for (const dose of med.doses) {
      if (dose.taken) continue
      const [h, m] = dose.time.split(':').map(Number)
      const mins = h * 60 + m
      const diff = mins - nowMins
      if (diff >= 0 && (!soonest || diff < soonest.mins)) {
        soonest = { name: med.name, time: dose.time, mins: diff }
      }
    }
  }
  return soonest ? { name: soonest.name, time: soonest.time } : null
}

function getCountdown(timeStr: string): string {
  const now = new Date()
  const [h, m] = timeStr.split(':').map(Number)
  const target = new Date()
  target.setHours(h, m, 0, 0)
  const diff = Math.max(0, Math.floor((target.getTime() - now.getTime()) / 60000))
  if (diff === 0) return 'Jetzt!'
  if (diff < 60) return `in ${diff} Min.`
  return `in ${Math.floor(diff / 60)}h ${diff % 60}m`
}

const MAIN_BUTTONS: { screen: Screen; emoji: string; label: string; color: string; border: string }[] = [
  { screen: 'contacts',    emoji: '👥',  label: 'Kontakte',     color: '#fff',    border: '#e8d0d0' },
  { screen: 'doctors',     emoji: '👨‍⚕️', label: 'Arzt / Notfall', color: '#f0fdf4', border: '#86efac' },
  { screen: 'medications', emoji: '💊',  label: 'Medikamente',  color: '#fff',    border: '#e8d0d0' },
  { screen: 'emergency',   emoji: '🆘',  label: 'SOS Notruf',   color: '#fff0f0', border: '#f87171' },
]

const SECONDARY_BUTTONS: { screen: Screen; emoji: string; label: string }[] = [
  { screen: 'insurance', emoji: '💳', label: 'Krankenkasse' },
  { screen: 'shopping',  emoji: '🛒', label: 'Einkaufsliste' },
  { screen: 'messages',  emoji: '💬', label: 'Nachrichten' },
  { screen: 'location',  emoji: '📍', label: 'Standort' },
]

export function DashboardScreen({
  userName, weatherCity, medications, contacts,
  checkedInToday, lastCheckInTime,
  onNavigate, onOkSend,
}: DashboardScreenProps) {
  const { time, dayName, date, greeting } = useClock()
  const { data: weather } = useWeather(weatherCity)
  const { items: news } = useNews()
  const [showOkConfirm, setShowOkConfirm] = useState(false)
  const [okSent, setOkSent] = useState(false)

  const pendingMeds = medications.filter(m => m.doses.some(d => !d.taken))
  const nextDose = getNextDose(medications)

  function handleOkConfirmed() {
    setShowOkConfirm(false)
    onOkSend()
    setOkSent(true)
    setTimeout(() => setOkSent(false), 5000)
  }

  return (
    <div className="screen">
      {showOkConfirm && (
        <ConfirmDialog
          message="Bist du sicher, dass es dir gut geht? ✅"
          onYes={handleOkConfirmed}
          onNo={() => setShowOkConfirm(false)}
        />
      )}

      {/* ── Uhr-Header ──────────────────────────────────────────────────── */}
      <div style={{
        flexShrink: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '10px 16px 8px',
        backgroundColor: '#f8e8e8',
        borderBottom: '3px solid #e8a0a0',
      }}>
        <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#c87070', margin: '0 0 2px', letterSpacing: '3px', textTransform: 'uppercase' }}>ilocare</p>
        <span style={{ fontSize: '3.6rem', fontWeight: 900, color: '#2d1a1a', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{time}</span>
        <p style={{ fontSize: '1rem', fontWeight: 700, color: '#6b4a4a', margin: '2px 0 0' }}>{dayName}, {date}</p>
        <p style={{ fontSize: '0.85rem', color: '#c87070', margin: '1px 0 0', fontWeight: 600 }}>{greeting}, {userName}! 😊</p>
      </div>

      {/* ── Content (no scroll) ─────────────────────────────────────────── */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        padding: '10px 14px',
        gap: '8px',
      }}>

        {/* ── Wetter + Check-in ───────────────────────────────────────────── */}
        <div style={{ flexShrink: 0, display: 'flex', gap: '8px' }}>
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: '8px',
            borderRadius: '14px', padding: '10px 12px',
            backgroundColor: '#fff', border: '2px solid #e8d0d0',
            minHeight: '56px',
          }}>
            {weather ? (
              <>
                <span style={{ fontSize: '1.8rem', lineHeight: 1 }}>{weather.icon}</span>
                <div>
                  <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#2d1a1a' }}>{weather.temp}°C</span>
                  <p style={{ fontSize: '0.78rem', color: '#6b4a4a', margin: 0, fontWeight: 600 }}>{weather.description}</p>
                </div>
              </>
            ) : (
              <p style={{ fontSize: '0.9rem', color: '#6b4a4a', margin: 0 }}>🌤️ Wetter...</p>
            )}
          </div>
          {checkedInToday && (
            <div style={{
              flexShrink: 0, display: 'flex', alignItems: 'center',
              borderRadius: '14px', padding: '10px 12px',
              backgroundColor: '#f0fdf4', border: '2px solid #86efac',
            }}>
              <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#166534', margin: 0 }}>
                ✅ Check-in{lastCheckInTime ? ` ${lastCheckInTime}` : ''}
              </p>
            </div>
          )}
        </div>

        {/* ── OK Button ───────────────────────────────────────────────────── */}
        {okSent ? (
          <div style={{ flexShrink: 0, borderRadius: '18px', padding: '14px', textAlign: 'center', backgroundColor: '#dcfce7', border: '3px solid #4ade80' }}>
            <p style={{ fontSize: '1.1rem', fontWeight: 800, color: '#166534', margin: 0 }}>✅ Familie informiert!</p>
          </div>
        ) : (
          <button
            onClick={() => setShowOkConfirm(true)}
            style={{
              flexShrink: 0, width: '100%', borderRadius: '18px',
              backgroundColor: '#4ade80', border: '3px solid #16a34a',
              minHeight: '70px', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: '2px',
            }}
          >
            <span style={{ fontSize: '1.6rem', lineHeight: 1 }}>✅</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#14532d' }}>Mir geht es gut</span>
            <span style={{ fontSize: '0.78rem', color: '#166534' }}>Familie per SMS informieren</span>
          </button>
        )}

        {/* ── Medikamenten Status ─────────────────────────────────────────── */}
        {medications.length > 0 && (
          <button
            onClick={() => onNavigate('medications')}
            style={{
              flexShrink: 0, width: '100%', borderRadius: '14px',
              padding: '10px 14px', textAlign: 'left',
              backgroundColor: pendingMeds.length > 0 ? '#fef3c7' : '#f0fdf4',
              border: `2px solid ${pendingMeds.length > 0 ? '#fcd34d' : '#86efac'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              minHeight: '44px',
            }}
          >
            <span style={{ fontSize: '0.9rem', fontWeight: 800, color: pendingMeds.length > 0 ? '#92400e' : '#166534' }}>
              💊 {pendingMeds.length > 0
                ? `${pendingMeds.reduce((n, m) => n + m.doses.filter(d => !d.taken).length, 0)} Einnahmen offen`
                : 'Alle eingenommen ✅'}
            </span>
            {nextDose && (
              <span style={{ fontSize: '0.82rem', color: '#92400e', fontWeight: 600 }}>
                ⏰ {nextDose.name} {getCountdown(nextDose.time)}
              </span>
            )}
          </button>
        )}

        {/* ── 4 Haupt-Buttons ─────────────────────────────────────────────── */}
        <div style={{ flexShrink: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {MAIN_BUTTONS.map(btn => (
            <button
              key={btn.screen}
              onClick={() => onNavigate(btn.screen)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                borderRadius: '18px', padding: '10px 8px',
                backgroundColor: btn.color, border: `3px solid ${btn.border}`,
                minHeight: '80px', gap: '4px',
              }}
            >
              <span style={{ fontSize: '1.9rem', lineHeight: 1 }}>{btn.emoji}</span>
              <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#2d1a1a', textAlign: 'center' }}>{btn.label}</span>
            </button>
          ))}
        </div>

        {/* ── 4 Sekundär-Buttons ──────────────────────────────────────────── */}
        <div style={{ flexShrink: 0, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
          {SECONDARY_BUTTONS.map(btn => (
            <button
              key={btn.screen}
              onClick={() => onNavigate(btn.screen)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                borderRadius: '14px', padding: '8px 4px',
                backgroundColor: '#fff', border: '2px solid #e8d0d0',
                minHeight: '60px', gap: '3px',
              }}
            >
              <span style={{ fontSize: '1.4rem', lineHeight: 1 }}>{btn.emoji}</span>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#6b4a4a', textAlign: 'center', lineHeight: 1.2 }}>{btn.label}</span>
            </button>
          ))}
        </div>

        {/* ── Nachrichten (2 Schlagzeilen) ────────────────────────────────── */}
        <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <p style={{ fontSize: '0.82rem', fontWeight: 800, color: '#2d1a1a', margin: 0 }}>📰 Nachrichten</p>
          {news.slice(0, 2).map((item, i) => (
            <a key={i} href={item.link} target="_blank" rel="noopener noreferrer"
              style={{
                display: 'block', borderRadius: '12px', padding: '8px 12px',
                backgroundColor: '#fff', border: '2px solid #e8d0d0', textDecoration: 'none',
              }}>
              <p style={{ fontSize: '0.88rem', fontWeight: 700, color: '#2d1a1a', margin: 0, lineHeight: 1.3 }}>{item.title}</p>
            </a>
          ))}
        </div>

        {/* ── Einstellungen ───────────────────────────────────────────────── */}
        <button
          onClick={() => onNavigate('settings')}
          style={{
            flexShrink: 0, width: '100%', borderRadius: '14px',
            padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            backgroundColor: '#f8e8e8', border: '2px solid #e8a0a0',
            marginTop: 'auto',
          }}
        >
          <span>⚙️</span>
          <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#6b4a4a' }}>Einstellungen</span>
        </button>
      </div>
    </div>
  )
}
