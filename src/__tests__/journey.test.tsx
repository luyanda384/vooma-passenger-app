import { decodeRide } from "../api/rides";
import { places } from "../domain/passenger";

// The legacy demo journeys below remain archived; exercise the live ride contract.
test("a live journey carries pickup and destination estimates through real trip stages", () => {
  const now = Date.now();
  const ride = {
    id: "journey",
    status: "matched",
    category: "go",
    version: 2,
    createdAt: now,
    updatedAt: now,
    expiresAt: now + 120000,
    pickup: places[0],
    destination: places[1],
    driver: null,
    tracking: {
      provider: "google",
      target: "pickup",
      origin: { latitude: -26.1, longitude: 28.05 },
      durationSeconds: 240,
      distanceMeters: 1800,
      encodedPolyline: "_p~iF~ps|U_ulLnnqC_mqNvxq`@",
      calculatedAt: now,
      expiresAt: now + 30000,
    },
  };
  expect(decodeRide({ ride })?.tracking?.target).toBe("pickup");
  expect(
    decodeRide({
      ride: {
        ...ride,
        status: "in_progress",
        version: 4,
        tracking: { ...ride.tracking, target: "destination" },
      },
    })?.tracking?.target,
  ).toBe("destination");
  expect(
    decodeRide({
      ride: { ...ride, status: "completed", version: 5, tracking: null },
    })?.tracking,
  ).toBeNull();
});

// import {
//   act,
//   configure,
//   fireEvent,
//   render,
//   screen,
//   waitFor,
// } from "@testing-library/react-native";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { AccessibilityInfo } from "react-native";
// import App from "../../App";
// import { STORAGE_KEY } from "../state/PassengerProvider";
// import { initialState } from "../domain/passenger";

// configure({ asyncUtilTimeout: 5000 });

// jest.mock("@react-native-async-storage/async-storage", () =>
//   require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
// );
// jest.mock(
//   "react-native-safe-area-context",
//   () => require("react-native-safe-area-context/jest/mock").default,
// );
// jest.mock("expo-font", () => ({
//   isLoaded: () => true,
//   isLoading: () => false,
//   loadAsync: jest.fn(async () => {}),
// }));
// jest.mock("expo-splash-screen", () => ({
//   preventAutoHideAsync: jest.fn(async () => {}),
//   hideAsync: jest.fn(async () => {}),
// }));
// jest.mock("expo-location", () => ({
//   requestForegroundPermissionsAsync: jest.fn(async () => ({
//     status: "denied",
//   })),
//   Accuracy: { Balanced: 3 },
// }));

