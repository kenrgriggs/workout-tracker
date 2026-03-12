# Mobile Support Plan

This document covers what it takes to ship the workout tracker as a native iPhone app on the App Store. It evaluates the available paths and breaks the recommended approach into actionable phases.

---

## The options

There are three realistic paths from a React web app to an iPhone app. Only one makes sense here.

### Option A — PWA (Progressive Web App)

The app is already mobile-first and the OfflineSupport plan adds the PWA shell. A PWA can be added to the home screen and behaves app-like. No App Store required.

**Why this isn't enough:**
- iOS PWA support is weaker than Android — no push notifications (until very recently, and inconsistently), no home screen badge, limited background sync
- The app does not appear in the App Store
- Storage can be purged by iOS when the device is low on space
- Feels like a browser bookmark, not an app

PWA is a worthwhile complement but not a replacement for App Store distribution.

### Option B — React Native (rewrite)

React Native is a framework for building truly native mobile apps in JavaScript. Components map to native UIKit views, not web elements.

**Why this isn't the right call:**
- Every component in this codebase (`div`, `input`, `button`, CSS classes, inline styles, Tailwind) would need to be rewritten from scratch using React Native primitives (`View`, `TextInput`, `Pressable`, `StyleSheet`)
- The design system (CSS variables, Tailwind, `@layer`) does not carry over at all
- Estimated rewrite: the entire `src/components/` directory
- The result is a better native experience, but at a very high cost for a personal app

Worth considering if the app ever needs genuinely native features (ARKit, HealthKit deep integration, background location) or if performance becomes a real problem.

### Option C — Capacitor (recommended)

