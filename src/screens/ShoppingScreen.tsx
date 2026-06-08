import React, { useState, useCallback } from 'react'
import { Trash2, Check, X } from 'lucide-react'
import { Header } from '../components/Header'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'
import { useClaudeAI } from '../hooks/useClaudeAI'
import { usePicnic } from '../hooks/usePicnic'
import type { ShoppingItem, Contact } from '../types'

interface ShoppingScreenProps {
  items: ShoppingItem[]
  contacts: Contact[]
  userName: string
  picnicEmail: string
  picnicPassword: string
  onAdd: (text: string) => void
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onClearDone: () => void
  onBack: () => void
}

function ContactPicker({ contacts, onSelect, onClose }: {
  contacts: Contact[]
  onSelect: (phone: string, name: string) => void
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-end p-4"
      style={{ backgroundColor: 'rgba(13,43,39,0.65)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full rounded-3xl overflow-hidden" style={{ maxWidth: '420px', backgroundColor: '#fff', boxShadow: '0 16px 48px rgba(42,157,143,0.3)' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ background: 'linear-gradient(135deg, #1e8c7e, #2a9d8f)' }}>
          <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>📱 An wen schicken?</span>
          <button onClick={onClose} className="flex items-center justify-center rounded-full" style={{ width: '36px', height: '36px', backgroundColor: 'rgba(255,255,255,0.22)' }}>
            <X size={20} color="#fff" />
          </button>
        </div>
        <div className="flex flex-col gap-2 p-4">
          {contacts.filter(c => c.phone).map(c => (
            <button key={c.id} onClick={() => onSelect(c.phone, c.name)}
              className="flex items-center gap-3 rounded-2xl px-4 active:scale-95 transition-transform"
              style={{ backgroundColor: '#f0fdf4', border: '2px solid #86efac', minHeight: '72px' }}>
              <div className="rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center" style={{ width: '48px', height: '48px', backgroundColor: '#fff', border: '2px solid #7ececa' }}>
                {c.photo ? <img src={c.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '1.4rem' }}>👤</span>}
              </div>
              <div className="flex flex-col items-start">
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0d2b27' }}>{c.name}</span>
                <span style={{ fontSize: '0.9rem', color: '#2a9d8f' }}>{c.phone}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export function ShoppingScreen({ items, contacts, userName, picnicEmail, picnicPassword, onAdd, onToggle, onDelete, onClearDone, onBack }: ShoppingScreenProps) {
  const [transcript, setTranscript] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [aiStatus, setAiStatus] = useState<string | null>(null)
  const [manualInput, setManualInput] = useState('')
  const [showContactPicker, setShowContactPicker] = useState(false)

  const { extractShoppingItems, loading: aiLoading } = useClaudeAI()
  const { orderItems, loading: picnicLoading, status: picnicStatus } = usePicnic(picnicEmail, picnicPassword)

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

  function handleSendSMS(phone: string, name: string) {
    setShowContactPicker(false)
    const pendingTexts = items.filter(i => !i.done).map(i => `• ${i.text}`)
    const liste = pendingTexts.join('\n')
    const text = `🛒 Einkaufsliste von ${userName}:\n\n${liste}\n\nBitte besorgen 🙏`
    window.open(`sms:${phone}&body=${encodeURIComponent(text)}`)
  }

  function handleSMSButton() {
    const withPhone = contacts.filter(c => c.phone)
    if (withPhone.length === 0) {
      alert('Keine Kontakte mit Telefonnummer vorhanden.')
      return
    }
    if (withPhone.length === 1) {
      handleSendSMS(withPhone[0].phone, withPhone[0].name)
      return
    }
    setShowContactPicker(true)
  }

  const pendingItems = items.filter(i => !i.done)
  const doneItems   = items.filter(i => i.done)
  const isLoading   = listening || processing || aiLoading

  const activeStatus = picnicStatus || aiStatus

  return (
    <div className="screen">
      {showContactPicker && (
        <ContactPicker
          contacts={contacts}
          onSelect={handleSendSMS}
          onClose={() => setShowContactPicker(false)}
        />
      )}

      <Header title="🛒 Einkaufsliste" onBack={onBack} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '12px 16px', gap: '10px' }}>

        {/* ── Mikrofon ─────────────────────────────────────────────────────── */}
        <button
          onPointerDown={start}
          onPointerUp={stop}
          onPointerLeave={listening ? stop : undefined}
          disabled={processing || aiLoading}
          style={{
            flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            borderRadius: '24px', minHeight: '100px',
            backgroundColor: listening ? '#fef2f2' : processing ? '#fef9c3' : '#f0fdf4',
            border: `4px solid ${listening ? '#ef4444' : processing ? '#fde047' : '#4ade80'}`,
            gap: '6px', transition: 'all 0.15s',
            transform: listening ? 'scale(0.97)' : 'scale(1)',
          }}
        >
          <span style={{ fontSize: '2.4rem', lineHeight: 1 }}>
            {listening ? '🔴' : processing ? '🤖' : '🎤'}
          </span>
          <span style={{ fontSize: '1.1rem', fontWeight: 900, color: listening ? '#dc2626' : processing ? '#92400e' : '#16a34a' }}>
            {listening ? 'Sprechen...' : processing ? 'Claude denkt...' : 'Sprechen & Claude erkennt'}
          </span>
          <span style={{ fontSize: '0.8rem', color: listening ? '#dc2626' : '#1a4a44', fontWeight: 600 }}>
            {listening ? 'Loslassen wenn fertig' : !supported ? '(nur manuelle Eingabe)' : 'Gedrückt halten'}
          </span>
        </button>

        {/* ── Status ───────────────────────────────────────────────────────── */}
        {(transcript || activeStatus) && (
          <div style={{ flexShrink: 0, borderRadius: '14px', padding: '10px 14px', backgroundColor: picnicStatus ? '#fef9c3' : '#f0fdf4', border: `2px solid ${picnicStatus ? '#fde047' : '#86efac'}` }}>
            {transcript && <p style={{ fontSize: '0.95rem', color: '#166534', margin: '0 0 2px', fontWeight: 700 }}>🎤 „{transcript}"</p>}
            {activeStatus && <p style={{ fontSize: '0.95rem', color: '#166534', margin: 0, fontWeight: 700 }}>{activeStatus}</p>}
          </div>
        )}

        {/* ── Manuelle Eingabe ─────────────────────────────────────────────── */}
        <div style={{ flexShrink: 0, display: 'flex', gap: '8px' }}>
          <input
            type="text"
            value={manualInput}
            onChange={e => setManualInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addManual()}
            placeholder="Artikel tippen..."
            style={{
              flex: 1, borderRadius: '16px', padding: '12px 16px',
              backgroundColor: '#fff', border: '2px solid #7ececa',
              fontSize: '1.1rem', fontWeight: 600, color: '#0d2b27', outline: 'none',
            }}
          />
          <button
            onClick={addManual}
            style={{ borderRadius: '16px', padding: '0 18px', backgroundColor: '#7ececa', fontSize: '1.4rem', minWidth: '56px', minHeight: '56px' }}
          >
            ➕
          </button>
        </div>

        {/* ── Zusammenfassung ─────────────────────────────────────────────── */}
        {items.length > 0 && (
          <div style={{
            flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderRadius: '14px', padding: '8px 14px',
            backgroundColor: 'rgba(255,255,255,0.88)', border: '2px solid #b5e3e3',
          }}>
            <span style={{ fontSize: '1rem', fontWeight: 700, color: '#0d2b27' }}>
              🛒 {pendingItems.length} offen · {doneItems.length} ✅
            </span>
            {doneItems.length > 0 && (
              <button onClick={onClearDone} style={{ borderRadius: '10px', padding: '5px 10px', backgroundColor: '#7ececa', fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>
                Erledigte löschen
              </button>
            )}
          </div>
        )}

        {/* ── Aktions-Buttons ──────────────────────────────────────────────── */}
        {pendingItems.length > 0 && (
          <div style={{ flexShrink: 0, display: 'flex', gap: '10px' }}>
            <button
              onClick={() => orderItems(pendingItems.map(i => i.text))}
              disabled={picnicLoading}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                borderRadius: '20px', minHeight: '80px', gap: '4px',
                background: picnicLoading ? '#e5e7eb' : 'linear-gradient(135deg, #e8f5e9, #c8e6c9)',
                border: `2px solid ${picnicLoading ? '#d1d5db' : '#4ade80'}`,
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: '1.8rem', lineHeight: 1 }}>🛒</span>
              <span style={{ fontSize: '0.95rem', fontWeight: 800, color: picnicLoading ? '#9ca3af' : '#166534' }}>
                {picnicLoading ? 'Bestelle...' : 'Bei Picnic'}
              </span>
              <span style={{ fontSize: '0.75rem', color: picnicLoading ? '#9ca3af' : '#166534', fontWeight: 600 }}>bestellen</span>
            </button>
            <button
              onClick={handleSMSButton}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                borderRadius: '20px', minHeight: '80px', gap: '4px',
                background: 'linear-gradient(135deg, #dbeafe, #bfdbfe)',
                border: '2px solid #60a5fa',
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: '1.8rem', lineHeight: 1 }}>💬</span>
              <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1d4ed8' }}>Per SMS</span>
              <span style={{ fontSize: '0.75rem', color: '#1d4ed8', fontWeight: 600 }}>schicken</span>
            </button>
          </div>
        )}

        {/* ── Liste ────────────────────────────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', WebkitOverflowScrolling: 'touch' as const, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {items.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '12px' }}>
              <span style={{ fontSize: '3.5rem' }}>🛒</span>
              <p style={{ fontSize: '1.1rem', color: '#1a4a44', textAlign: 'center', margin: 0, lineHeight: 1.5 }}>
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
                    borderRadius: '16px', padding: '0 16px', minHeight: '64px',
                    backgroundColor: '#fff', border: '2px solid #b5e3e3',
                    textAlign: 'left', width: '100%', flexShrink: 0,
                  }}
                >
                  <div style={{ width: '30px', height: '30px', borderRadius: '50%', border: '3px solid #7ececa', flexShrink: 0 }} />
                  <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0d2b27', flex: 1 }}>{item.text}</span>
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
                    borderRadius: '16px', padding: '0 16px', minHeight: '56px',
                    backgroundColor: '#f0fdf4', border: '2px solid #86efac',
                    opacity: 0.7, textAlign: 'left', width: '100%', flexShrink: 0,
                  }}
                >
                  <div style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: '#4ade80', border: '3px solid #16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Check size={16} color="#fff" />
                  </div>
                  <span style={{ fontSize: '1.05rem', fontWeight: 600, color: '#1a4a44', flex: 1, textDecoration: 'line-through' }}>{item.text}</span>
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
      </div>
    </div>
  )
}
