import { useState } from 'react'
import md5 from 'md5'

const BASE = 'https://storefront-prod.nl.picnicinternational.com/api/v15'

const BASE_HEADERS: Record<string, string> = {
  'Content-Type': 'application/json',
  'x-picnic-country': 'DE',
  'x-picnic-language': 'de',
}

export function usePicnic(email: string, password: string) {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<string | null>(null)

  async function login(): Promise<string | null> {
    const loginData = {
      key: email.trim().toLowerCase(),
      secret: md5(password),
      client_id: 1,
    }
    try {
      const res = await fetch(`${BASE}/user/login`, {
        method: 'POST',
        headers: BASE_HEADERS,
        body: JSON.stringify(loginData),
      })
      if (!res.ok) {
        let detail = `HTTP ${res.status}`
        try {
          const body = await res.json() as { error?: { message?: string; code?: string } }
          if (body.error?.message) detail += `: ${body.error.message}`
          else if (body.error?.code) detail += `: ${body.error.code}`
        } catch { /* body not JSON */ }
        setStatus(`❌ Picnic Login fehlgeschlagen – ${detail}`)
        return null
      }
      const token = res.headers.get('x-picnic-auth')
      if (!token) {
        setStatus('❌ Kein Auth-Token in Antwort – bitte Picnic App prüfen')
        return null
      }
      return token
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setStatus(`❌ Netzwerk-Fehler: ${msg}`)
      return null
    }
  }

  async function searchProduct(token: string, query: string): Promise<string | null> {
    try {
      const res = await fetch(`${BASE}/search?search_term=${encodeURIComponent(query)}`, {
        headers: { ...BASE_HEADERS, 'x-picnic-auth': token },
      })
      if (!res.ok) return null
      const data = await res.json() as Array<{ type: string; items?: Array<{ id: string }> }>
      for (const section of data) {
        if (section.type === 'SEARCH_RESULT_ITEMS' && section.items?.[0]) {
          return section.items[0].id
        }
      }
      return null
    } catch {
      return null
    }
  }

  async function addToCart(token: string, productId: string) {
    try {
      await fetch(`${BASE}/cart/add_product`, {
        method: 'POST',
        headers: { ...BASE_HEADERS, 'x-picnic-auth': token },
        body: JSON.stringify({ product_id: productId, count: 1 }),
      })
    } catch { /* ignore */ }
  }

  async function orderItems(items: string[]) {
    if (!email || !password) {
      setStatus('⚙️ Picnic E-Mail & Passwort in Einstellungen eintragen!')
      setTimeout(() => setStatus(null), 4000)
      return
    }
    if (items.length === 0) {
      setStatus('🛒 Liste ist leer!')
      setTimeout(() => setStatus(null), 3000)
      return
    }
    setLoading(true)
    setStatus('🔑 Bei Picnic anmelden...')
    const token = await login()
    if (!token) {
      setLoading(false)
      setTimeout(() => setStatus(null), 6000)
      return
    }
    let added = 0
    for (const item of items) {
      setStatus(`🔍 Suche: ${item}...`)
      const productId = await searchProduct(token, item)
      if (productId) {
        await addToCart(token, productId)
        added++
      }
    }
    setStatus(`✅ ${added} von ${items.length} Artikel bei Picnic hinzugefügt!`)
    setLoading(false)
    setTimeout(() => setStatus(null), 5000)
  }

  return { orderItems, loading, status }
}
