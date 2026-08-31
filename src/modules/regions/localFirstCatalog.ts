import type { CityCatalog } from "./cityPackTypes";

export async function loadCatalogLocalFirst(
  loadCached: () => Promise<CityCatalog>,
  refresh: () => Promise<CityCatalog>,
  onRefresh: (catalog: CityCatalog) => void,
) {
  const cached = await loadCached();
  void refresh().then(onRefresh).catch(() => undefined);
  return cached;
}
