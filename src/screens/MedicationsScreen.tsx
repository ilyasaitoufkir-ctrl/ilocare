import React, { useState, useEffect, lazy, Suspense } from 'react'
import { CheckCircle, Circle, QrCode, Clock } from 'lucide-react'
import { Header } from '../components/Header'
const BarcodeScanner = lazy(() => import('../components/BarcodeScanner').then(m => ({ default: m.BarcodeScanner })))
import type { Medication } from '../types'

interface MedicationsScreenProps {
  medications: Medication[]
  onTaken: (medId: string, doseIndex: number) => void
  onBack: () => void
}

const CARD_SHADOW = '0 2px 8px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.04)'

function getCountdown(timeStr: string): string {
  const now = new Date()
  const [h, m] = timeStr.split(':').map(Number)
  const target = new Date()
  target.setHours(h, m, 0, 0)
  const diff = Math.max(0, Math.floor((target.getTime() - now.getTime()) / 60000))
  if (diff === 0) return 'Jetzt fällig!'
  if (diff < 60) return `in ${diff} Min.`
  return `in ${Math.floor(diff / 60)}h ${diff % 60}m`
}

function isTimeNowOrPast(timeStr: string): boolean {
  const now = new Date()
  const [h, m] = timeStr.split(':').map(Number)
  return now.getHours() * 60 + now.getMinutes() >= h * 60 + m
}

