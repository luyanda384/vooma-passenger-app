# Passenger UI styling

The passenger UI follows the sibling driver app's dashboard styling:

- `src/ui/theme.ts` centralizes the navy text/actions, pale blue surfaces,
  white cards, borders and shadows from the driver's `activityStyles.ts`,
  `homeStyles.ts` and dashboard `styles.ts`.
- `src/ui/HomeArtwork.tsx` reuses the driver's decorative skyline artwork.
- `src/ui/ScreenHeader.tsx` applies the driver's brand/header treatment to
  Rides, Saved and Profile, with passenger-specific titles and descriptions.
- `src/ui/components.tsx` applies the same visual treatment to buttons,
  fields, cards, badges and sheets throughout the passenger flows.

Home uses a location/notification header, greeting, rounded native map,
and destination search, following the supplied passenger reference. Ride options,
Recent places, quick-action tiles and the external maps button are omitted.
Demo ride requests, fare summaries and scheduling controls are also removed
from Home. Destination selection updates the map without creating a ride.
The map expands underneath the floating navbar; search, recenter and attribution
remain above it. The greeting uses 22-point text. Pickup defaults to live
foreground location, with a dropdown for editing the address or returning to
live mode. A manually selected pickup stays fixed while the passenger moves.
The existing floating navbar and its original brand colours remain unchanged.
Pickup, destination and Add new place share native autocomplete, loading/error
states and provider attribution. Saved contains only passenger-added bookmarks;
there is no seeded Recent list or sample destination catalogue in the UI.
Sign-in/welcome artwork already follows the shared Vooma onboarding design.

Account verification shares the signup skyline and pale blue background via
`src/ui/AccountBackground.tsx`. Six visual code boxes use one native input for
paste and OTP autofill. The resend countdown follows the server challenge;
verification and resend retain expiry/error handling. The bottom action stays
reachable in the keyboard-aware scroll view. Copy describes email verification,
which is the channel currently supported by the passenger API.

Keep new dashboard styles in the shared theme rather than introducing separate
card colours and shadows in each screen. Keep passenger actions, authentication,
booking state and saved places independent of the driver app's business logic.
