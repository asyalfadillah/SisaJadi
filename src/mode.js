import { useEffect, useState } from 'react'
// Satu akun bisa jadi pembeli dan penyedia. Mode hanya mengatur menu yang tampil.
const get = () => { try { return localStorage.getItem('sj-mode') === 'provider' ? 'provider' : 'buyer' } catch { return 'buyer' } }
export const setMode = (m) => { try { localStorage.setItem('sj-mode', m) } catch { /* abaikan */ } window.dispatchEvent(new Event('sj-mode')) }
export function useMode() {
  const [m, setM] = useState(get)
  useEffect(() => { const h = () => setM(get()); window.addEventListener('sj-mode', h); return () => window.removeEventListener('sj-mode', h) }, [])
  return m
}
