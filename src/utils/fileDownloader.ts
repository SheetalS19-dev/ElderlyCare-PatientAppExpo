import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Linking, NativeModules, PermissionsAndroid, Platform } from 'react-native';
import { showToast } from './doctorUtils';

const SAF_KEY = '@elderly_download_saf_dir';

export async function ensureNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    const apiLevel =
      typeof Platform.Version === 'number'
        ? Platform.Version
        : parseInt(String(Platform.Version), 10);

    if (apiLevel >= 33 && PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS) {
      try {
        const hasPermission = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );
        if (!hasPermission) {
          const status = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
            {
              title: 'Download Notification Permission',
              message:
                'ElderlyCare needs notification permission so you receive notifications when files finish downloading.',
              buttonPositive: 'Allow',
              buttonNegative: 'Not Now',
            }
          );
          return status === PermissionsAndroid.RESULTS.GRANTED;
        }
        return true;
      } catch (e) {
        console.warn('Notification permission error:', e);
      }
    }
  }
  return true;
}

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

/**
 * Immediately opens a downloaded file with the system viewer / default application
 */
export async function openDownloadedFile(
  uriOrPath: string,
  mimeType: string = 'application/pdf',
  fileName?: string
): Promise<boolean> {
  try {
    if (Platform.OS === 'android') {
      const { DownloadHelperModule } = NativeModules;
      if (DownloadHelperModule && typeof DownloadHelperModule.openFile === 'function') {
        try {
          let openUri = uriOrPath;
          if (openUri.startsWith('file://')) {
            try {
              openUri = await FileSystem.getContentUriAsync(openUri);
            } catch (_) {}
          }
          await DownloadHelperModule.openFile(openUri, mimeType);
          return true;
        } catch (nativeErr) {
          console.warn('Native openFile failed, falling back to Sharing:', nativeErr);
        }
      }
    }

    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(uriOrPath, {
        mimeType,
        dialogTitle: fileName ? `Open ${fileName}` : 'Open file',
        UTI: mimeType === 'application/pdf' ? 'com.adobe.pdf' : undefined,
      });
      return true;
    }
  } catch (err) {
    console.warn('Could not open downloaded file:', err);
  }
  return false;
}

export async function saveLocalFileToDownloads(
  localUri: string,
  fileName: string,
  mimeType: string = 'application/pdf',
  openImmediately: boolean = true
): Promise<{ success: boolean; uri?: string; fileName?: string }> {
  if (Platform.OS === 'android') {
    await ensureNotificationPermission();

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
        const savedUri = result?.uri || localUri;

        if (openImmediately) {
          setTimeout(() => {
            openDownloadedFile(savedUri, mimeType, fileName).catch(() => {});
          }, 350);
        }

        return { success: true, uri: savedUri, fileName };
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

        if (DownloadHelperModule && typeof DownloadHelperModule.showDownloadNotification === 'function') {
          DownloadHelperModule.showDownloadNotification(fileName, mimeType, createdUri).catch(() => {});
        }

        if (openImmediately) {
          setTimeout(() => {
            openDownloadedFile(createdUri, mimeType, fileName).catch(() => {});
          }, 350);
        }

        return { success: true, uri: createdUri, fileName };
      }
    } catch (safErr) {
      console.warn('SAF save error:', safErr);
    }

    // Fallback: If direct Downloads save and SAF are unavailable, open system save/share dialog
    try {
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(localUri, {
          mimeType,
          dialogTitle: `Save ${fileName}`,
        });
        return { success: true, uri: localUri, fileName };
      }
    } catch (shareErr) {
      console.warn('Fallback share error:', shareErr);
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

export const downloadAndSaveFile = async (
  fileUrl: string,
  fileName?: string,
  openImmediately: boolean = true
) => {
  if (!fileUrl) {
    showToast('File URL not available');
    return;
  }

  await ensureNotificationPermission();

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
      const saveRes = await saveLocalFileToDownloads(
        result.uri,
        downloadFileName,
        mimeType,
        openImmediately
      );
      if (saveRes.success) {
        showToast('File downloaded successfully');
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
