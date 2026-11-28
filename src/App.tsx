import { useEffect } from 'react'
import { Icon } from './components/Icon'
import { useData } from './lib/data'
import { warmUpOcr } from './lib/ocr'
import { useRoute } from './lib/router'
import { AddQuote } from './screens/AddQuote'
import { BookDetail } from './screens/BookDetail'
import { Library } from './screens/Library'
import { Login } from './screens/Login'
import { Profile } from './screens/Profile'
import { Rediscover } from './screens/Rediscover'
import { Search } from './screens/Search'

const tabs = [
  { to: '/', icon: 'books', label: 'Kitaplık' },
  { to: '/hatirla', icon: 'shuffle', label: 'Hatırla' },
  { to: '/ara', icon: 'search', label: 'Ara' },
  { to: '/profil', icon: 'user', label: 'Profil' },
]

export function App() {
  const { user, ready, error, toastMsg } = useData()
  const { path, params } = useRoute()

  useEffect(() => {
    if (user) warmUpOcr()
  }, [user])

  if (!ready) return <div className="splash">Alıntılarım</div>
  if (!user) return <Login />

  let screen
  if (path.startsWith('/book/')) screen = <BookDetail id={path.slice(6)} />
  else if (path === '/add') screen = <AddQuote key={params.toString()} params={params} />
  else if (path === '/hatirla') screen = <Rediscover />
  else if (path === '/ara') screen = <Search />
  else if (path === '/profil') screen = <Profile />
  else screen = <Library />

  const showNav = path !== '/add'
  return (
    <>
      {error && <div className="banner">Veriler yüklenemedi: {error}</div>}
      <main className={showNav ? 'with-nav' : ''}>{screen}</main>
      {showNav && (
        <nav className="tabbar">
          {tabs.map((t) => (
            <a key={t.to} href={'#' + t.to} className={path === t.to ? 'on' : ''}>
              <Icon name={t.icon} size={22} />
              <span>{t.label}</span>
            </a>
          ))}
        </nav>
      )}
      {toastMsg && <div className="toast">{toastMsg}</div>}
    </>
  )
}
