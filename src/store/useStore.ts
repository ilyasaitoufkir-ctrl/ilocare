import { useState, useEffect, useCallback } from 'react'
import type {
  AppState, Contact, Medication, MedicationDose,
  Doctor, ShoppingItem, SavedLocation, HealthRecord
} from '../types'

const STORAGE_KEY = 'ilocare_v3'

export function defaultDoses(frequency: 1 | 2 | 3): MedicationDose[] {
  if (frequency === 1) return [{ time: '08:00', taken: false }]
  if (frequency === 2) return [{ time: '08:00', taken: false }, { time: '20:00', taken: false }]
  return [{ time: '08:00', taken: false }, { time: '14:00', taken: false }, { time: '20:00', taken: false }]
}

const DEFAULT_DOCTORS: Doctor[] = [
  { id: 'd1', name: 'Notarzt', phone: '112', type: 'notarzt' },
  { id: 'd2', name: 'Notruf Polizei', phone: '110', type: 'notarzt' },
]

const defaultState: AppState = {
  contacts: [],
  medications: [],
  userName: 'Ilyas',
  reminders: {
    okReminderTime: '19:00',
    checkIn: { enabled: false, time: '09:00', alertDelayMinutes: 60 },
  },
  weatherCity: 'Berlin',
  settingsUnlocked: false,
  adminPin: '1234',
  insuranceCard: { front: null, back: null, ownerName: '', cardNumber: '' },
  doctors: DEFAULT_DOCTORS,
  shoppingList: [],
  geofence: { enabled: false, radiusMeters: 500, homeLocation: null },
  nightMode: { enabled: false, startTime: '22:00', endTime: '07:00' },
  lastKnownLocation: null,
  picnicEmail: '',
  picnicPassword: '',
  healthRecord: {
    bloodType: '', allergies: '', conditions: '', currentMedications: '',
    doctorName: '', doctorPhone: '', insuranceName: '', insuranceNumber: '',
    emergencyContact: '', notes: '',
  },
  largeText: false,
  familyCode: '0000',
  elevenLabsApiKey: '',
  elevenLabsVoiceId: '',
  voiceName: '',
}

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultState
    const parsed = JSON.parse(raw)
    // Deep merge to pick up new default fields
    return {
      ...defaultState,
      ...parsed,
      reminders: { ...defaultState.reminders, ...parsed.reminders },
      insuranceCard: { ...defaultState.insuranceCard, ...parsed.insuranceCard },
      geofence: { ...defaultState.geofence, ...parsed.geofence },
      nightMode: { ...defaultState.nightMode, ...parsed.nightMode },
      healthRecord: { ...defaultState.healthRecord, ...parsed.healthRecord },
      settingsUnlocked: false,
    }
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
    name: string; photo: string | null; barcode: string | null
    frequency: 1 | 2 | 3; doses: MedicationDose[]; dosage: string; notes: string
  }) => {
    updateState(s => ({
      ...s,
      medications: [...s.medications, { ...med, id: Date.now().toString(), lastResetDate: new Date().toDateString() }],
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
        return { ...m, doses: m.doses.map((d, i) => i === doseIndex ? { ...d, taken: true } : d) }
      }),
    }))
  }, [updateState])

  const resetDailyDoses = useCallback(() => {
    const today = new Date().toDateString()
    updateState(s => ({
      ...s,
      medications: s.medications.map(m => {
        if (m.lastResetDate === today) return m
        return { ...m, doses: m.doses.map(d => ({ ...d, taken: false })), lastResetDate: today }
      }),
    }))
  }, [updateState])

  // ── Doctors ───────────────────────────────────────────────────────────────
  const addDoctor = useCallback((doc: Omit<Doctor, 'id'>) => {
    updateState(s => ({ ...s, doctors: [...s.doctors, { ...doc, id: Date.now().toString() }] }))
  }, [updateState])

  const updateDoctor = useCallback((id: string, data: Partial<Doctor>) => {
    updateState(s => ({ ...s, doctors: s.doctors.map(d => d.id === id ? { ...d, ...data } : d) }))
  }, [updateState])

  const deleteDoctor = useCallback((id: string) => {
    updateState(s => ({ ...s, doctors: s.doctors.filter(d => d.id !== id) }))
  }, [updateState])

  // ── Shopping ──────────────────────────────────────────────────────────────
  const addShoppingItem = useCallback((text: string) => {
    updateState(s => ({
      ...s,
      shoppingList: [...s.shoppingList, { id: Date.now().toString(), text, done: false }],
    }))
  }, [updateState])

  const toggleShoppingItem = useCallback((id: string) => {
    updateState(s => ({
      ...s,
      shoppingList: s.shoppingList.map(item => item.id === id ? { ...item, done: !item.done } : item),
    }))
  }, [updateState])

  const deleteShoppingItem = useCallback((id: string) => {
    updateState(s => ({ ...s, shoppingList: s.shoppingList.filter(i => i.id !== id) }))
  }, [updateState])

  const clearDoneItems = useCallback(() => {
    updateState(s => ({ ...s, shoppingList: s.shoppingList.filter(i => !i.done) }))
  }, [updateState])

  // ── Location ──────────────────────────────────────────────────────────────
  const updateLastLocation = useCallback((loc: SavedLocation) => {
    updateState(s => ({ ...s, lastKnownLocation: loc }))
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
    state, updateState,
    addContact, updateContact, deleteContact,
    addMedication, updateMedication, deleteMedication, markDoseTaken, resetDailyDoses,
    addDoctor, updateDoctor, deleteDoctor,
    addShoppingItem, toggleShoppingItem, deleteShoppingItem, clearDoneItems,
    updateLastLocation,
    unlockSettings, lockSettings,
  }
}
