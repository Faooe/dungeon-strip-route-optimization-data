STUDI RUTE DUNGEON STRIP — FASE 3
================================

Fase 3 adalah analisis tambahan atas 1.000 seed uji Fase 2. Empat metode
Fase 2 tidak dijalankan ulang atau dipilih parameternya dari hasil Fase 3.
Tidak ada responden dan tidak ada permainan manual.
Arsip Fase 2 memuat phase2_dev_one_start untuk hasil pengembangan satu
titik awal dan phase2_dev untuk hasil empat titik awal.

Berkas utama:
PHASE3_PROTOCOL.txt       Definisi analisis, aturan seri, dan hash skrip.
phase3_analyze.py          Enumerasi penuh, metrik pejalan acak, ringkasan.
phase3_validate.py         Pemeriksaan terpisah terhadap enumerasi sampel.
exhaustive_per_seed.csv    Optimum, gap, dan status per seed.
exhaustive_summary.json   Ringkasan ruang pencarian, mutu, biaya, tuning.
validation.json           Hasil pemeriksaan terpisah.
make_figures.py            Pembuat Gambar 1 dan Gambar 3.
verify_references.py       Pemeriksa DOI melalui Crossref.
reference_check.csv       Hasil metadata tiap referensi.
audit_article.py           Audit angka, format, sitasi, dan istilah.
ANGKA_CEK.csv              Tabel kecocokan angka dan format naskah.
article_audit.json         Ringkasan audit naskah.

Hasil pokok: median ruang pencarian 1.296 susunan (9–103.680). Pencarian acak
dan algoritma genetika mencapai optimum dua metrik utama pada semua 1.000
seed; pencarian lokal pada 988 seed. Optimum keempat metrik tercapai pada
985 seed (acak), 997 (genetika), dan 952 (pencarian lokal). Ada 101 seed
dengan optimum kesempatan minimum nol karena 39 tidak memuat Peti/Toko dan
62 hanya memuat satu ruang tersebut. Peluang minimum menjumpai Peti/Toko
meningkat dari 0,430 pada peta awal menjadi sekitar 0,502–0,503 pada tiga
metode optimasi.

Reproduksi dari folder induk paket (Python dengan NumPy tersedia):
python Studi_Rute_Fase3/phase3_analyze.py
python Studi_Rute_Fase3/phase3_validate.py

Skrip Fase 2 dalam paket unggahan menggunakan jalur sumber relatif agar
tidak memuat lokasi pribadi. Perubahan ini hanya menyangkut nilai default
jalur sumber; hash skrip Fase 2 yang dicatat dalam protokol lama mengacu
pada salinan sebelum penyesuaian jalur. Berkas logika_snapshot.js tetap
identik dan SHA-256 sumbernya tercatat di PHASE2_PROTOCOL.txt.

Wakil optimum eksak dipilih menurut urutan enumerasi ketika beberapa
penataan seri pada keempat metrik. Metrik pejalan acak tidak termasuk
fungsi tujuan; nilainya pada wakil optimum tidak harus lebih tinggi
daripada peta heuristik lain yang juga optimum pada tujuan utama.
