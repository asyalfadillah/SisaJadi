import { useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { Bg, Logo, Spinner } from '../components/ui'
import { supabase } from '../supabase'
import { useAuth } from '../auth'

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.3l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z"/><path fill="#FBBC05" d="M10.5 28.6A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.1.8-4.6l-7.9-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.7l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.9l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/></svg>
)

export default function Auth() {
  const [sp] = useSearchParams()
  const nav = useNavigate()
  const { user, loading } = useAuth()
  const [mode, setMode] = useState(sp.get('daftar') ? 'daftar' : 'masuk')
  const [f, setF] = useState({ name: '', business: '', email: '', password: '' })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [info, setInfo] = useState('')
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  if (loading) return <Spinner />
  if (user) return <Navigate to="/app" replace />

  const msg = (e) => {
    const m = e?.message || ''
    if (/Invalid login/i.test(m)) return 'Email atau kata sandi salah.'
    if (/already registered|already been registered/i.test(m)) return 'Email sudah terdaftar. Silakan masuk.'
    if (/Email not confirmed/i.test(m)) return 'Email belum dikonfirmasi. Cek kotak masuk emailmu.'
    if (/provider is not enabled|Unsupported provider/i.test(m)) return 'Login Google belum diaktifkan di Supabase. Gunakan email dulu.'
    if (/Password should be/i.test(m)) return 'Kata sandi minimal 6 karakter.'
    return m || 'Terjadi kesalahan. Coba lagi.'
  }

  const submit = async (e) => {
    e.preventDefault(); setErr(''); setInfo(''); setBusy(true)
    try {
      if (mode === 'masuk') {
        const { error } = await supabase.auth.signInWithPassword({ email: f.email, password: f.password })
        if (error) throw error
        nav('/app', { replace: true })
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: f.email, password: f.password,
          options: { data: { full_name: f.name, business_name: f.business }, emailRedirectTo: window.location.origin + '/app' },
        })
        if (error) throw error
        if (data.session) nav('/app', { replace: true })
        else setInfo('Akun dibuat. Kami mengirim tautan konfirmasi ke ' + f.email + '. Buka emailmu lalu masuk.')
      }
    } catch (e2) { setErr(msg(e2)) } finally { setBusy(false) }
  }

  const google = async () => {
    setErr(''); setBusy(true)
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + '/app' } })
    if (error) { setErr(msg(error)); setBusy(false) }
  }

  return (
    <>
      <Bg />
      <div className="auth">
        <motion.div className="card auth-box" initial={{ opacity: 0, y: 30, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.5 }}>
          <Link to="/" className="muted" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, marginBottom: 14 }}><ArrowLeft size={16} /> Kembali ke beranda</Link>
          <Logo size={22} />
          <div className="tabs" role="tablist">
            <button className={mode === 'masuk' ? 'on' : ''} onClick={() => { setMode('masuk'); setErr(''); setInfo('') }}>Masuk</button>
            <button className={mode === 'daftar' ? 'on' : ''} onClick={() => { setMode('daftar'); setErr(''); setInfo('') }}>Daftar</button>
          </div>
          <button className="btn gbtn block" onClick={google} disabled={busy} type="button"><GoogleIcon /> Lanjut dengan Google</button>
          <div className="sep">atau dengan email</div>
          {err && <div className="err" role="alert">{err}</div>}
          {info && <div className="ok">{info}</div>}
          <form onSubmit={submit}>
            <AnimatePresence initial={false}>
              {mode === 'daftar' && (
                <motion.div key="reg" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                  <div className="field"><label>Nama lengkap</label><input className="input" required value={f.name} onChange={set('name')} autoComplete="name" /></div>
                  <div className="field"><label>Nama usaha (opsional)</label><input className="input" value={f.business} onChange={set('business')} /></div>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="field"><label>Email</label><input className="input" type="email" required value={f.email} onChange={set('email')} autoComplete="email" /></div>
            <div className="field"><label>Kata sandi</label><input className="input" type="password" required minLength={6} value={f.password} onChange={set('password')} autoComplete={mode === 'masuk' ? 'current-password' : 'new-password'} /></div>
            <button className="btn block" disabled={busy}>{busy ? 'Memproses…' : mode === 'masuk' ? 'Masuk' : 'Buat Akun'}</button>
          </form>
        </motion.div>
      </div>
    </>
  )
}
