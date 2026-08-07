import { NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '0525';

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID || "yammy-broadcast-schedule",
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = getFirestore();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { password, action, newEvent, updatedEvent, selectedEventId, title } = body;

    // 비밀번호 검증
    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json({ success: false, message: '비밀번호가 올바르지 않습니다.' }, { status: 401 });
    }

    const docRef = db.collection('calendar').doc('events');
    const docSnap = await docRef.get();
    let events = docSnap.exists ? docSnap.data()?.list || [] : [];

    if (action === 'ADD') {
      events.push(newEvent);
    } else if (action === 'EDIT') {
      events = events.map((item: any) => {
        // ID 매칭 또는 타이틀/날짜 매칭으로 유연하게 처리
        if (
          (selectedEventId && item.id === selectedEventId) ||
          (item.title === title && item.start === updatedEvent.start)
        ) {
          return { ...item, ...updatedEvent };
        }
        return item;
      });
    } else if (action === 'DELETE') {
      events = events.filter((item: any) => {
        // ID나 제목/날짜 기준 삭제
        if (selectedEventId && item.id === selectedEventId) return false;
        if (title && item.title === title) return false;
        return true;
      });
    }

    await docRef.set({ list: events });
    return NextResponse.json({ success: true, list: events });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}