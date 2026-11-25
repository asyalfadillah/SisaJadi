# SisaJadi

Marketplace sisa produksi UMKM: jual, barter, donasi.
Situs statis (HTML, CSS, JavaScript) dengan Supabase sebagai database dan login, dipublikasikan lewat Vercel.

## Isi
- `index.html`  halaman depan: informasi, menu, tombol Masuk dan Daftar
- `app.html`    aplikasi setelah login: Beranda, Jelajahi, Jual Sisa, Profil
- `supabase/schema.sql`  tabel, RLS, dan trigger profil

## Alur
1. Jalankan `supabase/schema.sql` di Supabase (SQL Editor) bila project baru.
2. Isi `url` dan `key` (anon key publik) di `index.html` dan `app.html`.
3. Supabase, Authentication, URL Configuration: isi Site URL dengan alamat Vercel.
4. `git push origin main`. Vercel deploy otomatis.

## Catatan
Anon key memang publik. Keamanan data dijaga oleh Row Level Security.
