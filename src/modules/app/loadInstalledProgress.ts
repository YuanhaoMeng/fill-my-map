import type { CityProgress } from "../../core/types";
import { CityNetworkRepository } from "../../platform/database/CityNetworkRepository";
import { LocalProgressRepository } from "../../platform/database/LocalProgressRepository";
import type { InstalledCity } from "../regions/cityPackTypes";

export async function loadInstalledProgress(
  installed: readonly InstalledCity[],
): Promise<readonly CityProgress[]> {
  return Promise.all(installed.map(async (files) => {
    const network = await CityNetworkRepository.open(files.networkUri);
    try {
      const progress = await LocalProgressRepository.open(
        network,
        files.manifest.id,
        files.manifest.version,
      );
      return await progress.getCityProgress();
    } finally {
      await network.close();
    }
  }));
}
