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
            content: `Extrahiere alle Einkaufsartikel und Lebensmittel aus diesem deutschen Text. Gib nur ein JSON-Array von Strings zurück, keine Erklärung, kein Markdown, kein Text davor oder danach. Nur das Array.\n\nBeispiel:\nEingabe: "Ich brauche noch Milch und vergiss nicht das Brot"\nAusgabe: ["Milch","Brot"]\n\nText: "${text.replace(/"/g, "'")}"`
          }]
        }),
      })

      if (!res.ok) {
        const errBody = await res.text()
        throw new Error(`API Fehler ${res.status}: ${errBody}`)
      }

      const data = await res.json()
      const content = data.content?.[0]?.text ?? ''

      // Extract JSON array from response
      const match = content.match(/\[[\s\S]*?\]/)
      if (!match) {
        // Fallback: split by comma/und
        return text.split(/[,\n]|\s+und\s+/i).map(s => s.trim()).filter(Boolean)
      }
      const items: string[] = JSON.parse(match[0])
      return items.filter(i => typeof i === 'string' && i.trim().length > 0)
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
