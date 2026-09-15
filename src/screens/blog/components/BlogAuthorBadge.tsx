import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../../constants';
import type { BlogModel } from '../../../redux/apis/blogApi';
import { DateTimeUtils } from '../../../utils';
import { fs, hs, ws } from '../../../utils/metrics';
import { TYPOGRAPHY } from '../../../utils/typography';

interface Props {
  blog: BlogModel;
  categoryName?: string;
}

export const BlogAuthorBadge: React.FC<Props> = ({ blog, categoryName }) => {
  const authorName = blog.author_name || blog.author || 'Medical Health Team';
  const dateStr = (blog as any)?.date || blog.created_at || '';
  const dateFormatted = DateTimeUtils.getDataFormat(dateStr) || dateStr || '--';

  return (
    <View style={styles.container}>
      <View style={styles.authorRow}>
        <View style={styles.avatarCircle}>
          <MaterialIcons name="person" size={ws(20)} color={Colors.primaryColor} />
        </View>
        <View>
          <Text style={styles.authorName}>{authorName}</Text>
          <Text style={styles.dateText}>Published on {dateFormatted}</Text>
        </View>
      </View>

      {!!categoryName && (
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{categoryName}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: hs(12),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: hs(14),
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(10),
  },
  avatarCircle: {
    width: ws(36),
    height: ws(36),
    borderRadius: ws(18),
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  authorName: {
    fontSize: fs(13),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
  },
  dateText: {
    fontSize: fs(11),
    ...TYPOGRAPHY.regular,
    color: Colors.secondaryFontColor,
    marginTop: hs(1),
  },
  categoryBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: ws(10),
    paddingVertical: hs(4),
    borderRadius: ws(8),
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  categoryText: {
    fontSize: fs(10),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryColor,
  },
});
