import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { AppState } from "react-native";
import { ApiError, passengerApi, type Session } from "../api/passenger";
import { clearSocialSession, finishWebGoogle, signInGoogle } from "../api/social";
import { sessionStorage } from "../api/sessionStorage";

type Pending = { token: string; name: string; email: string };
type Auth = {
  session: Session | null; ready: boolean; startupError: string; retry: () => void;
  accept: (session: Session) => Promise<void>; signOut: () => Promise<void>;
  google: (signal?: AbortSignal) => Promise<void>; pending: Pending | null;
  complete: (profile: { name: string; phone: string }) => Promise<void>; cancelSocial: () => Promise<void>;
};
const Context = createContext<Auth | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const [ready, setReady] = useState(false);
  const [startupError, setStartupError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const live = useRef(true);
  useEffect(() => { live.current = true; return () => { live.current = false; }; }, []);
  async function accept(next: Session) {
    await sessionStorage.write(next.accessToken);
    if (live.current) { setSession(next); setPending(null); }
    void clearSocialSession().catch(() => {});
  }
  async function exchange(token: string, profile?: { name: string; phone: string }, signal?: AbortSignal) {
    const result = await passengerApi.social(token, profile, signal);
    if (!live.current || signal?.aborted) return;
    if ("onboardingRequired" in result) setPending({ token, name: result.name, email: result.email });
    else await accept(result);
  }
  useEffect(() => {
    let active = true;
    setReady(false); setStartupError("");
    void (async () => {
      try {
        const social = await finishWebGoogle();
        if (!active) return;
        if (social) await exchange(social);
        else {
          const token = await sessionStorage.read();
          if (token) {
            try {
              const current = await passengerApi.current(token);
              if (active) setSession({ ...current, accessToken: token });
            } catch (error) {
              if (error instanceof ApiError && error.status === 401) await sessionStorage.clear();
              else throw error;
            }
          }
        }
      } catch (error) { if (active) setStartupError(error instanceof Error ? error.message : "Could not restore your session."); }
      finally { if (active) setReady(true); }
    })();
    return () => { active = false; };
  }, [attempt]);
  useEffect(() => {
    if (!session) return;
    const controller = new AbortController();
    const expire = () => {
      setSession(previous => previous?.accessToken === session.accessToken ? null : previous);
      void sessionStorage.clear().catch(() => {});
    };
    const timer = setTimeout(expire, Math.max(0, session.expiresAt - Date.now()));
    const listener = AppState.addEventListener("change", state => {
      if (state !== "active") return;
      if (Date.now() >= session.expiresAt) { expire(); return; }
      void passengerApi.current(session.accessToken, controller.signal).catch(error => {
        if (!controller.signal.aborted && error instanceof ApiError && error.status === 401) expire();
      });
    });
    return () => { clearTimeout(timer); controller.abort(); listener.remove(); };
  }, [session]);
  async function signOut() {
    if (session) {
      try { await passengerApi.logout(session.accessToken); }
      catch (error) { if (!(error instanceof ApiError && error.status === 401)) throw error; }
    }
    await sessionStorage.clear();
    await clearSocialSession();
    setSession(null); setPending(null); setStartupError("");
  }
  return <Context.Provider value={{ session, ready, startupError, retry: () => setAttempt(value => value + 1), accept, signOut, pending,
    google: async signal => { const token = await signInGoogle(); if (signal?.aborted) { await clearSocialSession(); return; } if (token) await exchange(token, undefined, signal); },
    complete: async profile => { if (pending) await exchange(pending.token, profile); },
    cancelSocial: async () => { await clearSocialSession(); setPending(null); setStartupError(""); },
  }}>{children}</Context.Provider>;
}
export function useAuth() {
  const value = useContext(Context);
  if (!value) throw new Error("AuthProvider is required");
  return value;
}
