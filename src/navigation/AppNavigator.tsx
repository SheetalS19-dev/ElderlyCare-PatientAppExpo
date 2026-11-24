import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Colors } from '../constants';
import { useAuth } from '../context/AuthContext';
import {
  AboutUsScreen,
  AppointmentDetailsScreen,
  BlogDetailScreen,
  BlogListScreen,
  BookAppointmentScreen,
  ClinicListScreen,
  ClinicScreen,
  ContactUsScreen,
  DoctorDetailsScreen,
  DoctorListScreen,
  DoctorReviewsScreen,
  EditProfileScreen,
  FamilyMemberListScreen,
  FaqScreen,
  FullScreenImageViewerScreen,
  HomeScreen,
  LoginScreen,
  MyBookingsScreen,
  NotificationDetailsScreen,
  NotificationScreen,
  PatientFileScreen,
  PrescriptionListScreen,
  PrivacyScreen,
  SearchScreen,
  ShareScreen,
  TermCondScreen,
  TestimonialScreen,
  VitalDetailsScreen,
  VitalsScreen,
  WalletScreen,
} from '../screens';
import { TYPOGRAPHY } from '../utils/typography';
import { DrawerNavigator } from './DrawerNavigator';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

const screenOptions = {
  headerStyle: { backgroundColor: Colors.appBarColor },
  headerTintColor: Colors.white,
  headerTitleStyle: { ...TYPOGRAPHY.medium },
};

export const AppNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primaryColor} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        id="RootStack"
        initialRouteName={isAuthenticated ? 'Main' : 'Login'}
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Main" component={DrawerNavigator} />

        <Stack.Group screenOptions={screenOptions}>
          <Stack.Screen name="DoctorList" component={DoctorListScreen} />
          <Stack.Screen name="DoctorDetails" component={DoctorDetailsScreen} />
          <Stack.Screen name="DoctorReviews" component={DoctorReviewsScreen} />
          <Stack.Screen name="BookAppointment" component={BookAppointmentScreen} />
          <Stack.Screen name="ClinicList" component={ClinicListScreen} />
          <Stack.Screen name="Clinic" component={ClinicScreen} />
          <Stack.Screen name="MyBookings" component={MyBookingsScreen} />
          <Stack.Screen name="AppointmentDetails" component={AppointmentDetailsScreen} />
          <Stack.Screen name="Wallet" component={WalletScreen} />
          <Stack.Screen name="EditProfile" component={EditProfileScreen} />
          <Stack.Screen name="Notification" component={NotificationScreen} />
          <Stack.Screen name="NotificationDetails" component={NotificationDetailsScreen} />
          <Stack.Screen name="Vitals" component={VitalsScreen} />
          <Stack.Screen name="VitalDetails" component={VitalDetailsScreen} />
          <Stack.Screen name="PrescriptionList" component={PrescriptionListScreen} />
          <Stack.Screen name="PatientFile" component={PatientFileScreen} />
          <Stack.Screen name="FamilyMemberList" component={FamilyMemberListScreen} />
          <Stack.Screen name="Testimonial" component={TestimonialScreen} />
          <Stack.Screen name="ContactUs" component={ContactUsScreen} />
          <Stack.Screen name="AboutUs" component={AboutUsScreen} />
          <Stack.Screen name="Faq" component={FaqScreen} />
          <Stack.Screen name="Privacy" component={PrivacyScreen} />
          <Stack.Screen name="TermCond" component={TermCondScreen} />
          <Stack.Screen name="Share" component={ShareScreen} />
          <Stack.Screen name="BlogList" component={BlogListScreen} />
          <Stack.Screen name="BlogDetail" component={BlogDetailScreen} />
          <Stack.Screen name="Search" component={SearchScreen} />
          <Stack.Screen name="FullScreenImageViewer" component={FullScreenImageViewerScreen} />
        </Stack.Group>
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.bgColor,
  },
});

