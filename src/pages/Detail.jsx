import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Heart, MapPin, Send } from 'lucide-react'
import { supabase, rupiah, timeAgo } from '../supabase'
import { useAuth } from '../auth'
import Topbar from '../components/Topbar'
import { CAT, CatIcon, Spinner } from '../components/ui'

export default function Detail() {
  const { id } = useParams()
  const { user, isAdmin } = useAuth()
  const nav = useNavigate()
  const [l, setL] = useState(undefined)
  const [fav, setFav] = useState(false)
  const [reqs, setReqs] = useState([])
  const [mine, setMine] = useState(null)
  const [form, setForm] = useState({ message: '', qty: '' })
  const [msg, setMsg] = useState({ t: '', ok: true })
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    const { data } = await supabase.from('sj_listings').select('*').eq('id', id).maybeSingle()
    setL(data || null)
    if (!data) return
    const f = await supabase.from('sj_favorites').select('listing_id').eq('listing_id', id).maybeSingle()
    setFav(!!f.data)
    const r = await supabase.from('sj_requests').select('*').eq('listing_id', id).order('created_at', { ascending: false })
    setReqs(r.data || [])
    setMine((r.data || []).find((x) => x.requester_id === user.id) || null)
  }, [id, user.id])
  useEffect(() => { load() }, [load])

  if (l === undefined) return <Spinner />
  if (l === null) return <><Topbar title="Tidak ditemukan" /><div className="empty">Sisa ini tidak tersedia.</div></>
  const owner = l.owner_id === user.id
  const c = CAT[l.category] || CAT.Lainnya

  const toggleFav = async () => {
    if (fav) await supabase.from('sj_favorites').delete().eq('listing_id', l.id)
    else await supabase.from('sj_favorites').insert({ listing_id: l.id })
    setFav(!fav)
  }
  const send = async (e) => {
    e.preventDefault(); setBusy(true); setMsg({ t: '' })
    const { error } = await supabase.from('sj_requests').insert({ listing_id: l.id, message: form.message || null, qty: form.qty ? Number(form.qty) : null })
    setBusy(false)
    if (error) return setMsg({ t: 'Gagal mengirim request: ' + error.message, ok: false })
    setMsg({ t: 'Request terkirim. Pemilik akan menjawabnya.', ok: true }); setForm({ message: '', qty: '' }); load()
  }
  const respond = async (rid, acc) => {
    const { error } = await supabase.rpc('sj_respond_request', { p_id: rid, p_accept: acc })
    if (error) setMsg({ t: error.message, ok: false }); else { setMsg({ t: acc ? 'Request diterima. +20 Eco Point untuk kalian berdua.' : 'Request ditolak.', ok: true }); load() }
  }
  const setStatus = async (status) => { await supabase.from('sj_listings').update({ status }).eq('id', l.id); load() }
  const del = async () => { if (confirm('Hapus sisa ini?')) { await supabase.from('sj_listings').delete().eq('id', l.id); nav('/app/jelajahi') } }

  return (
    <>
      <Topbar title="Detail Sisa" />
      <div className="grid g2" style={{ alignItems: 'start' }}>
        <div className="card" style={{ padding: 20 }}>
          <div className="lic" style={{ background: c.bg, height: 220, position: 'relative' }}>
            <CatIcon cat={l.category} size={72} />
            <button onClick={toggleFav} aria-label="Favorit" className="back" style={{ position: 'absolute', right: 12, top: 12 }}>
              <Heart size={20} color="#C0392B" fill={fav ? '#C0392B' : 'none'} /></button>
          </div>
          <div style={{ display: 'flex', gap: 6, margin: '16px 0 8px', flexWrap: 'wrap' }}>
            <span className={'tag ' + l.mode}>{l.mode}</span><span className="tag">{l.category}</span>
            {l.status !== 'aktif' && <span className="tag" style={{ background: '#eee', color: '#555' }}>{l.status}</span>}
          </div>
          <h2 style={{ fontSize: 24 }}>{l.title}</h2>
          <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--green)', margin: '8px 0' }}>{l.mode === 'Jual' ? rupiah(l.price) : l.mode}</div>
          <p className="muted" style={{ lineHeight: 1.7, fontSize: 14.5 }}>{l.description || 'Tidak ada deskripsi.'}</p>
          <div style={{ display: 'flex', gap: 18, marginTop: 14, flexWrap: 'wrap', fontSize: 14 }}>
            <span><b>{Number(l.quantity).toLocaleString('id-ID')} {l.unit}</b> tersedia</span>
            <span className="muted" style={{ display: 'flex', gap: 4, alignItems: 'center' }}><MapPin size={14} />{l.city || '-'}</span>
            <span className="muted">{timeAgo(l.created_at)}</span>
          </div>
          <div className="muted" style={{ marginTop: 10, fontSize: 13 }}>Oleh <b style={{ color: 'var(--ink)' }}>{l.owner_name}</b></div>
          {(owner || isAdmin) && (
            <div style={{ display: 'flex', gap: 8, marginTop: 18, flexWrap: 'wrap' }}>
              {l.status === 'aktif' ? <button className="btn sm sec" onClick={() => setStatus('nonaktif')}>Nonaktifkan</button> : <button className="btn sm sec" onClick={() => setStatus('aktif')}>Aktifkan</button>}
              <button className="btn sm danger" onClick={del}>Hapus</button>
            </div>)}
        </div>

        <div>
          {msg.t && <div className={msg.ok ? 'ok' : 'err'} role="status">{msg.t}</div>}
          {!owner && l.status === 'aktif' && !mine && (
            <form className="card" style={{ padding: 22 }} onSubmit={send}>
              <h3 style={{ marginBottom: 14 }}>Ajukan Request</h3>
              <div className="field"><label>Jumlah dibutuhkan ({l.unit})</label><input className="input" type="number" min="0" step="any" value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} /></div>
              <div className="field"><label>Pesan untuk pemilik</label><textarea className="input" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Contoh: untuk bahan kompos, bisa diambil hari Sabtu" /></div>
              <button className="btn block" disabled={busy}><Send size={18} />{busy ? 'Mengirim…' : l.mode === 'Barter' ? 'Tawarkan Barter' : 'Kirim Request'}</button>
            </form>)}
          {mine && <div className="card" style={{ padding: 22 }}><h3>Request kamu</h3><p className="muted" style={{ margin: '8px 0' }}>{mine.message || '(tanpa pesan)'}</p><span className="tag">{mine.status}</span></div>}
          {owner && (
            <div className="card" style={{ padding: 22 }}>
              <h3 style={{ marginBottom: 12 }}>Request masuk ({reqs.length})</h3>
              {reqs.length === 0 && <div className="muted">Belum ada request.</div>}
              {reqs.map((r) => (
                <div key={r.id} style={{ padding: '12px 0', borderTop: '1px solid var(--line)' }}>
                  <div style={{ fontSize: 14 }}>{r.message || '(tanpa pesan)'}{r.qty ? ` · ${r.qty} ${l.unit}` : ''}</div>
                  <div className="muted" style={{ fontSize: 12, margin: '4px 0 8px' }}>{timeAgo(r.created_at)} · <span className="tag">{r.status}</span></div>
                  {r.status === 'menunggu' && <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn sm" onClick={() => respond(r.id, true)}>Terima</button>
                    <button className="btn sm danger" onClick={() => respond(r.id, false)}>Tolak</button></div>}
                </div>))}
            </div>)}
        </div>
      </div>
    </>
  )
}
