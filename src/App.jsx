import { Route, Routes, Navigate } from 'react-router-dom'
import Landing from './pages/Landing'
import Auth from './pages/Auth'
import AppLayout from './pages/AppLayout'
import Home from './pages/Home'
import Explore from './pages/Explore'
import { Categories, CategoryItems } from './pages/Categories'
import MapPage from './pages/MapPage'
import Detail from './pages/Detail'
import { RequestSisa, KonfirmasiRequest, PenawaranBarter, RequestBerhasil } from './pages/RequestFlow'
import { Sell, ListingPublished, ListingView } from './pages/Listings'
import Requests from './pages/Requests'
import { ChatList, ChatRoom, Notifikasi } from './pages/Chat'
import { JadwalPickup, KonfirmasiPickup, DetailPickup } from './pages/Pickup'
import { Misi, DetailMisi, RiwayatMisi, PengaturanMisi, Streak } from './pages/Missions'
import { Favorites, Peringkat, Komunitas, PapanKomunitas, DetailKomunitas } from './pages/Social'
import EcoPoint, { Reward, DetailReward, Voucher, Lencana, Dampak, RingkasanDampak, RiwayatDampak, RincianDampak, Sertifikat } from './pages/EcoPoint'
import { Ide, HasilIde, Bantuan, DetailBantuan, Hubungi, Profile, EditProfil, Pengaturan, PengNotif, Privasi, Tentang, Onboarding } from './pages/More'
import Admin from './pages/Admin'
import Penyedia from './pages/Penyedia'
import { Checkout, DaftarPembayaran, DetailPembayaran, Dompet } from './pages/Pembayaran'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/masuk" element={<Auth />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/app" element={<AppLayout />}>
        <Route index element={<Home />} />
        <Route path="jelajahi" element={<Explore />} />
        <Route path="kategori" element={<Categories />} />
        <Route path="kategori/:name" element={<CategoryItems />} />
        <Route path="peta" element={<MapPage />} />
        <Route path="sisa/:id" element={<Detail />} />
        <Route path="sisa/:id/request" element={<RequestSisa />} />
        <Route path="sisa/:id/konfirmasi" element={<KonfirmasiRequest />} />
        <Route path="sisa/:id/barter" element={<PenawaranBarter />} />
        <Route path="request-berhasil/:id" element={<RequestBerhasil />} />
        <Route path="jual" element={<Sell />} />
        <Route path="listing/:id" element={<ListingView />} />
        <Route path="listing/:id/edit" element={<Sell />} />
        <Route path="listing-terbit/:id" element={<ListingPublished />} />
        <Route path="favorit" element={<Favorites />} />
        <Route path="permintaan" element={<Requests />} />
        <Route path="chat" element={<ChatList />} />
        <Route path="chat/:id" element={<ChatRoom />} />
        <Route path="notifikasi" element={<Notifikasi />} />
        <Route path="pickup/jadwal/:requestId" element={<JadwalPickup />} />
        <Route path="pickup/konfirmasi/:requestId" element={<KonfirmasiPickup />} />
        <Route path="pickup/:id" element={<DetailPickup />} />
        <Route path="misi" element={<Misi />} />
        <Route path="misi/streak" element={<Streak />} />
        <Route path="misi/riwayat" element={<RiwayatMisi />} />
        <Route path="misi/pengaturan" element={<PengaturanMisi />} />
        <Route path="misi/:id" element={<DetailMisi />} />
        <Route path="peringkat" element={<Peringkat />} />
        <Route path="komunitas" element={<Komunitas />} />
        <Route path="komunitas/papan" element={<PapanKomunitas />} />
        <Route path="komunitas/:id" element={<DetailKomunitas />} />
        <Route path="eco-point" element={<EcoPoint />} />
        <Route path="reward" element={<Reward />} />
        <Route path="reward/:id" element={<DetailReward />} />
        <Route path="voucher" element={<Voucher />} />
        <Route path="lencana" element={<Lencana />} />
        <Route path="dampak" element={<Dampak />} />
        <Route path="dampak/ringkasan" element={<RingkasanDampak />} />
        <Route path="dampak/riwayat" element={<RiwayatDampak />} />
        <Route path="dampak/rincian" element={<RincianDampak />} />
        <Route path="dampak/sertifikat" element={<Sertifikat />} />
        <Route path="ide" element={<Ide />} />
        <Route path="ide/hasil" element={<HasilIde />} />
        <Route path="bantuan" element={<Bantuan />} />
        <Route path="bantuan/hubungi" element={<Hubungi />} />
        <Route path="bantuan/:id" element={<DetailBantuan />} />
        <Route path="profil" element={<Profile />} />
        <Route path="profil/edit" element={<EditProfil />} />
        <Route path="pengaturan" element={<Pengaturan />} />
        <Route path="pengaturan/notifikasi" element={<PengNotif />} />
        <Route path="pengaturan/privasi" element={<Privasi />} />
        <Route path="pengaturan/tentang" element={<Tentang />} />
        <Route path="penyedia" element={<Penyedia />} />
        <Route path="bayar/:requestId" element={<Checkout />} />
        <Route path="pembayaran" element={<DaftarPembayaran />} />
        <Route path="pembayaran/:id" element={<DetailPembayaran />} />
        <Route path="dompet" element={<Dompet />} />
        <Route path="admin" element={<Admin />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
