import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { CheckCircle2, MessageCircle } from 'lucide-react'
import { supabase, rupiah, rpc, toast, dist } from '../supabase'
import { useGeo } from '../geo'
import { useAuth } from '../auth'
import Topbar from '../components/Topbar'
import { Seg, Spinner, SuccessCard } from '../components/ui'
import { Thumb } from '../components/ListingCard'

function useListing(id) {
  const [l, setL] = useState(undefined)
  useEffect(() => { supabase.from('sj_listings').select('*').eq('id', id).maybeSingle().then(({ data }) => setL(data || null)) }, [id])
  return l
}

const totalOf = (l, qty, type) => (type === 'Jual' ? Math.round(qty * l.price) : 0)

export function RequestSisa() {
  const { id } = useParams()
  const nav = useNavigate()
  const { user } = useAuth()
  const l = useListing(id)
  const [qty, setQty] = useState(1)
  const [type, setType] = useState(null)
  const [note, setNote] = useState('')
  if (l === undefined) return <Spinner />
  if (!l) return <Navigate to="/app/jelajahi" replace />
  if (l.owner_id === user.id) return <Navigate to={'/app/listing/' + l.id} replace />
  const t = type || l.mode
  const step = l.unit === 'kg' ? 0.5 : 1
  const total = totalOf(l, qty, t)
  const go = (e) => {
    e.preventDefault()
    nav('/app/sisa/' + l.id + (t === 'Barter' ? '/barter' : '/konfirmasi'), { state: { qty, type: t, note } })
  }
  return (
    <>
      <Topbar title="Ajukan Request" sub={l.title} />
      <form className="card" style={{ padding: 24, maxWidth: 560 }} onSubmit={go}>
        <div className="field"><label>Jumlah ({l.unit})</label>
          <div className="stepper">
            <button type="button" onClick={() => setQty(Math.max(step, +(qty - step).toFixed(1)))} aria-label="Kurangi">−</button>
            <b>{qty} {l.unit}</b>
            <button type="button" onClick={() => setQty(Math.min(+l.quantity, +(qty + step).toFixed(1)))} aria-label="Tambah">+</button>
            <span className="muted" style={{ fontSize: 12 }}>maks {l.quantity} {l.unit}</span>
          </div></div>
        <div className="field"><label>Tipe transaksi</label><Seg value={t} onChange={setType} options={['Jual', 'Barter', 'Donasi']} style={{ margin: 0 }} /></div>
        <div className="field"><label>Catatan untuk penjual</label><textarea className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Catatan untuk penjual…" /></div>
        <div className="card" style={{ padding: 16, background: 'var(--mint)', boxShadow: 'none', marginBottom: 18 }}>
          <b>Detail Transaksi</b>
          <div className="muted" style={{ marginTop: 4 }}>{qty} {l.unit} - {t}{t === 'Jual' ? ' - ' + rupiah(total) : ''}</div>
        </div>
        <button className="btn block">{t === 'Barter' ? 'Lanjut ke Penawaran' : 'Kirim Request'}</button>
      </form>
    </>
  )
}

