import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

// GET: 일정 조회
export async function GET() {
  try {
    const db = adminDb as any;
    const snapshot = await db.collection('events').get();
    const events = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }));
    return NextResponse.json(events);
  } catch (error) {
    console.error('GET Error:', error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}

// POST: 일정 추가
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const db = adminDb as any;
    const docRef = await db.collection('events').add(body);
    return NextResponse.json({ id: docRef.id, ...body });
  } catch (error) {
    console.error('POST Error:', error);
    return NextResponse.json({ error: 'Failed to add event' }, { status: 500 });
  }
}

// PUT: 일정 수정
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...data } = body;
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const db = adminDb as any;
    await db.collection('events').doc(id).update(data);
    return NextResponse.json({ id, ...data });
  } catch (error) {
    console.error('PUT Error:', error);
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
  }
}

// DELETE: 일정 삭제
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const db = adminDb as any;
    await db.collection('events').doc(id).delete();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE Error:', error);
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
  }
}