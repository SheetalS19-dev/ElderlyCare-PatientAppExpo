import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  DimensionValue,
} from 'react-native';
import { Colors, Typography } from '../../constants';

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
  titleFontSize = Typography.fontSize.base,
  height = 45,
  width,
  borderRadius = 8,
  style,
  textStyle,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: disabled ? Colors.disabled : color,
          height,
          borderRadius,
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
              fontSize: titleFontSize,
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
    paddingHorizontal: 16,
  },
  title: {
    fontFamily: Typography.fontFamily.medium,
    fontWeight: '500',
  },
});
