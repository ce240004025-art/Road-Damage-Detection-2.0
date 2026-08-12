"""
YOLOv8 Training Script - Local Dataset (RDD_SPLIT)
==================================================
Trains the model using the pre-downloaded RDD_SPLIT folder.
"""

import os, sys, shutil
from pathlib import Path

# ── CONFIG ─────────────────────────────────────────────────────────────────────
CLASS_NAMES  = ["D00", "D10", "D20", "D40"]
# D00 = Longitudinal Crack
# D10 = Transverse Crack
# D20 = Alligator Crack
# D40 = Pothole

MODEL_SIZE   = "yolov8s"    # Small model (much faster than medium, fits in <40hr)
EPOCHS       = 30           # Reduced epochs to guarantee completion
IMG_SIZE     = 640
BATCH_SIZE   = 8            # Reduced batch size slightly for larger model

DATASET_DIR  = Path(r"E:\experiments\Project\SC\model\RDD_SPLIT")
YAML_PATH    = DATASET_DIR / "rdd_local.yaml"
OUTPUT_MODEL = Path(r"E:\experiments\Project\SC\model\best.pt")


# ── STEP 1: YAML ──────────────────────────────────────────────────────────────
def create_yaml():
    print("\n[1/2] Creating YAML config...")
    
    # YOLO expects path to be absolute or relative to where training is run
    names_str = "\n".join(f"  {i}: {n}" for i, n in enumerate(CLASS_NAMES))
    
    yaml_content = f"""path: {DATASET_DIR.resolve()}
train: train/images
val: val/images
test: test/images
nc: {len(CLASS_NAMES)}
names:
{names_str}
"""
    YAML_PATH.write_text(yaml_content)
    print(f"  Saved YAML to: {YAML_PATH}")
    return str(YAML_PATH)


# ── STEP 2: TRAIN ─────────────────────────────────────────────────────────────
def train_model(yaml_path):
    print(f"\n[2/2] Training {MODEL_SIZE} for {EPOCHS} epochs for BEST results...")

    try:
        import torch
        device = "0" if torch.cuda.is_available() else "cpu"
        print(f"  Device: {'GPU ✓' if device == '0' else 'CPU (slower)'}")
    except Exception:
        device = "cpu"

    try:
        from ultralytics import YOLO
    except ImportError:
        print("  Installing ultralytics...")
        os.system(f"{sys.executable} -m pip install ultralytics")
        from ultralytics import YOLO

    model = YOLO(f"{MODEL_SIZE}.pt")   # starts from COCO pretrained weights

    model.train(
        data=yaml_path,
        epochs=EPOCHS,
        imgsz=IMG_SIZE,
        batch=BATCH_SIZE,
        device=device,
        project="runs/train",
        name="rdd2022_best",
        exist_ok=True,
        patience=20,
        cache=False, 
        workers=4,
    )

    best = Path("runs/train/rdd2022_best/weights/best.pt")
    if best.exists():
        shutil.copy2(best, OUTPUT_MODEL)
        print(f"\n  SUCCESS! Saved best model to: {OUTPUT_MODEL.resolve()}")
        print("  Restart the backend to use the new model.")
    else:
        print(f"  Check manually: runs/train/rdd2022_best/weights/")


# ── MAIN ──────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("=" * 55)
    print("  RDD YOLOv8 Training (Local RDD_SPLIT dataset)")
    print("=" * 55)

    if not (DATASET_DIR / "train" / "images").exists():
        print(f"\n  ERROR: Could not find train/images in {DATASET_DIR}")
        sys.exit(1)

    yaml_path = create_yaml()
    train_model(yaml_path)

    print("\n" + "=" * 55)
    print("  DONE! Restart backend to load the new model.")
    print("=" * 55)
