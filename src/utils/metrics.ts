import { Dimensions, useWindowDimensions } from 'react-native';

// Baseline guideline dimensions based on standard mobile viewport (375x812)
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

/**
 * Dynamic getter for current window dimensions
 */
export const getWindowDimensions = () => Dimensions.get('window');

/**
 * Horizontal scaling helper
 * Dynamically queries current window width so values are never stale.
 * Use for width, paddingHorizontal, marginHorizontal, left, right, etc.
 */
export const horizontalScale = (size: number): number => {
  const { width } = Dimensions.get('window');
  return (width / guidelineBaseWidth) * size;
};

/**
 * Vertical scaling helper
 * Dynamically queries current window height so values are never stale.
 * Use for height, paddingVertical, marginVertical, top, bottom, etc.
 */
export const verticalScale = (size: number): number => {
  const { height } = Dimensions.get('window');
  return (height / guidelineBaseHeight) * size;
};

/**
 * Moderate scaling helper
 * Dynamically queries current dimensions.
 * Use for fontSize, borderRadius, icons, and elements where scaling should be dampened.
 */
export const moderateScale = (size: number, factor = 0.5): number =>
  Math.round(size + (horizontalScale(size) - size) * factor);

/**
 * Dynamic getters for screen dimensions (always live)
 */
export const getScreenWidth = (): number => Dimensions.get('window').width;
export const getScreenHeight = (): number => Dimensions.get('window').height;

/**
 * Custom React Hook for reactive responsive metrics inside components
 */
export const useResponsiveMetrics = () => {
  const { width, height } = useWindowDimensions();

  const ws = (size: number) => (width / guidelineBaseWidth) * size;
  const hs = (size: number) => (height / guidelineBaseHeight) * size;
  const fs = (size: number, factor = 0.5) => Math.round(size + (ws(size) - size) * factor);

  return {
    width,
    height,
    ws,
    hs,
    fs,
    isTablet: width >= 768,
  };
};

export {
  horizontalScale as ws,
  verticalScale as hs,
  moderateScale as fs,
};