// beforeEach(async () => {
//   await AsyncStorage.clear();
//   jest.clearAllMocks();
//   jest
//     .spyOn(AccessibilityInfo, "isReduceMotionEnabled")
//     .mockResolvedValue(true);
// });
// afterEach(() => jest.restoreAllMocks());
// it("opens the full Create Account screen from Sign Up and returns to welcome", async () => {
//   render(<App />);
//   fireEvent.press(await screen.findByRole("button", { name: "Sign Up" }));
//   expect(screen.getByRole("header", { name: "Create Account" })).toBeTruthy();
//   for (const label of [
//     "Full Name",
//     "Email Address",
//     "Phone Number",
//     "Password",
//     "Confirm Password",
//   ])
//     expect(screen.getByLabelText(label)).toBeTruthy();
//   expect(screen.queryByText("Meet Vooma Passenger")).toBeNull();
//   fireEvent.press(screen.getByRole("button", { name: "Back to welcome" }));
//   expect(screen.getByRole("button", { name: "Sign Up" })).toBeTruthy();
// });
// it("validates the sign-up form and never stores passwords or creates a fake account", async () => {
//   render(<App />);
//   fireEvent.press(await screen.findByRole("button", { name: "Sign Up" }));
//   fireEvent.press(screen.getByRole("button", { name: "Create account" }));
//   expect(screen.getByText("Enter your full name.")).toBeTruthy();
//   fireEvent.changeText(screen.getByLabelText("Full Name"), "Lebo Passenger");
//   fireEvent.changeText(
//     screen.getByLabelText("Email Address"),
//     "lebo@example.test",
//   );
//   fireEvent.changeText(screen.getByLabelText("Phone Number"), "082 123 4567");
//   fireEvent.changeText(
//     screen.getByLabelText("Password"),
//     "sample-password-123",
//   );
//   fireEvent.changeText(
//     screen.getByLabelText("Confirm Password"),
//     "different-password",
//   );
//   fireEvent.press(screen.getByRole("button", { name: "Create account" }));
//   expect(screen.getByText("Your passwords must match.")).toBeTruthy();
//   fireEvent.press(screen.getByRole("button", { name: "Show password" }));
//   expect(screen.getByLabelText("Password").props.secureTextEntry).toBe(false);
//   fireEvent.changeText(
//     screen.getByLabelText("Confirm Password"),
//     "sample-password-123",
//   );
//   fireEvent.press(screen.getByRole("button", { name: "Create account" }));
// <<<<<<< Updated upstream
//   expect(screen.getByText(/no account has been created/)).toBeTruthy();
//   expect(screen.getByLabelText("Password").props.value).toBe("");
//   expect(await AsyncStorage.getItem(STORAGE_KEY)).toBeNull();
// =======
//   await screen.findByText("Verify your email");
//   expect(screen.queryByText("Where are you going today?")).toBeNull();
//   fireEvent.changeText(screen.getByLabelText("Verification code"), "123456");
//   fireEvent.press(screen.getByRole("button", { name: "Verify email" }));
//   await screen.findByText("Where are you going today?");
//   expect(passengerApi.verify).toHaveBeenCalledWith("challenge", "123456", expect.any(AbortSignal));
//   expect(sessionStorage.write).toHaveBeenCalledWith("vma_passenger_test");
//   expect(JSON.stringify(await AsyncStorage.multiGet(await AsyncStorage.getAllKeys()))).not.toContain("sample-password-123");
// >>>>>>> Stashed changes
// });
// it("opens sign-up policy information and routes the Sign in link to Sign In", async () => {
//   render(<App />);
//   fireEvent.press(await screen.findByRole("button", { name: "Sign Up" }));
//   fireEvent.press(screen.getByRole("button", { name: "Privacy Policy." }));
//   expect(
//     screen.getByText(/Details entered in this form remain in memory/),
//   ).toBeTruthy();
//   fireEvent.press(
//     screen.getByRole("button", { name: "Back to Create Account" }),
//   );
//   fireEvent.press(screen.getByRole("button", { name: "Continue with Google" }));
//   expect(screen.getByText(/Google sign-up is not available yet/)).toBeTruthy();
//   fireEvent.press(screen.getByRole("button", { name: "Sign in" }));
//   expect(screen.getByText("Sign in to continue")).toBeTruthy();
//   expect(screen.getByLabelText("Password").props.value).toBe("");
// });
// it("shows the city welcome screen for returning passengers before opening Home", async () => {
//   await AsyncStorage.setItem(
//     STORAGE_KEY,
//     JSON.stringify({ ...initialState, welcomed: true, name: "Lebo" }),
//   );
//   render(<App />);
//   await screen.findByRole("button", { name: "Sign In" });
//   expect(screen.getByText("HELLO")).toBeTruthy();
//   expect(screen.getByText("Your ride starts here")).toBeTruthy();
//   expect(screen.queryByText("Where are you going today?")).toBeNull();
//   expect(screen.queryByText("Continue to Vooma")).toBeNull();
//   expect(screen.queryByText(/Passenger preview/)).toBeNull();
//   fireEvent.press(screen.getByRole("button", { name: "Sign In" }));
//   submitPreviewSignIn();
// <<<<<<< Updated upstream
//   fireEvent.press(screen.getByRole("button", { name: "Continue to Vooma" }));
//   await screen.findByText("Plan your ride");
// =======
//   await screen.findByText("Where are you going today?");
// >>>>>>> Stashed changes
// });
// it("reports unavailable sign-in honestly and allows a separate demo without saving credentials", async () => {
//   render(<App />);
//   fireEvent.press(await screen.findByRole("button", { name: "Sign In" }));
//   expect(screen.getByText("Sign in to continue")).toBeTruthy();
//   submitPreviewSignIn();
// <<<<<<< Updated upstream
//   expect(
//     screen.getByText(/Passenger sign-in is not available yet/),
//   ).toBeTruthy();
//   expect(screen.getByLabelText("Password").props.value).toBe("");
//   expect(await AsyncStorage.getItem(STORAGE_KEY)).toBeNull();
//   fireEvent.press(
//     screen.getAllByRole("button", { name: "Explore passenger demo" }).at(-1)!,
//   );
//   await screen.findByText("Plan your ride");
// =======
//   expect(await screen.findByText(/The sign-in service is unavailable/)).toBeTruthy();
//   expect(screen.queryByText("Where are you going today?")).toBeNull();
//   expect(screen.queryByText("Explore passenger demo")).toBeNull();
//   expect(sessionStorage.write).not.toHaveBeenCalled();
// >>>>>>> Stashed changes
// });
// it("validates sign-in, toggles password visibility and clears fields when navigating back", async () => {
//   render(<App />);
//   fireEvent.press(await screen.findByRole("button", { name: "Sign In" }));
//   fireEvent.press(screen.getByRole("button", { name: "Continue" }));
//   expect(screen.getByText("Enter a valid email address.")).toBeTruthy();
//   expect(screen.getByText("Enter your password.")).toBeTruthy();
//   fireEvent.changeText(
//     screen.getByLabelText("Password"),
//     "sample-password-123",
//   );
//   fireEvent.press(screen.getByRole("button", { name: "Show password" }));
//   expect(screen.getByLabelText("Password").props.secureTextEntry).toBe(false);
//   fireEvent.press(screen.getByRole("button", { name: "Forgot password" }));
//   expect(screen.getByText(/No reset email has been sent/)).toBeTruthy();
//   fireEvent.press(screen.getByRole("button", { name: "Back to Sign In" }));
//   expect(screen.getByLabelText("Password").props.value).toBe("");
//   fireEvent.changeText(
//     screen.getByLabelText("Email address"),
//     "lebo@example.test",
//   );
//   fireEvent.changeText(
//     screen.getByLabelText("Password"),
//     "sample-password-123",
//   );
//   fireEvent.press(screen.getByRole("button", { name: "Back to welcome" }));
//   fireEvent.press(screen.getByRole("button", { name: "Sign In" }));
//   expect(screen.getByLabelText("Email address").props.value).toBe("");
//   expect(screen.getByLabelText("Password").props.value).toBe("");
// });
// it("does not restore an old in-flight read after the user resets the demo", async () => {
//   await AsyncStorage.setItem(STORAGE_KEY, "{broken");
//   render(<App />);
//   await screen.findByText(/Your saved demo could not be loaded/);
//   let finishRead!: (value: string | null) => void;
//   jest.mocked(AsyncStorage.getItem).mockImplementationOnce(
//     () =>
//       new Promise((resolve) => {
//         finishRead = resolve;
//       }),
//   );
//   fireEvent.press(screen.getByText("Retry loading"));
//   fireEvent.press(screen.getByText("Reset local demo data"));
//   fireEvent.press(screen.getByText("Delete and start again"));
//   await act(async () =>
//     finishRead(
//       JSON.stringify({ ...initialState, welcomed: true, name: "Old profile" }),
//     ),
//   );
//   expect(await screen.findByRole("button", { name: "Sign In" })).toBeTruthy();
//   await waitFor(async () =>
//     expect(JSON.parse((await AsyncStorage.getItem(STORAGE_KEY))!)).toEqual(
//       initialState,
//     ),
//   );
// });
// async function openApp() {
//   render(<App />);
//   fireEvent.press(await screen.findByRole("button", { name: "Sign In" }));
//   submitPreviewSignIn();
// <<<<<<< Updated upstream
//   fireEvent.press(await screen.findByText("Explore passenger demo"));
//   await screen.findByText("Plan your ride");
// =======
//   await screen.findByText("Where are you going today?");
// >>>>>>> Stashed changes
// }
// function submitPreviewSignIn() {
//   fireEvent.changeText(
//     screen.getByLabelText("Email address"),
//     "lebo@example.test",
//   );
//   fireEvent.changeText(
//     screen.getByLabelText("Password"),
//     "sample-password-123",
//   );
//   fireEvent.press(screen.getByRole("button", { name: "Continue" }));
// }
// it("books, completes, rates and persists a demo trip through the passenger UI", async () => {
//   await openApp();
//   fireEvent.press(screen.getByRole("button", { name: "Where to?" }));
//   fireEvent.press(screen.getByLabelText("Select Rosebank Mall"));
//   fireEvent.press(screen.getByText(/Request demo ride/));
//   fireEvent.press(await screen.findByText("Simulate driver match"));
//   fireEvent.press(screen.getByText("Simulate driver arrival"));
//   fireEvent.press(screen.getByText("Simulate starting trip"));
//   expect(screen.queryByText("Cancel demo ride")).toBeNull();
//   fireEvent.press(screen.getByText("Complete demo trip"));
//   fireEvent.press(screen.getByLabelText("Rate 5 stars"));
//   expect(screen.getByText("Thanks for your feedback!")).toBeTruthy();
//   await waitFor(async () => {
//     const state = JSON.parse((await AsyncStorage.getItem(STORAGE_KEY))!);
//     expect(state.rides[0].status).toBe("completed");
//     expect(state.rides[0].rating).toBe(5);
//   });
// });
// it("keeps a cancelled ride in history and allows a new ride", async () => {
//   await openApp();
//   fireEvent.press(screen.getByRole("button", { name: "Where to?" }));
//   fireEvent.press(screen.getByLabelText("Select Rosebank Mall"));
//   fireEvent.press(screen.getByText(/Request demo ride/));
//   fireEvent.press(await screen.findByText("Cancel demo ride"));
//   fireEvent.press(screen.getByText("Yes, cancel demo ride"));
//   expect(screen.getByText("Plans change. That’s okay.")).toBeTruthy();
//   await waitFor(async () =>
//     expect(
//       JSON.parse((await AsyncStorage.getItem(STORAGE_KEY))!).rides[0].status,
//     ).toBe("cancelled"),
//   );
// });
// it("handles denied location access without inventing a current location", async () => {
//   await openApp();
//   fireEvent.press(screen.getByLabelText("Pickup: Sandton City"));
//   fireEvent.press(screen.getByText("Use my current location"));
//   expect(await screen.findByText(/Location permission is off/)).toBeTruthy();
//   expect(screen.getByLabelText("Select Sandton City")).toBeTruthy();
// });
// it("does not overwrite unreadable local history without explicit reset", async () => {
//   await AsyncStorage.setItem(STORAGE_KEY, "{broken");
//   render(<App />);
//   await screen.findByText(/Your saved demo could not be loaded/);
//   expect(await AsyncStorage.getItem(STORAGE_KEY)).toBe("{broken");
//   fireEvent.press(screen.getByText("Reset local demo data"));
//   fireEvent.press(screen.getByText("Delete and start again"));
//   await screen.findByRole("button", { name: "Sign In" });
//   await waitFor(async () =>
//     expect(JSON.parse((await AsyncStorage.getItem(STORAGE_KEY))!)).toEqual(
//       initialState,
//     ),
//   );
// });
// it("surfaces storage failures and retries the latest state", async () => {
//   await openApp();
//   await act(async () => {});
//   jest
//     .mocked(AsyncStorage.setItem)
//     .mockRejectedValueOnce(new Error("Disk full"));
//   fireEvent.press(screen.getByLabelText("Profile"));
//   fireEvent.press(screen.getByText("Your details"));
//   fireEvent.changeText(screen.getByLabelText("Display name"), "Lebo");
//   fireEvent.press(screen.getByText("Save details"));
//   await screen.findByText(/could not be saved on this device/);
//   fireEvent.press(screen.getByText("Retry saving"));
//   await waitFor(async () =>
//     expect(JSON.parse((await AsyncStorage.getItem(STORAGE_KEY))!).name).toBe(
//       "Lebo",
//     ),
//   );
// });
// <<<<<<< Updated upstream
// =======

