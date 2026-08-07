import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

// GET: 일정 전체 조회 (그대로 유지)
export async function GET() {
  try {
    const db = adminDb as any;
    const docRef = db.collection('calendar').doc('events');
    const docSnap = await docRef.get();
    const currentEvents = docSnap.exists ? (docSnap.data()?.list || []) : [];
    return NextResponse.json(currentEvents);
  } catch (error: any) {
    console.error('GET API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: 비밀번호 검증 및 ADD / EDIT / DELETE 통합 처리 (대폭 강화)
export async function POST(request: Request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json({ success: false, message: 'Invalid JSON body.' }, { status: 400 });
    }

    // 모든 가능성 있는 필드 추출
    const { password, action, selectedEventId, updatedEvent, newEvent, title, id } = body;

    // 1. 비밀번호 검증
    const envPassword = process.env.ADMIN_PASSWORD;
    if (envPassword && password !== envPassword) {
      return NextResponse.json({ success: false, message: '비밀번호가 올바르지 않습니다.' }, { status: 401 });
    }

    // 2. Firestore 데이터 가져오기
    const db = adminDb as any;
    const docRef = db.collection('calendar').doc('events');
    let docSnap;
    try {
      docSnap = await docRef.get();
    } catch (e: any) {
      console.error('Firestore Read Error:', e);
      return NextResponse.json({ success: false, error: `Firestore read failed: ${e.message}` }, { status: 500 });
    }
    
    let currentEvents: any[] = docSnap.exists ? (docSnap.data()?.list || []) : [];

    // 3. Action에 따른 안전한 데이터 처리
    if (action === 'ADD') {
      if (newEvent && typeof newEvent === 'object') {
        currentEvents.push(newEvent);
      } else {
        return NextResponse.json({ success: false, message: 'Missing or invalid newEvent data.' }, { status: 400 });
      }
    } else if (action === 'EDIT') {
      // 대상 ID와 새 타이틀을 가능한 모든 필드에서 찾음 (방어적 코드)
      const targetId = selectedEventId || id || (updatedEvent && updatedEvent.id);
      const newTitle = title || (updatedEvent && updatedEvent.title);

      if (!targetId) {
        return NextResponse.json({ success: false, message: 'Missing event ID for update.' }, { status: 400 });
      }

      currentEvents = currentEvents.map((e) => {
        // ID가 일치하거나, ID가 없고 타이틀이 일치하는 경우 업데이트
        if ((e.id && e.id === targetId) || (e.title && e.title === targetId)) {
          return { ...e, title: newTitle || e.title };
        }
        return e;
      });
    } else if (action === 'DELETE') {
      // 대상 ID를 가능한 모든 필드에서 찾음
      const targetId = selectedEventId || id;
      if (!targetId) {
        return NextResponse.json({ success: false, message: 'Missing event ID for deletion.' }, { status: 400 });
      }

      currentEvents = currentEvents.filter((e) => {
        // ID가 일치하거나, ID가 없고 타이틀이 일치하는 경우 제외
        return !( (e.id && e.id === targetId) || (e.title && e.title === targetId) );
      });
    } else {
      return NextResponse.json({ success: false, message: 'Invalid action.' }, { status: 400 });
    }

    // 4. Firestore 데이터 저장
    try {
      await docRef.set({ list: currentEvents });
    } catch (e: any) {
      console.error('Firestore Write Error:', e);
      return NextResponse.json({ success: false, error: `Firestore write failed: ${e.message}` }, { status: 500 });
    }

    return NextResponse.json({ success: true, list: currentEvents });
  } catch (error: any) {
    console.error('API Unknown Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}