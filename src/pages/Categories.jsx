import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import { supabase, CATEGORIES } from '../supabase'
import { useGeo } from '../geo'
import { CAT, CatIcon, Reveal } from '../components/ui'
import { ListingRow } from '../components/ListingCard'
import Topbar from '../components/Topbar'
import { sortListings } from './Explore'
import { useProfileCity } from '../auth'

export function Categories() {
  const { city } = useProfileCity()
  const [counts, setCounts] = useState({})
  useEffect(() => {
    supabase.from('sj_listings').select('category').eq('status', 'aktif').then(({ data }) => {
      const c = {}; (data || []).forEach((r) => { c[r.category] = (c[r.category] || 0) + 1 }); setCounts(c)
    })
  }, [])
  return (
    <>
      <Topbar title="Kategori Sisa" sub={<span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}><MapPin size={13} /> Lokasi: {city || 'Belum diatur'}</span>} />
      <div className="grid g3">
        {CATEGORIES.map((c, i) => (
          <Reveal key={c} delay={(i % 3) * 0.06}>
            <Link to={'/app/kategori/' + encodeURIComponent(c)} className="card" style={{ padding: 20, display: 'flex', gap: 14, alignItems: 'center' }}>
              <div className="lic" style={{ width: 56, height: 56, background: CAT[c].bg }}><CatIcon cat={c} size={28} /></div>
              <div><b>{c === 'Lainnya' ? 'Sisa Lainnya' : c === 'Ampas Kopi' ? 'Sisa Ampas Kopi' : 'Sisa ' + c}</b><div className="muted" style={{ fontSize: 13 }}>{counts[c] || 0} tersedia</div></div>
            </Link>
          </Reveal>
        ))}
      </div>
    </>
  )
}

export function CategoryItems() {
  const { name } = useParams()
  const cat = decodeURIComponent(name)
  const [sort, setSort] = useState('Terbaru')
  const [items, setItems] = useState(null)
  const { pos, ask } = useGeo()
  useEffect(() => {
    supabase.from('sj_listings').select('*').eq('status', 'aktif').eq('category', cat).order('created_at', { ascending: false })
      .then(({ data }) => setItems(data || []))
  }, [cat])
  useEffect(() => { if (sort === 'Terdekat' && !pos) ask() }, [sort, pos, ask])
  const rows = useMemo(() => sortListings(items, sort, pos), [items, sort, pos])
  return (
    <>
      <Topbar title={cat} sub="Daftar Sisa per Kategori" />
      <div className="rowflex">{['Terbaru', 'Terdekat', 'Termurah'].map((s) => <button key={s} className={'chip' + (sort === s ? ' on' : '')} onClick={() => setSort(s)}>{s}</button>)}</div>
      {rows === null ? <div className="spin" /> : rows.length === 0 ? <div className="card empty">Belum ada sisa di kategori ini.</div> :
        rows.map(({ l, km }) => <ListingRow key={l.id} l={l} km={km} to={'/app/sisa/' + l.id} />)}
    </>
  )
}
