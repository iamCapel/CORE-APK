import React from 'react';
import './ModernInput.css';

interface ModernInputProps {
  id: string;
  type: 'text' | 'number' | 'email' | 'tel' | 'date';
  label: string;
  placeholder: string;
  value: string | number;
  onChange: (value: string | number) => void;
  disabled?: boolean;
  required?: boolean;
  icon?: string;
  unit?: string;
  className?: string;
  autoFocus?: boolean;
}

export const ModernInput: React.FC<ModernInputProps> = ({
  id,
  type,
  label,
  placeholder,
  value,
  onChange,
  disabled = false,
  required = false,
  icon,
  unit,
  className = '',
  autoFocus = false
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value;
    onChange(newValue);
  };

  return (
    <div className={`modern-input-container ${className}`}>
      <div className="modern-input-label">
        {icon && <span className="input-icon">{icon}</span>}
        <label htmlFor={id}>
          {label}
          {required && <span className="required">*</span>}
        </label>
      </div>
      <div className="modern-input-wrapper">
        <input
          id={id}
          type={type}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          autoFocus={autoFocus}
          className="modern-input-field"
        />
        {unit && <span className="input-unit">{unit}</span>}
      </div>
    </div>
  );
};
