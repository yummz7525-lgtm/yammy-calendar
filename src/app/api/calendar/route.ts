import { NextResponse } from 'next/server';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '0525';

// Client SDK 설정 정보 (인증 키 문제 없이 백엔드에서 바로 Firestore 접근 가능)
const firebaseConfig = {
  apiKey: "AIzaSyB7d3FUDU3snyXBrrJ5VxRJz1RLNjwLd7k",
  authDomain: "yammy-broadcast-schedule.firebaseapp.com",
  projectId: "yammy-broadcast-schedule",
  storageBucket: "yammy-broadcast-schedule.firebasestorage.app",
  messagingSenderId: "214674453159",
  appId: "1:214674453159:web:47344e1796c9ec643fa182",
  measurementId: "G-G5FP9KCGTM"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { password, action, newEvent, updatedEvent, selectedEventId, title } = body;

    // 1. 비밀번호 검증
    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json({ success: false, message: '비밀번호가 올바르지 않습니다.' }, { status: 401 });
    }

    // 2. Firebase Firestore 문서 읽기
    const docRef = doc(db, 'calendar', 'events');
    const docSnap = await getDoc(docRef);
    let events = docSnap.exists() ? (docSnap.data()?.list || []) : [];

    // 3. 수정 / 삭제 / 추가 로직 수행
    if (action === 'ADD') {
      events.push(newEvent);
    } else if (action === 'EDIT') {
      const targetTitle = title || (updatedEvent && updatedEvent.title);
      events = events.map((item: any) => {
        if (
          (selectedEventId && item.id === selectedEventId) ||
          (updatedEvent && updatedEvent.id && item.id === updatedEvent.id) ||
          (targetTitle && item.title === targetTitle)
        ) {
          return { ...item, ...(updatedEvent || {}), title: updatedEvent?.title || item.title };
        }
        return item;
      });
    } else if (action === 'DELETE') {
      events = events.filter((item: any) => {
        if (selectedEventId && item.id === selectedEventId) return false;
        if (title && item.title === title) return false;
        return true;
      });
    }

    // 4. 저장
    await setDoc(docRef, { list: events });
    return NextResponse.json({ success: true, list: events });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ 
      success: false, 
      message: error?.message || 'DB 업데이트 중 오류가 발생했습니다.' 
    }, { status: 500 });
  }
}