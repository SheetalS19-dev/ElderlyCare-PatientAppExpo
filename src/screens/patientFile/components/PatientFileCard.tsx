import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppCard } from '../../../components';
import { Colors } from '../../../constants';
import type { PatientFileModel } from '../../../types';
import { fs, hs, TYPOGRAPHY, ws } from '../../../utils';

interface Props {
  item: PatientFileModel;
  patientInfo: string;
  dateStr: string;
  isDownloading: boolean;
  onOpen: () => void;
  onDownload: () => void;
}

export const PatientFileCard: React.FC<Props> = ({
  item,
  patientInfo,
  dateStr,
  isDownloading,
  onOpen,
  onDownload,
}) => {
  const rawTitle = (item as any).title || item.file_name || 'Medical File';

  return (
    <AppCard style={styles.fileCard}>
      <View style={styles.row}>
        {/* File Icon */}
        <View style={styles.folderIconBox}>
          <MaterialIcons name="insert-drive-file" size={ws(22)} color={Colors.primaryColor} />
        </View>

        {/* File Metadata */}
        <View style={styles.info}>
          <View style={styles.titleRow}>
            <Text style={styles.fileTitle} numberOfLines={1}>
              {rawTitle}
            </Text>
            {!!item.id && (
              <View style={styles.idBadge}>
                <Text style={styles.idText}>#{item.id}</Text>
              </View>
            )}
          </View>
          <Text style={styles.patientSubtext} numberOfLines={1}>
            Patient: {patientInfo}
          </Text>
          <Text style={styles.dateSubtext}>
            Date: {dateStr}
          </Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionGroup}>
          <TouchableOpacity
            style={styles.actionBtnBlue}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={onOpen}
            activeOpacity={0.8}
          >
            <MaterialIcons name="visibility" size={ws(18)} color={Colors.primaryColor} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtnOrange}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={onDownload}
            activeOpacity={0.8}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <ActivityIndicator size="small" color={Colors.primaryColor} />
            ) : (
              <MaterialIcons name="file-download" size={ws(18)} color={Colors.primaryColor} />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </AppCard>
  );
};

const styles = StyleSheet.create({
  fileCard: {
    marginBottom: hs(12),
    borderRadius: ws(16),
    padding: ws(14),
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(12),
  },
  folderIconBox: {
    width: ws(44),
    height: ws(44),
    borderRadius: ws(12),
    backgroundColor: Colors.aquaSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    gap: hs(2),
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(6),
  },
  fileTitle: {
    ...TYPOGRAPHY.bold,
    fontSize: fs(14),
    color: Colors.primaryFontColor,
    flexShrink: 1,
  },
  idBadge: {
    backgroundColor: Colors.aquaSoft,
    paddingHorizontal: ws(6),
    paddingVertical: hs(1.5),
    borderRadius: fs(5),
  },
  idText: {
    ...TYPOGRAPHY.bold,
    fontSize: fs(11),
    color: Colors.primaryColor,
  },
  patientSubtext: {
    ...TYPOGRAPHY.medium,
    fontSize: fs(12),
    color: Colors.secondaryFontColor,
  },
  dateSubtext: {
    ...TYPOGRAPHY.regular,
    fontSize: fs(11),
    color: Colors.slate_94A3B8,
  },
  actionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(8),
  },
  actionBtnBlue: {
    width: ws(36),
    height: ws(36),
    borderRadius: ws(18),
    backgroundColor: Colors.aquaSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnOrange: {
    width: ws(36),
    height: ws(36),
    borderRadius: ws(18),
    backgroundColor: Colors.yellow_FEF3C7,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
