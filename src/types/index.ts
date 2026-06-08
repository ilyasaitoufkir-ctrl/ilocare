export type Screen = 'dashboard' | 'contacts' | 'messages' | 'medications' | 'emergency' | 'settings'

export interface Contact {
  id: string
  name: string
  phone: string
  photo: string | null
  isEmergency: boolean
  order: number
}

export interface MedicationDose {
  time: string       // "08:00"
  taken: boolean
}

export interface Medication {
  id: string
  name: string
  photo: string | null
  barcode: string | null
  frequency: 1 | 2 | 3
  doses: MedicationDose[]   // e.g. [{ time: "08:00", taken: false }, { time: "20:00", taken: false }]
  dosage: string            // e.g. "1 Tablette"
  notes: string
  lastResetDate: string | null
}

export interface ReminderSettings {
  okReminderTime: string
}

export interface AppState {
  contacts: Contact[]
  medications: Medication[]
  userName: string
  reminders: ReminderSettings
  weatherCity: string
  settingsUnlocked: boolean
  adminPin: string
}

export interface WeatherData {
  temp: number
  feels_like: number
  description: string
  icon: string
  city: string
}

export interface NewsItem {
  title: string
  link: string
  pubDate: string
  description: string
}