export function KonfirmasiRequest() {
  const { id } = useParams()
  const { state } = useLocation()
  const nav = useNavigate()
  const { user, profile } = useAuth()
  const l = useListing(id)
  const { pos, ask, err } = useGeo(false)
  const [method, setMethod] = useState('Ambil sendiri')
  const [address, setAddress] = useState(profile?.address || '')
  const [cfg, setCfg] = useState({ courier_base: 8000, courier_per_km: 2500, fee_pct: 5 })
  const [ok, setOk] = useState(false)
  const [busy, setBusy] = useState(false)
  useEffect(() => { supabase.from('sj_settings').select('*').then(({ data }) => data && setCfg(Object.fromEntries(data.map((x) => [x.key, Number(x.value)])))) }, [])
  if (!state) return <Navigate to={'/app/sisa/' + id + '/request'} replace />
  if (l === undefined) return <Spinner />
  if (!l) return <Navigate to="/app/jelajahi" replace />
  const total = totalOf(l, state.qty, state.type)
  const kurir = method === 'Kurir'
  const km = kurir && pos ? dist(pos, { lat: l.lat, lng: l.lng }) : null
  const kmUsed = Math.min(100, km == null ? 10 : km)
  const courier = kurir ? cfg.courier_base + cfg.courier_per_km * Math.ceil(kmUsed) : 0
  const fee = Math.round((total * cfg.fee_pct) / 100)
  const grand = total + courier
  const needAddr = kurir && !address.trim()
  const send = async () => {
    setBusy(true)
    const { data, error } = await supabase.from('sj_requests').insert({
      listing_id: l.id, requester_id: user.id, message: state.note || null, qty: state.qty, req_type: state.type,
      method, address: kurir ? address.trim() : (l.address || null), total, offer_item: state.offer_item || null, offer_qty: state.offer_qty || null,
      dest_lat: kurir && pos ? pos.lat : null, dest_lng: kurir && pos ? pos.lng : null,
    }).select('id').single()
    setBusy(false)
    if (error) return toast('Gagal mengirim: ' + error.message)
    nav('/app/request-berhasil/' + data.id, { replace: true })
  }
  const money = (n) => (n > 0 ? rupiah(n) : 'Rp 0')
  return (
    <>
      <Topbar title="Konfirmasi Request" />
      <div className="card" style={{ padding: 24, maxWidth: 560 }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 12 }}>
          <Thumb l={l} size={64} radius={14} icon={28} />
          <div><b>{l.title}</b><div className="muted" style={{ fontSize: 13 }}>{l.owner_name}</div></div>
        </div>
        <div className="kv"><span className="muted">Item</span><b>{state.qty} {l.unit} · {state.type}</b></div>
        {state.offer_item && <div className="kv"><span className="muted">Kamu tawarkan</span><b>{state.offer_item} ({state.offer_qty})</b></div>}
        <div className="field" style={{ marginTop: 14 }}><label>Metode Pengambilan</label>
          <Seg value={method} onChange={setMethod} options={['Ambil sendiri', 'Kurir']} style={{ margin: 0 }} /></div>
        <div className="kv"><span className="muted">Lokasi pengambilan (penjual)</span><b style={{ textAlign: 'right' }}>{l.address || l.city || 'Hubungi penjual'}</b></div>
        {kurir ? (
          <div className="field" style={{ marginTop: 10 }}><label>Alamat tujuan pengiriman</label>
            <textarea className="input" rows={2} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Alamat lengkap yang dituju kurir" />
            <button type="button" className="btn sm sec" style={{ marginTop: 8 }} onClick={ask}>{pos ? 'Perbarui lokasiku' : 'Gunakan lokasiku untuk hitung ongkir'}</button>
            {err && <div className="err" style={{ marginTop: 8 }}>{err}</div>}
          </div>
        ) : <div className="muted" style={{ fontSize: 13, margin: '8px 0' }}>Kamu mengambil sendiri ke lokasi penjual. Tidak ada ongkir.</div>}

        <div className="card" style={{ padding: 16, background: 'var(--mint)', boxShadow: 'none', margin: '14px 0' }}>
          <b>Rincian Biaya {kurir ? '(estimasi)' : ''}</b>
          <div className="kv" style={{ borderTop: 0 }}><span>Harga barang</span><b>{state.type === 'Jual' ? money(total) : state.type}</b></div>
          {kurir && <div className="kv"><span>Biaya kurir ({km == null ? '≈10 km, lokasi belum diketahui' : kmUsed.toFixed(1).replace('.', ',') + ' km'})</span><b>{money(courier)}</b></div>}
          <div className="kv"><span>Biaya layanan platform ({cfg.fee_pct}%)</span><b>{money(fee)}</b></div>
          <div className="muted" style={{ fontSize: 12 }}>Biaya layanan dipotong dari pendapatan penyedia, tidak menambah tagihanmu.</div>
          <div className="kv"><b>Total yang kamu bayar</b><b style={{ color: 'var(--green)', fontSize: 18 }}>{money(grand)}</b></div>
          <div className="muted" style={{ fontSize: 12 }}>Dibayar setelah penjual menerima request. Nilai final dihitung ulang server saat pembayaran.</div>
        </div>
        <label className="check" style={{ marginBottom: 18 }}><input type="checkbox" checked={ok} onChange={(e) => setOk(e.target.checked)} />Saya menyetujui ringkasan di atas</label>
        <button className="btn block" disabled={!ok || busy || needAddr} onClick={send}>{busy ? 'Mengirim…' : needAddr ? 'Isi alamat tujuan' : 'Konfirmasi'}</button>
      </div>
    </>
  )
}

