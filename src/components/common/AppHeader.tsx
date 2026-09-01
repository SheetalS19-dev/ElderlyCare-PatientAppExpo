import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, StatusBar, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography } from '../../constants';

export interface AppHeaderProps {
  title?: string;
  onBackPress?: () => void;
  rightComponent?: React.ReactNode;
  rightIcon?: React.ReactNode;
  backgroundColor?: string;
  style?: ViewStyle;
}

export const AppHeader = (props: AppHeaderProps) => {
  const {
    title = '',
    onBackPress,
    rightComponent,
    rightIcon,
    backgroundColor = Colors.appBarColor,
    style,
  } = props;

  const insets = useSafeAreaInsets();
  const paddingTop = Math.max(insets.top, Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0);

  return (
    <View style={[{ backgroundColor, paddingTop }, style]}>
      <StatusBar barStyle="light-content" backgroundColor={backgroundColor} />
      <View style={styles.headerContent}>
        {onBackPress ? (
          <TouchableOpacity style={styles.backBtn} onPress={onBackPress} activeOpacity={0.7}>
            <Text style={styles.backBtnText}>‹</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}

        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>

        <View style={styles.rightContainer}>{rightComponent ?? rightIcon ?? <View style={styles.placeholder} />}</View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContent: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtnText: {
    color: Colors.white,
    fontSize: 28,
    lineHeight: 28,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    color: Colors.white,
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.medium,
    fontWeight: '500',
  },
  placeholder: {
    width: 36,
  },
  rightContainer: {
    minWidth: 36,
    alignItems: 'flex-end',
  },
});
