@AGENTS.md

# CLAUDE.md — family-finance-mobile

Dokumen ini adalah blueprint & panduan kerja untuk Claude Code saat mengembangkan project ini. Dibaca otomatis di setiap sesi baru — selalu update bagian "Fitur & Scope" (Bagian 6) setelah menyelesaikan suatu task.

## 1. Project Overview

Aplikasi mobile (Expo/React Native) untuk pencatatan keuangan kolaboratif keluarga — companion app dari **family-finance-app** (versi web/PWA, Next.js). Kedua aplikasi berbagi **backend Supabase yang sama** (satu project, satu skema database), sehingga data yang dicatat lewat web maupun mobile langsung sinkron real-time untuk seluruh anggota keluarga.

Project ini tidak mendesain ulang skema data atau aturan bisnis — semuanya mengikuti apa yang sudah didefinisikan di `../family-finance-app/CLAUDE.md` (lihat Bagian 4 & 5 di bawah, disalin sebagai acuan cepat). Kalau skema di project web berubah, sinkronkan juga referensi di sini.

## 2. Tech Stack

- **Framework:** Expo (React Native) + Expo Router + TypeScript
- **Backend/Database:** Supabase (PostgreSQL + Auth + Realtime) — **project & skema sama dengan `family-finance-app`**, lihat `src/lib/supabase.ts` dan `src/lib/database.types.ts`
- **State/data-fetching:** (belum ditentukan — diskusikan sebelum menambah library seperti TanStack Query/Zustand)
- **Styling/UI:** komponen native (`react-native` + Expo SDK), mengikuti `design/design-system.md` (di-ekstrak dari `design/mockup.png`) sebagai acuan — dark mode, aksen mint/teal `#2FD6AB` (bukan biru seperti di web)
- **Icon pack:** `@tabler/icons-react-native` — set ikon yang sama dengan `family-finance-app` (`@tabler/icons-react`). Semua ikon UI (tab bar, tombol, dsb.) diimpor lewat satu titik: `src/components/icons.tsx`. Ikon diimpor **per file** (`@tabler/icons-react-native/IconHome`), jangan dari barrel paketnya — barrel me-load ±6.000 file dan bikin Metro kena `EMFILE`. Ikon baru = tambah satu baris `export` di `icons.tsx`. Tab bar memakai tab berbasis JS (`expo-router/ui`), bukan `NativeTabs`, supaya bisa menampilkan ikon Tabler di Android.
- **Storage sesi:** `@react-native-async-storage/async-storage` untuk persist session Supabase Auth

Jangan menyarankan library/stack lain di luar ini kecuali didiskusikan ulang. Selalu pakai `npx expo install` untuk menambah dependency (lihat `AGENTS.md`).

## 3. Struktur Folder & Konvensi Kode

```
src/
  app/                 → routes (Expo Router) — setiap file = 1 screen, _layout.tsx = navigator
  components/          → shared UI components
  hooks/                → custom hooks (mis. use-theme, use-color-scheme)
  constants/            → konstanta (theme, kategori/enum — mirror Bagian 5)
  lib/
    supabase.ts          → client init Supabase
    database.types.ts     → TypeScript types hasil generate/mirror dari skema Supabase
```

