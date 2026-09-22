"""
Schritt 4: Validierung der Messkette an einem kuenstlichen Tretzyklus mit
bekanntem Kniewinkel, BEVOR echtes Videomaterial angefasst wird.

Kinematisches Modell (alles in mm, Ursprung = Tretlager):
  - Pedal laeuft auf einem Kreis mit Radius CRANK um das Tretlager.
    theta=0 => Pedal genau unten (unterer Totpunkt, BDC).
  - Huefte an festem Punkt (HIP_X, HIP_Y), HIP_X hinter dem Tretlager,
    HIP_Y so gewaehlt, dass am BDC genau TARGET_FLEXION_DEG Beugung herauskommt
    (Kosinussatz, nicht Ausprobieren).
  - Knie = Schnittpunkt zweier Kreise: um die Huefte mit Radius THIGH,
    um das Pedal mit Radius SHANK. Die vordere Loesung wird genommen.
  - "Knoechel" wird fuer dieses Modell mit der Pedalposition gleichgesetzt
    (Vereinfachung, wie in der Aufgabenstellung beschrieben).
"""
import numpy as np
from lib.geometry import knee_flexion_deg, interior_angle_deg
from lib.cycle import find_bdc_flexion_per_cycle

CRANK = 172.5
THIGH = 430.0
SHANK = 440.0
TARGET_FLEXION_DEG = 35.0
HIP_X = -80.0  # mm, hinter dem Tretlager

# --- Huefthoehe ueber Kosinussatz bestimmen ---
theta_interior = np.radians(180.0 - TARGET_FLEXION_DEG)
D = np.sqrt(THIGH**2 + SHANK**2 - 2 * THIGH * SHANK * np.cos(theta_interior))
# Pedal am BDC: (0, -CRANK). Abstand Huefte-Pedal = D.
# (HIP_X - 0)^2 + (HIP_Y - (-CRANK))^2 = D^2
inner = D**2 - HIP_X**2
if inner < 0:
    raise ValueError("HIP_X zu gross fuer diese Geometrie gewaehlt.")
HIP_Y = -CRANK + np.sqrt(inner)

print(f"Kosinussatz-Ausgangswerte: D (Huefte-Pedal am BDC) = {D:.2f} mm")
print(f"Daraus Huefthoehe HIP_Y = {HIP_Y:.2f} mm (HIP_X = {HIP_X:.1f} mm)")

HIP = np.array([HIP_X, HIP_Y])


def pedal_pos(theta):
    return np.array([CRANK * np.sin(theta), -CRANK * np.cos(theta)])


def knee_pos(hip, pedal, thigh=THIGH, shank=SHANK):
    d = np.linalg.norm(pedal - hip)
    if d > thigh + shank or d < abs(thigh - shank):
        raise ValueError("Kreise schneiden sich nicht - Geometrie unplausibel.")
    a = (thigh**2 - shank**2 + d**2) / (2 * d)
    h = np.sqrt(max(thigh**2 - a**2, 0.0))
    mid = hip + a * (pedal - hip) / d
    perp = np.array([-(pedal[1] - hip[1]), pedal[0] - hip[0]]) / d
    k1 = mid + h * perp
    k2 = mid - h * perp
    # vordere (in Fahrtrichtung +x liegende) Loesung waehlen
    return k1 if k1[0] > k2[0] else k2


# Sanity check: bei theta=0 (BDC) muss die Beugung TARGET_FLEXION_DEG sein
p0 = pedal_pos(0.0)
k0 = knee_pos(HIP, p0)
flex0 = knee_flexion_deg(HIP, k0, p0)
print(f"Kontrolle bei theta=0 (BDC): Beugung = {flex0:.4f} Grad (Soll {TARGET_FLEXION_DEG})")
assert abs(flex0 - TARGET_FLEXION_DEG) < 1e-6, "Kosinussatz-Konstruktion fehlerhaft!"

