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
      return { icon: 'fitness-center', color: Colors.primaryColor, bg: Colors.aquaSoft };
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
    return val ? `${val} °F`.trim() : 'N/A';
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
        normalRangeText: 'Normal range: 97.0 – 99.5 °F',
      };
    }
    if (temp < 97.0) {
      return {
        label: 'Below Normal',
        color: Colors.redColor,
        bgColor: Colors.red_FEE2E2,
        icon: 'error-outline',
        normalRangeText: 'Normal range: 97.0 – 99.5 °F',
      };
    }
    if (temp <= 99.5) {
      return {
        label: 'Normal',
        color: Colors.green_059669,
        bgColor: Colors.green_ECFDF5,
        icon: 'check-circle-outline',
        normalRangeText: 'Normal range: 97.0 – 99.5 °F',
      };
    }
    if (temp <= 100.4) {
      return {
        label: 'Low Fever',
        color: Colors.amber_D97706,
        bgColor: Colors.amber_FEF3C7,
        icon: 'warning-amber',
        normalRangeText: 'Normal range: 97.0 – 99.5 °F',
      };
    }
    return {
      label: 'High Fever',
      color: Colors.redColor,
      bgColor: Colors.red_FEE2E2,
      icon: 'error-outline',
      normalRangeText: 'Normal range: 97.0 – 99.5 °F',
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
        normalRangeText: 'Normal: <120 / <80 mmHg',
      };
    }
    if (sys < 90 || dia < 60) {
      return {
        label: 'Low BP',
        color: Colors.amber_D97706,
        bgColor: Colors.amber_FEF3C7,
        icon: 'warning-amber',
        normalRangeText: 'Normal: <120 / <80 mmHg',
      };
    }
    if (sys < 120 && dia < 80) {
      return {
        label: 'Normal',
        color: Colors.green_059669,
        bgColor: Colors.green_ECFDF5,
        icon: 'check-circle-outline',
        normalRangeText: 'Normal: <120 / <80 mmHg',
      };
    }
    if (sys <= 129 && dia < 80) {
      return {
        label: 'Elevated',
        color: Colors.amber_D97706,
        bgColor: Colors.amber_FEF3C7,
        icon: 'warning-amber',
        normalRangeText: 'Normal: <120 / <80 mmHg',
      };
    }
    if (sys <= 139 || dia <= 89) {
      return {
        label: 'Stage 1 HTN',
        color: Colors.orange_F96335,
        bgColor: Colors.orange_FFE3D3,
        icon: 'warning-amber',
        normalRangeText: 'Normal: <120 / <80 mmHg',
      };
    }
    return {
      label: 'Stage 2 HTN',
      color: Colors.redColor,
      bgColor: Colors.red_FEE2E2,
      icon: 'error-outline',
      normalRangeText: 'Normal: <120 / <80 mmHg',
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
        label: 'Low (Hypo)',
        color: Colors.redColor,
        bgColor: Colors.red_FEE2E2,
        icon: 'error-outline',
        normalRangeText: isFasting ? 'Fasting Normal Range: 70–99 mg/dL' : 'Random Normal Range: 70–140 mg/dL',
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
        normalRangeText: isFasting ? 'Fasting Normal Range: 70–99 mg/dL' : 'Random Normal Range: 70–140 mg/dL',
      };
    }
    if (val <= preMax) {
      return {
        label: isFasting ? 'Pre-diabetic' : 'Elevated',
        color: Colors.amber_D97706,
        bgColor: Colors.amber_FEF3C7,
        icon: 'warning-amber',
        normalRangeText: isFasting ? 'Fasting Normal Range: 70–99 mg/dL' : 'Random Normal Range: 70–140 mg/dL',
      };
    }
    return {
      label: 'High (Hyper)',
      color: Colors.redColor,
      bgColor: Colors.red_FEE2E2,
      icon: 'error-outline',
      normalRangeText: isFasting ? 'Fasting Normal Range: 70–99 mg/dL' : 'Random Normal Range: 70–140 mg/dL',
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
        label: 'Low',
        color: Colors.amber_D97706,
        bgColor: Colors.amber_FEF3C7,
        icon: 'warning-amber',
        normalRangeText: 'Normal: 95 – 100 %',
      };
    }
    return {
      label: 'Critical',
      color: Colors.redColor,
      bgColor: Colors.red_FEE2E2,
      icon: 'error-outline',
      normalRangeText: 'Normal: 95 – 100 %',
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
