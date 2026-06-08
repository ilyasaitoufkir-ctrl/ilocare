import React, { useState, useCallback } from 'react'
import { Trash2, Check } from 'lucide-react'
import { Header } from '../components/Header'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'
import { useClaudeAI } from '../hooks/useClaudeAI'
import type { ShoppingItem } from '../types'

interface ShoppingScreenProps {
  items: ShoppingItem[]
  onAdd: (text: string) => void
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onClearDone: () => void
  onBack: () => void
}

export function ShoppingScreen({ items, onAdd, onToggle, onDelete, onClearDone, onBack }: ShoppingScreenProps) {
  const [transcript, setTranscript] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [aiStatus, setAiStatus] = useState<string | null>(null)
  const [manualInput, setManualInput] = useState('')

  const { extractShoppingItems, loading: aiLoading } = useClaudeAI()

  const handleSpeechResult = useCallback(async (text: string) => {
    setTranscript(text)
    setProcessing(true)
    setAiStatus('🤖 Claude erkennt Artikel...')
    const extracted = await extractShoppingItems(text)
    extracted.forEach(item => onAdd(item))
    setAiStatus(`✅ ${extracted.length} Artikel erkannt`)
    setProcessing(false)
    setTimeout(() => { setAiStatus(null); setTranscript(null) }, 3000)
  }, [extractShoppingItems, onAdd])

  const { start, stop, listening, supported } = useSpeechRecognition(handleSpeechResult)

  function addManual() {
    const t = manualInput.trim()
    if (!t) return
    t.split(/[,;]/).map(s => s.trim()).filter(Boolean).forEach(item => onAdd(item))
    setManualInput('')
  }

  const pendingItems = items.filter(i => !i.done)
  const doneItems   = items.filter(i => i.done)
  const isLoading   = listening || processing || aiLoading

  return (
    <div className="screen">
      <Header title="🛒 Einkaufsliste" onBack={onBack} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '12px 16px', gap: '10px' }}>

        {/* ── Mikrofon (Claude AI) ─────────────────────────────────────── */}
        <button
          onPointerDown={start}
          onPointerUp={stop}
          onPointerLeave={listening ? stop : undefined}
          disabled={processing || aiLoading}
          style={{
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '24px',
            minHeight: '110px',
            backgroundColor: listening ? '#fef2f2' : processing ? '#fef9c3' : '#f0fdf4',
            border: `4px solid ${listening ? '#ef4444' : processing ? '#fde047' : '#4ade80'}`,
            gap: '6px',
            transition: 'all 0.15s',
            transform: listening ? 'scale(0.97)' : 'scale(1)',
          }}
        >
          <span style={{ fontSize: '2.8rem', lineHeight: 1 }}>
            {listening ? '🔴' : processing ? '🤖' : '🎤'}
          </span>
          <span style={{ fontSize: '1.2rem', fontWeight: 900, color: listening ? '#dc2626' : processing ? '#92400e' : '#16a34a' }}>
            {listening ? 'Sprechen...' : processing ? 'Claude denkt...' : 'Sprechen & Claude erkennt'}
          </span>
          <span style={{ fontSize: '0.85rem', color: listening ? '#dc2626' : '#6b4a4a', fontWeight: 600 }}>
            {listening ? 'Loslassen wenn fertig' : !supported ? '(nur manuelle Eingabe)' : 'Gedrückt halten'}
          </span>
        </button>

        {/* ── Status ───────────────────────────────────────────────────── */}
        {(transcript || aiStatus) && (
          <div style={{ flexShrink: 0, borderRadius: '14px', padding: '10px 14px', backgroundColor: '#f0fdf4', border: '2px solid #86efac' }}>
            {transcript && <p style={{ fontSize: '0.95rem', color: '#166534', margin: '0 0 2px', fontWeight: 700 }}>🎤 „{transcript}"</p>}
            {aiStatus   && <p style={{ fontSize: '0.95rem', color: '#166534', margin: 0, fontWeight: 700 }}>{aiStatus}</p>}
          </div>
        )}

        {/* ── Manuelle Eingabe ─────────────────────────────────────────── */}
        <div style={{ flexShrink: 0, display: 'flex', gap: '8px' }}>
          <input
            type="text"
            value={manualInput}
            onChange={e => setManualInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addManual()}
            placeholder="Artikel tippen..."
            style={{
              flex: 1, borderRadius: '16px', padding: '12px 16px',
              backgroundColor: '#fff', border: '2px solid #e8a0a0',
              fontSize: '1.1rem', fontWeight: 600, color: '#2d1a1a', outline: 'none',
            }}
          />
          <button
            onClick={addManual}
            style={{ borderRadius: '16px', padding: '0 18px', backgroundColor: '#e8a0a0', fontSize: '1.4rem', minWidth: '56px', minHeight: '56px' }}
          >
            ➕
          </button>
        </div>

        {/* ── Zusammenfassung ─────────────────────────────────────────── */}
        {items.length > 0 && (
          <div style={{
            flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderRadius: '14px', padding: '10px 14px',
            backgroundColor: '#f8e8e8', border: '2px solid #e8d0d0',
          }}>
            <span style={{ fontSize: '1rem', fontWeight: 700, color: '#2d1a1a' }}>
              🛒 {pendingItems.length} offen · {doneItems.length} ✅
            </span>
            {doneItems.length > 0 && (
              <button onClick={onClearDone} style={{ borderRadius: '10px', padding: '6px 12px', backgroundColor: '#e8a0a0', fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>
                Erledigte löschen
              </button>
            )}
          </div>
        )}

        {/* ── Liste ────────────────────────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', WebkitOverflowScrolling: 'touch' as const, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {items.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '12px' }}>
              <span style={{ fontSize: '3.5rem' }}>🛒</span>
              <p style={{ fontSize: '1.1rem', color: '#6b4a4a', textAlign: 'center', margin: 0, lineHeight: 1.5 }}>
                Liste ist leer.{'\n'}Sprechen oder tippen!
              </p>
            </div>
          ) : (
            <>
              {pendingItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => onToggle(item.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    borderRadius: '16px', padding: '0 16px', minHeight: '68px',
                    backgroundColor: '#fff', border: '2px solid #e8d0d0',
                    textAlign: 'left', width: '100%', flexShrink: 0,
                  }}
                >
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '3px solid #e8a0a0', flexShrink: 0 }} />
                  <span style={{ fontSize: '1.15rem', fontWeight: 700, color: '#2d1a1a', flex: 1 }}>{item.text}</span>
                  <button onClick={e => { e.stopPropagation(); onDelete(item.id) }} style={{ padding: '8px', borderRadius: '10px', backgroundColor: '#fef2f2', flexShrink: 0 }}>
                    <Trash2 size={20} color="#dc2626" />
                  </button>
                </button>
              ))}
              {doneItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => onToggle(item.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    borderRadius: '16px', padding: '0 16px', minHeight: '60px',
                    backgroundColor: '#f0fdf4', border: '2px solid #86efac',
                    opacity: 0.7, textAlign: 'left', width: '100%', flexShrink: 0,
                  }}
                >
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#4ade80', border: '3px solid #16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Check size={18} color="#fff" />
                  </div>
                  <span style={{ fontSize: '1.1rem', fontWeight: 600, color: '#6b4a4a', flex: 1, textDecoration: 'line-through' }}>{item.text}</span>
                  <button onClick={e => { e.stopPropagation(); onDelete(item.id) }} style={{ padding: '8px', borderRadius: '10px', backgroundColor: 'transparent', flexShrink: 0 }}>
                    <Trash2 size={18} color="#86efac" />
                  </button>
                </button>
              ))}
              {pendingItems.length === 0 && doneItems.length > 0 && (
                <div style={{ borderRadius: '20px', padding: '20px', textAlign: 'center', backgroundColor: '#dcfce7', border: '3px solid #4ade80', marginTop: '8px' }}>
                  <p style={{ fontSize: '1.2rem', fontWeight: 800, color: '#166534', margin: 0 }}>🎉 Einkauf erledigt!</p>
                </div>
              )}
            </>
          )}
        </div>
        {/* Allow scroll only in the list */}
      </div>
    </div>
  )
}
