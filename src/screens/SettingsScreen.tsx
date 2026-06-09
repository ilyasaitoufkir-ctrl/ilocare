import React, { useState } from 'react'
import { Trash2, Plus, Lock } from 'lucide-react'
import { Header } from '../components/Header'
import { PhotoPicker } from '../components/PhotoPicker'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { defaultDoses } from '../store/useStore'
import type { AppState, Contact, MedicationDose, Doctor, DoctorType } from '../types'

interface SettingsScreenProps {
  state: AppState
  onBack: () => void
  unlockSettings: (pin: string) => boolean
  lockSettings: () => void
  addContact: (c: Omit<Contact, 'id' | 'order'>) => void
  deleteContact: (id: string) => void
  addMedication: (m: { name: string; photo: string | null; barcode: string | null; frequency: 1 | 2 | 3; doses: MedicationDose[]; dosage: string; notes: string }) => void
  deleteMedication: (id: string) => void
  addDoctor: (d: Omit<Doctor, 'id'>) => void
  updateDoctor: (id: string, data: Partial<Doctor>) => void
  deleteDoctor: (id: string) => void
  updateState: (updater: (s: AppState) => AppState) => void
  onNavigateVoiceSetup: () => void
}

// ── PIN Screen ──────────────────────────────────────────────────────────────
function PinScreen({ onUnlock }: { onUnlock: (pin: string) => boolean }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)
  const digits = ['1','2','3','4','5','6','7','8','9','','0','⌫']
  function handleDigit(d: string) {
    if (pin.length >= 4) return
    const next = pin + d; setPin(next)
    if (next.length === 4) {
      if (!onUnlock(next)) { setError(true); setTimeout(() => { setPin(''); setError(false) }, 900) }
    }
  }
  return (
    <div className="flex flex-col items-center justify-center flex-1 p-6 gap-8">
      <div className="flex flex-col items-center gap-3">
        <Lock size={52} color="#7ececa" />
        <p style={{ fontSize: '1.3rem', fontWeight: 700, color: '#0d2b27', margin: 0 }}>Einstellungen gesperrt</p>
        <p style={{ fontSize: '1rem', color: '#1a4a44', margin: 0 }}>PIN eingeben (Standard: 1234)</p>
      </div>
      <div className="flex gap-4">
        {[0,1,2,3].map(i => <div key={i} className="rounded-full" style={{ width:'24px', height:'24px', backgroundColor: i < pin.length ? (error ? '#ef4444' : '#7ececa') : '#b5e3e3', border:'2px solid #7ececa' }} />)}
      </div>
      <div className="grid gap-3" style={{ gridTemplateColumns:'repeat(3, 1fr)', width:'100%', maxWidth:'300px' }}>
        {digits.map((d, i) => (
          <button key={i} onClick={() => d === '⌫' ? setPin(p => p.slice(0,-1)) : d ? handleDigit(d) : undefined} disabled={!d}
            className="rounded-2xl flex items-center justify-center active:scale-90 transition-transform"
            style={{ height:'80px', backgroundColor: d ? '#fff' : 'transparent', border: d ? '2px solid #b5e3e3' : 'none', fontSize:'1.8rem', fontWeight:700, color:'#0d2b27', visibility: d ? 'visible' : 'hidden' }}>
            {d}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Section header ──────────────────────────────────────────────────────────
function SectionTitle({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <p style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0d2b27', margin: 0 }}>{title}</p>
      {action}
    </div>
  )
}

function AddBtn({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} className="flex items-center gap-2 rounded-2xl px-4 py-3" style={{ backgroundColor: '#7ececa', minHeight: '50px' }}>
      <Plus size={20} color="#fff" />
      <span style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>{label}</span>
    </button>
  )
}

// ── Contact Form ────────────────────────────────────────────────────────────
function ContactForm({ onSave, onCancel }: { onSave: (c: Omit<Contact,'id'|'order'>) => void; onCancel: () => void }) {
  const [name, setName] = useState(''); const [phone, setPhone] = useState(''); const [photo, setPhoto] = useState<string|null>(null); const [isEmergency, setIsEmergency] = useState(false)
  return (
    <div className="flex flex-col gap-4 p-4 rounded-3xl mb-3" style={{ backgroundColor: 'rgba(255,255,255,0.88)', border: '2px solid #7ececa' }}>
      <p style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0d2b27', margin: 0 }}>➕ Neuer Kontakt</p>
      <div className="flex items-center gap-4">
        <PhotoPicker photo={photo} onPhoto={setPhoto} size={80} />
        <div className="flex flex-col gap-3 flex-1">
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Name" className="w-full rounded-2xl px-4 py-3" style={{ backgroundColor:'#fff', border:'2px solid #7ececa', fontSize:'1.1rem', fontWeight:600, color:'#0d2b27', outline:'none' }} />
          <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+49 123 456789" className="w-full rounded-2xl px-4 py-3" style={{ backgroundColor:'#fff', border:'2px solid #7ececa', fontSize:'1.1rem', fontWeight:600, color:'#0d2b27', outline:'none' }} />
        </div>
      </div>
      <button onClick={() => setIsEmergency(!isEmergency)} className="flex items-center gap-3 rounded-2xl px-4 py-3" style={{ backgroundColor: isEmergency ? '#fef2f2' : '#fff', border: `2px solid ${isEmergency ? '#f87171' : '#b5e3e3'}` }}>
        <span style={{ fontSize:'1.4rem' }}>{isEmergency ? '✅' : '⬜'}</span>
        <span style={{ fontSize:'1rem', fontWeight:700, color:'#0d2b27' }}>🚨 Notfallkontakt (SOS)</span>
      </button>
      <div className="flex gap-3">
        <button onClick={() => name && onSave({ name, phone, photo, isEmergency })} disabled={!name} className="flex-1 rounded-2xl py-4" style={{ backgroundColor: name ? '#4ade80' : '#b5e3e3', fontSize:'1.1rem', fontWeight:800, color: name ? '#14532d' : '#999', minHeight:'60px' }}>Speichern</button>
        <button onClick={onCancel} className="flex-1 rounded-2xl py-4" style={{ backgroundColor:'rgba(255,255,255,0.88)', border:'2px solid #7ececa', fontSize:'1.1rem', fontWeight:700, color:'#1a4a44', minHeight:'60px' }}>Abbrechen</button>
      </div>
    </div>
  )
}

// ── Doctor Form ─────────────────────────────────────────────────────────────
function DoctorForm({ onSave, onCancel }: { onSave: (d: Omit<Doctor,'id'>) => void; onCancel: () => void }) {
  const [name, setName] = useState(''); const [phone, setPhone] = useState(''); const [type, setType] = useState<DoctorType>('hausarzt')
  const types: { value: DoctorType; label: string; emoji: string }[] = [
    { value: 'hausarzt', label: 'Hausarzt', emoji: '👨‍⚕️' },
    { value: 'apotheke', label: 'Apotheke', emoji: '💊' },
    { value: 'notarzt', label: 'Notarzt', emoji: '🚨' },
    { value: 'other', label: 'Andere', emoji: '📞' },
  ]
  return (
    <div className="flex flex-col gap-4 p-4 rounded-3xl mb-3" style={{ backgroundColor: 'rgba(255,255,255,0.88)', border: '2px solid #7ececa' }}>
      <p style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0d2b27', margin: 0 }}>➕ Neuer Arzt / Kontakt</p>
      <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Name (z.B. Dr. Müller)" className="w-full rounded-2xl px-4 py-3" style={{ backgroundColor:'#fff', border:'2px solid #7ececa', fontSize:'1.1rem', fontWeight:600, color:'#0d2b27', outline:'none' }} />
      <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Telefonnummer" className="w-full rounded-2xl px-4 py-3" style={{ backgroundColor:'#fff', border:'2px solid #7ececa', fontSize:'1.1rem', fontWeight:600, color:'#0d2b27', outline:'none' }} />
      <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {types.map(t => (
          <button key={t.value} onClick={() => setType(t.value)} className="flex flex-col items-center justify-center rounded-2xl py-3 gap-1" style={{ backgroundColor: type === t.value ? '#7ececa' : '#fff', border: `2px solid ${type === t.value ? '#2a9d8f' : '#b5e3e3'}`, fontSize:'0.85rem', fontWeight:700, color: type === t.value ? '#fff' : '#1a4a44' }}>
            <span style={{ fontSize: '1.4rem' }}>{t.emoji}</span>{t.label}
          </button>
        ))}
      </div>
      <div className="flex gap-3">
        <button onClick={() => name && phone && onSave({ name, phone, type })} disabled={!name || !phone} className="flex-1 rounded-2xl py-4" style={{ backgroundColor: name && phone ? '#4ade80' : '#b5e3e3', fontSize:'1.1rem', fontWeight:800, color: name && phone ? '#14532d' : '#999', minHeight:'60px' }}>Speichern</button>
        <button onClick={onCancel} className="flex-1 rounded-2xl py-4" style={{ backgroundColor:'rgba(255,255,255,0.88)', border:'2px solid #7ececa', fontSize:'1.1rem', fontWeight:700, color:'#1a4a44', minHeight:'60px' }}>Abbrechen</button>
      </div>
    </div>
  )
}

// ── Medication Form ─────────────────────────────────────────────────────────
function MedForm({ onSave, onCancel }: { onSave: (m: { name: string; photo: string|null; barcode: string|null; frequency: 1|2|3; doses: MedicationDose[]; dosage: string; notes: string }) => void; onCancel: () => void }) {
  const [name, setName] = useState(''); const [photo, setPhoto] = useState<string|null>(null); const [frequency, setFrequency] = useState<1|2|3>(1); const [doses, setDoses] = useState<MedicationDose[]>(defaultDoses(1)); const [dosage, setDosage] = useState('1 Tablette'); const [notes, setNotes] = useState('')
  function handleFreqChange(f: 1|2|3) { setFrequency(f); setDoses(defaultDoses(f)) }
  function updateTime(i: number, t: string) { setDoses(prev => prev.map((d, idx) => idx === i ? { ...d, time: t } : d)) }
  return (
    <div className="flex flex-col gap-4 p-4 rounded-3xl mb-3" style={{ backgroundColor: 'rgba(255,255,255,0.88)', border: '2px solid #7ececa' }}>
      <p style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0d2b27', margin: 0 }}>➕ Neues Medikament</p>
      <div className="flex items-center gap-4">
        <PhotoPicker photo={photo} onPhoto={setPhoto} size={80} emoji="💊" />
        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Name des Medikaments" className="flex-1 rounded-2xl px-4 py-3" style={{ backgroundColor:'#fff', border:'2px solid #7ececa', fontSize:'1.1rem', fontWeight:600, color:'#0d2b27', outline:'none' }} />
      </div>
      <div>
        <p style={{ fontSize:'1rem', fontWeight:700, color:'#1a4a44', margin:'0 0 8px' }}>Dosierung</p>
        <div className="flex gap-2 flex-wrap">
          {['½ Tablette','1 Tablette','2 Tabletten','1 Kapsel'].map(d => <button key={d} onClick={() => setDosage(d)} className="rounded-xl px-3 py-2" style={{ backgroundColor: dosage===d ? '#7ececa' : '#fff', border:`2px solid ${dosage===d ? '#2a9d8f' : '#b5e3e3'}`, fontSize:'0.9rem', fontWeight:700, color: dosage===d ? '#fff' : '#1a4a44' }}>{d}</button>)}
        </div>
        <input type="text" value={dosage} onChange={e => setDosage(e.target.value)} placeholder="Andere..." className="w-full rounded-2xl px-4 py-2 mt-2" style={{ backgroundColor:'#fff', border:'2px solid #b5e3e3', fontSize:'1rem', color:'#0d2b27', outline:'none' }} />
      </div>
      <div>
        <p style={{ fontSize:'1rem', fontWeight:700, color:'#1a4a44', margin:'0 0 8px' }}>Häufigkeit täglich</p>
        <div className="flex gap-3">
          {([1,2,3] as const).map(f => <button key={f} onClick={() => handleFreqChange(f)} className="flex-1 rounded-2xl py-4" style={{ backgroundColor: frequency===f ? '#7ececa' : '#fff', border:`2px solid ${frequency===f ? '#2a9d8f' : '#b5e3e3'}`, fontSize:'1.3rem', fontWeight:800, color: frequency===f ? '#fff' : '#1a4a44', minHeight:'70px' }}>{f}×</button>)}
        </div>
      </div>
      <div>
        <p style={{ fontSize:'1rem', fontWeight:700, color:'#1a4a44', margin:'0 0 8px' }}>Uhrzeiten</p>
        <div className="flex flex-col gap-2">
          {doses.map((dose, i) => (
            <div key={i} className="flex items-center gap-3 rounded-2xl px-4 py-3" style={{ backgroundColor:'#fff', border:'2px solid #b5e3e3' }}>
              <span style={{ fontSize:'1rem', fontWeight:700, color:'#1a4a44', minWidth:'80px' }}>{i===0?'🌅 1.':i===1?'☀️ 2.':'🌙 3.'} Einnahme</span>
              <input type="time" value={dose.time} onChange={e => updateTime(i, e.target.value)} style={{ fontSize:'1.1rem', fontWeight:700, color:'#0d2b27', border:'none', backgroundColor:'transparent', outline:'none' }} />
            </div>
          ))}
        </div>
      </div>
      <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Hinweise..." className="w-full rounded-2xl px-4 py-3" style={{ backgroundColor:'#fff', border:'2px solid #b5e3e3', fontSize:'1rem', color:'#0d2b27', outline:'none' }} />
      <div className="flex gap-3">
        <button onClick={() => name && onSave({ name, photo, barcode:null, frequency, doses, dosage, notes })} disabled={!name} className="flex-1 rounded-2xl py-4" style={{ backgroundColor: name ? '#4ade80' : '#b5e3e3', fontSize:'1.1rem', fontWeight:800, color: name ? '#14532d' : '#999', minHeight:'60px' }}>Speichern</button>
        <button onClick={onCancel} className="flex-1 rounded-2xl py-4" style={{ backgroundColor:'rgba(255,255,255,0.88)', border:'2px solid #7ececa', fontSize:'1.1rem', fontWeight:700, color:'#1a4a44', minHeight:'60px' }}>Abbrechen</button>
      </div>
    </div>
  )
}

// ── Main ────────────────────────────────────────────────────────────────────
export function SettingsScreen({ state, onBack, unlockSettings, lockSettings, addContact, deleteContact, addMedication, deleteMedication, addDoctor, updateDoctor, deleteDoctor, updateState, onNavigateVoiceSetup }: SettingsScreenProps) {
  const [showContactForm, setShowContactForm] = useState(false)
  const [showMedForm, setShowMedForm] = useState(false)
  const [showDoctorForm, setShowDoctorForm] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'contact'|'med'|'doctor'; id: string }|null>(null)

  if (!state.settingsUnlocked) {
    return <div className="screen"><Header title="⚙️ Einstellungen" onBack={onBack} /><PinScreen onUnlock={unlockSettings} /></div>
  }

  return (
    <div className="screen">
      <Header title="⚙️ Einstellungen" onBack={() => { lockSettings(); onBack() }}
        rightAction={<button onClick={lockSettings} className="flex items-center justify-center rounded-2xl" style={{ width:'56px', height:'56px', backgroundColor:'rgba(255,255,255,0.88)', border:'2px solid #7ececa' }}><Lock size={24} color="#1a4a44" /></button>}
      />

      {deleteConfirm && (
        <ConfirmDialog message="Wirklich löschen?"
          onYes={() => {
            if (deleteConfirm.type === 'contact') deleteContact(deleteConfirm.id)
            else if (deleteConfirm.type === 'med') deleteMedication(deleteConfirm.id)
            else deleteDoctor(deleteConfirm.id)
            setDeleteConfirm(null)
          }}
          onNo={() => setDeleteConfirm(null)}
        />
      )}

      <div className="scroll-zone" style={{ padding: '12px 16px', paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Name + Stadt */}
        <section>
          <SectionTitle title="👤 Persönliche Daten" />
          <div className="flex flex-col gap-3">
            <input type="text" value={state.userName} onChange={e => updateState(s => ({ ...s, userName: e.target.value }))} placeholder="Dein Name" className="w-full rounded-2xl px-4 py-4" style={{ backgroundColor:'#fff', border:'2px solid #7ececa', fontSize:'1.2rem', fontWeight:600, color:'#0d2b27', outline:'none' }} />
            <input type="text" value={state.weatherCity} onChange={e => updateState(s => ({ ...s, weatherCity: e.target.value }))} placeholder="Wetter-Stadt (z.B. Berlin)" className="w-full rounded-2xl px-4 py-4" style={{ backgroundColor:'#fff', border:'2px solid #7ececa', fontSize:'1.1rem', fontWeight:600, color:'#0d2b27', outline:'none' }} />
          </div>
        </section>

        {/* PIN */}
        <section>
          <SectionTitle title="🔐 Admin PIN" />
          <input type="password" value={state.adminPin} onChange={e => updateState(s => ({ ...s, adminPin: e.target.value }))} maxLength={4} className="w-full rounded-2xl px-4 py-4" style={{ backgroundColor:'#fff', border:'2px solid #7ececa', fontSize:'1.3rem', letterSpacing:'8px', fontWeight:700, color:'#0d2b27', outline:'none' }} />
        </section>

        {/* Check-in */}
        <section>
          <SectionTitle title="✅ Täglicher Check-in" />
          <div className="flex flex-col gap-3">
            <button onClick={() => updateState(s => ({ ...s, reminders: { ...s.reminders, checkIn: { ...s.reminders.checkIn, enabled: !s.reminders.checkIn.enabled } } }))}
              className="flex items-center justify-between rounded-2xl px-4 py-4"
              style={{ backgroundColor: state.reminders.checkIn.enabled ? '#dcfce7' : '#f8e8e8', border: `2px solid ${state.reminders.checkIn.enabled ? '#86efac' : '#b5e3e3'}` }}>
              <span style={{ fontSize:'1.1rem', fontWeight:700, color:'#0d2b27' }}>{state.reminders.checkIn.enabled ? '✅ Check-in aktiv' : '⬜ Check-in aus'}</span>
              <span style={{ fontSize:'1.4rem' }}>{state.reminders.checkIn.enabled ? '🟢' : '⚪'}</span>
            </button>
            <div className="flex items-center justify-between rounded-2xl px-4 py-4" style={{ backgroundColor:'#fff', border:'2px solid #b5e3e3' }}>
              <span style={{ fontSize:'1rem', fontWeight:700, color:'#0d2b27' }}>⏰ Erinnerung um</span>
              <input type="time" value={state.reminders.checkIn.time} onChange={e => updateState(s => ({ ...s, reminders: { ...s.reminders, checkIn: { ...s.reminders.checkIn, time: e.target.value } } }))} style={{ fontSize:'1.1rem', fontWeight:700, color:'#0d2b27', border:'none', backgroundColor:'transparent', outline:'none' }} />
            </div>
            <div className="flex items-center justify-between rounded-2xl px-4 py-4" style={{ backgroundColor:'#fff', border:'2px solid #b5e3e3' }}>
              <span style={{ fontSize:'1rem', fontWeight:700, color:'#0d2b27' }}>📱 SMS nach</span>
              <select value={state.reminders.checkIn.alertDelayMinutes} onChange={e => updateState(s => ({ ...s, reminders: { ...s.reminders, checkIn: { ...s.reminders.checkIn, alertDelayMinutes: Number(e.target.value) } } }))} style={{ fontSize:'1rem', fontWeight:700, color:'#0d2b27', border:'none', backgroundColor:'transparent', outline:'none' }}>
                {[30,60,90,120].map(m => <option key={m} value={m}>{m} Minuten</option>)}
              </select>
            </div>
          </div>
        </section>

        {/* Nacht Modus */}
        <section>
          <SectionTitle title="🌙 Nacht-Modus" />
          <div className="flex flex-col gap-3">
            <button onClick={() => updateState(s => ({ ...s, nightMode: { ...s.nightMode, enabled: !s.nightMode.enabled } }))}
              className="flex items-center justify-between rounded-2xl px-4 py-4"
              style={{ backgroundColor: state.nightMode.enabled ? '#1e293b' : '#f8e8e8', border: `2px solid ${state.nightMode.enabled ? '#475569' : '#b5e3e3'}` }}>
              <span style={{ fontSize:'1.1rem', fontWeight:700, color: state.nightMode.enabled ? '#f1f5f9' : '#0d2b27' }}>{state.nightMode.enabled ? '🌙 Nacht-Modus aktiv' : '⬜ Nacht-Modus aus'}</span>
              <span style={{ fontSize:'1.4rem' }}>{state.nightMode.enabled ? '🌙' : '⚪'}</span>
            </button>
            <div className="flex gap-3">
              <div className="flex-1 flex items-center justify-between rounded-2xl px-4 py-3" style={{ backgroundColor:'#fff', border:'2px solid #b5e3e3' }}>
                <span style={{ fontSize:'0.95rem', fontWeight:700, color:'#1a4a44' }}>Von</span>
                <input type="time" value={state.nightMode.startTime} onChange={e => updateState(s => ({ ...s, nightMode: { ...s.nightMode, startTime: e.target.value } }))} style={{ fontSize:'1rem', fontWeight:700, color:'#0d2b27', border:'none', backgroundColor:'transparent', outline:'none' }} />
              </div>
              <div className="flex-1 flex items-center justify-between rounded-2xl px-4 py-3" style={{ backgroundColor:'#fff', border:'2px solid #b5e3e3' }}>
                <span style={{ fontSize:'0.95rem', fontWeight:700, color:'#1a4a44' }}>Bis</span>
                <input type="time" value={state.nightMode.endTime} onChange={e => updateState(s => ({ ...s, nightMode: { ...s.nightMode, endTime: e.target.value } }))} style={{ fontSize:'1rem', fontWeight:700, color:'#0d2b27', border:'none', backgroundColor:'transparent', outline:'none' }} />
              </div>
            </div>
          </div>
        </section>

        {/* Barrierefreiheit */}
        <section>
          <SectionTitle title="👁 Barrierefreiheit" />
          <button
            onClick={() => updateState(s => ({ ...s, largeText: !s.largeText }))}
            className="flex items-center justify-between rounded-2xl px-4 py-4 w-full"
            style={{ backgroundColor: state.largeText ? '#dcfce7' : '#f8e8e8', border: `2px solid ${state.largeText ? '#86efac' : '#b5e3e3'}` }}>
            <div className="flex flex-col items-start">
              <span style={{ fontSize:'1.1rem', fontWeight:700, color:'#0d2b27' }}>🔤 Große Schrift</span>
              <span style={{ fontSize:'0.85rem', color:'#1a4a44' }}>{state.largeText ? 'Aktiv – alle Texte 120% größer' : 'Aus – normale Schriftgröße'}</span>
            </div>
            <span style={{ fontSize:'1.4rem' }}>{state.largeText ? '🟢' : '⚪'}</span>
          </button>
        </section>

        {/* Familie */}
        <section>
          <SectionTitle title="👨‍👩‍👧 Familiencode" />
          <div className="flex flex-col gap-3">
            <div className="rounded-2xl px-4 py-3" style={{ backgroundColor:'#f0fdf4', border:'2px solid #86efac' }}>
              <p style={{ fontSize:'0.9rem', color:'#166534', margin:0, lineHeight:1.5 }}>
                ℹ️ Familie kann mit diesem Code den Status auf dem Dashboard ansehen.
              </p>
            </div>
            <input
              type="password"
              value={state.familyCode}
              onChange={e => updateState(s => ({ ...s, familyCode: e.target.value.slice(0, 4) }))}
              maxLength={4}
              placeholder="4-stelliger Code"
              className="w-full rounded-2xl px-4 py-4"
              style={{ backgroundColor:'#fff', border:'2px solid #7ececa', fontSize:'1.3rem', letterSpacing:'8px', fontWeight:700, color:'#0d2b27', outline:'none' }}
            />
          </div>
        </section>

        {/* Ilo Stimme */}
        <section>
          <SectionTitle title="🎤 Ilo Familien-Stimme" />
          <button
            onClick={onNavigateVoiceSetup}
            className="w-full flex items-center gap-4 rounded-2xl px-4 py-4"
            style={{ background: state.elevenLabsVoiceId ? 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(168,85,247,0.15))' : 'rgba(255,255,255,0.88)', border: `2px solid ${state.elevenLabsVoiceId ? '#a855f7' : '#b5e3e3'}` }}
          >
            <span style={{ fontSize: '1.8rem' }}>🎤</span>
            <div className="flex flex-col items-start">
              <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0d2b27' }}>
                {state.voiceName ? `Stimme: ${state.voiceName}` : 'Familien-Stimme einrichten'}
              </span>
              <span style={{ fontSize: '0.85rem', color: state.elevenLabsVoiceId ? '#7c3aed' : '#1a4a44' }}>
                {state.elevenLabsVoiceId ? '✅ Aktiv – Ilo spricht mit vertrauter Stimme' : 'Ilo mit Familien-Stimme sprechen lassen'}
              </span>
            </div>
            <span style={{ marginLeft: 'auto', fontSize: '1.1rem' }}>›</span>
          </button>
        </section>

        {/* Sturzerkennung */}
        <section>
          <SectionTitle title="📱 Sturzerkennung" />
          <div className="rounded-2xl px-4 py-4" style={{ backgroundColor:'#fef3c7', border:'2px solid #fcd34d' }}>
            <p style={{ fontSize:'0.95rem', color:'#92400e', margin:0, lineHeight:1.5 }}>
              ℹ️ Die Sturzerkennung nutzt den Bewegungssensor des iPhones. Auf dem Dashboard kann sie aktiviert werden.
            </p>
          </div>
        </section>

        {/* Ärzte */}
        <section>
          <SectionTitle title={`👨‍⚕️ Ärzte & Notfall (${state.doctors.length})`} action={<AddBtn onClick={() => setShowDoctorForm(true)} label="Hinzufügen" />} />
          {showDoctorForm && <DoctorForm onSave={d => { addDoctor(d); setShowDoctorForm(false) }} onCancel={() => setShowDoctorForm(false)} />}
          <div className="flex flex-col gap-3">
            {state.doctors.map(d => {
              const emojis: Record<DoctorType, string> = { notarzt:'🚨', hausarzt:'👨‍⚕️', apotheke:'💊', other:'📞' }
              return (
                <div key={d.id} className="flex items-center gap-3 rounded-2xl px-4 py-3" style={{ backgroundColor:'#fff', border:'2px solid #b5e3e3', minHeight:'70px' }}>
                  <span style={{ fontSize:'1.6rem' }}>{emojis[d.type]}</span>
                  <div className="flex flex-col flex-1">
                    <span style={{ fontSize:'1.1rem', fontWeight:700, color:'#0d2b27' }}>{d.name}</span>
                    <span style={{ fontSize:'0.9rem', color:'#1a4a44' }}>{d.phone}</span>
                  </div>
                  <button onClick={() => setDeleteConfirm({ type:'doctor', id:d.id })} className="rounded-xl p-3" style={{ backgroundColor:'#fef2f2' }}>
                    <Trash2 size={22} color="#dc2626" />
                  </button>
                </div>
              )
            })}
          </div>
        </section>

        {/* Kontakte */}
        <section>
          <SectionTitle title={`👥 Kontakte (${state.contacts.length}/5)`} action={state.contacts.length < 5 && !showContactForm ? <AddBtn onClick={() => setShowContactForm(true)} label="Hinzufügen" /> : undefined} />
          {showContactForm && <ContactForm onSave={c => { addContact(c); setShowContactForm(false) }} onCancel={() => setShowContactForm(false)} />}
          <div className="flex flex-col gap-3">
            {state.contacts.map(c => (
              <div key={c.id} className="flex items-center gap-3 rounded-2xl px-4 py-3" style={{ backgroundColor:'#fff', border:'2px solid #b5e3e3', minHeight:'70px' }}>
                <div className="rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center" style={{ width:'50px', height:'50px', backgroundColor:'rgba(255,255,255,0.88)', border:'2px solid #7ececa' }}>
                  {c.photo ? <img src={c.photo} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <span style={{ fontSize:'1.5rem' }}>👤</span>}
                </div>
                <div className="flex flex-col flex-1">
                  <span style={{ fontSize:'1.1rem', fontWeight:700, color:'#0d2b27' }}>{c.name}</span>
                  {c.phone && <span style={{ fontSize:'0.9rem', color:'#1a4a44' }}>{c.phone}</span>}
                  {c.isEmergency && <span style={{ fontSize:'0.85rem', color:'#dc2626', fontWeight:700 }}>🚨 Notfallkontakt</span>}
                </div>
                <button onClick={() => setDeleteConfirm({ type:'contact', id:c.id })} className="rounded-xl p-3" style={{ backgroundColor:'#fef2f2' }}>
                  <Trash2 size={22} color="#dc2626" />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Medikamente */}
        <section>
          <SectionTitle title="💊 Medikamente" action={!showMedForm ? <AddBtn onClick={() => setShowMedForm(true)} label="Hinzufügen" /> : undefined} />
          {showMedForm && <MedForm onSave={m => { addMedication(m); setShowMedForm(false) }} onCancel={() => setShowMedForm(false)} />}
          <div className="flex flex-col gap-3">
            {state.medications.map(m => (
              <div key={m.id} className="flex items-center gap-3 rounded-2xl px-4 py-3" style={{ backgroundColor:'#fff', border:'2px solid #b5e3e3', minHeight:'70px' }}>
                <div className="rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center" style={{ width:'50px', height:'50px', backgroundColor:'rgba(255,255,255,0.88)' }}>
                  {m.photo ? <img src={m.photo} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <span style={{ fontSize:'1.5rem' }}>💊</span>}
                </div>
                <div className="flex flex-col flex-1">
                  <span style={{ fontSize:'1.1rem', fontWeight:700, color:'#0d2b27' }}>{m.name}</span>
                  <span style={{ fontSize:'0.85rem', color:'#1a4a44' }}>{m.dosage} · {m.frequency}× täglich · {m.doses.map(d=>d.time).join(', ')} Uhr</span>
                </div>
                <button onClick={() => setDeleteConfirm({ type:'med', id:m.id })} className="rounded-xl p-3" style={{ backgroundColor:'#fef2f2' }}>
                  <Trash2 size={22} color="#dc2626" />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* OK Erinnerung */}
        <section>
          <SectionTitle title="🔔 OK-Erinnerung" />
          <div className="flex items-center justify-between rounded-2xl px-4 py-4" style={{ backgroundColor:'#fff', border:'2px solid #b5e3e3' }}>
            <span style={{ fontSize:'1rem', fontWeight:700, color:'#0d2b27' }}>✅ Täglich um</span>
            <input type="time" value={state.reminders.okReminderTime} onChange={e => updateState(s => ({ ...s, reminders: { ...s.reminders, okReminderTime: e.target.value } }))} style={{ fontSize:'1.1rem', fontWeight:700, color:'#0d2b27', border:'none', backgroundColor:'transparent', outline:'none' }} />
          </div>
        </section>

        {/* Picnic */}
        <section>
          <SectionTitle title="🛒 Picnic Online-Supermarkt" />
          <div className="flex flex-col gap-3">
            <div className="rounded-2xl px-4 py-3" style={{ backgroundColor:'#f0fdf4', border:'2px solid #86efac' }}>
              <p style={{ fontSize:'0.9rem', color:'#166534', margin:0, lineHeight:1.5 }}>
                ℹ️ Zugangsdaten für automatische Bestellung über die Picnic-App.
              </p>
            </div>
            <input
              type="email"
              value={state.picnicEmail}
              onChange={e => updateState(s => ({ ...s, picnicEmail: e.target.value }))}
              placeholder="Picnic E-Mail"
              className="w-full rounded-2xl px-4 py-4"
              style={{ backgroundColor:'#fff', border:'2px solid #7ececa', fontSize:'1.1rem', fontWeight:600, color:'#0d2b27', outline:'none' }}
            />
            <input
              type="password"
              value={state.picnicPassword}
              onChange={e => updateState(s => ({ ...s, picnicPassword: e.target.value }))}
              placeholder="Picnic Passwort"
              className="w-full rounded-2xl px-4 py-4"
              style={{ backgroundColor:'#fff', border:'2px solid #7ececa', fontSize:'1.1rem', fontWeight:600, color:'#0d2b27', outline:'none' }}
            />
          </div>
        </section>

      </div>
    </div>
  )
}
