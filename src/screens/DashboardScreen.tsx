import React, { useState } from 'react'
import {
  Home, Users, Activity, MoreHorizontal,
  Clock, Shield, ChevronRight,
} from 'lucide-react'
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

const MEHR_SERVICES: { screen: Screen; emoji: string; label: string; desc: string }[] = [
  { screen: 'ilo',           emoji: '🤖', label: 'Ilo KI',         desc: 'Sprachassistent'  },
  { screen: 'pain-tracker',  emoji: '🩺', label: 'Schmerzen',      desc: 'Schmerz Tracker'  },
  { screen: 'family',        emoji: '👨‍👩‍👧', label: 'Familie',       desc: 'Familien-Status'  },
  { screen: 'shopping',      emoji: '🛒', label: 'Einkaufen',      desc: 'Einkaufsliste'    },
  { screen: 'location',      emoji: '📍', label: 'Standort',       desc: 'Mein Standort'    },
  { screen: 'insurance',     emoji: '💳', label: 'Krankenkasse',   desc: 'Versicherung'     },
  { screen: 'doctors',       emoji: '🏥', label: 'Ärzte',          desc: 'Meine Ärzte'      },
  { screen: 'settings',      emoji: '⚙️', label: 'Einstellungen',  desc: 'App verwalten'    },
]

const CARD_SHADOW = '0 2px 8px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.04)'

