import "react-native-url-polyfill/auto";
import { Platform } from "react-native";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import * as Crypto from "expo-crypto";
import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri } from "expo-auth-session";

let client: SupabaseClient | undefined;
const memory = new Map<string, string>();
const storage = {
  getItem: (key: string) => Platform.OS === "web" ? window.sessionStorage.getItem(key) ?? memory.get(key) ?? null : memory.get(key) ?? null,
  setItem: (key: string, value: string) => {
    // Only PKCE verifiers survive a web redirect, never session tokens.
    if (Platform.OS === "web" && key.includes("code-verifier")) window.sessionStorage.setItem(key, value);
    else memory.set(key, value);
  },
  removeItem: (key: string) => { if (Platform.OS === "web") window.sessionStorage.removeItem(key); memory.delete(key); },
};
function supabase() {
  if (client) return client;
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Google sign-in is not configured yet. Please use email sign-in.");
  if (new URL(url).protocol !== "https:") throw new Error("The Google sign-in service address is invalid.");
  if (Platform.OS !== "web" && !globalThis.crypto?.subtle) {
    Object.defineProperty(globalThis, "crypto", { configurable: true, value: {
      getRandomValues: Crypto.getRandomValues,
      subtle: { digest: (algorithm: string, data: BufferSource) => {
        if (algorithm !== "SHA-256") throw new Error("Unsupported digest");
        return Crypto.digest(Crypto.CryptoDigestAlgorithm.SHA256, data);
      } },
    } });
  }
  if (!globalThis.crypto?.subtle) throw new Error("Open Vooma over HTTPS or localhost to sign in with Google.");
  client = createClient(url, key, { auth: { flowType: "pkce", storage, persistSession: true, autoRefreshToken: false, detectSessionInUrl: false } });
  return client;
}
async function exchange(url: string) {
  const callback = new URL(url);
  if (callback.searchParams.has("error")) throw new Error("Google sign-in was not completed. Please try again.");
  const code = callback.searchParams.get("code");
  if (!code) throw new Error("Google did not return a sign-in code. Please try again.");
  const flowId = callback.searchParams.get("sb_flow_id");
  const { data, error } = await supabase().auth.exchangeCodeForSession(code, flowId ? { flowId } : undefined);
  if (error || !data.session) throw new Error("Google sign-in expired or could not be verified. Please try again.");
  return data.session.access_token;
}
export async function signInGoogle(): Promise<string | null> {
  const redirectTo = Platform.OS === "web" ? window.location.origin + "/" : makeRedirectUri({ scheme: "vooma-passenger", path: "auth/callback" });
  if (redirectTo.startsWith("exp:")) throw new Error("Google sign-in needs a Vooma development build. Use email sign-in in Expo Go.");
  const { data, error } = await supabase().auth.signInWithOAuth({ provider: "google", options: { redirectTo, skipBrowserRedirect: true, queryParams: { prompt: "select_account" } } });
  if (error || !data.url) throw new Error("Could not start Google sign-in. Please try again.");
  if (Platform.OS === "web") { window.location.assign(data.url); return null; }
  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== "success") throw new Error("Google sign-in was cancelled.");
  const callback = new URL(result.url), expected = new URL(redirectTo);
  if (callback.protocol !== expected.protocol || callback.host !== expected.host || callback.pathname !== expected.pathname) throw new Error("Unexpected sign-in callback.");
  return exchange(result.url);
}
let webCallback: Promise<string | null> | undefined;
export function finishWebGoogle(): Promise<string | null> {
  if (Platform.OS !== "web") return Promise.resolve(null);
  if (webCallback) return webCallback;
  const url = new URL(window.location.href);
  if (!url.searchParams.has("code") && !url.searchParams.has("error")) return Promise.resolve(null);
  webCallback = exchange(url.href);
  window.history.replaceState({}, "", url.pathname);
  return webCallback;
}
export async function clearSocialSession() {
  if (client) await client.auth.signOut({ scope: "local" });
  memory.clear();
  webCallback = undefined;
}
