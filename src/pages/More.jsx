import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, Navigate } from 'react-router-dom'
import { Lightbulb, Search, ChevronRight, Phone, Mail, MessageCircle, ThumbsUp, ThumbsDown, Building2, Bell, Languages, Palette, HelpCircle, Shield, Info, LogOut, Heart, Package, Award } from 'lucide-react'
import { motion } from 'framer-motion'
import { supabase, toast, num } from '../supabase'
import { useAuth } from '../auth'
import Topbar from '../components/Topbar'
import { Logo, Bg, Seg, Empty, Spinner } from '../components/ui'

/* ---------- Ide ---------- */
export const IDEAS = [
  { id: 'kompos', t: 'Pupuk Kompos', from: 'Ampas kopi & organik', level: 'Mudah', est: '2 minggu', steps: ['Campur ampas kopi dengan daun kering (1:2).', 'Tambahkan sedikit air hingga lembap, bukan basah.', 'Aduk setiap 3 hari dalam wadah berventilasi.', 'Setelah 2 minggu, kompos siap ditabur ke tanaman.'] },
  { id: 'scrub', t: 'Scrub Alami', from: 'Ampas kopi', level: 'Mudah', est: '10 menit', steps: ['Keringkan ampas kopi.', 'Campur 3 sdm ampas dengan 1 sdm minyak kelapa.', 'Tambahkan 1 sdt gula.', 'Simpan dalam toples tertutup maksimal 1 minggu.'] },
  { id: 'hama', t: 'Pengusir Hama', from: 'Ampas kopi & kulit jeruk', level: 'Mudah', est: '15 menit', steps: ['Rendam kulit jeruk dan ampas kopi dalam air semalaman.', 'Saring larutan lalu masukkan ke botol semprot.', 'Semprot pada tanaman sore hari.'] },
  { id: 'media', t: 'Media Tanam', from: 'Serbuk kayu & ampas kopi', level: 'Sedang', est: '1 minggu', steps: ['Campur serbuk kayu, ampas kopi, dan tanah (1:1:2).', 'Basahi dan diamkan 3 hari.', 'Masukkan ke pot dan mulai menanam.'] },
]
export const IDE_CHIPS = ['Semua', 'Ampas Kopi', 'Organik', 'Kayu', 'Tekstil']
export function Ide() {
  const [c, setC] = useState('Semua')
  const list = IDEAS.filter((i) => c === 'Semua' || i.from.toLowerCase().includes(c.toLowerCase()))
  return (
    <>
      <Topbar title="Ide Sisa" sub="Inspirasi mengolah sisa produksi" back={false} />
      <div className="rowflex">{IDE_CHIPS.map((x) => <button key={x} className={'chip' + (c === x ? ' on' : '')} onClick={() => setC(x)}>{x}</button>)}</div>
      <Link to="/app/ide/hasil" className="btn block" style={{ margin: '12px 0', maxWidth: 420 }}><Lightbulb size={18} />Lihat Hasil Ide Pemanfaatan</Link>
      {list.length === 0 ? <Empty icon={Lightbulb} title="Belum ada ide untuk kategori ini" /> : <div className="grid g2">{list.map((i) => <IdeCard key={i.id} i={i} />)}</div>}
    </>
  )
}
const IdeCard = ({ i }) => (
  <div className="card" style={{ padding: 20 }}>
    <h3>{i.t}</h3><div className="muted" style={{ fontSize: 13, margin: '4px 0 10px' }}>Dari {i.from}</div>
    <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}><span className="tag">{i.level}</span><span className="tag" style={{ background: '#F7E7A6', color: '#8A6400' }}>{i.est}</span></div>
    <ol style={{ paddingLeft: 18, lineHeight: 1.7, fontSize: 14 }}>{i.steps.map((s) => <li key={s}>{s}</li>)}</ol>
  </div>
)
export const HasilIde = () => (
  <>
    <Topbar title="Hasil Ide Pemanfaatan" sub="Ide dari sisa yang tersedia" />
    <div className="grid g2">{IDEAS.map((i) => <IdeCard key={i.id} i={i} />)}</div>
  </>
)

