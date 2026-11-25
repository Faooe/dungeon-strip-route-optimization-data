# Dungeon Strip: data optimasi struktur rute

Repositori pendukung artikel **“Optimum Eksak Penataan Ruang Dungeon Strip:
Evaluasi Algoritma Genetika dan Pencarian Lokal”**. Berkas ini memuat data
eksperimen dan kode analisis. Tidak ada responden maupun permainan manual;
komputer menghasilkan dan mengevaluasi peta secara deterministik.

## Isi

- `Studi_Rute_Fase2/phase2_test/maps.jsonl`: 4.000 peta hasil empat metode
  pada 1.000 masukan uji yang sama.
- `Studi_Rute_Fase2/phase2_test/logika_snapshot.js`: salinan kode game yang
  memuat fungsi pembangkit peta. SHA-256 berkas:
  `b1d5cbe36149f8d529608e3fd81e9d18c2888f70855f368aec64d5d514d7a9ca`.
- `Studi_Rute_Fase3/exhaustive_per_seed.csv` dan `exhaustive_summary.json`:
  optimum eksak pada seluruh 1.000 masukan uji.
- `Studi_Rute_Fase3/phase4_optimal_ties_per_seed.csv`: jumlah seluruh
  susunan yang seri pada empat metrik dan rerata metrik pejalan acak.
- `Studi_Rute_Fase3/phase4_node_enumeration_per_seed.csv`: waktu enumerasi
  pada Node.js; `phase4_timing_methods/maps.jsonl` memuat pengukuran ulang
  empat metode.
- `Studi_Rute_Fase3/phase4_tuning_per_seed.csv`: sensitivitas 1, 2, 3, 4,
  dan 8 titik awal pada 90 masukan pengembangan.
- `Studi_Rute_Fase3/PHASE3_PROTOCOL.txt` dan `PHASE4_PROTOCOL.txt`:
  metode, urutan analisis, serta hash kode dan hasil.
- `Studi_Rute_Fase3/phase4_validation.json`: pemeriksaan terpisah.

Masukan fungsi berbentuk `YYYY-MM-DD` karena format yang diterima game.
Deret itu hanya kode pembangkit deterministik, **bukan tanggal pengamatan
atau permainan**. Pemetaan ID ada pada `Studi_Rute_Fase2/seed_id_mapping.json`.

## Pemeriksaan ulang

Jalankan dari akar repositori dengan Python 3.10+, NumPy, dan Node.js 24+:

```bash
python Studi_Rute_Fase3/phase4_validate.py
node Studi_Rute_Fase3/phase4_enumeration_timing.mjs --limit 20
```

Untuk mengulang seluruh enumerasi dan analisis ikatan optimum, jalankan
`phase4_enumeration_timing.mjs` tanpa `--limit`, lalu
`python Studi_Rute_Fase3/phase4_optimal_ties.py`. Durasi pengukuran waktu
bergantung pada perangkat dan beban proses.

Analisis sensitivitas memakai masukan pengembangan saja dan dilakukan
setelah uji utama. Hasil tersebut tidak mengubah konfigurasi empat titik
awal yang dipakai pada 1.000 masukan uji.

Kode game tersedia untuk reproduksi penelitian. Repositori ini tidak
menyertakan aset grafis, audio, atau paket aplikasi game.
