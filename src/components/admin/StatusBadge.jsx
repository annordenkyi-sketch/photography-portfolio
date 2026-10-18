const BOOKING_LABEL = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
  rejected: 'Rejected',
}

const PAYMENT_LABEL = {
  paid: 'Paid',
  deposit_paid: 'Deposit',
  unpaid: 'Unpaid',
  refunded: 'Refunded',
}

export function BookingStatusBadge({ status }) {
  return (
    <span className={`status-badge status-badge--${status}`}>
      {BOOKING_LABEL[status] || status}
    </span>
  )
}

export function PaymentStatusBadge({ status }) {
  return (
    <span className={`status-badge status-badge--${status}`}>
      {PAYMENT_LABEL[status] || status}
    </span>
  )
}
