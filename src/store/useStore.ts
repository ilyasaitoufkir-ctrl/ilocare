import { useState, useEffect, useCallback } from 'react'
import type { AppState, Contact, Medication, MedicationDose } from '../types'

const STORAGE_KEY = 'ilocare_v2'

function defaultDoses(frequency: 1 | 2 | 3): MedicationDose[] {
  if (frequency === 1) return [{ time: '08:00', taken: false }]
  if (frequency === 2) return [{ time: '08:00', taken: false }, { time: '20:00', taken: false }]
  return [{ time: '08:00', taken: false }, { time: '14:00', taken: false }, { time: '20:00', taken: false }]
}

const defaultState: AppState = {
  contacts: [],
  medications: [],
  userName: 'Ilyas',
  reminders: { okReminderTime: '19:00' },
  weatherCity: 'Berlin',
  settingsUnlocked: false,
  adminPin: '1234',
}

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultState
    return { ...defaultState, ...JSON.parse(raw), settingsUnlocked: false }
  } catch {
    return defaultState
  }
}

function saveState(state: AppState) {
  try {
    const { settingsUnlocked: _s, ...toSave } = state
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
  } catch { /* ignore */ }
}

export function useStore() {
  const [state, setState] = useState<AppState>(loadState)

  useEffect(() => { saveState(state) }, [state])

  const updateState = useCallback((updater: (s: AppState) => AppState) => {
    setState(prev => updater(prev))
  }, [])

  // ── Contacts ──────────────────────────────────────────────────────────────
  const addContact = useCallback((contact: Omit<Contact, 'id' | 'order'>) => {
    updateState(s => ({
      ...s,
      contacts: [...s.contacts, { ...contact, id: Date.now().toString(), order: s.contacts.length }].slice(0, 5),
    }))
  }, [updateState])

  const updateContact = useCallback((id: string, data: Partial<Contact>) => {
    updateState(s => ({ ...s, contacts: s.contacts.map(c => c.id === id ? { ...c, ...data } : c) }))
  }, [updateState])

  const deleteContact = useCallback((id: string) => {
    updateState(s => ({ ...s, contacts: s.contacts.filter(c => c.id !== id) }))
  }, [updateState])

  // ── Medications ───────────────────────────────────────────────────────────
  const addMedication = useCallback((med: {
    name: string
    photo: string | null
    barcode: string | null
    frequency: 1 | 2 | 3
    doses: MedicationDose[]
    dosage: string
    notes: string
  }) => {
    updateState(s => ({
      ...s,
      medications: [...s.medications, {
        ...med,
        id: Date.now().toString(),
        lastResetDate: new Date().toDateString(),
      }],
    }))
  }, [updateState])

  const updateMedication = useCallback((id: string, data: Partial<Medication>) => {
    updateState(s => ({ ...s, medications: s.medications.map(m => m.id === id ? { ...m, ...data } : m) }))
  }, [updateState])

  const deleteMedication = useCallback((id: string) => {
    updateState(s => ({ ...s, medications: s.medications.filter(m => m.id !== id) }))
  }, [updateState])

  const markDoseTaken = useCallback((medId: string, doseIndex: number) => {
    updateState(s => ({
      ...s,
      medications: s.medications.map(m => {
        if (m.id !== medId) return m
        const doses = m.doses.map((d, i) => i === doseIndex ? { ...d, taken: true } : d)
        return { ...m, doses }
      }),
    }))
  }, [updateState])

  const resetDailyDoses = useCallback(() => {
    const today = new Date().toDateString()
    updateState(s => ({
      ...s,
      medications: s.medications.map(m => {
        if (m.lastResetDate === today) return m
        return {
          ...m,
          doses: m.doses.map(d => ({ ...d, taken: false })),
          lastResetDate: today,
        }
      }),
    }))
  }, [updateState])

  // ── Settings ──────────────────────────────────────────────────────────────
  const unlockSettings = useCallback((pin: string): boolean => {
    if (pin === state.adminPin) {
      setState(s => ({ ...s, settingsUnlocked: true }))
      return true
    }
    return false
  }, [state.adminPin])

  const lockSettings = useCallback(() => {
    setState(s => ({ ...s, settingsUnlocked: false }))
  }, [])

  return {
    state,
    updateState,
    addContact, updateContact, deleteContact,
    addMedication, updateMedication, deleteMedication, markDoseTaken, resetDailyDoses,
    unlockSettings, lockSettings,
    defaultDoses,
  }
}

export { defaultDoses }