function MedicationCard({ med, onTaken }: { med: Medication; onTaken: (i: number) => void }) {
  const allTaken = med.doses.every(d => d.taken)
  const pendingDoses = med.doses.filter(d => !d.taken)

  return (
    <div style={{
      background: '#ffffff', borderRadius: '24px',
      overflow: 'hidden', boxShadow: CARD_SHADOW,
      border: allTaken ? '1.5px solid #a7f3d0' : '1.5px solid rgba(255,255,255,0.8)',
    }}>
      {/* Card Header */}
      <div style={{
        padding: '16px 18px',
        background: allTaken ? '#f0fdf8' : '#ffffff',
        display: 'flex', alignItems: 'center', gap: '14px',
        borderBottom: '1px solid rgba(0,0,0,0.04)',
      }}>
        <div style={{
          width: '72px', height: '72px', borderRadius: '18px',
          overflow: 'hidden', flexShrink: 0,
          background: allTaken ? '#d1fae5' : '#f0f8ff',
          border: `2px solid ${allTaken ? '#a7f3d0' : '#bfdbfe'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {med.photo
            ? <img src={med.photo} alt={med.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ fontSize: '2.2rem', lineHeight: 1 }}>💊</span>
          }
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ margin: '0 0 3px', fontSize: '1.2rem', fontWeight: 800, color: '#1a1a2e', letterSpacing: '-0.02em' }}>
            {med.name}
          </p>
          <p style={{ margin: '0 0 4px', fontSize: '0.85rem', fontWeight: 500, color: '#8892a4' }}>
            {med.dosage} · {med.frequency}× täglich
          </p>
          {allTaken ? (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '4px',
              fontSize: '0.78rem', fontWeight: 700, color: '#059669',
              background: '#d1fae5', padding: '3px 10px', borderRadius: '20px',
            }}>
              <CheckCircle size={13} strokeWidth={2.5} /> Heute eingenommen
            </span>
          ) : (
            <span style={{
              fontSize: '0.78rem', fontWeight: 600, color: '#d97706',
            }}>
              {pendingDoses.length} Einnahme{pendingDoses.length > 1 ? 'n' : ''} ausstehend
            </span>
          )}
        </div>
      </div>

      {/* Doses */}
      <div style={{ padding: '10px 14px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {med.doses.map((dose, i) => {
          const isDue = isTimeNowOrPast(dose.time)
          return (
            <button
              key={i}
              onClick={() => !dose.taken && onTaken(i)}
              disabled={dose.taken}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                borderRadius: '16px', padding: '12px 16px',
                background: dose.taken ? '#f0fdf8' : isDue ? '#fffbeb' : '#f8fffe',
                border: `1.5px solid ${dose.taken ? '#a7f3d0' : isDue ? '#fcd34d' : '#e2e8f0'}`,
                minHeight: '62px', cursor: dose.taken ? 'default' : 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {dose.taken
                  ? <CheckCircle size={26} color="#00c896" strokeWidth={2} />
                  : <Circle size={26} color={isDue ? '#f59e0b' : '#8892a4'} strokeWidth={2} />
                }
                <div>
                  <p style={{
                    margin: '0 0 1px', fontSize: '1.05rem', fontWeight: 800,
                    color: dose.taken ? '#059669' : '#1a1a2e',
                    letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums',
                  }}>
                    {dose.time} Uhr
                  </p>
                  {!dose.taken && (
                    <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 600, color: isDue ? '#d97706' : '#8892a4' }}>
                      {isDue ? '⚡ Jetzt fällig' : getCountdown(dose.time)}
                    </p>
                  )}
                </div>
              </div>
              {!dose.taken && (
                <div style={{
                  padding: '8px 14px', borderRadius: '12px', fontSize: '0.82rem', fontWeight: 800,
                  background: isDue
                    ? 'linear-gradient(135deg, #00c896, #00a67e)'
                    : '#f0f4f8',
                  color: isDue ? '#fff' : '#8892a4',
                  border: isDue ? 'none' : '1px solid #e2e8f0',
                  flexShrink: 0,
                }}>
                  {isDue ? 'Eingenommen ✓' : 'Noch nicht fällig'}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {med.notes ? (
        <div style={{ padding: '0 14px 14px' }}>
          <div style={{
            background: '#f8fffe', borderRadius: '14px', padding: '10px 14px',
            border: '1px solid #e8f4f0',
          }}>
            <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 500, color: '#8892a4', lineHeight: 1.5 }}>
              📝 {med.notes}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export function MedicationsScreen({ medications, onTaken, onBack }: MedicationsScreenProps) {
  const [, setTick] = useState(0)
  const [showScanner, setShowScanner] = useState(false)
  const [scannedCode, setScannedCode] = useState<string | null>(null)

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 30000)
    return () => clearInterval(id)
  }, [])

  const pending = medications.filter(m => m.doses.some(d => !d.taken))
  const done = medications.filter(m => m.doses.every(d => d.taken))
  const totalPending = medications.reduce((n, m) => n + m.doses.filter(d => !d.taken).length, 0)

  return (
    <div className="screen" style={{ background: '#f8fffe' }}>
      {showScanner && (
        <Suspense fallback={
          <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
            <p style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 600 }}>Kamera wird geladen...</p>
          </div>
        }>
          <BarcodeScanner
            onScan={code => { setScannedCode(code); setShowScanner(false) }}
            onClose={() => setShowScanner(false)}
          />
        </Suspense>
      )}

      <Header
        title="Medikamente"
        onBack={onBack}
        rightAction={
          <button
            onClick={() => setShowScanner(true)}
            style={{
              width: '44px', height: '44px', borderRadius: '12px',
              background: '#e8fff8', border: '1.5px solid #a7f3d0',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <QrCode size={22} color="#00c896" strokeWidth={2} />
          </button>
        }
      />

      {scannedCode && (
        <div style={{
          margin: '8px 16px 0', borderRadius: '16px', padding: '12px 16px',
          background: '#f0fdf8', border: '1.5px solid #a7f3d0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#059669' }}>
            📦 Barcode: {scannedCode}
          </p>
          <button onClick={() => setScannedCode(null)} style={{ fontSize: '1.1rem', background: 'none', padding: '4px 8px', color: '#8892a4' }}>✕</button>
        </div>
      )}

      <div className="scroll-zone" style={{ padding: '14px 16px', paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {medications.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: '60px', gap: '16px' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: '#e8fff8', border: '2px solid #a7f3d0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '2.5rem' }}>💊</span>
            </div>
            <p style={{ fontSize: '1.05rem', fontWeight: 600, color: '#8892a4', textAlign: 'center', lineHeight: 1.6, margin: 0 }}>
              Noch keine Medikamente.{'\n'}In den Einstellungen hinzufügen.
            </p>
          </div>
        ) : (
          <>
            {/* Status banner */}
            {totalPending > 0 ? (
              <div style={{
                borderRadius: '18px', padding: '14px 18px',
                background: '#fffbeb', border: '1.5px solid #fcd34d',
                display: 'flex', alignItems: 'center', gap: '12px',
              }}>
                <Clock size={22} color="#d97706" strokeWidth={2} />
                <div>
                  <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#1a1a2e', letterSpacing: '-0.02em' }}>
                    {totalPending} Einnahme{totalPending > 1 ? 'n' : ''} ausstehend
                  </p>
                  <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 500, color: '#d97706' }}>
                    Bitte rechtzeitig einnehmen
                  </p>
                </div>
              </div>
            ) : (
              <div style={{
                borderRadius: '18px', padding: '14px 18px',
                background: '#f0fdf8', border: '1.5px solid #a7f3d0',
                display: 'flex', alignItems: 'center', gap: '12px',
              }}>
                <CheckCircle size={22} color="#00c896" strokeWidth={2} />
                <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#1a1a2e', letterSpacing: '-0.02em' }}>
                  Alle Medikamente heute eingenommen! 🎉
                </p>
              </div>
            )}

            {pending.map(med => (
              <MedicationCard key={med.id} med={med} onTaken={i => onTaken(med.id, i)} />
            ))}

            {done.length > 0 && pending.length > 0 && (
              <p style={{ fontSize: '0.8rem', fontWeight: 700, color: '#8892a4', textAlign: 'center', margin: '4px 0', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Bereits eingenommen
              </p>
            )}

            {done.map(med => (
              <MedicationCard key={med.id} med={med} onTaken={i => onTaken(med.id, i)} />
            ))}
          </>
        )}
      </div>
    </div>
  )
}
