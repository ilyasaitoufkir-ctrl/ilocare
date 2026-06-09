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
  const [phase, setPhase] = useState<'idle' | 'listening' | 'thinking' | 'done'>('idle')
  const [statusText, setStatusText] = useState('')
  const [manualInput, setManualInput] = useState('')

  const { extractShoppingItems } = useClaudeAI()

  const handleSpeechResult = useCallback(async (text: string) => {
    setPhase('thinking')
    setStatusText(`🎤 „${text}"`)
    const produkte = await extractShoppingItems(text)
    produkte.forEach(p => onAdd(p))
    setPhase('done')
    setStatusText(`✅ ${produkte.length} Artikel erkannt`)
    setTimeout(() => { setPhase('idle'); setStatusText('') }, 3000)
  }, [extractShoppingItems, onAdd])

  const { start, stop, listening, supported } = useSpeechRecognition(handleSpeechResult)

  function handleMicDown() {
    setPhase('listening')
    setStatusText('')
    start()
  }

  function handleMicUp() {
    stop()
    if (phase === 'listening') setPhase('thinking')
  }

  function addManual() {
    const t = manualInput.trim()
    if (!t) return
    t.split(/[,;]/).map(s => s.trim()).filter(Boolean).forEach(p => onAdd(p))
    setManualInput('')
  }

  function sendSMS() {
    const pending = items.filter(i => !i.done)
    const liste = pending.map(i => `• ${i.text}`).join('\n')
    const text = `🛒 Einkaufsliste:\n\n${liste}\n\nBitte besorgen 🙏`
    window.open(`sms:&body=${encodeURIComponent(text)}`)
  }

  const pendingItems = items.filter(i => !i.done)
  const doneItems = items.filter(i => i.done)

  const micActive = phase === 'listening'
  const micBusy = phase === 'thinking'
  const activeStatus = statusText ? statusText : null

  return (
    <div className="screen">
      <Header title="🛒 Einkaufsliste" onBack={onBack} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '14px 16px', gap: '12px' }}>

        {/* ── Mikrofon Button ───────────────────────────────────────────── */}
        <button
          onPointerDown={handleMicDown}
          onPointerUp={handleMicUp}
          onPointerLeave={listening ? handleMicUp : undefined}
          disabled={micBusy}
          style={{
            flexShrink: 0,
            borderRadius: '28px',
            minHeight: '130px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            background: micActive
              ? 'linear-gradient(135deg, #ef4444, #dc2626)'
              : micBusy
              ? 'linear-gradient(135deg, #fde047, #facc15)'
              : 'linear-gradient(135deg, #2a9d8f, #7ececa)',
            border: 'none',
            boxShadow: micActive
              ? '0 0 0 6px rgba(239,68,68,0.25)'
              : micBusy
              ? '0 0 0 6px rgba(250,204,21,0.25)'
              : '0 6px 24px rgba(42,157,143,0.4)',
            transform: micActive ? 'scale(0.97)' : 'scale(1)',
            transition: 'all 0.15s',
          }}
        >
          <span style={{ fontSize: '3rem', lineHeight: 1 }}>
            {micActive ? '🔴' : micBusy ? '🤖' : '🎤'}
          </span>
          <span style={{ fontSize: '1.3rem', fontWeight: 900, color: micBusy ? '#713f12' : '#fff' }}>
            {micActive ? 'Sprechen...' : micBusy ? 'Einkaufsliste wird erstellt... 🛒' : 'Mikrofon halten'}
          </span>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: micBusy ? '#713f12' : 'rgba(255,255,255,0.85)' }}>
            {micActive
              ? 'Loslassen wenn fertig'
              : micBusy
              ? 'Artikel werden erkannt...'
              : supported
              ? 'Gedrückt halten & sprechen'
              : 'Nur Tipp-Eingabe möglich'}
          </span>
        </button>

        {/* ── Status ───────────────────────────────────────────────────── */}
        {activeStatus && (
          <div style={{
            flexShrink: 0,
            borderRadius: '16px',
            padding: '12px 16px',
            backgroundColor: activeStatus.startsWith('❌') ? '#fef2f2' : phase === 'done' ? '#dcfce7' : '#fef9c3',
            border: `2px solid ${activeStatus.startsWith('❌') ? '#fca5a5' : phase === 'done' ? '#86efac' : '#fde047'}`,
          }}>
            <p style={{ fontSize: '0.95rem', fontWeight: 700, color: activeStatus.startsWith('❌') ? '#dc2626' : phase === 'done' ? '#166534' : '#713f12', margin: 0 }}>
              {activeStatus}
            </p>
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
              flex: 1, borderRadius: '16px', padding: '14px 16px',
              backgroundColor: '#fff', border: '2px solid #7ececa',
              fontSize: '1.1rem', fontWeight: 600, color: '#0d2b27', outline: 'none',
            }}
          />
          <button
            onClick={addManual}
            style={{
              borderRadius: '16px', padding: '0 20px',
              background: 'linear-gradient(135deg, #2a9d8f, #7ececa)',
              fontSize: '1.5rem', minWidth: '60px', minHeight: '56px',
              border: 'none',
            }}
          >
            ➕
          </button>
        </div>

        {/* ── Zusammenfassung ──────────────────────────────────────────── */}
        {items.length > 0 && (
          <div style={{
            flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderRadius: '14px', padding: '10px 16px',
            backgroundColor: 'rgba(255,255,255,0.88)', border: '2px solid #b5e3e3',
          }}>
            <span style={{ fontSize: '1rem', fontWeight: 700, color: '#0d2b27' }}>
              🛒 {pendingItems.length} offen &nbsp;·&nbsp; {doneItems.length} ✅
            </span>
            {doneItems.length > 0 && (
              <button
                onClick={onClearDone}
                style={{ borderRadius: '10px', padding: '6px 14px', background: '#7ececa', border: 'none', fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}
              >
                Erledigte löschen
              </button>
            )}
          </div>
        )}

        {/* ── Liste ────────────────────────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', WebkitOverflowScrolling: 'touch' as const, display: 'flex', flexDirection: 'column', gap: '10px', paddingBottom: '4px' }}>
          {items.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '16px' }}>
              <span style={{ fontSize: '4rem' }}>🛒</span>
              <p style={{ fontSize: '1.15rem', color: '#1a4a44', textAlign: 'center', margin: 0, lineHeight: 1.6, fontWeight: 600 }}>
                Liste ist leer.{'\n'}Mikrofon halten & sprechen!
              </p>
            </div>
          ) : (
            <>
              {pendingItems.map(item => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '14px',
                    borderRadius: '18px', padding: '0 16px', minHeight: '72px',
                    backgroundColor: '#fff',
                    border: '2px solid #b5e3e3',
                    boxShadow: '0 2px 8px rgba(42,157,143,0.08)',
                    flexShrink: 0,
                  }}
                >
                  <button
                    onClick={() => onToggle(item.id)}
                    style={{
                      width: '34px', height: '34px', borderRadius: '50%',
                      border: '3px solid #2a9d8f', flexShrink: 0,
                      backgroundColor: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  />
                  <span
                    onClick={() => onToggle(item.id)}
                    style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0d2b27', flex: 1, textAlign: 'left', cursor: 'pointer' }}
                  >
                    {item.text}
                  </span>
                  <button
                    onClick={() => onDelete(item.id)}
                    style={{ padding: '8px', borderRadius: '12px', backgroundColor: '#fef2f2', flexShrink: 0, border: 'none' }}
                  >
                    <Trash2 size={22} color="#dc2626" />
                  </button>
                </div>
              ))}

              {doneItems.map(item => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '14px',
                    borderRadius: '18px', padding: '0 16px', minHeight: '64px',
                    backgroundColor: '#f0fdf4', border: '2px solid #86efac',
                    opacity: 0.65, flexShrink: 0,
                  }}
                >
                  <button
                    onClick={() => onToggle(item.id)}
                    style={{
                      width: '34px', height: '34px', borderRadius: '50%',
                      backgroundColor: '#4ade80', border: '3px solid #16a34a',
                      flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <Check size={18} color="#fff" />
                  </button>
                  <span
                    onClick={() => onToggle(item.id)}
                    style={{ fontSize: '1.1rem', fontWeight: 600, color: '#166534', flex: 1, textDecoration: 'line-through', textAlign: 'left', cursor: 'pointer' }}
                  >
                    {item.text}
                  </span>
                  <button
                    onClick={() => onDelete(item.id)}
                    style={{ padding: '8px', borderRadius: '12px', backgroundColor: 'transparent', flexShrink: 0, border: 'none' }}
                  >
                    <Trash2 size={18} color="#86efac" />
                  </button>
                </div>
              ))}

              {pendingItems.length === 0 && doneItems.length > 0 && (
                <div style={{ borderRadius: '20px', padding: '24px', textAlign: 'center', backgroundColor: '#dcfce7', border: '3px solid #4ade80', marginTop: '4px' }}>
                  <p style={{ fontSize: '1.3rem', fontWeight: 800, color: '#166534', margin: 0 }}>🎉 Einkauf erledigt!</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Aktions-Buttons ──────────────────────────────────────────── */}
        {pendingItems.length > 0 && (
          <div style={{ flexShrink: 0, display: 'flex', gap: '10px' }}>
            {/* SMS schicken */}
            <button
              onClick={sendSMS}
              style={{
                flex: 1,
                borderRadius: '20px',
                minHeight: '76px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                background: 'linear-gradient(135deg, #52d68a, #16a34a)',
                border: 'none',
                boxShadow: '0 4px 16px rgba(82,214,138,0.4)',
              }}
            >
              <span style={{ fontSize: '1.6rem', lineHeight: 1 }}>💬</span>
              <span style={{ fontSize: '1rem', fontWeight: 900, color: '#fff' }}>Liste</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>per SMS</span>
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
