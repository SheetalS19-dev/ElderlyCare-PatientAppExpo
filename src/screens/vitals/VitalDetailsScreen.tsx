import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AppButton,
  AppCard,
  AppHeader,
  AppTextField,
  EmptyState,
  ErrorState,
  LoadingIndicator,
} from '../../components';
import { Colors, Typography } from '../../constants';
import { useAuth } from '../../context/AuthContext';
import type { RootStackParamList } from '../../navigation/types';
import { useGetFamilyMembersQuery } from '../../redux/apis/bookingApi';
import {
  useAddVitalMutation,
  useDeleteVitalMutation,
  useGetVitalsQuery,
} from '../../redux/apis/vitalsApi';
import type { FamilyMemberModel, VitalModel } from '../../types';
import { DateTimeUtils, showToast } from '../../utils';

type Props = NativeStackScreenProps<RootStackParamList, 'VitalDetails'>;

export const VitalDetailsScreen = ({ navigation, route }: Props) => {
  const { vitalName } = route.params;
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const uid = String(user?.id ?? (user as any)?.user_id ?? '');

  const [selectedFamilyId, setSelectedFamilyId] = useState<string>('');

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
            gender: user.gender || 'Male',
            isd_code: user.isd_code || '+91',
            dob: user.dob || '',
          },
          ...list,
        ];
      }
    }
    return list;
  }, [familyData, user]);

  const activeFamilyId = selectedFamilyId || (familyList[0] ? String(familyList[0].id) : uid);

  const { data: rawVitals, isLoading, isError, refetch } = useGetVitalsQuery(
    { familyMemberId: activeFamilyId, type: vitalName },
    { skip: !activeFamilyId },
  );

  const [addVital, { isLoading: isAdding }] = useAddVitalMutation();
  const [deleteVital] = useDeleteVitalMutation();

  const vitals: VitalModel[] = useMemo(() => {
    if (!rawVitals) return [];
    if (Array.isArray(rawVitals)) return rawVitals;
    if (Array.isArray((rawVitals as any)?.data)) return (rawVitals as any).data;
    if (Array.isArray((rawVitals as any)?.data?.data)) return (rawVitals as any).data.data;
    if (Array.isArray((rawVitals as any)?.response)) return (rawVitals as any).response;
    if (Array.isArray((rawVitals as any)?.response?.data)) return (rawVitals as any).response.data;
    if (Array.isArray((rawVitals as any)?.result)) return (rawVitals as any).result;
    return [];
  }, [rawVitals]);

  const latestVital = vitals[0] ?? null;

  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [value, setValue] = useState('');
  const [sugarRandom, setSugarRandom] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const handleAddSubmit = async () => {
    const payload: any = {
      user_id: uid,
      family_member_id: activeFamilyId,
      type: vitalName,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
    };

    if (vitalName === 'Blood Pressure') {
      if (!systolic || !diastolic) {
        showToast('Enter Systolic and Diastolic values');
        return;
      }
      payload.bp_systolic = systolic.trim();
      payload.bp_diastolic = diastolic.trim();
    } else if (vitalName === 'Sugar') {
      if (!value && !sugarRandom) {
        showToast('Enter Fasting or Random Sugar value');
        return;
      }
      payload.sugar_fasting = value.trim();
      payload.sugar_random = sugarRandom.trim();
    } else if (vitalName === 'Weight') {
      if (!value.trim()) {
        showToast('Enter Weight in kg');
        return;
      }
      payload.weight = value.trim();
    } else if (vitalName === 'Temperature') {
      if (!value.trim()) {
        showToast('Enter Temperature');
        return;
      }
      payload.temperature = value.trim();
    } else if (vitalName === 'SpO2') {
      if (!value.trim()) {
        showToast('Enter SpO2 percentage');
        return;
      }
      payload.spo2 = value.trim();
    }

    try {
      await addVital(payload).unwrap();
      showToast(`${vitalName} logged successfully`);
      setShowAddModal(false);
      setSystolic('');
      setDiastolic('');
      setValue('');
      setSugarRandom('');
      refetch();
    } catch (e: any) {
      showToast(e?.data?.message || e?.message || 'Failed to log vital reading');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteVital({ id }).unwrap();
      showToast('Log deleted');
      refetch();
    } catch (e: any) {
      showToast(e?.data?.message || 'Could not delete log');
    }
  };

  const renderVitalValue = (item: VitalModel) => {
    if (vitalName === 'Blood Pressure') {
      return `${item.bp_systolic ?? '--'} / ${item.bp_diastolic ?? '--'} mmHg`;
    }
    if (vitalName === 'Sugar') {
      const parts = [];
      if (item.sugar_fasting) parts.push(`Fasting: ${item.sugar_fasting} mg/dL`);
      if (item.sugar_random) parts.push(`Random: ${item.sugar_random} mg/dL`);
      return parts.length > 0 ? parts.join('  •  ') : '-- mg/dL';
    }
    if (vitalName === 'Weight') return `${item.weight ?? (item as any)?.value ?? '--'} kg`;
    if (vitalName === 'Temperature') return `${item.temperature ?? (item as any)?.value ?? '--'} °F`;
    if (vitalName === 'SpO2') return `${item.spo2 ?? (item as any)?.value ?? '--'} %`;
    return '--';
  };

  const getVitalIcon = () => {
    if (vitalName === 'Blood Pressure') return { icon: 'favorite', color: Colors.redColor, bg: '#FEE2E2' };
    if (vitalName === 'Sugar') return { icon: 'invert-colors', color: Colors.primaryColor, bg: '#FFF5EB' };
    if (vitalName === 'Weight') return { icon: 'monitor-weight', color: '#2563EB', bg: '#EFF6FF' };
    if (vitalName === 'Temperature') return { icon: 'thermostat', color: '#EA580C', bg: '#FFEDD5' };
    if (vitalName === 'SpO2') return { icon: 'air', color: '#059669', bg: '#ECFDF5' };
    return { icon: 'favorite', color: Colors.primaryColor, bg: '#FFF5EB' };
  };

  const formatItemTime = (timeStr?: string) => {
    if (!timeStr) return '';
    return DateTimeUtils.formatTimeToAmPm(timeStr) || timeStr;
  };

  const iconInfo = getVitalIcon();

  return (
    <View style={styles.container}>
      <AppHeader title={`${vitalName} Tracker`} onBackPress={() => navigation.goBack()} />

      {/* Family member selector bar */}
      {familyList.length > 0 && (
        <View style={styles.familyBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.familyScroll}>
            {familyList.map((mem) => {
              const selected = String(mem.id) === activeFamilyId;
              const displayName =
                mem.name ||
                `${mem.f_name ?? ''} ${mem.l_name ?? ''}`.trim() ||
                (String(mem.id) === String(user?.id) ? 'Self' : 'Member');

              return (
                <TouchableOpacity
                  key={mem.id}
                  style={[styles.familyChip, selected && styles.familyChipSelected]}
                  onPress={() => setSelectedFamilyId(String(mem.id))}
                  activeOpacity={0.8}
                >
                  <MaterialIcons
                    name="person-outline"
                    size={14}
                    color={selected ? Colors.white : Colors.primaryFontColor}
                  />
                  <Text style={[styles.familyChipText, selected && styles.familyChipTextSelected]}>
                    {displayName}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {isLoading ? (
        <LoadingIndicator />
      ) : isError ? (
        <ErrorState message="Couldn't load vital history" onRetry={refetch} />
      ) : (
        <FlatList
          data={vitals}
          keyExtractor={(item, index) => `v-${item.id ?? index}`}
          contentContainerStyle={[styles.listContent, { flexGrow: 1, paddingBottom: 90 + insets.bottom }]}
          ListHeaderComponent={
            latestVital ? (
              <AppCard style={styles.heroCard}>
                <View style={styles.heroHeaderRow}>
                  <View style={[styles.heroIconCircle, { backgroundColor: iconInfo.bg }]}>
                    <MaterialIcons name={iconInfo.icon as any} size={28} color={iconInfo.color} />
                  </View>
                  <View style={styles.heroTitleCol}>
                    <Text style={styles.heroLabel}>Latest {vitalName}</Text>
                    <Text style={styles.heroTime}>
                      {DateTimeUtils.getDataFormat(latestVital.date || latestVital.created_at)} at{' '}
                      {formatItemTime(latestVital.time)}
                    </Text>
                  </View>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusBadgeText}>Optimal</Text>
                  </View>
                </View>
                <Text style={styles.heroValueText}>{renderVitalValue(latestVital)}</Text>
              </AppCard>
            ) : null
          }
          ListEmptyComponent={<EmptyState message={`No ${vitalName} logs recorded yet.`} subtitle="Tap + below to log your first reading" />}
          renderItem={({ item }) => (
            <AppCard style={styles.card}>
              <View style={styles.row}>
                <View style={[styles.itemIconCircle, { backgroundColor: iconInfo.bg }]}>
                  <MaterialIcons name={iconInfo.icon as any} size={20} color={iconInfo.color} />
                </View>
                <View style={styles.info}>
                  <Text style={styles.valueText}>{renderVitalValue(item)}</Text>
                  <Text style={styles.dateText}>
                    {DateTimeUtils.getDataFormat(item.date || item.created_at)} {formatItemTime(item.time)}
                  </Text>
                </View>
                {!!item.id && (
                  <TouchableOpacity
                    onPress={() => handleDelete(String(item.id))}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <MaterialIcons name="delete-outline" size={20} color={Colors.redColor} />
                  </TouchableOpacity>
                )}
              </View>
            </AppCard>
          )}
        />
      )}

      {/* FAB Add Reading Button */}
      <TouchableOpacity
        style={[styles.fab, { bottom: 24 + insets.bottom }]}
        activeOpacity={0.85}
        onPress={() => setShowAddModal(true)}
      >
        <MaterialIcons name="add" size={28} color={Colors.white} />
      </TouchableOpacity>

      {/* Add Reading Modal */}
      <Modal visible={showAddModal} transparent animationType="slide" onRequestClose={() => setShowAddModal(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <TouchableOpacity style={styles.backdropPressable} activeOpacity={1} onPress={() => setShowAddModal(false)} />
          <View style={[styles.modalBox, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            <ScrollView
              contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
              keyboardShouldPersistTaps="handled"
              bounces={false}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.modalTitle}>Log {vitalName} Reading</Text>

              {vitalName === 'Blood Pressure' ? (
                <>
                  <AppTextField
                    placeholder="Systolic (mmHg)"
                    keyboardType="number-pad"
                    value={systolic}
                    onChangeText={setSystolic}
                  />
                  <AppTextField
                    placeholder="Diastolic (mmHg)"
                    keyboardType="number-pad"
                    value={diastolic}
                    onChangeText={setDiastolic}
                  />
                </>
              ) : vitalName === 'Sugar' ? (
                <>
                  <AppTextField
                    placeholder="Fasting (mg/dL)"
                    keyboardType="number-pad"
                    value={value}
                    onChangeText={setValue}
                  />
                  <AppTextField
                    placeholder="Random (mg/dL)"
                    keyboardType="number-pad"
                    value={sugarRandom}
                    onChangeText={setSugarRandom}
                  />
                </>
              ) : (
                <AppTextField
                  placeholder={`Value (${vitalName})`}
                  keyboardType="decimal-pad"
                  value={value}
                  onChangeText={setValue}
                />
              )}

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAddModal(false)}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <AppButton title="Save Reading" loading={isAdding} onPress={handleAddSubmit} style={styles.saveBtn} />
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgColor },
  familyBar: { backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  familyScroll: { paddingHorizontal: 16, paddingVertical: 10 },
  familyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    marginRight: 8,
  },
  familyChipSelected: { backgroundColor: Colors.primaryColor },
  familyChipText: { fontSize: Typography.fontSize.xs, color: Colors.primaryFontColor, fontFamily: Typography.fontFamily.medium },
  familyChipTextSelected: { color: Colors.white, fontFamily: Typography.fontFamily.bold },
  listContent: { flexGrow: 1, padding: 16, paddingBottom: 80 },
  heroCard: {
    padding: 18,
    borderRadius: 18,
    marginBottom: 16,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  heroHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  heroIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  heroTitleCol: {
    flex: 1,
  },
  heroLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.secondaryFontColor,
  },
  heroTime: {
    marginTop: 2,
    fontSize: 11,
    fontFamily: Typography.fontFamily.regular,
    color: '#94A3B8',
  },
  statusBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusBadgeText: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.bold,
    color: '#059669',
  },
  heroValueText: {
    fontSize: 24,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryFontColor,
  },
  card: {
    marginBottom: 10,
    borderRadius: 14,
    padding: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  info: { flex: 1 },
  valueText: { fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.bold, color: Colors.primaryFontColor },
  dateText: { marginTop: 3, fontSize: Typography.fontSize.xs, color: Colors.secondaryFontColor },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primaryColor,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: Colors.primaryColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  backdropPressable: { flex: 1 },
  modalBox: { backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  modalTitle: { fontSize: Typography.fontSize.lg, fontFamily: Typography.fontFamily.bold, color: Colors.primaryFontColor, marginBottom: 16 },
  modalActions: { flexDirection: 'row', alignItems: 'center', marginTop: 14, gap: 10 },
  cancelBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12, backgroundColor: '#F1F5F9' },
  cancelText: { fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.bold, color: Colors.primaryFontColor },
  saveBtn: { flex: 1.5, borderRadius: 12 },
});
