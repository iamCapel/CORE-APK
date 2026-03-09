import React, { useState, useEffect } from 'react';
import './ModernSelect.css';

const StepperDateSelect = ({ value, onChange, placeholder = "Seleccionar fecha" }) => {
  const [selectedDate, setSelectedDate] = useState(value ? new Date(value) : new Date());

  const incrementDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
    updateValue(newDate);
  };

  const decrementDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
    updateValue(newDate);
  };

  const incrementMonth = () => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setSelectedDate(newDate);
    updateValue(newDate);
  };

  const decrementMonth = () => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setSelectedDate(newDate);
    updateValue(newDate);
  };

  const incrementYear = () => {
    const newDate = new Date(selectedDate);
    newDate.setFullYear(newDate.getFullYear() + 1);
    setSelectedDate(newDate);
    updateValue(newDate);
  };

  const decrementYear = () => {
    const newDate = new Date(selectedDate);
    newDate.setFullYear(newDate.getFullYear() - 1);
    setSelectedDate(newDate);
    updateValue(newDate);
  };

  const updateValue = (date) => {
    const dateString = date.toISOString().split('T')[0];
    onChange(dateString);
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  return (
    <div className="stepper-date-select">
      <div className="stepper-date-display">
        {formatDate(selectedDate)}
      </div>

      <div className="stepper-date-controls">
        <div className="stepper-group">
          <label className="stepper-label">Día</label>
          <div className="stepper-input-group">
            <button 
              className="stepper-btn stepper-btn-minus"
              onClick={decrementDay}
              disabled={selectedDate.getDate() <= 1}
            >
              -
            </button>
            <div className="stepper-value">
              {selectedDate.getDate().toString().padStart(2, '0')}
            </div>
            <button 
              className="stepper-btn stepper-btn-plus"
              onClick={incrementDay}
            >
              +
            </button>
          </div>
        </div>

        <div className="stepper-group">
          <label className="stepper-label">Mes</label>
          <div className="stepper-input-group">
            <button 
              className="stepper-btn stepper-btn-minus"
              onClick={decrementMonth}
              disabled={selectedDate.getMonth() <= 0}
            >
              -
            </button>
            <div className="stepper-value stepper-value-wide">
              {monthNames[selectedDate.getMonth()]}
            </div>
            <button 
              className="stepper-btn stepper-btn-plus"
              onClick={incrementMonth}
              disabled={selectedDate.getMonth() >= 11}
            >
              +
            </button>
          </div>
        </div>

        <div className="stepper-group">
          <label className="stepper-label">Año</label>
          <div className="stepper-input-group">
            <button 
              className="stepper-btn stepper-btn-minus"
              onClick={decrementYear}
              disabled={selectedDate.getFullYear() <= 1900}
            >
              -
            </button>
            <div className="stepper-value">
              {selectedDate.getFullYear()}
            </div>
            <button 
              className="stepper-btn stepper-btn-plus"
              onClick={incrementYear}
              disabled={selectedDate.getFullYear() >= 2100}
            >
              +
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StepperDateSelect;
