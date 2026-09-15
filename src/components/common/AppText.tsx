import React from 'react';
import { Text as RNText, StyleProp, TextProps as RNTextProps, TextStyle } from 'react-native';
import { Colors } from '../../constants';
import { fs } from '../../utils/metrics';
import { TYPOGRAPHY } from '../../utils/typography';

export type TextVariant =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'subtitle'
  | 'body'
  | 'caption'
  | 'button'
  | 'label';

export type FontWeight = 'light' | 'regular' | 'medium' | 'semibold' | 'bold';

export interface AppTextProps extends RNTextProps {
  variant?: TextVariant;
  weight?: FontWeight;
  color?: string;
  align?: 'left' | 'center' | 'right' | 'justify';
  style?: StyleProp<TextStyle>;
  children: React.ReactNode;
}

export const AppText: React.FC<AppTextProps> = ({
  variant = 'body',
  weight,
  color = Colors.primaryFontColor || '#1E293B',
  align = 'left',
  style,
  children,
  ...props
}) => {
  const getVariantStyle = (): TextStyle => {
    switch (variant) {
      case 'h1':
        return { fontSize: fs(28), lineHeight: fs(34), ...TYPOGRAPHY.bold };
      case 'h2':
        return { fontSize: fs(22), lineHeight: fs(28), ...TYPOGRAPHY.bold };
      case 'h3':
        return { fontSize: fs(18), lineHeight: fs(24), ...TYPOGRAPHY.bold };
      case 'subtitle':
        return { fontSize: fs(16), lineHeight: fs(22), ...TYPOGRAPHY.medium };
      case 'body':
        return { fontSize: fs(15), lineHeight: fs(22), ...TYPOGRAPHY.regular };
      case 'caption':
        return { fontSize: fs(13), lineHeight: fs(18), ...TYPOGRAPHY.regular };
      case 'button':
        return { fontSize: fs(16), lineHeight: fs(22), ...TYPOGRAPHY.bold };
      case 'label':
        return { fontSize: fs(14), lineHeight: fs(20), ...TYPOGRAPHY.medium };
      default:
        return { fontSize: fs(15), lineHeight: fs(22), ...TYPOGRAPHY.regular };
    }
  };

  const getWeightStyle = (): TextStyle => {
    if (!weight) return {};
    switch (weight) {
      case 'light':
        return { ...TYPOGRAPHY.light };
      case 'medium':
        return { ...TYPOGRAPHY.medium };
      case 'semibold':
        return { ...TYPOGRAPHY.semiBold };
      case 'bold':
        return { ...TYPOGRAPHY.bold };
      case 'regular':
      default:
        return { ...TYPOGRAPHY.regular };
    }
  };

  return (
    <RNText
      style={[
        getVariantStyle(),
        getWeightStyle(),
        { color, textAlign: align },
        style,
      ]}
      {...props}
    >
      {children}
    </RNText>
  );
};
