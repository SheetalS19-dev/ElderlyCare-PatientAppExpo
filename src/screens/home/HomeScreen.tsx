import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { memo, useCallback, useMemo, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  Linking,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Svg, { Line, Path, Circle as SvgCircle } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBar, CitySelectModal, ErrorState, LoadingIndicator, SearchBox } from '../../components';
import { Colors, Images, Typography } from '../../constants';
import { useAuth } from '../../context/AuthContext';
import type { RootStackParamList } from '../../navigation/types';
import { useGetAppointmentsQuery } from '../../redux/apis/appointmentApi';
import { useGetFamilyMembersQuery } from '../../redux/apis/bookingApi';
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
import { useGetPatientFilesQuery } from '../../redux/apis/patientFilesApi';
import { useGetUserProfileQuery } from '../../redux/apis/userApi';
import { useGetVitalsQuery } from '../../redux/apis/vitalsApi';
import { getUserFullName, type FamilyMemberModel, type NotificationModel } from '../../types';
import { formatDoctorName, getImageUrl, showToast } from '../../utils';




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

const extractVitalNumericPoints = (records: any, vitalType: string): { val: number; label: string }[] => {
  let list: any[] = [];
  if (Array.isArray(records)) list = records;
  else if (Array.isArray(records?.data)) list = records.data;
  else if (Array.isArray(records?.response)) list = records.response;

  if (!list || list.length === 0) return [];

  const slice = [...list].slice(0, 5).reverse();
  const points: { val: number; label: string }[] = [];

  slice.forEach((item) => {
    let num: number | null = null;
    let labelStr = '';

    if (vitalType === 'Blood Pressure') {
      num = Number(item.bp_systolic || item.value);
      labelStr = item.bp_systolic ? `${item.bp_systolic}/${item.bp_diastolic || 80}` : String(item.value || '');
    } else if (vitalType === 'Sugar') {
      num = Number(item.sugar_fasting || item.sugar_random || item.value);
      labelStr = String(num || '');
    } else if (vitalType === 'Weight') {
      num = Number(item.weight || item.value);
      labelStr = String(num || '');
    } else if (vitalType === 'Temperature') {
      num = Number(item.temperature || item.value);
      labelStr = String(num || '');
    } else if (vitalType === 'SpO2') {
      num = Number(item.spo2 || item.value);
      labelStr = String(num || '');
    }

    if (num !== null && !isNaN(num) && num > 0) {
      points.push({ val: num, label: labelStr });
    }
  });

  return points;
};

interface VitalChartCardProps {
  vitalType: string;
  title: string;
  subtitle: string;
  unit: string;
  iconName: keyof typeof MaterialIcons.glyphMap;
  iconColor: string;
  pillBgColor: string;
  headers: string[];
  records: any;
  latestVal: string;
  onPress: () => void;
  fullWidth?: boolean;
  yLabels?: string[];
}

