import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { memo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppButton } from '../../../components';
import { Colors } from '../../../constants';
import { fs, hs, TYPOGRAPHY, ws } from '../../../utils';

interface AppointmentActionsCardProps {
  isVideoCall: boolean;
  meetingLink?: string;
  status?: string;
  canReview: boolean;
  canReschedule?: boolean;
  onReschedule?: () => void;
  onJoinCall: () => void;
  onOpenQr: () => void;
  onOpenInvoice: () => void;
  onOpenPrescriptions: () => void;
  onOpenPatientFiles: () => void;
  onOpenReview: () => void;
}

export const AppointmentActionsCard = memo(({
  isVideoCall,
  meetingLink,
  status,
  canReview,
  canReschedule,
  onReschedule,
  onJoinCall,
  onOpenQr,
  onOpenInvoice,
  onOpenPrescriptions,
  onOpenPatientFiles,
  onOpenReview,
}: AppointmentActionsCardProps) => {
  return (
    <>
      {/* Video Call Banner */}
      {isVideoCall && status === 'Confirmed' && !!meetingLink && (
        <View style={styles.videoBanner}>
          <View style={styles.videoBannerInfo}>
            <MaterialIcons name="videocam" size={24} color={Colors.white} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.videoBannerTitle}>Video Consultation Ready</Text>
              <Text style={styles.videoBannerSub}>Tap to join doctor on video consultation</Text>
            </View>
          </View>
          <AppButton title="Join Video Consultation" onPress={onJoinCall} style={styles.videoBannerBtn} />
        </View>
      )}

      {/* Queue Arrival & QR Code Card */}
      <TouchableOpacity style={styles.actionCard} activeOpacity={0.85} onPress={onOpenQr}>
        <View style={styles.actionIconCircle}>
          <MaterialIcons name="qr-code-2" size={22} color={Colors.primaryColor} />
        </View>
        <View style={styles.actionMeta}>
          <Text style={styles.actionTitle}>Clinic Queue QR Code</Text>
          <Text style={styles.actionSubtitle}>Scan QR code at clinic for queue number generation</Text>
        </View>
        <MaterialIcons name="chevron-right" size={22} color={Colors.primaryColor} />
      </TouchableOpacity>

      {/* Invoice Action Card */}
      <TouchableOpacity style={styles.actionCard} activeOpacity={0.85} onPress={onOpenInvoice}>
        <View style={styles.actionIconCircle}>
          <MaterialIcons name="receipt-long" size={22} color={Colors.primaryColor} />
        </View>
        <View style={styles.actionMeta}>
          <Text style={styles.actionTitle}>Invoice & Payment Receipt</Text>
          <Text style={styles.actionSubtitle}>View, download, or share invoice PDF</Text>
        </View>
        <MaterialIcons name="chevron-right" size={22} color={Colors.primaryColor} />
      </TouchableOpacity>

      {/* Prescription Vault Quick Card */}
      <TouchableOpacity style={styles.actionCard} activeOpacity={0.85} onPress={onOpenPrescriptions}>
        <View style={styles.actionIconCircle}>
          <MaterialIcons name="description" size={22} color={Colors.primaryColor} />
        </View>
        <View style={styles.actionMeta}>
          <Text style={styles.actionTitle}>Issued Digital Prescriptions</Text>
          <Text style={styles.actionSubtitle}>View prescriptions for this appointment</Text>
        </View>
        <MaterialIcons name="chevron-right" size={22} color={Colors.primaryColor} />
      </TouchableOpacity>

      {/* Medical Files & Reports Quick Card */}
      <TouchableOpacity style={styles.actionCard} activeOpacity={0.85} onPress={onOpenPatientFiles}>
        <View style={styles.actionIconCircle}>
          <MaterialIcons name="folder-open" size={22} color={Colors.primaryColor} />
        </View>
        <View style={styles.actionMeta}>
          <Text style={styles.actionTitle}>Patient Files & Medical History</Text>
          <Text style={styles.actionSubtitle}>Uploaded diagnostic reports & records</Text>
        </View>
        <MaterialIcons name="chevron-right" size={22} color={Colors.primaryColor} />
      </TouchableOpacity>

      {/* Reschedule Consultation Action Card */}
      {canReschedule && !!onReschedule && (
        <TouchableOpacity style={styles.actionCard} activeOpacity={0.85} onPress={onReschedule}>
          <View style={[styles.actionIconCircle, { backgroundColor: Colors.orange_FFEDD5 }]}>
            <MaterialIcons name="sync" size={22} color={Colors.orange_EA580C} />
          </View>
          <View style={styles.actionMeta}>
            <Text style={styles.actionTitle}>Reschedule Consultation</Text>
            <Text style={styles.actionSubtitle}>Change consultation date, time slot, or mode</Text>
          </View>
          <MaterialIcons name="chevron-right" size={22} color={Colors.orange_EA580C} />
        </TouchableOpacity>
      )}

      {/* Review Trigger Card */}
      {canReview && (
        <TouchableOpacity style={styles.reviewCard} activeOpacity={0.85} onPress={onOpenReview}>
          <View style={styles.reviewIconCircle}>
            <MaterialIcons name="star-outline" size={22} color={Colors.primaryColor} />
          </View>
          <View style={styles.reviewMeta}>
            <Text style={styles.reviewTitle}>Rate & Review Doctor</Text>
            <Text style={styles.reviewSubtitle}>Share your feedback to help others</Text>
          </View>
          <MaterialIcons name="chevron-right" size={22} color={Colors.primaryColor} />
        </TouchableOpacity>
      )}
    </>
  );
});

const styles = StyleSheet.create({
  videoBanner: {
    backgroundColor: Colors.primaryColor,
    borderRadius: fs(16),
    padding: ws(16),
    marginBottom: hs(12),
  },
  videoBannerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hs(12),
  },
  videoBannerTitle: {
    fontSize: fs(15),
    ...TYPOGRAPHY.bold,
    color: Colors.white,
  },
  videoBannerSub: {
    fontSize: fs(12),
    ...TYPOGRAPHY.regular,
    color: 'rgba(255,255,255,0.85)',
    marginTop: hs(2),
  },
  videoBannerBtn: {
    backgroundColor: Colors.white,
    borderRadius: fs(10),
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: fs(16),
    padding: ws(14),
    marginBottom: hs(12),
    borderWidth: 1,
    borderColor: Colors.borderColor,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: hs(2) },
    shadowOpacity: 0.04,
    shadowRadius: fs(4),
    elevation: 2,
  },
  actionIconCircle: {
    width: ws(42),
    height: ws(42),
    aspectRatio: 1,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: Colors.lightBlueTint,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: ws(12),
  },
  actionMeta: {
    flex: 1,
  },
  actionTitle: {
    fontSize: fs(13),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
  },
  actionSubtitle: {
    fontSize: fs(11),
    ...TYPOGRAPHY.regular,
    color: Colors.secondaryFontColor,
    marginTop: hs(2),
  },
  reviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: fs(16),
    padding: ws(14),
    marginBottom: hs(12),
    borderWidth: 1,
    borderColor: Colors.lightBlueBorder,
  },
  reviewIconCircle: {
    width: ws(42),
    height: ws(42),
    aspectRatio: 1,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: Colors.lightBlueTint,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: ws(12),
  },
  reviewMeta: {
    flex: 1,
  },
  reviewTitle: {
    fontSize: fs(13),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
  },
  reviewSubtitle: {
    marginTop: hs(2),
    fontSize: fs(11),
    ...TYPOGRAPHY.regular,
    color: Colors.secondaryFontColor,
  },
});
