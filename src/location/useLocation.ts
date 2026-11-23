import * as Location from "expo-location";
import { useEffect, useState, useSyncExternalStore } from "react";
import { AppState } from "react-native";
import { LocationController, type LocationPort } from "./controller";

const foregroundLocation: LocationPort = {
  async permission(request) {
    let result = await Location.getForegroundPermissionsAsync();
    if (request && !result.granted && result.canAskAgain)
      result = await Location.requestForegroundPermissionsAsync();
    return { granted: result.granted, canAskAgain: result.canAskAgain };
  },
  enabled: () => Location.hasServicesEnabledAsync(),
  watch: (onFix, onError) =>
    Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
        distanceInterval: 0,
      },
      (position) =>
        onFix({
          timestamp: position.timestamp,
          accuracy: position.coords.accuracy,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }),
      onError,
    ),
};

export function useLocation({ autoStart = false } = {}) {
  const [controller] = useState(
    () => new LocationController(foregroundLocation),
  );
  const state = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getSnapshot,
  );
  useEffect(() => {
    if (autoStart && AppState.currentState !== "background")
      void controller.start();
    let backgrounded = AppState.currentState === "background";
    let pendingInitialStart = autoStart && backgrounded;
    const subscription = AppState.addEventListener("change", (next) => {
      // iOS becomes inactive for permission dialogs and Control Center too.
      // Only leaving the app should interrupt the pending GPS subscription.
      if (next === "background") {
        backgrounded = true;
        controller.pause();
      } else if (next === "active" && backgrounded) {
        backgrounded = false;
        if (pendingInitialStart) {
          pendingInitialStart = false;
          void controller.start(false);
        } else controller.resume();
      }
    });
    return () => {
      subscription.remove();
      controller.stop();
    };
  }, [controller, autoStart]);
  return {
    ...state,
    getSnapshot: controller.getSnapshot,
    start: () => controller.start(),
    stop: () => controller.stop(),
  };
}
