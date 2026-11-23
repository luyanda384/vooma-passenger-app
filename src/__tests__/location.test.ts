import {
  classifyFix,
  LocationController,
  type LocationFix,
  type LocationPort,
} from "../location/controller";

describe("foreground location lifecycle", () => {
  let port: LocationPort;
  let onFix: (fix: LocationFix) => void;
  let controller: LocationController;
  const remove = jest.fn();
  beforeEach(() => {
    jest.useFakeTimers();
    port = {
      permission: jest.fn(async () => ({ granted: true, canAskAgain: true })),
      enabled: jest.fn(async () => true),
      watch: jest.fn(async (callback) => {
        onFix = callback;
        return { remove };
      }),
    };
    controller = new LocationController(port, () => Date.now());
  });
  afterEach(() => {
    controller.stop();
    jest.useRealTimers();
  });
  test("denied permission never starts GPS; explicit retry can recover", async () => {
    jest
      .mocked(port.permission)
      .mockResolvedValueOnce({ granted: false, canAskAgain: true });
    await controller.start();
    expect(controller.getSnapshot().status).toBe("denied");
    expect(port.watch).not.toHaveBeenCalled();
    await controller.start();
    onFix({
      latitude: -26,
      longitude: 28,
      timestamp: Date.now(),
      accuracy: 15,
    });
    expect(controller.getSnapshot().status).toBe("ready");
  });
  test("blocked permission and switched-off device location are distinct", async () => {
    jest
      .mocked(port.permission)
      .mockResolvedValueOnce({ granted: false, canAskAgain: false });
    await controller.start();
    expect(controller.getSnapshot().status).toBe("blocked");
    jest.mocked(port.enabled).mockResolvedValueOnce(false);
    await controller.start();
    expect(controller.getSnapshot().status).toBe("disabled");
    expect(port.watch).not.toHaveBeenCalled();
  });
  test("marks old and imprecise fixes without claiming readiness", async () => {
    await controller.start();
    onFix({
      latitude: -26,
      longitude: 28,
      timestamp: Date.now(),
      accuracy: null,
    });
    expect(controller.getSnapshot().status).toBe("inaccurate");
    onFix({
      latitude: -26,
      longitude: 28,
      timestamp: Date.now(),
      accuracy: 10,
    });
    jest.advanceTimersByTime(30_001);
    expect(controller.getSnapshot().status).toBe("stale");
    expect(
      classifyFix(
        { latitude: -26, longitude: 28, timestamp: Infinity, accuracy: 1 },
        Date.now(),
      ),
    ).toBe("stale");
  });
  test("background releases subscription and resume rechecks permission without a prompt", async () => {
    await controller.start();
    controller.pause();
    expect(remove).toHaveBeenCalled();
    expect(controller.getSnapshot().fix).toBeNull();
    controller.resume();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    expect(port.permission).toHaveBeenLastCalledWith(false);
  });
  test("late native subscription after stop is removed and late fixes ignored", async () => {
    let resolveWatch!: (value: { remove(): void }) => void;
    jest.mocked(port.watch).mockImplementationOnce((callback) => {
      onFix = callback;
      return new Promise((resolve) => {
        resolveWatch = resolve;
      });
    });
    const pending = controller.start();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    controller.stop();
    resolveWatch({ remove });
    await pending;
    onFix({ latitude: -26, longitude: 28, timestamp: Date.now(), accuracy: 5 });
    expect(controller.getSnapshot().status).toBe("idle");
    expect(remove).toHaveBeenCalled();
  });
  test("a silent GPS provider reaches an actionable timeout", async () => {
    await controller.start();
    jest.advanceTimersByTime(20_000);
    expect(controller.getSnapshot().status).toBe("error");
    expect(remove).toHaveBeenCalled();
  });
});
