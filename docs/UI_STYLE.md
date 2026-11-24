# Passenger UI styling

The passenger UI follows the sibling driver app's dashboard styling:

- `src/ui/theme.ts` centralizes the navy text/actions, pale blue surfaces,
  white cards, borders and shadows from the driver's `activityStyles.ts`,
  `homeStyles.ts` and dashboard `styles.ts`.
- `src/ui/HomeArtwork.tsx` reuses the driver's decorative skyline artwork.
- `src/ui/ScreenHeader.tsx` applies the driver's brand/header treatment to
  Home, Rides, Saved and Profile, with passenger-specific titles and descriptions.
- `src/ui/components.tsx` applies the same visual treatment to buttons,
  fields, cards, badges and sheets throughout the passenger flows.

Home uses the shared skyline and Vooma brand header, with a greeting using the
signed-in passenger's first name and "Where are you going today?" underneath.
The location/notification row sits below the header, followed by the rounded native
map and destination search. Ride options,
Recent places, quick-action tiles and the external maps button are omitted.
Demo ride requests, fare summaries and scheduling controls are also removed
from Home. Destination selection updates the map without creating a ride.
The map expands underneath the floating navbar; search, recenter and attribution
remain above it. The greeting uses the shared header typography. Pickup defaults to live
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

Account creation uses the driver's compact language-pill design, labelled ENG
and FR. The title aligns with the back arrow; the subtitle and language switch
share a separate row below it. Fields stay at least 54 points high with 17-point
input text. Shorter screens reduce spacing, not field or text sizes, and retain
scrolling for the keyboard, validation errors and larger accessibility text.
The preference is stored on the device independently of the account.
Signup, validation, email verification and Google profile completion use the
selected language without clearing entered values. This does not change the
backend email language or translate the rest of the passenger dashboard.

Keep new dashboard styles in the shared theme rather than introducing separate
card colours and shadows in each screen. Keep passenger actions, authentication,
booking state and saved places independent of the driver app's business logic.
