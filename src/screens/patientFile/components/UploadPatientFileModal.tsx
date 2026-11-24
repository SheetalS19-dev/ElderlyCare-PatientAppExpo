import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../../constants';
import type { FamilyMemberModel } from '../../../types';
import { fs, hs, TYPOGRAPHY, ws } from '../../../utils';
import { FIELD_LIMITS } from '../../../validation';

export type PickedFile = { uri: string; name: string; mimeType: string; size?: number };

interface Props {
  visible: boolean;
  onClose: () => void;
  uploadMemberName: string;
  uploadMemberId: string;
  onSelectMemberId: (id: string) => void;
  showUploadMembers: boolean;
  onToggleUploadMembers: () => void;
  familyList: FamilyMemberModel[];
  getMemberDisplayName: (m: FamilyMemberModel) => string;
  getMemberRelationLabel: (m: FamilyMemberModel) => string;
  uploadTitle: string;
  onChangeUploadTitle: (text: string) => void;
  pickedFile: PickedFile | null;
  onClearPickedFile: () => void;
  onPickFromCamera: () => void;
  onPickFromGallery: () => void;
  onPickDocument?: () => void;
  hasDocumentPicker: boolean;
  uploadError: string;
  titleError?: string;
  fileError?: string;
  isUploading: boolean;
  onUpload: () => void;
}

