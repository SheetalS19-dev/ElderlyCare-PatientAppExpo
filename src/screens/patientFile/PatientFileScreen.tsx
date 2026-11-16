import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AppCard,
  AppHeader,
  EmptyState,
  ErrorState,
  LoadingIndicator,
  SearchBox,
} from '../../components';
import { ApiEndpoints, AppConstants, Colors } from '../../constants';
import { useAuth } from '../../context/AuthContext';
import { useDebounce } from '../../hooks';
import type { RootStackParamList } from '../../navigation/types';
import { useGetFamilyMembersQuery } from '../../redux/apis/bookingApi';
import { useGetPatientFilesQuery } from '../../redux/apis/patientFilesApi';
import { storageService } from '../../services/storageService';
import type { FamilyMemberModel, PatientFileModel } from '../../types';
import { DateTimeUtils, downloadAndSaveFile, fs, getImageUrl, hs, showToast, TYPOGRAPHY, ws } from '../../utils';

type Props = NativeStackScreenProps<RootStackParamList, 'PatientFile'>;

type PickedFile = { uri: string; name: string; mimeType: string };

// expo-document-picker is optional: PDFs/documents are offered only when it is installed
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

export const PatientFileScreen = ({ navigation, route }: Props) => {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
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

    const selfPhone = (user?.phone || '').trim();
    const selfFName = (user?.f_name || '').trim().toLowerCase();
    const selfId = String(user?.id ?? uid);

    const isSelfMatch = (m: FamilyMemberModel) => {
      return (
        (m as any).is_self === true ||
        (m.relationship || '').toLowerCase() === 'self' ||
        (m.name || '').toLowerCase() === 'self' ||
        (selfId && String(m.id) === selfId) ||
        (selfPhone && m.phone === selfPhone) ||
        (selfFName && (m.f_name || '').trim().toLowerCase() === selfFName && m.phone === selfPhone)
      );
    };

    const existingSelfIndex = sourceList.findIndex(isSelfMatch);
    if (existingSelfIndex >= 0) {
      const existingSelf = sourceList[existingSelfIndex];
      const normalizedSelf: FamilyMemberModel = {
        ...existingSelf,
        relationship: 'Self',
        f_name: existingSelf.f_name || user?.f_name,
        l_name: existingSelf.l_name || user?.l_name,
      };
      const rest = sourceList.filter((_, idx) => idx !== existingSelfIndex);
      return [normalizedSelf, ...rest];
    }

    if (user && (user.f_name || user.id)) {
      const syntheticSelf: FamilyMemberModel = {
        id: user.id,
        user_id: user.id,
        f_name: user.f_name,
        l_name: user.l_name,
        name: `${user.f_name ?? ''} ${user.l_name ?? ''}`.trim() || 'Self',
        phone: user.phone,
        relationship: 'Self',
      };
      return [syntheticSelf, ...sourceList];
    }

    return sourceList;
  }, [familyData, user, uid]);

  const getMemberDisplayName = (mem: FamilyMemberModel) => {
    const fullName = `${mem.f_name ?? ''} ${mem.l_name ?? ''}`.trim();
    if (fullName) return fullName;
    if (mem.name && mem.name !== 'Self') return mem.name;
    const userFullName = `${user?.f_name ?? ''} ${user?.l_name ?? ''}`.trim();
    if (userFullName) return userFullName;
    return 'Self';
  };

  const getMemberRelationLabel = (mem?: FamilyMemberModel | null): string => {
    if (!mem) return '';
    if ((mem as any).is_self || mem.relationship?.toLowerCase() === 'self' || mem.name === 'Self') {
      return 'Self';
    }
    if (user?.phone && mem.phone === user.phone) {
      return 'Self';
    }
    if (user?.id && String(mem.id) === String(user.id)) {
      return 'Self';
    }
    return mem.relationship || (mem as any).relation || '';
  };

  const selectedMemberDisplayName = useMemo(() => {
    if (selectedMemberId === 'all') {
      return 'All Members';
    }
    const mem = familyList.find((m) => String(m.id) === String(selectedMemberId));
    if (mem) {
      return getMemberDisplayName(mem);
    }
    return 'All Members';
  }, [selectedMemberId, familyList, user]);

  const {
    data: rawData,
    isLoading,
    isError,
    refetch,
  } = useGetPatientFilesQuery(
    {
      userId: uid,
      searchQuery: debouncedSearch,
      familyMemberId: selectedMemberId === 'all' ? undefined : selectedMemberId,
    },
    { skip: !uid },
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

    // 1. Filter by Member
    if (selectedMemberId !== 'all') {
      const curMember = familyList.find((m) => String(m.id) === String(selectedMemberId));
      list = list.filter((item: any) => {
        const itemMemId = item.family_member_id ?? item.patient_id ?? item.member_id;

        // Direct ID match
        if (itemMemId != null && String(itemMemId) === String(selectedMemberId)) {
          return true;
        }

        // Self match
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

        // Fallback Name / Phone match
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

    // 2. Real-time Search Filter (instant client-side search)
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
    // Close dropdown if open
    setShowMemberDropdown(false);

    // Default the upload member:
    // If a member is selected in filter (not 'all'), use that.
    // Otherwise, default to the Self member (index 0 of familyList).
    const defaultId =
      selectedMemberId !== 'all'
        ? selectedMemberId
        : String(familyList[0]?.id ?? uid);

    setUploadMemberId(defaultId);
    setUploadTitle('');
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
    setPickedFile(file);
    setUploadError('');
    if (!uploadTitle.trim()) {
      setUploadTitle(file.name.replace(/\.[^/.]+$/, '').slice(0, 60));
    }
  };

  const pickFromGallery = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
      if (!res.canceled && res.assets?.length) {
        const a = res.assets[0];
        const name = a.fileName || a.uri.split('/').pop() || `file_${Date.now()}.jpg`;
        applyPickedFile({ uri: a.uri, name, mimeType: a.mimeType || guessMime(name) });
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
      const res = await ImagePicker.launchCameraAsync({ quality: 0.8 });
      if (!res.canceled && res.assets?.length) {
        const a = res.assets[0];
        const name = a.fileName || a.uri.split('/').pop() || `photo_${Date.now()}.jpg`;
        applyPickedFile({ uri: a.uri, name, mimeType: a.mimeType || guessMime(name) });
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
        applyPickedFile({ uri: a.uri, name: a.name, mimeType: a.mimeType || guessMime(a.name) });
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

        // Check both HTTP status and logical API response status
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
    if (!pickedFile) {
      setUploadError('Please choose a file to upload');
      return;
    }
    const trimmedTitle = uploadTitle.trim();
    if (!trimmedTitle) {
      setUploadError('Please enter a file title');
      return;
    }
    if (trimmedTitle.length < 2) {
      setUploadError('File title must be at least 2 characters');
      return;
    }
    if (!uid) {
      showToast('Session expired. Please log in again.');
      return;
    }

    setIsUploading(true);
    setUploadError('');

    try {
      const effectivePatientId = String(uploadMemberId || familyList[0]?.id || uid);

      const formData = new FormData();
      formData.append('user_id', uid);
      formData.append('patient_id', effectivePatientId);
      formData.append('file_name', trimmedTitle);
      formData.append('title', trimmedTitle);

      let cleanUri = pickedFile.uri;
      if (Platform.OS === 'android' && !cleanUri.startsWith('file://') && !cleanUri.startsWith('content://')) {
        cleanUri = `file://${cleanUri}`;
      }
      formData.append('file', {
        uri: cleanUri,
        name: pickedFile.name,
        type: pickedFile.mimeType,
      } as any);

      const token = await storageService.getItem<string>(AppConstants.storageKeys.token);
      await uploadPatientFileWithXHR(ApiEndpoints.addPatientFileUrl, formData, token || undefined);

      showToast('File uploaded successfully');
      setUploadVisible(false);
      setUploadTitle('');
      setPickedFile(null);
      refetch();
    } catch (err: any) {
      const msg = err?.message || 'Could not upload file. Please try again.';
      setUploadError(String(msg));
    } finally {
      setIsUploading(false);
    }
  };

  const uploadMember = useMemo(() => {
    return familyList.find((m) => String(m.id) === String(uploadMemberId)) || null;
  }, [uploadMemberId, familyList]);

  const uploadMemberName = useMemo(() => {
    return uploadMember ? getMemberDisplayName(uploadMember) : 'Select Member';
  }, [uploadMember, user]);

  return (
    <View style={styles.container}>
      <AppHeader title="Patient Files" onBackPress={() => navigation.goBack()} />

      {/* Unified Top Filter Section (Search Bar & Select Member share the same background) */}
      <View style={styles.topFilterSection}>
        {/* Search Input */}
        <SearchBox
          value={search}
          onChangeText={setSearch}
          placeholder="Search Files..."
          onClear={() => setSearch('')}
        />

        {/* Member Filter Dropdown */}
        <View style={styles.memberDropdownSection}>
          <Text style={styles.dropdownLabel}>Select Member</Text>
          <View style={styles.memberDropdownContainer}>
            <TouchableOpacity
              style={[
                styles.memberDropdownField,
                showMemberDropdown && styles.memberDropdownFieldOpen,
              ]}
              activeOpacity={0.85}
              onPress={() => setShowMemberDropdown((prev) => !prev)}
            >
              <Text style={styles.memberDropdownFieldText} numberOfLines={1}>
                {selectedMemberDisplayName}
              </Text>
              <MaterialIcons
                name={showMemberDropdown ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                size={fs(22)}
                color={Colors.primaryColor}
              />
            </TouchableOpacity>

            {/* Dropdown Menu Card */}
            {showMemberDropdown && (
              <View style={styles.memberDropdownMenuCard}>
                <ScrollView
                  nestedScrollEnabled
                  bounces={false}
                  showsVerticalScrollIndicator={false}
                  style={{ maxHeight: hs(220) }}
                >
                  {/* All Members Option */}
                  <TouchableOpacity
                    style={[
                      styles.memberDropdownMenuItem,
                      selectedMemberId === 'all' && styles.memberDropdownMenuItemActive,
                    ]}
                    activeOpacity={0.7}
                    onPress={() => {
                      setSelectedMemberId('all');
                      setShowMemberDropdown(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.memberDropdownMenuItemText,
                        selectedMemberId === 'all' && styles.memberDropdownMenuItemTextActive,
                      ]}
                      numberOfLines={1}
                    >
                      All Members
                    </Text>
                    {selectedMemberId === 'all' && (
                      <MaterialIcons name="check" size={fs(18)} color={Colors.white} />
                    )}
                  </TouchableOpacity>

                  {/* Individual Family Members */}
                  {familyList.map((mem) => {
                    const isSelected = String(mem.id) === selectedMemberId;
                    const displayName = getMemberDisplayName(mem);
                    const relation = getMemberRelationLabel(mem);

                    return (
                      <TouchableOpacity
                        key={`member-opt-${mem.id}`}
                        style={[
                          styles.memberDropdownMenuItem,
                          isSelected && styles.memberDropdownMenuItemActive,
                        ]}
                        activeOpacity={0.7}
                        onPress={() => {
                          setSelectedMemberId(String(mem.id));
                          setShowMemberDropdown(false);
                        }}
                      >
                        <View style={styles.menuItemTextRow}>
                          <Text
                            style={[
                              styles.memberDropdownMenuItemText,
                              isSelected && styles.memberDropdownMenuItemTextActive,
                            ]}
                            numberOfLines={1}
                          >
                            {displayName}
                          </Text>
                          {!!relation && (
                            <View
                              style={[
                                styles.relationBadgeSmall,
                                isSelected
                                  ? styles.relationBadgeSmallActive
                                  : relation.toLowerCase() === 'self'
                                  ? styles.relationBadgeSmallSelf
                                  : styles.relationBadgeSmallOther,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.relationBadgeSmallText,
                                  isSelected
                                    ? styles.relationBadgeSmallTextActive
                                    : relation.toLowerCase() === 'self'
                                    ? styles.relationBadgeSmallTextSelf
                                    : styles.relationBadgeSmallTextOther,
                                ]}
                              >
                                {relation}
                              </Text>
                            </View>
                          )}
                        </View>
                        {isSelected && (
                          <MaterialIcons name="check" size={fs(18)} color={Colors.white} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Dismiss backdrop when dropdown is open */}
      {showMemberDropdown && (
        <TouchableWithoutFeedback onPress={() => setShowMemberDropdown(false)}>
          <View style={styles.dropdownBackdrop} />
        </TouchableWithoutFeedback>
      )}

      {/* Upload action */}
      <View style={styles.uploadBar}>
        <TouchableOpacity style={styles.uploadButton} activeOpacity={0.85} onPress={openUploadSheet}>
          <MaterialIcons name="cloud-upload" size={fs(18)} color={Colors.white} />
          <Text style={styles.uploadButtonText}>Upload File</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <LoadingIndicator />
      ) : isError ? (
        <ErrorState message="Couldn't load medical files" onRetry={refetch} />
      ) : (
        <FlatList
          data={files}
          keyExtractor={(item, index) => `pf-${item.id ?? index}`}
          contentContainerStyle={[styles.listContent, { paddingBottom: hs(40) + Math.max(insets.bottom, hs(24)) }]}
          ListEmptyComponent={
            search.trim() ? (
              <View style={styles.emptySearchContainer}>
                <View style={styles.emptySearchIconBox}>
                  <MaterialIcons name="search-off" size={fs(36)} color={Colors.primaryColor} />
                </View>
                <Text style={styles.emptySearchTitle}>No matching files found</Text>
                <Text style={styles.emptySearchSubtitle}>
                  We couldn't find any medical files matching "{search.trim()}".
                </Text>
                <TouchableOpacity
                  style={styles.clearSearchBtn}
                  activeOpacity={0.8}
                  onPress={() => setSearch('')}
                >
                  <Text style={styles.clearSearchBtnText}>Clear Search</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <EmptyState message="No files have been uploaded yet." />
            )
          }
          renderItem={({ item }) => {
            const rawTitle = (item as any).title || item.file_name || 'Medical File';
            const fileIdStr = item.id ? ` #${item.id}` : '';
            const title = `${rawTitle}${fileIdStr}`;
            const patientInfo = formatPatientName(item);
            const dateStr = formatFileDate(item);

            return (
              <AppCard style={styles.fileCard}>
                <View style={styles.row}>
                  {/* File Icon */}
                  <View style={styles.folderIconBox}>
                    <MaterialIcons name="insert-drive-file" size={fs(22)} color={Colors.primaryColor} />
                  </View>

                  {/* File Metadata */}
                  <View style={styles.info}>
                    <Text style={styles.fileTitle} numberOfLines={1}>
                      {title}
                    </Text>
                    <Text style={styles.patientSubtext} numberOfLines={1}>
                      Patient: {patientInfo}
                    </Text>
                    <Text style={styles.dateSubtext}>
                      Date: {dateStr}
                    </Text>
                  </View>

                  {/* Quick Actions */}
                  <View style={styles.actionGroup}>
                    <TouchableOpacity
                      style={styles.actionBtnBlue}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      onPress={() => handleOpenFile(item)}
                      activeOpacity={0.8}
                    >
                      <MaterialIcons name="visibility" size={18} color={Colors.primaryColor} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.actionBtnOrange}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      onPress={() => handleDownload(item)}
                      activeOpacity={0.8}
                      disabled={downloadingId === (item.id ?? title)}
                    >
                      {downloadingId === (item.id ?? title) ? (
                        <ActivityIndicator size="small" color={Colors.primaryColor} />
                      ) : (
                        <MaterialIcons name="file-download" size={18} color={Colors.primaryColor} />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </AppCard>
            );
          }}
        />
      )}

      {/* Upload File Sheet */}
      <Modal visible={uploadVisible} transparent animationType="slide" onRequestClose={closeUploadSheet}>
        <KeyboardAvoidingView
          style={styles.sheetBackdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={closeUploadSheet} />
          <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom + hs(16), hs(24)) }]}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Upload File</Text>
              <TouchableOpacity onPress={closeUploadSheet} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <MaterialIcons name="close" size={fs(22)} color={Colors.primaryFontColor} />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={{ flexGrow: 1, paddingBottom: hs(24) }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.sheetLabel}>Patient <Text style={styles.asterisk}>*</Text></Text>
              <TouchableOpacity
                style={styles.sheetField}
                activeOpacity={0.85}
                onPress={() => setShowUploadMembers((p) => !p)}
              >
                <Text style={styles.sheetFieldText} numberOfLines={1}>{uploadMemberName}</Text>
                <MaterialIcons
                  name={showUploadMembers ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                  size={fs(20)}
                  color={Colors.primaryColor}
                />
              </TouchableOpacity>

              {showUploadMembers && (
                <View style={styles.sheetMemberList}>
                  <ScrollView nestedScrollEnabled bounces={false} style={{ maxHeight: hs(160) }}>
                    {familyList.map((mem) => {
                      const active = String(mem.id) === String(uploadMemberId);
                      const relation = getMemberRelationLabel(mem);
                      return (
                        <TouchableOpacity
                          key={`up-mem-${mem.id}`}
                          style={[styles.memberDropdownMenuItem, active && styles.memberDropdownMenuItemActive]}
                          onPress={() => {
                            setUploadMemberId(String(mem.id));
                            setShowUploadMembers(false);
                          }}
                        >
                          <View style={styles.menuItemTextRow}>
                            <Text
                              style={[styles.memberDropdownMenuItemText, active && styles.memberDropdownMenuItemTextActive]}
                              numberOfLines={1}
                            >
                              {getMemberDisplayName(mem)}
                            </Text>
                            {!!relation && (
                              <View style={[styles.relationBadgeSmall, active && styles.relationBadgeSmallActive]}>
                                <Text style={[styles.relationBadgeSmallText, active && styles.relationBadgeSmallTextActive]}>
                                  {relation}
                                </Text>
                              </View>
                            )}
                          </View>
                          {active && <MaterialIcons name="check" size={fs(18)} color={Colors.white} />}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}

              <Text style={styles.sheetLabel}>File Title <Text style={styles.asterisk}>*</Text></Text>
              <TextInput
                style={styles.sheetInput}
                value={uploadTitle}
                onChangeText={(t) => {
                  setUploadTitle(t);
                  setUploadError('');
                }}
                placeholder="Enter file title (e.g. Blood Test Report)"
                placeholderTextColor="#94A3B8"
                maxLength={60}
              />

              <Text style={styles.sheetLabel}>File <Text style={styles.asterisk}>*</Text></Text>
              {pickedFile ? (
                <View style={styles.pickedFileRow}>
                  <MaterialIcons
                    name={pickedFile.mimeType.startsWith('image') ? 'image' : 'insert-drive-file'}
                    size={fs(22)}
                    color={Colors.primaryColor}
                  />
                  <Text style={styles.pickedFileName} numberOfLines={1}>{pickedFile.name}</Text>
                  <TouchableOpacity onPress={() => setPickedFile(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <MaterialIcons name="cancel" size={fs(20)} color="#94A3B8" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.pickRow}>
                  <TouchableOpacity style={styles.pickOption} onPress={pickFromCamera} activeOpacity={0.85}>
                    <MaterialIcons name="photo-camera" size={fs(22)} color={Colors.primaryColor} />
                    <Text style={styles.pickOptionText}>Camera</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.pickOption} onPress={pickFromGallery} activeOpacity={0.85}>
                    <MaterialIcons name="photo-library" size={fs(22)} color={Colors.primaryColor} />
                    <Text style={styles.pickOptionText}>Gallery</Text>
                  </TouchableOpacity>
                  {!!DocumentPicker && (
                    <TouchableOpacity style={styles.pickOption} onPress={pickDocument} activeOpacity={0.85}>
                      <MaterialIcons name="description" size={fs(22)} color={Colors.primaryColor} />
                      <Text style={styles.pickOptionText}>Document</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {!!uploadError && <Text style={styles.uploadErrorText}>{uploadError}</Text>}

              <View style={styles.sheetActions}>
                <TouchableOpacity style={styles.sheetCancelBtn} onPress={closeUploadSheet} disabled={isUploading} activeOpacity={0.85}>
                  <Text style={styles.sheetCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.sheetSubmitBtn, isUploading && { opacity: 0.7 }]}
                  onPress={handleUpload}
                  disabled={isUploading}
                  activeOpacity={0.85}
                >
                  {isUploading ? (
                    <ActivityIndicator size="small" color={Colors.white} />
                  ) : (
                    <Text style={styles.sheetSubmitText}>Upload</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgColor,
  },
  // Unified Top Filter Section: Search bar and Member dropdown share one seamless white card surface
  topFilterSection: {
    backgroundColor: Colors.white,
    paddingHorizontal: ws(16),
    paddingTop: hs(14),
    paddingBottom: hs(14),
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderColor,
    zIndex: 1000,
    elevation: 8,
  },
  memberDropdownSection: {
    marginTop: hs(12),
    position: 'relative',
    zIndex: 1000,
  },
  dropdownLabel: {
    fontSize: fs(13),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
    marginBottom: hs(6),
  },
  memberDropdownContainer: {
    position: 'relative',
    zIndex: 1000,
  },
  memberDropdownField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderRadius: fs(12),
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    paddingHorizontal: ws(14),
    height: hs(48),
  },
  memberDropdownFieldOpen: {
    borderColor: Colors.primaryColor,
  },
  memberDropdownFieldText: {
    fontSize: fs(14),
    ...TYPOGRAPHY.medium,
    color: Colors.primaryFontColor,
    flex: 1,
    marginRight: ws(8),
  },
  memberDropdownMenuCard: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: hs(4),
    backgroundColor: Colors.white,
    borderRadius: fs(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: ws(6),
    shadowColor: Colors.navy,
    shadowOffset: { width: 0, height: hs(4) },
    shadowOpacity: 0.12,
    shadowRadius: fs(10),
    elevation: 12,
    zIndex: 1001,
  },
  memberDropdownMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: hs(11),
    paddingHorizontal: ws(12),
    borderRadius: fs(8),
    marginBottom: hs(2),
  },
  memberDropdownMenuItemActive: {
    backgroundColor: Colors.primaryColor,
  },
  memberDropdownMenuItemText: {
    fontSize: fs(13.5),
    ...TYPOGRAPHY.medium,
    color: Colors.slate_1E293B,
  },
  memberDropdownMenuItemTextActive: {
    ...TYPOGRAPHY.bold,
    color: Colors.white,
  },
  menuItemTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(8),
    flex: 1,
  },
  relationBadgeSmall: {
    paddingHorizontal: ws(6),
    paddingVertical: hs(2),
    borderRadius: fs(6),
  },
  relationBadgeSmallSelf: {
    backgroundColor: '#DCFCE7',
  },
  relationBadgeSmallOther: {
    backgroundColor: '#E0F2FE',
  },
  relationBadgeSmallActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  relationBadgeSmallText: {
    fontSize: fs(10),
    ...TYPOGRAPHY.bold,
  },
  relationBadgeSmallTextSelf: {
    color: '#16A34A',
  },
  relationBadgeSmallTextOther: {
    color: '#0284C7',
  },
  relationBadgeSmallTextActive: {
    color: Colors.white,
  },
  dropdownBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  uploadBar: {
    paddingHorizontal: ws(16),
    paddingTop: hs(12),
  },
  uploadButton: {
    height: hs(46),
    borderRadius: fs(12),
    backgroundColor: Colors.primaryColor,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ws(8),
  },
  uploadButtonText: {
    fontSize: fs(14),
    ...TYPOGRAPHY.bold,
    color: Colors.white,
  },
  listContent: {
    flexGrow: 1,
    padding: ws(16),
    paddingBottom: hs(40),
  },
  fileCard: {
    marginBottom: hs(12),
    borderRadius: fs(12),
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    padding: ws(14),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  folderIconBox: {
    width: ws(42),
    height: hs(42),
    borderRadius: fs(10),
    backgroundColor: Colors.lightBlueTint,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: ws(12),
  },
  info: {
    flex: 1,
  },
  fileTitle: {
    fontSize: fs(14.5),
    ...TYPOGRAPHY.bold,
    color: Colors.slate_1E293B,
    marginBottom: hs(3),
  },
  patientSubtext: {
    fontSize: fs(12.5),
    ...TYPOGRAPHY.medium,
    color: Colors.slate_64748B,
    marginBottom: hs(2),
  },
  dateSubtext: {
    fontSize: fs(12),
    ...TYPOGRAPHY.regular,
    color: Colors.slate_64748B,
  },
  actionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(8),
    marginLeft: ws(8),
  },
  actionBtnBlue: {
    width: ws(36),
    height: ws(36),
    aspectRatio: 1,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: Colors.lightBlueTint,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnOrange: {
    width: ws(36),
    height: ws(36),
    aspectRatio: 1,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: Colors.lightBlueTint,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Empty Search View
  emptySearchContainer: {
    paddingTop: hs(40),
    paddingHorizontal: ws(24),
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptySearchIconBox: {
    width: ws(64),
    height: ws(64),
    borderRadius: ws(32),
    backgroundColor: Colors.lightBlueTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hs(14),
  },
  emptySearchTitle: {
    fontSize: fs(16),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
    marginBottom: hs(6),
    textAlign: 'center',
  },
  emptySearchSubtitle: {
    fontSize: fs(13),
    ...TYPOGRAPHY.regular,
    color: Colors.slate_64748B,
    textAlign: 'center',
    lineHeight: hs(19),
    marginBottom: hs(16),
  },
  clearSearchBtn: {
    paddingHorizontal: ws(18),
    paddingVertical: hs(8),
    borderRadius: fs(20),
    backgroundColor: Colors.primaryColor,
  },
  clearSearchBtnText: {
    fontSize: fs(13),
    ...TYPOGRAPHY.bold,
    color: Colors.white,
  },

  // Upload Sheet
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: fs(24),
    borderTopRightRadius: fs(24),
    paddingTop: hs(12),
    paddingHorizontal: ws(20),
    maxHeight: '85%',
  },
  sheetHandle: {
    width: ws(40),
    height: hs(4),
    borderRadius: fs(2),
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: hs(12),
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: hs(8),
  },
  sheetTitle: {
    fontSize: fs(17),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
  },
  sheetLabel: {
    fontSize: fs(12),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
    marginTop: hs(12),
    marginBottom: hs(6),
  },
  asterisk: {
    color: '#DC2626',
  },
  sheetField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: fs(10),
    borderWidth: 1,
    borderColor: Colors.borderColor,
    paddingHorizontal: ws(14),
    height: hs(46),
  },
  sheetFieldText: {
    flex: 1,
    marginRight: ws(8),
    fontSize: fs(13.5),
    ...TYPOGRAPHY.medium,
    color: Colors.primaryFontColor,
  },
  sheetMemberList: {
    marginTop: hs(4),
    borderRadius: fs(10),
    borderWidth: 1,
    borderColor: Colors.borderColor,
    padding: ws(6),
    maxHeight: hs(180),
  },
  sheetInput: {
    borderRadius: fs(10),
    borderWidth: 1,
    borderColor: Colors.borderColor,
    paddingHorizontal: ws(14),
    height: hs(46),
    fontSize: fs(13.5),
    ...TYPOGRAPHY.regular,
    color: Colors.primaryFontColor,
  },
  pickRow: {
    flexDirection: 'row',
    gap: ws(10),
  },
  pickOption: {
    flex: 1,
    height: hs(64),
    borderRadius: fs(12),
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.primaryColor,
    backgroundColor: Colors.lightBlueTint,
    alignItems: 'center',
    justifyContent: 'center',
    gap: hs(2),
  },
  pickOptionText: {
    fontSize: fs(12),
    ...TYPOGRAPHY.medium,
    color: Colors.primaryColor,
  },
  pickedFileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(10),
    borderRadius: fs(10),
    backgroundColor: Colors.lightBlueTint,
    paddingHorizontal: ws(12),
    height: hs(48),
  },
  pickedFileName: {
    flex: 1,
    fontSize: fs(13),
    ...TYPOGRAPHY.medium,
    color: Colors.primaryFontColor,
  },
  uploadErrorText: {
    marginTop: hs(8),
    fontSize: fs(12),
    ...TYPOGRAPHY.regular,
    color: '#DC2626',
  },
  sheetActions: {
    flexDirection: 'row',
    gap: ws(12),
    marginTop: hs(18),
  },
  sheetCancelBtn: {
    flex: 1,
    height: hs(48),
    borderRadius: fs(12),
    borderWidth: 1,
    borderColor: Colors.borderColor,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetCancelText: {
    fontSize: fs(14),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
  },
  sheetSubmitBtn: {
    flex: 1,
    height: hs(48),
    borderRadius: fs(12),
    backgroundColor: Colors.primaryColor,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetSubmitText: {
    fontSize: fs(14),
    ...TYPOGRAPHY.bold,
    color: Colors.white,
  },
});
