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
import { Colors } from '../../constants';
import type { RootStackParamList } from '../../navigation/types';
import {
  useGetBlogCategoriesQuery,
  useGetBlogsQuery,
  useGetBlogTagsQuery,
  type BlogCategoryModel,
  type BlogModel,
} from '../../redux/apis/blogApi';
import { DateTimeUtils, fs, getImageUrl, hs, TYPOGRAPHY, ws } from '../../utils';

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
          contentContainerStyle={[styles.listContent, { paddingBottom: Math.max(insets.bottom + hs(20), hs(32)) }]}
          onRefresh={handleRefresh}
          refreshing={isBlogsFetching}
          ListHeaderComponent={
            <>
              {/* Search Bar */}
              <View style={styles.searchContainer}>
                <MaterialIcons name="search" size={fs(20)} color={Colors.primaryColor} style={styles.searchIcon} />
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
                    <MaterialIcons name="cancel" size={fs(18)} color={Colors.secondaryFontColor} />
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
                            size={fs(12)}
                            color={isSelected ? Colors.white : Colors.primaryColor}
                            style={{ marginRight: ws(4) }}
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
                          <MaterialIcons name="person" size={fs(14)} color={Colors.primaryColor} />
                        </View>
                        <Text style={styles.authorName} numberOfLines={1}>
                          {item.author_name || 'Medical Specialist'}
                        </Text>
                      </View>

                      <View style={styles.metaRight}>
                        {item.comment_count != null && (
                          <View style={styles.commentBadge}>
                            <MaterialIcons name="chat-bubble-outline" size={fs(12)} color={Colors.secondaryFontColor} />
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
    padding: ws(16),
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: fs(14),
    paddingHorizontal: ws(14),
    height: hs(46),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: hs(16),
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  searchIcon: {
    marginRight: ws(8),
  },
  searchInput: {
    flex: 1,
    fontSize: fs(14),
    ...TYPOGRAPHY.medium,
    color: Colors.primaryFontColor,
    paddingVertical: 0,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hs(10),
  },
  sectionTitle: {
    fontSize: fs(14),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
  },
  clearLink: {
    fontSize: fs(11),
    ...TYPOGRAPHY.medium,
    color: Colors.primaryColor,
  },
  chipsScrollContainer: {
    gap: ws(8),
    paddingBottom: hs(14),
  },
  categoryChip: {
    paddingHorizontal: ws(14),
    paddingVertical: hs(8),
    borderRadius: fs(12),
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryChipActive: {
    backgroundColor: Colors.primaryColor,
    borderColor: Colors.primaryColor,
  },
  categoryChipText: {
    fontSize: fs(12),
    ...TYPOGRAPHY.medium,
    color: Colors.primaryFontColor,
  },
  categoryChipTextActive: {
    color: Colors.white,
    ...TYPOGRAPHY.bold,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ws(12),
    paddingVertical: hs(6),
    borderRadius: fs(16),
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  tagChipActive: {
    backgroundColor: Colors.primaryColor,
    borderColor: Colors.primaryColor,
  },
  tagChipText: {
    fontSize: fs(11),
    ...TYPOGRAPHY.medium,
    color: Colors.primaryColor,
  },
  tagChipTextActive: {
    color: Colors.white,
    ...TYPOGRAPHY.bold,
  },
  articlesHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: hs(6),
    marginBottom: hs(12),
  },
  articlesHeaderTitle: {
    fontSize: fs(16),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
  },
  articlesCountBadge: {
    fontSize: fs(11),
    ...TYPOGRAPHY.medium,
    color: Colors.secondaryFontColor,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: ws(8),
    paddingVertical: hs(3),
    borderRadius: fs(10),
  },
  blogCard: {
    marginBottom: hs(16),
    padding: 0,
    overflow: 'hidden',
    borderRadius: fs(18),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  imageContainer: {
    width: '100%',
    height: hs(180),
    position: 'relative',
    backgroundColor: '#F1F5F9',
  },
  featuredImage: {
    width: '100%',
    height: '100%',
  },
  categoryPill: {
    position: 'absolute',
    top: hs(12),
    left: ws(12),
    backgroundColor: Colors.primaryColor,
    paddingHorizontal: ws(10),
    paddingVertical: hs(4),
    borderRadius: fs(8),
  },
  categoryPillText: {
    color: Colors.white,
    fontSize: fs(11),
    ...TYPOGRAPHY.bold,
  },
  inlineCategoryPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: ws(10),
    paddingVertical: hs(4),
    borderRadius: fs(8),
    marginBottom: hs(8),
  },
  inlineCategoryPillText: {
    color: Colors.primaryColor,
    fontSize: fs(11),
    ...TYPOGRAPHY.bold,
  },
  cardBody: {
    padding: ws(16),
  },
  blogTitle: {
    fontSize: fs(16),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
    lineHeight: fs(22),
    marginBottom: hs(6),
  },
  blogExcerpt: {
    fontSize: fs(12),
    ...TYPOGRAPHY.regular,
    color: Colors.secondaryFontColor,
    lineHeight: fs(18),
    marginBottom: hs(10),
  },
  cardTagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: ws(6),
    marginBottom: hs(12),
  },
  cardTagPill: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: ws(8),
    paddingVertical: hs(2),
    borderRadius: fs(6),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardTagText: {
    fontSize: fs(10),
    ...TYPOGRAPHY.medium,
    color: Colors.secondaryFontColor,
  },
  moreTagsText: {
    fontSize: fs(10),
    color: Colors.secondaryFontColor,
    ...TYPOGRAPHY.regular,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: hs(10),
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: ws(8),
  },
  authorAvatar: {
    width: ws(24),
    height: hs(24),
    borderRadius: fs(12),
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: ws(6),
  },
  authorName: {
    fontSize: fs(11),
    ...TYPOGRAPHY.medium,
    color: Colors.primaryFontColor,
  },
  metaRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(8),
  },
  commentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(3),
  },
  commentText: {
    fontSize: fs(11),
    ...TYPOGRAPHY.medium,
    color: Colors.secondaryFontColor,
  },
  dateText: {
    fontSize: fs(11),
    ...TYPOGRAPHY.regular,
    color: Colors.secondaryFontColor,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: hs(20),
  },
  clearFiltersBtn: {
    marginTop: hs(12),
    paddingHorizontal: ws(16),
    paddingVertical: hs(8),
    borderRadius: fs(10),
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: Colors.primaryColor,
  },
  clearFiltersBtnText: {
    fontSize: fs(12),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryColor,
  },
});
