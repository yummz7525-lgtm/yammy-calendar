import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

// GET: 일정 조회
export async function GET() {
  try {
    const snapshot = await adminDb.collection('events').get();
    const events = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    return NextResponse.json(events);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}

// POST: 일정 추가
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const docRef = await adminDb.collection('events').add(body);
    return NextResponse.json({ id: docRef.id, ...body });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add event' }, { status: 500 });
  }
}

// PUT: 일정 수정
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...data } = body;
    await adminDb.collection('events').doc(id).update(data);
    return NextResponse.json({ id, ...data });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
  }
}

// DELETE: 일정 삭제
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    await adminDb.collection('events').doc(id).delete();
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
  }
}