/* ---------- Bantuan ---------- */
const useHelp = () => {
  const [h, setH] = useState(null)
  useEffect(() => { supabase.from('sj_help').select('*').eq('active', true).order('id').then(({ data }) => setH((data || []).map((x) => ({ ...x, steps: x.steps.split('\n').filter(Boolean) })))) }, [])
  return h
}
export const useContent = () => {
  const [c, setC] = useState({})
  useEffect(() => { supabase.from('sj_content').select('*').then(({ data }) => setC(Object.fromEntries((data || []).map((x) => [x.key, x.value])))) }, [])
  return c
}
export function Bantuan() {
  const [q, setQ] = useState('')
  const [c, setC] = useState('Semua')
  const HELP = useHelp()
  if (!HELP) return <Spinner />
  const cats = ['Semua', ...new Set(HELP.map((h) => h.category))]
  const rows = HELP.filter((h) => (c === 'Semua' || h.category === c) && h.title.toLowerCase().includes(q.toLowerCase()))
  return (
    <>
      <Topbar title="Pusat Bantuan" />
      <div className="search"><Search size={20} color="#2E7D4F" /><input placeholder="Cari bantuan…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      <div className="rowflex" style={{ marginTop: 10 }}>{cats.map((x) => <button key={x} className={'chip' + (c === x ? ' on' : '')} onClick={() => setC(x)}>{x}</button>)}</div>
      {rows.length === 0 ? <Empty icon={HelpCircle} title="Tidak ada artikel" text="Coba kata kunci lain atau hubungi kami." /> : rows.map((h) => (
        <Link key={h.id} to={'/app/bantuan/' + h.id} className="card list-item"><div><b>{h.title}</b><div className="muted" style={{ fontSize: 12 }}>{h.category}</div></div><ChevronRight size={18} /></Link>))}
      <Link to="/app/bantuan/hubungi" className="btn sec block" style={{ marginTop: 14, maxWidth: 420 }}>Hubungi Kami</Link>
    </>
  )
}
export function DetailBantuan() {
  const { id } = useParams()
  const [vote, setVote] = useState(null)
  const HELP = useHelp()
  if (!HELP) return <Spinner />
  const h = HELP.find((x) => String(x.id) === id)
  if (!h) return <Navigate to="/app/bantuan" replace />
  return (
    <>
      <Topbar title="Detail Bantuan" />
      <div className="card" style={{ padding: 24, maxWidth: 600 }}>
        <h2>{h.title}</h2>
        <ol style={{ paddingLeft: 20, lineHeight: 2, margin: '14px 0' }}>{h.steps.map((s) => <li key={s}>{s}</li>)}</ol>
        <b>Apakah membantu?</b>
        {vote === null ? <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
          <button className="btn sm sec" onClick={() => { setVote(true); toast('Terima kasih!') }}><ThumbsUp size={16} />Ya</button>
          <button className="btn sm sec" onClick={() => setVote(false)}><ThumbsDown size={16} />Tidak</button></div> :
          <p className="muted" style={{ marginTop: 8 }}>{vote ? 'Terima kasih atas masukanmu.' : 'Maaf belum membantu. Silakan hubungi kami.'}</p>}
        {vote === false && <Link to="/app/bantuan/hubungi" className="btn sm" style={{ marginTop: 10 }}>Hubungi Kami</Link>}
      </div>
    </>
  )
}
export function Hubungi() {
  const { user } = useAuth()
  const nav = useNavigate()
  const [cat, setCat] = useState('Umum')
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState(false)
  const ct = useContent()
  const send = async (e) => {
    e.preventDefault(); setBusy(true)
    const { error } = await supabase.from('sj_support_messages').insert({ user_id: user.id, category: cat, body: body.trim() })
    setBusy(false)
    if (error) return toast(error.message)
    toast('Pesan terkirim. Tim kami akan menghubungi kamu.'); nav('/app/bantuan')
  }
  return (
    <>
      <Topbar title="Hubungi Kami" />
      <div className="grid g3" style={{ marginBottom: 16 }}>
        {ct.contact_wa && <a className="card stat" href={'https://wa.me/' + ct.contact_wa.replace(/\D/g, '')} target="_blank" rel="noreferrer"><MessageCircle color="#2E7D4F" /><b style={{ fontSize: 16 }}>WhatsApp</b></a>}
        {ct.contact_email && <a className="card stat" href={'mailto:' + ct.contact_email}><Mail color="#2E7D4F" /><b style={{ fontSize: 16 }}>Email</b></a>}
        {ct.contact_phone && <a className="card stat" href={'tel:' + ct.contact_phone}><Phone color="#2E7D4F" /><b style={{ fontSize: 16 }}>Telepon</b></a>}
      </div>
      <form className="card" style={{ padding: 22, maxWidth: 560 }} onSubmit={send}>
        <div className="field"><label>Kategori</label><select className="input" value={cat} onChange={(e) => setCat(e.target.value)}>{['Umum', 'Akun', 'Transaksi', 'Eco Point', 'Lainnya'].map((x) => <option key={x}>{x}</option>)}</select></div>
        <div className="field"><label>Pesan</label><textarea className="input" rows={5} maxLength={300} required value={body} onChange={(e) => setBody(e.target.value)} /><div className="muted" style={{ fontSize: 12, textAlign: 'right' }}>{body.length}/300</div></div>
        <button className="btn block" disabled={busy || !body.trim()}>Kirim</button>
      </form>
    </>
  )
}

