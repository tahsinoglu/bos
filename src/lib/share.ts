import type { Book, Quote } from './types'

export function quoteToText(q: Quote, book?: Book) {
  const src = [book?.title, book?.author].filter(Boolean).join(' — ')
  const page = q.page ? `, s. ${q.page}` : ''
  let t = `“${q.text}”\n\n📖 ${src}${page}`
  if (q.note) t += `\n\n💭 ${q.note}`
  return t
}

export function whatsappUrl(text: string) {
  return 'https://wa.me/?text=' + encodeURIComponent(text)
}

/** Önce telefonun paylaş menüsünü dener (WhatsApp, Telegram, Instagram…); yoksa WhatsApp'a gider. */
export async function shareText(text: string) {
  if (navigator.share) {
    try {
      await navigator.share({ text })
      return
    } catch (e) {
      if ((e as Error).name === 'AbortError') return
    }
  }
  window.open(whatsappUrl(text), '_blank')
}

export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number) {
  const lines: string[] = []
  for (const para of text.split('\n')) {
    let line = ''
    for (const word of para.split(/\s+/)) {
      const test = line ? line + ' ' + word : word
      if (ctx.measureText(test).width > maxW && line) {
        lines.push(line)
        line = word
      } else line = test
    }
    lines.push(line)
  }
  return lines
}

const SERIF = "'Canela Text', 'Newsreader Variable', Georgia, serif"
const SANS = "'Graphik', 'Hanken Grotesk Variable', -apple-system, 'Segoe UI', Roboto, sans-serif"

export type CardFormat = 'square' | 'portrait' | 'story'
export type CardTheme = 'light' | 'dark' | 'book'

export const CARD_FORMATS: { id: CardFormat; label: string; hint: string; h: number }[] = [
  { id: 'square', label: 'Kare', hint: 'Gönderi', h: 1080 },
  { id: 'portrait', label: 'Dikey', hint: 'Instagram', h: 1350 },
  { id: 'story', label: 'Hikâye', hint: 'WhatsApp durumu', h: 1920 },
]

export const CARD_THEMES: { id: CardTheme; label: string }[] = [
  { id: 'light', label: 'Açık' },
  { id: 'dark', label: 'Gece' },
  { id: 'book', label: 'Kitap rengi' },
]

function palette(theme: CardTheme, book?: Book) {
  switch (theme) {
    case 'dark':
      return { bg: '#0f172a', card: '#18223b', ink: '#f1f0ee', muted: '#9aa3b5', mark: '#8f98ff', line: '#2a3550', dot: book?.color ?? '#8f98ff' }
    case 'book':
      return { bg: book?.color ?? '#7a3e2b', card: null, ink: '#fbf7ef', muted: 'rgba(251,247,239,.72)', mark: 'rgba(251,247,239,.55)', line: 'rgba(251,247,239,.28)', dot: '#fbf7ef' }
    default:
      return { bg: '#f7f6f4', card: '#ffffff', ink: '#121212', muted: '#7c7b7a', mark: '#4956ea', line: '#ececec', dot: book?.color ?? '#121212' }
  }
}

/** Alıntıyı paylaşılabilir bir görsel karta çizer (Instagram, WhatsApp durumu vb.). */
export async function quoteCard(q: Quote, book?: Book, format: CardFormat = 'portrait', theme: CardTheme = 'light'): Promise<HTMLCanvasElement> {
  // Canvas'a çizmeden önce fontların yüklendiğinden emin ol
  try {
    await Promise.all([
      document.fonts.load(`48px ${SERIF}`, q.text),
      document.fonts.load(`600 36px ${SANS}`, book?.title ?? 'A'),
    ])
  } catch {
    /* yedek fontla devam */
  }
  const W = 1080
  const H = CARD_FORMATS.find((f) => f.id === format)!.h
  const P = palette(theme, book)
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const ctx = c.getContext('2d')!
  ctx.fillStyle = P.bg
  ctx.fillRect(0, 0, W, H)
  const inset = format === 'story' ? 72 : 56
  if (P.card) {
    ctx.fillStyle = P.card
    ctx.beginPath()
    ctx.roundRect(inset, format === 'story' ? 220 : inset, W - inset * 2, format === 'story' ? H - 440 : H - inset * 2, 44)
    ctx.fill()
  }

  const pad = 120
  const maxW = W - pad * 2
  // Alıntı dışındaki alan: tırnak + künye + kenar boşlukları
  const reserved = format === 'story' ? 900 : 470
  let size = format === 'story' ? 70 : 54
  let lines: string[] = []
  for (; size >= 24; size -= 2) {
    ctx.font = `${size}px ${SERIF}`
    lines = wrap(ctx, q.text, maxW)
    if (lines.length * size * 1.45 < H - reserved) break
  }
  const lh = size * 1.45
  ctx.font = `600 36px ${SANS}`
  const titleLines = wrap(ctx, book?.title ?? '', maxW - 36)
  const footH = 92 + titleLines.length * 48 + 40
  const blockH = 120 + lines.length * lh + footH
  let y = Math.max(inset + 90, (H - blockH) / 2 + 60)

  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = P.mark
  ctx.font = `600 160px ${SERIF}`
  ctx.fillText('“', pad - 12, y + 20)
  y += 60

  ctx.textBaseline = 'top'
  ctx.fillStyle = P.ink
  ctx.font = `${size}px ${SERIF}`
  for (const l of lines) {
    ctx.fillText(l, pad, y)
    y += lh
  }

  y += 50
  ctx.fillStyle = P.line
  ctx.fillRect(pad, y, maxW, 2)
  y += 40
  ctx.fillStyle = P.dot
  ctx.beginPath()
  ctx.arc(pad + 9, y + 20, 9, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = P.ink
  ctx.font = `600 36px ${SANS}`
  for (const l of titleLines) {
    ctx.fillText(l, pad + 32, y)
    y += 48
  }
  ctx.fillStyle = P.muted
  ctx.font = `30px ${SANS}`
  const sub = [book?.author, q.page ? `s. ${q.page}` : null].filter(Boolean).join('  |  ')
  if (sub) ctx.fillText(sub, pad + 32, y + 4)
  return c
}

export const canvasToFile = (c: HTMLCanvasElement) =>
  new Promise<File>((res) => c.toBlob((b) => res(new File([b!], 'alinti.png', { type: 'image/png' })), 'image/png'))

export function downloadFile(file: File) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(file)
  a.download = file.name
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 5000)
}

/**
 * Hazır dosyayı paylaşır. Dosya önceden üretilmiş olmalı: iPhone'da paylaş menüsü yalnızca
 * dokunmanın hemen ardından açılabilir, araya uzun bir bekleme girerse reddedilir.
 */
export async function shareFile(file: File): Promise<'shared' | 'downloaded' | 'cancelled'> {
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] })
      return 'shared'
    } catch (e) {
      if ((e as Error).name === 'AbortError') return 'cancelled'
    }
  }
  downloadFile(file)
  return 'downloaded'
}
