import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../../constants';
import type { BlogModel } from '../../../redux/apis/blogApi';
import { DateTimeUtils, getImageUrl } from '../../../utils';
import { fs, hs, ws } from '../../../utils/metrics';
import { TYPOGRAPHY } from '../../../utils/typography';

interface Props {
  blog: BlogModel;
  categoryName?: string;
  onPress: (blog: BlogModel) => void;
}

export const BlogCard: React.FC<Props> = ({ blog, categoryName, onPress }) => {
  const imageUrl = (blog as any)?.image ? getImageUrl((blog as any).image) : '';
  const cleanExcerpt = blog.description
    ? blog.description.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()
    : '';

  const dateStr = (blog as any)?.date || blog.created_at || '';
  const dateFormatted = dateStr ? DateTimeUtils.getDataFormat(dateStr) || dateStr : '--';

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.9}
      onPress={() => onPress(blog)}
    >
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.thumbnail} />
      ) : (
        <View style={styles.placeholderThumbnail}>
          <MaterialIcons name="article" size={ws(36)} color="#94A3B8" />
        </View>
      )}

      <View style={styles.body}>
        {!!categoryName && (
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{categoryName}</Text>
          </View>
        )}

        <Text style={styles.title} numberOfLines={2}>
          {blog.title || 'Health Article'}
        </Text>

        {!!cleanExcerpt && (
          <Text style={styles.excerpt} numberOfLines={2}>
            {cleanExcerpt}
          </Text>
        )}

        <View style={styles.footerRow}>
          <View style={styles.authorRow}>
            <MaterialIcons name="person-outline" size={ws(14)} color="#64748B" />
            <Text style={styles.authorText}>
              {blog.author_name || blog.author || 'Elderly Care Team'}
            </Text>
          </View>

          <Text style={styles.dateText}>{dateFormatted}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: ws(16),
    marginBottom: hs(14),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: hs(2) },
    shadowOpacity: 0.03,
    shadowRadius: ws(4),
    elevation: 1,
  },
  thumbnail: {
    width: '100%',
    height: hs(160),
    backgroundColor: '#F1F5F9',
  },
  placeholderThumbnail: {
    width: '100%',
    height: hs(160),
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  body: {
    padding: ws(14),
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: ws(10),
    paddingVertical: hs(4),
    borderRadius: ws(8),
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: hs(8),
  },
  categoryBadgeText: {
    fontSize: fs(10),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryColor,
  },
  title: {
    fontSize: fs(15),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
    marginBottom: hs(4),
  },
  excerpt: {
    fontSize: fs(12),
    ...TYPOGRAPHY.regular,
    color: Colors.secondaryFontColor,
    lineHeight: fs(18),
    marginBottom: hs(10),
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: hs(8),
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(6),
  },
  authorText: {
    fontSize: fs(11),
    ...TYPOGRAPHY.medium,
    color: Colors.secondaryFontColor,
  },
  dateText: {
    fontSize: fs(11),
    ...TYPOGRAPHY.medium,
    color: Colors.secondaryFontColor,
  },
});
