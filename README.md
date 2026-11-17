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
- Pickup selection, opt-in foreground GPS, and a searchable set of Johannesburg
  sample destinations. Location denial and timeout leave manual selection usable.
- Proposed Go, Comfort and XL options with sample ZAR estimates.
- Immediate and scheduled demo rides, with one active booking at a time.
- Explicit simulation from request to driver match, pickup and trip completion.
- Cancellation before trip start, completed-trip ratings, and demo trip sharing.
- Persistent trip history, saved places and an editable local display name.
- Cash selection, clear payment limitations, privacy information and confirmed
  local-data reset. No card data is collected.
- Accessible controls, safe-area handling, and phone/tablet/browser layouts.

The map is labelled illustrative. It does not display live GPS positions,
drivers or actual road routes. Distance uses a straight-line calculation with a
sample multiplier; fares and travel times are not commercial quotes. Scheduling
saves a local demonstration and never triggers background dispatch. Dates are
displayed in South African Standard Time.

## Storage

Native session token: Expo SecureStore `vooma.passenger.session.v1`. No passwords
or session tokens are stored in AsyncStorage. Web OAuth stores only short-lived
PKCE verifiers in sessionStorage so a full-page Google redirect can complete.

Demo history: AsyncStorage `vooma.passenger.demo.v1.<passenger-id>`. Includes
saved places, demo trips, coordinates, ratings and a local display name.
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
