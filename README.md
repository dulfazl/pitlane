# PITLANE — Service Tracking App

Mobile app (Android + iOS) for [PITLANE | The Car Culture](https://pitlanegarage.in), Vadakara.
Customers hand over their car, then follow every step of the service live from their phone.
Staff update progress from the same app.

## What's inside

```
pitlane/
├── server/      Node.js + Express + SQLite REST API (no external DB needed)
├── app/         Expo (React Native) app — one codebase for Android & iOS
└── assets-src/  Brand assets extracted from the logo PDF
```

## Quick start

**1. Start the API** (needs Node 22.5+):

```sh
cd server
npm install
npm run seed     # loads demo customers/vehicles/jobs — also resets data anytime
npm start        # → http://localhost:4000
```

**2. Start the app:**

```sh
cd app
npm install
npx expo start
```

- Press `w` for the web preview, or
- Install **Expo Go** on your phone and scan the QR code (phone and computer must be
  on the same Wi-Fi — the app automatically finds the API on your computer).

## How it works

### Customer side — no password
Log in with a **phone number** or **vehicle number** (spacing/dashes don't matter):

| Demo login | Customer |
|---|---|
| `98470 12345` or `KL 18 AB 1234` | Arjun Menon — Creta, ceramic coating in progress |
| `97450 98765` or `KL 18 CD 5678` | Fathima Rasheed — C 200, PPF in quality check |
| `96560 11223` or `KL 18 EF 9012` | Vishnu Prasad — Swift respray + delivered Defender job |

Customers see: stage timeline (Received → Inspection → Work In Progress → Quality Check →
Ready → Delivered), live work checklist, updates feed from the workshop, estimated
delivery date and cost.

### Staff side
Tap **"PITLANE staff? Sign in here"** on the login screen. Default PIN: **`4321`**
(change it by starting the server with `STAFF_PIN=xxxx npm start`).

Staff can: see the workshop board, advance job stages, tick off checklist tasks,
post updates customers see instantly, and register new customers/vehicles/jobs.

## Deploying

Order matters: **deploy the server first**, then build the apps pointing at it.

### 1. Server (do this first)

Any Node 22+ host works. Easiest path — Railway (or Render):
1. Push this repo to GitHub.
2. railway.app → New Project → Deploy from GitHub → pick the repo, set root to `server/`.
3. Add a volume mounted at `/data` and set env vars:
   `PITLANE_DB=/data/pitlane.db` and `STAFF_PIN=<your real PIN>`.
4. Run `npm run seed` once from the Railway shell, then note your public URL
   (e.g. `https://pitlane-api.up.railway.app`). HTTPS is required by both stores.

### 2. App builds (EAS)

One-time setup:
```sh
npm install -g eas-cli
eas login                     # free account at expo.dev
cd app
```
Put your real server URL into `app/eas.json` (replace `YOUR-SERVER-URL-HERE` in both places).

**Demo on a real phone:**
- Android APK to share with anyone: `eas build --profile preview --platform android`
- iPhone (needs Apple Developer account): `eas build --profile preview --platform ios`
  after registering your iPhone with `eas device:create`.

**Store releases:**
```sh
eas build --platform ios --profile production      # then: eas submit -p ios
eas build --platform android --profile production  # then: eas submit -p android
```

### Store accounts needed

| Store | Account | Cost |
|---|---|---|
| App Store | developer.apple.com enrollment | $99/year |
| Play Store | play.google.com/console | $25 one-time |

Bundle IDs are already configured (`in.pitlanegarage.app`), as are the icon and splash.
For app review, include a demo phone number (e.g. seed data) in the review notes so
reviewers can log in.
