import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../../constants';
import { fs, hs, TYPOGRAPHY, ws } from '../../../utils';

interface FamilyMemberHeaderBannerProps {
  memberCount: number;
}

export const FamilyMemberHeaderBanner: React.FC<FamilyMemberHeaderBannerProps> = React.memo(({ memberCount }) => {
  return (
    <View style={styles.listHeaderBanner}>
      <View style={styles.listHeaderIconWrap}>
        <MaterialIcons name="groups" size={fs(22)} color={Colors.primaryColor} />
      </View>
      <View style={styles.listHeaderContent}>
        <View style={styles.listHeaderTitleRow}>
          <Text style={styles.listHeaderTitle}>Family Profiles</Text>
          <View style={styles.memberCountBadge}>
            <Text style={styles.memberCountText}>
              {memberCount} {memberCount === 1 ? 'Member' : 'Members'}
            </Text>
          </View>
        </View>
        <Text style={styles.listHeaderSubtitle}>
          Manage family profiles to book appointments and track vitals easily.
        </Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  listHeaderBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.blue_F0F7FF,
    borderRadius: fs(14),
    borderWidth: 1,
    borderColor: Colors.blue_D4E6FA,
    padding: ws(12),
    marginBottom: hs(14),
    gap: ws(10),
  },
  listHeaderIconWrap: {
    width: ws(38),
    height: ws(38),
    borderRadius: 999,
    backgroundColor: Colors.blue_E0F0FE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listHeaderContent: {
    flex: 1,
  },
  listHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hs(2),
  },
  listHeaderTitle: {
    fontSize: fs(14),
    ...TYPOGRAPHY.bold,
    color: Colors.slate_0F172A,
  },
  memberCountBadge: {
    backgroundColor: Colors.primaryColor,
    paddingHorizontal: ws(8),
    paddingVertical: hs(2),
    borderRadius: fs(10),
  },
  memberCountText: {
    fontSize: fs(10.5),
    ...TYPOGRAPHY.bold,
    color: Colors.white,
  },
  listHeaderSubtitle: {
    fontSize: fs(11),
    ...TYPOGRAPHY.regular,
    color: Colors.slate_64748B,
    lineHeight: fs(15),
  },
});
