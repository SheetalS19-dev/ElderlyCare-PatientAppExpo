import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { Colors } from '../../constants';
import { fs, hs, ws } from '../../utils/metrics';
import { TYPOGRAPHY } from '../../utils/typography';

interface EmptyStateProps {
  message?: string;
  subtitle?: string;
  icon?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  message = 'No data available',
  subtitle,
  icon = 'inbox',
  actionLabel,
  onAction,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconCircle}>
        <MaterialIcons name={icon as any} size={fs(44)} color={Colors.primaryColor} />
      </View>
      <Text style={styles.message}>{message}</Text>
      {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      {!!actionLabel && !!onAction && (
        <TouchableOpacity style={styles.actionBtn} onPress={onAction}>
          <Text style={styles.actionText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: hs(320),
    paddingHorizontal: ws(24),
    paddingVertical: hs(32),
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    width: '100%',
  },
  iconCircle: {
    width: ws(80),
    height: ws(80),
    borderRadius: ws(40),
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hs(16),
  },
  message: {
    ...TYPOGRAPHY.bold,
    fontSize: fs(15),
    color: Colors.primaryFontColor || '#000000',
    textAlign: 'center',
    lineHeight: fs(18),
  },
  actionBtn: {
    marginTop: hs(16),
    paddingHorizontal: ws(16),
    paddingVertical: hs(8),
    borderRadius: ws(8),
    backgroundColor: Colors.primaryColor,
  },
  actionText: {
    ...TYPOGRAPHY.bold,
    fontSize: fs(12),
    color: Colors.white,
  },
  subtitle: {
    marginTop: hs(6),
    ...TYPOGRAPHY.regular,
    fontSize: fs(12),
    color: Colors.secondaryFontColor || '#787878',
    textAlign: 'center',
    maxWidth: ws(280),
    lineHeight: fs(18),
  },
});
