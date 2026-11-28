import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search, Map as MapIcon, List } from 'lucide-react'
import { supabase, CATEGORIES, MODES, dist } from '../supabase'
import { useGeo } from '../geo'
import Topbar from '../components/Topbar'
import ListingCard, { ListingRow } from '../components/ListingCard'

export function useListings({ q = '', cat = '', mode = '', limit = 80 } = {}) {
  const [items, setItems] = useState(null)
  useEffect(() => {
    setItems(null)
    let s = supabase.from('sj_listings').select('*').eq('status', 'aktif').order('created_at', { ascending: false }).limit(limit)
    if (cat) s = s.eq('category', cat)
    if (mode) s = s.eq('mode', mode)
    if (q) { const t = q.replace(/[%,()]/g, ' '); s = s.or(`title.ilike.%${t}%,city.ilike.%${t}%,owner_name.ilike.%${t}%,category.ilike.%${t}%`) }
    s.then(({ data }) => setItems(data || []))
  }, [q, cat, mode, limit])
  return items
}

export function sortListings(items, sort, pos) {
  if (!items) return items
  const a = items.map((l) => ({ l, km: dist(pos, l) }))
  if (sort === 'Terdekat') a.sort((x, y) => (x.km ?? 1e9) - (y.km ?? 1e9))
  else if (sort === 'Termurah') a.sort((x, y) => x.l.price - y.l.price)
  return a
}

export default function Explore() {
  const [sp, setSp] = useSearchParams()
  const q = sp.get('q') || '', cat = sp.get('kategori') || '', mode = sp.get('mode') || '', sort = sp.get('urut') || 'Terbaru'
  const [text, setText] = useState(q)
  const { pos, ask, err } = useGeo()
  const items = useListings({ q, cat, mode })
  const upd = (k, v) => { const n = new URLSearchParams(sp); v ? n.set(k, v) : n.delete(k); setSp(n, { replace: true }) }
  const rows = useMemo(() => sortListings(items, sort, pos), [items, sort, pos])
  useEffect(() => { if (sort === 'Terdekat' && !pos) ask() }, [sort, pos, ask])

  return (
    <>
      <Topbar title="Jelajahi" sub="Cari sisa produksi yang kamu butuhkan" back={false} />
      <form className="search" onSubmit={(e) => { e.preventDefault(); upd('q', text) }}>
        <Search size={20} color="#2E7D4F" /><input placeholder="Cari judul, kota, kategori, atau nama usaha" value={text} onChange={(e) => setText(e.target.value)} />
      </form>
      <div style={{ display: 'flex', gap: 8, marginTop: 14, alignItems: 'center', flexWrap: 'wrap' }}>
        <span className="chip on"><List size={16} />Daftar</span>
        <Link className="chip" to={'/app/peta' + (q ? '?q=' + encodeURIComponent(q) : '')}><MapIcon size={16} />Peta</Link>
        <Link className="chip" to="/app/kategori">Semua kategori</Link>
      </div>
      <div className="rowflex" style={{ marginTop: 8 }}>
        <button className={'chip' + (!cat ? ' on' : '')} onClick={() => upd('kategori', '')}>Semua</button>
        {CATEGORIES.map((c) => <button key={c} className={'chip' + (cat === c ? ' on' : '')} onClick={() => upd('kategori', c)}>{c}</button>)}
      </div>
      <div className="rowflex">
        <button className={'chip' + (!mode ? ' on' : '')} onClick={() => upd('mode', '')}>Semua jenis</button>
        {MODES.map((m) => <button key={m} className={'chip' + (mode === m ? ' on' : '')} onClick={() => upd('mode', m)}>{m}</button>)}
      </div>
      <div className="rowflex">
        {['Terbaru', 'Terdekat', 'Termurah'].map((s) => <button key={s} className={'chip' + (sort === s ? ' on' : '')} onClick={() => upd('urut', s === 'Terbaru' ? '' : s)}>{s}</button>)}
      </div>
      {sort === 'Terdekat' && !pos && <div className="err">{err || 'Mengambil lokasimu…'} Urutan jarak butuh izin lokasi.</div>}
      <div className="grid g3" style={{ marginTop: 14 }}>
        {rows === null ? <div className="spin" /> : rows.length === 0 ? <div className="empty">Tidak ada sisa yang cocok.</div> :
          rows.map(({ l, km }, i) => <ListingCard key={l.id} l={l} i={i} km={sort === 'Terdekat' ? km : null} to={'/app/sisa/' + l.id} />)}
      </div>
    </>
  )
}
