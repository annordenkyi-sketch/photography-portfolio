import { useMemo } from 'react'
import * as bookingsService from '../../services/bookingsService.js'
import { DASHBOARD_WELCOME_IMAGE } from '../../data/adminImagery.js'

function greeting(hour) {
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export default function DashboardWelcome() {
  const now = useMemo(() => new Date(), [])
  const todayIso = now.toISOString().split('T')[0]
  const todayShoots = useMemo(
    () =>
      bookingsService.getAll().filter(
        (b) => b.date === todayIso && (b.status === 'confirmed' || b.status === 'completed'),
      ).length,
    [todayIso],
  )

  const dateStr = now.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const g = greeting(now.getHours())
  // "Perry" from the studio name; swap for real user first name later.
  const name = 'Perry'

  return (
    <section className="dashboard-welcome" aria-label="Welcome banner">
      <img
        className="dashboard-welcome-bg"
        src={DASHBOARD_WELCOME_IMAGE.src}
        alt=""
        width="1920"
        height="600"
        fetchPriority="high"
        aria-hidden="true"
      />
      <div className="dashboard-welcome-overlay" aria-hidden="true" />
      <div className="dashboard-welcome-content">
        <p className="dashboard-welcome-eyebrow">{g}</p>
        <h1 className="dashboard-welcome-title">{name}</h1>
        <p className="dashboard-welcome-meta">
          <span>{dateStr}</span>
          <span aria-hidden="true" className="dashboard-welcome-dot">·</span>
          <span>
            {todayShoots === 0
              ? 'No shoots today'
              : `${todayShoots} shoot${todayShoots === 1 ? '' : 's'} today`}
          </span>
        </p>
      </div>
    </section>
  )
}
