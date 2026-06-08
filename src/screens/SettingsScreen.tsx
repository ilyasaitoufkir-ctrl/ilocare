import React, { useState } from 'react'
import { Trash2, Plus, Lock } from 'lucide-react'
import { Header } from '../components/Header'
import { PhotoPicker } from '../components/PhotoPicker'
import { ConfirmDialog } from '../components/ConfirmDialog'
import type { AppState, Contact, Medication } from '../types'

interface SettingsScreenProps {
  state: AppState
  onBack: () => void
  unlockSettings: (pin: string) => boolean
  lockSettings: () => void
  addContact: (c: Omit<Contact, 'id' | 'order'>) => void
  updateContact: (id: string, data: Partial<Contact>) => void
  deleteContact: (id: string) => void
  addMedication: (m: Omit<Medication, 'id' | 'takenToday' | 'lastTakenDate'>) => void
  deleteMedication: (id: string) => void
  updateState: (updater: (s: AppState) => AppState) => void
}

function PinScreen({ onUnlock }: { onUnlock: (pin: string) => boolean }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)

  function handleDigit(d: string) {
    if (pin.length < 4) {
      const next = pin + d
      setPin(next)
      if (next.length === 4) {
        const ok = onUnlock(next)
        if (!ok) {
          setError(true)
          setTimeout(() => { setPin(''); setError(false) }, 1000)
        }
      }
    }
  }

  function handleDelete() {
    setPin(p => p.slice(0, -1))
  }

  const digits = ['1','2','3','4','5','6','7','8','9','','0','⌫']

  return (
    <div className="flex flex-col items-center justify-center flex-1 p-6 gap-8">
      <div className="flex flex-col items-center gap-3">
        <Lock size={48} color="#e8a0a0" />
        <p style={{ fontSize: '1.3rem', fontWeight: 700, color: '#2d1a1a', margin: 0 }}>
          Einstellungen gesperrt
        </p>
        <p style={{ fontSize: '1rem', color: '#6b4a4a', margin: 0 }}>
          PIN eingeben (Standard: 1234)
        </p>
      </div>

      {/* PIN Anzeige */}
      <div className="flex gap-4">
        {[0,1,2,3].map(i => (
          <div
            key={i}
            className="rounded-full"
            style={{
              width: '24px',
              height: '24px',
              backgroundColor: i < pin.length ? (error ? '#ef4444' : '#e8a0a0') : '#e8d0d0',
              border: '2px solid #e8a0a0',
            }}
          />
        ))}
      </div>

      {/* Numpad */}
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: 'repeat(3, 1fr)', width: '100%', maxWidth: '320px' }}
      >
        {digits.map((d, i) => (
          <button
            key={i}
            onClick={() => d === '⌫' ? handleDelete() : d ? handleDigit(d) : undefined}
            disabled={!d}
            className="rounded-2xl flex items-center justify-center active:scale-90 transition-transform"
            style={{
              height: '80px',
              backgroundColor: d ? '#ffffff' : 'transparent',
              border: d ? '2px solid #e8d0d0' : 'none',
              fontSize: '1.8rem',
              fontWeight: 700,
              color: '#2d1a1a',
              cursor: d ? 'pointer' : 'default',
              visibility: d ? 'visible' : 'hidden',
            }}
          >
            {d}
          </button>
        ))}
      </div>
    </div>
  )
}

