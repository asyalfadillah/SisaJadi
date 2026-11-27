import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search } from 'lucide-react'
import { supabase, CATEGORIES, MODES } from '../supabase'
import Topbar from '../components/Topbar'
import ListingCard from '../components/ListingCard'

export default function Explore() {
  const [sp, setSp] = useSearchParams()
  const q = sp.get('q') || '', cat = sp.get('kategori') || '', mode = sp.get('mode') || ''
  const [text, setText] = useState(q)
  const [items, setItems] = useState(null)
  const upd = (k, v) => { const n = new URLSearchParams(sp); v ? n.set(k, v) : n.delete(k); setSp(n, { replace: true }) }

  useEffect(() => {
    setItems(null)
    let s = supabase.from('sj_listings').select('*').eq('status', 'aktif').order('created_at', { ascending: false }).limit(60)
    if (cat) s = s.eq('category', cat)
    if (mode) s = s.eq('mode', mode)
    if (q) s = s.or(`title.ilike.%${q.replace(/[%,()]/g, ' ')}%,city.ilike.%${q.replace(/[%,()]/g, ' ')}%,owner_name.ilike.%${q.replace(/[%,()]/g, ' ')}%`)
    s.then(({ data }) => setItems(data || []))
  }, [q, cat, mode])

  return (
    <>
      <Topbar title="Jelajahi" sub="Cari sisa produksi yang kamu butuhkan" back={false} />
      <form className="search" onSubmit={(e) => { e.preventDefault(); upd('q', text) }}>
        <Search size={20} color="#2E7D4F" /><input placeholder="Cari judul, kota, atau nama usaha" value={text} onChange={(e) => setText(e.target.value)} />
      </form>
      <div className="rowflex" style={{ marginTop: 14 }}>
        <button className={'chip' + (!cat ? ' on' : '')} onClick={() => upd('kategori', '')}>Semua</button>
        {CATEGORIES.map((c) => <button key={c} className={'chip' + (cat === c ? ' on' : '')} onClick={() => upd('kategori', c)}>{c}</button>)}
      </div>
      <div className="rowflex">
        <button className={'chip' + (!mode ? ' on' : '')} onClick={() => upd('mode', '')}>Semua jenis</button>
        {MODES.map((m) => <button key={m} className={'chip' + (mode === m ? ' on' : '')} onClick={() => upd('mode', m)}>{m}</button>)}
      </div>
      <div className="grid g3" style={{ marginTop: 14 }}>
        {items === null ? <div className="spin" /> : items.length === 0 ? <div className="empty">Tidak ada sisa yang cocok.</div> :
          items.map((l, i) => <ListingCard key={l.id} l={l} i={i} to={'/app/sisa/' + l.id} />)}
      </div>
    </>
  )
}