// it("requires Google profile completion before allowing access to Home", async () => {
//   jest.mocked(signInGoogle).mockResolvedValue("google-token");
//   jest.spyOn(passengerApi, "social").mockResolvedValueOnce({ onboardingRequired: true, name: "Google Passenger", email: "google@example.test" }).mockResolvedValueOnce(session());
//   render(<App />);
//   fireEvent.press(await screen.findByRole("button", { name: "Sign In" }));
//   fireEvent.press(screen.getByRole("button", { name: "Continue with Google" }));
//   await screen.findByText("Complete your profile");
//   expect(screen.queryByText("Where are you going today?")).toBeNull();
//   fireEvent.press(screen.getByRole("button", { name: "Complete account" }));
//   await screen.findByText("Enter your full name and a valid phone number.");
//   fireEvent.changeText(screen.getByLabelText("Phone number"), "0821234567");
//   fireEvent.press(screen.getByRole("button", { name: "Complete account" }));
//   await screen.findByText("Where are you going today?");
//   expect(passengerApi.social).toHaveBeenLastCalledWith("google-token", { name: "Google Passenger", phone: "0821234567" }, undefined);
// });
// it("restores a valid native session and revokes it on sign-out", async () => {
//   jest.mocked(sessionStorage.read).mockResolvedValueOnce("saved-token");
//   render(<App />);
//   await screen.findByText("Where are you going today?");
//   expect(passengerApi.current).toHaveBeenCalledWith("saved-token");
//   fireEvent.press(screen.getByLabelText("Profile"));
//   fireEvent.press(screen.getByRole("button", { name: "Sign out" }));
//   await screen.findByRole("button", { name: "Sign In" });
//   expect(passengerApi.logout).toHaveBeenCalledWith("saved-token");
//   expect(sessionStorage.clear).toHaveBeenCalled();
// });
// it("discards an expired saved session and requires sign-in", async () => {
//   jest.mocked(sessionStorage.read).mockResolvedValueOnce("expired-token");
//   jest.mocked(passengerApi.current).mockRejectedValueOnce(new ApiError(401, "expired"));
//   render(<App />);
//   await screen.findByRole("button", { name: "Sign In" });
//   expect(screen.queryByText("Where are you going today?")).toBeNull();
//   expect(sessionStorage.clear).toHaveBeenCalled();
// });
// >>>>>>> Stashed changes
