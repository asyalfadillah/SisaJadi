import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
export default function Topbar({ title, sub, back = true }) {
  const nav = useNavigate()
  return (
    <div className="topbar">
      {back && <button className="back" onClick={() => nav(-1)} aria-label="Kembali"><ChevronLeft size={20} /></button>}
      <div><h1>{title}</h1>{sub && <div className="muted" style={{ fontSize: 13 }}>{sub}</div>}</div>
    </div>
  )
}
