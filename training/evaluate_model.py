#!/usr/bin/env python3
"""
YOLOv8n Fashion Detector Evaluation Script
Evaluates trained model on validation set and generates test predictions
"""

from ultralytics import YOLO
import os
from pathlib import Path

def evaluate_model(
    model_path='runs/detect/yolov8n_fashion/weights/best.pt',
    data_yaml='deepfashion2_yolo/data.yaml',
    conf_threshold=0.7,
    save_predictions=True
):
    """
    Evaluate trained YOLOv8n model
    
    Args:
        model_path: Path to trained model weights
        data_yaml: Path to data.yaml file
        conf_threshold: Confidence threshold for predictions
        save_predictions: Whether to save prediction visualizations
    """
    
    print("=" * 60)
    print("YOLOv8n Fashion Detector Evaluation")
    print("=" * 60)
    print(f"Model: {model_path}")
    print(f"Dataset: {data_yaml}")
    print(f"Confidence threshold: {conf_threshold}")
    print("=" * 60)
    
    # Check if model exists
    if not os.path.exists(model_path):
        print(f"❌ Error: Model not found: {model_path}")
        print("Please train the model first using train_yolo.py")
        return None
    
    # Load trained model
    print("\n📦 Loading trained model...")
    model = YOLO(model_path)
    
    # Validate on test set
    print("\n📊 Running validation...")
    metrics = model.val(data=data_yaml)
    
    print("\n" + "=" * 60)
    print("Validation Metrics:")
    print("=" * 60)
    print(f"mAP@0.5:      {metrics.box.map50:.4f}")
    print(f"mAP@0.5:0.95: {metrics.box.map:.4f}")
    print(f"Precision:    {metrics.box.mp:.4f}")
    print(f"Recall:       {metrics.box.mr:.4f}")
    print("=" * 60)
    
    # Check if metrics meet production requirements
    print("\n📈 Production Readiness Check:")
    checks = {
        'mAP@0.5 > 0.75': metrics.box.map50 > 0.75,
        'mAP@0.5:0.95 > 0.50': metrics.box.map > 0.50,
        'Precision > 0.80': metrics.box.mp > 0.80,
        'Recall > 0.70': metrics.box.mr > 0.70,
    }
    
    for check, passed in checks.items():
        status = "✅" if passed else "⚠️"
        print(f"{status} {check}: {passed}")
    
    all_passed = all(checks.values())
    if all_passed:
        print("\n🎉 Model meets all production requirements!")
    else:
        print("\n⚠️  Model may need more training to meet production requirements")
    
    # Test on sample images from validation set
    if save_predictions:
        print("\n🔍 Generating prediction visualizations...")
        
        # Get validation image directory
        val_image_dir = data_yaml.replace('data.yaml', 'images/val')
        
        if os.path.exists(val_image_dir):
            results = model.predict(
                source=val_image_dir,
                save=True,
                conf=conf_threshold,
                max_det=10,
                project='runs/detect',
                name='validation_results'
            )
            
            print(f"\n✅ Predictions saved to: runs/detect/validation_results/")
            print(f"   - Processed {len(results)} images")
        else:
            print(f"\n⚠️  Validation directory not found: {val_image_dir}")
    
    return metrics

if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description='Evaluate YOLOv8n fashion detector')
    parser.add_argument('--model', default='runs/detect/yolov8n_fashion/weights/best.pt', 
                       help='Path to trained model')
    parser.add_argument('--data', default='deepfashion2_yolo/data.yaml', 
                       help='Path to data.yaml')
    parser.add_argument('--conf', type=float, default=0.7, 
                       help='Confidence threshold')
    parser.add_argument('--no-save', action='store_true', 
                       help='Do not save prediction visualizations')
    
    args = parser.parse_args()
    
    metrics = evaluate_model(
        model_path=args.model,
        data_yaml=args.data,
        conf_threshold=args.conf,
        save_predictions=not args.no_save
    )
