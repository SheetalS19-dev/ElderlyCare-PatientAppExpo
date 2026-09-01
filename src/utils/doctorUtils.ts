import { ToastAndroid, Alert, Platform } from 'react-native';
import { ApiEndpoints } from '../constants';

/**
 * Safely format doctor name ensuring "Dr. " prefix is added exactly once.
 * Prevents double prefix like "Dr. Dr. Name".
 */
export const formatDoctorName = (fName?: string, lName?: string): string => {
  const first = (fName ?? '').trim();
  const last = (lName ?? '').trim();
  let full = `${first} ${last}`.trim();

  if (!full) return 'Doctor';

  // Strip any combination of leading "dr", "dr.", "dr ", "dr. " (case insensitive, repeated)
  full = full.replace(/^(dr\.?\s*)+/i, '').trim();

  if (!full) return 'Doctor';

  return `Dr. ${full}`;
};

export const showToast = (message: string) => {
  if (!message) return;
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    Alert.alert('', message);
  }
};

export const getImageUrl = (path?: string) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const cleanPath = path.replace(/^\//, '');
  if (cleanPath.startsWith('api/public/storage/')) {
    return `${ApiEndpoints.webApiUrl}/${cleanPath}`;
  }
  if (cleanPath.startsWith('public/storage/')) {
    return `${ApiEndpoints.webApiUrl}/api/${cleanPath}`;
  }
  if (cleanPath.startsWith('storage/')) {
    return `${ApiEndpoints.webApiUrl}/api/public/${cleanPath}`;
  }
  return `${ApiEndpoints.imageUrl}/${cleanPath}`;
};
