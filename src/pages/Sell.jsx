import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, CATEGORIES, MODES } from '../supabase'
import { useAuth } from '../auth'
import Topbar from '../components/Topbar'

export default function Sell() {
  const { user, profile } = useAuth()
  const nav = useNavigate()
  const [f, setF] = useState({ title: '', description: '', category: 'Organik', mode: 'Jual', quantity: '', unit: 'kg', price: '', city: profile?.city || '' })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr('')
    const { data, error } = await supabase.from('sj_listings').insert({
      owner_id: user.id, title: f.title.trim(), description: f.description.trim() || null, category: f.category, mode: f.mode,
      quantity: Number(f.quantity), unit: f.unit, price: f.mode === 'Jual' ? Number(f.price || 0) : 0, city: f.city.trim() || null,
    }).select('id').single()
    setBusy(false)
    if (error) return setErr('Gagal menyimpan: ' + error.message)
    nav('/app/sisa/' + data.id)
  }
  return (
    <>
      <Topbar title="Jual Sisa" sub="Unggah sisa produksimu" back={false} />
      <form className="card" style={{ padding: 24, maxWidth: 640 }} onSubmit={submit}>
        {err && <div className="err">{err}</div>}
        <div className="field"><label>Nama sisa</label><input className="input" required maxLength={80} value={f.title} onChange={set('title')} placeholder="Contoh: Ampas kopi segar" /></div>
        <div className="grid g2">
          <div className="field"><label>Kategori</label><select className="input" value={f.category} onChange={set('category')}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></div>
          <div className="field"><label>Jenis</label><select className="input" value={f.mode} onChange={set('mode')}>{MODES.map((c) => <option key={c}>{c}</option>)}</select></div>
          <div className="field"><label>Jumlah</label><input className="input" required type="number" min="0.1" step="any" value={f.quantity} onChange={set('quantity')} /></div>
          <div className="field"><label>Satuan</label><select className="input" value={f.unit} onChange={set('unit')}>{['kg', 'pcs', 'liter', 'meter', 'karung'].map((c) => <option key={c}>{c}</option>)}</select></div>
        </div>
        {f.mode === 'Jual' && <div className="field"><label>Harga per {f.unit} (Rp)</label><input className="input" type="number" min="0" value={f.price} onChange={set('price')} /></div>}
        <div className="field"><label>Kota / lokasi</label><input className="input" value={f.city} onChange={set('city')} placeholder="Contoh: Bandung" /></div>
        <div className="field"><label>Deskripsi</label><textarea className="input" value={f.description} onChange={set('description')} placeholder="Kondisi, cara pengambilan, dsb." /></div>
        <button className="btn block" disabled={busy}>{busy ? 'Menyimpan…' : 'Terbitkan'}</button>
      </form>
    </>
  )
}
