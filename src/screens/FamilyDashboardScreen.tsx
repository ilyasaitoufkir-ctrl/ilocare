import React, { useState, useEffect } from 'react'
import {
  Heart, ArrowLeft, Plus, Phone, MessageCircle, MapPin,
  CheckCircle, Clock, AlertTriangle, RefreshCw, Activity,
} from 'lucide-react'
import { doc, onSnapshot, getDoc } from 'firebase/firestore'
import { getDb, isFirebaseConfigured } from '../lib/firebase'
import type { SeniorSnapshot, FamilySenior } from '../types'

const CARD_SHADOW = '0 2px 8px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.04)'
const SENIORS_KEY = 'ilocare_family_seniors'
const ACTIVE_KEY = 'ilocare_family_active'

function loadSeniors(): FamilySenior[] {
  try { return JSON.parse(localStorage.getItem(SENIORS_KEY) || '[]') } catch { return [] }
}
function saveSeniors(list: FamilySenior[]) {
  localStorage.setItem(SENIORS_KEY, JSON.stringify(list))
}

function formatLastActive(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60) return 'Gerade eben'
  if (diff < 3600) return `vor ${Math.floor(diff / 60)} Min.`
  if (diff < 86400) return `vor ${Math.floor(diff / 3600)} Std.`
  return `vor ${Math.floor(diff / 86400)} Tag(en)`
}

interface FamilyDashboardScreenProps {
  onSwitchMode: () => void
}

