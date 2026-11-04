# Enable Google login

The app offers Google sign-in and checks Supabase's public provider settings. The button is usable only after Google is enabled. Provider secrets must be stored in Supabase, never in website files, GitHub, or chat.

## Shared settings

- App name: `sepuede`
- App homepage: `https://mint-chocolate15.github.io/sepuede/`
- Authorized JavaScript origin (Google): `https://mint-chocolate15.github.io`
- Provider callback: `https://bspgqgcsfxaytgfuqxqk.supabase.co/auth/v1/callback`
- App return URL in Supabase: `https://mint-chocolate15.github.io/sepuede/`

## Google

1. Visit https://console.cloud.google.com/auth/overview and select or create a project for sepuede. No paid cloud services are needed for this OAuth client.
2. Configure Google Auth branding, a support email, and the audience as External.
3. Use only the identity scopes: `openid`, `email`, and `profile`.
4. Create a Web application OAuth client with the JavaScript origin and callback above.
5. Enter its client ID and secret in Supabase → Authentication → Sign In / Providers → Google. Keep nonce checking enabled.
6. To let general users sign in, make the Google OAuth app available to the external audience rather than leaving it limited to test users. Complete any verification Google requires for your chosen branding and settings.

## Verify

Refresh sepuede and select Sign in or Create account. The Google option becomes available automatically. Complete a Google sign-in yourself, then confirm that account records save and load after a refresh. Use the same verified account identity when returning to an existing workspace.

The database continues to enforce ownership through Supabase Auth user IDs and row-level security. The app stores only the Supabase session needed for its own authentication; it strips Google API tokens from persisted browser auth storage.
