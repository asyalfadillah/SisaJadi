import { motion, useInView, useMotionValue, animate } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { Leaf, Recycle, Shirt, Package, TreePine, Boxes } from 'lucide-react'

export function Logo({ size = 22 }) {
  return (
    <div className="logo" style={{ fontSize: size }}>
      <svg width={size + 14} height={size + 14} viewBox="0 0 64 64" aria-hidden="true">
        <rect width="64" height="64" rx="18" fill="#2E7D4F" />
        <path d="M16 42c0-13 10-22 31-22 0 17-9 28-24 28-3 0-5-2-7-6Z" fill="#F7E7A6" />
        <path d="M19 49c7-11 13-18 24-23" stroke="#2E7D4F" strokeWidth="3.2" strokeLinecap="round" fill="none" />
      </svg>
      <div>
        Sisa<b>Jadi</b>
        <small>Sisa hari ini, nilai esok hari</small>
      </div>
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
  Lainnya: { bg: '#ECE6F6', fg: '#6A4BA3', Icon: Boxes },
}
export const CatIcon = ({ cat, size = 28 }) => {
  const c = CAT[cat] || CAT.Lainnya
  return <c.Icon size={size} color={c.fg} />
}
export const Spinner = () => <div className="spin" role="status" aria-label="Memuat" />
export { Recycle }
