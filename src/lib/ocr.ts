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

/** Uygulama açılınca arka planda dil dosyasını hazırlamak için. */
export function warmUpOcr() {
  getWorker().catch(() => {})
}

/** Kırpılmış görseli OCR için hazırlar: makul boyut + gri ton + kontrast. */
function prepare(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const target = Math.min(2200, Math.max(1200, canvas.width))
  const scale = target / canvas.width
  const out = document.createElement('canvas')
  out.width = Math.round(canvas.width * scale)
  out.height = Math.round(canvas.height * scale)
  const ctx = out.getContext('2d')!
  ctx.filter = 'grayscale(1) contrast(1.35)'
  ctx.drawImage(canvas, 0, 0, out.width, out.height)
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

export async function recognize(canvas: HTMLCanvasElement, onProgress?: (p: number) => void) {
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
    const { data } = await worker.recognize(prepare(canvas))
    return extractPage(cleanText(data.text))
  } finally {
    progressCb = null
  }
}
