import React, { useState, useEffect } from 'react';
import LiveLocationService from '../services/liveLocationService';
import './LiveTrackingMap.css';

interface LiveLocationData {
  deviceId: string;
  username: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  accuracy: number;
  altitude?: number;
  speed?: number;
  heading?: number;
}

const LiveTrackingMap: React.FC = () => {
  const [activeDevices, setActiveDevices] = useState<LiveLocationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<LiveLocationData | null>(null);

  useEffect(() => {
    loadActiveDevices();
    
    // Actualizar cada 30 segundos
    const interval = setInterval(loadActiveDevices, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const loadActiveDevices = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const liveLocationService = LiveLocationService.getInstance();
      const devices = await liveLocationService.getActiveDevices();
      
      setActiveDevices(devices);
      console.log('📍 Dispositivos activos cargados:', devices.length);
      
    } catch (err) {
      console.error('❌ Error cargando dispositivos activos:', err);
      setError('No se pudieron cargar los dispositivos activos');
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('es-DO');
  };

  const getDeviceStatus = (timestamp: string) => {
    const now = Date.now();
    const deviceTime = new Date(timestamp).getTime();
    const diffMinutes = (now - deviceTime) / (1000 * 60);
    
    if (diffMinutes < 1) {
      return { status: 'online', color: '#22c55e', text: 'En línea' };
    } else if (diffMinutes < 5) {
      return { status: 'recent', color: '#ffc107', text: 'Activo recientemente' };
    } else {
      return { status: 'offline', color: '#dc3545', text: 'Desconectado' };
    }
  };

  if (loading) {
    return (
      <div className="live-tracking-container">
        <div className="loading-message">
          <div className="spinner"></div>
          <p>Cargando dispositivos activos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="live-tracking-container">
        <div className="error-message">
          <p>❌ {error}</p>
          <button onClick={loadActiveDevices} className="retry-button">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="live-tracking-container">
      <div className="tracking-header">
        <h2>📍 Tracking en Vivo</h2>
        <div className="tracking-stats">
          <span className="stat-item">
            <span className="stat-number">{activeDevices.length}</span>
            <span className="stat-label">Dispositivos Activos</span>
          </span>
          <span className="stat-item">
            <span className="stat-number">
              {activeDevices.filter(d => getDeviceStatus(d.timestamp).status === 'online').length}
            </span>
            <span className="stat-label">En Línea</span>
          </span>
        </div>
        <button onClick={loadActiveDevices} className="refresh-button">
          🔄 Actualizar
        </button>
      </div>

      <div className="tracking-content">
        <div className="devices-list">
          <h3>📱 Dispositivos Activos</h3>
          {activeDevices.length === 0 ? (
            <div className="no-devices">
              <p>📭 No hay dispositivos activos actualmente</p>
              <small>Los dispositivos aparecen aquí cuando los usuarios tienen la aplicación abierta</small>
            </div>
          ) : (
            <div className="devices-grid">
              {activeDevices.map((device) => {
                const status = getDeviceStatus(device.timestamp);
                return (
                  <div 
                    key={device.deviceId} 
                    className={`device-card ${status.status}`}
                    onClick={() => setSelectedDevice(device)}
                  >
                    <div className="device-header">
                      <div className="device-info">
                        <h4>{device.username}</h4>
                        <p className="device-id">ID: {device.deviceId}</p>
                      </div>
                      <div className={`device-status ${status.status}`}>
                        <span className="status-dot"></span>
                        {status.text}
                      </div>
                    </div>
                    
                    <div className="location-info">
                      <div className="coordinates">
                        <span className="coord-label">📍</span>
                        <span className="coord-value">
                          {device.latitude.toFixed(6)}, {device.longitude.toFixed(6)}
                        </span>
                      </div>
                      <div className="location-details">
                        <p><strong>Precisión:</strong> {device.accuracy.toFixed(0)}m</p>
                        {device.speed && (
                          <p><strong>Velocidad:</strong> {device.speed.toFixed(1)} m/s</p>
                        )}
                        {device.altitude && (
                          <p><strong>Altitud:</strong> {device.altitude.toFixed(0)}m</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="timestamp-info">
                      <p><strong>Última actualización:</strong></p>
                      <p>{formatTimestamp(device.timestamp)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {selectedDevice && (
          <div className="device-details">
            <div className="details-header">
              <h3>📊 Detalles del Dispositivo</h3>
              <button 
                onClick={() => setSelectedDevice(null)} 
                className="close-details"
              >
                ✕
              </button>
            </div>
            
            <div className="details-content">
              <div className="details-grid">
                <div className="detail-item">
                  <label>Usuario:</label>
                  <span>{selectedDevice.username}</span>
                </div>
                <div className="detail-item">
                  <label>ID Dispositivo:</label>
                  <span>{selectedDevice.deviceId}</span>
                </div>
                <div className="detail-item">
                  <label>Coordenadas:</label>
                  <span>{selectedDevice.latitude.toFixed(6)}, {selectedDevice.longitude.toFixed(6)}</span>
                </div>
                <div className="detail-item">
                  <label>Precisión GPS:</label>
                  <span>{selectedDevice.accuracy.toFixed(0)}m</span>
                </div>
                {selectedDevice.altitude && (
                  <div className="detail-item">
                    <label>Altitud:</label>
                    <span>{selectedDevice.altitude.toFixed(0)}m</span>
                  </div>
                )}
                {selectedDevice.speed && (
                  <div className="detail-item">
                    <label>Velocidad:</label>
                    <span>{(selectedDevice.speed * 3.6).toFixed(1)} km/h</span>
                  </div>
                )}
                {selectedDevice.heading && (
                  <div className="detail-item">
                    <label>Dirección:</label>
                    <span>{selectedDevice.heading.toFixed(0)}°</span>
                  </div>
                )}
                <div className="detail-item">
                  <label>Última actualización:</label>
                  <span>{formatTimestamp(selectedDevice.timestamp)}</span>
                </div>
              </div>
              
              <div className="map-actions">
                <button 
                  onClick={() => {
                    const url = `https://www.google.com/maps?q=${selectedDevice.latitude},${selectedDevice.longitude}`;
                    window.open(url, '_blank');
                  }}
                  className="map-button"
                >
                  🗺️ Ver en Google Maps
                </button>
                <button 
                  onClick={() => {
                    const url = `https://maps.apple.com/?ll=${selectedDevice.latitude},${selectedDevice.longitude}&q=${selectedDevice.latitude},${selectedDevice.longitude}`;
                    window.open(url, '_blank');
                  }}
                  className="map-button"
                >
                  🗺️ Ver en Apple Maps
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveTrackingMap;
