import { describe, expect, it } from "vitest";
import type {
  CoverageStateRepository,
  LocationRecorder,
  NetworkRepository,
  ProgressRepository,
  RewardRepository,
} from "../../core/contracts";
import type { TrackPoint, TravelMode } from "../../core/types";
import { ExplorationService } from "./ExplorationService";

class SyntheticRecorder implements LocationRecorder {
  private listener: ((points: readonly TrackPoint[]) => void) | null = null;
  permission = true;
  async requestPermission() { return this.permission; }
  async start() {}
  async stop() {}
  async isRecording() { return true; }
  subscribe(listener: (points: readonly TrackPoint[]) => void) {
    this.listener = listener;
    return () => { this.listener = null; };
  }
  emit(points: readonly TrackPoint[]) { this.listener?.(points); }
}

describe("two-hour synthetic exploration", () => {
  it("flushes every raw point and completes without a crash", async () => {
    const recorder = new SyntheticRecorder();
    const stored: TrackPoint[] = [];
    const visited = new Set<string>();
    let finalStatus = "";
    const progress: ProgressRepository & CoverageStateRepository = {
      async createSession(mode) {
        return { id: "synthetic", mode, startedAt: 0, endedAt: null, status: "active" };
      },
      async finishSession(_id, status) { finalStatus = status; },
      async appendTrack(points) { stored.push(...points); },
      async saveVisitedSamples(_version, _mode, ids) { ids.forEach((id) => visited.add(id)); },
      async getCityProgress(cityId, mode) {
        return { cityId, mode, completedEdges: 0, eligibleEdges: 1, excludedEdges: 0, percent: 0 };
      },
      async exclude() {},
      async undoExclusion() {},
      async recoverInterruptedSessions() {},
      async getEdgeStates() { return {}; },
    };
    const network: NetworkRepository = {
      async nearbySamples(point) {
        const id = String(Math.round((point.coordinate[0] + 84) * 1e7));
        return [{ id, edgeId: "synthetic-edge", coordinate: point.coordinate, edgeBearingDeg: 90, distanceM: 0 }];
      },
      async listEdges() { return []; },
    };
    const rewards: RewardRepository = {
      async unlockLandmark() {},
      async unlockCityCompletion() {},
      async listLandmarkUnlocks() { return []; },
      async listCityCompletionUnlocks() { return []; },
    };
    const service = new ExplorationService("test-v1", recorder, network, progress, rewards, () => {}, () => {});
    const track = twoHourTrack("walk");
    await service.start("walk");
    for (let offset = 0; offset < track.length; offset += 60) recorder.emit(track.slice(offset, offset + 60));
    await service.stop();
    expect(stored).toHaveLength(1_441);
    expect(visited.size).toBeGreaterThan(1_000);
    expect(finalStatus).toBe("completed");
  });

  it("can retry after location permission is denied", async () => {
    const recorder = new SyntheticRecorder();
    recorder.permission = false;
    let createdSessions = 0;
    const progress = testProgress(() => { createdSessions += 1; });
    const service = new ExplorationService(
      "test-v1",
      recorder,
      { async nearbySamples() { return []; }, async listEdges() { return []; } },
      progress,
      emptyRewards(),
      () => {},
      () => {},
    );
    await expect(service.start("walk")).rejects.toThrow("location_permission_denied");
    expect(createdSessions).toBe(0);
    recorder.permission = true;
    await service.start("walk");
    await service.stop();
    expect(createdSessions).toBe(1);
  });

  it("marks a session interrupted when queued persistence fails", async () => {
    const recorder = new SyntheticRecorder();
    let finalStatus = "";
    const progress = testProgress(() => {});
    progress.appendTrack = async () => { throw new Error("storage_failure"); };
    progress.finishSession = async (_id, status) => { finalStatus = status; };
    const service = new ExplorationService(
      "test-v1",
      recorder,
      { async nearbySamples() { return []; }, async listEdges() { return []; } },
      progress,
      emptyRewards(),
      () => {},
      () => {},
    );
    await service.start("walk");
    recorder.emit([twoHourTrack("walk")[0]!]);
    await expect(service.stop()).rejects.toThrow("storage_failure");
    expect(finalStatus).toBe("interrupted");
  });
});

function twoHourTrack(mode: TravelMode): TrackPoint[] {
  const latitude = 42.28;
  const longitudeStep = 5 / (111_320 * Math.cos((latitude * Math.PI) / 180));
  return Array.from({ length: 1_441 }, (_, index) => ({
    sessionId: "synthetic",
    recordedAt: index * 5_000,
    coordinate: [-83.75 + longitudeStep * index, latitude],
    accuracyM: 5,
    speedMps: mode === "walk" ? 1 : 10,
    headingDeg: 90,
  }));
}

function testProgress(onCreate: () => void): ProgressRepository & CoverageStateRepository {
  return {
    async createSession(mode) {
      onCreate();
      return { id: "retry", mode, startedAt: 0, endedAt: null, status: "active" };
    },
    async finishSession() {}, async appendTrack() {}, async saveVisitedSamples() {},
    async getCityProgress(cityId, mode) {
      return { cityId, mode, completedEdges: 0, eligibleEdges: 1, excludedEdges: 0, percent: 0 };
    },
    async exclude() {}, async undoExclusion() {}, async recoverInterruptedSessions() {},
    async getEdgeStates() { return {}; },
  };
}

function emptyRewards(): RewardRepository {
  return {
    async unlockLandmark() {}, async unlockCityCompletion() {},
    async listLandmarkUnlocks() { return []; }, async listCityCompletionUnlocks() { return []; },
  };
}
