import React from 'react';
import { Text as RNText, TextStyle, StyleProp, TextProps as RNTextProps } from 'react-native';
import { fs } from '../../utils/metrics';
import { Colors, Typography } from '../../constants';

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
        return { fontSize: fs(28), lineHeight: fs(34), fontFamily: Typography.fontFamily.bold };
      case 'h2':
        return { fontSize: fs(22), lineHeight: fs(28), fontFamily: Typography.fontFamily.bold };
      case 'h3':
        return { fontSize: fs(18), lineHeight: fs(24), fontFamily: Typography.fontFamily.bold };
      case 'subtitle':
        return { fontSize: fs(16), lineHeight: fs(22), fontFamily: Typography.fontFamily.medium };
      case 'body':
        return { fontSize: fs(15), lineHeight: fs(22), fontFamily: Typography.fontFamily.regular };
      case 'caption':
        return { fontSize: fs(13), lineHeight: fs(18), fontFamily: Typography.fontFamily.regular };
      case 'button':
        return { fontSize: fs(16), lineHeight: fs(22), fontFamily: Typography.fontFamily.bold };
      case 'label':
        return { fontSize: fs(14), lineHeight: fs(20), fontFamily: Typography.fontFamily.medium };
      default:
        return { fontSize: fs(15), lineHeight: fs(22), fontFamily: Typography.fontFamily.regular };
    }
  };

  const getWeightStyle = (): TextStyle => {
    if (!weight) return {};
    switch (weight) {
      case 'light':
        return { fontFamily: Typography.fontFamily.light };
      case 'medium':
        return { fontFamily: Typography.fontFamily.medium };
      case 'semibold':
      case 'bold':
        return { fontFamily: Typography.fontFamily.bold };
      case 'regular':
      default:
        return { fontFamily: Typography.fontFamily.regular };
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
