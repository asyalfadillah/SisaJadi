import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CreditCard, Wallet, QrCode, Landmark, Smartphone, CheckCircle2, Truck } from 'lucide-react'
import { supabase, rpc, toast, rupiah, fmtDate, dist, num } from '../supabase'
import { useGeo } from '../geo'
import { useAuth } from '../auth'
import Topbar from '../components/Topbar'
import { Spinner, Empty, SuccessCard, Seg } from '../components/ui'

const METHODS = [['QRIS', QrCode], ['Virtual Account', Landmark], ['E-Wallet', Smartphone], ['Transfer Bank', CreditCard]]
const Row = ({ a, b, bold }) => <div className="kv"><span className={bold ? '' : 'muted'}>{a}</span><b style={bold ? { fontSize: 18, color: 'var(--green)' } : null}>{b}</b></div>

export function Checkout() {
  const { requestId } = useParams()
  const nav = useNavigate()
  const { pos, ask, err } = useGeo(true)
  const [req, setReq] = useState(null)
  const [q, setQ] = useState(null)
  const [method, setMethod] = useState('QRIS')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    supabase.from('sj_requests').select('*, sj_listings(title,lat,lng,owner_name)').eq('id', requestId).maybeSingle().then(({ data }) => setReq(data || false))
  }, [requestId])
  useEffect(() => { if (req) rpc('sj_quote', { p_request: Number(requestId), p_lat: pos?.lat ?? null, p_lng: pos?.lng ?? null }).then(setQ).catch((e) => toast(e.message)) }, [req, pos, requestId])

  if (req === null) return <Spinner />
  if (!req || req.status !== 'diterima') return <Empty title="Belum bisa dibayar" text="Pembayaran tersedia setelah penyedia menerima request."><Link className="btn sm" to="/app/permintaan">Kembali</Link></Empty>
  const pay = async () => {
    setBusy(true)
    try { const id = await rpc('sj_pay', { p_request: Number(requestId), p_method: method, p_lat: pos?.lat ?? null, p_lng: pos?.lng ?? null }); nav('/app/pembayaran/' + id, { replace: true, state: { fresh: true } }) }
    catch (e) { toast(e.message); setBusy(false) }
  }
  const kurir = req.method === 'Kurir'
  return (
    <>
      <Topbar title="Pembayaran" sub={req.sj_listings?.title} />
      <div className="grid g2" style={{ alignItems: 'start' }}>
        <div className="card" style={{ padding: 22 }}>
          <b>Rincian biaya</b>
          {q ? <>
            <Row a={`Harga sisa (${req.qty ?? ''})`} b={rupiah(q.item_total)} />
            {kurir && <Row a={`Ongkir ${q.courier || ''} (~${q.distance_km} km)`} b={rupiah(q.courier_fee)} />}
            {kurir && q.eta && <Row a="Estimasi tiba" b={q.eta} />}
            {!kurir && <Row a="Pengambilan" b="Ambil sendiri · Gratis" />}
            <Row a="Total bayar" b={rupiah(q.total)} bold />
            <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>Fee layanan {q.fee_pct}% dipotong dari penyedia, bukan dari kamu.</div>
          </> : <Spinner />}
          {kurir && q?.estimated && <div className="err" style={{ marginTop: 12 }}>Lokasimu belum diketahui, jarak diperkirakan 10 km. {err || ''} <button type="button" className="btn sm sec" style={{ marginTop: 8 }} onClick={ask}>Aktifkan lokasi</button></div>}
          {kurir && q && !q.estimated && <div className="muted" style={{ fontSize: 12, marginTop: 8 }}>Jarak dihitung server dari lokasi penjual ke lokasimu.</div>}
        </div>
        <div className="card" style={{ padding: 22 }}>
          <b>Metode pembayaran</b>
          <div style={{ display: 'grid', gap: 10, margin: '12px 0 16px' }}>
            {METHODS.map(([m, I]) => <button key={m} type="button" className={'sel-chip' + (method === m ? ' on' : '')} style={{ display: 'flex', gap: 10, alignItems: 'center', height: 52, textAlign: 'left' }} onClick={() => setMethod(m)}><I size={20} />{m}</button>)}
          </div>
          <button className="btn block" disabled={busy || !q} onClick={pay}>{busy ? 'Memproses…' : 'Bayar ' + (q ? rupiah(q.total) : '')}</button>
          <p className="muted" style={{ fontSize: 12, marginTop: 10 }}>Mode simulasi: tidak ada uang sungguhan yang dipindahkan. Dana ditahan platform sampai pesanan selesai.</p>
        </div>
      </div>
    </>
  )
}

export function usePayments() {
  const [rows, setRows] = useState(null)
  const load = () => supabase.from('sj_payments').select('*, sj_requests(listing_id, method, sj_listings(title))').order('paid_at', { ascending: false }).then(({ data }) => setRows(data || []))
  useEffect(() => { load() }, [])
  return [rows, load]
}
const ST = { dibayar: ['Dana ditahan', '#F7E7A6', '#8A6400'], dicairkan: ['Selesai', '#E3F1E6', '#2E7D4F'], dibatalkan: ['Dibatalkan', '#FBE3D6', '#B5532A'] }
const Status = ({ s }) => <span className="tag" style={{ background: ST[s][1], color: ST[s][2] }}>{ST[s][0]}</span>

