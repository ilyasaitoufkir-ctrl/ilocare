import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Header } from '../components/Header'
import type { Contact, Screen } from '../types'

interface IloScreenProps {
  contacts: Contact[]
  userName: string
  elevenLabsApiKey: string
  elevenLabsVoiceId: string
  voiceName: string
  onNavigate: (screen: Screen) => void
  onBack: () => void
  onSOS: () => void
}

type IloMode = 'idle' | 'listening' | 'thinking' | 'health-chat'

interface HealthMessage {
  role: 'user' | 'assistant'
  content: string
  showDoctorBtn?: boolean
}

const ILO_SYSTEM = `Du bist Ilo, ein freundlicher KI Assistent speziell für ältere Menschen.
Du sprichst immer einfach, klar und freundlich auf Deutsch.
Du verstehst Sprachbefehle und leitest die richtige Aktion ein.

Mögliche Aktionen:
- ANRUF: Kontakt anrufen (parameter: Name des Kontakts)
- MEDIKAMENTE: Medikamente anzeigen
- RADIO: Radio öffnen
- NACHRICHTEN: Nachrichten anzeigen
- SOS: Notfall auslösen
- GESUNDHEIT: Gesundheitsberatung starten
- EINKAUF: Einkaufsliste öffnen
- UNTERHALTUNG: Unterhaltung öffnen
- ANTWORT: Allgemeine Antwort ohne Navigation

Antworte IMMER als JSON:
{
  "aktion": "ANRUF",
  "antwort": "Ich rufe jetzt deine Tochter an",
  "parameter": "Anna"
}`

const HEALTH_SYSTEM = `Du bist Ilo, ein einfühlsamer Gesundheitsberater für ältere Menschen.
Du gibst einfache, verständliche Ratschläge auf Deutsch in 2-3 kurzen Sätzen.
Du fragst bei Bedarf nach Details um besser helfen zu können.
Bei ernsthaften Symptomen (Brustschmerzen, Atemnot, starke Schmerzen, Bewusstlosigkeit) empfiehlst du sofort den Notruf 112.
Bei anderen Symptomen fragst du nach Schwere und Dauer, und empfiehlst ggf. den Hausarzt.
Füge am Ende jeder Antwort exakt diese Zeile hinzu: ARZT: ja oder ARZT: nein`

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type WebkitRec = any

function speak(text: string) {
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const utt = new SpeechSynthesisUtterance(text)
  utt.lang = 'de-DE'
  utt.rate = 0.9
  utt.pitch = 1.1
  window.speechSynthesis.speak(utt)
}

