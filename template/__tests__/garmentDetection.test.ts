/**
 * Garment Detection Tests
 * Unit tests for GarmentDetector service
 */

import { NativeModules } from 'react-native';

import { GarmentDetector } from '@/services/GarmentDetector';
import { GarmentCategory } from '@/types/detection.types';

// Mock react-native
jest.mock('react-native', () => ({
	NativeModules: {
		YOLODetector: {
			detectGarment: jest.fn(),
		},
	},
}));

// Mock MMKV
jest.mock('react-native-mmkv', () => {
	const storage = new Map();
	return {
		MMKV: jest.fn().mockImplementation(() => ({
			getString: jest.fn((key: string) => storage.get(key)),
			set: jest.fn((key: string, value: string) => storage.set(key, value)),
			delete: jest.fn((key: string) => storage.delete(key)),
			clearAll: jest.fn(() => storage.clear()),
			getAllKeys: jest.fn(() => Array.from(storage.keys())),
		})),
	};
});

describe('GarmentDetector', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		GarmentDetector.clearCache();
	});

	describe('detectGarment', () => {
		it('should call native module for detection', async () => {
			const mockResult = {
				category: GarmentCategory.TOP,
				confidence: 0.92,
				bbox: { x: 0, y: 0, width: 100, height: 100 },
			};

			(
				NativeModules.YOLODetector.detectGarment as jest.Mock
			).mockResolvedValue(mockResult);

			const result = await GarmentDetector.detectGarment('file:///test.jpg');

			expect(NativeModules.YOLODetector.detectGarment).toHaveBeenCalledWith(
				'file:///test.jpg',
			);
			expect(result.detection.category).toBe(GarmentCategory.TOP);
			expect(result.detection.confidence).toBe(0.92);
			expect(result.processingTimeMs).toBeGreaterThanOrEqual(0);
		});

		it('should validate confidence threshold', async () => {
			const mockResult = {
				category: GarmentCategory.BOTTOM,
				confidence: 0.85,
				bbox: { x: 10, y: 20, width: 200, height: 300 },
			};

			(
				NativeModules.YOLODetector.detectGarment as jest.Mock
			).mockResolvedValue(mockResult);

			const result = await GarmentDetector.detectGarment('file:///test.jpg');

			expect(result.detection.confidence).toBeGreaterThan(0.7);
		});

		it('should throw error when native module is not available', async () => {
			// Temporarily remove native module
			const originalModule = NativeModules.YOLODetector;
			// @ts-expect-error - Testing error case
			NativeModules.YOLODetector = undefined;

			// Create new instance to trigger module check
			const newDetector = new (GarmentDetector.constructor as any)();

			await expect(
				newDetector.detectGarment('file:///test.jpg'),
			).rejects.toMatchObject({
				code: 'MODULE_NOT_AVAILABLE',
				message: expect.stringContaining('not available'),
			});

			// Restore native module
			NativeModules.YOLODetector = originalModule;
		});

		it('should handle native module errors', async () => {
			const mockError = {
				code: 'MODEL_NOT_LOADED',
				message: 'Model not loaded',
			};

			(
				NativeModules.YOLODetector.detectGarment as jest.Mock
			).mockRejectedValue(mockError);

			await expect(
				GarmentDetector.detectGarment('file:///test.jpg'),
			).rejects.toMatchObject({
				code: 'MODEL_NOT_LOADED',
				message: 'Model not loaded',
			});
		});
	});

	describe('caching', () => {
		it('should cache detection results', async () => {
			const mockResult = {
				category: GarmentCategory.SHOES,
				confidence: 0.88,
				bbox: { x: 0, y: 0, width: 100, height: 100 },
			};

			(
				NativeModules.YOLODetector.detectGarment as jest.Mock
			).mockResolvedValue(mockResult);

			// First call - should hit native module
			await GarmentDetector.detectGarment('file:///test.jpg');
			expect(NativeModules.YOLODetector.detectGarment).toHaveBeenCalledTimes(1);

			// Second call - should use cache
			const cached = await GarmentDetector.detectGarment('file:///test.jpg');
			expect(NativeModules.YOLODetector.detectGarment).toHaveBeenCalledTimes(1);
			expect(cached.fromCache).toBe(true);
		});

		it('should bypass cache when useCache is false', async () => {
			const mockResult = {
				category: GarmentCategory.DRESS,
				confidence: 0.91,
				bbox: { x: 0, y: 0, width: 100, height: 100 },
			};

			(
				NativeModules.YOLODetector.detectGarment as jest.Mock
			).mockResolvedValue(mockResult);

			// First call
			await GarmentDetector.detectGarment('file:///test.jpg');
			expect(NativeModules.YOLODetector.detectGarment).toHaveBeenCalledTimes(1);

			// Second call with useCache=false
			await GarmentDetector.detectGarment('file:///test.jpg', false);
			expect(NativeModules.YOLODetector.detectGarment).toHaveBeenCalledTimes(2);
		});

		it('should clear cache', async () => {
			const mockResult = {
				category: GarmentCategory.OUTERWEAR,
				confidence: 0.89,
				bbox: { x: 0, y: 0, width: 100, height: 100 },
			};

			(
				NativeModules.YOLODetector.detectGarment as jest.Mock
			).mockResolvedValue(mockResult);

			// Cache a result
			await GarmentDetector.detectGarment('file:///test.jpg');

			// Clear cache
			GarmentDetector.clearCache();

			// Should hit native module again
			await GarmentDetector.detectGarment('file:///test.jpg');
			expect(NativeModules.YOLODetector.detectGarment).toHaveBeenCalledTimes(2);
		});
	});

	describe('result structure', () => {
		it('should return complete detection result', async () => {
			const mockDetection = {
				category: GarmentCategory.ACCESSORY,
				confidence: 0.95,
				bbox: { x: 50, y: 60, width: 150, height: 200 },
				alternativePredictions: [
					{ category: GarmentCategory.TOP, confidence: 0.75 },
				],
			};

			(
				NativeModules.YOLODetector.detectGarment as jest.Mock
			).mockResolvedValue(mockDetection);

			const result = await GarmentDetector.detectGarment('file:///test.jpg');

			expect(result).toMatchObject({
				detection: {
					category: GarmentCategory.ACCESSORY,
					confidence: 0.95,
					bbox: {
						x: 50,
						y: 60,
						width: 150,
						height: 200,
					},
					alternativePredictions: [
						{
							category: GarmentCategory.TOP,
							confidence: 0.75,
						},
					],
				},
				processingTimeMs: expect.any(Number),
				timestamp: expect.any(Number),
				imageUri: 'file:///test.jpg',
				fromCache: false,
			});
		});
	});

	describe('cache statistics', () => {
		it('should return cache statistics', async () => {
			const mockResult = {
				category: GarmentCategory.TOP,
				confidence: 0.92,
				bbox: { x: 0, y: 0, width: 100, height: 100 },
			};

			(
				NativeModules.YOLODetector.detectGarment as jest.Mock
			).mockResolvedValue(mockResult);

			// Cache some results
			await GarmentDetector.detectGarment('file:///test1.jpg');
			await GarmentDetector.detectGarment('file:///test2.jpg');

			const stats = GarmentDetector.getCacheStats();

			expect(stats.keys).toBe(2);
			expect(stats.size).toBeGreaterThan(0);
		});
	});

	describe('module availability', () => {
		it('should check if module is available', () => {
			const isAvailable = GarmentDetector.isAvailable();
			expect(typeof isAvailable).toBe('boolean');
		});
	});
});
