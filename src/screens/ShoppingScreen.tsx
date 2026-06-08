import React, { useState, useCallback } from 'react'
import { Trash2, Check } from 'lucide-react'
import { Header } from '../components/Header'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'
import type { ShoppingItem } from '../types'

interface ShoppingScreenProps {
  items: ShoppingItem[]
  onAdd: (text: string) => void
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onClearDone: () => void
  onBack: () => void
}

function parseItems(text: string): string[] {
  // Split on comma, "und", newline
  return text
    .split(/[,\n]|(?:\s+und\s+)/i)
    .map(s => s.trim())
    .filter(s => s.length > 0)
}

export function ShoppingScreen({ items, onAdd, onToggle, onDelete, onClearDone, onBack }: ShoppingScreenProps) {
  const [manualInput, setManualInput] = useState('')
  const [lastRecognized, setLastRecognized] = useState<string | null>(null)

  const handleSpeech = useCallback((text: string) => {
    setLastRecognized(text)
    const parsed = parseItems(text)
    parsed.forEach(item => onAdd(item))
  }, [onAdd])

  const { start, stop, listening, supported } = useSpeechRecognition(handleSpeech)

  function addManual() {
    const trimmed = manualInput.trim()
    if (!trimmed) return
    parseItems(trimmed).forEach(item => onAdd(item))
    setManualInput('')
  }

  const pendingItems = items.filter(i => !i.done)
  const doneItems = items.filter(i => i.done)

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: '#fdf6f0' }}>
      <Header title="🛒 Einkaufsliste" onBack={onBack} />

      <div className="flex flex-col gap-4 p-4" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)' }}>

        {/* Mikrofon Button */}
        {supported ? (
          <button
            onPointerDown={start}
            onPointerUp={stop}
            onPointerLeave={listening ? stop : undefined}
            className="w-full flex flex-col items-center justify-center rounded-3xl transition-all"
            style={{
              backgroundColor: listening ? '#fef2f2' : '#f0fdf4',
              border: `4px solid ${listening ? '#ef4444' : '#4ade80'}`,
              minHeight: '130px',
              padding: '20px',
              transform: listening ? 'scale(0.97)' : 'scale(1)',
            }}
          >
            <span style={{ fontSize: '3.5rem', lineHeight: 1 }}>{listening ? '🔴' : '🎤'}</span>
            <span style={{ fontSize: '1.4rem', fontWeight: 900, color: listening ? '#dc2626' : '#16a34a', marginTop: '10px' }}>
              {listening ? 'Zuhören...' : 'Sprechen'}
            </span>
            <span style={{ fontSize: '1rem', color: listening ? '#dc2626' : '#166534', marginTop: '4px' }}>
              {listening ? 'Loslassen wenn fertig' : 'Gedrückt halten & sprechen'}
            </span>
          </button>
        ) : (
          <div className="rounded-3xl p-5 text-center" style={{ backgroundColor: '#fef3c7', border: '2px solid #fcd34d' }}>
            <p style={{ fontSize: '1.1rem', color: '#92400e', margin: 0 }}>
              🎤 Spracherkennung nicht verfügbar.{'\n'}Bitte manuell eingeben.
            </p>
          </div>
        )}

        {/* Erkannter Text */}
        {lastRecognized && (
          <div className="rounded-2xl px-4 py-3" style={{ backgroundColor: '#f0fdf4', border: '2px solid #86efac' }}>
            <p style={{ fontSize: '1rem', color: '#166534', margin: 0 }}>
              🎤 Erkannt: „{lastRecognized}"
            </p>
          </div>
        )}

        {/* Manuelle Eingabe */}
        <div className="flex gap-3">
          <input
            type="text"
            value={manualInput}
            onChange={e => setManualInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addManual()}
            placeholder="Artikel eingeben..."
            className="flex-1 rounded-2xl px-4 py-4"
            style={{ backgroundColor: '#fff', border: '2px solid #e8a0a0', fontSize: '1.1rem', color: '#2d1a1a', outline: 'none' }}
          />
          <button
            onClick={addManual}
            className="rounded-2xl px-5"
            style={{ backgroundColor: '#e8a0a0', fontSize: '1.5rem', minHeight: '60px', minWidth: '60px' }}
          >
            ➕
          </button>
        </div>

        {/* Zusammenfassung */}
        {items.length > 0 && (
          <div className="flex items-center justify-between rounded-2xl px-4 py-3" style={{ backgroundColor: '#f8e8e8', border: '2px solid #e8d0d0' }}>
            <p style={{ fontSize: '1rem', fontWeight: 700, color: '#2d1a1a', margin: 0 }}>
              🛒 {pendingItems.length} offen · {doneItems.length} erledigt
            </p>
            {doneItems.length > 0 && (
              <button
                onClick={onClearDone}
                className="rounded-xl px-3 py-2"
                style={{ backgroundColor: '#e8a0a0', fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}
              >
                Erledigte löschen
              </button>
            )}
          </div>
        )}

        {/* Liste leer */}
        {items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <span style={{ fontSize: '4rem' }}>🛒</span>
            <p style={{ fontSize: '1.2rem', color: '#6b4a4a', textAlign: 'center', lineHeight: 1.6 }}>
              Liste ist leer.{'\n'}Einfach sprechen oder tippen!
            </p>
          </div>
        )}

        {/* Offene Items */}
        {pendingItems.map(item => (
          <button
            key={item.id}
            onClick={() => onToggle(item.id)}
            className="w-full flex items-center gap-4 rounded-2xl px-5 active:scale-95 transition-transform"
            style={{ backgroundColor: '#ffffff', border: '2px solid #e8d0d0', minHeight: '80px' }}
          >
            <div className="rounded-full flex items-center justify-center flex-shrink-0"
              style={{ width: '36px', height: '36px', border: '3px solid #e8a0a0' }} />
            <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#2d1a1a', flex: 1, textAlign: 'left' }}>
              {item.text}
            </span>
            <button
              onClick={e => { e.stopPropagation(); onDelete(item.id) }}
              className="rounded-xl p-3"
              style={{ backgroundColor: '#fef2f2' }}
            >
              <Trash2 size={20} color="#dc2626" />
            </button>
          </button>
        ))}

        {/* Erledigte Items */}
        {doneItems.map(item => (
          <button
            key={item.id}
            onClick={() => onToggle(item.id)}
            className="w-full flex items-center gap-4 rounded-2xl px-5 active:scale-95 transition-transform"
            style={{ backgroundColor: '#f0fdf4', border: '2px solid #86efac', minHeight: '72px', opacity: 0.75 }}
          >
            <div className="rounded-full flex items-center justify-center flex-shrink-0"
              style={{ width: '36px', height: '36px', backgroundColor: '#4ade80', border: '3px solid #16a34a' }}>
              <Check size={20} color="#fff" />
            </div>
            <span style={{ fontSize: '1.2rem', fontWeight: 600, color: '#6b4a4a', flex: 1, textAlign: 'left', textDecoration: 'line-through' }}>
              {item.text}
            </span>
            <button
              onClick={e => { e.stopPropagation(); onDelete(item.id) }}
              className="rounded-xl p-3"
              style={{ backgroundColor: 'transparent' }}
            >
              <Trash2 size={20} color="#86efac" />
            </button>
          </button>
        ))}

        {/* Liste fertig Button */}
        {pendingItems.length === 0 && items.length > 0 && (
          <div className="rounded-3xl py-5 text-center" style={{ backgroundColor: '#dcfce7', border: '3px solid #4ade80' }}>
            <p style={{ fontSize: '1.3rem', fontWeight: 800, color: '#166534', margin: 0 }}>
              🎉 Einkauf erledigt!
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
