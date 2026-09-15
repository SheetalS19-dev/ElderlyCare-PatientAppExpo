import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Colors } from '../constants';
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
  EditProfileScreen,
  FamilyMemberListScreen,
  FaqScreen,
  FullScreenImageViewerScreen,
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
  return (
    <NavigationContainer>
      <Stack.Navigator id="RootStack" initialRouteName="Main" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={DrawerNavigator} />
        <Stack.Screen name="Login" component={LoginScreen} />

        <Stack.Group screenOptions={screenOptions}>
          <Stack.Screen name="DoctorList" component={DoctorListScreen} />
          <Stack.Screen name="DoctorDetails" component={DoctorDetailsScreen} />
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

