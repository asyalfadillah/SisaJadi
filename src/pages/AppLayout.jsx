import { NavLink, Navigate, Outlet, useLocation } from 'react-router-dom'
import { Home, Compass, PlusCircle, Heart, Award, Inbox, User, ShieldCheck, Lightbulb, LogOut, MessageCircle, Target, Map, Users, Leaf } from 'lucide-react'
import { useState } from 'react'
import { Splash } from './More'
import { AnimatePresence, motion } from 'framer-motion'
import { Bg, Logo, Spinner, Toaster } from '../components/ui'
import { useAuth } from '../auth'

export default function AppLayout() {
  const { user, profile, loading, isAdmin, signOut } = useAuth()
  const loc = useLocation()
  const [splash, setSplash] = useState(() => { try { return !sessionStorage.getItem('sj-splash') } catch { return false } })
  if (loading) return <><Bg /><Spinner /></>
  if (!user) return <Navigate to="/masuk" replace state={{ from: loc.pathname }} />
  if (profile && profile.onboarded === false) return <Navigate to="/onboarding" replace />
  const items = [
    ['/app', 'Beranda', Home, true], ['/app/jelajahi', 'Jelajahi', Compass], ['/app/jual', 'Jual Sisa', PlusCircle],
    ['/app/peta', 'Peta', Map], ['/app/favorit', 'Favorit', Heart], ['/app/permintaan', 'Permintaan', Inbox], ['/app/chat', 'Pesan', MessageCircle],
    ['/app/misi', 'Misi', Target], ['/app/komunitas', 'Komunitas', Users], ['/app/eco-point', 'Eco Point', Award], ['/app/dampak', 'Dampak', Leaf],
    ['/app/ide', 'Ide Sisa', Lightbulb], ['/app/profil', 'Profil', User],
  ]
  if (isAdmin) items.push(['/app/admin', 'Admin', ShieldCheck])
  const name = profile?.business_name || profile?.full_name || user.email
  return (
    <>
      <Bg />
      <Toaster />
      {splash && <Splash onDone={() => { try { sessionStorage.setItem('sj-splash', '1') } catch { /* abaikan */ } setSplash(false) }} />}
      <div className="app">
        <aside className="side">
          <div className="logo" style={{ padding: '0 10px 18px' }}><Logo size={20} /></div>
          {items.map(([to, t, I, end]) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => 'it' + (isActive ? ' active' : '')}><I size={20} />{t}</NavLink>
          ))}
          <div className="card me">
            <div className="avatar">{(name || '?')[0].toUpperCase()}</div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
              <div className="muted" style={{ fontSize: 12 }}>{profile?.eco_points ?? 0} Eco Point</div>
            </div>
            <button onClick={signOut} aria-label="Keluar" title="Keluar" style={{ background: 'none', border: 0, cursor: 'pointer', color: 'var(--muted)' }}><LogOut size={18} /></button>
          </div>
        </aside>
        <main className="main">
          <AnimatePresence mode="wait">
            <motion.div key={loc.pathname} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
        <nav className="bnav">
          <NavLink to="/app" end className={({ isActive }) => (isActive ? 'active' : '')}><Home size={20} />Beranda</NavLink>
          <NavLink to="/app/jelajahi" className={({ isActive }) => (isActive ? 'active' : '')}><Compass size={20} />Jelajahi</NavLink>
          <NavLink to="/app/jual" className="plus" aria-label="Jual Sisa"><PlusCircle size={26} /></NavLink>
          <NavLink to="/app/permintaan" className={({ isActive }) => (isActive ? 'active' : '')}><Inbox size={20} />Permintaan</NavLink>
          <NavLink to="/app/profil" className={({ isActive }) => (isActive ? 'active' : '')}><User size={20} />Profil</NavLink>
        </nav>
      </div>
    </>
  )
}
