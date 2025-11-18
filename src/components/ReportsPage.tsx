import React from 'react';
import './ReportsPage.css';

interface User {
  username: string;
  name: string;
}

interface ReportsPageProps {
  user: User;
  onBack: () => void;
}

const ReportsPage: React.FC<ReportsPageProps> = ({ user, onBack }) => {
  return (
    <div className="reports-page">
      <div className="reports-container">
        <div className="reports-topbar">
          <button className="topbar-back-btn" onClick={onBack}>
            ← Volver al Dashboard
          </button>
        </div>
        
        <div className="reports-content">
          {/* Página en blanco */}
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
