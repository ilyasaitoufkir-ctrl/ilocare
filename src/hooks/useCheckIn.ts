import { useState, useEffect, useCallback, useRef } from 'react'
import type { CheckInSettings } from '../types'

const LAST_CHECKIN_KEY = 'ilocare_last_checkin'

export function useCheckIn(settings: CheckInSettings, contacts: { phone: string }[], userName: string) {
  const [showAlert, setShowAlert] = useState(false)
  const [missedToday, setMissedToday] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const smsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const getLastCheckIn = () => {
    const raw = localStorage.getItem(LAST_CHECKIN_KEY)
    return raw ? JSON.parse(raw) : null
  }

  const doCheckIn = useCallback(() => {
    const now = { date: new Date().toDateString(), time: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) }
    localStorage.setItem(LAST_CHECKIN_KEY, JSON.stringify(now))
    setShowAlert(false)
    setMissedToday(false)
    if (smsTimerRef.current) clearTimeout(smsTimerRef.current)
  }, [])

  const sendMissedSMS = useCallback(() => {
    const phones = contacts.filter(c => c.phone).map(c => c.phone).join(',')
    if (!phones) return
    const msg = `⚠️ ${userName} hat heute noch nicht eingecheckt. Bitte melden!`
    window.location.href = `sms:${phones}?body=${encodeURIComponent(msg)}`
    setMissedToday(true)
    setShowAlert(false)
  }, [contacts, userName])

  useEffect(() => {
    if (!settings.enabled) return

    function checkTime() {
      const [h, m] = settings.time.split(':').map(Number)
      const now = new Date()
      const isCheckInTime = now.getHours() === h && now.getMinutes() === m
      const last = getLastCheckIn()
      const checkedToday = last?.date === new Date().toDateString()

      if (isCheckInTime && !checkedToday) {
        setShowAlert(true)
        // Start SMS countdown
        if (smsTimerRef.current) clearTimeout(smsTimerRef.current)
        smsTimerRef.current = setTimeout(() => {
          sendMissedSMS()
        }, settings.alertDelayMinutes * 60 * 1000)
      }
    }

    checkTime()
    const id = setInterval(checkTime, 60 * 1000)
    timerRef.current = id

    return () => {
      clearInterval(id)
      if (smsTimerRef.current) clearTimeout(smsTimerRef.current)
    }
  }, [settings, sendMissedSMS])

  const last = getLastCheckIn()
  const checkedToday = last?.date === new Date().toDateString()

  return { showAlert, missedToday, doCheckIn, sendMissedSMS, checkedToday, lastCheckInTime: last?.time }
}
