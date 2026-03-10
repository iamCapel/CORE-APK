import React, { useState, useRef, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import './ModernSelect.css';

const ModernDateSelect = ({ 
  options = [], 
  value = '', 
  onChange, 
  placeholder = 'Seleccionar fecha',
  label,
  icon,
  disabled = false,
  className = '',
  ...props 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const wrapRef = useRef(null);
  const inputRef = useRef(null);
  const backButtonListenerRef = useRef(null);

  // Agrupar opciones por año y mes
  const groupedOptions = React.useMemo(() => {
    const groups = {};
    
    options.forEach(option => {
      if (option.value) {
        const date = new Date(option.value);
        const year = date.getFullYear();
        const month = date.toLocaleDateString('es-ES', { month: 'long' });
        
        if (!groups[year]) {
          groups[year] = {};
        }
        if (!groups[year][month]) {
          groups[year][month] = [];
        }
        groups[year][month].push(option);
      }
    });
    
    return groups;
  }, [options]);

  // Filtrar opciones agrupadas
  const filteredGroups = React.useMemo(() => {
    const groups = {};
    
    Object.keys(groupedOptions).forEach(year => {
      groups[year] = {};
      
      Object.keys(groupedOptions[year]).forEach(month => {
        if (searchTerm.trim() === '') {
          groups[year][month] = groupedOptions[year][month];
        } else {
          const filtered = groupedOptions[year][month].filter(option => 
            option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
            option.value.toLowerCase().includes(searchTerm.toLowerCase())
          );
          if (filtered.length > 0) {
            groups[year][month] = filtered;
          }
        }
      });
    });
    
    return groups;
  }, [groupedOptions, searchTerm]);

  // Obtener opción seleccionada
  const selectedOption = React.useMemo(() => {
    return options.find(option => option.value === value);
  }, [options, value]);

  // Manejar el botón de retroceso de Android
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      const handleBackButton = () => {
        if (isOpen) {
          console.log('🔙 Cerrando modal date select con back button');
          closeModal();
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

  // Manejar apertura/cierre del modal
  const openModal = () => {
    if (!disabled) {
      setIsOpen(true);
      setSearchTerm('');
    }
  };

  const closeModal = () => {
    setIsOpen(false);
    setSearchTerm('');
    setHighlightedIndex(-1);
  };

  // Seleccionar opción
  const selectOption = (optionValue) => {
    onChange(optionValue);
    closeModal();
  };

  // Manejar teclas
  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        // Lógica para navegar entre grupos y opciones
        break;
      case 'ArrowUp':
        e.preventDefault();
        // Lógica para navegar entre grupos y opciones
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0) {
          // Seleccionar opción destacada
        }
        break;
      case 'Escape':
        closeModal();
        break;
    }
  };

  // Efectos
  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        closeModal();
      }
    };

    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Renderizar trigger
  const renderTrigger = () => {
    const displayText = selectedOption ? selectedOption.label : placeholder;
    
    return (
      <div className="modern-select-trigger">
        {selectedOption ? (
          <span className="modern-select-value">
            <span className="date-display">
              <span className="date-icon">📅</span>
              {selectedOption.label}
            </span>
          </span>
        ) : (
          <span className="modern-select-placeholder">
            <span className="date-icon">📅</span>
            {placeholder}
          </span>
        )}
      </div>
    );
  };

  // Renderizar grupos de fechas
  const renderDateGroups = () => {
    if (Object.keys(filteredGroups).length === 0) {
      return (
        <div className="no-options">
          <span>No se encontraron fechas</span>
        </div>
      );
    }

    return Object.keys(filteredGroups).sort((a, b) => b - a).map(year => (
      <div key={year} className="date-group">
        <div className="date-group-header">
          <span className="year-icon">📆</span>
          {year}
        </div>
        <div className="date-group-content">
          {Object.keys(filteredGroups[year]).map(month => (
            <div key={`${year}-${month}`} className="date-month">
              <div className="month-header">
                <span className="month-icon">📅</span>
                {month}
              </div>
              <div className="month-options">
                {filteredGroups[year][month].map((option) => (
                  <div
                    key={option.value}
                    className={`modern-select-option date-option ${value === option.value ? 'selected' : ''}`}
                    onClick={() => selectOption(option.value)}
                  >
                    <div className="option-content">
                      <span className="option-text">{option.label}</span>
                      {value === option.value && (
                        <span className="option-icon">✓</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    ));
  };

  return (
    <div className={`modern-input-container ${className}`}>
      {label && (
        <div className="modern-input-label">
          {icon && <span className="input-icon">{icon}</span>}
          <label>{label}</label>
        </div>
      )}
      
      <div className="modern-select-container" ref={wrapRef} onKeyDown={handleKeyDown}>
        <div 
          className={`modern-select-trigger ${disabled ? 'disabled' : ''}`}
          onClick={openModal}
          {...props}
        >
          {renderTrigger()}
        </div>

        {/* Modal Fullscreen */}
        {isOpen && (
          <div className="modern-select-modal show">
            <div className="modern-select-modal-content">
              {/* Header */}
              <div className="modern-select-modal-header">
                <h3 className="modern-select-modal-title">
                  <span className="title-icon">📅</span>
                  Seleccionar Fecha
                </h3>
                <button 
                  type="button" 
                  className="modern-select-modal-close"
                  onClick={closeModal}
                >
                  ×
                </button>
              </div>

              {/* Search */}
              <div className="modern-select-modal-search">
                <span className="search-icon">🔍</span>
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Buscar fecha..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="modern-select-search-input"
                />
              </div>

              {/* Date Groups */}
              <div className="modern-select-options date-groups">
                {renderDateGroups()}
              </div>

              {/* Footer */}
              <div className="modern-select-modal-footer">
                <button 
                  type="button" 
                  className="modern-select-modal-button cancel"
                  onClick={closeModal}
                >
                  Cancelar
                </button>
                <button 
                  type="button" 
                  className="modern-select-modal-button confirm"
                  onClick={closeModal}
                >
                  Aceptar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModernDateSelect;
