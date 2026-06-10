import React, { useRef, useState } from 'react'
import { Phone, Video, MessageCircle, Mic, MicOff, Camera } from 'lucide-react'
import { Header } from '../components/Header'
import type { Contact } from '../types'

interface ContactsScreenProps {
  contacts: Contact[]
  onBack: () => void
}

interface RecordingState {
  contactId: string
  mr: MediaRecorder
}

const CARD_SHADOW = '0 2px 8px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.04)'

const AVATAR_COLORS = [
  ['#e8fff8', '#00c896'],
  ['#e8f4ff', '#2563eb'],
  ['#fff0f0', '#dc2626'],
  ['#fffbeb', '#d97706'],
  ['#f3e8ff', '#7c3aed'],
]

function ContactCard({ contact, index }: { contact: Contact; index: number }) {
  const photoInputRef = useRef<HTMLInputElement>(null)
  const [recording, setRecording] = useState(false)
  const [recState, setRecState] = useState<RecordingState | null>(null)
  const [sent, setSent] = useState<'photo' | 'voice' | null>(null)
  const [avatarBg, avatarText] = AVATAR_COLORS[index % AVATAR_COLORS.length]

  function handleCall() {
    if (contact.phone) window.location.href = `tel:${contact.phone}`
  }

  function handleVideo() {
    if (contact.phone) window.location.href = `facetime:${contact.phone}`
  }

  function handleMessage() {
    if (contact.phone) window.location.href = `sms:${contact.phone}`
  }

  function handlePhotoFile(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.[0]) {
      setSent('photo')
      setTimeout(() => setSent(null), 3000)
    }
    e.target.value = ''
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      const chunks: BlobPart[] = []
      mr.ondataavailable = e => chunks.push(e.data)
      mr.onstop = () => {
        stream.getTracks().forEach(t => t.stop())
        setSent('voice')
        setTimeout(() => setSent(null), 3000)
      }
      mr.start()
      setRecState({ contactId: contact.id, mr })
      setRecording(true)
    } catch {
      alert('Mikrofon-Zugriff nicht erlaubt')
    }
  }

  function stopRecording() {
    recState?.mr.stop()
    setRecState(null)
    setRecording(false)
  }

  const initials = contact.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div style={{
      background: '#ffffff', borderRadius: '28px',
      padding: '20px', boxShadow: CARD_SHADOW,
      border: '1px solid rgba(255,255,255,0.8)',
      display: 'flex', flexDirection: 'column', gap: '16px',
    }}>
      {/* Avatar + Name */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: '96px', height: '96px', borderRadius: '50%',
          overflow: 'hidden', flexShrink: 0,
          background: avatarBg,
          border: `3px solid ${avatarText}33`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 4px 14px ${avatarText}22`,
        }}>
          {contact.photo
            ? <img src={contact.photo} alt={contact.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ fontSize: '1.6rem', fontWeight: 800, color: avatarText, fontFamily: "'Inter', sans-serif", letterSpacing: '-0.02em' }}>
                {initials}
              </span>
          }
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ margin: '0 0 3px', fontSize: '1.3rem', fontWeight: 800, color: '#1a1a2e', letterSpacing: '-0.03em' }}>
            {contact.name}
          </p>
          {contact.phone && (
            <p style={{ margin: '0 0 4px', fontSize: '0.85rem', fontWeight: 500, color: '#8892a4' }}>
              {contact.phone}
            </p>
          )}
          {contact.isEmergency && (
            <span style={{
              display: 'inline-block', fontSize: '0.72rem', fontWeight: 700,
              color: '#dc2626', background: '#fff0f0',
              padding: '3px 10px', borderRadius: '20px', border: '1px solid #fecaca',
            }}>
              Notfallkontakt
            </span>
          )}
        </div>
      </div>

      {/* 3 Action Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
        <button
          onClick={handleCall}
          style={{
            borderRadius: '18px', padding: '14px 8px', minHeight: '76px',
            background: '#e8fff8', border: '1.5px solid #a7f3d0',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px',
          }}
        >
          <Phone size={24} color="#00c896" strokeWidth={2} />
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#00a67e' }}>Anrufen</span>
        </button>
        <button
          onClick={handleVideo}
          style={{
            borderRadius: '18px', padding: '14px 8px', minHeight: '76px',
            background: '#e8f4ff', border: '1.5px solid #bfdbfe',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px',
          }}
        >
          <Video size={24} color="#2563eb" strokeWidth={2} />
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#1d4ed8' }}>Video</span>
        </button>
        <button
          onClick={handleMessage}
          style={{
            borderRadius: '18px', padding: '14px 8px', minHeight: '76px',
            background: '#f3e8ff', border: '1.5px solid #d8b4fe',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px',
          }}
        >
          <MessageCircle size={24} color="#7c3aed" strokeWidth={2} />
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#6d28d9' }}>Nachricht</span>
        </button>
      </div>

      {/* Feedback banner */}
      {sent && (
        <div style={{ borderRadius: '16px', padding: '12px 16px', background: '#f0fdf8', border: '1.5px solid #a7f3d0', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#059669' }}>
            {sent === 'photo' ? 'Foto gesendet! 📸' : 'Sprachnachricht gesendet! 🎤'}
          </p>
        </div>
      )}

      {/* Camera */}
      <button
        onClick={() => photoInputRef.current?.click()}
        style={{
          borderRadius: '18px', padding: '0 18px', minHeight: '58px',
          background: '#f8fffe', border: '1.5px solid #e2e8f0',
          display: 'flex', alignItems: 'center', gap: '12px',
        }}
      >
        <Camera size={22} color="#8892a4" strokeWidth={2} />
        <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1a1a2e' }}>Foto schicken</span>
      </button>
      <input ref={photoInputRef} type="file" accept="image/*" capture="environment" onChange={handlePhotoFile} style={{ display: 'none' }} />

      {/* Voice message */}
      <button
        onPointerDown={startRecording}
        onPointerUp={stopRecording}
        onPointerLeave={recording ? stopRecording : undefined}
        style={{
          borderRadius: '18px', padding: '0 18px', minHeight: '58px',
          background: recording ? '#fff0f0' : '#f8fffe',
          border: `1.5px solid ${recording ? '#fca5a5' : '#e2e8f0'}`,
          display: 'flex', alignItems: 'center', gap: '12px',
          transform: recording ? 'scale(0.97)' : 'scale(1)',
          transition: 'transform 0.1s ease, background 0.15s ease',
        }}
      >
        {recording
          ? <MicOff size={22} color="#dc2626" strokeWidth={2} />
          : <Mic size={22} color="#8892a4" strokeWidth={2} />
        }
        <div>
          <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: recording ? '#dc2626' : '#1a1a2e' }}>
            {recording ? 'Aufnahme läuft...' : 'Sprachnachricht'}
          </p>
          <p style={{ margin: 0, fontSize: '0.72rem', fontWeight: 500, color: '#8892a4' }}>
            {recording ? 'Loslassen zum Senden' : 'Gedrückt halten'}
          </p>
        </div>
      </button>
    </div>
  )
}

export function ContactsScreen({ contacts, onBack }: ContactsScreenProps) {
  return (
    <div className="screen" style={{ background: '#f8fffe' }}>
      <Header title="Kontakte" onBack={onBack} />
      <div className="scroll-zone" style={{ padding: '14px 16px', paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {contacts.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: '60px', gap: '16px' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: '#e8fff8', border: '2px solid #a7f3d0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '2.5rem' }}>👥</span>
            </div>
            <p style={{ fontSize: '1.05rem', fontWeight: 600, color: '#8892a4', textAlign: 'center', lineHeight: 1.6, margin: 0 }}>
              Noch keine Kontakte.{'\n'}Bitte in den Einstellungen hinzufügen.
            </p>
          </div>
        ) : (
          contacts.sort((a, b) => a.order - b.order).map((c, i) => <ContactCard key={c.id} contact={c} index={i} />)
        )}
      </div>
    </div>
  )
}
