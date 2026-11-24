import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ActivityIndicator, View } from "react-native";
import { french } from "./fr";

export type Language = "en-ZA" | "fr";
export const LANGUAGE_STORAGE_KEY = "vooma.passenger.language.v1";
export function translate(language: Language, text: string) {
  return language === "fr"
    ? (french[text as keyof typeof french] ?? text)
    : text;
}
const Context = createContext({
  language: "en-ZA" as Language,
  saving: false,
  error: "",
  selectLanguage: async (_language: Language) => {},
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("en-ZA");
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const pending = useRef(false);
  useEffect(() => {
    let active = true;
    void AsyncStorage.getItem(LANGUAGE_STORAGE_KEY)
      .then((saved) => {
        if (active && (saved === "fr" || saved === "en-ZA")) setLanguage(saved);
      })
      .catch(() => {
        if (active)
          setError(
            "Could not load your language preference. Please choose again.",
          );
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  async function selectLanguage(next: Language) {
    if (pending.current) return;
    pending.current = true;
    setSaving(true);
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, next);
      setLanguage(next);
      setError("");
    } catch {
      setError("Could not save your language preference. Please try again.");
    } finally {
      pending.current = false;
      setSaving(false);
    }
  }

  if (!ready)
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator accessibilityLabel="Loading / Chargement" />
      </View>
    );
  return (
    <Context.Provider value={{ language, saving, error, selectLanguage }}>
      {children}
    </Context.Provider>
  );
}

export function useLanguage() {
  const value = useContext(Context);
  return { ...value, t: (text: string) => translate(value.language, text) };
}
