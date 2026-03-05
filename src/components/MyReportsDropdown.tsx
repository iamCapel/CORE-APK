import React, { useState } from 'react';
import firebaseReportStorage from '../services/firebaseReportStorage';
import { firebasePendingReportStorage } from '../services/firebasePendingReportStorage';

// Iconos SVG simples para evitar problemas con react-icons
const BarChartIcon = ({ size = 20, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"></line>
    <line x1="12" y1="20" x2="12" y2="4"></line>
    <line x1="6" y1="20" x2="6" y2="14"></line>
  </svg>
);

const CheckCircleIcon = ({ size = 20, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
);

const PendingIcon = ({ size = 20, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12 6 12 12 16 14"></polyline>
  </svg>
);

const CalendarIcon = ({ size = 20, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
);

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
      console.log('🔄 MyReportsDropdown: Cargando reportes para usuario:', username);
      
      // Cargar reportes completados
      const allReports = await firebaseReportStorage.getAllReports();
      console.log('📊 Todos los reportes completados:', allReports);
      
      const userCompletedReports = allReports
        .filter((r) => r.creadoPor === username)
        .map((r) => ({
          id: r.id,
          reportNumber: r.numeroReporte || 'SIN-NUMERO',
          region: r.region || '',
          provincia: r.provincia || '',
          municipio: r.municipio || '',
          estado: r.estado || 'completado',
          timestamp: r.timestamp || '',
          fechaInicio: r.fechaInicio,
          fechaFinal: r.fechaFinal,
          tipoIntervencion: r.tipoIntervencion || 'Sin especificar',
          direccion: `${r.region || ''}, ${r.provincia || ''}, ${r.municipio || ''}`,
        }));
      
      // Cargar reportes pendientes
      const pendingReports = await firebasePendingReportStorage.getAllPendingReports();
      console.log('📊 Todos los reportes pendientes:', pendingReports);
      
      const userPendingReports = pendingReports
        .filter((r) => r.userId === username)
        .map((r) => ({
          id: r.id || '',
          reportNumber: `P-${r.id?.slice(-6) || '000000'}`,
          region: r.formData?.region || '',
          provincia: r.formData?.provincia || '',
          municipio: r.formData?.municipio || '',
          estado: 'pendiente' as const,
          timestamp: r.timestamp || '',
          tipoIntervencion: r.formData?.tipoIntervencion || 'Sin especificar',
          direccion: `${r.formData?.region || ''}, ${r.formData?.provincia || ''}, ${r.formData?.municipio || ''}`,
        }));
      
      // Combinar y ordenar todos los reportes
      const allUserReports = [...userPendingReports, ...userCompletedReports]
        .sort((a, b) => {
          const dateA = new Date(b.timestamp || 0).getTime();
          const dateB = new Date(a.timestamp || 0).getTime();
          return dateA - dateB;
        });
      
      console.log('✅ Reportes combinados del usuario:', allUserReports);
      console.log('📈 Totales - Pendientes:', userPendingReports.length, 'Completados:', userCompletedReports.length);
      
      setReports(allUserReports);
    } catch (error) {
      console.error('❌ Error cargando reportes del usuario:', error);
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
        <BarChartIcon size={20} />
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
                <BarChartIcon size={20} color="#FF6B00" />
                <span className="my-reports-title">Mis Reportes</span>
              </div>
              <div className="my-reports-stats">
                <div className="my-reports-stat approved">
                  <CheckCircleIcon size={14} />
                  <span>{approvedCount} Aprobados</span>
                </div>
                <div className="my-reports-stat pending">
                  <PendingIcon size={14} />
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
                        <CheckCircleIcon size={18} color="#10b981" />
                      ) : (
                        <PendingIcon size={18} color="#FF6B00" />
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
                        <CalendarIcon size={12} />
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
