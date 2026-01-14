/**
 * useGarmentDetection Hook
 * React hook for garment detection with loading and error states
 */

import { useCallback, useState } from 'react';

import { GarmentDetector } from '@/services/GarmentDetector';
import type { DetectionError, DetectionResult } from '@/types/detection.types';

interface UseGarmentDetectionReturn {
	detect: (imageUri: string, useCache?: boolean) => Promise<DetectionResult>;
	result: DetectionResult | null;
	loading: boolean;
	error: DetectionError | null;
	reset: () => void;
}

/**
 * Hook for garment detection
 * Provides detection functionality with loading and error states
 *
 * @example
 * ```tsx
 * const { detect, result, loading, error, reset } = useGarmentDetection();
 *
 * const handleDetect = async (imageUri: string) => {
 *   await detect(imageUri);
 * };
 * ```
 */
export function useGarmentDetection(): UseGarmentDetectionReturn {
	const [result, setResult] = useState<DetectionResult | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<DetectionError | null>(null);

	const detect = useCallback(
		async (imageUri: string, useCache: boolean = true) => {
			setLoading(true);
			setError(null);

			try {
				const detection = await GarmentDetector.detectGarment(
					imageUri,
					useCache,
				);
				setResult(detection);
				return detection;
			} catch (err) {
				const detectionError: DetectionError =
					err && typeof err === 'object' && 'code' in err
						? (err as DetectionError)
						: {
								code: 'UNKNOWN_ERROR',
								message:
									err instanceof Error ? err.message : 'Detection failed',
								details: undefined,
						  };

				setError(detectionError);
				throw detectionError;
			} finally {
				setLoading(false);
			}
		},
		[],
	);

	const reset = useCallback(() => {
		setResult(null);
		setError(null);
	}, []);

	return {
		detect,
		result,
		loading,
		error,
		reset,
	};
}
