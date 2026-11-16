import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Platform, StatusBar, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants';
import { HeaderBackdrop } from './ThemeBackdrop';
import { fs, hs, ws } from '../../utils/metrics';
import { TYPOGRAPHY } from '../../utils/typography';

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
  // Default header gets the navy -> teal gradient; a custom backgroundColor stays solid.
  const useGradient = backgroundColor === Colors.appBarColor;
  const paddingTop = Math.max(insets.top, Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0);

  return (
    <View
      style={[
        { backgroundColor, paddingTop },
        useGradient && styles.gradientShell,
        style,
      ]}
    >
      {useGradient && <HeaderBackdrop decor={false} id="appHeaderGrad" />}
      <StatusBar barStyle="light-content" backgroundColor={Colors.navy} />
      <View style={styles.headerContent}>
        {onBackPress ? (
          <TouchableOpacity style={styles.backBtn} onPress={onBackPress} activeOpacity={0.7}>
            <MaterialIcons name="arrow-back" size={fs(24)} color={Colors.white} />
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
    height: hs(60),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ws(16),
  },
  gradientShell: {
    borderBottomLeftRadius: fs(24),
    borderBottomRightRadius: fs(24),
    overflow: 'hidden',
  },
  backBtn: {
    width: ws(36),
    height: ws(36),
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtnText: {
    color: Colors.white,
    fontSize: fs(28),
    lineHeight: fs(28),
  },
  title: {
    flex: 1,
    textAlign: 'center',
    color: Colors.white,
    ...TYPOGRAPHY.semiBold,
    fontSize: fs(17),
  },
  placeholder: {
    width: ws(36),
  },
  rightContainer: {
    minWidth: ws(36),
    alignItems: 'flex-end',
  },
});

