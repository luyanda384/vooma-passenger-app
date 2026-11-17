import { useEffect, useRef, useState } from "react";

// Ignore late responses after leaving a form, and prevent duplicate submissions.
export function useAuthRequest() {
  const pending = useRef<AbortController | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => () => { pending.current?.abort(); }, []);
  async function run<T>(work: (signal: AbortSignal) => Promise<T>, success: (result: T) => void) {
    if (pending.current) return;
    const controller = new AbortController();
    pending.current = controller;
    setBusy(true);
    setError("");
    try {
      const result = await work(controller.signal);
      if (!controller.signal.aborted) success(result);
    } catch (failure) {
      if (!controller.signal.aborted) setError(failure instanceof Error ? failure.message : "Please try again.");
    } finally {
      if (!controller.signal.aborted) setBusy(false);
      pending.current = null;
    }
  }
  return { busy, error, run, clearError: () => setError("") };
}
