import React from 'react'
import { Phone, Video, MessageCircle } from 'lucide-react'
import { Header } from '../components/Header'
import type { Contact, Screen } from '../types'

interface ContactsScreenProps {
  contacts: Contact[]
  onBack: () => void
  onNavigate: (screen: Screen, contactId?: string) => void
}

function ContactCard({ contact, onNavigate }: { contact: Contact; onNavigate: (screen: Screen, id?: string) => void }) {
  function handleCall() {
    if (contact.phone) {
      window.location.href = `tel:${contact.phone}`
    }
  }

  function handleVideo() {
    if (contact.phone) {
      window.location.href = `facetime:${contact.phone}`
    }
  }

  return (
    <div
      className="rounded-3xl p-6 flex flex-col items-center gap-4 shadow-md"
      style={{ backgroundColor: '#ffffff', border: '2px solid #e8d0d0' }}
    >
      {/* Foto & Name */}
      <div className="flex flex-col items-center gap-3">
        <div
          className="rounded-full overflow-hidden flex items-center justify-center"
          style={{ width: '110px', height: '110px', backgroundColor: '#f8e8e8', border: '4px solid #e8a0a0' }}
        >
          {contact.photo ? (
            <img src={contact.photo} alt={contact.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontSize: '3.5rem' }}>👤</span>
          )}
        </div>
        <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#2d1a1a', margin: 0 }}>
          {contact.name}
        </p>
        {contact.isEmergency && (
          <span
            className="px-3 py-1 rounded-full"
            style={{ backgroundColor: '#fef2f2', color: '#dc2626', fontSize: '0.9rem', fontWeight: 700, border: '1px solid #fca5a5' }}
          >
            🚨 Notfallkontakt
          </span>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 w-full">
        <button
          onClick={handleCall}
          className="flex-1 flex flex-col items-center justify-center rounded-2xl py-4 gap-2 active:scale-95 transition-transform"
          style={{ backgroundColor: '#dcfce7', border: '2px solid #86efac', minHeight: '80px' }}
        >
          <Phone size={28} color="#16a34a" />
          <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#16a34a' }}>Anrufen</span>
        </button>
        <button
          onClick={handleVideo}
          className="flex-1 flex flex-col items-center justify-center rounded-2xl py-4 gap-2 active:scale-95 transition-transform"
          style={{ backgroundColor: '#dbeafe', border: '2px solid #93c5fd', minHeight: '80px' }}
        >
          <Video size={28} color="#2563eb" />
          <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#2563eb' }}>Video</span>
        </button>
        <button
          onClick={() => onNavigate('messages', contact.id)}
          className="flex-1 flex flex-col items-center justify-center rounded-2xl py-4 gap-2 active:scale-95 transition-transform"
          style={{ backgroundColor: '#f3e8ff', border: '2px solid #c4b5fd', minHeight: '80px' }}
        >
          <MessageCircle size={28} color="#7c3aed" />
          <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#7c3aed' }}>Nachricht</span>
        </button>
      </div>
    </div>
  )
}

export function ContactsScreen({ contacts, onBack, onNavigate }: ContactsScreenProps) {
  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: '#fdf6f0' }}>
      <Header title="👥 Kontakte" onBack={onBack} />

      <div className="flex flex-col gap-4 p-4" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)' }}>
        {contacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <span style={{ fontSize: '4rem' }}>👥</span>
            <p style={{ fontSize: '1.2rem', color: '#6b4a4a', textAlign: 'center' }}>
              Noch keine Kontakte.{'\n'}Bitte in Einstellungen hinzufügen.
            </p>
          </div>
        ) : (
          contacts
            .sort((a, b) => a.order - b.order)
            .map(contact => (
              <ContactCard key={contact.id} contact={contact} onNavigate={onNavigate} />
            ))
        )}
      </div>
    </div>
  )
}
