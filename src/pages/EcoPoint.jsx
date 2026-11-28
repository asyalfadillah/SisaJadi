import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Award, Gift, Ticket, Medal, Leaf, TreePine, Share2, Download, Lock } from 'lucide-react'
import { supabase, rpc, toast, timeAgo, num, levelOf, co2Of, treesOf, fmtDate, CATEGORIES } from '../supabase'
import { useAuth } from '../auth'
import Topbar from '../components/Topbar'
import { Seg, Progress, Spinner, Empty, BarChart, SuccessCard, CatIcon } from '../components/ui'

export default function EcoPoint() {
  const { profile } = useAuth()
  const [log, setLog] = useState(null)
  const [all, setAll] = useState(false)
  useEffect(() => { supabase.from('sj_points_log').select('*').order('created_at', { ascending: false }).limit(100).then(({ data }) => setLog(data || [])) }, [])
  const pts = profile?.eco_points ?? 0
  const lv = levelOf(pts)
  const today = (log || []).filter((x) => x.points > 0 && new Date(x.created_at).toDateString() === new Date().toDateString()).reduce((a, x) => a + x.points, 0)
  const rows = (log || []).slice(0, all ? 100 : 5)
  return (
    <>
      <Topbar title="Eco Point" sub="Kumpulkan poin dari transaksi" back={false} />
      <div className="dampak"><Award size={28} /><b>{num(pts)} poin</b><div style={{ opacity: .9 }}>{lv.name}{lv.next ? ` · ${num(lv.toNext)} poin lagi ke ${lv.next}` : ''}</div>
        <div style={{ marginTop: 10 }}><Progress pct={lv.pct} color="#fff" bg="rgba(255,255,255,.3)" /></div></div>
      <div className="card" style={{ padding: 18, marginTop: 14 }}><div style={{ display: 'flex', justifyContent: 'space-between' }}><b>Batas poin harian</b><span>{Math.min(today, 200)}/200</span></div><div style={{ marginTop: 8 }}><Progress pct={(today / 200) * 100} /></div></div>
      <div className="rowflex" style={{ margin: '14px 0' }}>
        <Link className="chip" to="/app/reward"><Gift size={16} />Tukar Reward</Link><Link className="chip" to="/app/voucher"><Ticket size={16} />Voucher Saya</Link>
        <Link className="chip" to="/app/lencana"><Medal size={16} />Lencana</Link><Link className="chip" to="/app/misi"><Award size={16} />Misi</Link>
      </div>
      <div className="sect"><h2>Riwayat Poin</h2>{log && log.length > 5 && <a href="#" onClick={(e) => { e.preventDefault(); setAll(!all) }}>{all ? 'Ringkas' : 'Lihat semua ›'}</a>}</div>
      {log === null ? <Spinner /> : rows.length === 0 ? <div className="card empty">Belum ada riwayat.</div> : rows.map((x) => (
        <div key={x.id} className="card list-item"><div><b>{x.reason}</b><div className="muted" style={{ fontSize: 12 }}>{timeAgo(x.created_at)}</div></div>
          <b style={{ color: x.points > 0 ? 'var(--green)' : 'var(--danger)' }}>{x.points > 0 ? '+' : ''}{x.points}</b></div>))}
    </>
  )
}

