import { motion, useInView, useMotionValue, animate } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { Leaf, Recycle, Shirt, Package, TreePine, Boxes, Coffee, Wine, Wrench, Cpu } from 'lucide-react'

export function Logo({ size = 22 }) {
  const px = Math.round(size * 1.9)
  return (
    <div className="logo" style={{ fontSize: size }}>
      <img src="/logo.png" width={px} height={px} alt="" style={{ width: px, height: px, objectFit: 'contain' }} />
      <div>Sisa<b>Jadi</b></div>
    </div>
  )
}

export const Bg = () => (
  <div className="bg" aria-hidden="true"><i /><i /></div>
)

export function Reveal({ children, delay = 0, y = 28, className, style, as = 'div' }) {
  const M = motion[as] || motion.div
  return (
    <M
      className={className}
      style={style}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </M>
  )
}

export function Count({ to, suffix = '' }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })
  const v = useMotionValue(0)
  const [txt, setTxt] = useState('0')
  useEffect(() => {
    if (!inView) return
    const c = animate(v, to, { duration: 1.6, ease: 'easeOut', onUpdate: (x) => setTxt(Math.round(x).toLocaleString('id-ID')) })
    return () => c.stop()
  }, [inView, to, v])
  return <span ref={ref}>{txt}{suffix}</span>
}

export const CAT = {
  Organik: { bg: '#E3F1E6', fg: '#2E7D4F', Icon: Leaf },
  Tekstil: { bg: '#DCEFF7', fg: '#1D6B8A', Icon: Shirt },
  Kemasan: { bg: '#FBE3D6', fg: '#B5532A', Icon: Package },
  Kayu: { bg: '#F7E7A6', fg: '#8A6400', Icon: TreePine },
  Botol: { bg: '#D9EEF0', fg: '#1B7B86', Icon: Wine },
  'Ampas Kopi': { bg: '#EBDDD0', fg: '#7A4E2D', Icon: Coffee },
  'Besi & Logam': { bg: '#E3E6EA', fg: '#4B5563', Icon: Wrench },
  Elektronik: { bg: '#E4E3F7', fg: '#4C4BB0', Icon: Cpu },
  Lainnya: { bg: '#ECE6F6', fg: '#6A4BA3', Icon: Boxes },
}
export const CatIcon = ({ cat, size = 28 }) => {
  const c = CAT[cat] || CAT.Lainnya
  return <c.Icon size={size} color={c.fg} />
}
export const Spinner = () => <div className="spin" role="status" aria-label="Memuat" />
export { Recycle }

export function Seg({ value, onChange, options, style }) {
  return (
    <div className="tabs" role="tablist" style={style}>
      {options.map((o) => {
        const [v, l] = Array.isArray(o) ? o : [o, o]
        return <button key={v} type="button" className={value === v ? 'on' : ''} onClick={() => onChange(v)}>{l}</button>
      })}
    </div>
  )
}

export function BarChart({ data, unit = 'kg', height = 150 }) {
  const max = Math.max(1, ...data.map((d) => d.v))
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height, paddingTop: 20 }}>
      {data.map((d, i) => (
        <div key={d.l} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' }}>
          <span style={{ fontSize: 11, fontWeight: 600 }}>{d.v ? d.v : ''}</span>
          <motion.div initial={{ height: 0 }} whileInView={{ height: Math.max(4, (d.v / max) * (height - 50)) }} viewport={{ once: true }}
            transition={{ duration: 0.7, delay: i * 0.07 }} style={{ width: '100%', maxWidth: 38, borderRadius: 10, background: i === data.length - 1 ? '#2E7D4F' : '#AFD6B0' }} />
          <span className="muted" style={{ fontSize: 11 }}>{d.l}</span>
        </div>
      ))}
    </div>
  )
}

export function Progress({ pct, color = 'var(--green)', bg = 'var(--mint)', h = 8 }) {
  return (
    <div style={{ height: h, borderRadius: h, background: bg, overflow: 'hidden' }}>
      <motion.div initial={{ width: 0 }} animate={{ width: Math.min(100, Math.max(0, pct)) + '%' }} transition={{ duration: 0.8 }} style={{ height: '100%', background: color, borderRadius: h }} />
    </div>
  )
}

export function Empty({ icon: I, title, text, children }) {
  return (
    <div className="card empty">
      {I && <I size={40} color="#2E7D4F" style={{ margin: '0 auto 12px' }} />}
      {title && <b style={{ display: 'block', color: 'var(--ink)', marginBottom: 4 }}>{title}</b>}
      {text && <p>{text}</p>}
      {children && <div style={{ marginTop: 16 }}>{children}</div>}
    </div>
  )
}

export function SuccessCard({ icon: I, title, text, children }) {
  return (
    <div className="card" style={{ padding: 32, textAlign: 'center', maxWidth: 520, margin: '20px auto' }}>
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 220, damping: 14 }}
        style={{ width: 84, height: 84, borderRadius: '50%', background: 'var(--green)', display: 'grid', placeItems: 'center', margin: '0 auto 18px' }}>
        <I size={42} color="#fff" />
      </motion.div>
      <h2 style={{ fontSize: 24, marginBottom: 6 }}>{title}</h2>
      <p className="muted" style={{ marginBottom: 20 }}>{text}</p>
      {children}
    </div>
  )
}

export function Toaster() {
  const [t, setT] = useState('')
  useEffect(() => {
    let id
    const h = (e) => { setT(e.detail); clearTimeout(id); id = setTimeout(() => setT(''), 3000) }
    window.addEventListener('sj-toast', h)
    return () => { window.removeEventListener('sj-toast', h); clearTimeout(id) }
  }, [])
  return t ? <div className="toast" role="status">{t}</div> : null
}
