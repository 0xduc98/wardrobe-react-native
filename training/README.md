# YOLOv8n Fashion Detector Training

This directory contains scripts to train a YOLOv8n model on DeepFashion2 dataset for garment detection on mobile devices.

## Quick Start (Fastest - ~6 hours total)

### Option 1: Google Colab (Recommended - Free GPU)

1. **Upload to Colab**:
   ```bash
   # Go to https://colab.research.google.com
   # Create new notebook
   # Copy cells from train_colab.py
   ```

2. **Run all cells** (Colab provides free GPU)

3. **Download models** automatically at the end

### Option 2: Local Training

#### Prerequisites

```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

#### Step 1: Download Dataset

**Option A: Roboflow (Fastest - Pre-converted)**

```bash
python << EOF
from roboflow import Roboflow

rf = Roboflow(api_key="YOUR_API_KEY")  # Get from roboflow.com
project = rf.workspace("fashion-detection").project("clothing-detection")
dataset = project.version(1).download("yolov8")
EOF
```

**Option B: Direct Download**

1. Visit https://github.com/switchablenorms/DeepFashion2
2. Register and download dataset
3. Extract to `./deepfashion2/`

#### Step 2: Convert Dataset (if using Option B)

```bash
python convert_deepfashion2.py \
  --source ./deepfashion2 \
  --output ./deepfashion2_yolo
```

#### Step 3: Train Model

```bash
# GPU training (4-8 hours)
python train_yolo.py \
  --data deepfashion2_yolo/data.yaml \
  --epochs 100 \
  --batch 32 \
  --img-size 320

# CPU training (1-2 days, not recommended)
python train_yolo.py --device cpu
```

#### Step 4: Evaluate Model

```bash
python evaluate_model.py \
  --model runs/detect/yolov8n_fashion/weights/best.pt
```

#### Step 5: Export to Mobile Formats

```bash
python export_model.py \
  --model runs/detect/yolov8n_fashion/weights/best.pt \
  --mobile-project ..
```

## Expected Results

**Training Metrics (Production-Ready)**:
- mAP@0.5: >0.75
- mAP@0.5:0.95: >0.50
- Precision: >0.80
- Recall: >0.70

**Model Size**:
- CoreML (iOS): ~6MB
- TFLite (Android): ~3MB

**Inference Speed**:
- iPhone 11+: 50-100ms
- Pixel 4+: 50-100ms

## Scripts Overview

| Script | Purpose | Usage |
|--------|---------|-------|
| `convert_deepfashion2.py` | Convert dataset to YOLO format | Run once before training |
| `train_yolo.py` | Train YOLOv8n model | Main training script |
| `evaluate_model.py` | Evaluate trained model | Check performance metrics |
| `export_model.py` | Export to CoreML/TFLite | Prepare for mobile deployment |
| `train_colab.py` | Google Colab training | Use for free GPU training |

## Garment Categories

The model detects 6 garment categories:
1. **top** - Shirts, blouses, t-shirts
2. **bottom** - Pants, shorts, skirts
3. **shoes** - All footwear
4. **dress** - Full-length dresses
5. **outerwear** - Jackets, coats
6. **accessory** - Bags, belts, hats

**Category Mapping from DeepFashion2**:
- 13 DeepFashion2 classes → 6 app classes
- See `convert_deepfashion2.py` for full mapping

## Troubleshooting

### GPU Out of Memory

```bash
# Reduce batch size
python train_yolo.py --batch 16

# Or reduce image size (not recommended for accuracy)
python train_yolo.py --img-size 256
```

### CoreML Export Fails

```bash
# Install coremltools (macOS only)
pip install coremltools

# Or export on macOS later
```

### Dataset Download Issues

**Roboflow API Key**:
1. Sign up at https://roboflow.com
2. Go to Settings → API
3. Copy your API key

**DeepFashion2 Access**:
1. Fill form at https://github.com/switchablenorms/DeepFashion2
2. Wait for approval email
3. Download via provided link

## Training on Different Platforms

### Google Colab (Free GPU)
- **Best for**: Quick training without local GPU
- **Time**: 4-8 hours
- **Cost**: Free (with limits)

### Local GPU (NVIDIA)
- **Best for**: Repeated training, experimentation
- **Requirements**: CUDA-compatible GPU (8GB+ VRAM)
- **Time**: 4-8 hours

### Local CPU
- **Best for**: Testing scripts only
- **Time**: 1-2 days
- **Not recommended** for production training

### Cloud Platforms
- **AWS EC2 (p3.2xlarge)**: ~$3/hour
- **Google Cloud (n1-standard-8 + T4)**: ~$0.50/hour
- **Paperspace Gradient**: ~$0.50/hour

## Next Steps

After training and export:

1. **Copy Models to Mobile Project**:
   ```bash
   # iOS
   cp runs/detect/yolov8n_fashion/weights/best.mlmodel \
      ../template/ios/Models/yolov8n_fashion.mlmodel
   
   # Android
   cp runs/detect/yolov8n_fashion/weights/best_saved_model/best_float16.tflite \
      ../template/android/app/src/main/assets/yolov8n_fashion.tflite
   ```

2. **Implement Native Modules** (see main plan)

3. **Test on Devices**

4. **Fine-tune with App-Specific Data** (optional)

## Resources

- **Ultralytics YOLOv8 Docs**: https://docs.ultralytics.com
- **DeepFashion2 Paper**: https://arxiv.org/abs/1901.07973
- **Roboflow Platform**: https://roboflow.com
- **Google Colab**: https://colab.research.google.com

## Support

For issues with:
- **Training scripts**: Check this README and script help (`--help`)
- **Dataset**: See DeepFashion2 or Roboflow documentation
- **Mobile integration**: See main project documentation

---

**Training Timeline**: 6-10 hours (mostly automated GPU time)
**Developer Time**: ~1 hour setup + monitoring
