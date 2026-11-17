# Passenger authentication setup

## Local email signup and signin

1. Run the sibling API Docker stack. It applies PostgreSQL migrations and delivers
   signup emails to local Mailpit. These messages do not go to real inboxes.
2. Copy `.env.example` to `.env`. Set `EXPO_PUBLIC_API_BASE_URL` to the API host
   (for example `http://192.168.8.80:4000` on a phone), with
   `EXPO_PUBLIC_APP_ENV=development`. The API's `npm run local:wifi` also updates
   the passenger app and allows its web origin on port 8087.
3. Run `npm run web -- --port 8087` or `npx expo start --lan --clear`.
4. Choose Sign Up, enter name, email, phone and a 12–128 character password.
5. Open `http://localhost:8025`, read the six-digit code and enter it in the app.
   Codes expire in five minutes; resend is available after 60 seconds.
6. Home opens after verification. Sign out in Profile, then sign in with the
   same email/password. Native relaunch restores an unexpired token; web reload
   requires signin. Sessions last one hour.

Use synthetic email/phone values for local testing. Real email delivery requires
the API's SMTP/provider configuration; do not use Mailpit for production delivery.

## Google through the existing Vooma Supabase project

The Supabase Storage S3 access keys already in the API are **not** Auth API keys.
Open the existing project in Supabase, then Settings → API Keys and copy its
publishable key (`sb_publishable_…`; a legacy anon key also works).

Set these values in `vooma-api/.env`:

```dotenv
SUPABASE_URL=https://<existing-project-ref>.supabase.co
SUPABASE_PUBLISHABLE_KEY=<publishable-key>
```

Set the matching values in this app's `.env`:

```dotenv
EXPO_PUBLIC_SUPABASE_URL=https://<existing-project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<same-publishable-key>
```

Never use a secret/service-role key in the app. The backend verifies each social
token against the configured project's `/auth/v1/user`, requires a confirmed
email and matching verified Google identity, then issues its own passenger token.
Client-supplied email, role or metadata cannot authorize a passenger session.

In Google Cloud, configure an OAuth Web client and consent screen. Add the
Supabase callback shown by the Google provider panel, normally
`https://<existing-project-ref>.supabase.co/auth/v1/callback`, as an authorized
redirect URI. Add test users while the Google consent screen is in testing mode.
In Supabase Authentication → Sign In / Providers → Google, enable Google and
enter that Web client ID and client secret. The client secret stays in Supabase.

In Supabase Authentication → URL Configuration, add exact app redirects:

- `http://localhost:8087/` for local web testing.
- `vooma-passenger://auth/callback` for native builds.
- The production HTTPS web origin with trailing `/` when available.

Use localhost or HTTPS for web Google login: browsers do not provide the needed
WebCrypto API on a plain HTTP LAN address. Phone Google login requires a native
development/release build with the configured scheme, not Expo Go. Email login
works in Expo Go. Rebuild native apps after adding SecureStore/WebBrowser plugins.

Restart Expo after env changes. Rebuild/recreate the local API with both env files
so Docker receives Auth settings, retaining your selected storage compose file:

```powershell
# Default local MinIO stack:
docker compose --env-file .env --env-file .env.docker up --build -d --wait api
# If already using the Supabase Storage override, keep it:
# docker compose --env-file .env --env-file .env.docker -f compose.yaml -f compose.supabase.yaml up --build -d --wait api
```

## API contract

| Action | Route | Result |
| --- | --- | --- |
| Signup | POST `/v1/passenger/auth/signup` | 202 challenge; email not yet an account |
| Verify | POST `/v1/passenger/auth/signup/verify` | 201 passenger session |
| Resend | POST `/v1/passenger/auth/signup/resend` | 202 replacement challenge |
| Signin | POST `/v1/passenger/auth/login` | 200 passenger session |
| Google exchange | POST `/v1/passenger/auth/social` | Session or `onboardingRequired: true` |
| Session | GET `/v1/passenger/session` | Validated profile and expiry |
| Logout | POST `/v1/passenger/session/logout` | Revokes the current Vooma token |

Google exchange body: `{ "accessToken": "<supabase-user-token>" }`. If onboarding
is required, repeat with `profile: { name, phone }`. The API derives email from
the verified Google identity. New social-only accounts have no password login.
Verified email matches link to existing passenger accounts without changing their
profile/password. Subsequent Google logins resolve by project + subject + market.

## Validation and current limits

Run `npm run typecheck`, `npm test`, and `npm run export`. API tests exercise
real signup verification and mocked Supabase responses (invalid/expired tokens,
email linking, concurrent linking, role isolation and profile completion).
App tests exercise email verification, Google profile completion, secure session
restoration, logout and failure states. A real Google browser round trip still
requires the dashboard settings and a real test account.

Phone verification, password recovery, refresh tokens, passenger profile edits,
account deletion and production terms/privacy documents are not implemented.
Rides, dispatch and payments remain demonstrations.

References: [Supabase Expo social authentication](https://supabase.com/docs/guides/auth/quickstarts/with-expo-react-native-social-sign-in),
[server user verification](https://supabase.com/docs/reference/javascript/auth-getuser),
[Google provider setup](https://supabase.com/docs/guides/auth/social-login/auth-google).
