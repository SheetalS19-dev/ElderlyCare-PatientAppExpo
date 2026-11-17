import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { memo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../../constants';
import { fs, hs, TYPOGRAPHY, ws } from '../../../utils';

interface EmergencySupportCardProps {
  onContact: () => void;
}

export const EmergencySupportCard = memo(({ onContact }: EmergencySupportCardProps) => {
  return (
    <View style={styles.supportBannerCard}>
      <View style={styles.supportIconBox}>
        <MaterialIcons name="support-agent" size={30} color={Colors.primaryColor} />
      </View>
      <View style={styles.supportMeta}>
        <Text style={styles.supportTitle}>Need Emergency Assistance?</Text>
        <Text style={styles.supportDesc}>
          Our elderly care helpline is active 24/7 for patient queries and support.
        </Text>
      </View>
      <TouchableOpacity
        style={styles.supportCallBtn}
        onPress={onContact}
        activeOpacity={0.8}
      >
        <MaterialIcons name="call" size={16} color={Colors.white} />
        <Text style={styles.supportCallText}>Contact</Text>
      </TouchableOpacity>
    </View>
  );
});

const styles = StyleSheet.create({
  supportBannerCard: {
    marginHorizontal: ws(16),
    marginTop: hs(18),
    marginBottom: hs(8),
    padding: ws(16),
    backgroundColor: Colors.green_F0FDF4,
    borderRadius: fs(18),
    borderWidth: 1,
    borderColor: Colors.badgeSuccessBg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(12),
  },
  supportIconBox: {
    width: ws(48),
    height: ws(48),
    borderRadius: fs(14),
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  supportMeta: {
    flex: 1,
  },
  supportTitle: {
    ...TYPOGRAPHY.bold,
    fontSize: fs(13.5),
    color: Colors.green_166534,
    marginBottom: hs(2),
  },
  supportDesc: {
    ...TYPOGRAPHY.regular,
    fontSize: fs(11),
    color: Colors.green_15803D,
    lineHeight: fs(15),
  },
  supportCallBtn: {
    backgroundColor: Colors.green_16A34A,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ws(12),
    paddingVertical: hs(8),
    borderRadius: fs(10),
    gap: ws(4),
  },
  supportCallText: {
    ...TYPOGRAPHY.bold,
    fontSize: fs(12),
    color: Colors.white,
  },
});
