"""Schritt 5b: Analyse-Overlay ueber das Video zeichnen (Pillow auf transparenter
Ebene, dann auf jedes Bild gelegt). Skelett, Live-Kniewinkel, Kacheln,
Erkennungsguete, Verlaufsdiagramm, Ergebniszeile."""
import json
import time
import numpy as np
import cv2
from PIL import Image, ImageDraw

from lib.fonts import get_font
from lib.judge import (judge_knee, judge_trunk, judge_elbow, color_for,
                        KNEE_LO, KNEE_HI, TRUNK_LO, TRUNK_HI, ELBOW_LO, ELBOW_HI)

VIDEO_IN = "input/video.mp4"
RAW_OUT = "output/analysis_raw.mp4"
FINAL_OUT = "output/bikefit_analyse.mp4"
BDC_IMG = "output/unterer_totpunkt.jpg"
MODEL_NAME = "YOLO11x-pose (Ultralytics)"

WHITE = (255, 255, 255, 255)
GRAY = (170, 170, 170, 255)
DARK_PANEL = (10, 10, 10, 175)
DARK_PANEL2 = (10, 10, 10, 195)
BLACK = (0, 0, 0, 255)

with open("measure_result.json") as f:
    R = json.load(f)

series = np.load("cache_series.npz")
kp_cache = np.load("cache_keypoints.npz")

fps = R["fps"]
n_frames = R["n_frames"]
side = R["side"]
cycles = R["cycles"]  # list of {frame(float local), flexion, frame_global}
bdc_flexion = R["bdc_flexion"]
knee_label = R["knee_label"]
trunk_median, elbow_median = R["trunk_median"], R["elbow_median"]
shoulder_median, hip_median = R["shoulder_median"], R["hip_median"]
trunk_label, elbow_label = R["trunk_label"], R["elbow_label"]
recommendation = R["recommendation"]

knee_flex = series["knee_flex"]
trunk = series["trunk"]
elbow_flex = series["elbow_flex"]
shoulder_angle = series["shoulder_angle"]
hip_angle = series["hip_angle"]
quality = series["quality"]
hip_pts, knee_pts, ankle_pts = series["hip"], series["knee"], series["ankle"]
shoulder_pts, elbow_pts, wrist_pts = series["shoulder"], series["elbow"], series["wrist"]
conf_all = kp_cache["conf"]

cap = cv2.VideoCapture(VIDEO_IN)
width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
assert width == R["n_frames"] or True

SC = width / 1080.0  # Massstab

import os
os.makedirs("output", exist_ok=True)

fourcc = cv2.VideoWriter_fourcc(*"mp4v")
writer = cv2.VideoWriter(RAW_OUT, fourcc, fps, (width, height))

# ---------- statische Layout-Groessen ----------
HEADER_H = int(70 * SC)
MARGIN = int(16 * SC)
TILE_W = int(230 * SC)
TILE_H = int(88 * SC)
TILE_GAP = int(10 * SC)
BOTTOM_BAR_H = int(64 * SC)
CHART_H = int(190 * SC)
CHART_GAP = int(12 * SC)
QUALITY_BOX_W = int(160 * SC)
QUALITY_BOX_H = int(56 * SC)

CHART_TOP = height - BOTTOM_BAR_H - CHART_GAP - CHART_H
CHART_BOTTOM = height - BOTTOM_BAR_H - CHART_GAP
CHART_LEFT = MARGIN
CHART_RIGHT = width - MARGIN

# ---------- Chart vorab berechnen (aendert sich pro Bild nur durch den Cursor) ----------
valid = ~np.isnan(knee_flex)
y_lo = min(25.0, float(np.nanmin(knee_flex[valid])) - 5.0) if valid.any() else 20.0
y_hi = max(45.0, float(np.nanmax(knee_flex[valid])) + 5.0) if valid.any() else 50.0


