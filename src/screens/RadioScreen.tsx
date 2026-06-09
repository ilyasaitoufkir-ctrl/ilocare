import React, { useState, useRef, useEffect } from 'react'
import { Volume2 } from 'lucide-react'
import { Header } from '../components/Header'

interface RadioScreenProps {
  onBack: () => void
}

const STATIONS = [
  { name: 'Antenne Bayern',     emoji: '🎵', url: 'https://stream.antenne.de/antenne/stream/mp3',                                                                          genre: 'Pop & Hits'   },
  { name: 'NDR 2',              emoji: '🎵', url: 'https://ndr-ndr2-live.cast.addradio.de/ndr/ndr2/live/mp3/128/stream.mp3',                                               genre: 'Pop & Hits'   },
  { name: 'SWR3',               emoji: '🎵', url: 'https://liveradio.swr.de/sw282p3/swr3/play.mp3',                                                                        genre: 'Rock & Pop'   },
  { name: 'WDR 2',              emoji: '🎵', url: 'https://wdr-wdr2-live.icecastssl.wdr.de/wdr/wdr2/live/mp3/128/stream.mp3',                                              genre: 'Pop & Hits'   },
  { name: 'Radio Hamburg',      emoji: '🎵', url: 'https://stream.radiohamburg.de/rhh-live/mp3-128/stream.mp3',                                                             genre: 'Pop & Hits'   },
  { name: 'N-JOY',              emoji: '🎵', url: 'https://ndr-njoy-live.cast.addradio.de/ndr/njoy/live/mp3/128/stream.mp3',                                               genre: 'Jugend & Pop' },
  { name: 'Radio Niedersachsen',emoji: '🎵', url: 'https://ndr-ndr1niedersachsen-hannover.cast.addradio.de/ndr/ndr1niedersachsen/hannover/mp3/128/stream.mp3',             genre: 'Regional'     },
  { name: 'Deutschlandfunk',    emoji: '📻', url: 'https://st01.sslstream.dlf.de/dlf/01/128/mp3/stream.mp3',                                                               genre: 'Nachrichten'  },
]

