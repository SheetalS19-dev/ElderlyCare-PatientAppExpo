import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader, ErrorState, SkeletonDetail } from '../../components';
import { Colors } from '../../constants';
import { formatDoctorName, fs, getImageUrl, hs, TYPOGRAPHY, ws } from '../../utils';
import { useClinic } from './useClinic';

export const ClinicScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const {
    navigation,
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
  } = useClinic();

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
                  <MaterialIcons name="location-city" size={fs(12)} color={Colors.primaryColor} />
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
                  <View style={[styles.iconCircle, { backgroundColor: Colors.aquaSoft }]}>
                    <Ionicons name="call" size={fs(18)} color={Colors.primaryColor} />
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
                  <View style={[styles.iconCircle, { backgroundColor: Colors.green_ECFDF5 }]}>
                    <Ionicons name="logo-whatsapp" size={fs(18)} color={Colors.green_10B981} />
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
                  <View style={[styles.iconCircle, { backgroundColor: Colors.aquaSoft }]}>
                    <Ionicons name="mail" size={fs(18)} color={Colors.primaryColor} />
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
                  <View style={[styles.iconCircle, { backgroundColor: Colors.purple_F3E8FF }]}>
                    <Ionicons name="navigate" size={fs(18)} color={Colors.purple_9333EA} />
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
                        <MaterialIcons name="block" size={fs(12)} color={Colors.redColor} />
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
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start' },
  clinicAvatar: {
    width: ws(64),
    height: ws(64),
    borderRadius: fs(14),
    marginRight: ws(12),
  },
  avatarPlaceholder: {
    width: ws(64),
    height: ws(64),
    borderRadius: fs(14),
    backgroundColor: Colors.aquaSoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: ws(12),
  },
  headerInfo: { flex: 1 },
  cityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.aquaSoft,
    paddingHorizontal: ws(8),
    paddingVertical: hs(2),
    borderRadius: fs(6),
    alignSelf: 'flex-start',
    marginBottom: hs(4),
    gap: ws(4),
  },
  cityPillText: {
    fontSize: fs(11),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryColor,
  },
  clinicTitle: {
    fontSize: fs(16),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
    marginBottom: hs(4),
  },
  addressRow: { flexDirection: 'row', alignItems: 'flex-start', gap: ws(4) },
  clinicAddress: {
    fontSize: fs(12),
    ...TYPOGRAPHY.regular,
    color: Colors.secondaryFontColor,
    flex: 1,
    lineHeight: fs(17),
  },
  sectionHeaderTitle: {
    fontSize: fs(14),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
    marginBottom: hs(12),
  },
  sectionHeaderTitleNoMargin: {
    fontSize: fs(14),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
  },
  actionGridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ws(10),
  },
  actionGridItem: {
    flex: 1,
    minWidth: ws(130),
    backgroundColor: Colors.slate_F8FAFC,
    borderRadius: fs(12),
    padding: ws(12),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  iconCircle: {
    width: ws(40),
    height: ws(40),
    borderRadius: ws(20),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hs(6),
  },
  actionLabel: {
    fontSize: fs(12),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
  },
  actionSubtext: {
    fontSize: fs(11),
    ...TYPOGRAPHY.regular,
    color: Colors.secondaryFontColor,
    marginTop: hs(2),
  },
  aboutHeaderRow: {
    marginBottom: hs(8),
  },
  descriptionText: {
    fontSize: fs(13),
    ...TYPOGRAPHY.regular,
    color: Colors.secondaryFontColor,
    lineHeight: fs(19),
  },
  readMoreBtn: {
    alignSelf: 'flex-start',
    marginTop: hs(6),
  },
  readMoreText: {
    fontSize: fs(12),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryColor,
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accordionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(8),
  },
  hoursContainer: {
    marginTop: hs(12),
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: hs(10),
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
    color: Colors.primaryFontColor,
  },
  timeText: {
    fontSize: fs(13),
    ...TYPOGRAPHY.regular,
    color: Colors.secondaryFontColor,
  },
  closedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(4),
  },
  closedText: {
    fontSize: fs(12),
    ...TYPOGRAPHY.bold,
    color: Colors.redColor,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hs(12),
  },
  specialistTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(8),
  },
  countBadge: {
    backgroundColor: Colors.aquaSoft,
    paddingHorizontal: ws(8),
    paddingVertical: hs(2),
    borderRadius: fs(6),
  },
  countBadgeText: {
    fontSize: fs(11),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryColor,
  },
  emptyDoctorsBox: {
    alignItems: 'center',
    paddingVertical: hs(20),
  },
  emptyDoctorsTitle: {
    fontSize: fs(13),
    ...TYPOGRAPHY.medium,
    color: Colors.secondaryFontColor,
    marginBottom: hs(10),
  },
  browseDoctorsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryColor,
    paddingHorizontal: ws(16),
    paddingVertical: hs(8),
    borderRadius: fs(8),
    gap: ws(4),
  },
  browseDoctorsBtnText: {
    fontSize: fs(12),
    ...TYPOGRAPHY.bold,
    color: Colors.white,
  },
  doctorCardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.slate_F8FAFC,
    borderRadius: fs(12),
    padding: ws(10),
    marginBottom: hs(8),
    borderWidth: 1,
    borderColor: Colors.border,
  },
  doctorAvatar: {
    width: ws(44),
    height: ws(44),
    borderRadius: ws(22),
    marginRight: ws(10),
  },
  docAvatarPlaceholder: {
    width: ws(44),
    height: ws(44),
    borderRadius: ws(22),
    backgroundColor: Colors.aquaSoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: ws(10),
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: fs(13.5),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
    marginBottom: hs(2),
  },
  doctorSpec: {
    fontSize: fs(11.5),
    ...TYPOGRAPHY.regular,
    color: Colors.secondaryFontColor,
    marginBottom: hs(2),
  },
  doctorExp: {
    fontSize: fs(11),
    ...TYPOGRAPHY.medium,
    color: Colors.primaryColor,
  },
  bookDocBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryColor,
    paddingHorizontal: ws(10),
    paddingVertical: hs(6),
    borderRadius: fs(8),
    gap: ws(4),
    marginLeft: ws(8),
  },
  bookDocBtnText: {
    fontSize: fs(11.5),
    ...TYPOGRAPHY.bold,
    color: Colors.white,
  },
});
