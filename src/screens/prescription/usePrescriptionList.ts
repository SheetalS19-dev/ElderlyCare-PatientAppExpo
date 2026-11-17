import type { RouteProp } from '@react-navigation/native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useMemo, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ApiEndpoints } from '../../constants';
import { useAuth } from '../../context/AuthContext';
import { useDebounce } from '../../hooks';
import type { RootStackParamList } from '../../navigation/types';
import { useGetFamilyMembersQuery } from '../../redux/apis/bookingApi';
import { useGetPrescriptionsQuery } from '../../redux/apis/prescriptionApi';
import type { FamilyMemberModel, PrescriptionModel } from '../../types';
import { DateTimeUtils, formatDoctorName, showToast } from '../../utils';
import {
  downloadPrescriptionPdf,
  sharePrescriptionPdf,
  viewPrescriptionPdf,
} from '../../utils/prescriptionPdf';

export const formatRxDateTime = (createdAt?: string) => {
  if (!createdAt) return '--';
  const str = String(createdAt).trim();
  return DateTimeUtils.getDataFormatWithTime(str) || str;
};

export const usePrescriptionList = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'PrescriptionList'>>();
  const { user } = useAuth();
  const uid = String(user?.id ?? (user as any)?.user_id ?? '');

  const initialFamilyId = route.params?.familyMemberId ? String(route.params.familyMemberId) : '';
  const [selectedFamilyId, setSelectedFamilyId] = useState<string>(initialFamilyId);

  useEffect(() => {
    if (route.params?.familyMemberId) {
      setSelectedFamilyId(String(route.params.familyMemberId));
    }
  }, [route.params?.familyMemberId]);

  const [search, setSearch] = useState('');
  const [downloadingId, setDownloadingId] = useState<number | string | null>(null);
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
      setDownloadingId(target.id);
      setIsProcessing(true);
      setProcessingMsg('Generating prescription PDF...');
      const { prescription, info } = await fetchPrescriptionData(target);
      const res = await downloadPrescriptionPdf(prescription, info);
      setIsActionModalVisible(false);
      if (res?.success) {
        showToast('Prescription downloaded successfully!');
      } else {
        showToast('Could not save prescription to Downloads');
      }
    } catch (error) {
      console.error('Download prescription error:', error);
      showToast('Could not download prescription PDF');
    } finally {
      setIsProcessing(false);
      setDownloadingId(null);
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

  return {
    navigation,
    insets,
    search,
    setSearch,
    selectedFamilyId,
    setSelectedFamilyId,
    downloadingId,
    familyList,
    filteredFamilyList,
    prescriptions,
    isLoading,
    isError,
    refetch,
    selectedPrescriptionItem,
    isActionModalVisible,
    setIsActionModalVisible,
    isProcessing,
    processingMsg,
    handleOpenActionModal,
    handleView,
    handleDownload,
    handleShare,
  };
};
