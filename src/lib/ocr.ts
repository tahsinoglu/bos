import { createWorker, type Worker } from 'tesseract.js'

let workerPromise: Promise<Worker> | null = null
let progressCb: ((p: number) => void) | null = null

function getWorker() {
  if (!workerPromise) {
    const base = new URL(import.meta.env.BASE_URL + 'tesseract/', location.href).href
    workerPromise = createWorker('tur', 1, {
      workerPath: base + 'worker.min.js',
      corePath: base,
      langPath: base.slice(0, -1),
      errorHandler: (e: unknown) => console.error('OCR', e),
      logger: (m: { status: string; progress: number }) => {
        if (m.status === 'recognizing text') progressCb?.(m.progress)
      },
    }).catch((e) => {
      workerPromise = null
      throw e
    })
  }
  return workerPromise
}

/** Uygulama açılınca arka planda dil dosyasını hazırlamak için (yedek olarak). */
export function warmUpOcr() {
  getWorker().catch(() => {})
}

/**
 * Kırpılmış görseli OCR için hazırlar: makul boyuta getirir, gri tona çevirir ve
 * yerel (adaptif) eşikleme ile siyah-beyaz yapar. Böylece sayfanın gölgede kalan
 * kısımları ve kıvrılan kenarlar da okunabilir hale gelir.
 */
