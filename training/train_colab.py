"""
Google Colab Training Script for YOLOv8n Fashion Detector

Upload this file to Google Colab and run all cells to train on free GPU.

Instructions:
1. Go to https://colab.research.google.com
2. Upload this file or copy-paste into a new notebook
3. Run each cell sequentially
4. Download exported models at the end

Note: Convert this to .ipynb format by creating a Jupyter notebook with these cells.
"""

# Cell 1: Install dependencies
"""
!pip install ultralytics roboflow
"""

# Cell 2: Download dataset using Roboflow (fastest option)
"""
from roboflow import Roboflow

# Get API key from https://roboflow.com
rf = Roboflow(api_key="YOUR_API_KEY_HERE")

# Download pre-converted DeepFashion2 dataset
project = rf.workspace("fashion-detection").project("clothing-detection")
dataset = project.version(1).download("yolov8")

print(f"Dataset downloaded to: {dataset.location}")
"""

# Cell 3: Train YOLOv8n
"""
from ultralytics import YOLO
import torch

# Check GPU
device = 0 if torch.cuda.is_available() else 'cpu'
print(f"Training on: {'GPU' if device == 0 else 'CPU'}")

# Load pre-trained YOLOv8n
model = YOLO('yolov8n.pt')

# Train with mobile-optimized settings
results = model.train(
    data=f'{dataset.location}/data.yaml',
    epochs=100,
    imgsz=320,  # Mobile-optimized
    batch=32,
    device=device,
    patience=20,
    amp=True,  # Faster training
    project='runs/detect',
    name='yolov8n_fashion',
)

print("Training complete!")
print(f"Best model: runs/detect/yolov8n_fashion/weights/best.pt")
"""

# Cell 4: Evaluate model
"""
# Validate on test set
metrics = model.val()

print("\\nValidation Metrics:")
print(f"mAP@0.5:      {metrics.box.map50:.4f}")
print(f"mAP@0.5:0.95: {metrics.box.map:.4f}")
print(f"Precision:    {metrics.box.mp:.4f}")
print(f"Recall:       {metrics.box.mr:.4f}")
"""

# Cell 5: Export to mobile formats
"""
import os

# Export to CoreML (iOS)
try:
    coreml_path = model.export(format='coreml', imgsz=320, nms=True)
    print(f"CoreML model: {coreml_path}")
except Exception as e:
    print(f"CoreML export failed (expected on Colab): {e}")

# Export to TFLite (Android)
tflite_path = model.export(
    format='tflite',
    imgsz=320,
    int8=False,
    data=f'{dataset.location}/data.yaml'
)
print(f"TFLite model: {tflite_path}")
"""

# Cell 6: Download models
"""
from google.colab import files

# Download best model weights
files.download('runs/detect/yolov8n_fashion/weights/best.pt')

# Download TFLite model
tflite_file = 'runs/detect/yolov8n_fashion/weights/best_saved_model/best_float16.tflite'
if os.path.exists(tflite_file):
    files.download(tflite_file)
else:
    print(f"TFLite model not found at: {tflite_file}")

print("\\nDownload complete! Upload models to your React Native project:")
print("- iOS: template/ios/Models/yolov8n_fashion.mlmodel")
print("- Android: template/android/app/src/main/assets/yolov8n_fashion.tflite")
"""

# Cell 7: Optional - Test predictions
"""
# Test on sample images
import matplotlib.pyplot as plt
from PIL import Image

results = model.predict(
    source=f'{dataset.location}/test/images',
    save=True,
    conf=0.7,
    max_det=10,
)

# Show first prediction
if results:
    img = Image.open(results[0].path)
    plt.figure(figsize=(12, 8))
    plt.imshow(img)
    plt.axis('off')
    plt.title('Sample Detection')
    plt.show()
"""

if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("Google Colab Training Script for YOLOv8n Fashion Detector")
    print("=" * 60)
    print("\nThis is a Python file containing code for Colab cells.")
    print("Convert to .ipynb format or copy-paste into Colab.")
    print("\nQuick Start:")
    print("1. Go to https://colab.research.google.com")
    print("2. Create new notebook")
    print("3. Copy each cell's code (between triple quotes)")
    print("4. Run cells sequentially")
    print("5. Download exported models")
    print("=" * 60)
