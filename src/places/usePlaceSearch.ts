import { useEffect, useRef, useState } from "react";
import { randomUUID } from "expo-crypto";
import { placeSearch, type SearchBias, type Suggestion } from "./service";
import type { Place, SavedPlace } from "../domain/passenger";

export function usePlaceSearch(bias?: SearchBias) {
  const [session] = useState(() => randomUUID());
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [status, setStatus] = useState<
    "idle" | "loading" | "ready" | "resolving" | "error"
  >("idle");
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const revision = useRef(0);
  const alive = useRef(true);
  const resolving = useRef(false);
  const currentBias = useRef(bias);
  currentBias.current = bias;

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      revision.current++;
      placeSearch.end(session);
    };
  }, [session]);

  useEffect(() => {
    const version = ++revision.current;
    const text = query.trim();
    if (text.length < 2) {
      setStatus("idle");
      return;
    }
    setStatus("loading");
    const timer = setTimeout(() => {
      void placeSearch
        .suggest(text, session, currentBias.current)
        .then((matches) => {
          if (alive.current && version === revision.current) {
            setSuggestions(matches);
            setStatus("ready");
          }
        })
        .catch((failure) => {
          if (alive.current && version === revision.current) {
            setError(
              failure instanceof Error
                ? failure.message
                : "Address search is unavailable. Please try again.",
            );
            setStatus("error");
          }
        });
    }, 300);
    return () => {
      clearTimeout(timer);
      revision.current++;
    };
  }, [query, session, attempt]);

  function change(value: string) {
    if (resolving.current) return;
    const next = value.slice(0, 200);
    if (next === query) return;
    revision.current++;
    setQuery(next);
    setSuggestions([]);
    setError("");
    setStatus(next.trim().length >= 2 ? "loading" : "idle");
  }

  async function select(item: Suggestion | SavedPlace): Promise<Place | null> {
    if (resolving.current) return null;
    resolving.current = true;
    revision.current++;
    setStatus("resolving");
    setError("");
    try {
      const place =
        "label" in item
          ? await placeSearch.saved(item, session)
          : await placeSearch.resolve(item.id, session);
      return alive.current ? place : null;
    } catch (failure) {
      if (alive.current) {
        setError(
          failure instanceof Error
            ? failure.message
            : "Could not load this place. Please try again.",
        );
        setStatus("error");
      }
      return null;
    } finally {
      resolving.current = false;
    }
  }

  return {
    query,
    change,
    suggestions,
    status,
    error,
    select,
    retry: () => {
      setError("");
      setSuggestions([]);
      setAttempt((value) => value + 1);
    },
  };
}
