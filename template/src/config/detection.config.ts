/**
 * Garment Detection Configuration
 * Configuration for YOLOv8n model behavior and caching
 */

export const DETECTION_CONFIG = {
  // Model classes (must match training order)
  categories: ['top', 'bottom', 'shoes', 'dress', 'outerwear', 'accessory'] as const,

  // Confidence threshold (0.0 - 1.0)
  confidenceThreshold: 0.7,

  // Cache TTL (7 days in milliseconds)
  cacheTTLMs: 7 * 24 * 60 * 60 * 1000,

  // Input image size (must match model training)
  inputSize: 320,

  // NMS threshold for Android (0.0 - 1.0)
  nmsThreshold: 0.5,

  // MMKV storage key prefix
  cacheKeyPrefix: '@garment_detection:',
} as const;

export type DetectionCategory = typeof DETECTION_CONFIG.categories[number];
