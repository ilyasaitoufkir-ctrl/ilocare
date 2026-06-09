import React, { useEffect, useState, useCallback } from 'react'
import { useStore } from './store/useStore'
import { useFallDetection } from './hooks/useFallDetection'
import { useGeofencing } from './hooks/useGeofencing'
import { useCheckIn } from './hooks/useCheckIn'
import { DashboardScreen } from './screens/DashboardScreen'
import { ContactsScreen } from './screens/ContactsScreen'
import { MessagesScreen } from './screens/MessagesScreen'
import { MedicationsScreen } from './screens/MedicationsScreen'
import { EmergencyScreen } from './screens/EmergencyScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import { InsuranceCardScreen } from './screens/InsuranceCardScreen'
import { ShoppingScreen } from './screens/ShoppingScreen'
import { DoctorsScreen } from './screens/DoctorsScreen'
import { LocationScreen } from './screens/LocationScreen'
import { NewsScreen } from './screens/NewsScreen'
import { RadioScreen } from './screens/RadioScreen'
import { EntertainmentScreen } from './screens/EntertainmentScreen'
import { IloScreen } from './screens/IloScreen'
import { HealthRecordScreen } from './screens/HealthRecordScreen'
import { FamilyScreen } from './screens/FamilyScreen'
import { VoiceSetupScreen } from './screens/VoiceSetupScreen'
import { FallAlert } from './components/FallAlert'
import { CheckInAlert } from './components/CheckInAlert'
import { NightModeAlert } from './components/NightModeAlert'
import type { Screen, SavedLocation } from './types'

function isNightTime(startTime: string, endTime: string): boolean {
  const now = new Date()
  const nowMins = now.getHours() * 60 + now.getMinutes()
  const [sh, sm] = startTime.split(':').map(Number)
  const [eh, em] = endTime.split(':').map(Number)
  const startMins = sh * 60 + sm
  const endMins = eh * 60 + em
  if (startMins > endMins) {
    return nowMins >= startMins || nowMins < endMins
  }
  return nowMins >= startMins && nowMins < endMins
}

