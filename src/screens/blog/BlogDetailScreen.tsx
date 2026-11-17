import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { AppHeader, ErrorState, LoadingIndicator } from '../../components';
import { Colors } from '../../constants';
import { DateTimeUtils, fs, getImageUrl, hs, TYPOGRAPHY, ws } from '../../utils';
import { useBlogDetail } from './useBlogDetail';

export const BlogDetailScreen: React.FC = () => {
  const {
    navigation,
    insets,
    blog,
    isLoading,
    isError,
    refetch,
    commentName,
    setCommentName,
    commentEmail,
    setCommentEmail,
    commentText,
    setCommentText,
    allComments,
    isLoadingComments,
    isPostingComment,
    isDescExpanded,
    setIsDescExpanded,
    handleShare,
    handleSendComment,
    stripHtml,
  } = useBlogDetail();

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
            { paddingBottom: Math.max(insets.bottom + hs(24), hs(32)) },
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
                <MaterialIcons name="person" size={fs(16)} color={Colors.primaryColor} />
              </View>
              <View>
                <Text style={styles.authorName}>{blog.author_name || 'Medical Specialist'}</Text>
                <Text style={styles.dateText}>{DateTimeUtils.getDataFormat(blog.created_at)}</Text>
              </View>
            </View>

            <TouchableOpacity onPress={handleShare} style={styles.shareBtn} activeOpacity={0.7}>
              <Ionicons name="share-social-outline" size={fs(20)} color={Colors.primaryColor} />
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
            <Text style={styles.bodyText}>
              {isDescExpanded || cleanDescription.length <= 320
                ? cleanDescription
                : `${cleanDescription.slice(0, 320)}...`}
            </Text>
            {cleanDescription.length > 320 && (
              <TouchableOpacity
                onPress={() => setIsDescExpanded((prev) => !prev)}
                style={styles.readMoreBtn}
                activeOpacity={0.7}
              >
                <Text style={styles.readMoreText}>
                  {isDescExpanded ? 'Read Less' : 'Read More >'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Care Helpline Callout Box */}
          <View style={styles.careCallout}>
            <View style={styles.careCalloutHeader}>
              <MaterialIcons name="health-and-safety" size={fs(24)} color={Colors.primaryColor} />
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
              <ActivityIndicator size="small" color={Colors.primaryColor} style={{ marginVertical: hs(12) }} />
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
              Your email address will not be published. Required fields are marked as <Text style={{ color: Colors.red_EF4444 }}>*</Text>.
            </Text>

            <View style={styles.inputRow}>
              <View style={styles.inputFieldContainer}>
                <Text style={styles.fieldLabel}>
                  Name <Text style={{ color: Colors.red_EF4444 }}>*</Text>
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
                  Email <Text style={{ color: Colors.red_EF4444 }}>*</Text>
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
                Comment <Text style={{ color: Colors.red_EF4444 }}>*</Text>
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
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <View style={styles.btnRow}>
                  <Text style={styles.postCommentBtnText}>Post a comment</Text>
                  <MaterialIcons name="arrow-forward" size={fs(16)} color={Colors.white} />
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
    padding: ws(16),
    paddingBottom: hs(24),
  },
  bannerContainer: {
    width: '100%',
    height: hs(220),
    borderRadius: fs(18),
    overflow: 'hidden',
    marginBottom: hs(16),
    position: 'relative',
    backgroundColor: Colors.slate_F1F5F9,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  categoryPill: {
    position: 'absolute',
    bottom: hs(12),
    left: ws(12),
    backgroundColor: Colors.primaryColor,
    paddingHorizontal: ws(12),
    paddingVertical: hs(5),
    borderRadius: fs(8),
  },
  categoryPillText: {
    color: Colors.white,
    fontSize: fs(11),
    ...TYPOGRAPHY.bold,
    textTransform: 'uppercase',
  },
  inlineCategoryPill: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.aquaSoft,
    paddingHorizontal: ws(10),
    paddingVertical: hs(4),
    borderRadius: fs(6),
    marginBottom: hs(10),
  },
  inlineCategoryPillText: {
    color: Colors.primaryColor,
    fontSize: fs(11),
    ...TYPOGRAPHY.bold,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: fs(20),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
    lineHeight: fs(28),
    marginBottom: hs(12),
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: hs(14),
    marginBottom: hs(12),
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  authorGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(10),
  },
  authorAvatar: {
    width: ws(36),
    height: ws(36),
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: Colors.aquaSoft,
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
    marginTop: hs(2),
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: ws(12),
    paddingVertical: hs(7),
    borderRadius: fs(20),
    borderWidth: 1,
    borderColor: Colors.border,
    gap: ws(4),
  },
  shareBtnText: {
    fontSize: fs(12),
    ...TYPOGRAPHY.medium,
    color: Colors.primaryColor,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ws(6),
    marginBottom: hs(14),
  },
  tagPill: {
    backgroundColor: Colors.white,
    paddingHorizontal: ws(10),
    paddingVertical: hs(5),
    borderRadius: fs(12),
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tagText: {
    fontSize: fs(11),
    ...TYPOGRAPHY.medium,
    color: Colors.secondaryFontColor,
  },
  bodyCard: {
    backgroundColor: Colors.white,
    borderRadius: fs(16),
    padding: ws(16),
    marginBottom: hs(16),
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bodyText: {
    fontSize: fs(14),
    ...TYPOGRAPHY.regular,
    color: Colors.primaryFontColor,
    lineHeight: fs(22),
  },
  readMoreBtn: {
    alignSelf: 'flex-start',
    marginTop: hs(10),
    paddingVertical: hs(4),
  },
  readMoreText: {
    fontSize: fs(13),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryColor,
  },
  careCallout: {
    backgroundColor: Colors.aquaSoft,
    borderRadius: fs(16),
    padding: ws(16),
    marginBottom: hs(20),
    borderWidth: 1,
    borderColor: Colors.aqua,
  },
  careCalloutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(8),
    marginBottom: hs(6),
  },
  careCalloutTitle: {
    fontSize: fs(13),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryColor,
  },
  careCalloutBody: {
    fontSize: fs(12),
    ...TYPOGRAPHY.regular,
    color: Colors.secondaryFontColor,
    lineHeight: fs(18),
  },
  commentsSection: {
    backgroundColor: Colors.white,
    borderRadius: fs(16),
    padding: ws(16),
    marginBottom: hs(16),
    borderWidth: 1,
    borderColor: Colors.border,
  },
  commentsHeaderTitle: {
    fontSize: fs(15),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
    marginBottom: hs(12),
  },
  noCommentsText: {
    fontSize: fs(12),
    ...TYPOGRAPHY.regular,
    color: Colors.secondaryFontColor,
    textAlign: 'center',
    paddingVertical: hs(12),
  },
  commentItem: {
    paddingVertical: hs(10),
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hs(4),
  },
  commentUserAvatar: {
    width: ws(28),
    height: ws(28),
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: Colors.primaryColor,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: ws(8),
  },
  commentUserInitial: {
    color: Colors.white,
    fontSize: fs(12),
    ...TYPOGRAPHY.bold,
  },
  commentUserMeta: {
    flex: 1,
  },
  commentAuthor: {
    fontSize: fs(12),
    ...TYPOGRAPHY.semiBold,
    color: Colors.primaryFontColor,
  },
  commentDate: {
    fontSize: fs(10),
    ...TYPOGRAPHY.regular,
    color: Colors.secondaryFontColor,
  },
  commentBody: {
    fontSize: fs(12),
    ...TYPOGRAPHY.regular,
    color: Colors.primaryFontColor,
    lineHeight: fs(18),
  },
  leaveCommentCard: {
    backgroundColor: Colors.white,
    borderRadius: fs(16),
    padding: ws(16),
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: hs(16),
  },
  leaveCommentTitle: {
    fontSize: fs(15),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
    marginBottom: hs(4),
  },
  leaveCommentSubtitle: {
    fontSize: fs(11),
    ...TYPOGRAPHY.regular,
    color: Colors.secondaryFontColor,
    lineHeight: fs(16),
    marginBottom: hs(14),
  },
  inputRow: {
    gap: hs(12),
    marginBottom: hs(12),
  },
  inputFieldContainer: {
    marginBottom: hs(12),
  },
  fieldLabel: {
    fontSize: fs(12),
    ...TYPOGRAPHY.medium,
    color: Colors.primaryFontColor,
    marginBottom: hs(6),
  },
  formInput: {
    backgroundColor: Colors.bgColor,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: fs(10),
    paddingHorizontal: ws(12),
    paddingVertical: hs(10),
    fontSize: fs(12),
    ...TYPOGRAPHY.regular,
    color: Colors.primaryFontColor,
  },
  commentTextArea: {
    minHeight: hs(80),
    paddingTop: hs(10),
  },
  postCommentBtn: {
    backgroundColor: Colors.primaryColor,
    borderRadius: fs(12),
    paddingVertical: hs(12),
    paddingHorizontal: ws(16),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: hs(4),
  },
  postCommentBtnDisabled: {
    opacity: 0.5,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(8),
  },
  postCommentBtnText: {
    color: Colors.white,
    fontSize: fs(13),
    ...TYPOGRAPHY.bold,
  },
});
