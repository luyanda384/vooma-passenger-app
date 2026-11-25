import type { Place } from "../domain/passenger";
import {
  classifyFix,
  type LocationState,
  type LocationStatus,
} from "./controller";
import { useLocation } from "./useLocation";
import { usePickupAddress } from "./usePickupAddress";
import { Platform } from "react-native";

export function pickupFromLocation(state: LocationState): Place | null {
  if (
    state.status !== "ready" ||
    !state.fix ||
    classifyFix(state.fix, Date.now()) !== "ready"
  )
    return null;
  const { latitude, longitude } = state.fix;
  return {
    id: "current-location",
    name: "Current location",
    address: "",
    latitude: latitude!,
    longitude: longitude!,
  };
}

const messages: Record<LocationStatus, string> = {
  idle: "Finding your current location…",
  checking: "Finding your current location…",
  ready: "Pickup follows your live location",
  denied: "Allow location access to use your current position as pickup.",
  blocked:
    "Location permission is off. Enable it in settings to set your pickup.",
  disabled: "Turn on your device’s location services to set your pickup.",
  stale: "Waiting for a fresh location. Your pickup will update automatically.",
  inaccurate:
    "Waiting for a more precise location. Try moving to an open area.",
  paused: "Live pickup resumes when you return to the app.",
  error:
    "We couldn’t find your location. Check location services and try again.",
  unsupported: "Live location isn’t available on this device.",
};

export function useLivePickup({ enabled = true } = {}) {
  const location = useLocation({ autoStart: enabled });
  const point = pickupFromLocation(location);
  const address = usePickupAddress(point ? [point.longitude, point.latitude] : null);
  function addressed(pickup: Place | null) {
    // Never attach an address from an earlier GPS area to a newer pickup.
    const nearby = point && pickup && Math.hypot(
      (point.longitude - pickup.longitude) * Math.cos(point.latitude * Math.PI / 180),
      point.latitude - pickup.latitude,
    ) * 111320 < 30;
    return pickup ? { ...pickup, address: nearby ? address || "" : "" } : null;
  }
  return {
    pickup: addressed(point),
    status: location.status,
    message: point && !address
      ? Platform.OS === "web" || address === ""
        ? "Choose your pickup street address using Change pickup."
        : "Finding your pickup street address…"
      : messages[location.status],
    retry: location.start,
    getPickup: () => addressed(pickupFromLocation(location.getSnapshot())),
  };
}
