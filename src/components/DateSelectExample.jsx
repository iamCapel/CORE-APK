import React, { useState } from 'react';
import ModernDateSelect from './ModernDateSelect';

const DateSelectExample = () => {
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFinal, setFechaFinal] = useState('');

  // Generar opciones de fechas de ejemplo
  const generarOpcionesFechas = () => {
    const fechas = [];
    const fechaActual = new Date();
    
    // Generar fechas para los últimos 2 años
    for (let i = 0; i < 730; i++) {
      const fecha = new Date(fechaActual);
      fecha.setDate(fechaActual.getDate() - i);
      
      fechas.push({
        value: fecha.toISOString().split('T')[0],
        label: fecha.toLocaleDateString('es-ES', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      });
    }
    
    return fechas.reverse();
  };

  const opcionesFechas = generarOpcionesFechas();

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '30px', color: '#212121' }}>
        Ejemplo de Selects de Fechas Modernos
      </h2>

      {/* Select de Fecha de Inicio */}
      <ModernDateSelect
        options={opcionesFechas}
        value={fechaInicio}
        onChange={setFechaInicio}
        label="Fecha de Inicio del Proyecto"
        icon="📅"
        placeholder="Seleccionar fecha de inicio"
      />

      <div style={{ marginBottom: '30px' }} />

      {/* Select de Fecha Final */}
      <ModernDateSelect
        options={opcionesFechas}
        value={fechaFinal}
        onChange={setFechaFinal}
        label="Fecha Final del Proyecto"
        icon="📅"
        placeholder="Seleccionar fecha final"
        disabled={false} // Cambiar a true para deshabilitar
      />

      {/* Mostrar valores seleccionados */}
      <div style={{ 
        marginTop: '30px', 
        padding: '20px', 
        background: '#f5f5f5', 
        borderRadius: '12px' 
      }}>
        <h3 style={{ marginBottom: '15px', color: '#212121' }}>
          Fechas Seleccionadas:
        </h3>
        <div style={{ marginBottom: '10px' }}>
          <strong>Fecha de Inicio:</strong> {fechaInicio || 'No seleccionada'}
        </div>
        <div>
          <strong>Fecha Final:</strong> {fechaFinal || 'No seleccionada'}
        </div>
      </div>
    </div>
  );
};

export default DateSelectExample;
