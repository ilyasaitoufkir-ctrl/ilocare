import React from 'react'
import { Phone } from 'lucide-react'
import { Header } from '../components/Header'
import type { Doctor, DoctorType } from '../types'

interface DoctorsScreenProps {
  doctors: Doctor[]
  onBack: () => void
}

const TYPE_CONFIG: Record<DoctorType, { emoji: string; label: string; bg: string; border: string; textColor: string }> = {
  notarzt: { emoji: '🚨', label: 'Notarzt / Notruf', bg: '#fef2f2', border: '#fca5a5', textColor: '#dc2626' },
  hausarzt: { emoji: '👨‍⚕️', label: 'Hausarzt', bg: '#f0fdf4', border: '#86efac', textColor: '#16a34a' },
  apotheke: { emoji: '💊', label: 'Apotheke', bg: '#eff6ff', border: '#93c5fd', textColor: '#2563eb' },
  other: { emoji: '📞', label: 'Kontakt', bg: 'rgba(255,255,255,0.88)', border: '#b5e3e3', textColor: '#1a4a44' },
}

function DoctorCard({ doctor }: { doctor: Doctor }) {
  const cfg = TYPE_CONFIG[doctor.type]
  return (
    <button
      onClick={() => window.location.href = `tel:${doctor.phone}`}
      className="w-full flex items-center gap-5 rounded-3xl active:scale-95 transition-transform shadow-sm"
      style={{ backgroundColor: cfg.bg, border: `3px solid ${cfg.border}`, minHeight: '100px', padding: '0 24px' }}
    >
      <span style={{ fontSize: '3rem', lineHeight: 1 }}>{cfg.emoji}</span>
      <div className="flex flex-col items-start flex-1">
        <span style={{ fontSize: '0.9rem', fontWeight: 700, color: cfg.textColor, textTransform: 'uppercase', letterSpacing: '1px' }}>
          {cfg.label}
        </span>
        <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0d2b27', marginTop: '2px' }}>
          {doctor.name}
        </span>
        <span style={{ fontSize: '1.1rem', color: cfg.textColor, marginTop: '2px', fontWeight: 600 }}>
          📞 {doctor.phone}
        </span>
      </div>
      <div
        className="rounded-full flex items-center justify-center flex-shrink-0"
        style={{ width: '60px', height: '60px', backgroundColor: cfg.border }}
      >
        <Phone size={28} color={cfg.textColor} />
      </div>
    </button>
  )
}

export function DoctorsScreen({ doctors, onBack }: DoctorsScreenProps) {
  // Sort: notarzt first, then hausarzt, apotheke, other
  const order: DoctorType[] = ['notarzt', 'hausarzt', 'apotheke', 'other']
  const sorted = [...doctors].sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type))

  return (
    <div className="screen">
      <Header title="👨‍⚕️ Ärzte & Notfall" onBack={onBack} />

      <div className="scroll-zone" style={{ padding: '12px 16px', paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {sorted.map(doc => <DoctorCard key={doc.id} doctor={doc} />)}

        {doctors.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <span style={{ fontSize: '4rem' }}>👨‍⚕️</span>
            <p style={{ fontSize: '1.2rem', color: '#1a4a44', textAlign: 'center', lineHeight: 1.6 }}>
              Noch keine Ärzte eingetragen.{'\n'}In den Einstellungen hinzufügen.
            </p>
          </div>
        )}

        <div className="rounded-2xl px-4 py-3 mt-2" style={{ backgroundColor: 'rgba(255,255,255,0.88)', border: '2px solid #b5e3e3' }}>
          <p style={{ fontSize: '0.95rem', color: '#1a4a44', margin: 0, textAlign: 'center', lineHeight: 1.5 }}>
            Einfach auf den Arzt tippen → direkt anrufen.{'\n'}
            Ärzte in Einstellungen ⚙️ hinzufügen.
          </p>
        </div>
      </div>
    </div>
  )
}
