/**
 * Test Detection Screen
 * Screen for testing garment detection functionality
 */

import React, { useState } from 'react';
import {
	ActivityIndicator,
	Button,
	Image,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from 'react-native';
import {
	type ImagePickerResponse,
	launchImageLibrary,
} from 'react-native-image-picker';

import { useGarmentDetection } from '@/hooks/domain';

export function TestDetectionScreen() {
	const { detect, result, loading, error, reset } = useGarmentDetection();
	const [selectedImage, setSelectedImage] = useState<string | null>(null);

	const handlePickImage = async () => {
		const response: ImagePickerResponse = await launchImageLibrary({
			mediaType: 'photo',
			quality: 0.8,
			includeBase64: false,
		});

		if (response.assets?.[0]?.uri) {
			const uri = response.assets[0].uri;
			setSelectedImage(uri);
			try {
				await detect(uri);
			} catch (err) {
				// Error is already stored in hook state
				console.error('Detection failed:', err);
			}
		}
	};

	const handleTestAgain = () => {
		reset();
		setSelectedImage(null);
	};

	return (
		<ScrollView style={styles.container}>
			<View style={styles.content}>
				<Text style={styles.title}>Garment Detection Test</Text>
				<Text style={styles.subtitle}>
					Upload an image to test YOLO detection
				</Text>

				<View style={styles.buttonContainer}>
					<Button
						title="Pick Image & Detect"
						onPress={handlePickImage}
						disabled={loading}
					/>
				</View>

				{selectedImage && (
					<View style={styles.imageContainer}>
						<Image source={{ uri: selectedImage }} style={styles.image} />
					</View>
				)}

				{loading && (
					<View style={styles.loaderContainer}>
						<ActivityIndicator size="large" color="#007AFF" />
						<Text style={styles.loadingText}>Detecting garment...</Text>
					</View>
				)}

				{result && !loading && (
					<View style={styles.resultContainer}>
						<Text style={styles.resultTitle}>Detection Result</Text>

						<View style={styles.resultRow}>
							<Text style={styles.resultLabel}>Category:</Text>
							<Text style={styles.resultValue}>
								{result.detection.category.toUpperCase()}
							</Text>
						</View>

						<View style={styles.resultRow}>
							<Text style={styles.resultLabel}>Confidence:</Text>
							<Text style={styles.resultValue}>
								{(result.detection.confidence * 100).toFixed(1)}%
							</Text>
						</View>

						<View style={styles.resultRow}>
							<Text style={styles.resultLabel}>Processing Time:</Text>
							<Text style={styles.resultValue}>{result.processingTimeMs}ms</Text>
						</View>

						{result.fromCache && (
							<View style={styles.cacheIndicator}>
								<Text style={styles.cacheText}>✓ Result from cache</Text>
							</View>
						)}

						{result.detection.bbox && (
							<View style={styles.bboxContainer}>
								<Text style={styles.bboxTitle}>Bounding Box:</Text>
								<Text style={styles.bboxText}>
									X: {Math.round(result.detection.bbox.x)}, Y:{' '}
									{Math.round(result.detection.bbox.y)}
								</Text>
								<Text style={styles.bboxText}>
									Width: {Math.round(result.detection.bbox.width)}, Height:{' '}
									{Math.round(result.detection.bbox.height)}
								</Text>
							</View>
						)}

						{result.detection.alternativePredictions &&
							result.detection.alternativePredictions.length > 0 && (
								<View style={styles.alternativesContainer}>
									<Text style={styles.alternativesTitle}>
										Alternative Predictions:
									</Text>
									{result.detection.alternativePredictions.map(
										(alt, index) => (
											<Text key={index} style={styles.alternativeText}>
												• {alt.category}: {(alt.confidence * 100).toFixed(1)}%
											</Text>
										),
									)}
								</View>
							)}

						<View style={styles.buttonContainer}>
							<Button title="Clear & Test Again" onPress={handleTestAgain} />
						</View>
					</View>
				)}

				{error && !loading && (
					<View style={styles.errorContainer}>
						<Text style={styles.errorTitle}>Error</Text>
						<Text style={styles.errorCode}>Code: {error.code}</Text>
						<Text style={styles.errorMessage}>{error.message}</Text>
						{error.details && (
							<Text style={styles.errorDetails}>Details: {error.details}</Text>
						)}

						<View style={styles.buttonContainer}>
							<Button title="Try Again" onPress={handleTestAgain} />
						</View>
					</View>
				)}
			</View>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#FFFFFF',
	},
	content: {
		padding: 20,
	},
	title: {
		fontSize: 24,
		fontWeight: 'bold',
		marginBottom: 8,
		textAlign: 'center',
	},
	subtitle: {
		fontSize: 14,
		color: '#666',
		marginBottom: 20,
		textAlign: 'center',
	},
	buttonContainer: {
		marginVertical: 16,
	},
	imageContainer: {
		alignItems: 'center',
		marginVertical: 20,
	},
	image: {
		width: 300,
		height: 300,
		borderRadius: 8,
		resizeMode: 'contain',
	},
	loaderContainer: {
		alignItems: 'center',
		marginVertical: 32,
	},
	loadingText: {
		marginTop: 12,
		fontSize: 16,
		color: '#666',
	},
	resultContainer: {
		backgroundColor: '#F5F5F5',
		borderRadius: 12,
		padding: 20,
		marginTop: 20,
	},
	resultTitle: {
		fontSize: 20,
		fontWeight: 'bold',
		marginBottom: 16,
		textAlign: 'center',
	},
	resultRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: 12,
		paddingBottom: 12,
		borderBottomWidth: 1,
		borderBottomColor: '#E0E0E0',
	},
	resultLabel: {
		fontSize: 16,
		color: '#666',
		fontWeight: '500',
	},
	resultValue: {
		fontSize: 16,
		fontWeight: 'bold',
		color: '#007AFF',
	},
	cacheIndicator: {
		backgroundColor: '#E8F5E9',
		padding: 8,
		borderRadius: 6,
		marginTop: 8,
	},
	cacheText: {
		fontSize: 14,
		color: '#4CAF50',
		textAlign: 'center',
		fontStyle: 'italic',
	},
	bboxContainer: {
		marginTop: 16,
		padding: 12,
		backgroundColor: '#FFF',
		borderRadius: 8,
	},
	bboxTitle: {
		fontSize: 14,
		fontWeight: '600',
		marginBottom: 8,
	},
	bboxText: {
		fontSize: 12,
		color: '#666',
		marginTop: 4,
	},
	alternativesContainer: {
		marginTop: 16,
		padding: 12,
		backgroundColor: '#FFF',
		borderRadius: 8,
	},
	alternativesTitle: {
		fontSize: 14,
		fontWeight: '600',
		marginBottom: 8,
	},
	alternativeText: {
		fontSize: 12,
		color: '#666',
		marginTop: 4,
	},
	errorContainer: {
		backgroundColor: '#FFEBEE',
		borderRadius: 12,
		padding: 20,
		marginTop: 20,
	},
	errorTitle: {
		fontSize: 20,
		fontWeight: 'bold',
		color: '#D32F2F',
		marginBottom: 12,
	},
	errorCode: {
		fontSize: 14,
		fontWeight: '600',
		color: '#C62828',
		marginBottom: 8,
	},
	errorMessage: {
		fontSize: 16,
		color: '#D32F2F',
		marginBottom: 8,
	},
	errorDetails: {
		fontSize: 12,
		color: '#666',
		marginTop: 8,
	},
});
