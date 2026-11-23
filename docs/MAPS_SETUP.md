# Passenger maps

Home and active trip details use `react-native-maps`, the same native library as
the driver app. Markers show the selected pickup and destination. The camera
fits both endpoints and the recenter button restores that view.

Home shows a rounded map sized to the available screen below its pickup header and greeting,
with destination search overlaid above the navbar. Demo request, fare and
scheduling controls have been removed from Home; selecting a destination only
updates the map and does not create a ride.
Home has no ride-options section, external maps button, Recent section or
place shortcut tiles; the external directions button
remains in active trip details. The map extends behind the floating navigation
bar, with search, recenter and provider attribution positioned above it. The
navbar's appearance is unchanged.

| Runtime                         | Embedded provider                                                  |
| ------------------------------- | ------------------------------------------------------------------ |
| Android Expo Go                 | Google Maps, using Expo Go's configuration                         |
| Android development/store build | Google Maps; requires the Android key                              |
| iOS Expo Go                     | Apple Maps (MapKit); Google native SDK is unavailable in this host |
| iOS development/store build     | Apple Maps; no Google key required                                 |
| Web                             | Selected-place card and Google Maps link; no native SDK import     |

The map button opens Apple Maps on iOS and Google Maps on Android/web, showing
the selected pickup or driving directions between the selected endpoints using
HTTPS links. Apple MapKit is an iOS provider; it is not embedded on Android.
Opening external maps happens only after a tap. Link failures display a retryable
error. A native map loading timeout offers retry; missing Android configuration
leaves place selection and external Google Maps available.

## Native build configuration

Set this in the passenger project's local `.env` or build environment:

```dotenv
GOOGLE_MAPS_ANDROID_API_KEY=YOUR_RESTRICTED_ANDROID_KEY
```

Enable Maps SDK for Android and Places API (New) in the same billing-enabled Google Cloud project.
Restrict the Android key to the passenger
package `com.vooma.passenger` and the correct signing certificate SHA-1 for each
build. Allow Maps SDK for Android and Places API (New) for this key. Driver-app
restrictions do not automatically authorize the passenger app. The native SDK
reads the existing Android manifest key; it is not exposed to JavaScript.
Do not put server routing credentials into this client.

`app.config.ts` supplies the Android key to the native config plugin and exposes
only a configuration boolean through `extra`. iOS always uses Apple Maps,
including when an old iOS Google key is present in the environment.
Rebuild the native app after adding or
changing a key; restarting Metro cannot update the installed binary. Expo Go
uses its own native configuration. No keys are committed in this repository.

## Live address suggestions

`modules/vooma-places` provides the native search APIs. All three pickers (pickup,
destination, Add new place) use it through `src/places/service.ts`:

- iOS: `MKLocalSearchCompleter` returns matching addresses and points of interest;
  `MKLocalSearch.Request(completion:)` resolves a selected result. No API key is needed.
- Android: Places SDK for Android (New) returns autocomplete predictions, then
  fetches ID, display name, formatted address and location for the selected place.
  Autocomplete and selection share a session token; closing the picker ends it.
- Requests start after two characters and a 300 ms typing pause. The current
  pickup biases nearby results without restricting searches to that location.
  Outdated responses and selections after dismissal are ignored. Errors, no
  matches and retry are explicit; no sample catalogue is used.

**Full native autocomplete requires a development or store build. Expo Go cannot
load the local native module.** In iOS Expo Go, the picker instead uses Apple's
address geocoder already included in Expo Location: enter a place or complete
street address with its suburb/city and tap **Search addresses** (or the keyboard
Search key). Review the returned address and select it. This is address lookup,
not autocomplete, so short partial business names may need a more precise query.
Lookups are serialized and run only after Search to respect geocoder limits.
Results and pending selections are discarded when the picker closes. Apple
results remain on the Apple map; no Google key is needed on iOS.