export function Reward() {
  const { profile } = useAuth()
  const [r, setR] = useState(null)
  const [cat, setCat] = useState('Semua')
  useEffect(() => { supabase.from('sj_rewards').select('*').eq('active', true).order('cost').then(({ data }) => setR(data || [])) }, [])
  const cats = ['Semua', ...new Set((r || []).map((x) => x.category).filter(Boolean))]
  return (
    <>
      <Topbar title="Tukar Reward" sub={`Poin kamu: ${num(profile?.eco_points ?? 0)}`} />
      <div className="rowflex">{cats.map((c) => <button key={c} className={'chip' + (cat === c ? ' on' : '')} onClick={() => setCat(c)}>{c}</button>)}</div>
      {r === null ? <Spinner /> : <div className="grid g2" style={{ marginTop: 10 }}>{r.filter((x) => cat === 'Semua' || x.category === cat).map((x) => (
        <Link key={x.id} to={'/app/reward/' + x.id} className="card" style={{ padding: 20, display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
          <div><b>{x.title}</b><div className="muted" style={{ fontSize: 13 }}>{x.description}</div></div><span className="tag">{num(x.cost)} poin</span></Link>))}</div>}
    </>
  )
}

export function DetailReward() {
  const { id } = useParams()
  const nav = useNavigate()
  const { profile, refreshProfile } = useAuth()
  const [r, setR] = useState(null)
  const [done, setDone] = useState(null)
  const [busy, setBusy] = useState(false)
  useEffect(() => { supabase.from('sj_rewards').select('*').eq('id', id).maybeSingle().then(({ data }) => setR(data || false)) }, [id])
  if (r === null) return <Spinner />
  if (!r) return <Empty title="Reward tidak ditemukan" />
  if (done) return <SuccessCard icon={Gift} title="Penukaran Berhasil" text={`Kode voucher: ${done.code}`}><Link className="btn block" to="/app/voucher">Lihat Voucher Saya</Link></SuccessCard>
  const pts = profile?.eco_points ?? 0
  const go = async () => {
    setBusy(true)
    try { setDone(await rpc('sj_redeem', { p_reward: r.id })); refreshProfile() } catch (e) { toast(e.message); setBusy(false) }
  }
  return (
    <>
      <Topbar title="Detail Reward" />
      <div className="card" style={{ padding: 24, maxWidth: 560 }}>
        <h2>{r.title}</h2><p className="muted" style={{ margin: '6px 0 14px' }}>{r.description}</p>
        <div className="kv"><span className="muted">Harga</span><b>{num(r.cost)} poin</b></div>
        <div className="kv"><span className="muted">Berlaku</span><b>{r.valid_days || 30} hari</b></div>
        <div className="kv"><span className="muted">Poin kamu</span><b>{num(pts)}</b></div>
        <b style={{ display: 'block', margin: '14px 0 4px' }}>Syarat & ketentuan</b><p className="muted" style={{ fontSize: 14 }}>{r.terms || 'Voucher hanya berlaku satu kali dan tidak dapat diuangkan.'}</p>
        <button className="btn block" style={{ marginTop: 16 }} disabled={busy || pts < r.cost} onClick={go}>{pts < r.cost ? `Kurang ${num(r.cost - pts)} poin` : 'Tukar Sekarang'}</button>
      </div>
    </>
  )
}

export function Voucher() {
  const [tab, setTab] = useState('Aktif')
  const [v, setV] = useState(null)
  const load = () => supabase.from('sj_redemptions').select('*, sj_rewards(title,description)').order('created_at', { ascending: false }).then(({ data }) => setV(data || []))
  useEffect(() => { load() }, [])
  const st = (x) => (x.status === 'terpakai' ? 'Terpakai' : x.expires_at && new Date(x.expires_at) < new Date() ? 'Kedaluwarsa' : 'Aktif')
  const use = async (x) => { try { await rpc('sj_use_voucher', { p_id: x.id }); toast('Voucher dipakai'); load() } catch (e) { toast(e.message) } }
  const rows = (v || []).filter((x) => st(x) === tab)
  return (
    <>
      <Topbar title="Voucher Saya" />
      <Seg value={tab} onChange={setTab} options={['Aktif', 'Terpakai', 'Kedaluwarsa']} />
      {v === null ? <Spinner /> : rows.length === 0 ? <Empty icon={Ticket} title={`Tidak ada voucher ${tab.toLowerCase()}`} /> : rows.map((x) => (
        <div key={x.id} className="card list-item"><div><b>{x.sj_rewards?.title}</b><div className="muted" style={{ fontSize: 13 }}>Kode <b>{x.code}</b>{x.expires_at ? ' · s/d ' + fmtDate(x.expires_at) : ''}</div></div>
          {tab === 'Aktif' && <button className="btn sm" onClick={() => use(x)}>Pakai</button>}</div>))}
    </>
  )
}

export function Lencana() {
  const [b, setB] = useState(null)
  useEffect(() => { rpc('sj_my_badges').then(setB) }, [])
  if (!b) return <Spinner />
  return (
    <>
      <Topbar title="Lencana" sub={`${b.filter((x) => x.earned).length}/${b.length} diraih`} />
      <div className="grid g3">{b.map((x) => (
        <div key={x.key} className="card" style={{ padding: 18, opacity: x.earned ? 1 : .75 }}>
          <div className="lic" style={{ width: 56, height: 56, background: x.earned ? '#F7E7A6' : '#ECEFEC', marginBottom: 10 }}>{x.earned ? <Medal color="#8A6400" /> : <Lock color="#9AA69C" size={20} />}</div>
          <b>{x.title}</b><div className="muted" style={{ fontSize: 13, margin: '4px 0 8px' }}>{x.description}</div>
          {!x.earned && <><Progress pct={(x.progress / x.target) * 100} /><div className="muted" style={{ fontSize: 12, marginTop: 4 }}>{Math.min(x.progress, x.target)}/{x.target}</div></>}
        </div>))}</div>
    </>
  )
}

/* ----- Dampak ----- */
const useImpact = () => { const [d, setD] = useState(null); useEffect(() => { rpc('sj_my_impact').then(setD) }, []); return d }
const TARGET = 3000

export function Dampak() {
  const d = useImpact()
  if (!d) return <Spinner />
  const pct = Math.min(100, Math.round((d.kg / TARGET) * 100))
  return (
    <>
      <Topbar title="Impact Tracker" sub="Dampak nyata dari sisa yang kamu selamatkan" back={false} />
      <div className="dampak"><Leaf size={26} /><b>{num(Math.round(d.kg))} kg</b><div style={{ opacity: .9 }}>sisa diselamatkan · {d.transactions} transaksi</div>
        <div className="pills"><span>{co2Of(d.kg)} kg CO₂ dihindari</span><span>{treesOf(d.kg)} pohon setara</span></div></div>
      <div className="card" style={{ padding: 18, marginTop: 14 }}><div style={{ display: 'flex', justifyContent: 'space-between' }}><b>Target bulanan</b><span>{pct}%</span></div><div style={{ marginTop: 8 }}><Progress pct={pct} /></div></div>
      <div className="rowflex" style={{ margin: '14px 0' }}>
        <Link className="chip" to="/app/dampak/ringkasan">Ringkasan</Link><Link className="chip" to="/app/dampak/riwayat">Riwayat</Link>
        <Link className="chip" to="/app/dampak/rincian">Rincian & Pencapaian</Link><Link className="chip" to="/app/dampak/sertifikat">Sertifikat</Link>
      </div>
    </>
  )
}

export function RingkasanDampak() {
  const d = useImpact()
  if (!d) return <Spinner />
  const data = (d.by_month || []).slice(-6).map((x) => ({ l: new Date(x.m + '-01').toLocaleDateString('id-ID', { month: 'short' }), v: Math.round(x.kg) }))
  return (
    <>
      <Topbar title="Ringkasan Dampak" />
      <div className="grid g3">
        {[['Sisa diselamatkan', num(Math.round(d.kg)) + ' kg'], ['CO₂ dihindari', co2Of(d.kg) + ' kg'], ['Setara pohon', treesOf(d.kg)]].map(([a, b]) => <div key={a} className="card stat"><b>{b}</b><span>{a}</span></div>)}
      </div>
      <div className="card" style={{ padding: 20, marginTop: 16 }}><b>Per bulan</b>{data.length ? <BarChart data={data} /> : <p className="muted">Belum ada data.</p>}</div>
    </>
  )
}

export function RiwayatDampak() {
  const d = useImpact()
  const [f, setF] = useState('Semua')
  if (!d) return <Spinner />
  const rows = (d.history || []).filter((h) => f === 'Semua' || h.kind === f)
  return (
    <>
      <Topbar title="Riwayat Dampak" />
      <div className="rowflex">{['Semua', 'Dijual', 'Dibeli', 'Barter'].map((c) => <button key={c} className={'chip' + (f === c ? ' on' : '')} onClick={() => setF(c)}>{c}</button>)}</div>
      {rows.length === 0 ? <div className="card empty" style={{ marginTop: 10 }}>Belum ada riwayat.</div> : rows.map((h) => (
        <div key={h.id} className="card list-item" style={{ marginTop: 10 }}><div><b>{h.title}</b><div className="muted" style={{ fontSize: 13 }}>{h.kind} · {h.qty} {h.unit} · {fmtDate(h.created_at)}</div></div><span className="tag">{h.owner_name}</span></div>))}
    </>
  )
}

export function RincianDampak() {
  const d = useImpact()
  const [b, setB] = useState([])
  useEffect(() => { rpc('sj_my_badges').then(setB) }, [])
  if (!d) return <Spinner />
  return (
    <>
      <Topbar title="Rincian & Pencapaian" />
      <div className="sect" style={{ marginTop: 4 }}><h2>Per Kategori</h2></div>
      {(d.by_category || []).length === 0 ? <div className="card empty">Belum ada data.</div> : d.by_category.map((c) => (
        <div key={c.category} className="card list-item"><div style={{ display: 'flex', gap: 12, alignItems: 'center' }}><CatIcon cat={c.category} /><b>{c.category}</b></div><span>{num(Math.round(c.kg))} kg · {c.n}x</span></div>))}
      <div className="sect"><h2>Pencapaian</h2><Link to="/app/lencana">Semua ›</Link></div>
      <div className="rowflex">{b.filter((x) => x.earned).map((x) => <span key={x.key} className="chip on"><Medal size={14} />{x.title}</span>)}{!b.some((x) => x.earned) && <span className="muted">Belum ada lencana.</span>}</div>
    </>
  )
}

export function Sertifikat() {
  const d = useImpact()
  const { profile } = useAuth()
  if (!d) return <Spinner />
  const share = async () => {
    const text = `Saya sudah menyelamatkan ${num(Math.round(d.kg))} kg sisa produksi lewat SisaJadi 🌱`
    try { if (navigator.share) await navigator.share({ title: 'Sertifikat Dampak SisaJadi', text, url: location.origin }); else { await navigator.clipboard.writeText(text + ' ' + location.origin); toast('Teks disalin') } } catch { /* dibatalkan */ }
    rpc('sj_log_event', { p_kind: 'share' }).catch(() => {})
  }
  return (
    <>
      <Topbar title="Sertifikat Dampak" />
      <div className="cert" style={{ maxWidth: 560 }}>
        <Leaf size={40} color="#2E7D4F" /><div className="muted" style={{ margin: '8px 0' }}>Sertifikat Dampak</div>
        <h2 style={{ fontSize: 26 }}>{profile?.business_name || profile?.full_name}</h2>
        <p style={{ margin: '14px 0' }}>telah menyelamatkan</p><b style={{ fontSize: 44, color: 'var(--green)' }}>{num(Math.round(d.kg))} kg</b>
        <p style={{ margin: '14px 0' }}>sisa produksi, menghindari {co2Of(d.kg)} kg CO₂ — setara {treesOf(d.kg)} pohon.</p>
        <div className="muted" style={{ fontSize: 13 }}>Diterbitkan {fmtDate(new Date())} · SisaJadi</div>
      </div>
      <div className="noprint" style={{ display: 'flex', gap: 10, maxWidth: 560, marginTop: 16 }}>
        <button className="btn block" onClick={share}><Share2 size={18} />Bagikan</button>
        <button className="btn sec block" onClick={() => window.print()}><Download size={18} />Unduh PDF</button>
      </div>
    </>
  )
}
