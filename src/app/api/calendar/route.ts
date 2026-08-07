import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export async function POST(request: Request) {
  try {
    const { password, action, selectedEventId, updatedEvent, newEvent } = await request.json();

    if (password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ success: false, message: '비밀번호가 올바르지 않습니다.' }, { status: 401 });
    }

    const docRef = adminDb.collection('calendar').doc('events');
    const docSnap = await docRef.get();
    let currentEvents: any[] = docSnap.exists ? (docSnap.data()?.list || []) : [];

    if (action === 'ADD') {
      currentEvents.push(newEvent);
    } else if (action === 'EDIT') {
      currentEvents = currentEvents.map((e) => (e.id === updatedEvent.id ? { ...e, title: updatedEvent.title } : e));
    } else if (action === 'DELETE') {
      currentEvents = currentEvents.filter((e) => e.id !== selectedEventId);
    }

    await docRef.set({ list: currentEvents });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}