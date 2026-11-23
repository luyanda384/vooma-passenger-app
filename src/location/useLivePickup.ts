import type { Place } from "../domain/passenger";
import {
  classifyFix,
  type LocationState,
  type LocationStatus,
} from "./controller";
import { useLocation } from "./useLocation";

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
    address: `${latitude!.toFixed(5)}, ${longitude!.toFixed(5)}`,
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
  return {
    pickup: pickupFromLocation(location),
    status: location.status,
    message: messages[location.status],
    retry: location.start,
    getPickup: () => pickupFromLocation(location.getSnapshot()),
  };
}
