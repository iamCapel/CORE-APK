import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { reportStorage } from '../services/reportStorage';
import './ReportsPage.css';

interface User {
  username: string;
  name: string;
}

interface ReportsPageProps {
  user: User;
  onBack: () => void;
}

interface RegionStats {
  name: string;
  total: number;
  totalKm: number;
  completados: number;
  pendientes: number;
  enProgreso: number;
  icon: string;
}

type ViewMode = 'intervenciones' | 'kilometraje';

const COLORS = [
  '#00C49F', '#FFBB28', '#FF8042', '#0088FE', '#8884d8', 
  '#82ca9d', '#ffc658', '#ff6b6b', '#4ecdc4', '#95e1d3', '#f38181', '#a29bfe'
];

// Regiones de República Dominicana con sus iconos
const REGIONES_RD = [
  { name: 'Ozama o Metropolitana', icon: '🏛️' },
  { name: 'Cibao Norte', icon: '🌆' },
  { name: 'Cibao Sur', icon: '🌊' },
  { name: 'Cibao Nordeste', icon: '🌾' },
  { name: 'Cibao Noroeste', icon: '🏪' },
  { name: 'Santiago', icon: '🏫' },
  { name: 'Valdesia', icon: '✈️' },
  { name: 'Enriquillo', icon: '🏖️' },
  { name: 'El Valle', icon: '🏞️' },
  { name: 'Yuma', icon: '🌴' },
  { name: 'Higuamo', icon: '🌿' }
];

