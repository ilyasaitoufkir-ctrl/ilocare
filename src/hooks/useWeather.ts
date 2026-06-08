import { useState, useEffect } from 'react'
import type { WeatherData } from '../types'

const WEATHER_ICONS: Record<string, string> = {
  '113': '☀️', '116': '⛅', '119': '☁️', '122': '☁️',
  '143': '🌫️', '176': '🌦️', '179': '🌨️', '182': '🌧️',
  '185': '🌧️', '200': '⛈️', '227': '❄️', '230': '❄️',
  '248': '🌫️', '260': '🌫️', '263': '🌦️', '266': '🌧️',
  '281': '🌧️', '284': '🌧️', '293': '🌧️', '296': '🌧️',
  '299': '🌧️', '302': '🌧️', '305': '🌧️', '308': '🌧️',
  '311': '🌧️', '314': '🌧️', '317': '🌨️', '320': '🌨️',
  '323': '❄️', '326': '❄️', '329': '❄️', '332': '❄️',
  '335': '❄️', '338': '❄️', '350': '🌧️', '353': '🌦️',
  '356': '🌧️', '359': '🌧️', '362': '🌨️', '365': '🌨️',
  '368': '❄️', '371': '❄️', '374': '🌧️', '377': '🌧️',
  '386': '⛈️', '389': '⛈️', '392': '⛈️', '395': '❄️',
}

const WEATHER_DESC: Record<string, string> = {
  '113': 'Sonnig', '116': 'Leicht bewölkt', '119': 'Bewölkt', '122': 'Stark bewölkt',
  '143': 'Nebel', '176': 'Leichter Regen', '200': 'Gewitter', '227': 'Schneefall',
  '266': 'Leichter Regen', '293': 'Regen', '299': 'Starker Regen', '302': 'Starker Regen',
  '305': 'Starker Regen', '308': 'Sehr starker Regen', '353': 'Leichter Regen',
  '356': 'Regen', '359': 'Starker Regen', '386': 'Gewitter', '389': 'Starkes Gewitter',
  '395': 'Schnee', '371': 'Starker Schnee',
}

export function useWeather(city: string) {
  const [data, setData] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!city.trim()) return
    const cacheKey = `weather_${city}`
    const cached = sessionStorage.getItem(cacheKey)
    if (cached) {
      try {
        const parsed = JSON.parse(cached)
        if (Date.now() - parsed.ts < 30 * 60 * 1000) {
          setData(parsed.data)
          setLoading(false)
          return
        }
      } catch { /* ignore */ }
    }

    setLoading(true)
    setError(null)
    fetch(`https://wttr.in/${encodeURIComponent(city)}?format=j1`)
      .then(r => {
        if (!r.ok) throw new Error('fetch failed')
        return r.json()
      })
      .then(json => {
        const current = json.current_condition?.[0]
        if (!current) throw new Error('no data')
        const code = current.weatherCode
        const w: WeatherData = {
          temp: Math.round(parseFloat(current.temp_C)),
          feels_like: Math.round(parseFloat(current.FeelsLikeC)),
          description: WEATHER_DESC[code] ?? current.weatherDesc?.[0]?.value ?? 'Unbekannt',
          icon: WEATHER_ICONS[code] ?? '🌡️',
          city: json.nearest_area?.[0]?.areaName?.[0]?.value ?? city,
        }
        setData(w)
        sessionStorage.setItem(cacheKey, JSON.stringify({ data: w, ts: Date.now() }))
      })
      .catch(() => setError('Wetter nicht verfügbar'))
      .finally(() => setLoading(false))
  }, [city])

  return { data, loading, error }
}
