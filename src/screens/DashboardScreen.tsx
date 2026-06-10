import React, { useState } from 'react'
import { useClock } from '../hooks/useClock'
import { useWeather } from '../hooks/useWeather'
import { ConfirmDialog } from '../components/ConfirmDialog'
import type { Medication, Screen, Contact } from '../types'

interface DashboardScreenProps {
  userName: string
  weatherCity: string
  medications: Medication[]
  contacts: Contact[]
  checkedInToday: boolean
  lastCheckInTime?: string
  bloodType?: string
  fallDetectionEnabled: boolean
  onToggleFallDetection: () => void
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

const SERVICES: { screen: Screen; emoji: string; label: string }[] = [
  { screen: 'contacts',      emoji: '👥', label: 'Kontakte'    },
  { screen: 'doctors',       emoji: '🏥', label: 'Ärzte'       },
  { screen: 'ilo',           emoji: '🤖', label: 'Ilo KI'      },
  { screen: 'pain-tracker',  emoji: '🩺', label: 'Schmerzen'   },
  { screen: 'shopping',      emoji: '🛒', label: 'Einkaufen'   },
  { screen: 'family',        emoji: '👨‍👩‍👧', label: 'Familie'     },
  { screen: 'entertainment', emoji: '🎭', label: 'Unterhaltung'},
  { screen: 'location',      emoji: '📍', label: 'Standort'    },
  { screen: 'insurance',     emoji: '💳', label: 'Krankenkasse'},
  { screen: 'health-record', emoji: '🏥', label: 'Gesundheit'  },
]

const NAV_ITEMS: { icon: string; label: string; screen: Screen | null }[] = [
  { icon: '🏠', label: 'Home',       screen: null          },
  { icon: '💊', label: 'Medis',      screen: 'medications' },
  { icon: '📋', label: 'Berichte',   screen: 'family'      },
  { icon: '🔔', label: 'Einst.',     screen: 'settings'    },
]

export function DashboardScreen({
  userName, weatherCity, medications,
  checkedInToday, lastCheckInTime, bloodType,
  fallDetectionEnabled, onToggleFallDetection,
  onNavigate, onOkSend,
}: DashboardScreenProps) {
  const { time, dayName, date, greeting } = useClock()
  const { data: weather } = useWeather(weatherCity)
  const [showOkConfirm, setShowOkConfirm] = useState(false)
  const [okSent, setOkSent] = useState(false)

  const pendingCount = medications.reduce((n, m) => n + m.doses.filter(d => !d.taken).length, 0)
  const nextDose = getNextDose(medications)

  function handleOkConfirmed() {
    setShowOkConfirm(false)
    onOkSend()
    setOkSent(true)
    setTimeout(() => setOkSent(false), 5000)
  }

  return (
    <div className="screen" style={{ background: '#f0faf5' }}>
      {showOkConfirm && (
        <ConfirmDialog
          message="Bist du sicher, dass es dir gut geht? ✅"
          onYes={handleOkConfirmed}
          onNo={() => setShowOkConfirm(false)}
        />
      )}

      {/* ── Top Bar ─────────────────────────────────────────────────────── */}
      <div style={{
        flexShrink: 0, background: '#ffffff',
        padding: '12px 18px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 2px 12px rgba(77,184,158,0.15)',
        borderBottom: '1px solid #e6f7f2',
      }}>
        <div style={{ width: '44px' }} />
        <p style={{
          fontSize: '0.85rem', fontWeight: 800, color: '#4db89e',
          letterSpacing: '3px', textTransform: 'uppercase', margin: 0,
        }}>
          ✦ ilocare ✦
        </p>
        <button
          onClick={() => onNavigate('settings')}
          style={{
            width: '44px', height: '44px', borderRadius: '12px',
            backgroundColor: '#f0faf5', border: '1.5px solid #c8ede4',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.25rem',
          }}
          aria-label="Einstellungen"
        >
          ⚙️
        </button>
      </div>

      {/* ── Scrollable Content ──────────────────────────────────────────── */}
      <div style={{
        flex: 1, overflowY: 'auto', overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch' as const,
        display: 'flex', flexDirection: 'column', gap: '12px',
        padding: '14px 16px 16px',
      }}>

        {/* ── Greeting Card ─────────────────────────────────────────────── */}
        <div style={{
          borderRadius: '24px',
          background: 'linear-gradient(135deg, #4db89e 0%, #2a9d8f 60%, #1e8c7e 100%)',
          padding: '18px 20px',
          boxShadow: '0 8px 28px rgba(77,184,158,0.35)',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: -30, right: -20,
            width: 110, height: 110, borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)',
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', bottom: -20, right: 30,
            width: 70, height: 70, borderRadius: '50%',
            background: 'rgba(255,255,255,0.07)',
            pointerEvents: 'none',
          }} />

          <p style={{ margin: '0 0 1px', fontSize: '0.88rem', fontWeight: 600, color: 'rgba(255,255,255,0.82)' }}>
            {greeting},
          </p>
          <p style={{ margin: '0 0 6px', fontSize: '1.8rem', fontWeight: 900, color: '#ffffff', lineHeight: 1 }}>
            {userName}! 👋
          </p>
          <p style={{ margin: '0 0 10px', fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.78)' }}>
            {dayName}, {date} · {time}
          </p>

          <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap' }}>
            {weather ? (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                background: 'rgba(255,255,255,0.2)', borderRadius: '20px',
                padding: '4px 11px', border: '1px solid rgba(255,255,255,0.3)',
              }}>
                <span style={{ fontSize: '1rem', lineHeight: 1 }}>{weather.icon}</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>{weather.temp}°C</span>
                <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>{weather.description}</span>
              </div>
            ) : (
              <div style={{
                background: 'rgba(255,255,255,0.15)', borderRadius: '20px',
                padding: '4px 11px', border: '1px solid rgba(255,255,255,0.25)',
              }}>
                <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)' }}>🌤️ Wetter lädt...</span>
              </div>
            )}
            {checkedInToday && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                background: 'rgba(255,255,255,0.2)', borderRadius: '20px',
                padding: '4px 11px', border: '1px solid rgba(255,255,255,0.3)',
              }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff' }}>
                  ✅ Check-in{lastCheckInTime ? ` ${lastCheckInTime}` : ''}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── 3 Info Cards ──────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
          {/* Blue – Check-in */}
          <div style={{
            borderRadius: '18px', padding: '14px 8px',
            background: '#e8f4fd', border: '1.5px solid #bfdbfe',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px',
          }}>
            <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>{checkedInToday ? '✅' : '⏰'}</span>
            <span style={{ fontSize: '0.64rem', fontWeight: 800, color: '#1d4ed8', textAlign: 'center', lineHeight: 1.3 }}>
              {checkedInToday ? 'Eingecheckt' : 'Check-in\nausstehend'}
            </span>
          </div>

          {/* Pink – Blood type */}
          <div style={{
            borderRadius: '18px', padding: '14px 8px',
            background: '#fce7f3', border: '1.5px solid #fbcfe8',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px',
          }}>
            <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>🩸</span>
            <span style={{ fontSize: '0.64rem', fontWeight: 800, color: '#9d174d', textAlign: 'center', lineHeight: 1.3 }}>
              {bloodType ? `BG: ${bloodType}` : 'Blutgruppe'}
            </span>
          </div>

          {/* Green – Medications */}
          <button
            onClick={() => onNavigate('medications')}
            style={{
              borderRadius: '18px', padding: '14px 8px',
              background: '#d1fae5', border: '1.5px solid #a7f3d0',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px',
            }}
          >
            <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>💊</span>
            <span style={{ fontSize: '0.64rem', fontWeight: 800, color: '#065f46', textAlign: 'center', lineHeight: 1.3 }}>
              {pendingCount > 0 ? `${pendingCount} offen` : 'Alle ✅'}
            </span>
          </button>
        </div>

        {/* ── OK + SOS Buttons ──────────────────────────────────────────── */}
        {okSent ? (
          <div style={{
            borderRadius: '20px', padding: '22px', textAlign: 'center',
            background: 'linear-gradient(135deg, #4db89e, #3ecfb8)',
            boxShadow: '0 6px 24px rgba(77,184,158,0.4)',
          }}>
            <p style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0d2b27', margin: 0 }}>
              ✅ Familie wurde informiert!
            </p>
          </div>
        ) : (
          <button
            onClick={() => setShowOkConfirm(true)}
            style={{
              width: '100%', borderRadius: '20px',
              background: 'linear-gradient(135deg, #4db89e, #3ecfb8)',
              minHeight: '84px', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: '2px',
              boxShadow: '0 6px 24px rgba(77,184,158,0.4)',
              border: '1.5px solid rgba(255,255,255,0.55)',
            }}
          >
            <span style={{ fontSize: '1.8rem', lineHeight: 1 }}>✅</span>
            <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0d2b27' }}>ICH BIN OK</span>
            <span style={{ fontSize: '0.76rem', color: '#0d4a40', fontWeight: 600 }}>Familie per SMS informieren</span>
          </button>
        )}

        <button
          onClick={() => onNavigate('emergency')}
          style={{
            width: '100%', borderRadius: '20px',
            background: 'linear-gradient(135deg, #ff6b6b, #ef4444)',
            minHeight: '84px', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: '2px',
            boxShadow: '0 6px 24px rgba(239,68,68,0.35)',
            border: '1.5px solid rgba(255,255,255,0.4)',
          }}
        >
          <span style={{ fontSize: '1.8rem', lineHeight: 1 }}>🆘</span>
          <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#ffffff' }}>SOS NOTFALL</span>
          <span style={{ fontSize: '0.76rem', color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>Notruf & Kontakte informieren</span>
        </button>

        {/* ── Services Grid ─────────────────────────────────────────────── */}
        <div>
          <p style={{ margin: '0 0 10px', fontSize: '0.78rem', fontWeight: 800, color: '#718096', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Services
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
            {SERVICES.map(svc => (
              <button
                key={svc.screen}
                onClick={() => onNavigate(svc.screen)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  borderRadius: '16px', padding: '10px 4px', gap: '5px',
                  background: '#ffffff',
                  boxShadow: '0 2px 10px rgba(77,184,158,0.12)',
                  border: '1.5px solid #e6f7f2',
                  minHeight: '68px',
                }}
              >
                <span style={{ fontSize: '1.4rem', lineHeight: 1 }}>{svc.emoji}</span>
                <span style={{ fontSize: '0.6rem', fontWeight: 700, color: '#2d3748', textAlign: 'center', lineHeight: 1.2 }}>
                  {svc.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Next Medication ───────────────────────────────────────────── */}
        {nextDose && (
          <button
            onClick={() => onNavigate('medications')}
            style={{
              width: '100%', borderRadius: '18px', padding: '14px 16px', textAlign: 'left',
              background: '#ffffff', boxShadow: '0 2px 12px rgba(77,184,158,0.1)',
              border: '1.5px solid #fde68a',
              display: 'flex', alignItems: 'center', gap: '12px',
            }}
          >
            <span style={{ fontSize: '1.8rem', flexShrink: 0 }}>💊</span>
            <div>
              <p style={{ margin: '0 0 2px', fontSize: '0.75rem', fontWeight: 700, color: '#718096' }}>
                Nächste Einnahme
              </p>
              <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#2d3748' }}>
                {nextDose.name} · {nextDose.time}
              </p>
              <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 600, color: '#d97706' }}>
                ⏰ {getCountdown(nextDose.time)}
              </p>
            </div>
          </button>
        )}

        {/* ── Fall Detection Toggle ─────────────────────────────────────── */}
        <button
          onClick={onToggleFallDetection}
          style={{
            width: '100%', borderRadius: '18px', padding: '12px 16px',
            background: '#ffffff', border: `1.5px solid ${fallDetectionEnabled ? '#fca5a5' : '#e6f7f2'}`,
            boxShadow: '0 2px 10px rgba(77,184,158,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>{fallDetectionEnabled ? '🛡️' : '📱'}</span>
            <div style={{ textAlign: 'left' }}>
              <p style={{ margin: '0 0 1px', fontSize: '0.85rem', fontWeight: 800, color: '#2d3748' }}>
                Sturzerkennung
              </p>
              <p style={{ margin: 0, fontSize: '0.72rem', fontWeight: 600, color: '#718096' }}>
                Automatische SOS-Erkennung
              </p>
            </div>
          </div>
          <div style={{
            width: '44px', height: '24px', borderRadius: '12px',
            background: fallDetectionEnabled ? '#ef4444' : '#e2e8f0',
            position: 'relative', flexShrink: 0,
          }}>
            <div style={{
              position: 'absolute', top: '2px',
              left: fallDetectionEnabled ? '22px' : '2px',
              width: '20px', height: '20px', borderRadius: '50%',
              background: '#ffffff',
              boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
              transition: 'left 0.2s ease',
            }} />
          </div>
        </button>

      </div>

      {/* ── Bottom Navigation ───────────────────────────────────────────── */}
      <div style={{
        flexShrink: 0, background: '#ffffff',
        boxShadow: '0 -4px 20px rgba(77,184,158,0.15)',
        display: 'flex', borderTop: '1px solid #e6f7f2',
        padding: '6px 0 calc(6px + env(safe-area-inset-bottom, 0px))',
      }}>
        {NAV_ITEMS.map(item => (
          <button
            key={item.label}
            onClick={() => item.screen ? onNavigate(item.screen) : undefined}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
              padding: '6px 4px', background: 'transparent', border: 'none',
              color: item.screen === null ? '#4db89e' : '#718096',
            }}
          >
            <span style={{ fontSize: '1.4rem', lineHeight: 1 }}>{item.icon}</span>
            <span style={{ fontSize: '0.62rem', fontWeight: 700 }}>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
