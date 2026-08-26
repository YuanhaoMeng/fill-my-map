import type { CoverageStateRepository, LocationRecorder, NetworkRepository, ProgressRepository, RewardRepository } from "../../core/contracts";
import type { CityProgress, Coordinate, TrackingSession, TrackPoint, TravelMode } from "../../core/types";
import { DefaultCoverageMatcher } from "../coverage/DefaultCoverageMatcher";
import { DefaultRewardEngine } from "../rewards/DefaultRewardEngine";
import { cleanTrack } from "../coverage/cleanTrack";

export interface ExplorationUpdate {
  session: TrackingSession | null;
  progress: readonly CityProgress[];
}

export class ExplorationService {
  private session: TrackingSession | null = null;
  private unsubscribe: (() => void) | null = null;
  private pending = Promise.resolve();
  private processingError: unknown = null;
  private lastProgress: readonly CityProgress[] = [];
  private lastPoint: TrackPoint | null = null;

  constructor(
    private readonly regionVersion: string,
    private readonly recorder: LocationRecorder,
    private readonly network: NetworkRepository,
    private readonly progress: ProgressRepository & CoverageStateRepository,
    private readonly rewards: RewardRepository,
    private readonly onUpdate: (update: ExplorationUpdate) => void,
    private readonly onCoverage: (edgeIds: readonly string[]) => Promise<void> | void,
    private readonly onLocation: (coordinate: Coordinate) => void = () => undefined,
  ) {}

  async start(mode: TravelMode) {
    if (this.session) return;
    if (!(await this.recorder.requestPermission())) throw new Error("location_permission_denied");
    this.session = await this.progress.createSession(mode);
    this.unsubscribe = this.recorder.subscribe((points) => {
      this.pending = this.pending.then(async () => {
        if (this.processingError) return;
        try {
          await this.process(points);
        } catch (error) {
          this.processingError = error;
          console.error("Exploration processing failed", error);
        }
      });
    });
    try {
      await this.recorder.start(this.session.id);
      await this.emitProgress();
    } catch (error) {
      await this.recorder.stop().catch(() => undefined);
      await this.progress.finishSession(this.session.id, "interrupted");
      this.clear();
      throw error;
    }
  }

  async stop() {
    if (!this.session) return;
    let failure: unknown = null;
    try {
      await this.recorder.stop();
    } catch (error) {
      failure = error;
    }
    await this.pending;
    failure ??= this.processingError;
    try {
      await this.progress.finishSession(this.session.id, failure ? "interrupted" : "completed");
    } catch (error) {
      failure ??= error;
    }
    this.clear();
    this.onUpdate({ session: null, progress: this.lastProgress });
    if (failure) throw failure;
  }

  private async process(points: readonly TrackPoint[]) {
    if (!this.session || !points.length) return;
    await this.progress.appendTrack(points);
    const cleaned = cleanTrack(points, this.session.mode).points;
    const latest = cleaned.at(-1);
    if (latest) this.onLocation(latest.coordinate);
    const matchPoints = this.lastPoint ? [this.lastPoint, ...points] : points;
    this.lastPoint = points.at(-1) ?? this.lastPoint;
    const match = await new DefaultCoverageMatcher().match(matchPoints, this.session.mode, (point) =>
      this.network.nearbySamples(point, this.session!.mode),
    );
    await this.progress.saveVisitedSamples(this.regionVersion, this.session.mode, match.visitedSampleIds);
    if (match.matchedEdgeIds.length) await this.onCoverage(match.matchedEdgeIds);
    const reward = new DefaultRewardEngine();
    for (const landmarkId of reward.unlockedLandmarks(cleaned)) {
      await this.rewards.unlockLandmark({ landmarkId, unlockedAt: Date.now(), sessionId: this.session.id });
    }
    await this.emitProgress();
  }

  private async emitProgress() {
    if (!this.session) return;
    const mode = this.session.mode;
    const progress = await Promise.all([
      this.progress.getCityProgress("ann-arbor", mode),
      this.progress.getCityProgress("ypsilanti", mode),
    ]);
    this.lastProgress = progress;
    const reward = new DefaultRewardEngine();
    for (const item of progress.filter((candidate) => reward.cityCompleted(candidate))) {
      await this.rewards.unlockCityCompletion({
        cityId: item.cityId,
        mode: item.mode,
        unlockedAt: Date.now(),
        sessionId: this.session.id,
      });
    }
    this.onUpdate({ session: this.session, progress });
  }

  private clear() {
    this.unsubscribe?.();
    this.unsubscribe = null;
    this.session = null;
    this.lastPoint = null;
    this.processingError = null;
    this.pending = Promise.resolve();
  }
}
