import React, { useState } from 'react';
import SimpleDateSelect from './SimpleDateSelect';
import CalendarDateSelect from './CalendarDateSelect';
import TripleDropdownDateSelect from './TripleDropdownDateSelect';
import StepperDateSelect from './StepperDateSelect';
import SliderDateSelect from './SliderDateSelect';
import WheelDatePicker from './WheelDatePicker';
import './AlternativeDateSelects.css';

const DateSelectorShowcase = () => {
  const [selectedDate, setSelectedDate] = useState('');
  const [activeSelector, setActiveSelector] = useState('wheel');

  const handleDateChange = (date) => {
    setSelectedDate(date);
    console.log('Fecha seleccionada:', date);
  };

  const selectors = [
    { id: 'wheel', name: 'Ruletas (Actual)', component: WheelDatePicker },
    { id: 'simple', name: 'Input Date Nativo', component: SimpleDateSelect },
    { id: 'calendar', name: 'Calendario Dropdown', component: CalendarDateSelect },
    { id: 'triple', name: 'Tres Dropdowns', component: TripleDropdownDateSelect },
    { id: 'stepper', name: 'Botones (+/-)', component: StepperDateSelect },
    { id: 'slider', name: 'Slider Deslizante', component: SliderDateSelect }
  ];

  const ActiveComponent = selectors.find(s => s.id === activeSelector)?.component || WheelDatePicker;

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '20px', textAlign: 'center', color: '#1a1a1a' }}>
        Selector de Fecha - Prueba de Alternativas
      </h2>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600', color: '#1a1a1a' }}>
          Elige un tipo de selector:
        </label>
        <select 
          value={activeSelector}
          onChange={(e) => setActiveSelector(e.target.value)}
          style={{
            width: '100%',
            padding: '10px',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            fontSize: '14px',
            background: '#ffffff',
            color: '#1a1a1a'
          }}
        >
          {selectors.map(selector => (
            <option key={selector.id} value={selector.id}>
              {selector.name}
            </option>
          ))}
        </select>
      </div>

      <div style={{ 
        padding: '20px', 
        border: '1px solid #e0e0e0', 
        borderRadius: '12px', 
        backgroundColor: '#fafafa' 
      }}>
        <h3 style={{ marginTop: '0', marginBottom: '16px', color: '#1a1a1a' }}>
          {selectors.find(s => s.id === activeSelector)?.name}
        </h3>
        
        <ActiveComponent 
          value={selectedDate}
          onChange={handleDateChange}
          placeholder="Seleccionar fecha"
        />
      </div>

      {selectedDate && (
        <div style={{ 
          marginTop: '20px', 
          padding: '16px', 
          backgroundColor: '#e8f5e8', 
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <strong>Fecha seleccionada:</strong> {selectedDate}
        </div>
      )}

      <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        <h4 style={{ marginBottom: '10px' }}>Características de cada selector:</h4>
        <ul style={{ paddingLeft: '20px' }}>
          <li><strong>Ruletas:</strong> Visual moderno, scroll táctil</li>
          <li><strong>Input Date:</strong> Nativo del navegador, más simple</li>
          <li><strong>Calendario:</strong> Visual tipo calendario, intuitivo</li>
          <li><strong>Tres Dropdowns:</strong> Día, mes y año por separado</li>
          <li><strong>Botones (+/-):</strong> Control preciso con botones</li>
          <li><strong>Slider:</strong> Deslizante para rangos de fechas</li>
        </ul>
      </div>
    </div>
  );
};

export default DateSelectorShowcase;
