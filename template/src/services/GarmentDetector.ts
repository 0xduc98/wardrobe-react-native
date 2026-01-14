/**
 * Garment Detector Service
 * Singleton service for garment detection using YOLOv8n native modules
 * Implements caching with MMKV for performance optimization
 */

import { NativeModules } from 'react-native';
import { MMKV } from 'react-native-mmkv';

import { DETECTION_CONFIG } from '@/config/detection.config';
import type {
	Detection,
	DetectionError,
	DetectionResult,
} from '@/types/detection.types';

const { YOLODetector } = NativeModules;

class GarmentDetectorService {
	private storage: MMKV;
	private isModuleAvailable: boolean = false;

	constructor() {
		this.storage = new MMKV({ id: 'garment-detection' });
		this.checkNativeModule();
	}

	/**
	 * Check if native YOLO detector module is available
	 */
	private checkNativeModule(): void {
		if (!YOLODetector) {
			console.error(
				'[GarmentDetector] YOLODetector native module not found. Please ensure native modules are properly linked.',
			);
			this.isModuleAvailable = false;
		} else {
			console.log('[GarmentDetector] Native module initialized successfully');
			this.isModuleAvailable = true;
		}
	}

	/**
	 * Generate cache key for an image URI
	 */
	private getCacheKey(imageUri: string): string {
		return `${DETECTION_CONFIG.cacheKeyPrefix}${imageUri}`;
	}

	/**
	 * Retrieve cached detection result
	 */
	private async getCached(imageUri: string): Promise<DetectionResult | null> {
		try {
			const key = this.getCacheKey(imageUri);
			const cached = this.storage.getString(key);

			if (!cached) {
				return null;
			}

			const result = JSON.parse(cached) as DetectionResult;
			const isExpired =
				Date.now() - result.timestamp > DETECTION_CONFIG.cacheTTLMs;

			if (isExpired) {
				this.storage.delete(key);
				return null;
			}

			return result;
		} catch (error) {
			console.error('[GarmentDetector] Cache retrieval error:', error);
			return null;
		}
	}

	/**
	 * Cache detection result
	 */
	private cache(imageUri: string, result: DetectionResult): void {
		try {
			const key = this.getCacheKey(imageUri);
			this.storage.set(key, JSON.stringify(result));
		} catch (error) {
			console.error('[GarmentDetector] Cache write error:', error);
		}
	}

	/**
	 * Detect garment in image
	 * @param imageUri - URI of image to analyze (must be file:// path)
	 * @param useCache - Whether to use cached results (default: true)
	 * @returns Promise<DetectionResult>
	 * @throws DetectionError if detection fails
	 */
	async detectGarment(
		imageUri: string,
		useCache: boolean = true,
	): Promise<DetectionResult> {
		// Validate module availability
		if (!this.isModuleAvailable) {
			throw {
				code: 'MODULE_NOT_AVAILABLE',
				message: 'YOLODetector native module is not available',
				details: 'Please ensure native modules are properly linked',
			} as DetectionError;
		}

		// Check cache first
		if (useCache) {
			const cached = await this.getCached(imageUri);
			if (cached) {
				console.log('[GarmentDetector] Cache hit for:', imageUri);
				return { ...cached, fromCache: true };
			}
		}

		// Call native module
		const startTime = Date.now();

		try {
			const detection: Detection =
				await YOLODetector.detectGarment(imageUri);
			const processingTimeMs = Date.now() - startTime;

			const result: DetectionResult = {
				detection,
				processingTimeMs,
				timestamp: Date.now(),
				imageUri,
				fromCache: false,
			};

			// Cache result
			if (useCache) {
				this.cache(imageUri, result);
			}

			console.log(
				`[GarmentDetector] Detection complete: ${detection.category} (${(detection.confidence * 100).toFixed(1)}%) in ${processingTimeMs}ms`,
			);

			return result;
		} catch (error: any) {
			console.error('[GarmentDetector] Detection failed:', error);

			// Transform native error to DetectionError
			throw {
				code: error.code || 'DETECTION_FAILED',
				message: error.message || 'Failed to detect garment',
				details: error.userInfo ? JSON.stringify(error.userInfo) : undefined,
			} as DetectionError;
		}
	}

	/**
	 * Clear all cached detection results
	 */
	clearCache(): void {
		try {
			this.storage.clearAll();
			console.log('[GarmentDetector] Cache cleared');
		} catch (error) {
			console.error('[GarmentDetector] Cache clear error:', error);
		}
	}

	/**
	 * Get cache statistics
	 */
	getCacheStats(): { keys: number; size: number } {
		try {
			const keys = this.storage.getAllKeys();
			const detectionKeys = keys.filter(key =>
				key.startsWith(DETECTION_CONFIG.cacheKeyPrefix),
			);

			return {
				keys: detectionKeys.length,
				size: detectionKeys.reduce((total, key) => {
					const value = this.storage.getString(key);
					return total + (value ? value.length : 0);
				}, 0),
			};
		} catch (error) {
			console.error('[GarmentDetector] Cache stats error:', error);
			return { keys: 0, size: 0 };
		}
	}

	/**
	 * Check if native module is available
	 */
	isAvailable(): boolean {
		return this.isModuleAvailable;
	}
}

// Export singleton instance
export const GarmentDetector = new GarmentDetectorService();
