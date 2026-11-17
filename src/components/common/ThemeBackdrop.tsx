import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { Colors } from '../../constants';
import { fs, hs, ws } from '../../utils';

/** Full-bleed SVG linear gradient (no extra native dependency needed). */
export const GradientFill = memo(
  ({
    id,
    colors,
    x1 = '0',
    y1 = '0',
    x2 = '1',
    y2 = '1',
  }: {
    id: string;
    colors: readonly string[];
    x1?: string;
    y1?: string;
    x2?: string;
    y2?: string;
  }) => (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%">
        <Defs>
          <LinearGradient id={id} x1={x1} y1={y1} x2={x2} y2={y2}>
            {colors.map((c, i) => (
              <Stop
                key={`${id}-stop-${i}`}
                offset={`${(i / Math.max(1, colors.length - 1)) * 100}%`}
                stopColor={c}
                stopOpacity="1"
              />
            ))}
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
    </View>
  )
);

/** Navy -> teal gradient with soft wave layers. `decor` adds the plus / heart-pulse icons. */
export const HeaderBackdrop = memo(({ decor = true, id = 'themeHeaderGrad' }: { decor?: boolean; id?: string }) => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <GradientFill id={id} colors={Colors.headerGradient} />
    <Svg style={StyleSheet.absoluteFill} viewBox="0 0 360 190" preserveAspectRatio="none">
      <Path
        d="M0 118 C60 84 130 150 210 116 C275 88 325 96 360 70 L360 190 L0 190 Z"
        fill={Colors.white}
        fillOpacity={0.06}
      />
      <Path
        d="M0 146 C80 112 150 170 232 140 C292 118 336 126 360 108 L360 190 L0 190 Z"
        fill={Colors.white}
        fillOpacity={0.07}
      />
    </Svg>
    {decor && (
      <>
        <MaterialIcons
          name="add"
          size={fs(40)}
          color="rgba(150, 215, 245, 0.55)"
          style={{ position: 'absolute', top: hs(34), right: ws(74) }}
        />
        <MaterialCommunityIcons
          name="heart-pulse"
          size={fs(46)}
          color="rgba(255, 255, 255, 0.2)"
          style={{ position: 'absolute', top: hs(84), right: ws(22) }}
        />
      </>
    )}
  </View>
));
