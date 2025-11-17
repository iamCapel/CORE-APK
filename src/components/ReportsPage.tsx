import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, ComposedChart, Line } from 'recharts';
import { reportStorage } from '../services/reportStorage';
import DetailedReportView from './DetailedReportView';
import RegionDetailModal from './RegionDetailModal';
import PendingReportsModal from './PendingReportsModal';
import './ReportsPage.css';

interface User {
  username: string;
  name: string;
}

interface ReportsPageProps {
  user: User;
  onBack: () => void;
}

interface ProvinceData {
  name: string;
  completed: number;
  pending: number;
  inProgress: number;
  total: number;
  totalKm: number;
  icon: string;
}

interface RegionData {
  name: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface CandleData {
  name: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const COLORS = [
  '#00C49F', '#FFBB28', '#FF8042', '#0088FE', '#8884d8', 
  '#82ca9d', '#ffc658', '#ff6b6b', '#4ecdc4', '#95e1d3', '#f38181'
];

const ReportsPage: React.FC<ReportsPageProps> = ({ user, onBack }) => {
  const [provincesData, setProvincesData] = useState<ProvinceData[]>([]);
  const [regionCandleData, setRegionCandleData] = useState<CandleData[]>([]);
  const [currentPage, setCurrentPage] = useState<'statistics' | 'detailed'>('statistics');
  const [selectedRegion, setSelectedRegion] = useState<ProvinceData | null>(null);
  
  // Estados para notificaciones
  const [pendingCount, setPendingCount] = useState(0);
  const [showPendingModal, setShowPendingModal] = useState(false);

  useEffect(() => {
    // Función para calcular distancia entre dos coordenadas (fórmula de Haversine)
    const calcularDistanciaKm = (coord1: string, coord2: string): number => {
      try {
        // Parsear coordenadas en formato "lat, lon" o "lat,lon"
        const [lat1Str, lon1Str] = coord1.split(',').map(s => s.trim());
        const [lat2Str, lon2Str] = coord2.split(',').map(s => s.trim());
        
        const lat1 = parseFloat(lat1Str);
        const lon1 = parseFloat(lon1Str);
        const lat2 = parseFloat(lat2Str);
        const lon2 = parseFloat(lon2Str);
        
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

    // Regiones de República Dominicana
    const regionesRD = [
      { name: 'Ozama o Metropolitana', icon: '🏛️' },
      { name: 'Cibao Norte', icon: '🌆' },
      { name: 'Cibao Sur', icon: '🌊' },
      { name: 'Cibao Nordeste', icon: '🌾' },
      { name: 'Cibao Noroeste', icon: '🏪' },
      { name: 'Santiago', icon: '🏫' },
      { name: 'Valdesia', icon: '✈️' },
      { name: 'Enriquillo', icon: '🏘️' },
      { name: 'El Valle', icon: '🏡' },
      { name: 'Yuma', icon: '🏬' },
      { name: 'Higuamo', icon: '🌳' }
    ];

    // Calcular datos reales usando reportStorage
    const regionStats: Record<string, { completed: number; pending: number; inProgress: number; totalKm: number }> = {};
    
    regionesRD.forEach(region => {
      regionStats[region.name] = { completed: 0, pending: 0, inProgress: 0, totalKm: 0 };
    });

    // Obtener estadísticas por región usando reportStorage
    const stats = reportStorage.getStatistics();
    
    // Procesar estadísticas por región desde porRegion
    if (stats.porRegion) {
      Object.keys(stats.porRegion).forEach(region => {
        if (regionStats[region]) {
          const regionStat = stats.porRegion[region];
          regionStats[region].completed = regionStat.completados || 0;
          regionStats[region].pending = regionStat.pendientes || 0;
          regionStats[region].inProgress = regionStat.enProgreso || 0;
          regionStats[region].totalKm = regionStat.totalKm || 0;
        }
      });
    }
    
    // Si necesitamos más detalle, obtener todos los reportes
    const allReports = reportStorage.getAllReports();
    allReports.forEach(report => {
      if (report.region && regionStats[report.region]) {
        // Calcular kilómetros desde coordenadas GPS si existen
        const gpsData = report.gpsData;
        if (gpsData?.punto_inicial && gpsData?.punto_alcanzado) {
          const puntoInicial = `${gpsData.punto_inicial.lat}, ${gpsData.punto_inicial.lon}`;
          const puntoAlcanzado = `${gpsData.punto_alcanzado.lat}, ${gpsData.punto_alcanzado.lon}`;
          const distanciaKm = calcularDistanciaKm(puntoInicial, puntoAlcanzado);
          regionStats[report.region].totalKm += distanciaKm;
        }
      }
    });

    // Crear datos para las regiones
    const mockProvincesData: ProvinceData[] = regionesRD.map(region => {
      const stats = regionStats[region.name];
      const total = stats.completed + stats.pending + stats.inProgress;
      
      return {
        name: region.name,
        completed: stats.completed,
        pending: stats.pending,
        inProgress: stats.inProgress,
        total: total,
        totalKm: stats.totalKm,
        icon: region.icon
      };
    });

    setProvincesData(mockProvincesData);

    // Datos de velas por regiones
    const candleData: CandleData[] = regionesRD.slice(0, 6).map(region => {
      const stats = regionStats[region.name];
      const total = stats.completed + stats.pending + stats.inProgress;
      return {
        name: region.name,
        open: stats.completed,
        high: total,
        low: stats.pending,
        close: stats.inProgress,
        volume: total * 100
      };
    });

    setRegionCandleData(candleData);
  }, []);

  // Función para actualizar el contador de pendientes
  const updatePendingCount = () => {
    const pendientes = Object.keys(localStorage).filter(key => 
      key.startsWith('intervencion_pendiente_') || key.startsWith('borrador_intervencion')
    ).length;
    setPendingCount(pendientes);
  };

  // Función para obtener lista detallada de reportes pendientes
  const getPendingReports = () => {
    const pendingKeys = Object.keys(localStorage).filter(key => 
      key.startsWith('intervencion_pendiente_') || key.startsWith('borrador_intervencion')
    );

    return pendingKeys.map(key => {
      try {
        const data = JSON.parse(localStorage.getItem(key) || '{}');
        return {
          id: key,
          reportNumber: key.includes('pendiente_') ? 
            `RPT-${key.split('_').pop()?.slice(-6) || '000000'}` : 
            `BRR-${Date.now().toString().slice(-6)}`,
          timestamp: data.timestamp || new Date().toISOString(),
          estado: data.estado || (key.includes('borrador') ? 'borrador' : 'pendiente'),
          region: data.region || 'N/A',
          provincia: data.provincia || 'N/A',
          municipio: data.municipio || 'N/A',
          tipoIntervencion: data.tipoIntervencion || 'No especificado'
        };
      } catch {
        return {
          id: key,
          reportNumber: `ERR-${Date.now().toString().slice(-6)}`,
          timestamp: new Date().toISOString(),
          estado: 'error',
          region: 'Error',
          provincia: 'Error',
          municipio: 'Error',
          tipoIntervencion: 'Error al cargar'
        };
      }
    });
  };

  // Función para eliminar un reporte pendiente
  const handleDeletePendingReport = (reportId: string) => {
    localStorage.removeItem(reportId);
    updatePendingCount();
    // Actualizar la vista del modal
    setShowPendingModal(false);
    setTimeout(() => setShowPendingModal(true), 100);
  };

  // Actualizar contador al cargar y cada vez que cambie localStorage
  useEffect(() => {
    updatePendingCount();
    
    // Escuchar cambios en localStorage
    const handleStorageChange = () => {
      updatePendingCount();
    };

    window.addEventListener('storage', handleStorageChange);
    
    // También verificar periódicamente por si hay cambios internos
    const interval = setInterval(updatePendingCount, 2000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize="12"
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const renderUnifiedPieChart = () => {
    // Crear data para el gráfico unificado con todas las provincias
    const unifiedData = provincesData.map((province, index) => ({
      name: province.name,
      value: province.total,
      color: COLORS[index % COLORS.length],
      icon: province.icon,
      completed: province.completed,
      pending: province.pending,
      inProgress: province.inProgress,
      totalKm: province.totalKm
    }));

    const customTooltip = ({ active, payload }: any) => {
      if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
          <div className="custom-tooltip" style={{
            backgroundColor: 'white',
            padding: '15px',
            border: `3px solid ${data.color}`,
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}>
            <p className="tooltip-title" style={{ 
              fontSize: '16px', 
              fontWeight: 'bold', 
              marginBottom: '10px',
              color: '#333'
            }}>
              {`${data.icon} ${data.name}`}
            </p>
            <p className="tooltip-total" style={{ 
              fontWeight: 'bold', 
              color: '#4CAF50',
              fontSize: '18px',
              margin: '8px 0',
              padding: '8px',
              backgroundColor: '#f0f9f4',
              borderRadius: '4px'
            }}>
              {`📏 ${data.totalKm.toFixed(2)} km intervenidos`}
            </p>
            <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #eee' }}>
              <p className="tooltip-total" style={{ fontWeight: '600', marginBottom: '8px' }}>
                {`Total: ${data.value} intervenciones`}
              </p>
              <p className="tooltip-detail" style={{ color: '#00C49F', margin: '4px 0' }}>
                {`✓ Completados: ${data.completed}`}
              </p>
              <p className="tooltip-detail" style={{ color: '#FFBB28', margin: '4px 0' }}>
                {`⏳ Pendientes: ${data.pending}`}
              </p>
              <p className="tooltip-detail" style={{ color: '#FF8042', margin: '4px 0' }}>
                {`🔄 En Progreso: ${data.inProgress}`}
              </p>
            </div>
          </div>
        );
      }
      return null;
    };

    return (
      <div className="unified-chart-container">
        <div className="unified-chart">
          <ResponsiveContainer width="100%" height={500}>
            <PieChart>
              <Pie
                data={unifiedData}
                cx="50%"
                cy="50%"
                labelLine={true}
                label={(entry) => `${entry.icon}`}
                outerRadius={200}
                fill="#8884d8"
                dataKey="value"
                stroke="#fff"
                strokeWidth={2}
                onClick={(data) => {
                  const regionData = provincesData.find(p => p.name === data.name);
                  if (regionData) {
                    setSelectedRegion(regionData);
                  }
                }}
              >
                {unifiedData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color}
                    style={{ cursor: 'pointer' }}
                  />
                ))}
              </Pie>
              <Tooltip content={customTooltip} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="unified-legend">
          {unifiedData.map((entry, index) => (
            <div key={index} className="unified-legend-item">
              <div 
                className="legend-color" 
                style={{ backgroundColor: entry.color }}
              ></div>
              <span className="legend-text">
                {entry.icon} {entry.name}: {entry.totalKm.toFixed(2)} km trabajados
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderProvincePieChart = (province: ProvinceData) => {
    const data = [
      { name: 'Completados', value: province.completed, color: '#00C49F' },
      { name: 'Pendientes', value: province.pending, color: '#FFBB28' },
      { name: 'En Progreso', value: province.inProgress, color: '#FF8042' }
    ];

    return (
      <div key={province.name} className="province-chart-container">
        <div className="province-header">
          <span className="province-icon">{province.icon}</span>
          <h3 className="province-name">{province.name}</h3>
          <span className="province-total">Total: {province.total}</span>
        </div>
        <div className="province-chart">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value: any) => [value, '']} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="province-legend">
          {data.map((entry, index) => (
            <div key={index} className="legend-item">
              <div 
                className="legend-color" 
                style={{ backgroundColor: entry.color }}
              ></div>
              <span className="legend-text">{entry.name}: {entry.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="reports-page">
      <div className="reports-topbar">
        <button className="topbar-back-btn" onClick={onBack}>
          <span className="btn-icon">←</span>
          <span>Volver</span>
        </button>
        
        <div className="topbar-actions">
          <button 
            className={`topbar-btn ${currentPage === 'statistics' ? 'active' : ''}`}
            onClick={() => setCurrentPage('statistics')}
          >
            <span className="btn-icon">📊</span>
            <span>Estadísticas</span>
          </button>
          <button 
            className={`topbar-btn ${currentPage === 'detailed' ? 'active' : ''}`}
            onClick={() => setCurrentPage('detailed')}
          >
            <span className="btn-icon">📄</span>
            <span>Informe Detallado</span>
          </button>
          
          {/* Ícono de notificaciones - posicionado a la derecha */}
          <div className="notification-container" style={{ position: 'relative', cursor: 'pointer', marginLeft: '20px' }}>
            <img 
              src="/images/notification-bell-icon.svg" 
              alt="Notificaciones" 
              style={{
                width: '24px', 
                height: '24px',
                filter: 'drop-shadow(0 2px 4px rgba(255, 152, 0, 0.4))',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
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
            {/* Contador de notificaciones */}
            {pendingCount > 0 && (
              <span 
                className="notification-badge"
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
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  animation: pendingCount > 0 ? 'pulse 2s infinite' : 'none'
                }}
              >
                {pendingCount > 99 ? '99+' : pendingCount}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Página de Estadísticas */}
      {currentPage === 'statistics' && (
        <div className="reports-content">
          <div className="overview-content">
            {/* Gráfico de Pastel Unificado por Provincias */}
            <div className="section-header">
              <h2 className="section-title">📈 Estadísticas Consolidadas por Provincia</h2>
              <p className="section-description">
                Distribución total de intervenciones entre todas las provincias
              </p>
            </div>

            {renderUnifiedPieChart()}

            {/* Gráfico de Velas por Regiones */}
            <div className="section-header">
              <h2 className="section-title">📊 Análisis de Tendencias por Región</h2>
              <p className="section-description">
                Gráfico de velas mostrando el rendimiento de intervenciones por región
              </p>
            </div>

            <div className="trading-chart-container">
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={regionCandleData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
                  stroke="#666"
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis stroke="#666" fontSize={12} />
                <Tooltip 
                  formatter={(value: any, name: string) => [
                    typeof value === 'number' ? value.toFixed(2) : value, 
                    name
                  ]}
                  labelStyle={{ color: '#333' }}
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #ccc',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar dataKey="volume" fill="#8884d8" opacity={0.3} yAxisId="volume" />
                <Bar dataKey="open" fill="#00C49F" />
                <Bar dataKey="high" fill="#FFBB28" />
                <Bar dataKey="low" fill="#FF8042" />
                <Bar dataKey="close" fill="#0088FE" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-legend-horizontal">
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: '#00C49F' }}></div>
              <span>Apertura</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: '#FFBB28' }}></div>
              <span>Máximo</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: '#FF8042' }}></div>
              <span>Mínimo</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: '#0088FE' }}></div>
              <span>Cierre</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: '#8884d8', opacity: 0.3 }}></div>
              <span>Volumen</span>
            </div>
          </div>
        </div>
        </div>
      )}

      {/* Página de Informe Detallado */}
      {currentPage === 'detailed' && (
        <div className="detailed-report-page">
          <DetailedReportView onClose={null} />
        </div>
      )}

      {/* Modal de Detalle de Región */}
      {selectedRegion && (
        <RegionDetailModal
          regionName={selectedRegion.name}
          regionIcon={selectedRegion.icon}
          totalKm={selectedRegion.totalKm}
          completed={selectedRegion.completed}
          pending={selectedRegion.pending}
          inProgress={selectedRegion.inProgress}
          onClose={() => setSelectedRegion(null)}
        />
      )}
      
      {/* Modal de Reportes Pendientes */}
      <PendingReportsModal
        isOpen={showPendingModal}
        onClose={() => setShowPendingModal(false)}
        reports={getPendingReports()}
        onDeleteReport={handleDeletePendingReport}
      />
    </div>
  );
};

export default ReportsPage;