/* ---------- Profil ---------- */
export function Profile() {
  const { user, profile, signOut, isAdmin } = useAuth()
  const [st, setSt] = useState({ listings: 0, fav: 0 })
  useEffect(() => {
    Promise.all([supabase.from('sj_listings').select('id', { count: 'exact', head: true }).eq('owner_id', user.id), supabase.from('sj_favorites').select('listing_id', { count: 'exact', head: true })])
      .then(([a, b]) => setSt({ listings: a.count || 0, fav: b.count || 0 }))
  }, [user.id])
  const name = profile?.business_name || profile?.full_name || user.email
  const menu = [
    [Building2, 'Edit Profil Usaha', '/app/profil/edit'], [Package, 'Sisa Saya', '/app/permintaan'], [Heart, 'Favorit', '/app/favorit'], [Award, 'Voucher & Lencana', '/app/voucher'],
    [Bell, 'Pengaturan', '/app/pengaturan'], [HelpCircle, 'Pusat Bantuan', '/app/bantuan'],
  ]
  return (
    <>
      <Topbar title="Profil" back={false} />
      <div className="card" style={{ padding: 22, display: 'flex', gap: 16, alignItems: 'center' }}>
        <div className="avatar" style={{ width: 64, height: 64, fontSize: 26 }}>{name[0].toUpperCase()}</div>
        <div><h2 style={{ fontSize: 20 }}>{name}</h2><div className="muted" style={{ fontSize: 13 }}>{user.email}{isAdmin ? ' · Admin' : ''}</div></div>
      </div>
      <div className="grid g3" style={{ margin: '14px 0' }}>
        <div className="card stat"><b>{st.listings}</b><span>Sisa diunggah</span></div><div className="card stat"><b>{num(profile?.eco_points)}</b><span>Eco Point</span></div><div className="card stat"><b>{st.fav}</b><span>Favorit</span></div>
      </div>
      {menu.map(([I, t, to]) => <Link key={t} to={to} className="card list-item"><div style={{ display: 'flex', gap: 12, alignItems: 'center' }}><I size={20} color="#2E7D4F" /><b>{t}</b></div><ChevronRight size={18} /></Link>)}
      <button className="btn danger block" style={{ marginTop: 10, maxWidth: 420 }} onClick={signOut}><LogOut size={18} />Keluar</button>
    </>
  )
}
export function EditProfil() {
  const { user, profile, refreshProfile } = useAuth()
  const nav = useNavigate()
  const [f, setF] = useState({ business_name: '', business_type: '', business_desc: '', address: '', full_name: '', phone: '', city: '' })
  useEffect(() => { if (profile) setF((x) => Object.fromEntries(Object.keys(x).map((k) => [k, profile[k] || '']))) }, [profile])
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const save = async (e) => {
    e.preventDefault()
    const { error } = await supabase.from('sj_profiles').update(f).eq('id', user.id)
    if (error) return toast(error.message)
    await refreshProfile(); toast('Profil disimpan'); nav(-1)
  }
  return (
    <>
      <Topbar title="Edit Profil Usaha" />
      <form className="card" style={{ padding: 24, maxWidth: 560 }} onSubmit={save}>
        <div className="field"><label>Nama lengkap</label><input className="input" value={f.full_name} onChange={set('full_name')} /></div>
        <div className="field"><label>Nama usaha</label><input className="input" value={f.business_name} onChange={set('business_name')} /></div>
        <div className="field"><label>Jenis usaha</label><select className="input" value={f.business_type} onChange={set('business_type')}><option value="">Pilih…</option>{['Kuliner / Kafe', 'Fashion / Konveksi', 'Kerajinan', 'Pertanian', 'Manufaktur', 'Lainnya'].map((x) => <option key={x}>{x}</option>)}</select></div>
        <div className="field"><label>Deskripsi usaha</label><textarea className="input" rows={3} value={f.business_desc} onChange={set('business_desc')} /></div>
        <div className="field"><label>Alamat</label><textarea className="input" rows={2} value={f.address} onChange={set('address')} /></div>
        <div className="field"><label>Kota</label><input className="input" value={f.city} onChange={set('city')} /></div>
        <div className="field"><label>Nomor telepon</label><input className="input" inputMode="tel" value={f.phone} onChange={set('phone')} /></div>
        <button className="btn block">Simpan</button>
      </form>
    </>
  )
}

