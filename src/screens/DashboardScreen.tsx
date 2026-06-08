import React, { useState } from 'react'
import { useClock } from '../hooks/useClock'
import { useWeather } from '../hooks/useWeather'
import { useNews } from '../hooks/useNews'
import { ConfirmDialog } from '../components/ConfirmDialog'
import type { Medication, Screen } from '../types'

interface DashboardScreenProps {
  userName: string
  weatherCity: string
  medications: Medication[]
  contacts: { name: string; phone: string }[]
  onNavigate: (screen: Screen) => void
}

function getNextDose(medications: Medication[]): { name: string; time: string } | null {
  const now = new Date()
  const nowMins = now.getHours() * 60 + now.getMinutes()
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

function getCurrentTime(): string {
  return new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
}

function sendOkToContacts(contacts: { name: string; phone: string }[], userName: string) {
  const msg = `✅ ${userName} geht es gut – ${getCurrentTime()} Uhr`
  const numbers = contacts.filter(c => c.phone).map(c => c.phone.replace(/\D/g, ''))
  if (numbers.length === 0) return
  // Opens WhatsApp for first contact; on iPhone opens default SMS app
  const url = `sms:${numbers.join(',')}?body=${encodeURIComponent(msg)}`
  window.location.href = url
}

export function DashboardScreen({ userName, weatherCity, medications, contacts, onNavigate }: DashboardScreenProps) {
  const { time, seconds, dayName, date, greeting } = useClock()
  const { data: weather, loading: weatherLoading } = useWeather(weatherCity)
  const { items: news, loading: newsLoading } = useNews()
  const [showOkConfirm, setShowOkConfirm] = useState(false)
  const [okSent, setOkSent] = useState(false)

  const pendingMeds = medications.filter(m => m.doses.some(d => !d.taken))
  const nextDose = getNextDose(medications)

  const navButtons = [
    { screen: 'contacts' as Screen, emoji: '👥', label: 'Kontakte', bg: '#fff' },
    { screen: 'medications' as Screen, emoji: '💊', label: 'Medikamente', bg: '#fff' },
    { screen: 'messages' as Screen, emoji: '💬', label: 'Nachrichten', bg: '#fff' },
    { screen: 'emergency' as Screen, emoji: '🆘', label: 'Notfall', bg: '#fff0f0' },
  ]

  return (
    <div
      className="flex flex-col min-h-screen"
      style={{ backgroundColor: '#fdf6f0', paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {showOkConfirm && (
        <ConfirmDialog
          message="Bist du sicher, dass es dir gut geht? ✅"
          onYes={() => {
            setShowOkConfirm(false)
            sendOkToContacts(contacts, userName)
            setOkSent(true)
            localStorage.setItem('ilocare_last_ok', getCurrentTime())
            setTimeout(() => setOkSent(false), 5000)
          }}
          onNo={() => setShowOkConfirm(false)}
        />
      )}

      {/* ── Uhr & Datum ─────────────────────────────────────────────────── */}
      <div
        className="flex flex-col items-center pt-6 pb-5 px-4"
        style={{ backgroundColor: '#f8e8e8', borderBottom: '3px solid #e8a0a0' }}
      >
        <p style={{ fontSize: '1rem', fontWeight: 700, color: '#c87070', margin: '0 0 2px', letterSpacing: '2px', textTransform: 'uppercase' }}>
          ilocare
        </p>
        <div className="flex items-end gap-1">
          <span style={{ fontSize: '5rem', fontWeight: 900, color: '#2d1a1a', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
            {time}
          </span>
          <span style={{ fontSize: '2rem', fontWeight: 700, color: '#e8a0a0', paddingBottom: '6px' }}>
            :{seconds}
          </span>
        </div>
        <p style={{ fontSize: '1.3rem', fontWeight: 700, color: '#6b4a4a', margin: '4px 0 0' }}>
          {dayName}, {date}
        </p>
        <p style={{ fontSize: '1.1rem', color: '#c87070', margin: '2px 0 0', fontWeight: 600 }}>
          {greeting}, {userName}! 😊
        </p>
      </div>

      <div className="flex flex-col gap-4 px-4 py-4 overflow-y-auto flex-1">

        {/* ── Wetter ──────────────────────────────────────────────────────── */}
        <div
          className="rounded-3xl px-5 py-4 flex items-center gap-4"
          style={{ backgroundColor: '#ffffff', border: '2px solid #e8d0d0' }}
        >
          {weatherLoading ? (
            <p style={{ fontSize: '1.1rem', color: '#6b4a4a', margin: 0 }}>🌤️ Wetter wird geladen...</p>
          ) : weather ? (
            <>
              <span style={{ fontSize: '3.5rem', lineHeight: 1 }}>{weather.icon}</span>
              <div className="flex flex-col">
                <span style={{ fontSize: '1.8rem', fontWeight: 900, color: '#2d1a1a', lineHeight: 1 }}>
                  {weather.temp}°C
                </span>
                <span style={{ fontSize: '1rem', fontWeight: 700, color: '#6b4a4a' }}>
                  {weather.description}
                </span>
                <span style={{ fontSize: '0.9rem', color: '#c87070' }}>
                  Gefühlt {weather.feels_like}°C · {weather.city}
                </span>
              </div>
            </>
          ) : (
            <p style={{ fontSize: '1rem', color: '#6b4a4a', margin: 0 }}>🌤️ Wetter nicht verfügbar</p>
          )}
        </div>

        {/* ── OK Button ───────────────────────────────────────────────────── */}
        {okSent ? (
          <div
            className="rounded-3xl py-5 text-center"
            style={{ backgroundColor: '#dcfce7', border: '3px solid #4ade80' }}
          >
            <p style={{ fontSize: '1.3rem', fontWeight: 800, color: '#166534', margin: 0 }}>
              ✅ Nachricht gesendet!
            </p>
          </div>
        ) : (
          <button
            onClick={() => setShowOkConfirm(true)}
            className="w-full rounded-3xl active:scale-95 transition-transform"
            style={{ backgroundColor: '#4ade80', border: '3px solid #16a34a', minHeight: '90px' }}
          >
            <span style={{ fontSize: '2.5rem' }}>✅</span>
            <p style={{ fontSize: '1.4rem', fontWeight: 900, color: '#14532d', margin: '4px 0 0' }}>
              Mir geht es gut
            </p>
            <p style={{ fontSize: '0.9rem', color: '#166534', margin: '2px 0 0' }}>
              Familie informieren
            </p>
          </button>
        )}

        {/* ── Medikamente Übersicht ────────────────────────────────────────── */}
        {medications.length > 0 && (
          <div
            className="rounded-3xl p-4"
            style={{ backgroundColor: pendingMeds.length > 0 ? '#fef3c7' : '#f0fdf4', border: `2px solid ${pendingMeds.length > 0 ? '#fcd34d' : '#86efac'}` }}
          >
            <p style={{ fontSize: '1.1rem', fontWeight: 800, color: pendingMeds.length > 0 ? '#92400e' : '#166534', margin: '0 0 8px' }}>
              💊 {pendingMeds.length > 0 ? `${pendingMeds.length} Medikament${pendingMeds.length > 1 ? 'e' : ''} noch offen` : 'Alle Medikamente eingenommen ✅'}
            </p>
            {nextDose && (
              <p style={{ fontSize: '1rem', color: '#92400e', margin: 0 }}>
                ⏰ Nächste: <strong>{nextDose.name}</strong> {getCountdown(nextDose.time)} ({nextDose.time} Uhr)
              </p>
            )}
            <button
              onClick={() => onNavigate('medications')}
              className="mt-3 rounded-2xl px-4 py-2"
              style={{ backgroundColor: pendingMeds.length > 0 ? '#f59e0b' : '#4ade80', fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}
            >
              Zur Übersicht →
            </button>
          </div>
        )}

        {/* ── Navigation Buttons ──────────────────────────────────────────── */}
        <div className="grid gap-3" style={{ gridTemplateColumns: '1fr 1fr' }}>
          {navButtons.map(btn => (
            <button
              key={btn.screen}
              onClick={() => onNavigate(btn.screen)}
              className="flex flex-col items-center justify-center rounded-3xl active:scale-95 transition-transform shadow-sm"
              style={{
                backgroundColor: btn.bg,
                border: btn.screen === 'emergency' ? '3px solid #f87171' : '2px solid #e8d0d0',
                minHeight: '90px',
                padding: '16px 8px',
              }}
            >
              <span style={{ fontSize: '2.2rem' }}>{btn.emoji}</span>
              <span style={{ fontSize: '1rem', fontWeight: 800, color: '#2d1a1a', marginTop: '6px' }}>{btn.label}</span>
            </button>
          ))}
        </div>

        {/* ── Nachrichten ─────────────────────────────────────────────────── */}
        <div>
          <p style={{ fontSize: '1.1rem', fontWeight: 800, color: '#2d1a1a', margin: '0 0 10px' }}>
            📰 Aktuelle Nachrichten
          </p>
          {newsLoading ? (
            <div className="rounded-2xl p-4" style={{ backgroundColor: '#fff', border: '2px solid #e8d0d0' }}>
              <p style={{ fontSize: '1rem', color: '#6b4a4a', margin: 0 }}>Nachrichten werden geladen...</p>
            </div>
          ) : news.length === 0 ? (
            <div className="rounded-2xl p-4" style={{ backgroundColor: '#fff', border: '2px solid #e8d0d0' }}>
              <p style={{ fontSize: '1rem', color: '#6b4a4a', margin: 0 }}>Keine Nachrichten verfügbar.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {news.map((item, i) => (
                <a
                  key={i}
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-2xl p-4 active:scale-98 transition-transform"
                  style={{ backgroundColor: '#ffffff', border: '2px solid #e8d0d0', textDecoration: 'none' }}
                >
                  <p style={{ fontSize: '1.05rem', fontWeight: 700, color: '#2d1a1a', margin: '0 0 4px', lineHeight: 1.4 }}>
                    {item.title}
                  </p>
                  {item.description && (
                    <p style={{ fontSize: '0.9rem', color: '#6b4a4a', margin: 0, lineHeight: 1.4 }}>
                      {item.description}...
                    </p>
                  )}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Einstellungen Link */}
        <button
          onClick={() => onNavigate('settings')}
          className="w-full flex items-center justify-center gap-2 rounded-2xl py-4"
          style={{ backgroundColor: '#f8e8e8', border: '2px solid #e8a0a0', marginBottom: '8px' }}
        >
          <span style={{ fontSize: '1.2rem' }}>⚙️</span>
          <span style={{ fontSize: '1rem', fontWeight: 700, color: '#6b4a4a' }}>Einstellungen</span>
        </button>
      </div>
    </div>
  )
}
