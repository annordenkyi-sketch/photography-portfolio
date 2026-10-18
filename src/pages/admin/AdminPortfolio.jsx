import { useEffect, useMemo, useRef, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import * as portfolio from '../../services/portfolioService.js'
import { ALLOWED_TYPES, validateFile } from '../../utils/imageProcessing.js'
import AdminWebsiteImages from './AdminWebsiteImages.jsx'

function timeAgo(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const diff = (Date.now() - d.getTime()) / 1000
  if (diff < 60) return 'Just now'
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export default function AdminPortfolio() {
  const location = useLocation()
  const isWebsiteImages = location.pathname.endsWith('/website-images')
  return (
    <PortfolioShell>
      {isWebsiteImages ? <AdminWebsiteImages /> : <GalleryManager />}
    </PortfolioShell>
  )
}

function PortfolioShell({ children }) {
  return (
    <div className="admin-portfolio-page">
      <header className="admin-page-heading">
        <div>
          <h1>Portfolio</h1>
          <p>Manage every image on the public site.</p>
        </div>
      </header>
      <nav className="portfolio-subnav" aria-label="Portfolio sections">
        <NavLink to="/admin/portfolio" end className="portfolio-subnav-link">
          Gallery photos
        </NavLink>
        <NavLink to="/admin/portfolio/website-images" className="portfolio-subnav-link">
          Website images
        </NavLink>
      </nav>
      {children}
    </div>
  )
}

/* ======================================================================
   Gallery manager — upload, categorise, feature, hide, delete, reorder
   ====================================================================== */

function GalleryManager() {
  const [photos, setPhotos] = useState(() => portfolio.listPhotoMeta())
  const [categories, setCategories] = useState(() => portfolio.getCategories())
  const [activeCat, setActiveCat] = useState('All')
  const [thumbUrls, setThumbUrls] = useState({}) // id -> object URL
  const [pending, setPending] = useState([]) // [{ name, status, error }]
  const [draggingId, setDraggingId] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [showAddCat, setShowAddCat] = useState(false)
  const [newCat, setNewCat] = useState('')
  const [toast, setToast] = useState('')
  const fileInputRef = useRef(null)

  // Resolve thumb URLs when photos change
  useEffect(() => {
    let revokes = []
    let cancelled = false
    async function run() {
      const next = {}
      for (const p of photos) {
        if (p.thumbSrc) {
          next[p.id] = p.thumbSrc
        } else {
          const url = await portfolio.resolveThumbUrl(p)
          if (url) {
            next[p.id] = url
            if (url.startsWith('blob:')) revokes.push(url)
          }
        }
      }
      if (!cancelled) setThumbUrls(next)
    }
    run()
    return () => {
      cancelled = true
      for (const u of revokes) URL.revokeObjectURL(u)
    }
  }, [photos])

  const visiblePhotos = useMemo(() => {
    const filtered = activeCat === 'All' ? photos : photos.filter((p) => p.category === activeCat)
    return filtered.slice().sort((a, b) => a.order - b.order)
  }, [photos, activeCat])

  function refresh() {
    setPhotos(portfolio.listPhotoMeta())
    setCategories(portfolio.getCategories())
  }

  function showToast(msg) {
    setToast(msg)
    window.clearTimeout(showToast._t)
    showToast._t = window.setTimeout(() => setToast(''), 3500)
  }

  async function handleFiles(fileList) {
    const files = Array.from(fileList)
    if (files.length === 0) return
    const assignCat = activeCat === 'All' ? (categories[0] || 'Wedding') : activeCat

    const queue = files.map((f) => ({ name: f.name, status: 'processing', error: null }))
    setPending(queue)
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      try {
        validateFile(file)
        await portfolio.uploadPhoto(file, { category: assignCat })
        setPending((p) => p.map((row, idx) => (idx === i ? { ...row, status: 'done' } : row)))
      } catch (err) {
        setPending((p) => p.map((row, idx) => (idx === i ? { ...row, status: 'error', error: err.message } : row)))
      }
    }
    refresh()
    // Clear completed/errored rows after a moment
    window.setTimeout(() => setPending([]), 2500)
    showToast(`${files.filter((_, i) => queue[i].status !== 'error').length} photo(s) uploaded.`)
  }

  function handleFileInput(e) {
    handleFiles(e.target.files)
    e.target.value = ''
  }

  function handleDrop(e) {
    e.preventDefault()
    handleFiles(e.dataTransfer.files)
  }

  function handleDragOver(e) {
    e.preventDefault()
  }

  function handleToggleFeatured(id) {
    portfolio.toggleFeatured(id)
    refresh()
  }
  function handleToggleHidden(id) {
    portfolio.toggleHidden(id)
    refresh()
  }
  async function handleDelete(id) {
    if (!window.confirm('Delete this photo? This cannot be undone during the demo.')) return
    await portfolio.deletePhoto(id)
    refresh()
    showToast('Photo deleted.')
  }

  function handleSaveEdit(id, patch) {
    portfolio.updatePhoto(id, patch)
    setEditingId(null)
    refresh()
    showToast('Photo updated.')
  }

  function handleAddCategory(e) {
    e.preventDefault()
    try {
      portfolio.addCategory(newCat)
      setNewCat('')
      setShowAddCat(false)
      refresh()
      showToast('Category added.')
    } catch (err) { showToast(err.message) }
  }

  // --- Drag reorder (within current filter) ---
  function onDragStart(id) { setDraggingId(id) }
  function onDragOverCard(e) { e.preventDefault() }
  function onDropOnCard(e, targetId) {
    e.preventDefault()
    if (!draggingId || draggingId === targetId) { setDraggingId(null); return }
    const ids = visiblePhotos.map((p) => p.id)
    const fromIdx = ids.indexOf(draggingId)
    const toIdx = ids.indexOf(targetId)
    if (fromIdx === -1 || toIdx === -1) { setDraggingId(null); return }
    const next = ids.slice()
    next.splice(fromIdx, 1)
    next.splice(toIdx, 0, draggingId)
    // Reorder the entire list: visible photos take the new order; invisibles stay after
    const fullIds = [...next, ...photos.map((p) => p.id).filter((id) => !next.includes(id))]
    portfolio.reorderPhotos(fullIds)
    setDraggingId(null)
    refresh()
    showToast('Order updated.')
  }

  return (
    <>
      <div
        className="portfolio-dropzone"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <div className="portfolio-dropzone-icon" aria-hidden="true">⇪</div>
        <p className="portfolio-dropzone-title">Drop photos here or click to upload</p>
        <p className="portfolio-dropzone-help">
          JPG, PNG, or WebP. Max 10 MB each. Resized to 1920 px and stored in your browser.
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_TYPES.join(',')}
          multiple
          onChange={handleFileInput}
          className="portfolio-file-input"
          aria-label="Upload photos"
        />
        <button type="button" className="btn btn-primary" onClick={() => fileInputRef.current?.click()}>
          Upload photos
        </button>
      </div>

      {pending.length > 0 && (
        <ul className="portfolio-progress">
          {pending.map((row, i) => (
            <li key={i} className={`portfolio-progress-row portfolio-progress-row--${row.status}`}>
              <span className="portfolio-progress-name">{row.name}</span>
              <span className="portfolio-progress-state">
                {row.status === 'processing' && 'Processing…'}
                {row.status === 'done' && 'Ready'}
                {row.status === 'error' && (row.error || 'Failed')}
              </span>
            </li>
          ))}
        </ul>
      )}

      <nav className="portfolio-tabs" aria-label="Filter by category">
        <button
          type="button"
          className={`portfolio-tab${activeCat === 'All' ? ' is-active' : ''}`}
          onClick={() => setActiveCat('All')}
        >All <span className="portfolio-tab-count">{photos.length}</span></button>
        {categories.map((cat) => {
          const n = photos.filter((p) => p.category === cat).length
          return (
            <button
              key={cat}
              type="button"
              className={`portfolio-tab${activeCat === cat ? ' is-active' : ''}`}
              onClick={() => setActiveCat(cat)}
            >{cat} <span className="portfolio-tab-count">{n}</span></button>
          )
        })}
        {!showAddCat ? (
          <button type="button" className="portfolio-tab portfolio-tab--add" onClick={() => setShowAddCat(true)}>+ Add category</button>
        ) : (
          <form className="portfolio-cat-form" onSubmit={handleAddCategory}>
            <input
              autoFocus
              value={newCat}
              onChange={(e) => setNewCat(e.target.value)}
              placeholder="Category name"
              aria-label="New category name"
            />
            <button type="submit" className="portfolio-cat-form-add">Add</button>
            <button type="button" className="portfolio-cat-form-cancel" onClick={() => { setShowAddCat(false); setNewCat('') }}>×</button>
          </form>
        )}
      </nav>

      {visiblePhotos.length === 0 ? (
        <p className="admin-empty">No photos in this category yet. Upload some above.</p>
      ) : (
        <ul className="portfolio-grid">
          {visiblePhotos.map((p) => (
            <li
              key={p.id}
              className={`portfolio-card${p.hidden ? ' is-hidden' : ''}${draggingId === p.id ? ' is-dragging' : ''}`}
              draggable
              onDragStart={() => onDragStart(p.id)}
              onDragOver={onDragOverCard}
              onDrop={(e) => onDropOnCard(e, p.id)}
            >
              <div className="portfolio-card-media">
                {thumbUrls[p.id] ? (
                  <img src={thumbUrls[p.id]} alt={p.title || ''} loading="lazy" />
                ) : (
                  <div className="portfolio-card-placeholder" aria-hidden="true">…</div>
                )}
                <button
                  type="button"
                  className={`portfolio-star${p.featured ? ' is-on' : ''}`}
                  onClick={() => handleToggleFeatured(p.id)}
                  aria-label={p.featured ? 'Unfeature photo' : 'Feature photo on homepage'}
                  title={p.featured ? 'Featured on homepage' : 'Feature on homepage'}
                >★</button>
              </div>

              {editingId === p.id ? (
                <PhotoEditForm photo={p} categories={categories} onSave={(patch) => handleSaveEdit(p.id, patch)} onCancel={() => setEditingId(null)} />
              ) : (
                <div className="portfolio-card-body">
                  <div className="portfolio-card-head">
                    <strong className="portfolio-card-title">{p.title || 'Untitled'}</strong>
                    <span className="portfolio-card-cat">{p.category}</span>
                  </div>
                  {p.caption && <p className="portfolio-card-caption">{p.caption}</p>}
                  <div className="portfolio-card-actions">
                    <button type="button" className="portfolio-card-link" onClick={() => setEditingId(p.id)}>Edit</button>
                    <button type="button" className="portfolio-card-link" onClick={() => handleToggleHidden(p.id)}>
                      {p.hidden ? 'Show' : 'Hide'}
                    </button>
                    <button type="button" className="portfolio-card-link portfolio-card-link--danger" onClick={() => handleDelete(p.id)}>Delete</button>
                  </div>
                  {p.uploadedAt && <p className="portfolio-card-meta">Uploaded {timeAgo(p.uploadedAt)}</p>}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {toast && (<div className="admin-toast" role="status" aria-live="polite">{toast}</div>)}
    </>
  )
}

function PhotoEditForm({ photo, categories, onSave, onCancel }) {
  const [title, setTitle] = useState(photo.title || '')
  const [caption, setCaption] = useState(photo.caption || '')
  const [category, setCategory] = useState(photo.category || categories[0] || 'Wedding')

  function handleSubmit(e) {
    e.preventDefault()
    onSave({ title: title.trim(), caption: caption.trim(), category })
  }

  return (
    <form className="portfolio-card-body portfolio-edit-form" onSubmit={handleSubmit}>
      <label className="portfolio-edit-field">
        <span>Title</span>
        <input value={title} onChange={(e) => setTitle(e.target.value)} />
      </label>
      <label className="portfolio-edit-field">
        <span>Caption</span>
        <input value={caption} onChange={(e) => setCaption(e.target.value)} />
      </label>
      <label className="portfolio-edit-field">
        <span>Category</span>
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </label>
      <div className="portfolio-edit-actions">
        <button type="button" className="btn btn-secondary portfolio-edit-cancel" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary">Save</button>
      </div>
    </form>
  )
}
