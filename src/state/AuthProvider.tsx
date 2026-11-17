import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { AppState } from "react-native";
import { ApiError, passengerApi, type Session } from "../api/passenger";

type Auth = { session: Session | null; accept: (session: Session) => void; signOut: () => Promise<void> };
const Context = createContext<Auth | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  // Keep credentials out of AsyncStorage. Restarting the app requires sign-in.
  const [session, setSession] = useState<Session | null>(null);
  useEffect(() => {
    if (!session) return;
    const controller = new AbortController();
    const expire = () => setSession(previous => previous?.accessToken === session.accessToken ? null : previous);
    const timer = setTimeout(expire, Math.max(0, session.expiresAt - Date.now()));
    const listener = AppState.addEventListener("change", (state) => {
      if (state !== "active") return;
      if (Date.now() >= session.expiresAt) { expire(); return; }
      void passengerApi.current(session.accessToken, controller.signal).catch(error => {
        if (!controller.signal.aborted && error instanceof ApiError && error.status === 401) expire();
      });
    });
    return () => { clearTimeout(timer); controller.abort(); listener.remove(); };
  }, [session]);
  async function signOut() {
    if (!session) return;
    try { await passengerApi.logout(session.accessToken); }
    catch (error) { if (!(error instanceof ApiError && error.status === 401)) throw error; }
    setSession(previous => previous?.accessToken === session.accessToken ? null : previous);
  }
  return <Context.Provider value={{ session, accept: setSession, signOut }}>{children}</Context.Provider>;
}
export function useAuth() {
  const value = useContext(Context);
  if (!value) throw new Error("AuthProvider is required");
  return value;
}
