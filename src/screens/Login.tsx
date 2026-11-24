import { useState } from 'react'
import { localStore, supabase } from '../lib/store'

export function Login() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [signup, setSignup] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)
    setBusy(true)
    try {
      if (localStore) {
        await localStore.signIn(name)
      } else if (supabase) {
        const res = signup
          ? await supabase.auth.signUp({ email, password, options: { data: { name } } })
          : await supabase.auth.signInWithPassword({ email, password })
        if (res.error) throw res.error
        if (signup && !res.data.session) setMsg('E-postanı kontrol et, onay bağlantısı gönderdik.')
      }
    } catch (err) {
      const m = (err as Error).message
      setMsg(m.includes('Invalid login') ? 'E-posta ya da şifre hatalı.' : m)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="login">
      <div className="login-hero">
        <img src="/icon.svg" alt="" width={72} height={72} />
        <h1>Kitap Alıntılarım</h1>
        <p>Okurken altını çizmek istediğin yerleri fotoğrafla, sakla, dilediğinde yeniden oku.</p>
      </div>
      <form className="card login-form" onSubmit={submit}>
        {localStore ? (
          <>
            <label className="field">
              <span>Adın</span>
              <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="ör. Ayşe" />
            </label>
            <button className="btn primary wide" disabled={!name.trim() || busy}>
              Başla
            </button>
            <p className="hint">Notların bu cihazda saklanır. Hesapla giriş ve cihazlar arası eşitleme için README’ye bak.</p>
          </>
        ) : (
          <>
            {signup && (
              <label className="field">
                <span>Adın</span>
                <input value={name} onChange={(e) => setName(e.target.value)} />
              </label>
            )}
            <label className="field">
              <span>E-posta</span>
              <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <label className="field">
              <span>Şifre</span>
              <input
                type="password"
                autoComplete={signup ? 'new-password' : 'current-password'}
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <button className="btn primary wide" disabled={busy || !email || password.length < 6}>
              {signup ? 'Hesap oluştur' : 'Giriş yap'}
            </button>
            <button type="button" className="link" onClick={() => setSignup((s) => !s)}>
              {signup ? 'Zaten hesabım var' : 'Hesabın yok mu? Kaydol'}
            </button>
          </>
        )}
        {msg && <p className="msg">{msg}</p>}
      </form>
    </div>
  )
}
