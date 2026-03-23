import React from 'react';
import './HeavyVehiclesPage.css';

interface HeavyVehiclesPageProps {
  onClose: () => void;
}

const HeavyVehiclesPage: React.FC<HeavyVehiclesPageProps> = ({ onClose }) => {
  return (
    <div className="heavy-vehicles-page">
      <div className="topbar-modern">
        <button 
          title="Volver al Dashboard" 
          className="topbar-back-button-modern"
          onClick={onClose}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"></path>
          </svg>
        </button>
        <div className="topbar-actions-modern">
          <h1 className="topbar-title">Vehículos Pesados</h1>
        </div>
      </div>

      <div className="heavy-vehicles-content">
        <div className="heavy-vehicles-header">
          <h2>Gestión de Vehículos Pesados</h2>
          <p>Administre y controle la flota de vehículos pesados del MOPC</p>
        </div>

        <div className="heavy-vehicles-grid">
          <div className="heavy-vehicles-card">
            <div className="heavy-vehicles-icon">🚛</div>
            <h3>Camiones Volquetas</h3>
            <p>Gestión de camiones de carga pesada</p>
            <button className="heavy-vehicles-btn">Ver Flota</button>
          </div>

          <div className="heavy-vehicles-card">
            <div className="heavy-vehicles-icon">🚜</div>
            <h3>Maquinaria Pesada</h3>
            <p>Excavadoras, buldóceras y otros equipos</p>
            <button className="heavy-vehicles-btn">Ver Equipos</button>
          </div>

          <div className="heavy-vehicles-card">
            <div className="heavy-vehicles-icon">🚚</div>
            <h3>Volquetas y Dumpers</h3>
            <p>Vehículos para transporte de materiales</p>
            <button className="heavy-vehicles-btn">Ver Unidades</button>
          </div>

          <div className="heavy-vehicles-card">
            <div className="heavy-vehicles-icon">🏗️</div>
            <h3>Equipos de Construcción</h3>
            <p>Grúas, retroexcavadoras y más</p>
            <button className="heavy-vehicles-btn">Ver Equipos</button>
          </div>
        </div>

        <div className="heavy-vehicles-stats">
          <div className="stat-card">
            <h3>Total Vehículos</h3>
            <div className="stat-number">0</div>
          </div>
          <div className="stat-card">
            <h3>Operativos</h3>
            <div className="stat-number">0</div>
          </div>
          <div className="stat-card">
            <h3>En Mantenimiento</h3>
            <div className="stat-number">0</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeavyVehiclesPage;
