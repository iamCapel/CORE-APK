import React, { useState, useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import './ModernSelect.css';

const WheelDatePicker = ({ 
  value = '', 
  onChange, 
  placeholder = 'Seleccionar fecha',
  label,
  icon,
  disabled = false,
  className = '',
  minDate = null,
  maxDate = null,
  ...props 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const today = new Date();
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState(today.getDate());
  const wrapRef = useRef(null);
  const backButtonListenerRef = useRef(null);
  const yearWheelRef = useRef(null);
  const monthWheelRef = useRef(null);
  const dayWheelRef = useRef(null);

  // Generar opciones para las ruletas
  const currentYear = today.getFullYear();
  const minYear = minDate ? new Date(minDate).getFullYear() : currentYear - 2;
  const maxYear = maxDate ? new Date(maxDate).getFullYear() : currentYear + 2;
  
  const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => minYear + i);
  const months = [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
  ];
  
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };
  
  const days = Array.from({ 
    length: getDaysInMonth(selectedYear, selectedMonth) 
  }, (_, i) => i + 1);

  // Manejar el botón de retroceso de Android
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      const handleBackButton = () => {
        if (isOpen) {
          console.log('🔙 Cerrando wheel date picker con back button');
          setIsOpen(false);
          return true; // Prevenir que la app se cierre
        }
        return false; // Permitir comportamiento normal
      };

      // Agregar listener para el botón de retroceso
      CapacitorApp.addListener('backButton', handleBackButton).then(listener => {
        backButtonListenerRef.current = listener;
      });

      // Limpiar listener al desmontar
      return () => {
        if (backButtonListenerRef.current) {
          backButtonListenerRef.current.remove();
        }
      };
    }
  }, [isOpen]);

  // Sincronizar valor inicial y establecer fecha actual si no hay valor
  useEffect(() => {
    if (value) {
      const date = new Date(value);
      setSelectedYear(date.getFullYear());
      setSelectedMonth(date.getMonth());
      setSelectedDay(date.getDate());
    } else {
      // Si no hay valor, usar fecha actual
      setSelectedYear(today.getFullYear());
      setSelectedMonth(today.getMonth());
      setSelectedDay(today.getDate());
    }
  }, [value, today]);

  // Manejar apertura/cierre del modal
  const openModal = () => {
    if (!disabled) {
      setIsOpen(true);
    }
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  const confirmSelection = () => {
    const date = new Date(selectedYear, selectedMonth, selectedDay);
    const dateString = date.toISOString().split('T')[0];
    onChange(dateString);
    closeModal();
  };

  // Formatear fecha para mostrar (más compacto)
  const formatDate = (dateString) => {
    if (!dateString) return placeholder;
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Scroll a la posición seleccionada
  const scrollToSelected = (wheelRef, index) => {
    if (wheelRef.current) {
      const itemHeight = 35; // Altura ultra-compacta
      const scrollTop = index * itemHeight;
      wheelRef.current.scrollTop = scrollTop;
    }
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        scrollToSelected(yearWheelRef, selectedYear - minYear);
        scrollToSelected(monthWheelRef, selectedMonth);
        scrollToSelected(dayWheelRef, selectedDay - 1);
      }, 100);
    }
  }, [isOpen, selectedYear, selectedMonth, selectedDay]);

  // Manejar scroll en ruletas
  const handleWheelScroll = (wheelRef, items, setSelected) => {
    if (!wheelRef.current) return;
    
    const itemHeight = 35; // Altura ultra-compacta
    const scrollTop = wheelRef.current.scrollTop;
    const index = Math.round(scrollTop / itemHeight);
    const clampedIndex = Math.max(0, Math.min(index, items.length - 1));
    
    setSelected(items[clampedIndex]);
  };

  // Auto-seleccionar fecha actual al abrir si no hay valor
  useEffect(() => {
    if (isOpen && !value) {
      const today = new Date();
      setSelectedYear(today.getFullYear());
      setSelectedMonth(today.getMonth());
      setSelectedDay(today.getDate());
    }
  }, [isOpen, value]);

  return (
    <div className={`modern-input-container ${className}`}>
      {label && (
        <div className="modern-input-label">
          {icon && <span className="input-icon">{icon}</span>}
          <label>{label}</label>
        </div>
      )}
      
      <div className="modern-select-container" ref={wrapRef}>
        <div 
          className={`modern-select-trigger ${disabled ? 'disabled' : ''}`}
          onClick={openModal}
          {...props}
        >
          <div className="modern-select-icon">{icon}</div>
          <div className="modern-select-content">
            <div className={`modern-select-value ${value ? 'has-value' : ''}`}>
              <span className="date-display">
                <span className="date-icon">📅</span>
                {formatDate(value)}
              </span>
            </div>
          </div>
          <div className="dropdown-arrow">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M7 10l5 5 5-5z"/>
            </svg>
          </div>
        </div>

        {/* Modal Minimalista Superpuesto */}
        {isOpen && (
          <div className="modern-select-modal show wheel-minimal">
            <div className="modern-select-modal-content wheel-minimal-content">
              {/* Contenedor Central con Ruletas Superpuestas */}
              <div className="wheel-minimal-container">
                {/* Ruletas Superpuestas */}
                <div className="wheel-minimal-wheels">
                  <div className="wheel-minimal-wheel">
                    <div 
                      className="wheel wheel-minimal"
                      ref={dayWheelRef}
                      onScroll={() => handleWheelScroll(dayWheelRef, days, setSelectedDay)}
                    >
                      <div className="wheel-spacer wheel-minimal-spacer"></div>
                      {days.map((day) => (
                        <div 
                          key={day}
                          className={`wheel-item wheel-minimal-item ${day === selectedDay ? 'selected' : ''}`}
                          onClick={() => setSelectedDay(day)}
                        >
                          {day}
                        </div>
                      ))}
                      <div className="wheel-spacer wheel-minimal-spacer"></div>
                    </div>
                    <div className="wheel-minimal-label">Día</div>
                  </div>

                  <div className="wheel-minimal-wheel">
                    <div 
                      className="wheel wheel-minimal"
                      ref={monthWheelRef}
                      onScroll={() => handleWheelScroll(monthWheelRef, months, setSelectedMonth)}
                    >
                      <div className="wheel-spacer wheel-minimal-spacer"></div>
                      {months.map((month, index) => (
                        <div 
                          key={month}
                          className={`wheel-item wheel-minimal-item ${index === selectedMonth ? 'selected' : ''}`}
                          onClick={() => setSelectedMonth(index)}
                        >
                          {month}
                        </div>
                      ))}
                      <div className="wheel-spacer wheel-minimal-spacer"></div>
                    </div>
                    <div className="wheel-minimal-label">Mes</div>
                  </div>

                  <div className="wheel-minimal-wheel">
                    <div 
                      className="wheel wheel-minimal"
                      ref={yearWheelRef}
                      onScroll={() => handleWheelScroll(yearWheelRef, years, setSelectedYear)}
                    >
                      <div className="wheel-spacer wheel-minimal-spacer"></div>
                      {years.map((year) => (
                        <div 
                          key={year}
                          className={`wheel-item wheel-minimal-item ${year === selectedYear ? 'selected' : ''}`}
                          onClick={() => setSelectedYear(year)}
                        >
                          {year}
                        </div>
                      ))}
                      <div className="wheel-spacer wheel-minimal-spacer"></div>
                    </div>
                    <div className="wheel-minimal-label">Año</div>
                  </div>
                </div>

                {/* Vista Previa Central */}
                <div className="wheel-minimal-preview">
                  {new Date(selectedYear, selectedMonth, selectedDay).toLocaleDateString('es-ES', {
                    weekday: 'short',
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  })}
                </div>

                {/* Botones Minimalistas */}
                <div className="wheel-minimal-buttons">
                  <button 
                    type="button" 
                    className="wheel-minimal-button cancel"
                    onClick={closeModal}
                  >
                    ✕
                  </button>
                  <button 
                    type="button" 
                    className="wheel-minimal-button confirm"
                    onClick={confirmSelection}
                  >
                    ✓
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WheelDatePicker;
