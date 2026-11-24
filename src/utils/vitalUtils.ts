import { Colors } from '../constants';
import type { VitalModel } from '../types';
import { DateTimeUtils } from './dateTimeUtils';

export interface VitalStatusInfo {
  label: string;
  color: string;
  bgColor: string;
  icon: any;
  normalRangeText?: string;
}

export interface VitalIconInfo {
  icon: any;
  color: string;
  bg: string;
}

/**
 * Returns icon, accent color, and background badge color for a given vital type.
 */
export const getVitalIconInfo = (vitalName: string): VitalIconInfo => {
  switch (vitalName) {
    case 'Blood Pressure':
      return { icon: 'favorite', color: Colors.redColor, bg: Colors.red_FEE2E2 };
    case 'Sugar':
      return { icon: 'opacity', color: Colors.purple_8B5CF6, bg: Colors.purple_EDE9FE };
    case 'Weight':
      return { icon: 'fitness-center', color: Colors.green_10B981, bg: Colors.green_ECFDF5 };
    case 'Temperature':
      return { icon: 'thermostat', color: Colors.amber_D97706, bg: Colors.amber_FEF3C7 };
    case 'SpO2':
      return { icon: 'air', color: Colors.sky_0284C7, bg: Colors.sky_E0F2FE };
    default:
      return { icon: 'favorite', color: Colors.primaryColor, bg: Colors.aquaSoft };
  }
};

/**
 * Formats a vital reading item into a human-readable display string with units.
 */
export const renderVitalValue = (vitalName: string, item: VitalModel | any): string => {
  if (!item) return 'N/A';
  if (vitalName === 'Blood Pressure') {
    if (!item.bp_systolic && !item.bp_diastolic) return 'N/A';
    return `${item.bp_systolic ?? ''} / ${item.bp_diastolic ?? ''} mmHg`;
  }
  if (vitalName === 'Sugar') {
    const parts: string[] = [];
    if (item.sugar_fasting) parts.push(`Fasting: ${item.sugar_fasting} mg/dL`);
    if (item.sugar_random) parts.push(`Random: ${item.sugar_random} mg/dL`);
    return parts.length > 0 ? parts.join('  •  ') : 'N/A';
  }
  if (vitalName === 'Weight') {
    const val = item.weight ?? item.value;
    return val ? `${val} kg`.trim() : 'N/A';
  }
  if (vitalName === 'Temperature') {
    const val = item.temperature ?? item.value;
    return val ? `${val} °C`.trim() : 'N/A';
  }
  if (vitalName === 'SpO2') {
    const val = item.spo2 ?? item.value;
    return val ? `${val} %`.trim() : 'N/A';
  }
  return 'N/A';
};

/**
 * Formats vital reading date and time.
 */
export const formatVitalDateTime = (dateStr?: string, timeStr?: string): string => {
  const dFormatted = dateStr ? DateTimeUtils.getDataFormat(dateStr) : '';
  const tFormatted = timeStr ? DateTimeUtils.formatTimeToAmPm(timeStr) || timeStr : '';
  if (dFormatted && tFormatted) return `${dFormatted}, ${tFormatted}`;
  if (dFormatted) return dFormatted;
  if (tFormatted) return tFormatted;
  return '--';
};

/**
 * Calculates dynamic clinical status, color badge, and normal range for any vital reading.
 */
