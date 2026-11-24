import { useEffect, useRef, useState } from 'react'

type Rect = { x: number; y: number; w: number; h: number } // 0..1 aralığında
type Drag = { mode: 'new' | 'move' | 'nw' | 'ne' | 'sw' | 'se'; sx: number; sy: number; start: Rect }

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v))
const MIN = 0.04

/**
 * Fotoğraf üzerinde parmakla alan seçtirir. Seçim kutusunu sürükleyip köşelerinden
 * boyutlandırabilir ya da boş yere sürükleyerek yeni bir seçim çizebilirsiniz.
 */
export function Cropper({ src, rect, onChange }: { src: string; rect: Rect; onChange: (r: Rect) => void }) {
  const box = useRef<HTMLDivElement>(null)
  const [drag, setDrag] = useState<Drag | null>(null)

  const pos = (e: React.PointerEvent) => {
    const r = box.current!.getBoundingClientRect()
    return { x: clamp((e.clientX - r.left) / r.width), y: clamp((e.clientY - r.top) / r.height) }
  }

  function down(e: React.PointerEvent) {
    const p = pos(e)
    const handle = (e.target as HTMLElement).dataset.h as Drag['mode'] | undefined
    const inside = p.x > rect.x && p.x < rect.x + rect.w && p.y > rect.y && p.y < rect.y + rect.h
    const mode: Drag['mode'] = handle ?? (inside ? 'move' : 'new')
    box.current!.setPointerCapture(e.pointerId)
    setDrag({ mode, sx: p.x, sy: p.y, start: mode === 'new' ? { x: p.x, y: p.y, w: 0, h: 0 } : rect })
  }

  function move(e: React.PointerEvent) {
    if (!drag) return
    const p = pos(e)
    const dx = p.x - drag.sx
    const dy = p.y - drag.sy
    const s = drag.start
    let x1 = s.x, y1 = s.y, x2 = s.x + s.w, y2 = s.y + s.h
    switch (drag.mode) {
      case 'move': {
        const nx = clamp(s.x + dx, 0, 1 - s.w)
        const ny = clamp(s.y + dy, 0, 1 - s.h)
        onChange({ ...s, x: nx, y: ny })
        return
      }
      case 'new':
        x1 = Math.min(drag.sx, p.x); x2 = Math.max(drag.sx, p.x)
        y1 = Math.min(drag.sy, p.y); y2 = Math.max(drag.sy, p.y)
        break
      case 'nw': x1 = Math.min(p.x, x2 - MIN); y1 = Math.min(p.y, y2 - MIN); break
      case 'ne': x2 = Math.max(p.x, x1 + MIN); y1 = Math.min(p.y, y2 - MIN); break
      case 'sw': x1 = Math.min(p.x, x2 - MIN); y2 = Math.max(p.y, y1 + MIN); break
      case 'se': x2 = Math.max(p.x, x1 + MIN); y2 = Math.max(p.y, y1 + MIN); break
    }
    onChange({ x: x1, y: y1, w: x2 - x1, h: y2 - y1 })
  }

  function up() {
    if (drag?.mode === 'new' && (rect.w < MIN || rect.h < MIN)) onChange(drag.start.w ? drag.start : { x: 0, y: 0, w: 1, h: 1 })
    setDrag(null)
  }

  // Seçim çok küçük kalırsa tamamına dön
  useEffect(() => {
    if (!drag && (rect.w < MIN || rect.h < MIN)) onChange({ x: 0, y: 0, w: 1, h: 1 })
  }, [drag, rect, onChange])

  const pct = (v: number) => v * 100 + '%'
  return (
    <div className="cropper" ref={box} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
      <img src={src} alt="" draggable={false} />
      <div
        className="crop-rect"
        style={{ left: pct(rect.x), top: pct(rect.y), width: pct(rect.w), height: pct(rect.h) }}
      >
        {(['nw', 'ne', 'sw', 'se'] as const).map((h) => (
          <span key={h} data-h={h} className={'handle ' + h} />
        ))}
      </div>
    </div>
  )
}

export type { Rect }

/** Görseli (dönüş açısıyla) yükler ve seçili alanı canvas olarak verir. */
export async function cropToCanvas(img: HTMLImageElement, rect: Rect): Promise<HTMLCanvasElement> {
  const W = img.naturalWidth
  const H = img.naturalHeight
  const c = document.createElement('canvas')
  c.width = Math.max(1, Math.round(rect.w * W))
  c.height = Math.max(1, Math.round(rect.h * H))
  c.getContext('2d')!.drawImage(img, rect.x * W, rect.y * H, c.width, c.height, 0, 0, c.width, c.height)
  return c
}

/** Görseli 90° döndürür ve küçültür (telefon fotoğrafları çok büyük olabilir). */
export async function normalizeImage(src: Blob | string, rotate = 0, maxSide = 2600): Promise<string> {
  const img = new Image()
  img.src = typeof src === 'string' ? src : URL.createObjectURL(src)
  await img.decode()
  const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight))
  const w = Math.round(img.naturalWidth * scale)
  const h = Math.round(img.naturalHeight * scale)
  const c = document.createElement('canvas')
  const side = rotate % 180 !== 0
  c.width = side ? h : w
  c.height = side ? w : h
  const ctx = c.getContext('2d')!
  ctx.translate(c.width / 2, c.height / 2)
  ctx.rotate((rotate * Math.PI) / 180)
  ctx.drawImage(img, -w / 2, -h / 2, w, h)
  if (typeof src !== 'string') URL.revokeObjectURL(img.src)
  return c.toDataURL('image/jpeg', 0.92)
}
