import React, { useState, useEffect } from 'react';
import firebaseReportStorage from '../services/firebaseReportStorage';
import './ReportView.css';

interface Report {
  id: string;
  numeroReporte: string;
  creadoPor: string;
  fechaCreacion: string;
  region: string;
  provincia: string;
  municipio: string;
  distrito: string;
  sector: string;
  tipoIntervencion: string;
  subTipoCanal?: string;
  estado: string;
  metricData?: Record<string, any>;
  gpsData?: {
    punto_inicial?: { lat: number; lon: number };
    punto_alcanzado?: { lat: number; lon: number };
  };
  observaciones?: string;
  imagenes?: string[];
  vehiculos?: any[];
  fechaInicio?: string;
  fechaFinal?: string;
}

interface ReportViewProps {
  reportId?: string;  // Puede ser el ID o el número de reporte
  onClose: () => void;
  onEdit?: (report: Report) => void;
  user?: {
    username: string;
    role?: string;
  };
}

const ReportView: React.FC<ReportViewProps> = ({ reportId, onClose, onEdit, user }) => {
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'metrics' | 'gps' | 'images'>('info');

  useEffect(() => {
    const loadReport = async () => {
      if (!reportId) {
        setLoading(false);
        return;
      }

      try {
        // Intentar buscar por ID primero
        let reportData = await firebaseReportStorage.getReport(reportId);
        
        // Si no se encuentra por ID, intentar buscar por número de reporte
        if (!reportData) {
          const allReports = await firebaseReportStorage.getAllReports();
          reportData = allReports.find(r => r.numeroReporte === reportId) || null;
        }
        
        if (reportData) {
          setReport(reportData as Report);
        }
      } catch (error) {
        console.error('Error cargando reporte:', error);
      } finally {
        setLoading(false);
      }
    };

    loadReport();
  }, [reportId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-DO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEstadoColor = (estado: string) => {
    switch (estado?.toLowerCase()) {
      case 'completado':
      case 'aprobado':
        return '#10b981';
      case 'pendiente':
        return '#FF6B00';
      case 'en_revision':
        return '#3b82f6';
      case 'rechazado':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const formatMetricKey = (key: string) => {
    return key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  const getMetricUnit = (key: string): string => {
    const units: Record<string, string> = {
      longitud_intervencion: 'km',
      limpieza_superficie: 'm²',
      perfilado_superficie: 'm²',
      compactado_superficie: 'm²',
      conformacion_cunetas: 'ml',
      extraccion_bote_material: 'm³',
      escarificacion_superficies: 'm²',
      conformacion_plataforma: 'm²',
      zafra_material: 'm³',
      motonivelacion_superficie: 'm²',
      suministro_extension_material: 'm³',
      suministro_colocacion_grava: 'm³',
      nivelacion_compactacion_grava: 'm²',
      reparacion_alcantarillas: 'und',
      construccion_alcantarillas: 'und',
      limpieza_alcantarillas: 'und',
      limpieza_cauces: 'ml',
      obras_drenaje: 'ml',
      construccion_terraplenes: 'm³',
      relleno_compactacion: 'm³',
      conformacion_taludes: 'm²'
    };
    return units[key] || '';
  };

  if (loading) {
    return (
      <div className="reportview-overlay">
        <div className="reportview-modal">
          <div className="reportview-loading">
            <div className="loading-spinner"></div>
            <p>Cargando reporte...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="reportview-overlay">
        <div className="reportview-modal">
          <div className="reportview-error">
            <h2>❌ Reporte no encontrado</h2>
            <p>El reporte solicitado no existe o no está disponible.</p>
            <button className="reportview-btn-primary" onClick={onClose}>
              Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="reportview-overlay">
      <div className="reportview-modal">
        {/* Header con glass ahumado */}
        <div className="reportview-header">
          <div className="reportview-header-content">
            <div className="reportview-title-section">
              <h1 className="reportview-title">
                📋 Reporte #{report.numeroReporte}
              </h1>
              <div className="reportview-meta">
                <span className="reportview-date">{formatDate(report.fechaCreacion)}</span>
                <span 
                  className="reportview-status"
                  style={{ 
                    backgroundColor: getEstadoColor(report.estado),
                    color: 'white'
                  }}
                >
                  {report.estado?.toUpperCase()}
                </span>
              </div>
            </div>
            
            <div className="reportview-actions">
              {onEdit && (
                <button 
                  className="reportview-btn reportview-btn-edit"
                  onClick={() => onEdit(report)}
                >
                  ✏️ Editar
                </button>
              )}
              <button 
                className="reportview-btn reportview-btn-close"
                onClick={onClose}
              >
                ✕ Cerrar
              </button>
            </div>
          </div>
        </div>

        {/* Navegación por pestañas */}
        <div className="reportview-tabs">
          <button 
            className={`reportview-tab ${activeTab === 'info' ? 'active' : ''}`}
            onClick={() => setActiveTab('info')}
          >
            📋 Información
          </button>
          <button 
            className={`reportview-tab ${activeTab === 'metrics' ? 'active' : ''}`}
            onClick={() => setActiveTab('metrics')}
          >
            📊 Métricas
          </button>
          <button 
            className={`reportview-tab ${activeTab === 'gps' ? 'active' : ''}`}
            onClick={() => setActiveTab('gps')}
          >
            📍 GPS
          </button>
          {report.imagenes && report.imagenes.length > 0 && (
            <button 
              className={`reportview-tab ${activeTab === 'images' ? 'active' : ''}`}
              onClick={() => setActiveTab('images')}
            >
              📷 Imágenes
            </button>
          )}
        </div>

        {/* Contenido principal */}
        <div className="reportview-content">
          {/* Tab Información */}
          {activeTab === 'info' && (
            <div className="reportview-tab-content">
              <div className="reportview-section">
                <h3 className="section-title">📍 Ubicación Geográfica</h3>
                <div className="reportview-grid">
                  <div className="reportview-field">
                    <label>Región:</label>
                    <span>{report.region || 'N/A'}</span>
                  </div>
                  <div className="reportview-field">
                    <label>Provincia:</label>
                    <span>{report.provincia || 'N/A'}</span>
                  </div>
                  <div className="reportview-field">
                    <label>Municipio:</label>
                    <span>{report.municipio || 'N/A'}</span>
                  </div>
                  <div className="reportview-field">
                    <label>Distrito:</label>
                    <span>{report.distrito || 'N/A'}</span>
                  </div>
                  <div className="reportview-field">
                    <label>Sector:</label>
                    <span>{report.sector || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="reportview-section">
                <h3 className="section-title">🛠️ Detalles de Intervención</h3>
                <div className="reportview-grid">
                  <div className="reportview-field">
                    <label>Tipo de Intervención:</label>
                    <span>{report.tipoIntervencion || 'N/A'}</span>
                  </div>
                  {report.subTipoCanal && (
                    <div className="reportview-field">
                      <label>Subtipo de Canal:</label>
                      <span>{report.subTipoCanal}</span>
                    </div>
                  )}
                  <div className="reportview-field">
                    <label>Creado por:</label>
                    <span>{report.creadoPor || 'N/A'}</span>
                  </div>
                  {report.fechaInicio && (
                    <div className="reportview-field">
                      <label>Fecha de Inicio:</label>
                      <span>{formatDate(report.fechaInicio)}</span>
                    </div>
                  )}
                  {report.fechaFinal && (
                    <div className="reportview-field">
                      <label>Fecha Final:</label>
                      <span>{formatDate(report.fechaFinal)}</span>
                    </div>
                  )}
                </div>
              </div>

              {report.observaciones && (
                <div className="reportview-section">
                  <h3 className="section-title">📝 Observaciones</h3>
                  <div className="reportview-observations">
                    {report.observaciones}
                  </div>
                </div>
              )}

              {report.vehiculos && report.vehiculos.length > 0 && (
                <div className="reportview-section">
                  <h3 className="section-title">🚛 Vehículos Utilizados</h3>
                  <div className="reportview-vehicles">
                    {report.vehiculos.map((vehiculo, index) => (
                      <div key={index} className="vehicle-item">
                        <span className="vehicle-name">{vehiculo.tipo || 'Vehículo'}</span>
                        <span className="vehicle-quantity">Cantidad: {vehiculo.cantidad || 1}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab Métricas */}
          {activeTab === 'metrics' && report.metricData && (
            <div className="reportview-tab-content">
              <div className="reportview-section">
                <h3 className="section-title">📊 Datos Métricos</h3>
                <div className="reportview-metrics-grid">
                  {Object.entries(report.metricData).map(([key, value]) => (
                    <div key={key} className="metric-card">
                      <div className="metric-label">
                        {formatMetricKey(key)}
                      </div>
                      <div className="metric-value">
                        {value}
                        {getMetricUnit(key) && (
                          <span className="metric-unit">{getMetricUnit(key)}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab GPS */}
          {activeTab === 'gps' && report.gpsData && (
            <div className="reportview-tab-content">
              <div className="reportview-section">
                <h3 className="section-title">📍 Coordenadas GPS</h3>
                <div className="reportview-gps-container">
                  {report.gpsData.punto_inicial && (
                    <div className="gps-point">
                      <h4>🟢 Punto Inicial</h4>
                      <div className="gps-coords">
                        <div className="coord-item">
                          <label>Latitud:</label>
                          <span>{report.gpsData.punto_inicial.lat.toFixed(6)}°</span>
                        </div>
                        <div className="coord-item">
                          <label>Longitud:</label>
                          <span>{report.gpsData.punto_inicial.lon.toFixed(6)}°</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {report.gpsData.punto_alcanzado && (
                    <div className="gps-point">
                      <h4>🔴 Punto Alcanzado</h4>
                      <div className="gps-coords">
                        <div className="coord-item">
                          <label>Latitud:</label>
                          <span>{report.gpsData.punto_alcanzado.lat.toFixed(6)}°</span>
                        </div>
                        <div className="coord-item">
                          <label>Longitud:</label>
                          <span>{report.gpsData.punto_alcanzado.lon.toFixed(6)}°</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tab Imágenes */}
          {activeTab === 'images' && report.imagenes && report.imagenes.length > 0 && (
            <div className="reportview-tab-content">
              <div className="reportview-section">
                <h3 className="section-title">📷 Imágenes del Reporte</h3>
                <div className="reportview-images-grid">
                  {report.imagenes.map((imagen, index) => (
                    <div key={index} className="image-item">
                      <img 
                        src={imagen} 
                        alt={`Imagen ${index + 1}`}
                        onClick={() => window.open(imagen, '_blank')}
                      />
                      <div className="image-overlay">
                        <span>Imagen {index + 1}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportView;
