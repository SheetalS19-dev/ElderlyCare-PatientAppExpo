import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { requireOptionalNativeModule } from 'expo-modules-core';
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Line } from 'react-native-svg';
import {
  AppButton,
  AppDatePickerModal,
  AppTextField,
  AppTimePickerModal,
  BottomTabBar,
  CitySelectModal,
  ErrorState,
  LoadingIndicator,
  SearchBox
} from '../../components';
import { Colors, Images, Typography } from '../../constants';
import { useAuth } from '../../context/AuthContext';
import type { RootStackParamList } from '../../navigation/types';
import { useGetAppointmentsQuery } from '../../redux/apis/appointmentApi';
import { useGetFamilyMembersQuery } from '../../redux/apis/bookingApi';
import { useGetClinicsQuery } from '../../redux/apis/clinicApi';
import {
  useGetBannersQuery,
  useGetCitiesQuery,
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
import { useDeleteVitalMutation, useGetVitalsQuery, useUpdateVitalMutation } from '../../redux/apis/vitalsApi';
import { getUserFullName, type FamilyMemberModel, type NotificationModel } from '../../types';
import { DateTimeUtils, downloadAndSaveFile, formatDoctorName, fs, getImageUrl, hs, isWithinLast7Days, showToast, TYPOGRAPHY, ws } from '../../utils';





type RootNavigation = NativeStackNavigationProp<RootStackParamList>;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DOCTOR_CARD_WIDTH = Math.floor((SCREEN_WIDTH - ws(32) - ws(10)) / 2);

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

  const filteredList = list.filter((item) => isWithinLast7Days(item.date || item.created_at));
  if (!filteredList || filteredList.length === 0) return [];

  const slice = [...filteredList].slice(0, 5).reverse();
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
  onDeleteRecord?: (id: string | number) => void;
  onEditRecord?: (item: any) => void;
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
  onDeleteRecord,
  onEditRecord,
  fullWidth = true,
  yLabels = ['4', '3', '2', '1', '0'],
}: VitalChartCardProps) => {
  const last7DaysRecords = useMemo(() => {
    let list: any[] = [];
    if (Array.isArray(records)) list = records;
    else if (Array.isArray(records?.data)) list = records.data;
    else if (Array.isArray(records?.response)) list = records.response;

    const filtered = list.filter((item) => isWithinLast7Days(item.date || item.created_at));
    return [...filtered].sort((a, b) => {
      const timeA = new Date(a.date || a.created_at || 0).getTime();
      const timeB = new Date(b.date || b.created_at || 0).getTime();
      return timeB - timeA;
    });
  }, [records]);

  const hasData = last7DaysRecords.length > 0;

  const { computedYLabels, minY, maxY } = useMemo(() => {
    if (!hasData) {
      if (vitalType === 'Weight' || vitalType === 'Temperature') {
        return { computedYLabels: ['4', '2', '0'], minY: 0, maxY: 4 };
      }
      if (vitalType === 'SpO2') {
        return { computedYLabels: ['100', '90', '80'], minY: 80, maxY: 100 };
      }
      return { computedYLabels: ['4', '3', '2', '1', '0'], minY: 0, maxY: 4 };
    }

    if (vitalType === 'Blood Pressure') {
      let maxV = 0;
      let minV = 999;
      last7DaysRecords.forEach((r) => {
        const s = Number(r.bp_systolic || 0);
        const d = Number(r.bp_diastolic || 0);
        if (s > maxV) maxV = s;
        if (d > 0 && d < minV) minV = d;
      });
      if (maxV === 0) maxV = 140;
      if (minV === 999) minV = 70;

      let top = Math.ceil(maxV / 5) * 5;
      if (top - maxV < 3) top += 5;
      let bottom = Math.floor(minV / 5) * 5;
      if (minV - bottom < 2) bottom -= 5;
      if (bottom < 0) bottom = 0;

      const step = (top - bottom) / 3;
      const labels = [
        String(Math.round(top)),
        String(Math.round(top - step)),
        String(Math.round(top - step * 2)),
        String(Math.round(bottom)),
      ];
      return { computedYLabels: labels, minY: bottom, maxY: top };
    }

    if (vitalType === 'Sugar') {
      let maxV = 0;
      let minV = 999;
      last7DaysRecords.forEach((r) => {
        const f = Number(r.sugar_fasting || 0);
        const rand = Number(r.sugar_random || 0);
        if (f > maxV) maxV = f;
        if (rand > maxV) maxV = rand;
        if (f > 0 && f < minV) minV = f;
        if (rand > 0 && rand < minV) minV = rand;
      });
      if (maxV === 0) maxV = 160;
      if (minV === 999) minV = 70;

      let top = Math.ceil(maxV / 10) * 10;
      let bottom = Math.floor(minV / 10) * 10;
      if (top <= bottom) top = bottom + 30;

      const step = (top - bottom) / 3;
      const labels = [
        String(Math.round(top)),
        String(Math.round(top - step)),
        String(Math.round(top - step * 2)),
        String(Math.round(bottom)),
      ];
      return { computedYLabels: labels, minY: bottom, maxY: top };
    }

    if (vitalType === 'Weight') {
      let maxV = 0;
      let minV = 999;
      last7DaysRecords.forEach((r) => {
        const v = Number(r.weight || r.value || 0);
        if (v > maxV) maxV = v;
        if (v > 0 && v < minV) minV = v;
      });
      if (maxV === 0) maxV = 70;
      if (minV === 999) minV = 50;

      let top = Math.ceil(maxV) + 1;
      let bottom = Math.floor(minV) - 1;
      if (top <= bottom) top = bottom + 2;

      const labels = [String(top), String(Math.round((top + bottom) / 2)), String(bottom)];
      return { computedYLabels: labels, minY: bottom, maxY: top };
    }

    if (vitalType === 'Temperature') {
      let maxV = 0;
      let minV = 999;
      last7DaysRecords.forEach((r) => {
        const v = Number(r.temperature || r.value || 0);
        if (v > maxV) maxV = v;
        if (v > 0 && v < minV) minV = v;
      });
      if (maxV === 0) maxV = 99;
      if (minV === 999) minV = 95;

      let top = Math.ceil(maxV) + 1;
      let bottom = Math.floor(minV) - 1;
      if (top <= bottom) top = bottom + 2;

      const labels = [String(top), String(Math.round((top + bottom) / 2)), String(bottom)];
      return { computedYLabels: labels, minY: bottom, maxY: top };
    }

    if (vitalType === 'SpO2') {
      return { computedYLabels: ['100', '90', '80'], minY: 80, maxY: 100 };
    }

    return { computedYLabels: yLabels, minY: 0, maxY: 100 };
  }, [hasData, vitalType, last7DaysRecords, yLabels]);

  const computedUnitLabel = useMemo(() => {
    if (vitalType === 'Weight') return 'Weight (kg)';
    if (vitalType === 'Temperature') return 'Temperature (°C)';
    if (vitalType === 'SpO2') return 'SpO2 (%)';
    return unit;
  }, [vitalType, unit]);

  const xAxisLabels = useMemo(() => {
    if (last7DaysRecords.length > 0) {
      const slice = [...last7DaysRecords].slice(0, 4).reverse();
      return slice.map((item) => {
        const dStr = item.date ? item.date.split('T')[0] : (item.created_at ? item.created_at.split('T')[0] : '');
        let dateFormatted = dStr ? DateTimeUtils.getDataFormat(dStr) : '';
        dateFormatted = dateFormatted.replace(/,?\s*\d{4}/g, '').trim();

        const timeFormatted = item.time ? (DateTimeUtils.formatTimeToAmPm(item.time) || item.time) : '';
        const cleanTime = (timeFormatted && timeFormatted !== '00:00' && timeFormatted !== '12:00 AM') ? timeFormatted : '00:00';
        return `${dateFormatted} ${cleanTime}`;
      });
    }
    const dates = [];
    const today = new Date();
    for (let i = 3; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
      let dateFormatted = DateTimeUtils.getDataFormat(d.toISOString().split('T')[0]);
      dateFormatted = dateFormatted.replace(/,?\s*\d{4}/g, '').trim();
      dates.push(`${dateFormatted} 00:00`);
    }
    return dates;
  }, [last7DaysRecords]);

  const chartPoints = useMemo(() => {
    if (last7DaysRecords.length === 0) return [];
    const slice = [...last7DaysRecords].slice(0, 4).reverse();
    const count = slice.length;

    // Fixed 4-column X positions (35, 105, 175, 245) matching 4 X-axis date labels evenly spaced across 270px
    const colStep = 210 / Math.max(1, count - 1);

    return slice.map((item, idx) => {
      let sys = 0;
      let dia = 0;
      let val = 0;
      let sugarFasting = 0;
      let sugarRandom = 0;

      if (vitalType === 'Blood Pressure') {
        sys = Number(item.bp_systolic || 0);
        dia = Number(item.bp_diastolic || 0);
      } else if (vitalType === 'Sugar') {
        sugarFasting = Number(item.sugar_fasting || 0);
        sugarRandom = Number(item.sugar_random || 0);
        val = sugarFasting || sugarRandom || Number(item.value || 0);
      } else if (vitalType === 'Weight') {
        val = Number(item.weight || item.value || 0);
      } else if (vitalType === 'Temperature') {
        val = Number(item.temperature || item.value || 0);
      } else if (vitalType === 'SpO2') {
        val = Number(item.spo2 || item.value || 0);
      }

      const cx = count === 1 ? 135 : 30 + idx * colStep;

      return { sys, dia, val, sugarFasting, sugarRandom, cx };
    });
  }, [last7DaysRecords, vitalType]);

  return (
    <TouchableOpacity
      style={[styles.vitalsGridCard, fullWidth && styles.vitalsGridCardFull]}
      activeOpacity={0.88}
      onPress={onPress}
    >
      {/* Top Header Row with Circle Icon, Title, Subtitle, & Red Note if no data */}
      <View style={styles.vitalsCardHeaderRow}>
        <View style={[styles.vitalsIconCircle, { backgroundColor: pillBgColor }]}>
          <MaterialIcons name={iconName} size={18} color={iconColor} />
        </View>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.vitalsCardTitle} numberOfLines={1}>{title}</Text>
          <Text style={styles.vitalsCardSub} numberOfLines={1}>{subtitle}</Text>
          {!hasData && (
            <Text style={[{ fontSize: fs(9), color: '#EF4444', marginTop: hs(2), textAlign: 'center' }, TYPOGRAPHY.medium]}>
              Note: Data beyond 7 days is not shown
            </Text>
          )}
        </View>

        {vitalType === 'Blood Pressure' && hasData && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: ws(6) }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: ws(2) }}>
              <View style={{ width: ws(8), height: hs(8), borderRadius: fs(4), backgroundColor: '#EF4444' }} />
              <Text style={[{ fontSize: fs(10), color: '#64748B' }, TYPOGRAPHY.medium]}>Systolic</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: ws(2) }}>
              <View style={{ width: ws(8), height: hs(8), borderRadius: fs(4), backgroundColor: '#2563EB' }} />
              <Text style={[{ fontSize: fs(10), color: '#64748B' }, TYPOGRAPHY.medium]}>Diastolic</Text>
            </View>
          </View>
        )}
        {vitalType === 'Sugar' && hasData && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: ws(6) }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: ws(2) }}>
              <View style={{ width: ws(8), height: hs(8), borderRadius: fs(4), backgroundColor: '#0284C7' }} />
              <Text style={[{ fontSize: fs(10), color: '#64748B' }, TYPOGRAPHY.medium]}>Fasting</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: ws(2) }}>
              <View style={{ width: ws(8), height: hs(8), borderRadius: fs(4), backgroundColor: '#F97316' }} />
              <Text style={[{ fontSize: fs(10), color: '#64748B' }, TYPOGRAPHY.medium]}>Random</Text>
            </View>
          </View>
        )}
      </View>

      {/* Mini Chart Area with Flexbox Left Column (Unit + Y-Axis Numbers) & SVG Right Area (Grid + Dots + X-Axis) */}
      <View style={styles.vitalsMiniChartArea}>
        {/* Left Column: Unit Label + Y-Axis Numbers sitting flush on left */}
        <View style={styles.vitalsLeftYAxisContainer}>
          {/* Rotated Vertical Unit Label */}
          <View style={styles.vitalsRotatedUnitBox}>
            <Text style={styles.vitalsRotatedUnitText} numberOfLines={1}>
              {computedUnitLabel}
            </Text>
          </View>

          {/* Y-Axis Numbers directly right next to Unit */}
          <View style={styles.vitalsYAxisNumberColumn}>
            {computedYLabels.map((lbl, idx) => (
              <Text key={`ylbl-${idx}`} style={styles.vitalsYAxisNumberText}>
                {lbl}
              </Text>
            ))}
          </View>
        </View>

        {/* Right Area: SVG Grid Lines, Dots & X-Axis Dates */}
        <View style={styles.vitalsSvgBox}>
          <Svg height="76" width="100%" viewBox="0 0 270 76" preserveAspectRatio="none">
            {/* Horizontal Grid Lines starting from x1=0 */}
            {computedYLabels.map((lbl, idx) => {
              const numCount = computedYLabels.length;
              const lineY = numCount > 1 ? 8 + idx * (60 / (numCount - 1)) : 38;
              return (
                <Line
                  key={`line-${idx}`}
                  x1="0"
                  y1={lineY}
                  x2="270"
                  y2={lineY}
                  stroke={idx === numCount - 1 ? '#CBD5E1' : '#F1F5F9'}
                  strokeWidth={idx === numCount - 1 ? 1.5 : 1}
                />
              );
            })}
          </Svg>

          {/* PERFECT UNIFORM CIRCLES (9x9, borderRadius=4.5 - Never distorted by SVG scaling!) */}
          {hasData && (
            <View style={styles.vitalsDotsOverlay} pointerEvents="none">
              {chartPoints.map((pt, i) => {
                const rangeY = maxY - minY || 1;
                const leftPercent = `${(pt.cx / 270) * 100}%`;

                if (vitalType === 'Blood Pressure') {
                  const sysY = 68 - Math.min(60, Math.max(0, ((pt.sys - minY) / rangeY) * 60));
                  const diaY = 68 - Math.min(60, Math.max(0, ((pt.dia - minY) / rangeY) * 60));
                  return (
                    <React.Fragment key={`pts-dot-${i}`}>
                      {pt.sys > 0 && (
                        <View
                          style={{
                            position: 'absolute',
                            left: leftPercent as any,
                            top: sysY - 4.5,
                            width: 9,
                            height: 9,
                            borderRadius: 4.5,
                            backgroundColor: '#EF4444',
                            marginLeft: -4.5,
                          }}
                        />
                      )}
                      {pt.dia > 0 && (
                        <View
                          style={{
                            position: 'absolute',
                            left: leftPercent as any,
                            top: diaY - 4.5,
                            width: 9,
                            height: 9,
                            borderRadius: 4.5,
                            backgroundColor: '#2563EB',
                            marginLeft: -4.5,
                          }}
                        />
                      )}
                    </React.Fragment>
                  );
                } else if (vitalType === 'Sugar') {
                  const fastY = 68 - Math.min(60, Math.max(0, ((pt.sugarFasting - minY) / rangeY) * 60));
                  const randY = 68 - Math.min(60, Math.max(0, ((pt.sugarRandom - minY) / rangeY) * 60));
                  return (
                    <React.Fragment key={`pts-dot-${i}`}>
                      {pt.sugarFasting > 0 && (
                        <View
                          style={{
                            position: 'absolute',
                            left: leftPercent as any,
                            top: fastY - 4.5,
                            width: 9,
                            height: 9,
                            borderRadius: 4.5,
                            backgroundColor: '#0284C7',
                            marginLeft: -4.5,
                          }}
                        />
                      )}
                      {pt.sugarRandom > 0 && (
                        <View
                          style={{
                            position: 'absolute',
                            left: leftPercent as any,
                            top: randY - 4.5,
                            width: 9,
                            height: 9,
                            borderRadius: 4.5,
                            backgroundColor: '#F97316',
                            marginLeft: -4.5,
                          }}
                        />
                      )}
                    </React.Fragment>
                  );
                } else {
                  const valY = 68 - Math.min(60, Math.max(0, ((pt.val - minY) / rangeY) * 60));
                  return pt.val > 0 ? (
                    <View
                      key={`pts-dot-${i}`}
                      style={{
                        position: 'absolute',
                        left: leftPercent as any,
                        top: valY - 5,
                        width: 10,
                        height: 10,
                        borderRadius: 5,
                        backgroundColor: iconColor,
                        marginLeft: -5,
                      }}
                    />
                  ) : null;
                }
              })}
            </View>
          )}

          {/* X-Axis Date Labels Row */}
          <View style={styles.vitalsXAxisRow}>
            {xAxisLabels.map((lbl, idx) => (
              <Text key={`x-${idx}`} style={styles.vitalsXLabel} numberOfLines={1}>
                {lbl}
              </Text>
            ))}
          </View>
        </View>
      </View>

      {/* Responsive Full Width Scrollable Table */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
        style={{ width: '100%' }}
      >
        <View style={{ minWidth: headers.length === 5 ? 420 : 340, width: '100%' }}>
          {/* Table Header Bar */}
          <View style={styles.vitalsTableHeaderBar}>
            {headers.map((h, i) => {
              const is5Col = headers.length === 5;
              const cellFlex = is5Col ? (i === 2 ? 1.4 : i === 3 || i === 4 ? 1.1 : 1) : (i === 1 ? 1.4 : i === 2 || i === 3 ? 1.1 : 1);
              const cellMinW = is5Col ? (i === 2 ? 95 : i === 3 || i === 4 ? 75 : 65) : (i === 1 ? 95 : i === 2 || i === 3 ? 75 : 75);
              return (
                <Text key={`head-${i}`} style={[styles.vitalsTableHeadCell, { flex: cellFlex, minWidth: cellMinW }]} numberOfLines={1}>
                  {h}
                </Text>
              );
            })}
          </View>

          {/* Records List (Vertical Scrollable) */}
          {hasData ? (
            <ScrollView
              style={{ maxHeight: 130, width: '100%' }}
              nestedScrollEnabled={true}
              showsVerticalScrollIndicator={true}
            >
              {last7DaysRecords.map((item, idx) => {
                const is5Col = headers.length === 5;
                const col0Flex = 1;
                const col0MinW = is5Col ? 65 : 75;
                const dateFlex = 1.4;
                const dateMinW = 95;
                const timeFlex = 1.1;
                const timeMinW = 75;
                const actionFlex = 1.1;
                const actionMinW = 75;

                const dateStr = item.date ? item.date.split('T')[0] : (item.created_at ? item.created_at.split('T')[0] : '--');
                const timeStr = item.time ? DateTimeUtils.formatTimeToAmPm(item.time) || item.time : '--';

                return (
                  <View key={`row-${item.id ?? idx}`} style={styles.vitalsTableRow}>
                    {vitalType === 'Blood Pressure' ? (
                      <>
                        <Text style={[styles.vitalsTableCellText, { flex: col0Flex, minWidth: col0MinW }]} numberOfLines={1}>{item.bp_systolic ?? '--'}</Text>
                        <Text style={[styles.vitalsTableCellText, { flex: col0Flex, minWidth: col0MinW }]} numberOfLines={1}>{item.bp_diastolic ?? '--'}</Text>
                      </>
                    ) : vitalType === 'Sugar' ? (
                      <>
                        <Text style={[styles.vitalsTableCellText, { flex: col0Flex, minWidth: col0MinW }]} numberOfLines={1}>{item.sugar_fasting ?? '--'}</Text>
                        <Text style={[styles.vitalsTableCellText, { flex: col0Flex, minWidth: col0MinW }]} numberOfLines={1}>{item.sugar_random ?? '--'}</Text>
                      </>
                    ) : (
                      <Text style={[styles.vitalsTableCellText, { flex: col0Flex, minWidth: col0MinW }]} numberOfLines={1}>
                        {item.weight || item.temperature || item.spo2 || item.value || '--'}
                      </Text>
                    )}
                    <Text style={[styles.vitalsTableCellText, { flex: dateFlex, minWidth: dateMinW }]} numberOfLines={1}>
                      {dateStr}
                    </Text>
                    <Text style={[styles.vitalsTableCellText, { flex: timeFlex, minWidth: timeMinW }]} numberOfLines={1}>
                      {timeStr}
                    </Text>

                    {/* ACTION Column with Edit and Delete Buttons */}
                    <View style={[styles.vitalsTableCellAction, { flex: actionFlex, minWidth: actionMinW }]}>
                      <TouchableOpacity
                        style={styles.actionIconBtnDelete}
                        onPress={() => onDeleteRecord && item.id && onDeleteRecord(item.id)}
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      >
                        <MaterialIcons name="delete-outline" size={19} color="#EF4444" />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.actionIconBtnEdit}
                        onPress={() => onEditRecord ? onEditRecord(item) : onPress()}
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      >
                        <MaterialIcons name="edit" size={19} color="#059669" />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          ) : (
            <View style={styles.vitalsTableBody}>
              <Text style={styles.vitalsNoRecordsText}>No Records Found</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </TouchableOpacity>
  );
};

const SAVED_LOCATION_KEY = 'SAVED_USER_CITY_LOCATION';

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<RootNavigation>();
  const { isAuthenticated, user } = useAuth();
  const insets = useSafeAreaInsets();

  const [deleteVital] = useDeleteVitalMutation();

  const handleDeleteVitalRecord = async (id: string | number) => {
    try {
      await deleteVital({ id }).unwrap();
      showToast('Record deleted');
    } catch (e: any) {
      showToast(e?.data?.message || 'Could not delete record');
    }
  };

  const [search, setSearch] = useState('');
  const [selectedCity, setSelectedCity] = useState<CityModel | null | undefined>(undefined);
  const [deviceLocationCity, setDeviceLocationCity] = useState<string | null>(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [citySearchQuery, setCitySearchQuery] = useState('');
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);

  // 1. Load saved location from AsyncStorage on mount
  useEffect(() => {
    const loadSavedLocation = async () => {
      try {
        const savedData = await AsyncStorage.getItem(SAVED_LOCATION_KEY);
        if (savedData) {
          const parsed = JSON.parse(savedData);
          if (parsed?.title?.toLowerCase().includes('lucknow')) {
            await AsyncStorage.removeItem(SAVED_LOCATION_KEY);
          } else if (parsed !== undefined) {
            setSelectedCity(parsed);
          }
        }
      } catch (err) {
        console.log('Error loading saved location:', err);
      }
    };
    loadSavedLocation();
  }, []);

  // 2. Fetch current device location safely (with IP fallback to prevent native module loader crashes)
  const fetchDeviceCurrentLocation = useCallback(async () => {
    setIsDetectingLocation(true);
    try {
      // First check if ExpoLocation native module exists in current runtime build before requiring it
      const hasExpoLocationNativeModule = Boolean(requireOptionalNativeModule('ExpoLocation'));

      if (hasExpoLocationNativeModule) {
        try {
          const Location = require('expo-location');
          if (Location && Location.requestForegroundPermissionsAsync) {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
              const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
              });
              const geocoded = await Location.reverseGeocodeAsync({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              });
              if (geocoded && geocoded.length > 0) {
                const place = geocoded[0];
                const cityName = place.city || place.subregion || place.district || place.region || '';
                if (cityName) {
                  setDeviceLocationCity(cityName);
                  setIsDetectingLocation(false);
                  return;
                }
              }
            }
          }
        } catch (expoError) {
          console.log('Error calling expo-location:', expoError);
        }
      }

      // Fallback: IP-based Geolocation (works 100% reliably on all devices/simulators/Expo Go)
      const ipRes = await fetch('http://ip-api.com/json');
      if (ipRes.ok) {
        const ipData = await ipRes.json();
        if (ipData && ipData.status === 'success' && ipData.city) {
          setDeviceLocationCity(ipData.city);
        }
      }
    } catch (error) {
      console.log('Error getting location:', error);
    } finally {
      setIsDetectingLocation(false);
    }
  }, []);

  useEffect(() => {
    if (selectedCity === undefined) {
      fetchDeviceCurrentLocation();
    }
  }, [selectedCity, fetchDeviceCurrentLocation]);

  // API Queries (useGetCurrentCityQuery removed!)
  const { data: citiesData } = useGetCitiesQuery();
  const { data: bannersData } = useGetBannersQuery();
  const {
    data: departments,
    isLoading: deptLoading,
    isError: deptError,
  } = useGetDepartmentsQuery();

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
      if (deviceLocationCity) {
        const dName = deviceLocationCity.toLowerCase().trim();
        const matched = citiesList.find((c: CityModel) => {
          const cTitle = (c.title || '').toLowerCase().trim();
          return cTitle.includes(dName) || dName.includes(cTitle);
        });
        if (matched) return matched;
      }
      const defaultCity = citiesList.find(
        (c: CityModel) => (c as any).default_city === 1
      );
      if (defaultCity) return defaultCity;
    }
    return null;
  }, [selectedCity, citiesList, deviceLocationCity]);

  const activeCityName = activeCity
    ? activeCity.title
    : (deviceLocationCity || 'All Cities');

  const activeCityId =
    activeCity?.id != null && String(activeCity.id) !== 'ALL' && String(activeCity.id) !== ''
      ? String(activeCity.id)
      : undefined;

  // Handle selecting city from modal dropdown without auto-saving to persistent storage
  const handleCitySelect = async (city: CityModel | null | undefined) => {
    if (city === undefined) {
      // User tapped "Use Current Location"
      setSelectedCity(undefined);
      try {
        await AsyncStorage.removeItem(SAVED_LOCATION_KEY);
      } catch (err) {
        console.log('Error clearing saved location:', err);
      }
      fetchDeviceCurrentLocation();
    } else if (city === null) {
      // User tapped "All Cities"
      const allCitiesObj = { id: 'ALL', title: 'All Cities' } as CityModel;
      setSelectedCity(allCitiesObj);
    } else {
      // User tapped a specific city from dropdown
      setSelectedCity(city);
    }
  };

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
  const [showMemberDropdown, setShowMemberDropdown] = useState<boolean>(false);
  const [downloadingFileId, setDownloadingFileId] = useState<string | number | null>(null);

  const familyMembersList: FamilyMemberModel[] = useMemo(() => {
    if (Array.isArray(familyMembersData)) return familyMembersData;
    if (Array.isArray((familyMembersData as any)?.data)) return (familyMembersData as any).data;
    if (Array.isArray((familyMembersData as any)?.response)) return (familyMembersData as any).response;
    return [];
  }, [familyMembersData]);

  const filteredFamilyMembersList = useMemo(() => {
    if (!familyMembersList || familyMembersList.length === 0) return [];
    const selfFName = (user?.f_name || (userProfileData as any)?.data?.f_name || '').trim().toLowerCase();
    const selfLName = (user?.l_name || (userProfileData as any)?.data?.l_name || '').trim().toLowerCase();
    const selfPhone = (user?.phone || (userProfileData as any)?.data?.phone || '').trim();
    const mainUserId = String(user?.id ?? (userProfileData as any)?.data?.id ?? userIdStr);

    return familyMembersList.filter((m) => {
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
  }, [familyMembersList, user, userProfileData, userIdStr]);

  const selfFullName = useMemo(() => {
    const fName = user?.f_name || (userProfileData as any)?.data?.f_name || '';
    const lName = user?.l_name || (userProfileData as any)?.data?.l_name || '';
    const full = `${fName} ${lName}`.trim();
    return full || 'Patient';
  }, [user, userProfileData]);

  const selectedMemberDisplayName = useMemo(() => {
    if (selectedMemberId === 'SELF') {
      return selfFullName;
    }
    const mem = familyMembersList.find((m) => String(m.id) === String(selectedMemberId));
    if (mem) {
      return `${mem.f_name || ''} ${mem.l_name || ''}`.trim() || 'Member';
    }
    return selfFullName;
  }, [selectedMemberId, selfFullName, familyMembersList]);

  // Fetch Appointments & Medical Files for Dashboard Widgets
  const { data: rawAppointmentsData } = useGetAppointmentsQuery(userIdStr, { skip: !userIdStr });
  const { data: rawPatientFilesData } = useGetPatientFilesQuery(
    { userId: userIdStr },
    { skip: !userIdStr }
  );

  const appointmentsList = useMemo(() => {
    if (Array.isArray(rawAppointmentsData)) return rawAppointmentsData;
    if (Array.isArray((rawAppointmentsData as any)?.data)) return (rawAppointmentsData as any).data;
    if (Array.isArray((rawAppointmentsData as any)?.response)) return (rawAppointmentsData as any).response;
    return [];
  }, [rawAppointmentsData]);

  const patientAppointments = useMemo(() => {
    if (!appointmentsList || appointmentsList.length === 0) return [];
    if (selectedMemberId === 'ALL') return appointmentsList;

    if (selectedMemberId === 'SELF') {
      const mainUserId = String(user?.id ?? (userProfileData as any)?.data?.id ?? userIdStr);
      const selfFName = (user?.f_name || (userProfileData as any)?.data?.f_name || '').trim().toLowerCase();
      const familyIds = new Set(familyMembersList.map((m) => String(m.id)));

      return appointmentsList.filter((app: any) => {
        const pId = app.patient_id != null ? String(app.patient_id) : null;
        const fId = app.family_member_id != null ? String(app.family_member_id) : null;

        if (pId === mainUserId || fId === mainUserId) return true;
        if (selfFName && app.patient_f_name?.trim().toLowerCase() === selfFName) return true;
        if (!pId || !familyIds.has(pId)) return true;

        return false;
      });
    }

    const selectedMem = familyMembersList.find((m) => String(m.id) === String(selectedMemberId));
    const targetFName = selectedMem?.f_name?.trim().toLowerCase();

    return appointmentsList.filter((app: any) => {
      const pId = app.patient_id != null ? String(app.patient_id) : null;
      const fId = app.family_member_id != null ? String(app.family_member_id) : null;

      if (pId === String(selectedMemberId) || fId === String(selectedMemberId)) return true;
      if (targetFName && app.patient_f_name?.trim().toLowerCase() === targetFName) return true;

      return false;
    });
  }, [appointmentsList, selectedMemberId, familyMembersList, user, userProfileData, userIdStr]);

  const latestAppointments = useMemo(() => {
    return patientAppointments.slice(0, 3);
  }, [patientAppointments]);

  const allFilesList = useMemo(() => {
    let list: any[] = [];
    if (Array.isArray(rawPatientFilesData)) list = rawPatientFilesData;
    else if (Array.isArray((rawPatientFilesData as any)?.data)) list = (rawPatientFilesData as any).data;
    else if (Array.isArray((rawPatientFilesData as any)?.response)) list = (rawPatientFilesData as any).response;
    else if (Array.isArray((rawPatientFilesData as any)?.response?.data)) list = (rawPatientFilesData as any).response.data;
    else if (Array.isArray((rawPatientFilesData as any)?.result)) list = (rawPatientFilesData as any).result;
    return list;
  }, [rawPatientFilesData]);

  const patientFiles = useMemo(() => {
    if (!allFilesList || allFilesList.length === 0) return [];
    if (selectedMemberId === 'ALL') return allFilesList;

    const selectedMem = familyMembersList.find((m) => String(m.id) === String(selectedMemberId));
    const targetFName = selectedMem?.f_name?.trim().toLowerCase();

    const filtered = allFilesList.filter((item: any) => {
      const itemMemId = item.family_member_id ?? item.patient_id ?? item.member_id;
      if (itemMemId != null && String(itemMemId) === String(selectedMemberId)) {
        return true;
      }
      if (selectedMemberId === 'SELF') {
        const mainUserId = String(user?.id ?? userIdStr);
        if (itemMemId != null && String(itemMemId) === mainUserId) return true;
        const selfFName = (user?.f_name || '').trim().toLowerCase();
        const pName = (item.patient_name || item.f_name || item.title || '').trim().toLowerCase();
        if (selfFName && pName && (pName.includes(selfFName) || selfFName.includes(pName))) return true;
      }
      if (targetFName) {
        const pName = (item.patient_name || item.f_name || item.title || '').trim().toLowerCase();
        if (pName && (pName.includes(targetFName) || targetFName.includes(pName))) return true;
      }
      return false;
    });

    return filtered.length > 0 ? filtered : allFilesList;
  }, [allFilesList, selectedMemberId, familyMembersList, user, userIdStr]);

  const latestFiles = useMemo(() => {
    return patientFiles.slice(0, 3);
  }, [patientFiles]);

  // Dynamic Vitals Queries based on active selected member filter
  const activeFamilyId = useMemo(() => {
    if (selectedMemberId === 'ALL' || selectedMemberId === 'SELF') return userIdStr;
    return selectedMemberId;
  }, [selectedMemberId, userIdStr]);

  const { data: rawBpVitals, refetch: refetchBp } = useGetVitalsQuery(
    { familyMemberId: activeFamilyId, type: 'Blood Pressure' },
    { skip: !activeFamilyId }
  );
  const { data: rawSugarVitals, refetch: refetchSugar } = useGetVitalsQuery(
    { familyMemberId: activeFamilyId, type: 'Sugar' },
    { skip: !activeFamilyId }
  );
  const { data: rawWeightVitals, refetch: refetchWeight } = useGetVitalsQuery(
    { familyMemberId: activeFamilyId, type: 'Weight' },
    { skip: !activeFamilyId }
  );
  const { data: rawTempVitals, refetch: refetchTemp } = useGetVitalsQuery(
    { familyMemberId: activeFamilyId, type: 'Temperature' },
    { skip: !activeFamilyId }
  );
  const { data: rawSpo2Vitals, refetch: refetchSpo2 } = useGetVitalsQuery(
    { familyMemberId: activeFamilyId, type: 'SpO2' },
    { skip: !activeFamilyId }
  );

  // Edit Vital Modal State
  const [editingVitalItem, setEditingVitalItem] = useState<any | null>(null);
  const [editingVitalType, setEditingVitalType] = useState<string>('Blood Pressure');
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState<string>(new Date().toTimeString().slice(0, 5));
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [showTimePicker, setShowTimePicker] = useState<boolean>(false);

  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [value, setValue] = useState('');
  const [sugarRandom, setSugarRandom] = useState('');

  const [updateVital, { isLoading: isUpdating }] = useUpdateVitalMutation();

  const openEditModal = (item: any, vitalType: string) => {
    setEditingVitalItem(item);
    setEditingVitalType(vitalType);
    const dateVal = item.date ? item.date.split('T')[0] : (item.created_at ? item.created_at.split('T')[0] : new Date().toISOString().split('T')[0]);
    setSelectedDate(dateVal);
    const timeVal = item.time ? item.time.slice(0, 5) : new Date().toTimeString().slice(0, 5);
    setSelectedTime(timeVal);

    if (vitalType === 'Blood Pressure') {
      setSystolic(item.bp_systolic ? String(item.bp_systolic) : '');
      setDiastolic(item.bp_diastolic ? String(item.bp_diastolic) : '');
    } else if (vitalType === 'Sugar') {
      setValue(item.sugar_fasting ? String(item.sugar_fasting) : '');
      setSugarRandom(item.sugar_random ? String(item.sugar_random) : '');
    } else if (vitalType === 'Weight') {
      setValue(item.weight || item.value ? String(item.weight || item.value) : '');
    } else if (vitalType === 'Temperature') {
      setValue(item.temperature || item.value ? String(item.temperature || item.value) : '');
    } else if (vitalType === 'SpO2') {
      setValue(item.spo2 || item.value ? String(item.spo2 || item.value) : '');
    }
    setShowEditModal(true);
  };

  const handleUpdateVitalSubmit = async () => {
    if (!editingVitalItem?.id) return;

    const payload: any = {
      id: editingVitalItem.id,
      user_id: userIdStr,
      family_member_id: activeFamilyId,
      type: editingVitalType,
      date: selectedDate,
      time: selectedTime,
    };

    if (editingVitalType === 'Blood Pressure') {
      if (!systolic.trim() || !diastolic.trim()) {
        showToast('Enter Systolic and Diastolic values');
        return;
      }
      payload.bp_systolic = systolic;
      payload.bp_diastolic = diastolic;
    } else if (editingVitalType === 'Sugar') {
      if (!value.trim() && !sugarRandom.trim()) {
        showToast('Enter Fasting or Random sugar reading');
        return;
      }
      payload.sugar_fasting = value;
      payload.sugar_random = sugarRandom;
    } else if (editingVitalType === 'Weight') {
      if (!value.trim()) {
        showToast('Enter Weight reading');
        return;
      }
      payload.weight = value;
    } else if (editingVitalType === 'Temperature') {
      if (!value.trim()) {
        showToast('Enter Temperature reading');
        return;
      }
      payload.temperature = value;
    } else if (editingVitalType === 'SpO2') {
      if (!value.trim()) {
        showToast('Enter SpO2 reading');
        return;
      }
      payload.spo2 = value;
    }

    try {
      const res = await updateVital(payload).unwrap();
      if (res?.status || res?.response === 200 || res?.message?.includes('successfully')) {
        showToast('Vital updated successfully');
        refetchBp();
        refetchSugar();
        refetchWeight();
        refetchTemp();
        refetchSpo2();
        setShowEditModal(false);
      } else {
        showToast(res?.message || 'Failed to update vital');
      }
    } catch (err: any) {
      showToast(err?.data?.message || err?.message || 'Failed to update vital');
    }
  };



  const getLatestVitalValue = (rawData: any, type: string) => {
    if (!rawData) return 'N/A';
    let list: any[] = [];
    if (Array.isArray(rawData)) list = rawData;
    else if (Array.isArray(rawData?.data)) list = rawData.data;
    else if (Array.isArray(rawData?.response)) list = rawData.response;
    if (list.length === 0) return 'N/A';

    const filteredList = list.filter((item) => isWithinLast7Days(item.date || item.created_at));
    if (filteredList.length === 0) return 'N/A';

    const latest = filteredList[0];
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
    if (patientAppointments.length > 0) {
      const app = patientAppointments[0];
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
  }, [selectedMemberId, familyMembersList, userProfileData, user, patientAppointments]);



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
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.sectionHeading} numberOfLines={1}>Patients Dashboard</Text>
              </View>
              <TouchableOpacity
                style={styles.viewAllBtn}
                onPress={() => navigation.navigate('FamilyMemberList')}
                activeOpacity={0.7}
              >
                <Text style={styles.viewAllText}>Manage Members</Text>
                <MaterialIcons name="arrow-forward-ios" size={12} color={Colors.primaryColor} />
              </TouchableOpacity>
            </View>

            {/* Member Section Inline Dropdown  */}
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
                  size={fs(20)}
                  color={Colors.primaryColor}
                />
              </TouchableOpacity>

              {/* Dropdown Items Below Field */}
              {showMemberDropdown && (
                <View style={styles.memberDropdownMenuCard}>
                  {/* Self Option - Name Only */}
                  <TouchableOpacity
                    style={[
                      styles.memberDropdownMenuItem,
                      selectedMemberId === 'SELF' && styles.memberDropdownMenuItemActive,
                    ]}
                    activeOpacity={0.7}
                    onPress={() => {
                      setSelectedMemberId('SELF');
                      setShowMemberDropdown(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.memberDropdownMenuItemText,
                        selectedMemberId === 'SELF' && styles.memberDropdownMenuItemTextActive,
                      ]}
                      numberOfLines={1}
                    >
                      {selfFullName}
                    </Text>
                  </TouchableOpacity>

                  {/* Family Member Options - Names Only */}
                  {filteredFamilyMembersList.map((m) => {
                    const memberId = String(m.id);
                    const isSelected = selectedMemberId === memberId;
                    const memberFullName = `${m.f_name || ''} ${m.l_name || ''}`.trim() || 'Family Member';
                    return (
                      <TouchableOpacity
                        key={`inline-member-${memberId}`}
                        style={[
                          styles.memberDropdownMenuItem,
                          isSelected && styles.memberDropdownMenuItemActive,
                        ]}
                        activeOpacity={0.7}
                        onPress={() => {
                          setSelectedMemberId(memberId);
                          setShowMemberDropdown(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.memberDropdownMenuItemText,
                            isSelected && styles.memberDropdownMenuItemTextActive,
                          ]}
                          numberOfLines={1}
                        >
                          {memberFullName}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>

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
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.sectionHeading} numberOfLines={1}>Health Vitals Tracker</Text>
                <Text style={styles.sectionSubheading} numberOfLines={1}>Patient: {activePatientInfo.name}</Text>
              </View>
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
                headers={['SYSTOLIC', 'DIASTOLIC', 'DATE', 'TIME', 'ACTION']}
                records={rawBpVitals}
                latestVal={getLatestVitalValue(rawBpVitals, 'Blood Pressure')}
                onPress={() => navigation.navigate('VitalDetails', { vitalName: 'Blood Pressure', familyMemberId: activeFamilyId })}
                onDeleteRecord={handleDeleteVitalRecord}
                onEditRecord={(item) => openEditModal(item, 'Blood Pressure')}
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
                headers={['FASTING', 'RANDOM', 'DATE', 'TIME', 'ACTION']}
                records={rawSugarVitals}
                latestVal={getLatestVitalValue(rawSugarVitals, 'Sugar')}
                onPress={() => navigation.navigate('VitalDetails', { vitalName: 'Sugar', familyMemberId: activeFamilyId })}
                onDeleteRecord={handleDeleteVitalRecord}
                onEditRecord={(item) => openEditModal(item, 'Sugar')}
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
                headers={['WEIGHT', 'DATE', 'TIME', 'ACTION']}
                records={rawWeightVitals}
                latestVal={getLatestVitalValue(rawWeightVitals, 'Weight')}
                onPress={() => navigation.navigate('VitalDetails', { vitalName: 'Weight', familyMemberId: activeFamilyId })}
                onDeleteRecord={handleDeleteVitalRecord}
                onEditRecord={(item) => openEditModal(item, 'Weight')}
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
                headers={['TEMP (°F)', 'DATE', 'TIME', 'ACTION']}
                records={rawTempVitals}
                latestVal={getLatestVitalValue(rawTempVitals, 'Temperature')}
                onPress={() => navigation.navigate('VitalDetails', { vitalName: 'Temperature', familyMemberId: activeFamilyId })}
                onDeleteRecord={handleDeleteVitalRecord}
                onEditRecord={(item) => openEditModal(item, 'Temperature')}
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
                onPress={() => navigation.navigate('VitalDetails', { vitalName: 'SpO2', familyMemberId: activeFamilyId })}
                onDeleteRecord={handleDeleteVitalRecord}
                onEditRecord={(item) => openEditModal(item, 'SpO2')}
                fullWidth
                yLabels={['100', '90', '80']}
              />
            </View>

            {/* Appointment List (Mobile Card List Items - NO squished multi-column tables) */}
            <View style={styles.webTableCard}>
              <View style={styles.webTableHeaderRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.sectionHeading} numberOfLines={1}>Appointment List</Text>
                </View>
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
                    const docName = formatDoctorName(app.doct_f_name || app.doctor_name || app.name || 'Doctor', app.doct_l_name);
                    const dateStr = app.date ? String(app.date).split('T')[0] : '';
                    const timeStr = app.time_slots || '';
                    return (
                      <View key={`app-row-${app.id || idx}`} style={styles.mobileCardItem}>
                        <View style={styles.appointmentIconCircle}>
                          <MaterialIcons name="event" size={20} color={Colors.primaryColor} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.mobileCardTitle} numberOfLines={1}>{docName}</Text>
                          <Text style={styles.mobileCardSub}>{dateStr}{timeStr ? ` • ${timeStr}` : ''}</Text>
                        </View>
                        <View style={styles.statusPill}>
                          <Text style={styles.statusPillText}>{app.status || 'Confirmed'}</Text>
                        </View>
                      </View>
                    );
                  })
                ) : (
                  <View style={{ paddingVertical: hs(16), alignItems: 'center' }}>
                    <Text style={[{ fontSize: fs(12), color: Colors.secondaryFontColor }, TYPOGRAPHY.medium]}>
                      No appointments found for {activePatientInfo.name}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Patient Files (Mobile Card List Items - NO squished multi-column tables) */}
            <View style={styles.webTableCard}>
              <View style={styles.webTableHeaderRow}>
                <View style={{ flex: 1, marginRight: ws(8) }}>
                  <Text style={styles.sectionHeading} numberOfLines={1}>Medical Files</Text>
                </View>
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
                    const fileDate = file.created_at ? String(file.created_at).split('T')[0] : '';
                    const fileSource = file.file_url || file.file || file.url || file.document;
                    const downloadUrl = fileSource ? (String(fileSource).startsWith('http') ? fileSource : getImageUrl(fileSource)) : null;

                    return (
                      <View key={`file-row-${file.id || idx}`} style={styles.mobileCardItem}>
                        <TouchableOpacity
                          style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
                          activeOpacity={0.8}
                          onPress={() => navigation.navigate('PatientFile')}
                        >
                          <View style={[styles.fileIconBadge, { backgroundColor: '#EFF6FF' }]}>
                            <MaterialIcons name="folder" size={20} color="#2563EB" />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.mobileCardTitle} numberOfLines={1}>{fileName}</Text>
                            <Text style={styles.mobileCardSub}>{fileDate}</Text>
                          </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.openFileBtn}
                          activeOpacity={0.8}
                          disabled={downloadingFileId === (file.id ?? fileName)}
                          onPress={async () => {
                            if (downloadUrl) {
                              const targetId = file.id ?? fileName;
                              try {
                                setDownloadingFileId(targetId);
                                await downloadAndSaveFile(downloadUrl, fileName);
                              } finally {
                                setDownloadingFileId(null);
                              }
                            } else {
                              navigation.navigate('PatientFile');
                            }
                          }}
                        >
                          {downloadingFileId === (file.id ?? fileName) ? (
                            <ActivityIndicator size="small" color={Colors.primaryColor} />
                          ) : (
                            <MaterialIcons name="file-download" size={18} color={Colors.primaryColor} />
                          )}
                        </TouchableOpacity>
                      </View>
                    );
                  })
                ) : (
                  <View style={{ paddingVertical: hs(12), alignItems: 'center' }}>
                    <Text style={[{ fontSize: fs(13), color: Colors.secondaryFontColor, marginBottom: hs(8) }, TYPOGRAPHY.medium]}>
                      No patient files uploaded yet
                    </Text>
                    <TouchableOpacity
                      style={{ paddingHorizontal: ws(14), paddingVertical: hs(6), borderRadius: fs(8), backgroundColor: '#EFF6FF' }}
                      onPress={() => navigation.navigate('PatientFile')}
                    >
                      <Text style={[{ fontSize: fs(12), color: Colors.primaryColor }, TYPOGRAPHY.bold]}>
                        View / Upload Files
                      </Text>
                    </TouchableOpacity>
                  </View>
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
                          <Text style={styles.promoHeading}>{banner.title || ''}</Text>
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
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.sectionHeading} adjustsFontSizeToFit numberOfLines={2}>Medical Specialties</Text>
            <Text style={styles.sectionSubheading} numberOfLines={1}>Explore by specialization</Text>
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
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.sectionHeading} adjustsFontSizeToFit numberOfLines={2}>Top Doctors in {activeCityName}</Text>
            <Text style={styles.sectionSubheading} numberOfLines={1}>Experienced & verified physicians</Text>
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
            ItemSeparatorComponent={() => <View style={{ width: ws(10) }} />}
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
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.sectionHeading} adjustsFontSizeToFit numberOfLines={2}>Featured Clinics</Text>
            <Text style={styles.sectionSubheading} numberOfLines={1}>Trusted medical centers in {activeCityName}</Text>
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
          <FlatList
            data={clinicList}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(clinic: any, idx: number) => `clinic-${clinic.id ?? idx}`}
            contentContainerStyle={styles.clinicsListContainer}
            ItemSeparatorComponent={() => <View style={{ width: ws(10) }} />}
            renderItem={({ item }: { item: any }) => (
              <ClinicFeatureCard
                clinic={item}
                onPress={() => navigation.navigate('Clinic', { clinicId: String(item.id) })}
              />
            )}
          />
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
        selectedCityId={selectedCity === undefined ? undefined : (selectedCity?.id ?? 'ALL')}
        currentCityName={deviceLocationCity || undefined}
        onSelectCity={handleCitySelect}
      />



      {/* Update Vital Bottom Sheet Modal */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            style={styles.backdropPressable}
            activeOpacity={1}
            onPress={() => setShowEditModal(false)}
          />
          <View style={styles.modalBox}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Update {editingVitalType}</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <MaterialIcons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView
              bounces={false}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 40 }}
            >
              {/* Date Selection */}
              <Text style={styles.fieldLabel}>Date</Text>
              <TouchableOpacity
                style={styles.pickerSelectorBtn}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.pickerSelectorText}>
                  {DateTimeUtils.getDataFormat(selectedDate)}
                </Text>
                <MaterialIcons name="calendar-today" size={18} color="#64748B" />
              </TouchableOpacity>

              {/* Time Selection */}
              <Text style={styles.fieldLabel}>Time</Text>
              <TouchableOpacity
                style={styles.pickerSelectorBtn}
                onPress={() => setShowTimePicker(true)}
              >
                <Text style={styles.pickerSelectorText}>
                  {DateTimeUtils.formatTimeToAmPm(selectedTime) || selectedTime}
                </Text>
                <MaterialIcons name="access-time" size={18} color="#64748B" />
              </TouchableOpacity>

              {/* Dynamic Vital Fields */}
              {editingVitalType === 'Blood Pressure' ? (
                <>
                  <Text style={styles.fieldLabel}>Systolic (mmHg)</Text>
                  <AppTextField
                    placeholder="e.g. 120"
                    keyboardType="number-pad"
                    value={systolic}
                    onChangeText={setSystolic}
                  />
                  <Text style={styles.fieldLabel}>Diastolic (mmHg)</Text>
                  <AppTextField
                    placeholder="e.g. 80"
                    keyboardType="number-pad"
                    value={diastolic}
                    onChangeText={setDiastolic}
                  />
                </>
              ) : editingVitalType === 'Sugar' ? (
                <>
                  <Text style={styles.fieldLabel}>Fasting (mg/dL)</Text>
                  <AppTextField
                    placeholder="e.g. 95"
                    keyboardType="number-pad"
                    value={value}
                    onChangeText={setValue}
                  />
                  <Text style={styles.fieldLabel}>Random (mg/dL)</Text>
                  <AppTextField
                    placeholder="e.g. 140"
                    keyboardType="number-pad"
                    value={sugarRandom}
                    onChangeText={setSugarRandom}
                  />
                </>
              ) : (
                <>
                  <Text style={styles.fieldLabel}>{editingVitalType}</Text>
                  <AppTextField
                    placeholder={`Enter ${editingVitalType} reading`}
                    keyboardType="decimal-pad"
                    value={value}
                    onChangeText={setValue}
                  />
                </>
              )}

              {/* Action Buttons */}
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowEditModal(false)}>
                  <Text style={styles.cancelText}>Close</Text>
                </TouchableOpacity>
                <AppButton
                  title="Update"
                  loading={isUpdating}
                  onPress={handleUpdateVitalSubmit}
                  style={styles.saveBtn}
                />
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Date & Time Picker Modals */}
      <AppDatePickerModal
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        initialDate={selectedDate}
        maxDate={new Date()}
        onSelectDate={(dateStr) => setSelectedDate(dateStr)}
        title="Select Date"
      />

      <AppTimePickerModal
        visible={showTimePicker}
        onClose={() => setShowTimePicker(false)}
        initialTime={selectedTime}
        onSelectTime={(timeStr) => setSelectedTime(timeStr)}
        title="Select Time"
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
    const specialty = doctor.specialization || (doctor as any).dept_title || '';
    const rating = Number(doctor.average_rating ?? 0);
    const reviews = doctor.number_of_reviews ?? 0;
    const experience = doctor.ex_year ?? doctor.experience;
    const imageUrl = getImageUrl(doctor.image);

    return (
      <TouchableOpacity
        style={styles.doctorCard}
        activeOpacity={0.88}
        onPress={onBook}
      >
        {/* Top Avatar & Online Indicator */}
        <View style={styles.doctorHeader}>
          <View style={styles.docAvatarContainer}>
            {imageUrl ? (
              <Image source={{ uri: imageUrl }} style={styles.docAvatar} resizeMode="cover" />
            ) : (
              <View style={styles.docAvatarFallback}>
                <MaterialIcons name="person" size={24} color={Colors.primaryColor} />
              </View>
            )}
            <View style={styles.doctorOnlineDot} />
          </View>

          <View style={styles.ratingBadge}>
            <MaterialIcons name="star" size={12} color={Colors.yellow_F59E0B} />
            <Text style={styles.ratingBadgeText}>{rating > 0 ? rating.toFixed(1) : '0.0'}</Text>
          </View>
        </View>

        {/* Doctor Meta Info */}
        <View style={styles.doctorBody}>
          <Text style={styles.doctorName} numberOfLines={1}>
            {displayName}
          </Text>
          {specialty ? (
            <View style={styles.specialtyPill}>
              <Text style={styles.specialtyPillText} numberOfLines={1}>
                {specialty}
              </Text>
            </View>
          ) : null}

          <View style={styles.doctorMetaDetails}>
            <Text style={styles.doctorDetailText} numberOfLines={1}>
              {experience ? `${experience} Yrs Exp • ` : ''}{reviews} review{reviews === 1 ? '' : 's'}
            </Text>
          </View>
        </View>

        {/* Book Action */}
        <TouchableOpacity style={styles.doctorBookBtn} activeOpacity={0.85} onPress={onBook}>
          <Text style={styles.doctorBookBtnText}>Book Now</Text>
          <MaterialIcons name="event" size={13} color={Colors.white} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }
);

