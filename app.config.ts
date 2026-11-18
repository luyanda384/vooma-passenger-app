import type { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "Vooma Passenger",
  slug: "vooma-passenger-app",
  scheme: "vooma-passenger",
  version: "0.1.0",
  orientation: "default",
  userInterfaceStyle: "light",
  icon: "./assets/brand/icon.png",
  backgroundColor: "#FFFFFF",
  ios: { supportsTablet: true, bundleIdentifier: "com.vooma.passenger" },
  android: {
    package: "com.vooma.passenger",
    adaptiveIcon: {
      foregroundImage: "./assets/brand/adaptive-foreground.png",
      backgroundColor: "#203147",
    },
    blockedPermissions: [
      "android.permission.ACCESS_BACKGROUND_LOCATION",
      "android.permission.FOREGROUND_SERVICE_LOCATION",
    ],
  },
  plugins: [
    "expo-web-browser",
    "expo-secure-store",
    [
      "expo-splash-screen",
      {
        backgroundColor: "#FFFFFF",
        android: {
          image: "./assets/brand/entry-splash.png",
          imageWidth: 180,
          resizeMode: "contain",
        },
        ios: { backgroundColor: "#FFFFFF" },
      },
    ],
    "expo-font",
    [
      "expo-location",
      {
        locationWhenInUsePermission:
          "Allow Vooma Passenger to use your location to set your pickup point.",
        isIosBackgroundLocationEnabled: false,
        isAndroidBackgroundLocationEnabled: false,
        isAndroidForegroundServiceEnabled: false,
      },
    ],
  ],
  web: {
    bundler: "metro",
    name: "Vooma Passenger",
    favicon: "./assets/brand/icon.png",
  },
};
export default config;
