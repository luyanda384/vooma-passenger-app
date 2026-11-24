import { act, renderHook, waitFor } from "@testing-library/react-native";
import { AppState } from "react-native";
import { randomUUID } from "expo-crypto";
import { useRide } from "../location/useRide";
import { ridesApi, type LiveRide, decodeRide } from "../api/rides";
import { places } from "../domain/passenger";
jest.mock("../state/AuthProvider", () => ({
  useAuth: () => ({ session: { accessToken: "passenger-test" } }),
}));
jest.mock("../api/rides", () => ({
  ...jest.requireActual("../api/rides"),
  ridesApi: { current: jest.fn(), request: jest.fn(), cancel: jest.fn() },
}));
jest.mock("expo-crypto", () => ({
  randomUUID: jest.fn(() => "real-request-id"),
}));
const ride: LiveRide = {
  id: "live-ride",
  status: "requested",
  category: "go",
  version: 1,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  expiresAt: Date.now() + 120000,
  pickup: places[0],
  destination: places[1],
  driver: null,
};
test("ETA and GPS expire locally even when polling stops returning", async () => {
  jest.useFakeTimers();
  const now = Date.now();
  const assigned: LiveRide = {
    ...ride,
    status: "matched",
    driver: {
      name: "Thabo",
      vehicle: {
        plate: "TEST GP",
        colour: "White",
        make: "Toyota",
        model: "Corolla",
      },
      location: { latitude: -26.1, longitude: 28.05, capturedAt: now },
    },
    tracking: {
      provider: "google",
      target: "pickup",
      origin: { latitude: -26.1, longitude: 28.05 },
      distanceMeters: 1800,
      durationSeconds: 240,
      encodedPolyline: "_p~iF~ps|U_ulLnnqC_mqNvxq`@",
      calculatedAt: now,
      expiresAt: now + 30000,
    },
  };
  jest
    .mocked(ridesApi.current)
    .mockResolvedValueOnce(assigned)
    .mockImplementation(() => new Promise(() => {}));
  const hook = renderHook(() => useRide());
  await act(async () => {});
  expect(hook.result.current.ride?.tracking?.durationSeconds).toBe(240);
  await act(async () => jest.advanceTimersByTime(31000));
  expect(hook.result.current.ride?.tracking).toBeNull();
  expect(hook.result.current.ride?.driver?.location).toBeNull();
  expect(hook.result.current.ride?.status).toBe("matched");
});
beforeEach(() => {
  Object.defineProperty(AppState, "currentState", {
    configurable: true,
    value: "active",
  });
  jest.mocked(ridesApi.current).mockReset().mockResolvedValue(null);
  jest.mocked(ridesApi.request).mockReset().mockResolvedValue(ride);
  jest
    .mocked(ridesApi.cancel)
    .mockReset()
    .mockResolvedValue({ ...ride, status: "cancelled", version: 2 });
});
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});
test("a failed request retains its retry ID and displays the actionable failure", async () => {
  jest
    .mocked(ridesApi.request)
    .mockRejectedValueOnce(new Error("No drivers nearby"));
  const hook = renderHook(() => useRide());
  await waitFor(() => expect(hook.result.current.ready).toBe(true));
  act(() => hook.result.current.request(places[0], places[1], "go"));
  await waitFor(() =>
    expect(hook.result.current.error).toBe("No drivers nearby"),
  );
  act(() => hook.result.current.refresh());
  await waitFor(() => expect(hook.result.current.error).toBe(""));
  act(() => hook.result.current.request(places[0], places[1], "go"));
  await waitFor(() =>
    expect(hook.result.current.ride?.status).toBe("requested"),
  );
  expect(jest.mocked(ridesApi.request).mock.calls[0][1].requestId).toBe(
    jest.mocked(ridesApi.request).mock.calls[1][1].requestId,
  );
  expect(randomUUID).toHaveBeenCalledTimes(1);
});
test("passenger cancellation uses the current real ride and restores the server result", async () => {
  jest.mocked(ridesApi.current).mockResolvedValue(ride);
  const hook = renderHook(() => useRide());
  await waitFor(() => expect(hook.result.current.ride?.id).toBe(ride.id));
  act(() => hook.result.current.cancel());
  await waitFor(() =>
    expect(hook.result.current.ride?.status).toBe("cancelled"),
  );
  expect(ridesApi.cancel).toHaveBeenCalledWith("passenger-test", ride);
});
test("a stale poll cannot overwrite the newer cancellation version", async () => {
  jest.useFakeTimers();
  jest.mocked(ridesApi.current).mockResolvedValue(ride);
  const hook = renderHook(() => useRide());
  await act(async () => {});
  await act(async () => hook.result.current.cancel());
  expect(hook.result.current.ride?.version).toBe(2);
  await act(async () => jest.advanceTimersByTime(3000));
  expect(hook.result.current.ride?.status).toBe("cancelled");
});
test("malformed trip coordinates fail validation", () => {
  expect(() =>
    decodeRide({
      ride: { ...ride, pickup: { ...ride.pickup, latitude: 100 } },
    }),
  ).toThrow("ride could not be loaded");
});
