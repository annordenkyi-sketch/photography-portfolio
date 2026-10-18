// Human-friendly "time ago" for notifications.
// Returns short labels: "Just now", "5 min ago", "3 hr ago", "Yesterday",
// "3 days ago", or an absolute date for anything older than a week.
export function formatRelativeTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const now = new Date()
  const diff = Math.max(0, (now - d) / 1000) // seconds

  if (diff < 60) return 'Just now'
  if (diff < 3600) {
    const m = Math.floor(diff / 60)
    return `${m} min ago`
  }
  if (diff < 86400) {
    const h = Math.floor(diff / 3600)
    return `${h} hr ago`
  }
  // Compare calendar dates for Yesterday
  const today = startOfDay(now)
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1)
  const target = startOfDay(d)
  if (target.getTime() === yesterday.getTime()) return 'Yesterday'

  const days = Math.floor((today - target) / 86400000)
  if (days < 7) return `${days} days ago`

  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function startOfDay(d) {
  const x = new Date(d); x.setHours(0, 0, 0, 0); return x
}
