import React, { useRef, useState } from 'react'
import { Phone, Video, Mic, MicOff, Camera } from 'lucide-react'
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

function ContactCard({ contact }: { contact: Contact }) {
  const photoInputRef = useRef<HTMLInputElement>(null)
  const [recording, setRecording] = useState(false)
  const [recState, setRecState] = useState<RecordingState | null>(null)
  const [sent, setSent] = useState<'photo' | 'voice' | null>(null)

  function handleCall() {
    if (contact.phone) window.location.href = `tel:${contact.phone}`
  }

  function handleVideo() {
    if (contact.phone) window.location.href = `facetime:${contact.phone}`
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

  return (
    <div
      className="rounded-3xl p-5 flex flex-col gap-4 shadow-md"
      style={{ backgroundColor: '#ffffff', border: '2px solid #e8d0d0' }}
    >
      {/* Foto & Name */}
      <div className="flex flex-col items-center gap-2">
        <div
          className="rounded-full overflow-hidden flex items-center justify-center"
          style={{ width: '110px', height: '110px', backgroundColor: '#f8e8e8', border: '4px solid #e8a0a0' }}
        >
          {contact.photo
            ? <img src={contact.photo} alt={contact.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ fontSize: '3.5rem' }}>👤</span>
          }
        </div>
        <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#2d1a1a', margin: 0 }}>
          {contact.name}
        </p>
        {contact.phone && (
          <p style={{ fontSize: '1rem', color: '#c87070', margin: 0 }}>{contact.phone}</p>
        )}
        {contact.isEmergency && (
          <span
            className="px-3 py-1 rounded-full"
            style={{ backgroundColor: '#fef2f2', color: '#dc2626', fontSize: '0.9rem', fontWeight: 700, border: '1px solid #fca5a5' }}
          >
            🚨 Notfallkontakt
          </span>
        )}
      </div>

      {/* Erfolgs-Banner */}
      {sent && (
        <div className="rounded-2xl p-3 text-center" style={{ backgroundColor: '#dcfce7', border: '2px solid #86efac' }}>
          <p style={{ fontSize: '1rem', fontWeight: 700, color: '#166534', margin: 0 }}>
            {sent === 'photo' ? '📸 Foto gesendet!' : '🎤 Sprachnachricht gesendet!'}
          </p>
        </div>
      )}

      {/* Anruf + Video */}
      <div className="flex gap-3">
        <button
          onClick={handleCall}
          className="flex-1 flex flex-col items-center justify-center gap-2 rounded-2xl active:scale-95 transition-transform"
          style={{ backgroundColor: '#dcfce7', border: '2px solid #86efac', minHeight: '88px' }}
        >
          <Phone size={30} color="#16a34a" />
          <span style={{ fontSize: '1rem', fontWeight: 800, color: '#16a34a' }}>📞 Anrufen</span>
        </button>
        <button
          onClick={handleVideo}
          className="flex-1 flex flex-col items-center justify-center gap-2 rounded-2xl active:scale-95 transition-transform"
          style={{ backgroundColor: '#dbeafe', border: '2px solid #93c5fd', minHeight: '88px' }}
        >
          <Video size={30} color="#2563eb" />
          <span style={{ fontSize: '1rem', fontWeight: 800, color: '#2563eb' }}>🎥 Video</span>
        </button>
      </div>

      {/* Foto schicken */}
      <button
        onClick={() => photoInputRef.current?.click()}
        className="w-full flex items-center gap-4 rounded-2xl active:scale-95 transition-transform"
        style={{ backgroundColor: '#fff7ed', border: '2px solid #fed7aa', minHeight: '80px', padding: '0 20px' }}
      >
        <Camera size={28} color="#c2410c" />
        <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#c2410c' }}>📸 Foto schicken</span>
      </button>
      <input ref={photoInputRef} type="file" accept="image/*" capture="environment" onChange={handlePhotoFile} style={{ display: 'none' }} />

      {/* Sprachnachricht */}
      <button
        onPointerDown={startRecording}
        onPointerUp={stopRecording}
        onPointerLeave={recording ? stopRecording : undefined}
        className="w-full flex items-center gap-4 rounded-2xl transition-transform"
        style={{
          backgroundColor: recording ? '#fef2f2' : '#f0fdf4',
          border: `2px solid ${recording ? '#fca5a5' : '#86efac'}`,
          minHeight: '80px',
          padding: '0 20px',
          transform: recording ? 'scale(0.97)' : 'scale(1)',
        }}
      >
        {recording ? <MicOff size={28} color="#dc2626" /> : <Mic size={28} color="#16a34a" />}
        <div className="flex flex-col items-start">
          <span style={{ fontSize: '1.1rem', fontWeight: 800, color: recording ? '#dc2626' : '#16a34a' }}>
            {recording ? '🔴 Aufnahme läuft...' : '🎤 Sprachnachricht'}
          </span>
          <span style={{ fontSize: '0.9rem', color: recording ? '#dc2626' : '#166534' }}>
            {recording ? 'Loslassen zum Senden' : 'Gedrückt halten'}
          </span>
        </div>
      </button>
    </div>
  )
}

export function ContactsScreen({ contacts, onBack }: ContactsScreenProps) {
  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: '#fdf6f0' }}>
      <Header title="👥 Kontakte" onBack={onBack} />
      <div className="flex flex-col gap-4 p-4" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)' }}>
        {contacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <span style={{ fontSize: '4rem' }}>👥</span>
            <p style={{ fontSize: '1.2rem', color: '#6b4a4a', textAlign: 'center', lineHeight: 1.6 }}>
              Noch keine Kontakte.{'\n'}Bitte in den Einstellungen hinzufügen.
            </p>
          </div>
        ) : (
          contacts.sort((a, b) => a.order - b.order).map(c => <ContactCard key={c.id} contact={c} />)
        )}
      </div>
    </div>
  )
}