function ContactForm({ onSave, onCancel }: { onSave: (c: Omit<Contact, 'id' | 'order'>) => void; onCancel: () => void }) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [photo, setPhoto] = useState<string | null>(null)
  const [isEmergency, setIsEmergency] = useState(false)

  return (
    <div className="flex flex-col gap-4 p-4 rounded-3xl" style={{ backgroundColor: '#f8e8e8', border: '2px solid #e8a0a0' }}>
      <p style={{ fontSize: '1.2rem', fontWeight: 800, color: '#2d1a1a', margin: 0 }}>➕ Neuer Kontakt</p>

      <div className="flex items-center gap-4">
        <PhotoPicker photo={photo} onPhoto={setPhoto} size={80} />
        <div className="flex flex-col gap-3 flex-1">
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Name"
            className="w-full rounded-2xl px-4 py-3"
            style={{ backgroundColor: '#ffffff', border: '2px solid #e8a0a0', fontSize: '1.1rem', fontWeight: 600, color: '#2d1a1a', outline: 'none' }}
          />
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="Telefon / WhatsApp"
            className="w-full rounded-2xl px-4 py-3"
            style={{ backgroundColor: '#ffffff', border: '2px solid #e8a0a0', fontSize: '1.1rem', fontWeight: 600, color: '#2d1a1a', outline: 'none' }}
          />
        </div>
      </div>

      <button
        onClick={() => setIsEmergency(!isEmergency)}
        className="flex items-center gap-3 rounded-2xl px-4 py-3"
        style={{ backgroundColor: isEmergency ? '#fef2f2' : '#ffffff', border: `2px solid ${isEmergency ? '#f87171' : '#e8d0d0'}` }}
      >
        <span style={{ fontSize: '1.5rem' }}>{isEmergency ? '✅' : '⬜'}</span>
        <span style={{ fontSize: '1rem', fontWeight: 700, color: '#2d1a1a' }}>🚨 Notfallkontakt</span>
      </button>

      <div className="flex gap-3">
        <button
          onClick={() => name && onSave({ name, phone, photo, isEmergency })}
          disabled={!name}
          className="flex-1 rounded-2xl py-4"
          style={{ backgroundColor: name ? '#4ade80' : '#e8d0d0', fontSize: '1.1rem', fontWeight: 800, color: name ? '#14532d' : '#999', minHeight: '60px' }}
        >
          Speichern
        </button>
        <button
          onClick={onCancel}
          className="flex-1 rounded-2xl py-4"
          style={{ backgroundColor: '#f8e8e8', border: '2px solid #e8a0a0', fontSize: '1.1rem', fontWeight: 700, color: '#6b4a4a', minHeight: '60px' }}
        >
          Abbrechen
        </button>
      </div>
    </div>
  )
}

function MedForm({ onSave, onCancel }: { onSave: (m: Omit<Medication, 'id' | 'takenToday' | 'lastTakenDate'>) => void; onCancel: () => void }) {
  const [name, setName] = useState('')
  const [photo, setPhoto] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [schedule, setSchedule] = useState<('morning' | 'noon' | 'evening')[]>([])

  function toggleTime(t: 'morning' | 'noon' | 'evening') {
    setSchedule(s => s.includes(t) ? s.filter(x => x !== t) : [...s, t])
  }

  return (
    <div className="flex flex-col gap-4 p-4 rounded-3xl" style={{ backgroundColor: '#f8e8e8', border: '2px solid #e8a0a0' }}>
      <p style={{ fontSize: '1.2rem', fontWeight: 800, color: '#2d1a1a', margin: 0 }}>➕ Neues Medikament</p>

      <div className="flex items-center gap-4">
        <PhotoPicker photo={photo} onPhoto={setPhoto} size={80} emoji="💊" />
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Name des Medikaments"
          className="flex-1 rounded-2xl px-4 py-3"
          style={{ backgroundColor: '#ffffff', border: '2px solid #e8a0a0', fontSize: '1.1rem', fontWeight: 600, color: '#2d1a1a', outline: 'none' }}
        />
      </div>

      <div className="flex gap-3">
        {(['morning', 'noon', 'evening'] as const).map(t => {
          const labels = { morning: '🌅 Morgens', noon: '☀️ Mittags', evening: '🌙 Abends' }
          const active = schedule.includes(t)
          return (
            <button
              key={t}
              onClick={() => toggleTime(t)}
              className="flex-1 rounded-2xl py-3"
              style={{
                backgroundColor: active ? '#e8a0a0' : '#ffffff',
                border: `2px solid ${active ? '#c87070' : '#e8d0d0'}`,
                fontSize: '0.85rem',
                fontWeight: 700,
                color: active ? '#ffffff' : '#6b4a4a',
                minHeight: '60px',
              }}
            >
              {labels[t]}
            </button>
          )
        })}
      </div>

      <input
        type="text"
        value={notes}
        onChange={e => setNotes(e.target.value)}
        placeholder="Hinweise (optional)"
        className="w-full rounded-2xl px-4 py-3"
        style={{ backgroundColor: '#ffffff', border: '2px solid #e8a0a0', fontSize: '1rem', color: '#2d1a1a', outline: 'none' }}
      />

      <div className="flex gap-3">
        <button
          onClick={() => name && schedule.length > 0 && onSave({ name, photo, schedule, notes })}
          disabled={!name || schedule.length === 0}
          className="flex-1 rounded-2xl py-4"
          style={{ backgroundColor: name && schedule.length > 0 ? '#4ade80' : '#e8d0d0', fontSize: '1.1rem', fontWeight: 800, color: name && schedule.length > 0 ? '#14532d' : '#999', minHeight: '60px' }}
        >
          Speichern
        </button>
        <button
          onClick={onCancel}
          className="flex-1 rounded-2xl py-4"
          style={{ backgroundColor: '#f8e8e8', border: '2px solid #e8a0a0', fontSize: '1.1rem', fontWeight: 700, color: '#6b4a4a', minHeight: '60px' }}
        >
          Abbrechen
        </button>
      </div>
    </div>
  )
}

