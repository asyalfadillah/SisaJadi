import { motion, useInView, useMotionValue, animate } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { Leaf, Recycle, Shirt, Package, TreePine, Boxes } from 'lucide-react'

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
  Lainnya: { bg: '#ECE6F6', fg: '#6A4BA3', Icon: Boxes },
}
export const CatIcon = ({ cat, size = 28 }) => {
  const c = CAT[cat] || CAT.Lainnya
  return <c.Icon size={size} color={c.fg} />
}
export const Spinner = () => <div className="spin" role="status" aria-label="Memuat" />
export { Recycle }
