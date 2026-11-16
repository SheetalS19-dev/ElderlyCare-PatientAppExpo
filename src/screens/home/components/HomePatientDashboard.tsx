import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { memo } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { GradientFill } from '../../../components/common/ThemeBackdrop';
import { Colors } from '../../../constants';
import type { FamilyMemberModel } from '../../../types';
import {
  DateTimeUtils,
  downloadAndSaveFile,
  formatDoctorName,
  fs,
  getImageUrl,
  hs,
  TYPOGRAPHY,
  ws,
} from '../../../utils';
import { VitalChartCard } from './VitalChartCard';

export interface ActivePatientInfo {
  name: string;
  gender: string;
  dob: string;
  age: string;
  bloodGroup: string;
  consultingDoctor: string;
  relation: string;
  isSelf: boolean;
}

interface HomePatientDashboardProps {
  activePatientInfo: ActivePatientInfo;
  genderIconName: 'male' | 'female' | 'wc';
  selectedMemberId: string;
  selectedMemberDisplayName: string;
  selfFullName: string;
  filteredFamilyMembersList: FamilyMemberModel[];
  showMemberDropdown: boolean;
  onToggleMemberDropdown: () => void;
  onSelectMember: (id: string) => void;
  onManageMembers: () => void;
  onBookAppointment: () => void;
  onViewAllVitals: () => void;
  rawBpVitals: any;
  rawSugarVitals: any;
  rawWeightVitals: any;
  rawTempVitals: any;
  rawSpo2Vitals: any;
  getLatestVitalValue: (rawData: any, type: string) => string;
  activeFamilyId: string;
  onNavigateVitalDetails: (vitalName: string) => void;
  onDeleteVitalRecord: (id: string | number) => void;
  onEditVitalRecord: (item: any, vitalType: string) => void;
  latestAppointments: any[];
  onViewAllAppointments: () => void;
  latestFiles: any[];
  onViewAllFiles: () => void;
  downloadingFileId: string | number | null;
  setDownloadingFileId: (id: string | number | null) => void;
}

