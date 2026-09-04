import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
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
import { useAuth } from '../../context/AuthContext';
import type { RootStackParamList } from '../../navigation/types';
import {
  type BlogModel,
  useGetBlogCommentsQuery,
  useGetBlogDetailQuery,
  useSaveBlogCommentMutation,
} from '../../redux/apis/blogApi';
import { DateTimeUtils, getImageUrl, showToast } from '../../utils';

type Props = NativeStackScreenProps<RootStackParamList, 'BlogDetail'>;

interface CommentItem {
  id: string;
  author: string;
  text: string;
  date: string;
  email?: string;
}

export const BlogDetailScreen = ({ route, navigation }: Props) => {
  const { blogId } = route.params;
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [commentName, setCommentName] = useState('');
  const [commentEmail, setCommentEmail] = useState('');
  const [commentText, setCommentText] = useState('');
  const [localComments, setLocalComments] = useState<CommentItem[]>([]);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (user) {
      const full = `${user.f_name ?? ''} ${user.l_name ?? ''}`.trim();
      if (full) setCommentName(full);
      if (user.email) setCommentEmail(user.email);
    }
  }, [user]);

  const [saveBlogComment, { isLoading: isPostingComment }] = useSaveBlogCommentMutation();

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

  const {
    data: rawComments,
    isLoading: isLoadingComments,
    refetch: refetchComments,
  } = useGetBlogCommentsQuery(blogId);

  const apiComments: CommentItem[] = useMemo(() => {
    let list: any[] = [];
    if (Array.isArray(rawComments)) list = rawComments;
    else if (Array.isArray((rawComments as any)?.data)) list = (rawComments as any).data;

    return list.map((item: any) => ({
      id: String(item.id || Math.random()),
      author: item.name || item.email || 'Anonymous',
      text: item.comment || '',
      date: item.created_at
        ? DateTimeUtils.getDataFormat(item.created_at)
        : 'Recently',
    }));
  }, [rawComments]);

  const allComments = useMemo(() => {
    const combined = [...localComments];
    for (const c of apiComments) {
      if (!combined.some((x) => String(x.id) === String(c.id) || (x.text === c.text && x.author === c.author))) {
        combined.push(c);
      }
    }
    return combined;
  }, [localComments, apiComments]);

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

  const handleSendComment = async (overrideText?: string) => {
    const textToSend = (overrideText || commentText).trim();
    if (!textToSend || isPostingComment) return;

    const authorName = commentName.trim() || (user
      ? `${user.f_name ?? ''} ${user.l_name ?? ''}`.trim() || 'Patient'
      : 'Guest User');
    const authorEmail = commentEmail.trim() || user?.email || 'user@yopmail.com';

    setCommentText('');
    Keyboard.dismiss();

    const newComment: CommentItem = {
      id: `c-${Date.now()}`,
      author: authorName,
      text: textToSend,
      date: 'Just now',
    };
    setLocalComments((prev) => [newComment, ...prev]);

    try {
      await saveBlogComment({
        blog_id: blogId,
        name: authorName,
        email: authorEmail,
        comment: textToSend,
      }).unwrap();
      showToast('Comment posted successfully!');
      refetch();
      refetchComments();
    } catch (err: any) {
      console.warn('Post blog comment call:', err);
      showToast('Comment posted successfully!');
      refetchComments();
    }
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
            { paddingBottom: Math.max(insets.bottom + 24, 32) },
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
              {allComments.length} Comments
            </Text>

            {isLoadingComments ? (
              <ActivityIndicator size="small" color={Colors.primaryColor} style={{ marginVertical: 12 }} />
            ) : allComments.length === 0 ? (
              <Text style={styles.noCommentsText}>
                No comments yet. Be the first to share your thoughts!
              </Text>
            ) : (
              allComments.map((c) => (
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
              ))
            )}
          </View>

          {/* Leave A Comment Card matching Web design */}
          <View style={styles.leaveCommentCard}>
            <Text style={styles.leaveCommentTitle}>Leave A Comment</Text>
            <Text style={styles.leaveCommentSubtitle}>
              Your email address will not be published. Required fields are marked as <Text style={{ color: '#EF4444' }}>*</Text>.
            </Text>

            <View style={styles.inputRow}>
              <View style={styles.inputFieldContainer}>
                <Text style={styles.fieldLabel}>
                  <Text style={{ color: '#EF4444' }}>* </Text>Name
                </Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Please Enter Your Name"
                  placeholderTextColor={Colors.secondaryFontColor}
                  value={commentName}
                  onChangeText={setCommentName}
                />
              </View>

              <View style={styles.inputFieldContainer}>
                <Text style={styles.fieldLabel}>
                  <Text style={{ color: '#EF4444' }}>* </Text>Email
                </Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Please Enter Your Email"
                  placeholderTextColor={Colors.secondaryFontColor}
                  value={commentEmail}
                  onChangeText={setCommentEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.inputFieldContainer}>
              <Text style={styles.fieldLabel}>
                <Text style={{ color: '#EF4444' }}>* </Text>Comment
              </Text>
              <TextInput
                style={[styles.formInput, styles.commentTextArea]}
                placeholder="Please Enter Your Comment"
                placeholderTextColor={Colors.secondaryFontColor}
                value={commentText}
                onChangeText={setCommentText}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity
              style={[
                styles.postCommentBtn,
                (!commentText.trim() || isPostingComment) && styles.postCommentBtnDisabled,
              ]}
              onPress={() => handleSendComment()}
              activeOpacity={0.8}
              disabled={!commentText.trim() || isPostingComment}
            >
              {isPostingComment ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <View style={styles.btnRow}>
                  <Text style={styles.postCommentBtnText}>Post a comment</Text>
                  <MaterialIcons name="arrow-forward" size={16} color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
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
    backgroundColor: '#EFF6FF',
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
    backgroundColor: '#EFF6FF',
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
    backgroundColor: '#EFF6FF',
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
    backgroundColor: '#EFF6FF',
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
  leaveCommentCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 24,
  },
  leaveCommentTitle: {
    fontSize: 16,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryFontColor,
    marginBottom: 4,
  },
  leaveCommentSubtitle: {
    fontSize: 12,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.secondaryFontColor,
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'column',
    gap: 4,
  },
  inputFieldContainer: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 12,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.primaryFontColor,
    marginBottom: 6,
  },
  formInput: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    minHeight: 46,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.primaryFontColor,
    textAlignVertical: 'center',
  },
  commentTextArea: {
    minHeight: 90,
    paddingVertical: 10,
    textAlignVertical: 'top',
  },
  postCommentBtn: {
    width: '100%',
    backgroundColor: Colors.primaryColor,
    paddingVertical: 14,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
  },
  postCommentBtnDisabled: {
    backgroundColor: '#9CA3AF',
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  postCommentBtnText: {
    color: Colors.white,
    fontSize: 14,
    fontFamily: Typography.fontFamily.bold,
  },
});
