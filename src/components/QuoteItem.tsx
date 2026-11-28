import { useEffect, useRef, useState } from 'react'
import { useData } from '../lib/data'
import { go } from '../lib/router'
import { copyText, quoteToText, shareText } from '../lib/share'
import type { Quote } from '../lib/types'
import { Icon } from './Icon'
import { ShareSheet } from './ShareSheet'

export function QuoteItem({
  q,
  showBook = false,
  compact = false,
  bare = false,
}: {
  q: Quote
  showBook?: boolean
  compact?: boolean
  /** Bir kartın içinde gösteriliyorsa kendi kart çerçevesini çizme */
  bare?: boolean
}) {
  const { bookById, saveQuote, deleteQuote, toast } = useData()
  const book = bookById(q.book_id)
  const [menu, setMenu] = useState(false)
  const [sharing, setSharing] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const text = quoteToText(q, book)

  // Menü açıkken dışarıya dokununca ya da kaydırınca kapat
  useEffect(() => {
    if (!menu) return
    const close = (e: Event) => {
      const t = e.target as Node
      if (menuRef.current?.contains(t) || toggleRef.current?.contains(t)) return
      setMenu(false)
    }
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setMenu(false)
    document.addEventListener('pointerdown', close)
    window.addEventListener('scroll', close, { passive: true })
    window.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('pointerdown', close)
      window.removeEventListener('scroll', close)
      window.removeEventListener('keydown', esc)
    }
  }, [menu])

  return (
    <article className={'quote' + (compact ? ' compact' : '') + (bare ? ' bare' : ' card')}>
      <div className="meta quote-meta">
        <span className="dot" style={{ background: book?.color }} />
        {showBook && book ? (
          <a href={'#/book/' + book.id}>{book.title}</a>
        ) : (
          <span>{q.page ? `Sayfa ${q.page}` : 'Sayfa belirtilmedi'}</span>
        )}
        {showBook && book?.author && (
          <>
            <span className="sep" />
            <span>{book.author}</span>
          </>
        )}
        {showBook && q.page && (
          <>
            <span className="sep" />
            <span>s. {q.page}</span>
          </>
        )}
        {q.favorite && <span className="label">Favori</span>}
      </div>
      <p className="quote-text">{q.text}</p>
      {q.note && (
        <p className="quote-note">
          <span className="eyebrow">Notum</span>
          {q.note}
        </p>
      )}
      <div className="quote-actions">
        <button className="pill-btn wa" onClick={() => shareText(text)} aria-label="Metin olarak paylaş">
          <Icon name="whatsapp" size={17} /> Paylaş
        </button>
        <button className="pill-btn" onClick={() => setSharing(true)} aria-label="Görsel olarak paylaş">
          <Icon name="image" size={17} /> Görsel
        </button>
        <button
          className={'icon-btn' + (q.favorite ? ' fav' : '')}
          onClick={() => saveQuote({ ...q, favorite: !q.favorite })}
          aria-label="Favori"
        >
          <Icon name="heart" filled={q.favorite} />
        </button>
        <button ref={toggleRef} className="icon-btn" onClick={() => setMenu((m) => !m)} aria-label="Diğer">
          <Icon name="more" />
        </button>
      </div>
      {menu && (
        <div ref={menuRef} className="quote-menu" onClick={() => setMenu(false)}>
          <button onClick={async () => toast((await copyText(text)) ? 'Kopyalandı' : 'Kopyalanamadı')}>
            <Icon name="copy" /> Kopyala
          </button>
          <button onClick={() => go('/add?edit=' + q.id)}>
            <Icon name="edit" /> Düzenle
          </button>
          <button
            className="danger"
            onClick={async () => {
              if (confirm('Bu alıntı silinsin mi?')) {
                await deleteQuote(q.id)
                toast('Silindi')
              }
            }}
          >
            <Icon name="trash" /> Sil
          </button>
        </div>
      )}
      {sharing && <ShareSheet q={q} onClose={() => setSharing(false)} />}
    </article>
  )
}
