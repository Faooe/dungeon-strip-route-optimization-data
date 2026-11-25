"""Create the research workflow and five-series distribution at print resolution."""
from __future__ import annotations

import csv
from collections import Counter
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyArrowPatch, FancyBboxPatch
import numpy as np

HERE = Path(__file__).resolve().parent
ARTICLE = HERE.parent / "Artikel_JSON_Dungeon_Strip"
ARTICLE.mkdir(exist_ok=True)


def save(fig, name):
    for dest in (HERE / name, ARTICLE / name):
        fig.savefig(dest, dpi=350, facecolor="white", bbox_inches="tight", pad_inches=.08)
    plt.close(fig)


def workflow():
    fig, ax = plt.subplots(figsize=(6.15, 1.95))
    ax.set_xlim(0, 10)
    ax.set_ylim(.75, 4.15)
    ax.axis("off")
    blue, green = "#e9f1f6", "#eaf3ec"

    def box(x, y, w, h, text, color=blue):
        patch = FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.025,rounding_size=0.12",
                               facecolor=color, edgecolor="#384c5c", linewidth=.9)
        ax.add_patch(patch)
        ax.text(x+w/2, y+h/2, text, ha="center", va="center", fontsize=7.5, linespacing=1.08)

    def arrow(x1, y1, x2, y2):
        ax.add_patch(FancyArrowPatch((x1, y1), (x2, y2), arrowstyle="-|>",
                                     mutation_scale=8, linewidth=.9, color="#384c5c"))

    box(.2, 3.15, 2.1, .72, "90 $\\it{seed}$\npengembangan")
    box(3.0, 3.15, 2.6, .72, "Tuning pencarian lokal\n4 titik awal")
    arrow(2.4, 3.51, 2.9, 3.51)
    box(.2, 1.15, 1.65, .92, "1.000 $\\it{seed}$\nuji", green)
    box(2.2, 1.15, 2.35, .92, "4 metode +\noptimum eksak", green)
    box(4.95, 1.15, 2.4, .92, "Struktur, pejalan\nacak, biaya", green)
    box(7.72, 1.15, 1.9, .92, "Pemeriksaan\nulang", green)
    arrow(1.92, 1.61, 2.13, 1.61)
    arrow(4.62, 1.61, 4.88, 1.61)
    arrow(7.42, 1.61, 7.65, 1.61)
    arrow(4.3, 3.07, 4.3, 2.16)
    ax.text(4.52, 2.63, "parameter tetap", fontsize=7.5, va="center")
    save(fig, "Gambar_1_Tahapan_Penelitian.png")


def distribution():
    records = list(csv.DictReader((HERE / "exhaustive_per_seed.csv").open(encoding="utf-8", newline="")))
    series = [("Peta awal", "original", "#68768a"),
              ("Acak", "random_search", "#4c88a7"),
              ("Genetika", "genetic_algorithm", "#8779b6"),
              ("Pencarian lokal", "local_swap_repair", "#18917f"),
              ("Optimum eksak", "exact", "#bc755b")]
    fig, ax = plt.subplots(figsize=(6.15, 3.0))
    x = np.arange(3)
    width = .15
    for i, (label, key, color) in enumerate(series):
        counts = Counter(min(2, int(r[key + "_minimum"])) for r in records)
        assert sum(counts.values()) == 1000
        values = [counts[j] for j in range(3)]
        bars = ax.bar(x+(i-2)*width, values, width, label=label, color=color,
                      edgecolor="#2d3440", linewidth=.4)
        for bar, value in zip(bars, values):
            ax.text(bar.get_x()+bar.get_width()/2, value+5, str(value),
                    ha="center", va="bottom", fontsize=8, rotation=90)
    ax.set_xticks(x, ("0", "1", "2 atau lebih"))
    ax.set_ylabel("Jumlah peta dari 1.000 seed", fontsize=9)
    ax.set_xlabel("Kesempatan Peti/Toko minimum", fontsize=9)
    ax.tick_params(axis="both", labelsize=8.5)
    ax.set_ylim(0, 620)
    ax.grid(axis="y", alpha=.2)
    ax.set_axisbelow(True)
    ax.spines[["top", "right"]].set_visible(False)
    ax.legend(loc="upper center", bbox_to_anchor=(.5, 1.24), ncol=3, fontsize=8,
              frameon=False, columnspacing=.85, handlelength=1.1)
    fig.subplots_adjust(top=.78, bottom=.17, left=.12, right=.99)
    save(fig, "Gambar_3_Distribusi_Akses_Peti_Toko.png")


if __name__ == "__main__":
    workflow()
    distribution()
