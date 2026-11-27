import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart } from 'lucide-react'
import { supabase } from '../supabase'
import Topbar from '../components/Topbar'
import ListingCard from '../components/ListingCard'

export default function Favorites() {
  const [items, setItems] = useState(null)
  useEffect(() => {
    supabase.from('sj_favorites').select('created_at, sj_listings(*)').order('created_at', { ascending: false })
      .then(({ data }) => setItems((data || []).map((x) => x.sj_listings).filter(Boolean)))
  }, [])
  return (
    <>
      <Topbar title="Favorit" sub="Sisa yang kamu simpan" back={false} />
      {items === null ? <div className="spin" /> : items.length === 0 ?
        <div className="card empty"><Heart size={40} color="#2E7D4F" style={{ margin: '0 auto 12px' }} /><p>Belum ada favorit.</p>
          <Link to="/app/jelajahi" className="btn sm" style={{ marginTop: 16 }}>Jelajahi sisa</Link></div> :
        <div className="grid g3">{items.map((l, i) => <ListingCard key={l.id} l={l} i={i} to={'/app/sisa/' + l.id} />)}</div>}
    </>
  )
}
