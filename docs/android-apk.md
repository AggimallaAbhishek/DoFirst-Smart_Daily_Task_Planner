# Android APK Build and Hosting

This project includes an automated workflow to build a debug APK using Capacitor.

## 1) Configure GitHub Actions env

Before running `Android APK`, set these in GitHub repo settings:

GitHub Variables (`Settings -> Secrets and variables -> Actions -> Variables`):

- `VITE_API_URL=https://dofirst-smart-daily-task-planner-backend.onrender.com`
- `VITE_GOOGLE_REDIRECT_URI=postmessage`
- `VITE_APP_DOWNLOAD_URL=https://do-first-smart-daily-task-planner-f.vercel.app/downloads/dofirst-debug.apk` (optional)

GitHub Secret (`Settings -> Secrets and variables -> Actions -> Secrets`):

- `VITE_GOOGLE_CLIENT_ID=<your-google-oauth-web-client-id>`

## 2) Google Cloud OAuth setup required for APK

Native Google sign-in in APK requires both OAuth client types:

1. Web client (used by backend verification):
   - Use this value as `VITE_GOOGLE_CLIENT_ID` and backend `GOOGLE_OAUTH_CLIENT_ID`.
2. Android client:
   - Package name: `com.dofirst.smartdailyplanner`
   - SHA-1: signing certificate SHA-1 used to sign the APK

To check SHA-1 from an already-built APK:

```bash
keytool -printcert -jarfile app-debug.apk | grep -i "SHA1"
```

Then add that SHA-1 in Google Cloud Console for the Android OAuth client.

## 3) Build APK from GitHub Actions

1. Push your latest changes to GitHub.
2. Open `Actions` in your repo.
3. Run workflow: `Android APK`.
4. Wait for job `build-debug-apk` to complete.
5. Download artifact: `dofirst-debug-apk`.

Output file in artifact:

- `app-debug.apk`

## 4) Host APK on Vercel

1. Place the downloaded APK at:
   - `frontend/public/downloads/dofirst-debug.apk`
2. Commit and push.
3. Redeploy Vercel frontend.

APK public URL will be:

- `https://do-first-smart-daily-task-planner-f.vercel.app/downloads/dofirst-debug.apk`

## 5) Wire install button to download URL

Set Vercel environment variable:

- `VITE_APP_DOWNLOAD_URL=https://do-first-smart-daily-task-planner-f.vercel.app/downloads/dofirst-debug.apk`

Redeploy frontend after updating env.

## Notes

- `app-debug.apk` is for testing/sideloading.
- For Play Store release, use a signed release build (`assembleRelease` + keystore signing).
- Backend CORS in this project allows Capacitor loopback origins (`http://localhost`, `http://localhost:<port>`, `capacitor://localhost`) for APK API calls.
