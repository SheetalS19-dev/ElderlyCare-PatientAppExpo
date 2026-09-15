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
import { Colors } from '../../constants';
import { fs, hs, ws } from '../../utils/metrics';
import { TYPOGRAPHY } from '../../utils/typography';

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

        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom + hs(12), hs(24)) }]}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <MaterialIcons name="description" size={fs(24)} color={Colors.primaryColor} />
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
              <MaterialIcons name="close" size={fs(22)} color={Colors.secondaryFontColor} />
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
                  <MaterialIcons name="visibility" size={fs(22)} color="#2563EB" />
                </View>
                <View style={styles.actionMeta}>
                  <Text style={styles.actionTitle}>View / Preview Document</Text>
                  <Text style={styles.actionDescription}>
                    Open in full-page preview with zoom, read & print options
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={fs(20)} color="#CBD5E1" />
              </TouchableOpacity>

              {/* 2. Download to Storage Option */}
              <TouchableOpacity style={styles.actionCard} activeOpacity={0.75} onPress={onDownload}>
                <View style={[styles.actionIconCircle, { backgroundColor: '#ECFDF5' }]}>
                  <MaterialIcons name="file-download" size={fs(22)} color="#059669" />
                </View>
                <View style={styles.actionMeta}>
                  <Text style={styles.actionTitle}>Download & Save to Device</Text>
                  <Text style={styles.actionDescription}>
                    Save PDF file directly to your phone's storage
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={fs(20)} color="#CBD5E1" />
              </TouchableOpacity>

              {/* 3. Share via Apps Option */}
              <TouchableOpacity style={styles.actionCard} activeOpacity={0.75} onPress={onShare}>
                <View style={[styles.actionIconCircle, { backgroundColor: '#EFF6FF' }]}>
                  <MaterialIcons name="share" size={fs(22)} color={Colors.primaryColor} />
                </View>
                <View style={styles.actionMeta}>
                  <Text style={styles.actionTitle}>Share via Apps</Text>
                  <Text style={styles.actionDescription}>
                    Send document via WhatsApp, Email, Drive or other apps
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={fs(20)} color="#CBD5E1" />
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
    borderTopLeftRadius: fs(24),
    borderTopRightRadius: fs(24),
    paddingHorizontal: ws(18),
    paddingTop: hs(10),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 12,
  },
  handle: {
    width: ws(38),
    height: hs(4),
    borderRadius: fs(2),
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: hs(14),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hs(16),
  },
  iconContainer: {
    width: ws(44),
    height: ws(44),
    aspectRatio: 1,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: ws(12),
  },
  headerTextGroup: {
    flex: 1,
    paddingRight: ws(8),
  },
  title: {
    ...TYPOGRAPHY.bold,
    fontSize: fs(16),
    color: Colors.primaryFontColor,
  },
  subtitle: {
    ...TYPOGRAPHY.regular,
    fontSize: fs(11),
    color: Colors.secondaryFontColor,
    marginTop: hs(2),
  },
  loadingContainer: {
    paddingVertical: hs(32),
    alignItems: 'center',
    justifyContent: 'center',
    gap: hs(12),
  },
  loadingText: {
    ...TYPOGRAPHY.medium,
    fontSize: fs(14),
    color: Colors.secondaryFontColor,
  },
  actionsList: {
    gap: hs(10),
    marginBottom: hs(12),
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: fs(16),
    padding: ws(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  actionIconCircle: {
    width: ws(42),
    height: ws(42),
    aspectRatio: 1,
    borderRadius: 999,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: ws(12),
  },
  actionMeta: {
    flex: 1,
    paddingRight: ws(6),
  },
  actionTitle: {
    ...TYPOGRAPHY.bold,
    fontSize: fs(13),
    color: Colors.primaryFontColor,
  },
  actionDescription: {
    ...TYPOGRAPHY.regular,
    fontSize: fs(11),
    color: Colors.secondaryFontColor,
    marginTop: hs(2),
  },
  cancelButton: {
    backgroundColor: '#F1F5F9',
    borderRadius: fs(14),
    paddingVertical: hs(12),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: hs(4),
  },
  cancelButtonText: {
    ...TYPOGRAPHY.bold,
    fontSize: fs(13),
    color: Colors.secondaryFontColor,
  },
});
