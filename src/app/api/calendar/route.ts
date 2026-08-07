import { NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '0525';

// Firebase Private Key 자동 줄바꿈 처리
function getFormattedPrivateKey() {
  const rawKey = process.env.FIREBASE_PRIVATE_KEY;
  if (!rawKey) return undefined;
  
  // 따옴표 제거 및 \n 문자열을 실제 줄바꿈으로 변환
  let formatted = rawKey.replace(/^"|"$/g, '');
  formatted = formatted.replace(/\\n/g, '\n');
  return formatted;
}

if (!getApps().length) {
  try {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID || "yammy-broadcast-schedule",
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: getFormattedPrivateKey(),
      }),
    });
  } catch (err) {
    console.error('Firebase Admin Init Error:', err);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { password, action, newEvent, updatedEvent, selectedEventId, title } = body;

    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json({ success: false, message: '비밀번호가 올바르지 않습니다.' }, { status: 401 });
    }

    const db = getFirestore();
    const docRef = db.collection('calendar').doc('events');
    const docSnap = await docRef.get();
    let events = docSnap.exists ? (docSnap.data()?.list || []) : [];

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

    await docRef.set({ list: events });
    return NextResponse.json({ success: true, list: events });

  } catch (error: any) {
    console.error('API Server Error:', error);
    return NextResponse.json({ 
      success: false, 
      message: error?.message || '서버 오류가 발생했습니다.' 
    }, { status: 500 });
  }
}