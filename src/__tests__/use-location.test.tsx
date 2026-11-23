import { act, renderHook, waitFor } from "@testing-library/react-native";
import * as Location from "expo-location";
import { AppState, type AppStateStatus } from "react-native";
import { useLocation } from "../location/useLocation";

jest.mock("expo-location", () => ({
  Accuracy: { High: 4 },
  getForegroundPermissionsAsync: jest.fn(),
  requestForegroundPermissionsAsync: jest.fn(),
  hasServicesEnabledAsync: jest.fn(async () => true),
  watchPositionAsync: jest.fn(),
}));
const remove = jest.fn();
beforeEach(() => {
  jest.mocked(Location.getForegroundPermissionsAsync).mockResolvedValue({
    granted: false,
    canAskAgain: true,
  } as Location.LocationPermissionResponse);
  jest.mocked(Location.requestForegroundPermissionsAsync).mockResolvedValue({
    granted: true,
    canAskAgain: true,
  } as Location.LocationPermissionResponse);
  jest.mocked(Location.watchPositionAsync).mockResolvedValue({ remove });
});

afterEach(() => jest.restoreAllMocks());

test("iOS inactive overlays keep GPS running; background and foreground restart it", async () => {
  let changeState: (state: AppStateStatus) => void = () => {};
  jest.spyOn(AppState, "addEventListener").mockImplementation((_, listener) => {
    changeState = listener;
    return { remove: jest.fn() };
  });
  const hook = renderHook(() => useLocation({ autoStart: true }));
  await waitFor(() =>
    expect(Location.watchPositionAsync).toHaveBeenCalledTimes(1),
  );
  const position = {
    timestamp: Date.now(),
    coords: { latitude: -26, longitude: 28, accuracy: 10 },
  } as Location.LocationObject;
  act(() =>
    jest.mocked(Location.watchPositionAsync).mock.calls[0][1](position),
  );
  expect(hook.result.current.status).toBe("ready");
  act(() => changeState("inactive"));
  expect(hook.result.current.status).toBe("ready");
  expect(remove).not.toHaveBeenCalled();
  act(() => changeState("active"));
  expect(Location.watchPositionAsync).toHaveBeenCalledTimes(1);
  jest.mocked(Location.getForegroundPermissionsAsync).mockResolvedValue({
    granted: true,
    canAskAgain: true,
  } as Location.LocationPermissionResponse);
  act(() => changeState("background"));
  expect(remove).toHaveBeenCalledTimes(1);
  expect(hook.result.current.status).toBe("paused");
  act(() => changeState("active"));
  await waitFor(() =>
    expect(Location.watchPositionAsync).toHaveBeenCalledTimes(2),
  );
  hook.unmount();
});
test("automatically requests permission, starts GPS and respects an explicit stop", async () => {
  const hook = renderHook(() => useLocation({ autoStart: true }));
  await waitFor(() =>
    expect(Location.watchPositionAsync).toHaveBeenCalledTimes(1),
  );
  expect(Location.requestForegroundPermissionsAsync).toHaveBeenCalledTimes(1);
  act(() => hook.result.current.stop());
  hook.rerender({});
  expect(hook.result.current.status).toBe("idle");
  expect(remove).toHaveBeenCalledTimes(1);
  expect(Location.watchPositionAsync).toHaveBeenCalledTimes(1);
  hook.unmount();
});
test("permission denial never starts GPS or repeatedly prompts", async () => {
  jest.mocked(Location.requestForegroundPermissionsAsync).mockResolvedValue({
    granted: false,
    canAskAgain: true,
  } as Location.LocationPermissionResponse);
  const hook = renderHook(() => useLocation({ autoStart: true }));
  await waitFor(() => expect(hook.result.current.status).toBe("denied"));
  hook.rerender({});
  expect(Location.watchPositionAsync).not.toHaveBeenCalled();
  expect(Location.requestForegroundPermissionsAsync).toHaveBeenCalledTimes(1);
});
test("preview and other opt-in callers do not request location automatically", () => {
  renderHook(() => useLocation({ autoStart: false }));
  expect(Location.getForegroundPermissionsAsync).not.toHaveBeenCalled();
  expect(Location.watchPositionAsync).not.toHaveBeenCalled();
});

test("switching to manual pickup stops GPS, and returning to live mode restarts it", async () => {
  const hook = renderHook(
    ({ enabled }: { enabled: boolean }) => useLocation({ autoStart: enabled }),
    { initialProps: { enabled: true } },
  );
  await waitFor(() =>
    expect(Location.watchPositionAsync).toHaveBeenCalledTimes(1),
  );
  hook.rerender({ enabled: false });
  expect(remove).toHaveBeenCalledTimes(1);
  expect(hook.result.current.status).toBe("idle");
  hook.rerender({ enabled: true });
  await waitFor(() =>
    expect(Location.watchPositionAsync).toHaveBeenCalledTimes(2),
  );
  hook.unmount();
});
