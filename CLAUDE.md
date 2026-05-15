# KasirPOS - Aplikasi Kasir Konter & Printing

## Tech Stack
- Next.js 16 (App Router, TypeScript, Tailwind CSS v4)
- Supabase (PostgreSQL + Auth)
- Deploy di Vercel (production)
- Package manager: pnpm

## Project Location
- Directory: /root/kasirpos
- GitHub: https://github.com/abcdefak87/KasirPOS-basic
- Production: https://kasirpos-omega.vercel.app
- Supabase project ref: ffmsnwaqtneastpmfyrx

## Database Schema (Supabase PostgreSQL)
```sql
-- Enum: kategori_type = KONTER | PRINTING
-- Enum: stok_tipe = MASUK | KELUAR

-- products: id, nama, kategori, harga_modal, harga_jual, stok, stok_minimum, created_at
-- transactions: id, product_id, jumlah, harga_modal, harga_jual, margin(generated), total_kotor(generated), total_bersih(generated), tanggal
-- stock_history: id, product_id, tipe, jumlah, keterangan, tanggal
```

## Halaman
- `/login` - Login admin
- `/` - Dashboard (ringkasan harian, alert stok)
- `/stok` - Manajemen stok (tambah barang, update stok, riwayat)
- `/penjualan` - Input transaksi penjualan
- `/rekap` - Rekap harian dengan filter tanggal
- `/api/sync-sheets` - API endpoint untuk sync ke Google Sheets

## Login Admin
- Email: admin@kasirpos.com
- Password: admin123

## Commands
```bash
pnpm build          # Build project
vercel --prod       # Deploy ke production
supabase db push    # Push migration ke Supabase
```

## Rules
- JANGAN jalankan `pnpm dev` atau dev server di sini
- Untuk deploy: commit, push ke GitHub, lalu `vercel --prod`
- Untuk perubahan database: buat file baru di `supabase/migrations/` lalu `supabase db push`
- Environment variables sudah di-set di Vercel (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY)
- File `.env.local` ada di local untuk build test, sudah di-gitignore
