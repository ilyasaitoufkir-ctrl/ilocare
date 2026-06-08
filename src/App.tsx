import React, { useEffect } from 'react'
import { useStore } from './store/useStore'
import { HomeScreen } from './screens/HomeScreen'
import { ContactsScreen } from './screens/ContactsScreen'
import { MessagesScreen } from './screens/MessagesScreen'
import { MedicationsScreen } from './screens/MedicationsScreen'
import { EmergencyScreen } from './screens/EmergencyScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import type { Screen } from './types'
import { useState } from 'react'

export default function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [messageContactId, setMessageContactId] = useState<string | null>(null)

  const store = useStore()

  // Reset daily medications at midnight
  useEffect(() => {
    const lastReset = localStorage.getItem('ilocare_last_reset')
    const today = new Date().toDateString()
    if (lastReset !== today) {
      store.resetDailyMedications()
      localStorage.setItem('ilocare_last_reset', today)
    }
  }, [])

  // Web Push Notifications (requests permission)
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  // Schedule notifications based on reminder times
  useEffect(() => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return

    const { morningTime, noonTime, eveningTime, okReminderTime } = store.state.reminders

    function scheduleDaily(timeStr: string, message: string) {
      const [h, m] = timeStr.split(':').map(Number)
      const now = new Date()
      const target = new Date()
      target.setHours(h, m, 0, 0)
      if (target <= now) target.setDate(target.getDate() + 1)
      const delay = target.getTime() - now.getTime()
      return setTimeout(() => {
        new Notification('ilocare', { body: message, icon: '/icons/icon-192.png' })
      }, delay)
    }

    const timers = [
      scheduleDaily(morningTime, `☀️ Guten Morgen! Vergiss deine Medikamente nicht 💊`),
      scheduleDaily(noonTime, `💊 Zeit für deine Mittags-Medikamente!`),
      scheduleDaily(eveningTime, `🌙 Abend-Medikamente nicht vergessen!`),
      scheduleDaily(okReminderTime, `✅ Hast du heute deinen OK-Button gedrückt?`),
    ]

    return () => timers.forEach(clearTimeout)
  }, [store.state.reminders])

  function navigate(s: Screen, contactId?: string) {
    if (s === 'messages' && contactId) {
      setMessageContactId(contactId)
    } else {
      setMessageContactId(null)
    }
    setScreen(s)
  }

  if (screen === 'contacts') {
    return (
      <ContactsScreen
        contacts={store.state.contacts}
        onBack={() => setScreen('home')}
        onNavigate={navigate}
      />
    )
  }

  if (screen === 'messages') {
    return (
      <MessagesScreen
        contacts={store.state.contacts}
        initialContactId={messageContactId}
        onBack={() => setScreen('home')}
      />
    )
  }

  if (screen === 'medications') {
    return (
      <MedicationsScreen
        medications={store.state.medications}
        onTaken={store.markMedicationTaken}
        onBack={() => setScreen('home')}
      />
    )
  }

  if (screen === 'emergency') {
    return (
      <EmergencyScreen
        contacts={store.state.contacts}
        userName={store.state.userName}
        onBack={() => setScreen('home')}
      />
    )
  }

  if (screen === 'settings') {
    return (
      <SettingsScreen
        state={store.state}
        onBack={() => setScreen('home')}
        unlockSettings={store.unlockSettings}
        lockSettings={store.lockSettings}
        addContact={store.addContact}
        updateContact={store.updateContact}
        deleteContact={store.deleteContact}
        addMedication={store.addMedication}
        deleteMedication={store.deleteMedication}
        updateState={store.updateState}
      />
    )
  }

  return (
    <HomeScreen
      onNavigate={navigate}
      userName={store.state.userName}
    />
  )
}
