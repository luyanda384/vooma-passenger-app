import * as Location from "expo-location";
import type { Place } from "../domain/passenger";
import type { Suggestion } from "./service";

type Search = { places: Map<string, Place> };
const sessions = new Map<string, Search>();
let queue: Promise<void> = Promise.resolve();

// Expo Go includes Core Location geocoding, but cannot load our MapKit module.
// Run only on explicit submit and serialize lookups to respect geocoder limits.
export const appleAddressSearch = {
  suggest(query: string, session: string): Promise<Suggestion[]> {
    const search: Search = { places: new Map() };
    sessions.set(session, search);
    const task = queue.then(async () => {
      if (sessions.get(session) !== search) return [];
      try {
        const text = query.trim();
        const fixes = await Location.geocodeAsync(`${text}, South Africa`);
        const matches: Suggestion[] = [];
        for (const fix of fixes.slice(0, 3)) {
          if (sessions.get(session) !== search) return [];
          if (
            !Number.isFinite(fix.latitude) ||
            Math.abs(fix.latitude) > 90 ||
            !Number.isFinite(fix.longitude) ||
            Math.abs(fix.longitude) > 180
          )
            continue;
          const [address] = await Location.reverseGeocodeAsync({
            latitude: fix.latitude,
            longitude: fix.longitude,
          });
          if (
            !address ||
            (address.isoCountryCode && address.isoCountryCode !== "ZA")
          )
            continue;
          const street = [address.streetNumber, address.street]
            .filter(Boolean)
            .join(" ");
          const fullAddress = [
            ...new Set(
              [
                street,
                address.district,
                address.city,
                address.region,
                address.postalCode,
                address.country,
              ].filter(Boolean),
            ),
          ].join(", ");
          if (!fullAddress) continue;
          const id = `apple:geocode:${fix.latitude}:${fix.longitude}`;
          const title =
            address.name && address.name !== address.streetNumber
              ? address.name
              : street || text;
          const place: Place = {
            id,
            name: title,
            address: fullAddress,
            latitude: fix.latitude,
            longitude: fix.longitude,
            provider: "apple",
          };
          search.places.set(id, place);
          matches.push({ id, title, subtitle: fullAddress, provider: "apple" });
        }
        return sessions.get(session) === search ? matches : [];
      } catch {
        throw new Error(
          "Apple address search could not finish. Please try again.",
        );
      }
    });
    queue = task.then(
      () => {},
      () => {},
    );
    return task;
  },
  async resolve(id: string, session: string): Promise<Place> {
    const place = sessions.get(session)?.places.get(id);
    if (!place)
      throw new Error("This result has expired. Search for the address again.");
    return place;
  },
  end(session: string) {
    sessions.delete(session);
  },
};
