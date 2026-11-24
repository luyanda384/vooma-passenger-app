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
  watch: async (onFix, onError) => {
    let closed = false,
      busy = false,
      latestTimestamp = 0;
    const publish = (position: Location.LocationObject) => {
      if (
        !closed &&
        Number.isFinite(position.timestamp) &&
        position.timestamp >= latestTimestamp &&
        position.timestamp <= Date.now() + 5000
      ) {
        latestTimestamp = position.timestamp;
        onFix({
          timestamp: position.timestamp,
          accuracy: position.coords.accuracy,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      }
    };
    const subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
        distanceInterval: 0,
      },
      publish,
      onError,
    );
    async function refresh() {
      if (
        closed ||
        busy ||
        (AppState.currentState && AppState.currentState !== "active")
      )
        return;
      busy = true;
      try {
        publish(
          await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          }),
        );
      } catch {
        /* Keep watching; stale coordinates are never re-dated. */
      } finally {
        busy = false;
      }
    }
    void refresh();
    const timer = setInterval(() => void refresh(), 10000);
    return {
      remove() {
        closed = true;
        clearInterval(timer);
        subscription.remove();
      },
    };
  },
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
