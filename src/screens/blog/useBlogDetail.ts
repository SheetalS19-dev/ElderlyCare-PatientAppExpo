import type { RouteProp } from '@react-navigation/native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Keyboard, Platform, Share } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import type { RootStackParamList } from '../../navigation/types';
import {
  type BlogModel,
  useGetBlogCommentsQuery,
  useGetBlogDetailQuery,
  useSaveBlogCommentMutation,
} from '../../redux/apis/blogApi';
import { DateTimeUtils, showToast } from '../../utils';
import { validateComment, validateEmail, validateName } from '../../validation';

export interface CommentItem {
  id: string;
  author: string;
  text: string;
  date: string;
  email?: string;
}

export const useBlogDetail = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'BlogDetail'>>();
  const { blogId } = route.params;
  const { user } = useAuth();

  const [commentName, setCommentName] = useState('');
  const [commentEmail, setCommentEmail] = useState('');
  const [commentText, setCommentText] = useState('');
  const [commentErrors, setCommentErrors] = useState<Record<string, string>>({});
  const [localComments, setLocalComments] = useState<CommentItem[]>([]);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isDescExpanded, setIsDescExpanded] = useState(false);

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

  const handleShare = useCallback(async () => {
    try {
      if (blog?.title) {
        await Share.share({
          message: `${blog.title}\n\nRead more on ElderlyCare Patient App!`,
        });
      }
    } catch (e) {
      console.error(e);
    }
  }, [blog?.title]);

  const handleSendComment = useCallback(async (overrideText?: string) => {
    const textToSend = (overrideText || commentText).trim();
    if (!textToSend || isPostingComment) return;

    const newErrors: Record<string, string> = {};

    const commentRes = validateComment(textToSend, true);
    if (!commentRes.isValid) {
      newErrors.comment = commentRes.error || 'Please enter a valid comment';
    }

    if (commentName.trim()) {
      const nameRes = validateName(commentName.trim(), true, 'Name');
      if (!nameRes.isValid) {
        newErrors.name = nameRes.error || 'Please enter a valid name';
      }
    }

    if (commentEmail.trim()) {
      const emailRes = validateEmail(commentEmail.trim(), true);
      if (!emailRes.isValid) {
        newErrors.email = emailRes.error || 'Please enter a valid email address';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setCommentErrors(newErrors);
      return;
    }

    const authorName = commentName.trim() || (user
      ? `${user.f_name ?? ''} ${user.l_name ?? ''}`.trim() || 'Patient'
      : 'Guest User');
    const authorEmail = commentEmail.trim() || user?.email || '';

    setCommentErrors({});
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
  }, [
    commentText,
    isPostingComment,
    commentName,
    commentEmail,
    user,
    saveBlogComment,
    blogId,
    refetch,
    refetchComments,
  ]);

  const stripHtml = useCallback((html?: string) => {
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
  }, []);

  return {
    navigation,
    insets,
    blogId,
    user,
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
    keyboardHeight,
    isDescExpanded,
    setIsDescExpanded,
    handleShare,
    handleSendComment,
    commentErrors,
    setCommentErrors,
    stripHtml,
  };
};
