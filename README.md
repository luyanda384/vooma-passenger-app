# Vooma Passenger

Expo passenger app for Android, iOS and web. Passenger authentication is connected
to the sibling Vooma API: email signup, six-digit email verification, password
signin, Google signin through Supabase, profile completion and logout.

Google users finish their name and phone before entering Home. An existing
verified email account can sign in with Google without creating a duplicate.
Vooma passenger sessions are separate from driver/admin credentials, last one
hour, and are saved in native secure storage. Web sessions stay in memory and
end on reload. Phone numbers are recorded but not verified.

Booking, dispatch, fares and payments remain an explicitly labelled local demo.
Authentication errors never grant demo access. Passenger demo history is scoped
to the authenticated account.

See [authentication setup](docs/AUTH_SETUP.md) for environment variables, local
email testing, Supabase Google configuration and native callback setup.

## Run

Requires Node.js 24 and npm. From this directory:

```powershell
npm.cmd ci
npm.cmd start
```

Scan the Expo QR code on a phone with a compatible Expo Go version, or use:

```powershell
npm.cmd run android
npm.cmd run ios
npm.cmd run web
```

iOS Simulator requires macOS. A physical iPhone can use Expo Go. On Windows,
`npm.cmd` avoids PowerShell script execution-policy errors. If another Expo app
is already using port 8081, run `npm.cmd run web -- --port 8087` instead.

## Included

- Branded introduction and responsive passenger navigation.
- Live GPS pickup by default, with a dropdown to choose a fixed pickup using
  Apple Maps (iOS) or Google Places (Android) autocomplete. Live mode
  requires a fresh fix; a chosen manual pickup can be used without live GPS.
- Map-focused Home with pickup and destination selection; demo request, fare
  and scheduling controls have been removed.
- Live suggestions for pickup, destination and adding favourites. Saved places
  use passenger-written labels; there are no preset favourites or Recent places.
- Previously saved simulations are retained in storage but hidden from Rides.
- Locally saved favourites and an editable display name.
- Clear payment limitations, privacy information and confirmed
  local-data reset. No card data is collected.
- Accessible controls, safe-area handling, and phone/tablet/browser layouts.

Home and active trips display native Google/Apple maps with selected pickup and
destination markers, recentering, and external directions. See
[maps setup](docs/MAPS_SETUP.md) for Android/iOS keys and Expo Go behavior.
The map does not display live drivers or in-app road routes.
Live address search requires a development/store build containing the local
`vooma-places` module; Expo Go cannot run it. Android also needs Places API (New)
enabled for the existing map key. See [maps setup](docs/MAPS_SETUP.md) for builds
and configuration. Booking, dispatch and payments are not connected.

## Storage

Native session token: Expo SecureStore `vooma.passenger.session.v1`. No passwords
or session tokens are stored in AsyncStorage. Web OAuth stores only short-lived
PKCE verifiers in sessionStorage so a full-page Google redirect can complete.

Local account data retains the existing AsyncStorage key
`vooma.passenger.demo.v1.<passenger-id>` for compatibility. Schema v2 stores real
saved-place bookmarks and preserves legacy trip data. Old sample favourite IDs
are removed on migration. Google bookmarks persist only place IDs and user labels;
details are fetched when selected. Apple bookmarks retain the selected place.
Corrupt data requires an explicit reset; failed writes expose a retry action.

## Validation

```powershell
npm.cmd run typecheck
npm.cmd test
npm.cmd run export
```

Tests cover booking rules, lifecycle transitions, scheduling, cancellation,
ratings, corrupt local data, location denial, persistence failures and a complete
passenger UI journey. Export generates Android, iOS and web bundles in `dist/`;
it does not create signed store binaries.

## Production integration

See [docs/INTEGRATION.md](docs/INTEGRATION.md) for the backend capabilities needed
to connect this app to Vooma's driver/admin ecosystem. There is deliberately no
fake production API client or automatic fallback from an API error to a demo.
