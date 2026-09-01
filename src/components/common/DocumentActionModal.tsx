import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography } from '../../constants';

export interface DocumentActionModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  onView: () => void;
  onDownload: () => void;
  onShare: () => void;
  isLoading?: boolean;
  loadingMessage?: string;
}

export const DocumentActionModal: React.FC<DocumentActionModalProps> = ({
  visible,
  onClose,
  title,
  subtitle = 'Choose how you would like to open or save this document',
  onView,
  onDownload,
  onShare,
  isLoading = false,
  loadingMessage = 'Preparing document...',
}) => {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <TouchableOpacity style={styles.dismissArea} activeOpacity={1} onPress={onClose} />

        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom + 12, 24) }]}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <MaterialIcons name="description" size={24} color={Colors.primaryColor} />
            </View>
            <View style={styles.headerTextGroup}>
              <Text style={styles.title} numberOfLines={1}>
                {title}
              </Text>
              <Text style={styles.subtitle} numberOfLines={2}>
                {subtitle}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <MaterialIcons name="close" size={22} color={Colors.secondaryFontColor} />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primaryColor} />
              <Text style={styles.loadingText}>{loadingMessage}</Text>
            </View>
          ) : (
            <View style={styles.actionsList}>
              {/* 1. View / Preview Option */}
              <TouchableOpacity style={styles.actionCard} activeOpacity={0.75} onPress={onView}>
                <View style={[styles.actionIconCircle, { backgroundColor: '#EBF5FF' }]}>
                  <MaterialIcons name="visibility" size={22} color="#2563EB" />
                </View>
                <View style={styles.actionMeta}>
                  <Text style={styles.actionTitle}>View / Preview Document</Text>
                  <Text style={styles.actionDescription}>
                    Open in full-page preview with zoom, read & print options
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color="#CBD5E1" />
              </TouchableOpacity>

              {/* 2. Download to Storage Option */}
              <TouchableOpacity style={styles.actionCard} activeOpacity={0.75} onPress={onDownload}>
                <View style={[styles.actionIconCircle, { backgroundColor: '#ECFDF5' }]}>
                  <MaterialIcons name="file-download" size={22} color="#059669" />
                </View>
                <View style={styles.actionMeta}>
                  <Text style={styles.actionTitle}>Download & Save to Device</Text>
                  <Text style={styles.actionDescription}>
                    Save PDF file directly to your phone's storage
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color="#CBD5E1" />
              </TouchableOpacity>

              {/* 3. Share via Apps Option */}
              <TouchableOpacity style={styles.actionCard} activeOpacity={0.75} onPress={onShare}>
                <View style={[styles.actionIconCircle, { backgroundColor: '#EFF6FF' }]}>
                  <MaterialIcons name="share" size={22} color={Colors.primaryColor} />
                </View>
                <View style={styles.actionMeta}>
                  <Text style={styles.actionTitle}>Share via Apps</Text>
                  <Text style={styles.actionDescription}>
                    Send document via WhatsApp, Email, Drive or other apps
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color="#CBD5E1" />
              </TouchableOpacity>
            </View>
          )}

          {/* Cancel button */}
          <TouchableOpacity style={styles.cancelButton} activeOpacity={0.8} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  dismissArea: {
    flex: 1,
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 12,
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTextGroup: {
    flex: 1,
    paddingRight: 8,
  },
  title: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryFontColor,
  },
  subtitle: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.secondaryFontColor,
    marginTop: 2,
  },
  loadingContainer: {
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.secondaryFontColor,
  },
  actionsList: {
    gap: 10,
    marginBottom: 12,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  actionIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionMeta: {
    flex: 1,
    paddingRight: 6,
  },
  actionTitle: {
    fontSize: 13,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryFontColor,
  },
  actionDescription: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.secondaryFontColor,
    marginTop: 2,
  },
  cancelButton: {
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  cancelButtonText: {
    fontSize: 13,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.secondaryFontColor,
  },
});
