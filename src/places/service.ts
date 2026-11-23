import { requireOptionalNativeModule } from "expo";
import { Platform } from "react-native";
import { validPlace, type Place, type SavedPlace } from "../domain/passenger";
import { ApiError, passengerApi } from "../api/passenger";
import { sessionStorage } from "../api/sessionStorage";

export type Suggestion = {
  id: string;
  title: string;
  subtitle: string;
  provider: "apple" | "google";
};
export type SearchBias = { latitude: number; longitude: number };
type PlacesModule = {
  search(
    query: string,
    latitude: number | null,
    longitude: number | null,
    session: string,
  ): Promise<Suggestion[]>;
  resolve(id: string, session: string): Promise<Place>;
  endSession(session: string): Promise<void>;
};

function native(): PlacesModule {
  const module = requireOptionalNativeModule<PlacesModule>("VoomaPlaces");
  if (!module)
    throw new Error(
      Platform.OS === "web"
        ? "Address suggestions are available in the Android and iOS apps."
        : "Address search needs the updated Vooma app. Install the latest app build to search for places.",
    );
  return module;
}

function usesApi() {
  return (
    Platform.OS === "web" ||
    (Platform.OS === "android" &&
      !requireOptionalNativeModule<PlacesModule>("VoomaPlaces"))
  );
}
async function api<T>(path: string, input: object): Promise<T> {
  const token = await sessionStorage.read();
  if (!token) throw new Error("Sign in to search for places.");
  try {
    return (await passengerApi.discovery(path, input, token)) as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new Error(
      "Address search is temporarily unavailable. Please try again later.",
    );
  }
}

async function timed<T>(request: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      request,
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () =>
            reject(
              new Error(
                "Address search took too long. Check your connection and try again.",
              ),
            ),
          15000,
        );
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

export const placeSearch = {
  async suggest(
    query: string,
    session: string,
    bias?: SearchBias,
  ): Promise<Suggestion[]> {
    const matches = await timed(
      usesApi()
        ? api<Suggestion[]>("/v1/passenger/places/search", {
            query: query.trim(),
            session,
            ...(bias
              ? { bias: { latitude: bias.latitude, longitude: bias.longitude } }
              : {}),
          })
        : native().search(
            query.trim(),
            bias?.latitude ?? null,
            bias?.longitude ?? null,
            session,
          ),
    );
    return matches.filter(
      (match) =>
        match.id &&
        match.title &&
        (match.provider === "apple" || match.provider === "google"),
    );
  },
  async resolve(id: string, session: string): Promise<Place> {
    const place = await timed(
      usesApi()
        ? api<Place>("/v1/passenger/places/resolve", { id, session })
        : native().resolve(id, session),
    );
    if (
      !validPlace(place) ||
      place.provider !== (Platform.OS === "ios" ? "apple" : "google") ||
      !place.id.trim() ||
      !place.name.trim() ||
      (place.provider === "google" && !place.providerId)
    ) {
      throw new Error(
        "This place has no valid location. Choose another result.",
      );
    }
    return place;
  },
  async saved(bookmark: SavedPlace, session: string): Promise<Place> {
    if (bookmark.provider === "apple") {
      if (Platform.OS !== "ios")
        throw new Error(
          "Search for this place again using Google Maps on this device.",
        );
      return bookmark.place;
    }
    if (Platform.OS === "ios")
      throw new Error(
        "Search for this place again using Apple Maps on this device.",
      );
    return placeSearch.resolve(bookmark.providerId, session);
  },
  end(session: string) {
    void requireOptionalNativeModule<PlacesModule>("VoomaPlaces")
      ?.endSession(session)
      .catch(() => {});
  },
};
