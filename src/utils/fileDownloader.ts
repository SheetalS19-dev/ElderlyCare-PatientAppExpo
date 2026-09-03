import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Linking } from 'react-native';
import { showToast } from './doctorUtils';

export const downloadAndSaveFile = async (fileUrl: string, fileName?: string) => {
  if (!fileUrl) {
    showToast('File URL not available');
    return;
  }

  const name = fileName || 'file';
  try {
    showToast(`Downloading ${name}...`);

    const sanitizedName = name.replace(/[^a-zA-Z0-9_.-]/g, '_');
    const extMatch = fileUrl.match(/\.([a-zA-Z0-9]+)(\?.*)?$/);
    const ext = extMatch ? extMatch[1] : 'pdf';
    const localUri = `${FileSystem.documentDirectory}${sanitizedName}_${Date.now()}.${ext}`;

    const result = await FileSystem.downloadAsync(fileUrl, localUri);

    if (result.status >= 200 && result.status < 300) {
      showToast('File downloaded successfully!');
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(result.uri);
      } else {
        await Linking.openURL(result.uri);
      }
    } else {
      await Linking.openURL(fileUrl);
    }
  } catch (error: any) {
    console.warn('File download error:', error);
    Linking.openURL(fileUrl).catch(() => {
      showToast('Could not download or open file');
    });
  }
};
