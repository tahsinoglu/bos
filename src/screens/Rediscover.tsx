import { useMemo, useState } from 'react'
import { Icon } from '../components/Icon'
import { QuoteItem } from '../components/QuoteItem'
import { useData } from '../lib/data'

/** Eski alıntılara rastgele dönüp yeniden okumak için. */
export function Rediscover() {
  const { quotes } = useData()
  const [onlyFav, setOnlyFav] = useState(false)
  const pool = useMemo(() => (onlyFav ? quotes.filter((q) => q.favorite) : quotes), [quotes, onlyFav])
  const [seed, setSeed] = useState(() => Math.random())
  const q = pool.length ? pool[Math.floor(seed * pool.length) % pool.length] : null

  // Geçmişte bugün eklenenler (önceki aylardan/yıllardan)
  const today = new Date()
  const memories = quotes.filter((x) => {
    const d = new Date(x.created_at)
    return d.getDate() === today.getDate() && d.toDateString() !== today.toDateString()
  })

  return (
    <div className="page">
      <header className="page-head">
        <p className="eyebrow">Yeniden oku</p>
        <h1 className="display">Hatırla</h1>
      </header>
      <div className="segmented">
        <button className={!onlyFav ? 'on' : ''} onClick={() => setOnlyFav(false)}>
          Tüm alıntılar
        </button>
        <button className={onlyFav ? 'on' : ''} onClick={() => setOnlyFav(true)}>
          ♥ Favoriler
        </button>
      </div>

      {q ? (
        <div className="rediscover" key={q.id}>
          <QuoteItem q={q} showBook />
          <button className="btn primary wide" onClick={() => setSeed(Math.random())} disabled={pool.length < 2}>
            <Icon name="shuffle" /> Başka bir tane
          </button>
        </div>
      ) : (
        <p className="card empty-note">
          {onlyFav ? 'Henüz favori alıntın yok. Alıntılardaki ♥ ile işaretleyebilirsin.' : 'Alıntı ekledikçe burada karşına çıkacak.'}
        </p>
      )}

      {memories.length > 0 && (
        <section>
          <h3 className="eyebrow section-head outside">Geçmişte bu gün</h3>
          {memories.map((m) => (
            <QuoteItem key={m.id} q={m} showBook />
          ))}
        </section>
      )}
    </div>
  )
}
