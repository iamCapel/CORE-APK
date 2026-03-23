import React, { useState } from 'react';

const SimpleDateSelect = ({ value, onChange, placeholder = "Seleccionar fecha", disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleChange = (e) => {
    const newValue = e.target.value;
    onChange(newValue);
  };

  return (
    <div className="modern-input-container">
      <label className="modern-input-label">Fecha</label>
      <input
        type="date"
        className="modern-input-field"
        value={value || ''}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        style={{
          color: '#1a1a1a',
          background: '#ffffff',
          border: '1.5px solid #e0e0e0',
          borderRadius: '12px',
          padding: '13px 14px',
          fontSize: '15px',
          width: '100%',
          fontFamily: 'inherit',
          outline: 'none',
          transition: 'border-color 0.2s, box-shadow 0.2s'
        }}
        onFocus={(e) => {
          e.target.style.borderColor = '#ff7a00';
          e.target.style.boxShadow = '0 0 0 3px rgba(255, 122, 0, 0.12)';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = '#e0e0e0';
          e.target.style.boxShadow = 'none';
        }}
      />
    </div>
  );
};

export default SimpleDateSelect;
