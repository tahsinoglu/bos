import { useState } from 'react'
import { useData } from '../lib/data'
import { go } from '../lib/router'
import { copyText, quoteToText, shareCard, shareText } from '../lib/share'
import type { Quote } from '../lib/types'
import { Icon } from './Icon'

export function QuoteItem({ q, showBook = false, compact = false }: { q: Quote; showBook?: boolean; compact?: boolean }) {
  const { bookById, saveQuote, deleteQuote, toast } = useData()
  const book = bookById(q.book_id)
  const [menu, setMenu] = useState(false)
  const text = quoteToText(q, book)

  return (
    <article className={'quote' + (compact ? ' compact' : '')} style={{ borderLeftColor: book?.color }}>
      <p className="quote-text">{q.text}</p>
      <div className="quote-meta">
        {showBook && book ? (
          <a href={'#/book/' + book.id} className="quote-src">
            {book.title}
            {q.page ? `, s. ${q.page}` : ''}
          </a>
        ) : (
          <span className="quote-src">{q.page ? `Sayfa ${q.page}` : 'Sayfa belirtilmedi'}</span>
        )}
      </div>
      {q.note && <p className="quote-note">💭 {q.note}</p>}
      <div className="quote-actions">
        <button className="icon-btn wa" onClick={() => shareText(text)} aria-label="Paylaş">
          <Icon name="whatsapp" /> <span>Paylaş</span>
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
