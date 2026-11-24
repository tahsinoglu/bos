import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Book, Quote, User } from './types'

export type BookInput = Omit<Book, 'id' | 'created_at'> & { id?: string }
export type QuoteInput = Omit<Quote, 'id' | 'created_at'> & { id?: string }

export interface Store {
  readonly mode: 'cloud' | 'local'
  currentUser(): Promise<User | null>
  onAuthChange(cb: (u: User | null) => void): () => void
  signOut(): Promise<void>
  loadAll(): Promise<{ books: Book[]; quotes: Quote[] }>
  saveBook(b: BookInput): Promise<Book>
  deleteBook(id: string): Promise<void>
  saveQuote(q: QuoteInput): Promise<Quote>
  deleteQuote(id: string): Promise<void>
}

const uid = () =>
  (crypto as Crypto & { randomUUID?: () => string }).randomUUID?.() ??
  Date.now().toString(36) + Math.random().toString(36).slice(2)

/* ---------------- Bulut (Supabase) ---------------- */

class CloudStore implements Store {
  readonly mode = 'cloud' as const
  constructor(public sb: SupabaseClient) {}

  private toUser(u: { id: string; email?: string; user_metadata?: Record<string, unknown> } | null | undefined): User | null {
    if (!u) return null
    const name = (u.user_metadata?.name as string) || u.email?.split('@')[0] || 'Okur'
    return { id: u.id, name, email: u.email }
  }
  async currentUser() {
    const { data } = await this.sb.auth.getSession()
    return this.toUser(data.session?.user)
  }
  onAuthChange(cb: (u: User | null) => void) {
    const { data } = this.sb.auth.onAuthStateChange((_e, s) => cb(this.toUser(s?.user)))
    return () => data.subscription.unsubscribe()
  }
  async signOut() {
    await this.sb.auth.signOut()
  }
  async loadAll() {
    const [b, q] = await Promise.all([
      this.sb.from('books').select('*').order('created_at', { ascending: false }),
      this.sb.from('quotes').select('*').order('created_at', { ascending: false }),
    ])
    if (b.error) throw b.error
    if (q.error) throw q.error
    return { books: b.data as Book[], quotes: q.data as Quote[] }
  }
  async saveBook(b: BookInput) {
    const { data, error } = await this.sb.from('books').upsert(b).select().single()
    if (error) throw error
    return data as Book
  }
  async deleteBook(id: string) {
    const { error } = await this.sb.from('books').delete().eq('id', id)
    if (error) throw error
  }
  async saveQuote(q: QuoteInput) {
    const { data, error } = await this.sb.from('quotes').upsert(q).select().single()
    if (error) throw error
    return data as Quote
  }
  async deleteQuote(id: string) {
    const { error } = await this.sb.from('quotes').delete().eq('id', id)
    if (error) throw error
  }
}

/* ---------------- Bu cihazda (localStorage) ---------------- */

const LS_USER = 'ka:user'
type LocalDb = { books: Book[]; quotes: Quote[] }

class LocalStore implements Store {
  readonly mode = 'local' as const
  private listeners = new Set<(u: User | null) => void>()

  private user(): User | null {
    try {
      return JSON.parse(localStorage.getItem(LS_USER) || 'null')
    } catch {
      return null
    }
  }
  private key() {
    const u = this.user()
    if (!u) throw new Error('Giriş yapılmadı')
    return 'ka:db:' + u.id
  }
  private read(): LocalDb {
    try {
      return JSON.parse(localStorage.getItem(this.key()) || '') as LocalDb
    } catch {
      return { books: [], quotes: [] }
    }
  }
  private write(db: LocalDb) {
    localStorage.setItem(this.key(), JSON.stringify(db))
  }

  async signIn(name: string) {
    const clean = name.trim()
    const u: User = { id: clean.toLocaleLowerCase('tr').replace(/\s+/g, '-'), name: clean }
    localStorage.setItem(LS_USER, JSON.stringify(u))
    this.listeners.forEach((l) => l(u))
  }
  async currentUser() {
    return this.user()
  }
  onAuthChange(cb: (u: User | null) => void) {
    this.listeners.add(cb)
    return () => void this.listeners.delete(cb)
  }
  async signOut() {
    localStorage.removeItem(LS_USER)
    this.listeners.forEach((l) => l(null))
  }
  async loadAll() {
    const db = this.read()
    const byDate = (a: { created_at: string }, b: { created_at: string }) => b.created_at.localeCompare(a.created_at)
    return { books: [...db.books].sort(byDate), quotes: [...db.quotes].sort(byDate) }
  }
  async saveBook(b: BookInput) {
    const db = this.read()
    const i = db.books.findIndex((x) => x.id === b.id)
    const book: Book = i >= 0 ? { ...db.books[i], ...b, id: db.books[i].id } : { ...b, id: uid(), created_at: new Date().toISOString() }
    if (i >= 0) db.books[i] = book
    else db.books.push(book)
    this.write(db)
    return book
  }
  async deleteBook(id: string) {
    const db = this.read()
    this.write({ books: db.books.filter((b) => b.id !== id), quotes: db.quotes.filter((q) => q.book_id !== id) })
  }
  async saveQuote(q: QuoteInput) {
    const db = this.read()
    const i = db.quotes.findIndex((x) => x.id === q.id)
    const quote: Quote = i >= 0 ? { ...db.quotes[i], ...q, id: db.quotes[i].id } : { ...q, id: uid(), created_at: new Date().toISOString() }
    if (i >= 0) db.quotes[i] = quote
    else db.quotes.push(quote)
    this.write(db)
    return quote
  }
  async deleteQuote(id: string) {
    const db = this.read()
    db.quotes = db.quotes.filter((q) => q.id !== id)
    this.write(db)
  }
}

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const supabase = url && key ? createClient(url, key) : null
export const store: Store = supabase ? new CloudStore(supabase) : new LocalStore()
export const localStore = store instanceof LocalStore ? store : null
