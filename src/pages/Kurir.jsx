import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Truck, MapPin, Package } from 'lucide-react'
import { rpc, toast, fmtDate } from '../supabase'
import { useAuth } from '../auth'
import Topbar from '../components/Topbar'
import { Spinner, Empty, Seg } from '../components/ui'

export default function Kurir() {
  const { profile, loading } = useAuth()
  const [jobs, setJobs] = useState(null)
  const [tab, setTab] = useState('Aktif')
  const load = () => rpc('sj_courier_jobs').then(setJobs).catch((e) => { toast(e.message); setJobs([]) })
  useEffect(() => { if (profile?.role === 'kurir') load() }, [profile?.role])
  if (loading || !profile) return <Spinner />
  if (profile.role !== 'kurir') return <Navigate to="/app" replace />
  const step = async (j, s) => { try { await rpc('sj_courier_update', { p_id: j.id, p_status: s }); toast('Status diperbarui'); load() } catch (e) { toast(e.message) } }
  const rows = (jobs || []).filter((j) => (tab === 'Aktif') === (j.status !== 'selesai'))
  return (
    <>
      <Topbar title="Tugas Kurir" sub="Pickup yang ditugaskan kepadamu" back={false} />
      <Seg value={tab} onChange={setTab} options={['Aktif', 'Selesai']} style={{ maxWidth: 320 }} />
      {jobs === null ? <Spinner /> : rows.length === 0 ? <Empty icon={Truck} title="Tidak ada tugas" /> : rows.map((j) => (
        <div key={j.id} className="card" style={{ padding: 18, marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><b>{j.code}</b><span className="tag">{j.status}</span></div>
          <div style={{ margin: '8px 0', fontSize: 14 }}><Package size={14} /> {j.title} · {j.qty}</div>
          <div className="kv"><span className="muted">Jadwal</span><b>{fmtDate(j.pickup_date, { weekday: 'short', day: 'numeric', month: 'short' })} · {j.slot}</b></div>
          <div className="kv"><span className="muted">Ambil di</span><b style={{ textAlign: 'right' }}>{j.penjual}{j.asal ? ' · ' + j.asal : ''}</b></div>
          <div className="kv"><span className="muted">Antar ke</span><b style={{ textAlign: 'right' }}>{j.tujuan}</b></div>
          <a className="btn sm sec" style={{ marginTop: 8 }} target="_blank" rel="noreferrer" href={'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(j.tujuan)}><MapPin size={14} />Buka peta tujuan</a>
          {j.status === 'ditugaskan' && <button className="btn block" style={{ marginTop: 10 }} onClick={() => step(j, 'menuju')}>Mulai menuju lokasi</button>}
          {j.status === 'menuju' && <button className="btn block" style={{ marginTop: 10 }} onClick={() => step(j, 'selesai')}>Tandai selesai</button>}
        </div>))}
    </>
  )
}
