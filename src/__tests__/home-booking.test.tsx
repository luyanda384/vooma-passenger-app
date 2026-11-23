import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { HomeScreen } from "../features/HomeScreen";
import { placeSearch } from "../places/service";
import type { NearbyCar } from "../api/discovery";
import {
  initialState,
  places,
  type PassengerState,
  type Place,
} from "../domain/passenger";

let mockPassengerState: PassengerState = {
  ...initialState,
  saved: [],
  rides: [],
};
const currentPickup: Place = {
  ...places[0],
  id: "current-location",
  name: "Current location",
};
let mockLivePickup: Place | null = currentPickup;
const nearbyCar: NearbyCar = {
  id: "nearby-car",
  category: "comfort",
  bodyType: "sedan",
  location: { latitude: -26.11, longitude: 28.05 },
  capturedAt: Date.now(),
  distanceMeters: 500,
  pickupSeconds: 120,
  pickupDistanceMeters: 800,
};
const mockNearby = jest.fn((pickup: Place | null) => ({
  data: pickup
    ? {
        generatedAt: Date.now(),
        radiusMeters: 5000,
        expanded: false,
        maxPickupSeconds: 900,
        cars: [nearbyCar],
        categories: [
          {
            id: "comfort",
            name: "Vooma Comfort",
            seats: 4,
            available: 1,
            pickupSeconds: 120,
          },
        ],
      }
    : null,
  loading: false,
  error: "",
  retry: jest.fn(),
}));
jest.mock("../location/useNearbyCars", () => ({
  useNearbyCars: (pickup: Place | null) => mockNearby(pickup),
}));
jest.mock("../location/useLivePickup", () => ({
  useLivePickup: () => ({
    pickup: mockLivePickup,
    status: mockLivePickup ? "ready" : "denied",
    message: "Allow location access to use your current position as pickup.",
    retry: jest.fn(),
    getPickup: () => mockLivePickup,
  }),
}));
const mockUpdate = jest.fn(
  (change: (previous: PassengerState) => PassengerState) => {
    mockPassengerState = change(mockPassengerState);
  },
);
jest.mock("../state/PassengerProvider", () => ({
  usePassenger: () => ({ state: mockPassengerState, update: mockUpdate }),
}));
const mockMap = jest.fn(
  (_props: {
    pickup: Place | null;
    destination: Place | null;
    cars?: NearbyCar[];
  }) => null,
);
jest.mock("../features/map/MapCanvas", () => ({
  MapCanvas: (props: { pickup: Place | null; destination: Place | null }) =>
    mockMap(props),
}));
jest.mock("@expo/vector-icons/Ionicons", () => "Icon");
jest.mock(
  "react-native-safe-area-context",
  () => require("react-native-safe-area-context/jest/mock").default,
);
jest.mock("../places/service", () => ({
  placeSearch: {
    suggest: jest.fn(),
    resolve: jest.fn(),
    saved: jest.fn(),
    end: jest.fn(),
  },
}));
jest.mock("expo-crypto", () => ({ randomUUID: () => "test-search-session" }));

const now = Date.parse("2026-11-20T10:00:00Z");
beforeEach(() => {
  mockLivePickup = currentPickup;
  jest.mocked(placeSearch.suggest).mockImplementation(async (query) =>
    places
      .filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
      .map((p) => ({
        id: p.id,
        title: p.name,
        subtitle: p.address,
        provider: "apple",
      })),
  );
  jest
    .mocked(placeSearch.resolve)
    .mockImplementation(async (id) => places.find((p) => p.id === id)!);
  mockPassengerState = { ...initialState, saved: [], rides: [] };
  jest.spyOn(Date, "now").mockReturnValue(now);
});

afterEach(() => jest.restoreAllMocks());

function mapProps() {
  return mockMap.mock.calls[mockMap.mock.calls.length - 1][0];
}

test("nearby cars and categories appear only after choosing a destination", async () => {
  render(<HomeScreen />);
  expect(screen.queryByText("Cars near your pickup")).toBeNull();
  expect(screen.queryByText("Vooma Comfort")).toBeNull();
  expect(mapProps().cars).toEqual([]);
  expect(mockNearby).toHaveBeenLastCalledWith(null);
  fireEvent.press(screen.getByRole("button", { name: "Where to?" }));
  expect(screen.queryByText("Cars near your pickup")).toBeNull();
  fireEvent.press(
    screen.getByRole("button", { name: /^Close Where are you going/ }),
  );
  await chooseDestination();
  expect(screen.getByText("Cars near your pickup")).toBeTruthy();
  expect(
    screen.getByRole("button", { name: "Vooma Comfort, 1 available cars" }),
  ).toBeTruthy();
  expect(mapProps().cars).toEqual([nearbyCar]);
  expect(mockNearby).toHaveBeenLastCalledWith(currentPickup);
});

