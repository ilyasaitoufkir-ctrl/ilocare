import { useEffect, useRef } from 'react'
import { doc, setDoc } from 'firebase/firestore'
import { getDb } from '../lib/firebase'
import type { AppState } from '../types'

export function useFirebaseSync(state: AppState, enabled: boolean) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!enabled) return
    const db = getDb()
    if (!db || !state.familyCode || state.familyCode === '0000') return

    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(async () => {
      try {
        const today = new Date().toDateString()
        const todayPain = state.painHistory.filter(
          e => new Date(e.timestamp).toDateString() === today
        )
        const lastPain = state.painHistory[0]
        const emergencyPhone =
          state.contacts.find(c => c.isEmergency)?.phone ||
          state.contacts[0]?.phone ||
          null

        await setDoc(
          doc(db, 'ilocare_seniors', state.familyCode),
          {
            userName: state.userName,
            lastActive: new Date().toISOString(),
            lastOkTime: localStorage.getItem('ilocare_last_ok') ?? null,
            checkedInToday: !!localStorage.getItem('ilocare_last_ok'),
            mood: (localStorage.getItem('ilocare_mood') ?? null) as 'good' | 'notgood' | null,
            moodTime: localStorage.getItem('ilocare_mood_time') ?? null,
            emergencyPhone,
            medications: {
              allTaken:
                state.medications.length > 0 &&
                state.medications.every(m => m.doses.every(d => d.taken)),
              pendingCount: state.medications.reduce(
                (n, m) => n + m.doses.filter(d => !d.taken).length,
                0
              ),
              total: state.medications.reduce((n, m) => n + m.doses.length, 0),
              taken: state.medications.reduce(
                (n, m) => n + m.doses.filter(d => d.taken).length,
                0
              ),
              list: state.medications.map(m => ({
                name: m.name,
                dosage: m.dosage,
                allTaken: m.doses.every(d => d.taken),
                pendingCount: m.doses.filter(d => !d.taken).length,
              })),
            },
            lastLocation: state.lastKnownLocation
              ? {
                  address: state.lastKnownLocation.address,
                  timestamp: state.lastKnownLocation.timestamp,
                  lat: state.lastKnownLocation.lat,
                  lon: state.lastKnownLocation.lon,
                }
              : null,
            painToday: todayPain.length,
            lastPainSeverity: lastPain?.severity ?? null,
            lastPainParts: lastPain?.bodyParts ?? [],
            healthRecord: {
              bloodType: state.healthRecord.bloodType,
              allergies: state.healthRecord.allergies,
              conditions: state.healthRecord.conditions,
            },
          },
          { merge: true }
        )
      } catch (err) {
        console.warn('Firebase sync failed:', err)
      }
    }, 2000)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [enabled, state])
}
