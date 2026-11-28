import { createClient } from '@supabase/supabase-js'

// URL dan anon key bersifat publik. Keamanan data dijaga oleh Row Level Security.
const url = import.meta.env.VITE_SUPABASE_URL || 'https://hwssghhtynvfhyxywwtt.supabase.co'
const key =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3c3NnaGh0eW52Zmh5eHl3d3R0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTU3Nzk2NDUsImV4cCI6MjExMTM1NTY0NX0.ZTyCfqp2ITsr5I_m_STX1YuIfwJM50HzfqIPceuR3QY'

export const supabase = createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
})

export const rupiah = (n) => (n > 0 ? 'Rp ' + Number(n).toLocaleString('id-ID') : 'Gratis')
export const CATEGORIES = ['Organik', 'Tekstil', 'Kemasan', 'Kayu', 'Botol', 'Ampas Kopi', 'Besi & Logam', 'Elektronik', 'Lainnya']
export const MODES = ['Jual', 'Barter', 'Donasi']
export const timeAgo = (iso) => {
  const s = (Date.now() - new Date(iso).getTime()) / 1000
  if (s < 3600) return Math.max(1, Math.floor(s / 60)) + ' menit lalu'
  if (s < 86400) return Math.floor(s / 3600) + ' jam lalu'
  return Math.floor(s / 86400) + ' hari lalu'
}

export const CONDITIONS = ['Baru', 'Layak', 'Campur']
export const fmtDate = (d, o = { day: 'numeric', month: 'short', year: 'numeric' }) => new Date(d).toLocaleDateString('id-ID', o)
export const fmtTime = (d) => new Date(d).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace(':', '.')
export const fmtDay = (d) => {
  const x = new Date(d), t = new Date()
  const diff = Math.floor((new Date(t.getFullYear(), t.getMonth(), t.getDate()) - new Date(x.getFullYear(), x.getMonth(), x.getDate())) / 86400000)
  return diff === 0 ? 'Hari ini' : diff === 1 ? 'Kemarin' : fmtDate(d)
}
export const num = (n) => Number(n || 0).toLocaleString('id-ID')
export const dist = (a, b) => {
  if (!a || !b || a.lat == null || b.lat == null || a.lng == null || b.lng == null) return null
  const R = 6371, rad = (x) => (x * Math.PI) / 180
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}
export const fmtDist = (km) => (km == null ? '' : km < 1 ? Math.round(km * 1000) + ' m' : km.toFixed(1).replace('.', ',') + ' km')
export const LEVELS = [[0, 'Level Tunas'], [1000, 'Level Hijau'], [3000, 'Level Rimba'], [6000, 'Level Bumi']]
export const levelOf = (pts) => {
  let i = 0
  LEVELS.forEach(([min], k) => { if (pts >= min) i = k })
  const next = LEVELS[i + 1]
  return { name: LEVELS[i][1], next: next ? next[1] : null, toNext: next ? next[0] - pts : 0, pct: next ? Math.round(((pts - LEVELS[i][0]) / (next[0] - LEVELS[i][0])) * 100) : 100 }
}
export const co2Of = (kg) => Math.round(Number(kg || 0) * 0.5)
export const treesOf = (kg) => Math.round(Number(kg || 0) / 46)
export const toast = (msg) => window.dispatchEvent(new CustomEvent('sj-toast', { detail: msg }))
export const rpc = async (name, args) => {
  const { data, error } = await supabase.rpc(name, args)
  if (error) throw error
  return data
}
