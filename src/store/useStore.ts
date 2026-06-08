import { useState, useEffect, useCallback } from 'react'
import type { AppState, Contact, Medication } from '../types'

const STORAGE_KEY = 'ilocare_data'

const defaultState: AppState = {
  contacts: [
    {
      id: '1',
      name: 'Familie',
      phone: '',
      photo: null,
      isEmergency: true,
      order: 0,
    },
  ],
  medications: [],
  userName: 'Ilyas',
  reminders: {
    morningTime: '08:00',
    noonTime: '12:00',
    eveningTime: '20:00',
    okReminderTime: '19:00',
  },
  settingsUnlocked: false,
  adminPin: '1234',
}

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultState
    const parsed = JSON.parse(raw)
    return { ...defaultState, ...parsed, settingsUnlocked: false }
  } catch {
    return defaultState
  }
}

function saveState(state: AppState) {
  try {
    const { settingsUnlocked: _, ...toSave } = state
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
  } catch { /* ignore */ }
}

export function useStore() {
  const [state, setState] = useState<AppState>(loadState)

  useEffect(() => {
    saveState(state)
  }, [state])

  const updateState = useCallback((updater: (s: AppState) => AppState) => {
    setState(prev => updater(prev))
  }, [])

  const addContact = useCallback((contact: Omit<Contact, 'id' | 'order'>) => {
    updateState(s => ({
      ...s,
      contacts: [
        ...s.contacts,
        { ...contact, id: Date.now().toString(), order: s.contacts.length },
      ].slice(0, 5),
    }))
  }, [updateState])

  const updateContact = useCallback((id: string, data: Partial<Contact>) => {
    updateState(s => ({
      ...s,
      contacts: s.contacts.map(c => c.id === id ? { ...c, ...data } : c),
    }))
  }, [updateState])

  const deleteContact = useCallback((id: string) => {
    updateState(s => ({ ...s, contacts: s.contacts.filter(c => c.id !== id) }))
  }, [updateState])

  const addMedication = useCallback((med: Omit<Medication, 'id' | 'takenToday' | 'lastTakenDate'>) => {
    updateState(s => ({
      ...s,
      medications: [
        ...s.medications,
        {
          ...med,
          id: Date.now().toString(),
          takenToday: { morning: false, noon: false, evening: false },
          lastTakenDate: null,
        },
      ],
    }))
  }, [updateState])

  const updateMedication = useCallback((id: string, data: Partial<Medication>) => {
    updateState(s => ({
      ...s,
      medications: s.medications.map(m => m.id === id ? { ...m, ...data } : m),
    }))
  }, [updateState])

  const deleteMedication = useCallback((id: string) => {
    updateState(s => ({ ...s, medications: s.medications.filter(m => m.id !== id) }))
  }, [updateState])

  const markMedicationTaken = useCallback((id: string, time: 'morning' | 'noon' | 'evening') => {
    const today = new Date().toDateString()
    updateState(s => ({
      ...s,
      medications: s.medications.map(m =>
        m.id === id
          ? {
              ...m,
              takenToday: { ...m.takenToday, [time]: true },
              lastTakenDate: today,
            }
          : m
      ),
    }))
  }, [updateState])

  const resetDailyMedications = useCallback(() => {
    updateState(s => ({
      ...s,
      medications: s.medications.map(m => ({
        ...m,
        takenToday: { morning: false, noon: false, evening: false },
      })),
    }))
  }, [updateState])

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
    addContact,
    updateContact,
    deleteContact,
    addMedication,
    updateMedication,
    deleteMedication,
    markMedicationTaken,
    resetDailyMedications,
    unlockSettings,
    lockSettings,
    updateState,
  }
}
