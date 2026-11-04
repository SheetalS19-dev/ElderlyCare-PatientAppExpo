import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
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
import { Colors } from '../../constants';
import type { RootStackParamList } from '../../navigation/types';
import { useGetClinicByIdQuery } from '../../redux/apis/clinicApi';
import { useGetDoctorsByClinicIdQuery } from '../../redux/apis/doctorApi';
import type { ClinicModel, DoctorModel } from '../../types';
import { formatDoctorName, fs, getImageUrl, hs, TYPOGRAPHY, ws } from '../../utils';

type Props = NativeStackScreenProps<RootStackParamList, 'Clinic'>;

export const ClinicScreen = ({ navigation, route }: Props) => {
  const { clinicId } = route.params ?? {};
  const insets = useSafeAreaInsets();
  const [descReadMore, setDescReadMore] = useState(false);
  const [hoursExpanded, setHoursExpanded] = useState(true);

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
      const parsed =
        typeof clinic.opening_hours === 'string'
          ? JSON.parse(clinic.opening_hours)
          : clinic.opening_hours;

      if (!parsed || typeof parsed !== 'object') return [];

      return Object.entries(parsed).map(([rawDay, rawTime]) => {
        // Remove accidental extra spaces (leading, trailing, multiple, non-breaking, or around hyphens)
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

  if (isClinicLoading) {
    return (
      <View style={styles.container}>
        <AppHeader title="Hospital Details" onBackPress={() => navigation.goBack()} />
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom + hs(40), hs(60)) },
          ]}
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
        <AppHeader title="Hospital Details" onBackPress={() => navigation.goBack()} />
        <ErrorState message="Could not load hospital details" onRetry={refetchClinic} />
      </View>
    );
  }

  const clinicImgUrl = getImageUrl(clinic.image);
  const cleanPhone = clinic.phone?.trim();
  const cleanWa = clinic.whatsapp ? String(clinic.whatsapp).replace(/[^0-9]/g, '') : '';
  const cleanEmail = clinic.email?.trim();
  const hasDirections = Boolean((clinic.latitude && clinic.longitude) || clinic.address);
  const hasAnyContact = Boolean(cleanPhone || cleanWa || cleanEmail || hasDirections);

  return (
    <View style={styles.container}>
      <AppHeader title={clinic.title || 'Hospital Details'} onBackPress={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + hs(80) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hospital Header Info Card */}
        <View style={styles.card}>
          <View style={styles.headerRow}>
            {clinicImgUrl ? (
              <Image source={{ uri: clinicImgUrl }} style={styles.clinicAvatar} resizeMode="cover" />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <FontAwesome5 name="hospital" size={fs(26)} color={Colors.primaryColor} />
              </View>
            )}

            <View style={styles.headerInfo}>
              {!!(clinic.city_title || clinic.city_name) && (
                <View style={styles.cityPill}>
                  <MaterialIcons name="location-city" size={fs(12)} color="#2563EB" />
                  <Text style={styles.cityPillText}>{clinic.city_title || clinic.city_name}</Text>
                </View>
              )}
              <Text style={styles.clinicTitle}>{clinic.title}</Text>
              {!!clinic.address && (
                <View style={styles.addressRow}>
                  <MaterialIcons
                    name="location-on"
                    size={fs(14)}
                    color={Colors.primaryColor}
                    style={{ marginTop: hs(2) }}
                  />
                  <Text style={styles.clinicAddress}>{clinic.address}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Connect & Directions */}
        {hasAnyContact && (
          <View style={styles.card}>
            <Text style={styles.sectionHeaderTitle}>Connect & Directions</Text>
            <View style={styles.actionGridRow}>
              {/* Call Button */}
              {!!cleanPhone && (
                <TouchableOpacity
                  style={styles.actionGridItem}
                  onPress={() => handleOpenUrl(`tel:${cleanPhone}`)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.iconCircle, { backgroundColor: '#EFF6FF' }]}>
                    <Ionicons name="call" size={fs(18)} color="#2563EB" />
                  </View>
                  <Text style={styles.actionLabel}>Call</Text>
                  <Text style={styles.actionSubtext} numberOfLines={1}>
                    {cleanPhone}
                  </Text>
                </TouchableOpacity>
              )}

              {/* WhatsApp Button */}
              {!!cleanWa && (
                <TouchableOpacity
                  style={styles.actionGridItem}
                  onPress={() =>
                    handleOpenUrl(
                      `https://wa.me/${cleanWa}?text=Hello%20${encodeURIComponent(
                        clinic.title || 'Hospital'
                      )}`
                    )
                  }
                  activeOpacity={0.7}
                >
                  <View style={[styles.iconCircle, { backgroundColor: '#ECFDF5' }]}>
                    <Ionicons name="logo-whatsapp" size={fs(18)} color="#10B981" />
                  </View>
                  <Text style={styles.actionLabel}>WhatsApp</Text>
                  <Text style={styles.actionSubtext} numberOfLines={1}>
                    Chat with us
                  </Text>
                </TouchableOpacity>
              )}

              {/* Email Button */}
              {!!cleanEmail && (
                <TouchableOpacity
                  style={styles.actionGridItem}
                  onPress={() =>
                    handleOpenUrl(
                      `mailto:${cleanEmail}?subject=Inquiry%20regarding%20${encodeURIComponent(
                        clinic.title || ''
                      )}`
                    )
                  }
                  activeOpacity={0.7}
                >
                  <View style={[styles.iconCircle, { backgroundColor: '#EFF6FF' }]}>
                    <Ionicons name="mail" size={fs(18)} color="#2563EB" />
                  </View>
                  <Text style={styles.actionLabel}>Email</Text>
                  <Text style={styles.actionSubtext} numberOfLines={1}>
                    Official Email
                  </Text>
                </TouchableOpacity>
              )}

              {/* Get Directions Button */}
              {hasDirections && (
                <TouchableOpacity
                  style={styles.actionGridItem}
                  onPress={handleOpenDirections}
                  activeOpacity={0.7}
                >
                  <View style={[styles.iconCircle, { backgroundColor: '#F3E8FF' }]}>
                    <Ionicons name="navigate" size={fs(18)} color="#9333EA" />
                  </View>
                  <Text style={styles.actionLabel}>Directions</Text>
                  <Text style={styles.actionSubtext} numberOfLines={1}>
                    Open in Maps
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* About Center with Read More Option */}
        {!!clinic.description && (
          <View style={styles.card}>
            <View style={styles.aboutHeaderRow}>
              <View style={styles.accordionTitleRow}>
                <MaterialIcons name="info-outline" size={fs(18)} color={Colors.primaryColor} />
                <Text style={styles.sectionHeaderTitleNoMargin}>About Center</Text>
              </View>
            </View>

            <Text
              style={styles.descriptionText}
              numberOfLines={descReadMore ? undefined : 3}
            >
              {clinic.description}
            </Text>

            {clinic.description.length > 120 && (
              <TouchableOpacity
                style={styles.readMoreBtn}
                onPress={() => setDescReadMore((prev) => !prev)}
                activeOpacity={0.7}
              >
                <Text style={styles.readMoreText}>
                  {descReadMore ? 'Read Less' : 'Read More >'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Operating Hours */}
        {openingHours.length > 0 && (
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.accordionHeader}
              onPress={() => setHoursExpanded(!hoursExpanded)}
              activeOpacity={0.7}
            >
              <View style={styles.accordionTitleRow}>
                <MaterialIcons name="access-time" size={fs(18)} color={Colors.primaryColor} />
                <Text style={styles.sectionHeaderTitleNoMargin}>Operating Hours</Text>
              </View>
              <Ionicons
                name={hoursExpanded ? 'chevron-up' : 'chevron-down'}
                size={fs(18)}
                color={Colors.secondaryFontColor}
              />
            </TouchableOpacity>

            {hoursExpanded && (
              <View style={styles.hoursContainer}>
                {openingHours.map((item, idx) => (
                  <View key={`hours-${idx}`} style={styles.hourRow}>
                    <Text style={styles.dayText}>{item.day}</Text>
                    {item.isClosed ? (
                      <View style={styles.closedTag}>
                        <MaterialIcons name="block" size={fs(12)} color="#DC2626" />
                        <Text style={styles.closedText}>Closed</Text>
                      </View>
                    ) : (
                      <Text style={styles.timeText}>{item.time}</Text>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Specialist Doctors Section */}
        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.specialistTitleRow}>
              <MaterialIcons name="people-outline" size={fs(18)} color={Colors.primaryColor} />
              <Text style={styles.sectionHeaderTitleNoMargin}>Specialist Doctors</Text>
            </View>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{doctors.length} Doctors</Text>
            </View>
          </View>

          {doctors.length === 0 ? (
            <View style={styles.emptyDoctorsBox}>
              <Text style={styles.emptyDoctorsTitle}>No doctors currently listed for this clinic</Text>
              <TouchableOpacity
                style={styles.browseDoctorsBtn}
                onPress={() => navigation.navigate('DoctorList', {})}
                activeOpacity={0.8}
              >
                <Text style={styles.browseDoctorsBtnText}>Browse All Doctors</Text>
                <MaterialIcons name="chevron-right" size={fs(16)} color={Colors.white} />
              </TouchableOpacity>
            </View>
          ) : (
            doctors.map((doc, idx) => {
              const doctId = String(doc.user_id ?? doc.id);
              const formattedName = formatDoctorName(doc.f_name, doc.l_name);
              const docImgUrl = getImageUrl(doc.image);
              const expYears = doc.ex_year ?? doc.experience ?? 0;
              const qualification = (doc as any).degree || (doc as any).qualification || '';

              return (
                <TouchableOpacity
                  key={`doc-${doctId}-${idx}`}
                  style={styles.doctorCardItem}
                  activeOpacity={0.85}
                  onPress={() => navigation.navigate('DoctorDetails', { doctId })}
                >
                  {docImgUrl ? (
                    <Image source={{ uri: docImgUrl }} style={styles.doctorAvatar} />
                  ) : (
                    <View style={styles.docAvatarPlaceholder}>
                      <Ionicons name="person" size={fs(22)} color={Colors.primaryColor} />
                    </View>
                  )}

                  <View style={styles.doctorInfo}>
                    <Text style={styles.doctorName}>{formattedName}</Text>
                    <Text style={styles.doctorSpec} numberOfLines={2}>
                      {doc.department_name || (doc as any).dept_name || (doc as any).dept_title || doc.specialization || 'Consultant'}
                    </Text>
                    <Text style={styles.doctorExp} numberOfLines={1}>
                      {expYears ? `${expYears} Years Exp.` : ''}
                      {expYears && qualification ? ` • ${qualification}` : qualification}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.bookDocBtn}
                    onPress={() => navigation.navigate('DoctorDetails', { doctId })}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.bookDocBtnText}>Book</Text>
                    <MaterialIcons name="event" size={fs(12)} color={Colors.white} />
                  </TouchableOpacity>
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
  scrollContent: { padding: ws(16) },
  card: {
    backgroundColor: Colors.white,
    borderRadius: fs(16),
    padding: ws(14),
    marginBottom: hs(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start' },
  clinicAvatar: {
    width: ws(68),
    height: ws(68),
    borderRadius: fs(12),
    backgroundColor: '#F1F5F9',
  },
  avatarPlaceholder: {
    width: ws(68),
    height: ws(68),
    borderRadius: fs(12),
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: { flex: 1, marginLeft: ws(12) },
  cityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(4),
    backgroundColor: '#EFF6FF',
    paddingHorizontal: ws(8),
    paddingVertical: hs(2),
    borderRadius: fs(6),
    alignSelf: 'flex-start',
    marginBottom: hs(4),
  },
  cityPillText: {
    fontSize: fs(11),
    ...TYPOGRAPHY.bold,
    color: '#2563EB',
  },
  clinicTitle: {
    fontSize: fs(15),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
    marginBottom: hs(4),
  },
  addressRow: { flexDirection: 'row', alignItems: 'flex-start' },
  clinicAddress: {
    flex: 1,
    fontSize: fs(11.5),
    ...TYPOGRAPHY.regular,
    color: '#64748B',
    lineHeight: fs(16),
    marginLeft: ws(3),
  },

  sectionHeaderTitle: {
    fontSize: fs(13),
    ...TYPOGRAPHY.bold,
    color: '#1E293B',
    marginBottom: hs(10),
  },
  actionGridRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    gap: ws(8),
  },
  actionGridItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: fs(10),
    paddingVertical: hs(8),
    paddingHorizontal: ws(2),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  iconCircle: {
    width: ws(36),
    height: ws(36),
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hs(4),
  },
  actionLabel: {
    fontSize: fs(11),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
  },
  actionSubtext: {
    fontSize: fs(9),
    ...TYPOGRAPHY.regular,
    color: '#64748B',
    marginTop: hs(2),
    textAlign: 'center',
  },

  // About Center
  aboutHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hs(6),
  },
  accordionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(6),
  },
  sectionHeaderTitleNoMargin: {
    fontSize: fs(13),
    ...TYPOGRAPHY.bold,
    color: '#1E293B',
  },
  descriptionText: {
    fontSize: fs(12),
    ...TYPOGRAPHY.regular,
    color: '#475569',
    lineHeight: fs(18),
  },
  readMoreBtn: {
    marginTop: hs(6),
    alignSelf: 'flex-start',
  },
  readMoreText: {
    fontSize: fs(12),
    ...TYPOGRAPHY.bold,
    color: '#2563EB',
  },

  // Operating Hours
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hoursContainer: {
    marginTop: hs(10),
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: hs(8),
  },
  hourRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: hs(6),
  },
  dayText: {
    fontSize: fs(13),
    ...TYPOGRAPHY.medium,
    color: '#475569',
    flex: 1,
    textAlign: 'left',
  },
  timeText: {
    fontSize: fs(13),
    ...TYPOGRAPHY.regular,
    color: '#1E293B',
    flex: 1,
    textAlign: 'right',
  },
  closedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(3),
    backgroundColor: '#FEE2E2',
    paddingHorizontal: ws(6),
    paddingVertical: hs(2),
    borderRadius: fs(6),
  },
  closedText: {
    fontSize: fs(10.5),
    ...TYPOGRAPHY.bold,
    color: '#DC2626',
  },

  // Specialist Doctors
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hs(10),
  },
  specialistTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(6),
  },
  countBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: ws(8),
    paddingVertical: hs(2),
    borderRadius: fs(10),
  },
  countBadgeText: {
    fontSize: fs(11),
    ...TYPOGRAPHY.bold,
    color: '#2563EB',
  },
  doctorCardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: fs(12),
    padding: ws(10),
    marginBottom: hs(8),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  doctorAvatar: {
    width: ws(48),
    height: ws(48),
    borderRadius: 999,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
  docAvatarPlaceholder: {
    width: ws(48),
    height: ws(48),
    borderRadius: 999,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  doctorInfo: {
    flex: 1,
    marginLeft: ws(10),
    marginRight: ws(8),
  },
  doctorName: {
    fontSize: fs(13),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
  },
  doctorSpec: {
    fontSize: fs(11.5),
    ...TYPOGRAPHY.medium,
    color: '#2563EB',
    marginTop: hs(1),
    lineHeight: fs(15.5),
  },
  doctorExp: {
    fontSize: fs(10.5),
    ...TYPOGRAPHY.regular,
    color: '#64748B',
    marginTop: hs(2),
  },
  bookDocBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(4),
    backgroundColor: Colors.primaryColor,
    paddingHorizontal: ws(10),
    paddingVertical: hs(6),
    borderRadius: fs(8),
  },
  bookDocBtnText: {
    fontSize: fs(11),
    ...TYPOGRAPHY.bold,
    color: Colors.white,
  },

  // Empty Doctors State
  emptyDoctorsBox: {
    paddingVertical: hs(18),
    paddingHorizontal: ws(12),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: fs(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyDoctorsTitle: {
    fontSize: fs(12.5),
    ...TYPOGRAPHY.medium,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: hs(10),
  },
  browseDoctorsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(4),
    backgroundColor: Colors.primaryColor,
    paddingHorizontal: ws(14),
    paddingVertical: hs(8),
    borderRadius: fs(8),
  },
  browseDoctorsBtnText: {
    fontSize: fs(12),
    ...TYPOGRAPHY.bold,
    color: Colors.white,
  },
});