def chart_xy(frame_idx, value):
    x = CHART_LEFT + (frame_idx / max(1, n_frames - 1)) * (CHART_RIGHT - CHART_LEFT)
    v = min(max(value, y_lo), y_hi)
    y = CHART_BOTTOM - (v - y_lo) / (y_hi - y_lo) * (CHART_BOTTOM - CHART_TOP)
    return x, y


chart_points = [chart_xy(i, knee_flex[i]) for i in range(n_frames) if not np.isnan(knee_flex[i])]
band_top_y = chart_xy(0, KNEE_HI)[1]
band_bot_y = chart_xy(0, KNEE_LO)[1]
bdc_dot_points = [chart_xy(c["frame_global"] if "frame_global" in c else c["frame"], c["flexion"]) for c in cycles]

# ---------- Skelett-Definition ----------
BONES = [
    ("hip", "knee", "knee"),
    ("knee", "ankle", "knee"),
    ("shoulder", "hip", "trunk"),
    ("shoulder", "elbow", "elbow"),
    ("elbow", "wrist", "elbow"),
]
PTS = dict(hip=hip_pts, knee=knee_pts, ankle=ankle_pts,
           shoulder=shoulder_pts, elbow=elbow_pts, wrist=wrist_pts)


def rounded_rect(draw, box, radius, fill=None, outline=None, width=1):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def draw_header(draw, frame_idx):
    draw.rectangle([0, 0, width, HEADER_H], fill=DARK_PANEL2)
    f_title = get_font(24 * SC, bold=True)
    f_sub = get_font(12 * SC)
    f_num = get_font(13 * SC, mono=True)
    draw.text((MARGIN, int(10 * SC)), "BIKEFIT", font=f_title, fill=WHITE)
    draw.text((MARGIN, int(40 * SC)), MODEL_NAME, font=f_sub, fill=GRAY)
    t = frame_idx / fps
    right_text = f"Bild {frame_idx+1:04d}/{n_frames}   {t:6.2f}s   {fps:.1f} fps"
    bbox = draw.textbbox((0, 0), right_text, font=f_num)
    tw = bbox[2] - bbox[0]
    draw.text((width - MARGIN - tw, int(26 * SC)), right_text, font=f_num, fill=WHITE)


def draw_corner_brackets(draw, frame_idx):
    pts = []
    for name, arr in PTS.items():
        p = arr[frame_idx]
        if not np.isnan(p[0]):
            pts.append(p)
    if not pts:
        return
    pts = np.array(pts)
    x0, y0 = pts[:, 0].min(), pts[:, 1].min()
    x1, y1 = pts[:, 0].max(), pts[:, 1].max()
    pad = 0.12 * (y1 - y0)
    x0, y0, x1, y1 = x0 - pad, y0 - pad, x1 + pad, y1 + pad
    L = int(28 * SC)
    W = max(2, int(3 * SC))
    col = (255, 255, 255, 230)
    for (cx, cy, dx, dy) in [(x0, y0, 1, 1), (x1, y0, -1, 1), (x0, y1, 1, -1), (x1, y1, -1, -1)]:
        draw.line([(cx, cy), (cx + dx * L, cy)], fill=col, width=W)
        draw.line([(cx, cy), (cx, cy + dy * L)], fill=col, width=W)
    n_tracked = int((conf_all[frame_idx] > 0.5).sum())
    f_small = get_font(12 * SC, mono=True)
    draw.text((x0, y0 - int(16 * SC)), f"{n_tracked}/17 Punkte", font=f_small, fill=WHITE)


