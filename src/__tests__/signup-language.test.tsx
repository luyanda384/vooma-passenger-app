import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { SignUpScreen } from "../features/SignUpScreen";
import {
  LanguageProvider,
  LANGUAGE_STORAGE_KEY,
} from "../i18n/LanguageProvider";
import { passengerApi } from "../api/passenger";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);
jest.mock("../state/AuthProvider", () => ({
  useAuth: () => ({ google: jest.fn(), accept: jest.fn() }),
}));
jest.mock("../api/passenger", () => ({
  passengerApi: { signup: jest.fn(), verify: jest.fn(), resend: jest.fn() },
}));
jest.mock("@expo/vector-icons/Ionicons", () => "Icon");
jest.mock(
  "react-native-safe-area-context",
  () => require("react-native-safe-area-context/jest/mock").default,
);

function show() {
  return render(
    <LanguageProvider>
      <SignUpScreen onBack={jest.fn()} onSignIn={jest.fn()} />
    </LanguageProvider>,
  );
}
beforeEach(async () => {
  await AsyncStorage.clear();
});

test("switching language preserves input, submits unchanged account details and carries French into verification", async () => {
  const app = show();
  await screen.findByLabelText("Full Name");
  fireEvent.changeText(screen.getByLabelText("Full Name"), "Marie Test");
  fireEvent.changeText(
    screen.getByLabelText("Email Address"),
    "marie@example.test",
  );
  fireEvent.changeText(screen.getByLabelText("Phone Number"), "0821234567");
  fireEvent.changeText(
    screen.getByLabelText("Password"),
    "A long test password",
  );
  fireEvent.changeText(
    screen.getByLabelText("Confirm Password"),
    "A long test password",
  );
  fireEvent.press(screen.getByRole("radio", { name: "Français" }));
  await screen.findByLabelText("Nom complet");
  expect(screen.getByLabelText("Nom complet").props.value).toBe("Marie Test");
  expect(screen.getByLabelText("Mot de passe").props.value).toBe(
    "A long test password",
  );
  expect(
    screen.getByRole("radio", { name: "Français" }).props.accessibilityState
      .checked,
  ).toBe(true);
  jest
    .mocked(passengerApi.signup)
    .mockResolvedValue({
      challengeId: "test",
      expiresAt: Date.now() + 300000,
      resendAt: Date.now() + 60000,
      delivery: "localTest",
    });
  fireEvent.press(screen.getByRole("button", { name: "Créer un compte" }));
  await screen.findByText("Vérifiez votre compte");
  expect(passengerApi.signup).toHaveBeenCalledWith(
    {
      name: "Marie Test",
      email: "marie@example.test",
      phone: "0821234567",
      password: "A long test password",
    },
    expect.any(AbortSignal),
  );
  expect(screen.getByLabelText("Code de vérification")).toBeTruthy();
  expect(await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("fr");
  app.unmount();
  show();
  await screen.findByLabelText("Nom complet");
  fireEvent.press(screen.getByRole("radio", { name: "English" }));
  await screen.findByLabelText("Full Name");
  expect(await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("en-ZA");
});

test("existing validation errors switch language and a failed save keeps the current selection", async () => {
  show();
  await screen.findByLabelText("Full Name");
  fireEvent.press(screen.getByRole("button", { name: "Create account" }));
  expect(screen.getByText("Enter your full name.")).toBeTruthy();
  jest
    .mocked(AsyncStorage.setItem)
    .mockRejectedValueOnce(new Error("Storage unavailable"));
  fireEvent.press(screen.getByRole("radio", { name: "Français" }));
  await screen.findByText(
    "Could not save your language preference. Please try again.",
  );
  expect(
    screen.getByRole("radio", { name: "English" }).props.accessibilityState
      .checked,
  ).toBe(true);
  fireEvent.press(screen.getByRole("radio", { name: "Français" }));
  await screen.findByText("Saisissez votre nom complet.");
  expect(
    screen.getByText("Les mots de passe doivent être identiques."),
  ).toBeTruthy();
  expect(screen.queryByText("Enter your full name.")).toBeNull();
});

test("an unsupported stored preference falls back to English and remains changeable", async () => {
  await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, "unsupported");
  show();
  await screen.findByLabelText("Full Name");
  fireEvent.press(screen.getByRole("radio", { name: "Français" }));
  await waitFor(() =>
    expect(screen.getByLabelText("Nom complet")).toBeTruthy(),
  );
});
