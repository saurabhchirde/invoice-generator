# Invoice Generator

A full-featured invoice generator built with React, Vite, Tailwind CSS v4, and shadcn/ui. Create, edit, preview, print, and manage invoices — with optional **cloud sync** via Firebase. Works completely offline with localStorage, or enable cloud features by configuring Firebase environment variables.

## Features

### Invoice Management
- Create, edit, clone, and delete invoices
- Live preview with multi-page support
- Print / PDF-ready A4 layout with intelligent page breaking
- Filter invoices by status — All, Paid, Due, Overdue

### Line Items & Calculations
- Unlimited line items with auto-calculated subtotals
- Percentage-based discount
- GST support (SGST & CGST)
- Payment tracking with paid amount, due amount, and progress bar

### Customization
- Toggle visibility of individual sections (company info, client info, dates, taxes, terms, bank details, signatory, website)
- Custom terms & conditions
- Authorized signatory on invoice footer
- Company logo and payment QR code upload

### Business & Payment Details
- Company info (name, email, phone, address, website)
- Bank details (bank name, account number, IFSC/SWIFT code)
- Payment instructions and QR code for UPI payments

### Currency Support
- USD ($) and INR (₹)

### Dashboard
- Invoice count and amount summaries by status (Paid, Due, Overdue)
- Quick actions — preview, edit, clone, delete, call client

### Settings
- Persistent business info, payment details, and terms
- Settings auto-apply to new invoices
- All data stored in browser localStorage (or Firebase when configured)

### Cloud Sync & Firebase Integration _(optional)_
- **Google Sign-In** — authenticate with your Google account
- **Cross-device sync** — invoices and settings automatically sync across all devices
- **Cloud Storage** — company logo and QR codes stored securely in Firebase Storage
- **Offline-first** — app works fully offline even when Firebase is enabled; changes sync when online
- **No lock-in** — data stays in your Firestore database; export anytime

### Offline Mode / Guest Mode
- **Full app access** — create and manage invoices without signing in
- **Persistent flag** — skip the login screen once; we remember your choice
- **One-click sign-in** — when ready, sign in anytime via the header button
- **Automatic sync** — all local invoices and settings uploaded to your cloud account on sign-in

## Tech Stack

- [React 18](https://react.dev)
- [Vite 6](https://vite.dev)
- [Tailwind CSS v4](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com) (Radix UI primitives)
- [TypeScript](https://www.typescriptlang.org)
- [React Router v7](https://reactrouter.com)
- [Firebase SDK](https://firebase.google.com) — Auth, Firestore, Storage _(optional)_
- [Sonner](https://sonner.emilkowal.ski) — Toast notifications

## Getting Started

### Basic Setup

```bash
npm install
npm run dev
```

App runs at [http://localhost:3000](http://localhost:3000). All invoices and settings are stored in your browser's localStorage — no backend needed.

### Enable Cloud Sync (Optional)

To enable Google Sign-In and cloud sync across devices, configure Firebase:

#### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project (or use an existing one)
3. Enable **Authentication** → Sign-in method → **Google**
4. Create a **Firestore Database** (start in test mode for development)
5. Create a **Storage** bucket for images

#### 2. Add Environment Variables

Create a `.env.local` file in your project root with your Firebase config:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

Find these values in Firebase Console → Project Settings → General.

#### 3. Set Firestore Security Rules

In Firebase Console → Firestore Database → Rules, replace with:

```rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{uid}/{document=**} {
      allow read, write: if request.auth.uid == uid;
    }
  }
}
```

#### 4. Set Storage Security Rules

In Firebase Console → Storage → Rules, replace with:

```rules
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Users can only upload/delete their own images
    match /users/{uid}/{allPaths=**} {
      allow read, write: if request.auth.uid == uid;
    }
  }
}
```

#### 5. Restart Dev Server

```bash
npm run dev
```

The app now shows a login screen. Sign in with your Google account or click "Continue Offline" to use the app without cloud sync.

### How It Works

| Feature | No Env Vars | With Env Vars (Guest) | With Env Vars (Signed In) |
|---|---|---|---|
| **Data Storage** | localStorage | localStorage | Firestore + localStorage |
| **Login Screen** | ❌ Hidden | ✅ Shown | ❌ Hidden |
| **Images** | base64 in localStorage | base64 in localStorage | Firebase Storage URLs |
| **Cross-device Sync** | ❌ No | ❌ No | ✅ Yes |
| **Sign-in Button** | ❌ No | ✅ In header | ✅ Sign Out button |

**Guest Mode Behavior:**
- Click "Continue Offline" on the login screen to skip sign-in
- The app skips the login screen on future visits (until you sign in)
- When you click "Sign In" in the header, all local data syncs to your Firebase account

**Guest to Authenticated Transition:**
- All invoices and settings from localStorage are automatically uploaded to Firestore
- Firebase Storage handles image uploads
- Future changes sync in real-time
- Logout returns you to guest mode

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server at localhost:3000 |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run TypeScript and ESLint checks |

## Development Notes

### Storage Adapter Pattern

The app uses a **storage adapter** pattern to abstract data storage ([`src/lib/storageAdapter.ts`](src/lib/storageAdapter.ts)). This allows seamless switching between localStorage (offline) and Firestore (cloud):

- **`LocalStorageAdapter`** (in `storageAdapter.ts`) — reads/writes invoices and settings to browser localStorage
- **`FirestoreAdapter`** (in [`src/lib/firestoreAdapter.ts`](src/lib/firestoreAdapter.ts)) — reads/writes to Firestore under `users/{uid}/invoices` and `users/{uid}/settings/default`

When Firebase is configured and you sign in, `App.tsx` automatically selects the appropriate adapter via `useMemo`. All app code continues to work without changes.

### Firebase Configuration

Firebase is initialized in [`src/lib/firebase.ts`](src/lib/firebase.ts):
- Checks for all 6 `VITE_FIREBASE_*` environment variables
- If all are present: `isFirebaseEnabled = true` and initializes Firebase app, auth, and Firestore
- If any are missing: `isFirebaseEnabled = false` and Firebase code is tree-shaken away

This allows the app to work identically whether Firebase is configured or not.

### Image Handling

- **Offline mode** — images (logo, QR code) uploaded as base64 strings and stored in localStorage
- **Cloud mode** — images uploaded to Firebase Storage via [`src/lib/firebaseStorage.ts`](src/lib/firebaseStorage.ts); Firestore stores the download URL

Firestore documents include a 1 MiB size limit warning if settings exceed ~900 KB.

### Data Sync on Sign-In

When a guest user signs in, [`src/lib/syncData.ts`](src/lib/syncData.ts) automatically uploads all local invoices and settings to Firestore using batch writes.

### One-time Reads (Not Real-time)

The app uses one-time API calls (e.g., `getDocs()`, `getDoc()`) instead of real-time listeners. Data loads on page navigation and after save operations. This keeps Firestore costs low and keeps the architecture simple.

### TypeScript

Full TypeScript support throughout. Build passes strict type checking:

```bash
npm run build
```

## Deployment

### Firebase Hosting

Deploy your app to Firebase Hosting (free tier available):

```bash
npm run build
npx firebase-tools deploy --only hosting
```

### Other Platforms

Any static host works (Vercel, Netlify, GitHub Pages, etc.). Just ensure `.env.local` variables are set in your deployment environment.

## License

This project is licensed under the [MIT License](LICENSE).
