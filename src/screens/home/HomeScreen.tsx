import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { memo, useCallback, useMemo, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBar, CitySelectModal, ErrorState, LoadingIndicator, SearchBox } from '../../components';
import { Colors, Images, Typography } from '../../constants';
import { useAuth } from '../../context/AuthContext';
import type { RootStackParamList } from '../../navigation/types';
import { useGetClinicsQuery } from '../../redux/apis/clinicApi';
import {
  useGetBannersQuery,
  useGetCitiesQuery,
  useGetCurrentCityQuery,
  useGetDepartmentsQuery,
  useGetDoctorsQuery,
  type BannerModel,
  type CityModel,
  type DepartmentModel,
  type DoctorModel,
} from '../../redux/apis/doctorApi';
import { useGetNotificationsByDateQuery } from '../../redux/apis/notificationApi';
import { useGetUserProfileQuery } from '../../redux/apis/userApi';
import { getUserFullName, type NotificationModel } from '../../types';
import { formatDoctorName, getImageUrl } from '../../utils';

type RootNavigation = NativeStackNavigationProp<RootStackParamList>;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface QuickAction {
  id: string;
  title: string;
  image: any;
  requiresAuth: boolean;
  route: keyof RootStackParamList;
}

const QUICK_ACTIONS: QuickAction[] = [
  { id: '1', title: 'Appointments', image: Images.appointment, requiresAuth: true, route: 'MyBookings' },
  { id: '2', title: 'Vitals Log', image: Images.vitals, requiresAuth: true, route: 'Vitals' },
  { id: '3', title: 'Prescriptions', image: Images.prescription, requiresAuth: true, route: 'PrescriptionList' },
  { id: '4', title: 'My Profile', image: Images.user, requiresAuth: true, route: 'EditProfile' },
  { id: '5', title: 'Family Members', image: Images.familyMember, requiresAuth: true, route: 'FamilyMemberList' },
  { id: '6', title: 'My Wallet', image: Images.wallet, requiresAuth: true, route: 'Wallet' },
  { id: '7', title: 'Medical Files', image: Images.files, requiresAuth: true, route: 'PatientFile' },
  { id: '8', title: 'Notifications', image: Images.notification, requiresAuth: true, route: 'Notification' },
  { id: '9', title: 'Care Support', image: Images.contactUs, requiresAuth: false, route: 'ContactUs' },
];

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<RootNavigation>();
  const { isAuthenticated, user } = useAuth();
  const insets = useSafeAreaInsets();

  const [search, setSearch] = useState('');
  const [selectedCity, setSelectedCity] = useState<CityModel | null | undefined>(undefined);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [citySearchQuery, setCitySearchQuery] = useState('');
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);

  // API Queries
  const { data: currentCityData } = useGetCurrentCityQuery();
  const { data: citiesData } = useGetCitiesQuery();
  const { data: bannersData } = useGetBannersQuery();
  const {
    data: departments,
    isLoading: deptLoading,
    isError: deptError,
  } = useGetDepartmentsQuery();

  const currentCityName = useMemo(() => {
    if (typeof currentCityData === 'string') return currentCityData;
    return currentCityData?.city || currentCityData?.title || 'Lucknow';
  }, [currentCityData]);

  const citiesList: CityModel[] = useMemo(() => {
    if (Array.isArray(citiesData)) return citiesData;
    if (Array.isArray((citiesData as any)?.data)) return (citiesData as any).data;
    return [];
  }, [citiesData]);

  // Match active city
  const activeCity = useMemo(() => {
    if (selectedCity !== undefined) {
      return selectedCity;
    }
    if (citiesList.length > 0) {
      if (currentCityName) {
        const matched = citiesList.find(
          (c: CityModel) => c.title?.toLowerCase() === currentCityName.toLowerCase()
        );
        if (matched) return matched;
      }
      const defaultCity = citiesList.find((c: CityModel) =>
        c.title?.toLowerCase().includes('lucknow')
      );
      if (defaultCity) return defaultCity;
    }
    return null;
  }, [selectedCity, citiesList, currentCityName]);

  const activeCityName = activeCity ? activeCity.title : currentCityName;
  const activeCityId =
    activeCity?.id != null && String(activeCity.id) !== 'ALL' && String(activeCity.id) !== ''
      ? String(activeCity.id)
      : undefined;

  const {
    data: doctors,
    isLoading: doctorsLoading,
  } = useGetDoctorsQuery({
    cityId: activeCityId,
  });

  const {
    data: clinicsData,
    isLoading: clinicsLoading,
  } = useGetClinicsQuery({
    cityId: activeCityId,
  });

  // Notification Queries for header badge
  const userIdStr = user?.id ? String(user.id) : '';
  const { data: userProfileData } = useGetUserProfileQuery(userIdStr, { skip: !userIdStr });
  const userCreatedAt = useMemo(() => {
    const u = userProfileData?.data ?? userProfileData ?? user;
    return u?.created_at ?? '2020-01-01';
  }, [userProfileData, user]);

  const { data: notificationsData } = useGetNotificationsByDateQuery(
    { uid: userIdStr, date: userCreatedAt },
    { skip: !userIdStr }
  );

  const hasUnreadNotifications = useMemo(() => {
    if (!isAuthenticated || !userIdStr) return false;
    const list: NotificationModel[] = Array.isArray(notificationsData)
      ? notificationsData
      : Array.isArray((notificationsData as any)?.data)
        ? (notificationsData as any).data
        : [];
    if (list.length === 0) return false;

    const u = userProfileData?.data ?? userProfileData ?? user;
    const seenAt = u?.notification_seen_at;
    if (!seenAt) return list.length > 0;

    const seenTime = new Date(seenAt).getTime();
    if (Number.isNaN(seenTime)) return list.length > 0;

    return list.some((item: NotificationModel) => {
      if (!item.created_at) return true;
      const itemTime = new Date(item.created_at).getTime();
      return Number.isNaN(itemTime) || itemTime > seenTime;
    });
  }, [isAuthenticated, userIdStr, notificationsData, userProfileData, user]);

  const filteredCities = useMemo(() => {
    if (!citySearchQuery.trim()) return citiesList;
    const q = citySearchQuery.toLowerCase();
    return citiesList.filter(
      (c: CityModel) =>
        c.title?.toLowerCase().includes(q) ||
        (c as any).state_title?.toLowerCase().includes(q)
    );
  }, [citiesList, citySearchQuery]);

  const toArray = (res: any) => {
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.response)) return res.response;
    if (Array.isArray(res?.result)) return res.result;
    return [];
  };

  const deptList: DepartmentModel[] = useMemo(() => toArray(departments), [departments]);
  const doctorList: DoctorModel[] = useMemo(() => toArray(doctors), [doctors]);
  const clinicList = useMemo(() => toArray(clinicsData), [clinicsData]);
  const bannerList: BannerModel[] = useMemo(() => toArray(bannersData), [bannersData]);

  const handleQuickAction = useCallback(
    (action: QuickAction) => {
      if (action.requiresAuth && !isAuthenticated) {
        navigation.navigate('Login', { redirectTo: action.route as any });
        return;
      }
      navigation.navigate(action.route as any);
    },
    [isAuthenticated, navigation]
  );

  const handleDepartmentPress = useCallback(
    (dept: DepartmentModel) => {
      navigation.navigate('DoctorList', {
        selectedDeptId: dept.id != null ? String(dept.id) : undefined,
        selectedDeptTitle: dept.title,
      });
    },
    [navigation]
  );

  const handleDoctorClick = useCallback(
    (doc: DoctorModel) => {
      const targetId = String(doc.user_id || doc.id);
      if (!isAuthenticated) {
        navigation.navigate('Login', {
          redirectTo: 'BookAppointment',
          redirectParams: { doctId: targetId },
        });
        return;
      }
      navigation.navigate('BookAppointment', { doctId: targetId });
    },
    [isAuthenticated, navigation]
  );

  const handleBannerScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const offset = event.nativeEvent.contentOffset.x;
    const index = Math.round(offset / slideSize);
    setActiveBannerIndex(index);
  };

  const userImage = user?.image || user?.image_url || (user as any)?.imageUrl || '';

  return (
    <View style={styles.screen}>
      {/* 1. Header Section */}
      <View style={[styles.headerContainer, { paddingTop: Math.max(insets.top + 8, 20) }]}>
        <View style={styles.headerTopRow}>
          {/* User Profile Info */}
          <TouchableOpacity
            style={styles.userInfoButton}
            activeOpacity={0.8}
            onPress={() => navigation.navigate(isAuthenticated ? 'EditProfile' : 'Login')}
          >
            <View style={styles.avatarBorder}>
              {userImage ? (
                <Image source={{ uri: getImageUrl(userImage) }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarFallback}>
                  <MaterialIcons name="person" size={22} color={Colors.primaryColor} />
                </View>
              )}
            </View>
            <View style={styles.greetingMeta}>
              <Text style={styles.greetingSubtitle}>Welcome back 👋</Text>
              <Text style={styles.greetingTitle} numberOfLines={1}>
                {isAuthenticated ? getUserFullName(user) || 'User' : 'Guest Patient'}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Right Header Actions: Location & Notifications */}
          <View style={styles.headerRightActions}>
            <TouchableOpacity
              style={styles.locationPill}
              onPress={() => setShowLocationModal(true)}
              activeOpacity={0.8}
            >
              <MaterialIcons name="location-on" size={15} color={Colors.white} />
              <Text style={styles.locationPillText} numberOfLines={1}>
                {activeCityName}
              </Text>
              <MaterialIcons name="keyboard-arrow-down" size={16} color={Colors.white} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.notificationBtn}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('Notification')}
            >
              <MaterialIcons name="notifications-none" size={22} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Integrated Search Bar */}
        <View style={styles.headerSearchWrapper}>
          <SearchBox
            value={search}
            onChangeText={setSearch}
            placeholder="Search doctors, specialties, clinics..."
            onSubmit={() => {
              if (search.trim()) {
                navigation.navigate('Search', { searchQuery: search });
              }
            }}
          />
        </View>
      </View>

      {/* Main Content */}
      <ScrollView
        style={styles.scrollArea}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom + 130, 160) },
        ]}
      >
        {/* 2. Promotional Banner Carousel / Hero Highlight */}
        {bannerList.length > 0 ? (
          <View style={styles.bannerSection}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={handleBannerScroll}
              scrollEventThrottle={16}
              contentContainerStyle={styles.bannerScrollContent}
            >
              {bannerList.map((banner, index) => {
                const bannerUrl = getImageUrl(banner.image);
                return (
                  <TouchableOpacity
                    key={`banner-${banner.id ?? index}`}
                    style={styles.bannerSlide}
                    activeOpacity={0.9}
                    onPress={() => {
                      if (banner.link) {
                        navigation.navigate('DoctorList', {});
                      }
                    }}
                  >
                    {bannerUrl ? (
                      <Image source={{ uri: bannerUrl }} style={styles.bannerImage} resizeMode="cover" />
                    ) : (
                      <View style={styles.promoCardGradient}>
                        <View style={styles.promoCardTextGroup}>
                          <Text style={styles.promoBadge}>ELDERLY CARE</Text>
                          <Text style={styles.promoHeading}>Specialized Doctors at Your Service</Text>
                          <Text style={styles.promoSubtext}>Book verified specialists & clinic consultations</Text>
                        </View>
                        <MaterialIcons name="medical-services" size={44} color={Colors.white} style={styles.promoIcon} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Pagination Indicator */}
            {bannerList.length > 1 && (
              <View style={styles.dotsRow}>
                {bannerList.map((_, i) => (
                  <View
                    key={`dot-${i}`}
                    style={[styles.dot, i === activeBannerIndex && styles.dotActive]}
                  />
                ))}
              </View>
            )}
          </View>
        ) : (
          /* Default Hero Highlight Card */
          <View style={styles.heroPromoCard}>
            <View style={styles.heroPromoLeft}>
              <View style={styles.heroBadge}>
                <MaterialIcons name="health-and-safety" size={14} color={Colors.primaryColor} />
                <Text style={styles.heroBadgeText}>PATIENT FIRST</Text>
              </View>
              <Text style={styles.heroPromoTitle}>Comprehensive Health & Elder Care</Text>
              <Text style={styles.heroPromoDesc}>
                Consult top specialists in {activeCityName} with easy appointment scheduling.
              </Text>
              <TouchableOpacity
                style={styles.heroCtaBtn}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('DoctorList', {})}
              >
                <Text style={styles.heroCtaText}>Find Doctors</Text>
                <MaterialIcons name="arrow-forward" size={15} color={Colors.white} />
              </TouchableOpacity>
            </View>
            <View style={styles.heroPromoIconCircle}>
              <MaterialIcons name="favorite" size={38} color={Colors.primaryColor} />
            </View>
          </View>
        )}

        {/* 3. CARE SERVICES HUB (Placed Prominently on Top) */}
        <View style={styles.careHubSection}>
          <View style={styles.sectionHeaderCompact}>
            <Text style={styles.sectionHeading}>Care Services Hub</Text>
            <Text style={styles.sectionSubheading}>Quick access to all essential services</Text>
          </View>

          <View style={styles.quickGrid}>
            {QUICK_ACTIONS.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.quickActionTile}
                activeOpacity={0.75}
                onPress={() => handleQuickAction(action)}
              >
                <View style={styles.quickActionIconContainer}>
                  <Image source={action.image} style={styles.quickActionIcon} resizeMode="contain" />
                </View>
                <Text style={styles.quickActionLabel} numberOfLines={1}>
                  {action.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 4. Specializations & Departments */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionHeading}>Specialties</Text>
            <Text style={styles.sectionSubheading}>Explore by medical category</Text>
          </View>
          <TouchableOpacity
            style={styles.viewAllBtn}
            onPress={() => navigation.navigate('DoctorList', {})}
            activeOpacity={0.7}
          >
            <Text style={styles.viewAllText}>View All</Text>
            <MaterialIcons name="arrow-forward-ios" size={12} color={Colors.primaryColor} />
          </TouchableOpacity>
        </View>

        {deptLoading ? (
          <LoadingIndicator />
        ) : deptError ? (
          <ErrorState message="Could not load medical departments" />
        ) : (
          <FlatList
            data={deptList}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item: DepartmentModel, index: number) => `dept-${item.id ?? index}`}
            contentContainerStyle={styles.deptListContainer}
            renderItem={({ item }: { item: DepartmentModel }) => (
              <DepartmentCard item={item} onPress={() => handleDepartmentPress(item)} />
            )}
          />
        )}

        {/* 5. Best Doctors Spotlight */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionHeading}>Top Doctors in {activeCityName}</Text>
            <Text style={styles.sectionSubheading}>Experienced & verified physicians</Text>
          </View>
          {doctorList.length > 0 && (
            <TouchableOpacity
              style={styles.viewAllBtn}
              onPress={() => navigation.navigate('DoctorList', {})}
              activeOpacity={0.7}
            >
              <Text style={styles.viewAllText}>View All</Text>
              <MaterialIcons name="arrow-forward-ios" size={12} color={Colors.primaryColor} />
            </TouchableOpacity>
          )}
        </View>

        {doctorsLoading ? (
          <LoadingIndicator />
        ) : doctorList.length === 0 ? (
          <View style={styles.emptyCardBox}>
            <MaterialIcons name="person-search" size={36} color={Colors.secondaryFontColor} />
            <Text style={styles.emptyCardTitle}>No Doctors Found in {activeCityName}</Text>
            <Text style={styles.emptyCardSubtitle}>
              Try switching your location or exploring all specialists.
            </Text>
            <TouchableOpacity
              style={styles.emptyActionBtn}
              onPress={() => setShowLocationModal(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.emptyActionText}>Change Location</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={doctorList}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item: DoctorModel, index: number) => `doc-${item.user_id ?? item.id ?? index}`}
            contentContainerStyle={styles.doctorsListContainer}
            renderItem={({ item }: { item: DoctorModel }) => (
              <DoctorSpotlightCard doctor={item} onBook={() => handleDoctorClick(item)} />
            )}
          />
        )}

        {/* 6. 24/7 Care & Emergency Assistance Banner */}
        <View style={styles.supportBannerCard}>
          <View style={styles.supportIconBox}>
            <MaterialIcons name="support-agent" size={30} color={Colors.primaryColor} />
          </View>
          <View style={styles.supportMeta}>
            <Text style={styles.supportTitle}>Need Immediate Assistance?</Text>
            <Text style={styles.supportDesc}>
              Our elderly care helpline is active 24/7 for patient queries and support.
            </Text>
          </View>
          <TouchableOpacity
            style={styles.supportActionBtn}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('ContactUs')}
          >
            <Text style={styles.supportActionText}>Help</Text>
          </TouchableOpacity>
        </View>

        {/* 7. Best Clinics Section */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionHeading}>Featured Clinics</Text>
            <Text style={styles.sectionSubheading}>Trusted medical centers in {activeCityName}</Text>
          </View>
          {clinicList.length > 0 && (
            <TouchableOpacity
              style={styles.viewAllBtn}
              onPress={() => navigation.navigate('ClinicList')}
              activeOpacity={0.7}
            >
              <Text style={styles.viewAllText}>View All</Text>
              <MaterialIcons name="arrow-forward-ios" size={12} color={Colors.primaryColor} />
            </TouchableOpacity>
          )}
        </View>

        {clinicsLoading ? (
          <LoadingIndicator />
        ) : clinicList.length === 0 ? (
          <View style={styles.emptyCardBox}>
            <MaterialIcons name="local-hospital" size={36} color={Colors.secondaryFontColor} />
            <Text style={styles.emptyCardTitle}>No Clinics Listed in {activeCityName}</Text>
            <Text style={styles.emptyCardSubtitle}>Check nearby cities or explore all clinics.</Text>
          </View>
        ) : (
          <View style={styles.clinicStack}>
            {clinicList.slice(0, 3).map((clinic: any, idx: number) => (
              <ClinicFeatureCard
                key={`clinic-${clinic.id ?? idx}`}
                clinic={clinic}
                onPress={() => navigation.navigate('Clinic', { clinicId: String(clinic.id) })}
              />
            ))}
          </View>
        )}
        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Floating Bottom Tab Bar */}
      <BottomTabBar />

      {/* 8. Location Selection Bottom Sheet Modal */}
      <CitySelectModal
        visible={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        cities={citiesList}
        selectedCityId={activeCity?.id}
        onSelectCity={(city) => {
          if (!city) {
            setSelectedCity({ id: 'ALL', title: 'All Cities' });
          } else {
            setSelectedCity(city);
          }
        }}
      />
    </View>
  );
};

