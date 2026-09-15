import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import {
  FlatList,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  AppCard,
  AppHeader,
  EmptyState,
  ErrorState,
  LoadingIndicator,
  SearchBox,
} from '../../components';
import { Colors, Typography } from '../../constants';
import { useAuth } from '../../context/AuthContext';
import { useDebounce } from '../../hooks';
import type { RootStackParamList } from '../../navigation/types';
import { useGetFamilyMembersQuery } from '../../redux/apis/bookingApi';
import { useGetPatientFilesQuery } from '../../redux/apis/patientFilesApi';
import type { FamilyMemberModel, PatientFileModel } from '../../types';
import { DateTimeUtils, downloadAndSaveFile, getImageUrl, showToast, ws, hs, fs, TYPOGRAPHY } from '../../utils';

type Props = NativeStackScreenProps<RootStackParamList, 'PatientFile'>;

export const PatientFileScreen = ({ navigation, route }: Props) => {
  const { user } = useAuth();
  const uid = String(user?.id ?? (user as any)?.user_id ?? '');

  const initialMemberId = route.params?.familyMemberId ? String(route.params.familyMemberId) : 'all';
  const [search, setSearch] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState<string>(initialMemberId);
  const debouncedSearch = useDebounce(search, 400);

  const { data: familyData } = useGetFamilyMembersQuery(uid, {
    skip: !uid,
  });

  const familyList: FamilyMemberModel[] = useMemo(() => {
    let list: FamilyMemberModel[] = [];
    if (Array.isArray(familyData)) {
      list = familyData;
    } else if (Array.isArray((familyData as any)?.data)) {
      list = (familyData as any).data;
    } else if (Array.isArray((familyData as any)?.data?.data)) {
      list = (familyData as any).data.data;
    }

    if (user && (user.f_name || user.id)) {
      const selfExists = list.some(
        (m) => String(m.id) === String(user.id) || (m.f_name === user.f_name && m.phone === user.phone)
      );
      if (!selfExists) {
        return [
          {
            id: user.id,
            user_id: user.id,
            f_name: user.f_name,
            l_name: user.l_name,
            name: `${user.f_name ?? ''} ${user.l_name ?? ''}`.trim() || 'Self',
            phone: user.phone,
          },
          ...list,
        ];
      }
    }
    return list;
  }, [familyData, user]);

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

    if (selectedMemberId === 'all') {
      return list;
    }

    const selectedMember = familyList.find((m) => String(m.id) === String(selectedMemberId));

    return list.filter((item: any) => {
      const itemMemId = item.family_member_id ?? item.patient_id ?? item.member_id;

      // 1. Direct ID match
      if (itemMemId != null && String(itemMemId) === String(selectedMemberId)) {
        return true;
      }

      // 2. Check if selected member is Self (user)
      const isSelfSelection =
        String(selectedMemberId) === String(user?.id) ||
        (selectedMember && (selectedMember.name === 'Self' || selectedMember.f_name === user?.f_name));

      if (isSelfSelection) {
        if (!itemMemId || itemMemId === 0 || itemMemId === '0' || String(itemMemId) === String(user?.id)) {
          return true;
        }
      }

      // 3. Fallback Name / Phone match
      if (selectedMember) {
        const memName = (
          selectedMember.name || `${selectedMember.f_name ?? ''} ${selectedMember.l_name ?? ''}`
        )
          .toLowerCase()
          .trim();
        const memPhone = (selectedMember.phone ?? '').trim();

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
  }, [rawData, selectedMemberId, familyList, user]);

  const handleDownload = (item: any) => {
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
      downloadAndSaveFile(url, title);
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
    const dateObj = new Date(str);

    if (!isNaN(dateObj.getTime())) {
      const day = String(dateObj.getDate()).padStart(2, '0');
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const year = dateObj.getFullYear();

      let hours = dateObj.getHours();
      const minutes = String(dateObj.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      const hoursStr = String(hours).padStart(2, '0');

      return `${day}/${month}/${year} ${hoursStr}:${minutes} ${ampm}`;
    }

    const clean = str.split('T')[0].split(' ')[0];
    if (clean.includes('-')) {
      const parts = clean.split('-');
      if (parts.length === 3 && parts[0].length === 4) {
        return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
      }
    }

    return DateTimeUtils.getDataFormatWithTime(str) || str;
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Patient Files" onBackPress={() => navigation.goBack()} />

      {/* Member Filter Chips */}
      <View style={styles.memberFilterSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.memberScroll}
        >
          <TouchableOpacity
            style={[styles.memberChip, selectedMemberId === 'all' && styles.memberChipSelected]}
            onPress={() => setSelectedMemberId('all')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.memberChipText,
                selectedMemberId === 'all' && styles.memberChipTextSelected,
              ]}
            >
              All Members
            </Text>
          </TouchableOpacity>

          {familyList.map((mem) => {
            const isSelected = String(mem.id) === selectedMemberId;
            const displayName =
              mem.name ||
              `${mem.f_name ?? ''} ${mem.l_name ?? ''}`.trim() ||
              (String(mem.id) === String(user?.id) ? 'Self' : 'Member');

            return (
              <TouchableOpacity
                key={mem.id}
                style={[styles.memberChip, isSelected && styles.memberChipSelected]}
                onPress={() => setSelectedMemberId(String(mem.id))}
                activeOpacity={0.8}
              >
                <Text style={[styles.memberChipText, isSelected && styles.memberChipTextSelected]}>
                  {displayName}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Search Input */}
      <View style={styles.searchWrapper}>
        <SearchBox value={search} onChangeText={setSearch} placeholder="Search Files..." />
      </View>

      {isLoading ? (
        <LoadingIndicator />
      ) : isError ? (
        <ErrorState message="Couldn't load medical files" onRetry={refetch} />
      ) : (
        <FlatList
          data={files}
          keyExtractor={(item, index) => `pf-${item.id ?? index}`}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<EmptyState message="No patient files found" />}
          renderItem={({ item }) => {
            const rawTitle = (item as any).title || item.file_name || 'Medical File';
            const fileIdStr = item.id ? ` #${item.id}` : '';
            const title = `${rawTitle}${fileIdStr}`;
            const patientInfo = formatPatientName(item);
            const dateStr = formatFileDate(item);

            return (
              <AppCard style={styles.fileCard}>
                <View style={styles.row}>
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
                      <MaterialIcons name="visibility" size={18} color="#2563EB" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.actionBtnOrange}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      onPress={() => handleDownload(item)}
                      activeOpacity={0.8}
                    >
                      <MaterialIcons name="file-download" size={18} color={Colors.primaryColor} />
                    </TouchableOpacity>
                  </View>
                </View>
              </AppCard>
            );
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  memberFilterSection: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  memberScroll: {
    paddingHorizontal: ws(16),
    paddingVertical: hs(10),
    gap: ws(8),
  },
  memberChip: {
    paddingHorizontal: ws(14),
    paddingVertical: hs(7),
    borderRadius: fs(20),
    backgroundColor: '#F1F5F9',
    marginRight: ws(6),
  },
  memberChipSelected: {
    backgroundColor: Colors.primaryColor,
  },
  memberChipText: {
    fontSize: fs(13),
    ...TYPOGRAPHY.medium,
    color: '#475569',
  },
  memberChipTextSelected: {
    color: '#FFFFFF',
    ...TYPOGRAPHY.bold,
  },
  searchWrapper: {
    paddingHorizontal: ws(16),
    paddingTop: hs(12),
    paddingBottom: hs(4),
  },
  listContent: {
    flexGrow: 1,
    padding: ws(16),
    paddingBottom: hs(40),
  },
  fileCard: {
    marginBottom: hs(12),
    borderRadius: fs(12),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: ws(14),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  folderIconBox: {
    width: ws(46),
    height: hs(46),
    borderRadius: fs(10),
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: ws(12),
  },
  info: {
    flex: 1,
  },
  fileTitle: {
    fontSize: fs(15),
    ...TYPOGRAPHY.bold,
    color: '#1E293B',
    marginBottom: hs(3),
  },
  patientSubtext: {
    fontSize: fs(13),
    ...TYPOGRAPHY.regular,
    color: '#64748B',
    marginBottom: hs(2),
  },
  dateSubtext: {
    fontSize: fs(13),
    ...TYPOGRAPHY.regular,
    color: '#64748B',
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
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnOrange: {
    width: ws(36),
    height: ws(36),
    aspectRatio: 1,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
