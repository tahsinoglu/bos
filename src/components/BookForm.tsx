import { useState } from 'react'
import { useData } from '../lib/data'
import { SheetBackdrop } from './Sheet'
import { BOOK_COLORS, STATUS_LABEL, type Book, type BookStatus } from '../lib/types'

export function BookForm({ book, onClose, onSaved }: { book?: Book; onClose: () => void; onSaved?: (b: Book) => void }) {
  const { saveBook, books } = useData()
  const [title, setTitle] = useState(book?.title ?? '')
  const [author, setAuthor] = useState(book?.author ?? '')
  const [status, setStatus] = useState<BookStatus>(book?.status ?? 'reading')
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setBusy(true)
    try {
      const finished_at =
        status === 'finished' ? (book?.finished_at ?? new Date().toISOString()) : null
      const saved = await saveBook({
        ...(book ?? { rating: null, color: BOOK_COLORS[books.length % BOOK_COLORS.length] }),
        id: book?.id,
        title: title.trim(),
        author: author.trim() || null,
        status,
        finished_at,
      } as Book)
      onSaved?.(saved)
      onClose()
    } finally {
      setBusy(false)
    }
  }

  return (
    <SheetBackdrop onClose={onClose}>
      <form className="sheet" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <div className="sheet-grip" />
        <h2 className="display small">{book ? 'Kitabı düzenle' : 'Yeni kitap'}</h2>
        <label className="field">
          <span>Kitap adı</span>
          <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="ör. Kürk Mantolu Madonna" />
        </label>
        <label className="field">
          <span>Yazar</span>
          <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="ör. Sabahattin Ali" />
        </label>
        <div className="segmented">
          {(Object.keys(STATUS_LABEL) as BookStatus[]).map((s) => (
            <button type="button" key={s} className={s === status ? 'on' : ''} onClick={() => setStatus(s)}>
              {STATUS_LABEL[s]}
            </button>
          ))}
        </div>
        <div className="row">
          <button type="button" className="btn ghost" onClick={onClose}>
            Vazgeç
          </button>
          <button className="btn primary" disabled={!title.trim() || busy}>
            Kaydet
          </button>
        </div>
      </form>
    </SheetBackdrop>
  )
}
