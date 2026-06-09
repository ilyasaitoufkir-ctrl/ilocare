import React, { useState } from 'react'
import { Header } from '../components/Header'
import type { Contact, PainEntry } from '../types'

const PART_LABELS: Record<string, string> = {
  kopf: 'Kopf',
  hals: 'Hals / Nacken',
  brust: 'Brust',
  bauch: 'Bauch',
  ruecken_oben: 'Oberer Rücken',
  ruecken_unten: 'Unterer Rücken',
  arm_links: 'Linker Arm',
  arm_rechts: 'Rechter Arm',
  bein_links: 'Linkes Bein',
  bein_rechts: 'Rechtes Bein',
  fuss_links: 'Linker Fuß',
  fuss_rechts: 'Rechter Fuß',
}

function painColor(s: number): string {
  if (s <= 3) return '#22c55e'
  if (s <= 6) return '#eab308'
  if (s <= 9) return '#f97316'
  return '#ef4444'
}

function severityEmoji(s: number): string {
  if (s <= 2) return '😊'
  if (s <= 4) return '😐'
  if (s <= 6) return '😟'
  if (s <= 8) return '😢'
  return '😭'
}

interface Part {
  id: string
  type: 'circle' | 'rect'
  cx?: number; cy?: number; r?: number
  x?: number; y?: number; w?: number; h?: number; rx?: number
}

const SHARED: Part[] = [
  { id: 'kopf',        type: 'circle', cx: 100, cy: 38, r: 28 },
  { id: 'hals',        type: 'rect', x: 87, y: 65,  w: 26,  h: 20,  rx: 6  },
  { id: 'arm_links',   type: 'rect', x: 18, y: 84,  w: 33,  h: 118, rx: 10 },
  { id: 'arm_rechts',  type: 'rect', x: 149,y: 84,  w: 33,  h: 118, rx: 10 },
  { id: 'bein_links',  type: 'rect', x: 57, y: 203, w: 37,  h: 138, rx: 10 },
  { id: 'bein_rechts', type: 'rect', x: 106,y: 203, w: 37,  h: 138, rx: 10 },
  { id: 'fuss_links',  type: 'rect', x: 57, y: 342, w: 37,  h: 26,  rx: 8  },
  { id: 'fuss_rechts', type: 'rect', x: 106,y: 342, w: 37,  h: 26,  rx: 8  },
]

const FRONT_TORSO: Part[] = [
  { id: 'brust', type: 'rect', x: 55, y: 84,  w: 90, h: 64, rx: 10 },
  { id: 'bauch', type: 'rect', x: 55, y: 147, w: 90, h: 57, rx: 10 },
]

const BACK_TORSO: Part[] = [
  { id: 'ruecken_oben',   type: 'rect', x: 55, y: 84,  w: 90, h: 64, rx: 10 },
  { id: 'ruecken_unten',  type: 'rect', x: 55, y: 147, w: 90, h: 57, rx: 10 },
]

const TORSO_LABELS = [
  { id: 'brust',         x: 100, y: 119 },
  { id: 'bauch',         x: 100, y: 178 },
  { id: 'ruecken_oben',  x: 100, y: 112 },
  { id: 'ruecken_unten', x: 100, y: 170 },
]

const SHORT_LABELS: Record<string, string> = {
  brust: 'Brust', bauch: 'Bauch',
  ruecken_oben: 'Ob. Rücken', ruecken_unten: 'Un. Rücken',
}

interface Props {
  painHistory: PainEntry[]
  contacts: Contact[]
  userName: string
  onAddEntry: (e: { bodyParts: string[]; severity: number; note: string }) => void
  onBack: () => void
}

