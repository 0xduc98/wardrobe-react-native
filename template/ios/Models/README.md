# YOLO Models Directory (iOS)

Place your trained YOLOv8n CoreML model here:

## Model File

- **Filename**: `yolov8n_fashion.mlmodel`
- **Format**: CoreML model (`.mlmodel`)
- **Input Size**: 320x320 pixels
- **Categories**: top, bottom, shoes, dress, outerwear, accessory

## Setup Instructions

After adding the model file:

1. **Open Xcode**:
   ```bash
   cd ios
   open Boilerplate.xcworkspace
   ```

2. **Add Model to Project**:
   - Drag `yolov8n_fashion.mlmodel` into Xcode project navigator
   - Ensure "Copy items if needed" is checked
   - Select the Boilerplate target

3. **Verify Model is in Bundle Resources**:
   - Select Boilerplate target
   - Go to "Build Phases"
   - Expand "Copy Bundle Resources"
   - Ensure `yolov8n_fashion.mlmodelc` is listed

4. **Uncomment Model Loading Code**:
   - Open `YOLODetector.swift`
   - Uncomment the model loading code in `loadModel()` method
   - Uncomment the inference code in `detectGarment()` method

5. **Rebuild Project**:
   ```bash
   cd ios
   pod install
   cd ..
   yarn ios
   ```

## Expected Model Format

The CoreML model should:
- Accept input: 320x320 RGB image
- Output: Bounding boxes with class probabilities
- Classes: 0=top, 1=bottom, 2=shoes, 3=dress, 4=outerwear, 5=accessory

## Training the Model

See `training/README.md` in the project root for instructions on:
- Training YOLOv8n on DeepFashion2 dataset
- Exporting to CoreML format
- Testing model accuracy

## Troubleshooting

### Model Not Found Error

If you get "Model file not found" error:
1. Check that `yolov8n_fashion.mlmodel` is in this directory
2. Clean build folder (Cmd+Shift+K in Xcode)
3. Rebuild project

### Model Loading Failed

If model fails to load:
1. Verify the model is CoreML format (not TFLite or PyTorch)
2. Check that model input size matches (320x320)
3. Ensure model was exported correctly from training script

### Inference Errors

If detection fails:
1. Check image URI format (must be `file://` path)
2. Verify image is valid (JPG, PNG)
3. Check console logs for detailed error messages

## Model Size

Expected model size: ~6MB

If your model is significantly larger:
- Consider using quantization (int8 or float16)
- Verify you're using YOLOv8n (nano) not YOLOv8m or YOLOv8l

## Performance

Expected inference time on devices:
- iPhone 11+: 50-100ms
- iPhone X: 100-150ms
- iPhone 8: 150-200ms

If inference is slower:
- Check that CoreML is using Neural Engine (not CPU fallback)
- Reduce image resolution before passing to model
- Consider model quantization
