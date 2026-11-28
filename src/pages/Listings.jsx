import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { CheckCircle2, ImagePlus, Locate, Eye, Users, Heart } from 'lucide-react'
import { supabase, CATEGORIES, CONDITIONS, MODES, rupiah, rpc, toast, timeAgo, fmtDate, fmtTime } from '../supabase'
import { useAuth } from '../auth'
import { useGeo } from '../geo'
import Topbar from '../components/Topbar'
import { Seg, Spinner, SuccessCard } from '../components/ui'
import { Thumb } from '../components/ListingCard'

const EMPTY = { title: '', category: 'Organik', quantity: '', unit: 'kg', condition: 'Layak', description: '', image_url: '', mode: 'Jual', price: '', need: '', city: '', address: '', lat: null, lng: null }

export function Sell() {
  const { id } = useParams()
  const edit = !!id
  const { user, profile } = useAuth()
  const nav = useNavigate()
  const { ask } = useGeo()
  const [step, setStep] = useState(1)
  const [f, setF] = useState({ ...EMPTY, city: '', address: profile?.address || '' })
  const [loaded, setLoaded] = useState(!edit)
  const [busy, setBusy] = useState(false)
  const [up, setUp] = useState(false)
  const [err, setErr] = useState('')
  const file = useRef(null)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  useEffect(() => {
    if (!edit) return
    supabase.from('sj_listings').select('*').eq('id', id).maybeSingle().then(({ data }) => {
      if (data) setF({ ...EMPTY, ...Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v ?? EMPTY[k] ?? ''])) })
      setLoaded(true)
    })
  }, [edit, id])

  const upload = async (e) => {
    const fl = e.target.files?.[0]
    if (!fl) return
    if (fl.size > 5 * 1024 * 1024) return setErr('Ukuran foto maksimal 5 MB.')
    setUp(true); setErr('')
    const path = `${user.id}/${Date.now()}-${fl.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
    const { error } = await supabase.storage.from('listing-photos').upload(path, fl)
    setUp(false)
    if (error) return setErr('Gagal mengunggah foto: ' + error.message)
    setF((p) => ({ ...p, image_url: supabase.storage.from('listing-photos').getPublicUrl(path).data.publicUrl }))
  }
  const useLoc = async () => {
    const p = await ask()
    if (p) { setF((x) => ({ ...x, lat: p.lat, lng: p.lng })); toast('Lokasi saat ini dipakai') } else toast('Izin lokasi ditolak')
  }
  const next = (e) => { e.preventDefault(); setStep(2); window.scrollTo(0, 0) }
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr('')
    const row = {
      title: f.title.trim(), description: f.description.trim() || null, category: f.category, mode: f.mode,
      quantity: Number(f.quantity), unit: f.unit, price: f.mode === 'Jual' ? Number(f.price || 0) : 0,
      city: (f.city || f.address || '').split(',')[0].trim() || null, address: f.address.trim() || null, condition: f.condition,
      image_url: f.image_url || null, need: f.mode === 'Barter' ? f.need || null : null, lat: f.lat, lng: f.lng,
    }
    const q = edit ? supabase.from('sj_listings').update(row).eq('id', id) : supabase.from('sj_listings').insert({ ...row, owner_id: user.id })
    const { data, error } = await q.select('id').single()
    setBusy(false)
    if (error) return setErr('Gagal menyimpan: ' + error.message)
    nav(edit ? '/app/listing/' + data.id : '/app/listing-terbit/' + data.id)
  }
  if (!loaded) return <Spinner />
  return (
    <>
      <Topbar title={edit ? 'Edit Listing' : step === 1 ? 'Jual Sisa - Informasi' : 'Jual Sisa - Tipe & Lokasi'} sub={'Langkah ' + step + ' dari 2'} back={edit || step === 2} />
      {err && <div className="err" style={{ maxWidth: 640 }}>{err}</div>}
      {step === 1 ? (
        <form className="card" style={{ padding: 24, maxWidth: 640 }} onSubmit={next}>
          <div className="field"><label>Foto sisa</label>
            <div className="upload" onClick={() => file.current?.click()} role="button" tabIndex={0}>
              {f.image_url ? <img src={f.image_url} alt="Foto sisa" /> : up ? 'Mengunggah…' : <span style={{ textAlign: 'center' }}><ImagePlus size={30} style={{ margin: '0 auto 6px' }} />Tambah foto (maks 5 MB)</span>}
            </div>
            <input ref={file} type="file" accept="image/*" hidden onChange={upload} /></div>
          <div className="field"><label>Nama sisa</label><input className="input" required maxLength={80} value={f.title} onChange={set('title')} placeholder="Contoh: Sisa baut titanium" /></div>
          <div className="field"><label>Kategori</label><select className="input" value={f.category} onChange={set('category')}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></div>
          <div className="grid g2">
            <div className="field"><label>Jumlah</label><input className="input" required type="number" min="0.1" step="any" value={f.quantity} onChange={set('quantity')} /></div>
            <div className="field"><label>Satuan</label><select className="input" value={f.unit} onChange={set('unit')}>{['kg', 'pcs', 'liter', 'meter', 'karung', 'lusin'].map((c) => <option key={c}>{c}</option>)}</select></div>
          </div>
          <div className="field"><label>Kondisi</label><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {CONDITIONS.map((c) => <button type="button" key={c} className={'sel-chip' + (f.condition === c ? ' on' : '')} onClick={() => setF({ ...f, condition: c })}>{c}</button>)}</div></div>
          <div className="field"><label>Deskripsi</label><textarea className="input" value={f.description} onChange={set('description')} placeholder="Kondisi, ukuran, cara pengambilan…" /></div>
          <button className="btn block">Lanjut</button>
        </form>
      ) : (
        <form className="card" style={{ padding: 24, maxWidth: 640 }} onSubmit={submit}>
          <div className="field"><label>Tipe</label><Seg value={f.mode} onChange={(m) => setF({ ...f, mode: m })} options={MODES} style={{ margin: 0 }} /></div>
          {f.mode === 'Jual' && <div className="field"><label>Harga per {f.unit} (Rp)</label><input className="input" type="number" min="0" value={f.price} onChange={set('price')} /></div>}
          {f.mode === 'Barter' && <div className="field"><label>Kebutuhan (ingin ditukar dengan)</label><input className="input" value={f.need} onChange={set('need')} placeholder="Contoh: kardus bekas, kain perca" /></div>}
          <button type="button" className="btn sec block" style={{ marginBottom: 14 }} onClick={useLoc}><Locate size={18} />{f.lat ? 'Lokasi saat ini dipakai ✓' : 'Gunakan lokasi saat ini'}</button>
          <div className="field"><label>Alamat</label><input className="input" required value={f.address} onChange={set('address')} placeholder="Contoh: Kemang, Jakarta Selatan" /></div>
          <div style={{ display: 'flex', gap: 10 }}>
            {!edit && <button type="button" className="btn sec" onClick={() => setStep(1)}>Kembali</button>}
            <button className="btn" style={{ flex: 1 }} disabled={busy}>{busy ? 'Menyimpan…' : edit ? 'Simpan' : 'Terbitkan'}</button>
          </div>
          {edit && <button type="button" className="btn sec block" style={{ marginTop: 10 }} onClick={() => setStep(1)}>Ubah informasi sisa</button>}
        </form>
      )}
    </>
  )
}

export function ListingPublished() {
  const { id } = useParams()
  const [l, setL] = useState(undefined)
  useEffect(() => { supabase.from('sj_listings').select('*').eq('id', id).maybeSingle().then(({ data }) => setL(data || null)) }, [id])
  if (l === undefined) return <Spinner />
  if (!l) return <Navigate to="/app" replace />
  return (
    <SuccessCard icon={CheckCircle2} title="Listing Terbit" text="Listing anda sudah dapat ditemukan">
      <div className="card" style={{ padding: 14, boxShadow: 'none', background: 'var(--mint)', marginBottom: 20, textAlign: 'left' }}>
        <b>{l.title}</b>
        <div className="muted" style={{ fontSize: 13 }}>{l.quantity} {l.unit} {l.mode === 'Jual' ? rupiah(l.price) : ''} · <span className={'tag ' + l.mode}>{l.mode.toUpperCase()}</span></div>
      </div>
      <Link to={'/app/listing/' + l.id} className="btn block">Lihat Listing</Link>
      <Link to="/app" className="btn sec block" style={{ marginTop: 12 }}>Kembali ke Beranda</Link>
    </SuccessCard>
  )
}

export function ListingView() {
  const { id } = useParams()
  const { user, isAdmin } = useAuth()
  const nav = useNavigate()
  const [l, setL] = useState(undefined)
  const [st, setSt] = useState({ views: 0, requests: 0, favorites: 0 })
  const [reqs, setReqs] = useState(null)
  const [show, setShow] = useState(false)
  const load = async () => {
    const { data } = await supabase.from('sj_listings').select('*').eq('id', id).maybeSingle()
    setL(data || null)
    if (data && (data.owner_id === user.id || isAdmin)) {
      try { setSt(await rpc('sj_listing_stats', { p_id: data.id })) } catch {}
      const r = await supabase.from('sj_requests').select('*').eq('listing_id', id).order('created_at', { ascending: false })
      setReqs(r.data || [])
    }
  }
  useEffect(() => { load() }, [id])
  if (l === undefined) return <Spinner />
  if (!l) return <Navigate to="/app" replace />
  if (l.owner_id !== user.id && !isAdmin) return <Navigate to={'/app/sisa/' + l.id} replace />
  const respond = async (rid, acc) => { try { await rpc('sj_respond_request', { p_id: rid, p_accept: acc }); toast(acc ? 'Diterima. +20 Eco Point' : 'Ditolak'); load() } catch (e) { toast(e.message) } }
  const setStatus = async (status) => { await supabase.from('sj_listings').update({ status }).eq('id', l.id); load() }
  const del = async () => { if (confirm('Hapus listing ini?')) { await supabase.from('sj_listings').delete().eq('id', l.id); nav('/app/permintaan') } }
  return (
    <>
      <Topbar title="Lihat Listing" sub="Listing kamu" />
      <div className="grid g2" style={{ alignItems: 'start' }}>
        <div className="card" style={{ padding: 20 }}>
          <Thumb l={l} size="full" radius={20} icon={64} />
          <div style={{ display: 'flex', gap: 6, margin: '14px 0 6px', flexWrap: 'wrap' }}>
            <span className="tag" style={l.status === 'aktif' ? {} : { background: '#eee', color: '#555' }}>{l.status === 'aktif' ? 'Aktif' : l.status}</span>
            <span className={'tag ' + l.mode}>{l.mode.toUpperCase()}</span>
          </div>
          <h2 style={{ fontSize: 22 }}>{l.title} - {l.quantity} {l.unit}</h2>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--green)' }}>{l.mode === 'Jual' ? rupiah(l.price) : l.mode}</div>
          <div className="grid g3" style={{ marginTop: 16, gap: 10 }}>
            {[[Eye, st.views, 'Dilihat'], [Users, st.requests, 'Peminat'], [Heart, st.favorites, 'Favorit']].map(([I, n, t]) => (
              <div key={t} className="card" style={{ padding: 12, textAlign: 'center', boxShadow: 'none', background: 'var(--mint)' }}><I size={18} color="#2E7D4F" /><b style={{ display: 'block', fontSize: 20 }}>{n}</b><span className="muted" style={{ fontSize: 12 }}>{t}</span></div>))}
          </div>
          <div style={{ marginTop: 14 }}>
            <div className="kv"><span className="muted">Kategori</span><b>{l.category}</b></div>
            <div className="kv"><span className="muted">Berat / jumlah</span><b>{l.quantity} {l.unit}</b></div>
            <div className="kv"><span className="muted">Lokasi</span><b style={{ textAlign: 'right' }}>{l.address || l.city || '-'}</b></div>
            <div className="kv"><span className="muted">Tayang</span><b>{fmtDate(l.created_at)} · {fmtTime(l.created_at)}</b></div>
          </div>
        </div>
        <div>
          <button className="btn block" onClick={() => setShow(!show)}>Lihat Peminat ({st.requests})</button>
          <Link to={'/app/listing/' + l.id + '/edit'} className="btn sec block" style={{ marginTop: 12 }}>Edit Listing</Link>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            {l.status === 'aktif' ? <button className="btn sm sec" onClick={() => setStatus('nonaktif')}>Nonaktifkan</button> : <button className="btn sm sec" onClick={() => setStatus('aktif')}>Aktifkan</button>}
            <button className="btn sm danger" onClick={del}>Hapus</button>
          </div>
          {show && (
            <div className="card" style={{ padding: 20, marginTop: 16 }}>
              <h3 style={{ marginBottom: 8 }}>Peminat</h3>
              {reqs === null ? <Spinner /> : reqs.length === 0 ? <div className="muted">Belum ada peminat.</div> : reqs.map((r) => (
                <div key={r.id} style={{ padding: '12px 0', borderTop: '1px solid var(--line)' }}>
                  <div style={{ fontSize: 14 }}>{r.message || '(tanpa pesan)'}{r.qty ? ` · ${r.qty} ${l.unit}` : ''} {r.req_type && <span className={'tag ' + r.req_type}>{r.req_type}</span>}</div>
                  {r.offer_item && <div className="muted" style={{ fontSize: 13 }}>Menawarkan: {r.offer_item} ({r.offer_qty})</div>}
                  <div className="muted" style={{ fontSize: 12, margin: '4px 0 8px' }}>{timeAgo(r.created_at)} · {r.method || '-'} · <span className="tag">{r.status}</span></div>
                  {r.status === 'menunggu' && <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn sm" onClick={() => respond(r.id, true)}>Terima</button>
                    <button className="btn sm danger" onClick={() => respond(r.id, false)}>Tolak</button></div>}
                </div>))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
