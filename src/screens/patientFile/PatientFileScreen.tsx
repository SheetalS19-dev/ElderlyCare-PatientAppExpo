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
  EmptyState,
  ErrorState,
  LoadingIndicator,
} from '../../components';
import { Colors } from '../../constants';
import {
  fs,
  hs,
  TYPOGRAPHY,
  ws,
} from '../../utils';
import {
  PatientFileCard,
  PatientFileHeaderFilter,
  UploadPatientFileModal,
} from './components';
import { usePatientFile } from './usePatientFile';

export const PatientFileScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const {
    navigation,
    search,
    setSearch,
    selectedMemberId,
    setSelectedMemberId,
    showMemberDropdown,
    setShowMemberDropdown,
    downloadingId,
    familyList,
    selectedMemberDisplayName,
    files,
    isLoading,
    isError,
    refetch,
    handleDownload,
    handleOpenFile,
    formatPatientName,
    formatFileDate,
    openUploadSheet,
    closeUploadSheet,
    uploadVisible,
    uploadTitle,
    setUploadTitle,
    titleError,
    setTitleError,
    fileError,
    setFileError,
    uploadMemberId,
    setUploadMemberId,
    showUploadMembers,
    setShowUploadMembers,
    uploadMemberName,
    pickedFile,
    setPickedFile,
    uploadError,
    setUploadError,
    isUploading,
    handleUpload,
    pickFromGallery,
    pickFromCamera,
    pickDocument,
    hasDocumentPicker,
    getMemberDisplayName,
    getMemberRelationLabel,
  } = usePatientFile();

  return (
    <View style={styles.container}>
      <AppHeader title="Patient Files" onBackPress={() => navigation.goBack()} />

      {/* Top Filter & Search Section */}
      <PatientFileHeaderFilter
        search={search}
        onChangeSearch={setSearch}
        selectedMemberDisplayName={selectedMemberDisplayName}
        selectedMemberId={selectedMemberId}
        onSelectMemberId={setSelectedMemberId}
        showMemberDropdown={showMemberDropdown}
        onToggleMemberDropdown={() => setShowMemberDropdown((p) => !p)}
        onCloseMemberDropdown={() => setShowMemberDropdown(false)}
        familyList={familyList}
        getMemberDisplayName={getMemberDisplayName}
        getMemberRelationLabel={getMemberRelationLabel}
        onUploadPress={openUploadSheet}
      />

      {isLoading ? (
        <LoadingIndicator />
      ) : isError ? (
        <ErrorState message="Couldn't load medical files" onRetry={refetch} />
      ) : (
        <FlatList
          data={files}
          keyExtractor={(item, index) => `pf-${item.id ?? index}`}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: hs(40) + Math.max(insets.bottom, hs(24)) },
          ]}
          ListEmptyComponent={
            search.trim() ? (
              <View style={styles.emptySearchContainer}>
                <View style={styles.emptySearchIconBox}>
                  <MaterialIcons name="search-off" size={fs(36)} color={Colors.primaryColor} />
                </View>
                <Text style={styles.emptySearchTitle}>No matching files found</Text>
                <Text style={styles.emptySearchSubtitle}>
                  We couldn't find any medical files matching "{search.trim()}".
                </Text>
                <TouchableOpacity
                  style={styles.clearSearchBtn}
                  activeOpacity={0.8}
                  onPress={() => setSearch('')}
                >
                  <Text style={styles.clearSearchBtnText}>Clear Search</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <EmptyState message="No files have been uploaded yet." />
            )
          }
          renderItem={({ item }) => (
            <PatientFileCard
              item={item}
              patientInfo={formatPatientName(item)}
              dateStr={formatFileDate(item)}
              isDownloading={downloadingId === (item.id ?? (item as any).title)}
              onOpen={() => handleOpenFile(item)}
              onDownload={() => handleDownload(item)}
            />
          )}
        />
      )}

      {/* Upload File Modal */}
      <UploadPatientFileModal
        visible={uploadVisible}
        onClose={closeUploadSheet}
        uploadMemberName={uploadMemberName}
        uploadMemberId={uploadMemberId}
        onSelectMemberId={(id) => {
          setUploadMemberId(id);
          setShowUploadMembers(false);
        }}
        showUploadMembers={showUploadMembers}
        onToggleUploadMembers={() => setShowUploadMembers((p) => !p)}
        familyList={familyList}
        getMemberDisplayName={getMemberDisplayName}
        getMemberRelationLabel={getMemberRelationLabel}
        uploadTitle={uploadTitle}
        onChangeUploadTitle={(t) => {
          setUploadTitle(t);
          setTitleError('');
          setUploadError('');
        }}
        pickedFile={pickedFile}
        onClearPickedFile={() => {
          setPickedFile(null);
          setFileError('');
          setUploadError('');
        }}
        onPickFromCamera={pickFromCamera}
        onPickFromGallery={pickFromGallery}
        onPickDocument={pickDocument}
        hasDocumentPicker={hasDocumentPicker}
        uploadError={uploadError}
        titleError={titleError}
        fileError={fileError}
        isUploading={isUploading}
        onUpload={handleUpload}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgColor,
  },
  listContent: {
    padding: ws(16),
  },
  emptySearchContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hs(40),
    paddingHorizontal: ws(24),
  },
  emptySearchIconBox: {
    width: ws(72),
    height: ws(72),
    borderRadius: ws(36),
    backgroundColor: Colors.aquaSoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hs(14),
  },
  emptySearchTitle: {
    ...TYPOGRAPHY.bold,
    fontSize: fs(16),
    color: Colors.primaryFontColor,
    marginBottom: hs(6),
    textAlign: 'center',
  },
  emptySearchSubtitle: {
    ...TYPOGRAPHY.regular,
    fontSize: fs(13),
    color: Colors.secondaryFontColor,
    textAlign: 'center',
    lineHeight: fs(18),
    marginBottom: hs(16),
  },
  clearSearchBtn: {
    backgroundColor: Colors.aquaSoft,
    paddingHorizontal: ws(16),
    paddingVertical: hs(8),
    borderRadius: ws(8),
  },
  clearSearchBtnText: {
    ...TYPOGRAPHY.bold,
    fontSize: fs(12),
    color: Colors.primaryColor,
  },
});
