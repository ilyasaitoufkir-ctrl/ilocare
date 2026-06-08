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
  return `in ${Math.floor(diff / 60)} Std. ${diff % 60} Min.`
}

const MAIN_BUTTONS: { screen: Screen; emoji: string; label: string; color: string; border: string }[] = [
  { screen: 'contacts', emoji: '👥', label: 'Kontakte', color: '#fff', border: '#e8d0d0' },
  { screen: 'doctors', emoji: '👨‍⚕️', label: 'Arzt / Notfall', color: '#f0fdf4', border: '#86efac' },
  { screen: 'medications', emoji: '💊', label: 'Medikamente', color: '#fff', border: '#e8d0d0' },
  { screen: 'emergency', emoji: '🆘', label: 'SOS Notruf', color: '#fff0f0', border: '#f87171' },
]

const SECONDARY_BUTTONS: { screen: Screen; emoji: string; label: string }[] = [
  { screen: 'insurance', emoji: '💳', label: 'Krankenkasse' },
  { screen: 'shopping', emoji: '🛒', label: 'Einkaufsliste' },
  { screen: 'messages', emoji: '💬', label: 'Nachrichten' },
  { screen: 'location', emoji: '📍', label: 'Mein Standort' },
]

export function DashboardScreen({
  userName, weatherCity, medications, contacts,
  checkedInToday, lastCheckInTime,
  onNavigate, onOkSend,
}: DashboardScreenProps) {
  const { time, seconds, dayName, date, greeting } = useClock()
  const { data: weather, loading: weatherLoading } = useWeather(weatherCity)
  const { items: news, loading: newsLoading } = useNews()
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
    <div
      className="flex flex-col min-h-screen"
      style={{ backgroundColor: '#fdf6f0', paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {showOkConfirm && (
        <ConfirmDialog
          message="Bist du sicher, dass es dir gut geht? ✅"
          onYes={handleOkConfirmed}
          onNo={() => setShowOkConfirm(false)}
        />
      )}

      {/* ── Uhr ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col items-center pt-5 pb-4 px-4" style={{ backgroundColor: '#f8e8e8', borderBottom: '3px solid #e8a0a0' }}>
        <p style={{ fontSize: '0.9rem', fontWeight: 700, color: '#c87070', margin: '0 0 4px', letterSpacing: '3px', textTransform: 'uppercase' }}>ilocare</p>
        <div className="flex items-end gap-1">
          <span style={{ fontSize: '4.5rem', fontWeight: 900, color: '#2d1a1a', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{time}</span>
          <span style={{ fontSize: '1.8rem', fontWeight: 700, color: '#e8a0a0', paddingBottom: '4px' }}>:{seconds}</span>
        </div>
        <p style={{ fontSize: '1.2rem', fontWeight: 700, color: '#6b4a4a', margin: '2px 0 0' }}>{dayName}, {date}</p>
        <p style={{ fontSize: '1rem', color: '#c87070', margin: '2px 0 0', fontWeight: 600 }}>{greeting}, {userName}! 😊</p>
      </div>

      <div className="flex flex-col gap-4 px-4 py-4 overflow-y-auto">

        {/* ── Wetter ──────────────────────────────────────────────────────── */}
        <div className="rounded-3xl px-5 py-4 flex items-center gap-4" style={{ backgroundColor: '#ffffff', border: '2px solid #e8d0d0' }}>
          {weatherLoading ? (
            <p style={{ fontSize: '1rem', color: '#6b4a4a', margin: 0 }}>🌤️ Wetter wird geladen...</p>
          ) : weather ? (
            <>
              <span style={{ fontSize: '3rem' }}>{weather.icon}</span>
              <div>
                <span style={{ fontSize: '1.7rem', fontWeight: 900, color: '#2d1a1a' }}>{weather.temp}°C</span>
                <p style={{ fontSize: '1rem', color: '#6b4a4a', margin: '2px 0 0', fontWeight: 600 }}>{weather.description} · gefühlt {weather.feels_like}°C</p>
              </div>
            </>
          ) : (
            <p style={{ fontSize: '1rem', color: '#6b4a4a', margin: 0 }}>🌤️ Wetter nicht verfügbar</p>
          )}
        </div>

        {/* ── Check-in Status ─────────────────────────────────────────────── */}
        {checkedInToday && (
          <div className="rounded-2xl px-4 py-3" style={{ backgroundColor: '#f0fdf4', border: '2px solid #86efac' }}>
            <p style={{ fontSize: '0.95rem', fontWeight: 700, color: '#166534', margin: 0 }}>
              ✅ Check-in heute {lastCheckInTime ? `um ${lastCheckInTime} Uhr` : ''} bestätigt
            </p>
          </div>
        )}

        {/* ── OK Button ───────────────────────────────────────────────────── */}
        {okSent ? (
          <div className="rounded-3xl py-5 text-center" style={{ backgroundColor: '#dcfce7', border: '3px solid #4ade80' }}>
            <p style={{ fontSize: '1.2rem', fontWeight: 800, color: '#166534', margin: 0 }}>✅ Nachricht gesendet! Familie informiert.</p>
          </div>
        ) : (
          <button
            onClick={() => setShowOkConfirm(true)}
            className="w-full rounded-3xl active:scale-95 transition-transform"
            style={{ backgroundColor: '#4ade80', border: '3px solid #16a34a', minHeight: '90px' }}
          >
            <span style={{ fontSize: '2.2rem' }}>✅</span>
            <p style={{ fontSize: '1.3rem', fontWeight: 900, color: '#14532d', margin: '6px 0 0' }}>Mir geht es gut</p>
            <p style={{ fontSize: '0.9rem', color: '#166534', margin: '2px 0 0' }}>Familie per SMS informieren</p>
          </button>
        )}

        {/* ── Medikamenten Status ──────────────────────────────────────────── */}
        {medications.length > 0 && (
          <button
            onClick={() => onNavigate('medications')}
            className="w-full rounded-3xl p-4 text-left active:scale-95 transition-transform"
            style={{ backgroundColor: pendingMeds.length > 0 ? '#fef3c7' : '#f0fdf4', border: `2px solid ${pendingMeds.length > 0 ? '#fcd34d' : '#86efac'}` }}
          >
            <p style={{ fontSize: '1rem', fontWeight: 800, color: pendingMeds.length > 0 ? '#92400e' : '#166534', margin: '0 0 4px' }}>
              💊 {pendingMeds.length > 0 ? `${pendingMeds.reduce((n, m) => n + m.doses.filter(d => !d.taken).length, 0)} Einnahmen noch offen` : 'Alle Medikamente eingenommen ✅'}
            </p>
            {nextDose && (
              <p style={{ fontSize: '0.95rem', color: '#92400e', margin: 0 }}>⏰ Nächste: <strong>{nextDose.name}</strong> {getCountdown(nextDose.time)}</p>
            )}
          </button>
        )}

        {/* ── 4 Haupt-Buttons ─────────────────────────────────────────────── */}
        <div className="grid gap-3" style={{ gridTemplateColumns: '1fr 1fr' }}>
          {MAIN_BUTTONS.map(btn => (
            <button
              key={btn.screen}
              onClick={() => onNavigate(btn.screen)}
              className="flex flex-col items-center justify-center rounded-3xl active:scale-95 transition-transform shadow-sm"
              style={{ backgroundColor: btn.color, border: `3px solid ${btn.border}`, minHeight: '95px', padding: '14px 8px' }}
            >
              <span style={{ fontSize: '2.2rem' }}>{btn.emoji}</span>
              <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#2d1a1a', marginTop: '6px', textAlign: 'center' }}>{btn.label}</span>
            </button>
          ))}
        </div>

        {/* ── 4 Sekundär-Buttons ──────────────────────────────────────────── */}
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          {SECONDARY_BUTTONS.map(btn => (
            <button
              key={btn.screen}
              onClick={() => onNavigate(btn.screen)}
              className="flex flex-col items-center justify-center rounded-2xl active:scale-95 transition-transform"
              style={{ backgroundColor: '#fff', border: '2px solid #e8d0d0', minHeight: '75px', padding: '10px 4px' }}
            >
              <span style={{ fontSize: '1.6rem' }}>{btn.emoji}</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6b4a4a', marginTop: '4px', textAlign: 'center', lineHeight: 1.2 }}>{btn.label}</span>
            </button>
          ))}
        </div>

        {/* ── Nachrichten ─────────────────────────────────────────────────── */}
        <div>
          <p style={{ fontSize: '1rem', fontWeight: 800, color: '#2d1a1a', margin: '4px 0 10px' }}>📰 Aktuelle Nachrichten</p>
          {newsLoading ? (
            <div className="rounded-2xl p-4" style={{ backgroundColor: '#fff', border: '2px solid #e8d0d0' }}>
              <p style={{ fontSize: '1rem', color: '#6b4a4a', margin: 0 }}>Wird geladen...</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {news.slice(0, 4).map((item, i) => (
                <a key={i} href={item.link} target="_blank" rel="noopener noreferrer"
                  className="block rounded-2xl p-4" style={{ backgroundColor: '#fff', border: '2px solid #e8d0d0', textDecoration: 'none' }}>
                  <p style={{ fontSize: '1rem', fontWeight: 700, color: '#2d1a1a', margin: 0, lineHeight: 1.4 }}>{item.title}</p>
                </a>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => onNavigate('settings')}
          className="w-full flex items-center justify-center gap-2 rounded-2xl py-4 mb-2"
          style={{ backgroundColor: '#f8e8e8', border: '2px solid #e8a0a0' }}
        >
          <span>⚙️</span>
          <span style={{ fontSize: '1rem', fontWeight: 700, color: '#6b4a4a' }}>Einstellungen</span>
        </button>
      </div>
    </div>
  )
}
