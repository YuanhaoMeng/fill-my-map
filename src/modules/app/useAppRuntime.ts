import { useEffect, useRef, useState } from "react";
import type { ExclusionReason, SessionSummary } from "../../core/types";
import { FileCityMapRepository } from "../../platform/region/FileCityMapRepository";
import { GpxExporter } from "../history/GpxExporter";
import { trackFeature } from "../map/mapData";
import { withoutRawTrack } from "../share/shareSnapshot";
import type { CityCatalogEntry, InstalledCity } from "../regions/cityPackTypes";
import { initializeRuntime } from "./initializeRuntime";
import { loadInstalledProgress } from "./loadInstalledProgress";
import type { RuntimeResources, RuntimeState } from "./runtimeTypes";
export type { MapContent } from "./runtimeTypes";

const emptyMaps = { catalog: [], installed: [], active: null } as const;

export function useAppRuntime() {
  const [state, setState] = useState<RuntimeState>({
    status: "loading",
    session: null,
    progress: [],
    actionError: null,
    rewards: [],
    maps: emptyMaps,
  });
  const resources = useRef<RuntimeResources>({});
  const maps = useRef(new FileCityMapRepository());
  const [generation, setGeneration] = useState(0);

  useEffect(() => {
    let active = true;
    const currentResources: RuntimeResources = {};
    resources.current = currentResources;
    const holder = { current: currentResources };
    void boot(maps.current, (next) => active && setState(next), holder).catch(() => {
      if (active) setState((current) => ({ ...current, status: "error" }));
    });
    return () => {
      active = false;
      void currentResources.dispose?.();
    };
  }, [generation]);

  const reload = () => setGeneration((value) => value + 1);
  const start = async () => {
    setState((current) => ({
      ...current,
      userCoordinate: undefined,
      map: current.map ? withoutRawTrack(current.map) : current.map,
    }));
    await runAction(setState, () => resources.current.service?.start());
  };
  const stop = async () => runAction(setState, () => resources.current.service?.stop());
  const downloadMap = async (entry: CityCatalogEntry) => {
    await runAction(setState, async () => {
      const installed = await maps.current.download(entry, (downloadProgress) =>
        setState((current) => ({ ...current, maps: { ...current.maps, downloadProgress } })),
      );
      await prepareMapSwitch(setState);
      await maps.current.activate(installed);
      reload();
    });
  };
  const importMap = async () => {
    await runAction(setState, async () => {
      const installed = await maps.current.importFromPicker();
      if (installed) {
        await prepareMapSwitch(setState);
        await maps.current.activate(installed);
        reload();
      }
    });
  };
  const activateMap = async (city: InstalledCity) => {
    if (state.session) return;
    await prepareMapSwitch(setState);
    await maps.current.activate(city);
    reload();
  };
  const deleteMap = async (city: InstalledCity) => {
    if (state.session) return;
    await maps.current.delete(city);
    reload();
  };
  const openPlace = async (detailPackId: string) => {
    if (state.session) return;
    const local = state.maps.installed.find((item) => item.manifest.id === detailPackId);
    if (local) return activateMap(local);
    const entry = state.maps.catalog.find((item) => item.id === detailPackId);
    if (entry) await downloadMap(entry);
  };
  const exclude = async (edgeId: string, reason: ExclusionReason) => {
    await resources.current.progress?.exclude({ edgeId, reason, createdAt: Date.now() });
    await resources.current.refresh?.([edgeId]);
  };
  const undoExclusion = async (edgeId: string) => {
    await resources.current.progress?.undoExclusion(edgeId);
    await resources.current.refresh?.([edgeId]);
  };
  const listSessions = async () => resources.current.history?.listSessions() ?? [];
  const exportSession = async (session: SessionSummary) => {
    const points = await resources.current.history?.getTrack(session.id);
    if (points) await new GpxExporter().export(session, points);
  };
  const deleteTrack = async (id: string) => resources.current.history?.deleteTrack(id);
  const deleteAllTracks = async () => resources.current.history?.deleteAllTracks();
  const resetAllData = async () => {
    await resources.current.history?.resetAllData();
    await resources.current.refresh?.(undefined, true);
    const progress = await resources.current.loadProgress?.() ?? [];
    setState((current) => ({ ...current, progress, rewards: [] }));
  };
  const listMissing = async () => resources.current.listMissing?.() ?? [];
  const viewSession = async (session: SessionSummary) => {
    const points = await resources.current.history?.getTrack(session.id);
    if (points) setState((current) => ({
      ...current,
      map: current.map ? { ...current.map, history: trackFeature(points) } : current.map,
    }));
  };
  return {
    ...state,
    start,
    stop,
    downloadMap,
    importMap,
    activateMap,
    deleteMap,
    openPlace,
    exclude,
    undoExclusion,
    listSessions,
    exportSession,
    deleteTrack,
    deleteAllTracks,
    resetAllData,
    viewSession,
    listMissing,
  };
}

async function boot(
  repository: FileCityMapRepository,
  setState: (state: RuntimeState | ((current: RuntimeState) => RuntimeState)) => void,
  resources: { current: RuntimeResources },
) {
  const [installed, active, catalog] = await Promise.all([
    repository.listInstalled(),
    repository.getActive(),
    repository.loadCatalog().catch(() => ({ formatVersion: 1 as const, cities: [] })),
  ]);
  setState((current) => ({
    ...current,
    status: active ? "loading" : "needs-map",
    map: undefined,
    session: null,
    maps: { catalog: catalog.cities, installed, active },
  }));
  const storedProgress = await loadInstalledProgress(installed);
  setState((current) => ({ ...current, progress: storedProgress }));
  if (active) await initializeRuntime(setState, resources, active, storedProgress);
}

async function runAction(
  setState: (state: RuntimeState | ((current: RuntimeState) => RuntimeState)) => void,
  action: () => Promise<unknown> | undefined,
) {
  try {
    setState((current) => ({ ...current, actionError: null }));
    await action();
  } catch (error) {
    setState((current) => ({ ...current, actionError: error instanceof Error ? error.message : "unknown" }));
  }
}

async function prepareMapSwitch(
  setState: (state: RuntimeState | ((current: RuntimeState) => RuntimeState)) => void,
) {
  setState((current) => ({ ...current, status: "loading", map: undefined }));
  await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  await new Promise<void>((resolve) => setTimeout(resolve, 500));
}