const ClinicFeatureCard = memo(
  ({ clinic, onPress }: { clinic: any; onPress: () => void }) => {
    const imageUrl = getImageUrl(clinic.image);
    return (
      <TouchableOpacity style={styles.clinicCard} activeOpacity={0.88} onPress={onPress}>
        {/* Top Image & Verified Badge */}
        <View style={styles.clinicHeader}>
          <View style={styles.clinicImageContainer}>
            {imageUrl ? (
              <Image source={{ uri: imageUrl }} style={styles.clinicImg} resizeMode="cover" />
            ) : (
              <View style={styles.clinicImgFallback}>
                <MaterialIcons name="local-hospital" size={26} color={Colors.primaryColor} />
              </View>
            )}
          </View>
          <View style={styles.clinicVerifiedBadge}>
            <MaterialIcons name="verified" size={11} color={Colors.green_10B981} />
            <Text style={styles.clinicVerifiedText}>Verified</Text>
          </View>
        </View>

        {/* Clinic Meta Info */}
        <View style={styles.clinicBody}>
          <Text style={styles.clinicTitle} numberOfLines={1}>
            {clinic.title}
          </Text>
          <View style={styles.clinicAddressRow}>
            <MaterialIcons name="location-on" size={12} color={Colors.primaryColor} />
            <Text style={styles.clinicAddressText} numberOfLines={1}>
              {clinic.address || 'Medical Center'}
            </Text>
          </View>
        </View>

        {/* View Clinic Action Button */}
        <TouchableOpacity style={styles.clinicBookBtn} activeOpacity={0.85} onPress={onPress}>
          <Text style={styles.clinicBookBtnText}>View Clinic</Text>
          <MaterialIcons name="arrow-forward" size={12} color={Colors.white} />
        </TouchableOpacity>
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
    paddingTop: hs(8),
  },

  /* Header */
  headerContainer: {
    backgroundColor: Colors.primaryColor,
    paddingHorizontal: ws(16),
    paddingBottom: hs(18),
    borderBottomLeftRadius: fs(24),
    borderBottomRightRadius: fs(24),
    shadowColor: Colors.primaryColor,
    shadowOffset: { width: 0, height: hs(6) },
    shadowOpacity: 0.25,
    shadowRadius: fs(10),
    elevation: 8,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hs(14),
  },
  userInfoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: ws(10),
  },
  avatarBorder: {
    width: ws(44),
    height: ws(44),
    aspectRatio: 1,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: ws(10),
  },
  avatar: {
    width: '100%',
    height: '100%',
    aspectRatio: 1,
    borderRadius: 999,
    overflow: 'hidden',
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    aspectRatio: 1,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  greetingMeta: {
    flex: 1,
  },
  greetingSubtitle: {
    fontSize: fs(11),
    ...TYPOGRAPHY.medium,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  greetingTitle: {
    fontSize: fs(Typography.fontSize.md),
    ...TYPOGRAPHY.bold,
    color: Colors.white,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(8),
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingVertical: hs(6),
    paddingHorizontal: ws(10),
    borderRadius: fs(18),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    maxWidth: ws(130),
    gap: ws(3),
  },
  locationPillText: {
    fontSize: fs(11),
    ...TYPOGRAPHY.medium,
    color: Colors.white,
    flexShrink: 1,
  },
  notificationBtn: {
    width: ws(36),
    height: ws(36),
    aspectRatio: 1,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    position: 'relative',
    overflow: 'hidden',
  },
  notificationDot: {
    width: ws(8),
    height: ws(8),
    aspectRatio: 1,
    borderRadius: 999,
    backgroundColor: '#EF4444',
    position: 'absolute',
    top: hs(6),
    right: ws(7),
    borderWidth: 1,
    borderColor: Colors.white,
  },
  headerSearchWrapper: {
    marginTop: hs(2),
  },

  /* Care Services Hub (Top Section) */
  careHubSection: {
    marginTop: hs(12),
    marginBottom: hs(4),
  },
  sectionHeaderCompact: {
    paddingHorizontal: ws(16),
    marginBottom: hs(10),
  },

  /* Quick Actions Grid */
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: ws(12),
    gap: ws(8),
  },
  quickActionTile: {
    width: (SCREEN_WIDTH - ws(24) - ws(16)) / 3,
    backgroundColor: Colors.white,
    borderRadius: fs(16),
    paddingVertical: hs(14),
    paddingHorizontal: ws(6),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: hs(2) },
    shadowOpacity: 0.04,
    shadowRadius: fs(5),
    elevation: 2,
  },
  quickActionIconContainer: {
    width: ws(46),
    height: hs(46),
    borderRadius: fs(23),
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hs(8),
    shadowColor: Colors.primaryColor,
    shadowOffset: { width: 0, height: hs(2) },
    shadowOpacity: 0.08,
    shadowRadius: fs(3),
    elevation: 1,
  },
  quickActionIcon: {
    width: ws(26),
    height: hs(26),
    tintColor: Colors.primaryColor,
  },
  quickActionLabel: {
    fontSize: fs(11),
    ...TYPOGRAPHY.medium,
    color: Colors.primaryFontColor,
    textAlign: 'center',
  },

  /* Banner Section */
  bannerSection: {
    marginTop: 0,
    marginBottom: 0,
  },
  bannerScrollContent: {
    paddingHorizontal: ws(16),
  },
  bannerSlide: {
    width: SCREEN_WIDTH - ws(32),
    height: hs(140),
    borderRadius: fs(16),
    overflow: 'hidden',
    marginRight: ws(12),
    backgroundColor: Colors.white,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: hs(3) },
    shadowOpacity: 0.08,
    shadowRadius: fs(6),
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
    padding: ws(16),
    justifyContent: 'space-between',
  },
  promoCardTextGroup: {
    flex: 1,
    paddingRight: ws(10),
  },
  promoBadge: {
    fontSize: fs(9),
    ...TYPOGRAPHY.bold,
    color: 'rgba(255, 255, 255, 0.9)',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignSelf: 'flex-start',
    paddingHorizontal: ws(6),
    paddingVertical: hs(2),
    borderRadius: fs(4),
    marginBottom: hs(6),
    overflow: 'hidden',
  },
  promoHeading: {
    fontSize: fs(Typography.fontSize.md),
    ...TYPOGRAPHY.bold,
    color: Colors.white,
    lineHeight: hs(20),
  },
  promoSubtext: {
    fontSize: fs(11),
    ...TYPOGRAPHY.regular,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: hs(4),
  },
  promoIcon: {
    opacity: 0.9,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: hs(8),
    gap: ws(5),
  },
  dot: {
    width: ws(6),
    height: hs(6),
    borderRadius: fs(3),
    backgroundColor: '#CBD5E1',
  },
  dotActive: {
    width: ws(18),
    backgroundColor: Colors.primaryColor,
  },

  /* Hero Highlight Card (Fallback) */
  heroPromoCard: {
    marginHorizontal: ws(16),
    marginTop: hs(18),
    marginBottom: hs(6),
    backgroundColor: Colors.white,
    borderRadius: fs(18),
    padding: ws(16),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: hs(3) },
    shadowOpacity: 0.05,
    shadowRadius: fs(6),
    elevation: 2,
  },
  heroPromoLeft: {
    flex: 1,
    paddingRight: ws(12),
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(4),
    backgroundColor: '#EFF6FF',
    paddingHorizontal: ws(8),
    paddingVertical: hs(3),
    borderRadius: fs(6),
    alignSelf: 'flex-start',
    marginBottom: hs(6),
  },
  heroBadgeText: {
    fontSize: fs(9),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryColor,
  },
  heroPromoTitle: {
    fontSize: fs(Typography.fontSize.base),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
    lineHeight: hs(20),
  },
  heroPromoDesc: {
    fontSize: fs(11),
    ...TYPOGRAPHY.regular,
    color: Colors.secondaryFontColor,
    marginTop: hs(4),
    lineHeight: hs(16),
  },
  heroCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(6),
    backgroundColor: Colors.primaryColor,
    paddingHorizontal: ws(12),
    paddingVertical: hs(7),
    borderRadius: fs(10),
    alignSelf: 'flex-start',
    marginTop: hs(10),
  },
  heroCtaText: {
    fontSize: fs(11),
    ...TYPOGRAPHY.bold,
    color: Colors.white,
  },
  heroPromoIconCircle: {
    width: ws(64),
    height: ws(64),
    aspectRatio: 1,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Section Headers */
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: ws(16),
    marginTop: hs(22),
    marginBottom: hs(10),
    gap: ws(8),
  },
  sectionHeading: {
    fontSize: fs(15),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
  },
  sectionSubheading: {
    fontSize: fs(11),
    ...TYPOGRAPHY.regular,
    color: Colors.secondaryFontColor,
    marginTop: hs(2),
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(4),
    paddingVertical: hs(4),
    paddingHorizontal: ws(2),
    flexShrink: 0,
  },
  viewAllText: {
    fontSize: fs(12),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryColor,
  },

  /* Department List */
  deptListContainer: {
    paddingHorizontal: ws(16),
    paddingBottom: hs(4),
  },
  deptCard: {
    width: ws(78),
    alignItems: 'center',
    marginRight: ws(12),
  },
  deptIconFrame: {
    width: ws(62),
    height: hs(62),
    borderRadius: fs(18),
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hs(6),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: hs(2) },
    shadowOpacity: 0.04,
    shadowRadius: fs(5),
    elevation: 2,
  },
  deptIcon: {
    width: ws(50),
    height: hs(50),
  },
  deptTitle: {
    fontSize: fs(11),
    ...TYPOGRAPHY.medium,
    color: Colors.primaryFontColor,
    textAlign: 'center',
    lineHeight: hs(14),
  },

  /* Doctors List */
  doctorsListContainer: {
    paddingHorizontal: ws(16),
    paddingVertical: hs(6),
  },
  doctorCard: {
    width: DOCTOR_CARD_WIDTH,
    backgroundColor: Colors.white,
    borderRadius: fs(16),
    padding: ws(10),
    borderWidth: 1,
    borderColor: Colors.borderColor,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: hs(2) },
    shadowOpacity: 0.05,
    shadowRadius: fs(5),
    elevation: 2,
    justifyContent: 'space-between',
  },
  doctorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: hs(8),
  },
  docAvatarContainer: {
    width: ws(44),
    height: ws(44),
    aspectRatio: 1,
    borderRadius: 999,
    position: 'relative',
  },
  docAvatar: {
    width: ws(44),
    height: ws(44),
    aspectRatio: 1,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: Colors.slate_F1F5F9,
  },
  docAvatarFallback: {
    width: ws(44),
    height: ws(44),
    aspectRatio: 1,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: Colors.lightBlueTint,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doctorOnlineDot: {
    width: ws(10),
    height: ws(10),
    aspectRatio: 1,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: Colors.green_10B981,
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderWidth: 1.5,
    borderColor: Colors.white,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: ws(6),
    paddingVertical: hs(2.5),
    borderRadius: fs(8),
    gap: ws(2),
  },
  ratingBadgeText: {
    fontSize: fs(10),
    ...TYPOGRAPHY.bold,
    color: '#2563EB',
  },
  doctorBody: {
    flex: 1,
    marginBottom: hs(8),
  },
  doctorName: {
    fontSize: fs(12.5),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
  },
  specialtyPill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: ws(6),
    paddingVertical: hs(2),
    borderRadius: fs(6),
    alignSelf: 'flex-start',
    marginTop: hs(3),
    marginBottom: hs(3),
    maxWidth: '100%',
  },
  specialtyPillText: {
    fontSize: fs(9.5),
    ...TYPOGRAPHY.medium,
    color: Colors.primaryColor,
  },
  doctorMetaDetails: {
    marginTop: hs(1),
  },
  doctorDetailText: {
    fontSize: fs(9.5),
    ...TYPOGRAPHY.regular,
    color: Colors.secondaryFontColor,
  },
  doctorBookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryColor,
    paddingVertical: hs(7),
    borderRadius: fs(10),
    gap: ws(4),
  },
  doctorBookBtnText: {
    fontSize: fs(11),
    ...TYPOGRAPHY.bold,
    color: Colors.white,
  },

  /* Empty States */
  emptyCardBox: {
    marginHorizontal: ws(16),
    backgroundColor: Colors.white,
    borderRadius: fs(16),
    padding: ws(20),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyCardTitle: {
    fontSize: fs(Typography.fontSize.sm),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
    marginTop: hs(8),
  },
  emptyCardSubtitle: {
    fontSize: fs(11),
    ...TYPOGRAPHY.regular,
    color: Colors.secondaryFontColor,
    textAlign: 'center',
    marginTop: hs(4),
  },
  emptyActionBtn: {
    marginTop: hs(10),
    backgroundColor: '#EFF6FF',
    paddingHorizontal: ws(14),
    paddingVertical: hs(6),
    borderRadius: fs(8),
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.2)',
  },
  emptyActionText: {
    fontSize: fs(11),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryColor,
  },

  /* Support / Emergency Banner */
  supportBannerCard: {
    marginHorizontal: ws(16),
    marginTop: hs(24),
    marginBottom: hs(6),
    backgroundColor: '#EFF6FF',
    borderRadius: fs(16),
    padding: ws(14),
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.2)',
  },
  supportIconBox: {
    width: ws(44),
    height: hs(44),
    borderRadius: fs(22),
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: ws(10),
    shadowColor: Colors.primaryColor,
    shadowOffset: { width: 0, height: hs(2) },
    shadowOpacity: 0.1,
    shadowRadius: fs(4),
    elevation: 2,
  },
  supportMeta: {
    flex: 1,
    paddingRight: ws(6),
  },
  supportTitle: {
    fontSize: fs(12),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
  },
  supportDesc: {
    fontSize: fs(10),
    ...TYPOGRAPHY.regular,
    color: Colors.secondaryFontColor,
    marginTop: hs(2),
  },
  supportActionBtn: {
    backgroundColor: Colors.primaryColor,
    paddingHorizontal: ws(12),
    paddingVertical: hs(6),
    borderRadius: fs(8),
  },
  supportActionText: {
    fontSize: fs(11),
    ...TYPOGRAPHY.bold,
    color: Colors.white,
  },

  /* Clinics Horizontal Row */
  clinicsListContainer: {
    paddingHorizontal: ws(16),
    paddingVertical: hs(6),
  },
  clinicCard: {
    width: DOCTOR_CARD_WIDTH,
    backgroundColor: Colors.white,
    borderRadius: fs(16),
    padding: ws(10),
    borderWidth: 1,
    borderColor: Colors.borderColor,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: hs(2) },
    shadowOpacity: 0.05,
    shadowRadius: fs(5),
    elevation: 2,
    justifyContent: 'space-between',
  },
  clinicHeader: {
    position: 'relative',
    marginBottom: hs(8),
  },
  clinicImageContainer: {
    width: '100%',
    height: hs(84),
    borderRadius: fs(12),
    backgroundColor: Colors.slate_F1F5F9,
    overflow: 'hidden',
  },
  clinicImg: {
    width: '100%',
    height: '100%',
  },
  clinicImgFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.lightBlueTint,
  },
  clinicVerifiedBadge: {
    position: 'absolute',
    top: hs(6),
    right: ws(6),
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingHorizontal: ws(6),
    paddingVertical: hs(2),
    borderRadius: fs(8),
    gap: ws(3),
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  clinicVerifiedText: {
    fontSize: fs(9),
    ...TYPOGRAPHY.bold,
    color: Colors.green_065F46,
  },
  clinicBody: {
    marginBottom: hs(8),
  },
  clinicTitle: {
    fontSize: fs(12.5),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
    marginBottom: hs(3),
  },
  clinicAddressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(2),
  },
  clinicAddressText: {
    fontSize: fs(10.5),
    ...TYPOGRAPHY.regular,
    color: Colors.secondaryFontColor,
    flex: 1,
  },
  clinicBookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryColor,
    borderRadius: fs(10),
    paddingVertical: hs(6.5),
    paddingHorizontal: ws(8),
    gap: ws(4),
  },
  clinicBookBtnText: {
    fontSize: fs(11),
    ...TYPOGRAPHY.bold,
    color: Colors.white,
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
    borderTopLeftRadius: fs(24),
    borderTopRightRadius: fs(24),
    paddingHorizontal: ws(16),
    paddingTop: hs(10),
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: hs(-4) },
    shadowOpacity: 0.12,
    shadowRadius: fs(10),
    elevation: 12,
  },
  modalHandle: {
    width: ws(36),
    height: hs(4),
    borderRadius: fs(2),
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: hs(12),
  },
  modalSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hs(12),
  },
  modalSheetTitle: {
    fontSize: fs(Typography.fontSize.md),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
  },
  modalSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: fs(12),
    paddingHorizontal: ws(12),
    height: hs(44),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: hs(14),
  },
  modalSearchIcon: {
    marginRight: ws(6),
  },
  modalSearchInput: {
    flex: 1,
    fontSize: fs(Typography.fontSize.sm),
    ...TYPOGRAPHY.regular,
    color: Colors.primaryFontColor,
    paddingVertical: 0,
  },
  modalCityList: {
    maxHeight: hs(340),
  },
  cityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: fs(12),
    paddingVertical: hs(12),
    paddingHorizontal: ws(14),
    marginBottom: hs(8),
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
    gap: ws(10),
    flex: 1,
  },
  cityIconWrap: {
    width: ws(32),
    height: hs(32),
    borderRadius: fs(16),
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cityIconWrapSelected: {
    backgroundColor: Colors.primaryColor,
  },
  cityNameText: {
    fontSize: fs(13),
    ...TYPOGRAPHY.medium,
    color: Colors.primaryFontColor,
  },
  cityNameTextSelected: {
    ...TYPOGRAPHY.bold,
    color: Colors.primaryColor,
  },
  cityStateText: {
    fontSize: fs(11),
    ...TYPOGRAPHY.regular,
    color: Colors.secondaryFontColor,
    marginTop: hs(1),
  },

  /* Web Dashboard Member Filter & Vitals Overview */
  memberFilterSection: {
    marginBottom: hs(16),
  },
  memberFilterHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: hs(6),
    marginBottom: hs(10),
    paddingHorizontal: ws(2),
    gap: ws(8),
  },
  memberFilterTitle: {
    flex: 1,
    marginRight: ws(8),
    fontSize: fs(15),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
  },
  manageMembersLink: {
    fontSize: fs(11),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryColor,
  },
  memberPillsScroll: {
    gap: ws(8),
    paddingRight: ws(10),
    marginBottom: hs(12),
  },
  /* Member Dropdown Below Field (Matches User Reference Image) */
  memberDropdownContainer: {
    marginBottom: hs(14),
    position: 'relative',
    zIndex: 1000,
  },
  memberDropdownField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderRadius: fs(10),
    borderWidth: 1.5,
    borderColor: Colors.blue_3B82F6,
    paddingHorizontal: ws(14),
    paddingVertical: hs(10),
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: hs(1) },
    shadowOpacity: 0.05,
    shadowRadius: fs(3),
    elevation: 2,
  },
  memberDropdownFieldOpen: {
    borderColor: Colors.primaryColor,
  },
  memberDropdownFieldText: {
    fontSize: fs(13.5),
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
    borderColor: Colors.borderColor,
    padding: ws(6),
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: hs(4) },
    shadowOpacity: 0.15,
    shadowRadius: fs(10),
    elevation: 10,
    zIndex: 1000,
  },
  memberDropdownMenuItem: {
    paddingVertical: hs(10),
    paddingHorizontal: ws(12),
    borderRadius: fs(8),
    marginBottom: hs(2),
  },
  memberDropdownMenuItemActive: {
    backgroundColor: Colors.primaryColor,
  },
  memberDropdownMenuItemText: {
    fontSize: fs(13),
    ...TYPOGRAPHY.medium,
    color: Colors.slate_1E293B,
  },
  memberDropdownMenuItemTextActive: {
    ...TYPOGRAPHY.bold,
    color: Colors.white,
  },
  memberPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(5),
    paddingHorizontal: ws(12),
    paddingVertical: hs(7),
    borderRadius: fs(20),
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.primaryColor,
  },
  memberPillActive: {
    backgroundColor: Colors.primaryColor,
  },
  memberPillText: {
    fontSize: fs(12),
    ...TYPOGRAPHY.medium,
    color: Colors.primaryColor,
  },
  memberPillTextActive: {
    color: Colors.white,
    ...TYPOGRAPHY.bold,
  },
  addMemberPill: {
    backgroundColor: '#EFF6FF',
    borderColor: '#DBEAFE',
    borderStyle: 'dashed',
  },
  addMemberPillText: {
    fontSize: fs(12),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryColor,
  },
  dashboardSummaryCard: {
    backgroundColor: Colors.white,
    borderRadius: fs(16),
    padding: ws(14),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: hs(2) },
    shadowOpacity: 0.04,
    shadowRadius: fs(5),
    elevation: 2,
  },
  vitalsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: hs(16),
    marginBottom: hs(10),
    width: '100%',
    gap: ws(8),
  },
  vitalsSectionTitle: {
    flex: 1,
    marginRight: ws(8),
    fontSize: fs(14.5),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
  },
  vitalsViewAllText: {
    fontSize: fs(11),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryColor,
  },
  vitalsScrollGrid: {
    gap: hs(10),
  },
  vitalCardChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: fs(12),
    paddingHorizontal: ws(10),
    paddingVertical: hs(8),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: ws(8),
  },
  vitalChipIcon: {
    width: ws(32),
    height: hs(32),
    borderRadius: fs(8),
    justifyContent: 'center',
    alignItems: 'center',
  },
  vitalChipLabel: {
    fontSize: fs(10),
    ...TYPOGRAPHY.medium,
    color: Colors.secondaryFontColor,
  },
  vitalChipValue: {
    fontSize: fs(12),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
    marginTop: hs(1),
  },
  vitalChipUnit: {
    fontSize: fs(10),
    ...TYPOGRAPHY.regular,
    color: Colors.secondaryFontColor,
  },
  newDashboardSection: {
    paddingHorizontal: ws(16),
    marginTop: hs(12),
    marginBottom: 0,
    position: 'relative',
    zIndex: 100,
  },
  newServicesSection: {
    marginHorizontal: ws(16),
    marginTop: hs(18),
    marginBottom: hs(8),
  },
  newSectionHeading: {
    fontSize: fs(16),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
  },
  newSectionSubheading: {
    fontSize: fs(11),
    ...TYPOGRAPHY.medium,
    color: Colors.secondaryFontColor,
    marginTop: hs(2),
    marginBottom: hs(12),
  },
  newServicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ws(10),
  },
  newServiceCard: {
    width: '48%',
    backgroundColor: Colors.white,
    borderRadius: fs(16),
    padding: ws(14),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: hs(2) },
    shadowOpacity: 0.03,
    shadowRadius: fs(4),
    elevation: 1,
  },
  newServiceIconBox: {
    width: ws(44),
    height: hs(44),
    borderRadius: fs(12),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hs(10),
  },
  newServiceTitle: {
    fontSize: fs(13),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
  },
  newServiceSub: {
    fontSize: fs(10),
    ...TYPOGRAPHY.regular,
    color: Colors.secondaryFontColor,
    marginTop: hs(2),
  },
  supportCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryColor,
    paddingHorizontal: ws(12),
    paddingVertical: hs(8),
    borderRadius: fs(10),
    gap: ws(6),
  },
  supportCallText: {
    fontSize: fs(11),
    ...TYPOGRAPHY.bold,
    color: Colors.white,
  },
  webNavyBannerCard: {
    backgroundColor: '#1E3A8A',
    borderRadius: fs(16),
    padding: ws(16),
    marginBottom: hs(16),
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: hs(4) },
    shadowOpacity: 0.15,
    shadowRadius: fs(8),
    elevation: 3,
  },
  webNavyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ws(10),
  },
  webNavyGridItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: fs(12),
    padding: ws(10),
    gap: ws(10),
  },
  webNavyGridItemFull: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: fs(12),
    padding: ws(10),
    gap: ws(10),
  },
  webNavyCircleIcon: {
    width: ws(34),
    height: ws(34),
    aspectRatio: 1,
    borderRadius: 999,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  webNavyValueText: {
    fontSize: fs(13),
    ...TYPOGRAPHY.bold,
    color: '#FFFFFF',
  },
  webNavyLabelText: {
    fontSize: fs(10),
    ...TYPOGRAPHY.medium,
    color: '#93C5FD',
    marginTop: hs(1),
  },
  vitals2ColGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ws(10),
    marginBottom: hs(16),
  },
  vitalGridCard: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: fs(14),
    padding: ws(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: ws(8),
  },
  vitalGridCardFull: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: fs(14),
    padding: ws(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: ws(8),
  },
  webTableCard: {
    backgroundColor: Colors.white,
    borderRadius: fs(16),
    padding: ws(14),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: hs(16),
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: hs(2) },
    shadowOpacity: 0.03,
    shadowRadius: fs(4),
    elevation: 1,
  },
  mobileCardStack: {
    gap: hs(8),
  },
  mobileCardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: fs(12),
    padding: ws(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: ws(10),
  },
  appointmentIconCircle: {
    width: ws(36),
    height: ws(36),
    aspectRatio: 1,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mobileCardTitle: {
    fontSize: fs(13),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
  },
  mobileCardSub: {
    fontSize: fs(11),
    ...TYPOGRAPHY.medium,
    color: Colors.secondaryFontColor,
    marginTop: hs(2),
  },
  fileIconBadge: {
    width: ws(36),
    height: hs(36),
    borderRadius: fs(8),
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  openFileBtn: {
    width: ws(32),
    height: hs(32),
    borderRadius: fs(8),
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  webTableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hs(12),
    gap: ws(8),
  },
  webTableTitle: {
    flex: 1,
    marginRight: ws(8),
    fontSize: fs(15),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
  },
  statusPill: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: ws(8),
    paddingVertical: hs(3),
    borderRadius: fs(6),
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  statusPillText: {
    fontSize: fs(10),
    ...TYPOGRAPHY.bold,
    color: '#059669',
  },
  downloadIconBtn: {
    padding: ws(6),
  },
  vitals2ColGridContainer: {
    width: '100%',
    flexDirection: 'column',
    gap: hs(12),
    marginBottom: hs(16),
  },
  vitalsGridCard: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: fs(16),
    padding: ws(14),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: hs(2) },
    shadowOpacity: 0.04,
    shadowRadius: fs(6),
    elevation: 2,
  },
  vitalsGridCardFull: {
    width: '100%',
  },
  vitalsCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(8),
    marginBottom: hs(8),
  },
  vitalsIconCircle: {
    width: ws(32),
    height: ws(32),
    aspectRatio: 1,
    borderRadius: 999,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vitalsCardTitle: {
    fontSize: fs(13),
    ...TYPOGRAPHY.bold,
    color: '#0F172A',
  },
  vitalsCardSub: {
    fontSize: fs(10),
    ...TYPOGRAPHY.medium,
    color: '#94A3B8',
    marginTop: hs(1),
  },
  vitalsSevenDaysNote: {
    fontSize: fs(9),
    ...TYPOGRAPHY.medium,
    color: '#EF4444',
    marginTop: hs(2),
  },
  vitalsMiniChartArea: {
    flexDirection: 'row',
    width: '100%',
    height: hs(105),
    marginBottom: hs(10),
    alignItems: 'flex-start',
  },
  vitalsLeftYAxisContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: hs(76),
    marginRight: 0,
  },
  vitalsRotatedUnitBox: {
    width: ws(14),
    height: hs(76),
    justifyContent: 'center',
    alignItems: 'center',
  },
  vitalsRotatedUnitText: {
    fontSize: fs(9),
    ...TYPOGRAPHY.bold,
    color: '#475569',
    transform: [{ rotate: '-90deg' }],
    width: ws(76),
    textAlign: 'center',
  },
  vitalsYAxisNumberColumn: {
    height: hs(76),
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    minWidth: ws(24),
  },
  vitalsYAxisNumberText: {
    fontSize: fs(9.5),
    ...TYPOGRAPHY.bold,
    color: '#64748B',
  },
  vitalsSvgBox: {
    flex: 1,
    height: hs(105),
    position: 'relative',
  },
  vitalsDotsOverlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    height: hs(76),
  },
  vitalsXAxisRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: hs(4),
    width: '100%',
  },
  vitalsXLabel: {
    fontSize: fs(8),
    ...TYPOGRAPHY.medium,
    color: '#94A3B8',
    textAlign: 'center',
  },
  vitalsTableHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: fs(8),
    paddingVertical: hs(8),
    paddingHorizontal: ws(6),
    marginBottom: hs(6),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    width: '100%',
  },
  vitalsTableHeadCell: {
    flex: 1,
    fontSize: fs(11),
    ...TYPOGRAPHY.bold,
    color: '#334155',
    textAlign: 'center',
  },
  vitalsTableBody: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: hs(24),
  },
  vitalsTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: hs(9),
    paddingHorizontal: ws(6),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    width: '100%',
  },
  vitalsTableCellText: {
    flex: 1,
    fontSize: fs(11),
    ...TYPOGRAPHY.medium,
    color: Colors.primaryFontColor,
    textAlign: 'center',
  },
  vitalsTableCellAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ws(8),
  },
  actionIconBtnEdit: {
    width: ws(30),
    height: hs(30),
    borderRadius: fs(8),
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionIconBtnDelete: {
    width: ws(30),
    height: hs(30),
    borderRadius: fs(8),
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vitalsNoRecordsText: {
    fontSize: fs(10),
    ...TYPOGRAPHY.medium,
    color: '#94A3B8',
  },
  vitalsDataValText: {
    fontSize: fs(12),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryColor,
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  backdropPressable: { flex: 1 },
  modalBox: { backgroundColor: Colors.white, borderTopLeftRadius: fs(24), borderTopRightRadius: fs(24), padding: ws(20), maxHeight: '85%' },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hs(16),
  },
  modalTitle: { fontSize: fs(Typography.fontSize.lg), ...TYPOGRAPHY.bold, color: Colors.primaryFontColor },
  fieldLabel: {
    fontSize: fs(12),
    ...TYPOGRAPHY.bold,
    color: '#475569',
    marginBottom: hs(6),
    marginTop: hs(8),
  },
  pickerSelectorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: fs(10),
    paddingHorizontal: ws(14),
    paddingVertical: hs(12),
    marginBottom: hs(6),
  },
  pickerSelectorText: {
    fontSize: fs(14),
    ...TYPOGRAPHY.medium,
    color: '#0F172A',
  },
  modalActions: {
    flexDirection: 'row',
    gap: ws(12),
    marginTop: hs(20),
    marginBottom: hs(10),
  },
  cancelBtn: {
    flex: 1,
    height: hs(46),
    borderRadius: fs(12),
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelText: {
    fontSize: fs(14),
    ...TYPOGRAPHY.bold,
    color: '#64748B',
  },
  saveBtn: {
    flex: 1,
    height: hs(46),
    borderRadius: fs(12),
  },
});







