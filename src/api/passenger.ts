export type Passenger = {
  id: string;
  name: string;
  email: string;
  phone: string;
  emailVerified: true;
  phoneVerified: false;
};
export type Session = {
  accessToken: string;
  expiresAt: number;
  passenger: Passenger;
};
export type Challenge = {
  challengeId: string;
  expiresAt: number;
  resendAt: number;
  delivery: "provider" | "localTest";
};
export type Signup = {
  name: string;
  email: string;
  phone: string;
  password: string;
};
export type SocialResult =
  Session | { onboardingRequired: true; name: string; email: string };
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

// Expo inlines these public settings. Secrets belong only in Vooma API.
function configuredUrl() {
  const value = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (!value)
    throw new ApiError(0, "Sign-in is not configured. Please try again later.");
  const url = new URL(value);
  const local =
    /^(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)$/.test(
      url.hostname,
    );
  if (
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== "/" ||
    (url.protocol !== "https:" &&
      !(
        url.protocol === "http:" &&
        local &&
        process.env.EXPO_PUBLIC_APP_ENV === "development"
      ))
  ) {
    throw new ApiError(0, "The sign-in service address is invalid.");
  }
  return url.origin;
}
export function createPassengerApi(baseUrl: () => string = configuredUrl) {
  async function request<T>(
    path: string,
    body?: object,
    token?: string,
    signal?: AbortSignal,
  ): Promise<T> {
    const controller = new AbortController();
    const cancel = () => controller.abort();
    if (signal?.aborted) controller.abort();
    signal?.addEventListener("abort", cancel);
    const timer = setTimeout(cancel, 15000);
    try {
      const response = await fetch(`${baseUrl()}${path}`, {
        method: body === undefined ? "GET" : "POST",
        headers: {
          Accept: "application/json",
          ...(body ? { "Content-Type": "application/json" } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal,
        credentials: "omit",
      });
      if (!response.ok) {
        if (path.includes("/nearby") || path.includes("/places/"))
          throw new ApiError(
            response.status,
            response.status === 401
              ? "Your session expired. Sign in again."
              : response.status === 429
                ? "Please wait before refreshing again."
                : path.includes("/places/")
                  ? response.status === 400
                    ? "Try searching with a place name, suburb or street address."
                    : "Address search is temporarily unavailable. Please try again later."
                  : "This service is unavailable. Please try again.",
          );
        const message =
          response.status === 401
            ? "Your details or verification code could not be verified. Please try again."
            : response.status === 429
              ? "Too many attempts. Please wait before trying again."
              : response.status === 409
                ? "This account is already connected to another identity. Please use email sign-in."
                : response.status === 400
                  ? "Check your name, email, phone number and password."
                  : "The sign-in service is unavailable. Please try again later.";
        throw new ApiError(response.status, message);
      }
      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(
        0,
        "Could not connect to Vooma. Check your connection and try again.",
      );
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener("abort", cancel);
    }
  }
  return {
    discovery: (
      path: string,
      input: object,
      token: string,
      signal?: AbortSignal,
    ) => request<unknown>(path, input, token, signal),
    social: (
      accessToken: string,
      profile?: { name: string; phone: string },
      signal?: AbortSignal,
    ) =>
      request<SocialResult>(
        "/v1/passenger/auth/social",
        { accessToken, ...(profile ? { profile } : {}) },
        undefined,
        signal,
      ),
    signup: (input: Signup, signal?: AbortSignal) =>
      request<Challenge>("/v1/passenger/auth/signup", input, undefined, signal),
    resend: (challengeId: string, signal?: AbortSignal) =>
      request<Challenge>(
        "/v1/passenger/auth/signup/resend",
        { challengeId },
        undefined,
        signal,
      ),
    verify: (challengeId: string, code: string, signal?: AbortSignal) =>
      request<Session>(
        "/v1/passenger/auth/signup/verify",
        { challengeId, code },
        undefined,
        signal,
      ),
    login: (email: string, password: string, signal?: AbortSignal) =>
      request<Session>(
        "/v1/passenger/auth/login",
        { email, password },
        undefined,
        signal,
      ),
    current: (token: string, signal?: AbortSignal) =>
      request<Omit<Session, "accessToken">>(
        "/v1/passenger/session",
        undefined,
        token,
        signal,
      ),
    logout: (token: string) =>
      request<{ revoked: true }>("/v1/passenger/session/logout", {}, token),
  };
}
export const passengerApi = createPassengerApi();
