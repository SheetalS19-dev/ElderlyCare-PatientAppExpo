import { AppConstants } from '../constants';
import { storageService } from '../services/storageService';

let memoryRescheduledIds: Set<string> = new Set();
let isInitialized = false;

export const loadRescheduledAppointmentIds = async (): Promise<Set<string>> => {
  try {
    const raw = await storageService.getItem<string[]>(AppConstants.storageKeys.rescheduledAppIds);
    if (Array.isArray(raw)) {
      memoryRescheduledIds = new Set(raw.map((id) => String(id).trim()));
    }
  } catch (e) {
    console.warn('Could not load rescheduled appointment ids:', e);
  }
  isInitialized = true;
  return memoryRescheduledIds;
};

export const getRescheduledAppointmentIds = (): Set<string> => {
  return memoryRescheduledIds;
};

export const markAppointmentAsRescheduled = async (
  appId: string | number,
  _previousAppId?: string | number
): Promise<void> => {
  try {
    if (!isInitialized) {
      await loadRescheduledAppointmentIds();
    }
    const idStr = String(appId).trim();
    if (idStr) {
      memoryRescheduledIds.add(idStr);
      await storageService.setItem(
        AppConstants.storageKeys.rescheduledAppIds,
        Array.from(memoryRescheduledIds)
      );
    }
  } catch (e) {
    console.warn('Could not save rescheduled appointment id:', e);
  }
};

export const isAppointmentRescheduled = (appId?: string | number | null): boolean => {
  if (!appId) return false;
  return memoryRescheduledIds.has(String(appId).trim());
};