/* -------------------------------------------------------------------------- */
/*                            MEMOIZED SUBCOMPONENTS                          */
/* -------------------------------------------------------------------------- */

const DepartmentCard = memo(({ item, onPress }: { item: DepartmentModel; onPress: () => void }) => {
  const imageUrl = getImageUrl(item.image);
  return (
    <TouchableOpacity style={styles.deptCard} activeOpacity={0.8} onPress={onPress}>
      <View style={styles.deptIconFrame}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.deptIcon} resizeMode="contain" />
        ) : (
          <MaterialIcons name="medical-services" size={26} color={Colors.primaryColor} />
        )}
      </View>
      <Text style={styles.deptTitle} numberOfLines={2}>
        {item.title}
      </Text>
    </TouchableOpacity>
  );
});

const DoctorSpotlightCard = memo(
  ({ doctor, onBook }: { doctor: DoctorModel; onBook: () => void }) => {
    const displayName = formatDoctorName(doctor.f_name || doctor.name, doctor.l_name);
    const specialty = doctor.specialization || (doctor as any).dept_title || 'Specialist';
    const rating = Number(doctor.average_rating ?? 0);
    const reviews = doctor.number_of_reviews ?? 0;
    const experience = doctor.ex_year ?? doctor.experience;
    const imageUrl = getImageUrl(doctor.image);

    return (
      <View style={styles.doctorCard}>
        {/* Top Avatar & Online Indicator */}
        <View style={styles.doctorHeader}>
          <View style={styles.docAvatarContainer}>
            {imageUrl ? (
              <Image source={{ uri: imageUrl }} style={styles.docAvatar} />
            ) : (
              <View style={styles.docAvatarFallback}>
                <MaterialIcons name="person" size={28} color={Colors.primaryColor} />
              </View>
            )}
            <View style={styles.doctorOnlineDot} />
          </View>

          <View style={styles.ratingBadge}>
            <MaterialIcons name="star" size={13} color="#F59E0B" />
            <Text style={styles.ratingBadgeText}>{rating > 0 ? rating.toFixed(1) : '4.8'}</Text>
          </View>
        </View>

        {/* Doctor Meta Info */}
        <View style={styles.doctorBody}>
          <Text style={styles.doctorName} numberOfLines={1}>
            {displayName}
          </Text>
          <View style={styles.specialtyPill}>
            <Text style={styles.specialtyPillText} numberOfLines={1}>
              {specialty}
            </Text>
          </View>

          <View style={styles.doctorMetaDetails}>
            {experience ? (
              <Text style={styles.doctorDetailText}>
                {experience} Yrs Exp • {reviews} review{reviews === 1 ? '' : 's'}
              </Text>
            ) : (
              <Text style={styles.doctorDetailText}>
                {reviews} review{reviews === 1 ? '' : 's'}
              </Text>
            )}
          </View>
        </View>

        {/* Book Action */}
        <TouchableOpacity style={styles.doctorBookBtn} activeOpacity={0.85} onPress={onBook}>
          <Text style={styles.doctorBookBtnText}>Book Now</Text>
          <MaterialIcons name="event" size={14} color={Colors.white} />
        </TouchableOpacity>
      </View>
    );
  }
);

