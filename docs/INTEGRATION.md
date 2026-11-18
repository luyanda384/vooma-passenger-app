# Connecting the passenger app

Passenger authentication now uses Vooma API for email/password and Supabase for
Google identity verification. See [AUTH_SETUP.md](AUTH_SETUP.md) for setup and
actual endpoint contracts. Account creation, profile completion and passenger
sessions are implemented. Phone verification, password recovery and account
management remain future work.

The remaining ride experience is local and simulated. Passenger clients must
never use driver OTP/password endpoints or admin credentials.

## Remaining backend work

2. **Places and routing:** authenticated address search, reverse geocoding, road
   routes, pickup validation and service area rules. Display actual coordinates
   on a native/web map. Keep server routing credentials on the API and restrict
   any public map keys by platform. Ask for location only when needed.
3. **Quotes:** server-owned category eligibility, price in integer minor units,
   ZAR currency, ETA, quote ID and expiry. Sample distance multipliers and prices
   in `src/domain/passenger.ts` must not determine a real charge.
4. **Bookings:** idempotent create, read and cancellation, ownership checks,
   optimistic versioning, cancellation policies and server-controlled lifecycle.
   Scheduled rides need durable server scheduling and explicit availability
   rules; a device timer is insufficient.
5. **Dispatch:** select eligible, approved, online drivers with fresh locations;
   atomically assign a driver; handle competing accepts, expiry and rejection;
   deliver real offers to the driver app. Publish authorized trip updates to
   both apps with reconnection and foreground-refresh handling.
6. **Driver trip lifecycle:** integrate arrival, pickup verification, start and
   completion with driver-side actions. Remove passenger simulation buttons
   from the live flow. A passenger must not be able to assign drivers or mark a
   real trip complete.
7. **Payments:** implement payment-provider tokenization, server reconciliation,
   receipts/refunds and any supported cash workflow. Card details must never be
   placed into the demo profile or application logs.
8. **History and support:** authenticated passenger trip history, rating
   submission, account deletion, support/contact tools and consented trip
   sharing. Include actual retention rules and support details before launch.
9. **Admin:** expose authorized trip/support workflows in the admin app once
   the backend contracts exist. Keep driver review and passenger data separate.

These are capability requirements, not existing endpoint contracts. Final route
names and payloads should be agreed in `vooma-api`, implemented and integration
tested before replacing the local demo provider.

## Frontend seams

- `src/domain/passenger.ts`: typed places, rides, presentation helpers and demo
  booking rules. Split server-owned quote/lifecycle behavior from UI types when
  integrating.
- `src/state/PassengerProvider.tsx`: local, versioned demo persistence. Introduce
  a separate authenticated server provider for live use; never silently use the
  demo as a fallback when a live request fails.
- `src/features/PlacePicker.tsx`: replace sample place filtering with the places
  service while preserving loading/error/permission handling.
- `src/ui/IllustratedMap.tsx`: decorative preview map. Replace with real map
  rendering and authenticated route/driver data for live use.
- `src/features/RideDetail.tsx`: demo actions and driver details. Replace with
  server-confirmed trip status and real communication capabilities.

## Device checks before release

Run on physical Android and iOS devices: location allow/deny/timeout, keyboard
interaction, large text, screen-reader labels, modal dismissal, reopening an
active trip, storage failure, background/foreground transitions and OS updates.
Bundle export alone does not verify native runtime behavior, permissions,
store signing, real driver interoperability or payment-provider integration.
