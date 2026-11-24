import { useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { randomUUID } from "expo-crypto";
import { useAuth } from "../state/AuthProvider";
import { ridesApi, type LiveRide } from "../api/rides";
import type { Place, ServiceId } from "../domain/passenger";

export function useRide() {
  const { session } = useAuth();
  const token = session?.accessToken;
  const live = useRef(token);
  live.current = token;
  const [state, setState] = useState<{
    token?: string;
    ride: LiveRide | null;
    ready: boolean;
    error: string;
  }>({ ride: null, ready: false, error: "" });
  const [busy, setBusy] = useState(false),
    [attempt, setAttempt] = useState(0);
  const [actionError, setActionError] = useState<{
    token?: string;
    message: string;
  }>({ message: "" });
  const locked = useRef(false),
    command = useRef<{ key: string; id: string } | null>(null);
  const revision = useRef(0);
  function accept(ride: LiveRide | null) {
    setState((old) =>
      old.token === token &&
      old.ride &&
      ride &&
      old.ride.id === ride.id &&
      old.ride.version > ride.version
        ? old
        : { token, ride, ready: true, error: "" },
    );
  }
  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    let reading = false;
    async function refresh() {
      if (
        reading ||
        locked.current ||
        controller.signal.aborted ||
        (AppState.currentState && AppState.currentState !== "active")
      )
        return;
      reading = true;
      const version = revision.current;
      try {
        const ride = await ridesApi.current(token!, controller.signal);
        if (!controller.signal.aborted && version === revision.current)
          accept(ride);
      } catch (error) {
        if (!controller.signal.aborted)
          setState((old) => ({
            ...old,
            token,
            ready: true,
            error:
              error instanceof Error
                ? error.message
                : "Could not refresh your ride.",
          }));
      } finally {
        reading = false;
      }
    }
    void refresh();
    const timer = setInterval(() => void refresh(), 3000);
    const listener = AppState.addEventListener("change", (s) => {
      if (s === "active") void refresh();
    });
    return () => {
      controller.abort();
      clearInterval(timer);
      listener.remove();
    };
    // Each session has its own authority and request generation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, attempt]);
  async function run(action: () => Promise<LiveRide | null>) {
    if (!token || locked.current) return;
    locked.current = true;
    revision.current++;
    setBusy(true);
    setActionError({ token, message: "" });
    try {
      const ride = await action();
      if (live.current === token) {
        accept(ride);
        command.current = null;
      }
    } catch (error) {
      if (live.current === token) {
        setActionError({
          token,
          message:
            error instanceof Error
              ? error.message
              : "Could not update your ride.",
        });
        setAttempt((n) => n + 1);
      }
    } finally {
      locked.current = false;
      if (live.current === token) setBusy(false);
    }
  }
  return {
    ride: state.token === token ? state.ride : null,
    ready: state.token === token && state.ready,
    busy,
    error:
      (actionError.token === token ? actionError.message : "") ||
      (state.token === token ? state.error : ""),
    refresh: () => {
      setActionError({ token, message: "" });
      setAttempt((n) => n + 1);
    },
    request: (pickup: Place, destination: Place, category: ServiceId) => {
      if (!token) return;
      const key = JSON.stringify({ pickup, destination, category });
      if (command.current?.key !== key)
        command.current = { key, id: randomUUID() };
      const requestId = command.current.id;
      void run(() =>
        ridesApi.request(token, { requestId, pickup, destination, category }),
      );
    },
    cancel: () => {
      if (token && state.ride)
        void run(() => ridesApi.cancel(token, state.ride!));
    },
  };
}
