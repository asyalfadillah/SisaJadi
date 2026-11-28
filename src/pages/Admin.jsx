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
  const [pays, setPays] = useState([])
  const [cfg, setCfg] = useState({})
  const [cour, setCour] = useState([])
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
    const [py, st] = await Promise.all([supabase.from('sj_payments').select('*, sj_requests(sj_listings(title))').order('paid_at', { ascending: false }), supabase.from('sj_settings').select('*')])
    const co = await supabase.from('sj_couriers').select('*').order('sort'); setCour(co.data || []); setPays(py.data || []); setCfg(Object.fromEntries((st.data || []).map((x) => [x.key, Number(x.value)])))
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

  if (loading || (user && !profile)) return null
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
      <div className="tabs admin-tabs">
        {[['akun', 'Akun'], ['listing', 'Sisa'], ['request', 'Request'], ['reward', 'Reward'], ['pickup', 'Pickup'], ['bantuan', 'Bantuan'], ['pembayaran', 'Pembayaran'], ['tarif', 'Tarif & Fee'], ['konten', 'Konten'], ['siaran', 'Siaran']].map(([k, t]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{t}</button>)}
      </div>

      {tab === 'akun' && (
        <div className="grid" style={{ gridTemplateColumns: sel ? 'minmax(0,1.3fr) minmax(0,1fr)' : '1fr' }}>
          <div className="card scroll-x" style={{ padding: 8 }}>
            <table className="tbl"><thead><tr><th>Nama</th><th>Email</th><th>Poin</th><th>Role</th><th>Daftar</th></tr></thead><tbody>
              {d.users.map((u) => (
                <tr key={u.id} className={sel?.id === u.id ? 'sel' : ''} onClick={() => setSel(sel?.id === u.id ? null : u)} style={{ cursor: 'pointer' }}>
                  <td><b>{u.business_name || u.full_name || '-'}</b><div className="muted" style={{ fontSize: 12 }}>{u.full_name}</div></td>
                  <td>{u.email}</td><td>{u.eco_points}</td>
                  <td onClick={(e) => e.stopPropagation()}><select className="input" style={{ height: 36, width: 110 }} value={u.role} disabled={u.id === user.id} onChange={(e) => setRole(u, e.target.value)}><option>user</option><option>kurir</option><option>admin</option></select></td>
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

      {tab === 'pickup' && (ex.pickups.length === 0 ? <div className="card empty">Belum ada pickup.</div> : ex.pickups.map((p) => <PickupRow key={p.id} p={p} couriers={d.users.filter((u) => u.role === 'kurir')} onDone={(t) => { flash(t); load() }} />))}

      {tab === 'bantuan' && (ex.support.length === 0 ? <div className="card empty">Belum ada pesan bantuan.</div> : ex.support.map((m) => (
        <div key={m.id} className="card list-item"><div><b>{m.category}</b> <span className="muted" style={{ fontSize: 12 }}>· {d.users.find((u) => u.id === m.user_id)?.email || m.user_id.slice(0, 8)} · {timeAgo(m.created_at)}</span><div style={{ fontSize: 14 }}>{m.body}</div></div><span className="tag">{m.status}</span></div>)))}

      {tab === 'pembayaran' && (<>
        <div className="grid g3" style={{ marginBottom: 14 }}>
          {[['Total transaksi', pays.filter((p) => p.status !== 'dibatalkan').reduce((a, p) => a + Number(p.total), 0)], ['Dana ditahan', pays.filter((p) => p.status === 'dibayar').reduce((a, p) => a + Number(p.item_total) - Number(p.platform_fee), 0)], ['Pendapatan platform', pays.filter((p) => p.status === 'dicairkan').reduce((a, p) => a + Number(p.platform_fee), 0)]].map(([t, n]) => <div key={t} className="card stat"><b style={{ fontSize: 22 }}>{rupiah(n) === 'Gratis' ? 'Rp 0' : rupiah(n)}</b><span>{t}</span></div>)}
        </div>
        {pays.length === 0 ? <div className="card empty">Belum ada pembayaran.</div> : pays.map((p) => (
          <div key={p.id} className="card list-item"><div><b>{p.code}</b> <span className="tag">{p.status}</span><div className="muted" style={{ fontSize: 13 }}>{p.sj_requests?.sj_listings?.title} · {p.method} · barang {rupiah(p.item_total)} + kurir {rupiah(p.courier_fee)} · fee {rupiah(p.platform_fee)}</div></div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><b>{rupiah(p.total)}</b>
              {p.status === 'dibayar' && <><button className="btn sm" onClick={async () => { const { error } = await supabase.rpc('sj_release_payment', { p_id: p.id }); flash(error ? error.message : 'Dana dicairkan'); load() }}>Cairkan</button>
                <button className="btn sm danger" onClick={async () => { if (!confirm('Batalkan dan kembalikan dana?')) return; const { error } = await supabase.rpc('sj_admin_refund', { p_id: p.id }); flash(error ? error.message : 'Dibatalkan'); load() }}>Refund</button></>}</div></div>))}
      </>)}

      {tab === 'tarif' && (
        <div className="card" style={{ padding: 20, maxWidth: 480 }}>
          <h3 style={{ marginBottom: 12 }}>Tarif kurir & fee layanan</h3>
          {[['fee_pct', 'Fee layanan platform (%)']].map(([k, t]) => (
            <div key={k} className="field"><label>{t}</label><div style={{ display: 'flex', gap: 8 }}>
              <input className="input" type="number" min="0" value={cfg[k] ?? ''} onChange={(e) => setCfg({ ...cfg, [k]: e.target.value })} />
              <button className="btn sm" onClick={async () => { const { error } = await supabase.rpc('sj_admin_set_setting', { p_key: k, p_value: Number(cfg[k]) }); flash(error ? error.message : 'Tersimpan') }}>Simpan</button></div></div>))}
          <h3 style={{ margin: '18px 0 8px' }}>Tarif kurir (simulasi)</h3>
          {cour.map((c, i) => <div key={c.code} className="kv" style={{ alignItems: 'center', flexWrap: 'wrap' }}><b style={{ minWidth: 130 }}>{c.name}</b>
            <input className="input" style={{ width: 90, height: 38 }} type="number" value={c.base} onChange={(e) => setCour(cour.map((x, k) => (k === i ? { ...x, base: e.target.value } : x)))} />
            <input className="input" style={{ width: 80, height: 38 }} type="number" value={c.per_km} onChange={(e) => setCour(cour.map((x, k) => (k === i ? { ...x, per_km: e.target.value } : x)))} />
            <button className={'toggle' + (c.active ? ' on' : '')} aria-label="Aktif" onClick={() => setCour(cour.map((x, k) => (k === i ? { ...x, active: !x.active } : x)))} />
            <button className="btn sm" onClick={async () => { const { error } = await supabase.rpc('sj_admin_set_courier', { p_code: c.code, p_base: Number(c.base), p_per_km: Number(c.per_km), p_active: c.active }); flash(error ? error.message : 'Tersimpan') }}>Simpan</button></div>)}
          <p className="muted" style={{ fontSize: 13 }}>Kolom: tarif dasar (Rp), tarif per km (Rp). Ongkir = dasar + per km × jarak (dibulatkan ke atas).</p>
        </div>)}

      {tab === 'konten' && <KontenAdmin flash={flash} />}
      {tab === 'siaran' && (
        <form className="card" style={{ padding: 20, maxWidth: 520 }} onSubmit={async (e) => { e.preventDefault(); const { data, error } = await supabase.rpc('sj_admin_broadcast', { p_title: bc.title, p_body: bc.body }); flash(error ? error.message : 'Terkirim ke ' + data + ' akun'); if (!error) setBc({ title: '', body: '' }) }}>
          <h3 style={{ marginBottom: 12 }}>Kirim notifikasi ke semua akun</h3>
          <div className="field"><label>Judul</label><input className="input" required value={bc.title} onChange={(e) => setBc({ ...bc, title: e.target.value })} /></div>
          <div className="field"><label>Isi</label><textarea className="input" rows={3} required value={bc.body} onChange={(e) => setBc({ ...bc, body: e.target.value })} /></div>
          <button className="btn block">Kirim</button></form>)}
    </>
  )
}

function PickupRow({ p, couriers, onDone }) {
  const [st, setSt] = useState(p.status), [c, setC] = useState(p.courier_name || ''), [pl, setPl] = useState(p.courier_plate || '')
  const [cid, setCid] = useState(p.courier_id || '')
  const assign = async () => { const { error } = await supabase.rpc('sj_admin_assign_courier', { p_id: p.id, p_courier: cid, p_plate: pl || null }); onDone(error ? error.message : 'Kurir ditugaskan') }
  const save = async () => { const { error } = await supabase.rpc('sj_admin_pickup', { p_id: p.id, p_status: st, p_courier: c || null, p_plate: pl || null }); onDone(error ? error.message : 'Pickup diperbarui') }
  return (
    <div className="card list-item"><div><b>{p.code}</b><div className="muted" style={{ fontSize: 13 }}>{p.pickup_date} · {p.slot} · {p.address}</div></div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <select className="input" style={{ height: 40, width: 130 }} value={st} onChange={(e) => setSt(e.target.value)}>{['dijadwalkan', 'ditugaskan', 'menuju', 'selesai'].map((x) => <option key={x}>{x}</option>)}</select>
        {couriers.length > 0 && <><select className="input" style={{ height: 40, width: 160 }} value={cid} onChange={(e) => setCid(e.target.value)}><option value="">Pilih akun kurir</option>{couriers.map((u) => <option key={u.id} value={u.id}>{u.full_name || u.email}</option>)}</select><button className="btn sm sec" disabled={!cid} onClick={assign}>Tugaskan</button></>}
        <input className="input" style={{ height: 40, width: 130 }} placeholder="Kurir" value={c} onChange={(e) => setC(e.target.value)} />
        <input className="input" style={{ height: 40, width: 100 }} placeholder="Plat" value={pl} onChange={(e) => setPl(e.target.value)} />
        <button className="btn sm" onClick={save}>Simpan</button></div></div>
  )
}

function KontenAdmin({ flash }) {
  const [c, setC] = useState({})
  const [help, setHelp] = useState([])
  const [nh, setNh] = useState({ category: 'Akun', title: '', steps: '' })
  const load = async () => {
    const [a, b] = await Promise.all([supabase.from('sj_content').select('*'), supabase.from('sj_help').select('*').order('id')])
    setC(Object.fromEntries((a.data || []).map((x) => [x.key, x.value]))); setHelp(b.data || [])
  }
  useEffect(() => { load() }, [])
  const saveC = async (k) => { const { error } = await supabase.from('sj_content').update({ value: c[k] || '' }).eq('key', k); flash(error ? error.message : 'Tersimpan') }
  const addH = async (e) => { e.preventDefault(); const { error } = await supabase.from('sj_help').insert(nh); flash(error ? error.message : 'Artikel ditambah'); setNh({ category: 'Akun', title: '', steps: '' }); load() }
  const upd = async (h, patch) => { const { error } = await supabase.from('sj_help').update(patch).eq('id', h.id); if (error) flash(error.message); load() }
  const del = async (h) => { if (confirm('Hapus artikel?')) { await supabase.from('sj_help').delete().eq('id', h.id); load() } }
  return (
    <div className="grid g2" style={{ alignItems: 'start' }}>
      <div className="card" style={{ padding: 20 }}>
        <h3 style={{ marginBottom: 12 }}>Kontak & kebijakan</h3>
        {[['contact_wa', 'WhatsApp (mis. 6281234567890)'], ['contact_email', 'Email'], ['contact_phone', 'Telepon']].map(([k, t]) => (
          <div key={k} className="field"><label>{t}</label><div style={{ display: 'flex', gap: 8 }}><input className="input" value={c[k] || ''} onChange={(e) => setC({ ...c, [k]: e.target.value })} /><button className="btn sm" onClick={() => saveC(k)}>Simpan</button></div></div>))}
        <div className="field"><label>Kebijakan Privasi</label><textarea className="input" rows={8} value={c.privacy || ''} onChange={(e) => setC({ ...c, privacy: e.target.value })} /></div>
        <button className="btn block" onClick={() => saveC('privacy')}>Simpan kebijakan</button>
        <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>Kontak yang dikosongkan tidak ditampilkan di aplikasi.</p>
      </div>
      <div>
        <form className="card" style={{ padding: 20, marginBottom: 14 }} onSubmit={addH}><h3 style={{ marginBottom: 12 }}>Tambah artikel bantuan</h3>
          <div className="field"><label>Kategori</label><input className="input" required value={nh.category} onChange={(e) => setNh({ ...nh, category: e.target.value })} /></div>
          <div className="field"><label>Judul</label><input className="input" required value={nh.title} onChange={(e) => setNh({ ...nh, title: e.target.value })} /></div>
          <div className="field"><label>Langkah (satu per baris)</label><textarea className="input" rows={4} required value={nh.steps} onChange={(e) => setNh({ ...nh, steps: e.target.value })} /></div>
          <button className="btn block">Tambah</button></form>
        {help.map((h) => <div key={h.id} className="card list-item"><div><b>{h.title}</b><div className="muted" style={{ fontSize: 12 }}>{h.category}</div></div>
          <div style={{ display: 'flex', gap: 8 }}><button className={'btn sm' + (h.active ? ' sec' : '')} onClick={() => upd(h, { active: !h.active })}>{h.active ? 'Sembunyikan' : 'Tampilkan'}</button><button className="btn sm danger" onClick={() => del(h)}>Hapus</button></div></div>)}
      </div>
    </div>
  )
}
