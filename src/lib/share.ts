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

/** Instagram hikâyesi / WhatsApp durumu için güzel bir alıntı kartı üretir. */
const SERIF = "'Canela Text', 'Newsreader Variable', Georgia, serif"
const SANS = "'Graphik', 'Hanken Grotesk Variable', -apple-system, 'Segoe UI', Roboto, sans-serif"

export async function quoteCard(q: Quote, book?: Book): Promise<Blob> {
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
  const H = 1350
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const ctx = c.getContext('2d')!
  ctx.fillStyle = '#f7f6f4'
  ctx.fillRect(0, 0, W, H)
  // Aposto tarzı beyaz kart
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.roundRect(56, 56, W - 112, H - 112, 44)
  ctx.fill()

  const pad = 120
  const maxW = W - pad * 2
  let size = 54
  let lines: string[] = []
  // Metin sığana kadar yazı boyutunu küçült
  for (; size >= 26; size -= 2) {
    ctx.font = `${size}px ${SERIF}`
    lines = wrap(ctx, q.text, maxW)
    if (lines.length * size * 1.45 < H - 520) break
  }
  const lh = size * 1.45
  const blockH = lines.length * lh
  let y = Math.max(260, (H - blockH) / 2 - 60)

  ctx.fillStyle = '#4956ea'
  ctx.font = `600 160px ${SERIF}`
  ctx.fillText('“', pad - 12, y - 8)

  ctx.fillStyle = '#121212'
  ctx.font = `${size}px ${SERIF}`
  ctx.textBaseline = 'top'
  for (const l of lines) {
    ctx.fillText(l, pad, y)
    y += lh
  }

  y += 50
  ctx.fillStyle = '#ececec'
  ctx.fillRect(pad, y, maxW, 2)
  y += 40
  ctx.fillStyle = book?.color ?? '#121212'
  ctx.beginPath()
  ctx.arc(pad + 9, y + 20, 9, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#121212'
  ctx.font = `600 36px ${SANS}`
  for (const l of wrap(ctx, book?.title ?? '', maxW - 36)) {
    ctx.fillText(l, pad + 32, y)
    y += 48
  }
  ctx.fillStyle = '#7c7b7a'
  ctx.font = `30px ${SANS}`
  const sub = [book?.author, q.page ? `s. ${q.page}` : null].filter(Boolean).join('  |  ')
  if (sub) ctx.fillText(sub, pad + 32, y + 4)

  return new Promise((res) => c.toBlob((b) => res(b!), 'image/png'))
}

export async function shareCard(q: Quote, book?: Book) {
  const blob = await quoteCard(q, book)
  const file = new File([blob], 'alinti.png', { type: 'image/png' })
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] })
      return
    } catch (e) {
      if ((e as Error).name === 'AbortError') return
    }
  }
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'alinti.png'
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 5000)
}
