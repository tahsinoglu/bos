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

  return (
    <div className="page">
      <header className="top">
        <div>
          <p className="muted">Merhaba {user?.name},</p>
          <h1>Kitaplığım</h1>
        </div>
        <button className="btn small" onClick={() => setAdding(true)}>
          <Icon name="plus" size={18} /> Kitap
        </button>
      </header>

      {books.length > 0 && (
        <p className="stats">
          {books.length} kitap · {quotes.length} alıntı · {books.filter((b) => b.status === 'finished').length} bitti
        </p>
      )}

      {daily && (
        <section>
          <h3 className="section-title">Günün alıntısı</h3>
          <QuoteItem q={daily} showBook compact />
        </section>
      )}

      {books.length === 0 ? (
        <div className="empty">
          <div className="empty-art">📚</div>
          <h2>Kitaplığın henüz boş</h2>
          <p>Okuduğun kitabı ekle, sonra hoşuna giden sayfanın fotoğrafını çek. Gerisini biz hallederiz.</p>
          <button className="btn primary" onClick={() => setAdding(true)}>
            İlk kitabını ekle
          </button>
        </div>
      ) : (
        <>
          <div className="chips scroll">
            {(['all', 'reading', 'finished', 'want'] as const).map((s) => (
              <button key={s} className={'chip' + (filter === s ? ' on' : '')} onClick={() => setFilter(s)}>
                {s === 'all' ? 'Tümü' : STATUS_LABEL[s]}
              </button>
            ))}
          </div>
          <div className="book-grid">
            {shown.map((b) => (
              <button key={b.id} className="book" onClick={() => go('/book/' + b.id)}>
                <div className="cover" style={{ background: b.color }}>
                  <span className="cover-title">{b.title}</span>
                  {b.author && <span className="cover-author">{b.author}</span>}
                </div>
                <div className="book-info">
                  <span className="badge">{STATUS_LABEL[b.status]}</span>
                  <span className="muted small">{counts.get(b.id) ?? 0} alıntı</span>
                </div>
              </button>
            ))}
            {shown.length === 0 && <p className="muted">Bu rafta kitap yok.</p>}
          </div>
        </>
      )}

      {books.length > 0 && (
        <CaptureButton bookId={reading?.id} className="fab">
          <Icon name="camera" size={26} />
          <span>Alıntı çek</span>
        </CaptureButton>
      )}

      {adding && <BookForm onClose={() => setAdding(false)} onSaved={(b) => go('/book/' + b.id)} />}
    </div>
  )
}
