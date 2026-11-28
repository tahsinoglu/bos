import { useMemo, useState } from 'react'
import { BookForm } from '../components/BookForm'
import { CaptureButton } from '../components/CaptureButton'
import { Icon } from '../components/Icon'
import { QuoteItem } from '../components/QuoteItem'
import { useData } from '../lib/data'
import { go } from '../lib/router'
import { STATUS_LABEL, type BookStatus } from '../lib/types'

const dayIndex = (n: number) => {
  const d = new Date()
  const seed = d.getFullYear() * 1000 + Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 864e5)
  return n ? (seed * 2654435761) % n : 0
}

function greeting() {
  const h = new Date().getHours()
  if (h < 5) return 'İyi geceler.'
  if (h < 11) return 'Günaydın.'
  if (h < 18) return 'İyi okumalar.'
  return 'İyi akşamlar.'
}

export function Library() {
  const { user, books, quotes } = useData()
  const [filter, setFilter] = useState<BookStatus | 'all'>('all')
  const [adding, setAdding] = useState(false)

  const counts = useMemo(() => {
    const m = new Map<string, number>()
    quotes.forEach((q) => m.set(q.book_id, (m.get(q.book_id) ?? 0) + 1))
    return m
  }, [quotes])

  const shown = books
    .filter((b) => filter === 'all' || b.status === filter)
    .sort((a, b) => (a.status === 'reading' ? -1 : 0) - (b.status === 'reading' ? -1 : 0))
  const daily = quotes.length ? quotes[dayIndex(quotes.length)] : null
  const reading = books.find((b) => b.status === 'reading')
  const today = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' })

  return (
    <div className="page">
      <header className="masthead card">
        <span className="wordmark">Alıntılarım</span>
        <div className="masthead-actions">
          <a className="icon-btn" href="#/ara" aria-label="Ara">
            <Icon name="search" />
          </a>
          <button className="btn accent small" onClick={() => setAdding(true)}>
            <Icon name="plus" size={16} /> Kitap
          </button>
        </div>
      </header>

      <section className="card hero">
        <p className="eyebrow">{today}</p>
        <h1 className="display">
          <span className="accent-text">{greeting()}</span> {user?.name}, bugün neler okuyorsun?
        </h1>
        {books.length > 0 && (
          <p className="meta">
            {books.length} kitap <span className="sep" /> {quotes.length} alıntı <span className="sep" />{' '}
            {books.filter((b) => b.status === 'finished').length} bitti
          </p>
        )}
        {reading && (
          <a className="more-link" href={'#/book/' + reading.id}>
            Okumaya devam: <em>{reading.title}</em> <Icon name="arrow" size={16} />
          </a>
        )}
      </section>

      {daily && (
        <section className="card section">
          <div className="section-head">
            <h3 className="eyebrow">Günün alıntısı</h3>
            <a className="more-link small" href="#/hatirla">
              Hatırla <Icon name="arrow" size={14} />
            </a>
          </div>
          <QuoteItem q={daily} showBook compact bare />
        </section>
      )}

      {books.length === 0 ? (
        <section className="card empty">
          <p className="eyebrow">Başlarken</p>
          <h2 className="display small">
            Kitaplığın henüz <em>boş.</em>
          </h2>
          <p>Okuduğun kitabı ekle, sonra hoşuna giden sayfanın fotoğrafını çek. Gerisini biz hallederiz.</p>
          <button className="btn primary" onClick={() => setAdding(true)}>
            İlk kitabını ekle <Icon name="arrow" size={16} />
          </button>
        </section>
      ) : (
        <section className="card section">
          <div className="section-head">
            <h3 className="eyebrow">Kitaplığım</h3>
          </div>
          <nav className="tabs-inline">
            {(['all', 'reading', 'finished', 'want'] as const).map((s) => (
              <button key={s} className={filter === s ? 'on' : ''} onClick={() => setFilter(s)}>
                {s === 'all' ? 'Tümü' : STATUS_LABEL[s]}
              </button>
            ))}
          </nav>
          <div className="book-grid">
            {shown.map((b) => (
              <button key={b.id} className="book" onClick={() => go('/book/' + b.id)}>
                <div className="cover" style={{ background: b.color }}>
                  <span className="cover-title">{b.title}</span>
                  {b.author && <span className="cover-author">{b.author}</span>}
                </div>
                <span className="book-title">{b.title}</span>
                <span className="meta small">
                  {STATUS_LABEL[b.status]} <span className="sep" /> {counts.get(b.id) ?? 0} alıntı
                </span>
              </button>
            ))}
            {shown.length === 0 && <p className="muted">Bu rafta kitap yok.</p>}
          </div>
        </section>
      )}

      {books.length > 0 && (
        <CaptureButton bookId={reading?.id} className="fab">
          <Icon name="camera" size={22} />
          <span>Alıntı çek</span>
        </CaptureButton>
      )}

      {adding && <BookForm onClose={() => setAdding(false)} onSaved={(b) => go('/book/' + b.id)} />}
    </div>
  )
}
