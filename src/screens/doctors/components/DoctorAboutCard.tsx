import React, { memo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppCard } from '../../../components';
import { Colors } from '../../../constants';
import { fs, hs, TYPOGRAPHY, ws } from '../../../utils';

interface DoctorAboutCardProps {
  description?: string;
}

export const DoctorAboutCard = memo(({ description }: DoctorAboutCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!description?.trim()) return null;

  const trimmed = description.trim();

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>About Doctor</Text>
      <AppCard style={styles.aboutCard}>
        <Text style={styles.aboutText} numberOfLines={isExpanded ? undefined : 3}>
          {trimmed}
        </Text>
        {trimmed.length > 140 && (
          <TouchableOpacity
            onPress={() => setIsExpanded(!isExpanded)}
            style={styles.readMoreBtn}
            activeOpacity={0.7}
          >
            <Text style={styles.readMoreText}>
              {isExpanded ? 'Read Less' : 'Read More >'}
            </Text>
          </TouchableOpacity>
        )}
      </AppCard>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: hs(14),
  },
  sectionTitle: {
    fontSize: fs(14),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
    marginBottom: hs(10),
  },
  aboutCard: {
    padding: ws(16),
    borderRadius: fs(16),
  },
  aboutText: {
    fontSize: fs(13),
    ...TYPOGRAPHY.regular,
    color: Colors.secondaryFontColor,
    lineHeight: hs(20),
  },
  readMoreBtn: {
    marginTop: hs(8),
    alignSelf: 'flex-start',
  },
  readMoreText: {
    fontSize: fs(12),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryColor,
  },
});
