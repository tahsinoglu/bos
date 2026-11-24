import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { store, type BookInput, type QuoteInput } from './store'
import type { Book, Quote, User } from './types'

interface Data {
  user: User | null
  ready: boolean
  books: Book[]
  quotes: Quote[]
  error: string | null
  bookById: (id: string) => Book | undefined
  saveBook: (b: BookInput) => Promise<Book>
  deleteBook: (id: string) => Promise<void>
  saveQuote: (q: QuoteInput) => Promise<Quote>
  deleteQuote: (id: string) => Promise<void>
  toast: (msg: string) => void
  toastMsg: string | null
}

const Ctx = createContext<Data>(null!)
export const useData = () => useContext(Ctx)

const upsert = <T extends { id: string }>(list: T[], item: T) =>
  list.some((x) => x.id === item.id) ? list.map((x) => (x.id === item.id ? item : x)) : [item, ...list]

export function DataProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(false)
  const [books, setBooks] = useState<Book[]>([])
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [error, setError] = useState<string | null>(null)
  const [toastMsg, setToast] = useState<string | null>(null)

  const load = useCallback(async (u: User | null) => {
    setUser(u)
    if (!u) {
      setBooks([])
      setQuotes([])
      setReady(true)
      return
    }
    try {
      const d = await store.loadAll()
      setBooks(d.books)
      setQuotes(d.quotes)
      setError(null)
    } catch (e) {
      setError((e as Error).message)
    }
    setReady(true)
  }, [])

  useEffect(() => {
    store.currentUser().then(load)
    return store.onAuthChange((u) => {
      setUser((prev) => {
        if (prev?.id !== u?.id) load(u)
        return u
      })
    })
  }, [load])

  const toast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast((m) => (m === msg ? null : m)), 2200)
  }, [])

  const value: Data = {
    user,
    ready,
    books,
    quotes,
    error,
    toast,
    toastMsg,
    bookById: (id) => books.find((b) => b.id === id),
    async saveBook(b) {
      const saved = await store.saveBook(b)
      setBooks((l) => upsert(l, saved))
      return saved
    },
    async deleteBook(id) {
      await store.deleteBook(id)
      setBooks((l) => l.filter((b) => b.id !== id))
      setQuotes((l) => l.filter((q) => q.book_id !== id))
    },
    async saveQuote(q) {
      const saved = await store.saveQuote(q)
      setQuotes((l) => upsert(l, saved))
      return saved
    },
    async deleteQuote(id) {
      await store.deleteQuote(id)
      setQuotes((l) => l.filter((q) => q.id !== id))
    },
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

/** "42", "42-43", "s.42" gibi sayfa değerlerini sıralama için sayıya çevirir. */
export const pageNum = (p: string | null) => {
  const m = p?.match(/\d+/)
  return m ? parseInt(m[0], 10) : Number.POSITIVE_INFINITY
}
