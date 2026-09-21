# TourismuBD

Place-first travel discovery and practical route planning for Bangladesh, starting with Sylhet District.

## Run locally

```bash
npm install
npm run dev
```

The app and its Leaflet map integration start together with this command; there is no separate map server to run. Live OpenStreetMap tiles, place lookup, and road routing require an internet connection. Trips are stored in the browser until Supabase is connected. Run the separate Admin app in another terminal:

```bash
npm run dev:admin
```

## Verify

Khulna Division's 67 destination pins and mainland visitor approaches are stored in
`src/data/khulna-coordinates.js`. They take precedence over stale database coordinates
and geocoding caches. Apply `068_khulna_division_place_coordinates.sql` to synchronize
the database pins; it updates only Khulna Division's ten districts.

Khulna uses [Valhalla's A* road routing](https://valhalla.github.io/valhalla/contributing/architecture/thor/path-algorithm/)
with [shortest-distance costing](https://valhalla.github.io/valhalla/api/route/api-reference/).
It chooses roads between supplied stops, not a globally optimal itinerary order.
Long requests are split at shared endpoints to respect the demo service's ten-point
limit. Routes are checked against the Bangladesh boundary before display and caching;
foreign road excursions trigger exclusions and a new search. If no safe route is
available, the app reports that instead of substituting a fastest or straight-line
road route. Boat journeys are separate from the driving distance. Internet access
and public routing/tile service availability are still required.

```bash
npm test
npm run build:all
```

## Deploy to GitHub Pages

Push the repository to GitHub and enable **Settings > Pages > Source: GitHub Actions**.
The workflow in `.github/workflows/deploy-pages.yml` builds and publishes the public app
after each push to `main`. Add these repository secrets before the first deployment:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

The Admin portal is not included in the static Pages deployment because its protected
operations require a separate server-side deployment.

For the browser flow, install the temporary test dependency and Chromium, start the app, then run the script:

```bash
python3 -m pip install -r requirements-dev.txt
python3 -m playwright install chromium
python3 tests/e2e.py
```

## Connect Supabase

1. Create a Supabase project.
2. Apply the files in `supabase/migrations` in numeric order.
3. Apply `supabase/seed.sql`.
4. Copy `.env.example` to `.env` and provide the public project URL and anon key.

Never expose `SUPABASE_SERVICE_ROLE_KEY` in the frontend. Provider identity files belong in the private verification bucket created by the migration.

## Account deactivation

Apply `016_account_deactivation.sql` and `017_account_deactivation_actions.sql`, deploy `supabase/functions/purge-deactivated-accounts`, then create a daily Supabase Cron job that posts to the function with a Secret API key stored in Vault. The function deletes only accounts that have remained deactivated for three calendar months and have not signed in again; Auth-user deletion stays server-side. See Supabase's [scheduled Edge Function guide](https://supabase.com/docs/guides/functions/schedule-functions) for the Vault and Cron SQL pattern.

## Admin portal

Admin operations use the independent `http://127.0.0.1:5176/` app and require email/password authentication plus an active `SUPER_ADMIN` profile. Set `VITE_ADMIN_URL` to the separate production Admin domain.

The local Vite development server bypasses the sign-in screen for UI development. Set `VITE_ADMIN_AUTH_BYPASS=false` to test the real sign-in flow locally. Production builds always require authentication, regardless of this variable.

1. In Supabase, open **Authentication > Users**.
2. Choose **Add user**, create or invite the administrator, and finish setting a password.
3. Open **SQL Editor** and promote the matching profile:

```sql
update public.profiles
set role = 'SUPER_ADMIN', status = 'ACTIVE', updated_at = now()
where email = 'admin@gmail.com';
```

Confirm that exactly one row is returned before signing in at the Admin URL:

```sql
select id, email, role, status
from public.profiles
where email = 'admin@gmail.com';
```

The portal can edit, hide/suspend/cancel, and permanently delete operational records under RLS. Audit history is read-only. Permanent deletion of an Auth user must use a server-side Supabase Admin API or Edge Function; the service-role key must never be added to this frontend.

## Current scope

- 10 canonical Sylhet places and curated 1–3 day itineraries
- 2–5 place route planning and local trip persistence
- honest Guide, Houseboat, Small Boat, Resort/Hotel, Car/Transport, Parking, and Area Tour empty states
- provider application preview
- shared provider discovery and booking requests for all seven service types
- separate role-gated Admin operations portal
- Supabase schema, RLS, contact gating, subscriptions, reviews, and audit logging

Live provider inventory, map-provider integration, and notification delivery require project credentials and verified operational data.
