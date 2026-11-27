import { Link } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import { motion } from 'framer-motion'
import { CAT, CatIcon } from './ui'
import { rupiah } from '../supabase'

export default function ListingCard({ l, to, i = 0 }) {
  const c = CAT[l.category] || CAT.Lainnya
  const card = (
    <motion.div className="card lcard" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }} transition={{ duration: 0.45, delay: Math.min(i, 5) * 0.06 }}>
      <div className="lic" style={{ background: c.bg }}><CatIcon cat={l.category} size={40} /></div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <span className={'tag ' + l.mode}>{l.mode}</span><span className="tag">{l.category}</span>
      </div>
      <h3>{l.title}</h3>
      <div className="row"><b style={{ color: 'var(--green)' }}>{l.mode === 'Jual' ? rupiah(l.price) : l.mode}</b>
        <span className="muted">{Number(l.quantity).toLocaleString('id-ID')} {l.unit}</span></div>
      <div className="row muted"><span style={{ display: 'flex', gap: 4, alignItems: 'center' }}><MapPin size={14} />{l.city || '-'}</span>
        <span style={{ fontSize: 12 }}>{l.owner_name}</span></div>
    </motion.div>
  )
  return to ? <Link to={to}>{card}</Link> : card
}
