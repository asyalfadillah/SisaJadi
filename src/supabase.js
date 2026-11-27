import { createClient } from '@supabase/supabase-js'

// URL dan anon key bersifat publik. Keamanan data dijaga oleh Row Level Security.
const url = import.meta.env.VITE_SUPABASE_URL || 'https://ahxxajcevfkcxlgpnlye.supabase.co'
const key =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFoeHhhamNldmZrY3hsZ3BubHllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUyMTY2MTEsImV4cCI6MjEwMDc5MjYxMX0.V04MXkIhBss8N9ALCuPWiDhzWsOpdbNR2qyRwpkvpNM'

export const supabase = createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
})

export const rupiah = (n) => (n > 0 ? 'Rp ' + Number(n).toLocaleString('id-ID') : 'Gratis')
export const CATEGORIES = ['Organik', 'Tekstil', 'Kemasan', 'Kayu', 'Lainnya']
export const MODES = ['Jual', 'Barter', 'Donasi']
export const timeAgo = (iso) => {
  const s = (Date.now() - new Date(iso).getTime()) / 1000
  if (s < 3600) return Math.max(1, Math.floor(s / 60)) + ' menit lalu'
  if (s < 86400) return Math.floor(s / 3600) + ' jam lalu'
  return Math.floor(s / 86400) + ' hari lalu'
}
