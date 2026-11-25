"""Check manuscript DOI metadata against Crossref; no references are rewritten."""
from __future__ import annotations

import csv
import json
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from difflib import SequenceMatcher
from pathlib import Path

HERE = Path(__file__).resolve().parent
REF_PATH = HERE / "json_references.json"
if not REF_PATH.exists():
    REF_PATH = HERE.parent.parent / "work" / "json_references.json"
REFS = json.loads(REF_PATH.read_text(encoding="utf-8"))
USER_AGENT = "DungeonStripReferenceAudit/1.0 (research metadata verification)"


def normalize(s):
    return re.sub(r"[^a-z0-9]+", " ", str(s).casefold()).strip()


def check(item):
    number, reference = item
    found = re.search(r"doi:\s*(10\.\S+)", reference, flags=re.IGNORECASE)
    title = re.search(r'"([^"]+)"', reference)
    expected_title = title.group(1) if title else ""
    doi = found.group(1).rstrip(".,") if found else ""
    result = {"number": number, "doi": doi, "reference_title": expected_title,
              "crossref_title": "", "crossref_year": "", "crossref_authors": "",
              "crossref_container": "", "title_similarity": "", "status": "tidak bisa diverifikasi", "note": ""}
    if not doi:
        result["note"] = "Tidak ada DOI; verifikasi buku perlu ISBN/penerbit."
        return result
    url = "https://api.crossref.org/works/" + urllib.parse.quote(doi, safe="")
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "application/json"})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(request, timeout=20) as response:
                data = json.load(response)["message"]
            break
        except urllib.error.HTTPError as exc:
            if exc.code == 429 and attempt < 3:
                time.sleep(2 ** attempt)
                continue
            result["note"] = type(exc).__name__ + ": " + str(exc)[:150]
            return result
        except (urllib.error.URLError, TimeoutError, ValueError, KeyError) as exc:
            result["note"] = type(exc).__name__ + ": " + str(exc)[:150]
            return result
    title_actual = (data.get("title") or [""])[0]
    container = (data.get("container-title") or [""])[0]
    authors = ", ".join((a.get("family") or a.get("name") or "") for a in data.get("author", []))
    issued = data.get("published") or data.get("issued") or {}
    date_parts = issued.get("date-parts") or [[]]
    year = date_parts[0][0] if date_parts and date_parts[0] else ""
    similarity = (SequenceMatcher(None, normalize(expected_title), normalize(title_actual)).ratio()
                  if expected_title else float(normalize(title_actual) in normalize(reference)))
    result.update(crossref_title=title_actual, crossref_year=year, crossref_authors=authors,
                  crossref_container=container, title_similarity=round(similarity, 3))
    year_in_ref = bool(year and re.search(rf"\b{year}\b", reference))
    first_author = (data.get("author") or [{}])[0].get("family", "")
    surname = normalize(first_author).split()[-1] if first_author else ""
    author_in_ref = bool(surname and surname in normalize(reference))
    container_in_ref = bool(container and normalize(container) in normalize(reference))
    result["status"] = "cocok" if similarity >= .9 and year_in_ref and author_in_ref else "tidak cocok"
    result["note"] = f"judul={similarity:.2f}; tahun={year_in_ref}; penulis_awal={author_in_ref}; wadah={container_in_ref}"
    return result


def main():
    records = []
    for item in enumerate(REFS, 1):
        records.append(check(item))
        time.sleep(.5)
    with (HERE / "reference_check.csv").open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(records[0]))
        writer.writeheader()
        writer.writerows(records)
    print(json.dumps([{"number": r["number"], "status": r["status"], "note": r["note"]} for r in records], ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
