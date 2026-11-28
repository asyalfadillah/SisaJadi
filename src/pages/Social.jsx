import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Heart, Users, Send, MessageSquare } from 'lucide-react'
import { supabase, rpc, toast, num, timeAgo } from '../supabase'
import { useAuth } from '../auth'
import Topbar from '../components/Topbar'
import ListingCard from '../components/ListingCard'
import { Seg, Empty, Spinner } from '../components/ui'
import { Board } from './Missions'

export function Favorites() {
  const { user } = useAuth()
  const [tab, setTab] = useState('Semua')
  const [items, setItems] = useState(null)
  const [sellers, setSellers] = useState(null)
  useEffect(() => {
    supabase.from('sj_favorites').select('created_at, sj_listings(*)').order('created_at', { ascending: false })
      .then(({ data }) => setItems((data || []).map((x) => x.sj_listings).filter(Boolean)))
    supabase.from('sj_fav_sellers').select('seller_id').then(async ({ data }) => {
      const ids = (data || []).map((x) => x.seller_id)
      if (!ids.length) return setSellers([])
      const { data: ls } = await supabase.from('sj_listings').select('owner_id, owner_name').in('owner_id', ids)
      const m = new Map(); (ls || []).forEach((l) => m.set(l.owner_id, l.owner_name))
      setSellers(ids.map((id) => ({ id, name: m.get(id) || 'Penjual' })))
    })
  }, [user.id])
  const unfav = async (id) => { await supabase.from('sj_fav_sellers').delete().eq('seller_id', id); setSellers((s) => s.filter((x) => x.id !== id)) }
  const showL = tab !== 'Penjual', showS = tab !== 'Sisa'
  const empty = (items || []).length === 0 && (sellers || []).length === 0
  return (
    <>
      <Topbar title="Favorit" sub="Sisa dan penjual yang kamu simpan" back={false} />
      <Seg value={tab} onChange={setTab} options={['Semua', 'Sisa', 'Penjual']} style={{ maxWidth: 420 }} />
      {items === null || sellers === null ? <Spinner /> : (tab === 'Semua' ? empty : tab === 'Sisa' ? !items.length : !sellers.length) ?
        <Empty icon={Heart} title="Belum ada favorit" text="Simpan sisa atau penjual favoritmu."><Link to="/app/jelajahi" className="btn sm">Jelajahi sisa</Link></Empty> : (
          <>
            {showS && sellers.map((s) => <div key={s.id} className="card list-item"><div style={{ display: 'flex', gap: 12, alignItems: 'center' }}><div className="avatar">{s.name[0]}</div><b>{s.name}</b></div><button className="btn sm danger" onClick={() => unfav(s.id)}>Hapus</button></div>)}
            {showL && <div className="grid g3" style={{ marginTop: 10 }}>{items.map((l, i) => <ListingCard key={l.id} l={l} i={i} to={'/app/sisa/' + l.id} />)}</div>}
          </>)}
    </>
  )
}

export function Peringkat() {
  const [p, setP] = useState('week')
  const [rows, setRows] = useState(null)
  useEffect(() => { setRows(null); rpc('sj_leaderboard', { p_period: p }).then(setRows) }, [p])
  return (
    <>
      <Topbar title="Papan Peringkat" sub="Eco Point terbanyak" />
      <Seg value={p} onChange={setP} options={[['week', 'Minggu'], ['month', 'Bulan'], ['all', 'Semua']]} />
      <Board rows={rows} />
    </>
  )
}

export function Komunitas() {
  const [tab, setTab] = useState('Untuk Kamu')
  const [list, setList] = useState(null)
  const load = () => rpc('sj_communities_list').then(setList)
  useEffect(() => { load() }, [])
  const join = async (c, e) => {
    e.preventDefault()
    const { error } = c.joined
      ? await supabase.from('sj_community_members').delete().eq('community_id', c.id)
      : await supabase.from('sj_community_members').insert({ community_id: c.id, user_id: (await supabase.auth.getUser()).data.user.id })
    if (error) toast(error.message); else { toast(c.joined ? 'Keluar dari komunitas' : 'Bergabung!'); load() }
  }
  const rows = (list || []).filter((c) => tab === 'Diikuti' ? c.joined : true).sort((a, b) => tab === 'Terdekat' ? a.name.localeCompare(b.name) : b.members - a.members)
  return (
    <>
      <Topbar title="Komunitas" sub="Belajar dan berbagi bersama UMKM lain" back={false} />
      <div className="rowflex"><Link className="chip" to="/app/peringkat">Papan Peringkat</Link><Link className="chip" to="/app/komunitas/papan">Papan Komunitas</Link></div>
      <Seg value={tab} onChange={setTab} options={['Untuk Kamu', 'Terdekat', 'Diikuti']} />
      {list === null ? <Spinner /> : rows.length === 0 ? <Empty icon={Users} title="Belum ada komunitas" /> : rows.map((c) => (
        <Link key={c.id} to={'/app/komunitas/' + c.id} className="card list-item">
          <div style={{ minWidth: 0, flex: 1 }}><b>{c.name}</b><div className="muted" style={{ fontSize: 13 }}>{c.city} · {num(c.members)} anggota · {num(c.impact_kg)} kg</div></div>
          <button className={'btn sm' + (c.joined ? ' sec' : '')} onClick={(e) => join(c, e)}>{c.joined ? 'Diikuti' : 'Gabung'}</button>
        </Link>))}
    </>
  )
}

