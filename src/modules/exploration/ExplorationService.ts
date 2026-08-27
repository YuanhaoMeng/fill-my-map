import type { CoverageStateRepository, LocationRecorder, NetworkRepository, ProgressRepository, RewardEngine, RewardRepository } from "../../core/contracts";
import type { CityProgress, Coordinate, TrackingSession, TrackPoint } from "../../core/types";
import { DefaultCoverageMatcher } from "../coverage/DefaultCoverageMatcher";
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
    private readonly cityId: string,
    private readonly recorder: LocationRecorder,
    private readonly network: NetworkRepository,
    private readonly progress: ProgressRepository & CoverageStateRepository,
    private readonly rewards: RewardRepository,
    private readonly rewardEngine: RewardEngine,
    private readonly onUpdate: (update: ExplorationUpdate) => void,
    private readonly onCoverage: (edgeIds: readonly string[]) => Promise<void> | void,
    private readonly onLocation: (coordinate: Coordinate) => void = () => undefined,
  ) {}

  async start() {
    if (this.session) return;
    if (!(await this.recorder.requestPermission())) throw new Error("location_permission_denied");
    this.session = await this.progress.createSession();
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
    const cleaned = cleanTrack(points).points;
    const latest = cleaned.at(-1);
    if (latest) this.onLocation(latest.coordinate);
    const matchPoints = this.lastPoint ? [this.lastPoint, ...points] : points;
    this.lastPoint = points.at(-1) ?? this.lastPoint;
    const match = await new DefaultCoverageMatcher().match(matchPoints, (point) =>
      this.network.nearbySamples(point),
    );
    await this.progress.saveVisitedSamples(match.visitedSampleIds);
    if (match.matchedEdgeIds.length) await this.onCoverage(match.matchedEdgeIds);
    for (const landmarkId of this.rewardEngine.unlockedLandmarks(cleaned)) {
      await this.rewards.unlockLandmark({ cityId: this.cityId, landmarkId, unlockedAt: Date.now(), sessionId: this.session.id });
    }
    await this.emitProgress();
  }

  private async emitProgress() {
    if (!this.session) return;
    const progress = [await this.progress.getCityProgress()];
    this.lastProgress = progress;
    for (const item of progress.filter((candidate) => this.rewardEngine.cityCompleted(candidate))) {
      await this.rewards.unlockCityCompletion({
        cityId: item.cityId,
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
