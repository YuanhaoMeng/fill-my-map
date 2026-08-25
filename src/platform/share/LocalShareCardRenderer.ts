import type { RefObject } from "react";
import type { View } from "react-native";
import { captureRef } from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import type { ShareCardRenderer } from "../../core/contracts";
import type { CityProgress } from "../../core/types";

export class LocalShareCardRenderer implements ShareCardRenderer {
  constructor(private readonly cardRef: RefObject<View | null>) {}

  async renderProgress(_progress: CityProgress) {
    return this.render();
  }

  async render() {
    return captureRef(this.cardRef, { format: "png", quality: 1, result: "tmpfile" });
  }

  async share(imageUri: string) {
    await Sharing.shareAsync(imageUri, {
      mimeType: "image/png",
      UTI: "public.png",
      dialogTitle: "Share Fill My Map progress",
    });
  }
}
