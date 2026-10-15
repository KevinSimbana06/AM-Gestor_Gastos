import { LiquidGlassColors, Spacing } from '@/constants/theme';
import { Directory, File, Paths } from 'expo-file-system';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useState } from 'react';
import { Alert, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ExpenseImagePickerProps {
  value?: string;
  onChange: (uri?: string) => void;
  disabled?: boolean;
}

interface ReceiptPicker {
  pickFromCamera: () => Promise<void>;
  pickFromGallery: () => Promise<void>;
  removeReceipt: () => void;
  isBusy: boolean;
}

function receiptsDirectory(): Directory {
  const directory = new Directory(Paths.document, 'receipts');
  if (!directory.exists) {
    directory.create({ intermediates: true });
  }
  return directory;
}

async function saveReceiptImage(sourceUri: string, receiptId: string): Promise<string> {
  if (Platform.OS === 'web') {
    return sourceUri;
  }

  const source = new File(sourceUri);
  const fileName = receiptId + '-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10) + '.' + (source.extension || 'jpg');
  const destination = new File(receiptsDirectory(), fileName);
  await source.copy(destination);
  return destination.uri;
}

export function deleteReceiptImage(uri?: string): void {
  if (!uri || Platform.OS === 'web') {
    return;
  }

  const file = new File(uri);
  if (file.exists) {
    file.delete();
  }
}

export function useReceiptPicker(
  value: string | undefined,
  onChange: (uri?: string) => void
): ReceiptPicker {
  const [isBusy, setIsBusy] = useState(false);

  const pickReceipt = useCallback(async (source: 'camera' | 'gallery') => {
    setIsBusy(true);
    try {
      const permission = source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          'Permiso requerido',
          source === 'camera'
            ? 'Necesitamos permiso para usar la cámara y fotografiar el comprobante.'
            : 'Necesitamos permiso para acceder a tus fotos y adjuntar el comprobante.'
        );
        return;
      }

      const result = source === 'camera'
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });

      if (result.canceled) {
        return;
      }

      const savedUri = await saveReceiptImage(result.assets[0].uri, `receipt-${Date.now()}`);
      deleteReceiptImage(value);
      onChange(savedUri);
    } catch (error) {
      console.error('No se pudo guardar el comprobante', error);
      Alert.alert('No se pudo adjuntar el comprobante', 'Inténtalo de nuevo.');
    } finally {
      setIsBusy(false);
    }
  }, [onChange, value]);

  const removeReceipt = useCallback(() => {
    deleteReceiptImage(value);
    onChange(undefined);
  }, [onChange, value]);

  return {
    pickFromCamera: () => pickReceipt('camera'),
    pickFromGallery: () => pickReceipt('gallery'),
    removeReceipt,
    isBusy,
  };
}

export const ExpenseImagePicker: React.FC<ExpenseImagePickerProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const { pickFromCamera, pickFromGallery, removeReceipt, isBusy } = useReceiptPicker(value, onChange);
  const isDisabled = disabled || isBusy;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Comprobante del gasto</Text>
      {value ? (
        <View style={styles.previewContainer}>
          <Image source={value} contentFit="cover" transition={200} style={styles.preview} />
          <TouchableOpacity onPress={removeReceipt} disabled={isDisabled} style={styles.removeButton}>
            <Text style={styles.removeText}>Quitar comprobante</Text>
          </TouchableOpacity>
        </View>
      ) : null}
      <View style={styles.actions}>
        <TouchableOpacity onPress={pickFromCamera} disabled={isDisabled} activeOpacity={0.8} style={styles.actionWrapper}>
          <LinearGradient
            colors={[LiquidGlassColors.primary, LiquidGlassColors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.action}
          >
            <Text style={styles.actionText}>{isBusy ? 'Guardando...' : 'Usar cámara'}</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity onPress={pickFromGallery} disabled={isDisabled} style={styles.galleryButton}>
          <Text style={styles.galleryText}>Elegir de galería</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  title: {
    color: LiquidGlassColors.glassText,
    fontSize: 16,
    fontWeight: '600',
  },
  previewContainer: {
    gap: Spacing.two,
  },
  preview: {
    width: '100%',
    height: 180,
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: LiquidGlassColors.glassBorder,
  },
  actions: {
    gap: Spacing.two,
  },
  actionWrapper: {
    borderRadius: Spacing.two,
    overflow: 'hidden',
  },
  action: {
    alignItems: 'center',
    padding: Spacing.two,
  },
  actionText: {
    color: LiquidGlassColors.glassTextLight,
    fontWeight: '600',
  },
  galleryButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderColor: LiquidGlassColors.glassBorder,
    borderRadius: Spacing.two,
    borderWidth: 1,
    padding: Spacing.two,
  },
  galleryText: {
    color: LiquidGlassColors.glassText,
    fontWeight: '600',
  },
  removeButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderColor: LiquidGlassColors.glassBorder,
    borderRadius: Spacing.two,
    borderWidth: 1,
    padding: Spacing.two,
  },
  removeText: {
    color: LiquidGlassColors.secondary,
    fontWeight: '600',
  },
});

