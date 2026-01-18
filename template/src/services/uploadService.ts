/**
 * Upload Service
 * Handles file uploads to the API.
 */

import { Platform } from 'react-native';

import { getFreshAccessToken, handleApiError } from '@/services/httpClient';

const API_URL = process.env.API_URL ?? 'http://localhost:5001';
const API_PREFIX = 'api/v1/upload';

export interface UploadResponse {
  url: string;
}

export interface FileAttachment {
  id: string;
  uri: string;
  url?: string; // Set after upload
  type: string; // MIME type e.g. 'image/jpeg'
  name: string;
  size?: number;
  isUploading?: boolean;
  uploadError?: string;
}

class UploadService {
  /**
   * Upload a single file and return the URL.
   * Uses fetch directly to properly handle multipart/form-data on iOS.
   */
  async uploadFile(file: {
    uri: string;
    type: string;
    name: string;
  }): Promise<UploadResponse> {
    try {
      const accessToken = await getFreshAccessToken();

      if (!accessToken) {
        throw new Error('Not authenticated');
      }

      const formData = new FormData();

      // Normalize URI for iOS - handle ph:// URIs from Photos library
      let normalizedUri = file.uri;
      if (Platform.OS === 'ios' && !file.uri.startsWith('file://')) {
        // For iOS Photos library URIs, they should work as-is with FormData
        // but ensure we're using the correct format
        normalizedUri = file.uri;
      }

      // React Native requires this specific format for file uploads
      formData.append('file', {
        uri: normalizedUri,
        type: file.type || 'image/jpeg',
        name: file.name || `image-${Date.now()}.jpg`,
      } as any);

      // Use fetch directly to avoid ky's default Content-Type header
      // This allows FormData to set the correct multipart boundary
      const response = await fetch(`${API_URL}/${API_PREFIX}/`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${accessToken}`,
          // DO NOT set Content-Type - let FormData set it with boundary
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          (errorData as { message?: string; error?: string }).message ||
          (errorData as { message?: string; error?: string }).error ||
          `Upload failed with status ${response.status}`
        );
      }

      const data = await response.json();
      return data as UploadResponse;
    } catch (error) {
      console.error('[UploadService] Upload failed:', error);
      if (error instanceof Error) {
        throw error;
      }
      const errorMessage = await handleApiError(error);
      throw new Error(errorMessage);
    }
  }

  /**
   * Upload multiple files in parallel.
   * Returns array of results with URLs or errors.
   */
  async uploadFiles(
    files: Array<{ uri: string; type: string; name: string }>,
  ): Promise<Array<{ url?: string; error?: string }>> {
    const results = await Promise.all(
      files.map(async (file) => {
        try {
          const response = await this.uploadFile(file);
          return { url: response.url };
        } catch (error) {
          return { error: error instanceof Error ? error.message : 'Upload failed' };
        }
      }),
    );

    return results;
  }
}

export const uploadService = new UploadService();
