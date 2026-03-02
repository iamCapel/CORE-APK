import React, { useState } from 'react';
import { MdBarChart, MdCheckCircle, MdPending, MdCalendarToday } from 'react-icons/md';
import firebaseReportStorage from '../services/firebaseReportStorage';

interface ReportItem {
  id: string;
  reportNumber: string;
  region: string;
  provincia: string;
  municipio: string;
  estado: 'pendiente' | 'aprobado' | 'completado' | 'borrador' | 'en_revision' | 'rechazado';
  timestamp: string;
  fechaInicio?: string;
  fechaFinal?: string;
}

interface MyReportsDropdownProps {
  username: string;
  onReportClick?: (reportId: string) => void;
}

const MyReportsDropdown: React.FC<MyReportsDropdownProps> = ({
  username,
  onReportClick,
}) => {
  const [open, setOpen] = useState(false);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(false);

  const loadReports = async () => {
    if (!username) return;
    
    setLoading(true);
    try {
      const allReports = await firebaseReportStorage.getAllReports();
      const userReports = allReports
        .filter((r) => r.creadoPor === username || r.usuarioId === username)
        .sort((a, b) => {
          const dateA = new Date(b.timestamp || 0).getTime();
          const dateB = new Date(a.timestamp || 0).getTime();
          return dateA - dateB;
        })
        .map((r) => ({
          id: r.id,
          reportNumber: r.numeroReporte || 'Sin número',
          region: r.region || '',
          provincia: r.provincia || '',
          municipio: r.municipio || '',
          estado: r.estado || 'pendiente',
          timestamp: r.timestamp || '',
          fechaInicio: r.fechaInicio,
          fechaFinal: r.fechaFinal,
        }));
      
      setReports(userReports);
    } catch (error) {
      console.error('Error cargando reportes del usuario:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = () => {
    if (!open) {
      loadReports();
    }
    setOpen(!open);
  };

  const handleReportItemClick = (reportId: string) => {
    if (onReportClick) {
      onReportClick(reportId);
    }
    setOpen(false);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-DO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-DO', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const approvedCount = reports.filter((r) => r.estado === 'aprobado' || r.estado === 'completado').length;
  const pendingCount = reports.filter((r) => r.estado === 'pendiente' || r.estado === 'en_revision' || r.estado === 'borrador').length;

  return (
    <div className="my-reports-wrapper">
      <button className="my-reports-btn" onClick={handleToggle} title="Mis Reportes">
        <MdBarChart size={20} />
        {reports.length > 0 && (
          <span className="my-reports-count">{reports.length}</span>
        )}
      </button>

      {open && (
        <>
          <div className="my-reports-backdrop" onClick={() => setOpen(false)} />
          <div className="my-reports-dropdown">
            <div className="my-reports-header">
              <div className="my-reports-title-row">
                <MdBarChart size={20} color="#FF6B00" />
                <span className="my-reports-title">Mis Reportes</span>
              </div>
              <div className="my-reports-stats">
                <div className="my-reports-stat approved">
                  <MdCheckCircle size={14} />
                  <span>{approvedCount} Aprobados</span>
                </div>
                <div className="my-reports-stat pending">
                  <MdPending size={14} />
                  <span>{pendingCount} Pendientes</span>
                </div>
              </div>
            </div>

            <div className="my-reports-list">
              {loading ? (
                <div className="my-reports-loading">Cargando...</div>
              ) : reports.length === 0 ? (
                <div className="my-reports-empty">
                  No tienes reportes registrados
                </div>
              ) : (
                reports.map((report) => (
                  <div
                    key={report.id}
                    className={`my-report-item ${report.estado}`}
                    onClick={() => handleReportItemClick(report.id)}
                  >
                    <div className="my-report-status">
                      {(report.estado === 'aprobado' || report.estado === 'completado') ? (
                        <MdCheckCircle size={18} color="#10b981" />
                      ) : (
                        <MdPending size={18} color="#FF6B00" />
                      )}
                    </div>
                    <div className="my-report-content">
                      <div className="my-report-header-row">
                        <span className="my-report-number">#{report.reportNumber}</span>
                        <span className={`my-report-badge ${report.estado === 'aprobado' || report.estado === 'completado' ? 'aprobado' : 'pendiente'}`}>
                          {report.estado === 'aprobado' ? 'Aprobado' : 
                           report.estado === 'completado' ? 'Completado' :
                           report.estado === 'en_revision' ? 'En Revisión' :
                           report.estado === 'borrador' ? 'Borrador' :
                           report.estado === 'rechazado' ? 'Rechazado' :
                           'Pendiente'}
                        </span>
                      </div>
                      <div className="my-report-location">
                        {report.municipio}, {report.provincia}
                      </div>
                      {report.region && (
                        <div className="my-report-region">{report.region}</div>
                      )}
                      <div className="my-report-dates">
                        <MdCalendarToday size={12} />
                        <span>
                          {formatDate(report.fechaInicio || report.timestamp)}
                          {report.fechaFinal && report.fechaFinal !== report.fechaInicio && 
                            ` - ${formatDate(report.fechaFinal)}`
                          }
                        </span>
                      </div>
                      <div className="my-report-time">
                        {formatTime(report.timestamp)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="my-reports-footer">
              <button 
                className="my-reports-close-btn"
                onClick={() => setOpen(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MyReportsDropdown;
