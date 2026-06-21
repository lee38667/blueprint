# Selenium smoke tests

End-to-end smoke checks that drive a real browser against the running Blueprint
app. Browser drivers are resolved automatically by **Selenium Manager** (bundled
with `selenium-webdriver`) — there is no separate chromedriver to install.

## Prerequisites

- A Chromium/Chrome, Firefox, or Edge browser installed locally.
- The app running and reachable (default `http://localhost:3000`).

## Run

```bash
# Terminal 1 — start the app
npm run dev

# Terminal 2 — run the smoke test
npm run test:smoke
```

## Configuration (env vars)

| Var        | Default                 | Purpose                                  |
|------------|-------------------------|------------------------------------------|
| `BASE_URL` | `http://localhost:3000` | Base URL of the running app              |
| `HEADLESS` | `true`                  | Set `false` to watch the browser run     |
| `BROWSER`  | `chrome`                | `chrome` \| `firefox` \| `edge`          |

Example — watch it run against a deployed preview in Firefox:

```bash
BASE_URL=https://my-preview.vercel.app HEADLESS=false BROWSER=firefox npm run test:smoke
```

## What it verifies

1. `/login` responds with the Blueprint document title.
2. The login email and password fields render.
3. The email field is interactive (typed input is accepted).
4. `/register` renders its email field.
5. A protected route (`/dashboard`) redirects an unauthenticated visitor to `/login`.

Exit code `0` = all checks passed, `1` = one or more failed, `2` = browser/driver
could not start.

> These are unauthenticated smoke checks — they never submit real credentials. To
> extend coverage into authenticated flows, seed a Supabase test user and add a
> login step before navigating to protected routes.
