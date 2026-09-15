import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../../constants';
import { fs, hs, ws } from '../../../utils/metrics';
import { TYPOGRAPHY } from '../../../utils/typography';

interface Props {
  visible: boolean;
  onClose: () => void;
  onConfirmDelete: () => void;
  isDeleting: boolean;
}

export const DeleteAccountModal: React.FC<Props> = ({
  visible,
  onClose,
  onConfirmDelete,
  isDeleting,
}) => {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={onClose}>
        <View style={styles.cardContent}>
          <View style={styles.iconCircle}>
            <MaterialIcons name="delete-forever" size={ws(32)} color="#EF4444" />
          </View>

          <Text style={styles.title}>Delete Account?</Text>
          <Text style={styles.subtitle}>
            Are you sure you want to delete your account? This action cannot be undone and your account data will be permanently removed.
          </Text>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.cancelBtn}
              activeOpacity={0.8}
              onPress={onClose}
              disabled={isDeleting}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deleteBtn}
              activeOpacity={0.8}
              onPress={onConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Text style={styles.deleteBtnText}>Delete</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: ws(24),
  },
  cardContent: {
    width: '100%',
    maxWidth: ws(340),
    backgroundColor: Colors.white,
    borderRadius: ws(20),
    padding: ws(22),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: hs(4) },
    shadowOpacity: 0.15,
    shadowRadius: ws(10),
    elevation: 5,
  },
  iconCircle: {
    width: ws(56),
    height: ws(56),
    aspectRatio: 1,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hs(12),
  },
  title: {
    fontSize: fs(18),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
    marginBottom: hs(6),
  },
  subtitle: {
    fontSize: fs(12),
    ...TYPOGRAPHY.regular,
    color: Colors.secondaryFontColor,
    textAlign: 'center',
    lineHeight: fs(18),
    marginBottom: hs(20),
  },
  actionsRow: {
    flexDirection: 'row',
    gap: ws(10),
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    height: hs(44),
    borderRadius: ws(12),
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: fs(13),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
  },
  deleteBtn: {
    flex: 1,
    height: hs(44),
    borderRadius: ws(12),
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteBtnText: {
    fontSize: fs(13),
    ...TYPOGRAPHY.bold,
    color: Colors.white,
  },
});
