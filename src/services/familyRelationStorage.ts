import { storageService } from './storageService';

const STORAGE_KEY_PREFIX = 'elderly_family_relations_';

export const getSavedFamilyRelations = async (
  userId: string | number
): Promise<Record<string, string>> => {
  if (!userId) return {};
  try {
    const data = await storageService.getItem<Record<string, string>>(
      `${STORAGE_KEY_PREFIX}${userId}`
    );
    return data && typeof data === 'object' ? data : {};
  } catch {
    return {};
  }
};

export const saveFamilyRelation = async (
  userId: string | number,
  memberId: string | number,
  relation: string
): Promise<void> => {
  if (!userId || !memberId || !relation) return;
  try {
    const current = await getSavedFamilyRelations(userId);
    current[String(memberId)] = relation.trim();
    await storageService.setItem(`${STORAGE_KEY_PREFIX}${userId}`, current);
  } catch (e) {
    console.warn('Failed to save family relation locally:', e);
  }
};

export const removeFamilyRelation = async (
  userId: string | number,
  memberId: string | number
): Promise<void> => {
  if (!userId || !memberId) return;
  try {
    const current = await getSavedFamilyRelations(userId);
    if (current[String(memberId)]) {
      delete current[String(memberId)];
      await storageService.setItem(`${STORAGE_KEY_PREFIX}${userId}`, current);
    }
  } catch (e) {
    console.warn('Failed to remove family relation locally:', e);
  }
};
