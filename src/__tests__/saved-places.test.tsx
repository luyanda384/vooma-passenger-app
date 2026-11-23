import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { SavedScreen } from "../features/SavedScreen";
import {
  initialState,
  parseState,
  bookmarkPlace,
  type Place,
  type PassengerState,
} from "../domain/passenger";
import { placeSearch } from "../places/service";

const selected: Place = {
  id: "google:actual-place",
  provider: "google",
  providerId: "actual-place",
  name: "Provider name",
  address: "12 Provider Street",
  latitude: -26.2,
  longitude: 28.1,
};
let mockState: PassengerState = initialState;
jest.mock("../state/PassengerProvider", () => ({
  usePassenger: () => ({
    state: mockState,
    update: (change: (state: PassengerState) => PassengerState) => {
      mockState = change(mockState);
    },
  }),
}));
jest.mock("../places/service", () => ({
  placeSearch: {
    requiresSubmit: jest.fn(() => false),
    suggest: jest.fn(),
    resolve: jest.fn(),
    saved: jest.fn(),
    end: jest.fn(),
  },
}));
jest.mock("expo-crypto", () => ({ randomUUID: () => "saved-search-session" }));
jest.mock("@expo/vector-icons/Ionicons", () => "Icon");
jest.mock(
  "react-native-safe-area-context",
  () => require("react-native-safe-area-context/jest/mock").default,
);
beforeEach(() => {
  jest.mocked(placeSearch.requiresSubmit).mockReturnValue(false);
  mockState = { ...initialState, saved: [], rides: [] };
});

test("iOS address lookup offers a Search button and selects an Apple result", async () => {
  jest.mocked(placeSearch.requiresSubmit).mockReturnValue(true);
  const apple = {
    ...selected,
    id: "apple:lookup",
    provider: "apple" as const,
    providerId: undefined,
  };
  jest
    .mocked(placeSearch.suggest)
    .mockResolvedValue([
      {
        id: apple.id,
        title: apple.name,
        subtitle: apple.address,
        provider: "apple",
      },
    ]);
  jest.mocked(placeSearch.resolve).mockResolvedValue(apple);
  render(<SavedScreen />);
  fireEvent.press(screen.getByRole("button", { name: "Add new place" }));
  expect(
    screen.getByRole("button", { name: "Search addresses" }),
  ).toBeDisabled();
  fireEvent.changeText(
    screen.getByLabelText("Saved place address"),
    "83 Rivonia Road, Sandton",
  );
  expect(placeSearch.suggest).not.toHaveBeenCalled();
  fireEvent.press(screen.getByRole("button", { name: "Search addresses" }));
  fireEvent.press(
    await screen.findByRole("button", {
      name: `Select ${apple.name}, ${apple.address}`,
    }),
  );
  await waitFor(() =>
    expect(placeSearch.resolve).toHaveBeenCalledWith(
      apple.id,
      "saved-search-session",
    ),
  );
});

test("Saved starts empty, searches live results and persists a user-named bookmark", async () => {
  jest.mocked(placeSearch.suggest).mockResolvedValue([
    {
      id: "actual-place",
      title: "Provider name",
      subtitle: "12 Provider Street",
      provider: "google",
    },
  ]);
  jest.mocked(placeSearch.resolve).mockResolvedValue(selected);
  const view = render(<SavedScreen />);
  expect(screen.queryByText("Recent places")).toBeNull();
  expect(screen.queryByText("Sandton City")).toBeNull();
  fireEvent.press(screen.getByRole("button", { name: "Add new place" }));
  fireEvent.changeText(
    screen.getByLabelText("Saved place address"),
    "Provider",
  );
  fireEvent.press(
    await screen.findByRole("button", {
      name: "Select Provider name, 12 Provider Street",
    }),
  );
  await screen.findByLabelText("Saved place name");
  fireEvent.changeText(screen.getByLabelText("Saved place name"), "Work");
  fireEvent.press(screen.getByRole("button", { name: "Save place" }));
  await waitFor(() =>
    expect(mockState.saved).toEqual([
      {
        id: selected.id,
        provider: "google",
        providerId: "actual-place",
        label: "Work",
      },
    ]),
  );
  expect(JSON.stringify(mockState.saved)).not.toContain("Provider Street");
  expect(JSON.stringify(mockState.saved)).not.toContain("latitude");
  expect(parseState(JSON.stringify(mockState)).saved).toEqual(mockState.saved);
  view.rerender(<SavedScreen />);
  expect(screen.getByText("Work")).toBeTruthy();
  fireEvent.press(
    screen.getByRole("button", { name: "Remove Work from saved places" }),
  );
  expect(mockState.saved).toEqual([]);
});

test("legacy catalogue favourites migrate to an empty live Saved list", () => {
  const restored = parseState(
    JSON.stringify({
      ...initialState,
      version: 1,
      name: "Passenger",
      saved: ["sandton", "airport"],
    }),
  );
  expect(restored).toEqual({ ...initialState, name: "Passenger", saved: [] });
});

test("Apple bookmarks preserve a real selection and reject empty names or invalid coordinates", () => {
  const apple: Place = {
    ...selected,
    id: "apple:coordinates",
    provider: "apple",
    providerId: undefined,
  };
  const saved = bookmarkPlace(apple, "Home");
  expect(
    parseState(JSON.stringify({ ...initialState, saved: [saved] })).saved,
  ).toEqual([saved]);
  expect(() => bookmarkPlace(apple, " ")).toThrow();
  expect(() => bookmarkPlace({ ...apple, latitude: 100 }, "Home")).toThrow();
});
