import React, { useState, useEffect, useRef } from 'react'
import { Header } from '../components/Header'
import type { HealthRecord } from '../types'
import QRCode from 'qrcode'

interface HealthRecordScreenProps {
  record: HealthRecord
  userName: string
  onSave: (r: HealthRecord) => void
  onBack: () => void
}

const BLOOD_TYPES = ['A+', 'A−', 'B+', 'B−', 'AB+', 'AB−', '0+', '0−', 'Unbekannt']

function Field({ label, value, onChange, multiline, type = 'text', placeholder }: {
  label: string; value: string; onChange: (v: string) => void
  multiline?: boolean; type?: string; placeholder?: string
}) {
  const shared: React.CSSProperties = {
    width: '100%', borderRadius: '14px', padding: '12px 16px',
    border: '2px solid #7ececa', fontSize: '1rem', fontWeight: 600,
    color: '#0d2b27', outline: 'none', backgroundColor: '#fff',
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1a4a44' }}>{label}</label>
      {multiline
        ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
            rows={3} style={{ ...shared, resize: 'vertical', lineHeight: 1.5 }} />
        : <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
            style={shared} />
      }
    </div>
  )
}

export function HealthRecordScreen({ record, userName, onSave, onBack }: HealthRecordScreenProps) {
  const [draft, setDraft] = useState<HealthRecord>(record)
  const [showQR, setShowQR] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [saved, setSaved] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  function update(key: keyof HealthRecord, value: string) {
    setDraft(prev => ({ ...prev, [key]: value }))
  }

  function handleSave() {
    onSave(draft)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function generateQR() {
    const data = [
      `👤 ${userName}`,
      draft.bloodType ? `🩸 Blutgruppe: ${draft.bloodType}` : '',
      draft.allergies ? `⚠️ Allergien: ${draft.allergies}` : '',
      draft.conditions ? `🏥 Erkrankungen: ${draft.conditions}` : '',
      draft.currentMedications ? `💊 Medikamente: ${draft.currentMedications}` : '',
      draft.doctorName ? `👨‍⚕️ Arzt: ${draft.doctorName} ${draft.doctorPhone}` : '',
      draft.insuranceName ? `💳 Kasse: ${draft.insuranceName} ${draft.insuranceNumber}` : '',
      draft.emergencyContact ? `🚨 Notfall: ${draft.emergencyContact}` : '',
      draft.notes ? `📝 ${draft.notes}` : '',
    ].filter(Boolean).join('\n')
    try {
      const url = await QRCode.toDataURL(data, { width: 280, margin: 2, color: { dark: '#0d2b27', light: '#ffffff' } })
      setQrDataUrl(url)
      setShowQR(true)
    } catch { /* ignore */ }
  }

  if (showQR) {
    return (
      <div className="screen">
        <Header title="📋 Notfall QR-Code" onBack={() => setShowQR(false)} />
        <div className="scroll-zone" style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
          <div style={{ borderRadius: '24px', padding: '20px', backgroundColor: 'rgba(255,255,255,0.95)', boxShadow: '0 8px 28px rgba(42,157,143,0.2)', textAlign: 'center' }}>
            <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#dc2626', margin: '0 0 12px' }}>
              🚨 Im Notfall QR-Code zeigen
            </p>
            {qrDataUrl && <img src={qrDataUrl} alt="QR Code" style={{ width: '240px', height: '240px' }} />}
            <p style={{ fontSize: '0.8rem', color: '#1a4a44', margin: '12px 0 0', lineHeight: 1.5 }}>
              Notarzt scannt diesen Code und hat sofort alle wichtigen Gesundheitsdaten.
            </p>
          </div>
          <div style={{ width: '100%', borderRadius: '18px', padding: '16px', background: 'rgba(255,255,255,0.88)', border: '1.5px solid rgba(255,255,255,0.65)' }}>
            <p style={{ fontSize: '1rem', fontWeight: 800, color: '#0d2b27', margin: '0 0 10px' }}>👤 {userName}</p>
            {draft.bloodType && <p style={{ fontSize: '0.95rem', color: '#1a4a44', margin: '4px 0' }}>🩸 Blutgruppe: <strong>{draft.bloodType}</strong></p>}
            {draft.allergies && <p style={{ fontSize: '0.95rem', color: '#dc2626', margin: '4px 0' }}>⚠️ Allergien: {draft.allergies}</p>}
            {draft.conditions && <p style={{ fontSize: '0.95rem', color: '#1a4a44', margin: '4px 0' }}>🏥 Erkrankungen: {draft.conditions}</p>}
            {draft.currentMedications && <p style={{ fontSize: '0.95rem', color: '#1a4a44', margin: '4px 0' }}>💊 Medis: {draft.currentMedications}</p>}
            {draft.doctorName && <p style={{ fontSize: '0.95rem', color: '#1a4a44', margin: '4px 0' }}>👨‍⚕️ {draft.doctorName}: {draft.doctorPhone}</p>}
            {draft.emergencyContact && <p style={{ fontSize: '0.95rem', color: '#dc2626', margin: '4px 0' }}>🚨 Notfall: {draft.emergencyContact}</p>}
          </div>
        </div>
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
    )
  }

  return (
    <div className="screen">
      <Header title="🏥 Arzt-Akte" onBack={onBack} />

      <div className="scroll-zone" style={{ padding: '14px 16px', paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {saved && (
          <div style={{ borderRadius: '16px', padding: '12px', background: 'linear-gradient(135deg, #52d68a, #a8edbb)', textAlign: 'center' }}>
            <p style={{ fontSize: '1rem', fontWeight: 800, color: '#0d2b27', margin: 0 }}>✅ Gespeichert!</p>
          </div>
        )}

        {/* Blutgruppe */}
        <div style={{ borderRadius: '20px', padding: '16px', background: 'rgba(255,255,255,0.92)', border: '1.5px solid rgba(255,255,255,0.65)' }}>
          <p style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0d2b27', margin: '0 0 12px' }}>🩸 Blutgruppe</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {BLOOD_TYPES.map(bt => (
              <button key={bt} onClick={() => update('bloodType', bt)}
                style={{
                  borderRadius: '12px', padding: '8px 14px', fontSize: '0.95rem', fontWeight: 700,
                  background: draft.bloodType === bt ? 'linear-gradient(135deg, #ef4444, #dc2626)' : '#fff',
                  color: draft.bloodType === bt ? '#fff' : '#0d2b27',
                  border: `2px solid ${draft.bloodType === bt ? '#dc2626' : '#b5e3e3'}`,
                }}
              >{bt}</button>
            ))}
          </div>
        </div>

        {/* Gesundheitsdaten */}
        <div style={{ borderRadius: '20px', padding: '16px', background: 'rgba(255,255,255,0.92)', border: '1.5px solid rgba(255,255,255,0.65)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <p style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0d2b27', margin: 0 }}>📋 Gesundheitsdaten</p>
          <Field label="⚠️ Allergien" value={draft.allergies} onChange={v => update('allergies', v)} multiline placeholder="z.B. Penizillin, Nüsse…" />
          <Field label="🏥 Vorerkrankungen" value={draft.conditions} onChange={v => update('conditions', v)} multiline placeholder="z.B. Diabetes, Bluthochdruck…" />
          <Field label="💊 Aktuelle Medikamente" value={draft.currentMedications} onChange={v => update('currentMedications', v)} multiline placeholder="z.B. Metformin 500mg, Aspirin…" />
          <Field label="📝 Sonstige Hinweise" value={draft.notes} onChange={v => update('notes', v)} multiline placeholder="z.B. Herzschrittmacher, Sehbehinderung…" />
        </div>

        {/* Hausarzt */}
        <div style={{ borderRadius: '20px', padding: '16px', background: 'rgba(255,255,255,0.92)', border: '1.5px solid rgba(255,255,255,0.65)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <p style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0d2b27', margin: 0 }}>👨‍⚕️ Hausarzt</p>
          <Field label="Name" value={draft.doctorName} onChange={v => update('doctorName', v)} placeholder="Dr. Müller" />
          <Field label="Telefon" value={draft.doctorPhone} onChange={v => update('doctorPhone', v)} type="tel" placeholder="+49 30 123456" />
          {draft.doctorPhone && (
            <button onClick={() => { window.location.href = `tel:${draft.doctorPhone}` }}
              style={{ borderRadius: '14px', padding: '12px', background: 'linear-gradient(135deg, #52d68a, #16a34a)', border: 'none', fontSize: '1rem', fontWeight: 800, color: '#fff' }}>
              📞 Hausarzt anrufen
            </button>
          )}
        </div>

        {/* Krankenversicherung */}
        <div style={{ borderRadius: '20px', padding: '16px', background: 'rgba(255,255,255,0.92)', border: '1.5px solid rgba(255,255,255,0.65)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <p style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0d2b27', margin: 0 }}>💳 Krankenversicherung</p>
          <Field label="Krankenkasse" value={draft.insuranceName} onChange={v => update('insuranceName', v)} placeholder="z.B. AOK, Barmer…" />
          <Field label="Versichertennummer" value={draft.insuranceNumber} onChange={v => update('insuranceNumber', v)} placeholder="A123456789" />
        </div>

        {/* Notfallkontakt */}
        <div style={{ borderRadius: '20px', padding: '16px', background: 'rgba(255,255,255,0.92)', border: '1.5px solid rgba(255,255,255,0.65)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <p style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0d2b27', margin: 0 }}>🚨 Notfallkontakt</p>
          <Field label="Name & Telefon" value={draft.emergencyContact} onChange={v => update('emergencyContact', v)} placeholder="Anna Müller, +49 170 123456" />
        </div>

        {/* Aktionen */}
        <button onClick={handleSave}
          style={{ borderRadius: '18px', padding: '18px', background: 'linear-gradient(135deg, #2a9d8f, #52d68a)', border: 'none', fontSize: '1.1rem', fontWeight: 900, color: '#fff', boxShadow: '0 6px 20px rgba(42,157,143,0.4)' }}>
          💾 Speichern
        </button>

        <button onClick={generateQR}
          style={{ borderRadius: '18px', padding: '18px', background: 'linear-gradient(135deg, #dc2626, #ef4444)', border: 'none', fontSize: '1.1rem', fontWeight: 900, color: '#fff', boxShadow: '0 6px 20px rgba(220,38,38,0.35)' }}>
          📋 QR-Code für Notfall generieren
        </button>

      </div>
    </div>
  )
}