const ClinicFeatureCard = memo(
  ({ clinic, onPress }: { clinic: any; onPress: () => void }) => {
    const imageUrl = getImageUrl(clinic.image);
    return (
      <TouchableOpacity style={styles.clinicCard} activeOpacity={0.85} onPress={onPress}>
        <View style={styles.clinicImageContainer}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.clinicImg} resizeMode="cover" />
          ) : (
            <View style={styles.clinicImgFallback}>
              <MaterialIcons name="local-hospital" size={26} color={Colors.primaryColor} />
            </View>
          )}
        </View>

        <View style={styles.clinicInfo}>
          <View style={styles.clinicTitleRow}>
            <Text style={styles.clinicTitle} numberOfLines={1}>
              {clinic.title}
            </Text>
            <View style={styles.verifiedBadge}>
              <MaterialIcons name="verified" size={14} color="#10B981" />
            </View>
          </View>
          <View style={styles.clinicAddressRow}>
            <MaterialIcons name="location-on" size={13} color={Colors.secondaryFontColor} />
            <Text style={styles.clinicAddressText} numberOfLines={2}>
              {clinic.address || 'Medical Facility'}
            </Text>
          </View>
        </View>

        <View style={styles.clinicArrowWrap}>
          <MaterialIcons name="chevron-right" size={22} color={Colors.primaryColor} />
        </View>
      </TouchableOpacity>
    );
  }
);

