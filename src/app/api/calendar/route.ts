import { NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '0525';

// Firebase Admin 초기화
if (!getApps().length) {
  try {
    const pKey = process.env.FIREBASE_PRIVATE_KEY 
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/^"|"$/g, '').replace(/\\n/g, '\n')
      : undefined;

    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID || "yammy-broadcast-schedule",
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: pKey,
      }),
    });
  } catch (initErr: any) {
    console.error("Firebase Init Error:", initErr);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { password, action, newEvent, updatedEvent, selectedEventId, title } = body;

    // 1. 비밀번호 검증
    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json({ 
        success: false, 
        message: '비밀번호가 올바르지 않습니다.' 
      }, { status: 401 });
    }

    const db = getFirestore();
    const docRef = db.collection('calendar').doc('events');
    const docSnap = await docRef.get();
    let events = docSnap.exists ? (docSnap.data()?.list || []) : [];

    // 2. 동작 처리
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

    // 3. DB 업데이트 저장
    await docRef.set({ list: events });
    return NextResponse.json({ success: true, list: events });

  } catch (error: any) {
    // 서버 내부 상세 오류 메시지를 그대로 전달
    console.error('Server Fatal Error:', error);
    return NextResponse.json({ 
      success: false, 
      message: `서버 오류: ${error?.message || '알 수 없는 서버 에러가 발생했습니다.'}` 
    }, { status: 500 });
  }
}