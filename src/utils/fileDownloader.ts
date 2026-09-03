import * as FileSystem from 'expo-file-system/legacy';
import { Linking, Platform } from 'react-native';
import { showToast } from './doctorUtils';

const getMimeType = (ext: string): string => {
  const extension = ext.toLowerCase();
  switch (extension) {
    case 'pdf':
      return 'application/pdf';
    case 'png':
      return 'image/png';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'webp':
      return 'image/webp';
    case 'gif':
      return 'image/gif';
    case 'doc':
      return 'application/msword';
    case 'docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case 'xls':
      return 'application/vnd.ms-excel';
    case 'xlsx':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    case 'txt':
      return 'text/plain';
    default:
      return 'application/octet-stream';
  }
};

export const downloadAndSaveFile = async (fileUrl: string, fileName?: string) => {
  if (!fileUrl) {
    showToast('File URL not available');
    return;
  }

  const name = fileName || 'file';
  try {
    showToast(`Downloading ${name}...`);

    const sanitizedName = name.replace(/[^a-zA-Z0-9_.-]/g, '_');
    const cleanUrl = fileUrl.split('?')[0];
    const extMatch = cleanUrl.match(/\.([a-zA-Z0-9]+)$/);
    const ext = extMatch ? extMatch[1] : 'pdf';
    const localUri = `${FileSystem.documentDirectory}${sanitizedName}_${Date.now()}.${ext}`;

    const result = await FileSystem.downloadAsync(fileUrl, localUri);

    if (result.status >= 200 && result.status < 300) {
      if (Platform.OS === 'android') {
        try {
          const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
          if (permissions.granted) {
            const base64 = await FileSystem.readAsStringAsync(result.uri, {
              encoding: FileSystem.EncodingType.Base64,
            });
            const mimeType = getMimeType(ext);
            const saveFileName = `${sanitizedName}_${Date.now()}.${ext}`;
            const newFileUri = await FileSystem.StorageAccessFramework.createFileAsync(
              permissions.directoryUri,
              saveFileName,
              mimeType,
            );
            await FileSystem.writeAsStringAsync(newFileUri, base64, {
              encoding: FileSystem.EncodingType.Base64,
            });
            await FileSystem.deleteAsync(result.uri, { idempotent: true }).catch(() => {});
            showToast('File downloaded to device storage!');
            return;
          } else {
            showToast('Download cancelled');
            await FileSystem.deleteAsync(result.uri, { idempotent: true }).catch(() => {});
            return;
          }
        } catch (safErr) {
          console.warn('StorageAccessFramework download error:', safErr);
          showToast('File saved to app storage!');
          return;
        }
      } else {
        // iOS: Saved to app documents (visible in iOS Files App under On My iPhone -> ElderlyCare Patient)
        showToast('File downloaded to device storage!');
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