export function FamilyDashboardScreen({ onSwitchMode }: FamilyDashboardScreenProps) {
  const [seniors, setSeniors] = useState<FamilySenior[]>(loadSeniors)
  const [activeCode, setActiveCode] = useState<string>(
    () => localStorage.getItem(ACTIVE_KEY) || (loadSeniors()[0]?.code ?? '')
  )
  const [snapshot, setSnapshot] = useState<SeniorSnapshot | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(loadSeniors().length === 0)
  const [codeInput, setCodeInput] = useState('')
  const [connectLoading, setConnectLoading] = useState(false)
  const [connectError, setConnectError] = useState('')
  const [, setTick] = useState(0) // forces "last active" re-render

  // Refresh "last active" label every 30s
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 30000)
    return () => clearInterval(id)
  }, [])

  // Firebase real-time listener
  useEffect(() => {
    if (!activeCode || showAddForm) return

    const db = getDb()
    if (!db) {
      setSnapshot(null)
      setError('firebase_not_configured')
      return
    }

    setLoading(true)
    setError(null)

    const unsub = onSnapshot(
      doc(db, 'ilocare_seniors', activeCode),
      snap => {
        setLoading(false)
        if (snap.exists()) {
          setSnapshot(snap.data() as SeniorSnapshot)
        } else {
          setSnapshot(null)
          setError('Kein Senior mit diesem Code gefunden.')
        }
      },
      err => {
        setLoading(false)
        console.error('Firebase listen error:', err)
        setError('Verbindungsfehler. Bitte erneut versuchen.')
      }
    )

    return () => unsub()
  }, [activeCode, showAddForm])

  async function handleConnect() {
    const code = codeInput.trim()
    if (!code) return
    if (seniors.some(s => s.code === code)) {
      setConnectError('Dieser Code ist bereits gespeichert.')
      return
    }

    const db = getDb()
    if (!db) {
      // Offline: just save the code locally
      const added: FamilySenior = { code, name: `Senior (${code})` }
      const updated = [...seniors, added]
      setSeniors(updated); saveSeniors(updated)
      setActiveCode(code); localStorage.setItem(ACTIVE_KEY, code)
      setShowAddForm(false); setCodeInput('')
      return
    }

    setConnectLoading(true); setConnectError('')
    try {
      const snap = await getDoc(doc(db, 'ilocare_seniors', code))
      if (snap.exists()) {
        const added: FamilySenior = { code, name: snap.data().userName || 'Unbekannt' }
        const updated = [...seniors, added]
        setSeniors(updated); saveSeniors(updated)
        setActiveCode(code); localStorage.setItem(ACTIVE_KEY, code)
        setShowAddForm(false); setCodeInput('')
      } else {
        setConnectError('Code nicht gefunden. Bitte beim Senior nachfragen.')
      }
    } catch {
      setConnectError('Verbindungsfehler. Bitte erneut versuchen.')
    } finally {
      setConnectLoading(false)
    }
  }

  function removeSenior(code: string) {
    const updated = seniors.filter(s => s.code !== code)
    setSeniors(updated); saveSeniors(updated)
    if (activeCode === code) {
      const next = updated[0]?.code ?? ''
      setActiveCode(next); localStorage.setItem(ACTIVE_KEY, next)
      if (!next) setShowAddForm(true)
    }
  }

  function switchSenior(code: string) {
    setActiveCode(code); localStorage.setItem(ACTIVE_KEY, code)
    setSnapshot(null); setLoading(true)
  }

  const activeSenior = seniors.find(s => s.code === activeCode)

  // ── Add Senior Form ─────────────────────────────────────────────────────────
  if (showAddForm) {
    return (
      <div style={{ minHeight: '100dvh', background: '#f8fffe', display: 'flex', flexDirection: 'column', fontFamily: "'Inter', -apple-system, sans-serif" }}>
        <div style={{
          background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.8)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px',
        }}>
          <button onClick={onSwitchMode} style={{
            width: '44px', height: '44px', borderRadius: '12px',
            background: '#e8fff8', border: '1.5px solid #a7f3d0',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <ArrowLeft size={22} color="#00c896" strokeWidth={2.5} />
          </button>
          <h1 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#1a1a2e', flex: 1 }}>
            Familien-Zugang
          </h1>
        </div>

        <div style={{ flex: 1, padding: '36px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '28px' }}>
          <div style={{
            width: '88px', height: '88px', borderRadius: '26px',
            background: 'linear-gradient(135deg, #00c896 0%, #00a67e 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 12px 36px rgba(0,200,150,0.35)',
          }}>
            <Heart size={44} color="#fff" strokeWidth={2.5} fill="rgba(255,255,255,0.25)" />
          </div>

          <div style={{ textAlign: 'center', maxWidth: '320px' }}>
            <h2 style={{ margin: '0 0 10px', fontSize: '1.45rem', fontWeight: 900, color: '#1a1a2e', letterSpacing: '-0.03em' }}>
              Mit Familie verbinden
            </h2>
            <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 500, color: '#8892a4', lineHeight: 1.65 }}>
              Gib den Familien-Code ein, der in der ilocare-App unter Einstellungen angezeigt wird.
            </p>
          </div>

          <div style={{ width: '100%', maxWidth: '360px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <input
              type="text"
              value={codeInput}
              onChange={e => { setCodeInput(e.target.value.toUpperCase()); setConnectError('') }}
              onKeyDown={e => e.key === 'Enter' && handleConnect()}
              placeholder="z.B. 1234"
              maxLength={10}
              autoFocus
              style={{
                padding: '20px', fontSize: '2rem', fontWeight: 800, textAlign: 'center',
                letterSpacing: '0.25em', fontVariantNumeric: 'tabular-nums',
                borderRadius: '20px', border: `2px solid ${connectError ? '#fca5a5' : '#e2e8f0'}`,
                background: '#ffffff', color: '#1a1a2e', outline: 'none', width: '100%',
                boxSizing: 'border-box', boxShadow: CARD_SHADOW, fontFamily: 'inherit',
              }}
            />
            {connectError && (
              <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: '#dc2626', textAlign: 'center' }}>
                ⚠️ {connectError}
              </p>
            )}
            <button
              onClick={handleConnect}
              disabled={!codeInput.trim() || connectLoading}
              style={{
                borderRadius: '20px', padding: '18px',
                background: codeInput.trim() ? 'linear-gradient(135deg, #00c896 0%, #00a67e 100%)' : '#e2e8f0',
                border: 'none', cursor: codeInput.trim() ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                boxShadow: codeInput.trim() ? '0 8px 28px rgba(0,200,150,0.3)' : 'none',
              }}
            >
              {connectLoading && (
                <div style={{ width: '22px', height: '22px', borderRadius: '50%', border: '3px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', animation: 'spin 0.8s linear infinite' }} />
              )}
              <span style={{ fontSize: '1.1rem', fontWeight: 800, color: codeInput.trim() ? '#fff' : '#8892a4' }}>
                {connectLoading ? 'Verbinde...' : 'Verbinden'}
              </span>
            </button>
          </div>

          {!isFirebaseConfigured() && (
            <div style={{ maxWidth: '360px', borderRadius: '18px', padding: '16px 18px', background: '#fffbeb', border: '1.5px solid #fcd34d' }}>
              <p style={{ margin: '0 0 8px', fontSize: '0.9rem', fontWeight: 700, color: '#d97706' }}>
                ⚠️ Firebase nicht konfiguriert
              </p>
              <p style={{ margin: '0 0 10px', fontSize: '0.82rem', fontWeight: 500, color: '#92400e', lineHeight: 1.6 }}>
                Für Echtzeit-Updates Firebase einrichten. Füge diese Variablen in deine .env Datei ein:
              </p>
              <div style={{ borderRadius: '12px', padding: '10px 14px', background: '#fef3c7', fontFamily: 'monospace', fontSize: '0.74rem', color: '#92400e', lineHeight: 1.9 }}>
                VITE_FIREBASE_API_KEY=...<br />
                VITE_FIREBASE_AUTH_DOMAIN=...<br />
                VITE_FIREBASE_PROJECT_ID=...<br />
                VITE_FIREBASE_APP_ID=...
              </div>
            </div>
          )}

          {seniors.length > 0 && (
            <button onClick={() => setShowAddForm(false)} style={{ fontSize: '0.9rem', fontWeight: 600, color: '#8892a4', background: 'none', border: 'none', cursor: 'pointer' }}>
              Abbrechen
            </button>
          )}
        </div>
      </div>
    )
  }

  // ── Family Dashboard ────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100dvh', background: '#f8fffe', display: 'flex', flexDirection: 'column', fontFamily: "'Inter', -apple-system, sans-serif" }}>

      {/* Header */}
      <div style={{
        background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.8)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <button onClick={onSwitchMode} style={{
          width: '44px', height: '44px', borderRadius: '12px',
          background: '#e8fff8', border: '1.5px solid #a7f3d0',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <ArrowLeft size={22} color="#00c896" strokeWidth={2.5} />
        </button>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#1a1a2e', letterSpacing: '-0.02em' }}>
            ilocare Familie
          </h1>
          {snapshot && (
            <p style={{ margin: 0, fontSize: '0.72rem', fontWeight: 500, color: '#8892a4' }}>
              Zuletzt aktiv: {formatLastActive(snapshot.lastActive)}
            </p>
          )}
        </div>
        <button onClick={() => setShowAddForm(true)} style={{
          width: '44px', height: '44px', borderRadius: '12px',
          background: '#e8f4ff', border: '1.5px solid #bfdbfe',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Plus size={22} color="#2563eb" strokeWidth={2.5} />
        </button>
      </div>

      {/* Senior tabs (multiple) */}
      {seniors.length > 1 && (
        <div style={{
          overflowX: 'auto', display: 'flex', gap: '8px',
          padding: '10px 16px', background: '#fff', borderBottom: '1px solid #f0f4f8',
          flexShrink: 0,
        }}>
          {seniors.map(s => (
            <button
              key={s.code}
              onClick={() => switchSenior(s.code)}
              style={{
                borderRadius: '20px', padding: '7px 18px', flexShrink: 0,
                background: s.code === activeCode ? 'linear-gradient(135deg, #00c896 0%, #00a67e 100%)' : '#f0f4f8',
                border: 'none', cursor: 'pointer',
                fontSize: '0.88rem', fontWeight: 700,
                color: s.code === activeCode ? '#fff' : '#8892a4',
                boxShadow: s.code === activeCode ? '0 4px 12px rgba(0,200,150,0.3)' : 'none',
              }}
            >
              {s.name}
            </button>
          ))}
        </div>
      )}

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px', paddingBottom: 'calc(env(safe-area-inset-bottom) + 20px)' }}>

        {/* Senior hero card */}
        <div style={{
          borderRadius: '28px', padding: '20px 22px',
          background: 'linear-gradient(135deg, #00c896 0%, #00a67e 100%)',
          boxShadow: '0 8px 32px rgba(0,200,150,0.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <p style={{ margin: '0 0 4px', fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              Familienmitglied
            </p>
            <p style={{ margin: 0, fontSize: '1.9rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1.05 }}>
              {snapshot?.userName || activeSenior?.name || '–'}
            </p>
            {snapshot && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fff', opacity: 0.9, flexShrink: 0 }} />
                <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>
                  Zuletzt aktiv: {formatLastActive(snapshot.lastActive)}
                </p>
              </div>
            )}
          </div>
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.25)', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2.4rem', lineHeight: 1,
          }}>
            👴
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ borderRadius: '24px', padding: '40px', background: '#fff', boxShadow: CARD_SHADOW, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: '3px solid #e2e8f0', borderTopColor: '#00c896', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: '#8892a4' }}>Lade Live-Daten...</p>
          </div>
        )}

        {/* Firebase not configured */}
        {error === 'firebase_not_configured' && !loading && (
          <div style={{ borderRadius: '24px', padding: '22px', background: '#fffbeb', border: '1.5px solid #fcd34d', boxShadow: CARD_SHADOW }}>
            <p style={{ margin: '0 0 8px', fontSize: '1rem', fontWeight: 800, color: '#d97706' }}>
              ⚠️ Firebase nicht konfiguriert
            </p>
            <p style={{ margin: '0 0 14px', fontSize: '0.85rem', fontWeight: 500, color: '#92400e', lineHeight: 1.65 }}>
              Für Live-Daten muss Firebase eingerichtet werden. Füge diese Variablen in deine .env Datei ein und starte die App neu:
            </p>
            <div style={{ borderRadius: '12px', padding: '12px 14px', background: '#fef3c7', fontFamily: 'monospace', fontSize: '0.75rem', color: '#92400e', lineHeight: 2 }}>
              VITE_FIREBASE_API_KEY=...<br />
              VITE_FIREBASE_AUTH_DOMAIN=...<br />
              VITE_FIREBASE_PROJECT_ID=...<br />
              VITE_FIREBASE_APP_ID=...
            </div>
          </div>
        )}

        {/* Other errors */}
        {error && error !== 'firebase_not_configured' && !loading && (
          <div style={{ borderRadius: '20px', padding: '20px', background: '#fff0f0', border: '1.5px solid #fca5a5', boxShadow: CARD_SHADOW, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <AlertTriangle size={32} color="#dc2626" strokeWidth={2} />
            <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#dc2626', textAlign: 'center' }}>{error}</p>
            <button
              onClick={() => { setError(null); setSnapshot(null); setLoading(true); const c = activeCode; setActiveCode(''); setTimeout(() => setActiveCode(c), 50) }}
              style={{ borderRadius: '12px', padding: '10px 20px', background: '#fff', border: '1.5px solid #fca5a5', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 700, color: '#dc2626', cursor: 'pointer' }}
            >
              <RefreshCw size={16} strokeWidth={2} /> Erneut versuchen
            </button>
          </div>
        )}

        {/* Status cards */}
        {snapshot && !loading && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>

              {/* Check-in */}
              <div style={{
                borderRadius: '20px', padding: '16px',
                background: snapshot.checkedInToday ? '#f0fdf8' : '#fffbeb',
                border: `1.5px solid ${snapshot.checkedInToday ? '#a7f3d0' : '#fcd34d'}`,
                boxShadow: CARD_SHADOW,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '10px' }}>
                  {snapshot.checkedInToday
                    ? <CheckCircle size={17} color="#00c896" strokeWidth={2.5} />
                    : <Clock size={17} color="#d97706" strokeWidth={2.5} />
                  }
                  <p style={{ margin: 0, fontSize: '0.7rem', fontWeight: 700, color: '#8892a4', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Check-in
                  </p>
                </div>
                <p style={{ margin: '0 0 3px', fontSize: '0.95rem', fontWeight: 800, color: snapshot.checkedInToday ? '#059669' : '#d97706', letterSpacing: '-0.01em' }}>
                  {snapshot.checkedInToday ? 'Heute ✅' : 'Noch nicht ⚠️'}
                </p>
                {snapshot.lastOkTime && (
                  <p style={{ margin: 0, fontSize: '0.73rem', fontWeight: 500, color: '#8892a4' }}>
                    {snapshot.lastOkTime} Uhr
                  </p>
                )}
              </div>

              {/* Medikamente */}
              <div style={{
                borderRadius: '20px', padding: '16px',
                background: snapshot.medications.allTaken ? '#f0fdf8' : '#fffbeb',
                border: `1.5px solid ${snapshot.medications.allTaken ? '#a7f3d0' : '#fcd34d'}`,
                boxShadow: CARD_SHADOW,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.95rem', lineHeight: 1 }}>💊</span>
                  <p style={{ margin: 0, fontSize: '0.7rem', fontWeight: 700, color: '#8892a4', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Medis
                  </p>
                </div>
                <p style={{ margin: '0 0 3px', fontSize: '0.95rem', fontWeight: 800, color: snapshot.medications.allTaken ? '#059669' : '#d97706', letterSpacing: '-0.01em' }}>
                  {snapshot.medications.total === 0
                    ? 'Keine'
                    : snapshot.medications.allTaken
                      ? 'Alle ✅'
                      : `${snapshot.medications.pendingCount} offen ⚠️`}
                </p>
                {snapshot.medications.total > 0 && (
                  <p style={{ margin: 0, fontSize: '0.73rem', fontWeight: 500, color: '#8892a4' }}>
                    {snapshot.medications.taken}/{snapshot.medications.total} genommen
                  </p>
                )}
              </div>

              {/* Stimmung */}
              <div style={{
                borderRadius: '20px', padding: '16px',
                background: snapshot.mood === 'good' ? '#f0fdf8' : snapshot.mood === 'notgood' ? '#fff0f0' : '#f8fffe',
                border: `1.5px solid ${snapshot.mood === 'good' ? '#a7f3d0' : snapshot.mood === 'notgood' ? '#fca5a5' : '#e2e8f0'}`,
                boxShadow: CARD_SHADOW,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.95rem', lineHeight: 1 }}>
                    {snapshot.mood === 'good' ? '😊' : snapshot.mood === 'notgood' ? '😔' : '🤔'}
                  </span>
                  <p style={{ margin: 0, fontSize: '0.7rem', fontWeight: 700, color: '#8892a4', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Stimmung
                  </p>
                </div>
                <p style={{ margin: '0 0 3px', fontSize: '0.95rem', fontWeight: 800, letterSpacing: '-0.01em', color: snapshot.mood === 'good' ? '#059669' : snapshot.mood === 'notgood' ? '#dc2626' : '#8892a4' }}>
                  {snapshot.mood === 'good' ? 'Gut 😊' : snapshot.mood === 'notgood' ? 'Nicht gut 😔' : 'Unbekannt'}
                </p>
                {snapshot.moodTime && (
                  <p style={{ margin: 0, fontSize: '0.73rem', fontWeight: 500, color: '#8892a4' }}>
                    {snapshot.moodTime} Uhr
                  </p>
                )}
              </div>

              {/* Standort */}
              <div style={{
                borderRadius: '20px', padding: '16px',
                background: snapshot.lastLocation ? '#f0fdf8' : '#f8fffe',
                border: `1.5px solid ${snapshot.lastLocation ? '#a7f3d0' : '#e2e8f0'}`,
                boxShadow: CARD_SHADOW,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '10px' }}>
                  <MapPin size={17} color={snapshot.lastLocation ? '#00c896' : '#8892a4'} strokeWidth={2.5} />
                  <p style={{ margin: 0, fontSize: '0.7rem', fontWeight: 700, color: '#8892a4', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Standort
                  </p>
                </div>
                <p style={{ margin: '0 0 3px', fontSize: '0.88rem', fontWeight: 800, color: '#1a1a2e', letterSpacing: '-0.01em', wordBreak: 'break-word', lineHeight: 1.3 }}>
                  {snapshot.lastLocation
                    ? (snapshot.lastLocation.address.split(',')[0] || 'Bekannt')
                    : 'Unbekannt'}
                </p>
                {snapshot.lastLocation?.timestamp && (
                  <p style={{ margin: 0, fontSize: '0.73rem', fontWeight: 500, color: '#8892a4' }}>
                    {snapshot.lastLocation.timestamp}
                  </p>
                )}
              </div>
            </div>

            {/* Schmerzen card */}
            <div style={{
              borderRadius: '20px', padding: '16px 18px',
              background: snapshot.painToday === 0 ? '#f0fdf8' : '#fff0f0',
              border: `1.5px solid ${snapshot.painToday === 0 ? '#a7f3d0' : '#fca5a5'}`,
              boxShadow: CARD_SHADOW,
              display: 'flex', alignItems: 'center', gap: '14px',
            }}>
              <div style={{
                width: '46px', height: '46px', borderRadius: '14px', flexShrink: 0,
                background: snapshot.painToday === 0 ? '#d1fae5' : '#fee2e2',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Activity size={24} color={snapshot.painToday === 0 ? '#059669' : '#dc2626'} strokeWidth={2} />
              </div>
              <div>
                <p style={{ margin: '0 0 3px', fontSize: '0.75rem', fontWeight: 700, color: '#8892a4', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Schmerzen heute
                </p>
                <p style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: snapshot.painToday === 0 ? '#059669' : '#dc2626', letterSpacing: '-0.01em' }}>
                  {snapshot.painToday === 0
                    ? 'Keine gemeldet ✅'
                    : `${snapshot.painToday} Meldung${snapshot.painToday > 1 ? 'en' : ''} ⚠️`}
                </p>
                {snapshot.lastPainSeverity !== null && snapshot.lastPainParts.length > 0 && (
                  <p style={{ margin: '2px 0 0', fontSize: '0.73rem', fontWeight: 500, color: '#8892a4' }}>
                    Stärke {snapshot.lastPainSeverity}/10 · {snapshot.lastPainParts.slice(0, 2).join(', ')}
                  </p>
                )}
              </div>
            </div>

            {/* Medication list */}
            {snapshot.medications.list.length > 0 && (
              <div style={{ borderRadius: '20px', overflow: 'hidden', background: '#fff', boxShadow: CARD_SHADOW }}>
                <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                  <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700, color: '#8892a4', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Medikamente Übersicht
                  </p>
                </div>
                {snapshot.medications.list.map((m, i) => (
                  <div key={i} style={{
                    padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    borderBottom: i < snapshot.medications.list.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '1.4rem' }}>💊</span>
                      <div>
                        <p style={{ margin: '0 0 2px', fontSize: '0.95rem', fontWeight: 700, color: '#1a1a2e' }}>{m.name}</p>
                        <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 500, color: '#8892a4' }}>{m.dosage}</p>
                      </div>
                    </div>
                    <span style={{
                      fontSize: '0.8rem', fontWeight: 800,
                      color: m.allTaken ? '#059669' : '#d97706',
                      padding: '4px 10px', borderRadius: '12px',
                      background: m.allTaken ? '#d1fae5' : '#fef3c7',
                      flexShrink: 0,
                    }}>
                      {m.allTaken ? 'Genommen ✅' : `${m.pendingCount} offen`}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Quick actions */}
            <div style={{ borderRadius: '20px', overflow: 'hidden', background: '#fff', boxShadow: CARD_SHADOW }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700, color: '#8892a4', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Schnellaktionen
                </p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}>
                <button
                  onClick={() => snapshot.emergencyPhone && (window.location.href = `tel:${snapshot.emergencyPhone}`)}
                  style={{ padding: '18px 8px', border: 'none', borderRight: '1px solid rgba(0,0,0,0.06)', background: '#e8fff8', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                >
                  <Phone size={22} color="#00c896" strokeWidth={2} />
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#00a67e' }}>Anrufen</span>
                </button>
                <button
                  onClick={() => snapshot.emergencyPhone && (window.location.href = `sms:${snapshot.emergencyPhone}`)}
                  style={{ padding: '18px 8px', border: 'none', borderRight: '1px solid rgba(0,0,0,0.06)', background: '#f3e8ff', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                >
                  <MessageCircle size={22} color="#7c3aed" strokeWidth={2} />
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#6d28d9' }}>Nachricht</span>
                </button>
                <button
                  onClick={() => {
                    const loc = snapshot.lastLocation
                    if (loc) window.open(`https://maps.google.com/maps?q=${encodeURIComponent(loc.address)}`, '_blank')
                  }}
                  style={{ padding: '18px 8px', border: 'none', background: '#e8f4ff', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                >
                  <MapPin size={22} color="#2563eb" strokeWidth={2} />
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#1d4ed8' }}>Standort</span>
                </button>
              </div>
            </div>
          </>
        )}

        {/* Connected seniors list */}
        <div style={{ borderRadius: '20px', overflow: 'hidden', background: '#fff', boxShadow: CARD_SHADOW }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700, color: '#8892a4', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Verbundene Profile
            </p>
            <button onClick={() => setShowAddForm(true)} style={{ background: 'none', border: 'none', fontSize: '0.82rem', fontWeight: 700, color: '#00c896', cursor: 'pointer' }}>
              + Hinzufügen
            </button>
          </div>
          {seniors.map((s, i) => (
            <div key={s.code} style={{
              padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              borderBottom: i < seniors.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none',
              background: s.code === activeCode ? '#f0fdf8' : '#fff',
            }}>
              <button onClick={() => switchSenior(s.code)} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', flex: 1 }}>
                <span style={{ fontSize: '1.6rem' }}>👴</span>
                <div>
                  <p style={{ margin: '0 0 2px', fontSize: '0.95rem', fontWeight: 700, color: '#1a1a2e' }}>{s.name}</p>
                  <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 500, color: '#8892a4' }}>Code: {s.code}</p>
                </div>
              </button>
              <button onClick={() => removeSenior(s.code)} style={{ background: 'none', border: 'none', fontSize: '0.82rem', fontWeight: 700, color: '#dc2626', cursor: 'pointer', padding: '4px 8px' }}>
                Entfernen
              </button>
            </div>
          ))}
        </div>

        {/* Info notice */}
        <div style={{ borderRadius: '18px', padding: '14px 18px', background: '#f8fffe', border: '1px solid #e2e8f0', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 500, color: '#8892a4', lineHeight: 1.6 }}>
            Daten werden in Echtzeit aktualisiert sobald der Senior die App nutzt.
          </p>
        </div>
      </div>
    </div>
  )
}
