import { useState, useEffect } from 'react'
import type { NewsItem } from '../types'

const RSS_URL = 'https://www.tagesschau.de/xml/rss2'
const PROXY = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(RSS_URL)}&count=5`

export function useNews() {
  const [items, setItems] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const cached = sessionStorage.getItem('ilocare_news')
    if (cached) {
      try {
        const p = JSON.parse(cached)
        if (Date.now() - p.ts < 15 * 60 * 1000) {
          setItems(p.items)
          setLoading(false)
          return
        }
      } catch { /* ignore */ }
    }

    fetch(PROXY)
      .then(r => {
        if (!r.ok) throw new Error('fetch failed')
        return r.json()
      })
      .then(json => {
        if (json.status !== 'ok') throw new Error('bad response')
        const news: NewsItem[] = (json.items ?? []).slice(0, 5).map((item: Record<string, string>) => ({
          title: item.title ?? '',
          link: item.link ?? '',
          pubDate: item.pubDate ?? '',
          description: (item.description ?? '').replace(/<[^>]+>/g, '').slice(0, 120),
        }))
        setItems(news)
        sessionStorage.setItem('ilocare_news', JSON.stringify({ items: news, ts: Date.now() }))
      })
      .catch(() => setError('Nachrichten nicht verfügbar'))
      .finally(() => setLoading(false))
  }, [])

  return { items, loading, error }
}
