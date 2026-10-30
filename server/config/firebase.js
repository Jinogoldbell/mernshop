const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const httpError = require('../utils/httpError');

let app;

/** True when the three service-account variables are present. */
exports.isConfigured = () =>
  Boolean(
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  );

/** Lazily initialise Firebase Admin and return its Auth service. */
exports.getFirebaseAuth = () => {
  if (!exports.isConfigured())
    throw httpError(503, 'Firebase is not configured on the server');
  app ||= initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Env files store the key with literal "\n"; convert back to real newlines
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
  return getAuth(app);
};
