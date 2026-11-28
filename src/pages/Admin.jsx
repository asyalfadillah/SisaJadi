import { useCallback, useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase, timeAgo, rupiah } from '../supabase'
import { useAuth } from '../auth'
import Topbar from '../components/Topbar'

export default function Admin() {
  const { isAdmin, user, loading, profile } = useAuth()
  const [tab, setTab] = useState('akun')
  const [d, setD] = useState({ users: [], listings: [], requests: [], rewards: [] })
  const [sel, setSel] = useState(null)
  const [detail, setDetail] = useState(null)
  const [msg, setMsg] = useState('')
  const [ex, setEx] = useState({ pickups: [], support: [] })
  const [bc, setBc] = useState({ title: '', body: '' })
  const [rw, setRw] = useState({ title: '', description: '', cost: '' })

  const load = useCallback(async () => {
    const [u, l, r, w] = await Promise.all([
      supabase.from('sj_profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('sj_listings').select('*').order('created_at', { ascending: false }),
      supabase.from('sj_requests').select('*, sj_listings(title)').order('created_at', { ascending: false }),
      supabase.from('sj_rewards').select('*').order('cost'),
    ])
    const [pk, sp] = await Promise.all([supabase.from('sj_pickups').select('*').order('created_at', { ascending: false }), supabase.from('sj_support_messages').select('*').order('created_at', { ascending: false })])
    setEx({ pickups: pk.data || [], support: sp.data || [] })
    setD({ users: u.data || [], listings: l.data || [], requests: r.data || [], rewards: w.data || [] })
  }, [])
  useEffect(() => { if (isAdmin) load() }, [isAdmin, load])
  useEffect(() => {
    if (!sel) return setDetail(null)
    Promise.all([
      supabase.from('sj_listings').select('*').eq('owner_id', sel.id).order('created_at', { ascending: false }),
      supabase.from('sj_requests').select('*, sj_listings(title)').eq('requester_id', sel.id).order('created_at', { ascending: false }),
      supabase.from('sj_points_log').select('*').eq('user_id', sel.id).order('created_at', { ascending: false }).limit(10),
      supabase.from('sj_redemptions').select('*, sj_rewards(title)').eq('user_id', sel.id).order('created_at', { ascending: false }),
    ]).then(([a, b, c, e]) => setDetail({ listings: a.data || [], requests: b.data || [], log: c.data || [], red: e.data || [] }))
  }, [sel])

  if (loading) return null
  if (!isAdmin) return <Navigate to="/app" replace />
  const flash = (t) => { setMsg(t); setTimeout(() => setMsg(''), 3000) }
  const setRole = async (u, role) => {
    const { error } = await supabase.rpc('sj_admin_set_role', { p_user: u.id, p_role: role }); flash(error ? error.message : 'Role diubah'); load()
  }
  const lst = async (id, status) => { await supabase.from('sj_listings').update({ status }).eq('id', id); load() }
  const delL = async (id) => { if (confirm('Hapus listing ini?')) { await supabase.from('sj_listings').delete().eq('id', id); load() } }
  const addRw = async (e) => {
    e.preventDefault()
    const { error } = await supabase.from('sj_rewards').insert({ title: rw.title, description: rw.description || null, cost: Number(rw.cost) })
    flash(error ? error.message : 'Reward ditambah'); setRw({ title: '', description: '', cost: '' }); load()
  }
  const togRw = async (r) => { await supabase.from('sj_rewards').update({ active: !r.active }).eq('id', r.id); load() }

  const stats = [['Akun', d.users.length], ['Sisa', d.listings.length], ['Aktif', d.listings.filter((x) => x.status === 'aktif').length], ['Request', d.requests.length]]
  return (
    <>
      <Topbar title="Admin" sub={'Masuk sebagai ' + (profile?.email || user.email)} back={false} />
      <div className="grid g4" style={{ marginBottom: 18 }}>{stats.map(([t, n]) => <div key={t} className="card stat"><b>{n}</b><span>{t}</span></div>)}</div>
      {msg && <div className="ok">{msg}</div>}
      <div className="tabs" style={{ maxWidth: 760 }}>
        {[['akun', 'Akun'], ['listing', 'Sisa'], ['request', 'Request'], ['reward', 'Reward'], ['pickup', 'Pickup'], ['bantuan', 'Bantuan'], ['siaran', 'Siaran']].map(([k, t]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{t}</button>)}
      </div>

      {tab === 'akun' && (
        <div className="grid" style={{ gridTemplateColumns: sel ? 'minmax(0,1.3fr) minmax(0,1fr)' : '1fr' }}>
          <div className="card scroll-x" style={{ padding: 8 }}>
            <table className="tbl"><thead><tr><th>Nama</th><th>Email</th><th>Poin</th><th>Role</th><th>Daftar</th></tr></thead><tbody>
              {d.users.map((u) => (
                <tr key={u.id} className={sel?.id === u.id ? 'sel' : ''} onClick={() => setSel(sel?.id === u.id ? null : u)} style={{ cursor: 'pointer' }}>
                  <td><b>{u.business_name || u.full_name || '-'}</b><div className="muted" style={{ fontSize: 12 }}>{u.full_name}</div></td>
                  <td>{u.email}</td><td>{u.eco_points}</td>
                  <td onClick={(e) => e.stopPropagation()}><select className="input" style={{ height: 36, width: 110 }} value={u.role} disabled={u.id === user.id} onChange={(e) => setRole(u, e.target.value)}><option>user</option><option>admin</option></select></td>
                  <td className="muted">{timeAgo(u.created_at)}</td></tr>))}
            </tbody></table>
          </div>
          {sel && detail && (
            <div className="card" style={{ padding: 20 }}>
              <h3>{sel.business_name || sel.full_name}</h3>
              <div className="muted" style={{ fontSize: 13, marginBottom: 12 }}>{sel.email} · {sel.phone || 'tanpa telepon'} · {sel.city || '-'}</div>
              <b>Sisa diunggah ({detail.listings.length})</b>
              {detail.listings.map((l) => <div key={l.id} style={{ fontSize: 13, padding: '6px 0', borderTop: '1px solid var(--line)' }}>{l.title} · {l.mode} · <span className="tag">{l.status}</span></div>)}
              <div style={{ marginTop: 14 }}><b>Request diajukan ({detail.requests.length})</b></div>
              {detail.requests.map((r) => <div key={r.id} style={{ fontSize: 13, padding: '6px 0', borderTop: '1px solid var(--line)' }}>{r.sj_listings?.title} · <span className="tag">{r.status}</span></div>)}
              <div style={{ marginTop: 14 }}><b>Poin ({sel.eco_points})</b></div>
              {detail.log.map((x) => <div key={x.id} style={{ fontSize: 13, padding: '6px 0', borderTop: '1px solid var(--line)' }}>{x.reason} <b>{x.points > 0 ? '+' : ''}{x.points}</b></div>)}
              <div style={{ marginTop: 14 }}><b>Reward ditukar ({detail.red.length})</b></div>
              {detail.red.map((x) => <div key={x.id} style={{ fontSize: 13, padding: '6px 0', borderTop: '1px solid var(--line)' }}>{x.sj_rewards?.title} (-{x.cost})</div>)}
            </div>)}
        </div>)}

      {tab === 'listing' && (
        <div className="card scroll-x" style={{ padding: 8 }}><table className="tbl"><thead><tr><th>Sisa</th><th>Pemilik</th><th>Jenis</th><th>Harga</th><th>Status</th><th></th></tr></thead><tbody>
          {d.listings.map((l) => <tr key={l.id}><td><b>{l.title}</b><div className="muted" style={{ fontSize: 12 }}>{l.quantity} {l.unit} · {l.city}</div></td><td>{l.owner_name}</td><td><span className={'tag ' + l.mode}>{l.mode}</span></td><td>{rupiah(l.price)}</td>
            <td><select className="input" style={{ height: 36, width: 110 }} value={l.status} onChange={(e) => lst(l.id, e.target.value)}><option>aktif</option><option>selesai</option><option>nonaktif</option></select></td>
            <td><button className="btn sm danger" onClick={() => delL(l.id)}>Hapus</button></td></tr>)}
        </tbody></table></div>)}

      {tab === 'request' && (
        <div className="card scroll-x" style={{ padding: 8 }}><table className="tbl"><thead><tr><th>Sisa</th><th>Pesan</th><th>Status</th><th>Waktu</th></tr></thead><tbody>
          {d.requests.map((r) => <tr key={r.id}><td>{r.sj_listings?.title}</td><td>{r.message || '-'}</td><td><span className="tag">{r.status}</span></td><td className="muted">{timeAgo(r.created_at)}</td></tr>)}
        </tbody></table></div>)}

      {tab === 'reward' && (
        <div className="grid g2" style={{ alignItems: 'start' }}>
          <form className="card" style={{ padding: 20 }} onSubmit={addRw}><h3 style={{ marginBottom: 12 }}>Tambah reward</h3>
            <div className="field"><label>Nama</label><input className="input" required value={rw.title} onChange={(e) => setRw({ ...rw, title: e.target.value })} /></div>
            <div className="field"><label>Deskripsi</label><input className="input" value={rw.description} onChange={(e) => setRw({ ...rw, description: e.target.value })} /></div>
            <div className="field"><label>Biaya (poin)</label><input className="input" required type="number" min="1" value={rw.cost} onChange={(e) => setRw({ ...rw, cost: e.target.value })} /></div>
            <button className="btn block">Tambah</button></form>
          <div>{d.rewards.map((r) => <div key={r.id} className="card list-item"><div><b>{r.title}</b><div className="muted" style={{ fontSize: 13 }}>{r.cost} poin</div></div>
            <button className={'btn sm' + (r.active ? ' sec' : '')} onClick={() => togRw(r)}>{r.active ? 'Nonaktifkan' : 'Aktifkan'}</button></div>)}</div>
        </div>)}

      {tab === 'pickup' && (ex.pickups.length === 0 ? <div className="card empty">Belum ada pickup.</div> : ex.pickups.map((p) => <PickupRow key={p.id} p={p} onDone={(t) => { flash(t); load() }} />))}

      {tab === 'bantuan' && (ex.support.length === 0 ? <div className="card empty">Belum ada pesan bantuan.</div> : ex.support.map((m) => (
        <div key={m.id} className="card list-item"><div><b>{m.category}</b> <span className="muted" style={{ fontSize: 12 }}>· {d.users.find((u) => u.id === m.user_id)?.email || m.user_id.slice(0, 8)} · {timeAgo(m.created_at)}</span><div style={{ fontSize: 14 }}>{m.body}</div></div><span className="tag">{m.status}</span></div>)))}

      {tab === 'siaran' && (
        <form className="card" style={{ padding: 20, maxWidth: 520 }} onSubmit={async (e) => { e.preventDefault(); const { data, error } = await supabase.rpc('sj_admin_broadcast', { p_title: bc.title, p_body: bc.body }); flash(error ? error.message : 'Terkirim ke ' + data + ' akun'); if (!error) setBc({ title: '', body: '' }) }}>
          <h3 style={{ marginBottom: 12 }}>Kirim notifikasi ke semua akun</h3>
          <div className="field"><label>Judul</label><input className="input" required value={bc.title} onChange={(e) => setBc({ ...bc, title: e.target.value })} /></div>
          <div className="field"><label>Isi</label><textarea className="input" rows={3} required value={bc.body} onChange={(e) => setBc({ ...bc, body: e.target.value })} /></div>
          <button className="btn block">Kirim</button></form>)}
    </>
  )
}

function PickupRow({ p, onDone }) {
  const [st, setSt] = useState(p.status), [c, setC] = useState(p.courier_name || ''), [pl, setPl] = useState(p.courier_plate || '')
  const save = async () => { const { error } = await supabase.rpc('sj_admin_pickup', { p_id: p.id, p_status: st, p_courier: c || null, p_plate: pl || null }); onDone(error ? error.message : 'Pickup diperbarui') }
  return (
    <div className="card list-item"><div><b>{p.code}</b><div className="muted" style={{ fontSize: 13 }}>{p.pickup_date} · {p.slot} · {p.address}</div></div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <select className="input" style={{ height: 40, width: 130 }} value={st} onChange={(e) => setSt(e.target.value)}>{['dijadwalkan', 'ditugaskan', 'menuju', 'selesai'].map((x) => <option key={x}>{x}</option>)}</select>
        <input className="input" style={{ height: 40, width: 130 }} placeholder="Kurir" value={c} onChange={(e) => setC(e.target.value)} />
        <input className="input" style={{ height: 40, width: 100 }} placeholder="Plat" value={pl} onChange={(e) => setPl(e.target.value)} />
        <button className="btn sm" onClick={save}>Simpan</button></div></div>
  )
}
