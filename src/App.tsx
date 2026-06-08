import React, { useEffect } from 'react'
import { useState } from 'react'
import { useStore } from './store/useStore'
import { DashboardScreen } from './screens/DashboardScreen'
import { ContactsScreen } from './screens/ContactsScreen'
import { MessagesScreen } from './screens/MessagesScreen'
import { MedicationsScreen } from './screens/MedicationsScreen'
import { EmergencyScreen } from './screens/EmergencyScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import type { Screen } from './types'

export default function App() {
  const [screen, setScreen] = useState<Screen>('dashboard')
  const [msgContactId, setMsgContactId] = useState<string | null>(null)
  const store = useStore()

  // Reset medication doses at midnight
  useEffect(() => {
    store.resetDailyDoses()
    const id = setInterval(() => store.resetDailyDoses(), 60 * 1000)
    return () => clearInterval(id)
  }, [])

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  // Schedule medication + OK reminders
  useEffect(() => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return

    const timers: ReturnType<typeof setTimeout>[] = []

    function scheduleAt(timeStr: string, title: string, body: string) {
      const [h, m] = timeStr.split(':').map(Number)
      const now = new Date()
      const target = new Date()
      target.setHours(h, m, 0, 0)
      if (target <= now) target.setDate(target.getDate() + 1)
      const delay = target.getTime() - now.getTime()
      timers.push(setTimeout(() => {
        new Notification(title, { body, icon: '/icons/icon-192.png', badge: '/icons/icon-192.png' })
      }, delay))
    }

    // OK reminder
    scheduleAt(store.state.reminders.okReminderTime, 'ilocare', '✅ Hast du heute deinen OK-Button gedrückt?')

    // Medication reminders
    for (const med of store.state.medications) {
      for (const dose of med.doses) {
        if (!dose.taken) {
          scheduleAt(dose.time, `💊 Medikament`, `Zeit für ${med.name} – ${med.dosage}`)
        }
      }
    }

    return () => timers.forEach(clearTimeout)
  }, [store.state.medications, store.state.reminders])

  function navigate(s: Screen, contactId?: string) {
    setMsgContactId(contactId ?? null)
    setScreen(s)
  }

  if (screen === 'contacts') {
    return <ContactsScreen contacts={store.state.contacts} onBack={() => setScreen('dashboard')} />
  }

  if (screen === 'messages') {
    return (
      <MessagesScreen
        contacts={store.state.contacts}
        initialContactId={msgContactId}
        onBack={() => setScreen('dashboard')}
      />
    )
  }

  if (screen === 'medications') {
    return (
      <MedicationsScreen
        medications={store.state.medications}
        onTaken={store.markDoseTaken}
        onBack={() => setScreen('dashboard')}
      />
    )
  }

  if (screen === 'emergency') {
    return (
      <EmergencyScreen
        contacts={store.state.contacts}
        userName={store.state.userName}
        onBack={() => setScreen('dashboard')}
      />
    )
  }

  if (screen === 'settings') {
    return (
      <SettingsScreen
        state={store.state}
        onBack={() => setScreen('dashboard')}
        unlockSettings={store.unlockSettings}
        lockSettings={store.lockSettings}
        addContact={store.addContact}
        deleteContact={store.deleteContact}
        addMedication={store.addMedication}
        deleteMedication={store.deleteMedication}
        updateState={store.updateState}
      />
    )
  }

  return (
    <DashboardScreen
      userName={store.state.userName}
      weatherCity={store.state.weatherCity}
      medications={store.state.medications}
      contacts={store.state.contacts}
      onNavigate={navigate}
    />
  )
}
