import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import {
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader, ErrorState, SkeletonDetail } from '../../components';
import { Colors, Typography } from '../../constants';
import type { RootStackParamList } from '../../navigation/types';
import { useGetClinicByIdQuery } from '../../redux/apis/clinicApi';
import { useGetDoctorsByClinicIdQuery } from '../../redux/apis/doctorApi';
import type { ClinicModel, DoctorModel } from '../../types';
import { formatDoctorName, getImageUrl } from '../../utils';

type Props = NativeStackScreenProps<RootStackParamList, 'Clinic'>;

export const ClinicScreen = ({ navigation, route }: Props) => {
  const { clinicId } = route.params ?? {};
  const insets = useSafeAreaInsets();
  const [descExpanded, setDescExpanded] = useState(true);
  const [hoursExpanded, setHoursExpanded] = useState(false);

  const {
    data: clinicData,
    isLoading: isClinicLoading,
    isError: isClinicError,
    refetch: refetchClinic,
  } = useGetClinicByIdQuery(clinicId, { skip: !clinicId });

  const { data: doctorsData } = useGetDoctorsByClinicIdQuery(clinicId, { skip: !clinicId });

  const clinic: ClinicModel | null = useMemo(() => {
    if (!clinicData) return null;
    if (typeof clinicData === 'object' && !('data' in clinicData)) return clinicData;
    return clinicData?.data ?? null;
  }, [clinicData]);

  const doctors: DoctorModel[] = useMemo(() => {
    if (Array.isArray(doctorsData)) return doctorsData;
    if (Array.isArray(doctorsData?.data)) return doctorsData.data;
    return [];
  }, [doctorsData]);

  const openingHours = useMemo(() => {
    if (!clinic?.opening_hours) return [];
    try {
      const parsed = JSON.parse(clinic.opening_hours);
      return Object.entries(parsed).map(([day, time]) => ({
        day: day.charAt(0).toUpperCase() + day.slice(1),
        time: String(time),
      }));
    } catch {
      return [];
    }
  }, [clinic]);

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

  if (isClinicLoading) {
    return (
      <View style={styles.container}>
        <AppHeader title="Clinic Details" onBackPress={() => navigation.goBack()} />
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom + 20, 30) }]}
          showsVerticalScrollIndicator={false}
        >
          <SkeletonDetail />
        </ScrollView>
      </View>
    );
  }

  if (isClinicError || !clinic) {
    return (
      <View style={styles.container}>
        <AppHeader title="Clinic Details" onBackPress={() => navigation.goBack()} />
        <ErrorState message="Could not load clinic details" onRetry={refetchClinic} />
      </View>
    );
  }

  const clinicImgUrl = getImageUrl(clinic.image);

  return (
    <View style={styles.container}>
      <AppHeader title={clinic.title || 'Clinic Details'} onBackPress={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom + 20, 30) }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Clinic Header Info Card */}
        <View style={styles.card}>
          <View style={styles.headerRow}>
            {clinicImgUrl ? (
              <Image
                source={{ uri: clinicImgUrl }}
                style={styles.clinicAvatar}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <FontAwesome5 name="hospital" size={28} color={Colors.primaryColor} />
              </View>
            )}

            <View style={styles.headerInfo}>
              <View style={styles.verifiedBadge}>
                <MaterialIcons name="verified" size={13} color="#059669" />
                <Text style={styles.verifiedText}>Verified Medical Center</Text>
              </View>
              <Text style={styles.clinicTitle}>{clinic.title}</Text>
              {!!clinic.address && (
                <View style={styles.addressRow}>
                  <MaterialIcons name="location-on" size={14} color={Colors.primaryColor} />
                  <Text style={styles.clinicAddress} numberOfLines={2}>{clinic.address}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Contact Quick Actions */}
        <View style={styles.card}>
          <Text style={styles.sectionHeaderTitle}>Connect & Directions</Text>
          <View style={styles.actionRow}>
            {!!clinic.phone && (
              <TouchableOpacity
                style={styles.actionItem}
                onPress={() => handleOpenUrl(`tel:${clinic.phone}`)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconCircle, { backgroundColor: '#EFF6FF' }]}>
                  <Ionicons name="call" size={18} color="#2563EB" />
                </View>
                <Text style={styles.actionText}>Call</Text>
              </TouchableOpacity>
            )}

            {!!clinic.whatsapp && (
              <TouchableOpacity
                style={styles.actionItem}
                onPress={() => handleOpenUrl(`https://wa.me/${clinic.whatsapp}?text=Hello`)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconCircle, { backgroundColor: '#ECFDF5' }]}>
                  <Ionicons name="logo-whatsapp" size={18} color="#10B981" />
                </View>
                <Text style={styles.actionText}>WhatsApp</Text>
              </TouchableOpacity>
            )}

            {!!clinic.email && (
              <TouchableOpacity
                style={styles.actionItem}
                onPress={() => handleOpenUrl(`mailto:${clinic.email}`)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconCircle, { backgroundColor: '#EFF6FF' }]}>
                  <Ionicons name="mail" size={18} color="#2563EB" />
                </View>
                <Text style={styles.actionText}>Email</Text>
              </TouchableOpacity>
            )}

            {clinic.latitude && clinic.longitude && (
              <TouchableOpacity
                style={styles.actionItem}
                onPress={() =>
                  handleOpenUrl(
                    `http://maps.google.com/maps?daddr=${clinic.latitude},${clinic.longitude}`
                  )
                }
                activeOpacity={0.7}
              >
                <View style={[styles.iconCircle, { backgroundColor: '#F3E8FF' }]}>
                  <Ionicons name="navigate" size={18} color="#9333EA" />
                </View>
                <Text style={styles.actionText}>Directions</Text>
              </TouchableOpacity>
            )}

            {clinic.ambulance_btn_enable === 1 && !!clinic.ambulance_number && (
              <TouchableOpacity
                style={styles.actionItem}
                onPress={() => handleOpenUrl(`tel:${clinic.ambulance_number}`)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconCircle, { backgroundColor: '#FEE2E2' }]}>
                  <MaterialCommunityIcons name="ambulance" size={18} color="#EF4444" />
                </View>
                <Text style={styles.actionText}>Emergency</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Description Accordion */}
        {!!clinic.description && (
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.accordionHeader}
              onPress={() => setDescExpanded(!descExpanded)}
              activeOpacity={0.7}
            >
              <View style={styles.accordionTitleRow}>
                <MaterialIcons name="info-outline" size={18} color={Colors.primaryColor} />
                <Text style={styles.sectionHeaderTitleNoMargin}>About Center</Text>
              </View>
              <Ionicons
                name={descExpanded ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={Colors.secondaryFontColor}
              />
            </TouchableOpacity>
            {descExpanded && <Text style={styles.descriptionText}>{clinic.description}</Text>}
          </View>
        )}

        {/* Opening Hours Accordion */}
        {openingHours.length > 0 && (
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.accordionHeader}
              onPress={() => setHoursExpanded(!hoursExpanded)}
              activeOpacity={0.7}
            >
              <View style={styles.accordionTitleRow}>
                <MaterialIcons name="access-time" size={18} color={Colors.primaryColor} />
                <Text style={styles.sectionHeaderTitleNoMargin}>Operating Hours</Text>
              </View>
              <Ionicons
                name={hoursExpanded ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={Colors.secondaryFontColor}
              />
            </TouchableOpacity>
            {hoursExpanded && (
              <View style={styles.hoursContainer}>
                {openingHours.map((item, idx) => (
                  <View key={`hours-${idx}`} style={styles.hourRow}>
                    <Text style={styles.dayText}>{item.day}</Text>
                    <Text style={styles.timeText}>{item.time}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Associated Doctors List */}
        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeaderTitleNoMargin}>Specialist Doctors</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{doctors.length}</Text>
            </View>
          </View>
          {doctors.length === 0 ? (
            <Text style={styles.noDoctorsText}>No doctors currently listed for this clinic</Text>
          ) : (
            doctors.map((doc, idx) => {
              const doctId = String(doc.user_id ?? doc.id);
              const formattedName = formatDoctorName(doc.f_name, doc.l_name);
              const docImgUrl = getImageUrl(doc.image);
              return (
                <TouchableOpacity
                  key={`doc-${doctId}-${idx}`}
                  style={styles.doctorCardItem}
                  activeOpacity={0.85}
                  onPress={() => navigation.navigate('DoctorDetails', { doctId })}
                >
                  {docImgUrl ? (
                    <Image
                      source={{ uri: docImgUrl }}
                      style={styles.doctorAvatar}
                    />
                  ) : (
                    <View style={styles.docAvatarPlaceholder}>
                      <Ionicons name="person" size={22} color={Colors.primaryColor} />
                    </View>
                  )}

                  <View style={styles.doctorInfo}>
                    <Text style={styles.doctorName}>{formattedName}</Text>
                    <View style={styles.specTag}>
                      <Text style={styles.doctorSpec}>{doc.specialization || 'Consultant'}</Text>
                    </View>
                    <Text style={styles.doctorExp}>{`Experience: ${doc.ex_year ?? doc.experience ?? 0} Years`}</Text>
                  </View>

                  <View style={styles.bookDocBtn}>
                    <Text style={styles.bookDocBtnText}>Book</Text>
                    <MaterialIcons name="event" size={13} color={Colors.white} />
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgColor },
  scrollContent: { padding: 16 },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  clinicAvatar: { width: 72, height: 72, borderRadius: 16, backgroundColor: '#F1F5F9' },
  avatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: { flex: 1, marginLeft: 14 },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  verifiedText: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.bold,
    color: '#059669',
  },
  clinicTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryFontColor,
    marginBottom: 3,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 2,
    marginTop: 2,
  },
  clinicAddress: {
    flex: 1,
    fontSize: 11,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.secondaryFontColor,
    lineHeight: 16,
  },
  sectionHeaderTitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryFontColor,
    marginBottom: 12,
  },
  sectionHeaderTitleNoMargin: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryFontColor,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  accordionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countBadgeText: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryColor,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  actionItem: { alignItems: 'center' },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  actionText: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.primaryFontColor,
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  descriptionText: {
    fontSize: 13,
    fontFamily: Typography.fontFamily.regular,
    color: '#334155',
    lineHeight: 20,
    marginTop: 8,
  },
  hoursContainer: { marginTop: 10 },
  hourRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dayText: {
    fontSize: 12,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.primaryFontColor,
  },
  timeText: {
    fontSize: 12,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.secondaryFontColor,
  },
  noDoctorsText: {
    fontSize: 12,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.secondaryFontColor,
    fontStyle: 'italic',
  },
  doctorCardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  doctorAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#F1F5F9' },
  docAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  doctorInfo: { flex: 1, marginLeft: 12 },
  doctorName: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryFontColor,
  },
  specTag: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 3,
    marginBottom: 3,
  },
  doctorSpec: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryColor,
  },
  doctorExp: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.regular,
    color: '#64748B',
  },
  bookDocBtn: {
    backgroundColor: Colors.primaryColor,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bookDocBtnText: {
    fontSize: 12,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
  },
});
