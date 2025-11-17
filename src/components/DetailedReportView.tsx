import React, { useState, useEffect } from 'react';
import { reportStorage } from '../services/reportStorage';
import './DetailedReportView.css';

interface Report {
  id: string;
  reportNumber: string;
  createdBy: string;
  date: string;
  district: string;
  province: string;
  region: string;
  municipio: string;
  sector: string;
  totalInterventions: number;
  tipoIntervencion: string;
  subTipoCanal?: string;
  // Datos métricos (plantilla)
  metricData: Record<string, string>;
  // Coordenadas GPS
  gpsData?: {
    punto_inicial?: { lat: number; lon: number };
    punto_alcanzado?: { lat: number; lon: number };
  };
  // Imágenes
  images?: string[];
  // Otros campos
  observations?: string;
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

interface DetailedReportViewProps {
  onClose?: (() => void) | null;
}

const DetailedReportView: React.FC<DetailedReportViewProps> = ({ onClose = null }) => {
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [expandedRegions, setExpandedRegions] = useState<Set<string>>(new Set());
  const [expandedProvinces, setExpandedProvinces] = useState<Set<string>>(new Set());
  const [expandedDistricts, setExpandedDistricts] = useState<Set<string>>(new Set());

  // Cargar datos reales desde reportStorage
  const [regionsData, setRegionsData] = useState<Region[]>([]);

  useEffect(() => {
    // Cargar todos los reportes y organizarlos por jerarquía
    const allReports = reportStorage.getAllReports();
    
    // Estructura jerárquica: Región > Provincia > Distrito > Reportes
    const hierarchyMap: Record<string, Record<string, Record<string, any[]>>> = {};
    
    allReports.forEach(report => {
      const region = report.region || 'Sin región';
      const provincia = report.provincia || 'Sin provincia';
      const distrito = report.distrito || 'Sin distrito';
      
      if (!hierarchyMap[region]) hierarchyMap[region] = {};
      if (!hierarchyMap[region][provincia]) hierarchyMap[region][provincia] = {};
      if (!hierarchyMap[region][provincia][distrito]) hierarchyMap[region][provincia][distrito] = [];
      
      // Convertir reporte al formato esperado
      hierarchyMap[region][provincia][distrito].push({
        id: report.id,
        reportNumber: report.numeroReporte,
        createdBy: report.creadoPor,
        date: new Date(report.fechaCreacion).toLocaleDateString(),
        district: report.distrito,
        province: report.provincia,
        region: report.region,
        municipio: report.municipio,
        sector: report.sector,
        totalInterventions: 1,
        tipoIntervencion: report.tipoIntervencion,
        subTipoCanal: report.subTipoCanal,
        metricData: report.metricData || {},
        gpsData: report.gpsData,
        observations: report.observaciones
      });
    });
    
    // Construir estructura de regiones
    const regionNames = [
      'Ozama o Metropolitana', 'Cibao Norte', 'Cibao Sur', 'Cibao Nordeste',
      'Cibao Noroeste', 'Santiago', 'Valdesia', 'Enriquillo',
      'El Valle', 'Yuma', 'Higuamo'
    ];
    
    const regions: Region[] = regionNames.map(regionName => {
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
    
    setRegionsData(regions);
  }, []);

  const toggleRegion = (regionName: string) => {
    const newExpanded = new Set(expandedRegions);
    if (newExpanded.has(regionName)) {
      newExpanded.delete(regionName);
      setSelectedRegion(null);
    } else {
      newExpanded.add(regionName);
      setSelectedRegion(regionName);
    }
    setExpandedRegions(newExpanded);
    setExpandedProvinces(new Set());
    setExpandedDistricts(new Set());
    setSelectedProvince(null);
    setSelectedDistrict(null);
    setSelectedReport(null);
  };

  const toggleProvince = (provinceName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newExpanded = new Set(expandedProvinces);
    if (newExpanded.has(provinceName)) {
      newExpanded.delete(provinceName);
      setSelectedProvince(null);
    } else {
      newExpanded.add(provinceName);
      setSelectedProvince(provinceName);
    }
    setExpandedProvinces(newExpanded);
    setExpandedDistricts(new Set());
    setSelectedDistrict(null);
    setSelectedReport(null);
  };

  const toggleDistrict = (districtName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newExpanded = new Set(expandedDistricts);
    if (newExpanded.has(districtName)) {
      newExpanded.delete(districtName);
      setSelectedDistrict(null);
    } else {
      newExpanded.add(districtName);
      setSelectedDistrict(districtName);
    }
    setExpandedDistricts(newExpanded);
    setSelectedReport(null);
  };

  const viewReport = (report: Report, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedReport(report);
  };

  const closeReportView = () => {
    setSelectedReport(null);
  };

  const getProgressPercentage = (current: number, max: number) => {
    if (max === 0) return 0;
    return Math.min((current / max) * 100, 100);
  };

  // Calcular el máximo para cada nivel
  const maxRegionInterventions = Math.max(...regionsData.map(r => r.interventions));
  
  const getMaxProvinceInterventions = (regionName: string) => {
    const region = regionsData.find(r => r.name === regionName);
    if (!region) return 1;
    return Math.max(...region.provinces.map(p => p.interventions));
  };

  const getMaxDistrictInterventions = (regionName: string, provinceName: string) => {
    const region = regionsData.find(r => r.name === regionName);
    if (!region) return 1;
    const province = region.provinces.find(p => p.name === provinceName);
    if (!province) return 1;
    return Math.max(...province.districts.map(d => d.interventions));
  };

  if (selectedReport) {
    return (
      <div className="detailed-report-modal">
        <div className="report-viewer">
          <div className="report-viewer-header">
            <h2>📄 Informe Completo - #{selectedReport.reportNumber}</h2>
            <div className="report-readonly-badge">🔒 Solo Lectura</div>
            <button className="close-report-btn" onClick={closeReportView}>✕</button>
          </div>
          <div className="report-viewer-content">
            {/* Información General */}
            <div className="report-section">
              <h3 className="section-title">📋 Información General</h3>
              <div className="report-grid">
                <div className="report-field">
                  <label>Número de Reporte:</label>
                  <div className="field-value">{selectedReport.reportNumber}</div>
                </div>
                <div className="report-field">
                  <label>Creado por:</label>
                  <div className="field-value">{selectedReport.createdBy}</div>
                </div>
                <div className="report-field">
                  <label>Fecha de Creación:</label>
                  <div className="field-value">{selectedReport.date}</div>
                </div>
                <div className="report-field">
                  <label>Tipo de Intervención:</label>
                  <div className="field-value">{selectedReport.tipoIntervencion}</div>
                </div>
              </div>
            </div>

            {/* Ubicación Geográfica */}
            <div className="report-section">
              <h3 className="section-title">📍 Ubicación Geográfica</h3>
              <div className="report-grid">
                <div className="report-field">
                  <label>Región:</label>
                  <div className="field-value">{selectedReport.region}</div>
                </div>
                <div className="report-field">
                  <label>Provincia:</label>
                  <div className="field-value">{selectedReport.province}</div>
                </div>
                <div className="report-field">
                  <label>Distrito:</label>
                  <div className="field-value">{selectedReport.district}</div>
                </div>
                <div className="report-field">
                  <label>Municipio:</label>
                  <div className="field-value">{selectedReport.municipio}</div>
                </div>
                <div className="report-field">
                  <label>Sector:</label>
                  <div className="field-value">{selectedReport.sector}</div>
                </div>
              </div>
            </div>

            {/* Datos Métricos */}
            {selectedReport.metricData && Object.keys(selectedReport.metricData).length > 0 && (
              <div className="report-section">
                <h3 className="section-title">📊 Datos Métricos</h3>
                <div className="report-grid">
                  {Object.entries(selectedReport.metricData).map(([key, value]) => (
                    <div key={key} className="report-field">
                      <label>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</label>
                      <div className="field-value">
                        {value} {getUnitForMetric(key)}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="report-field total-interventions">
                  <label>Total de Intervenciones:</label>
                  <div className="field-value highlight">{selectedReport.totalInterventions}</div>
                </div>
              </div>
            )}

            {/* Coordenadas GPS */}
            {selectedReport.gpsData && (
              <div className="report-section">
                <h3 className="section-title">🌍 Coordenadas GPS</h3>
                <div className="report-grid">
                  {selectedReport.gpsData.punto_inicial && (
                    <div className="report-field">
                      <label>Punto Inicial:</label>
                      <div className="field-value gps-coords">
                        <span>Lat: {selectedReport.gpsData.punto_inicial.lat.toFixed(6)}°</span>
                        <span>Lon: {selectedReport.gpsData.punto_inicial.lon.toFixed(6)}°</span>
                      </div>
                    </div>
                  )}
                  {selectedReport.gpsData.punto_alcanzado && (
                    <div className="report-field">
                      <label>Punto Alcanzado:</label>
                      <div className="field-value gps-coords">
                        <span>Lat: {selectedReport.gpsData.punto_alcanzado.lat.toFixed(6)}°</span>
                        <span>Lon: {selectedReport.gpsData.punto_alcanzado.lon.toFixed(6)}°</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Imágenes */}
            {selectedReport.images && selectedReport.images.length > 0 && (
              <div className="report-section">
                <h3 className="section-title">📷 Imágenes del Proyecto</h3>
                <div className="images-grid">
                  {selectedReport.images.map((img, idx) => (
                    <div key={idx} className="image-item">
                      <img src={img} alt={`Imagen ${idx + 1}`} />
                      <span className="image-label">Imagen {idx + 1}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Observaciones */}
            {selectedReport.observations && (
              <div className="report-section">
                <h3 className="section-title">📝 Observaciones</h3>
                <div className="observations-box">
                  {selectedReport.observations}
                </div>
              </div>
            )}

            {/* Aviso de Solo Lectura */}
            <div className="readonly-notice-footer">
              <span className="lock-icon">🔒</span>
              <span>Este informe no puede ser modificado. Solo se puede visualizar la información registrada.</span>
            </div>
          </div>
          <div className="report-viewer-footer">
            <button className="btn-secondary" onClick={closeReportView}>Cerrar Informe</button>
          </div>
        </div>
      </div>
    );
  }

  // Helper function para obtener unidades de medida
  function getUnitForMetric(key: string): string {
    const units: Record<string, string> = {
      longitud_limpiada: 'm',
      ancho_canal: 'm',
      profundidad_canal: 'm',
      volumen_excavado: 'm³',
      altura_presa: 'm',
      longitud_cresta: 'm',
      capacidad_almacenamiento: 'm³',
      longitud_drenaje: 'm',
      diametro_tuberia: 'm',
      longitud_camino: 'm',
      ancho_camino: 'm',
      espesor_capa: 'm',
      longitud_puente: 'm',
      ancho_puente: 'm',
      numero_vanos: 'unidades'
    };
    return units[key] || '';
  }


  return (
    <div className="detailed-report-modal">
      <div className="detailed-report-container">
        <div className="detailed-report-header">
          <h2>📄 Informe Detallado por Regiones</h2>
          {onClose && <button className="close-btn" onClick={onClose}>✕</button>}
        </div>

        <div className="detailed-report-content">
          <div className="hierarchy-list">
            {regionsData.map((region) => (
              <div key={region.name} className="hierarchy-item region-item">
                <div 
                  className="hierarchy-row"
                  onClick={() => toggleRegion(region.name)}
                  data-count={region.interventions > 0 ? `${region.interventions} reportes` : 'Sin datos'}
                >
                  <div className="hierarchy-info">
                    <span className="expand-icon">{expandedRegions.has(region.name) ? '▼' : '▶'}</span>
                    <span className="hierarchy-name">{region.name}</span>
                  </div>
                </div>

                {expandedRegions.has(region.name) && (
                  <div className="hierarchy-children">
                    {region.provinces.length === 0 ? (
                      <div className="empty-folder">
                        <span className="empty-icon">📭</span>
                        <span className="empty-text">No hay datos registrados para esta región</span>
                      </div>
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
                                          onClick={(e) => viewReport(report, e)}
                                        >
                                          <div className="report-info">
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
      </div>
    </div>
  );
};

export default DetailedReportView;
