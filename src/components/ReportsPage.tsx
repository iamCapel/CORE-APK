import React, { useState, useEffect } from 'react';
import { reportStorage } from '../services/reportStorage';
import { pendingReportStorage } from '../services/pendingReportStorage';
import firebaseReportStorage from '../services/firebaseReportStorage';
import PendingReportsModal from './PendingReportsModal';
import DetailedReportView from './DetailedReportView';
import './ReportsPage.css';

interface User {
  username: string;
  name: string;
  role?: string;
}

interface ReportsPageProps {
  user: User;
  onBack: () => void;
  onEditReport?: (reportId: string) => void;
  initialView?: PageView;
}

type PageView = 'estadisticas' | 'detallado' | 'lista' | 'exportar' | 'vehiculos';
type StatsMode = 'intervenciones' | 'kilometraje';

interface RegionData {
  id: number;
  name: string;
  icon: string;
  color: string;
  total: number;
  completados: number;
  pendientes: number;
  enProgreso: number;
  kilometraje: number;
  provincias: ProvinciaData[];
}

interface MunicipioData {
  nombre: string;
  total: number;
  kilometraje: number;
  completados: number;
  pendientes: number;
  enProgreso: number;
}

interface ProvinciaData {
  nombre: string;
  total: number;
  kilometraje: number;
  completados: number;
  pendientes: number;
  enProgreso: number;
  municipios: MunicipioData[];
  expanded?: boolean;
}

// Regiones de República Dominicana
const REGIONES_BASE = [
  { id: 1, name: 'Ozama o Metropolitana', icon: '🏛️', color: '#FF6B6B' },
  { id: 2, name: 'Cibao Norte', icon: '🌆', color: '#4ECDC4' },
  { id: 3, name: 'Cibao Sur', icon: '🌊', color: '#45B7D1' },
  { id: 4, name: 'Cibao Nordeste', icon: '🌾', color: '#96CEB4' },
  { id: 5, name: 'Cibao Noroeste', icon: '🏪', color: '#FFEAA7' },
  { id: 6, name: 'Valdesia', icon: '✈️', color: '#DFE6E9' },
  { id: 7, name: 'Enriquillo', icon: '🏖️', color: '#74B9FF' },
  { id: 8, name: 'El Valle', icon: '🏞️', color: '#A29BFE' },
  { id: 9, name: 'Yuma', icon: '🌴', color: '#FD79A8' },
  { id: 10, name: 'Higuamo', icon: '🌿', color: '#00B894' },
  { id: 11, name: 'Región Enriquillo', icon: '⛰️', color: '#FDCB6E' }
];