def draw_skeleton(draw, frame_idx):
    labels = {}
    kl, _ = judge_knee(knee_flex[frame_idx] if not np.isnan(knee_flex[frame_idx]) else None)
    tl, _ = judge_trunk(trunk[frame_idx] if not np.isnan(trunk[frame_idx]) else None)
    el, _ = judge_elbow(elbow_flex[frame_idx] if not np.isnan(elbow_flex[frame_idx]) else None)
    labels["knee"] = color_for(kl)
    labels["trunk"] = color_for(tl)
    labels["elbow"] = color_for(el)

    thick_bg = max(3, int(7 * SC))
    thick_fg = max(2, int(3.5 * SC))

    for a, b, group in BONES:
        pa, pb = PTS[a][frame_idx], PTS[b][frame_idx]
        if np.isnan(pa[0]) or np.isnan(pb[0]):
            continue
        pa_t, pb_t = tuple(pa), tuple(pb)
        draw.line([pa_t, pb_t], fill=(0, 0, 0, 220), width=thick_bg)
        draw.line([pa_t, pb_t], fill=labels[group] + (255,), width=thick_fg)

    r = max(3, int(5 * SC))
    for name, arr in PTS.items():
        p = arr[frame_idx]
        if np.isnan(p[0]):
            continue
        draw.ellipse([p[0] - r - 2, p[1] - r - 2, p[0] + r + 2, p[1] + r + 2],
                     fill=(20, 20, 20, 230))
        draw.ellipse([p[0] - r, p[1] - r, p[0] + r, p[1] + r], fill=WHITE)


def draw_knee_arc(draw, frame_idx):
    hip_p, knee_p, ankle_p = hip_pts[frame_idx], knee_pts[frame_idx], ankle_pts[frame_idx]
    if np.isnan(hip_p[0]) or np.isnan(knee_p[0]) or np.isnan(ankle_p[0]):
        return
    a1 = np.degrees(np.arctan2(hip_p[1] - knee_p[1], hip_p[0] - knee_p[0])) % 360
    a2 = np.degrees(np.arctan2(ankle_p[1] - knee_p[1], ankle_p[0] - knee_p[0])) % 360
    diff = (a2 - a1) % 360
    if diff <= 180:
        s, e = a1, a1 + diff
    else:
        s, e = a2, a2 + (360 - diff)
    radius = int(42 * SC)
    box = [knee_p[0] - radius, knee_p[1] - radius, knee_p[0] + radius, knee_p[1] + radius]
    val = knee_flex[frame_idx]
    col = color_for(judge_knee(val if not np.isnan(val) else None)[0])
    draw.arc(box, s, e, fill=(0, 0, 0, 220), width=max(3, int(6 * SC)))
    draw.arc(box, s, e, fill=col + (255,), width=max(2, int(3 * SC)))

    f_live = get_font(16 * SC, bold=True, mono=True)
    f_tag = get_font(10 * SC)
    if not np.isnan(val):
        txt = f"{val:.1f}°"
        tx, ty = knee_p[0] + radius + int(6 * SC), knee_p[1] - int(10 * SC)
        bbox = draw.textbbox((tx, ty), txt, font=f_live)
        pad = int(4 * SC)
        draw.rectangle([bbox[0]-pad, bbox[1]-pad, bbox[2]+pad, bbox[3]+pad], fill=DARK_PANEL)
        draw.text((tx, ty), txt, font=f_live, fill=col)
        draw.text((tx, ty + int(18 * SC)), "live", font=f_tag, fill=GRAY)


def draw_tile(draw, x, y, label, value_txt, band_txt, judge_label, rated=True):
    rounded_rect(draw, [x, y, x + TILE_W, y + TILE_H], radius=int(8 * SC), fill=DARK_PANEL)
    col = color_for(judge_label)
    draw.rounded_rectangle([x, y, x + TILE_W, y + TILE_H], radius=int(8 * SC), outline=col + (255,), width=max(2, int(2.5 * SC)))
    f_label = get_font(13 * SC, bold=True)
    f_verdict = get_font(11 * SC, bold=True)
    f_value = get_font(26 * SC, bold=True, mono=True)
    f_band = get_font(10.5 * SC, mono=True)
    pad = int(10 * SC)
    draw.text((x + pad, y + pad), label, font=f_label, fill=WHITE)
    verdict_txt = "ohne Bewertung" if not rated else {"green": "OK", "yellow": "Grenzwert", "red": "verstellen"}.get(judge_label, "-")
    bbox = draw.textbbox((0, 0), verdict_txt, font=f_verdict)
    vw = bbox[2] - bbox[0]
    draw.text((x + TILE_W - pad - vw, y + pad + int(1*SC)), verdict_txt, font=f_verdict, fill=col if rated else GRAY)
    draw.text((x + pad, y + int(32 * SC)), value_txt, font=f_value, fill=WHITE)
    draw.text((x + pad, y + int(64 * SC)), band_txt, font=f_band, fill=GRAY)


