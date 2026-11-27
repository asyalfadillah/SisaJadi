# SisaJadi (web)

Marketplace circular economy untuk sisa produksi UMKM: jual, barter, donasi, Eco Point.
Vite + React, Supabase (Auth + Postgres + RLS), deploy di Vercel.

## Halaman
- `/` landing: informasi, menu, cara kerja, dampak, FAQ, tombol Masuk/Daftar, animasi per section
- `/masuk` masuk, daftar (email), atau Google
- `/app` aplikasi: Beranda, Jelajahi, Jual Sisa, Favorit, Permintaan, Eco Point, Ide Sisa, Profil
- `/app/admin` panel admin (hanya akun role admin): akun, sisa, request, reward

## Menjalankan
```
npm install
cp .env.example .env   # isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY
npm run dev
```

## Supabase
- Tabel dan RLS ada di migrasi `sisajadi_schema` (ringkasan di `supabase/schema.sql`).
- Admin: email di tabel `sj_admin_emails` otomatis jadi admin saat login.
- Login Google: Supabase > Authentication > Providers > Google (isi Client ID/Secret),
  lalu Authentication > URL Configuration: Site URL = alamat Vercel dan tambahkan `https://<domain>/app` ke Redirect URLs.
- Anon key bersifat publik; keamanan data dijaga RLS.
