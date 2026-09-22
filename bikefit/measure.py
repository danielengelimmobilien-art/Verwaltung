"""Schritt 5, Teil 2: aus den gecachten Koerperpunkten Winkel, Totpunkt und
Sattelempfehlung berechnen. Trennt sich bewusst von der teuren Pose-Erkennung."""
import json
import numpy as np
from lib.geometry import (knee_flexion_deg, elbow_flexion_deg, trunk_angle_deg,
                           mm_per_degree_at_knee, interior_angle_deg)
from lib.cycle import find_bdc_flexion_per_cycle, moving_average
from lib.judge import judge_knee, judge_trunk, judge_elbow

CRANK_MM = 172.5  # vom Nutzer bestaetigt

NOSE, L_EYE, R_EYE, L_EAR, R_EAR = 0, 1, 2, 3, 4
L_SHOULDER, R_SHOULDER = 5, 6
L_ELBOW, R_ELBOW = 7, 8
L_WRIST, R_WRIST = 9, 10
L_HIP, R_HIP = 11, 12
L_KNEE, R_KNEE = 13, 14
L_ANKLE, R_ANKLE = 15, 16

LEFT = dict(shoulder=L_SHOULDER, elbow=L_ELBOW, wrist=L_WRIST, hip=L_HIP, knee=L_KNEE, ankle=L_ANKLE)
RIGHT = dict(shoulder=R_SHOULDER, elbow=R_ELBOW, wrist=R_WRIST, hip=R_HIP, knee=R_KNEE, ankle=R_ANKLE)


def load_cache(path="cache_keypoints.npz"):
    d = np.load(path)
    return dict(xy=d["xy"], conf=d["conf"], n_people=d["n_people"], fps=float(d["fps"]),
                n_frames=int(d["n_frames"]), width=int(d["width"]), height=int(d["height"]))


def choose_side(conf):
    """Einmal fuer den ganzen Clip: welche Seite hat im Mittel die hoehere Zuversicht."""
    idxs_left = list(LEFT.values())
    idxs_right = list(RIGHT.values())
    mean_left = np.nanmean(conf[:, idxs_left])
    mean_right = np.nanmean(conf[:, idxs_right])
    if mean_right >= mean_left:
        return "right", RIGHT, mean_right, mean_left
    return "left", LEFT, mean_left, mean_right


