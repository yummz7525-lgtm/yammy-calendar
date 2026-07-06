'use client';
import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

export default function ViewerCalendarPage() {
  const [events, setEvents] = useState([]);

  // 🔑 나만의 관리자 비밀번호를 여기에 설정해 주세요!
  const ADMIN_PASSWORD = '0525'; 

  // 1. 처음 켤 때 로컬스토리지에서 일정 불러오기
  useEffect(() => {
    const savedEvents = localStorage.getItem('yammy_locked_events');
    if (savedEvents) {
      setEvents(JSON.parse(savedEvents));
    }
  }, []);

  // 2. 로컬스토리지 저장 로직
  const saveToLocalStorage = (newEvents) => {
    setEvents(newEvents);
    localStorage.setItem('yammy_locked_events', JSON.stringify(newEvents));
  };

  // 🔑 비밀번호 검증 함수
  const checkPassword = () => {
    const input = prompt('🔒 관리자 비밀번호를 입력해 주세요:');
    if (input === null) return false; 
    if (input !== ADMIN_PASSWORD) {
      alert('❌ 비밀번호가 틀렸습니다. 권한이 없습니다.');
      return false;
    }
    return true;
  };

  // 3. [추가] 날짜 클릭 시
  const handleDateClick = (arg) => {
    if (!checkPassword()) return; 

    const title = prompt('📌 새로운 일정을 입력해 주세요:\n(팁: "13:00 그타진행" 처럼 시간을 앞에 쓰면 자동 정렬됩니다!)');
    if (!title) return;

    const newEvent = {
      id: String(Date.now()),
      title: title,
      start: arg.dateStr,
      allDay: true
    };

    const updatedEvents = [...events, newEvent];
    saveToLocalStorage(updatedEvents);
  };

  // 4. [삭제] 일정 클릭 시
  const handleEventClick = (arg) => {
    if (!checkPassword()) return; 

    if (confirm(`❌ '${arg.event.title}' 일정을 삭제하시겠습니까?`)) {
      const updatedEvents = events.filter((event) => event.id !== arg.event.id);
      saveToLocalStorage(updatedEvents);
    }
  };

  // 5. [수정] 일정을 마우스로 드래그해서 날짜를 옮겼을 때
  const handleEventDrop = (arg) => {
    if (!checkPassword()) {
      arg.revert(); 
      return;
    }

    const updatedEvents = events.map((event) => {
      if (event.id === arg.event.id) {
        return {
          ...event,
          start: arg.event.startStr.split('T')[0] 
        };
      }
      return event;
    });
    saveToLocalStorage(updatedEvents);
  };

  return (
    <>
      <style>{`
        @font-face { font-family: 'Cafe24Shongshong'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2402-2@1.0/Cafe24Shongshong.woff2') format('woff2'); }
        html, body, div, span, h1, button, .fc, .fc * { font-family: 'Cafe24Shongshong', 'Malgun Gothic', sans-serif !important; }
        .fc .fc-icon { font-family: 'FcIcons', sans-serif !important; }
        .fc .fc-col-header-cell-cushion { color: #7c5fa2 !important; font-size: 1.1rem !important; padding: 8px 0 !important; }
        .fc .fc-daygrid-day-number { color: #8a6ea8 !important; font-size: 1.05rem !important; padding: 8px !important; }
        .fc .fc-toolbar-title { color: #a48bc2 !important; font-weight: bold !important; font-size: 2.4rem !important; }
        .fc .fc-button-primary { background-color: #cbb4e4 !important; border-color: #cbb4e4 !important; color: white !important; border-radius: 9999px !important; padding: 6px 18px !important; font-weight: bold !important; }
        .fc .fc-button-primary:hover { background-color: #b397cf !important; border-color: #b397cf !important; }
        
        .fc-daygrid-day { cursor: pointer; }
        .fc-event {
          background-color: #f1e7fc !important; border-color: #cbb4e4 !important; border-radius: 6px !important; padding: 5px 12px !important; font-size: 0.9rem !important;
          white-space: nowrap !important; overflow: hidden !important; text-overflow: ellipsis !important; display: flex !important; justify-content: center !important; align-items: center !important; cursor: grab !important;
        }
        .fc-event:active { cursor: grabbing !important; }
        a.fc-event, a.fc-event *, .fc-event-title, .fc-event-time { color: #5c3b7a !important; font-weight: bold !important; text-align: center !important; }
        .fc .fc-daygrid-more-link { color: #a48bc2 !important; font-weight: bold !important; font-size: 0.85rem !important; padding-left: 6px !important; display: block !important; text-align: center !important; }
        .fc .fc-day-today { background-color: #f9f4fe !important; }
        .fc td, .fc th { border-color: #f2eaf8 !important; }
      `}</style>

      <div style={{ width: '100%', minHeight: '100vh', backgroundColor: '#ffffff', padding: '3rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', boxSizing: 'border-box' }}>
        <h1 style={{ color: '#a48bc2', fontSize: '2.6rem', fontWeight: 'bold', marginBottom: '3rem', textAlign: 'center' }}>
          🔒 얌미의 방송일정표
        </h1>
        <div style={{ width: '100%', maxWidth: '1100px', backgroundColor: '#ffffff', padding: '2.5rem', borderRadius: '2.5rem', border: '5px solid #e1d3f0', boxSizing: 'border-box' }}>
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            events={events}
            editable={true}          
            selectable={true}
            locale="ko"
            height="850px"
            dayMaxEvents={true} 
            fixedWeekCount={false} 
            dateClick={handleDateClick}
            eventClick={handleEventClick}
            eventDrop={handleEventDrop}  
            eventOrder="title"        // ⭐ 여기! 제목(시간숫자) 기준으로 자동 정렬하는 옵션 추가
          />
        </div>
      </div>
    </>
  );
}