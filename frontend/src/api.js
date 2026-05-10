const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000"

async function request(path, options = {}) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30000) // 30s timeout

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      ...options,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`)
    }

    return response.json()
  } catch (error) {
    clearTimeout(timeoutId)
    if (error.name === 'AbortError') {
      throw new Error('Request timeout - please try again')
    }
    throw error
  }
}

export function getIncidents() {
  return request("/incidents")
}

export function getResources() {
  return request("/resources")
}

export function analyze() {
  return request("/analyze", { method: "POST", body: JSON.stringify({}) })
}
