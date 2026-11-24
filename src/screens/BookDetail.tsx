import { useState } from 'react'
import { BookForm } from '../components/BookForm'
import { CaptureButton } from '../components/CaptureButton'
import { Icon } from '../components/Icon'
import { QuoteItem } from '../components/QuoteItem'
import { pageNum, useData } from '../lib/data'
import { back, go } from '../lib/router'
import { shareText } from '../lib/share'
import { STATUS_LABEL, type BookStatus } from '../lib/types'

export function BookDetail({ id }: { id: string }) {
  const { bookById, quotes, saveBook, deleteBook, toast } = useData()
  const book = bookById(id)
  const [sort, setSort] = useState<'page' | 'date'>('page')
  const [editing, setEditing] = useState(false)

  if (!book) {
    return (
      <div className="page">
        <p>Kitap bulunamadı.</p>
        <a href="#/">Kitaplığa dön</a>
      </div>
    )
  }

  const list = quotes
    .filter((q) => q.book_id === id)
    .sort((a, b) =>
      sort === 'page' ? pageNum(a.page) - pageNum(b.page) || a.created_at.localeCompare(b.created_at) : b.created_at.localeCompare(a.created_at),
    )

  const setStatus = (status: BookStatus) =>
    saveBook({ ...book, status, finished_at: status === 'finished' ? (book.finished_at ?? new Date().toISOString()) : null })

  function shareAll() {
    const header = `📖 ${book!.title}${book!.author ? ' — ' + book!.author : ''}\n`
    const body = list.map((q) => `“${q.text}”${q.page ? ` (s. ${q.page})` : ''}${q.note ? `\n💭 ${q.note}` : ''}`).join('\n\n')
    shareText(header + '\n' + body)
  }

  return (
    <div className="page">
      <header className="bar">
        <button className="icon-btn" onClick={back} aria-label="Geri">
          <Icon name="back" />
        </button>
        <div className="bar-actions">
          <button className="icon-btn" onClick={() => setEditing(true)} aria-label="Düzenle">
            <Icon name="edit" />
          </button>
          <button
            className="icon-btn"
            aria-label="Sil"
            onClick={async () => {
              if (confirm(`“${book.title}” ve tüm alıntıları silinsin mi?`)) {
                await deleteBook(book.id)
                toast('Kitap silindi')
                go('/')
              }
            }}
          >
            <Icon name="trash" />
          </button>
        </div>
      </header>

      <div className="book-head">
        <div className="cover small" style={{ background: book.color }}>
          <span className="cover-title">{book.title}</span>
        </div>
        <div>
          <h1>{book.title}</h1>
          {book.author && <p className="muted">{book.author}</p>}
          {book.status === 'finished' && (
            <div className="stars" aria-label="Puan">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} onClick={() => saveBook({ ...book, rating: book.rating === n ? null : n })} aria-label={n + ' yıldız'}>
                  <Icon name="star" filled={(book.rating ?? 0) >= n} size={22} />
                </button>
              ))}
            </div>
          )}
          {book.finished_at && (
            <p className="muted small">{new Date(book.finished_at).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })} bitirildi</p>
          )}
        </div>
      </div>

      <div className="chips">
        {(Object.keys(STATUS_LABEL) as BookStatus[]).map((s) => (
          <button key={s} className={'chip' + (book.status === s ? ' on' : '')} onClick={() => setStatus(s)}>
            {STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      <div className="add-row">
        <CaptureButton bookId={book.id} className="btn primary grow">
          <Icon name="camera" /> Fotoğrafla ekle
        </CaptureButton>
        <button className="btn" onClick={() => go('/add?book=' + book.id)}>
          <Icon name="type" /> Yaz
        </button>
      </div>

      <div className="list-head">
        <h3 className="section-title">{list.length} alıntı</h3>
        {list.length > 0 && (
          <div className="list-tools">
            <button className="link" onClick={() => setSort((s) => (s === 'page' ? 'date' : 'page'))}>
              {sort === 'page' ? 'Sayfaya göre' : 'En yeni'}
            </button>
            <button className="link" onClick={shareAll}>
              Tümünü paylaş
            </button>
          </div>
        )}
      </div>

      {list.length === 0 ? (
        <p className="muted center">Henüz alıntı yok. Hoşuna giden ilk sayfanın fotoğrafını çek 📸</p>
      ) : (
        list.map((q) => <QuoteItem key={q.id} q={q} />)
      )}

      {editing && <BookForm book={book} onClose={() => setEditing(false)} />}
    </div>
  )
}