export const HomePatientDashboard = memo(({
  activePatientInfo,
  genderIconName,
  selectedMemberId,
  selectedMemberDisplayName,
  selfFullName,
  filteredFamilyMembersList,
  showMemberDropdown,
  onToggleMemberDropdown,
  onSelectMember,
  onManageMembers,
  onBookAppointment,
  onViewAllVitals,
  rawBpVitals,
  rawSugarVitals,
  rawWeightVitals,
  rawTempVitals,
  rawSpo2Vitals,
  getLatestVitalValue,
  activeFamilyId,
  onNavigateVitalDetails,
  onDeleteVitalRecord,
  onEditVitalRecord,
  latestAppointments,
  onViewAllAppointments,
  latestFiles,
  onViewAllFiles,
  downloadingFileId,
  setDownloadingFileId,
}: HomePatientDashboardProps) => {
  return (
    <View style={styles.newDashboardSection}>
      <View style={styles.dashCard}>
        <View style={styles.dashHeaderRow}>
          <View style={styles.dashHeaderIcon}>
            <MaterialIcons name="groups" size={fs(20)} color={Colors.primaryColor} />
          </View>
          <Text style={[styles.sectionHeading, { flex: 1 }]} numberOfLines={1}>
            Patients Dashboard
          </Text>
          <TouchableOpacity
            style={styles.viewAllBtn}
            onPress={onManageMembers}
            activeOpacity={0.7}
          >
            <Text style={styles.viewAllText}>Manage Members</Text>
            <MaterialIcons name="arrow-forward-ios" size={12} color={Colors.navy} />
          </TouchableOpacity>
        </View>

        {/* Member Section Inline Dropdown */}
        <View style={styles.memberDropdownContainer}>
          <TouchableOpacity
            style={[
              styles.memberDropdownField,
              showMemberDropdown && styles.memberDropdownFieldOpen,
            ]}
            activeOpacity={0.85}
            onPress={onToggleMemberDropdown}
          >
            <MaterialIcons
              name="person"
              size={fs(18)}
              color={Colors.navy}
              style={styles.memberDropdownIcon}
            />
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
                onPress={() => onSelectMember('SELF')}
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
                    onPress={() => onSelectMember(memberId)}
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

        {/* Patient profile tiles (2 x 2) */}
        <View style={styles.patientTileGrid}>
          {[
            { key: 'name', label: 'Patient', value: activePatientInfo.name, icon: 'person' as const, fg: Colors.teal, bg: '#CDE7F2' },
            { key: 'gender', label: 'Gender', value: activePatientInfo.gender, icon: genderIconName, fg: '#1B4F9C', bg: '#D4E2F6' },
            { key: 'age', label: 'Patient Age', value: activePatientInfo.age, icon: 'event-note' as const, fg: '#4B3FA0', bg: '#DDDBF4' },
            { key: 'blood', label: 'Blood Group', value: activePatientInfo.bloodGroup, icon: 'opacity' as const, fg: '#D03C40', bg: '#F8DADD' },
          ].map((tile) => (
            <View key={`patient-tile-${tile.key}`} style={styles.patientTile}>
              <View style={[styles.patientTileIcon, { backgroundColor: tile.bg }]}>
                <MaterialIcons name={tile.icon} size={fs(22)} color={tile.fg} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.patientTileValue} numberOfLines={1}>{tile.value}</Text>
                <Text style={styles.patientTileLabel} numberOfLines={1}>{tile.label}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Appointment banner */}
      <View style={styles.apptBanner}>
        <GradientFill id="apptBannerGrad" colors={Colors.bannerGradient} x1="0" y1="0" x2="1" y2="0" />
        <MaterialCommunityIcons name="calendar-clock" size={fs(44)} color={Colors.navy} />
        <View style={styles.apptDivider} />
        <View style={{ flex: 1 }}>
          <Text style={styles.apptTitle} numberOfLines={1}>{activePatientInfo.consultingDoctor}</Text>
          <Text style={styles.apptSub} numberOfLines={1}>Consulting Doctor</Text>
        </View>
        <TouchableOpacity
          style={styles.apptBtn}
          activeOpacity={0.85}
          onPress={onBookAppointment}
        >
          <Text style={styles.apptBtnText}>Book Now</Text>
          <MaterialIcons name="arrow-forward" size={fs(16)} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* Health Vitals Tracker */}
      <View style={styles.vitalsWrapCard}>
        <View style={styles.vitalsHeaderRow}>
          <View style={styles.vitalsHeaderIcon}>
            <MaterialCommunityIcons name="heart-pulse" size={fs(26)} color={Colors.primaryColor} />
          </View>
          <View style={{ flex: 1, marginRight: ws(8) }}>
            <Text style={styles.sectionHeading} numberOfLines={1}>Health Vitals Tracker</Text>
            <Text style={styles.sectionSubheading} numberOfLines={1}>Track and monitor your health</Text>
          </View>
          <TouchableOpacity
            style={styles.viewAllBtn}
            onPress={onViewAllVitals}
            activeOpacity={0.7}
          >
            <Text style={styles.viewAllText}>Log Vitals</Text>
            <MaterialIcons name="arrow-forward-ios" size={12} color={Colors.navy} />
          </TouchableOpacity>
        </View>

        {/* Vitals 2-Column Grid Cards */}
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
            onPress={() => onNavigateVitalDetails('Blood Pressure')}
            onDeleteRecord={onDeleteVitalRecord}
            onEditRecord={(item) => onEditVitalRecord(item, 'Blood Pressure')}
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
            onPress={() => onNavigateVitalDetails('Sugar')}
            onDeleteRecord={onDeleteVitalRecord}
            onEditRecord={(item) => onEditVitalRecord(item, 'Sugar')}
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
            onPress={() => onNavigateVitalDetails('Weight')}
            onDeleteRecord={onDeleteVitalRecord}
            onEditRecord={(item) => onEditVitalRecord(item, 'Weight')}
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
            onPress={() => onNavigateVitalDetails('Temperature')}
            onDeleteRecord={onDeleteVitalRecord}
            onEditRecord={(item) => onEditVitalRecord(item, 'Temperature')}
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
            onPress={() => onNavigateVitalDetails('SpO2')}
            onDeleteRecord={onDeleteVitalRecord}
            onEditRecord={(item) => onEditVitalRecord(item, 'SpO2')}
            fullWidth
            yLabels={['100', '90', '80']}
          />
        </View>
      </View>

      {/* Appointment List */}
      <View style={styles.webTableCard}>
        <View style={styles.webTableHeaderRow}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.sectionHeading} numberOfLines={1}>Appointment List</Text>
          </View>
          <TouchableOpacity
            style={styles.viewAllBtn}
            onPress={onViewAllAppointments}
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

      {/* Patient Files */}
      <View style={styles.webTableCard}>
        <View style={styles.webTableHeaderRow}>
          <View style={{ flex: 1, marginRight: ws(8) }}>
            <Text style={styles.sectionHeading} numberOfLines={1}>Medical Files</Text>
          </View>
          <TouchableOpacity
            style={styles.viewAllBtn}
            onPress={onViewAllFiles}
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
                    onPress={onViewAllFiles}
                  >
                    <View style={[styles.fileIconBadge, { backgroundColor: Colors.aquaSoft }]}>
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
                        onViewAllFiles();
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
                style={{ paddingHorizontal: ws(14), paddingVertical: hs(6), borderRadius: fs(8), backgroundColor: Colors.aquaSoft }}
                onPress={onViewAllFiles}
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
  );
});

