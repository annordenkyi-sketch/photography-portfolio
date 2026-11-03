// Contact form submission service.
// Attempts POST /api/contact against the Go backend; falls back to a
// localStorage queue during the demo phase so visitor messages aren't
// lost before the backend is deployed. Each queued message carries
// { id, name, email, message, createdAt, delivery: 'queued' } and can be
// listed in the admin area later via listQueued().
const STORE_KEY = 'demo:contact:messages'
const ENDPOINT = '/api/contact'

function loadQueue() {
  try {
    const raw = localStorage.getItem(STORE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveQueue(list) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(list)) } catch { /* ignore */ }
}

export function listQueued() {
  return loadQueue().slice().reverse()
}

export function clearQueue() {
  try { localStorage.removeItem(STORE_KEY) } catch { /* ignore */ }
}

// Client-side validation. Matches what the Go backend will do on
// POST /api/contact so the two agree.
function validate({ name, email, message }) {
  const errors = {}
  if (!name || !name.trim()) errors.name = 'Please enter your name.'
  if (!email || !email.trim()) errors.email = 'Please enter your email.'
  else if (!/^\S+@\S+\.\S+$/.test(email.trim())) errors.email = 'Please enter a valid email address.'
  if (!message || !message.trim()) errors.message = 'Please write a short message.'
  return errors
}

// Sends a message. Resolves to:
//   { ok: true, delivery: 'backend' | 'queued' }
//     - 'backend': delivered via /api/contact (server returned 200)
//     - 'queued':  server unreachable; stored locally to resend later
//   { ok: false, status: 400|429, errors: {<field>: string} }
export async function sendMessage({ name, email, message }) {
  const clientErrors = validate({ name, email, message })
  if (Object.keys(clientErrors).length) {
    return { ok: false, status: 400, errors: clientErrors }
  }

  const payload = {
    name: name.trim(),
    email: email.trim(),
    message: message.trim(),
  }

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (res.ok) return { ok: true, delivery: 'backend' }

    if (res.status === 400) {
      let errs = {}
      try { errs = (await res.json())?.errors || {} } catch { /* ignore */ }
      return { ok: false, status: 400, errors: errs }
    }

    if (res.status === 429) {
      return {
        ok: false,
        status: 429,
        errors: { form: 'Too many messages — please try again in a few minutes.' },
      }
    }

    throw new Error(`HTTP ${res.status}`)
  } catch {
    // Backend offline or network error — queue locally and still return
    // success so the visitor is not left stranded. A later task can post
    // the queue to the backend once it's up.
    const queue = loadQueue()
    queue.push({
      id: `msg_${Date.now()}`,
      ...payload,
      createdAt: new Date().toISOString(),
      delivery: 'queued',
    })
    saveQueue(queue)
    return { ok: true, delivery: 'queued' }
  }
}
