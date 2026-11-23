import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  initialState,
  parseState,
  type PassengerState,
} from "../domain/passenger";

export const STORAGE_KEY = "vooma.passenger.demo.v1";
type Context = {
  state: PassengerState;
  ready: boolean;
  error: string;
  update: (change: (previous: PassengerState) => PassengerState) => void;
  reset: () => void;
  retry: () => void;
};
const PassengerContext = createContext<Context | null>(null);
export function PassengerProvider({ children, storageKey = STORAGE_KEY }: { children: ReactNode; storageKey?: string }) {
  const [state, setState] = useState<PassengerState>(initialState);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const current = useRef(state);
  const writes = useRef(Promise.resolve());
  const mounted = useRef(true);
  const readVersion = useRef(0);
  useEffect(() => {
    mounted.current = true;
    const version = ++readVersion.current;
    AsyncStorage.getItem(storageKey)
      .then((raw) => {
        const restored = parseState(raw);
        if (mounted.current && version === readVersion.current) {
          current.current = restored;
          setState(restored);
          setReady(true);
        }
      })
      .catch(() => {
        if (mounted.current && version === readVersion.current)
          setError(
            "Your saved data could not be loaded. Retry, or reset local data to start again.",
          );
      });
    return () => {
      mounted.current = false;
      readVersion.current++;
    };
  }, [storageKey]);
  function persist(next: PassengerState) {
    writes.current = writes.current
      .then(() => AsyncStorage.setItem(storageKey, JSON.stringify(next)))
      .then(() => {
        if (mounted.current) setError("");
      })
      .catch(() => {
        if (mounted.current)
          setError(
            "Changes are available in this session, but could not be saved on this device. Retry to save them.",
          );
      });
  }
  function update(change: (previous: PassengerState) => PassengerState) {
    if (!ready) return;
    const next = change(current.current);
    current.current = next;
    setState(next);
    persist(next);
  }
  function reset() {
    readVersion.current++;
    const next = { ...initialState, saved: [], rides: [] };
    current.current = next;
    setState(next);
    setReady(true);
    persist(next);
  }
  function retry() {
    if (ready) {
      persist(current.current);
      return;
    }
    const version = ++readVersion.current;
    AsyncStorage.getItem(storageKey)
      .then((raw) => {
        const next = parseState(raw);
        if (mounted.current && version === readVersion.current) {
          current.current = next;
          setState(next);
          setError("");
          setReady(true);
        }
      })
      .catch(() => {
        if (mounted.current && version === readVersion.current)
          setError(
            "Saved data is still unavailable. Try again or reset local data.",
          );
      });
  }
  return (
    <PassengerContext.Provider
      value={{ state, ready, error, update, reset, retry }}
    >
      {children}
    </PassengerContext.Provider>
  );
}
export function usePassenger() {
  const context = useContext(PassengerContext);
  if (!context) throw new Error("PassengerProvider is required.");
  return context;
}
