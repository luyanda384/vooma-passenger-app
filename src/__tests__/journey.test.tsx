import {
  act,
  configure,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AccessibilityInfo } from "react-native";
import App from "../../App";
import { STORAGE_KEY } from "../state/PassengerProvider";
import { initialState } from "../domain/passenger";
import { ApiError, passengerApi } from "../api/passenger";
import { signInGoogle } from "../api/social";
import { sessionStorage } from "../api/sessionStorage";
const accountKey = `${STORAGE_KEY}.passenger-test`;
const session = () => ({ accessToken: "vma_passenger_test", expiresAt: Date.now() + 3600000, passenger: { id: "passenger-test", name: "Lebo Passenger", email: "lebo@example.test", phone: "+27821234567", emailVerified: true as const, phoneVerified: false as const } });
jest.mock("../api/social", () => ({ signInGoogle: jest.fn(), finishWebGoogle: jest.fn(async () => null), clearSocialSession: jest.fn(async () => {}) }));
jest.mock("../api/sessionStorage", () => ({ sessionStorage: { read: jest.fn(async () => null), write: jest.fn(async () => {}), clear: jest.fn(async () => {}) } }));

configure({ asyncUtilTimeout: 5000 });

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);
jest.mock(
  "react-native-safe-area-context",
  () => require("react-native-safe-area-context/jest/mock").default,
);
jest.mock("expo-font", () => ({
  isLoaded: () => true,
  isLoading: () => false,
  loadAsync: jest.fn(async () => {}),
}));
jest.mock("expo-splash-screen", () => ({
  preventAutoHideAsync: jest.fn(async () => {}),
  hideAsync: jest.fn(async () => {}),
}));
jest.mock("expo-location", () => ({
  requestForegroundPermissionsAsync: jest.fn(async () => ({
    status: "denied",
  })),
  Accuracy: { Balanced: 3 },
}));

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
  jest.mocked(sessionStorage.read).mockResolvedValue(null);
  jest.mocked(sessionStorage.write).mockResolvedValue(undefined);
  jest.spyOn(passengerApi, "login").mockImplementation(async () => session());
  jest.spyOn(passengerApi, "verify").mockImplementation(async () => session());
  jest.spyOn(passengerApi, "logout").mockResolvedValue({ revoked: true });
  jest.spyOn(passengerApi, "current").mockImplementation(async () => session());
  jest.spyOn(passengerApi, "signup").mockResolvedValue({ challengeId: "challenge", expiresAt: Date.now() + 300000, resendAt: Date.now() + 60000, delivery: "provider" });
  jest.mocked(signInGoogle).mockRejectedValue(new Error("Google sign-in is not configured yet. Please use email sign-in."));
  jest
    .spyOn(AccessibilityInfo, "isReduceMotionEnabled")
    .mockResolvedValue(true);
});
afterEach(() => jest.restoreAllMocks());
it("opens the full Create Account screen from Sign Up and returns to welcome", async () => {
  render(<App />);
  fireEvent.press(await screen.findByRole("button", { name: "Sign Up" }));
  expect(screen.getByRole("header", { name: "Create Account" })).toBeTruthy();
  for (const label of [
    "Full Name",
    "Email Address",
    "Phone Number",
    "Password",
    "Confirm Password",
  ])
    expect(screen.getByLabelText(label)).toBeTruthy();
  expect(screen.queryByText("Meet Vooma Passenger")).toBeNull();
  fireEvent.press(screen.getByRole("button", { name: "Back to welcome" }));
  expect(screen.getByRole("button", { name: "Sign Up" })).toBeTruthy();
});
it("validates signup, verifies email and enters the authenticated account", async () => {
  render(<App />);
  fireEvent.press(await screen.findByRole("button", { name: "Sign Up" }));
  fireEvent.press(screen.getByRole("button", { name: "Create account" }));
  expect(screen.getByText("Enter your full name.")).toBeTruthy();
  fireEvent.changeText(screen.getByLabelText("Full Name"), "Lebo Passenger");
  fireEvent.changeText(
    screen.getByLabelText("Email Address"),
    "lebo@example.test",
  );
  fireEvent.changeText(screen.getByLabelText("Phone Number"), "082 123 4567");
  fireEvent.changeText(
    screen.getByLabelText("Password"),
    "sample-password-123",
  );
  fireEvent.changeText(
    screen.getByLabelText("Confirm Password"),
    "different-password",
  );
  fireEvent.press(screen.getByRole("button", { name: "Create account" }));
  expect(screen.getByText("Your passwords must match.")).toBeTruthy();
  fireEvent.press(screen.getByRole("button", { name: "Show password" }));
  expect(screen.getByLabelText("Password").props.secureTextEntry).toBe(false);
  fireEvent.changeText(
    screen.getByLabelText("Confirm Password"),
    "sample-password-123",
  );
  fireEvent.press(screen.getByRole("button", { name: "Create account" }));
  await screen.findByText("Verify your email");
  expect(screen.queryByText("Plan your ride")).toBeNull();
  fireEvent.changeText(screen.getByLabelText("Verification code"), "123456");
  fireEvent.press(screen.getByRole("button", { name: "Verify email" }));
  await screen.findByText("Plan your ride");
  expect(passengerApi.verify).toHaveBeenCalledWith("challenge", "123456", expect.any(AbortSignal));
  expect(sessionStorage.write).toHaveBeenCalledWith("vma_passenger_test");
  expect(JSON.stringify(await AsyncStorage.multiGet(await AsyncStorage.getAllKeys()))).not.toContain("sample-password-123");
});
it("opens sign-up policy information and routes the Sign in link to Sign In", async () => {
  render(<App />);
  fireEvent.press(await screen.findByRole("button", { name: "Sign Up" }));
  fireEvent.press(screen.getByRole("button", { name: "Privacy Policy." }));
  expect(
    screen.getByText(/Creating an account sends your name/),
  ).toBeTruthy();
  fireEvent.press(
    screen.getByRole("button", { name: "Back to Create Account" }),
  );
  fireEvent.press(screen.getByRole("button", { name: "Continue with Google" }));
  expect(await screen.findByText(/Google sign-in is not configured yet/)).toBeTruthy();
  fireEvent.press(screen.getByRole("button", { name: "Sign in" }));
  expect(screen.getByText("Sign in to continue")).toBeTruthy();
  expect(screen.getByLabelText("Password").props.value).toBe("");
});
it("shows the city welcome screen for returning passengers before opening Home", async () => {
  await AsyncStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ ...initialState, welcomed: true, name: "Lebo" }),
  );
  render(<App />);
  await screen.findByRole("button", { name: "Sign In" });
  expect(screen.getByText("HELLO")).toBeTruthy();
  expect(screen.getByText("Your ride starts here")).toBeTruthy();
  expect(screen.queryByText("Plan your ride")).toBeNull();
  expect(screen.queryByText("Continue to Vooma")).toBeNull();
  expect(screen.queryByText(/Passenger preview/)).toBeNull();
  fireEvent.press(screen.getByRole("button", { name: "Sign In" }));
  submitPreviewSignIn();
  await screen.findByText("Plan your ride");
});
it("keeps API failures on sign-in without allowing an authentication bypass", async () => {
  jest.mocked(passengerApi.login).mockRejectedValueOnce(new ApiError(503, "The sign-in service is unavailable. Please try again later."));
  render(<App />);
  fireEvent.press(await screen.findByRole("button", { name: "Sign In" }));
  submitPreviewSignIn();
  expect(await screen.findByText(/The sign-in service is unavailable/)).toBeTruthy();
  expect(screen.queryByText("Plan your ride")).toBeNull();
  expect(screen.queryByText("Explore passenger demo")).toBeNull();
  expect(sessionStorage.write).not.toHaveBeenCalled();
});
it("validates sign-in, toggles password visibility and clears fields when navigating back", async () => {
  render(<App />);
  fireEvent.press(await screen.findByRole("button", { name: "Sign In" }));
  fireEvent.press(screen.getByRole("button", { name: "Continue" }));
  expect(screen.getByText("Enter a valid email address.")).toBeTruthy();
  expect(screen.getByText("Enter your password.")).toBeTruthy();
  fireEvent.changeText(
    screen.getByLabelText("Password"),
    "sample-password-123",
  );
  fireEvent.press(screen.getByRole("button", { name: "Show password" }));
  expect(screen.getByLabelText("Password").props.secureTextEntry).toBe(false);
  fireEvent.press(screen.getByRole("button", { name: "Forgot password" }));
  expect(screen.getByText(/email has been sent/)).toBeTruthy();
  fireEvent.press(screen.getByRole("button", { name: "Back to Sign In" }));
  expect(screen.getByLabelText("Password").props.value).toBe("");
  fireEvent.changeText(
    screen.getByLabelText("Email address"),
    "lebo@example.test",
  );
  fireEvent.changeText(
    screen.getByLabelText("Password"),
    "sample-password-123",
  );
  fireEvent.press(screen.getByRole("button", { name: "Back to welcome" }));
  fireEvent.press(screen.getByRole("button", { name: "Sign In" }));
  expect(screen.getByLabelText("Email address").props.value).toBe("");
  expect(screen.getByLabelText("Password").props.value).toBe("");
});
it("does not restore an old in-flight read after the user resets the demo", async () => {
  await AsyncStorage.setItem(STORAGE_KEY, "{broken");
  render(<App />);
  await screen.findByText(/Your saved demo could not be loaded/);
  let finishRead!: (value: string | null) => void;
  jest.mocked(AsyncStorage.getItem).mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finishRead = resolve;
      }),
  );
  fireEvent.press(screen.getByText("Retry loading"));
  fireEvent.press(screen.getByText("Reset local demo data"));
  fireEvent.press(screen.getByText("Delete and start again"));
  await act(async () =>
    finishRead(
      JSON.stringify({ ...initialState, welcomed: true, name: "Old profile" }),
    ),
  );
  expect(await screen.findByRole("button", { name: "Sign In" })).toBeTruthy();
  await waitFor(async () =>
    expect(JSON.parse((await AsyncStorage.getItem(STORAGE_KEY))!)).toEqual(
      initialState,
    ),
  );
});
async function openApp() {
  render(<App />);
  fireEvent.press(await screen.findByRole("button", { name: "Sign In" }));
  submitPreviewSignIn();
  await screen.findByText("Plan your ride");
}
function submitPreviewSignIn() {
  fireEvent.changeText(
    screen.getByLabelText("Email address"),
    "lebo@example.test",
  );
  fireEvent.changeText(
    screen.getByLabelText("Password"),
    "sample-password-123",
  );
  fireEvent.press(screen.getByRole("button", { name: "Continue" }));
}
it("books, completes, rates and persists a demo trip through the passenger UI", async () => {
  await openApp();
  fireEvent.press(screen.getByLabelText("Go to Rosebank Mall"));
  fireEvent.press(screen.getByText(/Request demo ride/));
  fireEvent.press(await screen.findByText("Simulate driver match"));
  fireEvent.press(screen.getByText("Simulate driver arrival"));
  fireEvent.press(screen.getByText("Simulate starting trip"));
  expect(screen.queryByText("Cancel demo ride")).toBeNull();
  fireEvent.press(screen.getByText("Complete demo trip"));
  fireEvent.press(screen.getByLabelText("Rate 5 stars"));
  expect(screen.getByText("Thanks for your feedback!")).toBeTruthy();
  await waitFor(async () => {
    const state = JSON.parse((await AsyncStorage.getItem(accountKey))!);
    expect(state.rides[0].status).toBe("completed");
    expect(state.rides[0].rating).toBe(5);
  });
});
it("keeps a cancelled ride in history and allows a new ride", async () => {
  await openApp();
  fireEvent.press(screen.getByLabelText("Go to Rosebank Mall"));
  fireEvent.press(screen.getByText(/Request demo ride/));
  fireEvent.press(await screen.findByText("Cancel demo ride"));
  fireEvent.press(screen.getByText("Yes, cancel demo ride"));
  expect(screen.getByText("Plans change. That’s okay.")).toBeTruthy();
  await waitFor(async () =>
    expect(
      JSON.parse((await AsyncStorage.getItem(accountKey))!).rides[0].status,
    ).toBe("cancelled"),
  );
});
it("handles denied location access without inventing a current location", async () => {
  await openApp();
  fireEvent.press(screen.getByLabelText("Pickup: Sandton City"));
  fireEvent.press(screen.getByText("Use my current location"));
  expect(await screen.findByText(/Location permission is off/)).toBeTruthy();
  expect(screen.getByLabelText("Select Sandton City")).toBeTruthy();
});
it("does not overwrite unreadable local history without explicit reset", async () => {
  await AsyncStorage.setItem(STORAGE_KEY, "{broken");
  render(<App />);
  await screen.findByText(/Your saved demo could not be loaded/);
  expect(await AsyncStorage.getItem(STORAGE_KEY)).toBe("{broken");
  fireEvent.press(screen.getByText("Reset local demo data"));
  fireEvent.press(screen.getByText("Delete and start again"));
  await screen.findByRole("button", { name: "Sign In" });
  await waitFor(async () =>
    expect(JSON.parse((await AsyncStorage.getItem(STORAGE_KEY))!)).toEqual(
      initialState,
    ),
  );
});
it("surfaces storage failures and retries the latest state", async () => {
  await openApp();
  await act(async () => {});
  jest
    .mocked(AsyncStorage.setItem)
    .mockRejectedValueOnce(new Error("Disk full"));
  fireEvent.press(screen.getByLabelText("Profile"));
  fireEvent.press(screen.getByText("Your details"));
  fireEvent.changeText(screen.getByLabelText("Display name"), "Lebo");
  fireEvent.press(screen.getByText("Save details"));
  await screen.findByText(/could not be saved on this device/);
  fireEvent.press(screen.getByText("Retry saving"));
  await waitFor(async () =>
    expect(JSON.parse((await AsyncStorage.getItem(accountKey))!).name).toBe(
      "Lebo",
    ),
  );
});

