## ElderlyCare Patient (React Native / Expo)

Mobile app built with Expo (`~57.0.12`), React Native (`0.86.2`), TypeScript, and React Navigation.

## Tech stack

- **React Native / TypeScript**: App UI and platform integration
- **Framework**: Expo SDK 57 (`expo-router` entry + React Navigation)
- **Navigation**: `@react-navigation/native-stack` + `@react-navigation/bottom-tabs` (custom tab bar)
- **State & Data Fetching**: Redux Toolkit + RTK Query (`useGetDoctorsQuery`, `useGetAppointmentsQuery`, `useGetVitalsQuery`, etc.) + AuthContext
- **UI & Design System**: Custom components (`AppButton`, `AppText`, `DoctorCard`, `AppointmentCard`, ...), dynamic metrics scaling (`ws`, `hs`, `fs`), `AppColors`, `TYPOGRAPHY`, and `AppImages`
- **Networking**: RTK Query & Axios (with auth token injection + centralized error mapping)
- **Config**: Expo Constants (`app.json`) & environment configuration
- **SVGs & Icons**: `react-native-svg` + `@expo/vector-icons`

## Requirements

- **Node.js**: `>= 18.0.0` (see `package.json` `engines.node`)
- **Package manager**: npm (repo includes `package-lock.json`)
- **iOS (macOS)**: Xcode + CocoaPods via Bundler (follow React Native setup)
- **Android**: Android Studio + SDK/Emulator (follow React Native environment setup)

If you’re setting up a machine from scratch, follow the official setup guides first:
- `https://docs.expo.dev/get-started/installation/`
- `https://reactnative.dev/docs/set-up-your-environment`

## First-time setup

Install JS deps:

```sh
npm install
```

Create environment file (required for API calls):

```sh
cp .env.example .env
```

Install iOS native deps:

```sh
cd ios && pod install && cd ..
```

## Run the app

Start Metro:

```sh
npx expo start -c
```

In a second terminal:

### iOS

```sh
npm run ios
```

### Android

```sh
npm run android
```

## Environment variables

This app uses Expo configuration. The `.env` file is **git-ignored** (see `.gitignore`).

- **`EXPO_PUBLIC_API_BASE_URL`**: API base URL used by services (`src/constants/apiEndpoints.ts`)

If you change `.env`, restart Metro with cache cleared (`npx expo start -c`).

## Project structure

High-level layout (most code lives in `src/`):

```text
App.tsx                      # Main application entry point (providers + context)
assets/
  fonts/                     # Bundled font assets (Poppins / Roboto)
  icons/                     # App icon PNGs & SVGs (see src/utils/appImages.ts)
  images/                    # PNG image assets
src/
  app/                       # Expo Router entry file
  components/                # Shared UI components (AppButton, AppText, DoctorCard, AppointmentCard, ...)
  constants/                 # Constants like colors, fonts, theme tokens, API endpoints
  context/                   # AuthContext & global providers
  i18n/                      # Localization setup & locale files
  interface/                 # Design system utilities (colors, metrics)
  navigation/                # Stack & Tab Navigation layout
  redux/                     # Store, RTK Query API endpoints, slices, hooks
  screens/                   # Feature screens (Auth, Home, Appointments, Vitals, Doctors, Clinics, Wallet, ...)
  services/                  # Native services & notification handlers
  types/                     # TypeScript data models and interfaces
  utils/                     # Storage, appColors, appImages, typography, metrics, date utilities, etc.
  validation/                # Schema validation helpers
```

## Common scripts

```sh
npm run start
npm run android
npm run ios
npm run lint
npm test
```

## Assets and SVGs

- **Images & Icons**: Centralized in `src/utils/appImages.ts` mapping assets under `assets/icons/` and `assets/images/`
- **App Colors**: `src/utils/appColors.ts` defines `Palette`, `AppColors`, `StaticColors`, and `LightTheme`/`DarkTheme` tokens
- **Typography**: Centralized text styles in `src/utils/typography.ts` (`TYPOGRAPHY` StyleSheet)
- **Responsive Metrics**: Dynamic scaling helpers in `src/utils/metrics.ts` (`ws`, `hs`, `fs`, `useResponsiveMetrics`)

## Troubleshooting

- **Metro cache**: Stop Metro and restart with `npx expo start -c`
- **TypeScript verification**: Run `npx tsc --noEmit` to verify type safety
- **Config/env changes**: After editing `.env`, clear Metro cache and rebuild
