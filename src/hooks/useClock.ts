import { useState, useEffect } from 'react'

const DAYS_DE = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag']
const MONTHS_DE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember']

export function useClock() {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const time = now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
  const seconds = now.getSeconds().toString().padStart(2, '0')
  const dayName = DAYS_DE[now.getDay()]
  const date = `${now.getDate()}. ${MONTHS_DE[now.getMonth()]} ${now.getFullYear()}`
  const hour = now.getHours()
  const greeting = hour < 5 ? 'Gute Nacht' : hour < 12 ? 'Guten Morgen' : hour < 17 ? 'Guten Tag' : hour < 22 ? 'Guten Abend' : 'Gute Nacht'

  return { now, time, seconds, dayName, date, hour, greeting }
}