export const UploadPatientFileModal: React.FC<Props> = React.memo(({
  visible,
  onClose,
  uploadMemberName,
  uploadMemberId,
  onSelectMemberId,
  showUploadMembers,
  onToggleUploadMembers,
  familyList,
  getMemberDisplayName,
  getMemberRelationLabel,
  uploadTitle,
  onChangeUploadTitle,
  pickedFile,
  onClearPickedFile,
  onPickFromCamera,
  onPickFromGallery,
  onPickDocument,
  hasDocumentPicker,
  uploadError,
  titleError,
  fileError,
  isUploading,
  onUpload,
}) => {
  const insets = useSafeAreaInsets();
  const titleInputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (pickedFile) {
      titleInputRef.current?.blur();
      Keyboard.dismiss();
      const t = setTimeout(() => {
        titleInputRef.current?.blur();
        Keyboard.dismiss();
      }, 100);
      return () => clearTimeout(t);
    }
  }, [pickedFile]);

  const handleClose = () => {
    titleInputRef.current?.blur();
    Keyboard.dismiss();
    onClose();
  };

  const handlePickCamera = () => {
    titleInputRef.current?.blur();
    Keyboard.dismiss();
    onPickFromCamera();
  };

  const handlePickGallery = () => {
    titleInputRef.current?.blur();
    Keyboard.dismiss();
    onPickFromGallery();
  };

  const handlePickDoc = () => {
    titleInputRef.current?.blur();
    Keyboard.dismiss();
    onPickDocument?.();
  };

  const handleUploadPress = () => {
    titleInputRef.current?.blur();
    Keyboard.dismiss();
    onUpload();
  };

  const isTitleErr = Boolean(
    titleError ||
    (uploadError && (/file title/i.test(uploadError) || /enter.*title/i.test(uploadError)))
  );
  const titleErrMessage = titleError || (isTitleErr ? uploadError : '');

  const isFileErr = Boolean(
    fileError ||
    (uploadError && (/choose a file/i.test(uploadError) || /file type/i.test(uploadError) || /file size/i.test(uploadError)))
  );
  const fileErrMessage = fileError || (isFileErr ? uploadError : '');

  const isGeneralErr = Boolean(
    uploadError && !isTitleErr && !isFileErr
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
      onDismiss={() => Keyboard.dismiss()}
    >
      <KeyboardAvoidingView
        style={styles.sheetBackdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={handleClose} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom + hs(16), hs(24)) }]}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Upload File</Text>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <MaterialIcons name="close" size={ws(22)} color={Colors.primaryFontColor} />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={{ flexGrow: 1, paddingBottom: hs(24) }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.sheetLabel}>Patient <Text style={styles.asterisk}>*</Text></Text>
            <TouchableOpacity
              style={styles.sheetField}
              activeOpacity={0.85}
              onPress={onToggleUploadMembers}
            >
              <Text style={styles.sheetFieldText} numberOfLines={1}>{uploadMemberName}</Text>
              <MaterialIcons
                name={showUploadMembers ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                size={ws(20)}
                color={Colors.primaryColor}
              />
            </TouchableOpacity>

            {showUploadMembers && (
              <View style={styles.sheetMemberList}>
                <ScrollView nestedScrollEnabled bounces={false} style={{ maxHeight: hs(160) }}>
                  {familyList.map((mem) => {
                    const active = String(mem.id) === String(uploadMemberId);
                    const relation = getMemberRelationLabel(mem);
                    return (
                      <TouchableOpacity
                        key={`up-mem-${mem.id}`}
                        style={[styles.memberDropdownMenuItem, active && styles.memberDropdownMenuItemActive]}
                        onPress={() => onSelectMemberId(String(mem.id))}
                      >
                        <View style={styles.menuItemTextRow}>
                          <Text
                            style={[
                              styles.memberDropdownMenuItemText,
                              active && styles.memberDropdownMenuItemTextActive,
                            ]}
                            numberOfLines={1}
                          >
                            {getMemberDisplayName(mem)}
                          </Text>
                          {!!relation &&
                            relation.toLowerCase() !== 'family member' &&
                            relation.toLowerCase() !== 'patient' &&
                            relation.toLowerCase() !== 'self' && (
                              <View style={[styles.relationBadgeSmall, active && styles.relationBadgeSmallActive]}>
                                <Text
                                  style={[
                                    styles.relationBadgeSmallText,
                                    active && styles.relationBadgeSmallTextActive,
                                  ]}
                                >
                                  {relation}
                                </Text>
                              </View>
                            )}
                        </View>
                        {active && <MaterialIcons name="check" size={ws(18)} color={Colors.white} />}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            <Text style={styles.sheetLabel}>File Title <Text style={styles.asterisk}>*</Text></Text>
            <TextInput
              ref={titleInputRef}
              style={[styles.sheetInput, Boolean(titleErrMessage) && styles.sheetInputError]}
              value={uploadTitle}
              onChangeText={onChangeUploadTitle}
              placeholder="Enter file title (e.g. Blood Test Report)"
              placeholderTextColor={Colors.slate_94A3B8}
              maxLength={FIELD_LIMITS.FILE_TITLE_MAX}
              blurOnSubmit={true}
              returnKeyType="done"
              onSubmitEditing={() => {
                titleInputRef.current?.blur();
                Keyboard.dismiss();
              }}
            />
            {!!titleErrMessage && <Text style={styles.fieldErrorText}>{titleErrMessage}</Text>}

            <Text style={styles.sheetLabel}>
              Select File (max 5 MB) <Text style={styles.asterisk}>*</Text>
            </Text>
            {pickedFile ? (
              <View style={styles.pickedFileRow}>
                <MaterialIcons
                  name={pickedFile.mimeType.startsWith('image') ? 'image' : 'insert-drive-file'}
                  size={ws(22)}
                  color={Colors.primaryColor}
                />
                <View style={{ flex: 1, marginRight: ws(8) }}>
                  <Text style={styles.pickedFileName} numberOfLines={1}>{pickedFile.name}</Text>
                  {!!pickedFile.size && (
                    <Text
                      style={{
                        fontSize: fs(10),
                        color:
                          pickedFile.size > 5 * 1024 * 1024
                            ? Colors.redColor
                            : Colors.secondaryFontColor,
                      }}
                    >
                      {(pickedFile.size / (1024 * 1024)).toFixed(2)} MB / Max 5 MB
                    </Text>
                  )}
                </View>
                <TouchableOpacity onPress={onClearPickedFile} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <MaterialIcons name="cancel" size={ws(20)} color={Colors.slate_94A3B8} />
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View style={styles.pickRow}>
                  <TouchableOpacity style={styles.pickOption} onPress={handlePickCamera} activeOpacity={0.85}>
                    <MaterialIcons name="photo-camera" size={ws(22)} color={Colors.primaryColor} />
                    <Text style={styles.pickOptionText}>Camera</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.pickOption} onPress={handlePickGallery} activeOpacity={0.85}>
                    <MaterialIcons name="photo-library" size={ws(22)} color={Colors.primaryColor} />
                    <Text style={styles.pickOptionText}>Gallery</Text>
                  </TouchableOpacity>
                  {hasDocumentPicker && onPickDocument && (
                    <TouchableOpacity style={styles.pickOption} onPress={handlePickDoc} activeOpacity={0.85}>
                      <MaterialIcons name="description" size={ws(22)} color={Colors.primaryColor} />
                      <Text style={styles.pickOptionText}>Document</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}
            {!!fileErrMessage && <Text style={styles.fieldErrorText}>{fileErrMessage}</Text>}

            {!!isGeneralErr && <Text style={styles.uploadErrorText}>{uploadError}</Text>}

            <View style={styles.sheetActions}>
              <TouchableOpacity
                style={styles.sheetCancelBtn}
                onPress={handleClose}
                disabled={isUploading}
                activeOpacity={0.85}
              >
                <Text style={styles.sheetCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sheetSubmitBtn, isUploading && { opacity: 0.7 }]}
                onPress={handleUploadPress}
                disabled={isUploading}
                activeOpacity={0.85}
              >
                {isUploading ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <Text style={styles.sheetSubmitText}>Upload</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
});

const styles = StyleSheet.create({
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: ws(24),
    borderTopRightRadius: ws(24),
    paddingHorizontal: ws(20),
    paddingTop: hs(14),
    maxHeight: '90%',
  },
  sheetHandle: {
    width: ws(40),
    height: hs(4),
    backgroundColor: Colors.border,
    borderRadius: ws(2),
    alignSelf: 'center',
    marginBottom: hs(12),
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hs(16),
  },
  sheetTitle: {
    ...TYPOGRAPHY.bold,
    fontSize: fs(18),
    color: Colors.primaryFontColor,
  },
  sheetLabel: {
    ...TYPOGRAPHY.semiBold,
    fontSize: fs(13),
    color: Colors.primaryFontColor,
    marginBottom: hs(6),
    marginTop: hs(10),
  },
  asterisk: {
    color: Colors.redColor,
  },
  sheetField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.inputTextBgColor,
    borderRadius: ws(12),
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: ws(14),
    height: hs(46),
  },
  sheetFieldText: {
    ...TYPOGRAPHY.medium,
    fontSize: fs(13.5),
    color: Colors.primaryFontColor,
    flex: 1,
  },
  sheetMemberList: {
    backgroundColor: Colors.white,
    borderRadius: ws(12),
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: hs(4),
    padding: ws(6),
    elevation: 4,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  memberDropdownMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: hs(10),
    paddingHorizontal: ws(10),
    borderRadius: ws(8),
    marginBottom: hs(2),
  },
  memberDropdownMenuItemActive: {
    backgroundColor: Colors.primaryColor,
  },
  memberDropdownMenuItemText: {
    ...TYPOGRAPHY.medium,
    fontSize: fs(13),
    color: Colors.primaryFontColor,
  },
  memberDropdownMenuItemTextActive: {
    ...TYPOGRAPHY.bold,
    color: Colors.white,
  },
  menuItemTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(8),
    flex: 1,
  },
  relationBadgeSmall: {
    paddingHorizontal: ws(6),
    paddingVertical: hs(2),
    borderRadius: ws(6),
    backgroundColor: Colors.aquaSoft,
  },
  relationBadgeSmallActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  relationBadgeSmallText: {
    ...TYPOGRAPHY.semiBold,
    fontSize: fs(10),
    color: Colors.primaryColor,
  },
  relationBadgeSmallTextActive: {
    color: Colors.white,
  },
  sheetInput: {
    backgroundColor: Colors.inputTextBgColor,
    borderRadius: ws(12),
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: ws(14),
    height: hs(46),
    ...TYPOGRAPHY.medium,
    fontSize: fs(13.5),
    color: Colors.primaryFontColor,
  },
  pickedFileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.aquaSoft,
    borderRadius: ws(12),
    paddingHorizontal: ws(12),
    paddingVertical: hs(10),
    gap: ws(8),
  },
  pickedFileName: {
    ...TYPOGRAPHY.semiBold,
    fontSize: fs(13),
    color: Colors.primaryFontColor,
  },
  pickRow: {
    flexDirection: 'row',
    gap: ws(10),
    marginTop: hs(4),
  },
  pickOption: {
    flex: 1,
    backgroundColor: Colors.inputTextBgColor,
    borderRadius: ws(12),
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: hs(14),
    alignItems: 'center',
    justifyContent: 'center',
    gap: hs(4),
  },
  pickOptionText: {
    ...TYPOGRAPHY.medium,
    fontSize: fs(12),
    color: Colors.primaryFontColor,
  },
  sheetInputError: {
    borderColor: Colors.redColor,
  },
  fileHintText: {
    ...TYPOGRAPHY.regular,
    fontSize: fs(11),
    color: Colors.secondaryFontColor,
    marginTop: hs(6),
    marginLeft: ws(2),
  },
  fieldErrorText: {
    ...TYPOGRAPHY.regular,
    fontSize: fs(12),
    color: Colors.redColor,
    marginTop: hs(6),
    marginLeft: ws(2),
  },
  uploadErrorText: {
    ...TYPOGRAPHY.regular,
    fontSize: fs(12),
    color: Colors.redColor,
    marginTop: hs(8),
    marginLeft: ws(2),
  },
  sheetActions: {
    flexDirection: 'row',
    gap: ws(12),
    marginTop: hs(20),
  },
  sheetCancelBtn: {
    flex: 1,
    height: hs(46),
    borderRadius: ws(12),
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.inputTextBgColor,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetCancelText: {
    ...TYPOGRAPHY.semiBold,
    fontSize: fs(14),
    color: Colors.secondaryFontColor,
  },
  sheetSubmitBtn: {
    flex: 1,
    height: hs(46),
    borderRadius: ws(12),
    backgroundColor: Colors.primaryColor,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetSubmitText: {
    ...TYPOGRAPHY.bold,
    fontSize: fs(14),
    color: Colors.white,
  },
});
