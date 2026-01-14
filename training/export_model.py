#!/usr/bin/env python3
"""
YOLOv8n Fashion Detector Model Export Script
Exports trained model to CoreML (iOS) and TFLite (Android) formats
"""

from ultralytics import YOLO
import os
import sys
import shutil

def export_to_mobile_formats(
    model_path='runs/detect/yolov8n_fashion/weights/best.pt',
    data_yaml='deepfashion2_yolo/data.yaml',
    img_size=320,
    mobile_project_path=None
):
    """
    Export trained model to mobile formats
    
    Args:
        model_path: Path to trained model weights
        data_yaml: Path to data.yaml file (needed for TFLite export)
        img_size: Input image size (must match training)
        mobile_project_path: Path to React Native project root (for automatic copying)
    """
    
    print("=" * 60)
    print("YOLOv8n Fashion Detector Model Export")
    print("=" * 60)
    print(f"Model: {model_path}")
    print(f"Image size: {img_size}x{img_size}")
    print("=" * 60)
    
    # Check if model exists
    if not os.path.exists(model_path):
        print(f"❌ Error: Model not found: {model_path}")
        print("Please train the model first using train_yolo.py")
        return False
    
    # Load trained model
    print("\n📦 Loading trained model...")
    model = YOLO(model_path)
    
    # Export to CoreML (iOS)
    print("\n🍎 Exporting to CoreML (iOS)...")
    try:
        coreml_path = model.export(
            format='coreml',
            imgsz=img_size,
            nms=True,  # Include NMS in model
            half=False,  # Full precision for better accuracy
        )
        print(f"✅ CoreML export successful: {coreml_path}")
    except Exception as e:
        print(f"⚠️  CoreML export failed: {e}")
        print("Note: CoreML export requires coremltools (macOS only)")
        print("Install with: pip install coremltools")
        coreml_path = None
    
    # Export to TFLite (Android)
    print("\n🤖 Exporting to TFLite (Android)...")
    try:
        tflite_path = model.export(
            format='tflite',
            imgsz=img_size,
            int8=False,  # Use float16 for better accuracy
            data=data_yaml,
        )
        print(f"✅ TFLite export successful: {tflite_path}")
    except Exception as e:
        print(f"❌ TFLite export failed: {e}")
        tflite_path = None
    
    print("\n" + "=" * 60)
    print("Export Summary:")
    print("=" * 60)
    
    # Show export locations
    if coreml_path:
        print(f"📱 iOS CoreML model:")
        print(f"   {coreml_path}")
    
    if tflite_path:
        print(f"🤖 Android TFLite model:")
        # TFLite export creates a saved_model directory
        model_dir = os.path.dirname(model_path)
        tflite_actual_path = f"{model_dir}/{os.path.basename(model_path).replace('.pt', '_saved_model')}/best_float16.tflite"
        if os.path.exists(tflite_actual_path):
            print(f"   {tflite_actual_path}")
        else:
            print(f"   {tflite_path}")
    
    # Copy to mobile project if path provided
    if mobile_project_path and (coreml_path or tflite_path):
        print("\n📋 Copying models to React Native project...")
        
        # Copy CoreML model
        if coreml_path:
            ios_model_dir = f"{mobile_project_path}/template/ios/Models"
            os.makedirs(ios_model_dir, exist_ok=True)
            
            # CoreML exports as .mlpackage, need to extract .mlmodel
            if coreml_path.endswith('.mlpackage'):
                mlmodel_path = f"{coreml_path}/Data/com.apple.CoreML/model.mlmodel"
                if os.path.exists(mlmodel_path):
                    dest_path = f"{ios_model_dir}/yolov8n_fashion.mlmodel"
                    shutil.copy(mlmodel_path, dest_path)
                    print(f"✅ Copied CoreML model to: {dest_path}")
                else:
                    print(f"⚠️  CoreML model not found in package: {mlmodel_path}")
            else:
                dest_path = f"{ios_model_dir}/yolov8n_fashion.mlmodel"
                shutil.copy(coreml_path, dest_path)
                print(f"✅ Copied CoreML model to: {dest_path}")
        
        # Copy TFLite model
        if tflite_path:
            android_model_dir = f"{mobile_project_path}/template/android/app/src/main/assets"
            os.makedirs(android_model_dir, exist_ok=True)
            
            model_dir = os.path.dirname(model_path)
            tflite_actual_path = f"{model_dir}/{os.path.basename(model_path).replace('.pt', '_saved_model')}/best_float16.tflite"
            
            if os.path.exists(tflite_actual_path):
                dest_path = f"{android_model_dir}/yolov8n_fashion.tflite"
                shutil.copy(tflite_actual_path, dest_path)
                print(f"✅ Copied TFLite model to: {dest_path}")
            else:
                print(f"⚠️  TFLite model not found: {tflite_actual_path}")
    
    print("=" * 60)
    print("✅ Export complete!")
    print("\n📝 Next steps:")
    print("1. For iOS: Add yolov8n_fashion.mlmodel to Xcode project")
    print("2. For Android: Model is already in assets folder")
    print("3. Uncomment model loading code in native modules")
    print("4. Implement inference logic")
    print("=" * 60)
    
    return True

if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description='Export YOLOv8n model to mobile formats')
    parser.add_argument('--model', default='runs/detect/yolov8n_fashion/weights/best.pt',
                       help='Path to trained model')
    parser.add_argument('--data', default='deepfashion2_yolo/data.yaml',
                       help='Path to data.yaml')
    parser.add_argument('--img-size', type=int, default=320,
                       help='Input image size')
    parser.add_argument('--mobile-project', default=None,
                       help='Path to React Native project root (for automatic copying)')
    
    args = parser.parse_args()
    
    # Try to auto-detect mobile project path
    if args.mobile_project is None:
        # Check if we're in the training directory
        current_dir = os.path.dirname(os.path.abspath(__file__))
        parent_dir = os.path.dirname(current_dir)
        if os.path.exists(f"{parent_dir}/template"):
            args.mobile_project = parent_dir
            print(f"📍 Auto-detected mobile project: {args.mobile_project}")
    
    success = export_to_mobile_formats(
        model_path=args.model,
        data_yaml=args.data,
        img_size=args.img_size,
        mobile_project_path=args.mobile_project
    )
    
    sys.exit(0 if success else 1)