// Función para calcular distancia GPS (Haversine)
function calcularDistanciaKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Componente Vista de Vehículos
const VehiculosView: React.FC = () => {
  const [vehiculos, setVehiculos] = useState<any[]>([]);
  const [vehiculosFiltrados, setVehiculosFiltrados] = useState<any[]>([]);
  const [searchFicha, setSearchFicha] = useState('');
  const [viewMode, setViewMode] = useState<'actualidad' | 'buscar'>('actualidad');
  const [selectedVehiculo, setSelectedVehiculo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarVehiculos();
    const interval = setInterval(cargarVehiculos, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (viewMode === 'buscar' && searchFicha.trim()) {
      const filtrados = vehiculos.filter(v => 
        v.ficha.toLowerCase().includes(searchFicha.toLowerCase()) ||
        v.modelo.toLowerCase().includes(searchFicha.toLowerCase()) ||
        v.tipo.toLowerCase().includes(searchFicha.toLowerCase())
      );
      setVehiculosFiltrados(filtrados);
    } else {
      // En modo "actualidad" o sin búsqueda, mostrar todos los vehículos
      setVehiculosFiltrados(vehiculos);
    }
  }, [searchFicha, vehiculos, viewMode]);

  const cargarVehiculos = async () => {
    setLoading(true);
    try {
      const reportes = await firebaseReportStorage.getAllReports();
      console.log('📊 Total de reportes cargados:', reportes.length);
      
      // Agrupar vehículos por ficha
      const vehiculosPorFicha: Record<string, any> = {};
      
      reportes.forEach(reporte => {
        if (reporte.vehiculos && Array.isArray(reporte.vehiculos) && reporte.vehiculos.length > 0) {
          console.log(`📋 Reporte ${reporte.numeroReporte} tiene ${reporte.vehiculos.length} vehículos:`, reporte.vehiculos);
          reporte.vehiculos.forEach((vehiculo: any) => {
            // Verificar que el vehículo tenga todos los campos necesarios
            if (!vehiculo.ficha || !vehiculo.tipo || !vehiculo.modelo) {
              console.warn(`⚠️ Vehículo incompleto en reporte ${reporte.numeroReporte}:`, vehiculo);
              return; // Saltar este vehículo
            }
            
            const ficha = vehiculo.ficha.trim();
            
            if (!vehiculosPorFicha[ficha]) {
              vehiculosPorFicha[ficha] = {
                ficha: vehiculo.ficha,
                tipo: vehiculo.tipo,
                modelo: vehiculo.modelo,
                ultimaObra: {
                  fecha: reporte.fechaCreacion,
                  numeroReporte: reporte.numeroReporte,
                  region: reporte.region,
                  provincia: reporte.provincia,
                  municipio: reporte.municipio,
                  sector: reporte.sector,
                  tipoIntervencion: reporte.tipoIntervencion
                },
                totalObras: 1,
                obras: [reporte]
              };
            } else {
              vehiculosPorFicha[ficha].totalObras++;
              vehiculosPorFicha[ficha].obras.push(reporte);
              
              // Actualizar última obra si es más reciente
              if (new Date(reporte.fechaCreacion) > new Date(vehiculosPorFicha[ficha].ultimaObra.fecha)) {
                vehiculosPorFicha[ficha].ultimaObra = {
                  fecha: reporte.fechaCreacion,
                  numeroReporte: reporte.numeroReporte,
                  region: reporte.region,
                  provincia: reporte.provincia,
                  municipio: reporte.municipio,
                  sector: reporte.sector,
                  tipoIntervencion: reporte.tipoIntervencion
                };
              }
            }
          });
        }
      });
      
      const listaVehiculos = Object.values(vehiculosPorFicha).sort((a, b) => 
        new Date(b.ultimaObra.fecha).getTime() - new Date(a.ultimaObra.fecha).getTime()
      );
      
      console.log('🚜 Total de vehículos únicos procesados:', listaVehiculos.length);
      console.log('🚜 Lista de vehículos:', listaVehiculos);
      
      setVehiculos(listaVehiculos);
      setVehiculosFiltrados(listaVehiculos);
    } catch (error) {
      console.error('Error cargando vehículos:', error);
    }
    setLoading(false);
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="vehiculos-container">
      <div className="vehiculos-header">
        <h2 className="vehiculos-title">🚜 Gestión de Vehículos Pesados</h2>
        <p className="vehiculos-subtitle">
          {vehiculos.length} vehículos registrados en el sistema
        </p>
      </div>

      <div className="vehiculos-controls">
        <div className="vehiculos-mode-selector">
          <button
            className={`mode-btn ${viewMode === 'actualidad' ? 'active' : ''}`}
            onClick={() => {
              setViewMode('actualidad');
              setSearchFicha(''); // Limpiar búsqueda al cambiar a actualidad
            }}
          >
            📍 Actualidad
          </button>
          <button
            className={`mode-btn ${viewMode === 'buscar' ? 'active' : ''}`}
            onClick={() => setViewMode('buscar')}
          >
            🔍 Buscar
          </button>
        </div>

        {viewMode === 'buscar' && (
          <div className="vehiculos-search">
            <input
              type="text"
              placeholder="Buscar por ficha, modelo o tipo..."
              value={searchFicha}
              onChange={(e) => setSearchFicha(e.target.value)}
              className="search-input"
            />
          </div>
        )}
      </div>

      {loading ? (
        <div className="vehiculos-loading">
          <div className="loading-spinner"></div>
          <p>Cargando vehículos...</p>
        </div>
      ) : (
        <div className="vehiculos-grid">
          {vehiculosFiltrados.map((vehiculo) => (
            <div 
              key={vehiculo.ficha} 
              className={`vehiculo-card ${selectedVehiculo === vehiculo.ficha ? 'expanded' : ''}`}
            >
              <div 
                className="vehiculo-header"
                onClick={() => setSelectedVehiculo(
                  selectedVehiculo === vehiculo.ficha ? null : vehiculo.ficha
                )}
              >
                <div className="vehiculo-icon">🚜</div>
                <div className="vehiculo-info">
                  <h3 className="vehiculo-tipo">{vehiculo.tipo}</h3>
                  <p className="vehiculo-modelo">{vehiculo.modelo}</p>
                  <p className="vehiculo-ficha">Ficha: <strong>{vehiculo.ficha}</strong></p>
                </div>
                <div className="vehiculo-stats">
                  <div className="stat-badge">
                    <span className="stat-value">{vehiculo.totalObras}</span>
                    <span className="stat-label">Obras</span>
                  </div>
                </div>
              </div>

              <div className="vehiculo-ultima-obra">
                <div className="ultima-obra-header">
                  <span className="obra-badge">📍 Última Posición</span>
                  <span className="obra-fecha">{formatearFecha(vehiculo.ultimaObra.fecha)}</span>
                </div>
                <div className="ultima-obra-details">
                  <p><strong>Reporte:</strong> {vehiculo.ultimaObra.numeroReporte}</p>
                  <p><strong>Región:</strong> {vehiculo.ultimaObra.region}</p>
                  <p><strong>Provincia:</strong> {vehiculo.ultimaObra.provincia}</p>
                  <p><strong>Municipio:</strong> {vehiculo.ultimaObra.municipio}</p>
                  <p><strong>Sector:</strong> {vehiculo.ultimaObra.sector}</p>
                  <p><strong>Intervención:</strong> {vehiculo.ultimaObra.tipoIntervencion}</p>
                </div>
              </div>

              {selectedVehiculo === vehiculo.ficha && (
                <div className="vehiculo-obras-historial">
                  <h4 className="historial-title">📋 Historial de Obras ({vehiculo.obras.length})</h4>
                  <div className="obras-lista">
                    {vehiculo.obras
                      .sort((a: any, b: any) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime())
                      .map((obra: any, index: number) => (
                        <div key={`${obra.id}-${index}`} className="obra-item">
                          <div className="obra-item-header">
                            <span className="obra-numero">{obra.numeroReporte}</span>
                            <span className="obra-fecha-small">{formatearFecha(obra.fechaCreacion)}</span>
                          </div>
                          <div className="obra-item-body">
                            <p>📍 {obra.provincia} › {obra.municipio} › {obra.sector}</p>
                            <p>🔧 {obra.tipoIntervencion}</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!loading && vehiculosFiltrados.length === 0 && (
        <div className="vehiculos-empty">
          <div className="empty-icon">🚜</div>
          <h3>No se encontraron vehículos</h3>
          <p>
            {searchFicha ? 
              'No hay vehículos que coincidan con tu búsqueda' : 
              'No hay vehículos registrados en el sistema'}
          </p>
        </div>
      )}
    </div>
  );
};

const ReportsPage: React.FC<ReportsPageProps> = ({ user, onBack, onEditReport, initialView }) => {
  const [currentView, setCurrentView] = useState<PageView>(initialView || 'estadisticas');
  const [statsMode, setStatsMode] = useState<StatsMode>('intervenciones');
  const [selectedRegion, setSelectedRegion] = useState<number | null>(null);
  // si arrancamos ya en lista ocultamos el selector de vista
  const showSelector = initialView !== 'lista';
  const [regionesData, setRegionesData] = useState<RegionData[]>([]);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [expandedProvincias, setExpandedProvincias] = useState<Set<string>>(new Set());
  // datos para la nueva vista de lista de reportes
  const [reportsList, setReportsList] = useState<any[]>([]);
  const [filteredReports, setFilteredReports] = useState<any[]>([]);
  const [listSearch, setListSearch] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');
  
  // Estados para el sistema de exportación
  const [exportSelectedRegion, setExportSelectedRegion] = useState<RegionData | null>(null);
  const [exportSelectedProvincia, setExportSelectedProvincia] = useState<ProvinciaData | null>(null);
  const [showDateRangeModal, setShowDateRangeModal] = useState(false);
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');
  const [exportType, setExportType] = useState<'region' | 'provincia' | 'municipio'>('region');

  useEffect(() => {
    cargarDatosRegiones();
    const interval = setInterval(cargarDatosRegiones, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // cargar reportes desde Firebase al entrar en la vista "lista"
  useEffect(() => {
    if (currentView === 'lista') {
      firebaseReportStorage.getAllReports()
        .then(reps => {
          let userReports = reps;
          if (user?.role === 'Técnico' || user?.role === 'tecnico') {
            userReports = reps.filter(r => r.creadoPor === user.username);
          }
          setReportsList(userReports);
          setFilteredReports(userReports);
        })
        .catch(err => console.error('Error cargando lista de reportes:', err));
    }
  }, [currentView, user]);

  // aplicación de filtros y búsqueda sobre la lista
  useEffect(() => {
    let result = reportsList;
    if (tipoFilter) {
      result = result.filter(r => r.tipoIntervencion === tipoFilter);
    }
    if (listSearch.trim()) {
      const q = listSearch.toLowerCase();
      result = result.filter(r =>
        (r.tipoIntervencion || '').toLowerCase().includes(q) ||
        (r.region || '').toLowerCase().includes(q) ||
        (r.provincia || '').toLowerCase().includes(q) ||
        (r.municipio || '').toLowerCase().includes(q) ||
        (r.numeroReporte || '').toLowerCase().includes(q) ||
        (r.fechaCreacion || '').toLowerCase().includes(q)
      );
    }
    setFilteredReports(result);
  }, [reportsList, tipoFilter, listSearch]);

  // Actualizar contador de pendientes
  const updatePendingCount = () => {
    const pendientes = pendingReportStorage.getPendingCount();
    setPendingCount(pendientes);
  };

  const getPendingReports = () => {
    const pendingReports = pendingReportStorage.getAllPendingReports();
    return pendingReports.map(report => ({
      id: report.id,
      reportNumber: `DCR-${report.id.split('_').pop()?.slice(-6) || '000000'}`,
      timestamp: report.timestamp,
      estado: 'pendiente',
      region: report.formData.region || 'N/A',
      provincia: report.formData.provincia || 'N/A',
      municipio: report.formData.municipio || 'N/A',
      tipoIntervencion: report.formData.tipoIntervencion || 'No especificado'
    }));
  };

  const handleContinuePendingReport = (reportId: string) => {
    alert('Función de continuar reporte desde ReportsPage - redirigir a formulario');
    setShowPendingModal(false);
  };

  const handleCancelPendingReport = (reportId: string) => {
    pendingReportStorage.deletePendingReport(reportId);
    updatePendingCount();
    setShowPendingModal(false);
    setTimeout(() => setShowPendingModal(true), 100);
  };

  useEffect(() => {
    updatePendingCount();
    const interval = setInterval(updatePendingCount, 2000);
    return () => clearInterval(interval);
  }, []);

  const cargarDatosRegiones = async () => {
    let allReports: any[] = [];
    let stats: any = { porRegion: {} };
    
    try {
      // Obtener reportes de Firebase
      allReports = await firebaseReportStorage.getAllReports();
      
      // Filtrar reportes para usuarios técnicos - solo ven sus propios reportes
      if (user?.role === 'Técnico' || user?.role === 'tecnico') {
        allReports = allReports.filter(report => report.creadoPor === user.username);
      }
    } catch (error) {
      console.error('Error cargando reportes de Firebase:', error);
      // Fallback a localStorage si falla Firebase
      stats = reportStorage.getStatistics();
      allReports = reportStorage.getAllReports();
      
      // Filtrar reportes para usuarios técnicos - solo ven sus propios reportes
      if (user?.role === 'Técnico' || user?.role === 'tecnico') {
        allReports = allReports.filter(report => report.creadoPor === user.username);
      }
    }

    const regiones = REGIONES_BASE.map(region => {
      const regionKey = region.name.toLowerCase();
      const regionStats = stats.porRegion[regionKey] || { 
        total: 0, 
        completados: 0, 
        pendientes: 0, 
        enProgreso: 0 
      };

      // Obtener reportes de la región
      const reportesRegion = allReports.filter(r => r.region?.toLowerCase() === regionKey);
      
      // Calcular kilometraje total de la región
      const kmTotal = reportesRegion.reduce((sum, report) => {
        if (report.gpsData?.start && report.gpsData?.end) {
          const km = calcularDistanciaKm(
            report.gpsData.start.latitude,
            report.gpsData.start.longitude,
            report.gpsData.end.latitude,
            report.gpsData.end.longitude
          );
          return sum + km;
        }
        return sum;
      }, 0);

      // Agrupar por provincia y luego por municipio
      const provinciaMap = new Map<string, {
        total: number;
        completados: number;
        pendientes: number;
        enProgreso: number;
        kilometraje: number;
        municipios: Map<string, {
          total: number;
          completados: number;
          pendientes: number;
          enProgreso: number;
          kilometraje: number;
        }>;
      }>();

      reportesRegion.forEach(report => {
        const provincia = report.provincia || 'Sin Provincia';
        const municipio = report.municipio || report.distrito || 'Sin Municipio';
        
        // Obtener o crear entrada de provincia
        const currentProv = provinciaMap.get(provincia) || {
          total: 0,
          completados: 0,
          pendientes: 0,
          enProgreso: 0,
          kilometraje: 0,
          municipios: new Map()
        };

        // Obtener o crear entrada de municipio
        const currentMun = currentProv.municipios.get(municipio) || {
          total: 0,
          completados: 0,
          pendientes: 0,
          enProgreso: 0,
          kilometraje: 0
        };

        // Actualizar contadores de provincia y municipio
        // Los reportes con estado 'pendiente' NO se incluyen en estadísticas
        if (report.estado === 'completado' || report.estado === 'aprobado') {
          currentProv.total++;
          currentProv.completados++;
          currentMun.total++;
          currentMun.completados++;
          
          // Calcular kilometraje solo para reportes completados/aprobados
          if (report.gpsData?.start && report.gpsData?.end) {
            const km = calcularDistanciaKm(
              report.gpsData.start.latitude,
              report.gpsData.start.longitude,
              report.gpsData.end.latitude,
              report.gpsData.end.longitude
            );
            currentProv.kilometraje += km;
            currentMun.kilometraje += km;
          }
        } else if (report.estado === 'en progreso') {
          currentProv.total++;
          currentProv.enProgreso++;
          currentMun.total++;
          currentMun.enProgreso++;
          
          // Calcular kilometraje también para reportes en progreso
          if (report.gpsData?.start && report.gpsData?.end) {
            const km = calcularDistanciaKm(
              report.gpsData.start.latitude,
              report.gpsData.start.longitude,
              report.gpsData.end.latitude,
              report.gpsData.end.longitude
            );
            currentProv.kilometraje += km;
            currentMun.kilometraje += km;
          }
        }
        // Los reportes 'pendiente' se ignoran completamente en estadísticas

        currentProv.municipios.set(municipio, currentMun);
        provinciaMap.set(provincia, currentProv);
      });

      // Convertir mapa a array
      const provincias: ProvinciaData[] = Array.from(provinciaMap.entries()).map(([nombre, data]) => {
        // Convertir municipios a array
        const municipios: MunicipioData[] = Array.from(data.municipios.entries()).map(([nomMun, munData]) => ({
          nombre: nomMun,
          total: munData.total,
          kilometraje: munData.kilometraje,
          completados: munData.completados,
          pendientes: munData.pendientes,
          enProgreso: munData.enProgreso
        }));

        // Ordenar municipios por total descendente
        municipios.sort((a, b) => b.total - a.total);

        return {
          nombre,
          total: data.total,
          kilometraje: data.kilometraje,
          completados: data.completados,
          pendientes: data.pendientes,
          enProgreso: data.enProgreso,
          municipios,
          expanded: false
        };
      });

      // Ordenar provincias por total descendente
      provincias.sort((a, b) => b.total - a.total);

      return {
        ...region,
        total: regionStats.total,
        completados: regionStats.completados,
        pendientes: regionStats.pendientes,
        enProgreso: regionStats.enProgreso,
        kilometraje: kmTotal,
        provincias
      };
    });

    setRegionesData(regiones);
  };

  const toggleProvinciaExpansion = (regionId: number, provinciaNombre: string) => {
    const key = `${regionId}-${provinciaNombre}`;
    setExpandedProvincias(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  // Funciones de exportación
  const handleExportRegion = (region: RegionData) => {
    setExportSelectedRegion(region);
    setExportSelectedProvincia(null);
    setExportType('region');
    setShowDateRangeModal(true);
  };

  const handleExportProvincia = (region: RegionData, provincia: ProvinciaData) => {
    setExportSelectedRegion(region);
    setExportSelectedProvincia(provincia);
    setExportType('provincia');
    setShowDateRangeModal(true);
  };

  const handleExportMunicipio = (region: RegionData, provincia: ProvinciaData, municipio: MunicipioData) => {
    setExportSelectedRegion(region);
    setExportSelectedProvincia(provincia);
    setExportType('municipio');
    // Para municipio exportamos directamente sin rango de fechas
    exportarMunicipioDetalle(region, provincia, municipio);
  };

  const confirmarExportacion = async () => {
    if (!exportStartDate || !exportEndDate) {
      alert('Por favor seleccione un rango de fechas válido');
      return;
    }

    if (exportType === 'region' && exportSelectedRegion) {
      await exportarRegionConFechas(exportSelectedRegion, exportStartDate, exportEndDate);
    } else if (exportType === 'provincia' && exportSelectedRegion && exportSelectedProvincia) {
      await exportarProvinciaDetalle(exportSelectedRegion, exportSelectedProvincia, exportStartDate, exportEndDate);
    }

    setShowDateRangeModal(false);
    setExportStartDate('');
    setExportEndDate('');
  };

  const exportarRegionConFechas = async (region: RegionData, fechaInicio: string, fechaFin: string) => {
    try {
      const reportes = await firebaseReportStorage.getAllReports();
      const reportesFiltrados = reportes.filter(r => {
        const fechaReporte = new Date(r.fechaCreacion);
        const inicio = new Date(fechaInicio);
        const fin = new Date(fechaFin);
        return r.region === region.name && fechaReporte >= inicio && fechaReporte <= fin;
      });

      const contenido = `
INFORME DE REGIÓN: ${region.name}
Período: ${new Date(fechaInicio).toLocaleDateString('es-ES')} - ${new Date(fechaFin).toLocaleDateString('es-ES')}
==================================================

RESUMEN GENERAL
- Total de Intervenciones: ${region.total}
- Completadas: ${region.completados}
- En Progreso: ${region.enProgreso}
- Pendientes: ${region.pendientes}
- Kilometraje Total: ${region.kilometraje.toFixed(2)} km

PROVINCIAS DE LA REGIÓN:
${region.provincias.map(p => `
  ${p.nombre}:
  - Intervenciones: ${p.total}
  - Completadas: ${p.completados}
  - En Progreso: ${p.enProgreso}
  - Pendientes: ${p.pendientes}
  - Kilometraje: ${p.kilometraje.toFixed(2)} km
  
  Municipios:
${p.municipios.map(m => `    • ${m.nombre}: ${m.total} intervenciones (${m.kilometraje.toFixed(2)} km)`).join('\n')}
`).join('\n')}

REPORTES DETALLADOS (${reportesFiltrados.length}):
${reportesFiltrados.map((r, i) => {
  let kmReporte = 'N/A';
  if (r.gpsData?.start && r.gpsData?.end) {
    const km = calcularDistanciaKm(
      r.gpsData.start.latitude,
      r.gpsData.start.longitude,
      r.gpsData.end.latitude,
      r.gpsData.end.longitude
    );
    kmReporte = km.toFixed(2);
  }
  
  return `
${i + 1}. Reporte #${r.numeroReporte}
   Fecha: ${new Date(r.fechaCreacion).toLocaleDateString('es-ES')}
   Tipo: ${r.tipoIntervencion}
   Ubicación: ${r.provincia}, ${r.municipio}
   Creado por: ${r.creadoPor}
   Estado: ${r.estado || 'N/A'}
   Kilometraje: ${kmReporte} km
`;
}).join('\n')}
      `.trim();

      const blob = new Blob([contenido], { type: 'text/plain;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `Informe_${region.name}_${fechaInicio}_${fechaFin}.txt`;
      link.click();
      
      alert(`Informe de ${region.name} exportado exitosamente`);
    } catch (error) {
      console.error('Error al exportar región:', error);
      alert('Error al exportar el informe');
    }
  };

  const exportarProvinciaDetalle = async (region: RegionData, provincia: ProvinciaData, fechaInicio: string, fechaFin: string) => {
    try {
      const reportes = await firebaseReportStorage.getAllReports();
      const reportesFiltrados = reportes.filter(r => {
        const fechaReporte = new Date(r.fechaCreacion);
        const inicio = new Date(fechaInicio);
        const fin = new Date(fechaFin);
        return r.provincia === provincia.nombre && fechaReporte >= inicio && fechaReporte <= fin;
      });

      const contenido = `
INFORME DETALLADO DE PROVINCIA: ${provincia.nombre}
Región: ${region.name}
Período: ${new Date(fechaInicio).toLocaleDateString('es-ES')} - ${new Date(fechaFin).toLocaleDateString('es-ES')}
==================================================

RESUMEN DE LA PROVINCIA
- Total de Intervenciones: ${provincia.total}
- Completadas: ${provincia.completados}
- En Progreso: ${provincia.enProgreso}
- Pendientes: ${provincia.pendientes}
- Kilometraje Total: ${provincia.kilometraje.toFixed(2)} km

MUNICIPIOS Y SECTORES TRABAJADOS:
${provincia.municipios.map(m => `
  MUNICIPIO: ${m.nombre}
  - Intervenciones: ${m.total}
  - Completadas: ${m.completados}
  - En Progreso: ${m.enProgreso}
  - Pendientes: ${m.pendientes}
  - Kilometraje: ${m.kilometraje.toFixed(2)} km
  
  Sectores trabajados:
${reportesFiltrados
  .filter(r => r.municipio === m.nombre)
  .map(r => `    • ${r.sector || 'N/A'} - ${r.tipoIntervencion}`)
  .filter((v, i, a) => a.indexOf(v) === i)
  .join('\n')}
`).join('\n')}

DATOS DETALLADOS DE REPORTES (${reportesFiltrados.length}):
${reportesFiltrados.map((r, i) => {
  let kmReporte = 'N/A';
  if (r.gpsData?.start && r.gpsData?.end) {
    const km = calcularDistanciaKm(
      r.gpsData.start.latitude,
      r.gpsData.start.longitude,
      r.gpsData.end.latitude,
      r.gpsData.end.longitude
    );
    kmReporte = km.toFixed(2);
  }
  
  return `
${i + 1}. Reporte #${r.numeroReporte}
   Fecha: ${new Date(r.fechaCreacion).toLocaleDateString('es-ES')}
   Municipio: ${r.municipio}
   Sector: ${r.sector || 'N/A'}
   Distrito: ${r.distrito || 'N/A'}
   Tipo Intervención: ${r.tipoIntervencion}
   Creado por: ${r.creadoPor}
   Estado: ${r.estado || 'N/A'}
   Kilometraje: ${kmReporte} km
   Observaciones: ${r.observaciones || 'Ninguna'}
`;
}).join('\n')}
      `.trim();

      const blob = new Blob([contenido], { type: 'text/plain;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `Informe_Provincia_${provincia.nombre}_${fechaInicio}_${fechaFin}.txt`;
      link.click();
      
      alert(`Informe de ${provincia.nombre} exportado exitosamente`);
    } catch (error) {
      console.error('Error al exportar provincia:', error);
      alert('Error al exportar el informe');
    }
  };

  const exportarMunicipioDetalle = async (region: RegionData, provincia: ProvinciaData, municipio: MunicipioData) => {
    try {
      const reportes = await firebaseReportStorage.getAllReports();
      const reportesMunicipio = reportes.filter(r => r.municipio === municipio.nombre);

      const contenido = `
INFORME DETALLADO DE MUNICIPIO: ${municipio.nombre}
Provincia: ${provincia.nombre}
Región: ${region.name}
==================================================

RESUMEN DEL MUNICIPIO
- Total de Intervenciones: ${municipio.total}
- Completadas: ${municipio.completados}
- En Progreso: ${municipio.enProgreso}
- Pendientes: ${municipio.pendientes}
- Kilometraje Total: ${municipio.kilometraje.toFixed(2)} km

TIPOS DE INTERVENCIÓN REALIZADAS:
${Object.entries(
  reportesMunicipio.reduce((acc, r) => {
    acc[r.tipoIntervencion] = (acc[r.tipoIntervencion] || 0) + 1;
    return acc;
  }, {} as Record<string, number>)
).map(([tipo, cantidad]) => `  • ${tipo}: ${cantidad} intervenciones`).join('\n')}

SECTORES INTERVENIDOS:
${Array.from(new Set(reportesMunicipio.map(r => r.sector).filter(Boolean))).map(s => `  • ${s}`).join('\n')}

DISTRITOS TRABAJADOS:
${Array.from(new Set(reportesMunicipio.map(r => r.distrito).filter(Boolean))).map(d => `  • ${d}`).join('\n')}

LISTA COMPLETA DE INTERVENCIONES (${reportesMunicipio.length}):
${reportesMunicipio.map((r, i) => {
  let kmReporte = 'N/A';
  if (r.gpsData?.start && r.gpsData?.end) {
    const km = calcularDistanciaKm(
      r.gpsData.start.latitude,
      r.gpsData.start.longitude,
      r.gpsData.end.latitude,
      r.gpsData.end.longitude
    );
    kmReporte = km.toFixed(2);
  }
  
  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INTERVENCIÓN #${i + 1}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Número de Reporte: ${r.numeroReporte}
Fecha: ${new Date(r.fechaCreacion).toLocaleDateString('es-ES')}
Tipo de Intervención: ${r.tipoIntervencion}
Ubicación Específica:
  - Sector: ${r.sector || 'N/A'}
  - Distrito: ${r.distrito || 'N/A'}
Responsable: ${r.creadoPor}
Estado: ${r.estado || 'N/A'}
Kilometraje: ${kmReporte} km

Datos Métricos:
${Object.entries(r.metricData || {}).map(([key, value]) => `  - ${key}: ${value}`).join('\n')}

Coordenadas GPS:
${r.gpsData ? `
  Punto Inicial: ${r.gpsData.punto_inicial ? `Lat ${r.gpsData.punto_inicial.lat}, Lon ${r.gpsData.punto_inicial.lon}` : 'N/A'}
  Punto Alcanzado: ${r.gpsData.punto_alcanzado ? `Lat ${r.gpsData.punto_alcanzado.lat}, Lon ${r.gpsData.punto_alcanzado.lon}` : 'N/A'}
` : '  No disponible'}

Observaciones: ${r.observaciones || 'Ninguna'}
`;
}).join('\n')}
      `.trim();

      const blob = new Blob([contenido], { type: 'text/plain;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `Informe_Municipio_${municipio.nombre}_${new Date().toISOString().split('T')[0]}.txt`;
      link.click();
      
      alert(`Informe detallado de ${municipio.nombre} exportado exitosamente`);
    } catch (error) {
      console.error('Error al exportar municipio:', error);
      alert('Error al exportar el informe');
    }
  };

  return (
    <div className="reports-page">
      <div className="reports-container">
        {/* Topbar Reconstruido */}
        <div className="reports-topbar-modern">
          <div className="topbar-left-section">
            <button className="topbar-back-btn-modern" onClick={onBack}>
              <span className="back-arrow">←</span>
              <span className="back-text">Dashboard</span>
            </button>
            <div className="topbar-divider"></div>
            <div className="topbar-title-section">
              <h1 className="topbar-main-title">Informes y Estadísticas</h1>
              <p className="topbar-subtitle">Análisis de intervenciones por región</p>
            </div>
          </div>
          
          <div className="topbar-right-section">
            {/* Icono de notificaciones */}
            <div className="notification-container" style={{ position: 'relative', marginRight: '16px' }}>
              <img 
                src="/images/notification-bell-icon.svg" 
                alt="Notificaciones" 
                className="notification-icon"
                style={{
                  width: '24px', 
                  height: '24px',
                  filter: 'drop-shadow(0 2px 4px rgba(255, 152, 0, 0.4))',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  animation: pendingCount > 0 ? 'bellShake 0.5s ease-in-out infinite alternate' : 'none'
                }}
                onClick={() => setShowPendingModal(true)}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'scale(1.1)';
                  e.currentTarget.style.filter = 'drop-shadow(0 3px 6px rgba(255, 152, 0, 0.6))';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.filter = 'drop-shadow(0 2px 4px rgba(255, 152, 0, 0.4))';
                }}
              />
              {pendingCount > 0 && (
                <span 
                  style={{
                    position: 'absolute',
                    top: '-6px',
                    right: '-6px',
                    backgroundColor: '#e74c3c',
                    color: 'white',
                    borderRadius: '50%',
                    width: '18px',
                    height: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    border: '2px solid white',
                    animation: 'badgeGlow 2s infinite'
                  }}
                >
                  {pendingCount > 99 ? '99+' : pendingCount}
                </span>
              )}
            </div>

            <div className="view-selector-topbar">
              <button 
                className={`view-btn-topbar ${currentView === 'estadisticas' ? 'active' : ''}`}
                onClick={() => setCurrentView('estadisticas')}
              >
                <span className="view-icon">📊</span>
                <span className="view-label">Estadísticas</span>
              </button>
              <button 
                className={`view-btn-topbar ${currentView === 'detallado' ? 'active' : ''}`}
                onClick={() => setCurrentView('detallado')}
              >
                <span className="view-icon">📄</span>
                <span className="view-label">Informe Detallado</span>
              </button>
              <button 
                className={`view-btn-topbar ${currentView === 'vehiculos' ? 'active' : ''}`}
                onClick={() => setCurrentView('vehiculos')}
              >
                <span className="view-icon">🚜</span>
                <span className="view-label">Vehículos Pesados</span>
              </button>
              <button 
                className={`view-btn-topbar ${currentView === 'exportar' ? 'active' : ''}`}
                onClick={() => setCurrentView('exportar')}
              >
                <span className="view-icon">📥</span>
                <span className="view-label">Exportar Informe</span>
              </button>
              <button
                className={`view-btn-topbar ${currentView === 'lista' ? 'active' : ''}`}
                onClick={() => setCurrentView('lista')}
              >
                <span className="view-icon">📁</span>
                <span className="view-label">Listado</span>
              </button>
            </div>
          </div>
        </div>
        
        <div className="reports-content">
          {currentView === 'estadisticas' && showSelector && (
            <div className="view-content">
              <div className="stats-header-section">
                <div className="stats-header-left">
                  <div>
                    <h2 className="stats-title">Regiones de República Dominicana</h2>
                    <p className="stats-subtitle">Selecciona una región para ver sus estadísticas detalladas</p>
                  </div>
                </div>
                
                {/* Selector de modo compacto */}
                <div className="stats-mode-selector-compact">
                  <button
                    className={`mode-compact-btn ${statsMode === 'intervenciones' ? 'active' : ''}`}
                    onClick={() => setStatsMode('intervenciones')}
                    title="Ver intervenciones"
                  >
                    📋 Intervenciones
                  </button>
                  <button
                    className={`mode-compact-btn ${statsMode === 'kilometraje' ? 'active' : ''}`}
                    onClick={() => setStatsMode('kilometraje')}
                    title="Ver kilometraje"
                  >
                    📏 Kilometraje
                  </button>
                </div>
              </div>

              <div className="regions-grid">
                {regionesData.map((region) => (
                  <div 
                    key={region.id}
                    className={`region-card ${selectedRegion === region.id ? 'selected' : ''}`}
                    onClick={() => setSelectedRegion(region.id)}
                    style={{ 
                      '--region-color': region.color,
                      borderLeftColor: region.color 
                    } as React.CSSProperties}
                  >
                    <div className="region-icon">{region.icon}</div>
                    <div className="region-info">
                      <h3 className="region-name">{region.name}</h3>
                      
                      {statsMode === 'intervenciones' ? (
                        <div className="region-stats">
                          <div className="stat-item">
                            <span className="stat-label">Total</span>
                            <span className="stat-value">{region.total}</span>
                          </div>
                          <div className="stat-item">
                            <span className="stat-label">Completados</span>
                            <span className="stat-value" style={{ color: '#00C49F' }}>
                              {region.completados}
                            </span>
                          </div>
                          <div className="stat-item">
                            <span className="stat-label">Pendientes</span>
                            <span className="stat-value" style={{ color: '#FFBB28' }}>
                              {region.pendientes}
                            </span>
                          </div>
                          <div className="stat-item">
                            <span className="stat-label">En Progreso</span>
                            <span className="stat-value" style={{ color: '#FF8042' }}>
                              {region.enProgreso}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="region-stats">
                          <div className="stat-item-km">
                            <span className="stat-label">Kilometraje Total</span>
                            <span className="stat-value-lg">{region.kilometraje.toFixed(2)} km</span>
                          </div>
                          <div className="stat-item">
                            <span className="stat-label">Reportes</span>
                            <span className="stat-value">{region.total}</span>
                          </div>
                          <div className="stat-item">
                            <span className="stat-label">Promedio</span>
                            <span className="stat-value">
                              {region.total > 0 ? (region.kilometraje / region.total).toFixed(2) : '0'} km
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="region-arrow">→</div>
                  </div>
                ))}
              </div>

              {selectedRegion && (
                <div className="region-details-panel">
                  <div className="panel-header">
                    <h3>
                      {regionesData.find(r => r.id === selectedRegion)?.icon} {' '}
                      {regionesData.find(r => r.id === selectedRegion)?.name}
                    </h3>
                    <button className="close-btn" onClick={() => setSelectedRegion(null)}>✕</button>
                  </div>
                  <div className="panel-content">
                    {(() => {
                      const region = regionesData.find(r => r.id === selectedRegion);
                      if (!region || region.provincias.length === 0) {
                        return <p className="no-data">No hay provincias registradas en esta región.</p>;
                      }

                      return (
                        <>
                          <div className="provincias-summary">
                            <div className="summary-stat">
                              <span className="summary-label">Total Provincias</span>
                              <span className="summary-value">{region.provincias.length}</span>
                            </div>
                            <div className="summary-stat">
                              <span className="summary-label">Total Intervenciones</span>
                              <span className="summary-value">{region.total}</span>
                            </div>
                            <div className="summary-stat">
                              <span className="summary-label">Kilometraje Total</span>
                              <span className="summary-value">{region.kilometraje.toFixed(2)} km</span>
                            </div>
                          </div>

                          <div className="provincias-list">
                            <h4 className="list-title">Provincias de {region.name}</h4>
                            {region.provincias.map((provincia, index) => {
                              const provinciaKey = `${selectedRegion}-${provincia.nombre}`;
                              const isExpanded = expandedProvincias.has(provinciaKey);
                              
                              return (
                                <div key={provinciaKey} className="provincia-card-expandable">
                                  <div 
                                    className="provincia-card clickable"
                                    onClick={() => toggleProvinciaExpansion(selectedRegion, provincia.nombre)}
                                  >
                                    <div className="provincia-header">
                                      <div className="provincia-header-left">
                                        <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
                                        <h5 className="provincia-nombre">{provincia.nombre}</h5>
                                      </div>
                                      <div className="provincia-badge">{provincia.total} reportes</div>
                                    </div>
                                    <div className="provincia-stats">
                                      <div className="provincia-stat">
                                        <span className="stat-icon">✅</span>
                                        <span className="stat-text">
                                          <strong>{provincia.completados}</strong> Completados
                                        </span>
                                      </div>
                                      <div className="provincia-stat">
                                        <span className="stat-icon">⏳</span>
                                        <span className="stat-text">
                                          <strong>{provincia.pendientes}</strong> Pendientes
                                        </span>
                                      </div>
                                      <div className="provincia-stat">
                                        <span className="stat-icon">🔄</span>
                                        <span className="stat-text">
                                          <strong>{provincia.enProgreso}</strong> En Progreso
                                        </span>
                                      </div>
                                      <div className="provincia-stat highlight">
                                        <span className="stat-icon">📏</span>
                                        <span className="stat-text">
                                          <strong>{provincia.kilometraje.toFixed(2)} km</strong> Recorridos
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Lista de municipios expandible */}
                                  {isExpanded && provincia.municipios.length > 0 && (
                                    <div className="municipios-list">
                                      <div className="municipios-header">
                                        <h6 className="municipios-title">
                                          Municipios/Distritos en {provincia.nombre}
                                        </h6>
                                        <span className="municipios-count">
                                          {provincia.municipios.length} {provincia.municipios.length === 1 ? 'municipio' : 'municipios'}
                                        </span>
                                      </div>
                                      {provincia.municipios.map((municipio, munIndex) => (
                                        <div key={`${provincia.nombre}-${municipio.nombre}`} className="municipio-item">
                                          <div className="municipio-header">
                                            <span className="municipio-icon">📍</span>
                                            <span className="municipio-nombre">{municipio.nombre}</span>
                                            <span className="municipio-total">{municipio.total} {municipio.total === 1 ? 'reporte' : 'reportes'}</span>
                                          </div>
                                          <div className="municipio-stats-grid">
                                            <div className="municipio-stat">
                                              <span className="municipio-stat-label">Completados</span>
                                              <span className="municipio-stat-value completados">{municipio.completados}</span>
                                            </div>
                                            <div className="municipio-stat">
                                              <span className="municipio-stat-label">Pendientes</span>
                                              <span className="municipio-stat-value pendientes">{municipio.pendientes}</span>
                                            </div>
                                            <div className="municipio-stat">
                                              <span className="municipio-stat-label">En Progreso</span>
                                              <span className="municipio-stat-value en-progreso">{municipio.enProgreso}</span>
                                            </div>
                                            <div className="municipio-stat">
                                              <span className="municipio-stat-label">Kilometraje</span>
                                              <span className="municipio-stat-value kilometraje">{municipio.kilometraje.toFixed(2)} km</span>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
          )}
          {currentView === 'lista' && (
            <div className="view-content">
              <div className="lista-controls">
                <input
                  type="text"
                  className="search-input"
                  placeholder="Buscar..." 
                  value={listSearch}
                  onChange={e => setListSearch(e.target.value)}
                />
                <select
                  className="type-filter"
                  value={tipoFilter}
                  onChange={e => setTipoFilter(e.target.value)}
                >
                  <option value="">Todos los tipos</option>
                  {Array.from(new Set(reportsList.map(r => r.tipoIntervencion)))
                    .filter(Boolean)
                    .map(tipo => (
                      <option key={tipo} value={tipo}>{tipo}</option>
                    ))}
                </select>
              </div>
              <div className="report-list-container">
                {filteredReports.map(r => (
                  <div key={r.id} className="report-list-item">
                    <div className="report-main">
                      <span className="report-type">{r.tipoIntervencion}</span>
                      <span className="report-address">
                        {`${r.region || ''} › ${r.provincia || ''} › ${r.municipio || ''} › ${r.sector || ''}`}
                      </span>
                    </div>
                    <div className="report-meta">
                      <span>{r.numeroReporte}</span>
                      <span>{new Date(r.fechaCreacion).toLocaleDateString('es-ES')}</span>
                    </div>
                  </div>
                ))}
                {filteredReports.length === 0 && (
                  <div className="no-data-message">
                    <p>No se encontraron reportes</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {currentView === 'detallado' && (
            <DetailedReportView 
              user={user} 
              onEditReport={(report) => {
                if (onEditReport) {
                  onEditReport(report.id);
                }
              }}
            />
          )}

          {currentView === 'vehiculos' && (
            <VehiculosView />
          )}

          {currentView === 'exportar' && (
            <div className="export-view-container">
              <div className="export-header">
                <h2 className="export-title">📥 Sistema de Exportación de Informes</h2>
                <p className="export-subtitle">Seleccione una región para exportar informes detallados</p>
              </div>

              <div className="export-regions-grid">
                {regionesData.map(region => (
                  <div key={region.id} className="export-region-card">
                    <div className="export-card-header" onClick={() => {
                      if (exportSelectedRegion?.id === region.id) {
                        setExportSelectedRegion(null);
                      } else {
                        setExportSelectedRegion(region);
                        setExportSelectedProvincia(null);
                      }
                    }}>
                      <div className="export-card-icon">{region.icon}</div>
                      <div className="export-card-info">
                        <h3 className="export-card-title">{region.name}</h3>
                        <p className="export-card-stats">
                          {region.total} intervenciones • {region.kilometraje.toFixed(2)} km
                        </p>
                      </div>
                      <button 
                        className="export-card-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExportRegion(region);
                        }}
                        title="Exportar región con rango de fechas"
                      >
                        📄 Exportar
                      </button>
                    </div>

                    {exportSelectedRegion?.id === region.id && (
                      <div className="export-provincias-container">
                        <h4 className="export-section-title">Provincias de {region.name}</h4>
                        <div className="export-provincias-grid">
                          {region.provincias.map(provincia => (
                            <div key={provincia.nombre} className="export-provincia-card">
                              <div className="export-provincia-header" onClick={() => {
                                if (exportSelectedProvincia?.nombre === provincia.nombre) {
                                  setExportSelectedProvincia(null);
                                } else {
                                  setExportSelectedProvincia(provincia);
                                }
                              }}>
                                <div className="export-provincia-info">
                                  <h4 className="export-provincia-name">📍 {provincia.nombre}</h4>
                                  <p className="export-provincia-stats">
                                    {provincia.total} intervenciones • {provincia.kilometraje.toFixed(2)} km
                                  </p>
                                </div>
                                <button 
                                  className="export-provincia-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleExportProvincia(region, provincia);
                                  }}
                                  title="Exportar provincia con lista detallada"
                                >
                                  📋 Exportar
                                </button>
                              </div>

                              {exportSelectedProvincia?.nombre === provincia.nombre && (
                                <div className="export-municipios-container">
                                  <h5 className="export-municipios-title">Municipios de {provincia.nombre}</h5>
                                  <div className="export-municipios-grid">
                                    {provincia.municipios.map(municipio => (
                                      <div key={municipio.nombre} className="export-municipio-card">
                                        <div className="export-municipio-info">
                                          <h5 className="export-municipio-name">🏘️ {municipio.nombre}</h5>
                                          <p className="export-municipio-stats">
                                            {municipio.total} intervenciones
                                          </p>
                                          <p className="export-municipio-km">
                                            {municipio.kilometraje.toFixed(2)} km
                                          </p>
                                        </div>
                                        <button 
                                          className="export-municipio-btn"
                                          onClick={() => handleExportMunicipio(region, provincia, municipio)}
                                          title="Exportar municipio con detalles completos"
                                        >
                                          📥 Exportar
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de selección de rango de fechas */}
      {showDateRangeModal && (
        <div className="date-range-modal-overlay" onClick={() => setShowDateRangeModal(false)}>
          <div className="date-range-modal" onClick={(e) => e.stopPropagation()}>
            <div className="date-range-header">
              <h3>📅 Seleccionar Rango de Fechas</h3>
              <button className="date-range-close" onClick={() => setShowDateRangeModal(false)}>✕</button>
            </div>
            
            <div className="date-range-content">
              <p className="date-range-info">
                {exportType === 'region' && `Exportando: Región ${exportSelectedRegion?.name}`}
                {exportType === 'provincia' && `Exportando: Provincia ${exportSelectedProvincia?.nombre}`}
              </p>

              <div className="date-range-inputs">
                <div className="date-input-group">
                  <label htmlFor="startDate">Fecha Inicio:</label>
                  <input
                    id="startDate"
                    type="date"
                    value={exportStartDate}
                    onChange={(e) => setExportStartDate(e.target.value)}
                    className="date-input"
                  />
                </div>

                <div className="date-input-group">
                  <label htmlFor="endDate">Fecha Fin:</label>
                  <input
                    id="endDate"
                    type="date"
                    value={exportEndDate}
                    onChange={(e) => setExportEndDate(e.target.value)}
                    className="date-input"
                  />
                </div>
              </div>

              <div className="date-range-actions">
                <button 
                  className="btn-cancel" 
                  onClick={() => setShowDateRangeModal(false)}
                >
                  Cancelar
                </button>
                <button 
                  className="btn-confirm" 
                  onClick={confirmarExportacion}
                  disabled={!exportStartDate || !exportEndDate}
                >
                  Exportar Informe
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de notificaciones pendientes */}
      <PendingReportsModal
        isOpen={showPendingModal}
        onClose={() => setShowPendingModal(false)}
        reports={getPendingReports()}
        onContinueReport={handleContinuePendingReport}
        onCancelReport={handleCancelPendingReport}
      />
    </div>
  );
};

export default ReportsPage;
