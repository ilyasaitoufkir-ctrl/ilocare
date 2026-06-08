const ALLOWED_FEEDS = new Set([
  'https://www.tagesschau.de/xml/rss2/',
  'https://www.tagesschau.de/xml/rss2_thema/inland/',
  'https://www.tagesschau.de/xml/rss2_thema/ausland/',
  'https://www.tagesschau.de/xml/rss2_thema/sport/',
  'https://www.tagesschau.de/xml/rss2_thema/wirtschaft/',
  'https://www.tagesschau.de/xml/rss2_thema/wissen/',
])

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', '*')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  const feed = req.query.feed || 'https://www.tagesschau.de/xml/rss2/'

  if (!ALLOWED_FEEDS.has(feed)) {
    return res.status(400).json({ error: 'Ungültiger Feed' })
  }

  try {
    const response = await fetch(feed, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    })
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Tagesschau nicht erreichbar' })
    }
    const xml = await response.text()
    res.setHeader('Content-Type', 'application/xml; charset=utf-8')
    res.status(200).send(xml)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
