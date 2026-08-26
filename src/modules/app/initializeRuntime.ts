import type { CoverageVisualState, RewardState, TravelMode } from "../../core/types";
import { BundledNetworkRepository } from "../../platform/database/BundledNetworkRepository";
import { LocalCoverageStatusRepository } from "../../platform/database/LocalCoverageStatusRepository";
import { LocalProgressRepository } from "../../platform/database/LocalProgressRepository";
import { LocalRewardRepository } from "../../platform/database/LocalRewardRepository";
import { LocalTrackHistoryRepository } from "../../platform/database/LocalTrackHistoryRepository";
import { ExpoLocationRecorder } from "../../platform/location/ExpoLocationRecorder";
import { BundledRegionRepository } from "../../platform/region/BundledRegionRepository";
import { ExplorationService } from "../exploration/ExplorationService";
import { cityBoundaryFeatures, edgeFeatures, landmarkFeatures, partialCoverageFeatures } from "../map/mapData";
import { offlineStyle } from "../map/offlineStyle";
import type { RuntimeResources, RuntimeState } from "./runtimeTypes";

type SetState = (state: RuntimeState | ((current: RuntimeState) => RuntimeState)) => void;

export async function initializeRuntime(setState: SetState, resources: { current: RuntimeResources }) {
  const files = await new BundledRegionRepository().loadBundled();
  const network = await BundledNetworkRepository.open(files.manifest.version);
  const progress = await LocalProgressRepository.open(network, files.manifest.version);
  const history = await LocalTrackHistoryRepository.open();
  const rewards = await LocalRewardRepository.open(files.manifest.version);
  const status = await LocalCoverageStatusRepository.open(files.manifest.version);
  const recorder = new ExpoLocationRecorder();
  if (await recorder.isRecording()) await recorder.stop();
  await progress.recoverInterruptedSessions();
  const loadProgress = () => Promise.all([
    progress.getCityProgress("ann-arbor", "walk"),
    progress.getCityProgress("ypsilanti", "walk"),
    progress.getCityProgress("ann-arbor", "drive"),
    progress.getCityProgress("ypsilanti", "drive"),
  ]);
  const [annArbor, ypsilanti, landmarks, boundaries, states, segments, initialProgress] = await Promise.all([
    network.listEdges("ann-arbor"),
    network.listEdges("ypsilanti"),
    network.listLandmarks(),
    network.listCityBoundaries(),
    progress.getEdgeStates(),
    progress.getCoverageSegments(),
    loadProgress(),
  ]);
  const edges = [...annArbor, ...ypsilanti];
  const visualStates: Record<string, CoverageVisualState> = { ...states };
  const visualSegments = new Map(segments.map((segment) => [segment.id, segment]));
  const map = {
    style: offlineStyle(files.basemapUri),
    boundaries: cityBoundaryFeatures(boundaries),
    edges: edgeFeatures(edges, visualStates),
    partialCoverage: partialCoverageFeatures([...visualSegments.values()]),
    landmarks: landmarkFeatures(landmarks),
  };
  const updateMap = (
    ids: readonly string[] | undefined,
    changed: Readonly<Record<string, CoverageVisualState>>,
    changedSegments: typeof segments,
    reset = false,
  ) => {
    if (reset) Object.keys(visualStates).forEach((key) => delete visualStates[key]);
    if (reset) visualSegments.clear();
    if (ids) {
      const affected = new Set(ids);
      ids.forEach((id) => delete visualStates[id]);
      visualSegments.forEach((segment, id) => {
        if (affected.has(segment.edgeId)) visualSegments.delete(id);
      });
    }
    Object.assign(visualStates, changed);
    changedSegments.forEach((segment) => visualSegments.set(segment.id, segment));
    setState((current) => ({
      ...current,
      map: {
        ...map,
        edges: edgeFeatures(edges, visualStates),
        partialCoverage: partialCoverageFeatures([...visualSegments.values()]),
      },
    }));
  };
  const loadRewards = async () => rewardsFrom(
    await rewards.listLandmarkUnlocks(),
    await rewards.listCityCompletionUnlocks(),
    landmarks,
  );
  resources.current.progress = progress;
  resources.current.history = history;
  resources.current.loadProgress = loadProgress;
  resources.current.refresh = async (ids, reset) => {
    const [changed, changedSegments] = await Promise.all([
      progress.getEdgeStates(ids),
      progress.getCoverageSegments(ids),
    ]);
    updateMap(ids, changed, changedSegments, reset);
  };
  resources.current.refreshRewards = async () => {
    const rewards = await loadRewards();
    setState((current) => ({ ...current, rewards }));
  };
  resources.current.listMissing = async (cityId, mode) => {
    const edgeStatus = await status.getModeEdgeStatus(mode);
    const unavailable = new Set([...edgeStatus.completed, ...edgeStatus.excluded]);
    return edges
      .filter((edge) => edge.cityId === cityId && edge.modes.includes(mode) && !unavailable.has(edge.id))
      .map(({ id, name }) => ({ id, name }))
      .sort((a, b) => (a.name ?? a.id).localeCompare(b.name ?? b.id));
  };
  resources.current.service = new ExplorationService(
    files.manifest.version,
    recorder,
    network,
    progress,
    rewards,
    ({ session, progress: changed }) => {
      setState((current) => ({
        ...current,
        session,
        userCoordinate: session ? current.userCoordinate : undefined,
        progress: [...current.progress.filter((item) => item.mode !== changed[0]?.mode), ...changed],
      }));
      void resources.current.refreshRewards?.();
    },
    async (ids) => resources.current.refresh?.(ids),
    (coordinate) => setState((current) => ({ ...current, userCoordinate: coordinate })),
  );
  setState({
    status: "ready",
    map,
    session: null,
    progress: initialProgress,
    actionError: null,
    rewards: await loadRewards(),
  });
}

function rewardsFrom(
  unlocks: readonly { landmark_id: string; unlocked_at: number; session_id: string }[],
  completions: readonly { city_id: string; mode: TravelMode; unlocked_at: number; session_id: string }[],
  landmarks: readonly { id: string; name: string; cityId: string }[],
): RewardState[] {
  const landmarkRewards: RewardState[] = unlocks.flatMap((unlock) => {
    const landmark = landmarks.find((item) => item.id === unlock.landmark_id);
    return landmark
      ? [{ kind: "landmark", landmarkId: unlock.landmark_id, unlockedAt: unlock.unlocked_at, sessionId: unlock.session_id, ...landmark }]
      : [];
  });
  return [
    ...completions.map((item): RewardState => ({
      kind: "city",
      cityId: item.city_id,
      mode: item.mode,
      unlockedAt: item.unlocked_at,
      sessionId: item.session_id,
    })),
    ...landmarkRewards,
  ].sort((a, b) => b.unlockedAt - a.unlockedAt);
}
