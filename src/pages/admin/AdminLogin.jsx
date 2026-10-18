import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../../services/authService.js'
import * as studioProfile from '../../services/studioProfileService.js'
import PhotoSlideshow from '../../components/admin/PhotoSlideshow.jsx'
import { LOGIN_SLIDESHOW } from '../../data/adminImagery.js'

export default function AdminLogin() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const profile = studioProfile.getProfile()

  function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const ok = login(email, password)
    if (ok) {
      navigate('/admin/bookings', { replace: true })
      return
    }
    setError('Invalid email or password')
  }

  return (
    <main className="admin-shell admin-login-page">
      <section className="admin-login-media">
        <PhotoSlideshow images={LOGIN_SLIDESHOW} />
        <div className="admin-login-media-scrim" aria-hidden="true" />
        <div className="admin-login-media-copy">
          <p className="admin-login-media-eyebrow">{profile.name}</p>
          <h2 className="admin-login-media-tagline">
            Where every frame holds a story worth keeping.
          </h2>
        </div>
      </section>

      <section className="admin-login-form-wrap">
        <div className="admin-card admin-login-card">
          <header className="admin-login-card-header">
            <span className="admin-login-monogram" aria-hidden="true">
              {(profile.name || 'P').charAt(0).toUpperCase()}
            </span>
            <h1 className="admin-login-title">Admin login</h1>
            <p className="admin-login-subtitle">Welcome back to your studio.</p>
          </header>

          <form className="admin-form" onSubmit={handleSubmit} noValidate={false}>
            <div className="form-field">
              <label htmlFor="admin-email">Email</label>
              <input
                type="email"
                id="admin-email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                autoFocus
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="admin-password">Password</label>
              <input
                type="password"
                id="admin-password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            {error && (
              <p className="form-error admin-login-error" role="alert">
                {error}
              </p>
            )}

            <button type="submit" className="btn btn-primary admin-submit">
              Log in
            </button>
          </form>

          <p className="admin-login-demo-hint">
            Demo: <span>demo@studio.com</span> &nbsp;·&nbsp; <span>demo1234</span>
          </p>
        </div>
      </section>
    </main>
  )
}