export function SettingsScreen({
  state,
  onBack,
  unlockSettings,
  lockSettings,
  addContact,
  deleteContact,
  addMedication,
  deleteMedication,
  updateState,
}: SettingsScreenProps) {
  const [showContactForm, setShowContactForm] = useState(false)
  const [showMedForm, setShowMedForm] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'contact' | 'med'; id: string } | null>(null)

  if (!state.settingsUnlocked) {
    return (
      <div className="flex flex-col min-h-screen" style={{ backgroundColor: '#fdf6f0' }}>
        <Header title="⚙️ Einstellungen" onBack={onBack} />
        <PinScreen onUnlock={unlockSettings} />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: '#fdf6f0' }}>
      <Header
        title="⚙️ Einstellungen"
        onBack={() => { lockSettings(); onBack() }}
        rightAction={
          <button
            onClick={lockSettings}
            className="flex items-center justify-center rounded-2xl"
            style={{ width: '56px', height: '56px', backgroundColor: '#f8e8e8', border: '2px solid #e8a0a0' }}
          >
            <Lock size={24} color="#6b4a4a" />
          </button>
        }
      />

      {deleteConfirm && (
        <ConfirmDialog
          message={`Wirklich löschen?`}
          onYes={() => {
            if (deleteConfirm.type === 'contact') deleteContact(deleteConfirm.id)
            else deleteMedication(deleteConfirm.id)
            setDeleteConfirm(null)
          }}
          onNo={() => setDeleteConfirm(null)}
        />
      )}

      <div className="flex flex-col gap-6 p-4" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)' }}>

        {/* Name */}
        <section>
          <p style={{ fontSize: '1.2rem', fontWeight: 800, color: '#2d1a1a', margin: '0 0 12px' }}>👤 Name</p>
          <input
            type="text"
            value={state.userName}
            onChange={e => updateState(s => ({ ...s, userName: e.target.value }))}
            className="w-full rounded-2xl px-4 py-4"
            style={{ backgroundColor: '#ffffff', border: '2px solid #e8a0a0', fontSize: '1.2rem', fontWeight: 600, color: '#2d1a1a', outline: 'none' }}
          />
        </section>

        {/* PIN ändern */}
        <section>
          <p style={{ fontSize: '1.2rem', fontWeight: 800, color: '#2d1a1a', margin: '0 0 12px' }}>🔐 Admin PIN</p>
          <input
            type="password"
            value={state.adminPin}
            onChange={e => updateState(s => ({ ...s, adminPin: e.target.value }))}
            placeholder="PIN (4 Ziffern)"
            maxLength={4}
            className="w-full rounded-2xl px-4 py-4"
            style={{ backgroundColor: '#ffffff', border: '2px solid #e8a0a0', fontSize: '1.3rem', letterSpacing: '8px', fontWeight: 700, color: '#2d1a1a', outline: 'none' }}
          />
        </section>

        {/* Erinnerungszeiten */}
        <section>
          <p style={{ fontSize: '1.2rem', fontWeight: 800, color: '#2d1a1a', margin: '0 0 12px' }}>🔔 Erinnerungszeiten</p>
          <div className="flex flex-col gap-3">
            {[
              { key: 'morningTime' as const, label: '🌅 Morgens' },
              { key: 'noonTime' as const, label: '☀️ Mittags' },
              { key: 'eveningTime' as const, label: '🌙 Abends' },
              { key: 'okReminderTime' as const, label: '✅ OK-Erinnerung' },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between gap-3 rounded-2xl px-4 py-3" style={{ backgroundColor: '#ffffff', border: '2px solid #e8d0d0' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#2d1a1a' }}>{label}</span>
                <input
                  type="time"
                  value={state.reminders[key]}
                  onChange={e => updateState(s => ({ ...s, reminders: { ...s.reminders, [key]: e.target.value } }))}
                  style={{ fontSize: '1.1rem', fontWeight: 700, color: '#2d1a1a', border: 'none', backgroundColor: 'transparent', outline: 'none' }}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Kontakte */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <p style={{ fontSize: '1.2rem', fontWeight: 800, color: '#2d1a1a', margin: 0 }}>
              👥 Kontakte ({state.contacts.length}/5)
            </p>
            {state.contacts.length < 5 && !showContactForm && (
              <button
                onClick={() => setShowContactForm(true)}
                className="flex items-center gap-2 rounded-2xl px-4 py-3"
                style={{ backgroundColor: '#e8a0a0', minHeight: '50px' }}
              >
                <Plus size={20} color="#ffffff" />
                <span style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff' }}>Hinzufügen</span>
              </button>
            )}
          </div>

          {showContactForm && (
            <div className="mb-3">
              <ContactForm
                onSave={c => { addContact(c); setShowContactForm(false) }}
                onCancel={() => setShowContactForm(false)}
              />
            </div>
          )}

          <div className="flex flex-col gap-3">
            {state.contacts.map(c => (
              <div
                key={c.id}
                className="flex items-center gap-3 rounded-2xl px-4 py-3"
                style={{ backgroundColor: '#ffffff', border: '2px solid #e8d0d0', minHeight: '70px' }}
              >
                <div className="rounded-full overflow-hidden flex-shrink-0" style={{ width: '50px', height: '50px', backgroundColor: '#f8e8e8', border: '2px solid #e8a0a0' }}>
                  {c.photo ? <img src={c.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div className="flex items-center justify-center w-full h-full"><span style={{ fontSize: '1.5rem' }}>👤</span></div>}
                </div>
                <div className="flex flex-col flex-1">
                  <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#2d1a1a' }}>{c.name}</span>
                  {c.phone && <span style={{ fontSize: '0.9rem', color: '#6b4a4a' }}>{c.phone}</span>}
                  {c.isEmergency && <span style={{ fontSize: '0.85rem', color: '#dc2626', fontWeight: 700 }}>🚨 Notfall</span>}
                </div>
                <button
                  onClick={() => setDeleteConfirm({ type: 'contact', id: c.id })}
                  className="rounded-xl p-3"
                  style={{ backgroundColor: '#fef2f2' }}
                >
                  <Trash2 size={22} color="#dc2626" />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Medikamente */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <p style={{ fontSize: '1.2rem', fontWeight: 800, color: '#2d1a1a', margin: 0 }}>
              💊 Medikamente
            </p>
            {!showMedForm && (
              <button
                onClick={() => setShowMedForm(true)}
                className="flex items-center gap-2 rounded-2xl px-4 py-3"
                style={{ backgroundColor: '#e8a0a0', minHeight: '50px' }}
              >
                <Plus size={20} color="#ffffff" />
                <span style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff' }}>Hinzufügen</span>
              </button>
            )}
          </div>

          {showMedForm && (
            <div className="mb-3">
              <MedForm
                onSave={m => { addMedication(m); setShowMedForm(false) }}
                onCancel={() => setShowMedForm(false)}
              />
            </div>
          )}

          <div className="flex flex-col gap-3">
            {state.medications.map(m => (
              <div
                key={m.id}
                className="flex items-center gap-3 rounded-2xl px-4 py-3"
                style={{ backgroundColor: '#ffffff', border: '2px solid #e8d0d0', minHeight: '70px' }}
              >
                <div className="rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center" style={{ width: '50px', height: '50px', backgroundColor: '#f8e8e8' }}>
                  {m.photo ? <img src={m.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '1.5rem' }}>💊</span>}
                </div>
                <div className="flex flex-col flex-1">
                  <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#2d1a1a' }}>{m.name}</span>
                  <span style={{ fontSize: '0.9rem', color: '#6b4a4a' }}>
                    {m.schedule.map(t => ({ morning: '🌅', noon: '☀️', evening: '🌙' }[t])).join(' ')}
                  </span>
                </div>
                <button
                  onClick={() => setDeleteConfirm({ type: 'med', id: m.id })}
                  className="rounded-xl p-3"
                  style={{ backgroundColor: '#fef2f2' }}
                >
                  <Trash2 size={22} color="#dc2626" />
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
