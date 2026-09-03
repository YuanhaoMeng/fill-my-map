import * as Location from "expo-location";
import type { ForegroundLocator } from "../../core/contracts";
import type { Coordinate } from "../../core/types";

export class ExpoForegroundLocator implements ForegroundLocator {
  private subscription?: Location.LocationSubscription;

  async start(listener: (coordinate: Coordinate) => void) {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) return undefined;
    const emit = (location: Location.LocationObject) => {
      const coordinate: Coordinate = [location.coords.longitude, location.coords.latitude];
      listener(coordinate);
      return coordinate;
    };
    if (!this.subscription) {
      this.subscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, distanceInterval: 25 },
        emit,
      );
    }
    return emit(await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
  }

  stop() {
    this.subscription?.remove();
    this.subscription = undefined;
  }
}
