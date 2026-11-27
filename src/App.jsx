import { Route, Routes, Navigate } from 'react-router-dom'
import Landing from './pages/Landing'
import Auth from './pages/Auth'
import AppLayout from './pages/AppLayout'
import Home from './pages/Home'
import Explore from './pages/Explore'
import Detail from './pages/Detail'
import Sell from './pages/Sell'
import Favorites from './pages/Favorites'
import Requests from './pages/Requests'
import EcoPoint from './pages/EcoPoint'
import Ide from './pages/Ide'
import Profile from './pages/Profile'
import Admin from './pages/Admin'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/masuk" element={<Auth />} />
      <Route path="/app" element={<AppLayout />}>
        <Route index element={<Home />} />
        <Route path="jelajahi" element={<Explore />} />
        <Route path="sisa/:id" element={<Detail />} />
        <Route path="jual" element={<Sell />} />
        <Route path="favorit" element={<Favorites />} />
        <Route path="permintaan" element={<Requests />} />
        <Route path="eco-point" element={<EcoPoint />} />
        <Route path="ide" element={<Ide />} />
        <Route path="profil" element={<Profile />} />
        <Route path="admin" element={<Admin />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
