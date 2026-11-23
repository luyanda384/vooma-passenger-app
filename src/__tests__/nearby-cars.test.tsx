import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { AppState } from "react-native";
import { useNearbyCars } from "../location/useNearbyCars";
import { loadNearby, decodeNearby, type Nearby } from "../api/discovery";
import { NearbyCars } from "../features/NearbyCars";
import { places, type Place } from "../domain/passenger";
jest.mock("../state/AuthProvider", () => ({
  useAuth: () => ({ session: { accessToken: "passenger-token" } }),
}));
jest.mock("../api/discovery", () => ({
  ...jest.requireActual("../api/discovery"),
  loadNearby: jest.fn(),
}));
jest.mock("@expo/vector-icons/Ionicons", () => "Icon");
const response = (): Nearby => ({
  generatedAt: Date.now(),
  radiusMeters: 5000,
  expanded: false,
  maxPickupSeconds: 900,
  cars: [
    {
      id: "car-one",
      category: "comfort",
      location: { latitude: -26.1, longitude: 28.05 },
      capturedAt: Date.now(),
      bodyType: "sedan",
      distanceMeters: 800,
      pickupSeconds: 120,
      pickupDistanceMeters: 1200,
    },
  ],
  categories: [
    { id: "go", name: "Vooma Go", seats: 4, available: 0, pickupSeconds: null },
    {
      id: "comfort",
      name: "Vooma Comfort",
      seats: 4,
      available: 1,
      pickupSeconds: 120,
    },
    { id: "xl", name: "Vooma XL", seats: 6, available: 0, pickupSeconds: null },
  ],
});
beforeEach(() => {
  jest
    .mocked(loadNearby)
    .mockReset()
    .mockImplementation(async () => response());
  Object.defineProperty(AppState, "currentState", {
    configurable: true,
    value: "active",
  });
});
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

test("categories show actual counts, unavailable products and pickup time, with selection callback", () => {
  const onSelect = jest.fn();
  render(
    <NearbyCars
      data={response()}
      loading={false}
      error=""
      retry={jest.fn()}
      selected={null}
      onSelect={onSelect}
    />,
  );
  expect(
    screen.getByRole("button", { name: "Vooma Go, 0 available cars" }),
  ).toBeTruthy();
  fireEvent.press(
    screen.getByRole("button", { name: "Vooma Comfort, 1 available cars" }),
  );
  expect(onSelect).toHaveBeenCalledWith("comfort");
  expect(screen.getByText("2 min")).toBeTruthy();
});

test("refresh failure removes old cars; changing pickup immediately hides the old response", async () => {
  const hook = renderHook<ReturnType<typeof useNearbyCars>, { pickup: Place }>(
    ({ pickup }) => useNearbyCars(pickup),
    { initialProps: { pickup: places[0] } },
  );
  await waitFor(() => expect(hook.result.current.data?.cars).toHaveLength(1));
  jest.mocked(loadNearby).mockRejectedValueOnce(new Error("offline"));
  act(() => hook.result.current.retry());
  await waitFor(() =>
    expect(hook.result.current.error).toContain("Could not load"),
  );
  expect(hook.result.current.data).toBeNull();
  let resolve: (value: Nearby) => void = () => {};
  jest.mocked(loadNearby).mockImplementationOnce(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  hook.rerender({ pickup: places[1] });
  expect(hook.result.current.data).toBeNull();
  await act(async () => resolve(response()));
  expect(hook.result.current.data?.cars).toHaveLength(1);
});

test("stale markers and category availability expire even while a refresh hangs", async () => {
  jest.useFakeTimers();
  const first = response();
  jest
    .mocked(loadNearby)
    .mockResolvedValueOnce(first)
    .mockImplementation(() => new Promise(() => {}));
  const hook = renderHook(() => useNearbyCars(places[0]));
  await act(async () => {});
  expect(hook.result.current.data?.cars).toHaveLength(1);
  await act(async () => jest.advanceTimersByTime(31000));
  expect(hook.result.current.data?.cars).toHaveLength(0);
  expect(hook.result.current.data?.categories[1].available).toBe(0);
});

test("backgrounding removes cars and ignores the pending response", async () => {
  let notify: (state: "active" | "background") => void = () => {};
  jest
    .spyOn(AppState, "addEventListener")
    .mockImplementation((_event, listener) => {
      notify = listener;
      return { remove: jest.fn() };
    });
  const hook = renderHook(() => useNearbyCars(places[0]));
  await waitFor(() => expect(hook.result.current.data).not.toBeNull());
  act(() => notify("background"));
  expect(hook.result.current.data).toBeNull();
  act(() => notify("active"));
  await waitFor(() => expect(hook.result.current.data?.cars).toHaveLength(1));
});

test("transport decoder rejects malformed positions and ETAs", () => {
  expect(decodeNearby(response()).cars).toHaveLength(1);
  const invalid = response();
  invalid.cars[0].location.latitude = 100;
  expect(() => decodeNearby(invalid)).toThrow("Nearby cars");
  const eta = response();
  eta.cars[0].pickupSeconds = -1;
  expect(() => decodeNearby(eta)).toThrow("Nearby cars");
});

test("GPS updates use the latest pickup on the next poll without increasing the polling rate", async () => {
  jest.useFakeTimers();
  const hook = renderHook<ReturnType<typeof useNearbyCars>, { pickup: Place }>(
    ({ pickup }) => useNearbyCars(pickup),
    { initialProps: { pickup: places[0] } },
  );
  await act(async () => {});
  expect(loadNearby).toHaveBeenCalledTimes(1);
  const moved = { ...places[0], latitude: places[0].latitude + 0.01 };
  hook.rerender({ pickup: moved });
  await act(async () => jest.advanceTimersByTime(5000));
  expect(loadNearby).toHaveBeenCalledTimes(1);
  await act(async () => jest.advanceTimersByTime(10000));
  expect(loadNearby).toHaveBeenLastCalledWith(
    { latitude: moved.latitude, longitude: moved.longitude },
    "passenger-token",
    expect.anything(),
  );
});
