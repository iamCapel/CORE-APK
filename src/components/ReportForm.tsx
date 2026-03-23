import React, { useState, useEffect } from 'react';
import { reportStorage } from '../services/reportStorage';
import { firebasePendingReportStorage } from '../services/firebasePendingReportStorage';
import firebaseReportStorage from '../services/firebaseReportStorage';
import PendingClockAnimation from './PendingClockAnimation';
import PendingReportsModal from './PendingReportsModal';
import { ModernSelect, ModernSelectOption } from './ModernSelect';
import { ModernInput } from './ModernInput';
import { ModernFormContainer } from './ModernFormContainer';
import SimpleDateSelect from './SimpleDateSelect';
import FichaInput from './FichaInput';
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
  
  // Generar opciones de fechas para los selects
  const generarOpcionesFechas = () => {
    const fechas = [];
    const fechaActual = new Date();
    
    // Generar fechas para los últimos 2 años y próximos 6 meses
    for (let i = -730; i <= 180; i++) {
      const fecha = new Date(fechaActual);
      fecha.setDate(fechaActual.getDate() + i);
      
      fechas.push({
        value: fecha.toISOString().split('T')[0],
        label: fecha.toLocaleDateString('es-ES', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      });
    }
    
    return fechas.reverse(); // Más recientes primero
  };

  const opcionesFechas = generarOpcionesFechas();
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFinal, setFechaFinal] = useState('');
  const [diasTrabajo, setDiasTrabajo] = useState<string[]>([]);
  const [diaActual, setDiaActual] = useState(0);
  const [reportesPorDia, setReportesPorDia] = useState<Record<string, any>>({});
  
  const [tipoIntervencion, setTipoIntervencion] = useState('');
  const [subTipoCanal, setSubTipoCanal] = useState('');
  const [observaciones, setObservaciones] = useState('');

  // Estados para vehículos (ahora es un array)
  const [vehiculos, setVehiculos] = useState<Array<{tipo: string, modelo: string, ficha: string}>>([]);

  // Estados para imágenes por día
  const [imagesPerDay, setImagesPerDay] = useState<Record<string, string[]>>({});
  const [selectedDayForImages, setSelectedDayForImages] = useState<string>('');
  const [showImageModal, setShowImageModal] = useState(false);

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

  // Actualizar campos de plantilla cuando cambia el tipo de intervención
  useEffect(() => {
    if (tipoIntervencion && plantillasPorIntervencion[tipoIntervencion]) {
      setPlantillaFields(plantillasPorIntervencion[tipoIntervencion]);
      setPlantillaValues({});
    } else if (tipoIntervencion) {
      setPlantillaFields(plantillaDefault);
      setPlantillaValues({});
    }
  }, [tipoIntervencion, plantillasPorIntervencion, plantillaDefault]);

  const handlePlantillaChange = (key: string, value: string) => {
    setPlantillaValues(prev => ({...prev, [key]: value}));
  };

  // Funciones para manejo de imágenes
  const handleImageUpload = (day: string, files: FileList | null) => {
    if (!files) return;
    
    const newImages = Array.from(files).map(file => URL.createObjectURL(file));
    setImagesPerDay(prev => ({
      ...prev,
      [day]: [...(prev[day] || []), ...newImages]
    }));
  };

  // marcar como pendiente (misma validación que guardar pero sin subir)
  const handleMarkPending = async () => {
    const sectorFinal = sector === 'otros' ? sectorPersonalizado : sector;
    const distritoFinal = distrito === 'otros' ? distritoPersonalizado : distrito;
    
    // Validación
    if (!region || !provincia || !distritoFinal || !sectorFinal || !tipoIntervencion) {
      alert('Por favor complete todos los campos requeridos');
      return;
    }
    
    setShowPendingAnimation(true);
    
    setTimeout(async () => {
      try {
        // Guardar como PENDIENTE en la colección principal (no aparecerá en estadísticas)
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
          imagesPerDay: Object.keys(imagesPerDay).length > 0 ? imagesPerDay : undefined,
          estado: 'pendiente' as const,  // 🟠 PENDIENTE
          // Guardar datos multi-día si existen
          diasTrabajo: diasTrabajo.length > 0 ? diasTrabajo : undefined,
          reportesPorDia: diasTrabajo.length > 0 ? reportesPorDia : undefined,
          fechaInicio: fechaInicio || undefined,
          fechaFinal: fechaFinal || undefined,
          diaActual: diasTrabajo.length > 0 ? diaActual : undefined
        };
        
        const savedReport = await reportStorage.saveReport(reportData);
        await firebaseReportStorage.saveReport(savedReport);
        setCurrentPendingReportId(savedReport.id);
        
        console.log('🟠 Reporte guardado como pendiente (sin estadísticas):', savedReport.id);
        
        setTimeout(() => {
          setShowPendingAnimation(false);
          alert('🟠 Reporte guardado como pendiente (no aparecerá en estadísticas)');
        }, 1500);
      } catch (error) {
        console.error('❌ Error guardando reporte pendiente:', error);
        setShowPendingAnimation(false);
        alert('Error al guardar el reporte pendiente. Verifique su conexión a internet.');
      }
    }, 500);
  };

  // cancelar el formulario y borrar pendiente si existe
  const handleCancelForm = async () => {
    if (window.confirm('¿Está seguro de que desea cancelar? Se perderán los datos no guardados.')) {
      if (currentPendingReportId) {
        try {
          await firebaseReportStorage.deleteReport(currentPendingReportId);
        } catch (err) {
          console.error('Error eliminando pendiente al cancelar:', err);
        }
        setCurrentPendingReportId(null);
      }
      limpiarFormulario();
    }
  };

  const handleCameraCapture = async (day: string) => {
    try {
      // Solicitar permiso de cámara
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      // Crear elemento video para captura
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();
      
      // Esperar a que el video esté listo
      await new Promise(resolve => {
        video.onloadedmetadata = resolve;
      });
      
      // Capturar imagen
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0);
      
      // Obtener imagen con coordenadas GPS si está disponible
      canvas.toBlob((blob) => {
        if (blob) {
          const imageUrl = URL.createObjectURL(blob);
          setImagesPerDay(prev => ({
            ...prev,
            [day]: [...(prev[day] || []), imageUrl]
          }));
        }
      });
      
      // Detener stream
      stream.getTracks().forEach(track => track.stop());
      
    } catch (error) {
      console.error('Error accediendo a la cámara:', error);
      alert('No se pudo acceder a la cámara. Verifique los permisos.');
    }
  };

  const removeImage = (day: string, index: number) => {
    setImagesPerDay(prev => {
      const dayImages = [...(prev[day] || [])];
      dayImages.splice(index, 1);
      return {
        ...prev,
        [day]: dayImages
      };
    });
  };

  const openImageModal = (day: string) => {
    setSelectedDayForImages(day);
    setShowImageModal(true);
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
    setFechaReporte('');
    setFechaInicio('');
    setFechaFinal('');
    setDiasTrabajo([]);
    setDiaActual(0);
    setReportesPorDia({});
    setTipoIntervencion('');
    setSubTipoCanal('');
    setObservaciones('');
    setVehiculos([]);
    setImagesPerDay({});
    setSelectedDayForImages('');
    setShowImageModal(false);
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
      })).then(async () => {
        console.log('✅ Todos los reportes multi-día guardados exitosamente');
        
        // Eliminar reporte pendiente si existe
        if (currentPendingReportId) {
          try {
            await firebaseReportStorage.deleteReport(currentPendingReportId);
            setCurrentPendingReportId(null);
            console.log('✅ Reporte pendiente eliminado después de guardar');
          } catch (err) {
            console.error('⚠️ Error eliminando reporte pendiente:', err);
          }
        }
        
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
          imagesPerDay: Object.keys(imagesPerDay).length > 0 ? imagesPerDay : undefined,
          estado: 'completado' as const,
          diasTrabajo: diasTrabajo.length > 0 ? diasTrabajo : undefined,
          reportesPorDia: diasTrabajo.length > 0 ? reportesPorDia : undefined,
          fechaInicio: fechaInicio || undefined,
          fechaFinal: fechaFinal || undefined,
          diaActual: diasTrabajo.length > 0 ? diaActual : undefined
        };
        
        const savedReport = await reportStorage.saveReport(reportData);
        await firebaseReportStorage.saveReport(savedReport);
        
        // Eliminar reporte pendiente si existe
        if (currentPendingReportId) {
          try {
            await firebaseReportStorage.deleteReport(currentPendingReportId);
            setCurrentPendingReportId(null);
            console.log('✅ Reporte pendiente eliminado después de guardar');
          } catch (err) {
            console.error('⚠️ Error eliminando reporte pendiente:', err);
          }
        }
        
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
        await firebaseReportStorage.deleteReport(reportId);
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

        <div className="topbar-actions-modern">
          <div className="topbar-action-button-modern" onClick={() => setShowPendingModal(true)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
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

            <SimpleDateSelect
              value={fechaInicio}
              onChange={setFechaInicio}
              placeholder="Seleccionar fecha de inicio"
            />

            <SimpleDateSelect
              value={fechaFinal}
              onChange={setFechaFinal}
              placeholder="Seleccionar fecha final"
              disabled={!fechaInicio}
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

          {/* Sección de plantilla dinámica */}
          {tipoIntervencion && (
            <ModernFormContainer
              title="📋 Datos Específicos de la Intervención"
              subtitle={`Complete los campos específicos para ${tipoIntervencion}`}
              icon="📝"
            >
              <div className="form-grid">
                {plantillaFields.map((field) => (
                  <div key={field.key} className="form-group">
                    <ModernInput
                      id={field.key}
                      type={field.type}
                      label={field.label}
                      placeholder={`Ingrese ${field.label.toLowerCase()}`}
                      value={plantillaValues[field.key] || ''}
                      onChange={(val) => handlePlantillaChange(field.key, String(val))}
                      unit={field.unit}
                      icon="📊"
                    />
                  </div>
                ))}
              </div>
            </ModernFormContainer>
          )}

          {/* Sección de vehículos pesados */}
          {tipoIntervencion && (
            <ModernFormContainer
              title="🚜 Información de Vehículos Pesados"
              subtitle="Registre los vehículos utilizados en la intervención"
              icon="🚛"
            >
              <div className="form-grid">
                {/* Campo para número de vehículos */}
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <ModernInput
                    id="numVehiculos"
                    type="number"
                    label="¿Cuántos vehículos están trabajando?"
                    placeholder="Ej: 5"
                    value={vehiculos.length}
                    onChange={(val) => {
                      const cantidad = parseInt(String(val)) || 0;
                      if (cantidad >= 0 && cantidad <= 50) {
                        const nuevosVehiculos = [];
                        for (let i = 0; i < cantidad; i++) {
                          if (i < vehiculos.length) {
                            // Mantener vehículo existente
                            nuevosVehiculos.push(vehiculos[i]);
                          } else {
                            // Agregar nuevo vehículo vacío
                            nuevosVehiculos.push({ tipo: '', modelo: '', ficha: '' });
                          }
                        }
                        setVehiculos(nuevosVehiculos);
                      }
                    }}
                    icon="🔢"
                  />
                  <small style={{ display: 'block', marginTop: '4px', color: 'var(--text-secondary)', fontSize: '12px' }}>
                    Ingrese el número y aparecerán las filas para llenar
                  </small>
                </div>
                
                {/* Formulario para cada vehículo */}
                {vehiculos.length > 0 && (
                  <div style={{ gridColumn: '1 / -1', marginBottom: '16px' }}>
                    <h5 style={{ marginBottom: '16px', fontSize: '14px', color: 'var(--text-secondary)', fontWeight: '600' }}>
                      Complete la información de cada vehículo:
                    </h5>
                    {vehiculos.map((vehiculo, index) => (
                      <div key={`vehiculo-${index}`} style={{ 
                        marginBottom: '20px',
                        padding: '20px',
                        backgroundColor: 'var(--off-white)',
                        borderRadius: '12px',
                        border: '2px solid var(--gray)'
                      }}>
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          marginBottom: '16px'
                        }}>
                          <h6 style={{ margin: 0, color: 'var(--primary-orange)', fontSize: '16px', fontWeight: '600' }}>
                            🚜 Vehículo #{index + 1}
                          </h6>
                          <button
                            type="button"
                            onClick={() => {
                              setVehiculos(vehiculos.filter((_, i) => i !== index));
                            }}
                            style={{
                              padding: '6px 16px',
                              backgroundColor: '#E74C3C',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '13px',
                              fontWeight: '600'
                            }}
                          >
                            ✕ Eliminar
                          </button>
                        </div>
                        
                        <div className="form-grid">
                          <ModernSelect
                            id={`tipoVehiculo-${index}`}
                            icon="🚛"
                            hint="Tipo de Vehículo"
                            placeholder="Seleccionar tipo"
                            value={vehiculo.tipo}
                            options={[
                              { value: 'Excavadora', label: 'Excavadora' },
                              { value: 'Retroexcavadora', label: 'Retroexcavadora' },
                              { value: 'Motoniveladora', label: 'Motoniveladora' },
                              { value: 'Rodillo Compactador', label: 'Rodillo Compactador' },
                              { value: 'Rodillo Liso', label: 'Rodillo Liso' },
                              { value: 'Rodillo Pata de Cabra', label: 'Rodillo Pata de Cabra' },
                              { value: 'Rodillo Neumático', label: 'Rodillo Neumático' },
                              { value: 'Cargador Frontal', label: 'Cargador Frontal' },
                              { value: 'Bulldozer', label: 'Bulldozer' },
                              { value: 'Camión Volquete', label: 'Camión Volquete' },
                              { value: 'Camión Cisterna', label: 'Camión Cisterna' },
                              { value: 'Camión de Carga', label: 'Camión de Carga' },
                              { value: 'Compactadora', label: 'Compactadora' },
                              { value: 'Compactadora Vibratoria', label: 'Compactadora Vibratoria' },
                              { value: 'Pavimentadora', label: 'Pavimentadora' },
                              { value: 'Finisher', label: 'Finisher' },
                              { value: 'Recicladora de Asfalto', label: 'Recicladora de Asfalto' },
                              { value: 'Fresadora', label: 'Fresadora' },
                              { value: 'Barredora', label: 'Barredora' },
                              { value: 'Distribuidor de Asfalto', label: 'Distribuidor de Asfalto' },
                              { value: 'Planta de Asfalto', label: 'Planta de Asfalto' },
                              { value: 'Planta de Concreto', label: 'Planta de Concreto' },
                              { value: 'Mezcladora de Concreto', label: 'Mezcladora de Concreto' },
                              { value: 'Bomba de Concreto', label: 'Bomba de Concreto' },
                              { value: 'Vibradora de Concreto', label: 'Vibradora de Concreto' },
                              { value: 'Zanjadora', label: 'Zanjadora' },
                              { value: 'Perforadora', label: 'Perforadora' },
                              { value: 'Martillo Hidráulico', label: 'Martillo Hidráulico' },
                              { value: 'Grúa', label: 'Grúa' },
                              { value: 'Minicargador', label: 'Minicargador' },
                              { value: 'Tractor', label: 'Tractor' },
                              { value: 'Generador Eléctrico', label: 'Generador Eléctrico' },
                              { value: 'Compresor de Aire', label: 'Compresor de Aire' },
                              { value: 'Otros', label: 'Otros' }
                            ]}
                            onChange={(val) => {
                              const nuevosVehiculos = [...vehiculos];
                              nuevosVehiculos[index].tipo = String(val);
                              setVehiculos(nuevosVehiculos);
                            }}
                          />

                          <ModernInput
                            id={`modeloVehiculo-${index}`}
                            type="text"
                            label="Modelo del Vehículo"
                            placeholder="Ej: CAT 320D"
                            value={vehiculo.modelo}
                            onChange={(val) => {
                              const nuevosVehiculos = [...vehiculos];
                              nuevosVehiculos[index].modelo = String(val);
                              setVehiculos(nuevosVehiculos);
                            }}
                            icon="🏷️"
                          />

                          <FichaInput
                            id={`fichaVehiculo-${index}`}
                            placeholder="Número de ficha"
                            value={vehiculo.ficha}
                            onChange={(val) => {
                              const nuevosVehiculos = [...vehiculos];
                              nuevosVehiculos[index].ficha = String(val);
                              setVehiculos(nuevosVehiculos);
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ModernFormContainer>
          )}

          {/* Sección de imágenes */}
          {tipoIntervencion && (
            <ModernFormContainer
              title="📸 Registro Fotográfico"
              subtitle="Documente la intervención con fotografías georeferenciadas"
              icon="📷"
            >
              <div className="form-grid">
                {/* Para reportes de un solo día */}
                {diasTrabajo.length === 0 ? (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <div style={{ marginBottom: '20px' }}>
                      <h4 style={{ color: 'var(--primary-orange)', marginBottom: '15px', fontSize: '16px' }}>
                        📷 Fotografías del Reporte
                      </h4>
                      
                      {/* Botones para agregar imágenes */}
                      <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                        <button
                          type="button"
                          onClick={() => document.getElementById('image-upload')?.click()}
                          style={{
                            padding: '12px 20px',
                            backgroundColor: 'var(--primary-orange)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}
                        >
                          🖼️ Galería de Imágenes
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => handleCameraCapture('single-day')}
                          style={{
                            padding: '12px 20px',
                            backgroundColor: '#27AE60',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}
                        >
                          📷 Tomar Foto con Cámara
                        </button>
                      </div>
                      
                      <input
                        id="image-upload"
                        type="file"
                        multiple
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => handleImageUpload('single-day', e.target.files)}
                      />
                      
                      {/* Vista previa de imágenes */}
                      {imagesPerDay['single-day'] && imagesPerDay['single-day'].length > 0 && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '15px' }}>
                          {imagesPerDay['single-day'].map((image, index) => (
                            <div key={index} style={{ position: 'relative' }}>
                              <img
                                src={image}
                                alt={`Foto ${index + 1}`}
                                style={{
                                  width: '100%',
                                  height: '120px',
                                  objectFit: 'cover',
                                  borderRadius: '8px',
                                  border: '2px solid var(--gray)'
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => removeImage('single-day', index)}
                                style={{
                                  position: 'absolute',
                                  top: '5px',
                                  right: '5px',
                                  padding: '5px 8px',
                                  backgroundColor: '#E74C3C',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '11px'
                                }}
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Para reportes multi-día */
                  diasTrabajo.map((day, dayIndex) => (
                    <div key={day} style={{ gridColumn: '1 / -1', marginBottom: '25px' }}>
                      <div style={{ 
                        padding: '20px',
                        backgroundColor: 'var(--off-white)',
                        borderRadius: '12px',
                        border: '2px solid var(--gray)'
                      }}>
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          marginBottom: '15px'
                        }}>
                          <h5 style={{ margin: 0, color: 'var(--primary-orange)', fontSize: '16px', fontWeight: '600' }}>
                            📷 Fotografías - {new Date(day + 'T12:00:00').toLocaleDateString('es-ES', { 
                              weekday: 'long', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </h5>
                          <span style={{ 
                            padding: '4px 12px',
                            backgroundColor: 'var(--primary-orange)',
                            color: 'white',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}>
                            {imagesPerDay[day]?.length || 0} fotos
                          </span>
                        </div>
                        
                        {/* Botones para este día */}
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                          <button
                            type="button"
                            onClick={() => {
                              const input = document.getElementById(`image-upload-${day}`);
                              if (input) input.click();
                            }}
                            style={{
                              padding: '8px 16px',
                              backgroundColor: 'var(--primary-orange)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '13px',
                              fontWeight: '600'
                            }}
                          >
                            🖼️ Galería
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => handleCameraCapture(day)}
                            style={{
                              padding: '8px 16px',
                              backgroundColor: '#27AE60',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '13px',
                              fontWeight: '600'
                            }}
                          >
                            📷 Cámara
                          </button>
                        </div>
                        
                        <input
                          id={`image-upload-${day}`}
                          type="file"
                          multiple
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={(e) => handleImageUpload(day, e.target.files)}
                        />
                        
                        {/* Vista previa de imágenes del día */}
                        {imagesPerDay[day] && imagesPerDay[day].length > 0 && (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '10px' }}>
                            {imagesPerDay[day].map((image, index) => (
                              <div key={index} style={{ position: 'relative' }}>
                                <img
                                  src={image}
                                  alt={`Foto ${index + 1}`}
                                  style={{
                                    width: '100%',
                                    height: '80px',
                                    objectFit: 'cover',
                                    borderRadius: '6px',
                                    border: '1px solid var(--gray)'
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={() => removeImage(day, index)}
                                  style={{
                                    position: 'absolute',
                                    top: '2px',
                                    right: '2px',
                                    padding: '2px 6px',
                                    backgroundColor: '#E74C3C',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '3px',
                                    cursor: 'pointer',
                                    fontSize: '10px'
                                  }}
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ModernFormContainer>
          )}

          {/* Botones de acción */}
          <div className="form-actions">
            {/* Botón Verde - Guardar Completado */}
            <button type="button" className="form-action-btn green" onClick={guardarIntervencion}>
              ✔
              <span className="form-action-label">
                {diasTrabajo.length > 0 ? `Guardar ${diasTrabajo.length} días` : 'Guardar'}
              </span>
            </button>

            {/* Botón Naranja - Guardar Pendiente */}
            <button type="button" className="form-action-btn yellow" onClick={handleMarkPending}>
              ⏳
              <span className="form-action-label">Pendiente</span>
            </button>

            {/* Botón Rojo - Cancelar/Eliminar */}
            <button type="button" className="form-action-btn red" onClick={handleCancelForm}>
              ✕
              <span className="form-action-label">Cancelar</span>
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
