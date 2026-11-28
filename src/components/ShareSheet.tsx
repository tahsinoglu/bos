import { useEffect, useState } from 'react'
import { useData } from '../lib/data'
import {
  CARD_FORMATS,
  CARD_THEMES,
  canvasToFile,
  downloadFile,
  quoteCard,
  shareFile,
  type CardFormat,
  type CardTheme,
} from '../lib/share'
import type { Quote } from '../lib/types'
import { Icon } from './Icon'
import { SheetBackdrop } from './Sheet'

const PREF = 'ka:card'
function loadPref(): { format: CardFormat; theme: CardTheme } {
  try {
    const p = JSON.parse(localStorage.getItem(PREF) || '')
    if (p.format && p.theme) return p
  } catch {
    /* yok say */
  }
  return { format: 'portrait', theme: 'light' }
}

const SWATCH: Record<CardTheme, string> = { light: '#f7f6f4', dark: '#0f172a', book: '' }

/** Alıntıyı görsel kart olarak paylaşma: format ve tema seçimi, canlı önizleme. */
export function ShareSheet({ q, onClose }: { q: Quote; onClose: () => void }) {
  const { bookById, toast } = useData()
  const book = bookById(q.book_id)
  const [format, setFormat] = useState<CardFormat>(() => loadPref().format)
  const [theme, setTheme] = useState<CardTheme>(() => loadPref().theme)
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)

  useEffect(() => {
    let alive = true
    setFile(null)
    try {
      localStorage.setItem(PREF, JSON.stringify({ format, theme }))
    } catch {
      /* yok say */
    }
    quoteCard(q, book, format, theme).then(async (canvas) => {
      if (!alive) return
      setPreview(canvas.toDataURL('image/jpeg', 0.8))
      const f = await canvasToFile(canvas)
      if (alive) setFile(f)
    })
    return () => {
      alive = false
    }
  }, [q, book, format, theme])

  return (
    <SheetBackdrop onClose={onClose}>
      <div className="sheet share-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-grip" />
        <div className="section-head">
          <h2 className="display small">Görsel olarak paylaş</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Kapat">
            <Icon name="close" />
          </button>
        </div>

        <div className={'card-preview ' + format}>
          {preview ? <img src={preview} alt="Alıntı kartı önizlemesi" /> : <div className="card-preview-empty" />}
        </div>

        <div className="format-options">
          {CARD_FORMATS.map((f) => (
            <button key={f.id} className={'format-opt' + (format === f.id ? ' on' : '')} onClick={() => setFormat(f.id)}>
              <span className={'format-shape ' + f.id} />
              <strong>{f.label}</strong>
              <span>{f.hint}</span>
            </button>
          ))}
        </div>

        <div className="theme-options">
          {CARD_THEMES.map((t) => (
            <button key={t.id} className={'theme-opt' + (theme === t.id ? ' on' : '')} onClick={() => setTheme(t.id)}>
              <span className="swatch" style={{ background: t.id === 'book' ? (book?.color ?? '#7a3e2b') : SWATCH[t.id] }} />
              {t.label}
            </button>
          ))}
        </div>

        <div className="row">
          <button className="btn" disabled={!file} onClick={() => file && downloadFile(file)}>
            İndir
          </button>
          <button
            className="btn primary grow"
            disabled={!file}
            onClick={async () => {
              if (!file) return
              const r = await shareFile(file)
              if (r === 'downloaded') toast('Görsel indirildi')
              if (r !== 'cancelled') onClose()
            }}
          >
            <Icon name="share" size={18} /> Paylaş
          </button>
        </div>
      </div>
    </SheetBackdrop>
  )
}
