import { useEffect, useRef, useState } from 'react'
import * as portfolio from '../../services/portfolioService.js'
import { ALLOWED_TYPES, validateFile } from '../../utils/imageProcessing.js'

export default function AdminWebsiteImages() {
  const [currentUrls, setCurrentUrls] = useState({})
  const [customized, setCustomized] = useState({})
  const [previews, setPreviews] = useState({}) // slotKey -> { file, url }
  const [busy, setBusy] = useState(null) // slotKey being saved
  const [error, setError] = useState({}) // slotKey -> error
  const [toast, setToast] = useState('')

  useEffect(() => {
    let revokes = []
    let cancelled = false
    async function run() {
      const map = {}
      const custom = {}
      for (const slot of portfolio.SITE_IMAGE_SLOTS) {
        const url = await portfolio.getSiteImageUrl(slot.key)
        map[slot.key] = url
        if (url && url.startsWith('blob:')) revokes.push(url)
        custom[slot.key] = portfolio.isSiteImageCustomized(slot.key)
      }
      if (!cancelled) { setCurrentUrls(map); setCustomized(custom) }
    }
    run()
    return () => { cancelled = true; for (const u of revokes) URL.revokeObjectURL(u) }
  }, [])

  function showToast(msg) {
    setToast(msg)
    window.clearTimeout(showToast._t)
    showToast._t = window.setTimeout(() => setToast(''), 3500)
  }

  function handleFileFor(slotKey, file) {
    try {
      validateFile(file)
    } catch (err) {
      setError((e) => ({ ...e, [slotKey]: err.message }))
      return
    }
    setError((e) => { const n = { ...e }; delete n[slotKey]; return n })
    // Revoke old preview url
    setPreviews((p) => {
      if (p[slotKey]) URL.revokeObjectURL(p[slotKey].url)
      return { ...p, [slotKey]: { file, url: URL.createObjectURL(file) } }
    })
  }

  async function handleSave(slotKey) {
    const prev = previews[slotKey]
    if (!prev) return
    setBusy(slotKey)
    try {
      await portfolio.setSiteImage(slotKey, prev.file)
      const url = await portfolio.getSiteImageUrl(slotKey)
      setCurrentUrls((m) => ({ ...m, [slotKey]: url }))
      setCustomized((c) => ({ ...c, [slotKey]: true }))
      URL.revokeObjectURL(prev.url)
      setPreviews((p) => { const n = { ...p }; delete n[slotKey]; return n })
      showToast('Image replaced on the public site.')
    } catch (err) {
      setError((e) => ({ ...e, [slotKey]: err.message || 'Save failed.' }))
    } finally {
      setBusy(null)
    }
  }

  function cancelPreview(slotKey) {
    setPreviews((p) => {
      if (p[slotKey]) URL.revokeObjectURL(p[slotKey].url)
      const n = { ...p }; delete n[slotKey]; return n
    })
    setError((e) => { const n = { ...e }; delete n[slotKey]; return n })
  }

  async function handleRestore(slotKey) {
    if (!window.confirm('Restore the original image for this slot?')) return
    await portfolio.restoreSiteImage(slotKey)
    const url = await portfolio.getSiteImageUrl(slotKey)
    setCurrentUrls((m) => ({ ...m, [slotKey]: url }))
    setCustomized((c) => ({ ...c, [slotKey]: false }))
    showToast('Original image restored.')
  }

  return (
    <>
      <p className="site-images-intro">
        These images appear in fixed places across the public site. Replace them any time, then restore the original if you change your mind.
      </p>
      <ul className="site-images-list">
        {portfolio.SITE_IMAGE_SLOTS.map((slot) => (
          <SlotRow
            key={slot.key}
            slot={slot}
            currentUrl={currentUrls[slot.key]}
            customized={customized[slot.key]}
            preview={previews[slot.key]}
            error={error[slot.key]}
            busy={busy === slot.key}
            onFile={(file) => handleFileFor(slot.key, file)}
            onSave={() => handleSave(slot.key)}
            onCancel={() => cancelPreview(slot.key)}
            onRestore={() => handleRestore(slot.key)}
          />
        ))}
      </ul>

      {toast && (<div className="admin-toast" role="status" aria-live="polite">{toast}</div>)}
    </>
  )
}

function SlotRow({ slot, currentUrl, customized, preview, error, busy, onFile, onSave, onCancel, onRestore }) {
  const inputRef = useRef(null)
  const showingUrl = preview ? preview.url : currentUrl

  return (
    <li className="site-image-slot">
      <div className="site-image-slot-preview">
        {showingUrl ? (
          <img src={showingUrl} alt={slot.label} />
        ) : (
          <div className="site-image-slot-placeholder" aria-hidden="true">…</div>
        )}
      </div>
      <div className="site-image-slot-body">
        <div className="site-image-slot-head">
          <h3>{slot.label}</h3>
          {customized && !preview && <span className="site-image-slot-tag">Customized</span>}
        </div>
        <p className="site-image-slot-desc">{slot.description}</p>
        <p className="site-image-slot-size">{slot.recommended}</p>
        {error && <p className="form-error" role="alert">{error}</p>}

        <input
          ref={inputRef}
          type="file"
          accept={ALLOWED_TYPES.join(',')}
          className="portfolio-file-input"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = '' }}
          aria-label={`Replace ${slot.label}`}
        />

        <div className="site-image-slot-actions">
          {preview ? (
            <>
              <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={busy}>Cancel</button>
              <button type="button" className="btn btn-primary" onClick={onSave} disabled={busy}>
                {busy ? 'Saving…' : 'Save new image'}
              </button>
            </>
          ) : (
            <>
              {customized && (
                <button type="button" className="btn btn-secondary" onClick={onRestore}>Restore original</button>
              )}
              <button type="button" className="btn btn-primary" onClick={() => inputRef.current?.click()}>Replace image</button>
            </>
          )}
        </div>
      </div>
    </li>
  )
}
