import React from 'react'
import { Header } from '../components/Header'
import type { Screen } from '../types'

interface EntertainmentScreenProps {
  onNavigate: (screen: Screen) => void
  onBack: () => void
}

export function EntertainmentScreen({ onNavigate, onBack }: EntertainmentScreenProps) {
  return (
    <div className="screen">
      <Header title="🎭 Unterhaltung" onBack={onBack} />

      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        padding: '24px 20px', gap: '20px', justifyContent: 'center',
      }}>

        <button
          onClick={() => onNavigate('news')}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', gap: '12px',
            borderRadius: '28px', padding: '32px 24px',
            background: 'linear-gradient(135deg, #003399, #0066cc)',
            boxShadow: '0 8px 28px rgba(0,51,153,0.4)',
            border: '1.5px solid rgba(255,255,255,0.4)',
          }}
        >
          <span style={{ fontSize: '3.5rem', lineHeight: 1 }}>📰</span>
          <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#ffffff', textShadow: '0 1px 4px rgba(0,0,0,0.2)' }}>
            Nachrichten
          </span>
          <span style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>
            Tagesschau – aktuelle Meldungen
          </span>
        </button>

        <button
          onClick={() => onNavigate('radio')}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', gap: '12px',
            borderRadius: '28px', padding: '32px 24px',
            background: 'linear-gradient(135deg, #52d68a, #2a9d8f)',
            boxShadow: '0 8px 28px rgba(82,214,138,0.4)',
            border: '1.5px solid rgba(255,255,255,0.4)',
          }}
        >
          <span style={{ fontSize: '3.5rem', lineHeight: 1 }}>📻</span>
          <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#ffffff', textShadow: '0 1px 4px rgba(0,0,0,0.2)' }}>
            Radio
          </span>
          <span style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>
            Antenne Bayern · NDR 2 · SWR3…
          </span>
        </button>

      </div>
    </div>
  )
}
