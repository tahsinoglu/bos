import { useState } from 'react'
import { useData } from '../lib/data'
import { go } from '../lib/router'
import { copyText, quoteToText, shareCard, shareText } from '../lib/share'
import type { Quote } from '../lib/types'
import { Icon } from './Icon'

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
  const text = quoteToText(q, book)

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
        <button className="pill-btn" onClick={() => shareText(text)} aria-label="Paylaş">
          <Icon name="whatsapp" size={17} /> Paylaş
        </button>
        <button
          className={'icon-btn' + (q.favorite ? ' fav' : '')}
          onClick={() => saveQuote({ ...q, favorite: !q.favorite })}
          aria-label="Favori"
        >
          <Icon name="heart" filled={q.favorite} />
        </button>
        <button className="icon-btn" onClick={() => setMenu((m) => !m)} aria-label="Diğer">
          <Icon name="more" />
        </button>
      </div>
      {menu && (
        <div className="quote-menu" onClick={() => setMenu(false)}>
          <button onClick={() => shareCard(q, book)}>
            <Icon name="image" /> Görsel kart olarak paylaş
          </button>
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
    </article>
  )
}
