import { useData } from '../lib/data'
import { store } from '../lib/store'
import { STATUS_LABEL } from '../lib/types'

function download(name: string, content: string, type: string) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([content], { type }))
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 5000)
}

export function Profile() {
  const { user, books, quotes, saveBook, saveQuote, toast } = useData()

  const year = new Date().getFullYear()
  const finishedThisYear = books.filter((b) => b.finished_at?.startsWith(String(year))).length
  const favBook = [...books].sort(
    (a, b) => quotes.filter((q) => q.book_id === b.id).length - quotes.filter((q) => q.book_id === a.id).length,
  )[0]

  function exportText() {
    const out = books
      .map((b) => {
        const qs = quotes.filter((q) => q.book_id === b.id)
        return [
          `# ${b.title}${b.author ? ' — ' + b.author : ''} (${STATUS_LABEL[b.status]})`,
          ...qs.map((q) => `\n“${q.text}”${q.page ? ` (s. ${q.page})` : ''}${q.note ? `\nNot: ${q.note}` : ''}`),
        ].join('\n')
      })
      .join('\n\n\n')
    download('alintilarim.txt', out, 'text/plain;charset=utf-8')
  }

  async function importJson(f: File) {
    try {
      const data = JSON.parse(await f.text()) as { books: typeof books; quotes: typeof quotes }
      const idMap = new Map<string, string>()
      for (const b of data.books) {
        const { id, created_at: _c, ...rest } = b
        const saved = await saveBook(rest)
        idMap.set(id, saved.id)
      }
      for (const q of data.quotes) {
        const { id: _i, created_at: _c, ...rest } = q
        const book_id = idMap.get(q.book_id)
        if (book_id) await saveQuote({ ...rest, book_id })
      }
      toast(`${data.books.length} kitap, ${data.quotes.length} alıntı içe aktarıldı`)
    } catch (e) {
      toast('İçe aktarılamadı: ' + (e as Error).message)
    }
  }

  return (
    <div className="page">
      <header className="top">
        <div>
          <p className="muted">{user?.email ?? (store.mode === 'local' ? 'Bu cihazda' : '')}</p>
          <h1>{user?.name}</h1>
        </div>
      </header>

      <div className="stat-grid">
        <div className="stat">
          <strong>{books.length}</strong>
          <span>kitap</span>
        </div>
        <div className="stat">
          <strong>{quotes.length}</strong>
          <span>alıntı</span>
        </div>
        <div className="stat">
          <strong>{finishedThisYear}</strong>
          <span>{year}’te bitti</span>
        </div>
      </div>
      {favBook && quotes.some((q) => q.book_id === favBook.id) && (
        <p className="muted small">
          En çok altını çizdiğin kitap: <strong>{favBook.title}</strong>
        </p>
      )}

      <section className="card settings">
        <h3>Yedekle</h3>
        <button className="btn wide" onClick={exportText}>
          Tüm alıntıları metin olarak indir
        </button>
        <button
          className="btn wide"
          onClick={() => download('alintilarim-yedek.json', JSON.stringify({ books, quotes }, null, 2), 'application/json')}
        >
          Yedek dosyası (JSON) indir
        </button>
        <label className="btn ghost wide">
          <input
            type="file"
            accept="application/json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0]
              e.target.value = ''
              if (f) importJson(f)
            }}
          />
          Yedekten geri yükle
        </label>
      </section>

      <button className="btn ghost wide danger" onClick={() => store.signOut()}>
        Çıkış yap
      </button>
    </div>
  )
}
