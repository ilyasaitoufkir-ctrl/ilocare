import React, { useRef, useState } from 'react'
import { Camera, Video, Mic, MicOff, Send, CheckCircle } from 'lucide-react'
import { Header } from '../components/Header'
import type { Contact } from '../types'

interface MessagesScreenProps {
  contacts: Contact[]
  initialContactId?: string | null
  onBack: () => void
}

type MessageType = 'photo' | 'video' | 'voice'

interface SentMessage {
  type: MessageType
  contactName: string
  timestamp: Date
}

export function MessagesScreen({ contacts, initialContactId, onBack }: MessagesScreenProps) {
  const [selectedContact, setSelectedContact] = useState<Contact | null>(
    initialContactId ? (contacts.find(c => c.id === initialContactId) ?? null) : null
  )
  const [sent, setSent] = useState<SentMessage | null>(null)
  const [recording, setRecording] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)

  const photoInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  function showSent(type: MessageType) {
    setSent({ type, contactName: selectedContact!.name, timestamp: new Date() })
    setTimeout(() => setSent(null), 3000)
  }

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.[0]) showSent('photo')
    e.target.value = ''
  }

  function handleVideo(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.[0]) showSent('video')
    e.target.value = ''
  }

  async function handleVoiceStart() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      const chunks: BlobPart[] = []
      mr.ondataavailable = e => chunks.push(e.data)
      mr.onstop = () => {
        stream.getTracks().forEach(t => t.stop())
        showSent('voice')
      }
      mr.start()
      setMediaRecorder(mr)
      setRecording(true)
    } catch {
      alert('Mikrofon Zugriff nicht erlaubt')
    }
  }

  function handleVoiceStop() {
    mediaRecorder?.stop()
    setMediaRecorder(null)
    setRecording(false)
  }

  const typeLabels: Record<MessageType, string> = {
    photo: '📸 Foto gesendet',
    video: '🎥 Video gesendet',
    voice: '🎤 Sprachnachricht gesendet',
  }

  if (!selectedContact) {
    return (
      <div className="screen">
        <Header title="💬 Nachrichten" onBack={onBack} />
        <div className="scroll-zone" style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p style={{ fontSize: '1.1rem', color: '#6b4a4a', textAlign: 'center', padding: '8px 0' }}>
            Wen möchtest du anschreiben?
          </p>
          {contacts.map(contact => (
            <button
              key={contact.id}
              onClick={() => setSelectedContact(contact)}
              className="flex items-center gap-4 rounded-3xl p-5 active:scale-95 transition-transform"
              style={{ backgroundColor: '#ffffff', border: '2px solid #e8d0d0', minHeight: '90px' }}
            >
              <div
                className="rounded-full overflow-hidden flex items-center justify-center flex-shrink-0"
                style={{ width: '70px', height: '70px', backgroundColor: '#f8e8e8', border: '3px solid #e8a0a0' }}
              >
                {contact.photo ? (
                  <img src={contact.photo} alt={contact.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: '2rem' }}>👤</span>
                )}
              </div>
              <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#2d1a1a' }}>{contact.name}</span>
            </button>
          ))}
          {contacts.length === 0 && (
            <p style={{ fontSize: '1.2rem', color: '#6b4a4a', textAlign: 'center', padding: '32px 0' }}>
              Bitte zuerst Kontakte hinzufügen.
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="screen">
      <Header
        title={`💬 ${selectedContact.name}`}
        onBack={() => setSelectedContact(null)}
      />

      {/* Hidden file inputs */}
      <input ref={photoInputRef} type="file" accept="image/*" capture="environment" onChange={handlePhoto} style={{ display: 'none' }} />
      <input ref={videoInputRef} type="file" accept="video/*" capture="environment" onChange={handleVideo} style={{ display: 'none' }} />

      {/* Kontakt oben */}
      <div className="flex flex-col items-center py-4 gap-2" style={{ backgroundColor: '#f8e8e8', flexShrink: 0 }}>
        <div
          className="rounded-full overflow-hidden flex items-center justify-center"
          style={{ width: '80px', height: '80px', backgroundColor: '#ffffff', border: '4px solid #e8a0a0' }}
        >
          {selectedContact.photo ? (
            <img src={selectedContact.photo} alt={selectedContact.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontSize: '2.5rem' }}>👤</span>
          )}
        </div>
        <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#2d1a1a', margin: 0 }}>
          {selectedContact.name}
        </p>
      </div>

      {/* Erfolgs-Banner */}
      {sent && (
        <div
          className="mx-4 mt-4 rounded-2xl p-4 flex items-center gap-3"
          style={{ backgroundColor: '#dcfce7', border: '2px solid #86efac' }}
        >
          <CheckCircle size={28} color="#16a34a" />
          <p style={{ fontSize: '1.2rem', fontWeight: 700, color: '#16a34a', margin: 0 }}>
            {typeLabels[sent.type]} an {sent.contactName}!
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="scroll-zone" style={{ padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Foto */}
        <button
          onClick={() => photoInputRef.current?.click()}
          className="w-full flex items-center gap-5 rounded-3xl active:scale-95 transition-transform"
          style={{ backgroundColor: '#fff7ed', border: '3px solid #fed7aa', minHeight: '100px', padding: '0 28px' }}
        >
          <Camera size={40} color="#c2410c" />
          <div className="flex flex-col items-start">
            <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#2d1a1a' }}>📸 Foto schicken</span>
            <span style={{ fontSize: '1rem', color: '#9a3412' }}>Kamera öffnen</span>
          </div>
        </button>

        {/* Video */}
        <button
          onClick={() => videoInputRef.current?.click()}
          className="w-full flex items-center gap-5 rounded-3xl active:scale-95 transition-transform"
          style={{ backgroundColor: '#eff6ff', border: '3px solid #bfdbfe', minHeight: '100px', padding: '0 28px' }}
        >
          <Video size={40} color="#1d4ed8" />
          <div className="flex flex-col items-start">
            <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#2d1a1a' }}>🎥 Video schicken</span>
            <span style={{ fontSize: '1rem', color: '#1e40af' }}>Kamera öffnen</span>
          </div>
        </button>

        {/* Sprachnachricht */}
        <button
          onPointerDown={handleVoiceStart}
          onPointerUp={handleVoiceStop}
          onPointerLeave={recording ? handleVoiceStop : undefined}
          className="w-full flex items-center gap-5 rounded-3xl transition-transform"
          style={{
            backgroundColor: recording ? '#fef2f2' : '#f0fdf4',
            border: `3px solid ${recording ? '#fca5a5' : '#86efac'}`,
            minHeight: '100px',
            padding: '0 28px',
            transform: recording ? 'scale(0.97)' : 'scale(1)',
          }}
        >
          {recording ? <MicOff size={40} color="#dc2626" /> : <Mic size={40} color="#16a34a" />}
          <div className="flex flex-col items-start">
            <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#2d1a1a' }}>
              {recording ? '🔴 Aufnahme läuft...' : '🎤 Sprachnachricht'}
            </span>
            <span style={{ fontSize: '1rem', color: recording ? '#dc2626' : '#166534' }}>
              {recording ? 'Loslassen zum Senden' : 'Gedrückt halten'}
            </span>
          </div>
        </button>
      </div>
    </div>
  )
}
