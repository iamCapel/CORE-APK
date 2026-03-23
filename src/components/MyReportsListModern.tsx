import React, { useState, useEffect } from 'react';
import firebaseReportStorage from '../services/firebaseReportStorage';
import { firebasePendingReportStorage } from '../services/firebasePendingReportStorage';

interface Report {
  id: string;
  reportNumber?: string;
  tipoIntervencion: string;
  direccion: string;
  fechaHora: string;
  estado: 'pendiente' | 'guardado' | 'realizado';
  timestamp?: any;
  region?: string;
  provincia?: string;
  municipio?: string;
  distrito?: string;
  numeroReporte?: string;
  createdBy?: string;
  date?: string;
}

interface District {
  name: string;
  interventions: number;
  reports: Report[];
}

interface Province {
  name: string;
  interventions: number;
  districts: District[];
}

interface Region {
  name: string;
  interventions: number;
  provinces: Province[];
}

interface MyReportsListModernProps {
  username: string;
  onClose: () => void;
  onContinuePendingReport?: (reportId: string) => void;
  onViewReport?: (reportId: string) => void;
}

const MyReportsListModern: React.FC<MyReportsListModernProps> = ({ 
  username, 
  onClose, 
  onContinuePendingReport,
  onViewReport 
}) => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  
  // Estados para vista jerárquica
  const [regions, setRegions] = useState<Region[]>([]);
  const [expandedRegions, setExpandedRegions] = useState<Set<string>>(new Set());
  const [expandedProvinces, setExpandedProvinces] = useState<Set<string>>(new Set());
  const [expandedDistricts, setExpandedDistricts] = useState<Set<string>>(new Set());

  // Configuración de estados con colores naranjas
  const estadoConfig = {
    pendiente: { 
      label: "Pendiente", 
      color: "#FF8C33", 
      bg: "rgba(255,140,51,0.15)", 
      border: "rgba(255,140,51,0.3)" 
    },
    guardado: { 
      label: "Guardado", 
      color: "#64B5F6", 
      bg: "rgba(100,181,246,0.15)", 
      border: "rgba(100,181,246,0.3)" 
    },
    realizado: { 
      label: "Realizado", 
      color: "#81C784", 
      bg: "rgba(129,199,132,0.15)", 
      border: "rgba(129,199,132,0.3)" 
    },
  };

  // Función mejorada para verificar si un reporte pertenece al usuario
  const isUserReport = (report: any, username: string): boolean => {
    if (!username || !report) return false;
    
    const exactMatches = [
      report.creadoPor,
      report.usuarioId, 
      report.username,
      report.userName,
      report.formData?.username,
      report.formData?.userName,
      report.formData?.userId,
      report.user?.username,
      report.user?.name,
      report.usuario?.username
    ];
    
    if (exactMatches.includes(username)) return true;
    
    const lowerUsername = username.toLowerCase();
    const lowerMatches = exactMatches
      .filter(field => field && typeof field === 'string')
      .map(field => field.toLowerCase());
    
    if (lowerMatches.includes(lowerUsername)) return true;
    
    const partialMatches = exactMatches
      .filter(field => field && typeof field === 'string')
      .filter(field => field.includes(username) || username.includes(field));
    
    return partialMatches.length > 0;
  };

  useEffect(() => {
    loadReports();
  }, [username]);

  const loadReports = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Cargando reportes para usuario:', username);
      
      // Cargar reportes pendientes
      const pending = await firebasePendingReportStorage.getAllPendingReports();
      const userPendingReports = pending.filter((report: any) => isUserReport(report, username));
      
      // Cargar reportes completados
      const allReports = await firebaseReportStorage.getAllReports();
      const userReports = allReports.filter((report: any) => isUserReport(report, username));
      
      // Combinar y enviar a processReports para estructura jerárquica
      const combined = [
        ...userPendingReports.map((r: any) => ({
          ...r,
          id: r._pendingReportId || r.id,
          numeroReporte: r.numeroReporte || `P-${(r._pendingReportId || r.id || '').slice(-6)}`,
          estado: 'pendiente',
          creadoPor: username
        })),
        ...userReports
      ];
      
      processReports(combined);
      console.log('✅ Reportes procesados en estructura jerárquica');
      
    } catch (error) {
      console.error('❌ Error al cargar reportes:', error);
      setError('No se pudieron cargar los reportes. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const processReports = (allReports: any[]) => {
    // Estructura jerárquica: Región > Provincia > Distrito > Reportes
    const hierarchyMap: Record<string, Record<string, Record<string, any[]>>> = {};
    const flatReports: Report[] = [];
    
    allReports.forEach(report => {
      const region = report.region || 'Sin región';
      const provincia = report.provincia || 'Sin provincia';
      const distrito = report.distrito || 'Sin distrito';
      
      if (!hierarchyMap[region]) hierarchyMap[region] = {};
      if (!hierarchyMap[region][provincia]) hierarchyMap[region][provincia] = {};
      if (!hierarchyMap[region][provincia][distrito]) hierarchyMap[region][provincia][distrito] = [];
      
      const formattedReport = {
        id: report.id || '',
        reportNumber: report.numeroReporte || 'SIN-NUMERO',
        tipoIntervencion: report.tipoIntervencion || 'Sin especificar',
        direccion: report.direccion || 'Sin dirección',
        fechaHora: report.fechaHora || new Date().toLocaleString('es-DO'),
        estado: report.estado || 'guardado',
        timestamp: report.timestamp,
        region: region,
        provincia: provincia,
        distrito: distrito,
        municipio: report.municipio || 'Sin municipio',
        createdBy: report.creadoPor || username,
        date: new Date(report.fechaCreacion || new Date()).toLocaleDateString()
      };
      
      hierarchyMap[region][provincia][distrito].push(formattedReport);
      flatReports.push(formattedReport);
    });
    
    // Construir estructura de regiones
    const regionNames = [
      'Ozama o Metropolitana', 'Cibao Norte', 'Cibao Sur', 'Cibao Nordeste',
      'Cibao Noroeste', 'Santiago', 'Valdesia', 'Enriquillo',
      'El Valle', 'Yuma', 'Higuamo'
    ];
    
    const regionsData: Region[] = regionNames.map(regionName => {
      const provincesMap = hierarchyMap[regionName] || {};
      const provinces: Province[] = Object.keys(provincesMap).map(provinceName => {
        const districtsMap = provincesMap[provinceName];
        const districts: District[] = Object.keys(districtsMap).map(districtName => ({
          name: districtName,
          interventions: districtsMap[districtName].length,
          reports: districtsMap[districtName]
        }));
        
        return {
          name: provinceName,
          interventions: districts.reduce((sum, d) => sum + d.interventions, 0),
          districts
        };
      });
      
      return {
        name: regionName,
        interventions: provinces.reduce((sum, p) => sum + p.interventions, 0),
        provinces
      };
    });
    
    setRegions(regionsData);
    setReports(flatReports);
  };

  // Funciones toggle para expandir/colapsar
  const toggleRegion = (regionName: string) => {
    const newExpanded = new Set(expandedRegions);
    if (newExpanded.has(regionName)) {
      newExpanded.delete(regionName);
    } else {
      newExpanded.add(regionName);
    }
    setExpandedRegions(newExpanded);
    setExpandedProvinces(new Set());
    setExpandedDistricts(new Set());
  };

  const toggleProvince = (provinceName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newExpanded = new Set(expandedProvinces);
    if (newExpanded.has(provinceName)) {
      newExpanded.delete(provinceName);
    } else {
      newExpanded.add(provinceName);
    }
    setExpandedProvinces(newExpanded);
    setExpandedDistricts(new Set());
  };

  const toggleDistrict = (districtName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newExpanded = new Set(expandedDistricts);
    if (newExpanded.has(districtName)) {
      newExpanded.delete(districtName);
    } else {
      newExpanded.add(districtName);
    }
    setExpandedDistricts(newExpanded);
  };

  const getProgressPercentage = (current: number, max: number) => {
    if (max === 0) return 0;
    return Math.min((current / max) * 100, 100);
  };

  const maxRegionInterventions = Math.max(...regions.map(r => r.interventions), 1);
  
  const getMaxProvinceInterventions = (regionName: string) => {
    const region = regions.find(r => r.name === regionName);
    if (!region || region.provinces.length === 0) return 1;
    return Math.max(...region.provinces.map(p => p.interventions));
  };

  const handleReportClick = (report: Report) => {
    setSelected(selected === report.id ? null : report.id);
    
    if (report.estado === 'pendiente' && onContinuePendingReport) {
      setTimeout(() => onContinuePendingReport(report.id), 300);
    } else if (report.estado !== 'pendiente' && onViewReport && report.reportNumber) {
      // Pasar el número de reporte, NO el ID
      setTimeout(() => onViewReport(report.reportNumber!), 300);
    }
  };

  const formatDate = (fechaHora: string) => {
    try {
      const date = new Date(fechaHora);
      const options: Intl.DateTimeFormatOptions = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      };
      return date.toLocaleDateString('es-DO', options);
    } catch {
      return fechaHora.split(' ')[0] || 'Fecha desconocida';
    }
  };

  const formatTime = (fechaHora: string) => {
    try {
      const date = new Date(fechaHora);
      return date.toLocaleTimeString('es-DO', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    } catch {
      return fechaHora.split(' ')[1] || 'Hora desconocida';
    }
  };

  const LocationIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  );

  const ClockIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  );

  const CalendarIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  );

  const ChevronIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  );

  if (loading) {
    return (
      <div className="modern-reports-container">
        <div className="loading-state">
          <div className="loading-spinner">⏳</div>
          <p>Cargando reportes desde Firebase...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="modern-reports-container">
        <div className="error-state">
          <div className="error-icon">❌</div>
          <p>{error}</p>
          <button className="retry-button" onClick={loadReports}>
            🔄 Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="modern-reports-container">
      {/* Header */}
      <div className="list-header">
        <h2 className="list-title">Mis <span>Reportes</span></h2>
        <span className="list-count">{reports.length} registros</span>
      </div>

      {/* Divider */}
      <div className="divider" />

      {/* Vista Jerárquica */}
      <div className="hierarchy-container">
        <div className="hierarchy-tree">
          {regions.map((region) => (
            <div key={region.name} className="hierarchy-item region-item">
              <div 
                className="hierarchy-row"
                onClick={() => toggleRegion(region.name)}
                data-count={`${region.interventions} reportes`}
              >
                <div className="hierarchy-info">
                  <span className="expand-icon">{expandedRegions.has(region.name) ? '▼' : '▶'}</span>
                  <span className="hierarchy-name">{region.name}</span>
                </div>
                <div className="progress-bar-container">
                  <div 
                    className="progress-bar-fill"
                    style={{ width: `${getProgressPercentage(region.interventions, maxRegionInterventions)}%` }}
                  />
                </div>
              </div>

              {expandedRegions.has(region.name) && (
                <div className="hierarchy-children">
                  {region.provinces.length === 0 ? (
                    <div className="empty-message">No hay provincias con intervenciones registradas</div>
                  ) : (
                    region.provinces.map((province) => (
                      <div key={province.name} className="hierarchy-item province-item">
                        <div 
                          className="hierarchy-row"
                          onClick={(e) => toggleProvince(province.name, e)}
                          data-count={`${province.interventions} reportes`}
                        >
                          <div className="hierarchy-info">
                            <span className="expand-icon">{expandedProvinces.has(province.name) ? '▼' : '▶'}</span>
                            <span className="hierarchy-name">{province.name}</span>
                          </div>
                          <div className="progress-bar-container">
                            <div 
                              className="progress-bar-fill"
                              style={{ width: `${getProgressPercentage(province.interventions, getMaxProvinceInterventions(region.name))}%` }}
                            />
                          </div>
                        </div>

                        {expandedProvinces.has(province.name) && (
                          <div className="hierarchy-children">
                            {province.districts.map((district) => (
                              <div key={district.name} className="hierarchy-item district-item">
                                <div 
                                  className="hierarchy-row"
                                  onClick={(e) => toggleDistrict(district.name, e)}
                                  data-count={`${district.interventions} reportes`}
                                >
                                  <div className="hierarchy-info">
                                    <span className="expand-icon">{expandedDistricts.has(district.name) ? '▼' : '▶'}</span>
                                    <span className="hierarchy-name">{district.name}</span>
                                  </div>
                                </div>

                                {expandedDistricts.has(district.name) && (
                                  <div className="reports-list">
                                    {district.reports.map((report) => (
                                      <div 
                                        key={report.id}
                                        className="report-item"
                                      >
                                        <div
                                          className="report-info"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (report.estado === 'pendiente' && onContinuePendingReport) {
                                              onContinuePendingReport(report.id);
                                            } else if (onViewReport) {
                                              onViewReport(report.reportNumber || report.id);
                                            }
                                          }}
                                        >
                                          <span className="report-number">#{report.reportNumber}</span>
                                          <span className="report-creator">{report.createdBy}</span>
                                          <span className="report-date">{report.date}</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {reports.length === 0 && (
        <div className="empty-state">
          <p>No tienes reportes registrados</p>
        </div>
      )}
    </div>
  );
};

export default MyReportsListModern;
