import { useEffect, useRef, useState } from "react";
import type {
  ExclusionReason,
  SessionSummary,
  TravelMode,
} from "../../core/types";
import { GpxExporter } from "../history/GpxExporter";
import { trackFeature } from "../map/mapData";
import { initializeRuntime } from "./initializeRuntime";
import type { RuntimeResources, RuntimeState } from "./runtimeTypes";
export type { MapContent } from "./runtimeTypes";

export function useAppRuntime() {
  const [state, setState] = useState<RuntimeState>({
    status: "loading",
    session: null,
    progress: [],
    actionError: null,
    rewards: [],
  });
  const resources = useRef<RuntimeResources>({});
  useEffect(() => {
    let active = true;
    void initializeRuntime((next) => active && setState(next), resources).catch(() => {
      if (active) setState((current) => ({ ...current, status: "error" }));
    });
    return () => {
      active = false;
    };
  }, []);

  const start = async (mode: TravelMode) => {
    try {
      setState((current) => ({ ...current, actionError: null, userCoordinate: undefined }));
      await resources.current.service?.start(mode);
    } catch (error) {
      setState((current) => ({ ...current, actionError: error instanceof Error ? error.message : "unknown" }));
    }
  };
  const stop = async () => {
    try {
      await resources.current.service?.stop();
    } catch (error) {
      setState((current) => ({
        ...current,
        actionError: error instanceof Error ? error.message : "unknown",
      }));
    }
  };
  const exclude = async (edgeId: string, mode: TravelMode, reason: ExclusionReason) => {
    await resources.current.progress?.exclude({ edgeId, mode, reason, createdAt: Date.now() });
    await resources.current.refresh?.([edgeId]);
  };
  const undoExclusion = async (edgeId: string, mode: TravelMode) => {
    await resources.current.progress?.undoExclusion(edgeId, mode);
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
  const listMissing = async (cityId: string, mode: TravelMode) =>
    resources.current.listMissing?.(cityId, mode) ?? [];
  const viewSession = async (session: SessionSummary) => {
    const points = await resources.current.history?.getTrack(session.id);
    if (points) {
      setState((current) => ({
        ...current,
        map: current.map
          ? { ...current.map, history: trackFeature(points), historyMode: session.mode }
          : current.map,
      }));
    }
  };
  return {
    ...state,
    start,
    stop,
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
