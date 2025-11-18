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

const ReportsPage: React.FC<ReportsPageProps> = ({ user, onBack }) => {
  const [currentView, setCurrentView] = useState<PageView>('estadisticas');

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
              <h2>Estadísticas</h2>
            </div>
          )}

          {currentView === 'detallado' && (
            <div className="view-content">
              <h2>Informe Detallado</h2>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
