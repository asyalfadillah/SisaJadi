import { useCallback, useEffect, useState } from 'react'

const KEY = 'sj-pos'
const read = () => { try { return JSON.parse(sessionStorage.getItem(KEY) || 'null') } catch { return null } }

export function useGeo(auto = false) {
  const [pos, setPos] = useState(read())
  const [err, setErr] = useState('')
  const ask = useCallback(() => new Promise((res) => {
    if (!navigator.geolocation) { setErr('Lokasi tidak didukung peramban ini.'); return res(null) }
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const v = { lat: p.coords.latitude, lng: p.coords.longitude }
        try { sessionStorage.setItem(KEY, JSON.stringify(v)) } catch {}
        setPos(v); setErr(''); res(v)
      },
      () => { setErr('Izin lokasi ditolak.'); res(null) },
      { timeout: 8000 }
    )
  }), [])
  useEffect(() => { if (auto && !pos) ask() }, [auto, pos, ask])
  return { pos, err, ask }
}
