import { useState, useCallback } from 'react'

const CLAUDE_API = 'https://api.anthropic.com/v1/messages'
const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY as string

export function useClaudeAI() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const extractShoppingItems = useCallback(async (text: string): Promise<string[]> => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(CLAUDE_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-allow-browser': 'true',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 256,
          messages: [{
            role: 'user',
            content: `Extrahiere alle Einkaufsartikel aus diesem deutschen Text. Antworte NUR mit einem JSON-Objekt, kein Markdown, kein Text, keine Erklärung:\n{"produkte":["Artikel1","Artikel2"]}\n\nBeispiel:\nEingabe: "Ich brauche Milch und Brot"\nAusgabe: {"produkte":["Milch","Brot"]}\n\nText: "${text.replace(/"/g, "'")}"`
          }]
        }),
      })

      if (!res.ok) {
        const errBody = await res.text()
        throw new Error(`API Fehler ${res.status}: ${errBody}`)
      }

      const data = await res.json()
      const content = data.content?.[0]?.text ?? ''

      // Parse {"produkte": [...]} format
      const objMatch = content.match(/\{[\s\S]*?\}/)
      if (objMatch) {
        const parsed = JSON.parse(objMatch[0]) as { produkte?: string[] }
        if (Array.isArray(parsed.produkte)) {
          return parsed.produkte.filter(i => typeof i === 'string' && i.trim().length > 0)
        }
      }
      // Fallback: try plain array
      const arrMatch = content.match(/\[[\s\S]*?\]/)
      if (arrMatch) {
        const items: string[] = JSON.parse(arrMatch[0])
        return items.filter(i => typeof i === 'string' && i.trim().length > 0)
      }
      return text.split(/[,\n]|\s+und\s+/i).map(s => s.trim()).filter(Boolean)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Claude AI nicht verfügbar'
      setError(msg)
      // Fallback to simple parsing
      return text.split(/[,\n]|\s+und\s+/i).map(s => s.trim()).filter(Boolean)
    } finally {
      setLoading(false)
    }
  }, [])

  return { extractShoppingItems, loading, error }
}
