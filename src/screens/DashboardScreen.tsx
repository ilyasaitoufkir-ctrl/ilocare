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

const MAIN_BUTTONS: { screen: Screen; emoji: string; label: string; grad: string; shadow: string }[] = [
  { screen: 'contacts',    emoji: '👥',  label: 'Kontakte',       grad: 'linear-gradient(135deg, #2a9d8f, #7ececa)', shadow: 'rgba(42,157,143,0.35)' },
  { screen: 'doctors',     emoji: '👨‍⚕️', label: 'Arzt & Notfall', grad: 'linear-gradient(135deg, #52d68a, #a8edbb)', shadow: 'rgba(82,214,138,0.35)' },
  { screen: 'medications', emoji: '💊',  label: 'Medikamente',    grad: 'linear-gradient(135deg, #7ececa, #2a9d8f)', shadow: 'rgba(126,206,202,0.35)' },
  { screen: 'emergency',   emoji: '🆘',  label: 'SOS Notruf',     grad: 'linear-gradient(135deg, #f05a5a, #dc2626)', shadow: 'rgba(220,38,38,0.35)' },
]

const SECONDARY_BUTTONS: { screen: Screen; emoji: string; label: string; grad: string }[] = [
  { screen: 'insurance', emoji: '💳', label: 'Krankenkasse', grad: 'linear-gradient(135deg, #8fe03a, #a8edbb)' },
  { screen: 'shopping',  emoji: '🛒', label: 'Einkaufen',    grad: 'linear-gradient(135deg, #52d68a, #7ececa)' },
  { screen: 'messages',  emoji: '💬', label: 'Nachrichten',  grad: 'linear-gradient(135deg, #2a9d8f, #52d68a)' },
  { screen: 'location',  emoji: '📍', label: 'Standort',     grad: 'linear-gradient(135deg, #7ececa, #8fe03a)' },
]

