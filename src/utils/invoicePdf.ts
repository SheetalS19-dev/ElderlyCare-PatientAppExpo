import { ApiEndpoints } from '@/constants';
import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { saveLocalFileToDownloads } from './fileDownloader';


interface InvoiceItem {
  id: number;
  invoice_id: number;
  clinic_id: number;
  description: string;
  quantity: number;
  unit_price: number;
  unit_tax: number;
  unit_tax_amount: number;
  service_charge: number;
  total_price: number;
}

export interface InvoiceData {
  id: number;
  user_id: number;
  clinic_id: number;
  patient_id: number;
  appointment_id: number;
  status: string;

  coupon_title: string | null;
  coupon_value: number | null;
  coupon_off_amount: number;

  total_amount: number;
  invoice_date: string;
  created_at: string;

  patient_f_name: string;
  patient_l_name: string;
  patient_phone: string;

  user_f_name: string;
  user_l_name: string;
  user_phone: string;

  clinic_name: string;
  clinic_address: string;
  clinic_image: string;
  clinic_email: string;
  clinic_phone_1: string;
  clinic_phone_2: string;

  items: InvoiceItem[];
}

export interface InvoiceAppointmentInfo {
  appointmentDate?: string;
  appointmentTime?: string;
  doctorName?: string;
  doctorSpecialization?: string;
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
      second: '2-digit',
    })
  );
};

