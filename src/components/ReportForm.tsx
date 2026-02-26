import React, { useState, useEffect } from 'react';
import { reportStorage } from '../services/reportStorage';
import { firebasePendingReportStorage } from '../services/firebasePendingReportStorage';
import firebaseReportStorage from '../services/firebaseReportStorage';
import PendingClockAnimation from './PendingClockAnimation';
import PendingReportsModal from './PendingReportsModal';
import { ModernSelect, ModernSelectOption } from './ModernSelect';
import { ModernInput } from './ModernInput';
import { ModernFormContainer } from './ModernFormContainer';
import './ModernDashboard.css';

type Field = { key: string; label: string; type: 'text' | 'number'; unit: string };

interface User {
  username: string;
  name: string;
}

interface ReportFormProps {
  user: User;
  onBack: () => void;
  plantillaDefault: Field[];
  regionesRD: string[];
  provinciasPorRegion: Record<string, string[]>;
  municipiosPorProvincia: Record<string, string[]>;
  sectoresPorProvincia: Record<string, string[]>;
  distritosPorProvincia: Record<string, string[]>;
  distritosPorMunicipio: Record<string, string[]>;
  opcionesIntervencion: string[];
  canalOptions: string[];
  plantillasPorIntervencion: Record<string, Field[]>;
  interventionToEdit?: any;
  isGpsEnabled?: boolean;
  gpsPosition?: { lat: number; lon: number } | null;
}

