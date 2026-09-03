import { ApiEndpoints } from '@/constants';
import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

interface PrescriptionItem {
  id: number;
  prescription_id: number;
  medicine_name: string;
  dosage: string;
  duration: string;
  time: string;
  dose_interval: string;
  notes: string;
}

export interface PrescriptionData {
  id: number;
  appointment_id: number;
  clinic_id: number;
  patient_id: number;
  date: string;

  test: string;
  advice: string;
  problem_desc: string;

  food_allergies: string;
  tendency_bleed: string;
  heart_disease: string;
  blood_pressure: string;
  diabetic: string;
  surgery: string;
  accident: string;
  others: string;
  medical_history: string;
  current_medication: string;
  female_pregnancy: string;
  breast_feeding: string;

  pulse_rate: string;
  temperature: string;
  next_visit: string;

  pdf_file: string | null;
  json_data: string | null;

  created_at: string;
  updated_at: string;

  items: PrescriptionItem[];
}

export interface PrescriptionPdfInfo {
  doctorName?: string;
  patientName?: string;
  patientId?: string | number;

  clinicName?: string;
  clinicAddress?: string;
  clinicPhone1?: string;
  clinicPhone2?: string;
  clinicEmail?: string;
  clinicImage?: string;

  generatedAt?: string;
}

const API_BASE_URL = ApiEndpoints.webApiUrl;

const escapeHtml = (value: unknown) => {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

const displayValue = (value: unknown) => {
  const text = String(value ?? '').trim();
  return text || '--';
};

const formatDate = (value?: string) => {
  if (!value) return '--';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const formatDateTime = (value?: string) => {
  if (!value) return '--';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return (
    date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }) +
    ', ' +
    date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  );
};

