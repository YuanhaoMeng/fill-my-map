import { CityNetworkRepository } from "../../platform/database/CityNetworkRepository";
import { cityBoundaryFeatures, edgeFeatures, landmarkFeatures, partialCoverageFeatures, placeFeatures } from "../map/mapData";
import { offlineStyle } from "../map/offlineStyle";
import type { InstalledCity } from "../regions/cityPackTypes";
import type { RuntimeResources, RuntimeState } from "./runtimeTypes";

type SetState = (state: RuntimeState | ((current: RuntimeState) => RuntimeState)) => void;

export async function initializeOverviewRuntime(
  setState: SetState,
  resources: { current: RuntimeResources },
  files: InstalledCity,
) {
  const network = await CityNetworkRepository.open(files.networkUri);
  const places = await network.listPlaces();
  resources.current.dispose = () => network.close();
  setState((current) => ({
    ...current,
    status: "ready",
    session: null,
    actionError: null,
    rewards: [],
    userCoordinate: undefined,
    map: {
      bounds: files.manifest.bounds,
      style: offlineStyle(files.basemapUri),
      boundaries: cityBoundaryFeatures([]),
      edges: edgeFeatures([]),
      partialCoverage: partialCoverageFeatures([]),
      landmarks: landmarkFeatures([]),
      places: placeFeatures(places),
      detailPlaces: placeFeatures(places, true),
    },
  }));
}
