import React, { useState } from 'react';
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
  onClose: () => void;
}

const DetailedReportView: React.FC<DetailedReportViewProps> = ({ onClose }) => {
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [expandedRegions, setExpandedRegions] = useState<Set<string>>(new Set());
  const [expandedProvinces, setExpandedProvinces] = useState<Set<string>>(new Set());
  const [expandedDistricts, setExpandedDistricts] = useState<Set<string>>(new Set());

  // Datos de ejemplo de República Dominicana
  const regionsData: Region[] = [
    {
      name: 'Región Cibao Norte',
      interventions: 450,
      provinces: [
        {
          name: 'Santiago',
          interventions: 180,
          districts: [
            { name: 'Santiago', interventions: 120, reports: generateMockReports('Santiago', 'Santiago', 'Región Cibao Norte', 120) },
            { name: 'Villa González', interventions: 30, reports: generateMockReports('Villa González', 'Santiago', 'Región Cibao Norte', 30) },
            { name: 'Tamboril', interventions: 30, reports: generateMockReports('Tamboril', 'Santiago', 'Región Cibao Norte', 30) }
          ]
        },
        {
          name: 'Puerto Plata',
          interventions: 150,
          districts: [
            { name: 'San Felipe de Puerto Plata', interventions: 90, reports: generateMockReports('San Felipe de Puerto Plata', 'Puerto Plata', 'Región Cibao Norte', 90) },
            { name: 'Sosúa', interventions: 40, reports: generateMockReports('Sosúa', 'Puerto Plata', 'Región Cibao Norte', 40) },
            { name: 'Cabarete', interventions: 20, reports: generateMockReports('Cabarete', 'Puerto Plata', 'Región Cibao Norte', 20) }
          ]
        },
        {
          name: 'Espaillat',
          interventions: 120,
          districts: [
            { name: 'Moca', interventions: 80, reports: generateMockReports('Moca', 'Espaillat', 'Región Cibao Norte', 80) },
            { name: 'Cayetano Germosén', interventions: 40, reports: generateMockReports('Cayetano Germosén', 'Espaillat', 'Región Cibao Norte', 40) }
          ]
        }
      ]
    },
    {
      name: 'Región Cibao Sur',
      interventions: 280,
      provinces: [
        {
          name: 'La Vega',
          interventions: 150,
          districts: [
            { name: 'Concepción de La Vega', interventions: 100, reports: generateMockReports('Concepción de La Vega', 'La Vega', 'Región Cibao Sur', 100) },
            { name: 'Jarabacoa', interventions: 50, reports: generateMockReports('Jarabacoa', 'La Vega', 'Región Cibao Sur', 50) }
          ]
        },
        {
          name: 'Sánchez Ramírez',
          interventions: 130,
          districts: [
            { name: 'Cotuí', interventions: 90, reports: generateMockReports('Cotuí', 'Sánchez Ramírez', 'Región Cibao Sur', 90) },
            { name: 'Fantino', interventions: 40, reports: generateMockReports('Fantino', 'Sánchez Ramírez', 'Región Cibao Sur', 40) }
          ]
        }
      ]
    },
    {
      name: 'Región Ozama',
      interventions: 520,
      provinces: [
        {
          name: 'Distrito Nacional',
          interventions: 300,
          districts: [
            { name: 'Santo Domingo de Guzmán', interventions: 300, reports: generateMockReports('Santo Domingo de Guzmán', 'Distrito Nacional', 'Región Ozama', 300) }
          ]
        },
        {
          name: 'Santo Domingo',
          interventions: 220,
          districts: [
            { name: 'Santo Domingo Este', interventions: 100, reports: generateMockReports('Santo Domingo Este', 'Santo Domingo', 'Región Ozama', 100) },
            { name: 'Santo Domingo Oeste', interventions: 80, reports: generateMockReports('Santo Domingo Oeste', 'Santo Domingo', 'Región Ozama', 80) },
            { name: 'Santo Domingo Norte', interventions: 40, reports: generateMockReports('Santo Domingo Norte', 'Santo Domingo', 'Región Ozama', 40) }
          ]
        }
      ]
    },
    {
      name: 'Región Este',
      interventions: 340,
      provinces: [
        {
          name: 'La Altagracia',
          interventions: 200,
          districts: [
            { name: 'Salvaleón de Higüey', interventions: 150, reports: generateMockReports('Salvaleón de Higüey', 'La Altagracia', 'Región Este', 150) },
            { name: 'Punta Cana', interventions: 50, reports: generateMockReports('Punta Cana', 'La Altagracia', 'Región Este', 50) }
          ]
        },
        {
          name: 'La Romana',
          interventions: 140,
          districts: [
            { name: 'La Romana', interventions: 140, reports: generateMockReports('La Romana', 'La Romana', 'Región Este', 140) }
          ]
        }
      ]
    }
  ];

  function generateMockReports(district: string, province: string, region: string, count: number): Report[] {
    const reports: Report[] = [];
    const tiposIntervencion = ['Canales', 'Presas', 'Drenajes', 'Caminos', 'Puentes'];
    const municipios = ['Centro', 'Norte', 'Sur', 'Este', 'Oeste'];
    const sectores = ['Urbano', 'Rural', 'Semi-Urbano'];
    
    for (let i = 1; i <= count; i++) {
      const tipoIntervencion = tiposIntervencion[Math.floor(Math.random() * tiposIntervencion.length)];
      const subTipo = tipoIntervencion === 'Canales' ? ['Limpieza', 'Revestimiento', 'Construcción'][Math.floor(Math.random() * 3)] : '';
      
      // Generar datos métricos según el tipo de intervención
      const metricData: Record<string, string> = {};
      if (tipoIntervencion === 'Canales') {
        metricData.longitud_limpiada = `${(Math.random() * 500 + 100).toFixed(2)}`;
        metricData.ancho_canal = `${(Math.random() * 5 + 2).toFixed(2)}`;
        metricData.profundidad_canal = `${(Math.random() * 3 + 1).toFixed(2)}`;
        metricData.volumen_excavado = `${(Math.random() * 200 + 50).toFixed(2)}`;
      } else if (tipoIntervencion === 'Presas') {
        metricData.altura_presa = `${(Math.random() * 20 + 5).toFixed(2)}`;
        metricData.longitud_cresta = `${(Math.random() * 100 + 20).toFixed(2)}`;
        metricData.capacidad_almacenamiento = `${(Math.random() * 5000 + 1000).toFixed(2)}`;
      } else if (tipoIntervencion === 'Drenajes') {
        metricData.longitud_drenaje = `${(Math.random() * 300 + 50).toFixed(2)}`;
        metricData.diametro_tuberia = `${(Math.random() * 2 + 0.5).toFixed(2)}`;
      } else if (tipoIntervencion === 'Caminos') {
        metricData.longitud_camino = `${(Math.random() * 1000 + 200).toFixed(2)}`;
        metricData.ancho_camino = `${(Math.random() * 8 + 4).toFixed(2)}`;
        metricData.espesor_capa = `${(Math.random() * 0.5 + 0.1).toFixed(2)}`;
      } else if (tipoIntervencion === 'Puentes') {
        metricData.longitud_puente = `${(Math.random() * 50 + 10).toFixed(2)}`;
        metricData.ancho_puente = `${(Math.random() * 10 + 5).toFixed(2)}`;
        metricData.numero_vanos = `${Math.floor(Math.random() * 5) + 1}`;
      }
      
      reports.push({
        id: `${district}-${i}`,
        reportNumber: `RPT-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        createdBy: `Usuario ${Math.floor(Math.random() * 10) + 1}`,
        date: `2025-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
        district,
        province,
        region,
        municipio: municipios[Math.floor(Math.random() * municipios.length)],
        sector: sectores[Math.floor(Math.random() * sectores.length)],
        totalInterventions: Math.floor(Math.random() * 10) + 1,
        tipoIntervencion: tipoIntervencion + (subTipo ? `: ${subTipo}` : ''),
        subTipoCanal: subTipo || undefined,
        metricData,
        gpsData: {
          punto_inicial: { 
            lat: 18.5 + Math.random() * 0.5, 
            lon: -69.9 + Math.random() * 0.5 
          },
          punto_alcanzado: { 
            lat: 18.5 + Math.random() * 0.5, 
            lon: -69.9 + Math.random() * 0.5 
          }
        },
        images: Math.random() > 0.5 ? [`data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>`] : undefined,
        observations: Math.random() > 0.5 ? `Observaciones del reporte #${i}` : undefined
      });
    }
    return reports;
  }

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
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="detailed-report-content">
          <div className="hierarchy-list">
            {regionsData.map((region) => (
              <div key={region.name} className="hierarchy-item region-item">
                <div 
                  className="hierarchy-row"
                  onClick={() => toggleRegion(region.name)}
                >
                  <div className="hierarchy-info">
                    <span className="expand-icon">{expandedRegions.has(region.name) ? '▼' : '▶'}</span>
                    <span className="hierarchy-name">🗺️ {region.name}</span>
                  </div>
                  <div className="progress-bar-container">
                    <div 
                      className="progress-bar"
                      style={{ width: `${getProgressPercentage(region.interventions, maxRegionInterventions)}%` }}
                    >
                      <span className="progress-text">{region.interventions}</span>
                    </div>
                  </div>
                </div>

                {expandedRegions.has(region.name) && (
                  <div className="hierarchy-children">
                    {region.provinces.map((province) => (
                      <div key={province.name} className="hierarchy-item province-item">
                        <div 
                          className="hierarchy-row"
                          onClick={(e) => toggleProvince(province.name, e)}
                        >
                          <div className="hierarchy-info">
                            <span className="expand-icon">{expandedProvinces.has(province.name) ? '▼' : '▶'}</span>
                            <span className="hierarchy-name">📍 {province.name}</span>
                          </div>
                          <div className="progress-bar-container">
                            <div 
                              className="progress-bar province-bar"
                              style={{ width: `${getProgressPercentage(province.interventions, getMaxProvinceInterventions(region.name))}%` }}
                            >
                              <span className="progress-text">{province.interventions}</span>
                            </div>
                          </div>
                        </div>

                        {expandedProvinces.has(province.name) && (
                          <div className="hierarchy-children">
                            {province.districts.map((district) => (
                              <div key={district.name} className="hierarchy-item district-item">
                                <div 
                                  className="hierarchy-row"
                                  onClick={(e) => toggleDistrict(district.name, e)}
                                >
                                  <div className="hierarchy-info">
                                    <span className="expand-icon">{expandedDistricts.has(district.name) ? '▼' : '▶'}</span>
                                    <span className="hierarchy-name">🏘️ {district.name}</span>
                                  </div>
                                  <div className="progress-bar-container">
                                    <div 
                                      className="progress-bar district-bar"
                                      style={{ width: `${getProgressPercentage(district.interventions, getMaxDistrictInterventions(region.name, province.name))}%` }}
                                    >
                                      <span className="progress-text">{district.interventions}</span>
                                    </div>
                                  </div>
                                </div>

                                {expandedDistricts.has(district.name) && (
                                  <div className="reports-list">
                                    <div className="reports-list-header">
                                      <span>📋 Reportes de {district.name}</span>
                                    </div>
                                    {district.reports.map((report) => (
                                      <div 
                                        key={report.id}
                                        className="report-item"
                                        onClick={(e) => viewReport(report, e)}
                                      >
                                        <div className="report-info">
                                          <span className="report-number">#{report.reportNumber}</span>
                                          <span className="report-creator">👤 {report.createdBy}</span>
                                          <span className="report-date">📅 {report.date}</span>
                                        </div>
                                        <div className="report-arrow">→</div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
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