export function DaftarPembayaran() {
  const [rows] = usePayments()
  const { user } = useAuth()
  const mine = (rows || []).filter((p) => p.payer_id === user?.id)
  return (
    <>
      <Topbar title="Pembayaran Saya" sub="Riwayat pembayaran sebagai pembeli" back={false} />
      {rows === null ? <Spinner /> : mine.length === 0 ? <Empty icon={Wallet} title="Belum ada pembayaran" text="Bayar request yang sudah diterima dari menu Permintaan."><Link className="btn sm" to="/app/permintaan">Lihat Permintaan</Link></Empty> :
        mine.map((p) => <Link key={p.id} to={'/app/pembayaran/' + p.id} className="card list-item"><div><b>{p.sj_requests?.sj_listings?.title}</b><div className="muted" style={{ fontSize: 13 }}>{p.code} · {fmtDate(p.paid_at)}</div></div><div style={{ textAlign: 'right' }}><b>{rupiah(p.total)}</b><div><Status s={p.status} /></div></div></Link>)}
    </>
  )
}

export function DetailPembayaran() {
  const { id } = useParams()
  const { user } = useAuth()
  const [p, setP] = useState(null)
  const [pk, setPk] = useState(null)
  const load = () => supabase.from('sj_payments').select('*, sj_requests(id, method, sj_listings(title))').eq('id', id).maybeSingle().then(async ({ data }) => {
    setP(data || false)
    if (data) { const { data: k } = await supabase.from('sj_pickups').select('id,status').eq('request_id', data.request_id).maybeSingle(); setPk(k) }
  })
  useEffect(() => { load() }, [id])
  if (p === null) return <Spinner />
  if (!p) return <Empty title="Pembayaran tidak ditemukan" />
  const buyer = p.payer_id === user.id
  const canRelease = buyer && p.status === 'dibayar' && (!pk || pk.status === 'selesai')
  const release = async () => { try { await rpc('sj_release_payment', { p_id: p.id }); toast('Terima kasih! Dana diteruskan ke penyedia.'); load() } catch (e) { toast(e.message) } }
  return (
    <>
      <Topbar title="Detail Pembayaran" sub={p.code} />
      <div className="card" style={{ padding: 22, maxWidth: 560 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}><CheckCircle2 color="#2E7D4F" /><b>{p.sj_requests?.sj_listings?.title}</b><Status s={p.status} /></div>
        <Row a="Metode" b={p.method} /><Row a="Tanggal" b={fmtDate(p.paid_at, { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })} />
        <Row a="Harga sisa" b={rupiah(p.item_total)} />
        {p.courier_fee > 0 && <Row a="Biaya kurir" b={rupiah(p.courier_fee)} />}
        {!buyer && <Row a={`Fee layanan`} b={'- ' + rupiah(p.platform_fee)} />}
        <Row a={buyer ? 'Total dibayar' : 'Diterima penyedia'} b={rupiah(buyer ? p.total : p.item_total - p.platform_fee)} bold />
        {buyer && p.sj_requests?.method === 'Kurir' && (pk && <Link className="btn sec block" style={{ marginTop: 14 }} to={'/app/pickup/' + pk.id}><Truck size={18} />Lacak Pengiriman</Link>)}
        {canRelease && <button className="btn block" style={{ marginTop: 14 }} onClick={release}>Pesanan Sudah Diterima</button>}
        {buyer && p.status === 'dibayar' && !canRelease && <p className="muted" style={{ fontSize: 13, marginTop: 12 }}>Tombol konfirmasi aktif setelah pickup selesai.</p>}
      </div>
    </>
  )
}

export function Dompet() {
  const [rows] = usePayments()
  const { user } = useAuth()
  const [tab, setTab] = useState('Semua')
  const mine = (rows || []).filter((p) => p.payee_id === user.id)
  const net = (p) => p.item_total - p.platform_fee
  const held = mine.filter((p) => p.status === 'dibayar').reduce((a, p) => a + net(p), 0)
  const avail = mine.filter((p) => p.status === 'dicairkan').reduce((a, p) => a + net(p), 0)
  const list = mine.filter((p) => tab === 'Semua' || (tab === 'Ditahan' ? p.status === 'dibayar' : p.status === 'dicairkan'))
  return (
    <>
      <Topbar title="Dompet Penyedia" sub="Pendapatan dari penjualan sisa" back={false} />
      <div className="grid g2">
        <div className="dampak"><Wallet size={26} /><b>{rupiah(avail) === 'Gratis' ? 'Rp 0' : rupiah(avail)}</b><div style={{ opacity: .9 }}>Saldo tersedia</div></div>
        <div className="card stat"><b>{held ? rupiah(held) : 'Rp 0'}</b><span>Dana ditahan (menunggu pesanan selesai)</span></div>
      </div>
      <Seg value={tab} onChange={setTab} options={['Semua', 'Ditahan', 'Cair']} style={{ maxWidth: 420 }} />
      {rows === null ? <Spinner /> : list.length === 0 ? <Empty icon={Wallet} title="Belum ada pendapatan" /> : list.map((p) => (
        <Link key={p.id} to={'/app/pembayaran/' + p.id} className="card list-item"><div><b>{p.sj_requests?.sj_listings?.title}</b><div className="muted" style={{ fontSize: 13 }}>{p.code} · fee {rupiah(p.platform_fee)}</div></div><div style={{ textAlign: 'right' }}><b>{rupiah(net(p))}</b><div><Status s={p.status} /></div></div></Link>))}
      <p className="muted" style={{ fontSize: 12 }}>Total tercatat {num(mine.length)} transaksi. Pencairan ke rekening bank belum tersedia pada mode simulasi.</p>
    </>
  )
}
