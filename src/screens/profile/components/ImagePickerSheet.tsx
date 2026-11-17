import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../../constants';
import { fs, hs, TYPOGRAPHY, ws } from '../../../utils';

interface Props {
  visible: boolean;
  onClose: () => void;
  onPickFromGallery: () => void;
  onTakePhoto: () => void;
}

export const ImagePickerSheet: React.FC<Props> = ({
  visible,
  onClose,
  onPickFromGallery,
  onTakePhoto,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      statusBarTranslucent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.bottomModalBackdrop}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
          style={[styles.bottomModalContent, { paddingBottom: Math.max(insets.bottom + 20, 36) }]}
        >
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Choose Profile Photo</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close-circle" size={24} color={Colors.secondaryFontColor} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.sheetOption} onPress={onPickFromGallery}>
            <Ionicons name="images-outline" size={22} color={Colors.primaryColor} />
            <Text style={styles.sheetOptionText}>Select from Gallery</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.sheetOption} onPress={onTakePhoto}>
            <Ionicons name="camera-outline" size={22} color={Colors.primaryColor} />
            <Text style={styles.sheetOptionText}>Take a Photo</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  bottomModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  bottomModalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: fs(24),
    borderTopRightRadius: fs(24),
    paddingTop: hs(12),
    paddingHorizontal: ws(20),
  },
  sheetHandle: {
    width: ws(40),
    height: hs(4),
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: hs(14),
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hs(16),
  },
  sheetTitle: {
    fontSize: fs(15),
    ...TYPOGRAPHY.bold,
    color: Colors.ink,
  },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hs(14),
    borderBottomWidth: 1,
    borderBottomColor: Colors.slate_F1F5F9,
    gap: ws(12),
  },
  sheetOptionText: {
    fontSize: fs(14),
    ...TYPOGRAPHY.medium,
    color: Colors.slate_1E293B,
  },
});
