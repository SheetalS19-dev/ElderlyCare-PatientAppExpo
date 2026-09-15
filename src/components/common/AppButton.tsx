import React from 'react';
import {
  ActivityIndicator,
  DimensionValue,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { Colors } from '../../constants';
import { fs, hs, ws } from '../../utils/metrics';
import { TYPOGRAPHY } from '../../utils/typography';

export interface AppButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  color?: string;
  titleColor?: string;
  titleFontSize?: number;
  height?: number;
  width?: DimensionValue;
  borderRadius?: number;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const AppButton: React.FC<AppButtonProps> = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  color = Colors.btnColor,
  titleColor = Colors.white,
  titleFontSize,
  height,
  width,
  borderRadius,
  style,
  textStyle,
}) => {
  const scaledHeight = height !== undefined ? height : hs(45);
  const scaledFontSize = titleFontSize !== undefined ? titleFontSize : fs(14);
  const scaledRadius = borderRadius !== undefined ? borderRadius : fs(8);

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: disabled ? Colors.disabled : color,
          height: scaledHeight,
          borderRadius: scaledRadius,
        },
        width !== undefined ? { width } : null,
        style,
      ]}
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={titleColor} size="small" />
      ) : (
        <Text
          style={[
            styles.title,
            {
              fontSize: scaledFontSize,
              color: titleColor,
            },
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: ws(16),
  },
  title: {
    ...TYPOGRAPHY.medium,
  },
});