function getCurrentTime() {
  return new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('dashboard')
  const [msgContactId, setMsgContactId] = useState<string | null>(null)
  const [nightAlertShown, setNightAlertShown] = useState(false)
  const [fallDetectionEnabled, setFallDetectionEnabled] = useState(false)
  const store = useStore()

  // ── Large text zoom ───────────────────────────────────────────────────────
  useEffect(() => {
    const root = document.getElementById('root')
    if (root) (root.style as CSSStyleDeclaration & { zoom: string }).zoom = store.state.largeText ? '1.2' : '1'
  }, [store.state.largeText])

  // ── Daily medication reset ────────────────────────────────────────────────
  useEffect(() => {
    store.resetDailyDoses()
    const id = setInterval(() => store.resetDailyDoses(), 60 * 1000)
    return () => clearInterval(id)
  }, [])

  // ── Notification permission ────────────────────────────────────────────────
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  // ── Medication & OK push notifications ────────────────────────────────────
  useEffect(() => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return
    const timers: ReturnType<typeof setTimeout>[] = []
    function scheduleAt(t: string, title: string, body: string) {
      const [h, m] = t.split(':').map(Number)
      const now = new Date(); const target = new Date()
      target.setHours(h, m, 0, 0)
      if (target <= now) target.setDate(target.getDate() + 1)
      timers.push(setTimeout(() => new Notification(title, { body, icon: '/icons/icon-192.png' }), target.getTime() - now.getTime()))
    }
    scheduleAt(store.state.reminders.okReminderTime, 'ilocare', '✅ Hast du heute deinen OK-Button gedrückt?')
    if (store.state.reminders.checkIn.enabled) {
      scheduleAt(store.state.reminders.checkIn.time, 'ilocare 👋', `Guten Morgen, ${store.state.userName}! Bitte Check-in bestätigen.`)
    }
    for (const med of store.state.medications) {
      for (const dose of med.doses) {
        if (!dose.taken) scheduleAt(dose.time, '💊 Medikament', `Zeit für ${med.name} – ${med.dosage}`)
      }
    }
    return () => timers.forEach(clearTimeout)
  }, [store.state.medications, store.state.reminders, store.state.userName])

  // ── Night Mode alert ──────────────────────────────────────────────────────
  const [showNightAlert, setShowNightAlert] = useState(false)
  useEffect(() => {
    if (!store.state.nightMode.enabled || nightAlertShown) return
    const check = () => {
      if (isNightTime(store.state.nightMode.startTime, store.state.nightMode.endTime)) {
        setShowNightAlert(true)
        setNightAlertShown(true)
      }
    }
    check()
    const id = setInterval(check, 5 * 60 * 1000)
    return () => clearInterval(id)
  }, [store.state.nightMode, nightAlertShown])

  // Reset night alert flag at dawn
  useEffect(() => {
    const id = setInterval(() => {
      if (!isNightTime(store.state.nightMode.startTime, store.state.nightMode.endTime)) {
        setNightAlertShown(false)
      }
    }, 60 * 1000)
    return () => clearInterval(id)
  }, [store.state.nightMode])

  // ── Fall Detection ────────────────────────────────────────────────────────
  const handleFallSOS = useCallback(() => {
    const phones = store.state.contacts.map(c => c.phone).filter(Boolean).join(',')
    if (!phones) return
    const loc = store.state.lastKnownLocation
    const locationPart = loc
      ? `\n📍 Standort: https://maps.google.com/maps?q=${loc.lat},${loc.lon}`
      : ''
    const msg = `🚨 STURZ ERKANNT! ${store.state.userName} könnte gestürzt sein! Bitte sofort melden! ⏰ ${getCurrentTime()} Uhr${locationPart}`
    window.location.href = `sms:${phones}?body=${encodeURIComponent(msg)}`
  }, [store.state.contacts, store.state.userName, store.state.lastKnownLocation])

  const { fallState, dismiss: dismissFall } = useFallDetection(fallDetectionEnabled, handleFallSOS)

  // ── Geofencing ────────────────────────────────────────────────────────────
  const handleGeofenceExit = useCallback((loc: SavedLocation) => {
    const phones = store.state.contacts.map(c => c.phone).filter(Boolean).join(',')
    if (!phones) return
    const msg = `📍 ${store.state.userName} hat den sicheren Bereich verlassen!\nStandort: https://maps.google.com/maps?q=${loc.lat},${loc.lon}\n${loc.address}\n⏰ ${loc.timestamp} Uhr`
    window.location.href = `sms:${phones}?body=${encodeURIComponent(msg)}`
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('⚠️ Bereich verlassen', { body: `${store.state.userName} hat den sicheren Bereich verlassen!`, icon: '/icons/icon-192.png' })
    }
  }, [store.state.contacts, store.state.userName])

  useGeofencing(
    store.state.geofence,
    handleGeofenceExit,
    (loc) => store.updateLastLocation(loc)
  )

  // ── Check-in ──────────────────────────────────────────────────────────────
  const { showAlert: showCheckInAlert, doCheckIn, checkedToday, lastCheckInTime } = useCheckIn(
    store.state.reminders.checkIn,
    store.state.contacts,
    store.state.userName
  )

  // ── OK Button handler ─────────────────────────────────────────────────────
  function handleOkSend() {
    const phones = store.state.contacts.map(c => c.phone).filter(Boolean).join(',')
    const msg = `✅ ${store.state.userName} geht es gut – ${getCurrentTime()} Uhr`
    if (phones) window.location.href = `sms:${phones}?body=${encodeURIComponent(msg)}`
    localStorage.setItem('ilocare_last_ok', getCurrentTime())
  }

  function navigate(s: Screen, contactId?: string) {
    setMsgContactId(contactId ?? null)
    setScreen(s)
  }

  // ── Overlays (fall, check-in, night) ─────────────────────────────────────
  const overlays = (
    <>
      {fallState === 'detected' && <FallAlert onDismiss={dismissFall} onSOS={handleFallSOS} countdownSeconds={30} />}
      {showCheckInAlert && <CheckInAlert userName={store.state.userName} onCheckIn={doCheckIn} onDismiss={() => {}} />}
      {showNightAlert && <NightModeAlert time={getCurrentTime()} contacts={store.state.contacts} userName={store.state.userName} onDismiss={() => setShowNightAlert(false)} />}
    </>
  )

  // ── Screens ───────────────────────────────────────────────────────────────
  if (screen === 'contacts') return <>{overlays}<ContactsScreen contacts={store.state.contacts} onBack={() => setScreen('dashboard')} /></>
  if (screen === 'messages') return <>{overlays}<MessagesScreen contacts={store.state.contacts} initialContactId={msgContactId} onBack={() => setScreen('dashboard')} /></>
  if (screen === 'medications') return <>{overlays}<MedicationsScreen medications={store.state.medications} onTaken={store.markDoseTaken} onBack={() => setScreen('dashboard')} /></>

  if (screen === 'emergency') return (
    <>{overlays}<EmergencyScreen contacts={store.state.contacts} userName={store.state.userName} onBack={() => setScreen('dashboard')} /></>
  )

  if (screen === 'settings') return (
    <>{overlays}<SettingsScreen
      state={store.state}
      onBack={() => setScreen('dashboard')}
      unlockSettings={store.unlockSettings}
      lockSettings={store.lockSettings}
      addContact={store.addContact}
      deleteContact={store.deleteContact}
      addMedication={store.addMedication}
      deleteMedication={store.deleteMedication}
      addDoctor={store.addDoctor}
      updateDoctor={store.updateDoctor}
      deleteDoctor={store.deleteDoctor}
      updateState={store.updateState}
      onNavigateVoiceSetup={() => setScreen('voice-setup')}
    /></>
  )

  if (screen === 'insurance') return (
    <>{overlays}<InsuranceCardScreen
      card={store.state.insuranceCard}
      onSave={card => store.updateState(s => ({ ...s, insuranceCard: card }))}
      onBack={() => setScreen('dashboard')}
    /></>
  )

  if (screen === 'shopping') return (
    <>{overlays}<ShoppingScreen
      items={store.state.shoppingList}
      picnicEmail={store.state.picnicEmail}
      picnicPassword={store.state.picnicPassword}
      onAdd={store.addShoppingItem}
      onToggle={store.toggleShoppingItem}
      onDelete={store.deleteShoppingItem}
      onClearDone={store.clearDoneItems}
      onBack={() => setScreen('dashboard')}
    /></>
  )

  if (screen === 'doctors') return <>{overlays}<DoctorsScreen doctors={store.state.doctors} onBack={() => setScreen('dashboard')} /></>

  if (screen === 'news') return <>{overlays}<NewsScreen onBack={() => setScreen('dashboard')} /></>

  if (screen === 'radio') return <>{overlays}<RadioScreen onBack={() => setScreen('dashboard')} /></>

  if (screen === 'entertainment') return (
    <>{overlays}<EntertainmentScreen onNavigate={navigate} onBack={() => setScreen('dashboard')} /></>
  )

  if (screen === 'ilo') return (
    <>{overlays}<IloScreen
      contacts={store.state.contacts}
      userName={store.state.userName}
      elevenLabsApiKey={store.state.elevenLabsApiKey}
      elevenLabsVoiceId={store.state.elevenLabsVoiceId}
      voiceName={store.state.voiceName}
      onNavigate={navigate}
      onBack={() => setScreen('dashboard')}
      onSOS={() => { handleOkSend(); setScreen('emergency') }}
    /></>
  )

  if (screen === 'health-record') return (
    <>{overlays}<HealthRecordScreen
      record={store.state.healthRecord}
      userName={store.state.userName}
      onSave={r => store.updateState(s => ({ ...s, healthRecord: r }))}
      onBack={() => setScreen('dashboard')}
    /></>
  )

  if (screen === 'family') return (
    <>{overlays}<FamilyScreen state={store.state} onBack={() => setScreen('dashboard')} /></>
  )

  if (screen === 'voice-setup') return (
    <>{overlays}<VoiceSetupScreen
      apiKey={store.state.elevenLabsApiKey}
      voiceId={store.state.elevenLabsVoiceId}
      voiceName={store.state.voiceName}
      onSave={(apiKey, voiceId, name) => store.updateState(s => ({ ...s, elevenLabsApiKey: apiKey, elevenLabsVoiceId: voiceId, voiceName: name }))}
      onBack={() => setScreen('settings')}
    /></>
  )

  if (screen === 'location') return (
    <>{overlays}<LocationScreen
      geofence={store.state.geofence}
      lastKnownLocation={store.state.lastKnownLocation}
      contacts={store.state.contacts}
      userName={store.state.userName}
      onGeofenceUpdate={g => store.updateState(s => ({ ...s, geofence: g }))}
      onLocationSaved={store.updateLastLocation}
      onBack={() => setScreen('dashboard')}
    /></>
  )

  return (
    <>
      {overlays}
      <DashboardScreen
        userName={store.state.userName}
        weatherCity={store.state.weatherCity}
        medications={store.state.medications}
        contacts={store.state.contacts}
        checkedInToday={checkedToday}
        lastCheckInTime={lastCheckInTime}
        onNavigate={navigate}
        onOkSend={handleOkSend}
      />
      {/* Fall Detection Toggle (kleiner Button oben rechts) */}
      <button
        onClick={() => setFallDetectionEnabled(f => !f)}
        className="fixed z-40 flex items-center justify-center rounded-full"
        style={{
          bottom: 'calc(env(safe-area-inset-bottom) + 16px)',
          right: '16px',
          width: '56px',
          height: '56px',
          backgroundColor: fallDetectionEnabled ? '#ef4444' : '#f8e8e8',
          border: `3px solid ${fallDetectionEnabled ? '#991b1b' : '#e8a0a0'}`,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}
        title={fallDetectionEnabled ? 'Sturzerkennung aus' : 'Sturzerkennung an'}
      >
        <span style={{ fontSize: '1.5rem' }}>{fallDetectionEnabled ? '🛡️' : '📱'}</span>
      </button>
    </>
  )
}
