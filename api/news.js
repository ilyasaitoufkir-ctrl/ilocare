const FEEDS = {
  'alle':       'https://www.tagesschau.de/xml/rss2/',
  'inland':     'https://www.tagesschau.de/xml/rss2_thema/inland/',
  'ausland':    'https://www.tagesschau.de/xml/rss2_thema/ausland/',
  'sport':      'https://www.tagesschau.de/xml/rss2_thema/sport/',
  'wirtschaft': 'https://www.tagesschau.de/xml/rss2_thema/wirtschaft/',
  'wissen':     'https://www.tagesschau.de/xml/rss2_thema/wissen/',
  'kultur':     'https://www.tagesschau.de/xml/rss2_thema/kultur/',
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', '*')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  const kategorie = req.query.kategorie || 'alle'
  const url = FEEDS[kategorie] || FEEDS['alle']

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    })
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Feed nicht verfügbar' })
    }
    const xml = await response.text()
    res.setHeader('Content-Type', 'application/xml; charset=utf-8')
    res.status(200).send(xml)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
