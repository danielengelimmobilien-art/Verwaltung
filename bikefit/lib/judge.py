"""Einheitliche Schwellen fuer Farbe UND Text (WICHTIG 4: nie auseinanderlaufen).
Toleranz von 2,5 Grad an allen Raendern, weil ein Handyvideo nur auf ca.
2-3 Grad genau aufloest."""

TOL = 2.5

KNEE_LO, KNEE_HI = 30.0, 40.0          # Sollband Kniebeugung am BDC
TRUNK_LO, TRUNK_HI = 40.0, 50.0        # Erfahrungswert Rumpfneigung
ELBOW_LO, ELBOW_HI = 15.0, 30.0        # Erfahrungswert Ellbogenbeugung

GREEN = (46, 204, 113)
YELLOW = (241, 196, 15)
RED = (231, 76, 60)
GRAY = (149, 165, 166)


def _judge_band(value, lo, hi, tol=TOL):
    if value is None:
        return "gray", "keine Messung"
    if lo <= value <= hi:
        return "green", "im Sollbereich"
    if lo - tol <= value < lo or hi < value <= hi + tol:
        return "yellow", "Grenzbereich (Messtoleranz)"
    return "red", "ausserhalb"


def judge_knee(flexion_deg):
    return _judge_band(flexion_deg, KNEE_LO, KNEE_HI)


def judge_trunk(angle_deg):
    return _judge_band(angle_deg, TRUNK_LO, TRUNK_HI)


def judge_elbow(flexion_deg):
    return _judge_band(flexion_deg, ELBOW_LO, ELBOW_HI)


def color_for(label):
    return {"green": GREEN, "yellow": YELLOW, "red": RED, "gray": GRAY}[label]
