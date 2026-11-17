# Vooma Passenger

Passenger app for Android, iOS and web, built with Expo 58, React Native 0.88
and TypeScript. Uses the Vooma logo and colour palette from the sibling driver
app. The driver, admin and API repositories are unchanged.

Launch uses the driver's white splash, navy/orange Vooma mark and wordmark,
lower-screen placement, and three-second reveal/pulse followed by a fade.
Reduced-motion preferences skip the animation. The Android native splash uses
the same `entry-splash.png`; iOS starts white, matching the driver configuration.
Native splash changes require a new development or release build; Expo Go's
own launch screen is controlled by Expo Go. The in-app splash also runs on web.
The second launch screen reuses the driver's city background, animated car,
HELLO heading and rounded Sign In / Sign Up buttons. Both screens appear on
every cold launch, including when a local profile already exists. Account
buttons explain preview availability; Explore passenger demo / Continue to
Vooma opens the passenger app without creating an account.

This first version is an **explicit local demo**. It does not create passenger
accounts, contact drivers, book real rides or process payments. The current
`vooma-api` implements driver onboarding and admin review, not passenger booking
or dispatch. The app never calls driver authentication endpoints as a passenger.

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

AsyncStorage key: `vooma.passenger.demo.v1`. Stores the demo display name,
favourite place IDs, trips (including coordinates), and ratings on this device.
No credentials are required or stored. Invalid saved data is not silently
overwritten: the user can retry or explicitly reset it. Failed writes show a
retry action. **Profile → Privacy & local data** provides the reset flow.

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
