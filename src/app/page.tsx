'use client';
import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { initializeApp } from "firebase/app";
import { getFirestore, doc, onSnapshot, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB7d3FUDU3snyXBrrJ5VxRJz1RLNjwLd7k",
  authDomain: "yammy-broadcast-schedule.firebaseapp.com",
  projectId: "yammy-broadcast-schedule",
  storageBucket: "yammy-broadcast-schedule.firebasestorage.app",
  messagingSenderId: "214674453159",
  appId: "1:214674453159:web:47344e1796c9ec643fa182",
  measurementId: "G-G5FP9KCGTM"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default function ViewerCalendarPage() {
  const [events, setEvents] = useState<any[]>([]);
  const ADMIN_PASSWORD = '0525';

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "calendar", "events"), (doc) => {
      if (doc.exists()) setEvents(doc.data().list || []);
    });
    return () => unsubscribe();
  }, []);

  const saveToFirebase = async (newEvents: any) => {
    await setDoc(doc(db, "calendar", "events"), { list: newEvents });
  };

  const handleEventClick = async (arg: any) => {
    const input = prompt('🔒 관리자 비밀번호를 입력해 주세요:');
    if (input !== ADMIN_PASSWORD) { alert('❌ 비밀번호가 틀렸습니다.'); return; }
    
    const action = prompt(`📌 '${arg.event.title}' 작업 선택\n1: 삭제, 2: 수정`);
    if (action === '1') {
      if (confirm('정말 삭제하시겠습니까?')) {
        await saveToFirebase(events.filter((e: any) => e.id !== arg.event.id));
      }
    } else if (action === '2') {
      const newTitle = prompt('새로운 내용을 입력하세요:', arg.event.title);
      if (newTitle) {
        const updated = events.map((e: any) => e.id === arg.event.id ? { ...e, title: newTitle } : e);
        await saveToFirebase(updated);
      }
    }
  };

  const handleDateClick = async (arg: any) => {
    const input = prompt('🔒 관리자 비밀번호를 입력해 주세요:');
    if (input !== ADMIN_PASSWORD) return;
    const title = prompt('📌 새로운 일정을 입력해 주세요:');
    if (!title) return;
    const newEvent = { id: String(Date.now()), title, start: arg.dateStr, allDay: true };
    await saveToFirebase([...events, newEvent]);
  };

  return (
    <>
      <style>{`
        @font-face { font-family: 'Cafe24Shongshong'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2402-2@1.0/Cafe24Shongshong.woff2') format('woff2'); }
        html, body, div, span, h1, button, .fc, .fc * { font-family: 'Cafe24Shongshong', 'Malgun Gothic', sans-serif !important; }
        .fc .fc-toolbar-title { color: #a48bc2 !important; font-weight: bold !important; font-size: 2.4rem !important; }
        .fc .fc-button-primary { background-color: #cbb4e4 !important; border-color: #cbb4e4 !important; color: white !important; border-radius: 9999px !important; font-weight: bold !important; }
        .fc .fc-button-primary:hover { background-color: #b397cf !important; }
        /* 네모 깨짐 방지: 아이콘 텍스트 강제 지정 */
        .fc-prev-button::after { content: '<' !important; }
        .fc-next-button::after { content: '>' !important; }
        .fc-icon { display: none !important; }
        .fc-event { background-color: #f1e7fc !important; border-color: #cbb4e4 !important; color: #5c3b7a !important; border-radius: 6px !important; padding: 5px !important; }
      `}</style>
      <div style={{ padding: '3rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h1 style={{ color: '#a48bc2', fontSize: '2.6rem', fontWeight: 'bold', marginBottom: '3rem' }}>🔒 얌미의 방송일정표</h1>
        <div style={{ width: '100%', maxWidth: '1100px', border: '5px solid #e1d3f0', padding: '2.5rem', borderRadius: '2.5rem' }}>
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            events={events}
            editable={true}
            selectable={true}
            locale="ko"
            height="850px"
            dateClick={handleDateClick}
            eventClick={handleEventClick}
            buttonText={{ prev: '<', next: '>' }}
          />
        </div>
      </div>
    </>
  );
}