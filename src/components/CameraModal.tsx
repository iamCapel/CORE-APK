import React, { useState } from 'react';
import './CameraModal.css';
import { useDeviceOrientation, getRotationAngle } from '../hooks/useDeviceOrientation';

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
  onSaveToGallery?: (photoData: { photo: string; location: any; timestamp: string; orientation: number }) => void;
}

const CameraModal: React.FC<CameraModalProps> = ({ 
  isOpen, 
  onClose, 
  photo, 
  location, 
  userName,
  onSaveToGallery
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const { orientation, angle } = useDeviceOrientation();
  const rotationAngle = getRotationAngle(orientation);

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

  const getTimestamp = () => {
    const now = new Date();
    return now.toISOString();
  };

  const handleSaveToGallery = async () => {
    if (!photo || !location || !onSaveToGallery) return;
    
    setIsSaving(true);
    try {
      const photoData = {
        photo,
        location,
        timestamp: getTimestamp(),
        orientation: rotationAngle // Incluir la orientación del dispositivo
      };
      
      await onSaveToGallery(photoData);
      
      // Mostrar mensaje de éxito
      alert('✅ Foto guardada exitosamente en la galería');
      onClose();
    } catch (error) {
      console.error('Error guardando foto:', error);
      alert('❌ Error al guardar la foto. Por favor intente nuevamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRetakePhoto = () => {
    if (onSaveToGallery) {
      // Cerrar modal actual para permitir tomar nueva foto
      onClose();
    } else {
      // Si no hay función de guardar, simplemente cerrar
      onClose();
    }
  };

  const handleCancel = () => {
    onClose();
  };

  // Estilos para rotar solo la imagen de la foto según la orientación del dispositivo
  const photoStyle: React.CSSProperties = {
    transform: orientation !== 'portrait' 
      ? `rotate(${rotationAngle}deg)` 
      : 'none',
    transition: 'transform 0.3s ease-out',
    transformOrigin: 'center center'
  };

  return (
    <div className="camera-modal-overlay" onClick={onClose}>
      <div 
        className="camera-modal-content" 
        onClick={(e) => e.stopPropagation()}
      >
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
                style={photoStyle}
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
          <button 
            className="camera-action-btn camera-btn-save" 
            onClick={handleSaveToGallery}
            disabled={!photo || !location || !onSaveToGallery || isSaving}
          >
            {isSaving ? (
              <>
                <span className="loading-spinner"></span>
                Guardando...
              </>
            ) : (
              <>
                💾 Guardar en Galería
              </>
            )}
          </button>
          
          <button 
            className="camera-action-btn camera-btn-retake" 
            onClick={handleRetakePhoto}
            disabled={isSaving}
          >
            🔄 Tomar Otra Foto
          </button>
          
          <button 
            className="camera-action-btn camera-btn-cancel" 
            onClick={handleCancel}
            disabled={isSaving}
          >
            ❌ Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default CameraModal;