const getClinicImageUrl = (image?: string | null) => {
  if (!image) return '';

  if (image.startsWith('http://') || image.startsWith('https://')) {
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

export async function generateInvoicePdf(
  invoice: InvoiceData,
  appointmentInfo?: InvoiceAppointmentInfo,
) {
  const items = invoice.items ?? [];

  const priceAmount = items.reduce(
    (sum, item) =>
      sum + Number(item.unit_price || 0) * Number(item.quantity || 1),
    0,
  );

  const gstAmount = items.reduce(
    (sum, item) =>
      sum + Number(item.unit_tax_amount || 0) * Number(item.quantity || 1),
    0,
  );

  const serviceCharge = items.reduce(
    (sum, item) => sum + Number(item.service_charge || 0),
    0,
  );

  const couponDiscount = Number(invoice.coupon_off_amount || 0);

  const clinicImage = getClinicImageUrl(invoice.clinic_image);

  const itemsHtml = items
    .map(
      item => `
        <tr>
          <td>${escapeHtml(item.description)}</td>

          <td class="text-right">
            ₹${Number(item.unit_price || 0).toFixed(2)}
          </td>

          <td class="text-right">
            ₹${Number(item.total_price || 0).toFixed(2)}
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
  margin: 35px 40px 45px 40px;
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
  font-size: 11px;
}

.invoice {
  width: 100%;
}

/* ================= HEADER ================= */

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.clinic-section {
  width: 65%;
}

.clinic-logo {
  width: 55px;
  height: 35px;
  object-fit: contain;
  margin-bottom: 7px;
}

.clinic-name {
  font-size: 19px;
  font-weight: bold;
  margin-bottom: 3px;
}

.clinic-info {
  color: #555;
  font-size: 9px;
  line-height: 14px;
}

.invoice-title {
  font-size: 30px;
  font-weight: bold;
  text-align: right;
}

/* ================= DIVIDER ================= */

.divider {
  border-top: 1px solid #444;
  margin: 22px 0 18px 0;
}

/* ================= DETAILS ================= */

.details {
  display: flex;
  justify-content: space-between;
}

.left-details {
  width: 55%;
}

.right-details {
  width: 42%;
  text-align: right;
}

.detail-row {
  margin-bottom: 4px;
  line-height: 14px;
}

.bold {
  font-weight: bold;
}

.invoice-to {
  margin-bottom: 4px;
}

.patient-name {
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 5px;
}

.doctor-section {
  margin-top: 9px;
  line-height: 16px;
}

/* ================= TABLE ================= */

.items-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}

.items-table th {
  padding: 6px 0;

  border-top: 1px solid #444;
  border-bottom: 1px solid #777;

  font-weight: bold;
  text-align: left;
}

.items-table td {
  padding: 8px 0;

  border-bottom: 1px solid #eeeeee;
}

.text-right {
  text-align: right;
}

/* ================= TOTALS ================= */

.totals {
  width: 100%;
  margin-top: 12px;
}

.total-row {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 5px;
}

.total-label {
  width: 140px;
  text-align: right;
  margin-right: 5px;
}

.total-value {
  width: 85px;
  text-align: right;
}

.grand-total {
  font-size: 13px;
  font-weight: bold;
  margin-top: 6px;
}

/* ================= FOOTER ================= */

.generated {
  margin-top: 25px;
  color: #666;
  font-size: 9px;
}

.footer {
  margin-top: 25px;
  text-align: center;

  color: #777;
  font-size: 9px;
  line-height: 14px;
}

</style>

</head>

<body>

<div class="invoice">

  <!-- ================= HEADER ================= -->

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
        ${escapeHtml(invoice.clinic_name)}
      </div>

      <div class="clinic-info">

        ${escapeHtml(invoice.clinic_address)}

        <br />

        Phone:
        ${escapeHtml(invoice.clinic_phone_1)}
        ${invoice.clinic_phone_2
      ? `, ${escapeHtml(invoice.clinic_phone_2)}`
      : ''
    }

        <br />

        Email:
        ${escapeHtml(invoice.clinic_email)}

      </div>

    </div>


    <div class="invoice-title">
      INVOICE
    </div>

  </div>


  <div class="divider"></div>


  <!-- ================= INVOICE DETAILS ================= -->

  <div class="details">

    <div class="left-details">

      <div class="detail-row">
        <span class="bold">Invoice No:</span>
        #${escapeHtml(invoice.id)}
      </div>

      <div class="detail-row">
        <span class="bold">Invoice Date:</span>
        ${formatDate(invoice.invoice_date)}
      </div>

      <div class="detail-row">
        <span class="bold">Appointment ID:</span>
        #${escapeHtml(invoice.appointment_id)}
      </div>

      <div class="detail-row">
        <span class="bold">Appointment Created:</span>
        ${formatDateTime(invoice.created_at)}
      </div>

      <div class="detail-row">
        <span class="bold">Patient Visit Date & Time:</span>
        ${escapeHtml(appointmentInfo?.appointmentDate ?? '--')}
        ${appointmentInfo?.appointmentTime
      ? ` (${escapeHtml(appointmentInfo.appointmentTime)})`
      : ''
    }
      </div>

      <div class="detail-row">
        <span class="bold">Status:</span>
        ${escapeHtml(invoice.status)}
      </div>

    </div>


    <div class="right-details">

      <div class="invoice-to">
        Invoice To:
      </div>

      <div class="patient-name">
        ${escapeHtml(invoice.user_f_name)}
        ${escapeHtml(invoice.user_l_name)}
      </div>

      <div>
        Phone:
        ${escapeHtml(invoice.user_phone)}
      </div>

      <div>
        Patient ID:
        ${escapeHtml(invoice.patient_id)}
      </div>

      <div>
        Patient Name:
        ${escapeHtml(invoice.patient_f_name)}
        ${escapeHtml(invoice.patient_l_name)}
      </div>

      ${appointmentInfo?.doctorName
      ? `
            <div class="doctor-section">

              <div>
                <span class="bold">Doctor:</span>
                ${escapeHtml(appointmentInfo.doctorName)}
              </div>

              ${appointmentInfo.doctorSpecialization
        ? `
                    <div>
                      <span class="bold">Specialization:</span>
                      ${escapeHtml(
          appointmentInfo.doctorSpecialization,
        )}
                    </div>
                  `
        : ''
      }

            </div>
          `
      : ''
    }

    </div>

  </div>


  <!-- ================= ITEMS ================= -->

  <table class="items-table">

    <thead>

      <tr>
        <th>Description</th>
        <th class="text-right">Price</th>
        <th class="text-right">Amount</th>
      </tr>

    </thead>

    <tbody>

      ${itemsHtml}

    </tbody>

  </table>


  <!-- ================= TOTALS ================= -->

  <div class="totals">

    <div class="total-row">

      <div class="total-label">
        Price Amount:
      </div>

      <div class="total-value">
        ₹${priceAmount.toFixed(2)}
      </div>

    </div>


    ${gstAmount > 0
      ? `
          <div class="total-row">

            <div class="total-label">
              GST:
            </div>

            <div class="total-value">
              ₹${gstAmount.toFixed(2)}
            </div>

          </div>
        `
      : ''
    }


    ${serviceCharge > 0
      ? `
          <div class="total-row">

            <div class="total-label">
              Service Charge:
            </div>

            <div class="total-value">
              ₹${serviceCharge.toFixed(2)}
            </div>

          </div>
        `
      : ''
    }


    ${couponDiscount > 0
      ? `
          <div class="total-row">

            <div class="total-label">
              Discount:
            </div>

            <div class="total-value">
              -₹${couponDiscount.toFixed(2)}
            </div>

          </div>
        `
      : ''
    }


    <div class="total-row grand-total">

      <div class="total-label">
        Total Amount:
      </div>

      <div class="total-value">
        ₹${Number(invoice.total_amount).toFixed(2)}
      </div>

    </div>

  </div>


  <div class="generated">

    Generated At:
    ${formatDateTime(invoice.created_at)}

  </div>


  <div class="footer">

    This is a computer-generated invoice and does not require a signature.
    <br />

    Thank you for your payment!

  </div>

</div>

</body>

</html>
  `;

  const { uri } = await Print.printToFileAsync({
    html,
    margins: {
      top: 20,
      bottom: 20,
      left: 20,
      right: 20,
    },
  });

  return uri;
}


export async function viewInvoicePdf(
  invoice: InvoiceData,
  appointmentInfo?: InvoiceAppointmentInfo,
) {
  const uri = await generateInvoicePdf(invoice, appointmentInfo);
  try {
    await Print.printAsync({ uri });
  } catch (err: any) {
    const msg = String(err?.message || err || '');
    if (msg.includes('Another print request is already in progress')) {
      console.warn('Print request is already in progress');
    } else {
      try {
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'View Invoice PDF' });
        }
      } catch (shareErr) {
        console.warn('Could not open print or sharing view:', shareErr);
      }
    }
  }
  return uri;
}

export async function downloadInvoicePdf(
  invoice: InvoiceData,
  appointmentInfo?: InvoiceAppointmentInfo,
) {
  const uri = await generateInvoicePdf(invoice, appointmentInfo);
  const fileName = `Invoice_${invoice.id || Date.now()}.pdf`;

  const saveRes = await saveLocalFileToDownloads(uri, fileName, 'application/pdf');
  return { success: saveRes.success, uri: saveRes.uri || uri, fileName };
}

export async function shareInvoicePdf(
  invoice: InvoiceData,
  appointmentInfo?: InvoiceAppointmentInfo,
) {
  const uri = await generateInvoicePdf(
    invoice,
    appointmentInfo,
  );

  const isAvailable = await Sharing.isAvailableAsync();

  if (!isAvailable) {
    throw new Error(
      'PDF sharing is not available on this device.',
    );
  }

  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: `Invoice #${invoice.id}`,
    UTI: 'com.adobe.pdf',
  });

  return uri;
}