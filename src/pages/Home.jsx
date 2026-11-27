import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, Upload, Repeat, Inbox, Award, Lightbulb, Mic } from 'lucide-react'
import { motion } from 'framer-motion'
import { supabase, CATEGORIES } from '../supabase'
import { useAuth } from '../auth'
import { Count, CatIcon } from '../components/ui'
import ListingCard from '../components/ListingCard'

export default function Home() {
  const { profile } = useAuth()
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('Semua')
  const [stats, setStats] = useState({ umkm: 0, listings: 0, selesai: 0, kg: 0 })
  const [items, setItems] = useState(null)

  useEffect(() => { supabase.rpc('sj_stats').then(({ data }) => data && setStats(data)) }, [])
  useEffect(() => {
    setItems(null)
    let s = supabase.from('sj_listings').select('*').eq('status', 'aktif').order('created_at', { ascending: false }).limit(8)
    if (cat !== 'Semua') s = s.eq('category', cat)
    s.then(({ data }) => setItems(data || []))
  }, [cat])

  const menu = [
    [Upload, '#E3F1E6', '#2E7D4F', 'Jual Sisa', '/app/jual'], [Repeat, '#DCEFF7', '#1D6B8A', 'Barter', '/app/jelajahi?mode=Barter'],
    [Inbox, '#FBE3D6', '#B5532A', 'Request', '/app/permintaan'], [Award, '#F7E7A6', '#8A6400', 'Eco Point', '/app/eco-point'],
    [Lightbulb, '#E3F1E6', '#2E7D4F', 'Ide Sisa', '/app/ide'],
  ]
  return (
    <>
      <div style={{ marginBottom: 18 }}>
        <div className="muted" style={{ fontSize: 14 }}>Halo,</div>
        <h1 style={{ fontSize: 26 }}>{(profile?.full_name || profile?.business_name || 'Teman SisaJadi').split(' ')[0]} 👋</h1>
      </div>
      <form className="search" onSubmit={(e) => { e.preventDefault(); nav('/app/jelajahi?q=' + encodeURIComponent(q)) }}>
        <Search size={20} color="#2E7D4F" /><input placeholder="Cari ampas kopi, kain perca…" value={q} onChange={(e) => setQ(e.target.value)} />
        <Mic size={18} color="#2E7D4F" />
      </form>
      <div className="card qmenu" style={{ marginTop: 16 }}>
        {menu.map(([I, bg, fg, t, to]) => <Link key={t} to={to}><span style={{ background: bg }}><I size={26} color={fg} /></span>{t}</Link>)}
      </div>
      <motion.div className="dampak" style={{ marginTop: 18 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <span className="pill" style={{ background: 'rgba(255,255,255,.22)', color: '#fff', boxShadow: 'none' }}>Dampak Bersama</span>
        <b><Count to={Math.round(stats.kg)} /> kg</b>
        <div style={{ opacity: .9 }}>sisa produksi tercatat di SisaJadi</div>
        <div className="pills"><span>{stats.umkm} UMKM</span><span>{stats.listings} sisa aktif</span><span>{stats.selesai} transaksi</span></div>
      </motion.div>
      <div className="sect"><h2>Kategori Sisa</h2><Link to="/app/jelajahi">Lihat semua ›</Link></div>
      <div className="rowflex">
        {['Semua', ...CATEGORIES].map((c) => <button key={c} className={'chip' + (cat === c ? ' on' : '')} onClick={() => setCat(c)}>{c !== 'Semua' && <CatIcon cat={c} size={16} />}{c}</button>)}
      </div>
      <div className="grid g3" style={{ marginTop: 10 }}>
        {items === null ? <div className="spin" /> : items.length === 0 ? <div className="empty">Belum ada sisa di kategori ini.</div> :
          items.map((l, i) => <ListingCard key={l.id} l={l} i={i} to={'/app/sisa/' + l.id} />)}
      </div>
    </>
  )
}
