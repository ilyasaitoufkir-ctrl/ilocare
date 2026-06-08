import React, { useState } from 'react'
import { Header } from '../components/Header'
import { useLocation } from '../hooks/useLocation'
import type { GeofenceSettings, SavedLocation } from '../types'

interface LocationScreenProps {
  geofence: GeofenceSettings
  lastKnownLocation: SavedLocation | null
  contacts: { phone: string }[]
  userName: string
  onGeofenceUpdate: (g: GeofenceSettings) => void
  onLocationSaved: (loc: SavedLocation) => void
  onBack: () => void
}

function MapEmbed({ lat, lon }: { lat: number; lon: number }) {
  const zoom = 15
  const url = `https://www.openstreetmap.org/export/embed.html?bbox=${lon - 0.01},${lat - 0.008},${lon + 0.01},${lat + 0.008}&layer=mapnik&marker=${lat},${lon}`
  return (
    <div className="rounded-3xl overflow-hidden" style={{ width: '100%', height: '280px', border: '3px solid #e8a0a0' }}>
      <iframe
        title="Standort"
        src={url}
        style={{ width: '100%', height: '100%', border: 'none' }}
        sandbox="allow-scripts allow-same-origin"
        loading="lazy"
      />
    </div>
  )
}

export function LocationScreen({
  geofence, lastKnownLocation, contacts, userName,
  onGeofenceUpdate, onLocationSaved, onBack
}: LocationScreenProps) {
  const { getLocation, loading } = useLocation()
  const [currentLoc, setCurrentLoc] = useState<SavedLocation | null>(lastKnownLocation)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  async function fetchAndShowLocation() {
    setError(null)
    try {
      const pos = await getLocation()
      // Reverse geocode
      let address = `${pos.lat.toFixed(4)}, ${pos.lon.toFixed(4)}`
      try {
        const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.lat}&lon=${pos.lon}&format=json`)
        const d = await r.json()
        const parts = [d.address?.road, d.address?.house_number, d.address?.suburb || d.address?.city_district, d.address?.city || d.address?.town].filter(Boolean)
        if (parts.length > 0) address = parts.join(', ')
      } catch { /* use coordinates */ }
      const loc: SavedLocation = {
        lat: pos.lat, lon: pos.lon, address,
        timestamp: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
      }
      setCurrentLoc(loc)
      onLocationSaved(loc)
    } catch (e) {
      setError('GPS nicht verfügbar. Bitte GPS erlauben.')
    }
  }

  function shareLocation() {
    if (!currentLoc) return
    const phones = contacts.filter(c => c.phone).map(c => c.phone).join(',')
    const msg = `📍 ${userName} ist gerade hier:\nhttps://maps.google.com/maps?q=${currentLoc.lat},${currentLoc.lon}\n${currentLoc.address}\n⏰ ${currentLoc.timestamp} Uhr`
    window.location.href = `sms:${phones}?body=${encodeURIComponent(msg)}`
  }

  function setHomeLocation() {
    if (!currentLoc) return
    onGeofenceUpdate({ ...geofence, homeLocation: currentLoc })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: '#fdf6f0' }}>
      <Header title="📍 Mein Standort" onBack={onBack} />

      <div className="flex flex-col gap-4 p-4" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)' }}>

        {/* GPS Button */}
        <button
          onClick={fetchAndShowLocation}
          disabled={loading}
          className="w-full flex flex-col items-center justify-center rounded-3xl active:scale-95 transition-transform"
          style={{ backgroundColor: loading ? '#f8e8e8' : '#e8a0a0', border: '3px solid #c87070', minHeight: '110px', padding: '20px' }}
        >
          <span style={{ fontSize: '3rem', lineHeight: 1 }}>{loading ? '⏳' : '📍'}</span>
          <span style={{ fontSize: '1.3rem', fontWeight: 900, color: '#fff', marginTop: '10px' }}>
            {loading ? 'GPS wird ermittelt...' : 'Standort aktualisieren'}
          </span>
        </button>

        {error && (
          <div className="rounded-2xl px-4 py-3" style={{ backgroundColor: '#fef2f2', border: '2px solid #fca5a5' }}>
            <p style={{ fontSize: '1rem', color: '#dc2626', margin: 0 }}>{error}</p>
          </div>
        )}

        {/* Aktueller Standort */}
        {currentLoc && (
          <>
            <div className="rounded-3xl p-4" style={{ backgroundColor: '#f0fdf4', border: '3px solid #86efac' }}>
              <p style={{ fontSize: '1rem', fontWeight: 700, color: '#166534', margin: '0 0 4px' }}>
                📍 Zuletzt gesehen: {currentLoc.timestamp} Uhr
              </p>
              <p style={{ fontSize: '1.1rem', fontWeight: 800, color: '#2d1a1a', margin: 0, lineHeight: 1.4 }}>
                {currentLoc.address}
              </p>
            </div>

            <MapEmbed lat={currentLoc.lat} lon={currentLoc.lon} />

            {/* Teilen Button */}
            <button
              onClick={shareLocation}
              className="w-full flex items-center justify-center gap-3 rounded-3xl active:scale-95 transition-transform"
              style={{ backgroundColor: '#dbeafe', border: '3px solid #93c5fd', minHeight: '90px' }}
            >
              <span style={{ fontSize: '2rem' }}>📤</span>
              <div className="flex flex-col items-start">
                <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1d4ed8' }}>Standort teilen</span>
                <span style={{ fontSize: '0.95rem', color: '#1e40af' }}>SMS mit Karten-Link an Familie</span>
              </div>
            </button>
          </>
        )}

        {/* Geofencing */}
        <div className="rounded-3xl p-5" style={{ backgroundColor: '#ffffff', border: '2px solid #e8d0d0' }}>
          <p style={{ fontSize: '1.2rem', fontWeight: 800, color: '#2d1a1a', margin: '0 0 12px' }}>
            🗺️ Sicherer Bereich
          </p>

          {/* Toggle */}
          <button
            onClick={() => onGeofenceUpdate({ ...geofence, enabled: !geofence.enabled })}
            className="w-full flex items-center justify-between rounded-2xl px-4 py-4 mb-3"
            style={{ backgroundColor: geofence.enabled ? '#dcfce7' : '#f8e8e8', border: `2px solid ${geofence.enabled ? '#86efac' : '#e8d0d0'}` }}
          >
            <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#2d1a1a' }}>
              {geofence.enabled ? '✅ Geofencing aktiv' : '⬜ Geofencing aus'}
            </span>
            <span style={{ fontSize: '1.4rem' }}>{geofence.enabled ? '🟢' : '⚪'}</span>
          </button>

          {/* Radius */}
          <div className="flex flex-col gap-2 mb-3">
            <p style={{ fontSize: '1rem', fontWeight: 700, color: '#6b4a4a', margin: 0 }}>
              📏 Sicherer Bereich: {geofence.radiusMeters}m Radius
            </p>
            <input
              type="range"
              min={100}
              max={2000}
              step={100}
              value={geofence.radiusMeters}
              onChange={e => onGeofenceUpdate({ ...geofence, radiusMeters: Number(e.target.value) })}
              style={{ width: '100%', height: '8px', accentColor: '#e8a0a0' }}
            />
            <div className="flex justify-between">
              <span style={{ fontSize: '0.9rem', color: '#6b4a4a' }}>100m</span>
              <span style={{ fontSize: '0.9rem', color: '#6b4a4a' }}>2km</span>
            </div>
          </div>

          {/* Home Location */}
          {geofence.homeLocation ? (
            <div className="rounded-2xl px-4 py-3 mb-3" style={{ backgroundColor: '#f0fdf4', border: '2px solid #86efac' }}>
              <p style={{ fontSize: '0.95rem', fontWeight: 700, color: '#166534', margin: 0 }}>
                🏠 Zuhause: {geofence.homeLocation.address}
              </p>
            </div>
          ) : (
            <p style={{ fontSize: '0.95rem', color: '#c87070', margin: '0 0 8px', fontWeight: 600 }}>
              ⚠️ Noch kein Zuhause festgelegt
            </p>
          )}

          <button
            onClick={setHomeLocation}
            disabled={!currentLoc}
            className="w-full rounded-2xl py-4"
            style={{
              backgroundColor: saved ? '#4ade80' : currentLoc ? '#e8a0a0' : '#e8d0d0',
              fontSize: '1rem', fontWeight: 700,
              color: saved ? '#14532d' : currentLoc ? '#fff' : '#999',
              minHeight: '60px',
            }}
          >
            {saved ? '✅ Zuhause gespeichert!' : currentLoc ? '🏠 Aktuellen Standort als Zuhause' : 'Zuerst Standort ermitteln'}
          </button>
        </div>

        <div className="rounded-2xl px-4 py-3" style={{ backgroundColor: '#fef3c7', border: '2px solid #fcd34d' }}>
          <p style={{ fontSize: '0.9rem', color: '#92400e', margin: 0, lineHeight: 1.5 }}>
            ℹ️ Standort-Tracking funktioniert wenn die App geöffnet ist. Bei Verlassen des Bereichs werden Kontakte per SMS informiert.
          </p>
        </div>
      </div>
    </div>
  )
}
