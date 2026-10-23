const base = import.meta.env.VITE_API_URL || ''

export async function api(path, options = {}) {
  const credentials = sessionStorage.getItem('francis-auth')
  const response = await fetch(`${base}/api${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(credentials ? { Authorization: `Basic ${credentials}` } : {}), ...options.headers }
  })
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    const error = new Error(body.error || `Error ${response.status}`)
    error.status = response.status
    throw error
  }
  return response.status === 204 ? null : response.json()
}
