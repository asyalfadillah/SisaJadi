import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PlusCircle, Inbox, Package, Wallet, MessageCircle } from 'lucide-react'
import { supabase, rupiah } from '../supabase'
import { useAuth } from '../auth'
import Topbar from '../components/Topbar'

export default function Penyedia() {
  const { user } = useAuth()
  const [s, setS] = useState({ aktif: 0, masuk: 0, held: 0, avail: 0 })
  useEffect(() => {
    (async () => {
      const [a, b, c] = await Promise.all([
        supabase.from('sj_listings').select('id', { count: 'exact', head: true }).eq('owner_id', user.id).eq('status', 'aktif'),
        supabase.from('sj_requests').select('id, sj_listings!inner(owner_id)', { count: 'exact', head: true }).eq('sj_listings.owner_id', user.id).eq('status', 'menunggu'),
        supabase.from('sj_payments').select('item_total,platform_fee,status').eq('payee_id', user.id),
      ])
      const net = (p) => p.item_total - p.platform_fee, P = c.data || []
      setS({ aktif: a.count || 0, masuk: b.count || 0, held: P.filter((p) => p.status === 'dibayar').reduce((x, p) => x + net(p), 0), avail: P.filter((p) => p.status === 'dicairkan').reduce((x, p) => x + net(p), 0) })
    })()
  }, [user.id])
  const money = (n) => (n ? rupiah(n) : 'Rp 0')
  const menu = [[PlusCircle, 'Jual Sisa Baru', '/app/jual'], [Package, 'Sisa Saya', '/app/permintaan?tab=listing'], [Inbox, 'Request Masuk', '/app/permintaan'], [Wallet, 'Dompet', '/app/dompet'], [MessageCircle, 'Pesan', '/app/chat']]
  return (
    <>
      <Topbar title="Beranda Penyedia" sub="Kelola sisa produksi yang kamu jual" back={false} />
      <div className="grid g4">
        <div className="card stat"><b>{s.aktif}</b><span>Sisa aktif</span></div><div className="card stat"><b>{s.masuk}</b><span>Request menunggu</span></div>
        <div className="card stat"><b style={{ fontSize: 22 }}>{money(s.held)}</b><span>Dana ditahan</span></div><div className="card stat"><b style={{ fontSize: 22 }}>{money(s.avail)}</b><span>Saldo tersedia</span></div>
      </div>
      <div className="card qmenu" style={{ marginTop: 18 }}>{menu.map(([I, t, to]) => <Link key={t} to={to}><span style={{ background: '#E3F1E6' }}><I size={26} color="#2E7D4F" /></span>{t}</Link>)}</div>
    </>
  )
}
