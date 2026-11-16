import { ToastAndroid, Alert, Platform } from 'react-native';
import { ApiEndpoints } from '../constants';

/**
 * Safely format doctor name ensuring "Dr. " prefix is added exactly once.
 * Prevents double prefix like "Dr. Dr. Name".
 */
export const formatDoctorName = (fName?: string, lName?: string): string => {
  const first = (fName ?? '').trim();
  const last = (lName ?? '').trim();
  let full = `${first} ${last}`.trim();

  if (!full) return 'Doctor';

  // Strip any combination of leading "dr", "dr.", "dr ", "dr. " (case insensitive, repeated)
  full = full.replace(/^(dr\.?\s*)+/i, '').trim();

  if (!full) return 'Doctor';

  return `Dr. ${full}`;
};

export const showToast = (message: string) => {
  if (!message) return;
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    Alert.alert('', message);
  }
};

export const getImageUrl = (path?: string) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const cleanPath = path.replace(/^\//, '');
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

export const getDepartmentImageUrl = (dept?: { id?: string | number; title?: string; name?: string; image?: string } | null): string => {
  if (!dept) return '';
  if (dept.image) return getImageUrl(dept.image);
  return '';
};

const norm = (v: unknown): string =>
  String(v ?? '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

/** Department name exactly as DoctorCard shows it (single source of truth). */
export const getDoctorDepartmentName = (doc: any): string =>
  doc?.department_name ||
  doc?.dept_name ||
  doc?.dept_title ||
  doc?.department_title ||
  doc?.department?.name ||
  doc?.department?.title ||
  doc?.specialization ||
  doc?.specialty ||
  '';

/**
 * Strict department filter used by the Doctors list and Search screens.
 *
 * Previously a doctor matched when ANY of id / title (substring) / specialization
 * matched, so e.g. a doctor whose specialization text mentioned "Cardiology" but whose
 * department is "Emergency medicine" appeared under Cardiology while the card
 * (which prints the department) said "Emergency medicine".
 *
 * Rules now:
 *  1. If the doctor carries a department title and a target title is known -> the titles must be equal.
 *  2. Otherwise if the doctor carries a department id and a target id is known -> the ids must be equal.
 *  3. Otherwise (doctor has no department info at all) -> specialization must equal the target title.
 */
export const doctorMatchesDepartment = (
  doc: any,
  deptId?: string | number | null,
  deptTitle?: string | null
): boolean => {
  const targetId = deptId != null && String(deptId).trim() !== '' ? String(deptId).trim() : '';
  const targetTitle = norm(deptTitle);
  if (!targetId && !targetTitle) return true;

  const docIds = [doc?.dept_id, doc?.department_id, doc?.deptId, doc?.departmentId, doc?.department?.id, doc?.dept?.id]
    .filter((v) => v !== undefined && v !== null && v !== '')
    .map((v) => String(v).trim());

  const docTitles = [
    doc?.dept_title,
    doc?.dept_name,
    doc?.department_name,
    doc?.department_title,
    doc?.department?.title,
    doc?.department?.name,
    doc?.dept?.title,
    doc?.dept?.name,
  ]
    .filter((v) => typeof v === 'string' && v.trim().length > 0)
    .map(norm);

  if (docTitles.length > 0 && targetTitle) return docTitles.includes(targetTitle);
  if (docIds.length > 0 && targetId) return docIds.includes(targetId);

  const spec = [doc?.specialization, doc?.specialty]
    .filter((v) => typeof v === 'string' && v.trim().length > 0)
    .map(norm);
  return !!targetTitle && spec.includes(targetTitle);
};

/** Every word typed must appear somewhere in the doctor's searchable text (order-independent). */
export const doctorMatchesSearch = (doc: any, query: string): boolean => {
  const tokens = norm(query).split(' ').filter(Boolean);
  if (tokens.length === 0) return true;
  const haystack = norm(
    [
      doc?.f_name,
      doc?.l_name,
      doc?.name,
      doc?.clinic_title,
      doc?.clinic_name,
      doc?.clinics_name,
      getDoctorDepartmentName(doc),
      doc?.specialization,
      doc?.clinics_address,
      doc?.clinic_address,
      doc?.address,
      doc?.city_title,
    ].join(' ')
  );
  return tokens.every((t) => haystack.includes(t));
};
