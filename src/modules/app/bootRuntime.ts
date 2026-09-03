import type { FileCityMapRepository } from "../../platform/region/FileCityMapRepository";
import type { InstalledCity } from "../regions/cityPackTypes";
import { loadCatalogLocalFirst } from "../regions/localFirstCatalog";
import { downloadableParks, shouldRetireInstalled } from "../regions/parkProduct";
import { initializeRuntime } from "./initializeRuntime";
import { loadInstalledProgress } from "./loadInstalledProgress";
import type { RuntimeResources, RuntimeState } from "./runtimeTypes";

type SetState = (state: RuntimeState | ((current: RuntimeState) => RuntimeState)) => void;

export async function bootRuntime(
  repository: FileCityMapRepository,
  setState: SetState,
  resources: { current: RuntimeResources },
) {
  const [installed, active] = await prepareInstalledMaps(repository);
  const catalog = await loadCatalogLocalFirst(
    () => repository.loadCachedCatalog(),
    () => repository.loadCatalog(),
    (fresh) => setState((current) => ({
      ...current,
      maps: { ...current.maps, catalog: downloadableParks(fresh.cities) },
    })),
  );
  setState((current) => ({
    ...current,
    status: "loading",
    map: undefined,
    session: null,
    maps: { catalog: downloadableParks(catalog.cities), installed, active },
  }));
  const storedProgress = await loadInstalledProgress(installed);
  setState((current) => ({ ...current, progress: storedProgress }));
  await initializeRuntime(setState, resources, active, storedProgress);
}

async function prepareInstalledMaps(repository: FileCityMapRepository) {
  const bundled = await repository.ensureBundledOverview();
  const previous = await repository.getActive();
  for (const map of await repository.listInstalled()) {
    if (shouldRetireInstalled(map, bundled)) await repository.delete(map);
  }
  const installed = await repository.listInstalled();
  const previousPark = previous?.manifest.kind === "place"
    ? installed.find((map) => sameMap(map, previous)) : undefined;
  const active = previousPark ?? bundled;
  await repository.activate(active);
  return [installed, active] as const;
}

const sameMap = (left: InstalledCity, right: InstalledCity) =>
  left.manifest.id === right.manifest.id && left.manifest.version === right.manifest.version;