[Capacitor](https://capacitorjs.com/) by Ionic wraps your existing web app in a native WKWebView shell and gives it access to native iOS APIs. Your React code runs exactly as-is. Capacitor adds a thin native layer on top.

**Why this works here:**
- Zero changes to existing React components or CSS
- The Vite build output drops directly into the iOS project
- Ships as a real `.ipa` on the App Store — users install it like any other app
- Gives access to native APIs: haptic feedback, status bar control, keyboard behavior, push notifications, and more via plugins
- The same codebase builds for both web and iOS (and Android if wanted)

The rest of this document covers the Capacitor path.

---

## What you need before starting

- A Mac running macOS (required for iOS builds — Xcode is Mac-only)
- Xcode installed (free from the Mac App Store)
- An Apple Developer account ($99/year) — required to submit to the App Store
- Node.js and the existing project working locally

---

## Phase 1 — Install and configure Capacitor

**What:** Add Capacitor to the project and generate the iOS native project.

### Steps

```bash
npm install @capacitor/core @capacitor/cli @capacitor/ios
npx cap init
```

During `cap init` you'll be asked for:
- **App name:** Workout Tracker (or whatever you want displayed under the icon)
- **App ID:** A reverse-domain identifier, e.g. `com.yourname.workouttracker` — this must be unique on the App Store and cannot be changed later

This creates `capacitor.config.ts` in the project root:

```ts
import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.yourname.workouttracker',
  appName: 'Workout Tracker',
  webDir: 'dist',       // Vite's build output directory
  server: {
    androidScheme: 'https',
  },
}

export default config
```

Then add the iOS platform:

```bash
npx cap add ios
```

This generates an `ios/` directory containing a full Xcode project. This directory is committed to source control.

### Build and sync workflow

Every time you make changes to the web app, the deploy process is:

```bash
npm run build        # Vite builds to /dist
npx cap sync         # Copies /dist into the iOS project + updates plugins
npx cap open ios     # Opens Xcode (for builds and submission)
```

For development with live reload (no full build needed):

```bash
npx cap run ios --livereload --external
```

This runs the app on a connected iPhone and reloads on file changes.

### Files added
- `capacitor.config.ts`
- `ios/` directory (Xcode project — large, but committed to git)

### Files modified
- `package.json` (new dependencies)

---

## Phase 2 — iOS project configuration

**What:** Set up the Xcode project for your identity, App Store, and device targets.

Open Xcode via `npx cap open ios`. Work through the following in Xcode:

### Bundle ID and signing

1. Select the project in Xcode's sidebar → select the `App` target → **Signing & Capabilities** tab
2. Set **Bundle Identifier** to match what you set in `capacitor.config.ts` (e.g. `com.yourname.workouttracker`)
3. Select your Apple Developer account under **Team**
4. Enable **Automatically manage signing** — Xcode will handle provisioning profiles

### Deployment target

Set **Minimum Deployments** to iOS 16 or 17. iOS 16 covers ~95%+ of active devices. There is no reason to support older versions for a new personal app.

### App icons

Capacitor expects a single 1024×1024 PNG icon. A tool like [Icon Kitchen](https://icon.kitchen) generates all required sizes from it.

Place the generated icon set in `ios/App/App/Assets.xcassets/AppIcon.appiconset/`.

### Splash screen

Install the plugin:
```bash
npm install @capacitor/splash-screen
npx cap sync
```

Configure in `capacitor.config.ts`:
```ts
plugins: {
  SplashScreen: {
    launchAutoHide: true,
    launchShowDuration: 800,
    backgroundColor: '#0a0a0a',
    showSpinner: false,
  },
}
```

Create a splash image (2732×2732 px, `#0a0a0a` background with your logo centered) and place it in the Xcode asset catalog as `Splash`.

### Info.plist entries

Xcode requires human-readable usage descriptions for any sensitive API you access. This app does not currently use camera, microphone, or location, so no additions are needed now. If you add HealthKit later, entries will be required then.

### Files modified
- `ios/App/App/Info.plist` (via Xcode)
- `ios/App/App/Assets.xcassets/` (icons, splash)
- `capacitor.config.ts`

---

## Phase 3 — Safe area and display adjustments

**What:** The web layer already uses `viewport-fit=cover` and `100dvh`, but you may need small tweaks for the iPhone notch, Dynamic Island, and home indicator.

### Check `index.html`

Already correct:
```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
```

### Status bar

Install the plugin:
```bash
npm install @capacitor/status-bar
npx cap sync
```

In `src/main.jsx`, after the React render:
```js
import { StatusBar, Style } from '@capacitor/status-bar'
import { Capacitor } from '@capacitor/core'

if (Capacitor.isNativePlatform()) {
  StatusBar.setStyle({ style: Style.Dark })
  StatusBar.setBackgroundColor({ color: '#0a0a0a' })
}
```

This makes the status bar match the app's dark background. Without this, iOS may render it with a white or mismatched background.

### Keyboard behavior

On iOS, the software keyboard can push the viewport up or overlap input fields unexpectedly. Install:

```bash
npm install @capacitor/keyboard
npx cap sync
```

Add to `capacitor.config.ts`:
```ts
plugins: {
  Keyboard: {
    resize: 'body',
    resizeOnFullScreen: true,
  },
}
```

This ensures the keyboard resizes the body rather than the viewport, which works better with the app's fixed bottom nav.

### Bottom nav safe area

The bottom navigation bar already uses `env(safe-area-inset-bottom)` in its padding — that should work correctly. Verify on a physical device with a home indicator (any iPhone without a Home button).

### Files modified
- `src/main.jsx`
- `capacitor.config.ts`

---

## Phase 4 — Native API enhancements

**What:** Upgrade interactions with native iOS features that make the app feel like a real native app rather than a wrapped website.

These are all optional but have high impact on perceived quality.

### Haptic feedback

Physical feedback when logging a completed set or saving a meal. The difference between a web app and a native app.

```bash
npm install @capacitor/haptics
npx cap sync
```

Use in `WorkoutView.jsx` when a set is marked complete:
```js
import { Haptics, ImpactStyle } from '@capacitor/haptics'
import { Capacitor } from '@capacitor/core'

async function handleSetComplete(setId) {
  // ... existing logic ...
  if (Capacitor.isNativePlatform()) {
    await Haptics.impact({ style: ImpactStyle.Light })
  }
}
```

Use `ImpactStyle.Medium` for primary actions (saving a workout), `ImpactStyle.Light` for minor ones (toggling a set).

### Push notifications (optional, future)

If you ever want reminders ("Time to train — it's been 2 days"), install `@capacitor/push-notifications` and configure APNs in the Apple Developer portal. This requires a backend to send notifications, which Supabase Edge Functions can handle. Not needed now — note it for later.

### HealthKit integration (optional, future)

If you want workouts to appear in Apple Health:
- Requires the `@capacitor-community/health` plugin or a custom Swift plugin
- Needs additional entitlements in the Xcode project
- Adds a privacy usage description for HealthKit in `Info.plist`
- Non-trivial but well-documented

Worth doing if this is a serious training log — workouts appearing in Apple Health Activity gives a better overall health picture.

---

## Phase 5 — App Store submission

**What:** The steps to get from a working Xcode build to a live App Store listing.

### Apple Developer setup

1. Log in to [developer.apple.com](https://developer.apple.com)
2. Go to **Certificates, Identifiers & Profiles** → create an App ID matching your Bundle ID
3. Xcode's automatic signing handles the rest if you're signed in

### App Store Connect

1. Log in to [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. Create a new app — fill in name, bundle ID, primary language, SKU
3. Prepare your listing:
   - Screenshots (6.7" iPhone required; 6.1" optional but recommended)
   - App description and keywords
   - Age rating questionnaire
   - Privacy policy URL (required — even for a personal app, Apple requires one)

### Build and upload

In Xcode:
1. Set scheme to **Release**
2. Set destination to **Any iOS Device (arm64)**
3. **Product → Archive**
4. In the Organizer window, click **Distribute App → App Store Connect → Upload**

Then in App Store Connect, select the uploaded build under **TestFlight** for testing, then submit for review.

### Review timeline

Apple's review process typically takes 24–48 hours for a new app. Common rejection reasons:
- Missing privacy policy
- Screenshots that don't match the actual app
- App crashes on launch (test on a real device, not just the simulator)
- Vague app description

### Private vs public

You can submit as **Unlisted** (not searchable, only accessible via direct link) or fully public. For a personal app, Unlisted is a reasonable choice — you get App Store distribution without it appearing in search.

---

## Phase 6 — Build and release workflow

**What:** A repeatable process for pushing updates after the initial release.

### For web-only changes (no native code changed)

```bash
npm run build
npx cap sync
# Open Xcode → Archive → Upload
```

Increment the build number in Xcode each time. You can automate this with a script.

### For native changes (new plugins, config changes)

```bash
npm run build
npx cap sync
npx cap update ios    # Re-installs native plugins via CocoaPods
# Open Xcode → Archive → Upload
```

### Version numbering

Two numbers to keep in sync:
- **Version** (e.g. `1.2.0`) — what users see. Update in Xcode and `package.json`.
- **Build number** (e.g. `42`) — must increment with every upload to App Store Connect, even if the version doesn't change.

Consider automating build number increment as a pre-build script.

### Automate with Fastlane (optional)

[Fastlane](https://fastlane.tools) can automate the entire build-sign-upload pipeline into a single command:
```bash
fastlane release
```
This is overkill for a personal app but worth knowing about if the manual Xcode process gets tedious.

---

## New files summary

| File | Purpose |
|---|---|
| `capacitor.config.ts` | Capacitor configuration (app ID, web dir, plugin config) |
| `ios/` | Generated Xcode project (committed to git) |

## Modified files summary

| File | Change |
|---|---|
| `package.json` | Capacitor core, CLI, iOS, and plugin dependencies |
| `src/main.jsx` | Status bar initialization on native platform |
| `index.html` | Verify `viewport-fit=cover` (already present) |

## Dependencies to add

| Package | Why |
|---|---|
| `@capacitor/core` | Capacitor runtime |
| `@capacitor/cli` | Build and sync CLI |
| `@capacitor/ios` | iOS platform |
| `@capacitor/status-bar` | Control status bar appearance |
| `@capacitor/splash-screen` | Launch screen |
| `@capacitor/keyboard` | Keyboard resize behavior |
| `@capacitor/haptics` | Tactile feedback |

---

## Relationship to OfflineSupport.md

The PWA work in OfflineSupport.md (service worker, manifest) complements this plan:
- The service worker caches assets, which speeds up load time inside the WKWebView
- The web manifest is ignored by Capacitor (it has its own native manifest) but doesn't conflict
- The IndexedDB sync layer works identically inside a Capacitor app — WKWebView supports IndexedDB fully

Do the Capacitor setup first. Layer offline support on top.
