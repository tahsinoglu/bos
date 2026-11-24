import type { ReactNode } from 'react'
import { go, setPendingImage } from '../lib/router'

/** Tek dokunuşla kamerayı açar; çekilen foto ile "alıntı ekle" ekranına geçer. */
export function CaptureButton({ bookId, className, children }: { bookId?: string; className?: string; children: ReactNode }) {
  return (
    <label className={className} role="button">
      <input
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0]
          e.target.value = ''
          if (!f) return
          setPendingImage(f)
          go('/add' + (bookId ? '?book=' + bookId : ''))
        }}
      />
      {children}
    </label>
  )
}
