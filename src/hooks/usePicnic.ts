import { useState } from 'react'
import md5 from 'md5'

async function picnicProxy(endpoint: string, method: string, body?: unknown, token?: string) {
  const res = await fetch('/api/picnic', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint, method, body, token }),
  })
  return { res, data: await res.json() as Record<string, unknown> }
}

export function usePicnic(email: string, password: string) {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<string | null>(null)

  async function login(): Promise<string | null> {
    try {
      const { res, data } = await picnicProxy('/user/login', 'POST', {
        key: email.trim().toLowerCase(),
        secret: md5(password),
        client_id: 1,
      })

      if (!res.ok) {
        const err = (data as { error?: { message?: string; code?: string } }).error
        const detail = err?.message || err?.code || `HTTP ${res.status}`
        setStatus(`❌ Picnic Login fehlgeschlagen: ${detail}`)
        return null
      }

      const token = res.headers.get('x-picnic-auth')
      if (!token) {
        setStatus('❌ Kein Auth-Token – bitte Zugangsdaten prüfen')
        return null
      }
      return token
    } catch (e) {
      setStatus(`❌ Proxy-Fehler: ${e instanceof Error ? e.message : String(e)}`)
      return null
    }
  }

  async function searchProduct(token: string, query: string): Promise<string | null> {
    try {
      const { res, data } = await picnicProxy(
        `/search?search_term=${encodeURIComponent(query)}`,
        'GET',
        undefined,
        token
      )
      if (!res.ok) return null
      const sections = data as unknown as Array<{ type: string; items?: Array<{ id: string }> }>
      for (const section of sections) {
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
      await picnicProxy('/cart/add_product', 'POST', { product_id: productId, count: 1 }, token)
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
