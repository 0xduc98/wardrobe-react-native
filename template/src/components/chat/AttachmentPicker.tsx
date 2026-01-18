/**
 * AttachmentPicker Component
 * Allows users to select images from their library or camera.
 */

import { useCallback } from 'react';
import {
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  type ImagePickerResponse,
  launchCamera,
  launchImageLibrary,
} from 'react-native-image-picker';

import { useTheme } from '@/theme';

export interface SelectedAttachment {
  uri: string;
  type: string;
  name: string;
  size?: number;
}

interface AttachmentPickerProps {
  onSelect: (attachment: SelectedAttachment) => void;
  disabled?: boolean;
}

export function AttachmentPicker({ onSelect, disabled }: AttachmentPickerProps) {
  const { colors } = useTheme();

  const handleResponse = useCallback(
    (response: ImagePickerResponse) => {
      if (response.didCancel) {
        return;
      }

      if (response.errorCode) {
        Alert.alert('Error', response.errorMessage || 'Failed to pick image');
        return;
      }

      const asset = response.assets?.[0];
      if (asset?.uri) {
        onSelect({
          uri: asset.uri,
          type: asset.type || 'image/jpeg',
          name: asset.fileName || `image-${Date.now()}.jpg`,
          size: asset.fileSize,
        });
      }
    },
    [onSelect],
  );

  const handlePress = useCallback(() => {
    Alert.alert(
      'Add Image',
      'Choose how to add an image',
      [
        {
          text: 'Camera',
          onPress: async () => {
            const result = await launchCamera({
              mediaType: 'photo',
              quality: 0.8,
              includeBase64: false,
            });
            handleResponse(result);
          },
        },
        {
          text: 'Photo Library',
          onPress: async () => {
            const result = await launchImageLibrary({
              mediaType: 'photo',
              quality: 0.8,
              includeBase64: false,
              selectionLimit: 1,
            });
            handleResponse(result);
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true },
    );
  }, [handleResponse]);

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      disabled={disabled}
      onPress={handlePress}
      style={[
        styles.button,
        { backgroundColor: colors.systemGray6 },
        disabled && styles.disabled,
      ]}
    >
      <Text style={[styles.icon, { color: disabled ? colors.systemGray3 : colors.systemBlue }]}>
        +
      </Text>
    </TouchableOpacity>
  );
}

interface AttachmentPreviewProps {
  uri: string;
  onRemove: () => void;
  isUploading?: boolean;
}

export function AttachmentPreview({ uri, onRemove, isUploading }: AttachmentPreviewProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.previewContainer}>
      <Image
        source={{ uri }}
        style={[styles.previewImage, isUploading && styles.uploading]}
      />
      {!isUploading && (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onRemove}
          style={[styles.removeButton, { backgroundColor: colors.systemRed }]}
        >
          <Text style={styles.removeIcon}>x</Text>
        </TouchableOpacity>
      )}
      {isUploading && (
        <View style={[styles.uploadingOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <Text style={styles.uploadingText}>...</Text>
        </View>
      )}
    </View>
  );
}

interface AttachmentListProps {
  attachments: Array<{ id: string; uri: string; isUploading?: boolean }>;
  onRemove: (id: string) => void;
}

export function AttachmentList({ attachments, onRemove }: AttachmentListProps) {
  const { gutters, layout } = useTheme();

  if (attachments.length === 0) {
    return null;
  }

  return (
    <View style={[layout.row, layout.wrap, gutters.gap_8, gutters.marginBottom_8]}>
      {attachments.map((attachment) => (
        <AttachmentPreview
          isUploading={attachment.isUploading}
          key={attachment.id}
          onRemove={() => { onRemove(attachment.id); }}
          uri={attachment.uri}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    marginRight: 8,
    width: 40,
  },
  disabled: {
    opacity: 0.5,
  },
  icon: {
    fontSize: 24,
    fontWeight: '300',
  },
  previewContainer: {
    position: 'relative',
  },
  previewImage: {
    borderRadius: 8,
    height: 60,
    width: 60,
  },
  removeButton: {
    alignItems: 'center',
    borderRadius: 10,
    height: 20,
    justifyContent: 'center',
    position: 'absolute',
    right: -5,
    top: -5,
    width: 20,
  },
  removeIcon: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  uploadingOverlay: {
    alignItems: 'center',
    borderRadius: 8,
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  uploadingText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  uploading: {
    opacity: 0.5,
  },
});