export function prepare(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const target = Math.min(2400, Math.max(1400, canvas.width))
  const scale = target / canvas.width
  const out = document.createElement('canvas')
  const W = (out.width = Math.round(canvas.width * scale))
  const H = (out.height = Math.round(canvas.height * scale))
  const ctx = out.getContext('2d', { willReadFrequently: true })!
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(canvas, 0, 0, W, H)
  const img = ctx.getImageData(0, 0, W, H)
  const d = img.data

  // Gri ton + integral görüntü
  const gray = new Float32Array(W * H)
  const integral = new Float64Array((W + 1) * (H + 1))
  for (let y = 0; y < H; y++) {
    let row = 0
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4
      const g = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]
      gray[y * W + x] = g
      row += g
      integral[(y + 1) * (W + 1) + x + 1] = integral[y * (W + 1) + x + 1] + row
    }
  }

  // Bradley eşikleme: piksel çevresinin ortalamasından belirgin koyuysa yazıdır
  const r = Math.max(8, Math.round(W / 32))
  const T = 0.16
  for (let y = 0; y < H; y++) {
    const y0 = Math.max(0, y - r), y1 = Math.min(H - 1, y + r)
    for (let x = 0; x < W; x++) {
      const x0 = Math.max(0, x - r), x1 = Math.min(W - 1, x + r)
      const count = (x1 - x0 + 1) * (y1 - y0 + 1)
      const sum =
        integral[(y1 + 1) * (W + 1) + x1 + 1] - integral[y0 * (W + 1) + x1 + 1] -
        integral[(y1 + 1) * (W + 1) + x0] + integral[y0 * (W + 1) + x0]
      const v = gray[y * W + x] * count < sum * (1 - T) ? 0 : 255
      const i = (y * W + x) * 4
      d[i] = d[i + 1] = d[i + 2] = v
      d[i + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  return out
}

/** Kitap sayfası metnini paragraf haline getirir: satır sonu tirelerini birleştirir. */
export function cleanText(raw: string): string {
  return raw
    .replace(/\r/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/(\p{L})[-­]\s*\n\s*(\p{Ll})/gu, '$1$2') // keli-\nme → kelime
    .split(/\n\s*\n/) // paragraflar
    .map((p) => p.replace(/\s*\n\s*/g, ' ').trim())
    .filter(Boolean)
    .join('\n\n')
    .replace(/\s+([,.;:!?])/g, '$1')
    .trim()
}

/** Metnin başında/sonunda tek başına duran sayıyı (sayfa numarası) ayırır. */
export function extractPage(text: string): { text: string; page: string | null } {
  const parts = text.split('\n\n')
  let page: string | null = null
  const isNum = (p?: string) => !!p && /^[-–—\s]*\d{1,4}[-–—\s]*$/.test(p)
  if (isNum(parts[parts.length - 1])) page = parts.pop()!.replace(/\D/g, '')
  else if (isNum(parts[0])) page = parts.shift()!.replace(/\D/g, '')
  return { text: parts.join('\n\n').trim(), page }
}

type Line = { text: string; confidence: number; words: { text: string; confidence: number }[] }
type Para = { lines: Line[] }

/** Tesseract çıktısından düşük güvenli kelime ve satırları (karşı sayfa, gölge, leke) ayıklar. */
function filterLowConfidence(paragraphs: Para[]): string {
  const out: string[] = []
  for (const p of paragraphs) {
    const lines: string[] = []
    for (const l of p.lines) {
      // Harf/rakam içermeyen kırıntıları at ("|", "—", "#"); satır başındaki diyalog tiresini koru
      const words = l.words.filter((w, i) => /[\p{L}\d]/u.test(w.text) || (i === 0 && /^[-–—]$/.test(w.text.trim())))
      if (!words.length) continue
      const good = words.filter((w) => w.confidence >= 60 && /\p{L}{2,}|\d/u.test(w.text))
      // Satırın çoğu güvenilmezse tamamen at
      if (good.length / words.length < 0.5 || l.confidence < 45) continue
      // Satır başı/sonundaki güvenilmez kırıntıları at, ortadakileri koru
      let a = 0, b = words.length - 1
      while (a <= b && words[a].confidence < 60) a++
      while (b >= a && words[b].confidence < 60) b--
      lines.push(words.slice(a, b + 1).map((w) => w.text).join(' '))
    }
    if (lines.length) out.push(lines.join('\n'))
  }
  return out.join('\n\n')
}

async function recognizeLocal(canvas: HTMLCanvasElement, onProgress?: (p: number) => void) {
  const worker = await Promise.race([
    getWorker(),
    new Promise<never>((_, rej) =>
      setTimeout(() => {
        workerPromise = null
        rej(new Error('Metin tanıma motoru yüklenemedi'))
      }, 60000),
    ),
  ])
  progressCb = onProgress ?? null
  try {
    const { data } = await worker.recognize(prepare(canvas), {}, { blocks: true, text: true })
    const paras = (data.blocks ?? []).flatMap((b) => b.paragraphs) as unknown as Para[]
    const raw = paras.length ? filterLowConfidence(paras) : data.text
    return extractPage(cleanText(raw))
  } finally {
    progressCb = null
  }
}

/* ---------------- Claude ile okuma (sunucu fonksiyonu /api/ocr) ---------------- */

let cloudAvailable: boolean | null = null

function toJpegBase64(canvas: HTMLCanvasElement, maxSide = 2000): string {
  const scale = Math.min(1, maxSide / Math.max(canvas.width, canvas.height))
  const c = document.createElement('canvas')
  c.width = Math.round(canvas.width * scale)
  c.height = Math.round(canvas.height * scale)
  c.getContext('2d')!.drawImage(canvas, 0, 0, c.width, c.height)
  return c.toDataURL('image/jpeg', 0.88).split(',')[1]
}

async function recognizeCloud(canvas: HTMLCanvasElement): Promise<{ text: string; page: string | null } | null> {
  if (cloudAvailable === false) return null
  try {
    const res = await fetch(import.meta.env.BASE_URL + 'api/ocr', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ image: toJpegBase64(canvas), mediaType: 'image/jpeg' }),
    })
    if (res.status === 503 || res.status === 404) {
      cloudAvailable = false // anahtar tanımlı değil ya da fonksiyon yok → bu oturumda bir daha deneme
      return null
    }
    if (!res.ok) return null
    cloudAvailable = true
    const out = (await res.json()) as { text: string; page: string | null }
    return { text: cleanText(out.text), page: out.page }
  } catch {
    return null
  }
}

export type OcrEngine = 'cloud' | 'local'

/** Önce Claude ile okur (daha isabetli); kullanılamıyorsa cihazdaki OCR'a geçer. */
export async function recognize(
  canvas: HTMLCanvasElement,
  onProgress?: (p: number) => void,
): Promise<{ text: string; page: string | null; engine: OcrEngine }> {
  const cloud = await recognizeCloud(canvas)
  if (cloud && cloud.text) return { ...cloud, engine: 'cloud' }
  return { ...(await recognizeLocal(canvas, onProgress)), engine: 'local' }
}