/* -------------------------------------------------------------------------- */
/*                                   STYLES                                   */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.bgColor,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
  },

  /* Header */
  headerContainer: {
    backgroundColor: Colors.primaryColor,
    paddingHorizontal: 16,
    paddingBottom: 18,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: Colors.primaryColor,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  userInfoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  avatarBorder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  greetingMeta: {
    flex: 1,
  },
  greetingSubtitle: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.medium,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  greetingTitle: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    maxWidth: 130,
    gap: 3,
  },
  locationPillText: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.white,
    flexShrink: 1,
  },
  notificationBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    position: 'relative',
  },
  notificationDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#EF4444',
    position: 'absolute',
    top: 6,
    right: 7,
    borderWidth: 1,
    borderColor: Colors.white,
  },
  headerSearchWrapper: {
    marginTop: 2,
  },

  /* Care Services Hub (Top Section) */
  careHubSection: {
    marginTop: 12,
    marginBottom: 4,
  },
  sectionHeaderCompact: {
    paddingHorizontal: 16,
    marginBottom: 10,
  },

  /* Quick Actions Grid */
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 8,
  },
  quickActionTile: {
    width: (SCREEN_WIDTH - 24 - 16) / 3,
    backgroundColor: Colors.white,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  quickActionIconContainer: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFF5EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: Colors.primaryColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
  },
  quickActionIcon: {
    width: 26,
    height: 26,
    tintColor: Colors.primaryColor,
  },
  quickActionLabel: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.primaryFontColor,
    textAlign: 'center',
  },

  /* Banner Section */
  bannerSection: {
    marginTop: 18,
    marginBottom: 6,
  },
  bannerScrollContent: {
    paddingHorizontal: 16,
  },
  bannerSlide: {
    width: SCREEN_WIDTH - 32,
    height: 140,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 12,
    backgroundColor: Colors.white,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  promoCardGradient: {
    flex: 1,
    backgroundColor: Colors.primaryColor,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    justifyContent: 'space-between',
  },
  promoCardTextGroup: {
    flex: 1,
    paddingRight: 10,
  },
  promoBadge: {
    fontSize: 9,
    fontFamily: Typography.fontFamily.bold,
    color: 'rgba(255, 255, 255, 0.9)',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 6,
    overflow: 'hidden',
  },
  promoHeading: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
    lineHeight: 20,
  },
  promoSubtext: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.regular,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 4,
  },
  promoIcon: {
    opacity: 0.9,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
  },
  dotActive: {
    width: 18,
    backgroundColor: Colors.primaryColor,
  },

  /* Hero Highlight Card (Fallback) */
  heroPromoCard: {
    marginHorizontal: 16,
    marginTop: 18,
    marginBottom: 6,
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  heroPromoLeft: {
    flex: 1,
    paddingRight: 12,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF4EC',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  heroBadgeText: {
    fontSize: 9,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryColor,
  },
  heroPromoTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryFontColor,
    lineHeight: 20,
  },
  heroPromoDesc: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.secondaryFontColor,
    marginTop: 4,
    lineHeight: 16,
  },
  heroCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primaryColor,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  heroCtaText: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
  },
  heroPromoIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF4EC',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Section Headers */
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 12,
  },
  sectionHeading: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryFontColor,
  },
  sectionSubheading: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.secondaryFontColor,
    marginTop: 1,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  viewAllText: {
    fontSize: 12,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryColor,
  },

  /* Department List */
  deptListContainer: {
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  deptCard: {
    width: 78,
    alignItems: 'center',
    marginRight: 12,
  },
  deptIconFrame: {
    width: 62,
    height: 62,
    borderRadius: 18,
    backgroundColor: Colors.white,
    // borderWidth: 1.5,
    // borderColor: Colors.primaryColor,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    // shadowColor: Colors.primaryColor,
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.06,
    // shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  deptIcon: {
    width: 50,
    height: 50,
  },
  deptTitle: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.primaryFontColor,
    textAlign: 'center',
    lineHeight: 14,
  },

  /* Doctors List */
  doctorsListContainer: {
    paddingHorizontal: 16,
    paddingBottom: 6,
  },
  doctorCard: {
    width: 190,
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 12,
    marginRight: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  doctorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  docAvatarContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    position: 'relative',
  },
  docAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F1F5F9',
  },
  docAvatarFallback: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFF4EC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  doctorOnlineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 3,
  },
  ratingBadgeText: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.bold,
    color: '#B45309',
  },
  doctorBody: {
    flex: 1,
  },
  doctorName: {
    fontSize: 13,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryFontColor,
  },
  specialtyPill: {
    backgroundColor: '#FFF4EC',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 4,
    marginBottom: 4,
  },
  specialtyPillText: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.primaryColor,
  },
  doctorMetaDetails: {
    marginTop: 2,
    marginBottom: 8,
  },
  doctorDetailText: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.secondaryFontColor,
  },
  doctorBookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryColor,
    paddingVertical: 7,
    borderRadius: 10,
    gap: 4,
  },
  doctorBookBtnText: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
  },

  /* Empty States */
  emptyCardBox: {
    marginHorizontal: 16,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyCardTitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryFontColor,
    marginTop: 8,
  },
  emptyCardSubtitle: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.secondaryFontColor,
    textAlign: 'center',
    marginTop: 4,
  },
  emptyActionBtn: {
    marginTop: 10,
    backgroundColor: '#FFF4EC',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(254, 132, 35, 0.2)',
  },
  emptyActionText: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryColor,
  },

  /* Support / Emergency Banner */
  supportBannerCard: {
    marginHorizontal: 16,
    marginTop: 18,
    backgroundColor: '#FFF8F3',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(254, 132, 35, 0.2)',
  },
  supportIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    shadowColor: Colors.primaryColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  supportMeta: {
    flex: 1,
    paddingRight: 6,
  },
  supportTitle: {
    fontSize: 12,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryFontColor,
  },
  supportDesc: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.secondaryFontColor,
    marginTop: 2,
  },
  supportActionBtn: {
    backgroundColor: Colors.primaryColor,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  supportActionText: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
  },

  /* Clinics Stack */
  clinicStack: {
    paddingHorizontal: 16,
    gap: 10,
  },
  clinicCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  clinicImageContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
    marginRight: 12,
  },
  clinicImg: {
    width: '100%',
    height: '100%',
  },
  clinicImgFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF4EC',
  },
  clinicInfo: {
    flex: 1,
  },
  clinicTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  clinicTitle: {
    fontSize: 13,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryFontColor,
    flexShrink: 1,
  },
  verifiedBadge: {
    justifyContent: 'center',
  },
  clinicAddressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 3,
    marginTop: 4,
  },
  clinicAddressText: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.secondaryFontColor,
    flex: 1,
    lineHeight: 14,
  },
  clinicArrowWrap: {
    paddingLeft: 6,
  },

  /* Location Bottom Sheet Modal */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalDismissArea: {
    flex: 1,
  },
  modalSheetBox: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 10,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 12,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 12,
  },
  modalSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalSheetTitle: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryFontColor,
  },
  modalSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  modalSearchIcon: {
    marginRight: 6,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.primaryFontColor,
    paddingVertical: 0,
  },
  modalCityList: {
    maxHeight: 340,
  },
  cityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  cityRowSelected: {
    backgroundColor: '#FFF5EB',
    borderColor: Colors.primaryColor,
  },
  cityRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  cityIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF4EC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cityIconWrapSelected: {
    backgroundColor: Colors.primaryColor,
  },
  cityNameText: {
    fontSize: 13,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.primaryFontColor,
  },
  cityNameTextSelected: {
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryColor,
  },
  cityStateText: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.secondaryFontColor,
    marginTop: 1,
  },
});
