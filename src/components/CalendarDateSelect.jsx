import React, { useState, useRef, useEffect } from 'react';
import './ModernSelect.css';

const CalendarDateSelect = ({ value, onChange, placeholder = "Seleccionar fecha" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(value ? new Date(value) : new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const calendarRef = useRef(null);

  // Generar días del mes
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  // Generar calendario
  const generateCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = getDaysInMonth(currentMonth);
    const days = [];

    // Días vacíos al inicio
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Días del mes
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const handleDateClick = (day) => {
    if (!day) return;
    
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    setSelectedDate(newDate);
    
    const dateString = newDate.toISOString().split('T')[0];
    onChange(dateString);
    setIsOpen(false);
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                     'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  const calendarDays = generateCalendar();

  return (
    <div className="calendar-date-select" ref={calendarRef}>
      <div 
        className="calendar-trigger"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: '13px 14px',
          border: '1.5px solid #e0e0e0',
          borderRadius: '12px',
          background: '#ffffff',
          color: '#1a1a1a',
          fontSize: '15px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <span>{formatDate(selectedDate)}</span>
        <span style={{ fontSize: '12px', color: '#666' }}>📅</span>
      </div>

      {isOpen && (
        <div className="calendar-dropdown">
          <div className="calendar-header">
            <button 
              className="calendar-nav-btn"
              onClick={handlePrevMonth}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '16px',
                cursor: 'pointer',
                padding: '5px'
              }}
            >
              ◀
            </button>
            <span className="calendar-month-year">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </span>
            <button 
              className="calendar-nav-btn"
              onClick={handleNextMonth}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '16px',
                cursor: 'pointer',
                padding: '5px'
              }}
            >
              ▶
            </button>
          </div>

          <div className="calendar-weekdays">
            {weekDays.map(day => (
              <div key={day} className="calendar-weekday">{day}</div>
            ))}
          </div>

          <div className="calendar-days">
            {calendarDays.map((day, index) => (
              <div
                key={index}
                className={`calendar-day ${day ? 'calendar-day-active' : 'calendar-day-empty'} ${
                  day === selectedDate.getDate() && 
                  currentMonth.getMonth() === selectedDate.getMonth() && 
                  currentMonth.getFullYear() === selectedDate.getFullYear() 
                    ? 'calendar-day-selected' : ''
                }`}
                onClick={() => handleDateClick(day)}
              >
                {day}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarDateSelect;
