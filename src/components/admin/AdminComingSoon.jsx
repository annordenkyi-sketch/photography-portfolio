export default function AdminComingSoon({ title, note }) {
  return (
    <section className="admin-coming-soon">
      <h1>{title}</h1>
      <p>{note || 'This module ships in a later build task.'}</p>
    </section>
  )
}
