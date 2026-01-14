# YOLO Models Directory (Android)

Place your trained YOLOv8n TensorFlow Lite model here:

## Model File

- **Filename**: `yolov8n_fashion.tflite`
- **Format**: TensorFlow Lite model (`.tflite`)
- **Input Size**: 320x320 pixels
- **Categories**: top, bottom, shoes, dress, outerwear, accessory

## Setup Instructions

After adding the model file:

1. **Copy Model to Assets**:
   ```bash
   cp /path/to/yolov8n_fashion.tflite \
      android/app/src/main/assets/yolov8n_fashion.tflite
   ```

2. **Verify Model is in Assets**:
   ```bash
   ls -lh android/app/src/main/assets/
   # Should show yolov8n_fashion.tflite (~3MB)
   ```

3. **Uncomment Model Loading Code**:
   - Open `YoloDetectorModule.kt`
   - Uncomment the model loading code in `loadModel()` method
   - Uncomment the inference code in `detectGarment()` method

4. **Rebuild Project**:
   ```bash
   cd android
   ./gradlew clean
   cd ..
   yarn android
   ```

## Expected Model Format

The TFLite model should:
- Accept input: 320x320 RGB image (float32, normalized [0, 1])
- Output: [1, 8400, (4 bbox + 1 objectness + 6 classes)]
- Classes order: top, bottom, shoes, dress, outerwear, accessory

### Input Tensor Shape
```
[1, 320, 320, 3] (float32)
```

### Output Tensor Shape
```
[1, 8400, 11] (float32)
- 4 values: bbox (center_x, center_y, width, height) - normalized
- 1 value: objectness score
- 6 values: class probabilities
```

## Training the Model

See `training/README.md` in the project root for instructions on:
- Training YOLOv8n on DeepFashion2 dataset
- Exporting to TFLite format
- Testing model accuracy

## Troubleshooting

### Model Not Found Error

If you get "Model not loaded" error:
1. Check that `yolov8n_fashion.tflite` is in this directory
2. Clean and rebuild: `cd android && ./gradlew clean && cd .. && yarn android`
3. Check Android Studio build output for asset packaging errors

### Model Loading Failed

If model fails to load:
1. Verify the model is TFLite format (not CoreML or PyTorch)
2. Check that model input size is 320x320
3. Ensure model was exported correctly from training script
4. Check Logcat for detailed error messages:
   ```bash
   adb logcat | grep YOLODetector
   ```

### Inference Errors

If detection fails:
1. Check image URI format (must be content:// or file:// path)
2. Verify image is valid (JPG, PNG)
3. Check that image is not too large (may cause OOM)
4. Check Logcat for detailed error messages

### Out of Memory Errors

If you get OOM during inference:
1. Reduce image resolution before passing to model
2. Consider using int8 quantized model
3. Increase app memory in AndroidManifest.xml:
   ```xml
   <application
       android:largeHeap="true"
       ...>
   ```

## Model Size

Expected model size: ~3MB (float16) or ~1.5MB (int8 quantized)

If your model is significantly larger:
- Verify you're using YOLOv8n (nano) not YOLOv8m or YOLOv8l
- Consider using int8 quantization for smaller size

## Performance

Expected inference time on devices:
- Pixel 5+: 50-100ms
- Pixel 4: 100-150ms
- Older devices: 150-250ms

If inference is slower:
- Enable NNAPI acceleration (already enabled in code)
- Consider GPU acceleration (TFLite GPU delegate)
- Reduce image resolution before inference
- Use int8 quantized model

## GPU Acceleration

To enable GPU acceleration (already included in dependencies):

1. Modify `YoloDetectorModule.kt` loadModel():
   ```kotlin
   val options = Interpreter.Options().apply {
       setNumThreads(4)
       addDelegate(GpuDelegate()) // Add this line
   }
   ```

2. Import GpuDelegate:
   ```kotlin
   import org.tensorflow.lite.gpu.GpuDelegate
   ```

**Note**: GPU acceleration may not always be faster than NNAPI. Test both on your target devices.

## Model Optimization

For production, consider:

1. **Int8 Quantization** (smaller size, faster):
   ```python
   # In export_model.py
   model.export(format='tflite', imgsz=320, int8=True)
   ```

2. **Float16 Quantization** (good accuracy/size balance):
   ```python
   model.export(format='tflite', imgsz=320, half=True)
   ```

3. **Dynamic Range Quantization**:
   ```python
   model.export(format='tflite', imgsz=320, dynamic=True)
   ```

## Testing

Test the model with sample images:

1. Run the app
2. Navigate to Test Detection screen
3. Pick an image from gallery
4. Verify detection results

Expected behavior:
- Processing time: 50-150ms
- Confidence: >70% for clear images
- Correct category detection

If results are poor:
- Model may need more training
- Try different confidence threshold
- Check image quality (blur, lighting, etc.)
