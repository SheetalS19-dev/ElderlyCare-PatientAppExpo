import type { RouteProp } from '@react-navigation/native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { Linking } from 'react-native';
import type { RootStackParamList } from '../../navigation/types';
import { useGetClinicByIdQuery } from '../../redux/apis/clinicApi';
import { useGetDoctorsByClinicIdQuery } from '../../redux/apis/doctorApi';
import type { ClinicModel, DoctorModel } from '../../types';

export const useClinic = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'Clinic'>>();
  const { clinicId } = route.params ?? {};

  const [descReadMore, setDescReadMore] = useState(false);
  const [hoursExpanded, setHoursExpanded] = useState(true);

  const {
    data: clinicData,
    isLoading: isClinicLoading,
    isError: isClinicError,
    refetch: refetchClinic,
  } = useGetClinicByIdQuery(clinicId, { skip: !clinicId });

  const clinic: ClinicModel | null = useMemo(() => {
    if (!clinicData) return null;
    if (Array.isArray(clinicData)) return clinicData[0] ?? null;
    if (typeof clinicData === 'object' && !('data' in clinicData)) return clinicData;
    const inner = clinicData?.data;
    if (Array.isArray(inner)) return inner[0] ?? null;
    return inner ?? null;
  }, [clinicData]);

  const numericClinicId = useMemo(() => {
    if (clinic?.id != null) return String(clinic.id);
    return clinicId && /^\d+$/.test(String(clinicId).trim()) ? String(clinicId).trim() : '';
  }, [clinic?.id, clinicId]);

  const { data: doctorsData } = useGetDoctorsByClinicIdQuery(numericClinicId, {
    skip: !numericClinicId,
  });

  const doctors: DoctorModel[] = useMemo(() => {
    if (Array.isArray(doctorsData)) return doctorsData;
    if (Array.isArray(doctorsData?.data)) return doctorsData.data;
    return [];
  }, [doctorsData]);

  const openingHours = useMemo(() => {
    if (!clinic?.opening_hours) return [];
    try {
      const parsed =
        typeof clinic.opening_hours === 'string'
          ? JSON.parse(clinic.opening_hours)
          : clinic.opening_hours;

      if (!parsed || typeof parsed !== 'object') return [];

      return Object.entries(parsed).map(([rawDay, rawTime]) => {
        const cleanedTime = String(rawTime ?? '')
          .replace(/[\u00A0\u1680\u2000-\u200B\u202F\u205F\u3000\uFEFF\t\r\n]/g, ' ')
          .trim()
          .replace(/\s+/g, ' ')
          .replace(/\s*[-–—]\s*/g, ' - ')
          .replace(/\s+to\s+/gi, ' - ')
          .replace(/(\d+)\s+(am|pm)/gi, '$1$2')
          .trim();

        const cleanedDay = String(rawDay ?? '')
          .replace(/[\u00A0\u1680\u2000-\u200B\u202F\u205F\u3000\uFEFF\t\r\n]/g, ' ')
          .trim();

        const isClosed = !cleanedTime || /close|off|na|none/i.test(cleanedTime);

        return {
          day: cleanedDay ? cleanedDay.charAt(0).toUpperCase() + cleanedDay.slice(1) : '',
          time: isClosed ? 'Closed' : cleanedTime,
          isClosed,
        };
      });
    } catch {
      return [];
    }
  }, [clinic?.opening_hours]);

  const handleOpenUrl = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      }
    } catch (e) {
      console.warn('Cannot open URL:', url, e);
    }
  };

  const handleOpenDirections = () => {
    if (clinic?.latitude && clinic?.longitude) {
      handleOpenUrl(`http://maps.google.com/maps?daddr=${clinic.latitude},${clinic.longitude}`);
    } else if (clinic?.address) {
      const query = encodeURIComponent(`${clinic.title || ''}, ${clinic.address}`);
      handleOpenUrl(`https://www.google.com/maps/search/?api=1&query=${query}`);
    }
  };

  return {
    navigation,
    clinicId,
    clinic,
    doctors,
    openingHours,
    isClinicLoading,
    isClinicError,
    refetchClinic,
    descReadMore,
    setDescReadMore,
    hoursExpanded,
    setHoursExpanded,
    handleOpenUrl,
    handleOpenDirections,
  };
};