# --- Synthetischen Clip erzeugen und durch die Messkette schicken ---
SCALE_PX_PER_MM = 0.8  # realistische Groessenordnung fuer ein Portraitvideo
FPS = 29.997
DURATION_S = 10.0
CADENCE_RPM = 85.0
FREQ_HZ = CADENCE_RPM / 60.0

N = int(round(DURATION_S * FPS))
t = np.arange(N) / FPS


def to_px(mm_point, origin_px=(540.0, 1400.0)):
    # Bildkoordinaten: y waechst nach unten -> physikalisches "oben" wird kleineres y
    x_px = origin_px[0] + mm_point[0] * SCALE_PX_PER_MM
    y_px = origin_px[1] - mm_point[1] * SCALE_PX_PER_MM
    return np.array([x_px, y_px])


def run_trial(noise_std_px, phase, seed):
    rng = np.random.default_rng(seed)
    hip_px = np.tile(to_px(HIP), (N, 1))
    knee_px = np.zeros((N, 2))
    ankle_px = np.zeros((N, 2))
    for i in range(N):
        theta = 2 * np.pi * FREQ_HZ * t[i] + phase
        pedal = pedal_pos(theta)
        knee = knee_pos(HIP, pedal)
        knee_px[i] = to_px(knee)
        ankle_px[i] = to_px(pedal)

    if noise_std_px > 0:
        hip_px = hip_px + rng.normal(0, noise_std_px, hip_px.shape)
        knee_px = knee_px + rng.normal(0, noise_std_px, knee_px.shape)
        ankle_px = ankle_px + rng.normal(0, noise_std_px, ankle_px.shape)

    flexion = np.array([
        knee_flexion_deg(hip_px[i], knee_px[i], ankle_px[i]) for i in range(N)
    ])
    ankle_y = ankle_px[:, 1]

    cycles, period, peaks = find_bdc_flexion_per_cycle(flexion, ankle_y, FPS)
    if len(cycles) == 0:
        return None, period, 0
    vertices = [c["flexion"] for c in cycles]
    return float(np.median(vertices)), period, len(vertices)


trials = []
rng_master = np.random.default_rng(42)
N_TRIALS = 24
for k in range(N_TRIALS):
    noise = rng_master.choice([0.0, 1.0, 2.0, 3.0])
    phase = rng_master.uniform(0, 2 * np.pi)
    seed = 1000 + k
    est, period, n_cycles = run_trial(noise, phase, seed)
    err = None if est is None else abs(est - TARGET_FLEXION_DEG)
    trials.append(dict(trial=k, noise_px=noise, phase=phase, period_frames=period,
                        n_cycles=n_cycles, estimate=est, error=err))

print()
print(f"{'#':>3} {'Rauschen(px)':>12} {'Phase':>7} {'Periode(f)':>11} {'Zyklen':>7} {'Schaetzung':>11} {'Fehler':>8}")
for r in trials:
    est_s = f"{r['estimate']:.3f}" if r['estimate'] is not None else "  n/a"
    err_s = f"{r['error']:.3f}" if r['error'] is not None else "  n/a"
    print(f"{r['trial']:>3} {r['noise_px']:>12.1f} {r['phase']:>7.2f} {r['period_frames']:>11d} "
          f"{r['n_cycles']:>7} {est_s:>11} {err_s:>8}")

errors = [r["error"] for r in trials if r["error"] is not None]
n_failed = sum(1 for r in trials if r["error"] is None)

print()
print(f"Durchlaeufe gesamt: {N_TRIALS}, davon ohne Ergebnis: {n_failed}")
if errors:
    print(f"Mittlerer Fehler: {np.mean(errors):.4f} Grad")
    print(f"Schlechtester Einzelfall: {np.max(errors):.4f} Grad")
    print(f"Median Fehler: {np.median(errors):.4f} Grad")
else:
    print("Keine gueltigen Ergebnisse - Messkette fehlerhaft.")