export function RadioScreen({ onBack }: RadioScreenProps) {
  const [activeStation, setActiveStation] = useState<typeof STATIONS[0] | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(0.8)
  const [error, setError] = useState<string | null>(null)
  const [customName, setCustomName] = useState('')
  const [customUrl, setCustomUrl] = useState('')
  const [showCustom, setShowCustom] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    return () => {
      audioRef.current?.pause()
    }
  }, [])

  function play(station: typeof STATIONS[0]) {
    setError(null)
    if (audioRef.current) {
      audioRef.current.pause()
    }
    const audio = new Audio(station.url)
    audio.volume = volume
    audio.onerror = () => {
      setIsPlaying(false)
      const idx = STATIONS.findIndex(s => s.name === station.name)
      const next = STATIONS[(idx + 1) % STATIONS.length]
      setError(`⚠️ ${station.name} nicht verfügbar → versuche ${next.name}`)
    }
    audio.onplay = () => { setIsPlaying(true); setError(null) }
    audio.onpause = () => setIsPlaying(false)
    audioRef.current = audio
    audio.play().catch(() => {
      setIsPlaying(false)
      const idx = STATIONS.findIndex(s => s.name === station.name)
      const next = STATIONS[(idx + 1) % STATIONS.length]
      setError(`⚠️ ${station.name} nicht verfügbar → versuche ${next.name}`)
    })
    setActiveStation(station)
    setIsPlaying(true)
  }

  function togglePlayPause() {
    if (!audioRef.current || !activeStation) return
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play().catch(() => {})
      setIsPlaying(true)
    }
  }

  function handleVolume(v: number) {
    setVolume(v)
    if (audioRef.current) audioRef.current.volume = v
  }

  function playCustom() {
    if (!customUrl.trim()) return
    play({ name: customName || 'Eigener Sender', emoji: '📻', url: customUrl.trim(), genre: 'Eigener Sender' })
    setShowCustom(false)
  }

  return (
    <div className="screen">
      <Header title="📻 Radio" onBack={() => { audioRef.current?.pause(); onBack() }} />

      <div className="scroll-zone" style={{ padding: '14px 16px', paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)', display: 'flex', flexDirection: 'column', gap: '14px' }}>

        {/* ── Jetzt läuft ──────────────────────────────────────────────────── */}
        <div style={{
          borderRadius: '24px', padding: '20px',
          background: 'linear-gradient(135deg, #1a7a6e, #2a9d8f, #3db88a)',
          boxShadow: '0 8px 28px rgba(42,157,143,0.4)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px',
        }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'rgba(255,255,255,0.75)', margin: '0 0 4px', letterSpacing: '2px', textTransform: 'uppercase' }}>
              {isPlaying ? '🔴 Live' : '⏸ Pausiert'}
            </p>
            <p style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fff', margin: 0 }}>
              {activeStation ? `${activeStation.emoji} ${activeStation.name}` : '📻 Sender wählen'}
            </p>
            {activeStation && (
              <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.75)', margin: '2px 0 0', fontWeight: 600 }}>
                {activeStation.genre}
              </p>
            )}
          </div>

          {/* Play/Pause */}
          <button
            onClick={togglePlayPause}
            disabled={!activeStation}
            style={{
              width: '100px', height: '100px', borderRadius: '50%',
              background: isPlaying
                ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                : 'linear-gradient(135deg, #52d68a, #16a34a)',
              border: '4px solid rgba(255,255,255,0.5)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
              fontSize: '2.8rem', lineHeight: 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: activeStation ? 1 : 0.4,
            }}
          >
            {isPlaying ? '⏸' : '▶️'}
          </button>

          {/* Lautstärke */}
          <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Volume2 size={22} color="rgba(255,255,255,0.8)" />
            <input
              type="range" min={0} max={1} step={0.05}
              value={volume}
              onChange={e => handleVolume(Number(e.target.value))}
              style={{ flex: 1, accentColor: '#52d68a', height: '6px' }}
            />
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'rgba(255,255,255,0.85)', minWidth: '36px' }}>
              {Math.round(volume * 100)}%
            </span>
          </div>
        </div>

        {/* ── Fehler ──────────────────────────────────────────────────────── */}
        {error && (
          <div style={{ borderRadius: '14px', padding: '12px 16px', backgroundColor: '#fef2f2', border: '2px solid #fca5a5' }}>
            <p style={{ fontSize: '0.95rem', fontWeight: 700, color: '#dc2626', margin: 0 }}>⚠️ {error}</p>
          </div>
        )}

        {/* ── Sender-Liste ─────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <p style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0d2b27', margin: 0 }}>🎵 Sender wählen</p>
          {STATIONS.map(station => {
            const isActive = activeStation?.name === station.name
            return (
              <button
                key={station.name}
                onClick={() => play(station)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '14px',
                  borderRadius: '18px', padding: '0 18px', minHeight: '72px',
                  background: isActive
                    ? 'linear-gradient(135deg, #2a9d8f, #52d68a)'
                    : 'rgba(255,255,255,0.88)',
                  border: isActive ? 'none' : '1.5px solid rgba(255,255,255,0.65)',
                  boxShadow: isActive ? '0 4px 16px rgba(42,157,143,0.35)' : '0 2px 8px rgba(42,157,143,0.08)',
                  transition: 'all 0.15s',
                }}
              >
                <span style={{ fontSize: '2rem', lineHeight: 1, flexShrink: 0 }}>{station.emoji}</span>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <p style={{ fontSize: '1.1rem', fontWeight: 800, color: isActive ? '#fff' : '#0d2b27', margin: 0 }}>{station.name}</p>
                  <p style={{ fontSize: '0.85rem', color: isActive ? 'rgba(255,255,255,0.8)' : '#1a4a44', margin: 0, fontWeight: 600 }}>{station.genre}</p>
                </div>
                {isActive && isPlaying && (
                  <div style={{ display: 'flex', gap: '3px', alignItems: 'flex-end', height: '24px', flexShrink: 0 }}>
                    {[12, 18, 14, 20, 10].map((h, i) => (
                      <div key={i} style={{ width: '4px', borderRadius: '2px', backgroundColor: '#fff', height: `${h}px`, animation: `pulse 0.${6 + i}s ease-in-out infinite alternate` }} />
                    ))}
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* ── Eigener Sender ───────────────────────────────────────────────── */}
        <div>
          <button
            onClick={() => setShowCustom(!showCustom)}
            style={{
              width: '100%', borderRadius: '18px', padding: '16px',
              backgroundColor: 'rgba(255,255,255,0.82)', border: '1.5px dashed #7ececa',
              display: 'flex', alignItems: 'center', gap: '12px',
            }}
          >
            <span style={{ fontSize: '1.5rem' }}>➕</span>
            <span style={{ fontSize: '1rem', fontWeight: 700, color: '#1a4a44' }}>Eigenen Sender hinzufügen</span>
          </button>
          {showCustom && (
            <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '10px', padding: '16px', borderRadius: '18px', backgroundColor: 'rgba(255,255,255,0.88)', border: '2px solid #7ececa' }}>
              <input
                type="text" placeholder="Name (z.B. Radio Berlin)"
                value={customName} onChange={e => setCustomName(e.target.value)}
                style={{ borderRadius: '12px', padding: '12px 14px', border: '2px solid #b5e3e3', fontSize: '1rem', fontWeight: 600, color: '#0d2b27', outline: 'none', backgroundColor: '#fff' }}
              />
              <input
                type="url" placeholder="Stream URL (https://...)"
                value={customUrl} onChange={e => setCustomUrl(e.target.value)}
                style={{ borderRadius: '12px', padding: '12px 14px', border: '2px solid #b5e3e3', fontSize: '1rem', fontWeight: 600, color: '#0d2b27', outline: 'none', backgroundColor: '#fff' }}
              />
              <button
                onClick={playCustom} disabled={!customUrl.trim()}
                style={{ borderRadius: '14px', padding: '14px', background: customUrl.trim() ? 'linear-gradient(135deg, #2a9d8f, #52d68a)' : '#b5e3e3', border: 'none', fontSize: '1.05rem', fontWeight: 800, color: '#fff' }}
              >
                ▶️ Abspielen
              </button>
            </div>
          )}
        </div>

      </div>

      <style>{`
        @keyframes pulse {
          from { transform: scaleY(0.4); }
          to   { transform: scaleY(1); }
        }
      `}</style>
    </div>
  )
}