export const getVitalStatus = (vitalName: string, item?: VitalModel | null): VitalStatusInfo => {
  if (!item) {
    return {
      label: 'No Data',
      color: Colors.slate_64748B,
      bgColor: Colors.slate_F1F5F9,
      icon: 'help-outline',
    };
  }

  if (vitalName === 'Temperature') {
    const temp = parseFloat(String(item.temperature || (item as any)?.value || ''));
    if (isNaN(temp)) {
      return {
        label: 'Recorded',
        color: Colors.slate_64748B,
        bgColor: Colors.slate_F1F5F9,
        icon: 'info-outline',
        normalRangeText: 'Normal: 36.1 – 37.2 °C',
      };
    }
    if (temp < 36.1) {
      return {
        label: 'Low Temp',
        color: Colors.amber_D97706,
        bgColor: Colors.amber_FEF3C7,
        icon: 'error-outline',
        normalRangeText: 'Low: <36.1 °C (Normal: 36.1 – 37.2 °C)',
      };
    }
    if (temp <= 37.2) {
      return {
        label: 'Normal',
        color: Colors.green_059669,
        bgColor: Colors.green_ECFDF5,
        icon: 'check-circle-outline',
        normalRangeText: 'Normal: 36.1 – 37.2 °C',
      };
    }
    if (temp <= 38.0) {
      return {
        label: 'Low Fever',
        color: Colors.amber_D97706,
        bgColor: Colors.amber_FEF3C7,
        icon: 'warning-amber',
        normalRangeText: 'Low Fever: 37.3 – 38.0 °C (Normal: 36.1 – 37.2 °C)',
      };
    }
    return {
      label: 'High Fever',
      color: Colors.redColor,
      bgColor: Colors.red_FEE2E2,
      icon: 'error-outline',
      normalRangeText: 'High Fever: >38.0 °C (Normal: 36.1 – 37.2 °C)',
    };
  }

  if (vitalName === 'Blood Pressure') {
    const sys = parseFloat(String(item.bp_systolic || ''));
    const dia = parseFloat(String(item.bp_diastolic || ''));
    if (isNaN(sys) || isNaN(dia)) {
      return {
        label: 'Recorded',
        color: Colors.slate_64748B,
        bgColor: Colors.slate_F1F5F9,
        icon: 'info-outline',
        normalRangeText: 'Normal: 90–120 / 60–80 mmHg',
      };
    }
    if (sys < 90 || dia < 60) {
      return {
        label: 'Low BP',
        color: Colors.amber_D97706,
        bgColor: Colors.amber_FEF3C7,
        icon: 'warning-amber',
        normalRangeText: 'Low BP: <90 / <60 mmHg (Normal: 90–120 / 60–80 mmHg)',
      };
    }
    if (sys < 120 && dia < 80) {
      return {
        label: 'Normal',
        color: Colors.green_059669,
        bgColor: Colors.green_ECFDF5,
        icon: 'check-circle-outline',
        normalRangeText: 'Normal: 90–120 / 60–80 mmHg',
      };
    }
    if (sys <= 129 && dia < 80) {
      return {
        label: 'Elevated',
        color: Colors.amber_D97706,
        bgColor: Colors.amber_FEF3C7,
        icon: 'warning-amber',
        normalRangeText: 'Elevated: 120–129 / <80 mmHg (Normal: <120 / <80 mmHg)',
      };
    }
    if (sys >= 180 || dia >= 120) {
      return {
        label: 'Critical High BP',
        color: Colors.redColor,
        bgColor: Colors.red_FEE2E2,
        icon: 'error-outline',
        normalRangeText: 'Critical High BP: >180 / >120 mmHg (Normal: <120 / <80 mmHg)',
      };
    }
    if (sys >= 140 || dia >= 90) {
      return {
        label: 'Stage 2 High BP',
        color: Colors.redColor,
        bgColor: Colors.red_FEE2E2,
        icon: 'error-outline',
        normalRangeText: 'Stage 2 High BP: ≥140 / ≥90 mmHg (Normal: <120 / <80 mmHg)',
      };
    }
    return {
      label: 'Stage 1 High BP',
      color: Colors.orange_F96335,
      bgColor: Colors.orange_FFE3D3,
      icon: 'warning-amber',
      normalRangeText: 'Stage 1 High BP: 130–139 / 80–89 mmHg (Normal: <120 / <80 mmHg)',
    };
  }

  if (vitalName === 'Sugar') {
    const fast = parseFloat(String(item.sugar_fasting || ''));
    const rand = parseFloat(String(item.sugar_random || (item as any)?.value || ''));
    const val = !isNaN(fast) ? fast : rand;
    const isFasting = !isNaN(fast);

    if (isNaN(val)) {
      return {
        label: 'Recorded',
        color: Colors.slate_64748B,
        bgColor: Colors.slate_F1F5F9,
        icon: 'info-outline',
        normalRangeText: 'Normal: Fasting 70–99 | Random 70–140 mg/dL',
      };
    }
    if (val < 70) {
      return {
        label: 'Low Sugar',
        color: Colors.redColor,
        bgColor: Colors.red_FEE2E2,
        icon: 'error-outline',
        normalRangeText: isFasting ? 'Low Fasting: <70 mg/dL (Normal: 70–99 mg/dL)' : 'Low Random: <70 mg/dL (Normal: 70–140 mg/dL)',
      };
    }
    const normalMax = isFasting ? 99 : 140;
    const preMax = isFasting ? 125 : 199;
    if (val <= normalMax) {
      return {
        label: 'Normal',
        color: Colors.green_059669,
        bgColor: Colors.green_ECFDF5,
        icon: 'check-circle-outline',
        normalRangeText: isFasting ? 'Normal Fasting: 70–99 mg/dL' : 'Normal Random: 70–140 mg/dL',
      };
    }
    if (val <= preMax) {
      return {
        label: isFasting ? 'Pre-diabetic' : 'Elevated',
        color: Colors.amber_D97706,
        bgColor: Colors.amber_FEF3C7,
        icon: 'warning-amber',
        normalRangeText: isFasting ? 'Elevated Fasting: 100–125 mg/dL (Normal: 70–99 mg/dL)' : 'Elevated Random: 141–199 mg/dL (Normal: 70–140 mg/dL)',
      };
    }
    return {
      label: 'High Sugar',
      color: Colors.redColor,
      bgColor: Colors.red_FEE2E2,
      icon: 'error-outline',
      normalRangeText: isFasting ? 'High Fasting: ≥126 mg/dL (Normal: 70–99 mg/dL)' : 'High Random: ≥200 mg/dL (Normal: 70–140 mg/dL)',
    };
  }

  if (vitalName === 'SpO2') {
    const spo2 = parseFloat(String(item.spo2 || (item as any)?.value || ''));
    if (isNaN(spo2)) {
      return {
        label: 'Recorded',
        color: Colors.slate_64748B,
        bgColor: Colors.slate_F1F5F9,
        icon: 'info-outline',
        normalRangeText: 'Normal: 95 – 100 %',
      };
    }
    if (spo2 >= 95) {
      return {
        label: 'Normal',
        color: Colors.green_059669,
        bgColor: Colors.green_ECFDF5,
        icon: 'check-circle-outline',
        normalRangeText: 'Normal: 95 – 100 %',
      };
    }
    if (spo2 >= 90) {
      return {
        label: 'Low Oxygen',
        color: Colors.amber_D97706,
        bgColor: Colors.amber_FEF3C7,
        icon: 'warning-amber',
        normalRangeText: 'Low Oxygen: 90 – 94 % (Normal: 95 – 100 %)',
      };
    }
    return {
      label: 'Critical Low',
      color: Colors.redColor,
      bgColor: Colors.red_FEE2E2,
      icon: 'error-outline',
      normalRangeText: 'Critical Low Oxygen: <90 % (Normal: 95 – 100 %)',
    };
  }

  return {
    label: 'Recorded',
    color: Colors.slate_64748B,
    bgColor: Colors.slate_F1F5F9,
    icon: 'info-outline',
  };
};

