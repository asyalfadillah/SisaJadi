import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../auth'
import Topbar from '../components/Topbar'

export default function Profile() {
  const { user, profile, refreshProfile, signOut, isAdmin } = useAuth()
  const [f, setF] = useState({ full_name: '', business_name: '', phone: '', city: '' })
  const [msg, setMsg] = useState({ t: '', ok: true })
  useEffect(() => { if (profile) setF({ full_name: profile.full_name || '', business_name: profile.business_name || '', phone: profile.phone || '', city: profile.city || '' }) }, [profile])
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const save = async (e) => {
    e.preventDefault()
    const { error } = await supabase.from('sj_profiles').update(f).eq('id', user.id)
    setMsg(error ? { t: error.message, ok: false } : { t: 'Profil disimpan.', ok: true }); refreshProfile()
  }
  return (
    <>
      <Topbar title="Profil" sub={user.email + (isAdmin ? ' · Admin' : '')} back={false} />
      <form className="card" style={{ padding: 24, maxWidth: 560 }} onSubmit={save}>
        {msg.t && <div className={msg.ok ? 'ok' : 'err'}>{msg.t}</div>}
        <div className="field"><label>Nama lengkap</label><input className="input" value={f.full_name} onChange={set('full_name')} /></div>
        <div className="field"><label>Nama usaha</label><input className="input" value={f.business_name} onChange={set('business_name')} /></div>
        <div className="field"><label>Nomor telepon</label><input className="input" value={f.phone} onChange={set('phone')} inputMode="tel" /></div>
        <div className="field"><label>Kota</label><input className="input" value={f.city} onChange={set('city')} /></div>
        <button className="btn block">Simpan</button>
        <button type="button" className="btn sec block" style={{ marginTop: 12 }} onClick={signOut}>Keluar</button>
      </form>
    </>
  )
}
