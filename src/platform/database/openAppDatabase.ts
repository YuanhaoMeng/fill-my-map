import { openDatabaseAsync } from "expo-sqlite";
import { ensureAppSchema } from "./appSchema";

export async function openAppDatabase() {
  const database = await openDatabaseAsync("fill-my-map.sqlite");
  await ensureAppSchema(database);
  return database;
}
