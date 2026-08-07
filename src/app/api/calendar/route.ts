import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

// GET: 일정 전체 조회
export async function GET() {
  try {
    const db = adminDb as any;
    const docRef = db.collection('calendar').doc('events');
    const docSnap = await docRef.get();
    const currentEvents = docSnap.exists ? (docSnap.data()?.list || []) : [];
    return NextResponse.json(currentEvents);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: 비밀번호 검증 및 ADD / EDIT / DELETE 통합 처리
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { password, action, selectedEventId, updatedEvent, newEvent, title, id } = body;

    const envPassword = process.env.ADMIN_PASSWORD;
    if (envPassword && password !== envPassword) {
      return NextResponse.json({ success: false, message: '비밀번호가 올바르지 않습니다.' }, { status: 401 });
    }

    const db = adminDb as any;
    const docRef = db.collection('calendar').doc('events');
    const docSnap = await docRef.get();
    let currentEvents: any[] = docSnap.exists ? (docSnap.data()?.list || []) : [];

    if (action === 'ADD') {
      if (newEvent) currentEvents.push(newEvent);
    } else if (action === 'EDIT') {
      const targetId = selectedEventId || (updatedEvent && updatedEvent.id) || id;
      const newTitle = title || (updatedEvent && updatedEvent.title);

      currentEvents = currentEvents.map((e) => {
        if (e.id === targetId || e.title === targetId) {
          return { ...e, title: newTitle || e.title };
        }
        return e;
      });
    } else if (action === 'DELETE') {
      const targetId = selectedEventId || id;
      currentEvents = currentEvents.filter((e) => e.id !== targetId && e.title !== targetId);
    }

    await docRef.set({ list: currentEvents });

    return NextResponse.json({ success: true, list: currentEvents });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}