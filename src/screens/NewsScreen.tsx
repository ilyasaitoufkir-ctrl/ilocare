import React from 'react'
import { ExternalLink } from 'lucide-react'
import { Header } from '../components/Header'
import { useNews } from '../hooks/useNews'

interface NewsScreenProps {
  onBack: () => void
}

function formatDate(pubDate: string): string {
  if (!pubDate) return ''
  try {
    return new Date(pubDate).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

export function NewsScreen({ onBack }: NewsScreenProps) {
  const { items, loading, error } = useNews()

  return (
    <div className="screen">
      <Header title="📰 Nachrichten" onBack={onBack} />

      <div className="scroll-zone" style={{ padding: '14px 16px', paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)', display: 'flex', flexDirection: 'column', gap: '14px' }}>

        {/* Quelle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '14px', padding: '10px 16px', backgroundColor: 'rgba(255,255,255,0.82)', border: '1.5px solid rgba(255,255,255,0.6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.4rem' }}>📡</span>
            <div>
              <p style={{ fontSize: '1rem', fontWeight: 800, color: '#0d2b27', margin: 0 }}>Tagesschau</p>
              <p style={{ fontSize: '0.8rem', color: '#1a4a44', margin: 0 }}>Top-Nachrichten aus Deutschland</p>
            </div>
          </div>
          {loading && (
            <span style={{ fontSize: '0.85rem', color: '#2a9d8f', fontWeight: 700 }}>Lädt...</span>
          )}
        </div>

        {/* Fehler */}
        {error && (
          <div style={{ borderRadius: '16px', padding: '16px', backgroundColor: '#fef2f2', border: '2px solid #fca5a5' }}>
            <p style={{ fontSize: '1rem', fontWeight: 700, color: '#dc2626', margin: 0 }}>
              📡 {error} – bitte Internet prüfen
            </p>
          </div>
        )}

        {/* Skeleton-Platzhalter */}
        {loading && items.length === 0 && Array.from({ length: 5 }).map((_, i) => (
          <div key={i} style={{ borderRadius: '20px', padding: '18px', backgroundColor: 'rgba(255,255,255,0.7)', border: '1.5px solid rgba(255,255,255,0.5)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ height: '20px', borderRadius: '8px', backgroundColor: '#b5e3e3', width: `${70 + (i % 3) * 10}%` }} />
            <div style={{ height: '14px', borderRadius: '6px', backgroundColor: '#d1fae5', width: '90%' }} />
            <div style={{ height: '14px', borderRadius: '6px', backgroundColor: '#d1fae5', width: '75%' }} />
          </div>
        ))}

        {/* Artikel */}
        {items.map((item, i) => (
          <a
            key={i}
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'block',
              borderRadius: '20px',
              padding: '18px 18px 16px',
              background: 'rgba(255,255,255,0.92)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1.5px solid rgba(255,255,255,0.65)',
              boxShadow: '0 4px 16px rgba(42,157,143,0.1)',
              textDecoration: 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '8px' }}>
              <p style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0d2b27', margin: 0, lineHeight: 1.35, flex: 1 }}>
                {item.title}
              </p>
              <ExternalLink size={18} color="#2a9d8f" style={{ flexShrink: 0, marginTop: '3px' }} />
            </div>

            {item.description && (
              <p style={{ fontSize: '0.95rem', color: '#1a4a44', margin: '0 0 10px', lineHeight: 1.5, fontWeight: 500 }}>
                {item.description}
              </p>
            )}

            {item.pubDate && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#2a9d8f', flexShrink: 0 }} />
                <span style={{ fontSize: '0.82rem', color: '#2a9d8f', fontWeight: 600 }}>{formatDate(item.pubDate)}</span>
              </div>
            )}
          </a>
        ))}

        {!loading && !error && items.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: '60px', gap: '16px' }}>
            <span style={{ fontSize: '3.5rem' }}>📰</span>
            <p style={{ fontSize: '1.1rem', color: '#1a4a44', textAlign: 'center', margin: 0, fontWeight: 600 }}>Keine Nachrichten verfügbar</p>
          </div>
        )}
      </div>
    </div>
  )
}
