import React, { useState, useEffect, lazy, Suspense } from 'react'
import { CheckCircle, Circle, QrCode } from 'lucide-react'
import { Header } from '../components/Header'
const BarcodeScanner = lazy(() => import('../components/BarcodeScanner').then(m => ({ default: m.BarcodeScanner })))
import type { Medication, MedicationDose } from '../types'

interface MedicationsScreenProps {
  medications: Medication[]
  onTaken: (medId: string, doseIndex: number) => void
  onBack: () => void
}

function getCountdown(timeStr: string): string {
  const now = new Date()
  const [h, m] = timeStr.split(':').map(Number)
  const target = new Date()
  target.setHours(h, m, 0, 0)
  const diff = Math.max(0, Math.floor((target.getTime() - now.getTime()) / 60000))
  if (diff === 0) return '⏰ Jetzt!'
  if (diff < 60) return `⏰ in ${diff} Min.`
  const hrs = Math.floor(diff / 60)
  const mins = diff % 60
  return `⏰ in ${hrs} Std.${mins > 0 ? ` ${mins} Min.` : ''}`
}

function isTimeNowOrPast(timeStr: string): boolean {
  const now = new Date()
  const [h, m] = timeStr.split(':').map(Number)
  return now.getHours() * 60 + now.getMinutes() >= h * 60 + m
}

