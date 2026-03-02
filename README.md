# Lease — Residential & Business Premises

Simple static website for listing and booking residential and business premises.

How to run locally

1. Open the folder in your browser (double-click `index.html`) or serve with a static server.

Example using Python 3 http.server:

```bash
python -m http.server 8000
# then open http://localhost:8000
```

Files

- `index.html` — main page
- `styles.css` — site styles
- `script.js` — client-side listing logic and interactivity

Next steps you may want:

- Add a backend or CMS to store listings
- Add image assets and improved validation
- Integrate payments or booking confirmation emails

Run the full (frontend + API) app with Node.js

1. Install dependencies:

```bash
npm install
```

2. Start the server:

```bash
npm start
# open http://localhost:3000
```

The Node server serves the static site and exposes a simple API at `/api/listings`.

Deployment notes

- To deploy a static-only copy: use Netlify or Vercel with the project root as the publish directory. A `netlify.toml` and `vercel.json` are included to help route SPA requests.
- To deploy site + API together: use Render, Heroku, or any Node-capable host. A `Procfile` is included for Heroku.

API

- `GET /api/listings` — returns JSON array of listings
- `POST /api/listings` — add a listing (JSON body), saved to `listings.json`

Geolocation and distance filtering

- The site supports using your device location (button "Use my location") to calculate distances from listings.
- Enter a radius in kilometres in the search bar to filter listings within that radius.
- Distances are computed client-side with the Haversine formula; no location data is sent to external services.

Admin UI

- A browser-based admin form is available on the site to add new listings. It sends a `POST /api/listings` request and the server saves new entries into `listings.json`.
- The admin form includes a simple geocoding button (OpenStreetMap Nominatim) to look up coordinates from the address field.

Safer admin flow (login & sessions)

- The site now uses a JWT-based admin login. Use `POST /api/admin/login` with JSON `{ "user": "admin", "pass": "secret" }` to obtain a token.
- The admin form stores the token in `localStorage` and includes it as `Authorization: Bearer <token>` when adding listings.
- Server uses `ADMIN_USER`, `ADMIN_PASS_HASH`, and `ADMIN_JWT_SECRET` environment variables. If not set, defaults are used: user `admin`, password `password` (hashed at runtime), and JWT secret `dev-secret-change-me`.

Generating a password hash

Install dependencies and generate a bcrypt hash for a production password:

```bash
npm install
node generate_hash.js yourpassword
```

Set `ADMIN_USER`, `ADMIN_PASS_HASH` (the output), and `ADMIN_JWT_SECRET` in your environment before running in production.

Example (Windows PowerShell):

```powershell
setx ADMIN_USER "admin"
setx ADMIN_PASS_HASH "<paste-hash-here>"
setx ADMIN_JWT_SECRET "a-strong-secret"
```


