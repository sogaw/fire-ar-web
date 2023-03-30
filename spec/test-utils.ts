import request from 'request';

import { FIRESTORE_EMULATOR_HOST, PROJECT_ID } from './test-setup';

// --- UTIL ---
export const sleep = (ms = 0) =>
  new Promise((resolve) =>
    setTimeout(() => {
      resolve(true);
    }, ms)
  );

// --- CLEAR EMULATOR ---
export const clearFirestore = async () => {
  await request({
    url: `http://${FIRESTORE_EMULATOR_HOST}/emulator/v1/projects/${PROJECT_ID}/databases/(default)/documents`,
    method: 'DELETE',
  });
  await sleep(100);
};
