# Setting Up Google Sign-In

How to turn on "Continue with Google" for the portal. Google sends people back to Supabase (project NWT-Main), and Supabase then sends them back to the portal.

## 1. Create the Google OAuth client

In the [Google Cloud Console](https://console.cloud.google.com/), use a project owned by the company's Google Workspace.

1. Go to **APIs & Services → OAuth consent screen** (in newer consoles: **Google Auth Platform**).
   - Set **User type** to **Internal**, so only company Google accounts can sign in.
   - App name: `FFL Operations Portal`. Add a support email.
   - Under scopes, keep the defaults: `openid`, `email`, `profile`.
2. Go to **Credentials → Create credentials → OAuth client ID** (or **Clients → Create client**).
   - **Application type:** Web application
   - **Authorized JavaScript origins:** `http://localhost:3000`, plus the Vercel URL once the portal is deployed
   - **Authorized redirect URIs:** `https://ufrictpsiwoqaakdcrxd.supabase.co/auth/v1/callback`
3. Copy the **Client ID** and **Client secret**. Treat the secret like a password: don't commit it or paste it in chat.

## 2. Turn on Google in Supabase

In the Supabase dashboard, open the NWT-Main project.

1. Go to **Authentication → Sign In / Providers → Google** and turn it on.
2. Paste in the **Client ID** and **Client secret**, then save.
3. Check that the callback URL shown there matches the redirect URI from step 1.2.

## 3. Set the portal's redirect URLs

Go to **Authentication → URL Configuration**.

- **Site URL:** `http://localhost:3000` for now, and the Vercel URL once the portal is live.
- **Redirect URLs:** add `http://localhost:3000/auth/callback`, and later `https://<vercel-domain>/auth/callback`.

## 4. Test it

1. Run `npm run dev` in `client`. Make sure live mode is on, either with `NEXT_PUBLIC_DATA_MODE=live` or the dev toggle.
2. Open `http://localhost:3000/login` and choose **Continue with Google**.
3. After you sign in, you should land back in the portal. It will be empty until you're granted access with `yarn grant-membership <your-email> <role> <business-slugs...>` (see the server repo's `docs/grant-membership.md`).

## Common errors

| Error | Fix |
| --- | --- |
| `redirect_uri_mismatch` (from Google) | The redirect URI in Google must be exactly the Supabase callback URL from step 1.2. |
| Sent to the wrong page, or bounced to the Site URL | Add `/auth/callback` for that host under Supabase's Redirect URLs. |
| "Access blocked" for someone's account | The consent screen is set to Internal, so personal Gmail accounts can't sign in. This is intended. |

## Notes

- Even with the Internal consent screen, the portal doesn't yet hint or enforce the company domain in its own code; that's still a TODO.
- People can also sign in with an email link. Either way, nobody sees any data until they're granted a membership.
