import React, { useState, useEffect, useRef } from 'react';
import './ModernSelect.css';

const SliderDateSelect = ({ value, onChange, placeholder = "Seleccionar fecha" }) => {
  const [selectedDate, setSelectedDate] = useState(value ? new Date(value) : new Date());
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef(null);

  const minDate = new Date(2020, 0, 1);
  const maxDate = new Date(2030, 11, 31);
  const totalDays = Math.floor((maxDate - minDate) / (1000 * 60 * 60 * 24));

  const getDatePosition = () => {
    const daysDiff = Math.floor((selectedDate - minDate) / (1000 * 60 * 60 * 24));
    return (daysDiff / totalDays) * 100;
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    updateDateFromPosition(e.clientX);
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      updateDateFromPosition(e.clientX);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const updateDateFromPosition = (clientX) => {
    if (!sliderRef.current) return;

    const rect = sliderRef.current.getBoundingClientRect();
    const percentage = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const daysDiff = Math.floor((percentage / 100) * totalDays);
    const newDate = new Date(minDate);
    newDate.setDate(newDate.getDate() + daysDiff);
    
    setSelectedDate(newDate);
    const dateString = newDate.toISOString().split('T')[0];
    onChange(dateString);
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e) => handleMouseMove(e);
    const handleGlobalMouseUp = () => handleMouseUp();

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging]);

  return (
    <div className="slider-date-select">
      <div className="slider-date-display">
        {formatDate(selectedDate)}
      </div>

      <div className="slider-container">
        <div className="slider-track" ref={sliderRef}>
          <div 
            className="slider-fill"
            style={{ width: `${getDatePosition()}%` }}
          />
          <div 
            className="slider-thumb"
            style={{ left: `${getDatePosition()}%` }}
            onMouseDown={handleMouseDown}
          />
        </div>

        <div className="slider-labels">
          <span className="slider-label">2020</span>
          <span className="slider-label">2025</span>
          <span className="slider-label">2030</span>
        </div>
      </div>

      <div className="slider-quick-selects">
        <button 
          className="slider-quick-btn"
          onClick={() => {
            const today = new Date();
            setSelectedDate(today);
            onChange(today.toISOString().split('T')[0]);
          }}
        >
          Hoy
        </button>
        <button 
          className="slider-quick-btn"
          onClick={() => {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            setSelectedDate(yesterday);
            onChange(yesterday.toISOString().split('T')[0]);
          }}
        >
          Ayer
        </button>
        <button 
          className="slider-quick-btn"
          onClick={() => {
            const nextWeek = new Date();
            nextWeek.setDate(nextWeek.getDate() + 7);
            setSelectedDate(nextWeek);
            onChange(nextWeek.toISOString().split('T')[0]);
          }}
        >
          Próxima Semana
        </button>
      </div>
    </div>
  );
};

export default SliderDateSelect;
