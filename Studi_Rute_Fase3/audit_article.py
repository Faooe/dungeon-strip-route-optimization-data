"""Check article structure, numerical claims, formatting, and figure/table order."""
from __future__ import annotations

import csv
import json
import math
import re
from pathlib import Path

from docx import Document
from pypdf import PdfReader

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
ARTICLE = ROOT / "work" / "artikel_json_dungeon_strip_phase3.md"
DOCX = HERE.parent / "Artikel_JSON_Dungeon_Strip" / "Revisi_13_Artikel_JSON_Dungeon_Strip.docx"
PDF = HERE.parent / "Artikel_JSON_Dungeon_Strip" / "Pratinjau_Revisi_13_Artikel_JSON_Dungeon_Strip.pdf"
source = ARTICLE.read_text(encoding="utf-8")
summary = json.loads((HERE / "exhaustive_summary.json").read_text(encoding="utf-8"))
records = list(csv.DictReader((HERE / "exhaustive_per_seed.csv").open(encoding="utf-8", newline="")))
doc = Document(DOCX)
pdf = PdfReader(PDF)
checks = []


def check(name, observed, expected, tolerance=0):
    valid = (math.isclose(observed, expected, abs_tol=tolerance, rel_tol=0)
             if isinstance(observed, (int, float)) and isinstance(expected, (int, float))
             else observed == expected)
    checks.append({"item": name, "expected": expected, "observed": observed,
                   "status": "cocok" if valid else "berbeda"})
    assert valid, (name, observed, expected)


def section(name, next_name=None):
    text = source.split("# " + name + "\n", 1)[1]
    if next_name:
        text = text.split("# " + next_name + "\n", 1)[0]
    return text


def word_count(text):
    return len(re.findall(r"\S+", text))