export interface WeightTrendResult {
  diffText: string;
  label: string;
  color: string;
  bgColor: string;
  icon: 'trending-down' | 'trending-up' | 'trending-flat';
}

/**
 * Compares two chronological weight readings and calculates trend direction and delta.
 */
export const calculateWeightTrend = (latestVal?: number | string, prevVal?: number | string): WeightTrendResult | null => {
  const latest = parseFloat(String(latestVal || ''));
  const prev = parseFloat(String(prevVal || ''));
  if (isNaN(latest) || isNaN(prev)) return null;

  const diff = latest - prev;
  if (diff < -0.01) {
    return {
      diffText: `${diff.toFixed(1)} kg`,
      label: 'Weight Decreased',
      color: Colors.redColor,
      bgColor: Colors.red_FEE2E2,
      icon: 'trending-down',
    };
  }
  if (diff > 0.01) {
    return {
      diffText: `+${diff.toFixed(1)} kg`,
      label: 'Weight Increased',
      color: Colors.green_10B981,
      bgColor: Colors.green_ECFDF5,
      icon: 'trending-up',
    };
  }
  return {
    diffText: '0.0 kg',
    label: 'No Change',
    color: Colors.primaryColor,
    bgColor: Colors.aquaSoft,
    icon: 'trending-flat',
  };
};

/**
 * Sanitizes and formats error messages from API or internal operations into user-friendly text.
 * Prevents raw SQL, foreign key constraints, or technical error dumps from leaking to the UI.
 */
export const formatVitalErrorMessage = (error: any): string => {
  if (!error) return 'Failed to save vital reading. Please try again.';

  let rawMsg = '';
  if (typeof error === 'string') {
    rawMsg = error;
  } else if (error?.data?.message && typeof error.data.message === 'string') {
    rawMsg = error.data.message;
  } else if (error?.data?.error && typeof error.data.error === 'string') {
    rawMsg = error.data.error;
  } else if (error?.message && typeof error.message === 'string') {
    rawMsg = error.message;
  } else if (error?.error && typeof error.error === 'string') {
    rawMsg = error.error;
  }

  if (!rawMsg) return 'Failed to save vital reading. Please try again.';

  const lower = rawMsg.toLowerCase();

  // 1. Foreign Key / Family Member constraint error
  if (
    lower.includes('foreign key constraint') ||
    lower.includes('vital_family_member_id') ||
    lower.includes('family_members') ||
    lower.includes('cannot add or update a child row') ||
    lower.includes('a foreign key constraint fails')
  ) {
    return 'Unable to link vital reading to the patient profile. Please select a valid family member.';
  }

  // 2. Database/SQL internal error
  if (
    lower.includes('sql') ||
    lower.includes('constraint') ||
    lower.includes('query') ||
    lower.includes('table') ||
    lower.includes('column') ||
    lower.includes('database') ||
    lower.includes('syntax error') ||
    lower.includes('duplicate entry')
  ) {
    return 'Unable to save vital reading due to a server error. Please try again later.';
  }

  // 3. Network or Timeout error
  if (
    lower.includes('network') ||
    lower.includes('fetch') ||
    lower.includes('timeout') ||
    lower.includes('connection')
  ) {
    return 'Network connection error. Please check your internet connection.';
  }

  // 4. Strip redundant prefixes like "error Error: " or "Error: "
  let cleaned = rawMsg.replace(/^(error\s*:?\s*)+/i, '').replace(/^error:\s*/i, '').trim();

  // If technical details like brackets or stack trace remain
  if (cleaned.length > 150 || cleaned.includes('{') || cleaned.includes('\\')) {
    return 'Failed to save vital reading. Please try again.';
  }

  return cleaned || 'Failed to save vital reading. Please try again.';
};
