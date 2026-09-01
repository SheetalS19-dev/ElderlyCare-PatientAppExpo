import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AppCard,
  AppHeader,
  EmptyState,
  ErrorState,
  LoadingIndicator,
} from '../../components';
import { Colors, Typography } from '../../constants';
import type { RootStackParamList } from '../../navigation/types';
import {
  useGetBlogCategoriesQuery,
  useGetBlogsQuery,
  useGetBlogTagsQuery,
  type BlogCategoryModel,
  type BlogModel,
} from '../../redux/apis/blogApi';
import { DateTimeUtils, getImageUrl } from '../../utils';

type Props = NativeStackScreenProps<RootStackParamList, 'BlogList'>;

export const BlogListScreen = ({ navigation }: Props) => {
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = useState<string | number | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const {
    data: blogsData,
    isLoading: isBlogsLoading,
    isFetching: isBlogsFetching,
    isError: isBlogsError,
    refetch: refetchBlogs,
  } = useGetBlogsQuery();

  const { data: categoriesData, refetch: refetchCategories } = useGetBlogCategoriesQuery();
  const { data: tagsData, refetch: refetchTags } = useGetBlogTagsQuery();

  // Dynamic Categories
  const categories: BlogCategoryModel[] = useMemo(() => {
    if (Array.isArray(categoriesData)) return categoriesData;
    if (Array.isArray((categoriesData as any)?.data)) return (categoriesData as any).data;
    return [];
  }, [categoriesData]);

  // Dynamic Tags from API
  const dynamicTags: string[] = useMemo(() => {
    const list: string[] = [];
    if (Array.isArray(tagsData)) {
      tagsData.forEach((t) => typeof t === 'string' && list.push(t));
    } else if (Array.isArray((tagsData as any)?.data)) {
      (tagsData as any).data.forEach((t: any) => typeof t === 'string' && list.push(t));
    }

    if (list.length > 0) return list;

    // Fallback: extract from blogs
    const set = new Set<string>();
    const rawBlogs = Array.isArray(blogsData) ? blogsData : (blogsData as any)?.data ?? [];
    if (Array.isArray(rawBlogs)) {
      rawBlogs.forEach((blog: BlogModel) => {
        if (blog.tags) {
          blog.tags.split(',').forEach((t) => {
            const clean = t.trim();
            if (clean) set.add(clean);
          });
        }
      });
    }
    return Array.from(set);
  }, [tagsData, blogsData]);

  // Raw blogs array
  const rawBlogs: BlogModel[] = useMemo(() => {
    if (Array.isArray(blogsData)) return blogsData;
    if (Array.isArray((blogsData as any)?.data)) return (blogsData as any).data;
    return [];
  }, [blogsData]);

  // Helper map of category id to category name
  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((cat) => {
      if (cat.id != null && cat.name) {
        map.set(String(cat.id), cat.name);
      }
    });
    return map;
  }, [categories]);

  // Filtered blogs list
  const filteredBlogs = useMemo(() => {
    return rawBlogs.filter((blog) => {
      // Filter by category
      if (selectedCategory !== null && String(blog.category) !== String(selectedCategory)) {
        return false;
      }

      // Filter by tag
      if (selectedTag !== null) {
        if (!blog.tags) return false;
        const tagList = blog.tags
          .toLowerCase()
          .split(',')
          .map((t) => t.trim());
        if (!tagList.includes(selectedTag.toLowerCase())) {
          return false;
        }
      }

      // Filter by search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const titleMatch = (blog.title || '').toLowerCase().includes(query);
        const descMatch = (blog.description || '').toLowerCase().includes(query);
        const authorMatch = (blog.author_name || '').toLowerCase().includes(query);
        const tagMatch = (blog.tags || '').toLowerCase().includes(query);
        if (!titleMatch && !descMatch && !authorMatch && !tagMatch) {
          return false;
        }
      }

      return true;
    });
  }, [rawBlogs, selectedCategory, selectedTag, searchQuery]);

  // Clean HTML from blog description
  const stripHtml = (html?: string) => {
    if (!html) return '';
    return html.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
  };

  const handleRefresh = () => {
    refetchBlogs();
    refetchCategories();
    refetchTags();
  };

  const clearFilters = () => {
    setSelectedCategory(null);
    setSelectedTag(null);
    setSearchQuery('');
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Health Blogs & Articles" onBackPress={() => navigation.goBack()} />

      {isBlogsLoading ? (
        <LoadingIndicator />
      ) : isBlogsError ? (
        <ErrorState message="Couldn't load health blogs" onRetry={handleRefresh} />
      ) : (
        <FlatList
          data={filteredBlogs}
          keyExtractor={(item: BlogModel, index: number) => `blog-${item.id ?? index}`}
          contentContainerStyle={[styles.listContent, { paddingBottom: Math.max(insets.bottom + 20, 32) }]}
          onRefresh={handleRefresh}
          refreshing={isBlogsFetching}
          ListHeaderComponent={
            <>
              {/* Search Bar */}
              <View style={styles.searchContainer}>
                <MaterialIcons name="search" size={20} color={Colors.primaryColor} style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search health articles, topics..."
                  placeholderTextColor={Colors.secondaryFontColor}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  clearButtonMode="while-editing"
                />
                {!!searchQuery && (
                  <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <MaterialIcons name="cancel" size={18} color={Colors.secondaryFontColor} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Dynamic Categories Section */}
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Categories</Text>
                {selectedCategory !== null && (
                  <TouchableOpacity onPress={() => setSelectedCategory(null)}>
                    <Text style={styles.clearLink}>Clear</Text>
                  </TouchableOpacity>
                )}
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsScrollContainer}
              >
                {/* All category pill */}
                <TouchableOpacity
                  style={[styles.categoryChip, selectedCategory === null && styles.categoryChipActive]}
                  onPress={() => setSelectedCategory(null)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      selectedCategory === null && styles.categoryChipTextActive,
                    ]}
                  >
                    All ({rawBlogs.length})
                  </Text>
                </TouchableOpacity>

                {/* Dynamic categories from API */}
                {categories.map((cat) => {
                  const isSelected = String(selectedCategory) === String(cat.id);
                  return (
                    <TouchableOpacity
                      key={`cat-${cat.id}`}
                      style={[styles.categoryChip, isSelected && styles.categoryChipActive]}
                      onPress={() => setSelectedCategory(isSelected ? null : (cat.id ?? null))}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.categoryChipText,
                          isSelected && styles.categoryChipTextActive,
                        ]}
                      >
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Dynamic Tags Section from /tags API */}
              {dynamicTags.length > 0 && (
                <>
                  <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionTitle}>Popular Tags</Text>
                    {selectedTag !== null && (
                      <TouchableOpacity onPress={() => setSelectedTag(null)}>
                        <Text style={styles.clearLink}>Clear</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.chipsScrollContainer}
                  >
                    {dynamicTags.map((tag) => {
                      const isSelected = selectedTag?.toLowerCase() === tag.toLowerCase();
                      return (
                        <TouchableOpacity
                          key={`tag-${tag}`}
                          style={[styles.tagChip, isSelected && styles.tagChipActive]}
                          onPress={() => setSelectedTag(isSelected ? null : tag)}
                          activeOpacity={0.7}
                        >
                          <MaterialIcons
                            name="local-offer"
                            size={12}
                            color={isSelected ? Colors.white : Colors.primaryColor}
                            style={{ marginRight: 4 }}
                          />
                          <Text
                            style={[
                              styles.tagChipText,
                              isSelected && styles.tagChipTextActive,
                            ]}
                          >
                            {tag}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </>
              )}

              {/* Filter feedback info */}
              <View style={styles.articlesHeaderRow}>
                <Text style={styles.articlesHeaderTitle}>
                  {selectedCategory != null
                    ? `${categoryMap.get(String(selectedCategory)) || 'Category'} Articles`
                    : selectedTag != null
                      ? `Articles tagged "${selectedTag}"`
                      : 'Latest Articles'}
                </Text>
                <Text style={styles.articlesCountBadge}>
                  {filteredBlogs.length} {filteredBlogs.length === 1 ? 'Article' : 'Articles'}
                </Text>
              </View>
            </>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <EmptyState
                message={
                  searchQuery || selectedCategory !== null || selectedTag !== null
                    ? 'No health articles found matching your filters.'
                    : 'No health articles published yet.'
                }
              />
              {(searchQuery || selectedCategory !== null || selectedTag !== null) && (
                <TouchableOpacity style={styles.clearFiltersBtn} activeOpacity={0.8} onPress={clearFilters}>
                  <Text style={styles.clearFiltersBtnText}>Reset All Filters</Text>
                </TouchableOpacity>
              )}
            </View>
          }
          renderItem={({ item }) => {
            const categoryTitle =
              item.category_name ||
              (item.category ? categoryMap.get(String(item.category)) : null) ||
              'Health Care';
            const snippet = stripHtml(item.description);
            const blogTags = item.tags
              ? item.tags
                  .split(',')
                  .map((t) => t.trim())
                  .filter(Boolean)
              : [];

            return (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => navigation.navigate('BlogDetail', { blogId: String(item.id) })}
              >
                <AppCard style={styles.blogCard}>
                  {/* Featured Image */}
                  {!!item.featured_image && (
                    <View style={styles.imageContainer}>
                      <Image
                        source={{ uri: getImageUrl(item.featured_image) }}
                        style={styles.featuredImage}
                        resizeMode="cover"
                      />
                      {/* Category Pill Over Image */}
                      <View style={styles.categoryPill}>
                        <Text style={styles.categoryPillText}>{categoryTitle}</Text>
                      </View>
                    </View>
                  )}

                  <View style={styles.cardBody}>
                    {!item.featured_image && (
                      <View style={styles.inlineCategoryPill}>
                        <Text style={styles.inlineCategoryPillText}>{categoryTitle}</Text>
                      </View>
                    )}

                    {/* Blog Title */}
                    <Text style={styles.blogTitle} numberOfLines={2}>
                      {item.title}
                    </Text>

                    {/* Excerpt */}
                    {!!snippet && (
                      <Text style={styles.blogExcerpt} numberOfLines={3}>
                        {snippet}
                      </Text>
                    )}

                    {/* Tags row on card */}
                    {blogTags.length > 0 && (
                      <View style={styles.cardTagsRow}>
                        {blogTags.slice(0, 3).map((tag, idx) => (
                          <View key={`b-tag-${idx}`} style={styles.cardTagPill}>
                            <Text style={styles.cardTagText}>#{tag}</Text>
                          </View>
                        ))}
                        {blogTags.length > 3 && (
                          <Text style={styles.moreTagsText}>+{blogTags.length - 3} more</Text>
                        )}
                      </View>
                    )}

                    {/* Footer metadata */}
                    <View style={styles.cardFooter}>
                      <View style={styles.authorRow}>
                        <View style={styles.authorAvatar}>
                          <MaterialIcons name="person" size={14} color={Colors.primaryColor} />
                        </View>
                        <Text style={styles.authorName} numberOfLines={1}>
                          {item.author_name || 'Medical Specialist'}
                        </Text>
                      </View>

                      <View style={styles.metaRight}>
                        {item.comment_count != null && (
                          <View style={styles.commentBadge}>
                            <MaterialIcons name="chat-bubble-outline" size={12} color={Colors.secondaryFontColor} />
                            <Text style={styles.commentText}>{item.comment_count}</Text>
                          </View>
                        )}
                        <Text style={styles.dateText}>
                          {DateTimeUtils.getDataFormat(item.created_at)}
                        </Text>
                      </View>
                    </View>
                  </View>
                </AppCard>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgColor,
  },
  listContent: {
    flexGrow: 1,
    padding: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.primaryFontColor,
    paddingVertical: 0,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryFontColor,
  },
  clearLink: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.primaryColor,
  },
  chipsScrollContainer: {
    gap: 8,
    paddingBottom: 14,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryChipActive: {
    backgroundColor: Colors.primaryColor,
    borderColor: Colors.primaryColor,
  },
  categoryChipText: {
    fontSize: 12,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.primaryFontColor,
  },
  categoryChipTextActive: {
    color: Colors.white,
    fontFamily: Typography.fontFamily.bold,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#FFF5EB',
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  tagChipActive: {
    backgroundColor: Colors.primaryColor,
    borderColor: Colors.primaryColor,
  },
  tagChipText: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.primaryColor,
  },
  tagChipTextActive: {
    color: Colors.white,
    fontFamily: Typography.fontFamily.bold,
  },
  articlesHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 12,
  },
  articlesHeaderTitle: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryFontColor,
  },
  articlesCountBadge: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.secondaryFontColor,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  blogCard: {
    marginBottom: 16,
    padding: 0,
    overflow: 'hidden',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  imageContainer: {
    width: '100%',
    height: 180,
    position: 'relative',
    backgroundColor: '#F1F5F9',
  },
  featuredImage: {
    width: '100%',
    height: '100%',
  },
  categoryPill: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: Colors.primaryColor,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryPillText: {
    color: Colors.white,
    fontSize: 11,
    fontFamily: Typography.fontFamily.bold,
  },
  inlineCategoryPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF5EB',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  inlineCategoryPillText: {
    color: Colors.primaryColor,
    fontSize: 11,
    fontFamily: Typography.fontFamily.bold,
  },
  cardBody: {
    padding: 16,
  },
  blogTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryFontColor,
    lineHeight: 22,
    marginBottom: 6,
  },
  blogExcerpt: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.secondaryFontColor,
    lineHeight: 18,
    marginBottom: 10,
  },
  cardTagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  cardTagPill: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardTagText: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.secondaryFontColor,
  },
  moreTagsText: {
    fontSize: 10,
    color: Colors.secondaryFontColor,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  authorAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFF5EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  authorName: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.primaryFontColor,
  },
  metaRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  commentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  commentText: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.secondaryFontColor,
  },
  dateText: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.secondaryFontColor,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  clearFiltersBtn: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#FFF5EB',
    borderWidth: 1,
    borderColor: Colors.primaryColor,
  },
  clearFiltersBtnText: {
    fontSize: 12,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryColor,
  },
});
