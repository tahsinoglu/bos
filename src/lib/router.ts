import { useEffect, useState } from 'react'

export function useRoute() {
  const [hash, setHash] = useState(() => location.hash.slice(1) || '/')
  useEffect(() => {
    const on = () => {
      setHash(location.hash.slice(1) || '/')
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  const [path, qs] = hash.split('?')
  return { path, params: new URLSearchParams(qs) }
}

export const go = (to: string) => {
  location.hash = to
}
export const back = () => (history.length > 1 ? history.back() : go('/'))

/** Fotoğraf seçimi ile ekran geçişi arasında dosyayı taşımak için. */
let pending: File | null = null
export const setPendingImage = (f: File | null) => (pending = f)
export const takePendingImage = () => {
  const f = pending
  pending = null
  return f
}
