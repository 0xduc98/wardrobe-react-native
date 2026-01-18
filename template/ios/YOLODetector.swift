//
//  YOLODetector.swift
//  YOLOv8n Fashion Detector - iOS Native Module
//

import Foundation
import CoreML
import Vision
import UIKit

@objc(YOLODetector)
class YOLODetector: NSObject {
    
    private var visionModel: VNCoreMLModel?
    private let categories = ["top", "bottom", "shoes", "dress", "outerwear", "accessory"]
    private let confidenceThreshold: Float = 0.7
    
    override init() {
        super.init()
        loadModel()
    }
    
    private func loadModel() {
        guard let modelURL = Bundle.main.url(forResource: "yolov8n_fashion", withExtension: "mlmodelc") else {
            NSLog("[YOLODetector] Model file not found in bundle")
            return
        }
        
        do {
            let mlModel = try MLModel(contentsOf: modelURL)
            self.visionModel = try VNCoreMLModel(for: mlModel)
            NSLog("[YOLODetector] Model loaded successfully")
        } catch {
            NSLog("[YOLODetector] Failed to load model: \(error)")
        }
    }
    
    @objc
    func detectGarment(
        _ imageUri: String,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        // Check if model is loaded
        if visionModel == nil {
            reject(
                "MODEL_NOT_LOADED",
                "YOLOv8n model not loaded. Add yolov8n_fashion.mlmodel to ios/Models/ and uncomment model loading code.",
                nil
            )
            return
        }
        
        // Load image from URI
        guard let image = loadImage(from: imageUri) else {
            reject("INVALID_IMAGE", "Failed to load image from URI: \(imageUri)", nil)
            return
        }
        
        guard let cgImage = image.cgImage else {
            reject("INVALID_IMAGE", "Failed to get CGImage from UIImage", nil)
            return
        }
        
        let request = VNCoreMLRequest(model: visionModel!) { request, error in
            if let error = error {
                reject("INFERENCE_FAILED", "Model inference failed: \(error.localizedDescription)", error)
                return
            }
            
            guard let observations = request.results as? [VNRecognizedObjectObservation],
                  let topResult = observations.first else {
                reject("NO_DETECTION", "No garment detected in image", nil)
                return
            }
            
            // Parse results
            let categoryIndex = Int(topResult.labels.first?.identifier ?? "0") ?? 0
            let category = self.categories[min(categoryIndex, self.categories.count - 1)]
            let confidence = Double(topResult.labels.first?.confidence ?? 0.0)
            
            // Convert normalized bbox to pixels
            let boundingBox = topResult.boundingBox
            let imageWidth = cgImage.width
            let imageHeight = cgImage.height
            
            let bbox: [String: Any] = [
                "x": Int(boundingBox.origin.x * CGFloat(imageWidth)),
                "y": Int(boundingBox.origin.y * CGFloat(imageHeight)),
                "width": Int(boundingBox.width * CGFloat(imageWidth)),
                "height": Int(boundingBox.height * CGFloat(imageHeight))
            ]
            
            // Get alternative predictions
            let alternatives: [[String: Any]] = topResult.labels.dropFirst().prefix(2).map { label in
                let altIndex = Int(label.identifier) ?? 0
                return [
                    "category": self.categories[min(altIndex, self.categories.count - 1)],
                    "confidence": Double(label.confidence)
                ]
            }
            
            let result: [String: Any] = [
                "category": category,
                "confidence": confidence,
                "bbox": bbox,
                "alternativePredictions": alternatives
            ]
            
            resolve(result)
        }
        
        request.imageCropAndScaleOption = .scaleFill
        
        let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
        
        do {
            try handler.perform([request])
        } catch {
            reject("INFERENCE_FAILED", "Failed to perform inference: \(error.localizedDescription)", error)
        }
    }
    
    private func loadImage(from uriString: String) -> UIImage? {
        guard let url = URL(string: uriString) else {
            NSLog("[YOLODetector] Invalid URL: \(uriString)")
            return nil
        }
        
        // Handle file:// URIs
        if url.scheme == "file" {
            guard let data = try? Data(contentsOf: url) else {
                NSLog("[YOLODetector] Failed to load file data from: \(url.path)")
                return nil
            }
            return UIImage(data: data)
        }
        
        // Handle assets-library:// or ph:// URIs if needed
        NSLog("[YOLODetector] Unsupported URI scheme: \(url.scheme ?? "none")")
        return nil
    }
    
    @objc
    static func requiresMainQueueSetup() -> Bool {
        return false
    }
}
