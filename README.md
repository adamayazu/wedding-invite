# Ayaz & Dhunya — wedding invitation

A static site (no build step) for Vercel. Guests open `/`. You edit everything at `/admin`.

## Deploy to Vercel

**Option 1 – command line**
1. Install once: `npm i -g vercel`
2. In this folder run `vercel`, answer the questions (framework: **Other**, no build command, output directory: leave blank / `./`).
3. Run `vercel --prod`. Vercel prints your live address.

**Option 2 – GitHub**
1. Put this folder in a GitHub repo.
2. In Vercel: Add New → Project → import the repo. Framework preset **Other**. Leave build command and output directory empty. Deploy.

## Edit the details (no code)

1. Open `https://YOUR-SITE/admin`
2. Sign in with `adamayaaz07@gmail.com` and the password of that Supabase account (the same login as the Brownie Bars app).
3. Change anything, watch the preview, press **Save**. Guests see it on their next open.

Things to replace first: venue, island, date and times, reply-by date, WhatsApp number, and the story / dress code / gifts wording.

## Let someone else (for example Dhunya) edit

She needs a Supabase Auth account first. Then run this once in the Supabase SQL editor:

    insert into public.invite_admin (user_id) select id from auth.users where email = 'her@email.com';

## Notes

- `config.js` holds the Supabase address and the *publishable* key. That key is meant to be public; the database rules decide who may write.
- `vercel.json` sets security headers. If you ever move to a different Supabase project, update `config.js` and (if it is not `*.supabase.co`) the `connect-src` entry there.
- If the database cannot be reached, guests still see the invitation using the last details their phone saw (or the built-in sample details).
- Optional, for a nicer WhatsApp link preview: in `index.html` add `<meta property="og:image" content="https://YOUR-SITE/img/scene.webp">`.
- `supabase/schema.sql` is a reference copy of the tables and rules already created.
