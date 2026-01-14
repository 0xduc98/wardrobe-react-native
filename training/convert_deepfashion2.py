#!/usr/bin/env python3
"""
DeepFashion2 to YOLO Format Converter
Converts DeepFashion2 annotations to YOLO detection format for training YOLOv8n
"""

import json
import os
import shutil
from pathlib import Path
from PIL import Image
from tqdm import tqdm

# Category mapping to our 6 classes
CATEGORY_MAPPING = {
    'short sleeve top': 0,          # top
    'long sleeve top': 0,           # top
    'short sleeve outwear': 4,      # outerwear
    'long sleeve outwear': 4,       # outerwear
    'vest': 0,                      # top
    'sling': 0,                     # top
    'shorts': 1,                    # bottom
    'trousers': 1,                  # bottom
    'skirt': 1,                     # bottom
    'short sleeve dress': 3,        # dress
    'long sleeve dress': 3,         # dress
    'vest dress': 3,                # dress
    'sling dress': 3,               # dress
}

CLASSES = ['top', 'bottom', 'shoes', 'dress', 'outerwear', 'accessory']

def convert_deepfashion2_to_yolo(source_dir, output_dir):
    """Convert DeepFashion2 annotations to YOLO format"""
    
    print(f"Converting DeepFashion2 from {source_dir} to YOLO format...")
    
    # Create output directories
    os.makedirs(f'{output_dir}/images/train', exist_ok=True)
    os.makedirs(f'{output_dir}/images/val', exist_ok=True)
    os.makedirs(f'{output_dir}/labels/train', exist_ok=True)
    os.makedirs(f'{output_dir}/labels/val', exist_ok=True)
    
    total_images = 0
    total_annotations = 0
    
    for split in ['train', 'validation']:
        yolo_split = 'train' if split == 'train' else 'val'
        anno_dir = f'{source_dir}/{split}/annos'
        image_dir = f'{source_dir}/{split}/image'
        
        if not os.path.exists(anno_dir):
            print(f"Warning: {anno_dir} not found, skipping {split} split")
            continue
        
        anno_files = list(Path(anno_dir).glob('*.json'))
        print(f"\nProcessing {len(anno_files)} images from {split} split...")
        
        for anno_file in tqdm(anno_files):
            with open(anno_file) as f:
                data = json.load(f)
            
            image_name = anno_file.stem + '.jpg'
            image_path = f'{image_dir}/{image_name}'
            
            if not os.path.exists(image_path):
                continue
            
            # Get image dimensions
            try:
                img = Image.open(image_path)
                img_width, img_height = img.size
            except Exception as e:
                print(f"Error opening {image_path}: {e}")
                continue
            
            yolo_annotations = []
            
            for item_key, item_data in data.items():
                if item_key == 'source':
                    continue
                
                category = item_data.get('category_name', '')
                
                if category not in CATEGORY_MAPPING:
                    continue
                
                class_id = CATEGORY_MAPPING[category]
                bbox = item_data.get('bounding_box', [])
                
                if len(bbox) != 4:
                    continue
                
                x1, y1, x2, y2 = bbox
                
                # Convert to YOLO format (normalized center x, y, width, height)
                x_center = ((x1 + x2) / 2) / img_width
                y_center = ((y1 + y2) / 2) / img_height
                width = (x2 - x1) / img_width
                height = (y2 - y1) / img_height
                
                # Validate bounds
                if all(0 <= v <= 1 for v in [x_center, y_center, width, height]):
                    yolo_annotations.append(f'{class_id} {x_center:.6f} {y_center:.6f} {width:.6f} {height:.6f}')
                    total_annotations += 1
            
            if yolo_annotations:
                # Copy image
                shutil.copy(
                    image_path,
                    f'{output_dir}/images/{yolo_split}/{image_name}'
                )
                
                # Write label file
                label_path = f'{output_dir}/labels/{yolo_split}/{anno_file.stem}.txt'
                with open(label_path, 'w') as f:
                    f.write('\n'.join(yolo_annotations))
                
                total_images += 1
    
    # Create data.yaml
    yaml_content = f"""# DeepFashion2 YOLO Dataset Configuration
path: {os.path.abspath(output_dir)}
train: images/train
val: images/val

# Classes
nc: {len(CLASSES)}
names: {CLASSES}

# Dataset Info
# Source: DeepFashion2 (https://github.com/switchablenorms/DeepFashion2)
# Categories mapped from 13 DeepFashion2 classes to 6 garment types
# Total images: {total_images}
# Total annotations: {total_annotations}
"""
    
    with open(f'{output_dir}/data.yaml', 'w') as f:
        f.write(yaml_content)
    
    print(f'\n✅ Conversion complete!')
    print(f'   - Total images: {total_images}')
    print(f'   - Total annotations: {total_annotations}')
    print(f'   - Output directory: {output_dir}')
    print(f'   - data.yaml created')

if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description='Convert DeepFashion2 to YOLO format')
    parser.add_argument('--source', default='./deepfashion2', help='Path to DeepFashion2 dataset')
    parser.add_argument('--output', default='./deepfashion2_yolo', help='Output directory')
    
    args = parser.parse_args()
    
    convert_deepfashion2_to_yolo(args.source, args.output)