def main():
    title = source.splitlines()[0][2:]
    check("Kata judul paling banyak 14", len(title.split()) <= 14, True)
    check("Jumlah halaman 8–13", 8 <= len(pdf.pages) <= 13, True)
    check("Jumlah gambar", len(doc.inline_shapes), 3)
    check("Jumlah tabel", len(doc.tables), 9)
    check("Tabel 3 hanya tiga ukuran yang memakai statistik kolom", len(doc.tables[2].rows), 4)
    check("Tabel 3 tanpa tanda nilai kosong", any('—' in c.text for row in doc.tables[2].rows for c in row.cells), False)
    check("Tabel 5 tanpa tanda nilai kosong", any('—' in c.text for row in doc.tables[4].rows for c in row.cells), False)
    for name, next_name, minimum in (("1. PENDAHULUAN", "2. METODOLOGI PENELITIAN", 700),
                                     ("2. METODOLOGI PENELITIAN", "3. HASIL DAN PEMBAHASAN", 500),
                                     ("3. HASIL DAN PEMBAHASAN", "4. KESIMPULAN", 1800),
                                     ("4. KESIMPULAN", None, 200)):
        count = word_count(section(name, next_name))
        check("Kata " + name, count >= minimum, True)
        checks.append({"item": "Jumlah kata " + name, "expected": f">={minimum}",
                       "observed": count, "status": "cocok"})
    for label, next_label in (("ABSTRAK", "KATA KUNCI"), ("ABSTRACT", "KEYWORDS")):
        text = source.split("## " + label + "\n", 1)[1].split("## " + next_label + "\n", 1)[0]
        check("Kata " + label, 90 <= word_count(text) <= 230, True)
    for label in ("KATA KUNCI", "KEYWORDS"):
        text = source.split("## " + label + "\n", 1)[1].split("\n", 1)[0]
        check("Jumlah " + label, len(text.split(";")) >= 5, True)
    refs = json.loads((ROOT / "work" / "json_references.json").read_text(encoding="utf-8"))
    citations = [int(x) for x in re.findall(r"\[(\d+)\]", source)]
    check("Rujukan minimal 18", len(refs) >= 18, True)
    check("Urutan kemunculan rujukan", list(dict.fromkeys(citations)), list(range(1, len(refs)+1)))
    check("Semua rujukan dikutip", set(citations), set(range(1, len(refs)+1)))
    table_numbers = [int(re.match(r"Tabel (\d+)\.", p.text).group(1)) for p in doc.paragraphs
                     if re.match(r"Tabel \d+\.", p.text)]
    figure_numbers = [int(re.match(r"Gambar (\d+)\.", p.text).group(1)) for p in doc.paragraphs
                      if re.match(r"Gambar \d+\.", p.text)]
    check("Urutan tabel", table_numbers, list(range(1, 10)))
    check("Urutan gambar", figure_numbers, [1, 2, 3])
    ref_paragraphs=[p for p in doc.paragraphs if re.match(r'^\[\d+\] ',p.text)]
    check("Jumlah paragraf referensi",len(ref_paragraphs),20)
    check("Nama wadah atau buku miring pada semua referensi",
          [sum(bool(r.italic) for r in p.runs) for p in ref_paragraphs],[1]*20)
    check("Judul artikel tidak miring",all(not p.runs[0].italic for p in ref_paragraphs[2:]),True)
    s = doc.sections[0]
    for label, observed, expected in (("Atas", s.top_margin.cm, 3), ("Bawah", s.bottom_margin.cm, 1.5),
                                      ("Kiri", s.left_margin.cm, 3), ("Kanan", s.right_margin.cm, 2),
                                      ("Lebar A4", s.page_width.cm, 21), ("Tinggi A4", s.page_height.cm, 29.7)):
        check("Margin/ukuran " + label, observed, expected, .01)
    columns = s._sectPr.xpath('./w:cols')
    check("Satu kolom", not columns or columns[0].get('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}num') in (None, '1'), True)
    check("Normal TNR10", (doc.styles['Normal'].font.name, doc.styles['Normal'].font.size.pt), ('Times New Roman', 10))
    foreign = re.compile(r'(?i)(?<!\w)(binary space partition|wave function collapse|hill climbing steepest-ascent|procedural content generation|exhaustive search|expressive range|random walk|local search|sign test|L-system|multi-start|roguelite|roguelike|benchmark|bootstrap|Node\.js|seed|game)(?!\w)')
    paragraphs = [p for p in doc.paragraphs if not re.match(r'^\[\d+\] ', p.text)] + [p for table in doc.tables for row in table.rows for cell in row.cells for p in cell.paragraphs]
    bad_italic = [(p.text[:60], run.text) for p in paragraphs for run in p.runs
                  if foreign.search(run.text) and not run.italic]
    check("Istilah asing miring", bad_italic, [])
    for paragraph in doc.paragraphs:
        if re.match(r"^[1-4]\. [A-Z ]+$", paragraph.text):
            check("Judul bagian 13 pt", all(r.font.size and abs(r.font.size.pt-13)<.01 and r.bold for r in paragraph.runs), True)
            check("Spasi judul bagian", (paragraph.paragraph_format.space_before.pt,
                                         paragraph.paragraph_format.space_after.pt), (18, 6))
    check("Tautan data publik", "https://github.com/Faooe/dungeon-strip-route-optimization-data" in source, True)
    check("Tidak ada placeholder data publik", "[URL/DOI Zenodo-GitHub - ISI PENULIS]" in source, False)
    check("Tidak ada path pribadi di naskah", bool(re.search(r"C:[/\\]Users", source)), False)
    check("Naskah memakai rerata seluruh optimum", "rerata seluruh susunan optimum" in source, True)
    check("Median ruang pencarian", summary['search_space']['median'], 1296)
    check("Rerata ruang pencarian", summary['search_space']['mean'], 3787.236)
    check("Seed ruang ≤744", summary['search_space']['at_most_744'], 352)
    check("Seed ruang ≤5.000", summary['search_space']['at_most_5000'], 792)
    check("Optimum dua metrik acak", summary['methods']['random_search']['optimal_first_two'], 1000)
    check("Optimum dua metrik genetika", summary['methods']['genetic_algorithm']['optimal_first_two'], 1000)
    check("Optimum dua metrik lokal", summary['methods']['local_swap_repair']['optimal_first_two'], 988)
    check("Optimum empat metrik genetika", summary['methods']['genetic_algorithm']['optimal_all_four'], 997)
    check("Optimum empat metrik acak", summary['methods']['random_search']['optimal_all_four'], 985)
    check("Optimum empat metrik lokal", summary['methods']['local_swap_repair']['optimal_all_four'], 952)
    check("Seed optimum nol", summary['zero_exact']['total'], 101)
    check("Tanpa Peti/Toko", summary['zero_exact']['no_reward_rooms'], 39)
    check("Satu Peti/Toko", summary['zero_exact']['one_reward_room'], 62)
    check("Tabel 2 berisi lima pilihan titik awal",len(doc.tables[1].rows),6)
    check("Tabel 6 memuat waktu enumerasi",any('19,451' in c.text for row in doc.tables[5].rows for c in row.cells),True)
    check("Tabel 8 rerata seluruh optimum",any('Rerata seluruh' in c.text for row in doc.tables[7].rows for c in row.cells),True)
    check("Gambar 2 menyebut seed U0013",any('Gambar 2.' in p.text and 'U0013' in p.text for p in doc.paragraphs),True)
    check("Lokal minimum naik", sum(int(r['local_swap_repair_minimum']) > int(r['original_minimum']) for r in records), 543)
    check("Lokal minimum tetap", sum(int(r['local_swap_repair_minimum']) == int(r['original_minimum']) for r in records), 457)
    check("Peta awal selisih nol", sum(int(r['original_gap']) == 0 for r in records), 410)
    check("Lokal selisih nol", sum(int(r['local_swap_repair_gap']) == 0 for r in records), 932)
    example_cells = [[cell.text for cell in row.cells] for row in doc.tables[3].rows]
    check("Contoh U0013 peta awal", example_cells[1], ['U0013','Peta awal','1','4','1','3'])
    check("Contoh U0067 pencarian lokal", example_cells[9], ['U0067','Pencarian lokal','3','3','3','0'])
    check("Contoh U0067 optimum", example_cells[10], ['U0067','Optimum eksak','4','4','4','0'])
    for method in ('original','random_search','genetic_algorithm','local_swap_repair','exact'):
        check("Distribusi " + method,
              sum(sum(min(2,int(r[method+'_minimum'])) == category for r in records) for category in (0,1,2)), 1000)
    sensitivity_expected = (
        ('peti_only__elit_tantangan','minimum_best_reward','original',.579),
        ('peti_only__elit_tantangan','minimum_best_reward','local_swap_repair',.897),
        ('peti_toko_misteri__elit_tantangan','minimum_best_reward','original',1.691),
        ('peti_toko_misteri__elit_tantangan','minimum_best_reward','local_swap_repair',2.043),
        ('peti_toko__all_combat','worst_risk_streak','original',4.051),
        ('peti_toko__all_combat','worst_risk_streak','local_swap_repair',4.052),
    )
    for scheme, metric, method, expected in sensitivity_expected:
        check('Sensitivitas '+scheme+' '+method,summary['sensitivity'][scheme][method][metric],expected,1e-12)
    ties=json.loads((HERE/'phase4_optimal_ties_summary.json').read_text(encoding='utf-8'))
    check('Seed dengan lebih dari satu optimum',ties['seeds_with_ties'],993)
    check('Peluang pejalan acak seluruh optimum',ties['tie_averaged_walk']['encounter_minimum']['mean'],.5021918137325294,1e-12)
    check('Ekspektasi pejalan acak seluruh optimum',ties['tie_averaged_walk']['expected_minimum']['mean'],.7146433001183219,1e-12)
    for key, triplet in (("ga_vs_local", (47,951,2)), ("ga_vs_random", (14,983,3)),
                         ("local_vs_random", (11,944,45))):
        obj = summary['pairwise_sign_test'][key]
        check("Uji tanda " + key, (obj['wins'],obj['ties'],obj['losses']), triplet)
    for method, expected in (("original",.981),("random_search",1.651),
                             ("genetic_algorithm",1.651),("local_swap_repair",1.639)):
        check("Rerata minimum " + method,
              summary['methods'][method]['metrics']['minimum_best_reward']['mean'], expected, 1e-12)
    output = {"status": "passed", "pages": len(pdf.pages), "tables": len(doc.tables),
              "figures": len(doc.inline_shapes), "checks": len(checks)}
    with (HERE / "ANGKA_CEK.csv").open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(checks[0]))
        writer.writeheader()
        writer.writerows(checks)
    (HERE / "article_audit.json").write_text(json.dumps(output, indent=2), encoding="utf-8")
    print(json.dumps(output, indent=2))


if __name__ == "__main__":
    main()
