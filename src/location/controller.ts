export type LocationStatus =
  | "idle"
  | "checking"
  | "denied"
  | "blocked"
  | "disabled"
  | "ready"
  | "stale"
  | "inaccurate"
  | "paused"
  | "error"
  | "unsupported";
export interface LocationFix {
  timestamp: number;
  accuracy: number | null;
  latitude?: number;
  longitude?: number;
}
export interface LocationState {
  status: LocationStatus;
  fix: LocationFix | null;
}
export interface LocationPort {
  permission(
    request: boolean,
  ): Promise<{ granted: boolean; canAskAgain: boolean }>;
  enabled(): Promise<boolean>;
  watch(
    onFix: (fix: LocationFix) => void,
    onError: () => void,
  ): Promise<{ remove(): void }>;
}
// Readiness indicators, not an approved dispatch accuracy/age policy.
export function classifyFix(fix: LocationFix, now: number): LocationStatus {
  if (
    fix.latitude == null ||
    fix.longitude == null ||
    !Number.isFinite(fix.latitude) ||
    !Number.isFinite(fix.longitude) ||
    Math.abs(fix.latitude) > 90 ||
    Math.abs(fix.longitude) > 180
  )
    return "error";
  if (
    !Number.isFinite(fix.timestamp) ||
    fix.timestamp > now + 5000 ||
    now - fix.timestamp > 30_000
  )
    return "stale";
  if (
    fix.accuracy === null ||
    !Number.isFinite(fix.accuracy) ||
    fix.accuracy < 0 ||
    fix.accuracy > 100
  )
    return "inaccurate";
  return "ready";
}

export class LocationController {
  private state: LocationState = { status: "idle", fix: null };
  private listeners = new Set<() => void>();
  private generation = 0;
  private subscription?: { remove(): void };
  private expiryTimer?: ReturnType<typeof setTimeout>;
  private waitTimer?: ReturnType<typeof setTimeout>;
  private wanted = false;
  constructor(
    private readonly port: LocationPort,
    private readonly now = Date.now,
  ) {}
  getSnapshot = () => this.state;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  private update(state: LocationState) {
    this.state = state;
    this.listeners.forEach((listener) => listener());
  }
  private release() {
    this.generation += 1;
    this.subscription?.remove();
    this.subscription = undefined;
    clearTimeout(this.expiryTimer);
    clearTimeout(this.waitTimer);
  }
  async start(request = true) {
    this.wanted = true;
    this.release();
    const generation = this.generation;
    this.update({ status: "checking", fix: null });
    const fail = () => {
      if (generation !== this.generation) return;
      this.release();
      this.update({ status: "error", fix: null });
    };
    this.waitTimer = setTimeout(fail, 20_000);
    try {
      const permission = await this.port.permission(request);
      if (generation !== this.generation) return;
      if (!permission.granted) {
        this.release();
        this.update({
          status: permission.canAskAgain ? "denied" : "blocked",
          fix: null,
        });
        return;
      }
      const enabled = await this.port.enabled();
      if (generation !== this.generation) return;
      if (!enabled) {
        this.release();
        this.update({ status: "disabled", fix: null });
        return;
      }
      const subscription = await this.port.watch((fix) => {
        if (generation !== this.generation) return;
        clearTimeout(this.waitTimer);
        clearTimeout(this.expiryTimer);
        this.update({ status: classifyFix(fix, this.now()), fix });
        this.expiryTimer = setTimeout(
          () => {
            if (generation === this.generation)
              this.update({ status: "stale", fix });
          },
          Math.max(0, fix.timestamp + 30_001 - this.now()),
        );
      }, fail);
      if (generation !== this.generation) subscription.remove();
      else this.subscription = subscription;
    } catch {
      fail();
    }
  }
  pause() {
    this.release();
    if (this.wanted) this.update({ status: "paused", fix: null });
  }
  resume() {
    if (this.wanted) void this.start(false);
  }
  stop() {
    this.wanted = false;
    this.release();
    this.update({ status: "idle", fix: null });
  }
}
