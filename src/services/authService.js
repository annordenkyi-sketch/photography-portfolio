// =========================================================================
// Admin auth service — frontend-only, prototype.
//
// Verifies credentials against DEMO_ADMIN, with an optional override stored
// in localStorage so the admin can change email/password from Settings.
// Tracks the "logged in" state in sessionStorage.
// =========================================================================
import { DEMO_ADMIN } from '../data/adminAccount.js'

const AUTH_KEY = 'admin:loggedIn'
const CREDS_KEY = 'demo:adminCredentials'
const LAST_LOGIN_KEY = 'demo:adminLastLogin'

function loadCreds() {
  try {
    const raw = localStorage.getItem(CREDS_KEY)
    if (raw) return { ...DEMO_ADMIN, ...JSON.parse(raw) }
  } catch { /* fall through */ }
  return DEMO_ADMIN
}

export function getCredentials() {
  return loadCreds()
}

export function updateCredentials({ currentPassword, email, newPassword }) {
  const creds = loadCreds()
  if (currentPassword !== creds.password) {
    throw new Error('Current password is incorrect.')
  }
  const next = {
    email: (email ?? creds.email).trim().toLowerCase(),
    password: newPassword ? String(newPassword) : creds.password,
  }
  if (!next.email) throw new Error('Email is required.')
  try { localStorage.setItem(CREDS_KEY, JSON.stringify(next)) } catch { /* ignore */ }
  return next
}

export function resetCredentials() {
  try { localStorage.removeItem(CREDS_KEY) } catch { /* ignore */ }
  try { localStorage.removeItem(LAST_LOGIN_KEY) } catch { /* ignore */ }
}

export function getLastLogin() {
  try { return localStorage.getItem(LAST_LOGIN_KEY) || null }
  catch { return null }
}

export function login(email, password) {
  const creds = loadCreds()
  const normalizedEmail = (email || '').trim().toLowerCase()
  const matches = normalizedEmail === creds.email.toLowerCase() && password === creds.password
  if (!matches) return false
  try {
    sessionStorage.setItem(AUTH_KEY, '1')
    localStorage.setItem(LAST_LOGIN_KEY, new Date().toISOString())
  } catch {
    // Fail soft — valid credential match still returns true.
  }
  return true
}

export function logout() {
  try { sessionStorage.removeItem(AUTH_KEY) } catch { /* ignore */ }
}

export function isAuthenticated() {
  try {
    return sessionStorage.getItem(AUTH_KEY) === '1'
  } catch {
    return false
  }
}
