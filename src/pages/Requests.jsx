import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase, timeAgo, rpc, toast } from '../supabase'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth'
import Topbar from '../components/Topbar'

export default function Requests() {
  const { user } = useAuth()
  const [tab, setTab] = useState('masuk')
  const [rows, setRows] = useState({ masuk: null, keluar: null, listing: null })
  const [msg, setMsg] = useState('')
  const [pk, setPk] = useState({})
  const nav = useNavigate()
  const chat = async (lid) => { try { nav('/app/chat/' + (await rpc('sj_open_thread', { p_listing: lid }))) } catch (e) { toast(e.message) } }

  const load = useCallback(async () => {
    const [a, b, c] = await Promise.all([
      supabase.from('sj_requests').select('*, sj_listings!inner(id,title,owner_id)').eq('sj_listings.owner_id', user.id).order('created_at', { ascending: false }),
      supabase.from('sj_requests').select('*, sj_listings(id,title)').eq('requester_id', user.id).order('created_at', { ascending: false }),
      supabase.from('sj_listings').select('*').eq('owner_id', user.id).order('created_at', { ascending: false }),
    ])
    supabase.from('sj_pickups').select('id,request_id,status').then(({ data }) => setPk(Object.fromEntries((data || []).map((p) => [p.request_id, p]))))
    setRows({ masuk: a.data || [], keluar: b.data || [], listing: c.data || [] })
  }, [user.id])
  useEffect(() => { load() }, [load])

  const respond = async (id, acc) => {
    const { error } = await supabase.rpc('sj_respond_request', { p_id: id, p_accept: acc })
    setMsg(error ? error.message : acc ? 'Diterima. +20 Eco Point.' : 'Ditolak.'); load()
  }
  const list = rows[tab]
  return (
    <>
      <Topbar title="Permintaan" sub="Request masuk, request kamu, dan sisa yang kamu unggah" back={false} />
      <div className="tabs" style={{ maxWidth: 480 }}>
        {[['masuk', 'Masuk'], ['keluar', 'Saya ajukan'], ['listing', 'Sisa saya']].map(([k, t]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{t}</button>)}
      </div>
      {msg && <div className="ok">{msg}</div>}
      {list === null ? <div className="spin" /> : list.length === 0 ? <div className="card empty">Belum ada data.</div> :
        list.map((r) => tab === 'listing' ? (
          <Link key={r.id} to={'/app/sisa/' + r.id} className="card list-item"><div><b>{r.title}</b><div className="muted" style={{ fontSize: 13 }}>{r.mode} · {r.quantity} {r.unit} · {timeAgo(r.created_at)}</div></div><span className="tag">{r.status}</span></Link>
        ) : (
          <div key={r.id} className="card list-item">
            <div style={{ minWidth: 0 }}>
              <Link to={'/app/sisa/' + r.sj_listings?.id}><b>{r.sj_listings?.title}</b></Link>
              <div style={{ fontSize: 14 }}>{r.message || '(tanpa pesan)'}</div>
              <div className="muted" style={{ fontSize: 12 }}>{timeAgo(r.created_at)}</div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span className="tag">{r.status}</span>
              {r.status === 'diterima' && r.method === 'Kurir' && (pk[r.id] ? <Link className="btn sm sec" to={'/app/pickup/' + pk[r.id].id}>Detail Pickup</Link> : <Link className="btn sm sec" to={'/app/pickup/jadwal/' + r.id}>Jadwalkan Pickup</Link>)}
              <button className="btn sm sec" onClick={() => chat(r.sj_listings?.id)}>Chat</button>
              {tab === 'masuk' && r.status === 'menunggu' && <><button className="btn sm" onClick={() => respond(r.id, true)}>Terima</button><button className="btn sm danger" onClick={() => respond(r.id, false)}>Tolak</button></>}
            </div>
          </div>))}
    </>
  )
}