export function IloScreen({ contacts, userName, elevenLabsApiKey, elevenLabsVoiceId, voiceName, onNavigate, onBack, onSOS }: IloScreenProps) {
  const [mode, setMode] = useState<IloMode>('idle')
  const [transcript, setTranscript] = useState('')
  const [response, setResponse] = useState('')
  const [healthMessages, setHealthMessages] = useState<HealthMessage[]>([])
  const [healthInput, setHealthInput] = useState('')
  const [isHealthThinking, setIsHealthThinking] = useState(false)
  const [showDoctorBtn, setShowDoctorBtn] = useState(false)
  const [doctorPhone, setDoctorPhone] = useState('')
  const recRef = useRef<WebkitRec>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  async function speakWithVoice(text: string) {
    if (elevenLabsVoiceId && elevenLabsApiKey) {
      try {
        const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${elevenLabsVoiceId}`, {
          method: 'POST',
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': elevenLabsApiKey,
          },
          body: JSON.stringify({
            text,
            model_id: 'eleven_multilingual_v2',
            voice_settings: { stability: 0.5, similarity_boost: 0.75 },
          }),
        })
        if (res.ok) {
          const blob = await res.blob()
          const url = URL.createObjectURL(blob)
          const audio = new Audio(url)
          audio.onended = () => URL.revokeObjectURL(url)
          audio.play()
          return
        }
      } catch { /* fall through to browser TTS */ }
    }
    speak(text)
  }

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [healthMessages])

  useEffect(() => {
    const doc = contacts.find(c => c.phone && (c.name.toLowerCase().includes('arzt') || c.name.toLowerCase().includes('doktor')))
    if (doc) setDoctorPhone(doc.phone)
  }, [contacts])

  const callClaude = useCallback(async (userText: string): Promise<string> => {
    const key = import.meta.env.VITE_ANTHROPIC_API_KEY
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-allow-browser': 'true',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        system: ILO_SYSTEM,
        messages: [{ role: 'user', content: userText }],
      }),
    })
    const data = await res.json()
    return data.content?.[0]?.text ?? '{}'
  }, [])

  const callHealth = useCallback(async (msgs: HealthMessage[]): Promise<string> => {
    const key = import.meta.env.VITE_ANTHROPIC_API_KEY
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-allow-browser': 'true',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 400,
        system: HEALTH_SYSTEM,
        messages: msgs.map(m => ({ role: m.role, content: m.content })),
      }),
    })
    const data = await res.json()
    return data.content?.[0]?.text ?? 'Ich konnte leider nicht antworten.'
  }, [])

  function executeAction(aktion: string, antwort: string, parameter: string) {
    const action = aktion.toUpperCase()
    if (action === 'ANRUF') {
      const contact = contacts.find(c =>
        c.name.toLowerCase().includes(parameter.toLowerCase()) ||
        parameter.toLowerCase().includes(c.name.toLowerCase().split(' ')[0])
      )
      if (contact?.phone) {
        speakWithVoice(antwort)
        setTimeout(() => { window.location.href = `tel:${contact.phone}` }, 1500)
      } else {
        speakWithVoice(`Ich konnte ${parameter} nicht in deinen Kontakten finden.`)
        setResponse(`Kontakt "${parameter}" nicht gefunden.`)
      }
      return
    }
    speakWithVoice(antwort)
    const navMap: Record<string, Screen> = {
      MEDIKAMENTE: 'medications',
      RADIO: 'radio',
      NACHRICHTEN: 'news',
      EINKAUF: 'shopping',
      UNTERHALTUNG: 'entertainment',
    }
    if (navMap[action]) {
      setTimeout(() => onNavigate(navMap[action]), 1200)
    } else if (action === 'SOS') {
      setTimeout(() => onSOS(), 1200)
    } else if (action === 'GESUNDHEIT') {
      setMode('health-chat')
      const greeting = antwort || 'Wie kann ich dir gesundheitlich helfen?'
      setHealthMessages([{ role: 'assistant', content: greeting }])
      speakWithVoice(greeting)
    }
  }

  function startListening() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const W = window as any
    if (!W.webkitSpeechRecognition) {
      setResponse('Spracherkennung ist in diesem Browser nicht verfügbar.')
      return
    }
    const rec: WebkitRec = new W.webkitSpeechRecognition()
    rec.lang = 'de-DE'
    rec.continuous = false
    rec.interimResults = false
    rec.onresult = async (e: WebkitRec) => {
      const text = e.results[0][0].transcript
      setTranscript(text)
      setMode('thinking')
      setResponse('')
      try {
        const raw = await callClaude(text)
        let parsed: { aktion: string; antwort: string; parameter?: string }
        try { parsed = JSON.parse(raw) } catch { parsed = { aktion: 'ANTWORT', antwort: raw, parameter: '' } }
        setResponse(parsed.antwort)
        executeAction(parsed.aktion, parsed.antwort, parsed.parameter ?? '')
      } catch {
        const msg = 'Entschuldigung, ich hatte ein Problem. Bitte versuche es nochmal.'
        setResponse(msg)
        speakWithVoice(msg)
      } finally {
        setMode('idle')
      }
    }
    rec.onerror = () => { setMode('idle') }
    rec.onend = () => { if (mode === 'listening') setMode('idle') }
    recRef.current = rec
    rec.start()
    setMode('listening')
    setTranscript('')
    setResponse('')
  }

  function stopListening() {
    recRef.current?.stop()
  }

  async function sendHealthMessage(text: string) {
    if (!text.trim()) return
    const userMsg: HealthMessage = { role: 'user', content: text }
    const updated = [...healthMessages, userMsg]
    setHealthMessages(updated)
    setHealthInput('')
    setIsHealthThinking(true)
    try {
      const raw = await callHealth(updated)
      const needsDoctor = raw.includes('ARZT: ja')
      const clean = raw.replace(/ARZT: (ja|nein)/g, '').trim()
      const assistantMsg: HealthMessage = { role: 'assistant', content: clean, showDoctorBtn: needsDoctor }
      setHealthMessages(prev => [...prev, assistantMsg])
      if (needsDoctor) setShowDoctorBtn(true)
      speakWithVoice(clean)
    } catch {
      const err: HealthMessage = { role: 'assistant', content: 'Entschuldigung, ich konnte nicht antworten.' }
      setHealthMessages(prev => [...prev, err])
    } finally {
      setIsHealthThinking(false)
    }
  }

  if (mode === 'health-chat') {
    return (
      <div className="screen">
        <Header title="🏥 Ilo – Gesundheit" onBack={() => { setMode('idle'); setHealthMessages([]); setShowDoctorBtn(false) }} />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '8px 14px', background: '#fef3c7', borderBottom: '1px solid #fcd34d', flexShrink: 0 }}>
            <p style={{ fontSize: '0.8rem', color: '#92400e', margin: 0, fontWeight: 600 }}>
              ⚕️ Kein Ersatz für einen Arzt – bei Notfall 112 anrufen!
            </p>
          </div>

          <div className="scroll-zone" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px', paddingBottom: '100px' }}>
            {healthMessages.map((msg, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              }}>
                <div style={{
                  maxWidth: '82%', borderRadius: '18px', padding: '12px 16px',
                  background: msg.role === 'user'
                    ? 'linear-gradient(135deg, #2a9d8f, #52d68a)'
                    : 'rgba(255,255,255,0.92)',
                  border: msg.role === 'assistant' ? '1.5px solid rgba(255,255,255,0.65)' : 'none',
                  boxShadow: '0 2px 10px rgba(42,157,143,0.1)',
                }}>
                  {msg.role === 'assistant' && (
                    <p style={{ fontSize: '0.75rem', fontWeight: 800, color: '#2a9d8f', margin: '0 0 4px' }}>🤖 Ilo</p>
                  )}
                  <p style={{ fontSize: '1rem', color: msg.role === 'user' ? '#fff' : '#0d2b27', margin: 0, lineHeight: 1.5, fontWeight: 500 }}>
                    {msg.content}
                  </p>
                  {msg.showDoctorBtn && doctorPhone && (
                    <button
                      onClick={() => { window.location.href = `tel:${doctorPhone}` }}
                      style={{ marginTop: '10px', width: '100%', borderRadius: '12px', padding: '10px', background: 'linear-gradient(135deg, #ef4444, #dc2626)', border: 'none', fontSize: '0.95rem', fontWeight: 800, color: '#fff' }}
                    >
                      📞 Hausarzt anrufen
                    </button>
                  )}
                </div>
              </div>
            ))}
            {isHealthThinking && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ borderRadius: '18px', padding: '12px 16px', background: 'rgba(255,255,255,0.92)', border: '1.5px solid rgba(255,255,255,0.65)' }}>
                  <p style={{ fontSize: '0.75rem', fontWeight: 800, color: '#2a9d8f', margin: '0 0 4px' }}>🤖 Ilo</p>
                  <p style={{ fontSize: '1rem', color: '#0d2b27', margin: 0 }}>⏳ Denke nach…</p>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div style={{ position: 'absolute', bottom: 'calc(env(safe-area-inset-bottom) + 8px)', left: '12px', right: '12px', display: 'flex', gap: '8px' }}>
            <input
              value={healthInput}
              onChange={e => setHealthInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendHealthMessage(healthInput)}
              placeholder="Symptom beschreiben…"
              style={{ flex: 1, borderRadius: '20px', padding: '14px 18px', border: '2px solid #7ececa', fontSize: '1rem', fontWeight: 600, color: '#0d2b27', outline: 'none', backgroundColor: 'rgba(255,255,255,0.95)' }}
            />
            <button
              onClick={() => sendHealthMessage(healthInput)}
              disabled={!healthInput.trim()}
              style={{ borderRadius: '20px', padding: '14px 18px', background: healthInput.trim() ? 'linear-gradient(135deg, #2a9d8f, #52d68a)' : '#b5e3e3', border: 'none', fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}
            >
              ➤
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="screen">
      <Header title="🤖 Ilo – Dein Assistent" onBack={() => { window.speechSynthesis?.cancel(); onBack() }} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: '20px 20px 32px' }}>

        {/* Ilo Avatar */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '100px', height: '100px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #2a9d8f, #52d68a)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 28px rgba(42,157,143,0.4)',
            border: '4px solid rgba(255,255,255,0.5)',
            fontSize: '3rem',
          }}>
            🤖
          </div>
          <p style={{ fontSize: '1.3rem', fontWeight: 900, color: '#0d2b27', margin: 0 }}>Hallo, {userName}!</p>
          {voiceName && elevenLabsVoiceId && (
            <div style={{ borderRadius: '12px', padding: '4px 12px', background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(168,85,247,0.2))', border: '1px solid rgba(124,58,237,0.35)' }}>
              <p style={{ fontSize: '0.8rem', fontWeight: 700, color: '#7c3aed', margin: 0 }}>🎤 Stimme von {voiceName}</p>
            </div>
          )}
          <p style={{ fontSize: '1rem', color: '#1a4a44', margin: 0, fontWeight: 600 }}>
            {mode === 'idle' && 'Was kann ich für dich tun?'}
            {mode === 'listening' && '🎤 Ich höre zu…'}
            {mode === 'thinking' && '⏳ Ich denke nach…'}
          </p>
        </div>

        {/* Transcript / Response */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px', minHeight: '120px', justifyContent: 'center' }}>
          {transcript && (
            <div style={{ borderRadius: '18px', padding: '14px 18px', background: 'rgba(255,255,255,0.92)', border: '1.5px solid rgba(255,255,255,0.65)', boxShadow: '0 2px 10px rgba(42,157,143,0.1)' }}>
              <p style={{ fontSize: '0.8rem', fontWeight: 700, color: '#2a9d8f', margin: '0 0 4px' }}>Du sagtest:</p>
              <p style={{ fontSize: '1.05rem', color: '#0d2b27', margin: 0, fontWeight: 500 }}>"{transcript}"</p>
            </div>
          )}
          {response && (
            <div style={{ borderRadius: '18px', padding: '14px 18px', background: 'linear-gradient(135deg, rgba(42,157,143,0.15), rgba(82,214,138,0.15))', border: '1.5px solid #7ececa' }}>
              <p style={{ fontSize: '0.8rem', fontWeight: 700, color: '#2a9d8f', margin: '0 0 4px' }}>🤖 Ilo:</p>
              <p style={{ fontSize: '1.05rem', color: '#0d2b27', margin: 0, fontWeight: 600 }}>{response}</p>
            </div>
          )}
        </div>

        {/* Mic Button */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <button
            onPointerDown={startListening}
            onPointerUp={stopListening}
            onPointerLeave={mode === 'listening' ? stopListening : undefined}
            disabled={mode === 'thinking'}
            style={{
              width: '140px', height: '140px', borderRadius: '50%',
              background: mode === 'listening'
                ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                : mode === 'thinking'
                  ? 'linear-gradient(135deg, #fbbf24, #f59e0b)'
                  : 'linear-gradient(135deg, #2a9d8f, #52d68a)',
              border: '5px solid rgba(255,255,255,0.6)',
              boxShadow: mode === 'listening'
                ? '0 0 0 12px rgba(239,68,68,0.2), 0 12px 36px rgba(239,68,68,0.4)'
                : '0 12px 36px rgba(42,157,143,0.45)',
              fontSize: '3.5rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s',
              opacity: mode === 'thinking' ? 0.7 : 1,
            }}
          >
            {mode === 'thinking' ? '⏳' : mode === 'listening' ? '🔴' : '🎤'}
          </button>
          <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)', fontWeight: 700, margin: 0 }}>
            {mode === 'listening' ? 'Loslassen zum Senden' : 'Gedrückt halten und sprechen'}
          </p>
        </div>

        {/* Quick Actions */}
        <div style={{ width: '100%', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
          {[
            { label: '💊 Medis', action: () => onNavigate('medications') },
            { label: '📰 News', action: () => onNavigate('news') },
            { label: '🏥 Gesundheit', action: () => { setMode('health-chat'); setHealthMessages([{ role: 'assistant', content: `Hallo ${userName}! Wie fühlst du dich? Was beschäftigt dich?` }]); speakWithVoice(`Hallo ${userName}! Wie fühlst du dich?`) } },
          ].map(btn => (
            <button
              key={btn.label}
              onClick={btn.action}
              style={{
                borderRadius: '16px', padding: '12px 8px',
                background: 'rgba(255,255,255,0.85)',
                backdropFilter: 'blur(16px)',
                border: '1.5px solid rgba(255,255,255,0.65)',
                fontSize: '0.85rem', fontWeight: 700, color: '#1a4a44',
                boxShadow: '0 2px 10px rgba(42,157,143,0.1)',
              }}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