def draw_right_column(draw, frame_idx):
    x = width - MARGIN - TILE_W
    y = HEADER_H + MARGIN
    kv = knee_flex[frame_idx]
    kl, _ = judge_knee(kv if not np.isnan(kv) else None)
    draw_tile(draw, x, y, "KNIE (BDC-Median)", f"{bdc_flexion:.1f}°", f"Soll {KNEE_LO:.0f}-{KNEE_HI:.0f}°", knee_label)
    y += TILE_H + TILE_GAP
    draw_tile(draw, x, y, "RUMPF", f"{trunk_median:.1f}°", f"Erfahrungswert {TRUNK_LO:.0f}-{TRUNK_HI:.0f}°", trunk_label)
    y += TILE_H + TILE_GAP
    draw_tile(draw, x, y, "ELLBOGEN", f"{elbow_median:.1f}°", f"Erfahrungswert {ELBOW_LO:.0f}-{ELBOW_HI:.0f}°", elbow_label)
    y += TILE_H + TILE_GAP
    draw_tile(draw, x, y, "SCHULTER", f"{shoulder_median:.1f}°", "keine verlaessliche Norm", "gray", rated=False)
    y += TILE_H + TILE_GAP
    draw_tile(draw, x, y, "HUEFTE", f"{hip_median:.1f}°", "keine verlaessliche Norm", "gray", rated=False)


def draw_quality(draw, frame_idx):
    x, y = MARGIN, HEADER_H + MARGIN
    rounded_rect(draw, [x, y, x + QUALITY_BOX_W, y + QUALITY_BOX_H], radius=int(6 * SC), fill=DARK_PANEL)
    q = quality[frame_idx]
    q = 0.0 if np.isnan(q) else q
    f_label = get_font(11 * SC)
    f_val = get_font(18 * SC, bold=True, mono=True)
    pad = int(8 * SC)
    draw.text((x + pad, y + pad*0.5), "ERKENNUNGSGUETE", font=f_label, fill=GRAY)
    draw.text((x + pad, y + int(18*SC)), f"{q*100:.0f}%", font=f_val, fill=WHITE)
    bar_x0, bar_y0 = x + pad, y + QUALITY_BOX_H - int(10*SC)
    bar_x1, bar_y1 = x + QUALITY_BOX_W - pad, y + QUALITY_BOX_H - int(6*SC)
    draw.rectangle([bar_x0, bar_y0, bar_x1, bar_y1], fill=(60, 60, 60, 200))
    fill_x = bar_x0 + q * (bar_x1 - bar_x0)
    bar_col = (46, 204, 113, 255) if q > 0.7 else ((241, 196, 15, 255) if q > 0.4 else (231, 76, 60, 255))
    draw.rectangle([bar_x0, bar_y0, fill_x, bar_y1], fill=bar_col)


