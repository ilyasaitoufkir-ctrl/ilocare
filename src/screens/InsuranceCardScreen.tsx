import React, { useState, useRef } from 'react'
import { Header } from '../components/Header'
import type { InsuranceCard } from '../types'

interface InsuranceCardScreenProps {
  card: InsuranceCard
  onSave: (card: InsuranceCard) => void
  onBack: () => void
}

type Side = 'front' | 'back'

function CardPhoto({ photo, side, onCapture }: {
  photo: string | null
  side: Side
  onCapture: (data: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const label = side === 'front' ? 'Vorderseite' : 'Rückseite'
  const emoji = side === 'front' ? '🏥' : '🔢'

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => { if (ev.target?.result) onCapture(ev.target.result as string) }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  return (
    <div className="flex flex-col gap-3">
      <p style={{ fontSize: '1.1rem', fontWeight: 800, color: '#2d1a1a', margin: 0 }}>
        {emoji} {label}
      </p>
      <div
        onClick={() => inputRef.current?.click()}
        className="rounded-3xl overflow-hidden flex items-center justify-center"
        style={{
          width: '100%',
          aspectRatio: '1.586',
          backgroundColor: photo ? 'transparent' : '#f8e8e8',
          border: photo ? 'none' : '3px dashed #e8a0a0',
          cursor: 'pointer',
        }}
      >
        {photo ? (
          <img
            src={photo}
            alt={label}
            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '20px' }}
          />
        ) : (
          <div className="flex flex-col items-center gap-3 p-8">
            <span style={{ fontSize: '3rem' }}>📸</span>
            <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#c87070', margin: 0, textAlign: 'center' }}>
              {label} fotografieren
            </p>
          </div>
        )}
      </div>
      <button
        onClick={() => inputRef.current?.click()}
        className="w-full rounded-2xl py-4"
        style={{ backgroundColor: photo ? '#f8e8e8' : '#e8a0a0', border: `2px solid #e8a0a0`, fontSize: '1rem', fontWeight: 700, color: photo ? '#6b4a4a' : '#fff', minHeight: '60px' }}
      >
        {photo ? '🔄 Foto ersetzen' : '📸 Foto aufnehmen'}
      </button>
      <input ref={inputRef} type="file" accept="image/*" capture="environment" onChange={handleFile} style={{ display: 'none' }} />
    </div>
  )
}

export function InsuranceCardScreen({ card, onSave, onBack }: InsuranceCardScreenProps) {
  const [local, setLocal] = useState<InsuranceCard>(card)
  const [showFront, setShowFront] = useState(false)
  const [showBack, setShowBack] = useState(false)
  const [saved, setSaved] = useState(false)

  function handleSave() {
    onSave(local)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  // Full-screen card view (for showing at doctor)
  if (showFront || showBack) {
    const photo = showFront ? local.front : local.back
    const label = showFront ? 'Vorderseite' : 'Rückseite'
    return (
      <div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center"
        style={{ backgroundColor: '#000' }}
        onClick={() => { setShowFront(false); setShowBack(false) }}
      >
        <p style={{ color: '#fff', fontSize: '1rem', marginBottom: '16px', opacity: 0.7 }}>
          Zum Schließen tippen · {label}
        </p>
        {photo ? (
          <img
            src={photo}
            alt={label}
            style={{ width: '95vw', maxWidth: '600px', borderRadius: '20px', objectFit: 'contain' }}
          />
        ) : (
          <p style={{ color: '#fff', fontSize: '1.2rem' }}>Kein Foto gespeichert</p>
        )}
        <p style={{ color: '#fff', fontSize: '1rem', marginTop: '20px', opacity: 0.7 }}>
          👆 Tippen zum Schließen
        </p>
      </div>
    )
  }

  const hasCard = local.front || local.back

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: '#fdf6f0' }}>
      <Header title="💳 Krankenversicherung" onBack={onBack} />

      <div className="flex flex-col gap-5 p-4" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)' }}>

        {/* Karte zeigen Button */}
        {hasCard && (
          <div
            className="rounded-3xl p-5"
            style={{ backgroundColor: '#f8e8e8', border: '3px solid #e8a0a0' }}
          >
            <p style={{ fontSize: '1.1rem', fontWeight: 800, color: '#2d1a1a', margin: '0 0 12px', textAlign: 'center' }}>
              🏥 Beim Arzt zeigen
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowFront(true)}
                className="flex-1 flex flex-col items-center justify-center rounded-2xl active:scale-95 transition-transform"
                style={{ backgroundColor: '#e8a0a0', minHeight: '90px', gap: '6px' }}
              >
                <span style={{ fontSize: '2rem' }}>🏥</span>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: '#fff' }}>Vorderseite</span>
              </button>
              <button
                onClick={() => setShowBack(true)}
                className="flex-1 flex flex-col items-center justify-center rounded-2xl active:scale-95 transition-transform"
                style={{ backgroundColor: '#c87070', minHeight: '90px', gap: '6px' }}
              >
                <span style={{ fontSize: '2rem' }}>🔢</span>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: '#fff' }}>Rückseite</span>
              </button>
            </div>
          </div>
        )}

        {/* Inhaber Name & Nummer */}
        <div className="flex flex-col gap-3">
          <p style={{ fontSize: '1.1rem', fontWeight: 800, color: '#2d1a1a', margin: 0 }}>
            👤 Name & Kartennummer
          </p>
          <input
            type="text"
            value={local.ownerName}
            onChange={e => setLocal(p => ({ ...p, ownerName: e.target.value }))}
            placeholder="Name auf der Karte"
            className="w-full rounded-2xl px-4 py-4"
            style={{ backgroundColor: '#fff', border: '2px solid #e8a0a0', fontSize: '1.1rem', color: '#2d1a1a', outline: 'none' }}
          />
          <input
            type="text"
            value={local.cardNumber}
            onChange={e => setLocal(p => ({ ...p, cardNumber: e.target.value }))}
            placeholder="Kartennummer (optional)"
            className="w-full rounded-2xl px-4 py-4"
            style={{ backgroundColor: '#fff', border: '2px solid #e8d0d0', fontSize: '1.1rem', color: '#2d1a1a', outline: 'none' }}
          />
        </div>

        {/* Fotos */}
        <CardPhoto
          photo={local.front}
          side="front"
          onCapture={data => setLocal(p => ({ ...p, front: data }))}
        />
        <CardPhoto
          photo={local.back}
          side="back"
          onCapture={data => setLocal(p => ({ ...p, back: data }))}
        />

        {/* Speichern */}
        <button
          onClick={handleSave}
          className="w-full rounded-3xl py-5"
          style={{
            backgroundColor: saved ? '#4ade80' : '#e8a0a0',
            fontSize: '1.3rem',
            fontWeight: 900,
            color: saved ? '#14532d' : '#fff',
            minHeight: '80px',
          }}
        >
          {saved ? '✅ Gespeichert!' : '💾 Karte speichern'}
        </button>

        <div className="rounded-2xl px-4 py-3" style={{ backgroundColor: '#f8e8e8', border: '2px solid #e8d0d0' }}>
          <p style={{ fontSize: '0.9rem', color: '#6b4a4a', margin: 0, textAlign: 'center', lineHeight: 1.5 }}>
            🔒 Die Karte wird sicher auf diesem Gerät gespeichert.{'\n'}Kein Upload, keine Cloud.
          </p>
        </div>
      </div>
    </div>
  )
}
