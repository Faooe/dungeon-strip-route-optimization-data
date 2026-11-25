DATA OTOMATIS DUNGEON STRIP — FASE 2
====================================

Tidak ada responden, permainan manual, atau data pemain pada penelitian ini.
Komputer menghasilkan graf rute dan mengukur strukturnya secara otomatis.

Isi paket
---------
phase2.mjs              Kode empat metode dan analisis statistik.
phase2_validate.py      Penghitungan ulang independen semua peta dan metrik.
sensitivity.py          Uji kepekaan definisi hadiah/risiko (eksploratori).
plot_phase2.py          Pembuat dua grafik dari data mentah (matplotlib).
seed_id_mapping.json    Pemetaan ID seed naskah ke masukan generator.
BACA_ID_SEED.txt         Penjelasan ID seed dan contoh U0013.
PHASE2_PROTOCOL.txt     Desain yang ditetapkan sebelum uji 1.000 seed baru.
PHASE2_LAPORAN.txt      Hasil, penafsiran, dan batas klaim.
phase2_dev/             90 seed pengembangan, 360 peta.
phase2_test/            1.000 seed pengujian, 4.000 peta.

Di tiap folder data:
maps.jsonl          Satu baris JSON per peta, termasuk seed, metode, susunan
                    jenis ruang, koneksi, metrik, dan jumlah kandidat.
summary.json        Statistik deskriptif dan selang bootstrap berpasangan.
manifest.json       Parameter, versi Node.js, dan SHA-256 sumber game.
validation.json     Hasil audit independen.
logika_snapshot.js  Snapshot sumber fungsi rute dari game saat eksperimen.

Di phase2_test/ juga ada sensitivity.json, structural_outcomes.png, dan
generation_time.png. Tanggal seed adalah input generator, bukan tanggal
permainan atau pengamatan peserta.

Metrik utama
------------
- minimum_best_reward: peluang hadiah Peti/Toko terbaik yang masih dapat
  dicapai dari titik awal yang paling kurang beruntung.
- reward_gap: selisih peluang hadiah terbaik antar titik awal.
- worst_risk_streak: rentetan Elite/Tantangan terpanjang pada jalur mana pun.
- unique_path_share: proporsi urutan jenis ruang unik di semua jalur.

Toko dihitung sebagai kesempatan, bukan barang yang pasti dibeli. Elite dan
Tantangan dikelompokkan sebagai risiko tinggi. Uji sensitivitas dengan definisi
lain tersedia agar pembaca bisa melihat batas kesimpulan ini.

Reproduksi
-----------
Memerlukan Node.js dan Python 3. Dari folder paket:

  node phase2.mjs --source phase2_test/logika_snapshot.js --self-check
  node phase2.mjs --source phase2_test/logika_snapshot.js --start 2024-01-01 --count 1000 --out ulang
  python phase2_validate.py ulang
  python sensitivity.py ulang

Peta, metrik, dan jumlah evaluasi akan sama; waktu proses bergantung pada
komputer. plot_phase2.py memerlukan matplotlib jika grafik ingin dibuat ulang.

Lihat PHASE2_LAPORAN.txt untuk penafsiran hasil. Data ini belum mengukur
keseruan, rasa adil menurut pemain, kemenangan, atau durasi ekspedisi.
