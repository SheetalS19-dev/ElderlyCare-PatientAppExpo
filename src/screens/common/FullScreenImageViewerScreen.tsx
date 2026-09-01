import React, { useState } from 'react';
import { View, Image, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import type { RootStackParamList } from '../../navigation/types';
import { AppHeader } from '../../components';
import { Colors, ApiEndpoints } from '../../constants';

type Props = NativeStackScreenProps<RootStackParamList, 'FullScreenImageViewer'>;

export const FullScreenImageViewerScreen = ({ navigation, route }: Props) => {
  const { imageUrl, title } = route.params ?? {};

  const fullUrl = imageUrl?.startsWith('http')
    ? imageUrl
    : `${ApiEndpoints.imageUrl}/${imageUrl}`;

  return (
    <View style={styles.container}>
      <AppHeader title={title || 'Image Viewer'} onBackPress={() => navigation.goBack()} />

      <View style={styles.imageContainer}>
        {fullUrl ? (
          <Image source={{ uri: fullUrl }} style={styles.image} resizeMode="contain" />
        ) : (
          <Text style={styles.emptyText}>No image available</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  imageContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  image: { width: '100%', height: '100%' },
  emptyText: { color: Colors.white, fontSize: 16 },
});
