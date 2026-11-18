import Ionicons from '@expo/vector-icons/Ionicons';
import React, { memo } from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppCard } from '../../../components';
import { Colors } from '../../../constants';
import type { AppointmentModel } from '../../../types';
import { fs, hs, showToast, TYPOGRAPHY, ws } from '../../../utils';

interface AppointmentContactCardProps {
  appointment: AppointmentModel;
  doctorData?: any;
}

export const AppointmentContactCard = memo(({ appointment, doctorData }: AppointmentContactCardProps) => {
  const docPhone =
    (appointment as any).doct_phone ||
    (appointment as any).doct_mobile ||
    (appointment as any).doctor_phone ||
    (appointment as any).phone ||
    doctorData?.phone ||
    doctorData?.mobile ||
    '';

  const docWhatsapp =
    (appointment as any).doct_whatsapp ||
    (appointment as any).doctor_whatsapp ||
    (appointment as any).whatsapp ||
    (appointment as any).clinic_whatsapp ||
    doctorData?.whatsapp ||
    doctorData?.clinic_whatsapp ||
    '';

  const docEmail =
    (appointment as any).doct_email ||
    (appointment as any).doctor_email ||
    (appointment as any).email ||
    doctorData?.email ||
    '';

  const clinicName =
    appointment.clinic_title ||
    (appointment as any).clinic_name ||
    (appointment as any).clinicName ||
    doctorData?.clinic_title ||
    doctorData?.clinic_name ||
    '';

  const rawAddress =
    (appointment as any).clinic_address ||
    (appointment as any).clinics_address ||
    doctorData?.clinic_address ||
    doctorData?.address ||
    '';

  const clinicAddr =
    clinicName && rawAddress && !rawAddress.toLowerCase().includes(clinicName.toLowerCase())
      ? `${clinicName}, ${rawAddress}`
      : rawAddress || clinicName;

  if (!docPhone && !docWhatsapp && !docEmail && !clinicAddr) {
    return null;
  }

  return (
    <AppCard style={styles.contactUsCard}>
      <Text style={styles.contactUsTitle}>Contact Us</Text>

      {/* Phone Row */}
      {!!docPhone && (
        <TouchableOpacity
          style={styles.contactRow}
          activeOpacity={0.75}
          onPress={() => {
            Linking.openURL(`tel:${docPhone}`).catch(() => showToast('Could not initiate call'));
          }}
        >
          <View style={[styles.contactIconCircle, { backgroundColor: Colors.aquaSoft }]}>
            <Ionicons name="call" size={fs(18)} color={Colors.primaryColor} />
          </View>
          <View style={styles.contactTextGroup}>
            <Text style={styles.contactLabel}>Phone</Text>
            <Text style={styles.contactValue}>{docPhone}</Text>
          </View>
          <View style={[styles.actionPillBtn, { backgroundColor: Colors.aquaSoft }]}>
            <Ionicons name="call" size={fs(12)} color={Colors.primaryColor} />
            <Text style={[styles.actionPillBtnText, { color: Colors.primaryColor }]}>Call</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* WhatsApp Row */}
      {!!docWhatsapp && (
        <TouchableOpacity
          style={styles.contactRow}
          activeOpacity={0.75}
          onPress={() => {
            const cleanWa = docWhatsapp.replace(/[^0-9]/g, '');
            Linking.openURL(`https://wa.me/${cleanWa}?text=Hello`).catch(() => showToast('Could not open WhatsApp'));
          }}
        >
          <View style={[styles.contactIconCircle, { backgroundColor: Colors.green_ECFDF5 }]}>
            <Ionicons name="logo-whatsapp" size={fs(18)} color={Colors.green_10B981} />
          </View>
          <View style={styles.contactTextGroup}>
            <Text style={styles.contactLabel}>WhatsApp</Text>
            <Text style={styles.contactValue}>Chat with us</Text>
          </View>
          <View style={[styles.actionPillBtn, { backgroundColor: Colors.green_ECFDF5 }]}>
            <Ionicons name="logo-whatsapp" size={fs(12)} color={Colors.green_10B981} />
            <Text style={[styles.actionPillBtnText, { color: Colors.green_10B981 }]}>Chat</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Email Row */}
      {!!docEmail && (
        <TouchableOpacity
          style={styles.contactRow}
          activeOpacity={0.75}
          onPress={() => {
            Linking.openURL(`mailto:${docEmail}`).catch(() => showToast('Could not open mail app'));
          }}
        >
          <View style={[styles.contactIconCircle, { backgroundColor: Colors.aquaSoft }]}>
            <Ionicons name="mail" size={fs(18)} color={Colors.primaryColor} />
          </View>
          <View style={styles.contactTextGroup}>
            <Text style={styles.contactLabel}>Email</Text>
            <Text style={styles.contactValue}>{docEmail}</Text>
          </View>
          <View style={[styles.actionPillBtn, { backgroundColor: Colors.aquaSoft }]}>
            <Ionicons name="mail" size={fs(12)} color={Colors.primaryColor} />
            <Text style={[styles.actionPillBtnText, { color: Colors.primaryColor }]}>Email</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Clinic Address Row */}
      {!!clinicAddr && (
        <TouchableOpacity
          style={[styles.contactRow, { marginBottom: 0 }]}
          activeOpacity={0.75}
          onPress={() => {
            Linking.openURL(`http://maps.google.com/maps?q=${encodeURIComponent(clinicAddr)}`).catch(() => showToast('Could not open map'));
          }}
        >
          <View style={[styles.contactIconCircle, { backgroundColor: Colors.purple_F3E8FF }]}>
            <Ionicons name="navigate" size={fs(18)} color={Colors.purple_9333EA} />
          </View>
          <View style={styles.contactTextGroup}>
            <Text style={styles.contactLabel}>Clinic Address</Text>
            <Text style={styles.contactValue} numberOfLines={3}>{clinicAddr}</Text>
          </View>
          <View style={[styles.actionPillBtn, { backgroundColor: Colors.purple_F3E8FF }]}>
            <Ionicons name="navigate" size={fs(12)} color={Colors.purple_9333EA} />
            <Text style={[styles.actionPillBtnText, { color: Colors.purple_9333EA }]}>Directions</Text>
          </View>
        </TouchableOpacity>
      )}
    </AppCard>
  );
});

const styles = StyleSheet.create({
  contactUsCard: {
    padding: ws(16),
    marginBottom: hs(14),
    backgroundColor: Colors.white,
    borderRadius: fs(16),
    borderWidth: 1,
    borderColor: Colors.slate_E2E8F0,
  },
  contactUsTitle: {
    fontSize: fs(14),
    ...TYPOGRAPHY.bold,
    color: Colors.ink,
    marginBottom: hs(12),
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hs(12),
  },
  contactIconCircle: {
    width: ws(36),
    height: ws(36),
    borderRadius: fs(18),
    backgroundColor: Colors.aquaSoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: ws(10),
  },
  contactTextGroup: {
    flex: 1,
  },
  contactLabel: {
    fontSize: fs(11),
    ...TYPOGRAPHY.regular,
    color: Colors.slate_64748B,
  },
  contactValue: {
    fontSize: fs(13),
    ...TYPOGRAPHY.semiBold,
    color: Colors.ink,
    marginTop: hs(1),
  },
  actionPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(4),
    backgroundColor: Colors.aquaSoft,
    paddingHorizontal: ws(10),
    paddingVertical: hs(6),
    borderRadius: fs(12),
  },
  actionPillBtnText: {
    fontSize: fs(11),
    ...TYPOGRAPHY.semiBold,
    color: Colors.primaryColor,
  },
});
