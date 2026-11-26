"""Create the research workflow and five-series distribution at print resolution."""
from __future__ import annotations

import csv
from collections import Counter
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyArrowPatch, Rectangle
import numpy as np

HERE = Path(__file__).resolve().parent
ARTICLE = HERE.parent / "Artikel_JSON_Dungeon_Strip"
ARTICLE.mkdir(exist_ok=True)


def save(fig, name):
    for dest in (HERE / name, ARTICLE / name):
        fig.savefig(dest, dpi=350, facecolor="white", bbox_inches="tight", pad_inches=.08)
    plt.close(fig)


def workflow():
    steps = [
        "Kode pembuat peta dan hash SHA-256",
        "Pra-uji: pilih 4 titik awal dari 90 seed",
        "Uji utama: 1.000 seed × 4 metode",
        "Pasca-uji: enumerasi, pejalan acak, sensitivitas",
        "Audit data dan perbandingan berpasangan",
    ]
    fig, ax = plt.subplots(figsize=(5.9, 2.6))
    ax.set_xlim(0, 5.9)
    ax.set_ylim(0, 2.6)
    ax.axis("off")
    ink = "#1C2730"
    centers = [2.18, 1.75, 1.32, .89, .46]
    for i, (label, cy) in enumerate(zip(steps, centers)):
        ax.add_patch(Rectangle((.58, cy-.15), 4.74, .30,
                               linewidth=1.15, edgecolor=ink, facecolor="white"))
        ax.text(2.95, cy, label, ha="center", va="center", color=ink, fontsize=10.2)
        if i < len(steps)-1:
            ax.add_patch(FancyArrowPatch((2.95, cy-.155),
                                         (2.95, centers[i+1]+.155),
                                         arrowstyle="-|>", mutation_scale=8,
                                         linewidth=1.15, color=ink))
    fig.subplots_adjust(left=.02, right=.98, top=.99, bottom=.015)
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
