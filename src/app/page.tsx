'use client';
import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { initializeApp } from "firebase/app";
import { getFirestore, doc, onSnapshot } from "firebase/firestore";

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
  const [isMounted, setIsMounted] = useState(false);

  const [modalType, setModalType] = useState<'NONE' | 'PASSWORD' | 'EVENT_ACTION' | 'EDIT_TITLE' | 'ADD_TITLE'>('NONE');
  const [inputPassword, setInputPassword] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [selectedDateStr, setSelectedDateStr] = useState<string>('');
  const [eventTitleInput, setEventTitleInput] = useState('');

  useEffect(() => {
    setIsMounted(true);
    const unsubscribe = onSnapshot(doc(db, "calendar", "events"), (doc) => {
      if (doc.exists()) setEvents(doc.data().list || []);
    });
    return () => unsubscribe();
  }, []);

  const callApi = async (action: 'ADD' | 'EDIT' | 'DELETE', payload: any) => {
    const response = await fetch('/api/calendar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        password: inputPassword,
        action,
        ...payload
      })
    });

    const result = await response.json();
    if (!result.success) {
      alert(`❌ ${result.message || '오류가 발생했습니다.'}`);
      return false;
    }
    return true;
  };

  const handleEventClick = (arg: any) => {
    setSelectedEvent(arg.event);
    setInputPassword('');
    setModalType('PASSWORD');
  };

  const handleDateClick = (arg: any) => {
    setSelectedEvent(null);
    setSelectedDateStr(arg.dateStr);
    setInputPassword('');
    setModalType('PASSWORD');
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputPassword.trim()) return;

    if (selectedEvent) {
      setModalType('EVENT_ACTION');
    } else {
      setEventTitleInput('');
      setModalType('ADD_TITLE');
    }
  };

  const handleDeleteEvent = async () => {
    if (confirm('정말 삭제하시겠습니까?')) {
      const ok = await callApi('DELETE', { selectedEventId: selectedEvent.id });
      if (ok) closeModal();
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (eventTitleInput.trim()) {
      const ok = await callApi('EDIT', {
        updatedEvent: { id: selectedEvent.id, title: eventTitleInput }
      });
      if (ok) closeModal();
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (eventTitleInput.trim()) {
      const newEvent = { id: String(Date.now()), title: eventTitleInput, start: selectedDateStr, allDay: true };
      const ok = await callApi('ADD', { newEvent });
      if (ok) closeModal();
    }
  };

  const closeModal = () => {
    setModalType('NONE');
    setInputPassword('');
    setSelectedEvent(null);
    setEventTitleInput('');
  };

  if (!isMounted) return null;

  return (
    <>
      <style>{`
        @font-face { font-family: 'Cafe24Shongshong'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2402-2@1.0/Cafe24Shongshong.woff2') format('woff2'); }
        html, body, div, span, h1, button, input, .fc, .fc * { font-family: 'Cafe24Shongshong', sans-serif !important; }
        
        .fc .fc-toolbar-title, .fc .fc-col-header-cell-cushion, .fc .fc-daygrid-day-number { color: #7c5fa2 !important; }
        
        .fc-event { 
            background-color: #f1e7fc !important; 
            border-color: #cbb4e4 !important; 
            white-space: normal !important; 
            margin-bottom: 2px !important;
            cursor: pointer;
        }
        .fc-event-title { 
            color: #7c5fa2 !important; 
            white-space: normal !important; 
            font-size: 0.85em; 
            display: block; 
            line-height: 1.2;
            padding: 2px !important;
        }
        
        .fc .fc-button-primary { background-color: #cbb4e4 !important; border: none !important; color: white !important; font-weight: bold !important; }
        .fc td, .fc th { border-color: #f2eaf8 !important; }
        .fc .fc-day-today { background-color: #f9f4fe !important; }

        @media (max-width: 600px) {
          .main-wrapper { padding: 10px !important; }
          .calendar-box { padding: 10px !important; border-width: 3px !important; border-radius: 1rem !important; }
          .fc .fc-toolbar-title { font-size: 1.1rem !important; }
          .fc .fc-button { padding: 4px 8px !important; font-size: 0.8rem !important; }
          .fc-event-title { font-size: 0.75rem !important; }
        }
      `}</style>

      <div className="main-wrapper" style={{ width: '100%', padding: '3rem', boxSizing: 'border-box' }}>
        <h1 style={{ textAlign: 'center', color: '#a48bc2', fontSize: '2.6rem', fontWeight: 'bold', marginBottom: '3rem' }}>
          📅 얌미의 방송일정표
        </h1>
        <div className="calendar-box" style={{ maxWidth: '1100px', margin: '0 auto', border: '5px solid #e1d3f0', padding: '2.5rem', borderRadius: '2.5rem' }}>
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            events={events}
            height="auto"
            locale="ko"
            buttonText={{ today: 'Today', prev: '<', next: '>' }}
            headerToolbar={{ left: 'prev,next today', center: 'title', right: '' }}
            dateClick={handleDateClick}
            eventClick={handleEventClick}
          />
        </div>
      </div>

      {modalType === 'PASSWORD' && (
        <ModalWrapper onClose={closeModal}>
          <h3 style={{ color: '#7c5fa2', marginTop: 0, marginBottom: '1.2rem', fontSize: '1.2rem' }}>
            🔒 관리자 비밀번호
          </h3>
          <form onSubmit={handlePasswordSubmit}>
            <input
              type="password"
              value={inputPassword}
              onChange={(e) => setInputPassword(e.target.value)}
              autoFocus
              placeholder="비밀번호 입력"
              style={inputStyle}
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              <button type="submit" style={primaryBtnStyle}>확인</button>
              <button type="button" onClick={closeModal} style={cancelBtnStyle}>취소</button>
            </div>
          </form>
        </ModalWrapper>
      )}

      {modalType === 'EVENT_ACTION' && (
        <ModalWrapper onClose={closeModal}>
          <h3 style={{ color: '#7c5fa2', marginTop: 0, marginBottom: '1rem', fontSize: '1.1rem' }}>
            📌 '{selectedEvent?.title}'
          </h3>
          <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1.2rem' }}>어떤 작업을 진행하시겠습니까?</p>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            <button
              onClick={() => {
                setEventTitleInput(selectedEvent?.title || '');
                setModalType('EDIT_TITLE');
              }}
              style={primaryBtnStyle}
            >
              ✏️ 수정
            </button>
            <button onClick={handleDeleteEvent} style={dangerBtnStyle}>
              🗑️ 삭제
            </button>
            <button onClick={closeModal} style={cancelBtnStyle}>취소</button>
          </div>
        </ModalWrapper>
      )}

      {modalType === 'EDIT_TITLE' && (
        <ModalWrapper onClose={closeModal}>
          <h3 style={{ color: '#7c5fa2', marginTop: 0, marginBottom: '1.2rem', fontSize: '1.2rem' }}>
            ✏️ 일정 내용 수정
          </h3>
          <form onSubmit={handleEditSubmit}>
            <input
              type="text"
              value={eventTitleInput}
              onChange={(e) => setEventTitleInput(e.target.value)}
              autoFocus
              placeholder="새 내용 입력"
              style={inputStyle}
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              <button type="submit" style={primaryBtnStyle}>저장</button>
              <button type="button" onClick={closeModal} style={cancelBtnStyle}>취소</button>
            </div>
          </form>
        </ModalWrapper>
      )}

      {modalType === 'ADD_TITLE' && (
        <ModalWrapper onClose={closeModal}>
          <h3 style={{ color: '#7c5fa2', marginTop: 0, marginBottom: '1.2rem', fontSize: '1.2rem' }}>
            📌 새 일정 등록 ({selectedDateStr})
          </h3>
          <form onSubmit={handleAddSubmit}>
            <input
              type="text"
              value={eventTitleInput}
              onChange={(e) => setEventTitleInput(e.target.value)}
              autoFocus
              placeholder="일정 입력"
              style={inputStyle}
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              <button type="submit" style={primaryBtnStyle}>등록</button>
              <button type="button" onClick={closeModal} style={cancelBtnStyle}>취소</button>
            </div>
          </form>
        </ModalWrapper>
      )}
    </>
  );
}

function ModalWrapper({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.4)',
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      zIndex: 9999
    }} onClick={onClose}>
      <div style={{
        backgroundColor: '#ffffff',
        padding: '2rem',
        borderRadius: '1.5rem',
        border: '3px solid #e1d3f0',
        width: '90%', maxWidth: '320px',
        textAlign: 'center',
        boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
      }} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.6rem',
  fontSize: '1rem',
  borderRadius: '0.8rem',
  border: '2px solid #cbb4e4',
  textAlign: 'center',
  outline: 'none',
  boxSizing: 'border-box',
  marginBottom: '1.2rem'
};

const primaryBtnStyle: React.CSSProperties = {
  backgroundColor: '#cbb4e4', color: 'white', border: 'none',
  padding: '0.5rem 1.2rem', borderRadius: '0.6rem', fontWeight: 'bold', cursor: 'pointer'
};

const dangerBtnStyle: React.CSSProperties = {
  backgroundColor: '#ff8b8b', color: 'white', border: 'none',
  padding: '0.5rem 1.2rem', borderRadius: '0.6rem', fontWeight: 'bold', cursor: 'pointer'
};

const cancelBtnStyle: React.CSSProperties = {
  backgroundColor: '#e0e0e0', color: '#666', border: 'none',
  padding: '0.5rem 1.2rem', borderRadius: '0.6rem', fontWeight: 'bold', cursor: 'pointer'
};