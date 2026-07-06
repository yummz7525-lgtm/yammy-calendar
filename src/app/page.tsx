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
      if (doc.exists()) setEvents(doc.data().list);
    });
    return () => unsubscribe();
  }, []);

  const saveToFirebase = async (newEvents: any) => {
    await setDoc(doc(db, "calendar", "events"), { list: newEvents });
  };

  const handleEventClick = async (arg: any) => {
    const input = prompt('🔒 관리자 비밀번호를 입력해 주세요:');
    if (input !== ADMIN_PASSWORD) { alert('❌ 틀렸습니다.'); return; }
    const action = prompt(`📌 '${arg.event.title}' 작업 선택\n1: 삭제, 2: 수정`);
    if (action === '1') {
      if (confirm('정말 삭제할까요?')) await saveToFirebase(events.filter((e: any) => e.id !== arg.event.id));
    } else if (action === '2') {
      const newTitle = prompt('새로운 내용 입력:', arg.event.title);
      if (newTitle) await saveToFirebase(events.map((e: any) => e.id === arg.event.id ? { ...e, title: newTitle } : e));
    }
  };

  const handleDateClick = async (arg: any) => {
    const input = prompt('🔒 관리자 비밀번호:');
    if (input !== ADMIN_PASSWORD) return;
    const title = prompt('📌 일정 입력:');
    if (title) await saveToFirebase([...events, { id: String(Date.now()), title, start: arg.dateStr, allDay: true }]);
  };

  return (
    <>
      <style>{`
        @font-face { font-family: 'Cafe24Shongshong'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2402-2@1.0/Cafe24Shongshong.woff2') format('woff2'); }
        body, .fc, .fc * { font-family: 'Cafe24Shongshong', sans-serif !important; }
        .fc .fc-toolbar-title { color: #a48bc2 !important; font-size: 2rem !important; }
        .fc .fc-button-primary { background-color: #cbb4e4 !important; border-color: #cbb4e4 !important; }
        .fc-event { background-color: #f1e7fc !important; border-color: #cbb4e4 !important; color: #5c3b7a !important; }
      `}</style>
      <div style={{ padding: '3rem', maxWidth: '1100px', margin: '0 auto' }}>
        <h1 style={{ textAlign: 'center', color: '#a48bc2', marginBottom: '2rem' }}>🔒 얌미의 방송일정표</h1>
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          events={events}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          editable={true}
          locale="ko"
          buttonText={{ today: 'today' }}
        />
      </div>
    </>
  );
}