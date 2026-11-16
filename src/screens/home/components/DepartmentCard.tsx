import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { memo } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../../constants';
import type { DepartmentModel } from '../../../redux/apis/doctorApi';
import { fs, getDepartmentImageUrl, getImageUrl, hs, TYPOGRAPHY, ws } from '../../../utils';

interface DepartmentCardProps {
  item: DepartmentModel;
  onPress: () => void;
}

export const DepartmentCard = memo(({ item, onPress }: DepartmentCardProps) => {
  const imageUrl = getDepartmentImageUrl(item) || getImageUrl(item.image);

  return (
    <TouchableOpacity style={styles.deptCard} activeOpacity={0.8} onPress={onPress}>
      <View style={styles.deptIconFrame}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.deptIcon} resizeMode="cover" />
        ) : (
          <MaterialIcons name="medical-services" size={26} color={Colors.primaryColor} />
        )}
      </View>
      <Text style={styles.deptTitle} numberOfLines={2}>
        {item.title}
      </Text>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  deptCard: {
    alignItems: 'center',
    marginRight: ws(14),
    width: ws(76),
  },
  deptIconFrame: {
    width: ws(62),
    height: ws(62),
    borderRadius: fs(18),
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: hs(6),
  },
  deptIcon: {
    width: ws(34),
    height: ws(34),
    borderRadius: fs(8),
  },
  deptTitle: {
    ...TYPOGRAPHY.medium,
    fontSize: fs(11),
    color: Colors.ink,
    textAlign: 'center',
    lineHeight: fs(14),
  },
});
