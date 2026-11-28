import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

/**
 * Alttan açılan pencere için arka plan. iPhone'da klavye açılınca görünen alan küçülür ve kayar;
 * pencereyi visualViewport'a göre konumlandırarak klavyenin üstünde, görünür kalmasını sağlar.
 */
export function SheetBackdrop({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  const [box, setBox] = useState<{ top: number; height: number } | null>(null)

  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const update = () => setBox({ top: vv.offsetTop, height: vv.height })
    update()
    vv.addEventListener('resize', update)
    vv.addEventListener('scroll', update)
    return () => {
      vv.removeEventListener('resize', update)
      vv.removeEventListener('scroll', update)
    }
  }, [])

  const closeRef = useRef(onClose)
  closeRef.current = onClose

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeRef.current()
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [])

  return createPortal(
    <div
      className="sheet-backdrop"
      style={box ? { top: box.top, height: box.height, bottom: 'auto' } : undefined}
      onClick={onClose}
    >
      {children}
    </div>,
    document.body,
  )
}
