import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Colors } from '../../../constants';
import type { BlogCategoryModel } from '../../../redux/apis/blogApi';
import { fs, hs, ws } from '../../../utils/metrics';
import { TYPOGRAPHY } from '../../../utils/typography';

interface Props {
  categories: BlogCategoryModel[];
  selectedCategory: string | number | null;
  onSelectCategory: (id: string | number | null) => void;
}

export const BlogCategoryPills: React.FC<Props> = ({
  categories,
  selectedCategory,
  onSelectCategory,
}) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      <TouchableOpacity
        style={[styles.pill, selectedCategory === null && styles.pillActive]}
        activeOpacity={0.8}
        onPress={() => onSelectCategory(null)}
      >
        <Text style={[styles.pillText, selectedCategory === null && styles.pillTextActive]}>
          All Articles
        </Text>
      </TouchableOpacity>

      {categories.map((cat) => {
        const isSelected = String(selectedCategory) === String(cat.id);
        return (
          <TouchableOpacity
            key={String(cat.id)}
            style={[styles.pill, isSelected && styles.pillActive]}
            activeOpacity={0.8}
            onPress={() => onSelectCategory(cat.id)}
          >
            <Text style={[styles.pillText, isSelected && styles.pillTextActive]}>
              {cat.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    gap: ws(8),
    paddingHorizontal: ws(16),
    paddingBottom: hs(12),
  },
  pill: {
    paddingHorizontal: ws(14),
    paddingVertical: hs(8),
    borderRadius: ws(20),
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pillActive: {
    backgroundColor: Colors.primaryColor,
    borderColor: Colors.primaryColor,
  },
  pillText: {
    fontSize: fs(12),
    ...TYPOGRAPHY.bold,
    color: Colors.secondaryFontColor,
  },
  pillTextActive: {
    color: Colors.white,
  },
});
