#!/usr/bin/env python3
"""
YOLOv8n Fashion Detector Training Script
Trains YOLOv8n model on DeepFashion2 dataset optimized for mobile deployment
"""

from ultralytics import YOLO
import torch
import os
from datetime import datetime

def train_garment_detector(
    data_yaml='deepfashion2_yolo/data.yaml',
    epochs=100,
    batch_size=32,
    img_size=320,
    device=None,
    project='runs/detect',
    name='yolov8n_fashion'
):
    """
    Train YOLOv8n model for garment detection
    
    Args:
        data_yaml: Path to data.yaml file
        epochs: Number of training epochs
        batch_size: Batch size (adjust based on GPU memory)
        img_size: Input image size (320 for mobile optimization)
        device: Device to train on ('cpu', 0, '0,1', etc.)
        project: Project directory for runs
        name: Run name
    """
    
    # Auto-detect device if not specified
    if device is None:
        device = 0 if torch.cuda.is_available() else 'cpu'
    
    print("=" * 60)
    print("YOLOv8n Fashion Detector Training")
    print("=" * 60)
    print(f"Device: {'GPU' if device == 0 else 'CPU'}")
    print(f"Dataset: {data_yaml}")
    print(f"Epochs: {epochs}")
    print(f"Batch size: {batch_size}")
    print(f"Image size: {img_size}x{img_size}")
    print(f"Start time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    
    # Check if dataset exists
    if not os.path.exists(data_yaml):
        print(f"❌ Error: Dataset file not found: {data_yaml}")
        print("Please run convert_deepfashion2.py first or download dataset using Roboflow")
        return None
    
    # Load pre-trained YOLOv8n
    print("\n📦 Loading YOLOv8n pre-trained model...")
    model = YOLO('yolov8n.pt')
    
    # Training hyperparameters optimized for mobile deployment
    print("\n🚀 Starting training...")
    results = model.train(
        data=data_yaml,
        epochs=epochs,
        imgsz=img_size,
        batch=batch_size,
        device=device,
        
        # Optimization settings
        patience=20,  # Early stopping
        save=True,
        save_period=10,  # Save checkpoint every 10 epochs
        
        # Augmentation (built-in)
        hsv_h=0.015,      # Hue augmentation
        hsv_s=0.7,        # Saturation
        hsv_v=0.4,        # Value/brightness
        degrees=10,       # Rotation
        translate=0.1,    # Translation
        scale=0.5,        # Scale
        flipud=0.0,       # No vertical flip (fashion context)
        fliplr=0.5,       # Horizontal flip 50%
        mosaic=1.0,       # Mosaic augmentation
        mixup=0.1,        # Mixup augmentation
        
        # Performance
        optimizer='AdamW',
        lr0=0.001,        # Initial learning rate
        lrf=0.01,         # Final learning rate
        momentum=0.937,
        weight_decay=0.0005,
        warmup_epochs=3,
        
        # Model size optimization
        amp=True,         # Automatic mixed precision (faster training)
        
        # Logging
        project=project,
        name=name,
        exist_ok=True,
        
        # Validation
        val=True,
        plots=True,       # Save training plots
    )
    
    print("\n" + "=" * 60)
    print("✅ Training complete!")
    print("=" * 60)
    print(f"Best model: {project}/{name}/weights/best.pt")
    print(f"Last model: {project}/{name}/weights/last.pt")
    print(f"Results directory: {project}/{name}")
    print("=" * 60)
    
    return model

if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description='Train YOLOv8n fashion detector')
    parser.add_argument('--data', default='deepfashion2_yolo/data.yaml', help='Path to data.yaml')
    parser.add_argument('--epochs', type=int, default=100, help='Number of epochs')
    parser.add_argument('--batch', type=int, default=32, help='Batch size')
    parser.add_argument('--img-size', type=int, default=320, help='Input image size')
    parser.add_argument('--device', default=None, help='Device (cpu, 0, 0,1, etc.)')
    parser.add_argument('--project', default='runs/detect', help='Project directory')
    parser.add_argument('--name', default='yolov8n_fashion', help='Run name')
    
    args = parser.parse_args()
    
    model = train_garment_detector(
        data_yaml=args.data,
        epochs=args.epochs,
        batch_size=args.batch,
        img_size=args.img_size,
        device=args.device,
        project=args.project,
        name=args.name
    )