export function PapanKomunitas() {
  const [list, setList] = useState(null)
  useEffect(() => { rpc('sj_communities_list').then((d) => setList([...d].sort((a, b) => b.impact_kg - a.impact_kg))) }, [])
  return (
    <>
      <Topbar title="Papan Komunitas" sub="Dampak terbesar" />
      {!list ? <Spinner /> : list.map((c, i) => <div key={c.id} className="card list-item"><div><b>{i + 1}. {c.name}</b><div className="muted" style={{ fontSize: 13 }}>{c.city}</div></div><b>{num(c.impact_kg)} kg</b></div>)}
    </>
  )
}

export function DetailKomunitas() {
  const { id } = useParams()
  const { user } = useAuth()
  const [c, setC] = useState(null)
  const [tab, setTab] = useState('Diskusi')
  const [posts, setPosts] = useState([])
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [reply, setReply] = useState({})
  const load = async () => {
    const l = await rpc('sj_communities_list'); setC(l.find((x) => String(x.id) === id) || false)
    const { data } = await supabase.from('sj_posts').select('*').eq('community_id', id).order('created_at', { ascending: false }); setPosts(data || [])
  }
  useEffect(() => { load() }, [id])
  if (c === null) return <Spinner />
  if (!c) return <Empty title="Komunitas tidak ditemukan" />
  const toggle = async () => {
    const { error } = c.joined ? await supabase.from('sj_community_members').delete().eq('community_id', c.id).eq('user_id', user.id) : await supabase.from('sj_community_members').insert({ community_id: c.id, user_id: user.id })
    if (error) toast(error.message); else load()
  }
  const post = async (parent, text, ttl) => {
    if (!text.trim()) return
    const { error } = await supabase.from('sj_posts').insert({ community_id: c.id, user_id: user.id, parent_id: parent, title: ttl || null, body: text.trim() })
    if (error) return toast(error.message)
    if (parent) setReply({ ...reply, [parent]: '' }); else { setTitle(''); setBody('') }
    load()
  }
  const top = posts.filter((p) => !p.parent_id)
  return (
    <>
      <Topbar title={c.name} sub={`${c.city} · ${num(c.members)} anggota`} />
      <div className="card" style={{ padding: 20, marginBottom: 6 }}>
        <p>{c.description}</p><div className="muted" style={{ margin: '8px 0 14px', fontSize: 13 }}>Dampak komunitas: {num(c.impact_kg)} kg</div>
        <button className={'btn sm' + (c.joined ? ' sec' : '')} onClick={toggle}>{c.joined ? 'Keluar' : 'Gabung'}</button>
      </div>
      <Seg value={tab} onChange={setTab} options={['Diskusi', 'Misi']} />
      {tab === 'Misi' ? <div className="card" style={{ padding: 20 }}>Misi komunitas: kumpulkan {num(Math.round(c.impact_kg * 1.2) + 100)} kg sisa bersama. Setiap transaksi anggota menambah progres.</div> : (
        <>
          {c.joined && <div className="card" style={{ padding: 16, marginBottom: 14 }}>
            <input className="input" placeholder="Judul diskusi" value={title} onChange={(e) => setTitle(e.target.value)} />
            <textarea className="input" rows={2} style={{ marginTop: 8 }} placeholder="Tulis sesuatu…" value={body} onChange={(e) => setBody(e.target.value)} />
            <button className="btn sm" style={{ marginTop: 8 }} onClick={() => post(null, body, title)}>Kirim</button></div>}
          {top.length === 0 ? <Empty icon={MessageSquare} title="Belum ada diskusi" /> : top.map((p) => (
            <div key={p.id} className="card" style={{ padding: 18, marginBottom: 12 }}>
              <b>{p.title}</b><p style={{ margin: '4px 0' }}>{p.body}</p><div className="muted" style={{ fontSize: 12 }}>{p.author_name} · {timeAgo(p.created_at)}</div>
              {posts.filter((r) => r.parent_id === p.id).map((r) => <div key={r.id} style={{ marginTop: 10, paddingLeft: 12, borderLeft: '3px solid var(--mint)', fontSize: 14 }}>{r.body}<div className="muted" style={{ fontSize: 12 }}>{r.author_name}</div></div>)}
              {c.joined && <div style={{ display: 'flex', gap: 8, marginTop: 10 }}><input className="input" placeholder="Balas…" value={reply[p.id] || ''} onChange={(e) => setReply({ ...reply, [p.id]: e.target.value })} /><button className="btn sm" onClick={() => post(p.id, reply[p.id])} aria-label="Balas"><Send size={14} /></button></div>}
            </div>))}
        </>)}
    </>
  )
}
