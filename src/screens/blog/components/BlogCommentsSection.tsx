import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../../../constants';
import { fs, hs, ws } from '../../../utils/metrics';
import { TYPOGRAPHY } from '../../../utils/typography';

export interface CommentItem {
  id: string;
  author: string;
  text: string;
  date: string;
}

interface Props {
  comments: CommentItem[];
  commentText: string;
  onChangeCommentText: (text: string) => void;
  onSubmitComment: () => void;
  isPosting: boolean;
}

export const BlogCommentsSection: React.FC<Props> = ({
  comments,
  commentText,
  onChangeCommentText,
  onSubmitComment,
  isPosting,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Comments ({comments.length})</Text>

      {/* Input box */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={commentText}
          onChangeText={onChangeCommentText}
          placeholder="Write a comment..."
          placeholderTextColor="#94A3B8"
          multiline
        />
        <TouchableOpacity
          style={[styles.sendBtn, !commentText.trim() && styles.sendBtnDisabled]}
          activeOpacity={0.8}
          onPress={onSubmitComment}
          disabled={!commentText.trim() || isPosting}
        >
          {isPosting ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <MaterialIcons name="send" size={ws(18)} color={Colors.white} />
          )}
        </TouchableOpacity>
      </View>

      {/* Comments List */}
      <View style={styles.commentsList}>
        {comments.map((comment) => (
          <View key={comment.id} style={styles.commentItem}>
            <View style={styles.avatarCircle}>
              <MaterialIcons name="person" size={ws(18)} color={Colors.primaryColor} />
            </View>
            <View style={styles.commentContent}>
              <View style={styles.commentHeader}>
                <Text style={styles.commentAuthor}>{comment.author}</Text>
                <Text style={styles.commentDate}>{comment.date}</Text>
              </View>
              <Text style={styles.commentText}>{comment.text}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: hs(16),
    paddingTop: hs(16),
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  sectionTitle: {
    fontSize: fs(15),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
    marginBottom: hs(12),
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: ws(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingLeft: ws(12),
    paddingRight: ws(6),
    paddingVertical: hs(4),
    marginBottom: hs(16),
  },
  textInput: {
    flex: 1,
    fontSize: fs(13),
    ...TYPOGRAPHY.regular,
    color: Colors.primaryFontColor,
    maxHeight: hs(80),
  },
  sendBtn: {
    width: ws(36),
    height: ws(36),
    borderRadius: ws(18),
    backgroundColor: Colors.primaryColor,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
  commentsList: {
    gap: hs(12),
  },
  commentItem: {
    flexDirection: 'row',
    gap: ws(10),
    backgroundColor: Colors.white,
    borderRadius: ws(12),
    padding: ws(12),
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  avatarCircle: {
    width: ws(32),
    height: ws(32),
    borderRadius: ws(16),
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hs(4),
  },
  commentAuthor: {
    fontSize: fs(13),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
  },
  commentDate: {
    fontSize: fs(10),
    ...TYPOGRAPHY.regular,
    color: Colors.secondaryFontColor,
  },
  commentText: {
    fontSize: fs(12),
    ...TYPOGRAPHY.regular,
    color: Colors.secondaryFontColor,
    lineHeight: fs(18),
  },
});
