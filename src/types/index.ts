export type Screen =
  | 'dashboard'
  | 'contacts'
  | 'messages'
  | 'medications'
  | 'emergency'
  | 'settings'
  | 'insurance'
  | 'shopping'
  | 'doctors'
  | 'location'
  | 'news'
  | 'radio'
  | 'entertainment'
  | 'ilo'
  | 'health-record'
  | 'family'
  | 'voice-setup'

// ── Contacts ────────────────────────────────────────────────────────────────
export interface Contact {
  id: string
  name: string
  phone: string
  photo: string | null
  isEmergency: boolean
  order: number
}

// ── Medications ──────────────────────────────────────────────────────────────
export interface MedicationDose {
  time: string
  taken: boolean
}

export interface Medication {
  id: string
  name: string
  photo: string | null
  barcode: string | null
  frequency: 1 | 2 | 3
  doses: MedicationDose[]
  dosage: string
  notes: string
  lastResetDate: string | null
}

// ── Insurance Card ───────────────────────────────────────────────────────────
export interface InsuranceCard {
  front: string | null
  back: string | null
  ownerName: string
  cardNumber: string
}

// ── Doctors ──────────────────────────────────────────────────────────────────
export type DoctorType = 'hausarzt' | 'apotheke' | 'notarzt' | 'other'

export interface Doctor {
  id: string
  name: string
  phone: string
  type: DoctorType
}

// ── Shopping List ────────────────────────────────────────────────────────────
export interface ShoppingItem {
  id: string
  text: string
  done: boolean
}

// ── Check-In ─────────────────────────────────────────────────────────────────
export interface CheckInSettings {
  enabled: boolean
  time: string              // "08:00"
  alertDelayMinutes: number // minutes before SMS after missed check-in
}

// ── Location / Geofencing ────────────────────────────────────────────────────
export interface SavedLocation {
  lat: number
  lon: number
  address: string
  timestamp: string
}

export interface GeofenceSettings {
  enabled: boolean
  radiusMeters: number
  homeLocation: SavedLocation | null
}

// ── Night Mode ───────────────────────────────────────────────────────────────
export interface NightModeSettings {
  enabled: boolean
  startTime: string   // "22:00"
  endTime: string     // "07:00"
}

// ── Reminders ────────────────────────────────────────────────────────────────
export interface ReminderSettings {
  okReminderTime: string
  checkIn: CheckInSettings
}

// ── Health Record ────────────────────────────────────────────────────────────
export interface HealthRecord {
  bloodType: string
  allergies: string
  conditions: string
  currentMedications: string
  doctorName: string
  doctorPhone: string
  insuranceName: string
  insuranceNumber: string
  emergencyContact: string
  notes: string
}

// ── App State ─────────────────────────────────────────────────────────────────
export interface AppState {
  contacts: Contact[]
  medications: Medication[]
  userName: string
  reminders: ReminderSettings
  weatherCity: string
  settingsUnlocked: boolean
  adminPin: string
  insuranceCard: InsuranceCard
  doctors: Doctor[]
  shoppingList: ShoppingItem[]
  geofence: GeofenceSettings
  nightMode: NightModeSettings
  lastKnownLocation: SavedLocation | null
  picnicEmail: string
  picnicPassword: string
  healthRecord: HealthRecord
  largeText: boolean
  familyCode: string
  elevenLabsApiKey: string
  elevenLabsVoiceId: string
  voiceName: string
}

// ── API response types ───────────────────────────────────────────────────────
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