const styles = StyleSheet.create({
  newDashboardSection: {
    paddingHorizontal: ws(16),
    marginTop: hs(14),
    marginBottom: 0,
    position: 'relative',
    zIndex: 100,
  },
  dashCard: {
    backgroundColor: Colors.white,
    borderRadius: fs(22),
    padding: ws(14),
    marginBottom: hs(14),
    borderWidth: 1,
    borderColor: '#E3EDF7',
    shadowColor: Colors.navy,
    shadowOffset: { width: 0, height: hs(3) },
    shadowOpacity: 0.07,
    shadowRadius: fs(10),
    elevation: 3,
    zIndex: 10,
  },
  dashHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(8),
    marginBottom: hs(12),
  },
  dashHeaderIcon: {
    width: ws(34),
    height: ws(34),
    aspectRatio: 1,
    borderRadius: 999,
    backgroundColor: Colors.aqua,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeading: {
    fontSize: fs(16),
    ...TYPOGRAPHY.bold,
    color: Colors.ink,
  },
  sectionSubheading: {
    fontSize: fs(11.5),
    ...TYPOGRAPHY.regular,
    color: Colors.inkSoft,
    marginTop: hs(2),
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(4),
  },
  viewAllText: {
    fontSize: fs(12),
    ...TYPOGRAPHY.semiBold,
    color: Colors.navy,
  },
  memberDropdownContainer: {
    marginBottom: hs(12),
    position: 'relative',
    zIndex: 1000,
  },
  memberDropdownField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderRadius: fs(14),
    borderWidth: 1,
    borderColor: Colors.aquaBorder,
    paddingHorizontal: ws(14),
    paddingVertical: hs(11),
  },
  memberDropdownFieldOpen: {
    borderColor: Colors.primaryColor,
  },
  memberDropdownFieldText: {
    fontSize: fs(14),
    ...TYPOGRAPHY.semiBold,
    color: Colors.ink,
    flex: 1,
    marginRight: ws(8),
  },
  memberDropdownIcon: {
    marginRight: ws(10),
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
  patientTileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: hs(10),
  },
  patientTile: {
    width: '48.5%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(10),
    backgroundColor: '#E6EFFA',
    borderRadius: fs(16),
    borderWidth: 1,
    borderColor: '#D8E7F6',
    paddingVertical: hs(12),
    paddingHorizontal: ws(10),
  },
  patientTileIcon: {
    width: ws(42),
    height: ws(42),
    aspectRatio: 1,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  patientTileValue: {
    fontSize: fs(15),
    ...TYPOGRAPHY.bold,
    color: Colors.ink,
  },
  patientTileLabel: {
    fontSize: fs(10.5),
    ...TYPOGRAPHY.regular,
    color: Colors.inkSoft,
    marginTop: hs(1),
  },
  apptBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(12),
    borderRadius: fs(20),
    overflow: 'hidden',
    paddingVertical: hs(16),
    paddingHorizontal: ws(14),
    marginBottom: hs(14),
    backgroundColor: Colors.aqua,
  },
  apptDivider: {
    width: 1.5,
    alignSelf: 'stretch',
    backgroundColor: 'rgba(12, 40, 92, 0.35)',
    marginVertical: hs(2),
  },
  apptTitle: {
    fontSize: fs(14),
    ...TYPOGRAPHY.bold,
    color: Colors.navy,
  },
  apptSub: {
    fontSize: fs(11),
    ...TYPOGRAPHY.regular,
    color: Colors.navyMid,
    marginTop: hs(1),
  },
  apptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(6),
    backgroundColor: Colors.navy,
    borderRadius: fs(14),
    paddingVertical: hs(10),
    paddingHorizontal: ws(14),
  },
  apptBtnText: {
    fontSize: fs(12),
    ...TYPOGRAPHY.semiBold,
    color: Colors.white,
  },
  vitalsWrapCard: {
    backgroundColor: Colors.white,
    borderRadius: fs(22),
    padding: ws(14),
    marginBottom: hs(14),
    borderWidth: 1,
    borderColor: '#E3EDF7',
    shadowColor: Colors.navy,
    shadowOffset: { width: 0, height: hs(3) },
    shadowOpacity: 0.07,
    shadowRadius: fs(10),
    elevation: 3,
  },
  vitalsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(10),
    marginBottom: hs(12),
  },
  vitalsHeaderIcon: {
    width: ws(44),
    height: ws(44),
    aspectRatio: 1,
    borderRadius: 999,
    backgroundColor: Colors.aqua,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vitals2ColGridContainer: {
    width: '100%',
    flexDirection: 'column',
    gap: hs(12),
  },
  webTableCard: {
    backgroundColor: Colors.white,
    borderRadius: fs(16),
    padding: ws(14),
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: hs(16),
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: hs(2) },
    shadowOpacity: 0.03,
    shadowRadius: fs(4),
    elevation: 1,
  },
  webTableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hs(12),
    gap: ws(8),
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
    borderColor: Colors.border,
    gap: ws(10),
  },
  appointmentIconCircle: {
    width: ws(36),
    height: ws(36),
    aspectRatio: 1,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: Colors.aquaSoft,
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
    backgroundColor: Colors.aquaSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