export function DashboardScreen({
  userName, weatherCity, medications, contacts,
  fallDetectionEnabled, onToggleFallDetection,
  onNavigate, onOkSend,
}: DashboardScreenProps) {
  const { time, dayName, date, greeting } = useClock()
  const { data: weather } = useWeather(weatherCity)
  const [showOkConfirm, setShowOkConfirm] = useState(false)
  const [showNotGoodConfirm, setShowNotGoodConfirm] = useState(false)
  const [okSent, setOkSent] = useState(false)
  const [notGoodSent, setNotGoodSent] = useState(false)
  const [activeTab, setActiveTab] = useState<'home' | 'mehr'>('home')

  const nextDose = getNextDose(medications)
  const initials = userName.slice(0, 2).toUpperCase()

  function handleOkConfirmed() {
    setShowOkConfirm(false)
    onOkSend()
    setOkSent(true)
    setTimeout(() => setOkSent(false), 5000)
  }

  function handleNotGoodConfirmed() {
    setShowNotGoodConfirm(false)
    const phones = contacts.map(c => c.phone).filter(Boolean).join(',')
    const t = new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
    const msg = `⚠️ ${userName} fühlt sich nicht gut – ${t} Uhr. Bitte melde dich!`
    if (phones) window.location.href = `sms:${phones}?body=${encodeURIComponent(msg)}`
    localStorage.setItem('ilocare_mood', 'notgood')
    localStorage.setItem('ilocare_mood_time', t)
    setNotGoodSent(true)
    setTimeout(() => setNotGoodSent(false), 5000)
  }

  return (
    <div className="screen" style={{ background: '#f8fffe' }}>
      {showOkConfirm && (
        <ConfirmDialog
          message="Bist du sicher, dass es dir gut geht? ✅"
          onYes={handleOkConfirmed}
          onNo={() => setShowOkConfirm(false)}
        />
      )}
      {showNotGoodConfirm && (
        <ConfirmDialog
          message="Familie per SMS benachrichtigen? 🟡"
          onYes={handleNotGoodConfirmed}
          onNo={() => setShowNotGoodConfirm(false)}
        />
      )}

      {/* ── Glass Header ────────────────────────────────────────────────── */}
      <div style={{
        flexShrink: 0,
        background: 'rgba(255,255,255,0.88)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.8)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        padding: '10px 20px 12px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
      }}>
        {/* Left: greeting + time + date */}
        <div style={{ flex: 1 }}>
          <p style={{ margin: '0 0 2px', fontSize: '0.78rem', fontWeight: 600, color: '#8892a4', letterSpacing: '0.01em' }}>
            {greeting} ✨ {userName}
          </p>
          <span style={{
            fontSize: '3rem', fontWeight: 800, color: '#1a1a2e',
            letterSpacing: '-0.05em', lineHeight: 1, display: 'block',
            fontVariantNumeric: 'tabular-nums',
          }}>
            {time}
          </span>
          <p style={{ margin: '3px 0 0', fontSize: '1rem', fontWeight: 600, color: '#8892a4', letterSpacing: '-0.01em' }}>
            {dayName}, {date}
          </p>
        </div>

        {/* Right: avatar + weather */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px', flexShrink: 0 }}>
          <button
            onClick={() => onNavigate('settings')}
            style={{
              width: '52px', height: '52px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #00c896 0%, #00a67e 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '2.5px solid rgba(255,255,255,0.9)',
              boxShadow: '0 4px 14px rgba(0,200,150,0.35)',
            }}
          >
            <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff', fontFamily: "'Inter', sans-serif", letterSpacing: '-0.01em' }}>
              {initials}
            </span>
          </button>
          {weather && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              background: '#f0fdf8', borderRadius: '20px',
              padding: '4px 10px', border: '1px solid #a7f3d0',
            }}>
              <span style={{ fontSize: '1rem', lineHeight: 1 }}>{weather.icon}</span>
              <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#00a67e' }}>{weather.temp}°C</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Scrollable Content ──────────────────────────────────────────── */}
      <div style={{
        flex: 1, overflowY: 'auto', overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch' as const,
        padding: '14px 16px 8px',
        display: 'flex', flexDirection: 'column', gap: '12px',
      }}>

        {activeTab === 'home' ? (
          <>
            {/* ── ✅ ICH BIN OK (huge, top) ─────────────────────────────── */}
            {okSent ? (
              <div style={{
                borderRadius: '28px', padding: '28px 24px', textAlign: 'center',
                background: 'linear-gradient(135deg, #00c896 0%, #00a67e 100%)',
                boxShadow: '0 8px 32px rgba(0,200,150,0.4)',
              }}>
                <p style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>
                  Familie wurde informiert! ✅
                </p>
              </div>
            ) : (
              <button
                onClick={() => setShowOkConfirm(true)}
                style={{
                  width: '100%', borderRadius: '28px',
                  background: 'linear-gradient(135deg, #00c896 0%, #00a67e 100%)',
                  minHeight: '110px',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: '6px',
                  boxShadow: '0 8px 32px rgba(0,200,150,0.4)',
                  border: '2px solid rgba(255,255,255,0.5)',
                }}
              >
                <span style={{ fontSize: '2.4rem', lineHeight: 1 }}>✅</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>
                  ICH BIN OK
                </span>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>
                  Familie per SMS informieren
                </span>
              </button>
            )}

            {/* ── 🟡 MIR GEHT ES NICHT GUT ─────────────────────────────── */}
            {notGoodSent ? (
              <div style={{
                borderRadius: '28px', padding: '24px', textAlign: 'center',
                background: 'linear-gradient(135deg, #ff9f43 0%, #ee5a24 100%)',
                boxShadow: '0 6px 24px rgba(255,159,67,0.4)',
              }}>
                <p style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>
                  Familie wurde benachrichtigt! ⚠️
                </p>
              </div>
            ) : (
              <button
                onClick={() => setShowNotGoodConfirm(true)}
                style={{
                  width: '100%', borderRadius: '28px',
                  background: 'linear-gradient(135deg, #ff9f43 0%, #f0932b 100%)',
                  minHeight: '90px',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: '5px',
                  boxShadow: '0 6px 24px rgba(255,159,67,0.4)',
                  border: '2px solid rgba(255,255,255,0.4)',
                }}
              >
                <span style={{ fontSize: '2rem', lineHeight: 1 }}>🟡</span>
                <span style={{ fontSize: '1.3rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>
                  MIR GEHT ES NICHT GUT
                </span>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>
                  Familie benachrichtigen
                </span>
              </button>
            )}

            {/* ── 2 × 2 Navigation Grid ──────────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {/* Kontakte */}
              <button
                onClick={() => onNavigate('contacts')}
                style={{
                  borderRadius: '24px', padding: '18px 12px', minHeight: '100px',
                  background: '#e8f4ff', border: '1.5px solid #bfdbfe',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: '8px',
                  boxShadow: CARD_SHADOW,
                }}
              >
                <span style={{ fontSize: '2.2rem', lineHeight: 1 }}>👥</span>
                <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1d4ed8', letterSpacing: '-0.02em', textAlign: 'center' }}>
                  KONTAKTE
                </span>
              </button>

              {/* Medikamente */}
              <button
                onClick={() => onNavigate('medications')}
                style={{
                  borderRadius: '24px', padding: '18px 12px', minHeight: '100px',
                  background: '#f3e8ff', border: '1.5px solid #d8b4fe',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: '8px',
                  boxShadow: CARD_SHADOW,
                }}
              >
                <span style={{ fontSize: '2.2rem', lineHeight: 1 }}>💊</span>
                <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#7c3aed', letterSpacing: '-0.02em', textAlign: 'center' }}>
                  MEDIKAMENTE
                </span>
              </button>

              {/* Unterhaltung */}
              <button
                onClick={() => onNavigate('entertainment')}
                style={{
                  borderRadius: '24px', padding: '18px 12px', minHeight: '100px',
                  background: '#e8fff8', border: '1.5px solid #a7f3d0',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: '8px',
                  boxShadow: CARD_SHADOW,
                }}
              >
                <span style={{ fontSize: '2.2rem', lineHeight: 1 }}>🎭</span>
                <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#059669', letterSpacing: '-0.02em', textAlign: 'center' }}>
                  UNTERHALTUNG
                </span>
              </button>

              {/* Gesundheitsakte */}
              <button
                onClick={() => onNavigate('health-record')}
                style={{
                  borderRadius: '24px', padding: '18px 12px', minHeight: '100px',
                  background: '#fff0f0', border: '1.5px solid #fecaca',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: '8px',
                  boxShadow: CARD_SHADOW,
                }}
              >
                <span style={{ fontSize: '2.2rem', lineHeight: 1 }}>🏥</span>
                <span style={{ fontSize: '1.0rem', fontWeight: 800, color: '#dc2626', letterSpacing: '-0.02em', textAlign: 'center', lineHeight: 1.2 }}>
                  GESUNDHEITS-{'\n'}AKTE
                </span>
              </button>
            </div>

            {/* ── 🆘 SOS NOTFALL (bottom, red) ──────────────────────────── */}
            <button
              onClick={() => onNavigate('emergency')}
              className="sos-pulse"
              style={{
                width: '100%', borderRadius: '28px',
                background: 'linear-gradient(135deg, #ff4757 0%, #c0392b 100%)',
                minHeight: '90px',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: '5px',
                border: '2px solid rgba(255,255,255,0.35)',
              }}
            >
              <span style={{ fontSize: '2rem', lineHeight: 1 }}>🆘</span>
              <span style={{ fontSize: '1.3rem', fontWeight: 900, color: '#fff', letterSpacing: '0.02em' }}>
                SOS NOTFALL
              </span>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>
                Notruf & Familie sofort informieren
              </span>
            </button>

            {/* ── Medication reminder ────────────────────────────────────── */}
            {nextDose && (
              <button
                onClick={() => onNavigate('medications')}
                style={{
                  background: '#ffffff', borderRadius: '20px',
                  padding: '14px 18px', textAlign: 'left', width: '100%',
                  boxShadow: CARD_SHADOW, border: '1.5px solid #fcd34d',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '46px', height: '46px', borderRadius: '14px',
                    background: '#fff8e8', border: '1.5px solid #fcd34d',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Clock size={22} color="#d97706" strokeWidth={2} />
                  </div>
                  <div>
                    <p style={{ margin: '0 0 2px', fontSize: '0.72rem', fontWeight: 600, color: '#8892a4' }}>Nächste Einnahme</p>
                    <p style={{ margin: '0 0 1px', fontSize: '1rem', fontWeight: 800, color: '#1a1a2e', letterSpacing: '-0.02em' }}>
                      {nextDose.name}
                    </p>
                    <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 600, color: '#d97706' }}>
                      {nextDose.time} Uhr · {getCountdown(nextDose.time)}
                    </p>
                  </div>
                </div>
                <ChevronRight size={20} color="#8892a4" />
              </button>
            )}

            {/* ── Fall Detection Toggle ──────────────────────────────────── */}
            <button
              onClick={onToggleFallDetection}
              style={{
                background: '#ffffff', borderRadius: '20px',
                padding: '14px 18px', width: '100%',
                boxShadow: CARD_SHADOW,
                border: `1.5px solid ${fallDetectionEnabled ? '#fca5a5' : '#e8f0e8'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: '4px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '46px', height: '46px', borderRadius: '14px',
                  background: fallDetectionEnabled ? '#fff0f0' : '#f0f8f4',
                  border: `1.5px solid ${fallDetectionEnabled ? '#fca5a5' : '#a7f3d0'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Shield size={22} color={fallDetectionEnabled ? '#dc2626' : '#059669'} strokeWidth={2} />
                </div>
                <div>
                  <p style={{ margin: '0 0 2px', fontSize: '0.95rem', fontWeight: 800, color: '#1a1a2e', letterSpacing: '-0.02em' }}>
                    Sturzerkennung
                  </p>
                  <p style={{ margin: 0, fontSize: '0.72rem', fontWeight: 500, color: '#8892a4' }}>
                    {fallDetectionEnabled ? 'Aktiv – schützt dich' : 'Inaktiv – tippe zum Aktivieren'}
                  </p>
                </div>
              </div>
              <div style={{
                width: '46px', height: '26px', borderRadius: '13px',
                background: fallDetectionEnabled ? '#00c896' : '#e2e8f0',
                position: 'relative', flexShrink: 0,
              }}>
                <div style={{
                  position: 'absolute', top: '3px',
                  left: fallDetectionEnabled ? '23px' : '3px',
                  width: '20px', height: '20px', borderRadius: '50%',
                  background: '#ffffff',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                  transition: 'left 0.2s cubic-bezier(0.4,0,0.2,1)',
                }} />
              </div>
            </button>
          </>
        ) : (
          /* ── Mehr / Services ────────────────────────────────────────── */
          <>
            <p style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#1a1a2e', letterSpacing: '-0.03em' }}>
              Alle Services
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {MEHR_SERVICES.map(svc => (
                <button
                  key={svc.screen}
                  onClick={() => onNavigate(svc.screen)}
                  style={{
                    background: '#ffffff', borderRadius: '20px',
                    padding: '16px 14px',
                    display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left',
                    boxShadow: CARD_SHADOW, border: '1px solid rgba(255,255,255,0.8)',
                    minHeight: '72px',
                  }}
                >
                  <span style={{ fontSize: '1.8rem', lineHeight: 1, flexShrink: 0 }}>{svc.emoji}</span>
                  <div>
                    <p style={{ margin: '0 0 1px', fontSize: '0.92rem', fontWeight: 800, color: '#1a1a2e', letterSpacing: '-0.01em' }}>
                      {svc.label}
                    </p>
                    <p style={{ margin: 0, fontSize: '0.7rem', fontWeight: 500, color: '#8892a4' }}>
                      {svc.desc}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Bottom Glass Navigation ──────────────────────────────────────── */}
      <div style={{
        flexShrink: 0,
        background: 'rgba(255,255,255,0.9)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.8)',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.06)',
        display: 'flex',
        padding: '8px 0 calc(8px + env(safe-area-inset-bottom, 0px))',
      }}>
        {[
          { id: 'home',        icon: <Home size={24} strokeWidth={2} />,          label: 'Home',     nav: null                  },
          { id: 'contacts',    icon: <Users size={24} strokeWidth={2} />,          label: 'Kontakte', nav: 'contacts' as Screen  },
          { id: 'medications', icon: <Activity size={24} strokeWidth={2} />,       label: 'Medis',    nav: 'medications' as Screen },
          { id: 'mehr',        icon: <MoreHorizontal size={24} strokeWidth={2} />, label: 'Mehr',     nav: null                  },
        ].map(tab => {
          const isActive = tab.id === 'home' ? activeTab === 'home' : tab.id === 'mehr' ? activeTab === 'mehr' : false
          return (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.nav) onNavigate(tab.nav)
                else setActiveTab(tab.id === 'mehr' ? 'mehr' : 'home')
              }}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: '3px', padding: '6px 4px', background: 'transparent', border: 'none',
                color: isActive ? '#00c896' : '#8892a4',
                position: 'relative',
              }}
            >
              {tab.icon}
              <span style={{ fontSize: '0.6rem', fontWeight: isActive ? 700 : 500 }}>
                {tab.label}
              </span>
              {isActive && (
                <div style={{
                  position: 'absolute', bottom: '2px',
                  width: '5px', height: '5px', borderRadius: '50%',
                  background: '#00c896',
                }} />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
