import React, { useState } from 'react'
import {
  Home, Users, Activity, MoreHorizontal,
  CheckCircle, Heart, Clock, Shield,
  ChevronRight,
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

const ALL_SERVICES: { screen: Screen; emoji: string; label: string; desc: string }[] = [
  { screen: 'ilo',           emoji: '🤖', label: 'Ilo KI',       desc: 'Sprachassistent'  },
  { screen: 'pain-tracker',  emoji: '🩺', label: 'Schmerzen',    desc: 'Schmerz Tracker'  },
  { screen: 'health-record', emoji: '🏥', label: 'Gesundheitsakte', desc: 'Meine Akte'    },
  { screen: 'family',        emoji: '👨‍👩‍👧', label: 'Familie',     desc: 'Familien-Status' },
  { screen: 'shopping',      emoji: '🛒', label: 'Einkaufen',    desc: 'Einkaufsliste'    },
  { screen: 'entertainment', emoji: '🎭', label: 'Unterhaltung', desc: 'News & Radio'     },
  { screen: 'location',      emoji: '📍', label: 'Standort',     desc: 'Mein Standort'    },
  { screen: 'insurance',     emoji: '💳', label: 'Krankenk.',    desc: 'Krankenkasse'     },
  { screen: 'doctors',       emoji: '🏥', label: 'Ärzte',        desc: 'Meine Ärzte'      },
  { screen: 'settings',      emoji: '⚙️', label: 'Einstellungen', desc: 'App verwalten'   },
]

const CARD_SHADOW = '0 2px 8px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.04)'

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
  const [activeTab, setActiveTab] = useState<'home' | 'mehr'>('home')

  const pendingCount = medications.reduce((n, m) => n + m.doses.filter(d => !d.taken).length, 0)
  const nextDose = getNextDose(medications)
  const initials = userName.slice(0, 2).toUpperCase()

  function handleOkConfirmed() {
    setShowOkConfirm(false)
    onOkSend()
    setOkSent(true)
    setTimeout(() => setOkSent(false), 5000)
  }

  const healthCards = [
    {
      bg: '#e8f4ff', border: '#bfdbfe',
      icon: <CheckCircle size={26} color="#2563eb" strokeWidth={2} />,
      value: checkedInToday ? (lastCheckInTime || '✓') : '—',
      label: 'Check-in',
      sublabel: checkedInToday ? 'Heute ✓' : 'Ausstehend',
      textColor: '#1d4ed8',
      action: null as (() => void) | null,
    },
    {
      bg: '#fff0f0', border: '#fecaca',
      icon: <Heart size={26} color="#dc2626" strokeWidth={2} />,
      value: bloodType || '—',
      label: 'Blutgruppe',
      sublabel: bloodType ? 'Hinterlegt' : 'Nicht angegeben',
      textColor: '#dc2626',
      action: () => onNavigate('health-record'),
    },
    {
      bg: '#e8fff8', border: '#a7f3d0',
      icon: <Activity size={26} color="#059669" strokeWidth={2} />,
      value: pendingCount > 0 ? `${pendingCount}` : '✓',
      label: 'Medikamente',
      sublabel: pendingCount > 0 ? 'Offen heute' : 'Alle eingenommen',
      textColor: '#059669',
      action: () => onNavigate('medications'),
    },
    {
      bg: '#fff8e8', border: '#fcd34d',
      icon: <Clock size={26} color="#d97706" strokeWidth={2} />,
      value: nextDose ? nextDose.time : '—',
      label: 'Nächste Dosis',
      sublabel: nextDose ? getCountdown(nextDose.time) : 'Keine Einnahme',
      textColor: '#d97706',
      action: nextDose ? () => onNavigate('medications') : null,
    },
  ]

  return (
    <div className="screen" style={{ background: '#f8fffe' }}>
      {showOkConfirm && (
        <ConfirmDialog
          message="Bist du sicher, dass es dir gut geht? ✅"
          onYes={handleOkConfirmed}
          onNo={() => setShowOkConfirm(false)}
        />
      )}

      {/* ── Glassmorphism Header ─────────────────────────────────────────── */}
      <div style={{
        flexShrink: 0,
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.8)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        padding: '12px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <p style={{ margin: '0 0 2px', fontSize: '0.75rem', fontWeight: 500, color: '#8892a4', letterSpacing: '0.01em' }}>
            {greeting} ✨
          </p>
          <p style={{ margin: 0, fontSize: '1.45rem', fontWeight: 800, color: '#1a1a2e', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            {userName}
          </p>
        </div>
        <button
          onClick={() => onNavigate('settings')}
          style={{
            width: '50px', height: '50px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #00c896 0%, #00a67e 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2.5px solid rgba(255,255,255,0.9)',
            boxShadow: '0 4px 14px rgba(0,200,150,0.35)',
          }}
        >
          <span style={{
            fontSize: '1.05rem', fontWeight: 800, color: '#fff',
            fontFamily: "'Inter', sans-serif", letterSpacing: '-0.01em',
          }}>
            {initials}
          </span>
        </button>
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
            {/* ── Clock Card ──────────────────────────────────────────────── */}
            <div style={{
              background: '#ffffff', borderRadius: '24px',
              padding: '18px 22px',
              boxShadow: CARD_SHADOW,
              border: '1px solid rgba(255,255,255,0.8)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{
                fontSize: '3.2rem', fontWeight: 800, color: '#1a1a2e',
                letterSpacing: '-0.04em', lineHeight: 1,
                fontVariantNumeric: 'tabular-nums',
              }}>
                {time}
              </span>
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: '0 0 2px', fontSize: '0.95rem', fontWeight: 700, color: '#1a1a2e', letterSpacing: '-0.01em' }}>
                  {dayName}
                </p>
                <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 500, color: '#8892a4' }}>
                  {date}
                </p>
              </div>
            </div>

            {/* ── Weather Card ─────────────────────────────────────────────── */}
            {weather ? (
              <div style={{
                background: 'linear-gradient(135deg, #00c896 0%, #00a67e 100%)',
                borderRadius: '24px', padding: '18px 22px',
                boxShadow: '0 8px 28px rgba(0,200,150,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div>
                  <span style={{
                    fontSize: '3.4rem', fontWeight: 800, color: '#fff',
                    lineHeight: 1, display: 'block', letterSpacing: '-0.04em',
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    {weather.temp}°
                  </span>
                  <p style={{ margin: '4px 0 2px', fontSize: '0.88rem', fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>
                    {weatherCity}, heute
                  </p>
                  <p style={{ margin: 0, fontSize: '0.78rem', fontWeight: 500, color: 'rgba(255,255,255,0.75)' }}>
                    {weather.description}
                  </p>
                </div>
                <span style={{ fontSize: '3.8rem', lineHeight: 1 }}>{weather.icon}</span>
              </div>
            ) : (
              <div style={{
                background: 'linear-gradient(135deg, #00c896 0%, #00a67e 100%)',
                borderRadius: '24px', padding: '18px 22px',
                boxShadow: '0 8px 28px rgba(0,200,150,0.25)',
                display: 'flex', alignItems: 'center', gap: '12px',
              }}>
                <span style={{ fontSize: '2rem' }}>🌤️</span>
                <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>
                  Wetter wird geladen...
                </p>
              </div>
            )}

            {/* ── Health Cards 2x2 ─────────────────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {healthCards.map((card, i) => (
                <button
                  key={i}
                  onClick={card.action ?? undefined}
                  disabled={!card.action}
                  style={{
                    background: card.bg, borderRadius: '20px',
                    border: `1.5px solid ${card.border}`,
                    padding: '14px 14px',
                    display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '8px',
                    boxShadow: CARD_SHADOW,
                    textAlign: 'left',
                    minHeight: '90px',
                    cursor: card.action ? 'pointer' : 'default',
                  }}
                >
                  {card.icon}
                  <div>
                    <p style={{ margin: '0 0 1px', fontSize: '1.15rem', fontWeight: 800, color: card.textColor, letterSpacing: '-0.02em', lineHeight: 1 }}>
                      {card.value}
                    </p>
                    <p style={{ margin: 0, fontSize: '0.7rem', fontWeight: 600, color: '#8892a4', lineHeight: 1.2 }}>
                      {card.label}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            {/* ── OK + SOS Buttons ─────────────────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {okSent ? (
                <div style={{
                  gridColumn: '1 / -1', borderRadius: '24px', padding: '22px',
                  background: 'linear-gradient(135deg, #00c896, #00a67e)',
                  textAlign: 'center', boxShadow: '0 8px 28px rgba(0,200,150,0.35)',
                }}>
                  <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
                    Familie wurde informiert! ✅
                  </p>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => setShowOkConfirm(true)}
                    style={{
                      background: 'linear-gradient(135deg, #00c896 0%, #00a67e 100%)',
                      borderRadius: '24px', padding: '20px 12px',
                      minHeight: '110px',
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center', gap: '6px',
                      boxShadow: '0 8px 28px rgba(0,200,150,0.4)',
                      border: '1.5px solid rgba(255,255,255,0.5)',
                    }}
                  >
                    <span style={{ fontSize: '2rem', lineHeight: 1 }}>✅</span>
                    <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', textAlign: 'center' }}>
                      ICH BIN OK
                    </p>
                    <p style={{ margin: 0, fontSize: '0.65rem', fontWeight: 500, color: 'rgba(255,255,255,0.85)', textAlign: 'center', lineHeight: 1.3 }}>
                      Familie informieren
                    </p>
                  </button>

                  <button
                    onClick={() => onNavigate('emergency')}
                    className="sos-pulse"
                    style={{
                      background: 'linear-gradient(135deg, #ff4757 0%, #c0392b 100%)',
                      borderRadius: '24px', padding: '20px 12px',
                      minHeight: '110px',
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center', gap: '6px',
                      border: '1.5px solid rgba(255,255,255,0.4)',
                    }}
                  >
                    <span style={{ fontSize: '2rem', lineHeight: 1 }}>🆘</span>
                    <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', textAlign: 'center' }}>
                      SOS NOTFALL
                    </p>
                    <p style={{ margin: 0, fontSize: '0.65rem', fontWeight: 500, color: 'rgba(255,255,255,0.85)', textAlign: 'center', lineHeight: 1.3 }}>
                      Notruf auslösen
                    </p>
                  </button>
                </>
              )}
            </div>

            {/* ── Next Medication ───────────────────────────────────────────── */}
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

            {/* ── Fall Detection ────────────────────────────────────────────── */}
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
                  <p style={{ margin: '0 0 2px', fontSize: '1rem', fontWeight: 800, color: '#1a1a2e', letterSpacing: '-0.02em' }}>
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
                transition: 'background 0.2s ease',
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
          /* ── Mehr / Services Grid ─────────────────────────────────────── */
          <>
            <p style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#1a1a2e', letterSpacing: '-0.03em' }}>
              Alle Services
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {ALL_SERVICES.map(svc => (
                <button
                  key={svc.screen}
                  onClick={() => onNavigate(svc.screen)}
                  style={{
                    background: '#ffffff', borderRadius: '20px',
                    padding: '16px 14px',
                    display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left',
                    boxShadow: CARD_SHADOW, border: '1px solid rgba(255,255,255,0.8)',
                  }}
                >
                  <span style={{ fontSize: '1.7rem', lineHeight: 1, flexShrink: 0 }}>{svc.emoji}</span>
                  <div>
                    <p style={{ margin: '0 0 1px', fontSize: '0.88rem', fontWeight: 800, color: '#1a1a2e', letterSpacing: '-0.01em' }}>
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
          { id: 'home' as const, icon: <Home size={24} strokeWidth={2} />, label: 'Home', nav: null },
          { id: 'contacts' as const, icon: <Users size={24} strokeWidth={2} />, label: 'Kontakte', nav: 'contacts' as Screen },
          { id: 'medications' as const, icon: <Activity size={24} strokeWidth={2} />, label: 'Medis', nav: 'medications' as Screen },
          { id: 'mehr' as const, icon: <MoreHorizontal size={24} strokeWidth={2} />, label: 'Mehr', nav: null },
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
              <span style={{
                fontSize: '0.6rem', fontWeight: isActive ? 700 : 500,
                letterSpacing: '0.01em',
              }}>
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