const VitalChartCard = ({
  vitalType,
  title,
  subtitle,
  unit,
  iconName,
  iconColor,
  pillBgColor,
  headers,
  records,
  latestVal,
  onPress,
  fullWidth = false,
  yLabels = ['4', '3', '2', '1', '0'],
}: VitalChartCardProps) => {
  const points = useMemo(() => extractVitalNumericPoints(records, vitalType), [records, vitalType]);
  const hasData = points.length > 0 && latestVal !== 'N/A';

  const chartData = useMemo(() => {
    if (points.length === 0) return { pathD: '', coords: [] };

    const vals = points.map((p) => p.val);
    let minVal = Math.min(...vals);
    let maxVal = Math.max(...vals);
    if (minVal === maxVal) {
      minVal = Math.max(0, minVal - 10);
      maxVal = maxVal + 10;
    }

    const marginX = 15;
    const width = 160;
    const minY = 10;
    const maxY = 48;
    const heightRange = maxY - minY;

    const coords = points.map((p, idx) => {
      const x = points.length === 1
        ? width / 2
        : marginX + (idx / (points.length - 1)) * (width - 2 * marginX);
      const normalized = (p.val - minVal) / (maxVal - minVal);
      const y = maxY - normalized * heightRange;
      return { x, y };
    });

    if (coords.length === 1) {
      return { pathD: `M 15 ${coords[0].y} L 145 ${coords[0].y}`, coords };
    }

    let pathD = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 1; i < coords.length; i++) {
      const prev = coords[i - 1];
      const curr = coords[i];
      const cpX1 = prev.x + (curr.x - prev.x) / 2;
      const cpY1 = prev.y;
      const cpX2 = prev.x + (curr.x - prev.x) / 2;
      const cpY2 = curr.y;
      pathD += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${curr.x} ${curr.y}`;
    }

    return { pathD, coords };
  }, [points]);

  return (
    <TouchableOpacity
      style={[styles.vitalsGridCard, fullWidth && styles.vitalsGridCardFull]}
      activeOpacity={0.88}
      onPress={onPress}
    >
      {/* Top Header Row with Icon */}
      <View style={styles.vitalsCardHeaderRow}>
        <View style={[styles.vitalsIconCircle, { backgroundColor: pillBgColor }]}>
          <MaterialIcons name={iconName} size={18} color={iconColor} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.vitalsCardTitle} numberOfLines={1}>{title}</Text>
          <Text style={styles.vitalsCardSub} numberOfLines={1}>{subtitle}</Text>
        </View>
      </View>

      {/* Mini SVG Chart Line */}
      <View style={styles.vitalsMiniChartArea}>
        <View style={styles.vitalsYAxisColumn}>
          <Text style={styles.vitalsUnitText}>{unit}</Text>
          {yLabels.slice(0, 3).map((lbl, idx) => (
            <Text key={`y-${idx}`} style={styles.vitalsYLabel}>{lbl}</Text>
          ))}
        </View>

        <View style={styles.vitalsSvgBox}>
          <Svg height="60" width="100%" viewBox="0 0 160 60">
            {/* Grid Lines */}
            <Line x1="0" y1="10" x2="160" y2="10" stroke="#F1F5F9" strokeWidth="1" />
            <Line x1="0" y1="30" x2="160" y2="30" stroke="#F1F5F9" strokeWidth="1" />
            <Line x1="0" y1="50" x2="160" y2="50" stroke="#CBD5E1" strokeWidth="1.5" />

            {hasData && chartData.pathD ? (
              <>
                <Path
                  d={chartData.pathD}
                  fill="none"
                  stroke={iconColor}
                  strokeWidth="2.5"
                />
                {chartData.coords.map((c, i) => (
                  <SvgCircle key={`pt-${i}`} cx={c.x} cy={c.y} r="3.5" fill={iconColor} />
                ))}
              </>
            ) : null}
          </Svg>
        </View>
      </View>

      {/* Table Header Pill */}
      <View style={styles.vitalsTableHeaderBar}>
        {headers.slice(0, fullWidth ? 5 : 3).map((h, i) => (
          <Text key={`head-${i}`} style={styles.vitalsTableHeadCell} numberOfLines={1}>
            {h}
          </Text>
        ))}
      </View>

      {/* Latest Record / No Records Text */}
      <View style={styles.vitalsTableBody}>
        {hasData ? (
          <Text style={styles.vitalsDataValText}>{latestVal} {unit}</Text>
        ) : (
          <Text style={styles.vitalsNoRecordsText}>No Records Found</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

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

  // Family Members Query & Active Patient Context (Web Dashboard Compatible)
  const { data: familyMembersData } = useGetFamilyMembersQuery(userIdStr, { skip: !userIdStr });
  const [selectedMemberId, setSelectedMemberId] = useState<string>('SELF');

  const familyMembersList: FamilyMemberModel[] = useMemo(() => {
    if (Array.isArray(familyMembersData)) return familyMembersData;
    if (Array.isArray((familyMembersData as any)?.data)) return (familyMembersData as any).data;
    if (Array.isArray((familyMembersData as any)?.response)) return (familyMembersData as any).response;
    return [];
  }, [familyMembersData]);

  // Fetch Appointments & Medical Files for Dashboard Widgets
  const { data: rawAppointmentsData } = useGetAppointmentsQuery(userIdStr, { skip: !userIdStr });
  const { data: rawPatientFilesData } = useGetPatientFilesQuery(
    { userId: userIdStr, familyMemberId: selectedMemberId === 'ALL' ? undefined : selectedMemberId },
    { skip: !userIdStr }
  );

  const appointmentsList = useMemo(() => {
    if (Array.isArray(rawAppointmentsData)) return rawAppointmentsData;
    if (Array.isArray((rawAppointmentsData as any)?.data)) return (rawAppointmentsData as any).data;
    if (Array.isArray((rawAppointmentsData as any)?.response)) return (rawAppointmentsData as any).response;
    return [];
  }, [rawAppointmentsData]);

  const latestAppointments = useMemo(() => {
    return appointmentsList.slice(0, 3);
  }, [appointmentsList]);

  const filesList = useMemo(() => {
    if (Array.isArray(rawPatientFilesData)) return rawPatientFilesData;
    if (Array.isArray((rawPatientFilesData as any)?.data)) return (rawPatientFilesData as any).data;
    if (Array.isArray((rawPatientFilesData as any)?.response)) return (rawPatientFilesData as any).response;
    return [];
  }, [rawPatientFilesData]);

  const latestFiles = useMemo(() => {
    return filesList.slice(0, 3);
  }, [filesList]);

  // Dynamic Vitals Queries based on active selected member filter
  const activeFamilyId = useMemo(() => {
    if (selectedMemberId === 'ALL' || selectedMemberId === 'SELF') return userIdStr;
    return selectedMemberId;
  }, [selectedMemberId, userIdStr]);

  const { data: rawBpVitals } = useGetVitalsQuery(
    { familyMemberId: activeFamilyId, type: 'Blood Pressure' },
    { skip: !activeFamilyId }
  );
  const { data: rawSugarVitals } = useGetVitalsQuery(
    { familyMemberId: activeFamilyId, type: 'Sugar' },
    { skip: !activeFamilyId }
  );
  const { data: rawWeightVitals } = useGetVitalsQuery(
    { familyMemberId: activeFamilyId, type: 'Weight' },
    { skip: !activeFamilyId }
  );
  const { data: rawTempVitals } = useGetVitalsQuery(
    { familyMemberId: activeFamilyId, type: 'Temperature' },
    { skip: !activeFamilyId }
  );
  const { data: rawSpo2Vitals } = useGetVitalsQuery(
    { familyMemberId: activeFamilyId, type: 'SpO2' },
    { skip: !activeFamilyId }
  );

  const getLatestVitalValue = (rawData: any, type: string) => {
    if (!rawData) return 'N/A';
    let list: any[] = [];
    if (Array.isArray(rawData)) list = rawData;
    else if (Array.isArray(rawData?.data)) list = rawData.data;
    else if (Array.isArray(rawData?.response)) list = rawData.response;
    if (list.length === 0) return 'N/A';
    const latest = list[0];
    if (type === 'Blood Pressure') {
      if (latest.bp_systolic && latest.bp_diastolic) return `${latest.bp_systolic}/${latest.bp_diastolic}`;
      if (latest.value) return String(latest.value);
      return 'N/A';
    }
    if (type === 'Sugar') {
      if (latest.sugar_fasting) return String(latest.sugar_fasting);
      if (latest.sugar_random) return String(latest.sugar_random);
      if (latest.value) return String(latest.value);
      return 'N/A';
    }
    if (type === 'Weight') return latest.weight || latest.value ? String(latest.weight || latest.value) : 'N/A';
    if (type === 'Temperature') return latest.temperature || latest.value ? String(latest.temperature || latest.value) : 'N/A';
    if (type === 'SpO2') return latest.spo2 || latest.value ? String(latest.spo2 || latest.value) : 'N/A';
    return 'N/A';
  };

  const calculatePatientAge = (dobString?: string) => {
    if (!dobString || dobString === 'N/A' || dobString === 'null' || dobString === 'undefined') return 'N/A';
    const birthDate = new Date(dobString);
    if (isNaN(birthDate.getTime())) return 'N/A';
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age > 0 ? `${age} Yrs` : 'N/A';
  };

  const activePatientInfo = useMemo(() => {
    const mainUser = userProfileData?.data ?? userProfileData ?? user;
    let recentDocName = 'No Recent Appointment';
    if (latestAppointments.length > 0) {
      const app = latestAppointments[0];
      recentDocName = formatDoctorName(app.doct_f_name || app.doctor_name || app.name, app.doct_l_name);
    }

    if (selectedMemberId === 'SELF') {
      const dobStr = mainUser?.dob ? String(mainUser.dob).split('T')[0] : undefined;
      return {
        name: getUserFullName(mainUser) || 'N/A',
        gender: mainUser?.gender || 'N/A',
        dob: dobStr || 'N/A',
        age: calculatePatientAge(dobStr),
        bloodGroup: mainUser?.blood_group || mainUser?.blood_g || 'N/A',
        consultingDoctor: recentDocName,
        relation: 'Self',
        isSelf: true,
      };
    }
    if (selectedMemberId !== 'ALL') {
      const member = familyMembersList.find((m) => String(m.id) === String(selectedMemberId));
      if (member) {
        const dobStr = member.dob ? String(member.dob).split('T')[0] : undefined;
        return {
          name: `${member.f_name || ''} ${member.l_name || ''}`.trim() || 'N/A',
          gender: member.gender || 'N/A',
          dob: dobStr || 'N/A',
          age: calculatePatientAge(dobStr),
          bloodGroup: (member as any).blood_group || (member as any).blood_g || 'N/A',
          consultingDoctor: recentDocName,
          relation: member.relationship || (member as any).relation || 'Family Member',
          isSelf: false,
        };
      }
    }
    const dobStr = mainUser?.dob ? String(mainUser.dob).split('T')[0] : undefined;
    return {
      name: getUserFullName(mainUser) || 'N/A',
      gender: mainUser?.gender || 'N/A',
      dob: dobStr || 'N/A',
      age: calculatePatientAge(dobStr),
      bloodGroup: mainUser?.blood_group || mainUser?.blood_g || 'N/A',
      consultingDoctor: recentDocName,
      relation: 'Account Holder',
      isSelf: true,
    };
  }, [selectedMemberId, familyMembersList, userProfileData, user, latestAppointments]);



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

  const handleOpenFile = useCallback((item: any) => {
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
  }, []);

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
      {/* Main Scroll Content - 100% Redesigned UI from Scratch */}
      <ScrollView
        style={styles.scrollArea}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom + 130, 160) },
        ]}
      >
        {/* Section 1: Patient Dashboard Section (when authenticated) */}
        {isAuthenticated && (
          <View style={styles.newDashboardSection}>
            <View style={styles.memberFilterHeaderRow}>
              <Text style={styles.memberFilterTitle}>Patients Dashboard</Text>
              <TouchableOpacity
                style={styles.viewAllBtn}
                onPress={() => navigation.navigate('FamilyMemberList')}
                activeOpacity={0.7}
              >
                <Text style={styles.viewAllText}>Manage Members</Text>
                <MaterialIcons name="arrow-forward-ios" size={12} color={Colors.primaryColor} />
              </TouchableOpacity>
            </View>

            {/* Clean Member Filter Pills */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.memberPillsScroll}
            >
              <TouchableOpacity
                style={[styles.memberPill, selectedMemberId === 'SELF' && styles.memberPillActive]}
                onPress={() => setSelectedMemberId('SELF')}
                activeOpacity={0.8}
              >
                <Text style={[styles.memberPillText, selectedMemberId === 'SELF' && styles.memberPillTextActive]}>
                  Self ({user?.f_name || 'Patient'})
                </Text>
              </TouchableOpacity>

              {familyMembersList.map((m) => {
                const memberId = String(m.id);
                const isSelected = selectedMemberId === memberId;
                return (
                  <TouchableOpacity
                    key={`member-pill-${memberId}`}
                    style={[styles.memberPill, isSelected && styles.memberPillActive]}
                    onPress={() => setSelectedMemberId(memberId)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.memberPillText, isSelected && styles.memberPillTextActive]}>
                      {m.f_name} {m.l_name}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              {/* + Add Member Pill at the end */}
              <TouchableOpacity
                style={[styles.memberPill, styles.addMemberPill]}
                onPress={() => navigation.navigate('FamilyMemberList')}
                activeOpacity={0.8}
              >
                <Text style={styles.addMemberPillText}>+ Add Member</Text>
              </TouchableOpacity>
            </ScrollView>

            {/* Patient Profile Card (#06123A) - Exact Layout from SS (5 Data Items, NO chevron) */}
            <View style={styles.webNavyBannerCard}>
              <View style={styles.webNavyGrid}>
                {/* 1. Patient Name */}
                <View style={styles.webNavyGridItem}>
                  <View style={[styles.webNavyCircleIcon, { backgroundColor: '#FDE68A' }]}>
                    <MaterialIcons name="person-outline" size={18} color="#D97706" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.webNavyValueText} numberOfLines={1}>{activePatientInfo.name}</Text>
                    <Text style={styles.webNavyLabelText}>Patient Name</Text>
                  </View>
                </View>

                {/* 2. Gender */}
                <View style={styles.webNavyGridItem}>
                  <View style={[styles.webNavyCircleIcon, { backgroundColor: '#A7F3D0' }]}>
                    <MaterialIcons name="wc" size={18} color="#059669" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.webNavyValueText} numberOfLines={1}>{activePatientInfo.gender}</Text>
                    <Text style={styles.webNavyLabelText}>Gender</Text>
                  </View>
                </View>

                {/* 3. Patient Age */}
                <View style={styles.webNavyGridItem}>
                  <View style={[styles.webNavyCircleIcon, { backgroundColor: '#FBCFE8' }]}>
                    <MaterialIcons name="analytics" size={18} color="#DB2777" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.webNavyValueText} numberOfLines={1}>{activePatientInfo.age}</Text>
                    <Text style={styles.webNavyLabelText}>Patient Age</Text>
                  </View>
                </View>

                {/* 4. Blood Group */}
                <View style={styles.webNavyGridItem}>
                  <View style={[styles.webNavyCircleIcon, { backgroundColor: '#FED7AA' }]}>
                    <MaterialIcons name="opacity" size={18} color="#EA580C" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.webNavyValueText} numberOfLines={1}>{activePatientInfo.bloodGroup}</Text>
                    <Text style={styles.webNavyLabelText}>Blood Group</Text>
                  </View>
                </View>

                {/* 5. Consulting Doctor (NO chevron icon!) */}
                <View style={styles.webNavyGridItemFull}>
                  <View style={[styles.webNavyCircleIcon, { backgroundColor: '#BFDBFE' }]}>
                    <MaterialIcons name="medical-services" size={18} color="#2563EB" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.webNavyValueText} numberOfLines={1}>{activePatientInfo.consultingDoctor}</Text>
                    <Text style={styles.webNavyLabelText}>Consulting Doctor</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Health Vitals Tracker Header */}
            <View style={styles.vitalsSectionHeader}>
              <Text style={styles.vitalsSectionTitle}>Health Vitals Tracker ({activePatientInfo.name})</Text>
              <TouchableOpacity
                style={styles.viewAllBtn}
                onPress={() => navigation.navigate('Vitals')}
                activeOpacity={0.7}
              >
                <Text style={styles.viewAllText}>Log Vitals</Text>
                <MaterialIcons name="arrow-forward-ios" size={12} color={Colors.primaryColor} />
              </TouchableOpacity>
            </View>

            {/* Vitals 2-Column Grid Cards (Accurate SVG Chart curves from API) */}
            <View style={styles.vitals2ColGridContainer}>
              {/* 1. BP Levels */}
              <VitalChartCard
                vitalType="Blood Pressure"
                title="BP Levels"
                subtitle="Recent visits"
                unit="mmHg"
                iconName="favorite"
                iconColor="#EF4444"
                pillBgColor="#FEE2E2"
                headers={['SYSTOLIC', 'DIASTOLIC', 'DATE']}
                records={rawBpVitals}
                latestVal={getLatestVitalValue(rawBpVitals, 'Blood Pressure')}
                onPress={() => navigation.navigate('Vitals')}
              />

              {/* 2. Sugar Levels */}
              <VitalChartCard
                vitalType="Sugar"
                title="Sugar Levels"
                subtitle="Recent 5 visits"
                unit="mg/dL"
                iconName="opacity"
                iconColor="#8B5CF6"
                pillBgColor="#EDE9FE"
                headers={['FASTING', 'RANDOM', 'DATE']}
                records={rawSugarVitals}
                latestVal={getLatestVitalValue(rawSugarVitals, 'Sugar')}
                onPress={() => navigation.navigate('Vitals')}
              />

              {/* 3. Weight */}
              <VitalChartCard
                vitalType="Weight"
                title="Weight"
                subtitle="Recent 5 visits"
                unit="kg"
                iconName="fitness-center"
                iconColor="#10B981"
                pillBgColor="#D1FAE5"
                headers={['WEIGHT', 'DATE', 'TIME']}
                records={rawWeightVitals}
                latestVal={getLatestVitalValue(rawWeightVitals, 'Weight')}
                onPress={() => navigation.navigate('Vitals')}
              />

              {/* 4. Temperature */}
              <VitalChartCard
                vitalType="Temperature"
                title="Temperature"
                subtitle="Recent 5 visits"
                unit="°F"
                iconName="thermostat"
                iconColor="#F59E0B"
                pillBgColor="#FEF3C7"
                headers={['TEMP (°F)', 'DATE', 'TIME']}
                records={rawTempVitals}
                latestVal={getLatestVitalValue(rawTempVitals, 'Temperature')}
                onPress={() => navigation.navigate('Vitals')}
              />

              {/* 5. SpO2 Oxygen */}
              <VitalChartCard
                vitalType="SpO2"
                title="SpO2 Oxygen"
                subtitle="Recent 5 visits"
                unit="%"
                iconName="air"
                iconColor="#0284C7"
                pillBgColor="#E0F2FE"
                headers={['SPO2 (%)', 'DATE', 'TIME', 'ACTION']}
                records={rawSpo2Vitals}
                latestVal={getLatestVitalValue(rawSpo2Vitals, 'SpO2')}
                onPress={() => navigation.navigate('Vitals')}
                fullWidth
                yLabels={['100', '90', '80']}
              />
            </View>

            {/* Appointment List (Mobile Card List Items - NO squished multi-column tables) */}
            <View style={styles.webTableCard}>
              <View style={styles.webTableHeaderRow}>
                <Text style={styles.webTableTitle}>Appointment List</Text>
                <TouchableOpacity
                  style={styles.viewAllBtn}
                  onPress={() => navigation.navigate('MyBookings')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.viewAllText}>View All</Text>
                  <MaterialIcons name="arrow-forward-ios" size={12} color={Colors.primaryColor} />
                </TouchableOpacity>
              </View>

              <View style={styles.mobileCardStack}>
                {latestAppointments.length > 0 ? (
                  latestAppointments.map((app: any, idx: number) => {
                    const docName = formatDoctorName(app.doct_f_name || app.doctor_name || app.name || 'Vivek Singh', app.doct_l_name);
                    const dateStr = app.date ? String(app.date).split('T')[0] : 'Aug 26, 2026';
                    const timeStr = app.time_slots || '07:50 PM';
                    return (
                      <View key={`app-row-${app.id || idx}`} style={styles.mobileCardItem}>
                        <View style={styles.appointmentIconCircle}>
                          <MaterialIcons name="event" size={20} color={Colors.primaryColor} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.mobileCardTitle} numberOfLines={1}>{docName}</Text>
                          <Text style={styles.mobileCardSub}>{dateStr} • {timeStr}</Text>
                        </View>
                        <View style={styles.statusPill}>
                          <Text style={styles.statusPillText}>{app.status || 'Confirmed'}</Text>
                        </View>
                      </View>
                    );
                  })
                ) : (
                  <>
                    <View style={styles.mobileCardItem}>
                      <View style={styles.appointmentIconCircle}>
                        <MaterialIcons name="event" size={20} color={Colors.primaryColor} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.mobileCardTitle} numberOfLines={1}>Dr. Vivek Singh</Text>
                        <Text style={styles.mobileCardSub}>Aug-26, 2026 • 7:50 PM</Text>
                      </View>
                      <View style={styles.statusPill}>
                        <Text style={styles.statusPillText}>Confirmed</Text>
                      </View>
                    </View>
                    <View style={styles.mobileCardItem}>
                      <View style={styles.appointmentIconCircle}>
                        <MaterialIcons name="event" size={20} color={Colors.primaryColor} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.mobileCardTitle} numberOfLines={1}>Dr. Vivek Sabarwal</Text>
                        <Text style={styles.mobileCardSub}>Aug-26, 2026 • 10:21 AM</Text>
                      </View>
                      <View style={styles.statusPill}>
                        <Text style={styles.statusPillText}>Confirmed</Text>
                      </View>
                    </View>
                  </>
                )}
              </View>
            </View>

            {/* Patient Files (Mobile Card List Items - NO squished multi-column tables) */}
            <View style={styles.webTableCard}>
              <View style={styles.webTableHeaderRow}>
                <Text style={styles.webTableTitle}>Files</Text>
                <TouchableOpacity
                  style={styles.viewAllBtn}
                  onPress={() => navigation.navigate('PatientFile')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.viewAllText}>View All</Text>
                  <MaterialIcons name="arrow-forward-ios" size={12} color={Colors.primaryColor} />
                </TouchableOpacity>
              </View>

              <View style={styles.mobileCardStack}>
                {latestFiles.length > 0 ? (
                  latestFiles.map((file: any, idx: number) => {
                    const fileName = file.title || file.name || file.file_name || `Report #${idx + 1}`;
                    const fileDate = file.created_at ? String(file.created_at).split('T')[0] : 'Aug-20, 2026';
                    return (
                      <TouchableOpacity
                        key={`file-row-${file.id || idx}`}
                        style={styles.mobileCardItem}
                        activeOpacity={0.8}
                        onPress={() => handleOpenFile(file)}
                      >
                        <View style={[styles.fileIconBadge, { backgroundColor: '#EFF6FF' }]}>
                          <MaterialIcons name="folder" size={20} color="#2563EB" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.mobileCardTitle} numberOfLines={1}>{fileName}</Text>
                          <Text style={styles.mobileCardSub}>{fileDate}</Text>
                        </View>
                        <View style={styles.openFileBtn}>
                          <MaterialIcons name="open-in-new" size={18} color={Colors.primaryColor} />
                        </View>
                      </TouchableOpacity>
                    );
                  })
                ) : (
                  <>
                    <TouchableOpacity
                      style={styles.mobileCardItem}
                      activeOpacity={0.8}
                      onPress={() => navigation.navigate('PatientFile')}
                    >
                      <View style={[styles.fileIconBadge, { backgroundColor: '#FEE2E2' }]}>
                        <MaterialIcons name="picture-as-pdf" size={20} color="#DC2626" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.mobileCardTitle} numberOfLines={1}>Riyaaa</Text>
                        <Text style={styles.mobileCardSub}>Aug-20, 2026</Text>
                      </View>
                      <View style={styles.openFileBtn}>
                        <MaterialIcons name="open-in-new" size={18} color={Colors.primaryColor} />
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.mobileCardItem}
                      activeOpacity={0.8}
                      onPress={() => navigation.navigate('PatientFile')}
                    >
                      <View style={[styles.fileIconBadge, { backgroundColor: '#FEE2E2' }]}>
                        <MaterialIcons name="picture-as-pdf" size={20} color="#DC2626" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.mobileCardTitle} numberOfLines={1}>BP_Test</Text>
                        <Text style={styles.mobileCardSub}>Jul-14, 2026</Text>
                      </View>
                      <View style={styles.openFileBtn}>
                        <MaterialIcons name="open-in-new" size={18} color={Colors.primaryColor} />
                      </View>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Section 2: Promotional Banners Slider */}
        {bannerList.length > 0 && (
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
                const bannerUri = getImageUrl(banner.image);
                return (
                  <View key={`banner-${banner.id || index}`} style={styles.bannerSlide}>
                    {bannerUri ? (
                      <Image source={{ uri: bannerUri }} style={styles.bannerImage} resizeMode="cover" />
                    ) : (
                      <View style={styles.promoCardGradient}>
                        <View style={styles.promoCardTextGroup}>
                          <Text style={styles.promoBadge}>SPECIAL CARE</Text>
                          <Text style={styles.promoHeading}>{banner.title || 'Comprehensive Elderly Healthcare'}</Text>
                          <Text style={styles.promoSubtext}>Book appointments with top specialists near you</Text>
                        </View>
                        <MaterialIcons name="health-and-safety" size={48} color="rgba(255, 255, 255, 0.8)" style={styles.promoIcon} />
                      </View>
                    )}
                  </View>
                );
              })}
            </ScrollView>
            {bannerList.length > 1 && (
              <View style={styles.dotsRow}>
                {bannerList.map((_, idx) => (
                  <View
                    key={`dot-${idx}`}
                    style={[styles.dot, activeBannerIndex === idx && styles.dotActive]}
                  />
                ))}
              </View>
            )}
          </View>
        )}

        {/* Section 5: Medical Specialities */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionHeading}>Medical Specialties</Text>
            <Text style={styles.sectionSubheading}>Explore by specialization</Text>
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

        {/* Section 6: Top Verified Doctors */}
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

        {/* Section 7: Emergency & 24/7 Care Hotline Banner */}
        <View style={styles.supportBannerCard}>
          <View style={styles.supportIconBox}>
            <MaterialIcons name="support-agent" size={30} color={Colors.primaryColor} />
          </View>
          <View style={styles.supportMeta}>
            <Text style={styles.supportTitle}>Need Emergency Assistance?</Text>
            <Text style={styles.supportDesc}>
              Our elderly care helpline is active 24/7 for patient queries and support.
            </Text>
          </View>
          <TouchableOpacity
            style={styles.supportCallBtn}
            onPress={() => navigation.navigate('ContactUs')}
            activeOpacity={0.8}
          >
            <MaterialIcons name="call" size={16} color={Colors.white} />
            <Text style={styles.supportCallText}>Contact</Text>
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
    backgroundColor: '#EFF6FF',
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
    marginTop: 0,
    marginBottom: 0,
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
    backgroundColor: '#EFF6FF',
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
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Section Headers */
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 10,
    marginBottom: 8,
  },
  sectionHeading: {
    fontSize: 15,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryFontColor,
  },
  sectionSubheading: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.secondaryFontColor,
    marginTop: 2,
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
    backgroundColor: '#EFF6FF',
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
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 3,
  },
  ratingBadgeText: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.bold,
    color: '#2563EB',
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
    backgroundColor: '#EFF6FF',
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
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.2)',
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
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.2)',
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
    backgroundColor: '#EFF6FF',
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
    backgroundColor: '#EFF6FF',
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
    backgroundColor: '#EFF6FF',
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

  /* Web Dashboard Member Filter & Vitals Overview */
  memberFilterSection: {
    marginBottom: 16,
  },
  memberFilterHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  memberFilterTitle: {
    fontSize: 15,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryFontColor,
  },
  manageMembersLink: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryColor,
  },
  memberPillsScroll: {
    gap: 8,
    paddingRight: 10,
    marginBottom: 12,
  },
  memberPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.primaryColor,
  },
  memberPillActive: {
    backgroundColor: Colors.primaryColor,
  },
  memberPillText: {
    fontSize: 12,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.primaryColor,
  },
  memberPillTextActive: {
    color: Colors.white,
    fontFamily: Typography.fontFamily.bold,
  },
  addMemberPill: {
    backgroundColor: '#EFF6FF',
    borderColor: '#DBEAFE',
    borderStyle: 'dashed',
  },
  addMemberPillText: {
    fontSize: 12,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryColor,
  },
  dashboardSummaryCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  vitalsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 10,
  },
  vitalsSectionTitle: {
    fontSize: 15,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryFontColor,
  },
  vitalsViewAllText: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryColor,
  },
  vitalsScrollGrid: {
    gap: 10,
  },
  vitalCardChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  vitalChipIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vitalChipLabel: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.secondaryFontColor,
  },
  vitalChipValue: {
    fontSize: 12,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryFontColor,
    marginTop: 1,
  },
  vitalChipUnit: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.secondaryFontColor,
  },
  /* New Dashboard & Services Grid Styles */
  newDashboardSection: {
    paddingHorizontal: 16,
    marginTop: 12,
    marginBottom: 0,
  },
  newServicesSection: {
    marginHorizontal: 16,
    marginTop: 18,
    marginBottom: 8,
  },
  newSectionHeading: {
    fontSize: 16,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryFontColor,
  },
  newSectionSubheading: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.secondaryFontColor,
    marginTop: 2,
    marginBottom: 12,
  },
  newServicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  newServiceCard: {
    width: '48%',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  newServiceIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  newServiceTitle: {
    fontSize: 13,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryFontColor,
  },
  newServiceSub: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.secondaryFontColor,
    marginTop: 2,
  },
  supportCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryColor,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  supportCallText: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
  },

  /* Vibrant Royal Blue Patient Profile Banner Styles */
  webNavyBannerCard: {
    backgroundColor: '#1E3A8A',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  webNavyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  webNavyGridItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 12,
    padding: 10,
    gap: 10,
  },
  webNavyGridItemFull: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 12,
    padding: 10,
    gap: 10,
  },
  webNavyCircleIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  webNavyValueText: {
    fontSize: 13,
    fontFamily: Typography.fontFamily.bold,
    color: '#FFFFFF',
  },
  webNavyLabelText: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.medium,
    color: '#93C5FD',
    marginTop: 1,
  },


  vitals2ColGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  vitalGridCard: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  vitalGridCardFull: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  webTableCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  /* Mobile Card Stack Items */
  mobileCardStack: {
    gap: 8,
  },
  mobileCardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  appointmentIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mobileCardTitle: {
    fontSize: 13,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryFontColor,
  },
  mobileCardSub: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.secondaryFontColor,
    marginTop: 2,
  },
  fileIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  openFileBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  webTableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  webTableTitle: {
    fontSize: 15,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryFontColor,
  },
  statusPill: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  statusPillText: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.bold,
    color: '#059669',
  },
  downloadIconBtn: {
    padding: 6,
  },
  /* Vitals 2-Column Grid Cards Styles */
  vitals2ColGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  vitalsGridCard: {
    width: '48.5%',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  vitalsGridCardFull: {
    width: '100%',
  },
  vitalsCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  vitalsIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vitalsCardTitle: {
    fontSize: 13,
    fontFamily: Typography.fontFamily.bold,
    color: '#0F172A',
  },
  vitalsCardSub: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.medium,
    color: '#94A3B8',
    marginTop: 1,
  },
  vitalsMiniChartArea: {
    flexDirection: 'row',
    width: '100%',
    height: 60,
    marginBottom: 8,
  },
  vitalsYAxisColumn: {
    width: 26,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 1,
  },
  vitalsUnitText: {
    fontSize: 8,
    fontFamily: Typography.fontFamily.bold,
    color: '#64748B',
  },
  vitalsYLabel: {
    fontSize: 8,
    fontFamily: Typography.fontFamily.medium,
    color: '#94A3B8',
  },
  vitalsSvgBox: {
    flex: 1,
    justifyContent: 'center',
  },
  vitalsTableHeaderBar: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 4,
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  vitalsTableHeadCell: {
    fontSize: 8,
    fontFamily: Typography.fontFamily.bold,
    color: '#475569',
    textAlign: 'center',
    flex: 1,
  },
  vitalsTableBody: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 20,
  },
  vitalsNoRecordsText: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.medium,
    color: '#94A3B8',
  },
  vitalsDataValText: {
    fontSize: 12,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryColor,
  },
});







