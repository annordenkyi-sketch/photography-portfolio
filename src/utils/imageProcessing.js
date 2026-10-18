// In-browser image processing: resize + encode to WebP so uploads stay
// small enough for IndexedDB and fast on the public site.

export const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const MAX_BYTES = 10 * 1024 * 1024 // 10 MB

export function validateFile(file) {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error(`${file.name}: only JPG, PNG, or WebP accepted.`)
  }
  if (file.size > MAX_BYTES) {
    throw new Error(`${file.name}: file is larger than 10 MB.`)
  }
}

export async function processImage(file, {
  maxWidth = 1920,
  thumbWidth = 480,
  quality = 0.82,
  thumbQuality = 0.75,
} = {}) {
  validateFile(file)
  const img = await loadImage(file)
  const fullBlob = await resizeAndEncode(img, { maxWidth, quality })
  const thumbBlob = await resizeAndEncode(img, { maxWidth: thumbWidth, quality: thumbQuality })
  return { fullBlob, thumbBlob, naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight }
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => { resolve(img); /* keep URL alive briefly */ setTimeout(() => URL.revokeObjectURL(url), 0) }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read the image file.')) }
    img.src = url
  })
}

async function resizeAndEncode(img, { maxWidth, quality }) {
  const scale = Math.min(1, maxWidth / img.naturalWidth)
  const w = Math.round(img.naturalWidth * scale)
  const h = Math.round(img.naturalHeight * scale)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  // Decent downscale quality on most browsers
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, 0, 0, w, h)
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Encoding failed.'))),
      'image/webp',
      quality,
    )
  })
}

// Shared helper for showing a Blob/File in an <img>: tracks created object
// URLs so callers can revoke after unmount.
export function blobToObjectUrl(blob) {
  return URL.createObjectURL(blob)
}
