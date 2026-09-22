"""Schritt 5, Teil 1: Pose ueber jedes Bild des echten Videos, Ergebnis cachen.
Getrennt von der Auswertung, damit das teure Modell nur einmal laufen muss."""
import sys
import time
import cv2
import numpy as np
from ultralytics import YOLO

VIDEO = "input/video.mp4"
MODEL = "yolo11x-pose.pt"
OUT = "cache_keypoints.npz"

cap = cv2.VideoCapture(VIDEO)
fps = cap.get(cv2.CAP_PROP_FPS)
n_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
print(f"FPS={fps:.4f} Bilder={n_frames} Aufloesung={width}x{height}")

model = YOLO(MODEL)

# xy: (n_frames, 17, 2) NaN wenn keine Person gefunden
# conf: (n_frames, 17)
xy = np.full((n_frames, 17, 2), np.nan, dtype=np.float64)
conf = np.full((n_frames, 17), np.nan, dtype=np.float64)
n_people = np.zeros(n_frames, dtype=np.int32)

t0 = time.time()
i = 0
while True:
    ok, frame = cap.read()
    if not ok:
        break
    res = model.predict(frame, device="cpu", verbose=False)[0]
    if res.keypoints is not None and len(res.keypoints.xy) > 0:
        confs_all = res.keypoints.conf.cpu().numpy()
        n_people[i] = confs_all.shape[0]
        mean_confs = confs_all.mean(axis=1)
        best = int(np.argmax(mean_confs))
        xy[i] = res.keypoints.xy[best].cpu().numpy()
        conf[i] = confs_all[best]
    i += 1
    if i % 30 == 0 or i == n_frames:
        elapsed = time.time() - t0
        rate = i / elapsed if elapsed > 0 else 0
        eta = (n_frames - i) / rate if rate > 0 else float("nan")
        print(f"  Bild {i}/{n_frames}  ({elapsed:.0f}s vergangen, ~{eta:.0f}s verbleibend)", flush=True)

cap.release()
dt = time.time() - t0
print(f"Fertig in {dt:.1f}s ({dt/n_frames:.3f}s/Bild)")

np.savez(OUT, xy=xy, conf=conf, n_people=n_people, fps=fps,
         n_frames=n_frames, width=width, height=height)
print(f"Gespeichert nach {OUT}")
