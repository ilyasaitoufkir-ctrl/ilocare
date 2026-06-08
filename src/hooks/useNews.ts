import { useState, useEffect } from 'react'
import type { NewsItem } from '../types'

const CACHE_TTL = 15 * 60 * 1000

function cacheKey(feedUrl: string) {
  return `ilocare_news_${feedUrl}`
}

export function useNews(feedUrl = 'https://www.tagesschau.de/xml/rss2/') {
  const [items, setItems] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)

    const key = cacheKey(feedUrl)
    const cached = sessionStorage.getItem(key)
    if (cached) {
      try {
        const p = JSON.parse(cached)
        if (Date.now() - p.ts < CACHE_TTL) {
          setItems(p.items)
          setLoading(false)
          return
        }
      } catch { /* ignore */ }
    }

    fetch(`/api/news?feed=${encodeURIComponent(feedUrl)}`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.text()
      })
      .then(xml => {
        const doc = new DOMParser().parseFromString(xml, 'text/xml')
        const nodes = doc.querySelectorAll('item')
        const news: NewsItem[] = Array.from(nodes).slice(0, 5).map(item => ({
          title: item.querySelector('title')?.textContent ?? '',
          link: item.querySelector('link')?.textContent ?? '',
          pubDate: item.querySelector('pubDate')?.textContent ?? '',
          description: (item.querySelector('description')?.textContent ?? '')
            .replace(/<[^>]+>/g, '')
            .trim()
            .slice(0, 140),
        }))
        setItems(news)
        sessionStorage.setItem(key, JSON.stringify({ items: news, ts: Date.now() }))
      })
      .catch(() => setError('Nachrichten nicht verfügbar'))
      .finally(() => setLoading(false))
  }, [feedUrl])

  return { items, loading, error }
}
