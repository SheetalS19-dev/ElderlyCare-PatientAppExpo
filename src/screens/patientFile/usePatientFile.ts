import type { RouteProp } from '@react-navigation/native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Linking, Platform } from 'react-native';
import { ApiEndpoints, AppConstants } from '../../constants';
import { useAuth } from '../../context/AuthContext';
import { useDebounce } from '../../hooks';
import type { RootStackParamList } from '../../navigation/types';
import {
  useAddFamilyMemberMutation,
  useGetFamilyMembersQuery,
} from '../../redux/apis/bookingApi';
import { patientFilesApi, useGetPatientFilesQuery } from '../../redux/apis/patientFilesApi';
import { useAppDispatch } from '../../redux/hooks';
import { storageService } from '../../services/storageService';
import type { FamilyMemberModel, PatientFileModel } from '../../types';
import {
  DateTimeUtils,
  downloadAndSaveFile,
  getImageUrl,
  isUserSelfMember,
  showToast,
} from '../../utils';
import type { PickedFile } from './components';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png', 'webp', 'doc', 'docx'];
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
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
  const dispatch = useAppDispatch();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'PatientFile'>>();
  const { user } = useAuth();
  const [asyncUid, setAsyncUid] = useState<string>('');

  useEffect(() => {
    storageService.getItem<string>(AppConstants.storageKeys.uid).then((stored) => {
      if (stored) setAsyncUid(String(stored));
    });
  }, []);

  const uid = String(user?.id ?? (user as any)?.user_id ?? asyncUid ?? '');

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

  // Query patient files first
  const {
    data: rawData,
    isLoading,
    isError,
    refetch,
  } = useGetPatientFilesQuery(
    {
      userId: uid,
    },
    { skip: !uid, refetchOnMountOrArgChange: true }
  );

  const {
    data: familyData,
    refetch: refetchFamily,
  } = useGetFamilyMembersQuery(uid, {
    skip: !uid,
  });

  const [addFamilyMember] = useAddFamilyMemberMutation();

  useFocusEffect(
    useCallback(() => {
      if (uid) {
        refetch();
        refetchFamily();
      }
    }, [uid, refetch, refetchFamily])
  );

  const rawFamilyList: FamilyMemberModel[] = useMemo(() => {
    let sourceList: FamilyMemberModel[] = [];
    if (Array.isArray(familyData)) {
      sourceList = familyData;
    } else if (Array.isArray((familyData as any)?.data)) {
      sourceList = (familyData as any).data;
    } else if (Array.isArray((familyData as any)?.data?.data)) {
      sourceList = (familyData as any).data.data;
    } else if (Array.isArray((familyData as any)?.response)) {
      sourceList = (familyData as any).response;
    } else if (Array.isArray((familyData as any)?.response?.data)) {
      sourceList = (familyData as any).response.data;
    }
    return sourceList;
  }, [familyData]);

  // Find existing self member in family_members table
  const existingSelfMemberInDb = useMemo(() => {
    const matched = rawFamilyList.find((m) => isUserSelfMember(m, user));
    if (matched) return matched;

    const byRel = rawFamilyList.find((m) => {
      const rel = (m.relationship || (m as any).relation || '').trim().toLowerCase();
      return rel === 'self' || rel === 'myself' || rel === 'me' || rel === 'primary';
    });
    if (byRel) return byRel;

    return null;
  }, [rawFamilyList, user]);

  const effectiveSelfId = useMemo(() => {
    if (existingSelfMemberInDb?.id) {
      return String(existingSelfMemberInDb.id);
    }
    return String(user?.id ?? uid ?? 'self');
  }, [existingSelfMemberInDb, user?.id, uid]);

  const familyList: FamilyMemberModel[] = useMemo(() => {
    const result: FamilyMemberModel[] = [];
    const seenKeys = new Set<string>();

    // 1. Add Self (Account Holder) first with real family_members table ID when present
    if (user) {
      const selfItem: FamilyMemberModel = {
        id: effectiveSelfId,
        user_id: user.id,
        f_name: existingSelfMemberInDb?.f_name || user.f_name || 'Self',
        l_name: existingSelfMemberInDb?.l_name || user.l_name || '',
        name: `${user.f_name ?? ''} ${user.l_name ?? ''}`.trim() || 'Self',
        phone: existingSelfMemberInDb?.phone || user.phone || '',
        gender: existingSelfMemberInDb?.gender || user.gender || '',
        dob: existingSelfMemberInDb?.dob || user.dob || '',
        isd_code: existingSelfMemberInDb?.isd_code || user.isd_code || '+91',
        relationship: 'Self',
      };
      (selfItem as any).is_self = true;
      result.push(selfItem);

      const selfKey = `${(user.f_name || '').trim().toLowerCase()}_${(user.l_name || '').trim().toLowerCase()}`;
      if (selfKey !== '_') seenKeys.add(selfKey);
    }

    // 2. Add family members from rawFamilyList (excluding Self duplicate)
    for (const m of rawFamilyList) {
      if (isUserSelfMember(m, user)) continue;
      if (existingSelfMemberInDb && String(m.id) === String(existingSelfMemberInDb.id)) continue;
      if (effectiveSelfId && String(m.id) === effectiveSelfId) continue;

      const mFName = (m.f_name || '').trim().toLowerCase();
      const mLName = (m.l_name || '').trim().toLowerCase();
      const key = `${mFName}_${mLName}`;

      if (key !== '_' && seenKeys.has(key)) continue;

      result.push(m);
      if (mFName) seenKeys.add(key);
    }

    // 3. Add any other patients found in rawData who are not yet represented
    let fileList: any[] = [];
    if (Array.isArray(rawData)) fileList = rawData;
    else if (Array.isArray((rawData as any)?.data)) fileList = (rawData as any).data;
    else if (Array.isArray((rawData as any)?.data?.data)) fileList = (rawData as any).data.data;
    else if (Array.isArray((rawData as any)?.response)) fileList = (rawData as any).response;

    for (const f of fileList) {
      const fFName = (f.patient_f_name || f.f_name || '').trim().toLowerCase();
      const fLName = (f.patient_l_name || f.l_name || '').trim().toLowerCase();
      const key = `${fFName}_${fLName}`;

      if (fFName && !seenKeys.has(key)) {
        seenKeys.add(key);
        const pId = String(f.patient_id ?? f.family_member_id ?? f.id);
        result.push({
          id: pId as any,
          user_id: user?.id,
          f_name: f.patient_f_name || f.f_name,
          l_name: f.patient_l_name || f.l_name || '',
          name: `${f.patient_f_name || f.f_name} ${f.patient_l_name || f.l_name || ''}`.trim(),
          phone: f.phone || f.patient_phone || '',
          gender: '',
          dob: '',
          isd_code: f.isd_code || '+91',
          relationship: 'Patient',
        });
      }
    }

    return result;
  }, [rawFamilyList, existingSelfMemberInDb, effectiveSelfId, user, rawData]);

  const getMemberDisplayName = (mem?: FamilyMemberModel | null): string => {
    if (!mem) return 'Patient';
    const isSelf =
      (mem as any).is_self === true ||
      (mem.relationship || '').toLowerCase() === 'self' ||
      String(mem.id) === String(user?.id) ||
      String(mem.id) === effectiveSelfId ||
      (existingSelfMemberInDb && String(mem.id) === String(existingSelfMemberInDb.id));

    if (isSelf) {
      const uFull = `${user?.f_name ?? mem.f_name ?? ''} ${user?.l_name ?? mem.l_name ?? ''}`.trim();
      return uFull ? `${uFull} (Self)` : 'Self (Account Holder)';
    }
    const full = `${mem.f_name ?? ''} ${mem.l_name ?? ''}`.trim();
    return full || mem.name || 'Family Member';
  };

  const getMemberRelationLabel = (mem?: FamilyMemberModel | null): string => {
    if (!mem) return '';
    const isSelf =
      (mem as any).is_self === true ||
      (mem.relationship || '').toLowerCase() === 'self' ||
      String(mem.id) === String(user?.id) ||
      String(mem.id) === effectiveSelfId ||
      (existingSelfMemberInDb && String(mem.id) === String(existingSelfMemberInDb.id));

    if (isSelf) return '';
    const rel = (mem as any).relation || (mem as any).relationship || '';
    if (
      !rel ||
      rel.toLowerCase() === 'family member' ||
      rel.toLowerCase() === 'patient' ||
      rel.toLowerCase() === 'self'
    ) {
      return '';
    }
    return rel;
  };

  const selectedMemberDisplayName = useMemo(() => {
    if (selectedMemberId === 'all') return 'All Members';
    const target = familyList.find(
      (m) =>
        String(m.id) === selectedMemberId ||
        ((m as any).is_self &&
          (selectedMemberId === String(user?.id) ||
            selectedMemberId === effectiveSelfId ||
            selectedMemberId === 'self'))
    );
    return target ? getMemberDisplayName(target) : 'All Members';
  }, [selectedMemberId, familyList, user, effectiveSelfId]);

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
      const curMember = familyList.find(
        (m) =>
          String(m.id) === String(selectedMemberId) ||
          ((m as any).is_self &&
            (selectedMemberId === String(user?.id) ||
              selectedMemberId === effectiveSelfId ||
              selectedMemberId === 'self'))
      );
      const curFName = (curMember?.f_name || '').trim().toLowerCase();
      const curLName = (curMember?.l_name || '').trim().toLowerCase();
      const isSelfSelection =
        (curMember as any)?.is_self === true ||
        (curMember?.relationship || '').toLowerCase() === 'self' ||
        String(selectedMemberId) === String(user?.id) ||
        String(selectedMemberId) === effectiveSelfId ||
        (existingSelfMemberInDb && String(selectedMemberId) === String(existingSelfMemberInDb.id));

      list = list.filter((item: any) => {
        const itemPatientId = String(item.patient_id ?? item.family_member_id ?? item.member_id ?? '');

        // 1. Direct ID match
        if (
          itemPatientId &&
          (itemPatientId === String(selectedMemberId) ||
            (curMember && itemPatientId === String(curMember.id)) ||
            (isSelfSelection && existingSelfMemberInDb && itemPatientId === String(existingSelfMemberInDb.id)) ||
            (isSelfSelection && effectiveSelfId && itemPatientId === effectiveSelfId) ||
            (isSelfSelection && itemPatientId === String(user?.id)))
        ) {
          return true;
        }

        // 2. Name match (First name + Last name)
        const itemFName = (item.patient_f_name || item.f_name || '').trim().toLowerCase();
        const itemLName = (item.patient_l_name || item.l_name || '').trim().toLowerCase();

        if (curFName && itemFName) {
          if (curFName === itemFName) {
            // If both specify last names, require last name match
            if (curLName && itemLName) {
              if (curLName === itemLName) return true;
            } else {
              return true;
            }
          }
        }

        // 3. Self selection fallback: matches user name or direct user_id or empty / 0
        if (isSelfSelection) {
          const userFName = (user?.f_name || '').trim().toLowerCase();
          const userLName = (user?.l_name || '').trim().toLowerCase();
          if (userFName && itemFName === userFName) {
            if (userLName && itemLName) {
              if (userLName === itemLName) return true;
            } else {
              return true;
            }
          }
          if (!itemPatientId || itemPatientId === '0' || itemPatientId === String(user?.id)) {
            return true;
          }
        }

        return false;
      });
    }

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((item: any) => {
        const title = (item.title || item.file_name || item.name || '').toLowerCase();
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
  }, [rawData, selectedMemberId, familyList, user, search, effectiveSelfId, existingSelfMemberInDb]);

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
    let defaultId =
      selectedMemberId !== 'all'
        ? selectedMemberId
        : String(familyList[0]?.id ?? effectiveSelfId ?? uid);

    if (
      defaultId === 'self' ||
      defaultId === String(user?.id) ||
      defaultId === String(uid)
    ) {
      defaultId = effectiveSelfId;
    }

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
      setFileError('Invalid file type. Only PDF, JPG, PNG, WEBP, and DOC files are allowed.');
      return;
    }

    if (file.size && file.size > MAX_FILE_SIZE_BYTES) {
      setFileError('File size exceeds 5MB limit. Please choose a file up to 5 MB.');
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
        type: [
          'application/pdf',
          'image/*',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ],
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

  const resolvePatientIdForUpload = async (targetId: string): Promise<string> => {
    const isSelf =
      !targetId ||
      targetId === 'self' ||
      targetId === effectiveSelfId ||
      targetId === String(user?.id) ||
      targetId === String(uid) ||
      (existingSelfMemberInDb && String(targetId) === String(existingSelfMemberInDb.id));

    if (isSelf) {
      if (existingSelfMemberInDb?.id) {
        return String(existingSelfMemberInDb.id);
      }

      // If no self record in family_members table, auto-create one
      try {
        const createRes: any = await addFamilyMember({
          user_id: uid,
          f_name: user?.f_name || 'Patient',
          l_name: user?.l_name || '',
          gender: user?.gender || 'Male',
          dob: user?.dob || '1990-01-01',
          phone: user?.phone || '',
          isd_code: user?.isd_code || '+91',
          relationship: 'Self',
        }).unwrap();

        const newId =
          createRes?.data?.id ??
          createRes?.data?.member_id ??
          createRes?.response?.id ??
          createRes?.response?.member_id ??
          createRes?.id ??
          createRes?.member_id;

        if (newId) {
          refetchFamily();
          return String(newId);
        }
      } catch {
        // Auto-create failed, fallback to uid
      }
      return String(user?.id ?? uid);
    }

    const matched = rawFamilyList.find((m) => String(m.id) === String(targetId));
    if (matched?.id) {
      return String(matched.id);
    }

    return String(targetId);
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
      setFileError('Please choose a file to upload (max 5 MB)');
      hasError = true;
    } else {
      const ext = (pickedFile.name.split('.').pop() || '').toLowerCase();
      const isAllowedExt = ALLOWED_EXTENSIONS.includes(ext);
      const isAllowedMime = ALLOWED_MIME_TYPES.some((m) =>
        pickedFile.mimeType.toLowerCase().includes(m) || m.includes(pickedFile.mimeType.toLowerCase())
      );
      if (!isAllowedExt && !isAllowedMime) {
        setFileError('Only PDF, JPG, PNG, WEBP, and DOC files are allowed');
        hasError = true;
      } else if (pickedFile.size && pickedFile.size > MAX_FILE_SIZE_BYTES) {
        setFileError('File size exceeds 5MB limit. Max 5 MB file can be uploaded.');
        hasError = true;
      } else {
        setFileError('');
      }
    }

    if (hasError) return;

    try {
      setIsUploading(true);
      setUploadError('');

      const resolvedPatientId = await resolvePatientIdForUpload(uploadMemberId);

      const buildUploadFormData = (pId: string | null) => {
        const fd = new FormData();
        fd.append('file_name', trimmedTitle);
        fd.append('title', trimmedTitle);
        fd.append('user_id', String(uid));
        if (pId !== null) {
          fd.append('patient_id', pId);
          fd.append('family_member_id', pId);
        }

        const fileObj: any = {
          uri: Platform.OS === 'android' ? pickedFile!.uri : pickedFile!.uri.replace('file://', ''),
          name: pickedFile!.name,
          type: pickedFile!.mimeType || guessMime(pickedFile!.name),
        };
        fd.append('file', fileObj);
        return fd;
      };

      const token = await storageService.getItem<string>(AppConstants.storageKeys.token);

      try {
        await uploadPatientFileWithXHR(
          ApiEndpoints.addPatientFileUrl,
          buildUploadFormData(resolvedPatientId),
          token || undefined
        );
      } catch (firstErr: any) {
        const errMsg = String(firstErr?.message || '').toLowerCase();
        // If error indicates rejection due to ownership of patient, attempt fallback
        if (errMsg.includes('own patients') && resolvedPatientId !== '0') {
          try {
            await uploadPatientFileWithXHR(
              ApiEndpoints.addPatientFileUrl,
              buildUploadFormData('0'),
              token || undefined
            );
          } catch {
            throw firstErr;
          }
        } else {
          throw firstErr;
        }
      }

      showToast('File uploaded successfully');
      setUploadVisible(false);
      setUploadTitle('');
      setTitleError('');
      setFileError('');
      setPickedFile(null);
      if (uploadMemberId) {
        setSelectedMemberId(uploadMemberId);
      }
      refetch();
      dispatch(patientFilesApi.util.invalidateTags(['PatientFiles']));
    } catch (err: any) {
      const msg = err?.message || 'Failed to upload patient file. Please try again.';
      setUploadError(msg);
      showToast(msg);
    } finally {
      setIsUploading(false);
    }
  };

  const uploadMemberName = useMemo(() => {
    const mem = familyList.find(
      (m) =>
        String(m.id) === String(uploadMemberId) ||
        ((m as any).is_self &&
          (String(uploadMemberId) === String(user?.id) ||
            String(uploadMemberId) === effectiveSelfId ||
            uploadMemberId === 'self'))
    );
    return getMemberDisplayName(mem);
  }, [uploadMemberId, familyList, effectiveSelfId, user]);

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
