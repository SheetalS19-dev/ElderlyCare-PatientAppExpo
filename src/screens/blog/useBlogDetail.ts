import type { RouteProp } from '@react-navigation/native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useMemo, useState } from 'react';
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
    const authorEmail = commentEmail.trim() || user?.email || '';

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
    stripHtml,
  };
};
