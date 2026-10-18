import { useEffect, useRef } from 'react'

// Reusable native <dialog> wrapper for admin area modals.
// Important: we DO NOT call dialog.close() in the useEffect cleanup — doing so
// queues an async `close` event that StrictMode's remount cycle will catch with
// the next listener and unmount the modal (same bug fixed in BookingModal).
export default function AdminModal({ onClose, children, labelledBy, size = 'default' }) {
  const dialogRef = useRef(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (!dialog.open) dialog.showModal()
    const closeHandler = () => onCloseRef.current()
    dialog.addEventListener('close', closeHandler)
    return () => {
      dialog.removeEventListener('close', closeHandler)
    }
  }, [])

  function handleBackdropClick(e) {
    if (e.target === dialogRef.current) onCloseRef.current()
  }

  return (
    <dialog
      ref={dialogRef}
      className={`admin-modal admin-modal--${size}`}
      onClick={handleBackdropClick}
      aria-labelledby={labelledBy}
    >
      {children}
    </dialog>
  )
}
