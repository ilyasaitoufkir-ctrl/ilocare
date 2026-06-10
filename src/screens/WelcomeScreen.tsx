import React from 'react'
import { Heart, Shield } from 'lucide-react'
import type { AppMode } from '../types'

interface WelcomeScreenProps {
  onSelectMode: (mode: Exclude<AppMode, 'welcome'>) => void
}

export function WelcomeScreen({ onSelectMode }: WelcomeScreenProps) {
  return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(160deg, #e8fff8 0%, #f8fffe 50%, #e8f4ff 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '32px 24px', gap: '44px',
      fontFamily: "'Inter', -apple-system, sans-serif",
    }}>

      {/* Logo & branding */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
        <div style={{
          width: '108px', height: '108px', borderRadius: '30px',
          background: 'linear-gradient(135deg, #00c896 0%, #00a67e 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 16px 48px rgba(0,200,150,0.4), 0 4px 16px rgba(0,0,0,0.08)',
        }}>
          <Heart size={56} color="#fff" strokeWidth={2.5} fill="rgba(255,255,255,0.25)" />
        </div>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{
            fontSize: '3.2rem', fontWeight: 900, margin: 0,
            letterSpacing: '-0.05em', lineHeight: 1,
            color: '#1a1a2e',
          }}>
            ilo<span style={{ color: '#00c896' }}>care</span>
          </h1>
          <p style={{ margin: '8px 0 0', fontSize: '1rem', fontWeight: 500, color: '#8892a4' }}>
            Fürsorge, die verbindet
          </p>
        </div>
      </div>

      {/* Mode selection buttons */}
      <div style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <p style={{
          textAlign: 'center', margin: '0 0 8px',
          fontSize: '0.85rem', fontWeight: 700, color: '#8892a4',
          letterSpacing: '0.05em', textTransform: 'uppercase',
        }}>
          Wer bist du?
        </p>

        {/* Senior */}
        <button
          onClick={() => onSelectMode('senior')}
          style={{
            borderRadius: '28px', padding: '22px 26px',
            background: 'linear-gradient(135deg, #00c896 0%, #00a67e 100%)',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '20px', textAlign: 'left',
            boxShadow: '0 8px 32px rgba(0,200,150,0.4), 0 2px 8px rgba(0,0,0,0.08)',
            width: '100%',
          }}
        >
          <div style={{
            width: '64px', height: '64px', borderRadius: '18px', flexShrink: 0,
            background: 'rgba(255,255,255,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2.4rem', lineHeight: 1,
          }}>
            👴
          </div>
          <div>
            <p style={{ margin: '0 0 5px', fontSize: '1.4rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>
              Ich bin Senior
            </p>
            <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: 500, color: 'rgba(255,255,255,0.85)' }}>
              Meine Gesundheits-App nutzen
            </p>
          </div>
        </button>

        {/* Family */}
        <button
          onClick={() => onSelectMode('family')}
          style={{
            borderRadius: '28px', padding: '22px 26px',
            background: '#ffffff',
            border: '2px solid #e2e8f0', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '20px', textAlign: 'left',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            width: '100%',
          }}
        >
          <div style={{
            width: '64px', height: '64px', borderRadius: '18px', flexShrink: 0,
            background: '#e8f4ff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2.4rem', lineHeight: 1,
          }}>
            👨‍👩‍👧
          </div>
          <div>
            <p style={{ margin: '0 0 5px', fontSize: '1.4rem', fontWeight: 900, color: '#1a1a2e', letterSpacing: '-0.02em' }}>
              Ich bin Familienmitglied
            </p>
            <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: 500, color: '#8892a4' }}>
              Meine Familie im Blick behalten
            </p>
          </div>
        </button>
      </div>

      {/* Privacy footer */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Shield size={14} color="#b0bac4" strokeWidth={2} />
        <p style={{ margin: 0, fontSize: '0.78rem', fontWeight: 500, color: '#b0bac4' }}>
          Deine Daten bleiben privat & sicher
        </p>
      </div>
    </div>
  )
}
