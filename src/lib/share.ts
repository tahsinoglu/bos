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
export async function quoteCard(q: Quote, book?: Book): Promise<Blob> {
  const W = 1080
  const H = 1350
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const ctx = c.getContext('2d')!
  ctx.fillStyle = '#f6f1e7'
  ctx.fillRect(0, 0, W, H)
  ctx.fillStyle = book?.color ?? '#7a3e2b'
  ctx.fillRect(0, 0, 24, H)

  const pad = 120
  const maxW = W - pad * 2
  let size = 54
  let lines: string[] = []
  // Metin sığana kadar yazı boyutunu küçült
  for (; size >= 26; size -= 2) {
    ctx.font = `${size}px Georgia, 'Times New Roman', serif`
    lines = wrap(ctx, q.text, maxW)
    if (lines.length * size * 1.45 < H - 520) break
  }
  const lh = size * 1.45
  const blockH = lines.length * lh
  let y = Math.max(260, (H - blockH) / 2 - 60)

  ctx.fillStyle = book?.color ?? '#7a3e2b'
  ctx.font = `bold 180px Georgia, serif`
  ctx.globalAlpha = 0.25
  ctx.fillText('“', pad - 30, y - 10)
  ctx.globalAlpha = 1

  ctx.fillStyle = '#2b2118'
  ctx.font = `${size}px Georgia, 'Times New Roman', serif`
  ctx.textBaseline = 'top'
  for (const l of lines) {
    ctx.fillText(l, pad, y)
    y += lh
  }

  y += 50
  ctx.fillStyle = book?.color ?? '#7a3e2b'
  ctx.fillRect(pad, y, 80, 4)
  y += 34
  ctx.fillStyle = '#2b2118'
  ctx.font = `600 38px -apple-system, 'Segoe UI', Roboto, sans-serif`
  for (const l of wrap(ctx, book?.title ?? '', maxW)) {
    ctx.fillText(l, pad, y)
    y += 48
  }
  ctx.fillStyle = '#7d6f60'
  ctx.font = `32px -apple-system, 'Segoe UI', Roboto, sans-serif`
  const sub = [book?.author, q.page ? `s. ${q.page}` : null].filter(Boolean).join(' · ')
  if (sub) ctx.fillText(sub, pad, y + 4)

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
