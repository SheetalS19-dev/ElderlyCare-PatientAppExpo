import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AppCard,
  AppHeader,
  DocumentActionModal,
  EmptyState,
  ErrorState,
  LoadingIndicator,
  SearchBox,
} from '../../components';
import { ApiEndpoints, Colors, Typography } from '../../constants';
import { useAuth } from '../../context/AuthContext';
import { useDebounce } from '../../hooks';
import type { RootStackParamList } from '../../navigation/types';
import { useGetFamilyMembersQuery } from '../../redux/apis/bookingApi';
import { useGetPrescriptionsQuery } from '../../redux/apis/prescriptionApi';
import type { FamilyMemberModel, PrescriptionModel } from '../../types';
import { DateTimeUtils, formatDoctorName, showToast, ws, hs, fs, TYPOGRAPHY } from '../../utils';
import {
  downloadPrescriptionPdf,
  sharePrescriptionPdf,
  viewPrescriptionPdf,
} from '../../utils/prescriptionPdf';

type Props = NativeStackScreenProps<RootStackParamList, 'PrescriptionList'>;

const formatRxDateTime = (createdAt?: string) => {
  if (!createdAt) return '--';
  const str = String(createdAt).trim();
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

export const PrescriptionListScreen = ({ navigation, route }: Props) => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const uid = String(user?.id ?? (user as any)?.user_id ?? '');

  const initialFamilyId = route.params?.familyMemberId ? String(route.params.familyMemberId) : '';
  const [selectedFamilyId, setSelectedFamilyId] = useState<string>(initialFamilyId);

  React.useEffect(() => {
    if (route.params?.familyMemberId) {
      setSelectedFamilyId(String(route.params.familyMemberId));
    }
  }, [route.params?.familyMemberId]);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

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
    return list;
  }, [familyData]);

  const filteredFamilyList = useMemo(() => {
    if (!familyList || familyList.length === 0) return [];
    const selfFName = (user?.f_name || '').trim().toLowerCase();
    const selfLName = (user?.l_name || '').trim().toLowerCase();
    const selfPhone = (user?.phone || '').trim();
    const mainUserId = String(user?.id ?? uid ?? '');

    return familyList.filter((m) => {
      const isSelf =
        (m as any).is_self === true ||
        (m.relationship || '').toLowerCase() === 'self' ||
        String(m.id) === mainUserId ||
        (selfFName &&
          m.f_name?.trim().toLowerCase() === selfFName &&
          (m.l_name?.trim().toLowerCase() === selfLName || !m.l_name) &&
          (m.phone?.trim() === selfPhone || !m.phone || (m.relationship || '').toLowerCase() === 'self'));
      return !isSelf;
    });
  }, [familyList, user, uid]);

  const { data: rawData, isLoading, isError, refetch } = useGetPrescriptionsQuery(
    {
      userId: uid,
      patientId: selectedFamilyId,
    },
    { skip: !uid }
  );

  const [selectedPrescriptionItem, setSelectedPrescriptionItem] = useState<PrescriptionModel | null>(null);
  const [isActionModalVisible, setIsActionModalVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMsg, setProcessingMsg] = useState('Preparing prescription...');

  const prescriptions: PrescriptionModel[] = useMemo(() => {
    let list: PrescriptionModel[] = [];
    if (Array.isArray(rawData)) list = rawData;
    else if (Array.isArray((rawData as any)?.data)) list = (rawData as any).data;
    else if (Array.isArray((rawData as any)?.response)) list = (rawData as any).response;

    if (!debouncedSearch.trim()) return list;

    const q = debouncedSearch.toLowerCase().trim();
    return list.filter((item: any) => {
      const docName = `${item.doctor_f_name ?? ''} ${item.doctor_l_name ?? ''}`.toLowerCase();
      const patientName = `${item.patient_f_name ?? ''} ${item.patient_l_name ?? ''}`.toLowerCase();
      const clinicName = (item.clinic_name ?? item.clinicName ?? '').toLowerCase();
      const rxId = String(item.id ?? '').toLowerCase();
      const dateStr = String(item.created_at ?? item.date ?? '').toLowerCase();
      return (
        docName.includes(q) ||
        patientName.includes(q) ||
        clinicName.includes(q) ||
        rxId.includes(q) ||
        dateStr.includes(q)
      );
    });
  }, [rawData, debouncedSearch]);


  const fetchPrescriptionData = async (item: PrescriptionModel) => {
    if (!item.id) {
      throw new Error('Prescription unavailable');
    }

    const response = await fetch(`${ApiEndpoints.getPrescriptionByAppIdUrl}/${item.id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch prescription details');
    }

    const result = await response.json();
    let prescription = result?.data;
    if (Array.isArray(prescription)) {
      prescription = prescription[0];
    }
    if (!prescription) {
      prescription = item;
    }

    const doctorName = formatDoctorName(
      prescription.doctor_f_name || item.doctor_f_name,
      prescription.doctor_l_name || item.doctor_l_name
    );
    const patientName = `${prescription.patient_f_name ?? item.patient_f_name ?? ''} ${prescription.patient_l_name ?? item.patient_l_name ?? ''}`.trim();
    const prescriptionItem = item as any;

    const appId = prescription.appointment_id || item.appointment_id;
    const clinicId = prescription.clinic_id || (item as any).clinic_id;

    let clinicDetails: any = null;

    if (appId) {
      try {
        const invRes = await fetch(`${ApiEndpoints.getInvoiceByAppIdUrl}/${appId}`);
        if (invRes.ok) {
          const invJson = await invRes.json();
          clinicDetails = invJson?.data ?? invJson?.response ?? invJson;
          if (Array.isArray(clinicDetails)) clinicDetails = clinicDetails[0];
        }
      } catch (err) {
        console.warn('Could not fetch invoice for prescription clinic info:', err);
      }
    }

    if ((!clinicDetails?.clinic_image && !clinicDetails?.image) && clinicId) {
      try {
        const clRes = await fetch(`${ApiEndpoints.getClinicByIdUrl}/${clinicId}`);
        if (clRes.ok) {
          const clJson = await clRes.json();
          const clData = clJson?.data ?? clJson?.response ?? clJson;
          const targetClinic = Array.isArray(clData) ? clData[0] : clData;
          if (targetClinic) {
            clinicDetails = {
              ...clinicDetails,
              clinic_name: targetClinic.title || targetClinic.name || clinicDetails?.clinic_name,
              clinic_address: targetClinic.address || clinicDetails?.clinic_address,
              clinic_image: targetClinic.image || targetClinic.clinic_image || clinicDetails?.clinic_image,
              clinic_email: targetClinic.email || clinicDetails?.clinic_email,
              clinic_phone_1: targetClinic.phone_1 || targetClinic.phone || clinicDetails?.clinic_phone_1,
              clinic_phone_2: targetClinic.phone_2 || clinicDetails?.clinic_phone_2,
            };
          }
        }
      } catch (err) {
        console.warn('Could not fetch clinic details by clinic_id:', err);
      }
    }

    const info = {
      doctorName,
      patientName,
      patientId: item.patient_id ?? prescription.patient_id,
      clinicName: clinicDetails?.clinic_name ?? prescription.clinic_name ?? prescriptionItem.clinic_name ?? prescriptionItem.clinicName ?? (prescription.clinic as any)?.name ?? 'Clinic',
      clinicAddress: clinicDetails?.clinic_address ?? prescription.clinic_address ?? prescriptionItem.clinic_address ?? prescriptionItem.clinicAddress ?? (prescription.clinic as any)?.address ?? '',
      clinicPhone1: clinicDetails?.clinic_phone_1 ?? prescription.clinic_phone_1 ?? prescriptionItem.clinic_phone_1 ?? prescriptionItem.clinicPhone1 ?? (prescription.clinic as any)?.phone_1 ?? '',
      clinicPhone2: clinicDetails?.clinic_phone_2 ?? prescription.clinic_phone_2 ?? prescriptionItem.clinic_phone_2 ?? prescriptionItem.clinicPhone2 ?? (prescription.clinic as any)?.phone_2 ?? '',
      clinicEmail: clinicDetails?.clinic_email ?? prescription.clinic_email ?? prescriptionItem.clinic_email ?? prescriptionItem.clinicEmail ?? (prescription.clinic as any)?.email ?? '',
      clinicImage: clinicDetails?.clinic_image ?? clinicDetails?.image ?? prescription.clinic_image ?? prescriptionItem.clinic_image ?? prescriptionItem.clinicImage ?? (prescription.clinic as any)?.image ?? (prescription.clinic as any)?.clinic_image,
      generatedAt: prescription.created_at || item.created_at,
    };

    return { prescription, info };
  };

  const handleOpenActionModal = (item: PrescriptionModel) => {
    setSelectedPrescriptionItem(item);
    setIsActionModalVisible(true);
  };

  const handleView = async (item?: PrescriptionModel | null) => {
    const target = item || selectedPrescriptionItem;
    if (!target) return;

    try {
      setIsProcessing(true);
      setProcessingMsg('Opening prescription preview...');
      const { prescription, info } = await fetchPrescriptionData(target);
      setIsActionModalVisible(false);
      await viewPrescriptionPdf(prescription, info);
    } catch (error) {
      console.error('View prescription error:', error);
      showToast('Could not view prescription');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = async (item?: PrescriptionModel | null) => {
    const target = item || selectedPrescriptionItem;
    if (!target) return;

    try {
      setIsProcessing(true);
      setProcessingMsg('Generating prescription PDF...');
      const { prescription, info } = await fetchPrescriptionData(target);
      const res = await downloadPrescriptionPdf(prescription, info);
      setIsActionModalVisible(false);
      if (res?.success) {
        showToast('Prescription downloaded successfully!');
      }
    } catch (error) {
      console.error('Download prescription error:', error);
      showToast('Could not download prescription PDF');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleShare = async (item?: PrescriptionModel | null) => {
    const target = item || selectedPrescriptionItem;
    if (!target) return;

    try {
      setIsProcessing(true);
      setProcessingMsg('Preparing prescription to share...');
      const { prescription, info } = await fetchPrescriptionData(target);
      setIsActionModalVisible(false);
      await sharePrescriptionPdf(prescription, info);
    } catch (error) {
      console.error('Share prescription error:', error);
      showToast('Could not share prescription PDF');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Digital Prescriptions" onBackPress={() => navigation.goBack()} />

      {/* Family Member Filter Bar */}
      <View style={styles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <TouchableOpacity
            style={[styles.filterChip, selectedFamilyId === '' && styles.filterChipActive]}
            onPress={() => setSelectedFamilyId('')}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterChipText, selectedFamilyId === '' && styles.filterChipTextActive]}>
              All
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, selectedFamilyId === '0' && styles.filterChipActive]}
            onPress={() => setSelectedFamilyId('0')}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterChipText, selectedFamilyId === '0' && styles.filterChipTextActive]}>
              Self ({user?.f_name || 'Me'})
            </Text>
          </TouchableOpacity>

          {filteredFamilyList.map((m) => {
            const memberId = String(m.id);
            const isSelected = selectedFamilyId === memberId;
            return (
              <TouchableOpacity
                key={`fam-rx-${memberId}`}
                style={[styles.filterChip, isSelected && styles.filterChipActive]}
                onPress={() => setSelectedFamilyId(memberId)}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                  {m.f_name} {m.l_name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchWrapper}>
        <SearchBox
          value={search}
          onChangeText={setSearch}
          placeholder="Search doctor, patient, clinic or ID..."
        />
      </View>

      {isLoading ? (
        <LoadingIndicator />
      ) : isError ? (
        <ErrorState message="Couldn't load prescriptions" onRetry={refetch} />
      ) : (
        <FlatList
          data={prescriptions}
          keyExtractor={(item, index) => `rx-${item.id ?? index}`}
          contentContainerStyle={[
            styles.listContent,
            { flexGrow: 1, paddingBottom: Math.max(insets.bottom + 20, 40) },
          ]}
          ListEmptyComponent={
            <EmptyState
              message={debouncedSearch.trim() ? "No matching prescriptions" : "No prescriptions found"}
              subtitle={debouncedSearch.trim() ? "Try searching with a different keyword or doctor name" : "Doctor issued prescriptions will appear here"}
            />
          }
          renderItem={({ item }) => {
            const patientFullName =
              `${item.patient_f_name ?? ''} ${item.patient_l_name ?? ''}`.trim() ||
              (item as any).patient_name ||
              (item as any).patientName ||
              user?.f_name ||
              'Amit Singh';

            const displayId = item.id ? `#${item.id}` : (item as any).prescription_id ? `#${(item as any).prescription_id}` : '';
            const doctName =
              formatDoctorName(item.doctor_f_name, item.doctor_l_name) ||
              (item as any).doctor_name ||
              'Dr. Doctor';

            const formattedDateTime = formatRxDateTime(item.created_at || (item as any).date);

            return (
              <AppCard style={styles.card}>
                <TouchableOpacity
                  style={styles.cardTouchable}
                  activeOpacity={0.85}
                  onPress={() => handleOpenActionModal(item)}
                >
                  {/* Prescription Info */}
                  <View style={styles.info}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {patientFullName} {displayId}
                    </Text>
                    <Text style={styles.cardMetaText} numberOfLines={1}>
                      Doctor: {doctName}
                    </Text>
                    <Text style={styles.cardMetaText} numberOfLines={1}>
                      Date: {formattedDateTime}
                    </Text>
                  </View>

                  {/* Quick Actions */}
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={styles.actionBtnBlue}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      onPress={() => handleView(item)}
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
                </TouchableOpacity>
              </AppCard>
            );
          }}
        />
      )}

      {/* Document Action Modal */}
      <DocumentActionModal
        visible={isActionModalVisible}
        onClose={() => setIsActionModalVisible(false)}
        title={`Prescription #${selectedPrescriptionItem?.id ?? ''}`}
        subtitle={`Prescribed by ${formatDoctorName(selectedPrescriptionItem?.doctor_f_name, selectedPrescriptionItem?.doctor_l_name)}`}
        onView={() => handleView(selectedPrescriptionItem)}
        onDownload={() => handleDownload(selectedPrescriptionItem)}
        onShare={() => handleShare(selectedPrescriptionItem)}
        isLoading={isProcessing}
        loadingMessage={processingMsg}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgColor,
  },
  listContent: {
    padding: ws(16),
  },
  summaryCard: {
    padding: ws(16),
    borderRadius: fs(16),
    marginBottom: hs(16),
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rxIconCircle: {
    width: ws(48),
    height: ws(48),
    aspectRatio: 1,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: ws(14),
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  summaryInfo: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: fs(Typography.fontSize.base),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
  },
  summarySubtitle: {
    marginTop: hs(2),
    fontSize: fs(Typography.fontSize.xs),
    ...TYPOGRAPHY.medium,
    color: Colors.secondaryFontColor,
  },
  card: {
    marginBottom: hs(12),
    padding: ws(14),
    borderRadius: fs(16),
  },
  cardTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: ws(46),
    height: ws(46),
    aspectRatio: 1,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: ws(12),
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  rxTag: {
    fontSize: fs(16),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryColor,
  },
  info: {
    flex: 1,
    marginRight: ws(8),
  },
  cardTitle: {
    fontSize: fs(15),
    ...TYPOGRAPHY.bold,
    color: '#0F172A',
    marginBottom: hs(4),
  },
  cardMetaText: {
    fontSize: fs(13),
    ...TYPOGRAPHY.medium,
    color: '#64748B',
    marginBottom: hs(2),
  },
  doctorHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hs(4),
  },
  doctorName: {
    flex: 1,
    fontSize: fs(Typography.fontSize.sm),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
  },
  rxIdBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: ws(8),
    paddingVertical: hs(2),
    borderRadius: fs(8),
    marginLeft: ws(6),
  },
  rxIdText: {
    fontSize: fs(10),
    ...TYPOGRAPHY.bold,
    color: Colors.secondaryFontColor,
  },
  patientName: {
    fontSize: fs(Typography.fontSize.xs),
    ...TYPOGRAPHY.regular,
    color: Colors.secondaryFontColor,
  },
  patientValue: {
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
  },
  dateText: {
    marginTop: hs(4),
    fontSize: fs(11),
    ...TYPOGRAPHY.regular,
    color: '#94A3B8',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(8),
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
  searchWrapper: {
    paddingHorizontal: ws(16),
    paddingTop: hs(12),
    paddingBottom: hs(4),
  },
  filterSection: {
    paddingVertical: hs(10),
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  filterScroll: {
    paddingHorizontal: ws(16),
    gap: ws(8),
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(5),
    paddingHorizontal: ws(14),
    paddingVertical: hs(7),
    borderRadius: fs(20),
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: Colors.primaryColor,
    borderColor: Colors.primaryColor,
  },
  filterChipText: {
    fontSize: fs(12),
    ...TYPOGRAPHY.medium,
    color: Colors.primaryFontColor,
  },
  filterChipTextActive: {
    color: Colors.white,
    ...TYPOGRAPHY.bold,
  },
});

