import React from 'react'
import type { Screen } from '../types'

interface HomeScreenProps {
  onNavigate: (screen: Screen) => void
  userName: string
}

const menuItems: { screen: Screen; emoji: string; label: string; color: string }[] = [
  { screen: 'contacts', emoji: '👥', label: 'Kontakte', color: '#ffffff' },
  { screen: 'medications', emoji: '💊', label: 'Medikamente', color: '#ffffff' },
  { screen: 'messages', emoji: '💬', label: 'Nachrichten', color: '#ffffff' },
  { screen: 'emergency', emoji: '🆘', label: 'Notfall', color: '#fff0f0' },
]

export function HomeScreen({ onNavigate, userName }: HomeScreenProps) {
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Guten Morgen' : hour < 18 ? 'Guten Tag' : 'Guten Abend'

  return (
    <div
      className="flex flex-col min-h-screen"
      style={{ backgroundColor: 'transparent', paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {/* Logo & Begrüßung */}
      <div
        className="flex flex-col items-center justify-center py-8 px-6"
        style={{ backgroundColor: 'rgba(255,255,255,0.88)', borderBottom: '3px solid #7ececa' }}
      >
        <div style={{ fontSize: '3.5rem' }}>🌸</div>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 900, color: '#0d2b27', margin: '8px 0 4px' }}>
          ilocare
        </h1>
        <p style={{ fontSize: '1.2rem', color: '#1a4a44', margin: 0 }}>
          {greeting}, {userName}! 😊
        </p>
      </div>

      {/* Menü Buttons */}
      <div className="flex flex-col gap-4 p-6 flex-1">
        {menuItems.map(item => (
          <button
            key={item.screen}
            onClick={() => onNavigate(item.screen)}
            className="w-full flex items-center rounded-3xl shadow-md active:shadow-sm active:scale-95 transition-all duration-100"
            style={{
              backgroundColor: item.color,
              border: item.screen === 'emergency' ? '3px solid #f87171' : '2px solid rgba(0,0,0,0.08)',
              minHeight: '100px',
              padding: '0 28px',
              gap: '20px',
            }}
          >
            <span style={{ fontSize: '2.8rem' }}>{item.emoji}</span>
            <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0d2b27' }}>
              {item.label}
            </span>
          </button>
        ))}
      </div>

      {/* Einstellungen Link */}
      <div className="pb-6 px-6">
        <button
          onClick={() => onNavigate('settings')}
          className="w-full flex items-center justify-center rounded-2xl py-4"
          style={{ backgroundColor: 'rgba(255,255,255,0.88)', border: '2px solid #7ececa' }}
        >
          <span style={{ fontSize: '1.2rem' }}>⚙️</span>
          <span style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1a4a44', marginLeft: '8px' }}>
            Einstellungen
          </span>
        </button>
      </div>
    </div>
  )
}
