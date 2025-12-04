import React, { useState } from 'react';

interface PendingReport {
  id: string;
  reportNumber: string;
  timestamp: string;
  estado: string;
  region?: string;
  provincia?: string;
  municipio?: string;
  tipoIntervencion?: string;
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

  const getReportNumber = (reportId: string) => {
    const match = reportId.match(/(\d+)$/);
    const year = new Date().getFullYear();
    if (match) {
      return `DCR-${year}-${match[1].slice(-6).padStart(6, '0')}`;
    }
    const timestamp = Date.now();
    return `DCR-${year}-${timestamp.toString().slice(-6)}`;
  };

  const handleCancelWithAnimation = (reportId: string) => {
    if (window.confirm('¿Eliminar este reporte pendiente?')) {
      // Agregar el ID a la lista de elementos que se están eliminando
      setRemovingIds(prev => new Set(prev).add(reportId));
      
      // Esperar a que termine la animación antes de eliminar
      setTimeout(() => {
        if (onCancelReport) {
          onCancelReport(reportId);
        }
        // Limpiar el ID de la lista de removidos
        setRemovingIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(reportId);
          return newSet;
        });
      }, 400); // Duración de la animación
    }
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        animation: 'fadeIn 0.2s ease',
        padding: '0'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          backgroundColor: '#fff',
          borderRadius: '12px',
          padding: '0',
          width: '100%',
          maxWidth: '390px',
          maxHeight: '85vh',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          position: 'relative',
          animation: 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          margin: '0 16px'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #ff7a00 0%, #ff9a3d 100%)',
          padding: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(0, 0, 0, 0.1)'
        }}>
          <div>
            <h3 style={{ 
              margin: 0, 
              color: 'white', 
              fontSize: '18px',
              fontWeight: '700',
              letterSpacing: '-0.3px'
            }}>
              Notificaciones
            </h3>
            <p style={{ 
              margin: '2px 0 0 0', 
              color: 'rgba(255, 255, 255, 0.9)', 
              fontSize: '12px',
              fontWeight: '500'
            }}>
              {reports.length} {reports.length === 1 ? 'pendiente' : 'pendientes'}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.25)',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              cursor: 'pointer',
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              fontWeight: '400'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.35)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
            }}
          >
            ✕
          </button>
        </div>

        {/* Lista de notificaciones */}
        <div style={{
          padding: '12px',
          maxHeight: 'calc(85vh - 76px)',
          overflowY: 'auto',
          backgroundColor: '#f0f2f5'
        }}>
          {reports.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: '#999'
            }}>
              <div style={{ fontSize: '56px', marginBottom: '16px', opacity: 0.5 }}>🔔</div>
              <p style={{ fontSize: '16px', margin: 0, fontWeight: '600', color: '#666' }}>Sin notificaciones</p>
              <p style={{ fontSize: '13px', margin: '8px 0 0 0', color: '#999' }}>Todos los reportes están al día</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {reports.map((report) => {
                const isRemoving = removingIds.has(report.id);
                return (
                  <div
                    key={report.id}
                    style={{
                      backgroundColor: 'white',
                      borderRadius: '12px',
                      padding: '12px',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                      border: '1px solid #e4e6eb',
                      transition: 'all 0.3s ease',
                      position: 'relative',
                      opacity: isRemoving ? 0 : 1,
                      transform: isRemoving ? 'translateX(100px) scale(0.8)' : 'translateX(0) scale(1)',
                      maxHeight: isRemoving ? '0px' : '500px',
                      overflow: 'hidden',
                      marginBottom: isRemoving ? '0px' : '0px',
                      pointerEvents: isRemoving ? 'none' : 'auto'
                    }}
                  >
                  {/* Contenido del reporte */}
                  <div style={{ marginBottom: '10px' }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '6px'
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#050505',
                          marginBottom: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                          <span style={{
                            display: 'inline-block',
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            backgroundColor: '#ff7a00',
                            animation: 'pulse 2s infinite'
                          }}></span>
                          {report.tipoIntervencion || 'Intervención'}
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: '#65676b',
                          marginBottom: '3px'
                        }}>
                          📍 <strong>{report.provincia}</strong> • {report.municipio || 'N/A'}
                        </div>
                        <div style={{
                          fontSize: '11px',
                          color: '#8a8d91',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          flexWrap: 'wrap'
                        }}>
                          <span>🕐 {formatDate(report.timestamp)}</span>
                          <span style={{
                            backgroundColor: '#f0f2f5',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: '600',
                            color: '#65676b'
                          }}>
                            {getReportNumber(report.id)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Botones de acción */}
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    justifyContent: 'flex-end'
                  }}>
                    {/* Botón Cancelar (Rojo) */}
                    {onCancelReport && (
                      <button
                        onClick={() => handleCancelWithAnimation(report.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '6px 12px',
                          backgroundColor: 'white',
                          color: '#e74c3c',
                          border: '1px solid #e74c3c',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '600',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#e74c3c';
                          e.currentTarget.style.color = 'white';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'white';
                          e.currentTarget.style.color = '#e74c3c';
                        }}
                      >
                        <span style={{ fontSize: '12px' }}>✕</span>
                        Cancelar
                      </button>
                    )}

                    {/* Botón Continuar (Verde) */}
                    {onContinueReport && (
                      <button
                        onClick={() => onContinueReport(report.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '6px 12px',
                          backgroundColor: '#27ae60',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '600',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#229954';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#27ae60';
                        }}
                      >
                        Continuar
                        <span style={{ fontSize: '12px' }}>→</span>
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

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(50px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.6;
            transform: scale(0.9);
          }
        }
      `}</style>
    </div>
  );
};

export default PendingReportsModal;