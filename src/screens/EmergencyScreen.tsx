import React, { useState } from 'react'
import { Phone, AlertTriangle, CheckCircle } from 'lucide-react'
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

const CARD_SHADOW = '0 2px 8px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.04)'

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
      if (emergencyContact?.phone) window.location.href = `tel:${emergencyContact.phone}`
    }, 2000)
  }

  function handleOkConfirmed() {
    const t = getTime()
    setLastOk(t)
    localStorage.setItem('ilocare_last_ok', t)
    openSMS(allPhones, `✅ ${userName} geht es gut – ${t} Uhr`)
    setUiState('done-ok')
    setTimeout(() => setUiState('idle'), 5000)
  }

  function handleNotGoodConfirmed() {
    openSMS(allPhones, `⚠️ ${userName} fühlt sich heute nicht gut. – ${getTime()} Uhr`)
    setUiState('done-notgood')
    setTimeout(() => setUiState('idle'), 5000)
  }

  return (
    <div className="screen" style={{ background: '#f8fffe' }}>
      <Header title="Notfall" onBack={onBack} />

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

      <div className="scroll-zone" style={{ padding: '16px', paddingBottom: 'calc(env(safe-area-inset-bottom) + 20px)', display: 'flex', flexDirection: 'column', gap: '14px' }}>

        {/* Status Messages */}
        {lastOk && uiState === 'idle' && (
          <div style={{ borderRadius: '18px', padding: '14px 18px', background: '#f0fdf8', border: '1.5px solid #a7f3d0', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CheckCircle size={20} color="#00c896" strokeWidth={2} />
            <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: '#059669' }}>
              Letzter OK-Status heute um {lastOk} Uhr
            </p>
          </div>
        )}

        {uiState === 'calling-sos' && (
          <div style={{
            borderRadius: '24px', padding: '24px', textAlign: 'center',
            background: '#fff0f0', border: '2px solid #fca5a5',
          }}>
            <AlertTriangle size={36} color="#dc2626" style={{ margin: '0 auto 10px' }} />
            <p style={{ margin: '0 0 6px', fontSize: '1.3rem', fontWeight: 900, color: '#dc2626', letterSpacing: '-0.02em' }}>
              NOTFALL AUSGELÖST!
            </p>
            <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 500, color: '#dc2626' }}>
              {gpsLoading ? 'GPS wird ermittelt...' : 'Notfallkontakt wird angerufen...'}
            </p>
          </div>
        )}

        {uiState === 'done-ok' && (
          <div style={{ borderRadius: '24px', padding: '24px', textAlign: 'center', background: '#f0fdf8', border: '1.5px solid #a7f3d0', boxShadow: CARD_SHADOW }}>
            <p style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#059669', letterSpacing: '-0.02em' }}>
              Familie wurde informiert! ✅{'\n'}„{userName} geht es gut"
            </p>
          </div>
        )}

        {uiState === 'done-notgood' && (
          <div style={{ borderRadius: '24px', padding: '24px', textAlign: 'center', background: '#fffbeb', border: '1.5px solid #fcd34d', boxShadow: CARD_SHADOW }}>
            <p style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#d97706', letterSpacing: '-0.02em' }}>
              Familie wurde benachrichtigt! ⚠️
            </p>
          </div>
        )}

        {/* 🔴 Large SOS Button */}
        {!sosActive && (
          <button
            onClick={() => setUiState('sos-1')}
            className="sos-pulse"
            style={{
              width: '100%', borderRadius: '32px',
              background: 'linear-gradient(135deg, #ff4757 0%, #c0392b 100%)',
              minHeight: '160px',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: '10px',
              border: '2px solid rgba(255,255,255,0.3)',
            }}
          >
            <AlertTriangle size={42} color="#ffffff" strokeWidth={2.5} />
            <p style={{
              margin: 0, fontSize: '2rem', fontWeight: 900, color: '#ffffff',
              letterSpacing: '0.04em',
            }}>
              SOS – NOTRUF
            </p>
            <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 500, color: 'rgba(255,255,255,0.85)', textAlign: 'center', lineHeight: 1.4 }}>
              GPS-Standort + SMS an Familie{'\n'}Notfallkontakt wird automatisch angerufen
            </p>
          </button>
        )}

        {/* ✅ Mir geht es gut */}
        {!sosActive && (
          <button
            onClick={() => setUiState('confirm-ok')}
            style={{
              width: '100%', borderRadius: '24px',
              background: 'linear-gradient(135deg, #00c896 0%, #00a67e 100%)',
              minHeight: '100px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px',
              border: '1.5px solid rgba(255,255,255,0.4)',
              boxShadow: '0 8px 28px rgba(0,200,150,0.35)',
            }}
          >
            <CheckCircle size={32} color="#ffffff" strokeWidth={2.5} />
            <div style={{ textAlign: 'left' }}>
              <p style={{ margin: '0 0 3px', fontSize: '1.2rem', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em' }}>
                Mir geht es gut
              </p>
              <p style={{ margin: 0, fontSize: '0.78rem', fontWeight: 500, color: 'rgba(255,255,255,0.85)' }}>
                Familie per SMS informieren
              </p>
            </div>
          </button>
        )}

        {/* 🟡 Nicht gut */}
        {!sosActive && (
          <button
            onClick={() => setUiState('confirm-notgood')}
            style={{
              width: '100%', borderRadius: '24px',
              background: '#ffffff',
              minHeight: '90px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px',
              border: '1.5px solid #fcd34d',
              boxShadow: CARD_SHADOW,
            }}
          >
            <span style={{ fontSize: '2rem', lineHeight: 1 }}>😔</span>
            <div style={{ textAlign: 'left' }}>
              <p style={{ margin: '0 0 3px', fontSize: '1.1rem', fontWeight: 800, color: '#1a1a2e', letterSpacing: '-0.02em' }}>
                Mir geht es nicht gut
              </p>
              <p style={{ margin: 0, fontSize: '0.78rem', fontWeight: 500, color: '#8892a4' }}>
                Familie benachrichtigen
              </p>
            </div>
          </button>
        )}

        {/* Emergency Contacts */}
        {contacts.length > 0 && (
          <div style={{ borderRadius: '24px', overflow: 'hidden', background: '#ffffff', boxShadow: CARD_SHADOW, border: '1px solid rgba(255,255,255,0.8)' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
              <p style={{ margin: 0, fontSize: '0.78rem', fontWeight: 700, color: '#8892a4', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Notfallkontakte
              </p>
            </div>
            {contacts.slice(0, 3).map(c => (
              <button
                key={c.id}
                onClick={() => { if (c.phone) window.location.href = `tel:${c.phone}` }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 18px',
                  background: 'transparent', border: 'none',
                  borderBottom: '1px solid rgba(0,0,0,0.04)',
                  textAlign: 'left',
                }}
              >
                <div>
                  <p style={{ margin: '0 0 2px', fontSize: '0.95rem', fontWeight: 700, color: '#1a1a2e' }}>
                    {c.name}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 500, color: '#8892a4' }}>
                    {c.phone}
                  </p>
                </div>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '50%',
                  background: '#e8fff8', border: '1.5px solid #a7f3d0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Phone size={18} color="#00c896" strokeWidth={2} />
                </div>
              </button>
            ))}
          </div>
        )}

        {/* GPS note */}
        <div style={{ borderRadius: '18px', padding: '14px 18px', background: '#f8fffe', border: '1px solid #e2e8f0', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 500, color: '#8892a4', lineHeight: 1.6 }}>
            Beim SOS-Alarm wird dein GPS-Standort automatisch mitgeschickt.
          </p>
        </div>
      </div>
    </div>
  )
}
