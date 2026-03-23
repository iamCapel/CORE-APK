import React, { useState, useEffect } from 'react';

interface FichaInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const FichaInput = ({ id, value, onChange, placeholder = "Número de ficha", disabled = false }: FichaInputProps) => {
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  const formatFicha = (input) => {
    // Eliminar todo excepto letras y números
    let cleaned = input.replace(/[^a-zA-Z0-9]/g, '');
    
    // Convertir primeras dos letras a mayúsculas
    if (cleaned.length >= 2) {
      const letters = cleaned.substring(0, 2).toUpperCase();
      const numbers = cleaned.substring(2);
      cleaned = letters + numbers;
    } else if (cleaned.length === 1) {
      cleaned = cleaned.toUpperCase();
    }
    
    // Agregar guion después de las primeras dos letras
    if (cleaned.length > 2) {
      cleaned = cleaned.substring(0, 2) + '-' + cleaned.substring(2);
    }
    
    // Limitar a 2 letras + guion + máximo 8 números (total 11 caracteres)
    const maxLength = 11; // 2 letras + 1 guion + 8 números
    if (cleaned.length > maxLength) {
      cleaned = cleaned.substring(0, maxLength);
    }
    
    return cleaned;
  };

  const handleChange = (e) => {
    const input = e.target.value;
    const formatted = formatFicha(input);
    setInputValue(formatted);
    onChange(formatted);
  };

  const handleKeyPress = (e) => {
    // Solo permitir letras y números
    const char = String.fromCharCode(e.which);
    if (!/[a-zA-Z0-9]/.test(char) && e.which !== 8 && e.which !== 46) {
      e.preventDefault();
    }
  };

  return (
    <div className="modern-input-wrapper">
      <input
        id={id}
        placeholder={placeholder}
        className="modern-input-field"
        type="text"
        value={inputValue}
        onChange={handleChange}
        onKeyPress={handleKeyPress}
        disabled={disabled}
        maxLength={11}
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
          transition: 'border-color 0.2s, box-shadow 0.2s',
          textTransform: 'uppercase'
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

export default FichaInput;