async function chooseDestination() {
  fireEvent.press(screen.getByRole("button", { name: "Where to?" }));
  fireEvent.changeText(screen.getByLabelText("Destination address"), "Rose");
  fireEvent.press(
    await screen.findByRole("button", { name: /^Select Rosebank Mall,/ }),
  );
  await waitFor(() => expect(mapProps().destination).toEqual(places[1]));
}

test("destination selection updates the map without offering or creating a demo request", async () => {
  render(<HomeScreen />);
  await chooseDestination();
  expect(mapProps()).toMatchObject({
    pickup: currentPickup,
    destination: places[1],
  });
  expect(screen.queryByRole("button", { name: /Request.*ride/i })).toBeNull();
  expect(
    screen.queryByRole("button", { name: "Choose pickup time" }),
  ).toBeNull();
  expect(screen.queryByText(/Demo only/)).toBeNull();
  expect(mockPassengerState.rides).toHaveLength(0);
  expect(mockUpdate).not.toHaveBeenCalled();
});

test("a manually chosen pickup stays fixed despite GPS movement", async () => {
  const app = render(<HomeScreen />);
  fireEvent.press(
    screen.getByRole("button", { name: "Change pickup: Current location" }),
  );
  fireEvent.changeText(screen.getByLabelText("Pickup address"), "Melrose");
  fireEvent.press(
    await screen.findByRole("button", { name: /^Select Melrose Arch,/ }),
  );
  await waitFor(() => expect(mapProps().pickup).toEqual(places[4]));
  mockLivePickup = { ...currentPickup, latitude: -26.12, longitude: 28.07 };
  app.rerender(<HomeScreen />);
  await chooseDestination();
  expect(mapProps()).toMatchObject({
    pickup: places[4],
    destination: places[1],
  });
});

test("switching back to current location restores live pickup updates", async () => {
  const app = render(<HomeScreen />);
  fireEvent.press(
    screen.getByRole("button", { name: "Change pickup: Current location" }),
  );
  fireEvent.changeText(screen.getByLabelText("Pickup address"), "Melrose");
  fireEvent.press(
    await screen.findByRole("button", { name: /^Select Melrose Arch,/ }),
  );
  await waitFor(() => expect(mapProps().pickup).toEqual(places[4]));
  fireEvent.press(
    screen.getByRole("button", { name: "Change pickup: Melrose Arch" }),
  );
  fireEvent.press(
    screen.getByRole("button", { name: "Use my current location" }),
  );
  mockLivePickup = { ...currentPickup, latitude: -26.12, longitude: 28.07 };
  app.rerender(<HomeScreen />);
  expect(mapProps().pickup).toEqual(mockLivePickup);
});

test("a typed pickup address updates the map without a live fix", async () => {
  mockLivePickup = null;
  jest.mocked(placeSearch.suggest).mockResolvedValue([
    {
      id: "address",
      title: "123 Example Road",
      subtitle: "Sandton",
      provider: "apple",
    },
  ]);
  jest.mocked(placeSearch.resolve).mockResolvedValue({
    id: "address",
    name: "123 Example Road, Sandton",
    address: "123 Example Road, Sandton",
    latitude: -26.08,
    longitude: 28.11,
  });
  render(<HomeScreen />);
  fireEvent.press(
    screen.getByRole("button", { name: "Change pickup: Current location" }),
  );
  fireEvent.changeText(
    screen.getByLabelText("Pickup address"),
    "123 Example Road, Sandton",
  );
  fireEvent.press(
    await screen.findByRole("button", {
      name: "Select 123 Example Road, Sandton",
    }),
  );
  await waitFor(() =>
    expect(mapProps().pickup).toMatchObject({
      name: "123 Example Road, Sandton",
      latitude: -26.08,
      longitude: 28.11,
    }),
  );
});

test("denied location keeps destination selection and location recovery available", async () => {
  mockLivePickup = null;
  render(<HomeScreen />);
  await chooseDestination();
  expect(mapProps()).toMatchObject({ pickup: null, destination: places[1] });
  expect(screen.getByRole("button", { name: "Retry location" })).toBeTruthy();
  expect(mockPassengerState.rides).toHaveLength(0);
  expect(screen.queryByText("Cars near your pickup")).toBeNull();
  expect(mapProps().cars).toEqual([]);
});