/* ---------- Pengaturan ---------- */
const useSettings = () => {
  const { user, profile, refreshProfile } = useAuth()
  const s = profile?.settings || {}
  const save = async (patch) => {
    const { error } = await supabase.from('sj_profiles').update({ settings: { ...s, ...patch } }).eq('id', user.id)
    if (error) toast(error.message); else refreshProfile()
  }
  return [s, save]
}
export function Pengaturan() {
  const { signOut } = useAuth()
  const [s, save] = useSettings()
  const items = [[Bell, 'Notifikasi', '/app/pengaturan/notifikasi'], [HelpCircle, 'Bantuan', '/app/bantuan'], [Shield, 'Kebijakan Privasi', '/app/pengaturan/privasi'], [Info, 'Tentang SisaJadi', '/app/pengaturan/tentang']]
  return (
    <>
      <Topbar title="Pengaturan" />
      <div className="card" style={{ padding: '6px 20px', maxWidth: 560, marginBottom: 12 }}>
        <div className="kv"><span style={{ display: 'flex', gap: 10 }}><Languages size={18} />Bahasa</span><select className="input" style={{ width: 'auto' }} value={s.lang || 'id'} onChange={(e) => save({ lang: e.target.value })}><option value="id">Indonesia</option><option value="en">English</option></select></div>
        <div className="kv"><span style={{ display: 'flex', gap: 10 }}><Palette size={18} />Tampilan gelap</span><button className={'toggle' + (s.dark ? ' on' : '')} aria-label="Tampilan gelap" onClick={() => { save({ dark: !s.dark }); document.documentElement.classList.toggle('dark', !s.dark) }} /></div>
      </div>
      {items.map(([I, t, to]) => <Link key={t} to={to} className="card list-item" style={{ maxWidth: 560 }}><div style={{ display: 'flex', gap: 12, alignItems: 'center' }}><I size={20} color="#2E7D4F" /><b>{t}</b></div><ChevronRight size={18} /></Link>)}
      <button className="btn danger block" style={{ marginTop: 10, maxWidth: 560 }} onClick={signOut}><LogOut size={18} />Keluar</button>
      <p className="muted" style={{ fontSize: 12, marginTop: 10 }}>Pilihan bahasa dan tampilan gelap tersimpan; terjemahan penuh dan tema gelap belum tersedia.</p>
    </>
  )
}
export function PengNotif() {
  const [s, save] = useSettings()
  const L = [['n_request', 'Request masuk'], ['n_chat', 'Pesan baru'], ['n_pickup', 'Status pickup'], ['n_misi', 'Pengingat misi'], ['n_promo', 'Promo & reward']]
  return (
    <>
      <Topbar title="Pengaturan Notifikasi" />
      <div className="card" style={{ padding: '6px 20px', maxWidth: 560 }}>
        {L.map(([k, t]) => { const on = s[k] !== false; return <div key={k} className="kv"><span>{t}</span><button className={'toggle' + (on ? ' on' : '')} aria-label={t} onClick={() => save({ [k]: !on })} /></div> })}
      </div>
    </>
  )
}
export function Privasi() {
  const ct = useContent()
  return (<><Topbar title="Kebijakan Privasi" /><div className="card" style={{ padding: 24, maxWidth: 640, lineHeight: 1.7, whiteSpace: 'pre-line' }}>{ct.privacy ?? ''}</div></>)
}
export const Tentang = () => (<><Topbar title="Tentang SisaJadi" /><div className="card" style={{ padding: 28, maxWidth: 560, textAlign: 'center' }}><Logo size={26} />
  <p style={{ margin: '16px 0' }}>SisaJadi menghubungkan UMKM untuk menjual, barter, dan mendonasikan sisa produksi agar kembali bernilai.</p><div className="muted">Versi 1.0</div></div></>)

