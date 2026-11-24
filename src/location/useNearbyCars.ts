import { useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { loadNearby, type Nearby } from "../api/discovery";
import { useAuth } from "../state/AuthProvider";
import type { Place } from "../domain/passenger";

export function useNearbyCars(pickup: Place | null) {
  const { session } = useAuth();
  const token = session?.accessToken;
  const currentPickup = useRef(pickup);
  currentPickup.current = pickup;
  const pickupId = pickup?.id;
  const [state, setState] = useState<{
    key: string;
    data: Nearby | null;
    loading: boolean;
    error: string;
  }>({ key: "", data: null, loading: false, error: "" });
  const [attempt, setAttempt] = useState(0);
  const key = `${token ?? ""}:${pickupId ?? ""}`;
  useEffect(() => {
    if (!token || !pickupId) return;
    const controller = new AbortController();
    let busy = false;
    let active = AppState.currentState === "active";
    let revision = 0;
    async function refresh() {
      if (busy || !active || controller.signal.aborted) return;
      const origin = currentPickup.current;
      if (!origin) return;
      busy = true;
      const version = revision;
      setState((previous) => ({
        key,
        data: previous.key === key ? previous.data : null,
        loading: true,
        error: "",
      }));
      try {
        const data = await loadNearby(
          { latitude: origin.latitude, longitude: origin.longitude },
          token!,
          controller.signal,
        );
        if (!controller.signal.aborted && active && version === revision)
          setState({ key, data, loading: false, error: "" });
      } catch {
        if (!controller.signal.aborted && active && version === revision)
          setState({
            key,
            data: null,
            loading: false,
            error:
              "Could not load nearby cars. Check your connection and retry.",
          });
      } finally {
        busy = false;
      }
    }
    void refresh();
    const timer = setInterval(() => void refresh(), 5000);
    const expiry = setInterval(
      () =>
        setState((previous) => {
          if (previous.key !== key || !previous.data) return previous;
          const cars = previous.data.cars.filter(
            (car) => Date.now() - car.capturedAt <= 30000,
          );
          if (cars.length === previous.data.cars.length) return previous;
          return {
            ...previous,
            data: {
              ...previous.data,
              cars,
              categories: previous.data.categories.map((category) => {
                const matches = cars.filter(
                  (car) => car.category === category.id,
                );
                const times = matches.flatMap((car) =>
                  car.pickupSeconds === null ? [] : [car.pickupSeconds],
                );
                return {
                  ...category,
                  available: matches.length,
                  pickupSeconds: times.length ? Math.min(...times) : null,
                };
              }),
            },
          };
        }),
      1000,
    );
    const listener = AppState.addEventListener("change", (next) => {
      active = next === "active";
      revision++;
      if (!active) setState({ key, data: null, loading: false, error: "" });
      else void refresh();
    });
    return () => {
      controller.abort();
      clearInterval(timer);
      clearInterval(expiry);
      listener.remove();
    };
    // GPS jitter updates the next request's origin without restarting the 5s poll.
  }, [token, pickupId, attempt, key]);
  return {
    data: state.key === key ? state.data : null,
    loading: state.key === key && state.loading,
    error: state.key === key ? state.error : "",
    retry: () => setAttempt((n) => n + 1),
  };
}