it("requires Google profile completion before allowing access to Home", async () => {
  jest.mocked(signInGoogle).mockResolvedValue("google-token");
  jest.spyOn(passengerApi, "social").mockResolvedValueOnce({ onboardingRequired: true, name: "Google Passenger", email: "google@example.test" }).mockResolvedValueOnce(session());
  render(<App />);
  fireEvent.press(await screen.findByRole("button", { name: "Sign In" }));
  fireEvent.press(screen.getByRole("button", { name: "Continue with Google" }));
  await screen.findByText("Complete your profile");
  expect(screen.queryByText("Plan your ride")).toBeNull();
  fireEvent.press(screen.getByRole("button", { name: "Complete account" }));
  await screen.findByText("Enter your full name and a valid phone number.");
  fireEvent.changeText(screen.getByLabelText("Phone number"), "0821234567");
  fireEvent.press(screen.getByRole("button", { name: "Complete account" }));
  await screen.findByText("Plan your ride");
  expect(passengerApi.social).toHaveBeenLastCalledWith("google-token", { name: "Google Passenger", phone: "0821234567" }, undefined);
});
it("restores a valid native session and revokes it on sign-out", async () => {
  jest.mocked(sessionStorage.read).mockResolvedValueOnce("saved-token");
  render(<App />);
  await screen.findByText("Plan your ride");
  expect(passengerApi.current).toHaveBeenCalledWith("saved-token");
  fireEvent.press(screen.getByLabelText("Profile"));
  fireEvent.press(screen.getByRole("button", { name: "Sign out" }));
  await screen.findByRole("button", { name: "Sign In" });
  expect(passengerApi.logout).toHaveBeenCalledWith("saved-token");
  expect(sessionStorage.clear).toHaveBeenCalled();
});
it("discards an expired saved session and requires sign-in", async () => {
  jest.mocked(sessionStorage.read).mockResolvedValueOnce("expired-token");
  jest.mocked(passengerApi.current).mockRejectedValueOnce(new ApiError(401, "expired"));
  render(<App />);
  await screen.findByRole("button", { name: "Sign In" });
  expect(screen.queryByText("Plan your ride")).toBeNull();
  expect(sessionStorage.clear).toHaveBeenCalled();
});
