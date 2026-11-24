import type { Place } from "../../domain/passenger";
import type { NearbyCar } from "../../api/discovery";
import type { RideTracking } from "../../api/ride-tracking";

export type PassengerMapProps = {
  pickup: Place;
  destination?: Place | null;
};
export type MapCanvasProps = Omit<PassengerMapProps, "pickup"> & {
  cars?: NearbyCar[];
  tracking?: RideTracking | null;
  trackingTarget?: "pickup" | "destination";
  radiusMeters?: number;
  pickup: Place | null;
  recenter: number;
  fullscreen?: boolean;
  overlayBottom?: number;
  height?: number;
  navigationInset?: number;
};
export type MapProvider = "google" | "apple";

// Expo Go on iOS uses MapKit; configured development/store builds use Google.
export function nativeMapProvider(
  platform: string,
  expoGo: boolean,
  configured: { googleMapsAndroid?: boolean; googleMapsIos?: boolean },
): MapProvider | null {
  if (platform === "ios")
    return !expoGo && configured.googleMapsIos ? "google" : "apple";
  if (platform === "android")
    return expoGo || configured.googleMapsAndroid ? "google" : null;
  return null;
}

export function mapsUrl(
  provider: MapProvider,
  { pickup, destination }: PassengerMapProps,
) {
  const point = (place: Place) =>
    encodeURIComponent(`${place.latitude},${place.longitude}`);
  if (provider === "apple") {
    return destination
      ? `https://maps.apple.com/?saddr=${point(pickup)}&daddr=${point(destination)}&dirflg=d`
      : `https://maps.apple.com/?ll=${point(pickup)}&q=${encodeURIComponent(pickup.name)}`;
  }
  return destination
    ? `https://www.google.com/maps/dir/?api=1&origin=${point(pickup)}&destination=${point(destination)}&travelmode=driving`
    : `https://www.google.com/maps/search/?api=1&query=${point(pickup)}`;
}
