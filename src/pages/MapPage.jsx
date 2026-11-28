import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Search, Locate } from 'lucide-react'
import { dist, fmtDist, rupiah } from '../supabase'
import { useGeo } from '../geo'
import { useListings } from './Explore'
import Topbar from '../components/Topbar'
import { Thumb } from '../components/ListingCard'

export default function MapPage() {
  const [sp] = useSearchParams()
  const [q, setQ] = useState(sp.get('q') || '')
  const [qq, setQq] = useState(sp.get('q') || '')
  const [filter, setFilter] = useState('Semua')
  const [sel, setSel] = useState(null)
  const { pos, ask, err } = useGeo(true)
  const items = useListings({ q: qq, cat: filter === 'Organik' ? 'Organik' : '' })
  const el = useRef(null), map = useRef(null), layer = useRef(null), me = useRef(null)

  const shown = useMemo(() => (items || []).filter((l) => l.lat != null && l.lng != null).filter((l) => {
    const km = dist(pos, l)
    if (filter === '< 1 km') return km != null && km < 1
    if (filter === '< 5 km') return km != null && km < 5
    return true
  }), [items, filter, pos])

  useEffect(() => {
    map.current = L.map(el.current, { zoomControl: false }).setView([-6.2615, 106.8106], 12)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap', maxZoom: 19 }).addTo(map.current)
    L.control.zoom({ position: 'bottomright' }).addTo(map.current)
    layer.current = L.layerGroup().addTo(map.current)
    return () => map.current.remove()
  }, [])

  useEffect(() => {
    if (!map.current) return
    layer.current.clearLayers()
    shown.forEach((l) => {
      const m = L.marker([l.lat, l.lng], { icon: L.divIcon({ className: '', html: '<div class="pin"></div>', iconSize: [30, 30], iconAnchor: [15, 30] }) })
      m.on('click', () => setSel(l)); m.addTo(layer.current)
    })
  }, [shown])

  useEffect(() => {
    if (!map.current || !pos) return
    if (me.current) me.current.remove()
    me.current = L.marker([pos.lat, pos.lng], { icon: L.divIcon({ className: '', html: '<div class="me-dot"></div>', iconSize: [18, 18], iconAnchor: [9, 9] }) }).addTo(map.current)
    map.current.setView([pos.lat, pos.lng], 13)
  }, [pos])

  return (
    <>
      <Topbar title="Peta Terdekat" sub="Sisa di sekitarmu" />
      <form className="search" onSubmit={(e) => { e.preventDefault(); setQq(q) }}>
        <Search size={20} color="#2E7D4F" /><input placeholder="Cari lokasi atau sisa…" value={q} onChange={(e) => setQ(e.target.value)} />
        <button type="button" onClick={ask} aria-label="Lokasiku" style={{ background: 'none', border: 0, cursor: 'pointer' }}><Locate size={20} color="#2E7D4F" /></button>
      </form>
      <div className="rowflex" style={{ margin: '10px 0' }}>
        {['Semua', '< 1 km', '< 5 km', 'Organik'].map((f) => <button key={f} className={'chip' + (filter === f ? ' on' : '')} onClick={() => setFilter(f)}>{f}</button>)}
      </div>
      {err && <div className="err">{err} Peta tetap bisa dipakai tanpa lokasi.</div>}
      <div className="map" ref={el} />
      {sel && (
        <Link to={'/app/sisa/' + sel.id} className="card list-item" style={{ marginTop: 14, flexWrap: 'nowrap' }}>
          <Thumb l={sel} size={64} radius={14} icon={28} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <b>{sel.title}</b>
            <div className="muted" style={{ fontSize: 13 }}>{sel.quantity} {sel.unit} · {sel.mode === 'Jual' ? rupiah(sel.price) : sel.mode}{pos ? ' · ' + fmtDist(dist(pos, sel)) : ''}</div>
          </div>
          <span className="btn sm" style={{ pointerEvents: 'none' }}>Lihat</span>
        </Link>
      )}
    </>
  )
}
