export type Screen = 'home' | 'contacts' | 'messages' | 'medications' | 'emergency' | 'settings'

export interface Contact {
  id: string
  name: string
  phone: string
  photo: string | null
  isEmergency: boolean
  order: number
}

export interface Medication {
  id: string
  name: string
  photo: string | null
  schedule: ('morning' | 'noon' | 'evening')[]
  takenToday: { morning: boolean; noon: boolean; evening: boolean }
  notes: string
  lastTakenDate: string | null
}

export interface ReminderSettings {
  morningTime: string
  noonTime: string
  eveningTime: string
  okReminderTime: string
}

export interface AppState {
  contacts: Contact[]
  medications: Medication[]
  userName: string
  reminders: ReminderSettings
  settingsUnlocked: boolean
  adminPin: string
}
