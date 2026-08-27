import type { CityCatalog, CityCatalogEntry, CityPackManifest } from "./cityPackTypes";

const SHA256 = /^[a-f0-9]{64}$/;
const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const RELEASE_PREFIX = "https://github.com/YuanhaoMeng/fill-my-map/releases/download/";

export function parseCityCatalog(value: unknown): CityCatalog {
  if (!isRecord(value) || value.formatVersion !== 1 || !Array.isArray(value.cities)) {
    throw new Error("Unsupported city catalog");
  }
  const cities = value.cities.map(parseCatalogEntry);
  if (new Set(cities.map((city) => city.id)).size !== cities.length) throw new Error("Duplicate city id");
  return { formatVersion: 1, cities };
}

export function parseCityManifest(value: unknown): CityPackManifest {
  if (!isRecord(value) || value.formatVersion !== 1) throw new Error("Unsupported city map format");
  const bounds = value.bounds;
  const hashes = value.sha256;
  const license = value.license;
  const city = value.city;
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
  if (!isRecord(city) || city.id !== value.id || !text(city.name) || !finite(city.relationId)) {
    throw new Error("Invalid city map metadata");
  }
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
  return value as unknown as CityCatalogEntry;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;
const text = (value: unknown): value is string => typeof value === "string" && value.length > 0;
const finite = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const hash = (value: unknown): value is string => typeof value === "string" && SHA256.test(value);
const validId = (value: unknown): value is string => typeof value === "string" && ID.test(value);
