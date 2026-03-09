import React from 'react';
import './CameraModal.css';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  photo: string | null;
  location: {
    lat: number;
    lon: number;
    address: string;
  } | null;
  userName: string;
}

const CameraModal: React.FC<CameraModalProps> = ({ 
  isOpen, 
  onClose, 
  photo, 
  location, 
  userName 
}) => {
  if (!isOpen) return null;

  const formatDate = () => {
    const now = new Date();
    return now.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = () => {
    const now = new Date();
    return now.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="camera-modal-overlay" onClick={onClose}>
      <div className="camera-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="camera-modal-header">
          <h3>📸 Foto Capturada</h3>
          <button className="camera-modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="camera-modal-body">
          <div className="camera-photo-container">
            {photo ? (
              <img 
                src={photo} 
                alt="Foto capturada" 
                className="camera-photo"
              />
            ) : (
              <div className="camera-photo-placeholder">
                <div className="camera-icon">📷</div>
                <p>Cargando foto...</p>
              </div>
            )}
          </div>

          <div className="camera-info-overlay">
            <div className="camera-info-content">
              <div className="camera-info-header">
                <div className="user-avatar">
                  {userName.split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase()}
                </div>
                <div className="user-info">
                  <div className="user-name">{userName}</div>
                  <div className="user-title">Dirección de Coordinación Regional</div>
                </div>
              </div>

              <div className="location-info">
                <div className="location-item">
                  <span className="location-icon">📍</span>
                  <span className="location-label">Ubicación:</span>
                  <span className="location-value">
                    {location?.address || 'Obteniendo ubicación...'}
                  </span>
                </div>

                <div className="location-item">
                  <span className="location-icon">🌐</span>
                  <span className="location-label">Coordenadas:</span>
                  <span className="location-value">
                    {location ? `${location.lat.toFixed(6)}, ${location.lon.toFixed(6)}` : 'Obteniendo coordenadas...'}
                  </span>
                </div>

                <div className="location-item">
                  <span className="location-icon">📅</span>
                  <span className="location-label">Fecha:</span>
                  <span className="location-value">{formatDate()}</span>
                </div>

                <div className="location-item">
                  <span className="location-icon">🕐</span>
                  <span className="location-label">Hora:</span>
                  <span className="location-value">{formatTime()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="camera-modal-footer">
          <button className="camera-action-btn camera-btn-accept" onClick={onClose}>
            ✅ Aceptar
          </button>
          <button className="camera-action-btn camera-btn-retake" onClick={onClose}>
            🔄 Tomar otra foto
          </button>
        </div>
      </div>
    </div>
  );
};

export default CameraModal;
