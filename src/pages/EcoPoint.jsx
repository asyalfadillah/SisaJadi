import { useCallback, useEffect, useState } from 'react'
import { Award } from 'lucide-react'
import { supabase, timeAgo } from '../supabase'
import { useAuth } from '../auth'
import Topbar from '../components/Topbar'

export default function EcoPoint() {
  const { profile, refreshProfile } = useAuth()
  const [rewards, setRewards] = useState(null)
  const [log, setLog] = useState([])
  const [msg, setMsg] = useState({ t: '', ok: true })
  const load = useCallback(async () => {
    const [a, b] = await Promise.all([
      supabase.from('sj_rewards').select('*').eq('active', true).order('cost'),
      supabase.from('sj_points_log').select('*').order('created_at', { ascending: false }).limit(20),
    ])
    setRewards(a.data || []); setLog(b.data || [])
  }, [])
  useEffect(() => { load() }, [load])
  const redeem = async (r) => {
    const { error } = await supabase.rpc('sj_redeem', { p_reward: r.id })
    setMsg(error ? { t: error.message, ok: false } : { t: 'Berhasil menukar ' + r.title, ok: true })
    refreshProfile(); load()
  }
  const pts = profile?.eco_points ?? 0
  return (
    <>
      <Topbar title="Eco Point" sub="Kumpulkan poin dari transaksi" back={false} />
      <div className="dampak"><Award size={28} /><b>{pts} poin</b><div style={{ opacity: .9 }}>+20 poin untuk setiap request yang diterima</div></div>
      {msg.t && <div className={msg.ok ? 'ok' : 'err'} style={{ marginTop: 14 }}>{msg.t}</div>}
      <div className="sect"><h2>Tukar Reward</h2></div>
      <div className="grid g2">
        {rewards === null ? <div className="spin" /> : rewards.map((r) => (
          <div key={r.id} className="card" style={{ padding: 20, display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
            <div><b>{r.title}</b><div className="muted" style={{ fontSize: 13 }}>{r.description}</div></div>
            <button className="btn sm" disabled={pts < r.cost} onClick={() => redeem(r)}>{r.cost} poin</button>
          </div>))}
      </div>
      <div className="sect"><h2>Riwayat Poin</h2></div>
      {log.length === 0 ? <div className="card empty">Belum ada riwayat.</div> : log.map((x) => (
        <div key={x.id} className="card list-item"><div><b>{x.reason}</b><div className="muted" style={{ fontSize: 12 }}>{timeAgo(x.created_at)}</div></div>
          <b style={{ color: x.points > 0 ? 'var(--green)' : 'var(--danger)' }}>{x.points > 0 ? '+' : ''}{x.points}</b></div>))}
    </>
  )
}
