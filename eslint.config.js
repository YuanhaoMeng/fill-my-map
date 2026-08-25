import { defineConfig } from "eslint/config";
import expoConfig from "eslint-config-expo/flat.js";

export default defineConfig([
  ...expoConfig,
  {
    ignores: ["node_modules/**", "ios/**", "android/**", "dist/**", "assets/regions/**/*.json"],
    rules: { "import/order": "off" },
  },
]);
