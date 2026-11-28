import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Target, Flame, Gift, Settings, Trophy, Check } from 'lucide-react'
import { rpc, toast, supabase, num } from '../supabase'
import { useAuth } from '../auth'
import Topbar from '../components/Topbar'
import { Progress, Spinner, SuccessCard, Seg } from '../components/ui'

const LINKS = { profile_complete: '/app/profil/edit', listings: '/app/jual', barter: '/app/jelajahi?mode=Barter', messages: '/app/chat', share: '/app/dampak/sertifikat' }

export function Misi() {
  const [d, setD] = useState(null)
  useEffect(() => { rpc('sj_missions_status').then(setD).catch((e) => toast(e.message)) }, [])
  if (!d) return <Spinner />
  const done = d.missions.filter((m) => m.progress >= m.target).length
  const hide = false
  return (
    <>
      <Topbar title="Misi" sub={`Minggu ini · tingkat ${d.difficulty || 'Normal'}`} back={false} />
      <div className="dampak"><Target size={26} /><b>{done}/{d.missions.length} misi selesai</b><div style={{ opacity: .9 }}>Selesaikan misi, klaim Eco Point</div></div>
      <div className="rowflex" style={{ margin: '14px 0' }}>
        <Link className="chip" to="/app/misi/streak"><Flame size={16} />Streak Harian</Link>
        <Link className="chip" to="/app/misi/riwayat"><Trophy size={16} />Riwayat & Peringkat</Link>
        <Link className="chip" to="/app/misi/pengaturan"><Settings size={16} />Pengaturan</Link>
      </div>
      {!hide && d.missions.map((m) => (
        <Link key={m.id} to={'/app/misi/' + m.id} className="card" style={{ display: 'block', padding: 18, marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><b>{m.title}</b><span className="tag">+{m.reward} poin</span></div>
          <div className="muted" style={{ fontSize: 13, margin: '4px 0 10px' }}>{m.description}</div>
          <Progress pct={(m.progress / m.target) * 100} />
          <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>{Math.min(m.progress, m.target)}/{m.target} {m.claimed ? '· Sudah diklaim' : ''}</div>
        </Link>))}
    </>
  )
}

export function DetailMisi() {
  const { id } = useParams()
  const nav = useNavigate()
  const { refreshProfile } = useAuth()
  const [d, setD] = useState(null)
  const [res, setRes] = useState(null)
  const [busy, setBusy] = useState(false)
  useEffect(() => { rpc('sj_missions_status').then(setD) }, [])
  if (!d) return <Spinner />
  const m = d.missions.find((x) => String(x.id) === id)
  if (!m) return <Topbar title="Misi tidak ditemukan" />
  if (res) return (
    <>
      <Topbar title="Klaim Berhasil" />
      <SuccessCard icon={Gift} title="Klaim Berhasil!" text={`+${res.reward} Eco Point · total ${num(res.after)}`}>
        {res.badge && <p style={{ marginBottom: 16 }}>Lencana baru: <b>{res.badge}</b></p>}
        <Link className="btn block" to="/app/misi">Kembali ke Misi</Link>
      </SuccessCard>
    </>
  )
  const ready = m.progress >= m.target && !m.claimed
  const claim = async () => {
    setBusy(true)
    try { setRes(await rpc('sj_claim_mission', { p_id: m.id })); refreshProfile() } catch (e) { toast(e.message) }
    setBusy(false)
  }
  return (
    <>
      <Topbar title="Detail Misi" />
      <div className="card" style={{ padding: 24, maxWidth: 560 }}>
        <h2>{m.title}</h2><p className="muted" style={{ margin: '6px 0 16px' }}>{m.description}</p>
        <Progress pct={(m.progress / m.target) * 100} h={12} />
        <div className="kv"><span className="muted">Progres</span><b>{Math.min(m.progress, m.target)}/{m.target}</b></div>
        <div className="kv"><span className="muted">Hadiah</span><b>+{m.reward} Eco Point</b></div>
        <div className="kv"><span className="muted">Berakhir</span><b>{new Date(d.week_end).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</b></div>
        {m.claimed ? <button className="btn block" disabled style={{ marginTop: 14 }}><Check size={18} />Sudah diklaim</button> :
          ready ? <button className="btn block" style={{ marginTop: 14 }} disabled={busy} onClick={claim}>Klaim Hadiah</button> :
            <button className="btn block" style={{ marginTop: 14 }} onClick={() => nav(LINKS[m.metric] || '/app')}>Kerjakan Misi</button>}
      </div>
    </>
  )
}

export function RiwayatMisi() {
  const [p, setP] = useState('week')
  const [rows, setRows] = useState(null)
  const [hist, setHist] = useState([])
  useEffect(() => { setRows(null); rpc('sj_leaderboard', { p_period: p }).then(setRows) }, [p])
  useEffect(() => { supabase.from('sj_mission_claims').select('*, sj_missions(title,reward)').order('claimed_at', { ascending: false }).limit(20).then(({ data }) => setHist(data || [])) }, [])
  return (
    <>
      <Topbar title="Riwayat & Peringkat" />
      <div className="sect" style={{ marginTop: 4 }}><h2>Riwayat Klaim</h2></div>
      {hist.length === 0 ? <div className="card empty">Belum ada misi yang diklaim.</div> : hist.map((h) => (
        <div key={h.mission_id + String(h.week)} className="card list-item"><b>{h.sj_missions?.title}</b><span className="tag">+{h.reward}</span></div>))}
      <div className="sect"><h2>Peringkat</h2></div>
      <Seg value={p} onChange={setP} options={[['week', 'Minggu'], ['month', 'Bulan'], ['all', 'Semua']]} />
      <Board rows={rows} />
    </>
  )
}

export function Board({ rows }) {
  if (!rows) return <Spinner />
  if (!rows.length) return <div className="card empty">Belum ada data peringkat.</div>
  return rows.map((r) => (
    <div key={r.user_id} className="card list-item" style={r.is_me ? { outline: '2px solid var(--green)' } : null}>
      <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
        <b style={{ width: 28, textAlign: 'center', fontSize: 18 }}>{r.rank <= 3 ? ['🥇', '🥈', '🥉'][r.rank - 1] : r.rank}</b>
        <span>{r.name}{r.is_me ? ' (Kamu)' : ''}</span>
      </div>
      <b>{num(r.points)} poin</b>
    </div>))
}

export function PengaturanMisi() {
  const { user, profile, refreshProfile } = useAuth()
  const nav = useNavigate()
  const s0 = profile?.settings || {}
  const [s, setS] = useState({ reminder: true, show_on_home: true, hide_done: false, difficulty: 'Normal', ...s0 })
  const [ask, setAsk] = useState(false)
  const save = async () => {
    const { error } = await supabase.from('sj_profiles').update({ settings: { ...s0, ...s } }).eq('id', user.id)
    if (error) return toast(error.message)
    await refreshProfile(); toast('Pengaturan misi disimpan'); nav(-1)
  }
  const T = ({ k, label }) => <div className="kv"><span>{label}</span><button type="button" className={'toggle' + (s[k] ? ' on' : '')} onClick={() => setS({ ...s, [k]: !s[k] })} aria-label={label} /></div>
  return (
    <>
      <Topbar title="Pengaturan Misi" />
      <div className="card" style={{ padding: 22, maxWidth: 560 }}>
        <T k="reminder" label="Pengingat misi" /><T k="show_on_home" label="Tampilkan di Beranda" /><T k="hide_done" label="Sembunyikan misi selesai" />
        <div style={{ margin: '14px 0 6px' }}><b>Tingkat kesulitan</b></div>
        <div className="rowflex">{['Mudah', 'Normal', 'Sulit'].map((d) => <button key={d} className={'sel-chip' + (s.difficulty === d ? ' on' : '')} onClick={() => setS({ ...s, difficulty: d })}>{d}</button>)}</div>
        <button className="btn block" style={{ marginTop: 18 }} onClick={() => setAsk(true)}>Simpan</button>
      </div>
      {ask && <div className="modal-bg" onClick={() => setAsk(false)}><div className="card modal" onClick={(e) => e.stopPropagation()}>
        <h3>Simpan pengaturan misi?</h3><p className="muted" style={{ margin: '8px 0 18px' }}>Perubahan akan diterapkan pada misi minggu ini.</p>
        <div style={{ display: 'flex', gap: 10 }}><button className="btn sec block" onClick={() => setAsk(false)}>Batal</button><button className="btn block" onClick={save}>Simpan</button></div>
      </div></div>}
    </>
  )
}

export function Streak() {
  const [d, setD] = useState(null)
  const load = useCallback(() => rpc('sj_streak').then(setD), [])
  useEffect(() => { load() }, [load])
  const go = async () => { try { setD(await rpc('sj_checkin')); toast('Check-in berhasil 🔥') } catch (e) { toast(e.message) } }
  if (!d) return <Spinner />
  const days = d.days || []
  const first = new Date(); first.setDate(1)
  const pad = (first.getDay() + 6) % 7
  const dim = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate()
  const set = new Set(days.map((x) => String(x).slice(0, 10)))
  const key = (n) => `${first.getFullYear()}-${String(first.getMonth() + 1).padStart(2, '0')}-${String(n).padStart(2, '0')}`
  const today = new Date().getDate()
  return (
    <>
      <Topbar title="Streak Harian" />
      <div className="dampak"><Flame size={28} /><b>{d.streak} hari</b><div style={{ opacity: .9 }}>Rekor terbaik {d.best} hari</div></div>
      <button className="btn block" style={{ margin: '16px 0', maxWidth: 560 }} disabled={d.checked_today} onClick={go}>{d.checked_today ? 'Sudah check-in hari ini' : 'Check-in Hari Ini'}</button>
      <div className="card" style={{ padding: 20, maxWidth: 560 }}>
        <b style={{ display: 'block', marginBottom: 12 }}>{first.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</b>
        <div className="cal">
          {['S', 'S', 'R', 'K', 'J', 'S', 'M'].map((x, i) => <span key={i} className="muted">{x}</span>)}
          {Array.from({ length: pad }, (_, i) => <span key={'p' + i} />)}
          {Array.from({ length: dim }, (_, i) => <span key={i} className={(set.has(key(i + 1)) ? 'on ' : '') + (i + 1 === today ? 'today' : '')}>{i + 1}</span>)}
        </div>
      </div>
    </>
  )
}
