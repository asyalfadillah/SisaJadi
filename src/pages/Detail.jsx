import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { Heart, MapPin, MessageCircle, Store } from 'lucide-react'
import { supabase, rupiah, timeAgo, rpc, toast, dist, fmtDist } from '../supabase'
import { useAuth } from '../auth'
import { useGeo } from '../geo'
import Topbar from '../components/Topbar'
import { Spinner } from '../components/ui'
import { Thumb } from '../components/ListingCard'

export default function Detail() {
  const { id } = useParams()
  const { user, isAdmin } = useAuth()
  const nav = useNavigate()
  const { pos } = useGeo()
  const [l, setL] = useState(undefined)
  const [fav, setFav] = useState(false)
  const [favSeller, setFavSeller] = useState(false)
  const [mine, setMine] = useState(null)

  const load = useCallback(async () => {
    const { data } = await supabase.from('sj_listings').select('*').eq('id', id).maybeSingle()
    setL(data || null)
    if (!data) return
    supabase.rpc('sj_view_listing', { p_id: data.id })
    const f = await supabase.from('sj_favorites').select('listing_id').eq('listing_id', id).maybeSingle()
    setFav(!!f.data)
    if (data.owner_id) {
      const fs = await supabase.from('sj_fav_sellers').select('seller_id').eq('seller_id', data.owner_id).maybeSingle()
      setFavSeller(!!fs.data)
    }
    const r = await supabase.from('sj_requests').select('*').eq('listing_id', id).eq('requester_id', user.id).order('created_at', { ascending: false })
    setMine((r.data || [])[0] || null)
  }, [id, user.id])
  useEffect(() => { load() }, [load])

  if (l === undefined) return <Spinner />
  if (l === null) return <><Topbar title="Tidak ditemukan" /><div className="empty">Sisa ini tidak tersedia.</div></>
  if (l.owner_id === user.id) return <Navigate to={'/app/listing/' + l.id} replace />

  const toggleFav = async () => {
    if (fav) await supabase.from('sj_favorites').delete().eq('listing_id', l.id)
    else await supabase.from('sj_favorites').insert({ listing_id: l.id })
    setFav(!fav)
  }
  const toggleSeller = async () => {
    if (favSeller) await supabase.from('sj_fav_sellers').delete().eq('seller_id', l.owner_id)
    else await supabase.from('sj_fav_sellers').insert({ seller_id: l.owner_id })
    setFavSeller(!favSeller); toast(favSeller ? 'Penjual dihapus dari favorit' : 'Penjual disimpan')
  }
  const chat = async () => {
    try { const tid = await rpc('sj_open_thread', { p_listing: l.id }); nav('/app/chat/' + tid) } catch (e) { toast(e.message) }
  }
  const setStatus = async (status) => { await supabase.from('sj_listings').update({ status }).eq('id', l.id); load() }
  const del = async () => { if (confirm('Hapus sisa ini?')) { await supabase.from('sj_listings').delete().eq('id', l.id); nav('/app/jelajahi') } }
  const km = dist(pos, l)

  return (
    <>
      <Topbar title="Detail Sisa" />
      <div className="grid g2" style={{ alignItems: 'start' }}>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ position: 'relative' }}>
            <Thumb l={l} size="full" radius={20} icon={72} />
            <button onClick={toggleFav} aria-label="Favorit" className="back" style={{ position: 'absolute', right: 12, top: 12 }}>
              <Heart size={20} color="#C0392B" fill={fav ? '#C0392B' : 'none'} /></button>
          </div>
          <div style={{ display: 'flex', gap: 6, margin: '16px 0 8px', flexWrap: 'wrap' }}>
            <span className={'tag ' + l.mode}>{l.mode.toUpperCase()}</span><span className="tag">{l.category}</span>
            {l.status !== 'aktif' && <span className="tag" style={{ background: '#eee', color: '#555' }}>{l.status}</span>}
          </div>
          <h2 style={{ fontSize: 24 }}>{l.title}</h2>
          <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--green)', margin: '8px 0' }}>{l.mode === 'Jual' ? rupiah(l.price) : l.mode}</div>
          <div className="kv"><span className="muted">Jumlah</span><b>{Number(l.quantity).toLocaleString('id-ID')} {l.unit}</b></div>
          <div className="kv"><span className="muted">Kondisi</span><b>{l.condition || '-'}</b></div>
          <div className="kv"><span className="muted">Jarak</span><b>{km != null ? fmtDist(km) : '-'}</b></div>
          <div className="kv"><span className="muted">Lokasi</span><b style={{ textAlign: 'right' }}>{l.address || l.city || '-'}</b></div>
          {l.mode === 'Barter' && l.need && <div className="kv"><span className="muted">Kebutuhan</span><b style={{ textAlign: 'right' }}>{l.need}</b></div>}
          <p className="muted" style={{ lineHeight: 1.7, fontSize: 14.5, marginTop: 10 }}><b style={{ color: 'var(--ink)' }}>Deskripsi:</b> {l.description || 'Tidak ada deskripsi.'}</p>
          <div className="muted" style={{ marginTop: 10, fontSize: 13, display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            <MapPin size={14} />{l.city || '-'} · {timeAgo(l.created_at)} · oleh <b style={{ color: 'var(--ink)' }}>{l.owner_name}</b>
          </div>
          {isAdmin && (
            <div style={{ display: 'flex', gap: 8, marginTop: 18, flexWrap: 'wrap' }}>
              {l.status === 'aktif' ? <button className="btn sm sec" onClick={() => setStatus('nonaktif')}>Nonaktifkan</button> : <button className="btn sm sec" onClick={() => setStatus('aktif')}>Aktifkan</button>}
              <button className="btn sm danger" onClick={del}>Hapus</button>
            </div>)}
        </div>

        <div className="card" style={{ padding: 22 }}>
          {mine ? (
            <>
              <h3>Request kamu</h3>
              <p className="muted" style={{ margin: '8px 0' }}>{mine.message || '(tanpa pesan)'}</p>
              <span className="tag">{mine.status}</span>
              <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Link to="/app/permintaan" className="btn sm sec">Lihat Permintaan</Link>
                <button className="btn sm" onClick={chat}><MessageCircle size={16} />Chat</button>
              </div>
            </>
          ) : l.status === 'aktif' ? (
            <>
              <h3 style={{ marginBottom: 12 }}>{l.mode === 'Barter' ? 'Tertarik barter?' : l.mode === 'Donasi' ? 'Butuh sisa ini?' : 'Tertarik membeli?'}</h3>
              <p className="muted" style={{ fontSize: 14, marginBottom: 18 }}>Ajukan request ke pemilik. Kamu bisa menegosiasikan detailnya lewat chat.</p>
              <Link to={'/app/sisa/' + l.id + '/request'} className="btn block">Ajukan Request</Link>
              <button className="btn sec block" style={{ marginTop: 12 }} onClick={chat}><MessageCircle size={18} />Chat Penjual</button>
            </>
          ) : <p className="muted">Sisa ini sudah tidak tersedia.</p>}
          {l.owner_id && <button className="btn sec sm" style={{ marginTop: 14 }} onClick={toggleSeller}><Store size={16} />{favSeller ? 'Penjual tersimpan' : 'Simpan penjual'}</button>}
        </div>
      </div>
    </>
  )
}
