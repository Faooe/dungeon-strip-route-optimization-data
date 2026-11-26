# Reproduksi data Dungeon Strip

Jalankan perintah dari akar salinan repositori baru. Naskah Word/PDF tidak ada di
repositori. Kode game yang dipakai ialah
`Studi_Rute_Fase2/phase2_test/logika_snapshot.js` dengan SHA-256
`b1d5cbe36149f8d529608e3fd81e9d18c2888f70855f368aec64d5d514d7a9ca`.
Eksperimen tidak memakai pemain atau responden. Bentuk tanggal pada masukan
generator adalah kode deterministik, bukan waktu pengamatan.

## Lingkungan

Pengujian utama menggunakan Node.js v22.20.0. Pengukuran ulang waktu menggunakan
Node.js v24.22.3 pada Windows 11 64-bit, AMD Ryzen 7 8845HS, RAM 8 GB.
Analisis Python dijalankan dengan Python 3.12.14, NumPy 2.5.5, Matplotlib
3.11.2, dan Pillow 13.0.0. Instal paket Python dengan
`python -m pip install -r requirements.txt`. Versi Node.js 24 dapat dipakai
untuk pengulangan; angka waktu tidak diharapkan identik antarperangkat.

## Jalur dari peta mentah ke hasil

1. Jalankan empat metode pada 1.000 masukan uji. Perintah ini menulis ulang
   `phase2_test`, sehingga gunakan salinan repositori baru.

   ```sh
   node Studi_Rute_Fase2/phase2.mjs --source Studi_Rute_Fase2/phase2_test/logika_snapshot.js --start 2024-01-01 --count 1000 --out Studi_Rute_Fase2/phase2_test
   ```

   Keluaran utama ialah `phase2_test/maps.jsonl` (4.000 peta) dan
   `phase2_test/summary.json`. `generation_ms`, waktu pembuatan, dan cap waktu
   manifest dapat berbeda; peta, metrik struktur, dan jumlah evaluasi harus
   cocok. Arsip pengembangan 90 masukan dan protokol pemilihan empat titik
   awal ada di `PHASE2_PROTOCOL.txt` dan `phase2_dev`.

2. Hitung optimum eksak, statistik, dan pemeriksaan terpisah.

   ```sh
   python Studi_Rute_Fase3/phase3_analyze.py
   python Studi_Rute_Fase3/phase3_validate.py
   python Studi_Rute_Fase3/phase4_optimal_ties.py
   python Studi_Rute_Fase3/phase4_validate.py
   ```

   `exhaustive_per_seed.csv` dan `exhaustive_summary.json` memuat angka utama
   Tabel 3–5 serta 7–9. `phase4_optimal_ties_per_seed.csv` memuat rerata metrik
   pejalan acak atas seluruh susunan optimum yang seri. `validation.json` dan
   `phase4_validation.json` mencatat pemeriksaan ulang.

3. Ulangi pengukuran waktu pada Node.js yang sama untuk semua metode.

   ```sh
   node Studi_Rute_Fase2/phase2.mjs --source Studi_Rute_Fase2/phase2_test/logika_snapshot.js --start 2024-01-01 --count 1000 --out Studi_Rute_Fase3/phase4_timing_methods
   node Studi_Rute_Fase3/phase4_enumeration_timing.mjs
   python Studi_Rute_Fase3/phase5_latency_summary.py
   ```

   `phase4_timing_methods/maps.jsonl` dan
   `phase4_node_enumeration_per_seed.csv` menghasilkan waktu Tabel 6.
   Skrip enumerasi memanaskan penilai pada 30 masukan sebelum mencatat semua
   1.000 waktu; empat metode tidak mempunyai tahap pemanasan terpisah.
   Enumerasi dan empat metode berada pada proses terpisah. Seleksi dan
   operator genetika termasuk dalam waktunya.

4. Buat gambar dari data mentah dan hasil enumerasi.

   ```sh
   python Studi_Rute_Fase3/make_figures.py
   python Studi_Rute_Fase3/make_figure2.py Studi_Rute_Fase2/phase2_test/maps.jsonl Studi_Rute_Fase3/Gambar_2_Graf_U0013_Awal_dan_Optimasi.png
   ```

   `make_figures.py` menghasilkan Gambar 1 (alur protokol) dan Gambar 3
   (distribusi kesempatan). `make_figure2.py` menghasilkan graf U0013 dari
   peta mentah. Jalur yang disorot pada Gambar 2 adalah salah satu jalur
   terbaik jika ada seri.

Analisis sensitivitas yang dilakukan **setelah** hasil utama dapat diulang
dengan `phase4_tuning_restarts.py` dan `phase5_test_eight_starts.py`. Keduanya
tidak mengganti parameter atau 4.000 peta pengujian utama. Tabel naskah
memakai angka pada CSV/JSON di atas; tata letak tabel dalam Word tidak
dibangkitkan dari repositori karena naskah memang disimpan terpisah.

Sebagai perkiraan, pengulangan empat metode pada perangkat uji memakan waktu
belasan detik menurut manifest pengukuran ulang. Analisis enumerasi penuh dan
ikatan optimum dapat memerlukan beberapa menit; waktu sebenarnya bergantung
pada perangkat dan kondisi proses.
