import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { Linking, Platform } from "react-native";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { isRunningInExpoGo } from "expo";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { MapCanvas } from "../features/map/MapCanvas";
import { PassengerMap } from "../features/map/PassengerMap";
import { places } from "../domain/passenger";

jest.mock("expo", () => ({ isRunningInExpoGo: jest.fn(() => false) }));
jest.mock("expo-constants", () => ({
  __esModule: true,
  default: {
    executionEnvironment: "storeClient",
    appOwnership: null,
    expoConfig: { extra: {} },
  },
  ExecutionEnvironment: {
    StoreClient: "storeClient",
    Standalone: "standalone",
  },
}));
jest.mock("@expo/vector-icons/Ionicons", () => "Icon");
const mockAnimateToRegion = jest.fn();
const mockFitToCoordinates = jest.fn();
jest.mock("react-native-maps", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    __esModule: true,
    default: jest.fn(({ children, ref, ...props }) => {
      React.useImperativeHandle(ref, () => ({
        animateToRegion: mockAnimateToRegion,
        fitToCoordinates: mockFitToCoordinates,
      }));
      return React.createElement(
        View,
        { ...props, testID: "native-map" },
        children,
      );
    }),
    Marker: jest.fn((props) => React.createElement(View, props)),
    PROVIDER_GOOGLE: "google",
  };
});

beforeEach(() => {
  jest.replaceProperty(Platform, "OS", "ios");
  Constants.executionEnvironment = ExecutionEnvironment.StoreClient;
  Constants.expoConfig!.extra = {};
  jest.mocked(isRunningInExpoGo).mockReturnValue(false);
});

test("available cars render with their category and pickup estimate", () => {
  render(
    <MapCanvas
      pickup={places[0]}
      recenter={0}
      cars={[
        {
          id: "nearby-one",
          category: "xl",
          bodyType: "van",
          location: { latitude: -26.11, longitude: 28.05 },
          capturedAt: Date.now(),
          distanceMeters: 500,
          pickupSeconds: 180,
          pickupDistanceMeters: 900,
        },
      ]}
    />,
  );
  expect(
    jest
      .mocked(Marker)
      .mock.calls.some(
        ([props]) =>
          props.identifier === "car-nearby-one" &&
          props.title === "Vooma XL" &&
          props.description === "3 min to pickup",
      ),
  ).toBe(true);
});
afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
});

test("waiting for GPS never renders a sample pickup pin", () => {
  const app = render(<MapCanvas pickup={null} recenter={0} />);
  fireEvent(screen.getByTestId("native-map"), "mapReady");
  expect(jest.mocked(Marker)).not.toHaveBeenCalled();
  expect(mockAnimateToRegion).not.toHaveBeenCalled();
  const pickup = {
    ...places[0],
    id: "current-location",
    name: "Current location",
  };
  app.rerender(<MapCanvas pickup={pickup} recenter={0} />);
  expect(jest.mocked(Marker).mock.lastCall![0].coordinate).toEqual(pickup);
});

test("iOS Expo Go uses Apple Maps even when Google is configured", () => {
  Constants.executionEnvironment = ExecutionEnvironment.Standalone;
  Constants.expoConfig!.extra = { googleMapsIos: true };
  jest.mocked(isRunningInExpoGo).mockReturnValue(true);
  render(<MapCanvas pickup={places[0]} recenter={0} />);
  expect(jest.mocked(MapView).mock.lastCall![0].provider).toBeUndefined();
  expect(jest.mocked(MapView).mock.lastCall![0].showsUserLocation).toBe(false);
});

test.each(["android", "ios"] as const)(
  "configured %s builds use their platform provider",
  (os) => {
    jest.replaceProperty(Platform, "OS", os);
    Constants.executionEnvironment = ExecutionEnvironment.Standalone;
    Constants.expoConfig!.extra = {
      googleMapsAndroid: true,
      googleMapsIos: true,
    };
    render(<MapCanvas pickup={places[0]} recenter={0} />);
    expect(jest.mocked(MapView).mock.lastCall![0].provider).toBe(
      os === "android" ? PROVIDER_GOOGLE : undefined,
    );
  },
);

test("selection changes and recenter fit the real pickup and destination coordinates", () => {
  const app = render(<MapCanvas pickup={places[0]} recenter={0} />);
  fireEvent(screen.getByTestId("native-map"), "mapReady");
  expect(mockAnimateToRegion).toHaveBeenCalledWith(
    expect.objectContaining({
      latitude: places[0].latitude,
      longitude: places[0].longitude,
    }),
    500,
  );
  app.rerender(
    <MapCanvas pickup={places[1]} destination={places[2]} recenter={0} />,
  );
  expect(mockFitToCoordinates).toHaveBeenLastCalledWith(
    [
      { latitude: places[1].latitude, longitude: places[1].longitude },
      { latitude: places[2].latitude, longitude: places[2].longitude },
    ],
    expect.any(Object),
  );
  expect(jest.mocked(Marker).mock.lastCall![0].coordinate).toEqual(places[2]);
  mockFitToCoordinates.mockClear();
  app.rerender(
    <MapCanvas pickup={places[1]} destination={places[2]} recenter={1} />,
  );
  expect(mockFitToCoordinates).toHaveBeenCalledTimes(1);
  app.rerender(<MapCanvas pickup={places[1]} recenter={1} />);
  expect(mockAnimateToRegion).toHaveBeenLastCalledWith(
    expect.objectContaining({ latitude: places[1].latitude }),
    500,
  );
});

test("Android without a key leaves external maps available without mounting the SDK", async () => {
  jest.replaceProperty(Platform, "OS", "android");
  Constants.executionEnvironment = ExecutionEnvironment.Standalone;
  const open = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);
  render(<PassengerMap pickup={places[0]} destination={places[2]} />);
  expect(screen.queryByTestId("native-map")).toBeNull();
  expect(screen.queryByText("Apple Maps")).toBeNull();
  fireEvent.press(screen.getByRole("button", { name: "Google Maps" }));
  expect(open).toHaveBeenCalledWith(
    expect.stringContaining("destination=-26.1367%2C28.2411"),
  );
});

test("a loading timeout allows retry and readiness removes the loader", () => {
  jest.useFakeTimers();
  render(<MapCanvas pickup={places[0]} recenter={0} />);
  act(() => jest.advanceTimersByTime(25000));
  fireEvent.press(screen.getByRole("button", { name: "Retry map" }));
  expect(screen.getByLabelText("Loading map")).toBeTruthy();
  fireEvent(screen.getByTestId("native-map"), "mapReady");
  expect(screen.queryByLabelText("Loading map")).toBeNull();
});

test("iOS opens Apple directions and shows a useful error if opening fails", async () => {
  const open = jest
    .spyOn(Linking, "openURL")
    .mockRejectedValue(new Error("unavailable"));
  render(<PassengerMap pickup={places[0]} destination={places[2]} />);
  fireEvent.press(screen.getByRole("button", { name: "Apple Maps" }));
  expect(screen.queryByText("Google Maps")).toBeNull();
  expect(open).toHaveBeenCalledWith(
    expect.stringContaining("https://maps.apple.com/?saddr="),
  );
  expect(
    await screen.findByText("Could not open Apple Maps. Please try again."),
  ).toBeTruthy();
});
