import type { SQLiteDatabase } from "expo-sqlite";
import type { CoverageCatalog } from "../../core/contracts";
import type { CoverageSegment, CoverageVisualState } from "../../core/types";
import { coverageSegments, type VisitedSampleRow } from "../../modules/coverage/coverageSegments";
import { visualState } from "./visualState";

export class LocalCoverageStateReader {
  constructor(
    private readonly database: SQLiteDatabase,
    private readonly catalog: CoverageCatalog,
    private readonly cityId: string,
    private readonly regionVersion: string,
  ) {}

  async getEdgeStates(ids?: readonly string[]) {
    const { clause, params } = edgeFilter(ids);
    const progress = await this.database.getAllAsync<{ edge_id: string }>(
      `SELECT edge_id FROM edge_progress WHERE city_id=? AND region_version=? AND completed=1${clause}`,
      this.cityId,
      this.regionVersion,
      ...params,
    );
    const exclusions = await this.database.getAllAsync<{ edge_id: string }>(
      `SELECT edge_id FROM exclusions WHERE city_id=?${clause}`,
      this.cityId,
      ...params,
    );
    const flags = new Map<string, Set<string>>();
    progress.forEach((row) => addFlag(flags, row.edge_id, "explored"));
    exclusions.forEach((row) => addFlag(flags, row.edge_id, "excluded"));
    return Object.fromEntries(
      [...flags].map(([id, modes]) => [id, visualState(modes)]),
    ) as Readonly<Record<string, CoverageVisualState>>;
  }

  async getCoverageSegments(ids?: readonly string[]): Promise<readonly CoverageSegment[]> {
    if (ids && !ids.length) return [];
    const { clause, params } = edgeFilter(ids);
    const rows = await this.database.getAllAsync<VisitedSampleRow>(
      `SELECT sample_id, edge_id FROM visited_samples WHERE city_id=? AND region_version=?${clause}`,
      this.cityId,
      this.regionVersion,
      ...params,
    );
    const samples = await this.catalog.resolveSamples([...new Set(rows.map((row) => row.sample_id))]);
    return coverageSegments(rows, samples);
  }
}

function edgeFilter(ids?: readonly string[]) {
  return ids?.length
    ? { clause: ` AND edge_id IN (${ids.map(() => "?").join(",")})`, params: [...ids] }
    : { clause: "", params: [] as string[] };
}

function addFlag(flags: Map<string, Set<string>>, id: string, flag: string) {
  const current = flags.get(id) ?? new Set<string>();
  current.add(flag);
  flags.set(id, current);
}
