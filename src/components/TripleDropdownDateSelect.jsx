import React, { useState, useEffect } from 'react';
import './ModernSelect.css';

const TripleDropdownDateSelect = ({ value, onChange, placeholder = "Seleccionar fecha" }) => {
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');

  // Generar opciones
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - 99 + i);

  // Inicializar con valor actual
  useEffect(() => {
    if (value) {
      const date = new Date(value);
      setSelectedDay(date.getDate().toString());
      setSelectedMonth(date.getMonth().toString());
      setSelectedYear(date.getFullYear().toString());
    }
  }, [value]);

  // Manejar cambios
  const handleDayChange = (day) => {
    setSelectedDay(day);
    updateDate(day, selectedMonth, selectedYear);
  };

  const handleMonthChange = (month) => {
    setSelectedMonth(month);
    updateDate(selectedDay, month, selectedYear);
  };

  const handleYearChange = (year) => {
    setSelectedYear(year);
    updateDate(selectedDay, selectedMonth, year);
  };

  const updateDate = (day, month, year) => {
    if (day && month && year) {
      const date = new Date(parseInt(year), parseInt(month), parseInt(day));
      const dateString = date.toISOString().split('T')[0];
      onChange(dateString);
    }
  };

  return (
    <div className="triple-dropdown-date">
      <div className="triple-dropdown-group">
        <label className="triple-dropdown-label">Día</label>
        <select 
          className="triple-dropdown-select"
          value={selectedDay}
          onChange={(e) => handleDayChange(e.target.value)}
          style={{
            padding: '13px 14px',
            border: '1.5px solid #e0e0e0',
            borderRadius: '12px',
            background: '#ffffff',
            color: '#1a1a1a',
            fontSize: '15px',
            width: '100%',
            fontFamily: 'inherit',
            outline: 'none',
            transition: 'border-color 0.2s, box-shadow 0.2s'
          }}
        >
          <option value="">Día</option>
          {days.map(day => (
            <option key={day} value={day.toString()}>
              {day.toString().padStart(2, '0')}
            </option>
          ))}
        </select>
      </div>

      <div className="triple-dropdown-group">
        <label className="triple-dropdown-label">Mes</label>
        <select 
          className="triple-dropdown-select"
          value={selectedMonth}
          onChange={(e) => handleMonthChange(e.target.value)}
          style={{
            padding: '13px 14px',
            border: '1.5px solid #e0e0e0',
            borderRadius: '12px',
            background: '#ffffff',
            color: '#1a1a1a',
            fontSize: '15px',
            width: '100%',
            fontFamily: 'inherit',
            outline: 'none',
            transition: 'border-color 0.2s, box-shadow 0.2s'
          }}
        >
          <option value="">Mes</option>
          {months.map((month, index) => (
            <option key={index} value={index.toString()}>
              {month}
            </option>
          ))}
        </select>
      </div>

      <div className="triple-dropdown-group">
        <label className="triple-dropdown-label">Año</label>
        <select 
          className="triple-dropdown-select"
          value={selectedYear}
          onChange={(e) => handleYearChange(e.target.value)}
          style={{
            padding: '13px 14px',
            border: '1.5px solid #e0e0e0',
            borderRadius: '12px',
            background: '#ffffff',
            color: '#1a1a1a',
            fontSize: '15px',
            width: '100%',
            fontFamily: 'inherit',
            outline: 'none',
            transition: 'border-color 0.2s, box-shadow 0.2s'
          }}
        >
          <option value="">Año</option>
          {years.map(year => (
            <option key={year} value={year.toString()}>
              {year}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default TripleDropdownDateSelect;
