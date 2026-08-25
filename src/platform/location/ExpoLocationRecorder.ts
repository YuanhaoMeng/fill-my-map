import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import type { LocationRecorder } from "../../core/contracts";
import type { TrackPoint } from "../../core/types";

const TASK_NAME = "fill-my-map-active-exploration";
type Listener = (points: readonly TrackPoint[]) => void;
type LocationTaskData = { locations: Location.LocationObject[] };
let activeSessionId: string | null = null;
const listeners = new Set<Listener>();

TaskManager.defineTask<LocationTaskData>(TASK_NAME, async ({ data, error }) => {
  if (error || !activeSessionId) return;
  const points = data.locations.map((location) => toTrackPoint(location, activeSessionId!));
  listeners.forEach((listener) => listener(points));
});

export class ExpoLocationRecorder implements LocationRecorder {
  async requestPermission() {
    if (!(await Location.hasServicesEnabledAsync())) return false;
    const foreground = await Location.requestForegroundPermissionsAsync();
    if (!foreground.granted) return false;
    const background = await Location.requestBackgroundPermissionsAsync();
    return background.granted;
  }

  async start(sessionId: string) {
    activeSessionId = sessionId;
    try {
      await Location.startLocationUpdatesAsync(TASK_NAME, {
        accuracy: Location.Accuracy.High,
        activityType: Location.ActivityType.OtherNavigation,
        distanceInterval: 8,
        timeInterval: 3_000,
        deferredUpdatesDistance: 40,
        deferredUpdatesInterval: 12_000,
        pausesUpdatesAutomatically: false,
        showsBackgroundLocationIndicator: true,
      });
    } catch (error) {
      activeSessionId = null;
      throw error;
    }
  }

  async stop() {
    if (await this.isRecording()) await Location.stopLocationUpdatesAsync(TASK_NAME);
    activeSessionId = null;
  }

  async isRecording() {
    return Location.hasStartedLocationUpdatesAsync(TASK_NAME);
  }

  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }
}

function toTrackPoint(location: Location.LocationObject, sessionId: string): TrackPoint {
  return {
    sessionId,
    recordedAt: location.timestamp,
    coordinate: [location.coords.longitude, location.coords.latitude],
    accuracyM: location.coords.accuracy ?? 999,
    speedMps: location.coords.speed,
    headingDeg: location.coords.heading,
  };
}
