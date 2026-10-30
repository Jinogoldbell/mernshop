/**
 * Firebase helpers, used only for admin product image uploads (Firebase Storage).
 * Customers log in with email and password through the API, not Firebase.
 * The SDK is imported lazily so shoppers never download it.
 */
const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(
  config.apiKey && config.projectId && config.appId
);

let cached;
async function load() {
  if (!isFirebaseConfigured) throw new Error('Firebase is not configured');
  if (!cached) {
    const [{ initializeApp }, authMod, storageMod] = await Promise.all([
      import('firebase/app'),
      import('firebase/auth'),
      import('firebase/storage'),
    ]);
    const app = initializeApp(config);
    cached = {
      auth: authMod.getAuth(app),
      storage: storageMod.getStorage(app),
      authMod,
      storageMod,
    };
  }
  return cached;
}

export async function firebaseSignOut() {
  if (!cached) return;
  await cached.authMod.signOut(cached.auth);
}

/**
 * Upload an image to Firebase Storage and return its public URL.
 * Storage rules only allow users with the `admin` claim, so we first sign in with
 * a custom token minted by our own backend (see GET /api/auth/firebase-token).
 */
export async function uploadProductImage(file, fetchCustomToken) {
  if (!file.type.startsWith('image/')) throw new Error('Choose an image file');
  if (file.size > 5 * 1024 * 1024) throw new Error('Images must be 5 MB or smaller');

  const { auth, storage, authMod, storageMod } = await load();
  if (!auth.currentUser)
    await authMod.signInWithCustomToken(auth, await fetchCustomToken());

  const safeName = file.name.replace(/[^\w.-]/g, '_');
  const fileRef = storageMod.ref(storage, `products/${Date.now()}-${safeName}`);
  await storageMod.uploadBytes(fileRef, file, { contentType: file.type });
  return storageMod.getDownloadURL(fileRef);
}
