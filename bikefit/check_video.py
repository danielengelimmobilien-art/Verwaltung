import sys
import cv2
import numpy as np
from ultralytics import YOLO

VIDEO = "input/video.mp4"
MODEL = "yolo11x-pose.pt"

# COCO-17 keypoint indices
NOSE, L_EYE, R_EYE, L_EAR, R_EAR = 0, 1, 2, 3, 4
L_SHOULDER, R_SHOULDER = 5, 6
L_ELBOW, R_ELBOW = 7, 8
L_WRIST, R_WRIST = 9, 10
L_HIP, R_HIP = 11, 12
L_KNEE, R_KNEE = 13, 14
L_ANKLE, R_ANKLE = 15, 16

cap = cv2.VideoCapture(VIDEO)
fps = cap.get(cv2.CAP_PROP_FPS)
n_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
duration = n_frames / fps if fps else 0
print(f"FPS (aus Container gelesen): {fps:.3f}")
print(f"Aufloesung (wie OpenCV sie liefert, nach Rotation): {width}x{height}")
print(f"Bilder gesamt: {n_frames}, Laenge: {duration:.2f}s")

model = YOLO(MODEL)

# Sample frames evenly across the clip (skip first/last 0.5s to avoid mount/dismount)
sample_idxs = np.linspace(int(0.1 * n_frames), int(0.9 * n_frames), 25, dtype=int)

ratios = []
confs_hip, confs_knee, confs_ankle = [], [], []
left_conf_sum, right_conf_sum = 0.0, 0.0

for idx in sample_idxs:
    cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
    ok, frame = cap.read()
    if not ok:
        continue
    res = model.predict(frame, device="cpu", verbose=False)[0]
    if res.keypoints is None or len(res.keypoints.xy) == 0:
        continue
    # pick person with highest mean confidence
    confs_all = res.keypoints.conf.cpu().numpy()  # (n_people, 17)
    mean_confs = confs_all.mean(axis=1)
    best = int(np.argmax(mean_confs))
    xy = res.keypoints.xy[best].cpu().numpy()  # pixel coords (17,2)
    conf = confs_all[best]

    l_sh, r_sh = xy[L_SHOULDER], xy[R_SHOULDER]
    l_hip, r_hip = xy[L_HIP], xy[R_HIP]

    shoulder_dx = abs(l_sh[0] - r_sh[0])
    # shoulder-to-hip distance (use average of both sides midpoints)
    mid_sh = (l_sh + r_sh) / 2
    mid_hip = (l_hip + r_hip) / 2
    sh_hip_dist = np.linalg.norm(mid_sh - mid_hip)
    if sh_hip_dist > 1e-3:
        ratio = shoulder_dx / sh_hip_dist
        ratios.append(ratio)

    confs_hip.append((conf[L_HIP] + conf[R_HIP]) / 2)
    confs_knee.append((conf[L_KNEE] + conf[R_KNEE]) / 2)
    confs_ankle.append((conf[L_ANKLE] + conf[R_ANKLE]) / 2)

    left_side_conf = np.mean([conf[L_SHOULDER], conf[L_HIP], conf[L_KNEE], conf[L_ANKLE]])
    right_side_conf = np.mean([conf[R_SHOULDER], conf[R_HIP], conf[R_KNEE], conf[R_ANKLE]])
    left_conf_sum += left_side_conf
    right_conf_sum += right_side_conf

cap.release()

print()
print(f"Seitlichkeits-Verhaeltnis (Schulterabstand / Schulter-Huefte-Abstand), Median: {np.median(ratios):.3f}")
print(f"  (Schwelle 0.25 -> darueber = Kamera stand schraeg)")
print(f"Mittlere Zuversicht Huefte:   {np.mean(confs_hip):.3f}")
print(f"Mittlere Zuversicht Knie:     {np.mean(confs_knee):.3f}")
print(f"Mittlere Zuversicht Knoechel: {np.mean(confs_ankle):.3f}")
print()
print(f"Mittlere Zuversicht linke Seite:  {left_conf_sum/len(sample_idxs):.3f}")
print(f"Mittlere Zuversicht rechte Seite: {right_conf_sum/len(sample_idxs):.3f}")
