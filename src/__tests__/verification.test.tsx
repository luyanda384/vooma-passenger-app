import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { VerifyEmailScreen } from "../features/VerifyEmailScreen";
import { passengerApi, type Challenge } from "../api/passenger";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

const mockAccept = jest.fn(async () => {});
jest.mock("../state/AuthProvider", () => ({
  useAuth: () => ({ accept: mockAccept }),
}));
jest.mock("../api/passenger", () => ({
  passengerApi: { verify: jest.fn(), resend: jest.fn() },
}));
jest.mock("@expo/vector-icons/Ionicons", () => "Icon");
jest.mock(
  "react-native-safe-area-context",
  () => require("react-native-safe-area-context/jest/mock").default,
);

const now = Date.parse("2026-11-20T10:00:00Z");
const challenge: Challenge = {
  challengeId: "challenge-one",
  expiresAt: now + 300000,
  resendAt: now + 24000,
  delivery: "provider",
};
const onBack = jest.fn();
const onSignIn = jest.fn();

function show(initial = challenge) {
  return render(
    <VerifyEmailScreen
      initial={initial}
      email="passenger@example.com"
      onBack={onBack}
      onSignIn={onSignIn}
    />,
  );
}

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(now);
});
afterEach(() => jest.useRealTimers());

test("validates incomplete codes and submits a pasted six-digit code through the existing API", async () => {
  const session = {
    accessToken: "test-session",
    expiresAt: now + 600000,
    passenger: {
      id: "p1",
      name: "Passenger",
      email: "passenger@example.com",
      phone: "+27821234567",
      emailVerified: true as const,
      phoneVerified: false as const,
    },
  };
  jest.mocked(passengerApi.verify).mockResolvedValue(session);
  show();
  fireEvent.changeText(screen.getByLabelText("Verification code"), "12");
  fireEvent.press(screen.getByRole("button", { name: "Verify & Continue" }));
  expect(
    screen.getByText("Enter the six-digit code from your email."),
  ).toBeTruthy();
  expect(passengerApi.verify).not.toHaveBeenCalled();
  fireEvent.changeText(screen.getByLabelText("Verification code"), "123 456");
  expect(screen.getByLabelText("Verification code").props.value).toBe("123456");
  await act(async () =>
    fireEvent.press(screen.getByRole("button", { name: "Verify & Continue" })),
  );
  expect(passengerApi.verify).toHaveBeenCalledWith(
    "challenge-one",
    "123456",
    expect.any(AbortSignal),
  );
  expect(mockAccept).toHaveBeenCalledWith(session);
});

test("resend is gated by the server countdown and resets the code and challenge", async () => {
  jest
    .mocked(passengerApi.resend)
    .mockResolvedValue({
      ...challenge,
      challengeId: "challenge-two",
      resendAt: now + 84000,
    });
  show();
  fireEvent.changeText(screen.getByLabelText("Verification code"), "123");
  expect(screen.getByText(/00:24/)).toBeTruthy();
  fireEvent.press(screen.getByRole("button", { name: "Resend code" }));
  expect(passengerApi.resend).not.toHaveBeenCalled();
  act(() => jest.advanceTimersByTime(24000));
  await act(async () =>
    fireEvent.press(screen.getByRole("button", { name: "Resend code" })),
  );
  expect(passengerApi.resend).toHaveBeenCalledWith(
    "challenge-one",
    expect.any(AbortSignal),
  );
  expect(screen.getByLabelText("Verification code").props.value).toBe("");
  expect(screen.getByText(/01:00/)).toBeTruthy();
  fireEvent.changeText(screen.getByLabelText("Verification code"), "654321");
  await act(async () =>
    fireEvent.press(screen.getByRole("button", { name: "Verify & Continue" })),
  );
  expect(passengerApi.verify).toHaveBeenCalledWith(
    "challenge-two",
    "654321",
    expect.any(AbortSignal),
  );
});

test("expired challenges block verification and resend, while navigation stays available", () => {
  show({ ...challenge, expiresAt: now - 1 });
  fireEvent.press(screen.getByRole("button", { name: "Verify & Continue" }));
  fireEvent.press(screen.getByRole("button", { name: "Resend code" }));
  expect(passengerApi.verify).not.toHaveBeenCalled();
  expect(passengerApi.resend).not.toHaveBeenCalled();
  expect(screen.getByText(/This code has expired/)).toBeTruthy();
  fireEvent.press(
    screen.getByRole("button", { name: "Use a different email" }),
  );
  expect(onBack).toHaveBeenCalledTimes(1);
  fireEvent.press(screen.getByRole("button", { name: "Sign in" }));
  expect(onSignIn).toHaveBeenCalledTimes(1);
});

test("a failed verification displays the error and allows correcting the code", async () => {
  jest
    .mocked(passengerApi.verify)
    .mockRejectedValue(
      new Error("Code could not be verified. Please try again."),
    );
  show();
  fireEvent.changeText(screen.getByLabelText("Verification code"), "123456");
  await act(async () =>
    fireEvent.press(screen.getByRole("button", { name: "Verify & Continue" })),
  );
  expect(
    screen.getByText("Code could not be verified. Please try again."),
  ).toBeTruthy();
  expect(mockAccept).not.toHaveBeenCalled();
  fireEvent.changeText(screen.getByLabelText("Verification code"), "12345");
  expect(
    screen.queryByText("Code could not be verified. Please try again."),
  ).toBeNull();
});