def main():
    cache = load_cache()
    xy, conf, fps, n_frames = cache["xy"], cache["conf"], cache["fps"], cache["n_frames"]

    side, idx, mean_chosen, mean_other = choose_side(conf)
    print(f"Gewaehlte Seite: {side} (Zuversicht {mean_chosen:.3f} vs. {mean_other:.3f} auf der anderen Seite)")

    hip = xy[:, idx["hip"]]
    knee = xy[:, idx["knee"]]
    ankle = xy[:, idx["ankle"]]
    shoulder = xy[:, idx["shoulder"]]
    elbow = xy[:, idx["elbow"]]
    wrist = xy[:, idx["wrist"]]

    knee_flex = np.array([knee_flexion_deg(hip[i], knee[i], ankle[i]) for i in range(n_frames)])
    trunk = np.array([trunk_angle_deg(shoulder[i], hip[i]) for i in range(n_frames)])
    elbow_flex = np.array([elbow_flexion_deg(shoulder[i], elbow[i], wrist[i]) for i in range(n_frames)])
    # Schulter- und Hueftwinkel: gemessen und angezeigt, aber NICHT bewertet (siehe Bericht)
    shoulder_angle = np.array([interior_angle_deg(hip[i], shoulder[i], elbow[i]) for i in range(n_frames)])
    hip_angle = np.array([interior_angle_deg(shoulder[i], hip[i], knee[i]) for i in range(n_frames)])

    quality = np.nanmean(conf[:, [idx["hip"], idx["knee"], idx["ankle"]]], axis=1)

    # erste und letzte Sekunde verwerfen, bevor Trittzyklen gesucht werden
    trim = int(round(fps))
    lo, hi = trim, n_frames - trim
    if hi <= lo:
        raise ValueError("Clip zu kurz nach Abzug von erster/letzter Sekunde.")

    ankle_y_trim = ankle[lo:hi, 1]
    flex_trim = knee_flex[lo:hi]

    cycles, period_frames, peak_idxs = find_bdc_flexion_per_cycle(flex_trim, ankle_y_trim, fps)
    if len(cycles) == 0:
        raise RuntimeError("Keine Trittzyklen gefunden - Messung nicht moeglich.")

    # globale Frame-Indizes (waren relativ zu 'lo')
    for c in cycles:
        c["frame_global"] = c["frame"] + lo

    cadence_rpm = 60.0 * fps / period_frames
    print(f"Trittdauer: {period_frames} Bilder (~{period_frames/fps:.2f}s), "
          f"geschaetzte Trittfrequenz ~{cadence_rpm:.0f} U/min")
    print(f"Erkannte Kurbelumdrehungen im auswertbaren Bereich: {len(cycles)}")
    if len(cycles) < 3:
        print("WARNUNG: Weniger als 3 Umdrehungen erkannt - Ergebnis ist statistisch duenn.")

    flex_values = [c["flexion"] for c in cycles]
    bdc_flexion = float(np.median(flex_values))
    print(f"Kniebeugung am unteren Totpunkt je Umdrehung: "
          + ", ".join(f"{v:.1f}" for v in sorted(flex_values)))
    print(f"MEDIAN Kniebeugung am unteren Totpunkt: {bdc_flexion:.1f} Grad")

    # --- Kalibrierung: vertikaler Knoechel-Hub zwischen Totpunkt und Gegenpunkt ~ 2x Kurbellaenge ---
    excursions = []
    ankle_y_full = ankle[:, 1]
    for c in cycles:
        f = int(round(c["frame_global"]))
        half = period_frames // 2
        top_lo = max(0, f - int(period_frames * 0.7))
        top_hi = min(n_frames, f - int(period_frames * 0.3))
        top2_lo = min(n_frames, f + int(period_frames * 0.3))
        top2_hi = min(n_frames, f + int(period_frames * 0.7))
        candidates = []
        if top_hi > top_lo:
            candidates.append(np.nanmin(ankle_y_full[top_lo:top_hi]))
        if top2_hi > top2_lo:
            candidates.append(np.nanmin(ankle_y_full[top2_lo:top2_hi]))
        if not candidates:
            continue
        top_y = np.nanmin(candidates)
        bottom_y = ankle_y_full[max(0, min(n_frames - 1, f))]
        excursion = bottom_y - top_y
        if excursion > 0:
            excursions.append(excursion)

    median_excursion_px = float(np.median(excursions))
    scale_px_per_mm = median_excursion_px / (2 * CRANK_MM)
    print(f"Kalibrierung: mittlerer Knoechel-Hub {median_excursion_px:.1f} px "
          f"<-> 2x Kurbellaenge ({2*CRANK_MM:.0f} mm) => {scale_px_per_mm:.3f} px/mm")

    # Frame nahe am Median fuer Bein-Laengen (fuer mm/Grad)
    closest_cycle = min(cycles, key=lambda c: abs(c["flexion"] - bdc_flexion))
    f_ref = int(round(closest_cycle["frame_global"]))
    thigh_px = np.linalg.norm(hip[f_ref] - knee[f_ref])
    shank_px = np.linalg.norm(knee[f_ref] - ankle[f_ref])
    thigh_mm = thigh_px / scale_px_per_mm
    shank_mm = shank_px / scale_px_per_mm
    print(f"Aus dem Video gemessene Beinlaengen (kalibriert): Oberschenkel {thigh_mm:.0f} mm, "
          f"Unterschenkel {shank_mm:.0f} mm")

    interior_angle = 180.0 - bdc_flexion
    mm_per_deg = mm_per_degree_at_knee(thigh_mm, shank_mm, interior_angle)
    print(f"mm pro Grad bei diesem Kniewinkel (aus dem Kosinussatz, mit deinen Massen): "
          f"{mm_per_deg:.2f} mm/Grad")

    # --- Urteil und Sattelempfehlung ---
    label, judgement = judge_knee(bdc_flexion)
    from lib.judge import KNEE_LO, KNEE_HI, TOL
    recommendation = None
    if label == "red":
        if bdc_flexion > KNEE_HI:
            deviation = bdc_flexion - KNEE_HI
            mm = deviation * mm_per_deg
            recommendation = ("anheben", mm, deviation)
        else:
            deviation = KNEE_LO - bdc_flexion
            mm = deviation * mm_per_deg
            recommendation = ("absenken", mm, deviation)

    trunk_median = float(np.nanmedian(trunk[lo:hi]))
    elbow_median = float(np.nanmedian(elbow_flex[lo:hi]))
    shoulder_median = float(np.nanmedian(shoulder_angle[lo:hi]))
    hip_median = float(np.nanmedian(hip_angle[lo:hi]))
    trunk_label, _ = judge_trunk(trunk_median)
    elbow_label, _ = judge_elbow(elbow_median)

    print()
    print(f"Rumpfneigung (Median): {trunk_median:.1f} Grad -> {trunk_label}")
    print(f"Ellbogenbeugung (Median): {elbow_median:.1f} Grad -> {elbow_label}")
    print()
    if recommendation:
        richtung, mm, deviation = recommendation
        print(f"EMPFEHLUNG: Sattel um {mm:.0f} mm {richtung} "
              f"({deviation:.1f} Grad ausserhalb des Sollbands, {mm_per_deg:.2f} mm/Grad).")
    elif label == "green":
        print("EMPFEHLUNG: Kniebeugung liegt im Sollbereich, keine Sattelverstellung noetig.")
    else:
        print("EMPFEHLUNG: Kniebeugung liegt im Grenzbereich der Messtoleranz, "
              "keine eindeutige Verstellung ableitbar.")

    out = dict(
        side=side, fps=fps, n_frames=n_frames,
        period_frames=period_frames, cadence_rpm=cadence_rpm,
        cycles=cycles, bdc_flexion=bdc_flexion,
        knee_label=label,
        scale_px_per_mm=scale_px_per_mm, thigh_mm=thigh_mm, shank_mm=shank_mm,
        mm_per_deg=mm_per_deg,
        trunk_median=trunk_median, elbow_median=elbow_median,
        trunk_label=trunk_label, elbow_label=elbow_label,
        shoulder_median=shoulder_median, hip_median=hip_median,
        recommendation=recommendation,
        trim_lo=lo, trim_hi=hi,
        closest_cycle_frame=f_ref,
    )
    with open("measure_result.json", "w") as f:
        json.dump(out, f, indent=2, default=lambda o: float(o) if isinstance(o, np.floating) else o)
    print("\nGespeichert nach measure_result.json")

    # Zeitreihen fuer das Overlay separat cachen (kompakt)
    np.savez("cache_series.npz", knee_flex=knee_flex, trunk=trunk, elbow_flex=elbow_flex,
             shoulder_angle=shoulder_angle, hip_angle=hip_angle,
             quality=quality, hip=hip, knee=knee, ankle=ankle, shoulder=shoulder,
             elbow=elbow, wrist=wrist)


if __name__ == "__main__":
    main()
