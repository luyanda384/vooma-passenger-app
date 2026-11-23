import { fireEvent, render, screen } from "@testing-library/react-native";
import * as SplashScreen from "expo-splash-screen";
import App from "../../App";
import { useAuth } from "../state/AuthProvider";

jest.mock("expo-splash-screen", () => ({
  preventAutoHideAsync: jest.fn(async () => {}),
  hideAsync: jest.fn(async () => {}),
}));
jest.mock("react-native-safe-area-context", () =>
  require("react-native-safe-area-context/jest/mock").default,
);
jest.mock("@expo/vector-icons/Ionicons", () => "Icon");
jest.mock("../state/AuthProvider", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: jest.fn(),
}));
jest.mock("../state/PassengerProvider", () => ({
  STORAGE_KEY: "test-passenger",
  PassengerProvider: ({ children }: { children: React.ReactNode }) => children,
  usePassenger: () => ({ ready: true, error: "" }),
}));
jest.mock("../features/HomeScreen", () => ({ HomeScreen: () => null }));
jest.mock("../features/ActivityScreen", () => ({ ActivityScreen: () => null }));
jest.mock("../features/SavedScreen", () => ({ SavedScreen: () => null }));
jest.mock("../features/ProfileScreen", () => ({ ProfileScreen: () => null }));
jest.mock("../features/RideDetail", () => ({ RideDetail: () => null }));
jest.mock("../features/WelcomeScreen", () => ({ WelcomeScreen: () => null }));
jest.mock("../features/CompleteProfileScreen", () => ({ CompleteProfileScreen: () => null }));
// The welcome animation must not be responsible for dismissing the native splash.
jest.mock("../features/LaunchSplash", () => ({
  LaunchSplash: ({ children }: { children: React.ReactNode }) => children,
}));

type Auth = ReturnType<typeof useAuth>;
const session: NonNullable<Auth["session"]> = {
  accessToken: "test-token",
  expiresAt: Date.now() + 60000,
  passenger: {
    id: "p1", name: "Passenger", email: "passenger@example.test",
    phone: "+27821234567", emailVerified: true, phoneVerified: false,
  },
};

test.each<[string, Partial<Auth>]>([
  ["restoring a saved session", { ready: false }],
  ["signed in", { session }],
  ["session restoration failed", { startupError: "Could not connect to Vooma." }],
  ["completing a social profile", { pending: { token: "test", name: "Passenger", email: "p@example.test" } }],
  ["signed out", {}],
])("dismisses the native splash after layout when %s", (_name, state) => {
  jest.mocked(useAuth).mockReturnValue({
    ready: true, session: null, startupError: "", pending: null,
    retry: jest.fn(), accept: jest.fn(), signOut: jest.fn(),
    google: jest.fn(), complete: jest.fn(), cancelSocial: jest.fn(),
    ...state,
  });

  render(<App />);
  expect(SplashScreen.hideAsync).not.toHaveBeenCalled();
  fireEvent(screen.getByTestId("app-root"), "layout", {
    nativeEvent: { layout: { x: 0, y: 0, width: 390, height: 844 } },
  });
  expect(SplashScreen.hideAsync).toHaveBeenCalledTimes(1);
  if (state.startupError) {
    expect(screen.getByText(state.startupError)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Retry sign-in" })).toBeTruthy();
  }
});
