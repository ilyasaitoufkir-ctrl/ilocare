import React, { useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { Header } from '../components/Header'
import { useNews } from '../hooks/useNews'

interface NewsScreenProps {
  onBack: () => void
}

const CATEGORIES = [
  { label: '🌍 Alle',       feed: 'https://www.tagesschau.de/xml/rss2/' },
  { label: '🏛️ Politik',    feed: 'https://www.tagesschau.de/xml/rss2_thema/inland/' },
  { label: '✈️ Ausland',    feed: 'https://www.tagesschau.de/xml/rss2_thema/ausland/' },
  { label: '⚽ Sport',      feed: 'https://www.tagesschau.de/xml/rss2_thema/sport/' },
  { label: '💼 Wirtschaft', feed: 'https://www.tagesschau.de/xml/rss2_thema/wirtschaft/' },
  { label: '🔬 Wissen',     feed: 'https://www.tagesschau.de/xml/rss2_thema/wissen/' },
]

function formatDate(pubDate: string): string {
  if (!pubDate) return ''
  try {
    return new Date(pubDate).toLocaleDateString('de-DE', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
    })
  } catch {
    return ''
  }
}

export function NewsScreen({ onBack }: NewsScreenProps) {
  const [activeFeed, setActiveFeed] = useState(CATEGORIES[0].feed)
  const { items, loading, error } = useNews(activeFeed)

  return (
    <div className="screen">
      <Header title="Nachrichten" onBack={onBack} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* ── Logo + Kategorie-Chips ────────────────────────────────────── */}
        <div style={{ flexShrink: 0, padding: '12px 16px 0', display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Tagesschau Logo */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                backgroundColor: '#cc0000',
                borderRadius: '8px',
                padding: '5px 12px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{
                  fontSize: '1.1rem', fontWeight: 900, color: '#fff',
                  letterSpacing: '-0.5px', fontFamily: 'Georgia, serif',
                }}>tagesschau</span>
              </div>
              <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>
                Top-Nachrichten
              </span>
            </div>
            {loading && (
              <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)', fontWeight: 700 }}>⏳ Lädt...</span>
            )}
          </div>

          {/* Filter-Chips */}
          <div style={{
            display: 'flex', gap: '8px', overflowX: 'auto',
            WebkitOverflowScrolling: 'touch' as const,
            paddingBottom: '4px',
            scrollbarWidth: 'none',
          }}>
            {CATEGORIES.map(cat => {
              const active = cat.feed === activeFeed
              return (
                <button
                  key={cat.feed}
                  onClick={() => setActiveFeed(cat.feed)}
                  style={{
                    flexShrink: 0,
                    borderRadius: '20px',
                    padding: '8px 16px',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                    background: active
                      ? 'linear-gradient(135deg, #2a9d8f, #52d68a)'
                      : 'rgba(255,255,255,0.82)',
                    color: active ? '#fff' : '#1a4a44',
                    border: active ? 'none' : '1.5px solid rgba(255,255,255,0.5)',
                    boxShadow: active ? '0 3px 12px rgba(42,157,143,0.35)' : 'none',
                    transition: 'all 0.15s',
                  }}
                >
                  {cat.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Artikel-Liste ─────────────────────────────────────────────── */}
        <div className="scroll-zone" style={{ padding: '12px 16px', paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)', display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Fehler */}
          {error && (
            <div style={{ borderRadius: '16px', padding: '16px', backgroundColor: '#fef2f2', border: '2px solid #fca5a5' }}>
              <p style={{ fontSize: '1rem', fontWeight: 700, color: '#dc2626', margin: 0 }}>
                📡 {error} – bitte Internet prüfen
              </p>
            </div>
          )}

          {/* Skeleton */}
          {loading && items.length === 0 && Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{ borderRadius: '20px', padding: '18px', backgroundColor: 'rgba(255,255,255,0.7)', border: '1.5px solid rgba(255,255,255,0.5)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ height: '20px', borderRadius: '8px', backgroundColor: '#b5e3e3', width: `${65 + (i % 3) * 10}%` }} />
              <div style={{ height: '14px', borderRadius: '6px', backgroundColor: '#d1fae5', width: '90%' }} />
              <div style={{ height: '14px', borderRadius: '6px', backgroundColor: '#d1fae5', width: '70%' }} />
            </div>
          ))}

          {/* Artikel */}
          {items.map((item, i) => (
            <a
              key={`${activeFeed}-${i}`}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'block',
                borderRadius: '20px',
                padding: '18px 18px 14px',
                background: 'rgba(255,255,255,0.92)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '1.5px solid rgba(255,255,255,0.65)',
                boxShadow: '0 4px 16px rgba(42,157,143,0.1)',
                textDecoration: 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px', marginBottom: item.description ? '8px' : '0' }}>
                <p style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0d2b27', margin: 0, lineHeight: 1.35, flex: 1 }}>
                  {item.title}
                </p>
                <ExternalLink size={17} color="#2a9d8f" style={{ flexShrink: 0, marginTop: '4px' }} />
              </div>

              {item.description && (
                <p style={{ fontSize: '0.95rem', color: '#1a4a44', margin: '0 0 10px', lineHeight: 1.5, fontWeight: 500 }}>
                  {item.description}
                </p>
              )}

              {item.pubDate && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#2a9d8f', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.82rem', color: '#2a9d8f', fontWeight: 600 }}>
                    {formatDate(item.pubDate)}
                  </span>
                </div>
              )}
            </a>
          ))}

          {!loading && !error && items.length === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: '60px', gap: '16px' }}>
              <span style={{ fontSize: '3.5rem' }}>📰</span>
              <p style={{ fontSize: '1.1rem', color: '#1a4a44', textAlign: 'center', margin: 0, fontWeight: 600 }}>
                Keine Nachrichten in dieser Kategorie
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
