import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Linking, NativeModules, Platform } from 'react-native';
import { showToast } from './doctorUtils';

const SAF_KEY = '@elderly_download_saf_dir';

export const getMimeType = (ext: string): string => {
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

export async function saveLocalFileToDownloads(
  localUri: string,
  fileName: string,
  mimeType: string = 'application/pdf'
): Promise<{ success: boolean; uri?: string; fileName?: string }> {
  if (Platform.OS === 'android') {
    const { DownloadHelperModule } = NativeModules;
    if (DownloadHelperModule && typeof DownloadHelperModule.saveBase64ToDownloads === 'function') {
      try {
        const base64Data = await FileSystem.readAsStringAsync(localUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const result = await DownloadHelperModule.saveBase64ToDownloads(
          fileName,
          mimeType,
          base64Data
        );
        return { success: true, uri: result?.uri || localUri, fileName };
      } catch (nativeErr) {
        console.warn('Native DownloadHelperModule error:', nativeErr);
      }
    }

    try {
      const base64Data = await FileSystem.readAsStringAsync(localUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      let dirUri = await AsyncStorage.getItem(SAF_KEY);
      if (!dirUri) {
        const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (permissions.granted) {
          dirUri = permissions.directoryUri;
          await AsyncStorage.setItem(SAF_KEY, dirUri);
        }
      }

      if (dirUri) {
        const createdUri = await FileSystem.StorageAccessFramework.createFileAsync(
          dirUri,
          fileName,
          mimeType
        );
        await FileSystem.writeAsStringAsync(createdUri, base64Data, {
          encoding: FileSystem.EncodingType.Base64,
        });
        return { success: true, uri: createdUri, fileName };
      }
    } catch (safErr) {
      console.warn('SAF save error:', safErr);
    }

    return { success: false, fileName };
  } else {
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(localUri, {
        mimeType,
        dialogTitle: `Save ${fileName}`,
        UTI: mimeType === 'application/pdf' ? 'com.adobe.pdf' : undefined,
      });
      return { success: true, uri: localUri, fileName };
    }
    return { success: false, uri: localUri, fileName };
  }
}

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
    const mimeType = getMimeType(ext);
    const downloadFileName = sanitizedName.endsWith(`.${ext}`) ? sanitizedName : `${sanitizedName}.${ext}`;
    const tempUri = `${FileSystem.cacheDirectory}${downloadFileName}`;

    const result = await FileSystem.downloadAsync(fileUrl, tempUri);

    if (result.status >= 200 && result.status < 300) {
      const saveRes = await saveLocalFileToDownloads(result.uri, downloadFileName, mimeType);
      if (saveRes.success) {
        showToast('File downloaded to Downloads folder');
      } else {
        await Linking.openURL(fileUrl);
      }
    } else {
      await Linking.openURL(fileUrl);
    }
  } catch (error: any) {
    console.warn('File download error:', error);
    if (fileUrl.startsWith('http')) {
      Linking.openURL(fileUrl).catch(() => {
        showToast('Could not download or open file');
      });
    } else {
      showToast('Could not download or open file');
    }
  }
};