export function DashboardScreen({
  userName, weatherCity, medications,
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

      {/* ── Gradient Header ──────────────────────────────────────────────── */}
      <div style={{
        flexShrink: 0,
        background: 'linear-gradient(135deg, #1a7a6e 0%, #2a9d8f 50%, #3db88a 100%)',
        padding: '10px 18px 12px',
        boxShadow: '0 4px 24px rgba(26,122,110,0.4)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
      }}>
        <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.75)', margin: 0, letterSpacing: '4px', textTransform: 'uppercase' }}>
          ✦ ilocare ✦
        </p>
        <span style={{
          fontSize: '3.8rem', fontWeight: 900, color: '#ffffff', lineHeight: 1,
          fontVariantNumeric: 'tabular-nums', textShadow: '0 2px 12px rgba(0,0,0,0.15)',
        }}>
          {time}
        </span>
        <p style={{ fontSize: '0.95rem', fontWeight: 700, color: 'rgba(255,255,255,0.9)', margin: 0 }}>
          {dayName}, {date}
        </p>
        <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)', margin: '1px 0 6px' }}>
          {greeting}, {userName}! 😊
        </p>

        {/* Weather + Check-in row */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {weather ? (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              backgroundColor: 'rgba(255,255,255,0.2)',
              borderRadius: '20px', padding: '5px 12px',
              border: '1px solid rgba(255,255,255,0.35)',
            }}>
              <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>{weather.icon}</span>
              <span style={{ fontSize: '1rem', fontWeight: 800, color: '#fff' }}>{weather.temp}°C</span>
              <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>{weather.description}</span>
            </div>
          ) : (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: '20px', padding: '5px 12px',
              border: '1px solid rgba(255,255,255,0.25)',
            }}>
              <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)' }}>🌤️ Wetter...</span>
            </div>
          )}
          {checkedInToday && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '20px', padding: '5px 12px',
              border: '1px solid rgba(255,255,255,0.35)',
            }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>
                ✅ Check-in{lastCheckInTime ? ` ${lastCheckInTime}` : ''}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Content (no scroll) ─────────────────────────────────────────── */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        overflow: 'hidden', padding: '10px 12px', gap: '8px',
      }}>

        {/* ── OK Button ───────────────────────────────────────────────────── */}
        {okSent ? (
          <div style={{
            flexShrink: 0, borderRadius: '18px', padding: '14px', textAlign: 'center',
            background: 'linear-gradient(135deg, #52d68a, #8fe03a)',
            boxShadow: '0 6px 20px rgba(82,214,138,0.4)',
          }}>
            <p style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0d2b27', margin: 0 }}>✅ Familie wurde informiert!</p>
          </div>
        ) : (
          <button
            onClick={() => setShowOkConfirm(true)}
            style={{
              flexShrink: 0, width: '100%', borderRadius: '18px',
              background: 'linear-gradient(135deg, #52d68a, #8fe03a)',
              minHeight: '68px', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: '1px',
              boxShadow: '0 6px 24px rgba(82,214,138,0.4)',
              border: '1.5px solid rgba(255,255,255,0.5)',
            }}
          >
            <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>✅</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0d2b27' }}>Mir geht es gut</span>
            <span style={{ fontSize: '0.75rem', color: '#1a4a44', fontWeight: 600 }}>Familie per SMS informieren</span>
          </button>
        )}

        {/* ── Medikamenten Status ─────────────────────────────────────────── */}
        {medications.length > 0 && (
          <button
            onClick={() => onNavigate('medications')}
            style={{
              flexShrink: 0, width: '100%', borderRadius: '14px',
              padding: '9px 14px', textAlign: 'left',
              background: pendingMeds.length > 0
                ? 'rgba(253,211,77,0.35)'
                : 'rgba(168,237,187,0.35)',
              border: `1.5px solid ${pendingMeds.length > 0 ? 'rgba(251,191,36,0.6)' : 'rgba(82,214,138,0.5)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              minHeight: '42px',
              backdropFilter: 'blur(10px)',
            }}
          >
            <span style={{ fontSize: '0.9rem', fontWeight: 800, color: pendingMeds.length > 0 ? '#78350f' : '#0d2b27' }}>
              💊 {pendingMeds.length > 0
                ? `${pendingMeds.reduce((n, m) => n + m.doses.filter(d => !d.taken).length, 0)} Einnahmen offen`
                : 'Alle eingenommen ✅'}
            </span>
            {nextDose && (
              <span style={{ fontSize: '0.8rem', color: '#78350f', fontWeight: 600 }}>
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
                borderRadius: '20px', padding: '12px 8px', gap: '5px',
                background: btn.grad, minHeight: '84px',
                boxShadow: `0 6px 20px ${btn.shadow}`,
                border: '1.5px solid rgba(255,255,255,0.4)',
              }}
            >
              <span style={{ fontSize: '2rem', lineHeight: 1 }}>{btn.emoji}</span>
              <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#ffffff', textAlign: 'center', textShadow: '0 1px 4px rgba(0,0,0,0.15)' }}>
                {btn.label}
              </span>
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
                borderRadius: '16px', padding: '8px 4px', gap: '4px',
                background: 'rgba(255,255,255,0.8)',
                backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
                border: '1.5px solid rgba(255,255,255,0.65)',
                boxShadow: '0 3px 14px rgba(42,157,143,0.1)',
                minHeight: '60px',
              }}
            >
              <span style={{ fontSize: '1.4rem', lineHeight: 1 }}>{btn.emoji}</span>
              <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#1a4a44', textAlign: 'center', lineHeight: 1.2 }}>
                {btn.label}
              </span>
            </button>
          ))}
        </div>

        {/* ── Nachrichten (2 Schlagzeilen) ────────────────────────────────── */}
        <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <p style={{ fontSize: '0.78rem', fontWeight: 800, color: 'rgba(255,255,255,0.85)', margin: 0, letterSpacing: '1px', textTransform: 'uppercase' }}>
            📰 Nachrichten
          </p>
          {news.slice(0, 2).map((item, i) => (
            <a key={i} href={item.link} target="_blank" rel="noopener noreferrer"
              style={{
                display: 'block', borderRadius: '14px', padding: '9px 13px',
                background: 'rgba(255,255,255,0.82)',
                backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
                border: '1.5px solid rgba(255,255,255,0.6)',
                boxShadow: '0 2px 12px rgba(42,157,143,0.08)',
                textDecoration: 'none',
              }}>
              <p style={{ fontSize: '0.86rem', fontWeight: 700, color: '#0d2b27', margin: 0, lineHeight: 1.3 }}>{item.title}</p>
            </a>
          ))}
        </div>

        {/* ── Einstellungen ───────────────────────────────────────────────── */}
        <button
          onClick={() => onNavigate('settings')}
          style={{
            flexShrink: 0, width: '100%', borderRadius: '14px',
            padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            background: 'rgba(255,255,255,0.75)',
            backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
            border: '1.5px solid rgba(255,255,255,0.55)',
            boxShadow: '0 2px 10px rgba(42,157,143,0.08)',
            marginTop: 'auto',
          }}
        >
          <span style={{ fontSize: '1rem' }}>⚙️</span>
          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1a4a44' }}>Einstellungen</span>
        </button>
      </div>
    </div>
  )
}