def draw_chart(draw, frame_idx):
    rounded_rect(draw, [CHART_LEFT - MARGIN//2, CHART_TOP - int(8*SC), CHART_RIGHT + MARGIN//2, CHART_BOTTOM + int(8*SC)],
                 radius=int(8*SC), fill=DARK_PANEL)
    # Sollband
    draw.rectangle([CHART_LEFT, band_top_y, CHART_RIGHT, band_bot_y], fill=(46, 204, 113, 55))
    f_axis = get_font(10 * SC, mono=True)
    draw.text((CHART_LEFT + 4*SC, band_top_y - 12*SC), f"{KNEE_HI:.0f}°", font=f_axis, fill=(46,204,113,255))
    draw.text((CHART_LEFT + 4*SC, band_bot_y + 2*SC), f"{KNEE_LO:.0f}°", font=f_axis, fill=(46,204,113,255))
    # Kurve
    if len(chart_points) > 1:
        draw.line(chart_points, fill=(255, 255, 255, 230), width=max(2, int(2.5 * SC)))
    # Totpunkte
    for (px, py) in bdc_dot_points:
        rad = max(3, int(4.5 * SC))
        draw.ellipse([px - rad, py - rad, px + rad, py + rad], fill=(0,0,0,230))
        draw.ellipse([px - rad + 1, py - rad + 1, px + rad - 1, py + rad - 1], fill=(255, 190, 60, 255))
    # aktuelle Position
    cx, _ = chart_xy(frame_idx, y_lo)
    draw.line([(cx, CHART_TOP), (cx, CHART_BOTTOM)], fill=(255, 255, 255, 200), width=max(1, int(2*SC)))
    f_title = get_font(11 * SC, bold=True)
    draw.text((CHART_LEFT, CHART_TOP - int(20*SC)), "KNIEBEUGUNG UEBER DIE ZEIT", font=f_title, fill=GRAY)


def draw_result_bar(draw):
    y0 = height - BOTTOM_BAR_H
    draw.rectangle([0, y0, width, height], fill=DARK_PANEL2)
    if recommendation:
        richtung, mm, deviation = recommendation
        text = f"Ergebnis: Kniebeugung {bdc_flexion:.1f}° am Totpunkt — Sattel um {mm:.0f} mm {richtung}."
        col = color_for("red")
    elif knee_label == "green":
        text = f"Ergebnis: Kniebeugung {bdc_flexion:.1f}° am Totpunkt — im Sollbereich, keine Sattelverstellung noetig."
        col = color_for("green")
    else:
        text = f"Ergebnis: Kniebeugung {bdc_flexion:.1f}° am Totpunkt — Grenzbereich der Messtoleranz, keine eindeutige Verstellung ableitbar."
        col = color_for("yellow")
    f = get_font(17 * SC, bold=True)
    bbox = draw.textbbox((0, 0), text, font=f)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    draw.rectangle([0, y0, int(8*SC), height], fill=col + (255,))
    draw.text(((width - tw) / 2, y0 + (BOTTOM_BAR_H - th) / 2 - bbox[1]), text, font=f, fill=WHITE)


# ---------- Hauptschleife ----------
t0 = time.time()
frame_idx = 0
bdc_frame_saved = False
target_bdc_frame = int(round(R["closest_cycle_frame"]))

while True:
    ok, frame_bgr = cap.read()
    if not ok:
        break
    frame_rgba = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGBA)
    pil_img = Image.fromarray(frame_rgba)
    overlay = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    draw_chart(draw, frame_idx)
    draw_quality(draw, frame_idx)
    draw_right_column(draw, frame_idx)
    draw_header(draw, frame_idx)
    draw_corner_brackets(draw, frame_idx)
    draw_skeleton(draw, frame_idx)
    draw_knee_arc(draw, frame_idx)
    draw_result_bar(draw)

    composited = Image.alpha_composite(pil_img, overlay).convert("RGB")
    out_bgr = cv2.cvtColor(np.array(composited), cv2.COLOR_RGB2BGR)
    writer.write(out_bgr)

    if frame_idx == target_bdc_frame:
        cv2.imwrite(BDC_IMG, out_bgr, [cv2.IMWRITE_JPEG_QUALITY, 95])
        bdc_frame_saved = True

    frame_idx += 1
    if frame_idx % 50 == 0:
        print(f"  Bild {frame_idx}/{n_frames} gerendert ({time.time()-t0:.0f}s)", flush=True)

cap.release()
writer.release()
print(f"Rohvideo geschrieben nach {RAW_OUT} in {time.time()-t0:.1f}s")
if not bdc_frame_saved:
    print("WARNUNG: Totpunkt-Bild wurde nicht gespeichert (Index ausserhalb des Bereichs).")