- Gunakan **functional components** + hooks, tanpa class component
- Semua teks UI dalam **Bahasa Indonesia**
- Query Supabase selalu lewat helper di `src/lib/` (atau modul data terpisah per fitur), jangan panggil client langsung dari dalam JSX komponen tanpa lapisan query
- Environment variables (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`) untuk kredensial Supabase, jangan pernah hardcode — lihat `.env.example`
- Non-route code (components, hooks, lib, constants) tetap di luar `src/app/`, sesuai aturan Expo Router di `AGENTS.md`

## 4. Skema Database

**Sumber kebenaran skema ada di project `family-finance-app`** (migration Supabase dikelola dari sana). Ringkasan tabel utama (detail lengkap kolom: lihat `../family-finance-app/CLAUDE.md` Bagian 4, atau `src/lib/database.types.ts` di project ini untuk tipe TypeScript-nya):

- `families` — satu keluarga = satu ruang data bersama
- `family_members` — relasi user ↔ keluarga, hak akses setara (tidak ada role admin/viewer), join lewat `invite_code`
- `accounts` — daftar akun/rekening keluarga; `current_balance` **tidak disimpan**, dihitung dari `opening_balance` + akumulasi transaksi (lihat view `account_balances`)
- `categories` / `subcategories` — kategori transaksi (default global + custom per keluarga) dan rincian sub kategori
- `transactions` — transaksi income/expense/transfer; `amount` **selalu positif**, arah ditentukan `type`
- `budgets` — target anggaran bulanan per kategori/sub kategori; realisasi dihitung otomatis (lihat view `budget_realizations`), tidak disimpan sebagai kolom
- `investment_holdings` — portofolio investasi (Fase 2 di web) per akun bertipe Investasi

Jangan menambah/mengubah skema dari sisi mobile — perubahan skema selalu lewat migration di `family-finance-app`, lalu sinkronkan `src/lib/database.types.ts` di sini.

> **Catatan:** `design/mockup.png` punya tab "Tujuan" (savings goals — target tabungan + progress bar) yang **belum ada tabelnya** di skema manapun (bukan `accounts.priority_goal`, itu cuma teks bebas). Perlu desain skema baru (mis. tabel `goals`) sebelum fitur ini bisa diimplementasikan — desain & migration-nya tetap harus lewat `family-finance-app` dulu (sumber kebenaran skema), baru disinkronkan ke sini.

## 5. Proses Bisnis & Aturan Transaksional

Aturan ini **wajib diikuti** karena aplikasi mobile berbagi data dengan web — logic yang tidak konsisten antar keduanya akan merusak integritas data bersama:

1. **Jumlah transaksi selalu angka positif.** Arah dana (masuk/keluar) ditentukan oleh kolom `type` (Pemasukan/Pengeluaran), bukan tanda minus pada `amount`.
2. **Transfer antar akun dicatat sebagai 2 baris transaksi terpisah**: satu baris Pengeluaran dari akun asal, satu baris Pemasukan ke akun tujuan, keduanya berkategori "Transfer Antar Akun", dihubungkan lewat `transfer_pair_id`.
3. **Saldo akun (`current_balance`) selalu dihitung otomatis**, tidak boleh diedit manual oleh user.
4. **Budget realisasi dihitung otomatis** dari transaksi expense yang cocok kategori + bulan — user hanya input `target_amount`.
5. Setiap transaksi tercatat atas nama **satu anggota keluarga tertentu** (`family_member_id`).

### Enum (mirror dari `src/lib/database.types.ts`)

- **Jenis Akun:** Tabungan, Giro, Deposito, Investasi Saham, Investasi Reksadana, Investasi Obligasi, Investasi Emas, Investasi Kripto, Dana Pensiun, E-Wallet, Kas Tunai, Kartu Kredit, Pinjaman/Utang, Lainnya
- **Status Akun:** Aktif, Nonaktif, Ditutup
- **Mata Uang:** IDR, USD, SGD, EUR, JPY
- **Jenis Transaksi:** Pemasukan, Pengeluaran, Transfer Antar Akun
- **Metode Pembayaran:** Tunai, Transfer Bank, Kartu Debit, Kartu Kredit, E-Wallet, Autodebet, Qris, Lainnya
- **Kategori Pemasukan:** Gaji, Bonus/THR, Hasil Investasi, Hadiah/Pemberian, Pendapatan Lainnya
- **Kategori Pengeluaran:** Makanan & Minuman, Transportasi, Tagihan & Utilitas, Pendidikan, Kesehatan, Hiburan, Belanja, Cicilan/Utang, Donasi/Sedekah, Perawatan Rumah, Pengeluaran Lainnya

## 6. Fitur & Scope

Target MVP mobile (mengikuti scope MVP web + struktur navigasi dari `design/mockup.png`, urutan pengerjaan bisa disesuaikan):

- [x] Auth (login/register, join/buat keluarga via kode undangan) memakai Supabase Auth + session persist (AsyncStorage) — `src/app/(auth)/`, `src/app/(onboarding)/family-setup.tsx`
- [x] Bottom tab navigation: **Beranda, Akun, Transaksi, Budget, Laporan, Lainnya** (6 tab — lihat catatan di Bagian 8, ini keputusan sadar yang beda dari `design/mockup.png` yang cuma punya 5 slot) — `src/app/(app)/`, masih placeholder kosong kecuali Akun & Lainnya
- [x] Manajemen akun (list, tambah, edit, hapus, toggle akun default, filter Tabungan/Investasi) — `src/app/(app)/accounts/`, layout mengikuti `family-finance-app/components/AccountsManager.tsx` (tanpa fitur Fase 2: net worth, sesuaikan saldo, realtime sync, refresh harga saham otomatis)
- [x] Portofolio investasi — akun bertipe Investasi di tab Akun bisa diklik → `src/app/(app)/accounts/[id]/holdings/` (list holding + total nilai/untung-rugi, tambah, ubah, hapus). Field per kategori (reksadana/obligasi-sukuk/saham/emas) ikut skema `investment_holdings`, kategori otomatis dari `account_type` (lihat `getInvestmentCategoryForAccountType` di `src/constants/enums.ts`)
- [x] Lainnya (halaman "Profil & Pengaturan") — `src/app/(app)/more/`, mengikuti `family-finance-app/app/(main)/more`: kartu profil (foto/inisial, nama, email), kode undangan + tombol Salin (`expo-clipboard`), menu Edit Profil (`profile.tsx`, ubah nama & nama keluarga), Kelola Kategori (`categories.tsx` + `category-form.tsx`, kategori per jenis + sub kategori inline, pilih ikon `icon-picker.tsx`), Tanggal Awal (`start-date.tsx`, tanggal mulai siklus bulan 1–28), Tentang Aplikasi (versi dari `app.json`), dan Keluar. Ganti foto profil di `profile.tsx` (`expo-image-picker`, potong persegi, JPG/PNG/WEBP maks. 2MB, upload ke bucket `avatars` via `uploadAvatar`/`updateAvatarUrl` di `queries/families.ts`; butuh rebuild dev build karena plugin baru di `app.json`). "Install Hint" milik web (PWA) sengaja tidak ada.
- [x] CRUD transaksi (income/expense/transfer, sesuai Bagian 5) — `src/app/(app)/transactions/` (daftar, `new`, `[id]`). Content card mengikuti `family-finance-app/components/TransactionsManager.tsx` (`src/components/transaction-card.tsx`): Tambah Cepat, pencarian, tab Semua/Pemasukan/Pengeluaran, filter kategori, grup tanggal. Form di `src/components/transaction-form.tsx` (validasi Zod di `src/lib/validation/transaction.ts`, query di `src/lib/queries/transactions.ts`). Transfer = 2 baris via `transfer_pair_id`, hapus transfer menghapus keduanya, transfer tidak bisa diubah. Tanggal diketik `YYYY-MM-DD` + pintasan Hari ini/Kemarin (belum ada date picker native). Daftar dipakai bersama lewat `src/components/transactions-manager.tsx` (prop `filterAccountId`) — tab Transaksi dan **Riwayat per akun** (`accounts/[id]/history.tsx`, tautan "Riwayat" di kartu akun; judul "Riwayat · {akun}", form tambah otomatis memilih akun itu). **Belum:** Scan Struk.
- [x] Budget bulanan per kategori (target + realisasi otomatis) — `src/app/(app)/budget/` (daftar, `new`, `[id]`), mengikuti `family-finance-app/components/BudgetsManager.tsx`: navigator bulan (siklus `month_start_day`), total anggaran + progress bar, donut "% Terpakai" (`DonutChart` prop `centerPercentage`), kartu per kategori yang bisa di-expand ke rincian sub kategori (status Aman/Waspada/Melebihi), kartu "Di Luar Budget" di bawah daftar kategori (pengeluaran bulan ini yang kategorinya belum dianggarkan, `listUnbudgetedExpenses`), duplikasi ke bulan berikutnya, buat/ubah/hapus. Query `src/lib/queries/budgets.ts`, form `src/components/budget-form.tsx`. Realisasi dari view `budget_realizations`. Realtime sync terpasang (budgets, transactions, categories, subcategories, accounts).
- [x] Beranda: total saldo (net worth, toggle sembunyikan), pill pemasukan/pengeluaran bulan ini, quick actions, grafik tren 6 bulan, pengeluaran per kategori, realisasi anggaran + alert melebihi — `src/app/(app)/index.tsx`, query di `src/lib/queries/dashboard.ts`. Quick action "Tambah Transaksi"/"Transfer" masih mengarah ke tab Transaksi (placeholder) sampai CRUD transaksi jadi
- [x] Laporan — `src/app/(app)/reports.tsx`, mengikuti `family-finance-app/components/ReportsView.tsx`: tab Pengeluaran/Pemasukan (total siklus bulan + persen vs bulan lalu, filter kategori, grafik mingguan W1–W4 `weekly-bar-chart.tsx`, 5 kategori terbesar) dan tab Net Worth (`net-worth-view.tsx`: total kekayaan bersih, komposisi tabungan/investasi, liabilitas, mata uang lain, daftar akun aset & liabilitas dengan `account-type-icon.tsx`). Query `src/lib/queries/reports.ts`; `computeNetWorth` sekarang juga mengembalikan `asetAccounts`/`liabilitasAccounts`. Transfer & Penyesuaian Saldo dikecualikan. Realtime sync terpasang (transactions, categories; tab Net Worth punya langganan sendiri).
- [x] Realtime sync (Supabase Realtime) antar anggota keluarga & antar platform (web ↔ mobile) — hook `src/hooks/use-realtime-tick.ts` (`useRealtimeTick(tables, familyId)` → penghitung yang naik saat ada perubahan di tabel keluarga itu, digabung 300 ms, plus saat aplikasi kembali aktif dari background). Cara pakai: masukkan `reloadTick` ke dependency fungsi muat data layar. Terpasang di Beranda, Akun, Portofolio, Transaksi/Riwayat, Budget, Laporan (+ Net Worth), dan Kelola Kategori. Tabel harus ada di publication `supabase_realtime` (migrasi di `family-finance-app`). Belum: `families`/`family_members` (nama keluarga/profil anggota lain).

> Fitur "Tujuan" (savings goals) di mockup **tidak dipakai** — diganti tab Akun & Laporan atas permintaan eksplisit. Skemanya juga memang belum pernah didesain (lihat catatan di Bagian 4) — kalau mau diangkat lagi nanti, itu prasyaratnya.

Fase berikutnya (di luar MVP, menyusul setelah web-nya matang): net worth tracking, refresh harga saham otomatis, scan struk (OCR), notifikasi push untuk reminder tagihan.

## 7. Aturan/Batasan Khusus

- Jangan pernah expose Supabase service role key di client — hanya `anon key` (`EXPO_PUBLIC_SUPABASE_ANON_KEY`) yang boleh dipakai
- Semua form input pakai validasi (mis. Zod) sebelum submit ke Supabase
- RLS di Supabase sudah membatasi akses per `family_id` — jangan asumsikan perlu filter tambahan di client demi keamanan, tapi tetap filter query secara eksplisit untuk kebenaran data
- Semua teks UI dalam Bahasa Indonesia
- Jangan hardcode kategori/enum di banyak tempat — sentralisasi di `src/constants/`, mengacu ke Bagian 5
- `ios/` dan `android/` (kalau nanti muncul) adalah hasil generate (CNG) — jangan diedit manual, konfigurasi native lewat `app.json`/config plugin (lihat `AGENTS.md`)

## 8. UI & Design System

Acuan resmi: **`design/design-system.md`** (di-ekstrak dari `design/mockup.png`, 10 layar) — baca file itu bersamaan dengan `CLAUDE.md` ini setiap kali membangun/mengubah komponen UI. Ringkasan cepat:

- **Dark mode** sebagai tema utama, latar navy nyaris hitam (`#080D14`), card sedikit lebih terang (`#111A24`)
- Aksen utama **mint/teal `#2FD6AB`** (bukan biru) — dipakai di tombol primary, tab aktif, floating action button
- `success` (pemasukan) hijau `#06A055`, `danger` (pengeluaran) merah `#D13A54` — beda dari `accent`, jangan ditukar
- Pola berulang: metric card, pill Pemasukan/Pengeluaran, quick action row, donut chart Budget, list transaksi dengan ikon kategori bulat, bottom tab bar
- Token warna sudah diterapkan di `src/constants/theme.ts` (`Colors.dark`/`Colors.light`) — pakai lewat `useTheme()`/`ThemedView`/`ThemedText`, jangan hardcode hex baru di komponen

> Mockup pakai branding placeholder "Finora" — jangan dipakai literal, hanya struktur/palet/pola komponennya yang jadi acuan.

**Penyimpangan sadar dari mockup:** navbar aplikasi ini **6 tab** (Beranda, Akun, Transaksi, Budget, Laporan, Lainnya), bukan 5 tab seperti mockup (Beranda, Transaksi, Budget, Tujuan, Profil) — permintaan eksplisit user supaya ada tab Akun langsung di navbar dan penamaan "Laporan"/"Lainnya" konsisten dengan `family-finance-app`. Style bar-nya (flat, edge-to-edge, ikon di atas label) tetap ikut mockup, cuma isi & jumlah tab-nya beda. Layout layar Akun juga sengaja diadaptasi dari `family-finance-app/components/AccountsManager.tsx` (bukan dari mockup, yang tidak punya layar Akun sama sekali) — kartu akun dengan toggle akun default (★), filter Tabungan/Investasi, dan card total saldo, minus fitur Fase 2 (net worth, portofolio investasi, sesuaikan saldo).

## 9. Perintah Umum

```bash
npx expo start              # jalankan dev server
npx expo start --android    # jalankan di Android
npx expo start --ios        # jalankan di iOS
npx expo lint                # lint
npx tsc --noEmit             # typecheck
npx expo install <package>   # tambah dependency (resolve versi kompatibel SDK)
```

---
*Update bagian checklist di Bagian 6 setiap kali fitur selesai dikerjakan, supaya jadi tracker progres yang akurat.*
