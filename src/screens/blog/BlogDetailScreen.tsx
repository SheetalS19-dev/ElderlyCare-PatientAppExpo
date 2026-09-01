import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import {
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader, ErrorState, LoadingIndicator } from '../../components';
import { Colors, Typography } from '../../constants';
import type { RootStackParamList } from '../../navigation/types';
import { type BlogModel, useGetBlogDetailQuery } from '../../redux/apis/blogApi';
import { DateTimeUtils, getImageUrl, showToast } from '../../utils';

type Props = NativeStackScreenProps<RootStackParamList, 'BlogDetail'>;

interface CommentItem {
  id: string;
  author: string;
  text: string;
  date: string;
}

export const BlogDetailScreen = ({ route, navigation }: Props) => {
  const { blogId } = route.params;
  const insets = useSafeAreaInsets();
  const [commentText, setCommentText] = useState('');
  const [localComments, setLocalComments] = useState<CommentItem[]>([]);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates?.height ?? 0);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const { data: blogData, isLoading, isError, refetch } = useGetBlogDetailQuery(blogId);
  const blog: BlogModel | null = blogData?.data ?? blogData ?? null;

  const handleShare = async () => {
    try {
      if (blog?.title) {
        await Share.share({
          message: `${blog.title}\n\nRead more on ElderlyCare Patient App!`,
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendComment = () => {
    if (!commentText.trim()) return;
    const newComment: CommentItem = {
      id: `c-${Date.now()}`,
      author: 'You',
      text: commentText.trim(),
      date: 'Just now',
    };
    setLocalComments((prev) => [newComment, ...prev]);
    showToast('Comment posted successfully!');
    setCommentText('');
    Keyboard.dismiss();
  };

  const stripHtml = (html?: string) => {
    if (!html) return '';
    return html
      .replace(/<br\s*[\/]?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<\/h[1-6]>/gi, '\n\n')
      .replace(/<[^>]*>?/gm, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <AppHeader title="Blog Details" onBackPress={() => navigation.goBack()} />
        <LoadingIndicator />
      </View>
    );
  }

  if (isError || !blog) {
    return (
      <View style={styles.container}>
        <AppHeader title="Blog Details" onBackPress={() => navigation.goBack()} />
        <ErrorState message="Couldn't load article details" onRetry={refetch} />
      </View>
    );
  }

  const cleanDescription = stripHtml(blog.description);
  const blogTags = blog.tags
    ? blog.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
    : [];

  return (
    <View style={styles.container}>
      <AppHeader title="Blog Details" onBackPress={() => navigation.goBack()} />

      <KeyboardAvoidingView
        style={styles.flexOne}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.flexOne}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom + 80, 100) },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Featured Image */}
          {!!blog.featured_image && (
            <View style={styles.bannerContainer}>
              <Image
                source={{ uri: getImageUrl(blog.featured_image) }}
                style={styles.bannerImage}
                resizeMode="cover"
              />
              {!!blog.category_name && (
                <View style={styles.categoryPill}>
                  <Text style={styles.categoryPillText}>{blog.category_name}</Text>
                </View>
              )}
            </View>
          )}

          {/* Category Pill (if no image) */}
          {!blog.featured_image && !!blog.category_name && (
            <View style={styles.inlineCategoryPill}>
              <Text style={styles.inlineCategoryPillText}>{blog.category_name}</Text>
            </View>
          )}

          {/* Article Title */}
          <Text style={styles.title}>{blog.title}</Text>

          {/* Author & Published Info Row */}
          <View style={styles.metaRow}>
            <View style={styles.authorGroup}>
              <View style={styles.authorAvatar}>
                <MaterialIcons name="person" size={16} color={Colors.primaryColor} />
              </View>
              <View>
                <Text style={styles.authorName}>{blog.author_name || 'Medical Specialist'}</Text>
                <Text style={styles.dateText}>{DateTimeUtils.getDataFormat(blog.created_at)}</Text>
              </View>
            </View>

            <TouchableOpacity onPress={handleShare} style={styles.shareBtn} activeOpacity={0.7}>
              <Ionicons name="share-social-outline" size={20} color={Colors.primaryColor} />
              <Text style={styles.shareBtnText}>Share</Text>
            </TouchableOpacity>
          </View>

          {/* Tags list */}
          {blogTags.length > 0 && (
            <View style={styles.tagsContainer}>
              {blogTags.map((tag, idx) => (
                <View key={`detail-tag-${idx}`} style={styles.tagPill}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Main Article Content */}
          <View style={styles.bodyCard}>
            <Text style={styles.bodyText}>{cleanDescription}</Text>
          </View>

          {/* Care Helpline Callout Box */}
          <View style={styles.careCallout}>
            <View style={styles.careCalloutHeader}>
              <MaterialIcons name="health-and-safety" size={24} color={Colors.primaryColor} />
              <Text style={styles.careCalloutTitle}>Need Personal Medical Advice?</Text>
            </View>
            <Text style={styles.careCalloutBody}>
              This article is for informational purposes. For personal health concerns, consult with one of our certified specialist doctors.
            </Text>
          </View>

          {/* Comments Section */}
          <View style={styles.commentsSection}>
            <Text style={styles.commentsHeaderTitle}>
              Comments ({Number(blog.comment_count ?? 0) + localComments.length})
            </Text>

            {localComments.map((c) => (
              <View key={c.id} style={styles.commentItem}>
                <View style={styles.commentHeader}>
                  <View style={styles.commentUserAvatar}>
                    <Text style={styles.commentUserInitial}>
                      {c.author.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.commentUserMeta}>
                    <Text style={styles.commentAuthor}>{c.author}</Text>
                    <Text style={styles.commentDate}>{c.date}</Text>
                  </View>
                </View>
                <Text style={styles.commentBody}>{c.text}</Text>
              </View>
            ))}

            {localComments.length === 0 && Number(blog.comment_count ?? 0) === 0 && (
              <Text style={styles.noCommentsText}>
                No comments yet. Be the first to share your thoughts!
              </Text>
            )}
          </View>
        </ScrollView>

        {/* Bottom Comment Input Bar - Full clearance above mobile nav bar & keypad */}
        <View
          style={[
            styles.commentBar,
            {
              paddingBottom: keyboardHeight > 0 ? 10 : Math.max(insets.bottom + 12, 24),
            },
          ]}
        >
          <TextInput
            style={styles.commentInput}
            placeholder="Write a comment..."
            placeholderTextColor={Colors.secondaryFontColor}
            value={commentText}
            onChangeText={setCommentText}
            multiline={false}
            returnKeyType="send"
            onSubmitEditing={handleSendComment}
          />
          <TouchableOpacity
            style={[styles.sendBtn, !commentText.trim() && styles.sendBtnDisabled]}
            onPress={handleSendComment}
            activeOpacity={0.8}
            disabled={!commentText.trim()}
          >
            <MaterialIcons name="send" size={18} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgColor,
  },
  flexOne: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  bannerContainer: {
    width: '100%',
    height: 220,
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 16,
    position: 'relative',
    backgroundColor: '#F1F5F9',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  categoryPill: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: Colors.primaryColor,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  categoryPillText: {
    color: Colors.white,
    fontSize: 12,
    fontFamily: Typography.fontFamily.bold,
  },
  inlineCategoryPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF5EB',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 10,
  },
  inlineCategoryPillText: {
    color: Colors.primaryColor,
    fontSize: 12,
    fontFamily: Typography.fontFamily.bold,
  },
  title: {
    fontSize: 20,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryFontColor,
    lineHeight: 28,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    marginBottom: 14,
  },
  authorGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFF5EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  authorName: {
    fontSize: 13,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryFontColor,
  },
  dateText: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.secondaryFontColor,
    marginTop: 2,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5EB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  shareBtnText: {
    fontSize: 12,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryColor,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  tagPill: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tagText: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.secondaryFontColor,
  },
  bodyCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  bodyText: {
    fontSize: 14,
    fontFamily: Typography.fontFamily.regular,
    color: '#334155',
    lineHeight: 24,
  },
  careCallout: {
    backgroundColor: '#FFF5EB',
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primaryColor,
    marginBottom: 20,
  },
  careCalloutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  careCalloutTitle: {
    fontSize: 13,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryFontColor,
  },
  careCalloutBody: {
    fontSize: 12,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.secondaryFontColor,
    lineHeight: 18,
  },
  commentsSection: {
    marginTop: 8,
    marginBottom: 16,
  },
  commentsHeaderTitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryFontColor,
    marginBottom: 12,
  },
  commentItem: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  commentUserAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primaryColor,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  commentUserInitial: {
    color: Colors.white,
    fontSize: 12,
    fontFamily: Typography.fontFamily.bold,
  },
  commentUserMeta: {
    flex: 1,
  },
  commentAuthor: {
    fontSize: 12,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryFontColor,
  },
  commentDate: {
    fontSize: 10,
    color: Colors.secondaryFontColor,
  },
  commentBody: {
    fontSize: 12,
    fontFamily: Typography.fontFamily.regular,
    color: '#334155',
    lineHeight: 18,
  },
  noCommentsText: {
    fontSize: 12,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.secondaryFontColor,
    fontStyle: 'italic',
    paddingVertical: 8,
  },
  commentBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 10,
  },
  commentInput: {
    flex: 1,
    height: 42,
    backgroundColor: '#F8FAFC',
    borderRadius: 21,
    paddingHorizontal: 16,
    fontSize: Typography.fontSize.sm,
    color: Colors.primaryFontColor,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.primaryColor,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#CBD5E1',
  },
});
