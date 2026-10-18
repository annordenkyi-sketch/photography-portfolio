// One place to resolve type → icon + color class.
// Tokens are defined in index.css under .notification-icon--* so colors
// can be re-themed from the shared design tokens.

export default function NotificationIcon({ type, size = 20 }) {
  const Icon = ICONS[type] || Dot
  return (
    <span className={`notification-icon notification-icon--${type}`} aria-hidden="true">
      <Icon size={size} />
    </span>
  )
}

const ICONS = {
  new_booking: CalendarIcon,
  payment_received: MoneyIcon,
  booking_cancelled: CrossIcon,
  shoot_tomorrow: ClockIcon,
}

function base(size) {
  return { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }
}

function CalendarIcon({ size }) {
  return (
    <svg {...base(size)}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18" />
      <path d="M8 3v4" />
      <path d="M16 3v4" />
    </svg>
  )
}

function MoneyIcon({ size }) {
  return (
    <svg {...base(size)}>
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <circle cx="12" cy="12.5" r="2.5" />
      <path d="M7 10v.01" />
      <path d="M17 15v.01" />
    </svg>
  )
}

function CrossIcon({ size }) {
  return (
    <svg {...base(size)}>
      <circle cx="12" cy="12" r="9" />
      <path d="m9 9 6 6" />
      <path d="m15 9-6 6" />
    </svg>
  )
}

function ClockIcon({ size }) {
  return (
    <svg {...base(size)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  )
}

function Dot({ size }) {
  return (
    <svg {...base(size)}>
      <circle cx="12" cy="12" r="4" />
    </svg>
  )
}
