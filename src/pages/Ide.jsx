import { Lightbulb } from 'lucide-react'
import Topbar from '../components/Topbar'
import { Reveal } from '../components/ui'

const IDEAS = [
  ['Ampas kopi jadi scrub alami', '5 ide · 3 menit', ['Scrub tubuh: campur ampas kopi kering dengan minyak kelapa dan sedikit gula.', 'Pupuk kompos: taburkan tipis pada tanaman pot.', 'Penghilang bau: letakkan dalam wadah terbuka di kulkas.', 'Lilin aroma kopi dengan campuran lilin soya.', 'Media tanam jamur tiram.']],
  ['Perca kain jadi tote bag', '4 ide · 4 menit', ['Tote bag patchwork dari perca warna-warni.', 'Sarung bantal dan cover tisu.', 'Scrunchie dan bandana.', 'Keset dari kepangan perca.']],
  ['Kardus bekas jadi organizer', '6 ide · 3 menit', ['Kotak penyimpanan meja.', 'Rak sepatu bertingkat.', 'Pot tanaman dari kardus tebal.', 'Papan permainan edukasi anak.', 'Wadah kabel.', 'Partisi laci.']],
]
export default function Ide() {
  return (
    <>
      <Topbar title="Ide Sisa" sub="Inspirasi mengolah sisa produksi" back={false} />
      <div className="grid g3">
        {IDEAS.map(([t, m, steps], i) => (
          <Reveal key={t} delay={i * 0.08}><div className="card" style={{ padding: 22, height: '100%' }}>
            <div className="lic" style={{ height: 70, width: 70, background: '#E3F1E6', marginBottom: 14 }}><Lightbulb size={30} color="#2E7D4F" /></div>
            <h3>{t}</h3><div className="muted" style={{ fontSize: 13, margin: '4px 0 12px' }}>{m}</div>
            <ul style={{ paddingLeft: 18, lineHeight: 1.7, fontSize: 14 }}>{steps.map((s) => <li key={s}>{s}</li>)}</ul>
          </div></Reveal>))}
      </div>
    </>
  )
}
