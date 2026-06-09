import React, { useState, useEffect, useRef } from 'react'

interface FallAlertProps {
  onDismiss: () => void
  onSOS: () => void
  countdownSeconds: number
}

function startAlarm(): () => void {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ctx = new ((window as any).AudioContext || (window as any).webkitAudioContext)()
    let stopped = false
    function beep() {
      if (stopped) return
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'square'
      osc.frequency.setValueAtTime(880, ctx.currentTime)
      osc.frequency.setValueAtTime(660, ctx.currentTime + 0.18)
      gain.gain.setValueAtTime(0.45, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.45)
    }
    beep()
    const id = setInterval(beep, 700)
    return () => {
      stopped = true
      clearInterval(id)
      ctx.close().catch(() => {})
    }
  } catch {
    return () => {}
  }
}

export function FallAlert({ onDismiss, onSOS, countdownSeconds }: FallAlertProps) {
  const [remaining, setRemaining] = useState(countdownSeconds)
  const stopAlarmRef = useRef<() => void>(() => {})

  // Start alarm immediately
  useEffect(() => {
    stopAlarmRef.current = startAlarm()
    return () => stopAlarmRef.current()
  }, [])

  // Countdown
  useEffect(() => {
    if (remaining <= 0) {
      stopAlarmRef.current()
      onSOS()
      return
    }
    const id = setTimeout(() => setRemaining(r => r - 1), 1000)
    return () => clearTimeout(id)
  }, [remaining, onSOS])

  function handleOK() {
    stopAlarmRef.current()
    onDismiss()
  }

  const urgent = remaining <= 10
  const progress = ((countdownSeconds - remaining) / countdownSeconds) * 100

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6"
      style={{
        backgroundColor: urgent ? 'rgba(185,28,28,0.97)' : 'rgba(220,38,38,0.95)',
        backdropFilter: 'blur(4px)',
        animation: urgent ? 'none' : undefined,
      }}
    >
      <div className="flex flex-col items-center gap-5 w-full" style={{ maxWidth: '360px' }}>

        {/* Icon + Titel */}
        <span style={{ fontSize: '5rem', lineHeight: 1, filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.4))' }}>⚠️</span>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fff', margin: '0 0 4px', textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
            STURZ ERKANNT!
          </p>
          <p style={{ fontSize: '1.1rem', color: '#fecaca', margin: 0, fontWeight: 700 }}>
            Notruf & SMS in {remaining} Sekunden
          </p>
        </div>

        {/* Countdown-Ring */}
        <div style={{ position: 'relative', width: '120px', height: '120px' }}>
          <svg width="120" height="120" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="8" />
            <circle
              cx="60" cy="60" r="52"
              fill="none"
              stroke={urgent ? '#fde047' : '#fff'}
              strokeWidth="8"
              strokeDasharray={`${2 * Math.PI * 52}`}
              strokeDashoffset={`${2 * Math.PI * 52 * (1 - progress / 100)}`}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }}
            />
          </svg>
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{
              fontSize: urgent ? '2.8rem' : '2.5rem',
              fontWeight: 900,
              color: urgent ? '#fde047' : '#fff',
              fontVariantNumeric: 'tabular-nums',
              transition: 'color 0.3s',
            }}>
              {remaining}
            </span>
          </div>
        </div>

        {/* Info */}
        <div style={{ borderRadius: '16px', padding: '12px 20px', backgroundColor: 'rgba(255,255,255,0.15)', width: '100%', textAlign: 'center' }}>
          <p style={{ fontSize: '0.95rem', color: '#fecaca', margin: 0, lineHeight: 1.5, fontWeight: 600 }}>
            🚨 Danach: SMS + Notruf an alle Kontakte{'\n'}mit GPS-Standort
          </p>
        </div>

        {/* OK Button */}
        <button
          onClick={handleOK}
          style={{
            width: '100%',
            borderRadius: '24px',
            minHeight: '90px',
            background: 'linear-gradient(135deg, #4ade80, #16a34a)',
            border: '3px solid rgba(255,255,255,0.5)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            fontSize: '1.5rem',
            fontWeight: 900,
            color: '#fff',
            textShadow: '0 1px 4px rgba(0,0,0,0.3)',
          }}
        >
          ✅ ICH BIN OK – ABBRECHEN
        </button>

        <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.65)', textAlign: 'center', margin: 0 }}>
          Button drücken um Alarm zu stoppen
        </p>
      </div>
    </div>
  )
}
