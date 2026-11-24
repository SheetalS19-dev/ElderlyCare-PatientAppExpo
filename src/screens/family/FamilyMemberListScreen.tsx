import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useCallback } from 'react';
import {
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AppHeader,
  EmptyState,
  ErrorState,
  LoadingIndicator,
} from '../../components';
import { Colors } from '../../constants';
import { hs, ws } from '../../utils';
import {
  AddEditFamilyMemberModal,
  FamilyMemberCard,
  FamilyMemberHeaderBanner,
} from './components';
import { useFamilyMemberList } from './useFamilyMemberList';

export const FamilyMemberListScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const {
    navigation,
    familyList,
    isLoading,
    isError,
    refetch,
    showModal,
    setShowModal,
    editingId,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    phone,
    setPhone,
    gender,
    setGender,
    dob,
    setDob,
    relation,
    setRelation,
    errors,
    clearError,
    isSubmitting,
    countryCode,
    openAddModal,
    openEditModal,
    handleSave,
    handleDelete,
  } = useFamilyMemberList();

  const keyExtractor = useCallback((item: any, index: number) => `fam-${item.id ?? index}`, []);

  const renderMemberItem = useCallback(
    ({ item }: { item: any }) => (
      <FamilyMemberCard
        item={item}
        onEdit={openEditModal}
        onDelete={handleDelete}
      />
    ),
    [openEditModal, handleDelete]
  );

  return (
    <View style={styles.container}>
      <AppHeader title="Family Members" onBackPress={() => navigation.goBack()} />

      {isLoading ? (
        <LoadingIndicator />
      ) : isError ? (
        <ErrorState message="Couldn't load family members" onRetry={refetch} />
      ) : (
        <FlatList
          data={familyList}
          keyExtractor={keyExtractor}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: hs(140) + Math.max(insets.bottom, hs(24)) },
          ]}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            familyList.length > 0 ? (
              <FamilyMemberHeaderBanner memberCount={familyList.length} />
            ) : null
          }
          ListEmptyComponent={
            <EmptyState message="No family members found. Tap + to add one." />
          }
          renderItem={renderMemberItem}
        />
      )}

      {/* FAB Add Button */}
      <TouchableOpacity
        style={[styles.fab, { bottom: hs(24) + Math.max(insets.bottom, hs(16)) }]}
        activeOpacity={0.85}
        onPress={openAddModal}
      >
        <MaterialIcons name="add" size={28} color={Colors.white} />
      </TouchableOpacity>

      {/* Add / Edit Family Member Modal */}
      <AddEditFamilyMemberModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        editingId={editingId}
        firstName={firstName}
        setFirstName={setFirstName}
        lastName={lastName}
        setLastName={setLastName}
        phone={phone}
        setPhone={setPhone}
        dob={dob}
        setDob={setDob}
        gender={gender}
        setGender={setGender}
        relation={relation}
        setRelation={setRelation}
        countryCode={countryCode}
        errors={errors}
        clearError={clearError}
        onSave={handleSave}
        isSubmitting={isSubmitting}
        existingMembers={familyList}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgColor },
  listContent: { flexGrow: 1, padding: ws(16) },
  fab: {
    position: 'absolute',
    right: ws(20),
    bottom: hs(24),
    width: ws(56),
    height: ws(56),
    borderRadius: 999,
    backgroundColor: Colors.primaryColor,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
});
