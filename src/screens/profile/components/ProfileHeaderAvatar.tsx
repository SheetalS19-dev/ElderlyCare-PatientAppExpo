import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../../../constants';
import { getImageUrl } from '../../../utils';
import { fs, hs, ws } from '../../../utils/metrics';
import { TYPOGRAPHY } from '../../../utils/typography';

interface Props {
  selectedImageUri: string | null;
  remoteImage: string;
  isUploadingPhoto: boolean;
  onOpenImagePicker: () => void;
  fullName: string;
  email: string;
}

export const ProfileHeaderAvatar: React.FC<Props> = ({
  selectedImageUri,
  remoteImage,
  isUploadingPhoto,
  onOpenImagePicker,
  fullName,
  email,
}) => {
  const avatarSource = selectedImageUri
    ? { uri: selectedImageUri }
    : remoteImage
    ? { uri: getImageUrl(remoteImage) }
    : null;

  return (
    <View style={styles.headerCard}>
      <View style={styles.avatarWrapper}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onOpenImagePicker}
          disabled={isUploadingPhoto}
          style={styles.avatarTouch}
        >
          {avatarSource ? (
            <Image source={avatarSource} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <MaterialIcons name="person" size={ws(48)} color="#94A3B8" />
            </View>
          )}

          {isUploadingPhoto ? (
            <View style={styles.uploadOverlay}>
              <ActivityIndicator size="small" color={Colors.white} />
            </View>
          ) : (
            <View style={styles.cameraIconBadge}>
              <MaterialIcons name="camera-alt" size={ws(16)} color={Colors.white} />
            </View>
          )}
        </TouchableOpacity>
      </View>

      <Text style={styles.profileName}>{fullName || 'Patient Name'}</Text>
      {!!email && <Text style={styles.profileEmail}>{email}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  headerCard: {
    backgroundColor: Colors.white,
    borderRadius: ws(20),
    padding: ws(20),
    alignItems: 'center',
    marginBottom: hs(16),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: hs(2) },
    shadowOpacity: 0.04,
    shadowRadius: ws(6),
    elevation: 2,
  },
  avatarWrapper: {
    marginBottom: hs(12),
  },
  avatarTouch: {
    position: 'relative',
  },
  avatarImage: {
    width: ws(96),
    height: ws(96),
    aspectRatio: 1,
    borderRadius: 999,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: Colors.primaryColor,
  },
  avatarPlaceholder: {
    width: ws(96),
    height: ws(96),
    aspectRatio: 1,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#CBD5E1',
  },
  uploadOverlay: {
    ...StyleSheet.absoluteFill,
    aspectRatio: 1,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIconBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.primaryColor,
    width: ws(30),
    height: ws(30),
    aspectRatio: 1,
    borderRadius: 999,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  profileName: {
    fontSize: fs(18),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
    marginBottom: hs(2),
  },
  profileEmail: {
    fontSize: fs(12),
    ...TYPOGRAPHY.regular,
    color: Colors.secondaryFontColor,
  },
});
