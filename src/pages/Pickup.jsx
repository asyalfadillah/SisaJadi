import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom'
import { Truck, CheckCircle2 } from 'lucide-react'
import { supabase, rpc, toast, fmtDate } from '../supabase'
import Topbar from '../components/Topbar'
import { Spinner, SuccessCard } from '../components/ui'

const SLOTS = ['08.00 - 10.00', '10.00 - 12.00', '13.00 - 15.00', '15.00 - 17.00']
const nextDays = () => Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() + i + 1); return d })
const iso = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)

export function JadwalPickup() {
  const { requestId } = useParams()
  const nav = useNavigate()
  const [req, setReq] = useState(null)
  const [date, setDate] = useState(iso(nextDays()[0]))
  const [slot, setSlot] = useState(SLOTS[0])
  const [addr, setAddr] = useState('')
  useEffect(() => {
    supabase.from('sj_requests').select('*, sj_listings(title,address)').eq('id', requestId).maybeSingle().then(({ data }) => { setReq(data); setAddr(data?.address || data?.sj_listings?.address || '') })
  }, [requestId])
  if (!req) return <Spinner />
  return (
    <>
      <Topbar title="Jadwal Pickup" sub={req.sj_listings?.title} />
      <div className="card" style={{ padding: 22, maxWidth: 560 }}>
        <b>Pilih tanggal</b>
        <div className="rowflex" style={{ margin: '10px 0 18px' }}>
          {nextDays().map((d) => <button key={iso(d)} className={'sel-chip' + (date === iso(d) ? ' on' : '')} onClick={() => setDate(iso(d))}>{fmtDate(d, { weekday: 'short', day: 'numeric', month: 'short' })}</button>)}
        </div>
        <b>Pilih waktu</b>
        <div className="rowflex" style={{ flexWrap: 'wrap', margin: '10px 0 18px' }}>
          {SLOTS.map((s) => <button key={s} className={'sel-chip' + (slot === s ? ' on' : '')} onClick={() => setSlot(s)}>{s}</button>)}
        </div>
        <div className="field"><label>Alamat pickup</label><textarea className="input" rows={3} value={addr} onChange={(e) => setAddr(e.target.value)} /></div>
        <button className="btn block" disabled={!addr.trim()} onClick={() => nav('/app/pickup/konfirmasi/' + requestId, { state: { date, slot, addr } })}>Lanjut</button>
      </div>
    </>
  )
}

export function KonfirmasiPickup() {
  const { requestId } = useParams()
  const { state } = useLocation()
  const nav = useNavigate()
  const [busy, setBusy] = useState(false)
  if (!state) return <JadwalPickup />
  const go = async () => {
    setBusy(true)
    try {
      const id = await rpc('sj_schedule_pickup', { p_request: Number(requestId), p_date: state.date, p_slot: state.slot, p_address: state.addr })
      toast('Pickup dijadwalkan'); nav('/app/pickup/' + (id?.id ?? id), { replace: true })
    } catch (e) { toast(e.message); setBusy(false) }
  }
  return (
    <>
      <Topbar title="Konfirmasi Pickup" />
      <div className="card" style={{ padding: 22, maxWidth: 560 }}>
        <div className="kv"><span className="muted">Tanggal</span><b>{fmtDate(state.date, { weekday: 'long', day: 'numeric', month: 'long' })}</b></div>
        <div className="kv"><span className="muted">Waktu</span><b>{state.slot}</b></div>
        <div className="kv"><span className="muted">Alamat</span><b style={{ textAlign: 'right' }}>{state.addr}</b></div>
        <button className="btn block" style={{ marginTop: 18 }} disabled={busy} onClick={go}>{busy ? 'Memproses…' : 'Konfirmasi Pickup'}</button>
      </div>
    </>
  )
}

const STEPS = [['dijadwalkan', 'Pickup dijadwalkan'], ['ditugaskan', 'Kurir ditugaskan'], ['menuju', 'Kurir menuju lokasi'], ['selesai', 'Pickup selesai']]
export function DetailPickup() {
  const { id } = useParams()
  const nav = useNavigate()
  const [p, setP] = useState(null)
  useEffect(() => { supabase.from('sj_pickups').select('*, sj_requests(sj_listings(title))').eq('id', id).maybeSingle().then(({ data }) => setP(data || false)) }, [id])
  if (p === null) return <Spinner />
  if (p === false) return <SuccessCard icon={Truck} title="Pickup tidak ditemukan" text=""><Link className="btn" to="/app/permintaan">Kembali</Link></SuccessCard>
  const idx = STEPS.findIndex(([k]) => k === p.status)
  return (
    <>
      <Topbar title="Detail Pickup" sub={p.sj_requests?.sj_listings?.title} />
      <div className="grid g2">
        <div className="card" style={{ padding: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><b>Kode Pickup</b><span className="tag">{p.code}</span></div>
          <div className="kv"><span className="muted">Jadwal</span><b>{fmtDate(p.pickup_date, { weekday: 'short', day: 'numeric', month: 'short' })} · {p.slot}</b></div>
          <div className="kv"><span className="muted">Alamat</span><b style={{ textAlign: 'right' }}>{p.address}</b></div>
          <div className="kv"><span className="muted">Kurir</span><b>{p.courier_name || 'Belum ditugaskan'}</b></div>
          {p.courier_plate && <div className="kv"><span className="muted">Plat</span><b>{p.courier_plate}</b></div>}
          {p.status !== 'selesai' && <button className="btn sec block" style={{ marginTop: 14 }} onClick={() => nav('/app/pickup/jadwal/' + p.request_id)}>Ubah Jadwal</button>}
        </div>
        <div className="card" style={{ padding: 22 }}>
          <b style={{ display: 'block', marginBottom: 14 }}>Status Pickup</b>
          <div className="tl">{STEPS.map(([k, t], i) => <div key={k} className={i <= idx ? '' : 'off'}><b style={{ fontSize: 14 }}>{t}</b></div>)}</div>
        </div>
      </div>
    </>
  )
}
