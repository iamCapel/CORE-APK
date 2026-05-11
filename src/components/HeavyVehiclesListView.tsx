import React, { useState, useEffect } from 'react';
import { firebaseHeavyVehiclesStorage, HeavyVehicleRecord } from '../services/firebaseHeavyVehiclesStorage';
import './HeavyVehiclesListView.css';

interface HeavyVehiclesListViewProps {
  onClose: () => void;
}

const HeavyVehiclesListView: React.FC<HeavyVehiclesListViewProps> = ({ onClose }) => {
  const [records, setRecords] = useState<HeavyVehicleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    try {
      setLoading(true);
      const data = await firebaseHeavyVehiclesStorage.getRecentRecords(100);
      setRecords(data);
      setError('');
    } catch (err) {
      console.error('Error cargando vehículos:', err);
      setError('Error al cargar los registros de vehículos');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-DO', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatLocation = (record: HeavyVehicleRecord) => {
    const parts = [
      record.provincia,
      record.municipio,
      record.distrito || record.distritoPersonalizado
    ].filter(Boolean);
    return parts.join(', ');
  };

  const getActivityDisplay = (record: HeavyVehicleRecord) => {
    if (record.tipoIntervencion) {
      if (record.subTipoCanal) {
        return `${record.tipoIntervencion}: ${record.subTipoCanal}`;
      }
      return record.tipoIntervencion;
    }
    return 'Vehículos Pesados';
  };

  return (
    <div className="heavy-vehicles-list-container">
      {/* Header */}
      <div className="list-header">
        <button className="back-btn" onClick={onClose}>
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
          </svg>
        </button>
        <h1 className="list-title">Vehículos Recientes</h1>
        <button className="refresh-btn" onClick={loadRecords} disabled={loading}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="list-content">
        {loading && (
          <div className="loading-message">
            <div className="spinner"></div>
            <p>Cargando registros...</p>
          </div>
        )}

        {error && (
          <div className="error-message">
            <p>{error}</p>
            <button onClick={loadRecords}>Reintentar</button>
          </div>
        )}

        {!loading && !error && records.length === 0 && (
          <div className="empty-message">
            <p>No hay registros de vehículos pesados</p>
          </div>
        )}

        {!loading && !error && records.length > 0 && (
          <div className="vehicles-cards">
            {records.map((record) => (
              <div key={record.id} className="vehicle-card">
                <h3 className="vehicle-title">
                  {record.tipoVehiculo} {record.modelo || ''}
                </h3>
                
                <div className="vehicle-info">
                  <div className="info-row">
                    <span className="info-label">Fecha:</span>
                    <span className="info-value">{formatDate(record.fechaInicio)}</span>
                  </div>
                  
                  <div className="info-row">
                    <span className="info-label">Ficha:</span>
                    <span className="info-value ficha-value">{record.ficha}</span>
                  </div>
                  
                  <div className="info-row">
                    <span className="info-label">Actividad:</span>
                    <span className="info-value">{getActivityDisplay(record)}</span>
                  </div>
                  
                  <div className="info-row">
                    <span className="info-label">Dirección:</span>
                    <span className="info-value">{formatLocation(record)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HeavyVehiclesListView;
