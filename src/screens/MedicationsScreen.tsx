import React, { useState, useEffect } from 'react'
import { CheckCircle, Circle, Clock } from 'lucide-react'
import { Header } from '../components/Header'
import type { Medication } from '../types'

interface MedicationsScreenProps {
  medications: Medication[]
  onTaken: (id: string, time: 'morning' | 'noon' | 'evening') => void
  onBack: () => void
}

const timeLabels: Record<'morning' | 'noon' | 'evening', string> = {
  morning: '🌅 Morgens',
  noon: '☀️ Mittags',
  evening: '🌙 Abends',
}

function getNextDose(medication: Medication): string {
  const now = new Date()
  const hour = now.getHours()
  const scheduleOrder: Array<'morning' | 'noon' | 'evening'> = ['morning', 'noon', 'evening']
  const scheduleHours: Record<'morning' | 'noon' | 'evening', number> = { morning: 8, noon: 12, evening: 20 }

  for (const time of scheduleOrder) {
    if (medication.schedule.includes(time) && !medication.takenToday[time]) {
      const targetHour = scheduleHours[time]
      if (hour <= targetHour) {
        const diff = targetHour - hour
        if (diff === 0) return 'Jetzt!'
        return `in ${diff} Std.`
      }
    }
  }
  return 'Morgen früh'
}

function MedicationCard({
  medication,
  onTaken,
}: {
  medication: Medication
  onTaken: (time: 'morning' | 'noon' | 'evening') => void
}) {
  const allTaken = medication.schedule.every(t => medication.takenToday[t])
  const nextDose = allTaken ? null : getNextDose(medication)

  return (
    <div
      className="rounded-3xl overflow-hidden shadow-md"
      style={{
        backgroundColor: '#ffffff',
        border: `3px solid ${allTaken ? '#86efac' : '#e8d0d0'}`,
      }}
    >
      {/* Foto & Name */}
      <div className="flex items-center gap-4 p-5" style={{ backgroundColor: allTaken ? '#f0fdf4' : '#fdf6f0' }}>
        <div
          className="rounded-2xl overflow-hidden flex items-center justify-center flex-shrink-0"
          style={{ width: '80px', height: '80px', backgroundColor: '#f8e8e8', border: '2px solid #e8a0a0' }}
        >
          {medication.photo ? (
            <img src={medication.photo} alt={medication.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontSize: '2.5rem' }}>💊</span>
          )}
        </div>
        <div className="flex flex-col flex-1">
          <p style={{ fontSize: '1.4rem', fontWeight: 800, color: '#2d1a1a', margin: '0 0 4px' }}>
            {medication.name}
          </p>
          {allTaken ? (
            <span style={{ fontSize: '1rem', fontWeight: 700, color: '#16a34a' }}>
              ✅ Heute alles eingenommen
            </span>
          ) : (
            <div className="flex items-center gap-2">
              <Clock size={16} color="#c2410c" />
              <span style={{ fontSize: '1rem', fontWeight: 700, color: '#c2410c' }}>
                Nächste: {nextDose}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Einnahme-Zeiten */}
      <div className="flex flex-col gap-3 p-4">
        {(['morning', 'noon', 'evening'] as const).map(time => {
          if (!medication.schedule.includes(time)) return null
          const taken = medication.takenToday[time]
          return (
            <button
              key={time}
              onClick={() => !taken && onTaken(time)}
              disabled={taken}
              className="flex items-center justify-between rounded-2xl px-5 transition-all active:scale-95"
              style={{
                backgroundColor: taken ? '#dcfce7' : '#f8e8e8',
                border: `2px solid ${taken ? '#86efac' : '#e8a0a0'}`,
                minHeight: '72px',
                cursor: taken ? 'default' : 'pointer',
              }}
            >
              <div className="flex items-center gap-3">
                {taken
                  ? <CheckCircle size={28} color="#16a34a" />
                  : <Circle size={28} color="#e8a0a0" />
                }
                <span style={{ fontSize: '1.2rem', fontWeight: 700, color: taken ? '#16a34a' : '#2d1a1a' }}>
                  {timeLabels[time]}
                </span>
              </div>
              {!taken && (
                <span
                  className="rounded-xl px-4 py-2"
                  style={{ backgroundColor: '#4ade80', fontSize: '1rem', fontWeight: 800, color: '#14532d' }}
                >
                  ✅ Eingenommen
                </span>
              )}
            </button>
          )
        })}
      </div>

      {medication.notes && (
        <div className="px-4 pb-4">
          <p style={{ fontSize: '1rem', color: '#6b4a4a', backgroundColor: '#fdf6f0', borderRadius: '12px', padding: '12px', margin: 0 }}>
            📝 {medication.notes}
          </p>
        </div>
      )}
    </div>
  )
}

export function MedicationsScreen({ medications, onTaken, onBack }: MedicationsScreenProps) {
  const [, setTick] = useState(0)

  // Update countdown every minute
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 60000)
    return () => clearInterval(interval)
  }, [])

  const pending = medications.filter(m => m.schedule.some(t => !m.takenToday[t]))
  const done = medications.filter(m => m.schedule.every(t => m.takenToday[t]))

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: '#fdf6f0' }}>
      <Header title="💊 Medikamente" onBack={onBack} />

      <div className="flex flex-col gap-4 p-4" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)' }}>
        {medications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <span style={{ fontSize: '4rem' }}>💊</span>
            <p style={{ fontSize: '1.2rem', color: '#6b4a4a', textAlign: 'center', lineHeight: 1.6 }}>
              Noch keine Medikamente.{'\n'}Bitte in Einstellungen hinzufügen.
            </p>
          </div>
        ) : (
          <>
            {pending.length > 0 && (
              <>
                <div
                  className="rounded-2xl px-5 py-4"
                  style={{ backgroundColor: '#fef3c7', border: '2px solid #fcd34d' }}
                >
                  <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#92400e', margin: 0 }}>
                    ⏰ Noch ausstehend: {pending.length} Medikament{pending.length !== 1 ? 'e' : ''}
                  </p>
                </div>
                {pending.map(med => (
                  <MedicationCard key={med.id} medication={med} onTaken={time => onTaken(med.id, time)} />
                ))}
              </>
            )}

            {done.length > 0 && (
              <>
                {pending.length > 0 && (
                  <div
                    className="rounded-2xl px-5 py-4 mt-2"
                    style={{ backgroundColor: '#f0fdf4', border: '2px solid #86efac' }}
                  >
                    <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#166534', margin: 0 }}>
                      ✅ Heute schon eingenommen
                    </p>
                  </div>
                )}
                {done.map(med => (
                  <MedicationCard key={med.id} medication={med} onTaken={time => onTaken(med.id, time)} />
                ))}
              </>
            )}

            {pending.length === 0 && done.length > 0 && (
              <div
                className="rounded-2xl px-5 py-5 text-center"
                style={{ backgroundColor: '#dcfce7', border: '3px solid #4ade80' }}
              >
                <p style={{ fontSize: '1.4rem', fontWeight: 800, color: '#166534', margin: 0 }}>
                  🎉 Super! Alle Medikamente heute eingenommen!
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
