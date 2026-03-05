import React, { useState } from 'react';
import './PendingReportsModal.css';

interface PendingReport {
  id: string;
  reportNumber?: string;
  numeroReporte?: string;
  timestamp: string;
  estado: string;
  region?: string;
  provincia?: string;
  municipio?: string;
  distrito?: string;
  tipoIntervencion?: string;
  creadoPor?: string;
}

interface PendingReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
  reports: PendingReport[];
  onContinueReport?: (reportId: string) => void;
  onCancelReport?: (reportId: string) => void;
}

const PendingReportsModal: React.FC<PendingReportsModalProps> = ({
  isOpen,
  onClose,
  reports,
  onContinueReport,
  onCancelReport
}) => {
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());

  if (!isOpen) return null;

  const formatDate = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('es-ES', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Fecha inválida';
    }
  };

  const getReportNumber = (report: PendingReport) => {
    if (report.numeroReporte) return report.numeroReporte;
    if (report.reportNumber) return report.reportNumber;
    
    const year = new Date().getFullYear();
    const match = report.id.match(/(\d+)$/);
    if (match) {
      return `P-${year}-${match[1].slice(-6).padStart(6, '0')}`;
    }
    return `P-${year}-${report.id.slice(-6)}`;
  };

  const handleContinue = (reportId: string) => {
    if (onContinueReport) {
      onContinueReport(reportId);
      onClose();
    }
  };

  const handleCancel = async (reportId: string) => {
    if (window.confirm('¿Estás seguro de cancelar este reporte pendiente?')) {
      setRemovingIds(prev => new Set(prev).add(reportId));
      await new Promise(resolve => setTimeout(resolve, 300));
      if (onCancelReport) {
        onCancelReport(reportId);
      }
      setRemovingIds(prev => {
        const next = new Set(prev);
        next.delete(reportId);
        return next;
      });
    }
  };

  return (
    <div className="pending-modal-overlay" onClick={onClose}>
      <div className="pending-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="pending-modal-header">
          <div className="pending-modal-header-content">
            <div className="pending-modal-header-text">
              <h2 className="pending-modal-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
                Notificaciones
              </h2>
              <p className="pending-modal-subtitle">
                {reports.length} {reports.length === 1 ? 'reporte pendiente' : 'reportes pendientes'}
              </p>
            </div>
            <button className="pending-modal-close" onClick={onClose}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        {/* Lista de reportes */}
        <div className="pending-modal-content">
          {reports.length === 0 ? (
            <div className="pending-modal-empty">
              <div className="pending-modal-empty-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
              </div>
              <p className="pending-modal-empty-title">Sin notificaciones</p>
              <p className="pending-modal-empty-subtitle">Todos los reportes están al día</p>
            </div>
          ) : (
            <div className="pending-modal-list">
              {reports.map((report) => {
                const isRemoving = removingIds.has(report.id);
                return (
                  <div
                    key={report.id}
                    className={`pending-report-card ${isRemoving ? 'removing' : ''}`}
                  >
                    <div className="pending-report-indicator"></div>
                    
                    <div className="pending-report-main">
                      <div className="pending-report-header">
                        <div className="pending-report-type">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                            <line x1="16" y1="17" x2="8" y2="17"></line>
                            <polyline points="10 9 9 9 8 9"></polyline>
                          </svg>
                          {report.tipoIntervencion || 'Intervención'}
                        </div>
                        <span className="pending-report-number">
                          {getReportNumber(report)}
                        </span>
                      </div>

                      <div className="pending-report-location">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                          <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                        <strong>{report.provincia || 'Provincia'}</strong>
                        {report.municipio && <span>• {report.municipio}</span>}
                        {report.distrito && <span>• {report.distrito}</span>}
                      </div>

                      <div className="pending-report-meta">
                        <span className="pending-report-time">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                          </svg>
                          {formatDate(report.timestamp)}
                        </span>
                        {report.creadoPor && (
                          <span className="pending-report-user">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                              <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                            {report.creadoPor}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="pending-report-actions">
                      {onCancelReport && (
                        <button
                          className="pending-action-delete"
                          onClick={() => handleCancel(report.id)}
                          title="Eliminar reporte"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          </svg>
                        </button>
                      )}
                      {onContinueReport && (
                        <button
                          className="pending-action-continue"
                          onClick={() => handleContinue(report.id)}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                          </svg>
                          Continuar
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PendingReportsModal;