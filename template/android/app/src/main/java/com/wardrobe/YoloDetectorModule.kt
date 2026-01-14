package com.wardrobe

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import com.facebook.react.bridge.*
import org.tensorflow.lite.Interpreter
import org.tensorflow.lite.support.common.FileUtil
import java.nio.ByteBuffer
import java.nio.ByteOrder

/**
 * YoloDetectorModule
 * Native Android module for YOLOv8n fashion detection using TensorFlow Lite
 */
class YoloDetectorModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private var interpreter: Interpreter? = null
    private val categories = listOf("top", "bottom", "shoes", "dress", "outerwear", "accessory")
    private val inputSize = 320
    private val confidenceThreshold = 0.7f

    override fun getName(): String = "YOLODetector"

    init {
        loadModel()
    }

    private fun loadModel() {
        // TODO: Load yolov8n_fashion.tflite when provided
        // Placeholder implementation
        try {
            // Uncomment when model is added:
            /*
            val modelBuffer = FileUtil.loadMappedFile(reactApplicationContext, "yolov8n_fashion.tflite")
            val options = Interpreter.Options().apply {
                setNumThreads(4)
                setUseNNAPI(true) // Hardware acceleration
            }
            interpreter = Interpreter(modelBuffer, options)
            android.util.Log.i("YOLODetector", "Model loaded successfully")
            */
        } catch (e: Exception) {
            // Model not found - expected until user adds it
            android.util.Log.w("YOLODetector", "Model loading placeholder - add yolov8n_fashion.tflite to assets/")
        }
    }

    @ReactMethod
    fun detectGarment(imageUri: String, promise: Promise) {
        if (interpreter == null) {
            promise.reject(
                "MODEL_NOT_LOADED",
                "YOLOv8n model not loaded. Add yolov8n_fashion.tflite to android/app/src/main/assets/ and uncomment model loading code."
            )
            return
        }

        try {
            // Load image from URI
            val bitmap = loadBitmap(imageUri)
            if (bitmap == null) {
                promise.reject("INVALID_IMAGE", "Failed to load image from URI: $imageUri")
                return
            }

            // TODO: Implement inference when model is available
            // Placeholder result until model is added
            /*
            // Preprocess image
            val inputBuffer = preprocessImage(bitmap)

            // Run inference
            val outputBuffer = ByteBuffer.allocateDirect(4 * 8400 * (4 + 1 + categories.size))
            outputBuffer.order(ByteOrder.nativeOrder())

            interpreter?.run(inputBuffer, outputBuffer)

            // Parse YOLO output
            val detections = parseYOLOOutput(outputBuffer, bitmap.width, bitmap.height)

            // Apply NMS (Non-Maximum Suppression)
            val filteredDetections = applyNMS(detections, 0.5f)

            if (filteredDetections.isEmpty()) {
                promise.reject("NO_DETECTION", "No garment detected in image")
                return
            }

            // Get best detection
            val bestDetection = filteredDetections.maxByOrNull { it.confidence }!!

            val result = Arguments.createMap().apply {
                putString("category", bestDetection.category)
                putDouble("confidence", bestDetection.confidence.toDouble())

                val bbox = Arguments.createMap().apply {
                    putInt("x", bestDetection.bbox.x)
                    putInt("y", bestDetection.bbox.y)
                    putInt("width", bestDetection.bbox.width)
                    putInt("height", bestDetection.bbox.height)
                }
                putMap("bbox", bbox)

                // Get alternative predictions (top 2)
                val alternatives = Arguments.createArray()
                filteredDetections.drop(1).take(2).forEach { detection ->
                    val alt = Arguments.createMap().apply {
                        putString("category", detection.category)
                        putDouble("confidence", detection.confidence.toDouble())
                    }
                    alternatives.pushMap(alt)
                }
                putArray("alternativePredictions", alternatives)
            }

            promise.resolve(result)
            */

            // Placeholder result until model is added
            val result = Arguments.createMap().apply {
                putString("category", "top")
                putDouble("confidence", 0.0)

                val bbox = Arguments.createMap().apply {
                    putInt("x", 0)
                    putInt("y", 0)
                    putInt("width", 100)
                    putInt("height", 100)
                }
                putMap("bbox", bbox)

                putArray("alternativePredictions", Arguments.createArray())
            }

            promise.resolve(result)

        } catch (e: Exception) {
            promise.reject("DETECTION_FAILED", e.message ?: "Detection failed", e)
        }
    }

    private fun loadBitmap(uriString: String): Bitmap? {
        return try {
            val uri = Uri.parse(uriString)
            val inputStream = reactApplicationContext.contentResolver.openInputStream(uri)
            BitmapFactory.decodeStream(inputStream)
        } catch (e: Exception) {
            android.util.Log.e("YOLODetector", "Failed to load bitmap: ${e.message}")
            null
        }
    }

    private fun preprocessImage(bitmap: Bitmap): ByteBuffer {
        // Resize to 320x320
        val resized = Bitmap.createScaledBitmap(bitmap, inputSize, inputSize, true)
        val buffer = ByteBuffer.allocateDirect(4 * inputSize * inputSize * 3)
        buffer.order(ByteOrder.nativeOrder())

        val pixels = IntArray(inputSize * inputSize)
        resized.getPixels(pixels, 0, inputSize, 0, 0, inputSize, inputSize)

        // Normalize pixels to [0, 1] and convert to RGB
        for (pixel in pixels) {
            buffer.putFloat(((pixel shr 16) and 0xFF) / 255.0f) // R
            buffer.putFloat(((pixel shr 8) and 0xFF) / 255.0f)  // G
            buffer.putFloat((pixel and 0xFF) / 255.0f)          // B
        }

        return buffer
    }

    data class Detection(
        val category: String,
        val confidence: Float,
        val bbox: BBox
    )

    data class BBox(
        val x: Int,
        val y: Int,
        val width: Int,
        val height: Int
    )

    private fun parseYOLOOutput(
        outputBuffer: ByteBuffer,
        imageWidth: Int,
        imageHeight: Int
    ): List<Detection> {
        outputBuffer.rewind()
        val detections = mutableListOf<Detection>()

        // YOLOv8 output format: [1, 8400, (4 bbox + 1 objectness + num_classes)]
        val numDetections = 8400
        val numClasses = categories.size

        for (i in 0 until numDetections) {
            // Read bounding box (normalized)
            val centerX = outputBuffer.float
            val centerY = outputBuffer.float
            val width = outputBuffer.float
            val height = outputBuffer.float

            // Read objectness
            val objectness = outputBuffer.float

            // Read class probabilities
            val classProbs = FloatArray(numClasses) { outputBuffer.float }

            // Get best class
            val maxProb = classProbs.maxOrNull() ?: 0f
            val classIndex = classProbs.indexOfFirst { it == maxProb }

            // Calculate final confidence
            val confidence = objectness * maxProb

            if (confidence > confidenceThreshold) {
                // Convert normalized bbox to pixels
                val x = ((centerX - width / 2) * imageWidth).toInt()
                val y = ((centerY - height / 2) * imageHeight).toInt()
                val w = (width * imageWidth).toInt()
                val h = (height * imageHeight).toInt()

                detections.add(
                    Detection(
                        category = categories[classIndex],
                        confidence = confidence,
                        bbox = BBox(x, y, w, h)
                    )
                )
            }
        }

        return detections
    }

    private fun applyNMS(detections: List<Detection>, iouThreshold: Float): List<Detection> {
        val sorted = detections.sortedByDescending { it.confidence }.toMutableList()
        val kept = mutableListOf<Detection>()

        while (sorted.isNotEmpty()) {
            val best = sorted.removeAt(0)
            kept.add(best)

            sorted.removeAll { detection ->
                calculateIoU(best.bbox, detection.bbox) > iouThreshold
            }
        }

        return kept
    }

    private fun calculateIoU(bbox1: BBox, bbox2: BBox): Float {
        val x1 = maxOf(bbox1.x, bbox2.x)
        val y1 = maxOf(bbox1.y, bbox2.y)
        val x2 = minOf(bbox1.x + bbox1.width, bbox2.x + bbox2.width)
        val y2 = minOf(bbox1.y + bbox1.height, bbox2.y + bbox2.height)

        val intersectionArea = maxOf(0, x2 - x1) * maxOf(0, y2 - y1)
        val bbox1Area = bbox1.width * bbox1.height
        val bbox2Area = bbox2.width * bbox2.height
        val unionArea = bbox1Area + bbox2Area - intersectionArea

        return if (unionArea > 0) intersectionArea.toFloat() / unionArea else 0f
    }

    override fun onCatalystInstanceDestroy() {
        super.onCatalystInstanceDestroy()
        interpreter?.close()
    }
}
