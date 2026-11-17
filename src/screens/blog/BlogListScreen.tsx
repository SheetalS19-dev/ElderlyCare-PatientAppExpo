import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import {
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  AppCard,
  AppHeader,
  EmptyState,
  ErrorState,
  LoadingIndicator,
  SearchBox,
} from '../../components';
import { Colors } from '../../constants';
import type { BlogModel } from '../../redux/apis/blogApi';
import { DateTimeUtils, fs, getImageUrl, hs, TYPOGRAPHY, ws } from '../../utils';
import { useBlogList } from './useBlogList';

export const BlogListScreen: React.FC = () => {
  const {
    navigation,
    insets,
    selectedCategory,
    setSelectedCategory,
    selectedTag,
    setSelectedTag,
    searchQuery,
    setSearchQuery,
    categories,
    dynamicTags,
    filteredBlogs,
    rawBlogs,
    categoryMap,
    isBlogsLoading,
    isBlogsFetching,
    isBlogsError,
    handleRefresh,
    clearFilters,
    formatTagLabel,
    stripHtml,
  } = useBlogList();

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
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Math.max(insets.bottom + hs(20), hs(32)) },
          ]}
          onRefresh={handleRefresh}
          refreshing={isBlogsFetching}
          ListHeaderComponent={
            <>
              {/* Search Bar */}
              <SearchBox
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search health articles, topics..."
                containerStyle={styles.searchContainer}
              />

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
                            #{formatTagLabel(tag)}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </>
              )}

              {/* Filter feedback info */}
              <View style={styles.articlesHeaderRow}>
                <Text style={styles.articlesHeaderTitle} numberOfLines={1}>
                  {selectedCategory != null
                    ? `Category: ${categoryMap.get(String(selectedCategory)) || 'Health Care'}`
                    : selectedTag != null
                      ? `Tagged: ${formatTagLabel(selectedTag)}`
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
                            <Text style={styles.cardTagText}>#{formatTagLabel(tag)}</Text>
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

                      {!!item.created_at && (
                        <View style={styles.dateRow}>
                          <MaterialIcons name="access-time" size={fs(12)} color={Colors.secondaryFontColor} />
                          <Text style={styles.dateText}>
                            {DateTimeUtils.getDataFormat(item.created_at)}
                          </Text>
                        </View>
                      )}
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
    paddingHorizontal: ws(16),
    paddingTop: hs(12),
  },
  searchContainer: {
    marginBottom: hs(12),
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: hs(4),
    marginBottom: hs(8),
  },
  sectionTitle: {
    fontSize: fs(13),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  clearLink: {
    fontSize: fs(12),
    ...TYPOGRAPHY.medium,
    color: Colors.primaryColor,
  },
  chipsScrollContainer: {
    gap: ws(8),
    paddingBottom: hs(10),
  },
  categoryChip: {
    backgroundColor: Colors.white,
    paddingHorizontal: ws(14),
    paddingVertical: hs(7),
    borderRadius: fs(14),
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryChipActive: {
    backgroundColor: Colors.primaryColor,
    borderColor: Colors.primaryColor,
  },
  categoryChipText: {
    fontSize: fs(12),
    ...TYPOGRAPHY.medium,
    color: Colors.secondaryFontColor,
  },
  categoryChipTextActive: {
    color: Colors.white,
    ...TYPOGRAPHY.bold,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.aquaSoft,
    paddingHorizontal: ws(12),
    paddingVertical: hs(6),
    borderRadius: fs(12),
    borderWidth: 1,
    borderColor: Colors.aqua,
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
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: hs(10),
    marginBottom: hs(12),
    paddingHorizontal: ws(2),
  },
  articlesHeaderTitle: {
    flex: 1,
    fontSize: fs(14),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
    marginRight: ws(8),
  },
  articlesCountBadge: {
    fontSize: fs(11),
    ...TYPOGRAPHY.medium,
    color: Colors.secondaryFontColor,
    backgroundColor: Colors.white,
    paddingHorizontal: ws(8),
    paddingVertical: hs(2),
    borderRadius: fs(8),
    borderWidth: 1,
    borderColor: Colors.border,
  },
  blogCard: {
    backgroundColor: Colors.white,
    borderRadius: fs(16),
    overflow: 'hidden',
    marginBottom: hs(14),
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 0,
    elevation: 2,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  imageContainer: {
    width: '100%',
    height: hs(160),
    position: 'relative',
    backgroundColor: Colors.slate_F1F5F9,
  },
  featuredImage: {
    width: '100%',
    height: '100%',
  },
  categoryPill: {
    position: 'absolute',
    bottom: hs(10),
    left: ws(12),
    backgroundColor: Colors.primaryColor,
    paddingHorizontal: ws(10),
    paddingVertical: hs(4),
    borderRadius: fs(8),
  },
  categoryPillText: {
    color: Colors.white,
    fontSize: fs(10),
    ...TYPOGRAPHY.bold,
    textTransform: 'uppercase',
  },
  cardBody: {
    padding: ws(14),
  },
  inlineCategoryPill: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.aquaSoft,
    paddingHorizontal: ws(8),
    paddingVertical: hs(3),
    borderRadius: fs(6),
    marginBottom: hs(8),
  },
  inlineCategoryPillText: {
    color: Colors.primaryColor,
    fontSize: fs(10),
    ...TYPOGRAPHY.bold,
    textTransform: 'uppercase',
  },
  blogTitle: {
    fontSize: fs(15),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
    lineHeight: fs(21),
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
    flexWrap: 'wrap',
    gap: ws(6),
    marginBottom: hs(10),
    alignItems: 'center',
  },
  cardTagPill: {
    backgroundColor: Colors.bgColor,
    paddingHorizontal: ws(8),
    paddingVertical: hs(2),
    borderRadius: fs(6),
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardTagText: {
    fontSize: fs(10),
    ...TYPOGRAPHY.medium,
    color: Colors.secondaryFontColor,
  },
  moreTagsText: {
    fontSize: fs(10),
    ...TYPOGRAPHY.medium,
    color: Colors.slate_94A3B8,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: hs(10),
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: ws(8),
  },
  authorAvatar: {
    width: ws(24),
    height: ws(24),
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: Colors.aquaSoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: ws(6),
  },
  authorName: {
    fontSize: fs(11),
    ...TYPOGRAPHY.semiBold,
    color: Colors.primaryFontColor,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(4),
  },
  dateText: {
    fontSize: fs(10),
    ...TYPOGRAPHY.regular,
    color: Colors.secondaryFontColor,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: hs(40),
  },
  clearFiltersBtn: {
    marginTop: hs(14),
    backgroundColor: Colors.primaryColor,
    paddingHorizontal: ws(18),
    paddingVertical: hs(10),
    borderRadius: fs(10),
  },
  clearFiltersBtnText: {
    color: Colors.white,
    fontSize: fs(12),
    ...TYPOGRAPHY.bold,
  },
});
