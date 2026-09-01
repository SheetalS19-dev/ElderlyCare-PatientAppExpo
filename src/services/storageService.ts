import AsyncStorage from '@react-native-async-storage/async-storage';

export const storageService = {
  setItem: async (key: string, value: any): Promise<void> => {
    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      await AsyncStorage.setItem(key, stringValue);
    } catch (e) {
      console.error(`Error saving ${key} to storage`, e);
    }
  },

  getItem: async <T = string>(key: string): Promise<T | null> => {
    try {
      const value = await AsyncStorage.getItem(key);
      if (!value) return null;
      try {
        return JSON.parse(value) as T;
      } catch {
        return value as unknown as T;
      }
    } catch (e) {
      console.error(`Error reading ${key} from storage`, e);
      return null;
    }
  },

  removeItem: async (key: string): Promise<void> => {
    try {
      await AsyncStorage.removeItem(key);
    } catch (e) {
      console.error(`Error removing ${key} from storage`, e);
    }
  },

  clear: async (): Promise<void> => {
    try {
      await AsyncStorage.clear();
    } catch (e) {
      console.error('Error clearing storage', e);
    }
  },
};
