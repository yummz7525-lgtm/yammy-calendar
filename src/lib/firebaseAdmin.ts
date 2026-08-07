import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// 환경 변수에서 값 가져오기
const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
let privateKey = process.env.FIREBASE_PRIVATE_KEY;

// 비밀키가 존재할 때만 줄바꿈 문자 처리를 확실하게 함
if (privateKey) {
  try {
    // Vercel에서 설정한 값이 따옴표로 감싸져 있을 경우를 대비하여 따옴표 제거
    privateKey = privateKey.replace(/^"|"$/g, '');
    // JSON 형식의 줄바꿈 문자(\n)를 실제 줄바꿈 문자로 변환
    privateKey = privateKey.replace(/\\n/g, '\n');
  } catch (error) {
    console.error('Error parsing FIREBASE_PRIVATE_KEY:', error);
  }
} else {
  console.warn('FIREBASE_PRIVATE_KEY is missing!');
}

if (!getApps().length) {
  try {
    if (!projectId || !clientEmail || !privateKey) {
      throw new Error('Missing one or more required Firebase environment variables.');
    }

    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
    console.log('Firebase Admin initialized successfully.');
  } catch (error: any) {
    console.error('Firebase Admin initialization failed:', error.message);
  }
}

export const adminDb = getFirestore();