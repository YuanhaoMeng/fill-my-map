import type { CityCatalog, CityCatalogEntry, CityPackManifest } from "./cityPackTypes";

const SHA256 = /^[a-f0-9]{64}$/;
const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const RELEASE_PREFIX = "https://github.com/YuanhaoMeng/fill-my-map/releases/download/";

export function parseCityCatalog(value: unknown): CityCatalog {
  if (!isRecord(value) || (value.formatVersion !== 1 && value.formatVersion !== 2)) {
    throw new Error("Unsupported city catalog");
  }
  const raw = value.formatVersion === 1 ? value.cities : value.packages;
  if (!Array.isArray(raw)) throw new Error("Unsupported city catalog");
  const cities = raw.map(parseCatalogEntry);
  if (new Set(cities.map((city) => city.id)).size !== cities.length) throw new Error("Duplicate city id");
  return { formatVersion: value.formatVersion, cities };
}

export function parseCityManifest(value: unknown): CityPackManifest {
  if (!isRecord(value) || (value.formatVersion !== 1 && value.formatVersion !== 2)) {
    throw new Error("Unsupported city map format");
  }
  const bounds = value.bounds;
  const hashes = value.sha256;
  const license = value.license;
  if (!validId(value.id) || !text(value.displayName) || !text(value.version) || !text(value.createdAt)) {
    throw new Error("Invalid city map identity");
  }
  if (!Array.isArray(bounds) || bounds.length !== 4 || !bounds.every(finite)) {
    throw new Error("Invalid city map bounds");
  }
  const [west, south, east, north] = bounds as [number, number, number, number];
  if (west >= east || south >= north) throw new Error("Invalid city map bounds");
  if (!isRecord(hashes) || !hash(hashes.basemap) || !hash(hashes.network)) throw new Error("Invalid city map hashes");
  if (!isRecord(license) || license.data !== "ODbL-1.0" || license.attribution !== "© OpenStreetMap contributors") {
    throw new Error("Invalid city map license");
  }
  if (value.formatVersion === 1) validateLegacyCity(value);
  else validateV2Manifest(value);
  return value as unknown as CityPackManifest;
}

function parseCatalogEntry(value: unknown): CityCatalogEntry {
  if (!isRecord(value) || !validId(value.id) || !text(value.displayName) || !text(value.version)) {
    throw new Error("Invalid city catalog entry");
  }
  if (!finite(value.sizeBytes) || value.sizeBytes <= 0) throw new Error("Invalid city map size");
  if (!hash(value.sha256)) throw new Error("Invalid city map checksum");
  if (!text(value.downloadUrl) || !value.downloadUrl.startsWith(RELEASE_PREFIX)) {
    throw new Error("Unapproved city map host");
  }
  if (value.kind !== undefined && !packKind(value.kind)) throw new Error("Invalid map kind");
  if (value.parentId !== undefined && !validId(value.parentId)) throw new Error("Invalid map parent");
  if (value.networkProfile !== undefined && !networkProfile(value.networkProfile)) throw new Error("Invalid network profile");
  return value as unknown as CityCatalogEntry;
}

function validateLegacyCity(value: Record<string, unknown>) {
  const city = value.city;
  if (!isRecord(city) || city.id !== value.id || !text(city.name) || !finite(city.relationId)) {
    throw new Error("Invalid city map metadata");
  }
}

function validateV2Manifest(value: Record<string, unknown>) {
  if (!packKind(value.kind) || !networkProfile(value.networkProfile)) throw new Error("Invalid map profile");
  if (value.parentId !== undefined && !validId(value.parentId)) throw new Error("Invalid map parent");
  const area = value.area;
  if (!isRecord(area) || area.id !== value.id || !text(area.name) || !text(area.osmRef)) {
    throw new Error("Invalid map area");
  }
  if (!Array.isArray(area.center) || area.center.length !== 2 || !area.center.every(finite)) {
    throw new Error("Invalid map center");
  }
  const sources = value.sources;
  if (!Array.isArray(sources) || sources.length === 0 || sources.some((source) =>
    !isRecord(source) || !text(source.name) || !text(source.snapshot) || !text(source.url) || !text(source.license))) {
    throw new Error("Invalid map sources");
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;
const text = (value: unknown): value is string => typeof value === "string" && value.length > 0;
const finite = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const hash = (value: unknown): value is string => typeof value === "string" && SHA256.test(value);
const validId = (value: unknown): value is string => typeof value === "string" && ID.test(value);
const packKind = (value: unknown): value is "city" | "overview" | "place" =>
  value === "city" || value === "overview" || value === "place";
const networkProfile = (value: unknown): value is "street" | "arterial" | "trail" =>
  value === "street" || value === "arterial" || value === "trail";
