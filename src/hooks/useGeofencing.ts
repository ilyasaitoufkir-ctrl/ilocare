import { useState, useEffect, useCallback, useRef } from 'react'
import type { SavedLocation, GeofenceSettings } from '../types'

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000
  const φ1 = lat1 * Math.PI / 180
  const φ2 = lat2 * Math.PI / 180
  const Δφ = (lat2 - lat1) * Math.PI / 180
  const Δλ = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function useGeofencing(
  settings: GeofenceSettings,
  onExit: (loc: SavedLocation) => void,
  onLocationUpdate: (loc: SavedLocation) => void
) {
  const [outside, setOutside] = useState(false)
  const [currentLocation, setCurrentLocation] = useState<SavedLocation | null>(null)
  const watchIdRef = useRef<number | null>(null)
  const alertedRef = useRef(false)

  const reverseGeocode = useCallback(async (lat: number, lon: number): Promise<string> => {
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`)
      const d = await r.json()
      const parts = [d.address?.road, d.address?.house_number, d.address?.city || d.address?.town].filter(Boolean)
      return parts.join(' ') || `${lat.toFixed(4)}, ${lon.toFixed(4)}`
    } catch {
      return `${lat.toFixed(4)}, ${lon.toFixed(4)}`
    }
  }, [])

  useEffect(() => {
    if (!settings.enabled || !settings.homeLocation || !navigator.geolocation) return

    function onPosition(pos: GeolocationPosition) {
      const { latitude: lat, longitude: lon } = pos.coords
      const distance = haversineMeters(
        lat, lon,
        settings.homeLocation!.lat, settings.homeLocation!.lon
      )
      const isOutside = distance > settings.radiusMeters

      reverseGeocode(lat, lon).then(address => {
        const loc: SavedLocation = {
          lat, lon, address,
          timestamp: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
        }
        setCurrentLocation(loc)
        onLocationUpdate(loc)

        if (isOutside && !alertedRef.current) {
          alertedRef.current = true
          setOutside(true)
          onExit(loc)
        } else if (!isOutside) {
          alertedRef.current = false
          setOutside(false)
        }
      })
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      onPosition,
      () => { /* ignore errors */ },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    )

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
    }
  }, [settings, reverseGeocode, onExit, onLocationUpdate])

  return { outside, currentLocation }
}
