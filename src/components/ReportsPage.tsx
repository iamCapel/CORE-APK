import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
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
type PageMode = 'statistics' | 'detailed';

const COLORS = [
  '#00C49F', '#FFBB28', '#FF8042', '#0088FE', '#8884d8', 
  '#82ca9d', '#ffc658', '#ff6b6b', '#4ecdc4', '#95e1d3', '#f38181', '#a29bfe'
];

// Regiones de República Dominicana
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

// Función para calcular distancia entre dos puntos GPS (Haversine)
function calcularDistanciaKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radio de la Tierra en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

const ReportsPage: React.FC<ReportsPageProps> = ({ user, onBack }) => {
  const [regionStats, setRegionStats] = useState<RegionStats[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('intervenciones');
  const [currentPage, setCurrentPage] = useState<PageMode>('statistics');
  const [totalReports, setTotalReports] = useState(0);
  const [totalKilometers, setTotalKilometers] = useState(0);

  useEffect(() => {
    cargarEstadisticas();
    const interval = setInterval(cargarEstadisticas, 5000);
    return () => clearInterval(interval);
  }, []);

  const cargarEstadisticas = () => {
    const stats = reportStorage.getStatistics();
    const allReports = reportStorage.getAllReports();
    
    // Calcular kilómetros totales
    let kmTotal = 0;
    allReports.forEach(report => {
      if (report.gpsData?.start && report.gpsData?.end) {
        const km = calcularDistanciaKm(
          report.gpsData.start.latitude,
          report.gpsData.start.longitude,
          report.gpsData.end.latitude,
          report.gpsData.end.longitude
        );
        kmTotal += km;
      }
    });

    // Crear estadísticas por región
    const regionesData: RegionStats[] = REGIONES_RD.map(region => {
      const regionKey = region.name.toLowerCase();
      const regionData = stats.porRegion[regionKey] || { total: 0, completados: 0, pendientes: 0, enProgreso: 0 };
      
      // Calcular km por región
      const kmRegion = allReports
        .filter(r => r.region?.toLowerCase() === regionKey)
        .reduce((sum, report) => {
          if (report.gpsData?.start && report.gpsData?.end) {
            return sum + calcularDistanciaKm(
              report.gpsData.start.latitude,
              report.gpsData.start.longitude,
              report.gpsData.end.latitude,
              report.gpsData.end.longitude
            );
          }
          return sum;
        }, 0);

      return {
        name: region.name,
        icon: region.icon,
        total: regionData.total,
        totalKm: kmRegion,
        completados: regionData.completados,
        pendientes: regionData.pendientes,
        enProgreso: regionData.enProgreso
      };
    });

    setRegionStats(regionesData);
    setTotalReports(stats.total);
    setTotalKilometers(kmTotal);
  };

  // Preparar datos para los gráficos
  const chartData = regionStats
    .filter(r => r.total > 0)
    .map(region => ({
      name: region.name,
      value: viewMode === 'intervenciones' ? region.total : region.totalKm,
      detalle: viewMode === 'intervenciones' 
        ? `${region.total} intervenciones` 
        : `${region.totalKm.toFixed(2)} km`,
      completados: region.completados,
      pendientes: region.pendientes,
      enProgreso: region.enProgreso
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
      <div className="reports-container">
        {/* Topbar con navegación */}
        <div className="reports-topbar">
          <button className="topbar-back-btn" onClick={onBack}>
            ← Volver al Dashboard
          </button>
          
          <div className="topbar-actions">
            <button 
              className={`topbar-action-btn ${currentPage === 'statistics' ? 'active' : ''}`}
              onClick={() => setCurrentPage('statistics')}
            >
              📊 Estadísticas
            </button>
            <button 
              className={`topbar-action-btn ${currentPage === 'detailed' ? 'active' : ''}`}
              onClick={() => setCurrentPage('detailed')}
            >
              📄 Informe Detallado
            </button>
          </div>
        </div>

        {/* PÁGINA DE ESTADÍSTICAS */}
        {currentPage === 'statistics' && (
          <div className="reports-content">
            <div className="overview-content">
              {/* Resumen General */}
              <div className="stats-summary-cards">
                <div className="summary-card total">
                  <div className="card-icon">📊</div>
                  <div className="card-info">
                    <h3>Total Reportes</h3>
                    <p className="card-value">{totalReports}</p>
                  </div>
                </div>
                <div className="summary-card completed">
                  <div className="card-icon">✅</div>
                  <div className="card-info">
                    <h3>Completados</h3>
                    <p className="card-value">
                      {regionStats.reduce((sum, r) => sum + r.completados, 0)}
                    </p>
                  </div>
                </div>
                <div className="summary-card pending">
                  <div className="card-icon">⏳</div>
                  <div className="card-info">
                    <h3>Pendientes</h3>
                    <p className="card-value">
                      {regionStats.reduce((sum, r) => sum + r.pendientes, 0)}
                    </p>
                  </div>
                </div>
                <div className="summary-card progress">
                  <div className="card-icon">🔄</div>
                  <div className="card-info">
                    <h3>En Progreso</h3>
                    <p className="card-value">
                      {regionStats.reduce((sum, r) => sum + r.enProgreso, 0)}
                    </p>
                  </div>
                </div>
                <div className="summary-card distance">
                  <div className="card-icon">📏</div>
                  <div className="card-info">
                    <h3>Kilómetros Totales</h3>
                    <p className="card-value">{totalKilometers.toFixed(2)} km</p>
                  </div>
                </div>
              </div>

              {/* Botones de modo de visualización */}
              <div className="view-mode-selector">
                <h2 className="section-title">Visualización de Datos por Región</h2>
                <div className="mode-buttons">
                  <button
                    className={`mode-button ${viewMode === 'intervenciones' ? 'active' : ''}`}
                    onClick={() => setViewMode('intervenciones')}
                  >
                    <span className="mode-icon">📋</span>
                    <span className="mode-label">Por Intervenciones</span>
                  </button>
                  <button
                    className={`mode-button ${viewMode === 'kilometraje' ? 'active' : ''}`}
                    onClick={() => setViewMode('kilometraje')}
                  >
                    <span className="mode-icon">📏</span>
                    <span className="mode-label">Por Kilometraje</span>
                  </button>
                </div>
              </div>

              {/* Gráficos */}
              {chartData.length > 0 && (
                <div className="charts-container">
                  {/* Gráfico de Pastel */}
                  <div className="chart-card">
                    <h3 className="chart-title">
                      Distribución {viewMode === 'intervenciones' ? 'de Intervenciones' : 'de Kilómetros'}
                    </h3>
                    <ResponsiveContainer width="100%" height={400}>
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`}
                          outerRadius={120}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Gráfico de Barras */}
                  <div className="chart-card">
                    <h3 className="chart-title">
                      Comparativa Regional {viewMode === 'intervenciones' ? '(Intervenciones)' : '(Kilómetros)'}
                    </h3>
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="name" 
                          angle={-45} 
                          textAnchor="end" 
                          height={120}
                          interval={0}
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Bar dataKey="value" fill="#ff7a00" name={viewMode === 'intervenciones' ? 'Intervenciones' : 'Kilómetros'} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Tabla Detallada */}
              <div className="detailed-table-section">
                <h3 className="section-title">Desglose Detallado por Región</h3>
                <div className="table-container">
                  <table className="stats-table">
                    <thead>
                      <tr>
                        <th>Región</th>
                        <th>Total</th>
                        <th>✅ Completados</th>
                        <th>⏳ Pendientes</th>
                        <th>🔄 En Progreso</th>
                        {viewMode === 'kilometraje' && <th>📏 Kilómetros</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {regionStats
                        .filter(r => r.total > 0)
                        .map((region, index) => (
                          <tr key={index}>
                            <td>
                              <span className="region-icon">{region.icon}</span>
                              {region.name}
                            </td>
                            <td><strong>{region.total}</strong></td>
                            <td className="completados">{region.completados}</td>
                            <td className="pendientes">{region.pendientes}</td>
                            <td className="en-progreso">{region.enProgreso}</td>
                            {viewMode === 'kilometraje' && (
                              <td className="kilometros">{region.totalKm.toFixed(2)} km</td>
                            )}
                          </tr>
                        ))
                      }
                    </tbody>
                    <tfoot>
                      <tr>
                        <td><strong>TOTALES</strong></td>
                        <td><strong>{totalReports}</strong></td>
                        <td><strong>✅ {regionStats.reduce((sum, r) => sum + r.completados, 0)}</strong></td>
                        <td><strong>⏳ {regionStats.reduce((sum, r) => sum + r.pendientes, 0)}</strong></td>
                        <td><strong>🔄 {regionStats.reduce((sum, r) => sum + r.enProgreso, 0)}</strong></td>
                        {viewMode === 'kilometraje' && (
                          <td><strong>📏 {totalKilometers.toFixed(2)} km</strong></td>
                        )}
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PÁGINA DE INFORME DETALLADO */}
        {currentPage === 'detailed' && (
          <div className="reports-content">
            <div className="overview-content">
              <div className="section-header">
                <h2 className="section-title">📄 Informe Detallado por Regiones</h2>
                <p className="section-description">
                  Desglose completo de todas las intervenciones organizadas jerárquicamente
                </p>
              </div>

              <div className="detailed-info-message">
                <div className="info-icon">📋</div>
                <h3>Vista de Informe Detallado</h3>
                <p>Esta vista mostrará un desglose jerárquico completo:</p>
                <ul>
                  <li>🗺️ Regiones → Provincias → Municipios → Distritos</li>
                  <li>📊 Estadísticas detalladas por cada nivel</li>
                  <li>📋 Listado completo de reportes individuales</li>
                  <li>🔍 Información expandible por región</li>
                </ul>
                <p className="note">Esta funcionalidad se encuentra en desarrollo y estará disponible próximamente.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;
