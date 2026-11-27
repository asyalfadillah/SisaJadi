import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Menu, X, Upload, Repeat, Gift, Award, Lightbulb, MapPin, Search, ArrowRight, Heart, Users, Recycle as RIcon, Sprout } from 'lucide-react'
import { Bg, Logo, Reveal, Count } from '../components/ui'
import ListingCard from '../components/ListingCard'
import { supabase } from '../supabase'
import { useAuth } from '../auth'

const links = [['Informasi', '#informasi'], ['Menu', '#menu'], ['Cara Kerja', '#cara-kerja'], ['Dampak', '#dampak'], ['Sisa Terbaru', '#terbaru'], ['FAQ', '#faq']]

export default function Landing() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [stats, setStats] = useState({ umkm: 0, listings: 0, selesai: 0, kg: 0 })
  const [items, setItems] = useState([])
  const { scrollY } = useScroll()
  const yPhone = useTransform(scrollY, [0, 500], [0, -50])
  const yBlob = useTransform(scrollY, [0, 600], [0, 90])

  useEffect(() => {
    supabase.rpc('sj_stats').then(({ data }) => data && setStats(data))
    supabase.from('sj_listings').select('*').eq('status', 'aktif').order('created_at', { ascending: false }).limit(4)
      .then(({ data }) => setItems(data || []))
  }, [])

  const auth = user
    ? <Link to="/app" className="btn sm">Buka Aplikasi</Link>
    : <><Link to="/masuk" className="btn sm sec" style={{ display: 'inline-flex' }}>Masuk</Link><Link to="/masuk?daftar=1" className="btn sm hide-s">Daftar</Link></>

  return (
    <>
      <Bg />
      <motion.header className="nav" initial={{ y: -80 }} animate={{ y: 0 }} transition={{ duration: 0.6, ease: 'easeOut' }}>
        <div className="wrap">
          <a href="#top"><Logo size={20} /></a>
          <ul>{links.map(([t, h]) => <li key={h}><a href={h}>{t}</a></li>)}</ul>
          <div className="acts">{auth}
            <button className="burger" onClick={() => setOpen(!open)} aria-label="Menu">{open ? <X size={20} /> : <Menu size={20} />}</button></div>
        </div>
        <nav className={'mnav' + (open ? ' open' : '')}>
          {links.map(([t, h]) => <a key={h} href={h} onClick={() => setOpen(false)}>{t}</a>)}
        </nav>
      </motion.header>

      <main id="top">
        <section className="hero">
          <div className="wrap">
            <div>
              <motion.span className="pill" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Sprout size={16} /> Platform circular economy UMKM
              </motion.span>
              <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.7 }}>
                Sisa produksi jadi <em>bernilai lagi</em>
              </motion.h1>
              <motion.p className="lead" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.7 }}>
                SisaJadi mempertemukan UMKM yang punya sisa produksi dengan pihak yang membutuhkannya. Jual, barter, atau donasikan, lalu kumpulkan Eco Point dari setiap transaksi.
              </motion.p>
              <motion.div className="ctas" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                <Link to={user ? '/app' : '/masuk?daftar=1'} className="btn">Mulai Sekarang <ArrowRight size={18} /></Link>
                <a href="#informasi" className="btn sec">Pelajari Dulu</a>
              </motion.div>
              <motion.div className="mini" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
                <div><b><Count to={stats.umkm} /></b><span>UMKM bergabung</span></div>
                <div><b><Count to={stats.listings} /></b><span>Sisa tersedia</span></div>
                <div><b><Count to={Math.round(stats.kg)} suffix=" kg" /></b><span>Sisa tercatat</span></div>
              </motion.div>
            </div>

            <motion.div className="device" style={{ y: yPhone }} initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3, duration: 0.8 }}>
              <motion.div className="float" style={{ left: -28, top: 90, zIndex: 2 }} animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 4 }}>
                <i style={{ background: '#E3F1E6' }}><Gift size={16} color="#2E7D4F" /></i> Donasi ampas kopi
              </motion.div>
              <motion.div className="float" style={{ right: -24, top: 250, zIndex: 2 }} animate={{ y: [0, 12, 0] }} transition={{ repeat: Infinity, duration: 5, delay: 0.5 }}>
                <i style={{ background: '#F7E7A6' }}><Award size={16} color="#8A6400" /></i> +20 Eco Point
              </motion.div>
              <motion.div className="float" style={{ left: -10, bottom: 70, zIndex: 2 }} animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 4.5, delay: 1 }}>
                <i style={{ background: '#DCEFF7' }}><Repeat size={16} color="#1D6B8A" /></i> Barter kardus
              </motion.div>
              <div className="phone"><div className="phone-in">
                <Logo size={16} />
                <div className="mock-search"><Search size={15} style={{ marginRight: 8 }} />Cari ampas kopi, kain perca…</div>
                <div className="mock-menu">
                  {[['Jual Sisa', '#E3F1E6'], ['Barter', '#DCEFF7'], ['Request', '#FBE3D6'], ['Eco Point', '#F7E7A6'], ['Ide Sisa', '#E3F1E6']].map(([t, c]) => <div key={t}><span style={{ background: c }} />{t}</div>)}
                </div>
                <div className="mock-impact"><small>Dampak Bersama</small><b>2.485 kg</b><small>sisa produksi jadi bernilai lagi</small></div>
                <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                  {['Semua', 'Organik', 'Tekstil'].map((t, i) => <span key={t} className="chip" style={i === 0 ? { background: '#2E7D4F', color: '#fff', height: 32, fontSize: 12 } : { height: 32, fontSize: 12 }}>{t}</span>)}
                </div>
              </div></div>
            </motion.div>
          </div>
        </section>

        <section className="sec" id="informasi">
          <div className="wrap">
            <Reveal className="sec-h"><span className="pill">Informasi</span><h2>Apa itu SisaJadi?</h2>
              <p>Banyak UMKM menghasilkan sisa produksi yang terbuang, sementara pihak lain justru mencarinya. SisaJadi menjembatani keduanya.</p></Reveal>
            <div className="grid g3">
              {[
                [RIcon, '#E3F1E6', '#2E7D4F', 'Kurangi limbah', 'Sisa produksi seperti ampas kopi, perca kain, dan kardus tidak berakhir di tempat sampah, tetapi dipakai ulang.'],
                [Users, '#DCEFF7', '#1D6B8A', 'Hubungkan UMKM', 'Penghasil sisa bertemu pembeli, pengrajin, dan komunitas yang membutuhkan bahan baku murah.'],
                [Heart, '#FBE3D6', '#B5532A', 'Nilai ekonomi baru', 'Sisa bisa dijual, ditukar, atau didonasikan. Setiap transaksi memberi Eco Point yang bisa ditukar reward.'],
              ].map(([I, bg, fg, t, d], i) => (
                <Reveal key={t} delay={i * 0.1}><div className="card info-card">
                  <div className="ic" style={{ background: bg }}><I size={26} color={fg} /></div><h3>{t}</h3><p>{d}</p></div></Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="sec" id="menu">
          <div className="wrap">
            <Reveal className="sec-h"><span className="pill">Menu</span><h2>Semua yang kamu butuhkan</h2>
              <p>Fitur utama aplikasi SisaJadi, sama seperti di aplikasi mobile.</p></Reveal>
            <div className="grid g3">
              {[
                [Upload, '#E3F1E6', '#2E7D4F', 'Jual Sisa', 'Unggah sisa produksi lengkap dengan jumlah, harga, dan lokasi.'],
                [Repeat, '#DCEFF7', '#1D6B8A', 'Barter', 'Tukar sisa dengan sisa lain tanpa uang.'],
                [Gift, '#FBE3D6', '#B5532A', 'Request & Donasi', 'Ajukan permintaan sisa dan pantau jawaban pemilik.'],
                [Award, '#F7E7A6', '#8A6400', 'Eco Point', 'Kumpulkan poin dari transaksi dan tukar dengan reward.'],
                [Lightbulb, '#E3F1E6', '#2E7D4F', 'Ide Sisa', 'Inspirasi mengolah sisa menjadi produk baru.'],
                [MapPin, '#ECE6F6', '#6A4BA3', 'Jelajahi Terdekat', 'Cari sisa berdasarkan kategori, jenis, dan kota.'],
              ].map(([I, bg, fg, t, d], i) => (
                <Reveal key={t} delay={(i % 3) * 0.08}><div className="card menu-card">
                  <div className="ic" style={{ background: bg, width: 52, height: 52, borderRadius: 16, display: 'grid', placeItems: 'center', marginBottom: 14 }}><I size={24} color={fg} /></div>
                  <h3 style={{ fontSize: 17, marginBottom: 6 }}>{t}</h3><p className="muted" style={{ fontSize: 14, lineHeight: 1.65 }}>{d}</p></div></Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="sec" id="cara-kerja">
          <div className="wrap">
            <Reveal className="sec-h"><span className="pill">Cara kerja</span><h2>Empat langkah mudah</h2></Reveal>
            <div className="steps">
              {[['Daftar', 'Buat akun dengan email atau Google.'], ['Unggah atau cari', 'Pasang sisa produksimu atau jelajahi sisa orang lain.'], ['Ajukan & sepakati', 'Kirim request, pemilik menerima atau menolak.'], ['Dapat poin', 'Transaksi selesai, Eco Point masuk ke kedua pihak.']].map(([t, d], i) => (
                <Reveal key={t} delay={i * 0.1}><div className="card step"><div className="n">{i + 1}</div><h3 style={{ fontSize: 17, marginBottom: 6 }}>{t}</h3><p className="muted" style={{ fontSize: 14, lineHeight: 1.65 }}>{d}</p></div></Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="sec" id="dampak">
          <div className="wrap">
            <Reveal><motion.div className="impact" style={{ y: yBlob }}>
              <span className="pill" style={{ background: 'rgba(255,255,255,.2)', color: '#fff', boxShadow: 'none' }}>Dampak bersama</span>
              <h2 style={{ fontSize: 'clamp(26px,3.6vw,38px)', margin: '14px 0 0' }}>Kita sudah menyelamatkan sisa produksi</h2>
              <div className="cnt">
                <div><b><Count to={stats.umkm} /></b><span>UMKM</span></div>
                <div><b><Count to={stats.listings} /></b><span>Sisa aktif</span></div>
                <div><b><Count to={stats.selesai} /></b><span>Transaksi selesai</span></div>
                <div><b><Count to={Math.round(stats.kg)} /></b><span>Kilogram tercatat</span></div>
              </div>
            </motion.div></Reveal>
          </div>
        </section>

        <section className="sec" id="terbaru">
          <div className="wrap">
            <Reveal className="sec-h"><span className="pill">Sisa terbaru</span><h2>Baru diunggah</h2><p>Masuk untuk mengajukan request ke pemiliknya.</p></Reveal>
            <div className="grid g4">{items.map((l, i) => <ListingCard key={l.id} l={l} i={i} to={user ? '/app/sisa/' + l.id : '/masuk'} />)}</div>
            <Reveal style={{ textAlign: 'center', marginTop: 32 }}><Link to={user ? '/app/jelajahi' : '/masuk'} className="btn sec">Lihat semua sisa</Link></Reveal>
          </div>
        </section>

        <section className="sec" id="faq">
          <div className="wrap" style={{ maxWidth: 760 }}>
            <Reveal className="sec-h"><span className="pill">FAQ</span><h2>Pertanyaan umum</h2></Reveal>
            <div className="faq">
              {[['Apakah SisaJadi gratis?', 'Ya. Mendaftar, mengunggah sisa, dan mengajukan request tidak dipungut biaya.'],
                ['Sisa apa saja yang bisa diunggah?', 'Organik (ampas kopi, sisa sayur), tekstil (perca), kemasan (kardus, botol), kayu, dan lainnya.'],
                ['Bagaimana cara dapat Eco Point?', 'Setiap request yang diterima menambah 20 poin untuk pemilik dan peminta. Poin bisa ditukar reward.'],
                ['Bisa masuk dengan Google?', 'Bisa. Pilih "Lanjut dengan Google" di halaman masuk, atau buat akun baru dengan email.']].map(([q, a], i) => (
                <Reveal key={q} delay={i * 0.05}><details className="card"><summary>{q}</summary><p>{a}</p></details></Reveal>))}
            </div>
          </div>
        </section>
      </main>
      <footer className="foot"><div className="wrap"><Logo size={16} /><span>© {new Date().getFullYear()} SisaJadi. Circular economy untuk UMKM.</span></div></footer>
    </>
  )
}
