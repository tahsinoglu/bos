export type BookStatus = 'reading' | 'finished' | 'want'

export interface Book {
  id: string
  title: string
  author: string | null
  status: BookStatus
  rating: number | null
  color: string
  created_at: string
  finished_at: string | null
}

export interface Quote {
  id: string
  book_id: string
  text: string
  page: string | null
  note: string | null
  favorite: boolean
  created_at: string
}

export interface User {
  id: string
  name: string
  email?: string
}

export const STATUS_LABEL: Record<BookStatus, string> = {
  reading: 'Okuyorum',
  finished: 'Okudum',
  want: 'Okuyacağım',
}

export const BOOK_COLORS = ['#7a3e2b', '#2f4f4f', '#4a5d23', '#3b4a6b', '#6b3b5a', '#8a6d1f', '#5a4636', '#2d5a6b']
