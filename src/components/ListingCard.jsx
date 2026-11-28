import { Link } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import { motion } from 'framer-motion'
import { CAT, CatIcon } from './ui'
import { rupiah, fmtDist } from '../supabase'

export function Thumb({ l, size = 110, radius = 16, icon = 40 }) {
  const c = CAT[l.category] || CAT.Lainnya
  return l.image_url
    ? <img src={l.image_url} alt={l.title} loading="lazy" style={{ width: size === 'full' ? '100%' : size, height: size === 'full' ? 110 : size, objectFit: 'cover', borderRadius: radius }} />
    : <div className="lic" style={{ background: c.bg, width: size === 'full' ? '100%' : size, height: size === 'full' ? 110 : size, borderRadius: radius }}><CatIcon cat={l.category} size={icon} /></div>
}

export default function ListingCard({ l, to, i = 0, km }) {
  const card = (
    <motion.div className="card lcard" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }} transition={{ duration: 0.45, delay: Math.min(i, 5) * 0.06 }}>
      <Thumb l={l} size="full" />
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <span className={'tag ' + l.mode}>{l.mode}</span><span className="tag">{l.category}</span>
      </div>
      <h3>{l.title}</h3>
      <div className="row"><b style={{ color: 'var(--green)' }}>{l.mode === 'Jual' ? rupiah(l.price) : l.mode}</b>
        <span className="muted">{Number(l.quantity).toLocaleString('id-ID')} {l.unit}</span></div>
      <div className="row muted"><span style={{ display: 'flex', gap: 4, alignItems: 'center' }}><MapPin size={14} />{km != null ? fmtDist(km) : l.city || '-'}</span>
        <span style={{ fontSize: 12 }}>{l.owner_name}</span></div>
    </motion.div>
  )
  return to ? <Link to={to}>{card}</Link> : card
}

export function ListingRow({ l, to, km }) {
  return (
    <Link to={to} className="card list-item" style={{ gap: 14, flexWrap: 'nowrap' }}>
      <Thumb l={l} size={64} radius={14} icon={28} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <b style={{ display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.title}</b>
        <div className="muted" style={{ fontSize: 13 }}>{Number(l.quantity).toLocaleString('id-ID')} {l.unit} · {l.mode === 'Jual' ? rupiah(l.price) : l.mode}</div>
        <div className="muted" style={{ fontSize: 12 }}>{km != null ? fmtDist(km) : l.city || '-'} · {l.owner_name}</div>
      </div>
      <span className="btn sm" style={{ pointerEvents: 'none' }}>{l.mode === 'Jual' ? 'Beli' : l.mode === 'Barter' ? 'Barter' : 'Minta'}</span>
    </Link>
  )
}
