import { requireOptionalNativeModule } from 'expo-modules-core';
import type { CityModel } from '../types';

const normalizeCityAlias = (rawName: string): string => {
  const trimmed = rawName.trim();
  const lower = trimmed.toLowerCase();
  if (lower.includes('allahabad') || lower.includes('prayagraj')) {
    return 'Prayagraj';
  }
  return trimmed;
};

/**
 * Detects the device's current city via expo-location (with IP geolocation fallback).
 */
export const detectDeviceCityName = async (): Promise<string | null> => {
  try {
    const hasExpoLocationNativeModule = Boolean(requireOptionalNativeModule('ExpoLocation'));

    if (hasExpoLocationNativeModule) {
      try {
        const Location = require('expo-location');
        if (Location && Location.requestForegroundPermissionsAsync) {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === 'granted') {
            const location = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            });
            const geocoded = await Location.reverseGeocodeAsync({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            });
            if (geocoded && geocoded.length > 0) {
              const place = geocoded[0];
              const rawName = place.city || place.subregion || place.district || place.region || '';
              if (rawName) {
                return normalizeCityAlias(rawName);
              }
            }
          }
        }
      } catch (expoError) {
        console.log('Error calling expo-location:', expoError);
      }
    }

    const ipRes = await fetch('http://ip-api.com/json');
    if (ipRes.ok) {
      const ipData = await ipRes.json();
      if (ipData && ipData.status === 'success' && ipData.city) {
        return normalizeCityAlias(String(ipData.city));
      }
    }
  } catch (error) {
    console.log('Error detecting city:', error);
  }
  return null;
};

/**
 * Finds the best matching city entry in the API city list for a detected city name.
 */
export const matchCityFromList = (
  detectedName: string | null | undefined,
  cities: CityModel[]
): CityModel | undefined => {
  if (!detectedName || !cities.length) return undefined;
  const query = detectedName.toLowerCase().trim();
  if (!query) return undefined;

  const exactMatch = cities.find((c) => {
    const label = (c.title || c.name || '').toLowerCase().trim();
    return label === query;
  });
  if (exactMatch) return exactMatch;

  return cities.find((c) => {
    const label = (c.title || c.name || '').toLowerCase().trim();
    return label.length > 0 && (label.includes(query) || query.includes(label));
  });
};

export const formatCityDisplayName = (city: CityModel): string => {
  const name = city.title || city.name || '';
  if (!name) return '';
  return city.state_title ? `${name}, ${city.state_title}` : name;
};

const UNION_TERRITORIES = new Set([
  'andaman and nicobar islands',
  'andaman & nicobar islands',
  'andaman and nicobar',
  'chandigarh',
  'dadra and nagar haveli and daman and diu',
  'dadra & nagar haveli and daman & diu',
  'dadra and nagar haveli',
  'daman and diu',
  'delhi',
  'nct of delhi',
  'national capital territory of delhi',
  'jammu and kashmir',
  'jammu & kashmir',
  'ladakh',
  'lakshadweep',
  'puducherry',
  'pondicherry',
]);

export const isUnionTerritory = (stateTitle?: string | null): boolean => {
  if (!stateTitle) return false;
  const raw = String(stateTitle).trim().toLowerCase();
  if (/\b(ut|u\.t\.?|union territory)\b/i.test(raw)) return true;
  const clean = raw.replace(/\s*\((state|ut|u\.t\.?|union territory)\)/gi, '').trim();
  if (UNION_TERRITORIES.has(clean) || UNION_TERRITORIES.has(raw)) return true;
  return (
    clean.includes('andaman') ||
    clean.includes('nicobar') ||
    clean.includes('chandigarh') ||
    clean.includes('dadra') ||
    clean.includes('daman') ||
    clean.includes('diu') ||
    clean.includes('delhi') ||
    clean.includes('jammu') ||
    clean.includes('kashmir') ||
    clean.includes('ladakh') ||
    clean.includes('lakshadweep') ||
    clean.includes('puducherry') ||
    clean.includes('pondicherry')
  );
};