export function PainTrackerScreen({ painHistory, contacts, userName, onAddEntry, onBack }: Props) {
  const [tab, setTab] = useState<'neu' | 'verlauf'>('neu')
  const [side, setSide] = useState<'front' | 'back'>('front')
  const [selected, setSelected] = useState<string[]>([])
  const [severity, setSeverity] = useState(5)
  const [note, setNote] = useState('')
  const [sent, setSent] = useState(false)

  const parts: Part[] = [...SHARED, ...(side === 'front' ? FRONT_TORSO : BACK_TORSO)]

  function togglePart(id: string) {
    setSelected(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id])
  }

  function partStyle(id: string) {
    if (selected.includes(id)) {
      return { fill: painColor(severity), stroke: painColor(severity), strokeWidth: 2.5, opacity: 0.9 }
    }
    return { fill: '#d1fae5', stroke: '#7ececa', strokeWidth: 1.5, opacity: 0.85 }
  }

  function handleSend() {
    if (selected.length === 0) return
    const phones = contacts.map(c => c.phone).filter(Boolean).join(',')
    const bodyText = selected.map(p => PART_LABELS[p] || p).join(', ')
    const now = new Date().toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    let msg = `🩺 Schmerzreport von ${userName}\n📅 ${now}\n\n📍 Bereich: ${bodyText}\n💥 Stärke: ${severity}/10 ${severityEmoji(severity)}`
    if (note.trim()) msg += `\n📝 ${note.trim()}`
    if (severity >= 8) msg += '\n\n⚠️ Starke Schmerzen – bitte sofort melden!\nGgf. Hausarzt informieren.'
    onAddEntry({ bodyParts: selected, severity, note })
    if (phones) window.location.href = `sms:${phones}?body=${encodeURIComponent(msg)}`
    setSent(true)
    setTimeout(() => { setSent(false); setSelected([]); setNote(''); setSeverity(5) }, 3000)
  }

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const recentHistory = painHistory.filter(e => new Date(e.timestamp) >= thirtyDaysAgo)

  return (
    <div className="screen">
      <Header title="🩺 Schmerz Tracker" onBack={onBack} />

      {/* Tabs */}
      <div style={{ flexShrink: 0, display: 'flex', padding: '8px 16px 0', gap: '8px' }}>
        {(['neu', 'verlauf'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1, padding: '10px', borderRadius: '12px',
              fontWeight: 800, fontSize: '0.9rem', border: 'none',
              background: tab === t ? 'linear-gradient(135deg, #2a9d8f, #7ececa)' : 'rgba(255,255,255,0.7)',
              color: tab === t ? '#fff' : '#1a4a44',
              boxShadow: tab === t ? '0 3px 10px rgba(42,157,143,0.3)' : 'none',
              outline: tab !== t ? '1.5px solid #b5e3e3' : 'none',
            }}
          >
            {t === 'neu' ? '🩺 Neu eintragen' : `📋 Verlauf (${recentHistory.length})`}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' as const, padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {tab === 'neu' ? (
          <>
            {/* Front / Back toggle */}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              {(['front', 'back'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setSide(s)}
                  style={{
                    padding: '8px 28px', borderRadius: '20px', fontWeight: 700, fontSize: '0.9rem',
                    border: 'none',
                    background: side === s ? '#2a9d8f' : 'rgba(255,255,255,0.85)',
                    color: side === s ? '#fff' : '#1a4a44',
                    outline: side !== s ? '1.5px solid #b5e3e3' : 'none',
                    boxShadow: side === s ? '0 2px 8px rgba(42,157,143,0.35)' : 'none',
                  }}
                >
                  {s === 'front' ? '🫀 Vorne' : '🔙 Hinten'}
                </button>
              ))}
            </div>

            {/* SVG Body Map */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <svg
                viewBox="0 0 200 385"
                style={{ width: '100%', maxWidth: '200px', display: 'block' }}
              >
                {parts.map(part => {
                  const s = partStyle(part.id)
                  const common = {
                    key: part.id,
                    fill: s.fill,
                    stroke: s.stroke,
                    strokeWidth: s.strokeWidth,
                    opacity: s.opacity,
                    style: { cursor: 'pointer' },
                    onClick: () => togglePart(part.id),
                  }
                  if (part.type === 'circle') {
                    return <circle {...common} cx={part.cx} cy={part.cy} r={part.r} />
                  }
                  return <rect {...common} x={part.x} y={part.y} width={part.w} height={part.h} rx={part.rx} />
                })}

                {/* Torso labels */}
                {TORSO_LABELS.map(lbl =>
                  parts.find(p => p.id === lbl.id) ? (
                    <text
                      key={lbl.id}
                      x={lbl.x} y={lbl.y}
                      textAnchor="middle"
                      fontSize={10}
                      fontWeight={700}
                      fill={selected.includes(lbl.id) ? '#fff' : '#1a4a44'}
                      style={{ pointerEvents: 'none', userSelect: 'none' }}
                    >
                      {SHORT_LABELS[lbl.id]}
                    </text>
                  ) : null
                )}
              </svg>
            </div>

            {/* Selected parts badges */}
            {selected.length > 0 ? (
              <div style={{
                borderRadius: '14px', padding: '10px 14px',
                backgroundColor: 'rgba(255,255,255,0.9)', border: '1.5px solid #b5e3e3',
                display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center',
              }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1a4a44', marginRight: '2px' }}>
                  📍
                </span>
                {selected.map(id => (
                  <button
                    key={id}
                    onClick={() => togglePart(id)}
                    style={{
                      padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700,
                      backgroundColor: painColor(severity), color: '#fff', border: 'none', cursor: 'pointer',
                    }}
                  >
                    {PART_LABELS[id]} ✕
                  </button>
                ))}
              </div>
            ) : (
              <div style={{
                borderRadius: '14px', padding: '10px 14px', textAlign: 'center',
                backgroundColor: 'rgba(255,255,255,0.7)', border: '1.5px dashed #b5e3e3',
              }}>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#1a4a44', fontWeight: 600 }}>
                  Körperstelle antippen um Schmerzbereich zu markieren
                </p>
              </div>
            )}

            {/* Severity Scale */}
            <div style={{
              borderRadius: '16px', padding: '12px 14px',
              backgroundColor: 'rgba(255,255,255,0.9)', border: '1.5px solid #b5e3e3',
            }}>
              <p style={{ margin: '0 0 10px', fontWeight: 800, fontSize: '0.95rem', color: '#0d2b27' }}>
                Schmerzstärke:{' '}
                <span style={{ color: painColor(severity) }}>
                  {severity}/10 {severityEmoji(severity)}
                </span>
              </p>
              <div style={{ display: 'flex', gap: '3px' }}>
                {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                  <button
                    key={n}
                    onClick={() => setSeverity(n)}
                    style={{
                      flex: 1, minHeight: '44px', borderRadius: '8px',
                      fontWeight: 900, fontSize: '0.85rem', border: 'none',
                      background: severity === n ? painColor(n) : 'rgba(240,250,250,0.9)',
                      color: severity === n ? '#fff' : '#1a4a44',
                      outline: severity !== n ? '1.5px solid #b5e3e3' : 'none',
                      boxShadow: severity === n ? `0 2px 8px ${painColor(n)}55` : 'none',
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}>
                <span style={{ fontSize: '0.7rem', color: '#1a4a44', fontWeight: 600 }}>😊 Leicht</span>
                <span style={{ fontSize: '0.7rem', color: '#1a4a44', fontWeight: 600 }}>Unerträglich 😭</span>
              </div>
            </div>

            {/* Note */}
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Notiz (optional) – z.B. wann begann der Schmerz..."
              rows={2}
              style={{
                width: '100%', borderRadius: '14px', padding: '12px',
                border: '1.5px solid #b5e3e3', fontSize: '1rem', color: '#0d2b27',
                backgroundColor: 'rgba(255,255,255,0.9)', resize: 'none',
                fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
              }}
            />

            {/* Send Button */}
            {sent ? (
              <div style={{
                borderRadius: '20px', padding: '20px', textAlign: 'center',
                background: 'linear-gradient(135deg, #52d68a, #8fe03a)',
                boxShadow: '0 4px 16px rgba(82,214,138,0.4)',
              }}>
                <p style={{ margin: 0, fontWeight: 800, fontSize: '1.1rem', color: '#0d2b27' }}>
                  ✅ Familie wurde informiert! Eintrag gespeichert.
                </p>
              </div>
            ) : (
              <button
                onClick={handleSend}
                disabled={selected.length === 0}
                style={{
                  borderRadius: '20px', padding: '18px', border: 'none',
                  background: selected.length === 0
                    ? '#e2e8f0'
                    : severity >= 8
                    ? 'linear-gradient(135deg, #f05a5a, #dc2626)'
                    : 'linear-gradient(135deg, #2a9d8f, #52d68a)',
                  color: selected.length === 0 ? '#94a3b8' : '#fff',
                  fontWeight: 900, fontSize: '1.1rem', width: '100%',
                  boxShadow: selected.length === 0 ? 'none' : '0 4px 16px rgba(42,157,143,0.4)',
                  marginBottom: '8px',
                }}
              >
                📤 {severity >= 8 ? '⚠️ Dringend Familie informieren!' : 'Familie informieren'}
                {selected.length === 0 && ' (Körperstelle wählen)'}
              </button>
            )}
          </>
        ) : (
          /* History view */
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ margin: 0, fontWeight: 700, color: '#0d2b27', fontSize: '0.9rem' }}>
                Letzte 30 Tage – {recentHistory.length} Einträge
              </p>
              <button
                onClick={() => window.print()}
                style={{
                  padding: '6px 14px', borderRadius: '10px', border: 'none',
                  background: 'linear-gradient(135deg, #2a9d8f, #7ececa)',
                  color: '#fff', fontWeight: 700, fontSize: '0.8rem',
                  boxShadow: '0 2px 8px rgba(42,157,143,0.3)',
                }}
              >
                🖨️ PDF / Drucken
              </button>
            </div>

            {recentHistory.length === 0 ? (
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', padding: '48px 20px', gap: '12px',
              }}>
                <span style={{ fontSize: '3.5rem' }}>📋</span>
                <p style={{ margin: 0, color: '#1a4a44', fontWeight: 600, textAlign: 'center', fontSize: '1rem' }}>
                  Noch keine Einträge vorhanden.{'\n'}Trage deinen ersten Schmerz ein!
                </p>
              </div>
            ) : (
              recentHistory.map(entry => {
                const d = new Date(entry.timestamp)
                const dateStr = d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' })
                const timeStr = d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
                const borderColor = entry.severity >= 8 ? '#fca5a5' : entry.severity >= 5 ? '#fde68a' : '#b5e3e3'
                return (
                  <div
                    key={entry.id}
                    style={{
                      borderRadius: '16px', padding: '12px 14px',
                      backgroundColor: 'rgba(255,255,255,0.92)',
                      border: `2px solid ${borderColor}`,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0d2b27' }}>
                        {dateStr} · {timeStr}
                      </span>
                      <span style={{
                        padding: '3px 10px', borderRadius: '20px', fontWeight: 900, fontSize: '0.9rem',
                        backgroundColor: painColor(entry.severity), color: '#fff',
                      }}>
                        {entry.severity}/10 {severityEmoji(entry.severity)}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: '#1a4a44' }}>
                      📍 {entry.bodyParts.map(p => PART_LABELS[p] || p).join(' · ')}
                    </p>
                    {entry.note ? (
                      <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#4a6a65', fontStyle: 'italic' }}>
                        📝 {entry.note}
                      </p>
                    ) : null}
                  </div>
                )
              })
            )}
          </>
        )}
      </div>
    </div>
  )
}
