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
  AppDatePickerModal,
  AppHeader,
  AppTextField,
  AppTimePickerModal,
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
  useUpdateVitalMutation,
} from '../../redux/apis/vitalsApi';
import type { FamilyMemberModel, VitalModel } from '../../types';
import { DateTimeUtils, showToast } from '../../utils';
import { validateVitalMetric } from '../../validation/authValidation';

type Props = NativeStackScreenProps<RootStackParamList, 'VitalDetails'>;

export const VitalDetailsScreen = ({ navigation, route }: Props) => {
  const { vitalName, familyMemberId: initialFamilyId } = route.params;
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const uid = String(user?.id ?? (user as any)?.user_id ?? '');

  const [selectedFamilyId, setSelectedFamilyId] = useState<string>(
    initialFamilyId ? String(initialFamilyId) : ''
  );

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
  const activeMemberObj = familyList.find((m) => String(m.id) === activeFamilyId);

  const { data: rawVitals, isLoading, isError, refetch } = useGetVitalsQuery(
    { familyMemberId: activeFamilyId, type: vitalName },
    { skip: !activeFamilyId },
  );

  const [addVital, { isLoading: isAdding }] = useAddVitalMutation();
  const [updateVital, { isLoading: isUpdating }] = useUpdateVitalMutation();
  const [deleteVital] = useDeleteVitalMutation();

  const vitals: VitalModel[] = useMemo(() => {
    if (!rawVitals) return [];
    let list: VitalModel[] = [];
    if (Array.isArray(rawVitals)) list = rawVitals;
    else if (Array.isArray((rawVitals as any)?.data)) list = (rawVitals as any).data;
    else if (Array.isArray((rawVitals as any)?.data?.data)) list = (rawVitals as any).data.data;
    else if (Array.isArray((rawVitals as any)?.response)) list = (rawVitals as any).response;
    else if (Array.isArray((rawVitals as any)?.response?.data)) list = (rawVitals as any).response.data;
    else if (Array.isArray((rawVitals as any)?.result)) list = (rawVitals as any).result;

    return [...list].sort((a, b) => {
      const timeA = new Date(a.date || a.created_at || 0).getTime();
      const timeB = new Date(b.date || b.created_at || 0).getTime();
      return timeB - timeA;
    });
  }, [rawVitals]);

  const latestVital = vitals[0] ?? null;

  // Modal State for Add & Edit
  const [editingItem, setEditingItem] = useState<VitalModel | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedTime, setSelectedTime] = useState<string>(
    new Date().toTimeString().slice(0, 5)
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [value, setValue] = useState('');
  const [sugarRandom, setSugarRandom] = useState('');

  const openAddModal = () => {
    setEditingItem(null);
    setSelectedDate(new Date().toISOString().split('T')[0]);
    setSelectedTime(new Date().toTimeString().slice(0, 5));
    setSystolic('');
    setDiastolic('');
    setValue('');
    setSugarRandom('');
    setShowModal(true);
  };

  const openEditModal = (item: VitalModel) => {
    setEditingItem(item);
    const dateVal = item.date ? item.date.split('T')[0] : (item.created_at ? item.created_at.split('T')[0] : new Date().toISOString().split('T')[0]);
    setSelectedDate(dateVal);
    const timeVal = item.time ? item.time.slice(0, 5) : new Date().toTimeString().slice(0, 5);
    setSelectedTime(timeVal);

    if (vitalName === 'Blood Pressure') {
      setSystolic(item.bp_systolic ? String(item.bp_systolic) : '');
      setDiastolic(item.bp_diastolic ? String(item.bp_diastolic) : '');
    } else if (vitalName === 'Sugar') {
      setValue(item.sugar_fasting ? String(item.sugar_fasting) : '');
      setSugarRandom(item.sugar_random ? String(item.sugar_random) : '');
    } else if (vitalName === 'Weight') {
      setValue(item.weight || (item as any)?.value ? String(item.weight || (item as any)?.value) : '');
    } else if (vitalName === 'Temperature') {
      setValue(item.temperature || (item as any)?.value ? String(item.temperature || (item as any)?.value) : '');
    } else if (vitalName === 'SpO2') {
      setValue(item.spo2 || (item as any)?.value ? String(item.spo2 || (item as any)?.value) : '');
    }
    setShowModal(true);
  };

  const handleModalSubmit = async () => {
    const payload: any = {
      user_id: uid,
      family_member_id: activeFamilyId,
      type: vitalName,
      date: selectedDate,
      time: selectedTime,
    };

    if (editingItem?.id) {
      payload.id = editingItem.id;
    }

    if (vitalName === 'Blood Pressure') {
      if (!systolic.trim() || !diastolic.trim()) {
        showToast('Enter Systolic and Diastolic values');
        return;
      }
      const metricRes = validateVitalMetric('Blood Pressure', systolic.trim(), diastolic.trim());
      if (!metricRes.isValid) {
        showToast(metricRes.error || 'Invalid Blood Pressure values');
        return;
      }
      payload.bp_systolic = systolic.trim();
      payload.bp_diastolic = diastolic.trim();
    } else if (vitalName === 'Sugar') {
      if (!value.trim() && !sugarRandom.trim()) {
        showToast('Enter Fasting or Random Sugar value');
        return;
      }
      const metricRes = validateVitalMetric('Sugar', value.trim(), sugarRandom.trim());
      if (!metricRes.isValid) {
        showToast(metricRes.error || 'Invalid Sugar values');
        return;
      }
      payload.sugar_fasting = value.trim();
      payload.sugar_random = sugarRandom.trim();
    } else if (vitalName === 'Weight') {
      if (!value.trim()) {
        showToast('Enter Weight in kg');
        return;
      }
      const metricRes = validateVitalMetric('Weight', value.trim());
      if (!metricRes.isValid) {
        showToast(metricRes.error || 'Invalid Weight value');
        return;
      }
      payload.weight = value.trim();
    } else if (vitalName === 'Temperature') {
      if (!value.trim()) {
        showToast('Enter Temperature');
        return;
      }
      const metricRes = validateVitalMetric('Temperature', value.trim());
      if (!metricRes.isValid) {
        showToast(metricRes.error || 'Invalid Temperature value');
        return;
      }
      payload.temperature = value.trim();
    } else if (vitalName === 'SpO2') {
      if (!value.trim()) {
        showToast('Enter SpO2 percentage');
        return;
      }
      const metricRes = validateVitalMetric('SpO2', value.trim());
      if (!metricRes.isValid) {
        showToast(metricRes.error || 'Invalid SpO2 percentage');
        return;
      }
      payload.spo2 = value.trim();
    }

    try {
      if (editingItem?.id) {
        await updateVital(payload).unwrap();
        showToast(`${vitalName} record updated successfully`);
      } else {
        await addVital(payload).unwrap();
        showToast(`${vitalName} logged successfully`);
      }
      setShowModal(false);
      refetch();
    } catch (e: any) {
      showToast(e?.data?.message || e?.message || 'Failed to save vital reading');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteVital({ id }).unwrap();
      showToast('Record deleted');
      refetch();
    } catch (e: any) {
      showToast(e?.data?.message || 'Could not delete record');
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
    if (vitalName === 'Sugar') return { icon: 'opacity', color: '#8B5CF6', bg: '#EDE9FE' };
    if (vitalName === 'Weight') return { icon: 'fitness-center', color: '#10B981', bg: '#D1FAE5' };
    if (vitalName === 'Temperature') return { icon: 'thermostat', color: '#F59E0B', bg: '#FEF3C7' };
    if (vitalName === 'SpO2') return { icon: 'air', color: '#0284C7', bg: '#E0F2FE' };
    return { icon: 'favorite', color: Colors.primaryColor, bg: '#EFF6FF' };
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
                {vitalName === 'Sugar' ? (
                  <View style={{ gap: 2 }}>
                    <Text style={styles.heroValueText}>
                      Fasting: {latestVital.sugar_fasting ? `${latestVital.sugar_fasting} mg/dL` : '--'}
                    </Text>
                    <Text style={[styles.heroValueText, { fontSize: 16, color: Colors.secondaryFontColor }]}>
                      Random: {latestVital.sugar_random ? `${latestVital.sugar_random} mg/dL` : '--'}
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.heroValueText}>{renderVitalValue(latestVital)}</Text>
                )}
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
                  {vitalName === 'Sugar' ? (
                    <View style={{ gap: 2 }}>
                      <Text style={styles.valueText}>
                        Fasting: {item.sugar_fasting ? `${item.sugar_fasting} mg/dL` : '--'}
                      </Text>
                      <Text style={[styles.valueText, { fontSize: 12, color: Colors.secondaryFontColor, fontFamily: Typography.fontFamily.medium }]}>
                        Random: {item.sugar_random ? `${item.sugar_random} mg/dL` : '--'}
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.valueText}>{renderVitalValue(item)}</Text>
                  )}
                  <Text style={styles.dateText}>
                    {DateTimeUtils.getDataFormat(item.date || item.created_at)} {formatItemTime(item.time)}
                  </Text>
                </View>
                <View style={styles.actionRow}>
                  {!!item.id && (
                    <>
                      <TouchableOpacity
                        style={styles.actionIconBtnEdit}
                        onPress={() => openEditModal(item)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <MaterialIcons name="edit" size={17} color="#059669" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionIconBtnDelete}
                        onPress={() => handleDelete(String(item.id))}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <MaterialIcons name="delete-outline" size={17} color="#EF4444" />
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
            </AppCard>
          )}
        />
      )}

      {/* FAB Add Reading Button */}
      <TouchableOpacity
        style={[styles.fab, { bottom: 24 + insets.bottom }]}
        activeOpacity={0.85}
        onPress={openAddModal}
      >
        <MaterialIcons name="add" size={28} color={Colors.white} />
      </TouchableOpacity>

      {/* Add / Edit Reading Modal */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <TouchableOpacity style={styles.backdropPressable} activeOpacity={1} onPress={() => setShowModal(false)} />
          <View style={[styles.modalBox, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            <ScrollView
              contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
              keyboardShouldPersistTaps="handled"
              bounces={false}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalTitle}>
                  {editingItem ? `Update ${vitalName} Data` : `Add ${vitalName} Data`}
                </Text>
                <TouchableOpacity onPress={() => setShowModal(false)}>
                  <MaterialIcons name="close" size={22} color={Colors.primaryFontColor} />
                </TouchableOpacity>
              </View>

              {/* Patient / Family Member Info Box */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Patient / Family Member</Text>
                <View style={styles.memberBox}>
                  <Text style={styles.memberBoxText}>
                    {activeMemberObj?.name || `${activeMemberObj?.f_name ?? ''} ${activeMemberObj?.l_name ?? ''}`.trim() || 'Self'}
                  </Text>
                </View>
              </View>

              {/* Date & Time Selection Row */}
              <View style={styles.dateTimeRow}>
                {/* Select Date */}
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Select Date</Text>
                  <TouchableOpacity
                    style={styles.pickerTriggerBox}
                    onPress={() => setShowDatePicker(true)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.pickerTriggerText}>{selectedDate}</Text>
                    <MaterialIcons name="calendar-today" size={18} color={Colors.primaryColor} />
                  </TouchableOpacity>
                </View>

                {/* Select Time */}
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Select Time</Text>
                  <TouchableOpacity
                    style={styles.pickerTriggerBox}
                    onPress={() => setShowTimePicker(true)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.pickerTriggerText}>{selectedTime}</Text>
                    <MaterialIcons name="schedule" size={18} color={Colors.primaryColor} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Metric Value Inputs */}
              {vitalName === 'Blood Pressure' ? (
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
              ) : vitalName === 'Sugar' ? (
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
                  <Text style={styles.fieldLabel}>{vitalName}</Text>
                  <AppTextField
                    placeholder={`Enter ${vitalName} reading`}
                    keyboardType="decimal-pad"
                    value={value}
                    onChangeText={setValue}
                  />
                </>
              )}

              {/* Bottom Action Buttons */}
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(false)}>
                  <Text style={styles.cancelText}>Close</Text>
                </TouchableOpacity>
                <AppButton
                  title={editingItem ? 'Update' : 'Save'}
                  loading={isAdding || isUpdating}
                  onPress={handleModalSubmit}
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgColor },
  familyBar: { backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  familyScroll: { paddingHorizontal: 16, paddingVertical: 10 },
  familyChip: {
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
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionIconBtnEdit: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionIconBtnDelete: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
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
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: { fontSize: Typography.fontSize.lg, fontFamily: Typography.fontFamily.bold, color: Colors.primaryFontColor },
  fieldGroup: { marginBottom: 12 },
  fieldLabel: {
    fontSize: 12,
    fontFamily: Typography.fontFamily.bold,
    color: '#475569',
    marginBottom: 6,
    marginTop: 4,
  },
  memberBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  memberBoxText: {
    fontSize: 14,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.primaryFontColor,
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  pickerTriggerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  pickerTriggerText: {
    fontSize: 13,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.primaryFontColor,
  },
  modalActions: { flexDirection: 'row', alignItems: 'center', marginTop: 18, gap: 10 },
  cancelBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#CBD5E1' },
  cancelText: { fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.bold, color: Colors.primaryFontColor },
  saveBtn: { flex: 1.5, borderRadius: 12 },
});
