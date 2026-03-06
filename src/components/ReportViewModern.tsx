import React, { useState, useEffect } from 'react';
import firebaseReportStorage from '../services/firebaseReportStorage';
import './ReportViewModern.css';

interface ReportData {
  id: string;
  numeroReporte: string;
  region: string;
  provincia: string;
  municipio: string;
  distrito: string;
  sector: string;
  tipoIntervencion: string;
  creadoPor: string;
  fechaCreacion: string;
  metricData: Record<string, any>;
  gpsData?: Record<string, { lat: number; lon: number }>;
  vehiculos: Array<{
    tipo: string;
    modelo: string;
    ficha: string;
  }>;
  observaciones?: string;
}

interface ReportViewModernProps {
  reportId: string;
  onClose: () => void;
  onEdit?: (report: ReportData) => void;
  onDelete?: (reportId: string) => void;
  onExport?: (report: ReportData) => void;
}

const ReportViewModern: React.FC<ReportViewModernProps> = ({
  reportId,
  onClose,
  onEdit,
  onDelete,
  onExport
}) => {
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  // Cargar datos del reporte
  useEffect(() => {
    const loadReport = async () => {
      try {
        console.log('🔍 ReportViewModern useEffect llamado con reportId:', reportId);
        setLoading(true);
        setError(null);
        
        // Cargar datos reales desde Firebase
        console.log('🔍 Buscando reporte en Firebase con ID:', reportId);
        const firebaseReport = await firebaseReportStorage.getReport(reportId);
        
        console.log('🔍 Respuesta de Firebase:', firebaseReport);
        
        if (firebaseReport) {
          // Convertir datos de Firebase al formato esperado
          const reportData: ReportData = {
            id: firebaseReport.id,
            numeroReporte: firebaseReport.numeroReporte || firebaseReport.id,
            region: firebaseReport.region || 'N/A',
            provincia: firebaseReport.provincia || 'N/A',
            municipio: firebaseReport.municipio || 'N/A',
            distrito: firebaseReport.distrito || 'N/A',
            sector: firebaseReport.sector || 'N/A',
            tipoIntervencion: firebaseReport.tipoIntervencion || 'No especificado',
            creadoPor: firebaseReport.creadoPor || 'Desconocido',
            fechaCreacion: firebaseReport.fechaCreacion || new Date().toISOString(),
            metricData: firebaseReport.metricData || {},
            gpsData: firebaseReport.gpsData || {},
            vehiculos: firebaseReport.vehiculos || [],
            observaciones: firebaseReport.observaciones || ''
          };
          
          setReport(reportData);
          console.log('✅ Reporte cargado desde Firebase:', reportData);
        } else {
          throw new Error('Reporte no encontrado');
        }
      } catch (err) {
        console.error('❌ Error al cargar reporte:', err);
        setError('No se pudo cargar el reporte. Por favor intente nuevamente.');
      } finally {
        setLoading(false);
      }
    };

    if (reportId) {
      loadReport();
    } else {
      console.log('❌ ReportViewModern: reportId está vacío');
    }
  }, [reportId]);

  const toggleSection = (sectionId: string) => {
    setCollapsedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const handleEdit = () => {
    if (report && onEdit) {
      onEdit(report);
    }
  };

  const handleDelete = () => {
    if (report && onDelete) {
      if (window.confirm('¿Estás seguro de que quieres eliminar este reporte?')) {
        onDelete(report.id);
      }
    }
  };

  const handleExport = () => {
    if (report && onExport) {
      onExport(report);
    }
  };

  if (loading) {
    return (
      <div className="report-view-modern">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando reporte...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="report-view-modern">
        <div className="error-container">
          <p>{error || 'No se encontró el reporte'}</p>
          <button onClick={onClose} className="btn-back">Volver</button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="report-view-modern">
      {/* Status Bar */}
      <div className="status-bar">
        <span>{new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
        <span>MOPC CORE</span>
        <span>▌▌▌ 100%</span>
      </div>

      {/* Top Bar */}
      <div className="topbar">
        <div className="topbar-back" onClick={onClose}>←</div>
        <div className="topbar-info">
          <div className="topbar-label">Informe Detallado</div>
          <div className="topbar-title">{report.tipoIntervencion}</div>
        </div>
        <div className="topbar-actions">
          <div className="icon-btn">📥</div>
          <div className="icon-btn">
            🔔
            <div className="badge">2</div>
          </div>
        </div>
      </div>

      {/* Hero Card */}
      <div className="hero-card">
        <div className="hero-inner">
          <div className="hero-logo">🏗️</div>
          <div className="hero-meta">
            <div className="hero-org">Dirección de Coordinación Regional</div>
            <div className="hero-name">
              {report.metricData.nombre_camino || report.tipoIntervencion}
            </div>
            <div className="hero-pills">
              <span className="pill pill-orange">{report.region}</span>
              <span className="pill pill-green">Activo</span>
            </div>
          </div>
          <div className="hero-id">
            <span className="hero-id-label">N° Reporte</span>
            <div className="hero-id-val">{report.numeroReporte}</div>
          </div>
        </div>
      </div>

      {/* Meta Strip */}
      <div className="meta-strip">
        <div className="meta-cell">
          <div className="meta-lbl">Creado por</div>
          <div className="meta-val">{report.creadoPor}</div>
        </div>
        <div className="meta-cell">
          <div className="meta-lbl">Fecha</div>
          <div className="meta-val">{formatDate(report.fechaCreacion)}</div>
        </div>
        <div className="meta-cell">
          <div className="meta-lbl">Longitud</div>
          <div className="meta-val">{report.metricData.longitud_intervencion || 0} km</div>
        </div>
      </div>

      {/* Sections */}
      <div className="sections">
        {/* Ubicación */}
        <div className={`section-card ${collapsedSections.has('ubicacion') ? 'collapsed' : ''}`} id="ubicacion">
          <div className="section-header" onClick={() => toggleSection('ubicacion')}>
            <div className="section-icon">📍</div>
            <div className="section-title">Ubicación</div>
            <span className="section-chevron">▾</span>
          </div>
          <div className="section-body">
            <div className="field-row">
              <div className="field-label">Región</div>
              <div className="field-val">{report.region}</div>
            </div>
            <div className="field-row">
              <div className="field-label">Provincia</div>
              <div className="field-val">{report.provincia}</div>
            </div>
            <div className="field-row">
              <div className="field-label">Municipio</div>
              <div className="field-val">{report.municipio}</div>
            </div>
            <div className="field-row">
              <div className="field-label">Distrito</div>
              <div className="field-val">{report.distrito}</div>
            </div>
            <div className="field-row">
              <div className="field-label">Sector</div>
              <div className="field-val">{report.sector}</div>
            </div>
          </div>
        </div>

        {/* Intervención */}
        <div className={`section-card ${collapsedSections.has('intervencion') ? 'collapsed' : ''}`} id="intervencion">
          <div className="section-header" onClick={() => toggleSection('intervencion')}>
            <div className="section-icon">🔧</div>
            <div className="section-title">Detalles de Intervención</div>
            <span className="section-chevron">▾</span>
          </div>
          <div className="section-body">
            <div className="stats-grid">
              {Object.entries(report.metricData).map(([key, value]) => {
                if (typeof value === 'number' && key !== 'longitud_intervencion') {
                  const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                  return (
                    <div className="stat-cell" key={key}>
                      <div className="stat-label">{label}</div>
                      <div className="stat-val">{Math.abs(value)}</div>
                      <div className="stat-unit">unidades</div>
                    </div>
                  );
                }
                return null;
              })}
            </div>
            {report.metricData.nombre_camino && (
              <div className="field-row">
                <div className="field-label">Nombre Camino</div>
                <div className="field-val">{report.metricData.nombre_camino}</div>
              </div>
            )}
            {report.metricData.longitud_intervencion && (
              <div className="field-row">
                <div className="field-label">Longitud</div>
                <div className="field-val accent">{report.metricData.longitud_intervencion} km</div>
              </div>
            )}
          </div>
        </div>

        {/* Vehículos */}
        <div className={`section-card ${collapsedSections.has('vehiculos') ? 'collapsed' : ''}`} id="vehiculos">
          <div className="section-header" onClick={() => toggleSection('vehiculos')}>
            <div className="section-icon">🚜</div>
            <div className="section-title">Vehículos Utilizados</div>
            <span className="section-count">{report.vehiculos.length}</span>
            <span className="section-chevron">▾</span>
          </div>
          <div className="section-body">
            <div className="vehicle-list">
              {report.vehiculos.map((vehicle, index) => (
                <div className="vehicle-row" key={index}>
                  <div className="vehicle-num">{String(index + 1).padStart(2, '0')}</div>
                  <div className="vehicle-info">
                    <div className="vehicle-type">{vehicle.tipo}</div>
                    <div className="vehicle-sub">{vehicle.modelo}</div>
                  </div>
                  <div className="vehicle-ficha">{vehicle.ficha}</div>
                  <div className="vehicle-arrow">›</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* GPS */}
        {report.gpsData && (
          <div className={`section-card ${collapsedSections.has('gps') ? 'collapsed' : ''}`} id="gps">
            <div className="section-header" onClick={() => toggleSection('gps')}>
              <div className="section-icon">🗺️</div>
              <div className="section-title">Coordenadas GPS</div>
              <span className="section-chevron">▾</span>
            </div>
            <div className="section-body">
              <div className="gps-block">
                {report.gpsData.punto_inicial && (
                  <div className="gps-row">
                    <div className="gps-dot start"></div>
                    <div>
                      <div className="gps-lbl">Punto Inicial</div>
                      <div className="gps-coords">
                        {report.gpsData.punto_inicial.lat.toFixed(6)}°N &nbsp; {Math.abs(report.gpsData.punto_inicial.lon).toFixed(6)}°W
                      </div>
                    </div>
                  </div>
                )}
                {report.gpsData.punto_alcanzado && (
                  <div className="gps-row">
                    <div className="gps-dot end"></div>
                    <div>
                      <div className="gps-lbl">Punto Alcanzado</div>
                      <div className="gps-coords">
                        {report.gpsData.punto_alcanzado.lat.toFixed(6)}°N &nbsp; {Math.abs(report.gpsData.punto_alcanzado.lon).toFixed(6)}°W
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Observaciones */}
        {report.observaciones && (
          <div className={`section-card ${collapsedSections.has('observaciones') ? 'collapsed' : ''}`} id="observaciones">
            <div className="section-header" onClick={() => toggleSection('observaciones')}>
              <div className="section-icon">📝</div>
              <div className="section-title">Observaciones</div>
              <span className="section-chevron">▾</span>
            </div>
            <div className="section-body">
              <div className="obs-box">
                {report.observaciones.split('\n\n').map((obs, index) => (
                  <div key={index} className="obs-warn">
                    <span className="obs-warn-icon">⚠️</span>
                    <div className="obs-warn-text">{obs}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Bar */}
      <div className="bottom-bar">
        <button className="btn-ghost" onClick={handleEdit}>✏️ Editar</button>
        <button className="btn-danger" onClick={handleDelete}>🗑️</button>
        <button className="btn-primary" onClick={handleExport}>Exportar Informe 📥</button>
      </div>
    </div>
  );
};

export default ReportViewModern;