export function PenawaranBarter() {
  const { id } = useParams()
  const { state } = useLocation()
  const nav = useNavigate()
  const l = useListing(id)
  const [f, setF] = useState({ item: '', qty: '', note: '' })
  if (!state) return <Navigate to={'/app/sisa/' + id + '/request'} replace />
  if (l === undefined) return <Spinner />
  if (!l) return <Navigate to="/app/jelajahi" replace />
  const send = (e) => {
    e.preventDefault()
    nav('/app/sisa/' + l.id + '/konfirmasi', { state: { ...state, type: 'Barter', offer_item: f.item, offer_qty: f.qty, note: [state.note, f.note].filter(Boolean).join(' | ') } })
  }
  return (
    <>
      <Topbar title="Penawaran Barter" sub="Status Barter: menunggu penawaranmu" />
      <form className="card" style={{ padding: 24, maxWidth: 560 }} onSubmit={send}>
        <div className="card" style={{ padding: 14, background: 'var(--mint)', boxShadow: 'none', marginBottom: 18 }}>
          <span className="muted" style={{ fontSize: 12, fontWeight: 600 }}>ITEM DIMINTA</span>
          <div><b>{l.title}</b> · {state.qty} {l.unit}</div>
          {l.need && <div className="muted" style={{ fontSize: 13 }}>Pemilik mencari: {l.need}</div>}
        </div>
        <h3 style={{ marginBottom: 12, fontSize: 16 }}>Yang kamu tawarkan</h3>
        <div className="field"><label>Nama sisa</label><input className="input" required value={f.item} onChange={(e) => setF({ ...f, item: e.target.value })} placeholder="Contoh: Kardus bekas" /></div>
        <div className="field"><label>Jumlah</label><input className="input" required value={f.qty} onChange={(e) => setF({ ...f, qty: e.target.value })} placeholder="Contoh: 3 lusin" /></div>
        <div className="field"><label>Catatan penawaran</label><textarea className="input" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} /></div>
        <button className="btn block">Kirim Penawaran</button>
        <button type="button" className="btn sec block" style={{ marginTop: 12 }} onClick={() => nav(-1)}>Batal</button>
      </form>
    </>
  )
}

export function RequestBerhasil() {
  const { id } = useParams()
  const nav = useNavigate()
  const [r, setR] = useState(undefined)
  useEffect(() => {
    supabase.from('sj_requests').select('*, sj_listings(*)').eq('id', id).maybeSingle().then(({ data }) => setR(data || null))
  }, [id])
  if (r === undefined) return <Spinner />
  if (!r) return <Navigate to="/app" replace />
  const l = r.sj_listings
  const chat = async () => { try { nav('/app/chat/' + (await rpc('sj_open_thread', { p_listing: l.id }))) } catch (e) { toast(e.message) } }
  return (
    <SuccessCard icon={CheckCircle2} title="Request Terkirim" text="Menunggu konfirmasi penjual">
      <div className="card" style={{ padding: 14, boxShadow: 'none', background: 'var(--mint)', marginBottom: 20, textAlign: 'left' }}>
        <b>{l.title}</b>
        <div className="muted" style={{ fontSize: 13 }}>{r.qty} {l.unit} {r.total ? rupiah(r.total) : ''} · <span className={'tag ' + r.req_type}>{(r.req_type || '').toUpperCase()}</span></div>
      </div>
      <button className="btn block" onClick={chat}><MessageCircle size={18} />Lihat Pesan</button>
      <Link to="/app" className="btn sec block" style={{ marginTop: 12 }}>Kembali ke Beranda</Link>
    </SuccessCard>
  )
}
