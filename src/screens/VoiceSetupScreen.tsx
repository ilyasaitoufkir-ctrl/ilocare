import React, { useState, useRef, useEffect } from 'react'
import { Header } from '../components/Header'

interface VoiceSetupScreenProps {
  apiKey: string
  voiceId: string
  voiceName: string
  onSave: (apiKey: string, voiceId: string, voiceName: string) => void
  onBack: () => void
}

type SetupStep = 'config' | 'recording' | 'uploading' | 'done' | 'error'

const SAMPLE_SENTENCES = [
  'Hallo Mama, wie geht es dir heute?',
  'Vergiss nicht deine Medikamente zu nehmen!',
  'Ich liebe dich und denke immer an dich!',
  'Ruf mich an wenn du etwas brauchst!',
  'Heute ist ein schöner Tag, genieße ihn!',
  'Guten Morgen! Hast du gut geschlafen?',
  'Ich bin immer für dich da, egal was passiert.',
  'Wir sehen uns bald, ich freue mich darauf!',
  'Du bist so wichtig für mich – ich liebe dich!',
  'Pass gut auf dich auf, ich denke an dich!',
]

export function VoiceSetupScreen({ apiKey, voiceId, voiceName, onSave, onBack }: VoiceSetupScreenProps) {
  const [step, setStep] = useState<SetupStep>(voiceId ? 'done' : 'config')
  const [draftApiKey, setDraftApiKey] = useState(apiKey)
  const [draftName, setDraftName] = useState(voiceName || '')
  const [isRecording, setIsRecording] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [newVoiceId, setNewVoiceId] = useState(voiceId || '')
  const [errorMsg, setErrorMsg] = useState('')
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false)
  const [waveHeights, setWaveHeights] = useState([14, 20, 12, 24, 10, 22, 16])

  const mrRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<BlobPart[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const waveRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => () => {
    timerRef.current && clearInterval(timerRef.current)
    waveRef.current && clearInterval(waveRef.current)
    audioRef.current?.pause()
  }, [])

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      chunksRef.current = []
      const mr = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : '' })
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.onstop = () => {
        stream.getTracks().forEach(t => t.stop())
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || 'audio/webm' })
        setAudioBlob(blob)
      }
      mr.start(250)
      mrRef.current = mr
      setIsRecording(true)
      setSeconds(0)
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000)
      waveRef.current = setInterval(() => {
        setWaveHeights([14, 20, 12, 24, 10, 22, 16].map(() => 8 + Math.random() * 28))
      }, 150)
    } catch {
      setErrorMsg('Mikrofon-Zugriff verweigert. Bitte in den Einstellungen erlauben.')
      setStep('error')
    }
  }

  function stopRecording() {
    mrRef.current?.stop()
    timerRef.current && clearInterval(timerRef.current)
    waveRef.current && clearInterval(waveRef.current)
    setIsRecording(false)
    setWaveHeights([14, 20, 12, 24, 10, 22, 16])
  }

  async function cloneVoice() {
    if (!audioBlob || !draftName.trim() || !draftApiKey.trim()) return
    setStep('uploading')
    try {
      const fd = new FormData()
      fd.append('name', draftName.trim())
      fd.append('files', audioBlob, `voice_${Date.now()}.webm`)

      const res = await fetch('https://api.elevenlabs.io/v1/voices/add', {
        method: 'POST',
        headers: { 'xi-api-key': draftApiKey.trim() },
        body: fd,
      })
      const data = await res.json()
      if (!res.ok) {
        setErrorMsg(data.detail?.message || `Fehler ${res.status} – API-Key prüfen`)
        setStep('error')
        return
      }
      const clonedId: string = data.voice_id
      setNewVoiceId(clonedId)
      onSave(draftApiKey.trim(), clonedId, draftName.trim())
      setStep('done')
    } catch {
      setErrorMsg('Netzwerkfehler – bitte Internetverbindung prüfen.')
      setStep('error')
    }
  }

  async function playPreview(vid: string) {
    if (isPreviewPlaying || !draftApiKey) return
    setIsPreviewPlaying(true)
    try {
      const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${vid}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': draftApiKey.trim(),
        },
        body: JSON.stringify({
          text: `Hallo! Ich bin jetzt die Stimme von ${draftName}. Ilo spricht ab jetzt mit meiner Stimme! 🥰`,
          model_id: 'eleven_multilingual_v2',
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
        }),
      })
      if (res.ok) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const audio = new Audio(url)
        audioRef.current = audio
        audio.onended = () => { URL.revokeObjectURL(url); setIsPreviewPlaying(false) }
        audio.onerror = () => setIsPreviewPlaying(false)
        audio.play()
      } else {
        setIsPreviewPlaying(false)
      }
    } catch {
      setIsPreviewPlaying(false)
    }
  }

  function formatTime(s: number) {
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
  }

  // ── Done / Existing Voice ─────────────────────────────────────────────────
  if (step === 'done') {
    return (
      <div className="screen">
        <Header title="🎤 Familien-Stimme" onBack={onBack} />
        <div className="scroll-zone" style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>

          <div style={{ borderRadius: '28px', padding: '32px 24px', background: 'linear-gradient(135deg, #7c3aed, #a855f7)', boxShadow: '0 8px 32px rgba(124,58,237,0.45)', textAlign: 'center', width: '100%' }}>
            <div style={{ fontSize: '4rem', marginBottom: '12px' }}>🥰</div>
            <p style={{ fontSize: '1.4rem', fontWeight: 900, color: '#fff', margin: '0 0 8px' }}>
              Stimme von {draftName || voiceName} aktiv!
            </p>
            <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.85)', margin: 0, fontWeight: 600 }}>
              Ilo spricht jetzt mit einer vertrauten Stimme ❤️
            </p>
          </div>

          <button
            onClick={() => playPreview(newVoiceId || voiceId)}
            disabled={isPreviewPlaying}
            style={{
              width: '100%', borderRadius: '20px', padding: '18px',
              background: isPreviewPlaying ? 'rgba(255,255,255,0.7)' : 'linear-gradient(135deg, #52d68a, #2a9d8f)',
              border: 'none', fontSize: '1.1rem', fontWeight: 800, color: '#fff',
              boxShadow: '0 6px 20px rgba(42,157,143,0.35)',
            }}
          >
            {isPreviewPlaying ? '🔊 Spielt…' : '▶️ Stimme anhören'}
          </button>

          <button
            onClick={() => { setStep('config'); setAudioBlob(null); setSeconds(0) }}
            style={{ width: '100%', borderRadius: '20px', padding: '16px', background: 'rgba(255,255,255,0.88)', border: '1.5px dashed #7ececa', fontSize: '1rem', fontWeight: 700, color: '#1a4a44' }}
          >
            🔄 Stimme neu aufnehmen
          </button>

          <button
            onClick={() => { onSave('', '', ''); setNewVoiceId(''); setStep('config') }}
            style={{ width: '100%', borderRadius: '20px', padding: '14px', background: 'rgba(255,255,255,0.7)', border: '1.5px solid #fca5a5', fontSize: '0.95rem', fontWeight: 700, color: '#dc2626' }}
          >
            🗑️ Stimme löschen (Standard KI verwenden)
          </button>

        </div>
      </div>
    )
  }

  // ── Uploading ─────────────────────────────────────────────────────────────
  if (step === 'uploading') {
    return (
      <div className="screen">
        <Header title="🎤 Stimme wird geklont…" onBack={onBack} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '24px', padding: '32px' }}>
          <div style={{ fontSize: '4rem' }}>🧬</div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0d2b27', margin: '0 0 8px' }}>KI klont die Stimme…</p>
            <p style={{ fontSize: '1rem', color: '#1a4a44', margin: 0, fontWeight: 600 }}>Das dauert ca. 30 Sekunden</p>
          </div>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-end', height: '40px' }}>
            {[20, 28, 16, 32, 14, 26, 18, 30, 22].map((h, i) => (
              <div key={i} style={{ width: '8px', borderRadius: '4px', backgroundColor: '#7c3aed', height: `${h}px`, animation: `pulse 0.${5 + (i % 4)}s ease-in-out infinite alternate` }} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (step === 'error') {
    return (
      <div className="screen">
        <Header title="🎤 Familien-Stimme" onBack={onBack} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px', padding: '32px' }}>
          <span style={{ fontSize: '3.5rem' }}>❌</span>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '1.2rem', fontWeight: 800, color: '#dc2626', margin: '0 0 8px' }}>Fehler aufgetreten</p>
            <p style={{ fontSize: '1rem', color: '#7f1d1d', margin: 0, lineHeight: 1.5 }}>{errorMsg}</p>
          </div>
          <button onClick={() => setStep('config')} style={{ borderRadius: '18px', padding: '16px 32px', background: 'linear-gradient(135deg, #2a9d8f, #52d68a)', border: 'none', fontSize: '1.05rem', fontWeight: 800, color: '#fff' }}>
            🔄 Nochmal versuchen
          </button>
        </div>
      </div>
    )
  }

  // ── Recording ─────────────────────────────────────────────────────────────
  if (step === 'recording') {
    return (
      <div className="screen">
        <Header title="🎤 Aufnahme läuft" onBack={() => { stopRecording(); setStep('config') }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Timer + Waveform */}
          <div style={{ flexShrink: 0, background: 'linear-gradient(135deg, #7c3aed, #a855f7)', padding: '24px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#f87171', animation: 'pulse 1s ease-in-out infinite alternate' }} />
              <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>AUFNAHME LÄUFT</span>
            </div>
            <span style={{ fontSize: '3rem', fontWeight: 900, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>{formatTime(seconds)}</span>
            <div style={{ display: 'flex', gap: '5px', alignItems: 'flex-end', height: '40px' }}>
              {waveHeights.map((h, i) => (
                <div key={i} style={{ width: '7px', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.9)', height: `${h}px`, transition: 'height 0.15s ease' }} />
              ))}
            </div>
            {seconds < 60 && (
              <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)', margin: 0, fontWeight: 600 }}>
                Mindestens 1 Minute aufnehmen ({60 - seconds}s noch)
              </p>
            )}
          </div>

          {/* Sample sentences */}
          <div className="scroll-zone" style={{ padding: '14px 16px', paddingBottom: '100px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <p style={{ fontSize: '1rem', fontWeight: 800, color: '#0d2b27', margin: 0 }}>📖 Bitte laut und deutlich vorlesen:</p>
            {SAMPLE_SENTENCES.map((s, i) => (
              <div key={i} style={{ borderRadius: '16px', padding: '12px 16px', background: 'rgba(255,255,255,0.92)', border: '1.5px solid rgba(255,255,255,0.65)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 900, color: '#7c3aed', minWidth: '24px' }}>{i + 1}.</span>
                <p style={{ fontSize: '1rem', color: '#0d2b27', margin: 0, fontWeight: 600, lineHeight: 1.4 }}>"{s}"</p>
              </div>
            ))}
          </div>

          {/* Stop button */}
          <div style={{ position: 'absolute', bottom: 'calc(env(safe-area-inset-bottom) + 16px)', left: '16px', right: '16px' }}>
            <button
              onClick={() => { stopRecording(); setStep('config') }}
              style={{ width: '100%', borderRadius: '20px', padding: '18px', background: 'linear-gradient(135deg, #ef4444, #dc2626)', border: 'none', fontSize: '1.15rem', fontWeight: 900, color: '#fff', boxShadow: '0 6px 24px rgba(220,38,38,0.45)' }}
            >
              ⏹️ Aufnahme beenden ({formatTime(seconds)})
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Config (default step) ─────────────────────────────────────────────────
  return (
    <div className="screen">
      <Header title="🎤 Familien-Stimme einrichten" onBack={onBack} />

      <div className="scroll-zone" style={{ padding: '16px', paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Emotional intro */}
        <div style={{ borderRadius: '24px', padding: '20px', background: 'linear-gradient(135deg, #7c3aed, #a855f7)', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🥰</div>
          <p style={{ fontSize: '1.15rem', fontWeight: 900, color: '#fff', margin: '0 0 6px' }}>Vertraute Stimme für Ilo</p>
          <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.85)', margin: 0, lineHeight: 1.5 }}>
            Oma hört die Stimme ihrer Tochter oder ihres Enkels —<br />das emotionalste Feature der App! 🥹
          </p>
        </div>

        {/* ElevenLabs API Key */}
        <div style={{ borderRadius: '20px', padding: '16px', background: 'rgba(255,255,255,0.92)', border: '1.5px solid rgba(255,255,255,0.65)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0d2b27', margin: 0 }}>🔑 ElevenLabs API-Key</p>
          <div style={{ borderRadius: '14px', padding: '10px 14px', background: '#f0f7ff', border: '1px solid #bfdbfe' }}>
            <p style={{ fontSize: '0.82rem', color: '#1e40af', margin: 0, lineHeight: 1.5 }}>
              ① Gratis anmelden auf elevenlabs.io<br />
              ② API-Key unter „Settings → API Keys" kopieren<br />
              ③ Hier einfügen
            </p>
          </div>
          <input
            type="password"
            value={draftApiKey}
            onChange={e => setDraftApiKey(e.target.value)}
            placeholder="sk-... (ElevenLabs API-Key)"
            style={{ borderRadius: '14px', padding: '14px 16px', border: '2px solid #7ececa', fontSize: '1rem', fontWeight: 600, color: '#0d2b27', outline: 'none', backgroundColor: '#fff' }}
          />
        </div>

        {/* Voice name */}
        <div style={{ borderRadius: '20px', padding: '16px', background: 'rgba(255,255,255,0.92)', border: '1.5px solid rgba(255,255,255,0.65)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0d2b27', margin: 0 }}>👤 Name des Familienmitglieds</p>
          <input
            type="text"
            value={draftName}
            onChange={e => setDraftName(e.target.value)}
            placeholder="z.B. Tochter Anna"
            style={{ borderRadius: '14px', padding: '14px 16px', border: '2px solid #7ececa', fontSize: '1rem', fontWeight: 600, color: '#0d2b27', outline: 'none', backgroundColor: '#fff' }}
          />
        </div>

        {/* Recording section */}
        <div style={{ borderRadius: '20px', padding: '16px', background: 'rgba(255,255,255,0.92)', border: '1.5px solid rgba(255,255,255,0.65)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <p style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0d2b27', margin: 0 }}>🎤 Stimme aufnehmen</p>
          <p style={{ fontSize: '0.9rem', color: '#1a4a44', margin: 0, lineHeight: 1.5 }}>
            Das Familienmitglied liest <strong>alle Beispielsätze vor</strong> (ca. 1–2 Minuten). Ruhige Umgebung, klare Aussprache.
          </p>

          {/* Sample sentences preview */}
          <div style={{ borderRadius: '14px', padding: '12px 16px', background: '#f9f7ff', border: '1px solid #ddd6fe', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {SAMPLE_SENTENCES.slice(0, 4).map((s, i) => (
              <p key={i} style={{ fontSize: '0.85rem', color: '#4c1d95', margin: 0, lineHeight: 1.4 }}>
                <strong>{i + 1}.</strong> „{s}"
              </p>
            ))}
            <p style={{ fontSize: '0.8rem', color: '#7c3aed', margin: 0, fontWeight: 600 }}>+ {SAMPLE_SENTENCES.length - 4} weitere Sätze…</p>
          </div>

          {audioBlob ? (
            <div style={{ borderRadius: '14px', padding: '12px 16px', background: '#f0fdf4', border: '2px solid #86efac', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.4rem' }}>✅</span>
              <div>
                <p style={{ fontSize: '0.95rem', fontWeight: 800, color: '#166534', margin: 0 }}>Aufnahme bereit ({formatTime(seconds)})</p>
                <p style={{ fontSize: '0.82rem', color: '#166534', margin: 0 }}>Jetzt klonen oder neu aufnehmen</p>
              </div>
            </div>
          ) : (
            <button
              onClick={() => { setStep('recording'); startRecording() }}
              disabled={!draftApiKey.trim() || !draftName.trim()}
              style={{
                borderRadius: '18px', padding: '18px',
                background: draftApiKey.trim() && draftName.trim()
                  ? 'linear-gradient(135deg, #dc2626, #ef4444)'
                  : '#b5e3e3',
                border: 'none', fontSize: '1.1rem', fontWeight: 900, color: '#fff',
                boxShadow: draftApiKey.trim() && draftName.trim() ? '0 6px 20px rgba(220,38,38,0.35)' : 'none',
              }}
            >
              🎤 Aufnahme starten
            </button>
          )}

          {audioBlob && (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => { setAudioBlob(null); setSeconds(0); setStep('recording'); startRecording() }}
                style={{ flex: 1, borderRadius: '16px', padding: '14px', background: 'rgba(255,255,255,0.88)', border: '1.5px solid #b5e3e3', fontSize: '0.95rem', fontWeight: 700, color: '#1a4a44' }}
              >
                🔄 Neu aufnehmen
              </button>
              <button
                onClick={cloneVoice}
                style={{ flex: 2, borderRadius: '16px', padding: '14px', background: 'linear-gradient(135deg, #7c3aed, #a855f7)', border: 'none', fontSize: '1rem', fontWeight: 800, color: '#fff', boxShadow: '0 4px 16px rgba(124,58,237,0.4)' }}
              >
                🧬 Stimme klonen!
              </button>
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ borderRadius: '16px', padding: '12px 16px', background: 'rgba(255,255,255,0.7)', border: '1.5px solid rgba(255,255,255,0.5)' }}>
          <p style={{ fontSize: '0.82rem', color: '#1a4a44', margin: 0, lineHeight: 1.6 }}>
            ℹ️ <strong>ElevenLabs</strong> ist ein KI-Dienst zur Stimmklonung. Das Gratis-Konto erlaubt 10.000 Zeichen/Monat — mehr als genug für Ilo. Die Stimmdaten werden auf ElevenLabs-Servern gespeichert.
          </p>
        </div>

      </div>

      <style>{`@keyframes pulse { from { opacity: 0.5; } to { opacity: 1; } }`}</style>
    </div>
  )
}
