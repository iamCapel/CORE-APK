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
  username?: string;
  userName?: string;
}

interface ReportsListProps {
  user: any;
  onClose: () => void;
  onEditReport?: (reportId: string) => void;
}

const ReportsList: React.FC<ReportsListProps> = ({ 
  user, 
  onClose, 
  onEditReport 
}) => {
  const [pendingReports, setPendingReports] = useState<Report[]>([]);
  const [completedReports, setCompletedReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'todos' | 'pendientes' | 'guardados' | 'realizados'>('todos');

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      
      // Cargar todos los reportes pendientes
      const pending = await firebasePendingReportStorage.getAllPendingReports();
      const pendingFormatted: Report[] = pending.map((report: any) => ({
        id: report._pendingReportId || report.id || '',
        reportNumber: `P-${report._pendingReportId?.slice(-6) || '000000'}`,
        tipoIntervencion: report.tipoIntervencion || 'Sin especificar',
        direccion: report.direccion || 'Sin dirección',
        fechaHora: report.fechaHora || new Date().toLocaleString('es-DO'),
        estado: 'pendiente' as const,
        timestamp: report.timestamp,
        username: report.username,
        userName: report.userName || report.username
      }));

      // Cargar todos los reportes completados
      const allReports = await firebaseReportStorage.getAllReports();
      const completedFormatted: Report[] = allReports.map((report: any) => ({
        id: report.id || '',
        reportNumber: report.reportNumber || `R-${report.id?.slice(-6) || '000000'}`,
        tipoIntervencion: report.tipoIntervencion || 'Sin especificar',
        direccion: report.direccion || 'Sin dirección',
        fechaHora: report.fechaHora || new Date().toLocaleString('es-DO'),
        estado: report.estado === 'aprobado' ? 'realizado' as const : 'guardado' as const,
        timestamp: report.timestamp,
        username: report.username,
        userName: report.userName || report.username
      }));

      setPendingReports(pendingFormatted);
      setCompletedReports(completedFormatted);
    } catch (error) {
      console.error('Error al cargar reportes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReportClick = (report: Report) => {
    if (onEditReport && report.estado !== 'pendiente') {
      onEditReport(report.id);
    }
  };

  const getAllReports = () => {
    switch (filter) {
      case 'pendientes':
        return pendingReports;
      case 'guardados':
        return completedReports.filter(r => r.estado === 'guardado');
      case 'realizados':
        return completedReports.filter(r => r.estado === 'realizado');
      default:
        return [...pendingReports, ...completedReports];
    }
  };

  const ReportItem: React.FC<{ report: Report; isPending?: boolean }> = ({ 
    report, 
    isPending = false 
  }) => (
    <div 
      className={`report-item ${isPending ? 'pending' : 'completed'} ${report.estado}`}
      onClick={() => handleReportClick(report)}
      style={{ cursor: onEditReport && !isPending ? 'pointer' : 'default' }}
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
        <div className="report-user">
          👤 {report.userName || report.username || 'Sin usuario'}
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
      <div className="reports-list-container">
        <div className="loading-state">
          <div className="loading-spinner">⏳</div>
          <p>Cargando informes...</p>
        </div>
      </div>
    );
  }

  const filteredReports = getAllReports();

  return (
    <div className="reports-list-container">
      {/* Header con filtros */}
      <div className="reports-header">
        <h2 className="reports-title">
          📊 Todos los Informes del Sistema
        </h2>
        <div className="filter-buttons">
          <button 
            className={`filter-btn ${filter === 'todos' ? 'active' : ''}`}
            onClick={() => setFilter('todos')}
          >
            Todos ({pendingReports.length + completedReports.length})
          </button>
          <button 
            className={`filter-btn ${filter === 'pendientes' ? 'active' : ''}`}
            onClick={() => setFilter('pendientes')}
          >
            ⏳ Pendientes ({pendingReports.length})
          </button>
          <button 
            className={`filter-btn ${filter === 'guardados' ? 'active' : ''}`}
            onClick={() => setFilter('guardados')}
          >
            📝 Guardados ({completedReports.filter(r => r.estado === 'guardado').length})
          </button>
          <button 
            className={`filter-btn ${filter === 'realizados' ? 'active' : ''}`}
            onClick={() => setFilter('realizados')}
          >
            ✅ Realizados ({completedReports.filter(r => r.estado === 'realizado').length})
          </button>
        </div>
      </div>

      {/* Lista de reportes filtrados */}
      <div className="reports-list">
        {filteredReports.length === 0 ? (
          <div className="empty-state">
            <p>No hay informes para mostrar</p>
          </div>
        ) : (
          filteredReports
            .sort((a, b) => {
              const dateA = new Date(a.timestamp || 0);
              const dateB = new Date(b.timestamp || 0);
              return dateB.getTime() - dateA.getTime(); // Más recientes primero
            })
            .map(report => (
              <ReportItem 
                key={report.id} 
                report={report} 
                isPending={report.estado === 'pendiente'}
              />
            ))
        )}
      </div>
    </div>
  );
};

export default ReportsList;
