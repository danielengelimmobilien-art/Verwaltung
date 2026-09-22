"""Reine Geometrie auf Koerperpunkten. Alle Punkte sind (x, y) in Pixeln."""
import numpy as np


def interior_angle_deg(a, b, c):
    """Winkel an Punkt b, zwischen den Strahlen b->a und b->c, in Grad."""
    a = np.asarray(a, dtype=float)
    b = np.asarray(b, dtype=float)
    c = np.asarray(c, dtype=float)
    v1 = a - b
    v2 = c - b
    n1 = np.linalg.norm(v1)
    n2 = np.linalg.norm(v2)
    if n1 < 1e-9 or n2 < 1e-9:
        return np.nan
    cos_ang = np.dot(v1, v2) / (n1 * n2)
    cos_ang = np.clip(cos_ang, -1.0, 1.0)
    return np.degrees(np.arccos(cos_ang))


def knee_flexion_deg(hip, knee, ankle):
    """Beugung im Knie = 180 Grad minus dem Winkel Huefte-Knie-Knoechel."""
    return 180.0 - interior_angle_deg(hip, knee, ankle)


def elbow_flexion_deg(shoulder, elbow, wrist):
    return 180.0 - interior_angle_deg(shoulder, elbow, wrist)


def trunk_angle_deg(shoulder, hip):
    """Neigung der Linie Schulter-Huefte gegen die Waagerechte, in Grad, immer positiv."""
    shoulder = np.asarray(shoulder, dtype=float)
    hip = np.asarray(hip, dtype=float)
    dx = shoulder[0] - hip[0]
    dy = shoulder[1] - hip[1]
    # Bildkoordinaten: y waechst nach unten. Neigung gegen die Waagerechte:
    return np.degrees(np.arctan2(abs(dy), abs(dx)))


def mm_per_degree_at_knee(thigh_mm, shank_mm, interior_angle_deg_, dist_mm=None):
    """
    Ableitung des Hueft-Pedal-Abstands D nach dem Kniewinkel theta (Kosinussatz):
        D^2 = a^2 + b^2 - 2ab*cos(theta)
        dD/dtheta = a*b*sin(theta) / D
    Rueckgabe in mm pro Grad (theta in Grad uebergeben, intern in Radiant gerechnet).
    Wenn dist_mm nicht angegeben ist, wird D selbst ueber den Kosinussatz bestimmt.
    """
    a, b = float(thigh_mm), float(shank_mm)
    theta = np.radians(interior_angle_deg_)
    if dist_mm is None:
        d = np.sqrt(a**2 + b**2 - 2 * a * b * np.cos(theta))
    else:
        d = float(dist_mm)
    if d < 1e-6:
        return np.nan
    mm_per_radian = (a * b * np.sin(theta)) / d
    return mm_per_radian * (np.pi / 180.0)
