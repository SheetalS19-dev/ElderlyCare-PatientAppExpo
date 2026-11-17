import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AppHeader,
  DepartmentSelectModal,
  DoctorCard,
  EmptyState,
  ErrorState,
  LoadingIndicator,
  SearchBox,
} from '../../components';
import { Colors } from '../../constants';
import type { DoctorModel } from '../../types';
import { fs, hs, TYPOGRAPHY, ws } from '../../utils';
import { useDoctorList } from './useDoctorList';

export const DoctorListScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const {
    navigation,
    search,
    setSearch,
    selectedDeptId,
    selectedDeptTitle,
    isDeptModalVisible,
    setIsDeptModalVisible,
    departments,
    doctorsList,
    isDoctorsLoading,
    isFetching,
    isError,
    refetch,
    handleSelectDepartment,
    handleBookDoctor,
  } = useDoctorList();

  return (
    <View style={styles.container}>
      <AppHeader
        title={selectedDeptTitle || 'Doctors'}
        onBackPress={() => navigation.goBack()}
      />

      <View style={styles.searchWrapper}>
        <SearchBox
          value={search}
          onChangeText={setSearch}
          placeholder="Search doctors, specializations, clinics..."
        />

        {/* Department Dropdown Selector */}
        {departments.length > 0 && (
          <TouchableOpacity
            style={styles.deptSelector}
            activeOpacity={0.7}
            onPress={() => setIsDeptModalVisible(true)}
          >
            <MaterialIcons
              name="medical-services"
              size={18}
              color={Colors.primaryColor}
            />
            <Text style={[styles.deptSelectorText, !selectedDeptTitle && styles.deptSelectorPlaceholder]} numberOfLines={1}>
              {selectedDeptTitle ? selectedDeptTitle : 'Select Department'}
            </Text>
            {selectedDeptId || selectedDeptTitle ? (
              <TouchableOpacity
                onPress={() => handleSelectDepartment(undefined)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-circle" size={18} color={Colors.secondaryFontColor} />
              </TouchableOpacity>
            ) : (
              <Ionicons name="chevron-down" size={18} color={Colors.secondaryFontColor} />
            )}
          </TouchableOpacity>
        )}
      </View>

      {isDoctorsLoading && doctorsList.length === 0 ? (
        <LoadingIndicator />
      ) : isError ? (
        <ErrorState message="Couldn't load doctors" onRetry={refetch} />
      ) : (
        <FlatList
          data={doctorsList}
          keyExtractor={(item: DoctorModel, index: number) =>
            `doc-${item.user_id ?? item.id ?? index}`
          }
          contentContainerStyle={[styles.listContent, { paddingBottom: hs(80) + Math.max(insets.bottom, hs(24)) }]}
          refreshing={isFetching}
          onRefresh={refetch}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              message={
                selectedDeptTitle
                  ? `No doctors available in ${selectedDeptTitle}`
                  : 'No doctors found matching your search'
              }
            />
          }
          renderItem={({ item }: { item: DoctorModel }) => (
            <DoctorCard
              doctor={item}
              variant="list"
              onPress={() =>
                navigation.navigate('DoctorDetails', {
                  doctId: String(item.user_id || item.id),
                })
              }
              onBookPress={() => handleBookDoctor(item)}
            />
          )}
        />
      )}

      {/* Department Picker Modal */}
      <DepartmentSelectModal
        visible={isDeptModalVisible}
        onClose={() => setIsDeptModalVisible(false)}
        departments={departments}
        selectedDeptId={selectedDeptId}
        selectedDeptTitle={selectedDeptTitle}
        onSelectDepartment={handleSelectDepartment}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgColor,
  },
  searchWrapper: {
    paddingHorizontal: ws(16),
    paddingTop: hs(12),
    paddingBottom: hs(10),
    backgroundColor: Colors.bgColor,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderColor,
    zIndex: 1,
  },
  deptSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: fs(10),
    paddingHorizontal: ws(12),
    paddingVertical: hs(10),
    borderWidth: 1,
    borderColor: Colors.borderColor,
    marginTop: hs(8),
    marginBottom: hs(4),
  },
  deptSelectorText: {
    flex: 1,
    marginLeft: ws(8),
    fontSize: fs(13),
    ...TYPOGRAPHY.medium,
    color: Colors.primaryFontColor,
  },
  deptSelectorPlaceholder: {
    color: Colors.secondaryFontColor,
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: ws(16),
    paddingTop: hs(12),
    paddingBottom: hs(32),
  },
});
