import React, { useState, useEffect } from 'react';
import firebaseReportStorage from '../services/firebaseReportStorage';
import { firebasePendingReportStorage } from '../services/firebasePendingReportStorage';
import './MyReportsList.css';

interface Report {
  id: string;
  reportNumber?: string;
  tipoIntervencion: string;
  direccion: string;
  fechaHora: string;
  estado: 'pendiente' | 'guardado' | 'realizado';
  timestamp?: any;
}

interface MyReportsListProps {
  username: string;
  onClose: () => void;
  onContinuePendingReport?: (reportId: string) => void;
}

const MyReportsList: React.FC<MyReportsListProps> = ({ 
  username, 
  onClose, 
  onContinuePendingReport 
}) => {
  const [pendingReports, setPendingReports] = useState<Report[]>([]);
  const [completedReports, setCompletedReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      console.log('📊 Todos los reportes pendientes:', pending);
      
      // Filtrar reportes pendientes por usuario
      const userPendingReports = pending.filter((report: any) => report.username === username);
      console.log('📊 Reportes pendientes del usuario:', userPendingReports);
      
      const pendingFormatted: Report[] = userPendingReports.map((report: any) => ({
        id: report._pendingReportId || report.id || '',
        reportNumber: `P-${report._pendingReportId?.slice(-6) || '000000'}`,
        tipoIntervencion: report.tipoIntervencion || 'Sin especificar',
        direccion: report.direccion || 'Sin dirección',
        fechaHora: report.fechaHora || new Date().toLocaleString('es-DO'),
        estado: 'pendiente' as const,
        timestamp: report.timestamp
      }));
      console.log('✅ Reportes pendientes formateados:', pendingFormatted);

      // Cargar reportes completados
      const allReports = await firebaseReportStorage.getAllReports();
      console.log('📊 Todos los reportes completados:', allReports);
      
      const userReports = allReports.filter((report: any) => report.username === username);
      console.log('📊 Reportes del usuario:', userReports);
      
      const completedFormatted: Report[] = userReports.map((report: any) => ({
        id: report.id || '',
        reportNumber: report.reportNumber || `R-${report.id?.slice(-6) || '000000'}`,
        tipoIntervencion: report.tipoIntervencion || 'Sin especificar',
        direccion: report.direccion || 'Sin dirección',
        fechaHora: report.fechaHora || new Date().toLocaleString('es-DO'),
        estado: report.estado === 'aprobado' ? 'realizado' as const : 'guardado' as const,
        timestamp: report.timestamp
      }));
      console.log('✅ Reportes completados formateados:', completedFormatted);

      setPendingReports(pendingFormatted);
      setCompletedReports(completedFormatted);
      
      console.log('📈 Totales del usuario - Pendientes:', pendingFormatted.length, 'Completados:', completedFormatted.length);
      console.log('📈 Total general de reportes del usuario:', pendingFormatted.length + completedFormatted.length);
    } catch (error) {
      console.error('❌ Error al cargar reportes:', error);
      setError('No se pudieron cargar los reportes. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handlePendingReportClick = (report: Report) => {
    if (onContinuePendingReport) {
      onContinuePendingReport(report.id);
    }
  };

  const ReportItem: React.FC<{ report: Report; isPending?: boolean }> = ({ 
    report, 
    isPending = false 
  }) => (
    <div 
      className={`report-item ${isPending ? 'pending' : 'completed'}`}
      onClick={isPending ? () => handlePendingReportClick(report) : undefined}
      style={{ cursor: isPending ? 'pointer' : 'default' }}
    >
      <div className="report-number">
        #{report.reportNumber}
      </div>
      <div className="report-content">
        <div className="report-intervention">
          {report.tipoIntervencion}
        </div>
        <div className="report-address">
          📍 {report.direccion}
        </div>
        <div className="report-datetime">
          🕒 {report.fechaHora}
        </div>
      </div>
      <div className="report-status">
        <span className={`status-badge ${report.estado}`}>
          {report.estado === 'pendiente' ? '⏳' : 
           report.estado === 'guardado' ? '📝' : '✅'} 
          {' '}
          {report.estado === 'pendiente' ? 'Pendiente' : 
           report.estado === 'guardado' ? 'Guardado' : 'Realizado'}
        </span>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="my-reports-list-container">
        <div className="loading-state">
          <div className="loading-spinner">⏳</div>
          <p>Cargando reportes desde Firebase...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-reports-list-container">
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
    <div className="my-reports-list-container">
      {/* Header con refresh */}
      <div className="reports-header">
        <h3 className="reports-title">
          📋 Mis Reportes Registrados
        </h3>
        <button 
          className="refresh-button" 
          onClick={loadReports}
          disabled={loading}
          title="Recargar mis reportes"
        >
          🔄
        </button>
      </div>

      {/* Sección de Reportes Pendientes */}
      <div className="reports-section pending-section">
        <div className="section-header">
          <h3 className="section-title">
            ⏳ Reportes Pendientes
            <span className="report-count">({pendingReports.length})</span>
          </h3>
        </div>
        <div className="reports-list">
          {pendingReports.length === 0 ? (
            <div className="empty-state">
              <p>No tienes reportes pendientes</p>
            </div>
          ) : (
            pendingReports.map(report => (
              <ReportItem key={report.id} report={report} isPending={true} />
            ))
          )}
        </div>
      </div>

      {/* Separador */}
      <div className="section-divider"></div>

      {/* Sección de Reportes Completados */}
      <div className="reports-section completed-section">
        <div className="section-header">
          <h3 className="section-title">
            📋 Reportes Guardados y Realizados
            <span className="report-count">({completedReports.length})</span>
          </h3>
        </div>
        <div className="reports-list">
          {completedReports.length === 0 ? (
            <div className="empty-state">
              <p>No tienes reportes guardados</p>
            </div>
          ) : (
            completedReports
              .sort((a, b) => {
                const dateA = new Date(a.timestamp || 0);
                const dateB = new Date(b.timestamp || 0);
                return dateB.getTime() - dateA.getTime(); // Más recientes primero
              })
              .map(report => (
                <ReportItem key={report.id} report={report} isPending={false} />
              ))
          )}
        </div>
      </div>
    </div>
  );
};

export default MyReportsList;
