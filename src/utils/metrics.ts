import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

// Baseline guideline dimensions based on standard mobile viewport (375x812)
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

/**
 * Horizontal scaling helper
 * Use for width, paddingHorizontal, marginHorizontal, left, right, etc.
 */
const horizontalScale = (size: number): number => (width / guidelineBaseWidth) * size;

/**
 * Vertical scaling helper
 * Use for height, paddingVertical, marginVertical, top, bottom, etc.
 */
const verticalScale = (size: number): number => (height / guidelineBaseHeight) * size;

/**
 * Moderate scaling helper
 * Use for fontSize, borderRadius, icons, and elements where scaling should be dampened.
 */
const moderateScale = (size: number, factor = 0.5): number =>
  Math.round(size + (horizontalScale(size) - size) * factor);

export {
  horizontalScale as ws,
  verticalScale as hs,
  moderateScale as fs,
  width as screenWidth,
  height as screenHeight,
};
