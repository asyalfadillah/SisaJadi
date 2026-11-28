import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Search, Send, MessageCircle, Bell } from 'lucide-react'
import { supabase, timeAgo, fmtTime, rpc, toast } from '../supabase'
import { useAuth } from '../auth'
import Topbar from '../components/Topbar'
import { Seg, Empty, Spinner } from '../components/ui'

export function ChatList({ initial = 'pesan' }) {
  const { user } = useAuth()
  const nav = useNavigate()
  const [tab, setTab] = useState(initial)
  const [q, setQ] = useState('')
  const [flt, setFlt] = useState('Semua')
  const [threads, setThreads] = useState(null)
  const [notes, setNotes] = useState(null)
  const [ntab, setNtab] = useState('Semua')
  const [peers, setPeers] = useState({})

  useEffect(() => {
    supabase.from('sj_threads').select('*, sj_listings(title,owner_name)').order('last_message_at', { ascending: false })
      .then(async ({ data }) => {
        setThreads(data || [])
        const ids = [...new Set((data || []).map((t) => (t.seller_id === user.id ? t.buyer_id : t.seller_id)))]
        const out = {}; await Promise.all(ids.map(async (id) => { try { out[id] = await rpc('sj_peer_name', { p_uid: id }) } catch { /* abaikan */ } })); setPeers(out)
      })
    supabase.from('sj_notifications').select('*').order('created_at', { ascending: false }).limit(60)
      .then(({ data }) => setNotes(data || []))
  }, [])

  const openNote = async (n) => {
    if (!n.read) { await supabase.from('sj_notifications').update({ read: true }).eq('id', n.id); setNotes((x) => x.map((y) => (y.id === n.id ? { ...y, read: true } : y))) }
    if (n.link) nav(n.link)
  }
  const readAll = async () => {
    await supabase.from('sj_notifications').update({ read: true }).eq('user_id', user.id).eq('read', false)
    setNotes((x) => x.map((y) => ({ ...y, read: true }))); toast('Semua notifikasi dibaca')
  }
  const th = (threads || []).filter((t) => {
    if (flt === 'Request' && t.kind !== 'Request') return false
    if (flt === 'Barter' && t.kind !== 'Barter') return false
    return !q || (t.sj_listings?.title || '').toLowerCase().includes(q.toLowerCase())
  })
  const nt = (notes || []).filter((n) => ntab === 'Semua' || (ntab === 'Permintaan' ? n.kind === 'permintaan' : n.kind !== 'permintaan'))
  const unread = (notes || []).filter((n) => !n.read).length

  return (
    <>
      <Topbar title="Pesan" sub="Chat dan notifikasi" back={false} />
      <Seg value={tab} onChange={setTab} options={[['pesan', 'Pesan'], ['notif', 'Notifikasi' + (unread ? ` (${unread})` : '')]]} style={{ maxWidth: 420 }} />
      {tab === 'pesan' ? (
        <>
          <div className="search"><Search size={20} color="#2E7D4F" /><input placeholder="Cari chat…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
          <div className="rowflex" style={{ marginTop: 10 }}>{['Semua', 'Request', 'Barter'].map((c) => <button key={c} className={'chip' + (flt === c ? ' on' : '')} onClick={() => setFlt(c)}>{c}</button>)}</div>
          {threads === null ? <Spinner /> : th.length === 0 ? <Empty icon={MessageCircle} title="Belum ada chat" text="Mulai chat dari halaman detail sisa." /> :
            th.map((t) => (
              <Link key={t.id} to={'/app/chat/' + t.id} className="card list-item" style={{ flexWrap: 'nowrap' }}>
                <div className="avatar">{(peers[t.seller_id === user.id ? t.buyer_id : t.seller_id] || t.sj_listings?.owner_name || '?')[0]}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <b>{peers[t.seller_id === user.id ? t.buyer_id : t.seller_id] || (t.seller_id === user.id ? 'Pembeli' : t.sj_listings?.owner_name)}</b><div style={{ fontSize: 12, color: 'var(--green)' }}>{t.sj_listings?.title}</div>
                  <div className="muted" style={{ fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.last_body || 'Belum ada pesan'}</div>
                </div>
                <span className="muted" style={{ fontSize: 12 }}>{timeAgo(t.last_message_at)}</span>
              </Link>))}
        </>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="rowflex">{['Semua', 'Permintaan', 'Sistem'].map((c) => <button key={c} className={'chip' + (ntab === c ? ' on' : '')} onClick={() => setNtab(c)}>{c}</button>)}</div>
            {unread > 0 && <button className="btn sm sec" onClick={readAll}>Tandai dibaca</button>}
          </div>
          {notes === null ? <Spinner /> : nt.length === 0 ? <Empty icon={Bell} title="Belum ada notifikasi" /> :
            nt.map((n) => (
              <div key={n.id} className="card list-item" style={{ cursor: 'pointer', borderLeft: n.read ? 'none' : '4px solid var(--green)' }} onClick={() => openNote(n)}>
                <div style={{ flex: 1, minWidth: 0 }}><b>{n.title}</b><div style={{ fontSize: 14 }}>{n.body}</div></div>
                <span className="muted" style={{ fontSize: 12 }}>{timeAgo(n.created_at)}</span>
              </div>))}
        </>
      )}
    </>
  )
}
export const Notifikasi = () => <ChatList initial="notif" />

export function ChatRoom() {
  const { id } = useParams()
  const { user } = useAuth()
  const [t, setT] = useState(null)
  const [msgs, setMsgs] = useState([])
  const [txt, setTxt] = useState('')
  const end = useRef(null)
  const [peer, setPeer] = useState('')
  const [typing, setTyping] = useState(false)
  const chRef = useRef(null)
  const tmo = useRef(null)

  useEffect(() => {
    supabase.from('sj_threads').select('*, sj_listings(id,title,owner_name)').eq('id', id).maybeSingle().then(({ data }) => { setT(data || false); if (data) rpc('sj_peer_name', { p_uid: data.seller_id === user.id ? data.buyer_id : data.seller_id }).then(setPeer).catch(() => {}) })
    supabase.from('sj_messages').select('*').eq('thread_id', id).order('created_at').then(({ data }) => setMsgs(data || []))
    const markRead = () => supabase.rpc('sj_mark_read', { p_thread: Number(id) })
    markRead()
    const ch = supabase.channel('thread-' + id, { config: { broadcast: { self: false } } })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sj_messages', filter: 'thread_id=eq.' + id },
        (p) => { setMsgs((m) => (m.some((x) => x.id === p.new.id) ? m : [...m, p.new])); if (p.new.sender_id !== user.id) { setTyping(false); markRead() } })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'sj_messages', filter: 'thread_id=eq.' + id },
        (p) => setMsgs((m) => m.map((x) => (x.id === p.new.id ? { ...x, ...p.new } : x))))
      .on('broadcast', { event: 'typing' }, (p) => { if (p.payload?.uid !== user.id) { setTyping(true); clearTimeout(tmo.current); tmo.current = setTimeout(() => setTyping(false), 2500) } })
      .subscribe()
    chRef.current = ch
    return () => { clearTimeout(tmo.current); supabase.removeChannel(ch) }
  }, [id])
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }) }, [msgs, typing])

  const send = async (e) => {
    e.preventDefault()
    const body = txt.trim(); if (!body) return
    setTxt('')
    const { data, error } = await supabase.from('sj_messages').insert({ thread_id: Number(id), sender_id: user.id, body }).select().single()
    if (error) { toast(error.message); setTxt(body) } else setMsgs((m) => (m.some((x) => x.id === data.id) ? m : [...m, data]))
  }
  if (t === null) return <Spinner />
  if (t === false) return <Empty icon={MessageCircle} title="Chat tidak ditemukan" />
  return (
    <>
      <Topbar title={peer || t.sj_listings?.owner_name || 'Chat'} sub={t.sj_listings?.title} />
      <div className="card" style={{ padding: 16 }}>
        <div className="chatbox">
          {msgs.length === 0 && <div className="muted" style={{ textAlign: 'center', margin: 'auto' }}>Belum ada pesan. Sapa dulu 👋</div>}
          {msgs.map((m) => (
            <div key={m.id} className={'bubble ' + (m.sender_id === user.id ? 'me' : 'them')}>{m.body}
              <div style={{ fontSize: 10, opacity: .7, textAlign: 'right', marginTop: 2 }}>{fmtTime(m.created_at)}{m.sender_id === user.id ? (m.read_at ? ' ✓✓' : ' ✓') : ''}</div></div>))}
          {typing && <div className="bubble them muted" style={{ fontStyle: 'italic' }}>{peer || 'Lawan bicara'} sedang mengetik…</div>}
          <div ref={end} />
        </div>
        <form onSubmit={send} className="search" style={{ marginTop: 12 }}>
          <input placeholder="Tulis pesan…" value={txt} onChange={(e) => { setTxt(e.target.value); chRef.current?.send({ type: 'broadcast', event: 'typing', payload: { uid: user.id } }) }} maxLength={1000} />
          <button className="btn sm" aria-label="Kirim"><Send size={16} /></button>
        </form>
      </div>
    </>
  )
}
