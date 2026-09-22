"""Erkennung von Kurbelumdrehungen aus der Knoechelhoehe und robuste Bestimmung
des Kniewinkels am unteren Totpunkt (BDC) je Umdrehung."""
import numpy as np


def moving_average(x, window):
    window = max(1, int(window))
    if window <= 1:
        return np.asarray(x, dtype=float).copy()
    kernel = np.ones(window) / window
    pad = window // 2
    xp = np.pad(np.asarray(x, dtype=float), (pad, pad), mode="edge")
    sm = np.convolve(xp, kernel, mode="valid")
    return sm[: len(x)]


def estimate_period_frames(ankle_y, fps, min_cadence_rpm=40, max_cadence_rpm=140):
    """Schaetzt die Trittdauer (in Bildern) ueber Autokorrelation der Knoechelhoehe."""
    y = np.asarray(ankle_y, dtype=float)
    y = y - np.nanmean(y)
    y = np.nan_to_num(y)
    ac = np.correlate(y, y, mode="full")
    ac = ac[len(ac) // 2 :]
    min_lag = max(1, int(round(fps * 60.0 / max_cadence_rpm)))
    max_lag = int(round(fps * 60.0 / min_cadence_rpm))
    max_lag = min(max_lag, len(ac) - 1)
    if max_lag <= min_lag:
        raise ValueError("Clip zu kurz, um eine Trittfrequenz zu schaetzen.")
    lag = min_lag + int(np.argmax(ac[min_lag : max_lag + 1]))
    return lag


def find_peaks(signal, min_distance, prominence_frac=0.15):
    """Sehr einfache lokale-Maxima-Suche mit Mindestabstand (kein scipy noetig)."""
    y = np.asarray(signal, dtype=float)
    candidates = []
    for i in range(1, len(y) - 1):
        if y[i] >= y[i - 1] and y[i] >= y[i + 1]:
            candidates.append(i)
    if not candidates:
        return []
    rng = np.nanmax(y) - np.nanmin(y)
    min_prom = rng * prominence_frac
    # sortiere Kandidaten nach Hoehe, greedy auswaehlen mit Mindestabstand
    candidates.sort(key=lambda i: -y[i])
    chosen = []
    for i in candidates:
        if all(abs(i - j) >= min_distance for j in chosen):
            chosen.append(i)
    chosen.sort()
    # schwache Peaks (kaum ueber dem lokalen Minimum) verwerfen
    filtered = []
    for i in chosen:
        lo = max(0, i - min_distance)
        hi = min(len(y), i + min_distance + 1)
        local_min = np.nanmin(y[lo:hi])
        if y[i] - local_min >= min_prom:
            filtered.append(i)
    return filtered


def fit_parabola_vertex(x, y):
    """Ausgleichsparabel 2. Grades, gibt (x_scheitel, y_scheitel) zurueck."""
    x = np.asarray(x, dtype=float)
    y = np.asarray(y, dtype=float)
    mask = ~np.isnan(y)
    x, y = x[mask], y[mask]
    if len(x) < 3:
        return None, None
    coeffs = np.polyfit(x, y, 2)
    a, b, c = coeffs
    if abs(a) < 1e-9:
        return None, None
    x_v = -b / (2 * a)
    y_v = a * x_v**2 + b * x_v + c
    return x_v, y_v


def find_bdc_flexion_per_cycle(flexion_raw, ankle_y, fps, valid_mask=None):
    """
    Kernstueck der Messkette:
      1. Trittdauer aus der Knoechelhoehe schaetzen.
      2. Peaks der (geglaetteten) Knoechelhoehe = grobe Lage jedes Totpunkts.
      3. Je Umdrehung: groben Ort = Minimum der Beugung in der Umgebung des Peaks.
      4. Fenster = 1/4 Trittdauer um diesen groben Ort, Parabel auf die
         UNGEGLAETTETEN Beugungswerte, Scheitel ablesen.
    Gibt (liste_der_scheitelwerte, trittdauer_bilder, peak_indices) zurueck.
    """
    flexion_raw = np.asarray(flexion_raw, dtype=float)
    ankle_y = np.asarray(ankle_y, dtype=float)
    n = len(flexion_raw)
    frames = np.arange(n)

    if valid_mask is None:
        valid_mask = np.ones(n, dtype=bool)

    period = estimate_period_frames(ankle_y, fps)
    smooth_ankle = moving_average(ankle_y, max(3, period // 8))
    smooth_flex = moving_average(flexion_raw, max(3, period // 8))

    peak_idxs = find_peaks(smooth_ankle, min_distance=int(period * 0.6))

    window_half = max(2, int(round(period / 4 / 2)))
    search_half = max(window_half, int(round(period * 0.3)))

    results = []  # Liste von dicts: {frame, flexion}
    used_peaks = []
    for p in peak_idxs:
        lo_s = max(0, p - search_half)
        hi_s = min(n, p + search_half + 1)
        local = smooth_flex[lo_s:hi_s].copy()
        local_valid = valid_mask[lo_s:hi_s]
        local[~local_valid] = np.inf
        if not np.any(np.isfinite(local)):
            continue
        rough_idx = lo_s + int(np.argmin(local))

        lo_w = max(0, rough_idx - window_half)
        hi_w = min(n, rough_idx + window_half + 1)
        xs = frames[lo_w:hi_w]
        ys = flexion_raw[lo_w:hi_w]
        vw = valid_mask[lo_w:hi_w]
        xs, ys = xs[vw], ys[vw]
        if len(xs) < 3:
            continue
        x_v, y_v = fit_parabola_vertex(xs, ys)
        if y_v is None:
            continue
        # Scheitel sollte plausibel innerhalb/nahe des Fensters liegen
        if x_v < xs.min() - window_half or x_v > xs.max() + window_half:
            continue
        results.append({"frame": float(x_v), "flexion": float(y_v)})
        used_peaks.append(p)

    return results, period, used_peaks
