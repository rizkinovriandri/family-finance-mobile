# Design System — family-finance-mobile

Diekstrak dari `design/mockup.png` (10 layar, dark mode, branding placeholder "Finora" — **jangan dipakai literal**, hanya struktur/palet/pola komponennya yang jadi acuan). Baca file ini bersamaan dengan `CLAUDE.md` setiap kali membangun atau mengubah UI, supaya hasilnya konsisten antar sesi. Nilai warna di bawah hasil sampling piksel langsung dari mockup — pembulatan kecil (±beberapa poin hex) mungkin terjadi karena anti-aliasing/gradient, sesuaikan lewat mata kalau meleset saat dipakai.

## 1. Warna

| Token | Hex | Dipakai di |
|---|---|---|
| `background` | `#080D14` | Latar belakang utama semua layar (navy nyaris hitam) |
| `backgroundElement` (surface) | `#111A24` | Card, panel, input field, tab bar container — satu tingkat lebih terang dari `background` |
| `backgroundSelected` | `#1C2A3D` | State terpilih/aktif di atas surface (perkiraan, satu tingkat lebih terang dari surface) |
| `border` | `#1C2A3D` | Garis pemisah tipis antar item list |
| `text` (primary) | `#FFFFFF` | Judul, angka, teks utama |
| `textSecondary` | `#8A94A6` | Label, subtitle, teks pendukung |
| `accent` (primary) | `#2FD6AB` | Tombol utama (mis. "Mulai", "Simpan", "Tambah Dana"), tab aktif, ikon aktif, floating action button — mint/teal, **bukan biru** |
| `success` (pemasukan) | `#06A055` (gradient ~`#039751` → `#07A960`) | Pill "Pemasukan", angka positif |
| `danger` (pengeluaran) | `#D13A54` (gradient ~`#C32443` → `#D15C69`) | Pill "Pengeluaran", angka negatif |

> Hanya `accent` (mint/teal) yang dipakai untuk aksi utama (tombol primary, tab aktif) — jangan pakai warna kategori atau success/danger sebagai warna tombol primer.

### Warna kategori (donut chart Budget — sampling dari 1 contoh set kategori)

| Kategori | Hex (dot/legend) |
|---|---|
| Transportasi | `#FBB54C` (oranye) |
| Belanja | `#D384F9` (ungu muda) |
| Tagihan | `#9EBCFB` (biru periwinkle) |
| Hiburan | `#6395F5` (biru) |
| Lainnya | `#B08BFA` (violet) |

"Makan & Minum" di mockup pakai ikon emoji/pictogram berwarna, bukan dot flat — kalau butuh warna solid untuk kategori itu, pakai salah satu warna kategori di atas yang belum kepakai (jangan duplikat warna dalam satu chart). Palet ini bukan daftar final 11 kategori pengeluaran di `AGENTS.md`/`CLAUDE.md` Bagian 5 — perluas sendiri dengan hue senada (saturated, mid-brightness, kontras cukup di atas `background`) saat kategori lain butuh warna.

## 2. Tipografi & Radius

- Semua teks putih (`text`) di atas navy gelap — kontras tinggi, tanpa border tebal, dark mode sebagai satu-satunya tema (bukan pilihan, ini tema utama app)
- Card/button radius besar & konsisten: card ~20px, button/pill ~16px, chip kategori & badge ~full (pill/circle)
- Card tidak pakai border terlihat — dibedakan dari background murni lewat sedikit perbedaan brightness (`backgroundElement` vs `background`), bukan garis tepi

## 3. Pola Komponen yang Berulang

- **Ringkasan/metric card**: card besar di atas, angka besar+bold, ada aksi kecil (mis. ikon mata untuk toggle visibility saldo)
- **Pill dua-kolom Pemasukan/Pengeluaran**: dua card kecil bersebelahan, fill solid warna `success`/`danger`, ikon tetes air + label + nominal
- **Quick action row**: 4 chip ikon bulat (`backgroundElement` bg) + label kecil di bawahnya, horizontal, dipakai di Beranda (Tambah Transaksi/Transfer/Atur Budget/Lainnya)
- **List transaksi/goal**: leading icon bulat berwarna kategori, title + subtitle (kategori/tanggal), trailing value berwarna success/danger, semua di dalam row rounded di atas `backgroundElement`
- **Filter pill row**: pill horizontal (Semua/Pemasukan/Pengeluaran, dst), aktif = fill `accent` atau `backgroundSelected`, tidak aktif = `textSecondary`
- **Progress bar**: track `backgroundElement`/gelap, fill `accent` (goal, sisa budget) — rounded penuh
- **Donut chart**: dipakai di Budget, total di tengah, legend list di bawah dengan dot warna + label + persen + nominal
- **Category grid (form)**: grid 4 kolom, tiap kategori = icon bulat berwarna + label kecil di bawah, kategori terpilih dapat ring/highlight
- **Floating Action Button**: lingkaran `accent` solid, ikon "+", posisi bottom-right menempel di atas tab bar (dipakai di layar Transaksi)
- **Bottom tab bar**: 5 tab — **Beranda, Transaksi, Budget, Tujuan, Profil** (bukan "Laporan"/"Lainnya") — ikon+label, aktif = `accent`, tidak aktif = `textSecondary`. Konsisten muncul di semua layar utama, hilang di layar detail/form (Tambah Transaksi, Detail Tujuan, Pengaturan Akun)
- **Settings list row**: leading icon kecil (bg `backgroundElement` bulat), label + sublabel, trailing chevron atau toggle switch (`accent` saat on) — dipakai di Profil & Pengaturan Akun
- **Tombol primary**: fill `accent` solid, teks putih, radius besar, lebar penuh (mis. "Mulai", "Simpan", "Tambah Dana")
- **Tombol secondary/outline**: bg `backgroundElement` atau transparan + border tipis, dipakai untuk aksi kedua (mis. "Ubah Target")
- **Aksi destruktif** ("Keluar" di Pengaturan Akun): teks/ikon merah (`danger`), bukan tombol solid — beda treatment dari tombol primary

## 4. Struktur Navigasi (dari mockup, referensi utama)

5 tab: **Beranda → Transaksi → Budget → Tujuan → Profil**. Layar sekunder (Detail Tujuan, Tambah Transaksi, Insight, Pengaturan Akun) diakses dari dalam tab terkait, bukan tab tersendiri — tab bar hilang di layar-layar ini (pola stack push, bukan tab).

`Insight` (grafik tren + kategori terbesar) kemungkinan diakses lewat "Lihat Semua" di card "Ringkasan Bulan Ini" pada Beranda — bukan bagian dari 5 tab utama.

> Implementasi tab saat ini di kode (`src/components/app-tabs.tsx`) masih pakai nama lama (Beranda/Transaksi/Budget/**Laporan**/**Lainnya**) — perlu disesuaikan jadi Tujuan & Profil mengikuti mockup ini (lihat task selanjutnya).