const ReportsPage: React.FC<ReportsPageProps> = ({ user, onBack }) => {
  const [regionStats, setRegionStats] = useState<RegionStats[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('intervenciones');
  const [totalReports, setTotalReports] = useState(0);
  const [totalKilometers, setTotalKilometers] = useState(0);

  // Función para calcular distancia entre dos coordenadas (fórmula de Haversine)
  const calcularDistanciaKm = (coord1: string | { lat: number; lon: number }, coord2: string | { lat: number; lon: number }): number => {
    try {
      let lat1: number, lon1: number, lat2: number, lon2: number;

      if (typeof coord1 === 'string') {
        const [lat1Str, lon1Str] = coord1.split(',').map(s => s.trim());
        lat1 = parseFloat(lat1Str);
        lon1 = parseFloat(lon1Str);
      } else {
        lat1 = coord1.lat;
        lon1 = coord1.lon;
      }

      if (typeof coord2 === 'string') {
        const [lat2Str, lon2Str] = coord2.split(',').map(s => s.trim());
        lat2 = parseFloat(lat2Str);
        lon2 = parseFloat(lon2Str);
      } else {
        lat2 = coord2.lat;
        lon2 = coord2.lon;
      }
      
      if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) {
        return 0;
      }
      
      const R = 6371; // Radio de la Tierra en km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    } catch (e) {
      console.error('Error al calcular distancia:', e);
      return 0;
    }
  };

  useEffect(() => {
    // Cargar estadísticas desde reportStorage
    const loadStatistics = () => {
      const stats = reportStorage.getStatistics();
      const reports = reportStorage.getAllReports();
      
      console.log('📊 Estadísticas cargadas:', stats);
      console.log('📋 Total de reportes:', reports.length);

      // Crear estadísticas por región
      const regionesData: RegionStats[] = REGIONES_RD.map(region => {
        const regionData = stats.porRegion[region.name] || {
          total: 0,
          completados: 0,
          pendientes: 0,
          enProgreso: 0,
          totalKm: 0
        };

        // Calcular kilómetros totales de intervenciones en esta región
        let totalKm = 0;
        const regionReports = reports.filter(r => r.region === region.name);
        
        regionReports.forEach(report => {
          // Calcular distancia desde metricData o gpsData
          if (report.metricData?.longitud_intervencion) {
            // Si hay longitud directa en metros, convertir a km
            const longitudMetros = parseFloat(report.metricData.longitud_intervencion);
            if (!isNaN(longitudMetros)) {
              totalKm += longitudMetros / 1000;
            }
          } else if (report.gpsData?.punto_inicial && report.gpsData?.punto_alcanzado) {
            // Calcular desde coordenadas GPS
            const distancia = calcularDistanciaKm(
              report.gpsData.punto_inicial,
              report.gpsData.punto_alcanzado
            );
            totalKm += distancia;
          } else if (report.metricData?.punto_inicial && report.metricData?.punto_alcanzado) {
            // Intentar desde metricData si son strings
            const distancia = calcularDistanciaKm(
              report.metricData.punto_inicial,
              report.metricData.punto_alcanzado
            );
            totalKm += distancia;
          }
        });

        return {
          name: region.name,
          total: regionData.total,
          totalKm: Math.round(totalKm * 100) / 100, // Redondear a 2 decimales
          completados: regionData.completados,
          pendientes: regionData.pendientes,
          enProgreso: regionData.enProgreso,
          icon: region.icon
        };
      }).filter(region => region.total > 0); // Solo mostrar regiones con datos

      setRegionStats(regionesData);
      setTotalReports(stats.total);
      setTotalKilometers(Math.round(regionesData.reduce((sum, r) => sum + r.totalKm, 0) * 100) / 100);
    };

    loadStatistics();

    // Recargar cada 5 segundos por si hay cambios
    const interval = setInterval(loadStatistics, 5000);
    return () => clearInterval(interval);
  }, []);

  // Preparar datos para el gráfico según el modo seleccionado
  const chartData = regionStats.map((region, index) => ({
    name: `${region.icon} ${region.name}`,
    value: viewMode === 'intervenciones' ? region.total : region.totalKm,
    color: COLORS[index % COLORS.length],
    completados: region.completados,
    pendientes: region.pendientes,
    enProgreso: region.enProgreso,
    detalle: viewMode === 'intervenciones' 
      ? `${region.total} intervenciones`
      : `${region.totalKm.toFixed(2)} km`
  }));

  // Tooltip personalizado
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="custom-tooltip">
          <p className="tooltip-title">{data.name}</p>
          <p className="tooltip-total">
            <strong>Total:</strong> {data.detalle}
          </p>
          <p className="tooltip-detail" style={{ color: '#00C49F' }}>
            ✅ Completados: {data.completados}
          </p>
          <p className="tooltip-detail" style={{ color: '#FFBB28' }}>
            ⏳ Pendientes: {data.pendientes}
          </p>
          <p className="tooltip-detail" style={{ color: '#FF8042' }}>
            🔄 En Progreso: {data.enProgreso}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="reports-page">
      {/* Header */}
      <div className="reports-header">
        <div className="header-left">
          <button className="back-button" onClick={onBack}>
            <span className="btn-icon">←</span>
            <span>Atrás</span>
          </button>
          <h1 className="page-title">
            <span className="title-icon">📊</span>
            <span>Estadísticas de Intervenciones</span>
          </h1>
        </div>
        <div className="header-right">
          <div className="stats-summary">
            <div className="stat-item">
              <span className="stat-label">Total Reportes:</span>
              <span className="stat-value">{totalReports}</span>
            </div>
            {viewMode === 'kilometraje' && (
              <div className="stat-item">
                <span className="stat-label">Total Kilómetros:</span>
                <span className="stat-value">{totalKilometers.toFixed(2)} km</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="reports-content">
        <div className="overview-content">
          {/* Título de la sección */}
          <div className="section-header">
            <h2 className="section-title">
              {viewMode === 'intervenciones' 
                ? '📈 Estadísticas por Intervenciones' 
                : '📏 Estadísticas por Kilometraje'}
            </h2>
            <p className="section-description">
              {viewMode === 'intervenciones'
                ? 'Cantidad total de intervenciones realizadas por región'
                : 'Kilómetros totales de intervenciones por región'}
            </p>
          </div>

          {/* Mensaje si no hay datos */}
          {regionStats.length === 0 ? (
            <div className="no-data-message">
              <div className="no-data-icon">📊</div>
              <h3>No hay datos disponibles</h3>
              <p>Aún no se han registrado intervenciones en el sistema.</p>
              <p>Los datos aparecerán aquí automáticamente cuando se guarden reportes.</p>
            </div>
          ) : (
            <>
              {/* Gráfico de Pastel */}
              <div className="unified-chart-container">
                <div className="unified-chart">
                  <ResponsiveContainer width="100%" height={500}>
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={false}
                        outerRadius={200}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Leyenda */}
                <div className="unified-legend">
                  {chartData.map((entry, index) => (
                    <div key={index} className="unified-legend-item">
                      <div className="legend-color" style={{ backgroundColor: entry.color }}></div>
                      <span className="legend-text">
                        {entry.name}: {entry.detalle}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Botones de modo de visualización */}
              <div className="view-mode-controls">
                <h3 className="controls-title">Modo de Visualización</h3>
                <div className="view-mode-buttons">
                  <button
                    className={`mode-button ${viewMode === 'intervenciones' ? 'active' : ''}`}
                    onClick={() => setViewMode('intervenciones')}
                  >
                    <span className="mode-icon">📊</span>
                    <span className="mode-label">Por Intervenciones</span>
                    <span className="mode-description">Ver cantidad de trabajos realizados</span>
                  </button>
                  <button
                    className={`mode-button ${viewMode === 'kilometraje' ? 'active' : ''}`}
                    onClick={() => setViewMode('kilometraje')}
                  >
                    <span className="mode-icon">📏</span>
                    <span className="mode-label">Por Kilometraje</span>
                    <span className="mode-description">Ver distancia total trabajada</span>
                  </button>
                </div>
              </div>

              {/* Tabla de detalles */}
              <div className="details-table-section">
                <h3 className="table-title">
                  {viewMode === 'intervenciones' 
                    ? '📋 Desglose por Intervenciones' 
                    : '📏 Desglose por Kilometraje'}
                </h3>
                <div className="details-table-container">
                  <table className="details-table">
                    <thead>
                      <tr>
                        <th>Región</th>
                        <th>Total</th>
                        <th>Completados</th>
                        <th>Pendientes</th>
                        <th>En Progreso</th>
                        {viewMode === 'kilometraje' && <th>Kilómetros</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {regionStats.map((region, index) => (
                        <tr key={index}>
                          <td className="region-name">
                            <span className="region-icon">{region.icon}</span>
                            {region.name}
                          </td>
                          <td className="total-value">{region.total}</td>
                          <td className="completed-value">✅ {region.completados}</td>
                          <td className="pending-value">⏳ {region.pendientes}</td>
                          <td className="inprogress-value">🔄 {region.enProgreso}</td>
                          {viewMode === 'kilometraje' && (
                            <td className="km-value">{region.totalKm.toFixed(2)} km</td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td><strong>TOTAL</strong></td>
                        <td><strong>{totalReports}</strong></td>
                        <td><strong>✅ {regionStats.reduce((sum, r) => sum + r.completados, 0)}</strong></td>
                        <td><strong>⏳ {regionStats.reduce((sum, r) => sum + r.pendientes, 0)}</strong></td>
                        <td><strong>🔄 {regionStats.reduce((sum, r) => sum + r.enProgreso, 0)}</strong></td>
                        {viewMode === 'kilometraje' && (
                          <td><strong>{totalKilometers.toFixed(2)} km</strong></td>
                        )}
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportsPage; 