const getClinicImageUrl = (image?: string | null) => {
  if (!image) return '';

  if (
    image.startsWith('http://') ||
    image.startsWith('https://')
  ) {
    return image;
  }

  const cleanPath = image.replace(/^\//, '');

  if (cleanPath.startsWith('api/public/storage/')) {
    return `${ApiEndpoints.webApiUrl}/${cleanPath}`;
  }

  if (cleanPath.startsWith('public/storage/')) {
    return `${ApiEndpoints.webApiUrl}/api/${cleanPath}`;
  }

  if (cleanPath.startsWith('storage/')) {
    return `${ApiEndpoints.webApiUrl}/api/public/${cleanPath}`;
  }

  return `${ApiEndpoints.imageUrl}/${cleanPath}`;
};

export async function generatePrescriptionPdf(
  prescription: PrescriptionData,
  info: PrescriptionPdfInfo = {},
) {
  const items = prescription.items ?? [];

  const clinicImage = getClinicImageUrl(info.clinicImage);

  const medicineRows = items
    .map(
      item => `
        <tr>
          <td class="medicine-name">
            ${escapeHtml(item.medicine_name)}
          </td>

          <td>
            ${escapeHtml(item.duration)}
          </td>

          <td>
            ${escapeHtml(item.time)}
          </td>

          <td class="notes">
            ${escapeHtml(item.notes)}
          </td>
        </tr>
      `,
    )
    .join('');

  const html = `
<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8" />

<style>

@page {
  size: A4;
  margin: 25px 35px 40px 35px;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;

  font-family:
    Arial,
    Helvetica,
    sans-serif;

  color: #111;
  font-size: 9px;
}

.page {
  width: 100%;
}

/* =========================================
   HEADER
========================================= */

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.clinic-section {
  width: 60%;
}

.clinic-logo {
  width: 45px;
  height: 30px;
  object-fit: contain;
  margin-bottom: 5px;
}

.clinic-name {
  font-size: 13px;
  font-weight: bold;
  margin-bottom: 3px;
}

.clinic-info {
  font-size: 7px;
  line-height: 10px;
  color: #555;
}

.prescription-title {
  font-size: 17px;
  font-weight: bold;
  text-align: right;
}

/* =========================================
   DIVIDER
========================================= */

.divider {
  border-top: 1px solid #444;
  margin: 14px 0 8px 0;
}

/* =========================================
   PATIENT INFO
========================================= */

.patient-section {
  display: flex;
  justify-content: space-between;
  line-height: 12px;
}

.patient-left {
  width: 55%;
}

.patient-right {
  width: 40%;
  text-align: right;
}

.info-row {
  margin-bottom: 2px;
}

.label {
  font-weight: bold;
}

/* =========================================
   MEDICINES TITLE
========================================= */

.medicines-title {
  text-align: center;
  font-size: 10px;
  font-weight: bold;

  margin-top: 10px;
  margin-bottom: 4px;
}

/* =========================================
   MEDICINE TABLE
========================================= */

.medicine-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.medicine-table th {
  font-size: 7px;
  font-weight: bold;
  text-align: left;

  padding: 5px 3px;

  border-top: 1px solid #444;
  border-bottom: 1px solid #777;
}

.medicine-table td {
  font-size: 7px;
  vertical-align: top;

  padding: 6px 3px;

  border-bottom: 1px solid #eeeeee;

  line-height: 9px;
}

.medicine-table th:nth-child(1) {
  width: 25%;
}

.medicine-table th:nth-child(2) {
  width: 20%;
}

.medicine-table th:nth-child(3) {
  width: 20%;
}

.medicine-table th:nth-child(4) {
  width: 35%;
}

.medicine-name {
  font-weight: normal;
}

.notes {
  word-wrap: break-word;
}

/* =========================================
   PROBLEM / ADVICE
========================================= */

.section {
  margin-top: 9px;
}

.section-title {
  font-weight: bold;
  font-size: 8px;
  margin-bottom: 3px;
}

.section-content {
  font-size: 7px;
  line-height: 10px;
  min-height: 10px;
}

.section-divider {
  border-top: 1px solid #888;
  margin-top: 7px;
}

/* =========================================
   MEDICAL INFORMATION
========================================= */

.medical-info {
  margin-top: 8px;
}

.medical-title {
  font-size: 8px;
  font-weight: bold;
  margin-bottom: 3px;
}

.medical-row {
  font-size: 7px;
  line-height: 10px;
}

/* =========================================
   FOOTER
========================================= */

.generated {
  margin-top: 25px;
  text-align: center;

  color: #777;
  font-size: 7px;
}

</style>

</head>

<body>

<div class="page">

  <!-- =====================================
       CLINIC HEADER
  ====================================== -->

  <div class="header">

    <div class="clinic-section">

      ${clinicImage
      ? `
            <img
              src="${escapeHtml(clinicImage)}"
              class="clinic-logo"
              onerror="this.onerror=null;this.style.display='none';"
            />
          `
      : ''
    }

      <div class="clinic-name">
        ${escapeHtml(
      displayValue(info.clinicName),
    )}
      </div>

      <div class="clinic-info">

        ${escapeHtml(
      displayValue(info.clinicAddress),
    )}

        <br />

        Phone:
        ${escapeHtml(
      displayValue(info.clinicPhone1),
    )}

        ${info.clinicPhone2
      ? `, ${escapeHtml(info.clinicPhone2)}`
      : ''
    }

        <br />

        Email:
        ${escapeHtml(
      displayValue(info.clinicEmail),
    )}

      </div>

    </div>


    <div class="prescription-title">
      PRESCRIPTION
    </div>

  </div>


  <div class="divider"></div>


  <!-- =====================================
       PATIENT INFORMATION
  ====================================== -->

  <div class="patient-section">

    <div class="patient-left">

      <div class="info-row">
        <span class="label">Patient ID:</span>
        ${escapeHtml(
      displayValue(info.patientId),
    )}
      </div>

      <div class="info-row">
        <span class="label">Name:</span>
        ${escapeHtml(
      displayValue(info.patientName),
    )}
      </div>

      <div class="info-row">
        <span class="label">Age:</span>
        --
      </div>

      <div class="info-row">
        <span class="label">Gender:</span>
        --
      </div>

    </div>


    <div class="patient-right">

      <div class="info-row">
        <span class="label">Pulse Rate:</span>
        ${escapeHtml(
      displayValue(prescription.pulse_rate),
    )}
      </div>

      <div class="info-row">
        <span class="label">Temperature:</span>
        ${escapeHtml(
      displayValue(prescription.temperature),
    )}
      </div>

      <div class="info-row">
        <span class="label">Blood Pressure:</span>
        ${escapeHtml(
      displayValue(prescription.blood_pressure),
    )}
      </div>

    </div>

  </div>


  <!-- =====================================
       MEDICINES
  ====================================== -->

  <div class="medicines-title">
    Medicines
  </div>


  <table class="medicine-table">

    <thead>

      <tr>
        <th>Medicine Name</th>
        <th>Days</th>
        <th>Time</th>
        <th>Notes</th>
      </tr>

    </thead>

    <tbody>

      ${medicineRows ||
    `
          <tr>
            <td colspan="4">
              No medicines prescribed
            </td>
          </tr>
        `
    }

    </tbody>

  </table>


  <!-- =====================================
       PROBLEM DESCRIPTION
  ====================================== -->

  <div class="section">

    <div class="section-title">
      Problem Description:-
    </div>

    <div class="section-content">
      ${escapeHtml(
      displayValue(prescription.problem_desc),
    )}
    </div>

  </div>


  <!-- =====================================
       TEST
  ====================================== -->

  <div class="section">

    <div class="section-title">
      Test:-
    </div>

    <div class="section-content">
      ${escapeHtml(
      displayValue(prescription.test),
    )}
    </div>

  </div>


  <!-- =====================================
       ADVICE
  ====================================== -->

  <div class="section">

    <div class="section-title">
      Advice:-
    </div>

    <div class="section-content">
      ${escapeHtml(
      displayValue(prescription.advice),
    )}
    </div>

  </div>


  <div class="section-divider"></div>


  <!-- =====================================
       OTHER MEDICAL INFORMATION
  ====================================== -->

  <div class="medical-info">

    <div class="medical-title">
      Others -
    </div>


    <div class="medical-row">
      Food Allergies:-
      ${escapeHtml(
      displayValue(prescription.food_allergies),
    )}
    </div>

    <div class="medical-row">
      Tendency to Bleed:-
      ${escapeHtml(
      displayValue(prescription.tendency_bleed),
    )}
    </div>

    <div class="medical-row">
      Heart Disease:-
      ${escapeHtml(
      displayValue(prescription.heart_disease),
    )}
    </div>

    <div class="medical-row">
      Diabetic:-
      ${escapeHtml(
      displayValue(prescription.diabetic),
    )}
    </div>

    <div class="medical-row">
      Surgery:-
      ${escapeHtml(
      displayValue(prescription.surgery),
    )}
    </div>

    <div class="medical-row">
      Accident:-
      ${escapeHtml(
      displayValue(prescription.accident),
    )}
    </div>

    <div class="medical-row">
      Other:-
      ${escapeHtml(
      displayValue(prescription.others),
    )}
    </div>

    <div class="medical-row">
      Medical History:-
      ${escapeHtml(
      displayValue(prescription.medical_history),
    )}
    </div>

    <div class="medical-row">
      Current Medication:-
      ${escapeHtml(
      displayValue(prescription.current_medication),
    )}
    </div>

    <div class="medical-row">
      Female Pregnancy:-
      ${escapeHtml(
      displayValue(prescription.female_pregnancy),
    )}
    </div>

    <div class="medical-row">
      Breast Feeding:-
      ${escapeHtml(
      displayValue(prescription.breast_feeding),
    )}
    </div>

  </div>


  <!-- =====================================
       FOOTER
  ====================================== -->

  <div class="generated">

    Generated on
    ${formatDateTime(
      info.generatedAt || prescription.created_at,
    )}

  </div>

</div>

</body>

</html>
  `;

  const { uri } = await Print.printToFileAsync({
    html,

    margins: {
      top: 15,
      bottom: 20,
      left: 15,
      right: 15,
    },
  });

  return uri;
}


export async function viewPrescriptionPdf(
  prescription: PrescriptionData,
  info: PrescriptionPdfInfo = {},
) {
  const uri = await generatePrescriptionPdf(prescription, info);
  await Print.printAsync({ uri });
  return uri;
}

export async function downloadPrescriptionPdf(
  prescription: PrescriptionData,
  info: PrescriptionPdfInfo = {},
) {
  const uri = await generatePrescriptionPdf(prescription, info);

  if (Platform.OS === 'android') {
    try {
      const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
      if (permissions.granted) {
        const base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const fileName = `Prescription_${prescription.id}_${Date.now()}.pdf`;
        const newFileUri = await FileSystem.StorageAccessFramework.createFileAsync(
          permissions.directoryUri,
          fileName,
          'application/pdf',
        );
        await FileSystem.writeAsStringAsync(newFileUri, base64, {
          encoding: FileSystem.EncodingType.Base64,
        });
        return { success: true, uri: newFileUri, fileName };
      }
    } catch (err) {
      console.warn('StorageAccessFramework download error, falling back to share dialog:', err);
    }
  }

  // Fallback for iOS or if directory selection is skipped
  const isAvailable = await Sharing.isAvailableAsync();
  if (isAvailable) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: `Save Prescription #${prescription.id}`,
      UTI: 'com.adobe.pdf',
    });
  }

  return { success: true, uri, fileName: `Prescription_${prescription.id}.pdf` };
}

export async function sharePrescriptionPdf(
  prescription: PrescriptionData,
  info: PrescriptionPdfInfo = {},
) {
  const uri = await generatePrescriptionPdf(
    prescription,
    info,
  );

  const available =
    await Sharing.isAvailableAsync();

  if (!available) {
    throw new Error(
      'PDF sharing is not available on this device.',
    );
  }

  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: `Prescription #${prescription.id}`,
    UTI: 'com.adobe.pdf',
  });

  return uri;
}