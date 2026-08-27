import type { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "Fill My Map",
  slug: "fill-my-map",
  version: "0.1.0",
  orientation: "portrait",
  userInterfaceStyle: "dark",
  scheme: "fillmymap",
  locales: { en: "./assets/locales/en.json", zh: "./assets/locales/zh.json" },
  assetBundlePatterns: ["assets/locales/*"],
  ios: {
    bundleIdentifier: "app.fillmymap.mobile",
    supportsTablet: false,
    infoPlist: { UIBackgroundModes: ["location"], CFBundleLocalizations: ["en", "zh"] },
  },
  android: { package: "app.fillmymap.mobile" },
  plugins: [
    "@maplibre/maplibre-react-native",
    "expo-sharing",
    ["expo-build-properties", { ios: { deploymentTarget: "17.0" } }],
    ["expo-sqlite", { ios: { customBuildFlags: "-DSQLITE_ENABLE_RTREE=1" } }],
    [
      "expo-location",
      {
        isIosBackgroundLocationEnabled: true,
        locationWhenInUsePermission: "Allow Fill My Map to record streets you explore.",
        locationAlwaysAndWhenInUsePermission:
          "Allow Fill My Map to keep recording an active exploration while your phone is locked.",
      },
    ],
  ],
};

export default config;
