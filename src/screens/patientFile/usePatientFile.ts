import type { RouteProp } from '@react-navigation/native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { useMemo, useState } from 'react';
import { Linking, Platform } from 'react-native';
import { ApiEndpoints, AppConstants } from '../../constants';
import { useAuth } from '../../context/AuthContext';
import { useDebounce } from '../../hooks';
import type { RootStackParamList } from '../../navigation/types';
import { useGetFamilyMembersQuery } from '../../redux/apis/bookingApi';
import { useGetPatientFilesQuery } from '../../redux/apis/patientFilesApi';
import { storageService } from '../../services/storageService';
import type { FamilyMemberModel, PatientFileModel } from '../../types';
import {
  DateTimeUtils,
  downloadAndSaveFile,
  getImageUrl,
  showToast,
} from '../../utils';
import type { PickedFile } from './components';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png', 'webp'];
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];

let DocumentPicker: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  DocumentPicker = require('expo-document-picker');
} catch {
  DocumentPicker = null;
}

const guessMime = (name: string): string => {
  const ext = (name.split('.').pop() || '').toLowerCase();
  if (ext === 'pdf') return 'application/pdf';
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'doc') return 'application/msword';
  if (ext === 'docx') return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  return 'image/jpeg';
};

export const usePatientFile = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'PatientFile'>>();
  const { user } = useAuth();
  const uid = String(user?.id ?? (user as any)?.user_id ?? '');

  const initialMemberId = route.params?.familyMemberId ? String(route.params.familyMemberId) : 'all';
  const [search, setSearch] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState<string>(initialMemberId);
  const [showMemberDropdown, setShowMemberDropdown] = useState<boolean>(false);
  const [downloadingId, setDownloadingId] = useState<string | number | null>(null);
  const debouncedSearch = useDebounce(search, 300);

  // Upload state
  const [uploadVisible, setUploadVisible] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [titleError, setTitleError] = useState('');
  const [fileError, setFileError] = useState('');
  const [uploadMemberId, setUploadMemberId] = useState<string>('');
  const [showUploadMembers, setShowUploadMembers] = useState(false);
  const [pickedFile, setPickedFile] = useState<PickedFile | null>(null);
  const [uploadError, setUploadError] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const { data: familyData } = useGetFamilyMembersQuery(uid, {
    skip: !uid,
  });

  const familyList: FamilyMemberModel[] = useMemo(() => {
    let sourceList: FamilyMemberModel[] = [];
    if (Array.isArray(familyData)) {
      sourceList = familyData;
    } else if (Array.isArray((familyData as any)?.data)) {
      sourceList = (familyData as any).data;
    } else if (Array.isArray((familyData as any)?.data?.data)) {
      sourceList = (familyData as any).data.data;
    }

    const selfFound = sourceList.some(
      (m) =>
        (m.relationship || '').toLowerCase() === 'self' ||
        (m as any).is_self === true ||
        String(m.id) === String(user?.id)
    );

    if (!selfFound && user) {
      const selfItem: FamilyMemberModel = {
        id: user.id,
        user_id: user.id,
        f_name: user.f_name || 'Self',
        l_name: user.l_name || '',
        name: `${user.f_name ?? ''} ${user.l_name ?? ''}`.trim() || 'Self',
        phone: user.phone || '',
        gender: user.gender || '',
        dob: user.dob || '',
        isd_code: user.isd_code || '+91',
        relationship: 'Self',
      };
      (selfItem as any).is_self = true;
      return [selfItem, ...sourceList];
    }

    return sourceList;
  }, [familyData, user]);

  const getMemberDisplayName = (mem?: FamilyMemberModel | null): string => {
    if (!mem) return 'Patient';
    const isSelf =
      (mem as any).is_self === true ||
      (mem.relationship || '').toLowerCase() === 'self' ||
      String(mem.id) === String(user?.id);
    if (isSelf) {
      const uFull = `${user?.f_name ?? ''} ${user?.l_name ?? ''}`.trim();
      return uFull || user?.phone || 'Self';
    }
    const full = `${mem.f_name ?? ''} ${mem.l_name ?? ''}`.trim();
    return mem.name || full || 'Family Member';
  };

  const getMemberRelationLabel = (mem?: FamilyMemberModel | null): string => {
    if (!mem) return '';
    const isSelf =
      (mem as any).is_self === true ||
      (mem.relationship || '').toLowerCase() === 'self' ||
      String(mem.id) === String(user?.id);
    if (isSelf) return 'Self';
    return (mem as any).relation || (mem as any).relationship || '';
  };

  const selectedMemberDisplayName = useMemo(() => {
    if (selectedMemberId === 'all') return 'All Members';
    const target = familyList.find((m) => String(m.id) === selectedMemberId);
    return target ? getMemberDisplayName(target) : 'All Members';
  }, [selectedMemberId, familyList, user]);

  const queryMemberParam = useMemo(() => {
    if (selectedMemberId === 'all') return undefined;
    return selectedMemberId;
  }, [selectedMemberId]);

  const {
    data: rawData,
    isLoading,
    isError,
    refetch,
  } = useGetPatientFilesQuery(
    {
      userId: uid,
      familyMemberId: queryMemberParam,
      search: debouncedSearch.trim() || undefined,
    },
    { skip: !uid }
  );

  const files: PatientFileModel[] = useMemo(() => {
    let list: PatientFileModel[] = [];
    if (!rawData) list = [];
    else if (Array.isArray(rawData)) list = rawData;
    else if (Array.isArray((rawData as any)?.data)) list = (rawData as any).data;
    else if (Array.isArray((rawData as any)?.data?.data)) list = (rawData as any).data.data;
    else if (Array.isArray((rawData as any)?.response)) list = (rawData as any).response;
    else if (Array.isArray((rawData as any)?.response?.data)) list = (rawData as any).response.data;
    else if (Array.isArray((rawData as any)?.result)) list = (rawData as any).result;

    if (selectedMemberId !== 'all') {
      const curMember = familyList.find((m) => String(m.id) === String(selectedMemberId));
      list = list.filter((item: any) => {
        const itemMemId = item.family_member_id ?? item.patient_id ?? item.member_id;
        if (itemMemId != null && String(itemMemId) === String(selectedMemberId)) {
          return true;
        }

        const isSelfSelection =
          String(selectedMemberId) === String(user?.id) ||
          (curMember && (
            (curMember as any).is_self ||
            curMember.relationship === 'Self' ||
            curMember.name === 'Self' ||
            (curMember.phone && curMember.phone === user?.phone)
          ));

        if (isSelfSelection) {
          if (!itemMemId || itemMemId === 0 || itemMemId === '0' || String(itemMemId) === String(user?.id)) {
            return true;
          }
        }

        if (curMember) {
          const memName = (
            curMember.name || `${curMember.f_name ?? ''} ${curMember.l_name ?? ''}`
          )
            .toLowerCase()
            .trim();
          const memPhone = (curMember.phone ?? '').trim();
          const itemPatientName = (
            item.patient_name ||
            `${item.patient_f_name ?? item.f_name ?? ''} ${item.patient_l_name ?? item.l_name ?? ''}`
          )
            .toLowerCase()
            .trim();
          const itemPhone = (item.patient_phone || item.phone || '').trim();

          if (
            memName &&
            itemPatientName &&
            (itemPatientName.includes(memName) || memName.includes(itemPatientName))
          ) {
            return true;
          }
          if (memPhone && itemPhone && memPhone === itemPhone) {
            return true;
          }
        }

        return false;
      });
    }

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((item: any) => {
        const title = (item.title || item.file_name || '').toLowerCase();
        const patientName = (
          item.patient_name ||
          `${item.patient_f_name ?? item.f_name ?? ''} ${item.patient_l_name ?? item.l_name ?? ''}`
        ).toLowerCase();
        const dateStr = (item.created_at || item.date || item.updated_at || '').toLowerCase();
        const idStr = String(item.id || '');
        return title.includes(q) || patientName.includes(q) || dateStr.includes(q) || idStr.includes(q);
      });
    }

    return list;
  }, [rawData, selectedMemberId, familyList, user, search]);

  const handleDownload = async (item: any) => {
    const fileSource =
      item.file_url ||
      item.file ||
      item.url ||
      item.file_name ||
      item.document ||
      item.report ||
      item.image;

    if (fileSource) {
      const url = fileSource.startsWith('http') ? fileSource : getImageUrl(fileSource);
      const title = item.title || item.file_name || item.name || 'document';
      const targetId = item.id ?? title;
      try {
        setDownloadingId(targetId);
        await downloadAndSaveFile(url, title);
      } finally {
        setDownloadingId(null);
      }
    } else {
      showToast('File attachment not found');
    }
  };

  const handleOpenFile = (item: any) => {
    const fileSource =
      item.file_url ||
      item.file ||
      item.url ||
      item.file_name ||
      item.document ||
      item.report ||
      item.image;

    if (fileSource) {
      const url = fileSource.startsWith('http') ? fileSource : getImageUrl(fileSource);
      Linking.openURL(url).catch(() => showToast('Could not open file URL'));
    } else {
      showToast('File attachment not found');
    }
  };

  const formatPatientName = (item: any) => {
    return (
      item.patient_name ||
      `${item.patient_f_name ?? item.f_name ?? ''} ${item.patient_l_name ?? item.l_name ?? ''}`.trim() ||
      user?.f_name ||
      'Patient'
    );
  };

  const formatFileDate = (item: any) => {
    const d = item.created_at || item.date || item.updated_at;
    if (!d) return '--';
    const str = String(d).trim();
    return DateTimeUtils.getDataFormatWithTime(str) || str;
  };

  const openUploadSheet = () => {
    setShowMemberDropdown(false);
    const defaultId =
      selectedMemberId !== 'all'
        ? selectedMemberId
        : String(familyList[0]?.id ?? uid);

    setUploadMemberId(defaultId);
    setUploadTitle('');
    setTitleError('');
    setFileError('');
    setPickedFile(null);
    setUploadError('');
    setShowUploadMembers(false);
    setUploadVisible(true);
  };

  const closeUploadSheet = () => {
    if (isUploading) return;
    setUploadVisible(false);
  };

  const applyPickedFile = (file: PickedFile) => {
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    const isAllowedExt = ALLOWED_EXTENSIONS.includes(ext);
    const isAllowedMime = ALLOWED_MIME_TYPES.some((m) =>
      file.mimeType.toLowerCase().includes(m) || m.includes(file.mimeType.toLowerCase())
    );

    if (!isAllowedExt && !isAllowedMime) {
      setFileError('Invalid file type. Only PDF, JPG, PNG, and WEBP files are allowed.');
      return;
    }

    if (file.size && file.size > MAX_FILE_SIZE_BYTES) {
      setFileError('File size exceeds 10MB limit. Please choose a smaller file.');
      return;
    }

    setPickedFile(file);
    setFileError('');
    setUploadError('');
    if (!uploadTitle.trim()) {
      setUploadTitle(file.name.replace(/\.[^/.]+$/, '').slice(0, 60));
      setTitleError('');
    }
  };

  const pickFromGallery = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== 'granted') {
        showToast('Gallery permission is required to select photos');
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: false,
      });
      if (!res.canceled && res.assets?.length) {
        const a = res.assets[0];
        const name = a.fileName || a.uri.split('/').pop() || `file_${Date.now()}.jpg`;
        applyPickedFile({
          uri: a.uri,
          name,
          mimeType: a.mimeType || guessMime(name),
          size: a.fileSize,
        });
      }
    } catch (e: any) {
      showToast(e?.message || 'Could not open gallery');
    }
  };

  const pickFromCamera = async () => {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (perm.status !== 'granted') {
        showToast('Camera permission is required to take a photo');
        return;
      }
      const res = await ImagePicker.launchCameraAsync({
        quality: 0.8,
        allowsEditing: false,
      });
      if (!res.canceled && res.assets?.length) {
        const a = res.assets[0];
        const name = a.fileName || a.uri.split('/').pop() || `photo_${Date.now()}.jpg`;
        applyPickedFile({
          uri: a.uri,
          name,
          mimeType: a.mimeType || guessMime(name),
          size: a.fileSize,
        });
      }
    } catch (e: any) {
      showToast(e?.message || 'Could not open camera');
    }
  };

  const pickDocument = async () => {
    if (!DocumentPicker) return;
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });
      if (!res.canceled && res.assets?.length) {
        const a = res.assets[0];
        applyPickedFile({
          uri: a.uri,
          name: a.name,
          mimeType: a.mimeType || guessMime(a.name),
          size: a.size,
        });
      }
    } catch (e: any) {
      showToast(e?.message || 'Could not open documents');
    }
  };

  const uploadPatientFileWithXHR = async (
    url: string,
    formData: FormData,
    token?: string
  ): Promise<any> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', url);
      xhr.setRequestHeader('Accept', 'application/json');
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      xhr.onload = () => {
        let json: any = null;
        try {
          json = JSON.parse(xhr.responseText);
        } catch {
          // ignore parse error
        }

        if (xhr.status >= 200 && xhr.status < 300) {
          if (json && (json.response === 403 || json.response === 400 || json.response === 500 || json.status === false)) {
            reject(new Error(json.message || `Upload rejected (${json.response ?? xhr.status})`));
            return;
          }
          resolve(json || { status: true });
        } else {
          const msg = json?.message || `Server error (${xhr.status})`;
          reject(new Error(msg));
        }
      };

      xhr.onerror = () => {
        reject(new Error('Network error. Failed to upload file.'));
      };

      xhr.send(formData);
    });
  };

  const handleUpload = async () => {
    let hasError = false;
    const trimmedTitle = uploadTitle.trim();

    if (!trimmedTitle) {
      setTitleError('Please enter a file title');
      hasError = true;
    } else if (trimmedTitle.length < 3) {
      setTitleError('File title must be at least 3 characters');
      hasError = true;
    } else if (trimmedTitle.length > 60) {
      setTitleError('File title must not exceed 60 characters');
      hasError = true;
    } else if (!/^[a-zA-Z0-9\s_\-.]+$/.test(trimmedTitle)) {
      setTitleError('File title can only contain alphanumeric characters, spaces, and hyphens');
      hasError = true;
    } else if (!/[a-zA-Z0-9]/.test(trimmedTitle)) {
      setTitleError('File title must contain at least one alphanumeric character');
      hasError = true;
    } else {
      setTitleError('');
    }

    if (!pickedFile) {
      setFileError('Please choose a file to upload');
      hasError = true;
    } else {
      const ext = (pickedFile.name.split('.').pop() || '').toLowerCase();
      const isAllowedExt = ALLOWED_EXTENSIONS.includes(ext);
      const isAllowedMime = ALLOWED_MIME_TYPES.some((m) =>
        pickedFile.mimeType.toLowerCase().includes(m) || m.includes(pickedFile.mimeType.toLowerCase())
      );
      if (!isAllowedExt && !isAllowedMime) {
        setFileError('Only PDF, JPG, PNG, and WEBP files are allowed');
        hasError = true;
      } else if (pickedFile.size && pickedFile.size > MAX_FILE_SIZE_BYTES) {
        setFileError('File size exceeds 10MB limit');
        hasError = true;
      } else {
        setFileError('');
      }
    }

    if (hasError) return;

    try {
      setIsUploading(true);
      setUploadError('');

      const formData = new FormData();
      formData.append('title', trimmedTitle);
      formData.append('user_id', uid);

      if (uploadMemberId && uploadMemberId !== uid) {
        formData.append('family_member_id', String(uploadMemberId));
      }

      const fileObj: any = {
        uri: Platform.OS === 'android' ? pickedFile!.uri : pickedFile!.uri.replace('file://', ''),
        name: pickedFile!.name,
        type: pickedFile!.mimeType || guessMime(pickedFile!.name),
      };
      formData.append('file', fileObj);

      const token = await storageService.getItem<string>(AppConstants.storageKeys.token);
      await uploadPatientFileWithXHR(ApiEndpoints.addPatientFileUrl, formData, token || undefined);

      showToast('File uploaded successfully');
      setUploadVisible(false);
      setUploadTitle('');
      setTitleError('');
      setFileError('');
      setPickedFile(null);
      refetch();
    } catch (err: any) {
      const msg = err?.message || 'Failed to upload patient file. Please try again.';
      setUploadError(msg);
      showToast(msg);
    } finally {
      setIsUploading(false);
    }
  };

  const uploadMemberName = useMemo(() => {
    const mem = familyList.find((m) => String(m.id) === String(uploadMemberId));
    return getMemberDisplayName(mem);
  }, [uploadMemberId, familyList]);

  return {
    navigation,
    search,
    setSearch,
    selectedMemberId,
    setSelectedMemberId,
    showMemberDropdown,
    setShowMemberDropdown,
    downloadingId,
    familyList,
    selectedMemberDisplayName,
    files,
    isLoading,
    isError,
    refetch,
    handleDownload,
    handleOpenFile,
    formatPatientName,
    formatFileDate,
    openUploadSheet,
    closeUploadSheet,
    uploadVisible,
    uploadTitle,
    setUploadTitle,
    titleError,
    setTitleError,
    fileError,
    setFileError,
    uploadMemberId,
    setUploadMemberId,
    showUploadMembers,
    setShowUploadMembers,
    uploadMemberName,
    pickedFile,
    setPickedFile,
    uploadError,
    setUploadError,
    isUploading,
    handleUpload,
    pickFromGallery,
    pickFromCamera,
    pickDocument,
    hasDocumentPicker: Boolean(DocumentPicker),
    getMemberDisplayName,
    getMemberRelationLabel,
  };
};
