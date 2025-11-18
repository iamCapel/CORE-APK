import React, { useState } from 'react';
import './ReportsPage.css';

interface User {
  username: string;
  name: string;
}

interface ReportsPageProps {
  user: User;
  onBack: () => void;
}

type PageView = 'estadisticas' | 'detallado';

// Regiones de República Dominicana
const REGIONES_RD = [
  { id: 1, name: 'Ozama o Metropolitana', icon: '🏛️', color: '#FF6B6B' },
  { id: 2, name: 'Cibao Norte', icon: '🌆', color: '#4ECDC4' },
  { id: 3, name: 'Cibao Sur', icon: '🌊', color: '#45B7D1' },
  { id: 4, name: 'Cibao Nordeste', icon: '🌾', color: '#96CEB4' },
  { id: 5, name: 'Cibao Noroeste', icon: '🏪', color: '#FFEAA7' },
  { id: 6, name: 'Valdesia', icon: '✈️', color: '#DFE6E9' },
  { id: 7, name: 'Enriquillo', icon: '🏖️', color: '#74B9FF' },
  { id: 8, name: 'El Valle', icon: '🏞️', color: '#A29BFE' },
  { id: 9, name: 'Yuma', icon: '🌴', color: '#FD79A8' },
  { id: 10, name: 'Higuamo', icon: '🌿', color: '#00B894' },
  { id: 11, name: 'Región Enriquillo', icon: '⛰️', color: '#FDCB6E' }
];

const ReportsPage: React.FC<ReportsPageProps> = ({ user, onBack }) => {
  const [currentView, setCurrentView] = useState<PageView>('estadisticas');
  const [selectedRegion, setSelectedRegion] = useState<number | null>(null);

  return (
    <div className="reports-page">
      <div className="reports-container">
        <div className="reports-topbar">
          <button className="topbar-back-btn" onClick={onBack}>
            ← Volver al Dashboard
          </button>
        </div>
        
        <div className="reports-content">
          <div className="view-selector">
            <button 
              className={`view-btn ${currentView === 'estadisticas' ? 'active' : ''}`}
              onClick={() => setCurrentView('estadisticas')}
            >
              📊 Estadísticas
            </button>
            <button 
              className={`view-btn ${currentView === 'detallado' ? 'active' : ''}`}
              onClick={() => setCurrentView('detallado')}
            >
              📄 Informe Detallado
            </button>
          </div>

          {currentView === 'estadisticas' && (
            <div className="view-content">
              <h2 className="stats-title">Regiones de República Dominicana</h2>
              <p className="stats-subtitle">Selecciona una región para ver sus estadísticas detalladas</p>
              
              <div className="regions-grid">
                {REGIONES_RD.map((region) => (
                  <div 
                    key={region.id}
                    className={`region-card ${selectedRegion === region.id ? 'selected' : ''}`}
                    onClick={() => setSelectedRegion(region.id)}
                    style={{ 
                      '--region-color': region.color,
                      borderLeftColor: region.color 
                    } as React.CSSProperties}
                  >
                    <div className="region-icon">{region.icon}</div>
                    <div className="region-info">
                      <h3 className="region-name">{region.name}</h3>
                      <div className="region-stats">
                        <div className="stat-item">
                          <span className="stat-label">Total</span>
                          <span className="stat-value">0</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-label">Completados</span>
                          <span className="stat-value">0</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-label">Pendientes</span>
                          <span className="stat-value">0</span>
                        </div>
                      </div>
                    </div>
                    <div className="region-arrow">→</div>
                  </div>
                ))}
              </div>

              {selectedRegion && (
                <div className="region-details-panel">
                  <div className="panel-header">
                    <h3>Detalles de {REGIONES_RD.find(r => r.id === selectedRegion)?.name}</h3>
                    <button className="close-btn" onClick={() => setSelectedRegion(null)}>✕</button>
                  </div>
                  <div className="panel-content">
                    <p>Aquí se mostrarán las estadísticas detalladas, provincias, municipios y más...</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {currentView === 'detallado' && (
            <div className="view-content">
              <h2>Informe Detallado</h2>
              <p>Vista de informe detallado en desarrollo...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
