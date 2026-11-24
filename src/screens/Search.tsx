import { useState } from 'react'
import { QuoteItem } from '../components/QuoteItem'
import { useData } from '../lib/data'

const norm = (s: string) => s.toLocaleLowerCase('tr').normalize('NFD').replace(/\p{M}/gu, '')

export function Search() {
  const { quotes, bookById } = useData()
  const [term, setTerm] = useState('')
  const t = norm(term.trim())
  const results = t
    ? quotes.filter((q) => {
        const b = bookById(q.book_id)
        return norm([q.text, q.note, b?.title, b?.author].filter(Boolean).join(' ')).includes(t)
      })
    : []

  return (
    <div className="page">
      <header className="top">
        <h1>Ara</h1>
      </header>
      <input
        className="search"
        type="search"
        autoFocus
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        placeholder="Bir kelime, kitap ya da yazar…"
      />
      {t && <p className="muted small">{results.length} sonuç</p>}
      {results.map((q) => (
        <QuoteItem key={q.id} q={q} showBook />
      ))}
    </div>
  )
}
