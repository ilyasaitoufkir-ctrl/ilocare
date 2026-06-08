export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', '*')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  const { endpoint, method, body, token } = req.body

  const headers = {
    'Content-Type': 'application/json',
    'x-picnic-country': 'DE',
    'x-picnic-language': 'de',
    'x-picnic-did': '3C417201548B2E3B',
    'x-picnic-agent': '30100;1.15.233-10293;Android/AndroidSDK',
  }

  if (token) {
    headers['x-picnic-auth'] = token
  }

  try {
    const response = await fetch(
      `https://storefront-prod.nl.picnicinternational.com/api/v15${endpoint}`,
      {
        method: method || 'GET',
        headers,
        body: body ? JSON.stringify(body) : undefined,
      }
    )

    // Forward auth token returned on login
    const authToken = response.headers.get('x-picnic-auth')
    if (authToken) {
      res.setHeader('x-picnic-auth', authToken)
    }

    let data
    const text = await response.text()
    try {
      data = JSON.parse(text)
    } catch {
      data = { raw: text }
    }

    res.status(response.status).json(data)
  } catch (e) {
    res.status(500).json({ error: { message: e.message } })
  }
}