function MedicationCard({ med, onTaken }: { med: Medication; onTaken: (i: number) => void }) {
  const allTaken = med.doses.every(d => d.taken)

  return (
    <div
      className="rounded-3xl overflow-hidden shadow-md"
      style={{ backgroundColor: '#ffffff', border: `3px solid ${allTaken ? '#86efac' : '#e8d0d0'}` }}
    >
      {/* Header */}
      <div className="flex items-center gap-4 p-5" style={{ backgroundColor: allTaken ? '#f0fdf4' : '#fdf6f0' }}>
        <div
          className="rounded-2xl overflow-hidden flex items-center justify-center flex-shrink-0"
          style={{ width: '80px', height: '80px', backgroundColor: '#f8e8e8', border: '2px solid #e8a0a0' }}
        >
          {med.photo
            ? <img src={med.photo} alt={med.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ fontSize: '2.5rem' }}>💊</span>
          }
        </div>
        <div className="flex flex-col flex-1">
          <p style={{ fontSize: '1.4rem', fontWeight: 800, color: '#2d1a1a', margin: '0 0 2px' }}>{med.name}</p>
          <p style={{ fontSize: '1rem', color: '#6b4a4a', margin: '0 0 2px', fontWeight: 600 }}>{med.dosage}</p>
          {allTaken
            ? <span style={{ fontSize: '1rem', fontWeight: 700, color: '#16a34a' }}>✅ Heute vollständig eingenommen</span>
            : <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#c2410c' }}>{med.frequency}× täglich</span>
          }
        </div>
      </div>

      {/* Dosen */}
      <div className="flex flex-col gap-3 px-4 pb-4 pt-2">
        {med.doses.map((dose, i) => {
          const isDue = isTimeNowOrPast(dose.time)
          return (
            <button
              key={i}
              onClick={() => !dose.taken && onTaken(i)}
              disabled={dose.taken}
              className="flex items-center justify-between rounded-2xl px-5 transition-all active:scale-95"
              style={{
                backgroundColor: dose.taken ? '#dcfce7' : isDue ? '#fff7ed' : '#f8e8e8',
                border: `2px solid ${dose.taken ? '#86efac' : isDue ? '#fed7aa' : '#e8d0d0'}`,
                minHeight: '76px',
                cursor: dose.taken ? 'default' : 'pointer',
              }}
            >
              <div className="flex items-center gap-3">
                {dose.taken
                  ? <CheckCircle size={28} color="#16a34a" />
                  : <Circle size={28} color={isDue ? '#f59e0b' : '#e8a0a0'} />
                }
                <div className="flex flex-col items-start">
                  <span style={{ fontSize: '1.2rem', fontWeight: 800, color: dose.taken ? '#16a34a' : '#2d1a1a' }}>
                    {dose.time} Uhr
                  </span>
                  {!dose.taken && (
                    <span style={{ fontSize: '0.9rem', color: isDue ? '#c2410c' : '#6b4a4a', fontWeight: 600 }}>
                      {isDue ? '⚡ Fällig!' : getCountdown(dose.time)}
                    </span>
                  )}
                </div>
              </div>
              {!dose.taken && (
                <span
                  className="rounded-xl px-4 py-2"
                  style={{
                    backgroundColor: isDue ? '#4ade80' : '#e8d0d0',
                    fontSize: '1rem',
                    fontWeight: 800,
                    color: isDue ? '#14532d' : '#999',
                  }}
                >
                  ✅ Eingenommen
                </span>
              )}
            </button>
          )
        })}
      </div>

      {med.notes && (
        <div className="px-4 pb-4">
          <p style={{ fontSize: '1rem', color: '#6b4a4a', backgroundColor: '#fdf6f0', borderRadius: '12px', padding: '12px', margin: 0 }}>
            📝 {med.notes}
          </p>
        </div>
      )}
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

  return (
    <div className="screen">
      {showScanner && (
        <Suspense fallback={<div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: '#000' }}><p style={{ color: '#fff', fontSize: '1.2rem' }}>Kamera wird geladen...</p></div>}>
          <BarcodeScanner
            onScan={code => { setScannedCode(code); setShowScanner(false) }}
            onClose={() => setShowScanner(false)}
          />
        </Suspense>
      )}

      <Header
        title="💊 Medikamente"
        onBack={onBack}
        rightAction={
          <button
            onClick={() => setShowScanner(true)}
            className="flex items-center justify-center rounded-2xl"
            style={{ width: '56px', height: '56px', backgroundColor: '#ffffff', border: '2px solid #e8a0a0' }}
            title="Barcode scannen"
          >
            <QrCode size={26} color="#e8a0a0" />
          </button>
        }
      />

      {scannedCode && (
        <div className="mx-4 mt-3 rounded-2xl px-4 py-3 flex items-center justify-between" style={{ backgroundColor: '#f0fdf4', border: '2px solid #86efac' }}>
          <p style={{ fontSize: '1rem', fontWeight: 700, color: '#166534', margin: 0 }}>
            📦 Barcode: {scannedCode}
          </p>
          <button onClick={() => setScannedCode(null)} style={{ fontSize: '1.2rem', background: 'none', padding: '4px 8px' }}>✕</button>
        </div>
      )}

      <div className="scroll-zone" style={{ padding: '12px 16px', paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {medications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <span style={{ fontSize: '4rem' }}>💊</span>
            <p style={{ fontSize: '1.2rem', color: '#6b4a4a', textAlign: 'center', lineHeight: 1.6 }}>
              Noch keine Medikamente.{'\n'}In den Einstellungen hinzufügen.
            </p>
          </div>
        ) : (
          <>
            {/* Zusammenfassung */}
            {pending.length > 0 ? (
              <div className="rounded-2xl px-5 py-4" style={{ backgroundColor: '#fef3c7', border: '2px solid #fcd34d' }}>
                <p style={{ fontSize: '1.1rem', fontWeight: 800, color: '#92400e', margin: 0 }}>
                  ⏰ Noch ausstehend: {pending.reduce((n, m) => n + m.doses.filter(d => !d.taken).length, 0)} Einnahmen
                </p>
              </div>
            ) : (
              <div className="rounded-2xl px-5 py-4 text-center" style={{ backgroundColor: '#dcfce7', border: '3px solid #4ade80' }}>
                <p style={{ fontSize: '1.2rem', fontWeight: 800, color: '#166534', margin: 0 }}>
                  🎉 Alle Medikamente heute eingenommen!
                </p>
              </div>
            )}

            {pending.map(med => (
              <MedicationCard key={med.id} med={med} onTaken={i => onTaken(med.id, i)} />
            ))}

            {done.length > 0 && pending.length > 0 && (
              <p style={{ fontSize: '1rem', fontWeight: 700, color: '#166534', textAlign: 'center', margin: '4px 0' }}>
                ✅ Bereits eingenommen
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