`expo-dev-client` is installed. Build Android with `npm run build:android`
on a machine with Android Studio/SDK, or iOS with `npm run build:ios` on a Mac with
Xcode. Then use `npm run start:dev` and open the installed Vooma app.
Rebuild after native module or key changes. Web and Android without the custom
module use the authenticated passenger Google Places API fallback.

Saved starts empty. Passengers choose a real search result and enter a label such
as Home or Work. Google favourites persist only the place ID and passenger's label;
fresh details are fetched when used. Apple favourites store the selected address
and coordinates locally. Favourites are offered when pickup/destination search is
empty. Schema v1 sample IDs migrate to an empty Saved list; other local data is
preserved. Legacy simulated rides remain in storage but are excluded from ride
lists. Saved no longer derives fake Recent places from sample data or trip previews.

## Location and ride limits

Home requests foreground location permission on entry and subscribes to device
updates, using the same location lifecycle as the driver app. Pickup defaults
to a fresh GPS fix and moves with the passenger. The pickup-header dropdown
opens the live address picker. Passengers can type a partial place/address or
choose a saved favourite. Autocomplete itself does not require GPS permission.
A manually chosen pickup stays fixed and stops the GPS watcher;
**Use my current location** switches back to live tracking.

In live mode, a fix must be at most 30 seconds old, within 100 metres of
reported accuracy, and contain valid coordinates.

Denied permission, disabled location services, timeout and inaccurate/stale
fixes show recovery controls instead of a fabricated live pickup.
Manual pickup and destination selection remain available. A selected manual
pickup can be displayed without a live fix. The initial map region is only a map
viewport; it never creates a sample pickup pin. Tracking stops on backgrounding
or leaving Home and resumes with a new permission check on returning to the
foreground. iOS temporary inactive states, including permission dialogs, do
not interrupt a pending location request. No background tracking is enabled.

Booking, fares and driver dispatch are not connected. The embedded map shows endpoints,
not an invented road route. Real directions are available in the external map
app. Server routing and live driver tracking still
need passenger-authorized backend integration.

## Verify on devices

- Android Expo Go and a signed Android build: tiles, markers, endpoint framing,
  recenter, directions, and missing/invalid key behavior.
- iPhone Expo Go: Apple map without attempting to load the Google native SDK.
- iOS development/store builds: Apple map and Apple directions.
- In native builds: search partial street names, businesses and suburbs in all
  three pickers; select results and verify coordinates. Save, restart and select a
  favourite. Test rapid typing, empty results, offline recovery and dismissal.
- Android: confirm Places API (New) activation and package/SHA-1 restrictions.
- Allow/deny foreground location; verify destination selection still works and
  live pickup requires a fresh fix. Test manual address selection and
  switching back to live pickup. Move the device and confirm the pickup pin
  updates; test leaving Home and background/foreground recovery.
- Pan/zoom, change pickup/destination, reopen an active trip, and test offline
  loading/retry and external map opening with/without Google Maps installed.

Unit tests and bundle export do not verify native SDK keys or on-device tiles.
Native Swift/Kotlin compilation and provider-backed device searches must also be
verified on machines with the appropriate native toolchains.

Search references: [Apple autocomplete](https://developer.apple.com/documentation/mapkit/mklocalsearchcompleter),
[Google autocomplete](https://developers.google.com/maps/documentation/places/android-sdk/place-autocomplete),
[Google Places setup](https://developers.google.com/maps/documentation/places/android-sdk/config),
[Expo local modules](https://docs.expo.dev/modules/get-started/).

References: [Expo maps setup](https://docs.expo.dev/versions/latest/sdk/map-view/),
[Google Maps URLs](https://developers.google.com/maps/documentation/urls/get-started),
[Apple Map Links](https://developer.apple.com/library/archive/featuredarticles/iPhoneURLScheme_Reference/MapLinks/MapLinks.html).

Location subscription reference: [Expo Location](https://docs.expo.dev/versions/latest/sdk/location/).