/* ---------- Splash & Onboarding ---------- */
export function Splash({ onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 1600); return () => clearTimeout(t) }, [onDone])
  return (
    <motion.div className="splash" initial={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div initial={{ scale: .6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: .7, ease: [.22, 1, .36, 1] }}><Logo size={34} /></motion.div>
    </motion.div>
  )
}
const OB = [
  ['Jual atau barter sisa produksi', 'Unggah sisa produksi usahamu dan temukan UMKM yang membutuhkannya.', Package],
  ['Temukan sisa di sekitarmu', 'Lihat sisa terdekat di peta, ajukan request, dan jadwalkan pickup.', Search],
  ['Kumpulkan Eco Point', 'Setiap transaksi memberi poin dan dampak nyata untuk lingkungan.', Award],
]
export function Onboarding() {
  const { user, loading, refreshProfile } = useAuth()
  const nav = useNavigate()
  const [i, setI] = useState(0)
  if (loading) return <Spinner />
  if (!user) return <Navigate to="/masuk" replace />
  const done = async () => {
    await supabase.from('sj_profiles').update({ onboarded: true }).eq('id', user.id)
    await refreshProfile(); nav('/app', { replace: true })
  }
  const [t, d, I] = OB[i]
  return (
    <>
      <Bg />
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 20 }}>
        <div className="card" style={{ padding: 32, maxWidth: 440, width: '100%', textAlign: 'center' }}>
          <motion.div key={i} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}>
            <div className="lic" style={{ width: 120, height: 120, background: '#E3F1E6', margin: '0 auto 22px' }}><I size={52} color="#2E7D4F" /></div>
            <h2>{t}</h2><p className="muted" style={{ margin: '10px 0 24px' }}>{d}</p>
          </motion.div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 22 }}>{OB.map((_, k) => <span key={k} className={'dot' + (k === i ? ' on' : '')} />)}</div>
          <button className="btn block" onClick={() => (i < OB.length - 1 ? setI(i + 1) : done())}>{i < OB.length - 1 ? 'Lanjut' : 'Mulai'}</button>
          {i < OB.length - 1 && <button className="btn sec block" style={{ marginTop: 10 }} onClick={done}>Lewati</button>}
        </div>
      </div>
    </>
  )
}
