import React, { useState } from 'react';
import ReportView from './ReportView';

// Ejemplo de cómo usar el ReportView en tu aplicación
const ReportViewExample: React.FC = () => {
  const [showReportView, setShowReportView] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  // Usuario de ejemplo
  const user = {
    username: 'usuario_ejemplo',
    role: 'Administrador'
  };

  // Función para abrir un reporte
  const handleOpenReport = (reportId: string) => {
    setSelectedReportId(reportId);
    setShowReportView(true);
  };

  // Función para cerrar el modal
  const handleCloseReportView = () => {
    setShowReportView(false);
    setSelectedReportId(null);
  };

  // Función para editar un reporte (opcional)
  const handleEditReport = (report: any) => {
    console.log('Editando reporte:', report);
    // Aquí puedes abrir tu formulario de edición
    // Por ejemplo: setShowReportForm(true); setInterventionToEdit(report);
  };

  return (
    <div>
      {/* Ejemplo de botón o lista de reportes */}
      <div style={{ padding: '20px' }}>
        <h2>Mis Reportes Guardados</h2>
        
        {/* Ejemplo: lista de reportes con clic */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[
            { id: 'reporte_1', numero: 'DCR-123456', tipo: 'Rehabilitación Camino Vecinal' },
            { id: 'reporte_2', numero: 'DCR-789012', tipo: 'Limpieza de Alcantarillas' },
            { id: 'reporte_3', numero: 'DCR-345678', tipo: 'Construcción de Terraplenes' }
          ].map(report => (
            <div 
              key={report.id}
              onClick={() => handleOpenReport(report.id)}
              style={{
                padding: '15px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 107, 0, 0.3)',
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 107, 0, 0.1)';
                e.currentTarget.style.transform = 'translateX(5px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.transform = 'translateX(0)';
              }}
            >
              <div style={{ fontWeight: '600', color: '#FF6B00' }}>
                {report.numero}
              </div>
              <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>
                {report.tipo}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal ReportView */}
      {showReportView && selectedReportId && (
        <ReportView
          reportId={selectedReportId}
          onClose={handleCloseReportView}
          onEdit={handleEditReport}
          user={user}
        />
      )}
    </div>
  );
};

export default ReportViewExample;
