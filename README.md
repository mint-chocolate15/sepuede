# sepuede

Research projects, tasks, jobs, schedules, daily learnings, and publication outlines, with optional private Supabase accounts.

## Run locally

```sh
python -m http.server 4175
```

Open http://localhost:4175. Guest records stay in that browser. Email confirmation and recovery links return to the configured production site.

## Checks

```sh
node check-workspace.cjs
node check-account.cjs
node check-social.cjs
```

`supabase-verify.sql` tests database access rules within a transaction and rolls back all test fixtures. Run it in the Supabase SQL Editor after setup.

## Supabase setup

1. Run `supabase-setup.sql` in the project's SQL Editor.
2. In Authentication → URL Configuration, set Site URL to `https://mint-chocolate15.github.io/sepuede/` and allow this exact redirect URL.
3. Keep email confirmations enabled. Use a custom SMTP provider for confirmation and password recovery emails to general users. Supabase's default mail sender is restricted to project team addresses.
4. Put only the project URL and **publishable** key in `auth-config.js`. Never commit a secret key, service_role key, database password, personal access token, or SMTP credentials.
5. Publish the static files to GitHub Pages. The pinned Supabase browser SDK is bundled as `supabase.js` (2.102.0), with its license in `SUPABASE-LICENSE.txt`; no build step is needed.

For Google sign-in, follow [SOCIAL-LOGIN-SETUP.md](SOCIAL-LOGIN-SETUP.md). Google login uses the provider's identity verification and does not depend on confirmation emails. The button stays disabled until Supabase reports that the provider is enabled.

## Data behavior

Signed-in users load their own workspace from `sepuede_workspaces`, protected by database row-level security. Account data is cached under the authenticated user's ID; browser view settings and unfinished forms are also scoped to that account. Signing out removes the account cache and session from this browser. Guest records are kept separately and never uploaded automatically.

The import banner lets users explicitly add their existing browser records to their account. Import assigns new IDs and remaps relationships so existing cloud records remain intact. Same-day learnings are combined, not silently replaced.

Edits are saved to the user's local account cache before cloud sync. The status changes to **Cloud saved** only after Supabase confirms the write. Offline changes remain pending on the device. A revision check rejects stale updates from a second device instead of overwriting a newer workspace. On a conflict, export the pending device copy before loading the cloud copy.

Export backups regularly. Browser-only guest records and unsynced account changes cannot survive browser storage being cleared. Account records are accessible across browsers after they finish syncing.

Passwords are handled by Supabase Auth; the app does not store them. No private records or credentials are stored in this repository. Account security also depends on the hosting account, Supabase account, and the scripts published to the website.
