import { useState, useCallback } from 'react'

export interface GeoPosition {
  lat: number
  lon: number
  mapsUrl: string
}

export function useLocation() {
  const [position, setPosition] = useState<GeoPosition | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getLocation = useCallback((): Promise<GeoPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('GPS nicht verfügbar'))
        return
      }
      setLoading(true)
      setError(null)
      navigator.geolocation.getCurrentPosition(
        pos => {
          const { latitude: lat, longitude: lon } = pos.coords
          const mapsUrl = `https://maps.google.com/maps?q=${lat},${lon}`
          const p: GeoPosition = { lat, lon, mapsUrl }
          setPosition(p)
          setLoading(false)
          resolve(p)
        },
        err => {
          const msg = err.code === 1 ? 'GPS Zugriff verweigert' : 'Standort nicht ermittelbar'
          setError(msg)
          setLoading(false)
          reject(new Error(msg))
        },
        { timeout: 10000, enableHighAccuracy: true }
      )
    })
  }, [])

  return { position, loading, error, getLocation }
}
