import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootStackParamList } from '../../navigation/types';
import {
  useGetBlogCategoriesQuery,
  useGetBlogsQuery,
  useGetBlogTagsQuery,
  type BlogCategoryModel,
  type BlogModel,
} from '../../redux/apis/blogApi';

export const useBlogList = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

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

  const formatTagLabel = (rawTag: string) => {
    const clean = String(rawTag || '').trim();
    if (!clean) return '';
    if (clean.toLowerCase() === 'surgey') return 'Surgery';
    return clean.charAt(0).toUpperCase() + clean.slice(1);
  };

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

  return {
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
  };
};