const ReportForm: React.FC<ReportFormProps> = ({
  user,
  onBack,
  plantillaDefault,
  regionesRD,
  provinciasPorRegion,
  municipiosPorProvincia,
  sectoresPorProvincia,
  distritosPorProvincia,
  distritosPorMunicipio,
  opcionesIntervencion,
  canalOptions,
  plantillasPorIntervencion,
  interventionToEdit,
  isGpsEnabled: parentGpsEnabled = false,
  gpsPosition: parentGpsPosition = null
}) => {
  // Estados del formulario
  const [region, setRegion] = useState('');
  const [provincia, setProvincia] = useState('');
  const [distrito, setDistrito] = useState('');
  const [municipio, setMunicipio] = useState('');
  const [sector, setSector] = useState('');
  const [sectorPersonalizado, setSectorPersonalizado] = useState('');
  const [mostrarSectorPersonalizado, setMostrarSectorPersonalizado] = useState(false);
  const [distritoPersonalizado, setDistritoPersonalizado] = useState('');
  const [mostrarDistritoPersonalizado, setMostrarDistritoPersonalizado] = useState(false);
  const [fechaReporte, setFechaReporte] = useState('');
  
  // Estados para sistema multi-día
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFinal, setFechaFinal] = useState('');
  const [diasTrabajo, setDiasTrabajo] = useState<string[]>([]);
  const [diaActual, setDiaActual] = useState(0);
  const [reportesPorDia, setReportesPorDia] = useState<Record<string, any>>({});
  
  const [tipoIntervencion, setTipoIntervencion] = useState('');
  const [subTipoCanal, setSubTipoCanal] = useState('');
  const [observaciones, setObservaciones] = useState('');

  // Estados para vehículos
  const [vehiculos, setVehiculos] = useState<Array<{tipo: string, modelo: string, ficha: string}>>([]);
  const [tipoVehiculoActual, setTipoVehiculoActual] = useState('');
  const [modeloVehiculoActual, setModeloVehiculoActual] = useState('');
  const [fichaVehiculoActual, setFichaVehiculoActual] = useState('');

  const [plantillaFields, setPlantillaFields] = useState<Field[]>(plantillaDefault);
  const [plantillaValues, setPlantillaValues] = useState<Record<string, string>>({});

  // Estado para animación de guardado
  const [showSaveAnimation, setShowSaveAnimation] = useState(false);
  const [showPendingAnimation, setShowPendingAnimation] = useState(false);
  const [currentPendingReportId, setCurrentPendingReportId] = useState<string | null>(null);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [pendingReportsList, setPendingReportsList] = useState<any[]>([]);
  const [isLoadingPendingData, setIsLoadingPendingData] = useState(false);
  const [isUnmounting, setIsUnmounting] = useState(false);

  // GPS state
  const [gpsEnabled, setGpsEnabled] = useState(parentGpsEnabled);
  const [gpsStatus, setGpsStatus] = useState('');
  const [pendingCoords, setPendingCoords] = useState<{lat: number, lon: number} | null>(null);
  const [targetField, setTargetField] = useState<{key: string, label: string} | null>(null);
  const [approvedGpsFields, setApprovedGpsFields] = useState<Set<string>>(new Set());
  const [rejectedGpsFields, setRejectedGpsFields] = useState<Set<string>>(new Set());
  const [autoGpsFields, setAutoGpsFields] = useState<Record<string, {lat: number, lon: number}>>({});

  // Si el dashboard ya habilitó GPS y proporcionó una posición, usarla como autoGpsFields
  useEffect(() => {
    if (parentGpsEnabled && parentGpsPosition) {
      setAutoGpsFields(prev => ({
        ...prev,
        punto_inicial: { lat: parentGpsPosition.lat, lon: parentGpsPosition.lon },
        punto_alcanzado: { lat: parentGpsPosition.lat, lon: parentGpsPosition.lon }
      }));
      setGpsStatus('GPS habilitado desde el sistema');
      setGpsEnabled(true);
    }
  }, [parentGpsEnabled, parentGpsPosition]);

  // Sincronizar GPS del parent
  useEffect(() => {
    setGpsEnabled(parentGpsEnabled);
    if (parentGpsEnabled && parentGpsPosition) {
      setGpsStatus('GPS habilitado desde el sistema');
    }
  }, [parentGpsEnabled, parentGpsPosition]);

  // Efecto para calcular días entre fechas
  useEffect(() => {
    if (isLoadingPendingData) {
      console.log('⏸️ Saltando auto-generación de días - cargando datos pendientes');
      return;
    }
    
    if (fechaInicio && fechaFinal) {
      const inicio = new Date(fechaInicio);
      const final = new Date(fechaFinal);
      
      if (final >= inicio) {
        const dias: string[] = [];
        const current = new Date(inicio);
        
        while (current <= final) {
          dias.push(current.toISOString().split('T')[0]);
          current.setDate(current.getDate() + 1);
        }
        
        setDiasTrabajo(dias);
        setDiaActual(0);
        
        const nuevosReportes: Record<string, any> = {};
        dias.forEach(dia => {
          if (!reportesPorDia[dia]) {
            nuevosReportes[dia] = {
              fecha: dia,
              tipoIntervencion: '',
              subTipoCanal: '',
              observaciones: '',
              vehiculos: [],
              plantillaValues: {},
              autoGpsFields: {},
              completado: false
            };
          } else {
            nuevosReportes[dia] = reportesPorDia[dia];
          }
        });
        setReportesPorDia(nuevosReportes);
      }
    }
  }, [fechaInicio, fechaFinal, isLoadingPendingData]);

  // Cargar reportes pendientes cuando se abre el modal
  useEffect(() => {
    if (showPendingModal) {
      console.log('📥 Modal de pendientes abierto, cargando reportes...');
      getPendingReports();
    }
  }, [showPendingModal]);

  // Lógica de habilitación de campos
  const provinciasDisponibles = region ? provinciasPorRegion[region] || [] : [];
  const municipiosDisponibles = provincia ? municipiosPorProvincia[provincia] || [] : [];
  const distritosDisponibles = municipio ? distritosPorMunicipio[municipio] || [] : [];
  const sectoresDisponibles = provincia ? sectoresPorProvincia[provincia] || [] : [];
  
  // Verificar si todos los campos geográficos están completos
  const distritoFinal = distrito === 'otros' ? distritoPersonalizado : distrito;
  const camposGeograficosCompletos = region && provincia && distritoFinal && municipio && (sector || (sector === 'otros' && sectorPersonalizado));

  // Cargar intervención para editar si se proporciona
  useEffect(() => {
    if (interventionToEdit) {
      setIsLoadingPendingData(true);
      
      console.log('🔄 ReportForm: Cargando interventionToEdit:', interventionToEdit);
      console.log('🔍 Claves del objeto:', Object.keys(interventionToEdit));
      
      if (interventionToEdit._pendingReportId) {
        console.log('📌 Estableciendo currentPendingReportId:', interventionToEdit._pendingReportId);
        setCurrentPendingReportId(interventionToEdit._pendingReportId);
      }
      
      setRegion(interventionToEdit.region || '');
      setProvincia(interventionToEdit.provincia || '');
      setDistrito(interventionToEdit.distrito || '');
      setMunicipio(interventionToEdit.municipio || '');
      setSector(interventionToEdit.sector || '');
      setSectorPersonalizado(interventionToEdit.sectorPersonalizado || '');
      setMostrarSectorPersonalizado(interventionToEdit.mostrarSectorPersonalizado || false);
      setDistritoPersonalizado(interventionToEdit.distritoPersonalizado || '');
      setMostrarDistritoPersonalizado(interventionToEdit.mostrarDistritoPersonalizado || false);
      setFechaReporte(interventionToEdit.fechaReporte || '');
      setTipoIntervencion(interventionToEdit.tipoIntervencion || '');
      setSubTipoCanal(interventionToEdit.subTipoCanal || '');
      setObservaciones(interventionToEdit.observaciones || '');
      setVehiculos(interventionToEdit.vehiculos || []);
      setPlantillaValues(interventionToEdit.plantillaValues || {});
      
      if (interventionToEdit.diasTrabajo) {
        setDiasTrabajo(interventionToEdit.diasTrabajo);
        setDiaActual(interventionToEdit.diaActual || 0);
        setReportesPorDia(interventionToEdit.reportesPorDia || {});
        setFechaInicio(interventionToEdit.fechaInicio || '');
        setFechaFinal(interventionToEdit.fechaFinal || '');
      }
      
      setIsLoadingPendingData(false);
    }
  }, [interventionToEdit]);

  // Handlers para cambios
  const handleRegionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setRegion(value);
    setProvincia('');
    setDistrito('');
    setMunicipio('');
    setSector('');
    setSectorPersonalizado('');
    setMostrarSectorPersonalizado(false);
    setDistritoPersonalizado('');
    setMostrarDistritoPersonalizado(false);
    setTipoIntervencion('');
    setSubTipoCanal('');
  };

  const handleProvinciaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setProvincia(value);
    setDistrito('');
    setMunicipio('');
    setSector('');
    setSectorPersonalizado('');
    setMostrarSectorPersonalizado(false);
    setDistritoPersonalizado('');
    setMostrarDistritoPersonalizado(false);
    setTipoIntervencion('');
    setSubTipoCanal('');
  };

  const handleMunicipioChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setMunicipio(value);
    setDistrito('');
    setSector('');
    setSectorPersonalizado('');
    setMostrarSectorPersonalizado(false);
    setDistritoPersonalizado('');
    setMostrarDistritoPersonalizado(false);
    setTipoIntervencion('');
    setSubTipoCanal('');
  };

  const handleDistritoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setDistrito(value);
    if (value === 'otros') {
      setMostrarDistritoPersonalizado(true);
    } else {
      setMostrarDistritoPersonalizado(false);
      setDistritoPersonalizado('');
    }
    setSector('');
    setSectorPersonalizado('');
    setMostrarSectorPersonalizado(false);
    setTipoIntervencion('');
    setSubTipoCanal('');
  };

  const handleSectorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSector(value);
    setTipoIntervencion('');
    setSubTipoCanal('');
    
    if (value === 'otros') {
      setMostrarSectorPersonalizado(true);
      setSectorPersonalizado('');
    } else {
      setMostrarSectorPersonalizado(false);
      setSectorPersonalizado('');
    }
  };

  const handleTipoIntervencionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTipoIntervencion(e.target.value);
    setSubTipoCanal('');
    setPlantillaValues({});
  };

  const handlePlantillaChange = (key: string, value: string) => {
    setPlantillaValues(prev => ({...prev, [key]: value}));
  };

  // Funciones para sistema multi-día
  const guardarDiaActual = () => {
    if (diasTrabajo.length === 0) return;
    
    const diaKey = diasTrabajo[diaActual];
    setReportesPorDia(prev => ({
      ...prev,
      [diaKey]: {
        fecha: diaKey,
        tipoIntervencion,
        subTipoCanal,
        observaciones,
        vehiculos: [...vehiculos],
        plantillaValues: {...plantillaValues},
        autoGpsFields: {...autoGpsFields},
        completado: true
      }
    }));
  };

  const cargarDia = (index: number) => {
    if (index < 0 || index >= diasTrabajo.length) return;
    
    guardarDiaActual();
    
    const diaKey = diasTrabajo[index];
    const reporteDia = reportesPorDia[diaKey];
    
    if (reporteDia) {
      setTipoIntervencion(reporteDia.tipoIntervencion || '');
      setSubTipoCanal(reporteDia.subTipoCanal || '');
      setObservaciones(reporteDia.observaciones || '');
      setVehiculos(reporteDia.vehiculos || []);
      setPlantillaValues(reporteDia.plantillaValues || {});
      setAutoGpsFields(reporteDia.autoGpsFields || {});
    }
    
    setDiaActual(index);
  };

  const cambiarDia = (direccion: 'anterior' | 'siguiente') => {
    const nuevoDia = direccion === 'anterior' ? diaActual - 1 : diaActual + 1;
    cargarDia(nuevoDia);
  };

  const limpiarFormulario = () => {
    setRegion('');
    setProvincia('');
    setDistrito('');
    setMunicipio('');
    setSector('');
    setSectorPersonalizado('');
    setMostrarSectorPersonalizado(false);
    setDistritoPersonalizado('');
    setMostrarDistritoPersonalizado(false);
    setFechaInicio('');
    setFechaFinal('');
    setDiasTrabajo([]);
    setDiaActual(0);
    setReportesPorDia({});
    setTipoIntervencion('');
    setSubTipoCanal('');
    setObservaciones('');
    setVehiculos([]);
    setTipoVehiculoActual('');
    setModeloVehiculoActual('');
    setFichaVehiculoActual('');
    setPlantillaValues({});
  };

  const guardarIntervencion = () => {
    const sectorFinal = sector === 'otros' ? sectorPersonalizado : sector;
    const distritoFinal = distrito === 'otros' ? distritoPersonalizado : distrito;
    
    // Validación para sistema multi-día
    const hayReportesGuardados = Object.values(reportesPorDia).some((r: any) => r.tipoIntervencion);
    
    if (diasTrabajo.length > 0 && hayReportesGuardados) {
      console.log('🔄 Modo multi-día detectado:', { diasTrabajo, reportesPorDia });
      
      if (!region || !provincia || !distritoFinal || !sectorFinal) {
        alert('Por favor complete todos los campos geográficos requeridos');
        return;
      }
      
      // Guardar todos los días
      const reportes: any[] = [];
      diasTrabajo.forEach((dia, index) => {
        const reporteDia = reportesPorDia[dia];
        if (reporteDia && reporteDia.completado) {
          const reportData = {
            timestamp: dia + 'T12:00:00',
            fechaCreacion: dia + 'T12:00:00',
            creadoPor: user?.name || 'Desconocido',
            usuarioId: user?.username || 'desconocido',
            region,
            provincia,
            distrito: distritoFinal,
            municipio,
            sector: sectorFinal,
            tipoIntervencion: reporteDia.tipoIntervencion === 'Canalización' ? `${reporteDia.tipoIntervencion}:${reporteDia.subTipoCanal}` : reporteDia.tipoIntervencion,
            subTipoCanal: reporteDia.tipoIntervencion === 'Canalización' ? reporteDia.subTipoCanal : undefined,
            observaciones: reporteDia.observaciones || undefined,
            metricData: reporteDia.plantillaValues,
            gpsData: reporteDia.autoGpsFields,
            vehiculos: reporteDia.vehiculos,
            estado: 'completado' as const,
            diasTrabajo: diasTrabajo,
            reportesPorDia: reportesPorDia,
            fechaInicio: fechaInicio,
            fechaFinal: fechaFinal,
            diaActual: index
          };
          reportes.push(reportData);
        }
      });
      
      // Guardar todos los reportes
      Promise.all(reportes.map(async (reportData) => {
        const savedReport = await reportStorage.saveReport(reportData);
        await firebaseReportStorage.saveReport(savedReport);
        return savedReport;
      })).then(() => {
        console.log('✅ Todos los reportes multi-día guardados exitosamente');
        setShowSaveAnimation(true);
        setTimeout(() => {
          setShowSaveAnimation(false);
          alert(`✅ ${reportes.length} reportes guardados exitosamente`);
          limpiarFormulario();
        }, 2000);
      }).catch(error => {
        console.error('❌ Error guardando reportes multi-día:', error);
        alert('Error al guardar los reportes. Verifique su conexión a internet.');
      });
      
      return;
    }
    
    // Flujo normal (un solo día)
    if (!region || !provincia || !distritoFinal || !sectorFinal || !tipoIntervencion) {
      alert('Por favor complete todos los campos requeridos');
      return;
    }
    
    setShowSaveAnimation(true);
    
    setTimeout(async () => {
      try {
        const reportData = {
          timestamp: fechaReporte ? new Date(fechaReporte).toISOString() : new Date().toISOString(),
          fechaCreacion: fechaReporte ? new Date(fechaReporte).toISOString() : new Date().toISOString(),
          creadoPor: user?.name || 'Desconocido',
          usuarioId: user?.username || 'desconocido',
          region,
          provincia,
          distrito: distritoFinal,
          municipio,
          sector: sectorFinal,
          tipoIntervencion: tipoIntervencion === 'Canalización' ? `${tipoIntervencion}:${subTipoCanal}` : tipoIntervencion,
          subTipoCanal: tipoIntervencion === 'Canalización' ? subTipoCanal : undefined,
          observaciones: observaciones || undefined,
          metricData: plantillaValues,
          gpsData: autoGpsFields,
          vehiculos: vehiculos,
          estado: 'completado' as const,
          diasTrabajo: diasTrabajo.length > 0 ? diasTrabajo : undefined,
          reportesPorDia: diasTrabajo.length > 0 ? reportesPorDia : undefined,
          fechaInicio: fechaInicio || undefined,
          fechaFinal: fechaFinal || undefined,
          diaActual: diasTrabajo.length > 0 ? diaActual : undefined
        };
        
        const savedReport = await reportStorage.saveReport(reportData);
        await firebaseReportStorage.saveReport(savedReport);
        
        console.log('✅ Reporte guardado exitosamente');
        
        setTimeout(() => {
          setShowSaveAnimation(false);
          alert('✅ 1 reporte guardado exitosamente');
          limpiarFormulario();
        }, 2000);
      } catch (error) {
        console.error('❌ Error al guardar reporte:', error);
        setShowSaveAnimation(false);
        alert('Error al guardar el reporte. Verifique su conexión a internet e intente nuevamente.');
      }
    }, 500);
  };

  const handleGuardar = (e: React.FormEvent) => {
    e.preventDefault();
    guardarIntervencion();
  };

  // GPS Functions
  const handleCoordinateFieldClick = (fieldKey: string, fieldLabel: string) => {
    if (!gpsEnabled) {
      if ('geolocation' in navigator) {
        setGpsStatus('Solicitando permiso de geolocalización...');
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setGpsEnabled(true);
            const coords = { lat: pos.coords.latitude, lon: pos.coords.longitude };
            setPendingCoords(coords);
            setTargetField({ key: fieldKey, label: fieldLabel });
            setGpsStatus(`Ubicación encontrada: ${coords.lat.toFixed(6)}, ${coords.lon.toFixed(6)}`);
          },
          (err) => {
            setGpsStatus('Permiso de geolocalización denegado o no disponible.');
            alert('Por favor habilite el GPS en su dispositivo y recargue la página.');
          },
          { enableHighAccuracy: true, timeout: 8000 }
        );
        return;
      } else {
        setGpsStatus('Geolocalización no soportada.');
        return;
      }
    }

    if (!('geolocation' in navigator)) {
      setGpsStatus('Geolocalización no soportada.');
      return;
    }

    setGpsStatus('Buscando ubicación...');
    setTargetField({ key: fieldKey, label: fieldLabel });

    navigator.geolocation.getCurrentPosition(
      pos => {
        const coords = {
          lat: pos.coords.latitude,
          lon: pos.coords.longitude
        };
        
        setPendingCoords(coords);
        setGpsStatus(`Ubicación encontrada: ${coords.lat.toFixed(6)}, ${coords.lon.toFixed(6)}`);
      },
      error => {
        let errorMsg = 'Error GPS: ';
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMsg += 'Permiso denegado. Active la ubicación en su navegador.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg += 'Ubicación no disponible.';
            break;
          case error.TIMEOUT:
            errorMsg += 'Tiempo agotado.';
            break;
          default:
            errorMsg += 'Error desconocido.';
        }
        setGpsStatus(errorMsg);
        setTargetField(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  const toggleGps = () => {
    if (!('geolocation' in navigator)) {
      setGpsStatus('Geolocalización no soportada.');
      return;
    }
    setGpsEnabled(v => !v);
    if (gpsEnabled) {
      setGpsStatus('');
      setPendingCoords(null);
      setTargetField(null);
      setApprovedGpsFields(new Set());
      setAutoGpsFields({});
    } else {
      setGpsStatus('');
    }
  };

  // Funciones para manejar coordenadas automáticas
  const acceptAutoGps = (fieldKey: string) => {
    const coords = autoGpsFields[fieldKey];
    if (coords) {
      const coordsString = `${coords.lat.toFixed(6)}, ${coords.lon.toFixed(6)}`;
      setPlantillaValues(prev => ({ ...prev, [fieldKey]: coordsString }));
      setApprovedGpsFields(prev => new Set(prev).add(fieldKey));
      setRejectedGpsFields(prev => {
        const newSet = new Set(prev);
        newSet.delete(fieldKey);
        return newSet;
      });
      
      setAutoGpsFields(prev => {
        const newFields = { ...prev };
        delete newFields[fieldKey];
        return newFields;
      });
      
      setGpsStatus(`Coordenadas aceptadas para ${fieldKey}`);
    }
  };

  const rejectAutoGps = (fieldKey: string) => {
    setAutoGpsFields(prev => {
      const newFields = { ...prev };
      delete newFields[fieldKey];
      return newFields;
    });
    setRejectedGpsFields(prev => new Set(prev).add(fieldKey));
    setGpsStatus(`Campo ${fieldKey} disponible para entrada manual`);
  };

  // Función para verificar si todos los campos están completos
  const areAllRegistrosCompleted = () => {
    const distritoFinal = distrito === 'otros' ? distritoPersonalizado : distrito;
    const sectorFinal = sector === 'otros' ? sectorPersonalizado : sector;
    const basicFieldsCompleted = region && provincia && distritoFinal && sectorFinal && tipoIntervencion;
    
    if (tipoIntervencion === 'Canalización') {
      return basicFieldsCompleted && subTipoCanal;
    }
    
    return basicFieldsCompleted;
  };

  // Funciones para manejo de reportes pendientes
  const getPendingReports = async () => {
    try {
      const reports = await firebasePendingReportStorage.getAllPendingReports();
      setPendingReportsList(reports || []);
      setPendingCount(reports ? reports.length : 0);
    } catch (error) {
      console.error('Error obteniendo reportes pendientes:', error);
      setPendingReportsList([]);
      setPendingCount(0);
    }
  };

  const handleContinuePendingReport = (report: any) => {
    console.log('🔄 Continuando reporte pendiente:', report);
    // Aquí puedes implementar la lógica para continuar editando un reporte pendiente
  };

  const handleCancelPendingReport = async (reportId: string) => {
    if (window.confirm('¿Está seguro de que desea cancelar este reporte pendiente?')) {
      try {
        await firebasePendingReportStorage.deletePendingReport(reportId);
        console.log('✅ Reporte pendiente cancelado');
        getPendingReports(); // Actualizar la lista
      } catch (error) {
        console.error('❌ Error cancelando reporte pendiente:', error);
        alert('Error al cancelar el reporte pendiente');
      }
    }
  };

  return (
    <div className="dashboard">
      {/* Topbar moderna */}
      <div className="topbar-modern">
        <button 
          onClick={onBack}
          title="Volver al Dashboard" 
          className="topbar-back-button-modern"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
          </svg>
        </button>

        <div className="topbar-title-modern">MOPC - Sistema de Obras</div>

        <div className="topbar-actions-modern">
          <div className="topbar-action-button-modern" onClick={() => setShowPendingModal(true)}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
            </svg>
            {pendingCount > 0 && (
              <span className="topbar-badge-modern">{pendingCount > 99 ? '99+' : pendingCount}</span>
            )}
          </div>
        </div>
      </div>

      <div className="dashboard-content-modern">
        <ModernFormContainer 
          title={interventionToEdit ? '📝 Editar Intervención' : '📋 Registro de Obras Realizadas'}
          subtitle="Complete todos los campos requeridos para registrar la intervención"
          icon="🏗️"
        >
          {/* Sección de ubicación */}
          <div className="form-grid">
            <ModernSelect
              id="region"
              icon="🗺️"
              hint="Región"
              placeholder="Seleccionar región"
              value={region}
              options={regionesRD.map(r => ({ value: r, label: r }))}
              required
              onChange={val => handleRegionChange({ target: { value: val } } as React.ChangeEvent<HTMLSelectElement>)}
            />

            <ModernSelect
              id="provincia"
              icon="📍"
              hint="Provincia"
              placeholder={region ? 'Seleccionar provincia' : '— primero región —'}
              value={provincia}
              options={provinciasDisponibles.map(p => ({ value: p, label: p }))}
              disabled={!region}
              required
              onChange={val => handleProvinciaChange({ target: { value: val } } as React.ChangeEvent<HTMLSelectElement>)}
            />

            <ModernSelect
              id="municipio"
              icon="🏘️"
              hint="Municipio"
              placeholder={provincia ? 'Seleccionar municipio' : '— primero provincia —'}
              value={municipio}
              options={municipiosDisponibles.map(m => ({ value: m, label: m }))}
              disabled={!provincia}
              required
              onChange={val => handleMunicipioChange({ target: { value: val } } as React.ChangeEvent<HTMLSelectElement>)}
            />

            <ModernSelect
              id="distrito"
              icon="🏙️"
              hint="Distrito Mpal."
              placeholder={municipio ? 'Seleccionar distrito municipal' : '— primero municipio —'}
              value={distrito}
              options={[
                ...distritosDisponibles.map(d => ({ value: d, label: d })),
                { value: 'otros', label: '➕ Agregar nuevo distrito municipal', special: true }
              ]}
              disabled={!municipio}
              required
              onChange={val => handleDistritoChange({ target: { value: val } } as React.ChangeEvent<HTMLSelectElement>)}
            />
            
            {mostrarDistritoPersonalizado && (
              <ModernInput
                id="distritoPersonalizado"
                type="text"
                label="Nombre del distrito municipal"
                placeholder="Escriba el nombre del distrito municipal"
                value={distritoPersonalizado}
                onChange={(val) => setDistritoPersonalizado(String(val))}
                required
                icon="🏙️"
              />
            )}

            <ModernSelect
              id="sector"
              icon="📌"
              hint="Sector o Localidad"
              placeholder={distrito ? 'Seleccionar sector o localidad' : '— primero distrito —'}
              value={sector}
              options={[
                ...sectoresDisponibles.map(s => ({ value: s, label: s })),
                { value: 'otros', label: '➕ Otros (Agregar nuevo sector o localidad)', special: true }
              ]}
              disabled={!distrito}
              required
              onChange={val => handleSectorChange({ target: { value: val } } as React.ChangeEvent<HTMLSelectElement>)}
            />

            {mostrarSectorPersonalizado && (
              <ModernInput
                id="sectorPersonalizado"
                type="text"
                label="Nombre del nuevo sector"
                placeholder="Escriba el nombre del sector o localidad..."
                value={sectorPersonalizado}
                onChange={(val) => setSectorPersonalizado(String(val))}
                required
                icon="📍"
                autoFocus
              />
            )}

            <ModernInput
              id="fechaInicio"
              type="date"
              label="📅 Fecha de Inicio del Proyecto"
              placeholder="Seleccionar fecha de inicio"
              value={fechaInicio}
              onChange={(val) => setFechaInicio(String(val))}
              icon="📅"
            />

            <ModernInput
              id="fechaFinal"
              type="date"
              label="📅 Fecha Final del Proyecto"
              placeholder="Seleccionar fecha final"
              value={fechaFinal}
              onChange={(val) => setFechaFinal(String(val))}
              disabled={!fechaInicio}
              icon="📅"
            />
          </div>

          {/* Sección de tipo de intervención */}
          <div className="form-grid">
            <ModernSelect
              id="tipoIntervencion"
              icon="🛠️"
              hint="Tipo de Intervención"
              placeholder="Seleccionar tipo"
              value={tipoIntervencion}
              options={opcionesIntervencion.map(opcion => ({ value: opcion, label: opcion }))}
              disabled={!camposGeograficosCompletos}
              required
              onChange={val => handleTipoIntervencionChange({ target: { value: val } } as React.ChangeEvent<HTMLSelectElement>)}
            />

            {tipoIntervencion === 'Canalización' && (
              <ModernSelect
                id="subTipoCanal"
                icon="💧"
                hint="Tipo de Canal"
                placeholder="Seleccionar tipo de canal"
                value={subTipoCanal}
                options={canalOptions.map(opcion => ({ value: opcion, label: opcion }))}
                required
                onChange={(val) => setSubTipoCanal(String(val))}
              />
            )}
          </div>

          {/* Botones de acción */}
          <div className="form-actions">
            <button 
              type="button" 
              onClick={guardarIntervencion} 
              className="btn btn-primary"
            >
              {diasTrabajo.length > 0 ? `Guardar ${diasTrabajo.length} días` : 'Guardar'}
            </button>

            <button 
              type="button" 
              onClick={limpiarFormulario} 
              className="btn btn-secondary"
            >
              Cancelar
            </button>
          </div>
        </ModernFormContainer>
      </div>

      {/* Animación de guardado exitoso */}
      {showSaveAnimation && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 10000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '20px',
            padding: '40px 60px',
            textAlign: 'center',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{
              width: '100px',
              height: '100px',
              margin: '0 auto 20px',
              borderRadius: '50%',
              backgroundColor: '#28a745',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            
            <h2 style={{
              color: '#28a745',
              fontSize: '28px',
              fontWeight: '700',
              margin: '0 0 10px 0'
            }}>
              ¡Guardado Exitoso!
            </h2>
            
            <p style={{
              color: '#666',
              fontSize: '16px',
              margin: 0
            }}>
              El reporte ha sido guardado correctamente
            </p>
          </div>
        </div>
      )}

      {/* Animación de Pendiente */}
      {showPendingAnimation && (
        <PendingClockAnimation
          message="Reporte Guardado como Pendiente"
          onClose={() => {
            setShowPendingAnimation(false);
            limpiarFormulario();
          }}
        />
      )}

      {/* Modal de notificaciones pendientes */}
      <PendingReportsModal
        isOpen={showPendingModal}
        onClose={() => setShowPendingModal(false)}
        reports={pendingReportsList}
        onContinueReport={handleContinuePendingReport}
        onCancelReport={handleCancelPendingReport}
      />
    </div>
  );
};

export default ReportForm;
