import { useCallback, useEffect, useRef, useState } from 'react'
import { BookForm } from '../components/BookForm'
import { Cropper, cropToCanvas, normalizeImage, type Rect } from '../components/Cropper'
import { Icon } from '../components/Icon'
import { useData } from '../lib/data'
import { recognize } from '../lib/ocr'
import { back, go, takePendingImage } from '../lib/router'

const FULL: Rect = { x: 0.04, y: 0.04, w: 0.92, h: 0.92 }

export function AddQuote({ params }: { params: URLSearchParams }) {
  const { books, quotes, saveQuote, toast } = useData()
  const editing = quotes.find((q) => q.id === params.get('edit'))

  const defaultBook = params.get('book') ?? editing?.book_id ?? books.find((b) => b.status === 'reading')?.id ?? books[0]?.id ?? ''
  const [bookId, setBookId] = useState(defaultBook)
  const [text, setText] = useState(editing?.text ?? '')
  const [page, setPage] = useState(editing?.page ?? '')
  const [note, setNote] = useState(editing?.note ?? '')
  const [showNote, setShowNote] = useState(!!editing?.note)
  const [newBook, setNewBook] = useState(false)

  const [image, setImage] = useState<string | null>(null)
  const [rotation, setRotation] = useState(0)
  const [rect, setRect] = useState<Rect>(FULL)
  const [ocr, setOcr] = useState<number | null>(null) // ilerleme 0..1
  const [error, setError] = useState<string | null>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const original = useRef<Blob | null>(null)

  const loadImage = useCallback(async (f: Blob, rot = 0) => {
    original.current = f
    setRotation(rot)
    setRect(FULL)
    setImage(await normalizeImage(f, rot))
  }, [])

  useEffect(() => {
    const f = takePendingImage()
    if (f) loadImage(f)
  }, [loadImage])

  async function runOcr() {
    const img = imgRef.current
    if (!img) return
    setError(null)
    setOcr(0)
    try {
      await img.decode()
      const { text: result, page: found } = await recognize(await cropToCanvas(img, rect), setOcr)
      if (found) setPage((p) => p || found)
      if (!result) {
        setError('Metin okunamadı. Daha net ya da daha yakından bir fotoğraf dene.')
      } else {
        setText((t) => (t.trim() ? t.trim() + '\n\n' + result : result))
        setImage(null)
      }
    } catch (e) {
      setError('Metin tanıma başarısız: ' + (e as Error).message + ' (İnternet bağlantısını kontrol et.)')
    } finally {
      setOcr(null)
    }
  }

  const lastPage = quotes
    .filter((q) => q.book_id === bookId && q.page)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))[0]?.page

  async function save() {
    if (!text.trim() || !bookId) return
    await saveQuote({
      id: editing?.id,
      book_id: bookId,
      text: text.trim(),
      page: page.trim() || null,
      note: note.trim() || null,
      favorite: editing?.favorite ?? false,
    })
    toast(editing ? 'Güncellendi' : 'Alıntı kaydedildi ✨')
    if (editing) back()
    else go('/book/' + bookId)
  }

  /* ---------- 1. adım: alan seçimi ---------- */
  if (image) {
    return (
      <div className="page crop-page">
        <header className="bar">
          <button className="icon-btn" onClick={() => setImage(null)} aria-label="Vazgeç">
            <Icon name="back" />
          </button>
          <span className="bar-title">Alıntıyı seç</span>
          <button
            className="icon-btn"
            aria-label="Döndür"
            onClick={() => original.current && loadImage(original.current, (rotation + 90) % 360)}
          >
            <Icon name="rotate" />
          </button>
        </header>
        <p className="muted small center">Hoşuna giden kısmı parmağınla çerçevele. Köşelerden ayarlayabilirsin.</p>
        <Cropper src={image} rect={rect} onChange={setRect} />
        {/* OCR için gizli tam çözünürlüklü görsel */}
        <img ref={imgRef} src={image} alt="" hidden />
        {error && <p className="msg">{error}</p>}
        <div className="sticky-actions">
          <button className="btn ghost" onClick={() => setRect({ x: 0, y: 0, w: 1, h: 1 })} disabled={ocr !== null}>
            Tümü
          </button>
          <button className="btn primary grow" onClick={runOcr} disabled={ocr !== null}>
            {ocr === null ? (
              <>
                <Icon name="check" /> Metne çevir
              </>
            ) : (
              <>Okunuyor…{ocr > 0 ? ` %${Math.round(ocr * 100)}` : ''}</>
            )}
          </button>
        </div>
        {ocr !== null && (
          <div className="progress">
            <div style={{ width: Math.max(5, ocr * 100) + '%' }} />
          </div>
        )}
      </div>
    )
  }

  /* ---------- 2. adım: metni düzenle ve kaydet ---------- */
  return (
    <div className="page">
      <header className="bar">
        <button className="icon-btn" onClick={back} aria-label="Geri">
          <Icon name="back" />
        </button>
        <span className="bar-title">{editing ? 'Alıntıyı düzenle' : 'Yeni alıntı'}</span>
        <span style={{ width: 40 }} />
      </header>

      <label className="field">
        <span>Kitap</span>
        <select
          value={bookId}
          onChange={(e) => (e.target.value === '__new' ? setNewBook(true) : setBookId(e.target.value))}
        >
          {!bookId && <option value="">Kitap seç…</option>}
          {books.map((b) => (
            <option key={b.id} value={b.id}>
              {b.title}
              {b.author ? ' — ' + b.author : ''}
            </option>
          ))}
          <option value="__new">+ Yeni kitap ekle</option>
        </select>
      </label>

      <label className="field">
        <span>Alıntı</span>
        <textarea
          className="quote-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Fotoğraf çek ya da buraya yaz…"
          rows={8}
        />
      </label>
      <label className="btn ghost small attach">
        <input
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0]
            e.target.value = ''
            if (f) loadImage(f)
          }}
        />
        <Icon name="camera" size={18} /> {text ? 'Devamını fotoğrafla ekle' : 'Fotoğraftan metin al'}
      </label>

      <div className="row">
        <label className="field page-field">
          <span>Sayfa</span>
          <input
            inputMode="numeric"
            value={page}
            onChange={(e) => setPage(e.target.value)}
            placeholder={lastPage ? `son: ${lastPage}` : 'ör. 42'}
          />
        </label>
        {!showNote && (
          <button className="link" onClick={() => setShowNote(true)}>
            + Kendi notunu ekle
          </button>
        )}
      </div>
      {showNote && (
        <label className="field">
          <span>Notun</span>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Bu satırlar sana ne düşündürdü?" />
        </label>
      )}

      <div className="sticky-actions">
        <button className="btn primary wide" disabled={!text.trim() || !bookId} onClick={save}>
          Kaydet
        </button>
      </div>

      {newBook && (
        <BookForm
          onClose={() => setNewBook(false)}
          onSaved={(b) => {
            setBookId(b.id)
            setNewBook(false)
          }}
        />
      )}
    </div>
  )
}
