import { initializeApp } from 'firebase/app';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';

// --- SETUP ---
export const PROJECT_ID = 'fire-hose-web-test';
export const FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';

initializeApp({ projectId: PROJECT_ID });
connectFirestoreEmulator(getFirestore(), '127.0.0.1', 8080);

export const getDb = getFirestore;
