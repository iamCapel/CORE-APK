import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { reportStorage } from '../services/reportStorage';
import { firebaseHeavyVehiclesStorage, HeavyVehicleRecord } from '../services/firebaseHeavyVehiclesStorage';
import ReportDetailView from './ReportDetailView';
import './Dashboard.css';

// Configurar iconos de Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Intervention {
  id: number;
  timestamp: string;
  numeroReporte?: string;
  region: string;
  provincia: string;
  distrito: string;
  municipio: string;
  sector: string;
  tipoIntervencion: string;
  usuario: string;
  latitud?: number;
  longitud?: number;
  [key: string]: any;
}

interface ActivityItem {
  id: string;
  type: 'intervention' | 'vehicle';
  timestamp: string;
  title: string;
  subtitle: string;
  location: string;
  usuario: string;
  latitud?: number;
  longitud?: number;
  color: string;
  data: any;
}

interface LeafletMapViewProps {
  user: any;
  onBack: () => void;
}

// Coordenadas de República Dominicana por municipios principales
const municipioCoordinates: Record<string, { lat: number; lng: number }> = {
  // Distrito Nacional
  'Santo Domingo': { lat: 18.4861, lng: -69.9312 },
  'Distrito Nacional': { lat: 18.4861, lng: -69.9312 },
  
  // Santiago
  'Santiago': { lat: 19.4517, lng: -70.6970 },
  'Santiago de los Caballeros': { lat: 19.4517, lng: -70.6970 },
  'Tamboril': { lat: 19.4833, lng: -70.6167 },
  'Villa González': { lat: 19.5333, lng: -70.7833 },
  'Licey al Medio': { lat: 19.4167, lng: -70.5833 },
  
  // La Vega
  'La Vega': { lat: 19.2167, lng: -70.5167 },
  'Constanza': { lat: 18.9167, lng: -70.7500 },
  'Jarabacoa': { lat: 19.1167, lng: -70.6333 },
  
  // Puerto Plata
  'Puerto Plata': { lat: 19.7833, lng: -70.6833 },
  'Altamira': { lat: 19.6833, lng: -70.8667 },
  'Luperón': { lat: 19.8833, lng: -70.9500 },
  
  // San Cristóbal
  'San Cristóbal': { lat: 18.4167, lng: -70.1000 },
  'Bajos de Haina': { lat: 18.4167, lng: -70.0333 },
  'Villa Altagracia': { lat: 18.6833, lng: -70.1667 },
  
  // La Romana
  'La Romana': { lat: 18.4270, lng: -68.9728 },
  'Villa Hermosa': { lat: 18.4833, lng: -69.0167 },
  'Guaymate': { lat: 18.3833, lng: -68.9167 },
  
  // San Pedro de Macorís
  'San Pedro de Macorís': { lat: 18.4539, lng: -69.3078 },
  'Los Llanos': { lat: 18.4833, lng: -69.2833 },
  'Ramón Santana': { lat: 18.4167, lng: -69.3667 },
  
  // Barahona
  'Barahona': { lat: 18.2086, lng: -71.1010 },
  'Cabral': { lat: 18.2667, lng: -71.2167 },
  'Enriquillo': { lat: 17.9333, lng: -71.2667 },
  
  // Azua
  'Azua': { lat: 18.4531, lng: -70.7347 },
  'Padre Las Casas': { lat: 18.7333, lng: -71.2000 },
  'Sabana Yegua': { lat: 18.6167, lng: -70.9333 },
  
  // Peravia
  'Baní': { lat: 18.2794, lng: -70.3314 },
  'Nizao': { lat: 18.2333, lng: -70.4333 },
  'Matanzas': { lat: 18.3000, lng: -70.2833 },
  
  // Monte Cristi
  'Monte Cristi': { lat: 19.8419, lng: -71.6454 },
  'Castañuelas': { lat: 19.6833, lng: -71.3333 },
  'Guayubín': { lat: 19.6167, lng: -71.3333 },
  
  // Valverde
  'Mao': { lat: 19.5531, lng: -71.0781 },
  'Esperanza': { lat: 19.6333, lng: -70.9833 },
  'Laguna Salada': { lat: 19.6833, lng: -71.1333 },
  
  // Dajabón
  'Dajabón': { lat: 19.5486, lng: -71.7083 },
  'Loma de Cabrera': { lat: 19.4333, lng: -71.5833 },
  'Partido': { lat: 19.5167, lng: -71.6833 },
  
  // Santiago Rodríguez
  'San Ignacio de Sabaneta': { lat: 19.3833, lng: -71.3500 },
  'Villa Los Almácigos': { lat: 19.4167, lng: -71.2833 },
  'Monción': { lat: 19.4667, lng: -71.1667 },
  
  // Elías Piña
  'Comendador': { lat: 18.8833, lng: -71.7000 },
  'Bánica': { lat: 18.9667, lng: -71.3500 },
  'Pedro Santana': { lat: 18.9333, lng: -71.4667 },
  
  // San Juan
  'San Juan de la Maguana': { lat: 18.8061, lng: -71.2297 },
  'Las Matas de Farfán': { lat: 18.8833, lng: -71.5167 },
  'Juan de Herrera': { lat: 18.7667, lng: -71.1833 },
  
  // Independencia
  'Jimaní': { lat: 18.5028, lng: -71.8597 },
  'Duvergé': { lat: 18.3667, lng: -71.5167 },
  'Postrer Río': { lat: 18.5667, lng: -71.7833 },
  
  // Baoruco
  'Neiba': { lat: 18.4822, lng: -71.4186 },
  'Galván': { lat: 18.5167, lng: -71.3333 },
  'Tamayo': { lat: 18.2833, lng: -71.1000 },
  
  // Pedernales
  'Pedernales': { lat: 18.0167, lng: -71.7333 },
  'Oviedo': { lat: 17.8000, lng: -71.4167 },
  
  // Espaillat
  'Moca': { lat: 19.3944, lng: -70.5256 },
  'San Francisco de Macorís': { lat: 19.3011, lng: -70.2525 },
  'Cayetano Germosén': { lat: 19.2333, lng: -70.3667 },
  
  // Duarte
  'Villa Francisca': { lat: 19.2833, lng: -70.2167 },
  'Arenoso': { lat: 19.1833, lng: -70.1833 },
  'Castillo': { lat: 19.2167, lng: -70.0833 },
  
  // Salcedo
  'Salcedo': { lat: 19.3775, lng: -70.4172 },
  'Tenares': { lat: 19.4167, lng: -70.3333 },
  'Villa Tapia': { lat: 19.3333, lng: -70.3667 },
  
  // Sánchez Ramírez
  'Cotuí': { lat: 19.0531, lng: -70.1492 },
  'Cevicos': { lat: 19.0000, lng: -70.0167 },
  'Fantino': { lat: 19.1167, lng: -70.3000 },
  
  // Monseñor Nouel
  'Bonao': { lat: 18.9369, lng: -70.4089 },
  'Maimón': { lat: 18.9167, lng: -70.3667 },
  'Piedra Blanca': { lat: 18.8833, lng: -70.3167 },
  
  // Monte Plata
  'Monte Plata': { lat: 18.8072, lng: -69.7844 },
  'Sabana Grande de Boyá': { lat: 18.9500, lng: -69.7833 },
  'Peralvillo': { lat: 18.6667, lng: -69.7167 },
  
  // Hato Mayor
  'Hato Mayor del Rey': { lat: 18.7667, lng: -69.2667 },
  'Sabana de la Mar': { lat: 19.0500, lng: -69.4167 },
  'El Valle': { lat: 18.7833, lng: -69.1833 },
  
  // El Seibo
  'El Seibo': { lat: 18.7644, lng: -69.0386 },
  'Miches': { lat: 18.9833, lng: -69.0500 },
  
  // María Trinidad Sánchez
  'Nagua': { lat: 19.3831, lng: -69.8478 },
  'Cabrera': { lat: 19.6333, lng: -69.9167 },
  'El Factor': { lat: 19.4167, lng: -69.9000 },
  
  // Samaná
  'Samaná': { lat: 19.2044, lng: -69.3364 },
  'Las Terrenas': { lat: 19.3167, lng: -69.5333 },
  'Sánchez': { lat: 19.2333, lng: -69.6000 },
  
  // San José de Ocoa
  'San José de Ocoa': { lat: 18.5469, lng: -70.5000 },
  'Sabana Larga': { lat: 18.6167, lng: -70.4833 },
  'Rancho Arriba': { lat: 18.6833, lng: -70.4167 },
  
  // Más localidades de La Vega
  'La Penda': { lat: 19.2500, lng: -70.4833 },
  'la penda': { lat: 19.2500, lng: -70.4833 },
  'Penda': { lat: 19.2500, lng: -70.4833 },
  'penda': { lat: 19.2500, lng: -70.4833 },
  
  // Más localidades comunes
  'Gaspar Hernández': { lat: 19.6167, lng: -70.2833 },
  'Villa Bisonó': { lat: 19.5833, lng: -70.8667 },
  'Guananico': { lat: 19.6833, lng: -71.3500 }
};

// Colores por tipo de intervención
const INTERVENTION_COLORS = {
  'Bacheo': '#FF6B6B',
  'Asfaltado': '#4ECDC4',
  'Canalización': '#45B7D1',
  'Señalización': '#96CEB4',
  'Construcción': '#FFEAA7',
  'Reparación': '#DDA0DD',
  'Mantenimiento': '#98D8C8',
  'Vehículo': '#FFA500',
  'default': '#74B9FF'
};

// Componente para centrar el mapa en una ubicación específica
const MapUpdater: React.FC<{ center: [number, number], zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
};

const LeafletMapView: React.FC<LeafletMapViewProps> = ({ user, onBack }) => {
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [vehicles, setVehicles] = useState<HeavyVehicleRecord[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [displayedActivities, setDisplayedActivities] = useState<ActivityItem[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [showDetailView, setShowDetailView] = useState(false);
  const [selectedReportNumber, setSelectedReportNumber] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedActivity, setSelectedActivity] = useState<ActivityItem | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([18.7357, -70.1627]);
  const [mapZoom, setMapZoom] = useState(8);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  
  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    
    // Cargar intervenciones desde reportStorage
    let reports = reportStorage.getAllReports();
    
    // Filtrar reportes para usuarios técnicos - solo ven sus propios reportes
    if (user?.role === 'Técnico' || user?.role === 'tecnico') {
      reports = reports.filter(report => report.creadoPor === user.username);
    }
    
    const interventionsData = reports.map((report, index) => ({
      id: index,
      timestamp: report.timestamp,
      numeroReporte: report.numeroReporte,
      region: report.region,
      provincia: report.provincia,
      distrito: report.distrito,
      municipio: report.municipio,
      sector: report.sector,
      tipoIntervencion: report.tipoIntervencion,
      usuario: report.creadoPor,
      latitud: report.gpsData?.punto_inicial?.lat || report.gpsData?.punto_alcanzado?.lat,
      longitud: report.gpsData?.punto_inicial?.lon || report.gpsData?.punto_alcanzado?.lon
    }));
    
    setInterventions(interventionsData);

    // Cargar TODOS los vehículos históricos
    try {
      const vehiclesData = await firebaseHeavyVehiclesStorage.getAllRecords();
      console.log(`Vehículos históricos cargados en vista: ${vehiclesData.length}`);
      setVehicles(vehiclesData);
    } catch (error) {
      console.error('Error cargando vehículos:', error);
      setVehicles([]);
    }

    // Combinar intervenciones y vehículos en una lista de actividades
    const combinedActivities: ActivityItem[] = [];

    // Agregar intervenciones
    interventionsData.forEach((intervention) => {
      combinedActivities.push({
        id: `intervention-${intervention.id}`,
        type: 'intervention',
        timestamp: intervention.timestamp,
        title: intervention.tipoIntervencion,
        subtitle: intervention.numeroReporte || 'Sin número',
        location: `${intervention.municipio}, ${intervention.provincia}`,
        usuario: intervention.usuario,
        latitud: intervention.latitud,
        longitud: intervention.longitud,
        color: getTypeColor(intervention.tipoIntervencion),
        data: intervention
      });
    });

    // Agregar TODOS los vehículos (ya cargados)
    vehicles.forEach((vehicle) => {
      combinedActivities.push({
        id: `vehicle-${vehicle.id}`,
        type: 'vehicle',
        timestamp: vehicle.createdAt || vehicle.updatedAt,
        title: `Vehículo: ${vehicle.ficha || 'Sin ficha'}`,
        subtitle: vehicle.tipoIntervencion || `${vehicle.tipoVehiculo} - ${vehicle.cantidadVehiculos} unidades`,
        location: `${vehicle.municipio || 'N/A'}, ${vehicle.provincia || 'N/A'}`,
        usuario: vehicle.usuarioId || 'Usuario',
        latitud: undefined,
        longitud: undefined,
        color: INTERVENTION_COLORS['Vehículo'],
        data: vehicle
      });
    });

    // Ordenar por fecha (más recientes primero)
    combinedActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    setActivities(combinedActivities);
    setDisplayedActivities(combinedActivities.slice(0, ITEMS_PER_PAGE));
    setPage(1);
    setHasMore(combinedActivities.length > ITEMS_PER_PAGE);
    setLoading(false);

    // Obtener tipos únicos de intervenciones
    const typeSet = new Set<string>();
    interventionsData.forEach((i: Intervention) => typeSet.add(i.tipoIntervencion));
    typeSet.add('Vehículo');
    const types = Array.from(typeSet) as string[];
    setSelectedTypes(types); // Mostrar todos por defecto
  };

  // Función para cargar más elementos (scroll infinito)
  const loadMore = () => {
    if (loading || !hasMore) return;

    const filteredActivities = getFilteredActivities();
    const nextPage = page + 1;
    const startIndex = page * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const newItems = filteredActivities.slice(startIndex, endIndex);

    if (newItems.length > 0) {
      setDisplayedActivities(prev => [...prev, ...newItems]);
      setPage(nextPage);
      setHasMore(endIndex < filteredActivities.length);
    } else {
      setHasMore(false);
    }
  };

  // Detectar scroll para cargar más elementos
  useEffect(() => {
    const handleScroll = () => {
      if (!listRef.current) return;

      const { scrollTop, scrollHeight, clientHeight } = listRef.current;
      if (scrollHeight - scrollTop <= clientHeight * 1.5) {
        loadMore();
      }
    };

    const listElement = listRef.current;
    if (listElement) {
      listElement.addEventListener('scroll', handleScroll);
      return () => listElement.removeEventListener('scroll', handleScroll);
    }
  }, [loading, hasMore, page]);

  const getFilteredActivities = () => {
    return activities.filter(activity => {
      const matchesSearch = !searchQuery || 
        activity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        activity.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        activity.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        activity.usuario.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  };

  // Actualizar actividades mostradas cuando cambia el filtro de búsqueda
  useEffect(() => {
    const filteredActivities = getFilteredActivities();
    setDisplayedActivities(filteredActivities.slice(0, ITEMS_PER_PAGE));
    setPage(1);
    setHasMore(filteredActivities.length > ITEMS_PER_PAGE);
  }, [searchQuery, activities]);

  // Función para seleccionar una actividad y centrar el mapa
  const handleSelectActivity = (activity: ActivityItem) => {
    console.log('Actividad seleccionada:', activity);
    setSelectedActivity(activity);
    
    // Función auxiliar para buscar coordenadas de forma flexible
    const findCoordinates = (locationName: string): [number, number] | null => {
      if (!locationName) return null;
      
      // Buscar exacto
      if (municipioCoordinates[locationName]) {
        console.log(`Coordenadas encontradas (exacto) para "${locationName}":`, municipioCoordinates[locationName]);
        return [municipioCoordinates[locationName].lat, municipioCoordinates[locationName].lng];
      }
      
      // Buscar insensible a mayúsculas/minúsculas
      const lowerLocation = locationName.toLowerCase();
      const matchingKey = Object.keys(municipioCoordinates).find(
        key => key.toLowerCase() === lowerLocation
      );
      
      if (matchingKey) {
        console.log(`Coordenadas encontradas (insensible) para "${locationName}":`, municipioCoordinates[matchingKey]);
        return [municipioCoordinates[matchingKey].lat, municipioCoordinates[matchingKey].lng];
      }
      
      // Buscar por coincidencia parcial
      const partialMatch = Object.keys(municipioCoordinates).find(
        key => key.toLowerCase().includes(lowerLocation) || lowerLocation.includes(key.toLowerCase())
      );
      
      if (partialMatch) {
        console.log(`Coordenadas encontradas (parcial) para "${locationName}":`, municipioCoordinates[partialMatch]);
        return [municipioCoordinates[partialMatch].lat, municipioCoordinates[partialMatch].lng];
      }
      
      console.log(`No se encontraron coordenadas para "${locationName}"`);
      return null;
    };
    
    if (activity.latitud && activity.longitud) {
      console.log('Usando coordenadas GPS exactas:', [activity.latitud, activity.longitud]);
      setMapCenter([activity.latitud, activity.longitud]);
      setMapZoom(15);
    } else {
      // Intentar con múltiples fuentes de ubicación
      const locations = [
        activity.data.municipio,
        activity.data.distrito,
        activity.data.distritoPersonalizado,
        activity.location.split(',')[0].trim(),
        activity.location.split(',')[1]?.trim()
      ].filter(Boolean);
      
      console.log('Buscando coordenadas en:', locations);
      
      let coords: [number, number] | null = null;
      for (const loc of locations) {
        coords = findCoordinates(loc);
        if (coords) break;
      }
      
      if (coords) {
        console.log('Coordenadas finales encontradas:', coords);
        setMapCenter(coords);
        setMapZoom(13);
      } else {
        // Si no se encuentra, usar coordenadas de la provincia
        const provincia = activity.data.provincia || activity.location.split(',')[1]?.trim();
        console.log('Intentando con provincia:', provincia);
        if (provincia) {
          const provCoords = findCoordinates(provincia);
          if (provCoords) {
            console.log('Usando coordenadas de provincia:', provCoords);
            setMapCenter(provCoords);
            setMapZoom(10);
          }
        }
      }
    }
  };

  const getTypeColor = (tipo: string) => {
    for (const [key, color] of Object.entries(INTERVENTION_COLORS)) {
      if (tipo.includes(key)) return color;
    }
    return INTERVENTION_COLORS.default;
  };
  
  // Función auxiliar para obtener coordenadas de forma flexible
  const getActivityCoordinates = (activity: ActivityItem): [number, number] => {
    // Si tiene coordenadas GPS, usarlas
    if (activity.latitud && activity.longitud) {
      return [activity.latitud, activity.longitud];
    }
    
    // Función interna de búsqueda
    const findCoords = (locationName: string): { lat: number, lng: number } | null => {
      if (!locationName) return null;
      
      // Buscar exacto
      if (municipioCoordinates[locationName]) {
        return municipioCoordinates[locationName];
      }
      
      // Buscar insensible a mayúsculas/minúsculas
      const lowerLocation = locationName.toLowerCase();
      const matchingKey = Object.keys(municipioCoordinates).find(
        key => key.toLowerCase() === lowerLocation
      );
      
      if (matchingKey) {
        return municipioCoordinates[matchingKey];
      }
      
      // Buscar por coincidencia parcial
      const partialMatch = Object.keys(municipioCoordinates).find(
        key => key.toLowerCase().includes(lowerLocation) || lowerLocation.includes(key.toLowerCase())
      );
      
      if (partialMatch) {
        return municipioCoordinates[partialMatch];
      }
      
      return null;
    };
    
    // Intentar con múltiples fuentes de ubicación
    const locations = [
      activity.data.municipio,
      activity.data.distrito,
      activity.data.distritoPersonalizado,
      activity.location.split(',')[0].trim(),
      activity.location.split(',')[1]?.trim(),
      activity.data.provincia
    ].filter(Boolean);
    
    for (const loc of locations) {
      const coords = findCoords(loc);
      if (coords) {
        return [coords.lat, coords.lng];
      }
    }
    
    // Coordenadas por defecto (Santo Domingo)
    return [18.4861, -69.9312];
  };

  // Crear iconos personalizados para cada tipo de intervención
  const createCustomIcon = (color: string, isSelected: boolean = false) => {
    const size = isSelected ? 32 : 24;
    const svgIcon = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}">
        <circle cx="12" cy="12" r="8" fill="${color}" stroke="#fff" stroke-width="${isSelected ? 3 : 2}"/>
        ${isSelected ? '<circle cx="12" cy="12" r="4" fill="#fff" opacity="0.8"/>' : ''}
      </svg>
    `;
    
    return L.divIcon({
      html: svgIcon,
      className: 'custom-marker',
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      popupAnchor: [0, -size / 2]
    });
  };

  const handleViewDetail = (numeroReporte: string) => {
    setSelectedReportNumber(numeroReporte);
    setShowDetailView(true);
  };

  const handleBackToMap = () => {
    setShowDetailView(false);
    setSelectedReportNumber('');
  };

  const toggleMapFullscreen = async () => {
    if (!isMapFullscreen) {
      // Entrar en pantalla completa y rotar a landscape
      try {
        const elem = document.documentElement;
        if (elem.requestFullscreen) {
          await elem.requestFullscreen();
        }
        // Intentar bloquear orientación a landscape
        if (screen.orientation && screen.orientation.lock) {
          try {
            await screen.orientation.lock('landscape');
          } catch (err) {
            console.log('No se pudo bloquear la orientación:', err);
          }
        }
      } catch (err) {
        console.error('Error al entrar en pantalla completa:', err);
      }
    } else {
      // Salir de pantalla completa
      try {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
        // Desbloquear orientación
        if (screen.orientation && screen.orientation.unlock) {
          screen.orientation.unlock();
        }
      } catch (err) {
        console.error('Error al salir de pantalla completa:', err);
      }
    }
    setIsMapFullscreen(!isMapFullscreen);
  };

  // Retorno temprano si está mostrando detalle de reporte
  if (showDetailView && selectedReportNumber) {
    return <ReportDetailView numeroReporte={selectedReportNumber} onBack={handleBackToMap} />;
  }

  return (
    <div className="dashboard-container">
      <div className="topbar-modern">
        <button
          title="Volver al Dashboard"
          className="topbar-back-button-modern"
          onClick={onBack}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
          </svg>
        </button>
        <div className="topbar-actions-modern">
          <h1 className="topbar-title">Buscar</h1>
        </div>
      </div>

      {/* Filtro de búsqueda móvil */}
      <div style={{ padding: '0 16px', marginBottom: '12px' }}>
        <div style={{
          position: 'relative',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '8px',
          border: '1px solid rgba(255, 140, 0, 0.3)'
        }}>
          <input
            type="text"
            placeholder="🔍 Buscar por # reporte, municipio, provincia..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 40px 12px 12px',
              backgroundColor: 'transparent',
              border: 'none',
              color: '#fff',
              fontSize: '14px',
              outline: 'none'
            }}
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              title="Limpiar búsqueda"
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(255, 140, 0, 0.2)',
                color: '#FFA500',
                border: 'none',
                borderRadius: '50%',
                width: '28px',
                height: '28px',
                cursor: 'pointer',
                fontSize: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Mapa Compacto - Fijo en la parte superior */}
      <div style={{ 
        padding: '0 16px',
        marginBottom: '12px'
      }}>
        <div style={{ 
          width: '100%',
          height: isMapFullscreen ? '100vh' : '180px',
          background: 'rgba(20, 20, 25, 0.9)',
          borderRadius: isMapFullscreen ? '0' : '12px',
          boxShadow: '0 4px 20px rgba(255, 140, 0, 0.3)',
          overflow: 'hidden',
          border: '1px solid rgba(255, 140, 0, 0.4)',
          position: isMapFullscreen ? 'fixed' as const : 'relative' as const,
          top: isMapFullscreen ? 0 : 'auto',
          left: isMapFullscreen ? 0 : 'auto',
          zIndex: isMapFullscreen ? 9999 : 1
        }}>
          {/* Botón de Pantalla Completa */}
          <button
            onClick={toggleMapFullscreen}
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              zIndex: 1000,
              background: 'rgba(255, 140, 0, 0.9)',
              color: '#000',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 12px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              boxShadow: '0 4px 12px rgba(255, 140, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {isMapFullscreen ? '✕' : '⛶'} {isMapFullscreen ? 'Cerrar' : 'Pantalla Completa'}
          </button>
          <MapContainer 
            center={mapCenter} 
            zoom={mapZoom} 
            style={{ height: '100%', width: '100%' }}
          >
            <MapUpdater center={mapCenter} zoom={mapZoom} />
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            
            {/* Mostrar solo el elemento seleccionado o todos si no hay selección */}
            {(selectedActivity ? [selectedActivity] : displayedActivities.slice(0, 50)).map((activity) => {
              const position = getActivityCoordinates(activity);
              const isSelected = selectedActivity?.id === activity.id;
              const customIcon = createCustomIcon(activity.color, isSelected);

              return (
                <Marker 
                  key={activity.id} 
                  position={position}
                  icon={customIcon}
                  eventHandlers={{
                    click: () => {
                      handleSelectActivity(activity);
                    }
                  }}
                >
                  <Popup>
                    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '300px' }}>
                      <h3 style={{ margin: '0 0 10px 0', color: '#2c3e50', fontSize: '16px' }}>
                        {activity.title}
                      </h3>
                      <div style={{ fontSize: '14px', lineHeight: '1.5' }}>
                        <p style={{ margin: '5px 0', padding: '5px 10px', backgroundColor: activity.color, color: 'white', borderRadius: '4px', fontWeight: 'bold', textAlign: 'center' }}>
                          {activity.subtitle}
                        </p>
                        <p style={{ margin: '5px 0' }}><strong>📍 Ubicación:</strong> {activity.location}</p>
                        <p style={{ margin: '5px 0' }}><strong>👤 Usuario:</strong> {activity.usuario}</p>
                        <p style={{ margin: '5px 0' }}><strong>📅 Fecha:</strong> {new Date(activity.timestamp).toLocaleDateString('es-DO')}</p>
                        {activity.latitud && activity.longitud ? 
                          <p style={{ margin: '5px 0' }}><strong>📌 GPS:</strong> {activity.latitud.toFixed(6)}, {activity.longitud.toFixed(6)}</p> : 
                          <p style={{ margin: '5px 0', color: '#e74c3c' }}><strong>📌 GPS:</strong> Ubicación aproximada (basada en {activity.data.municipio || 'municipio'})</p>
                        }
                        {activity.type === 'intervention' && activity.data.numeroReporte && (
                          <div style={{ marginTop: '15px', textAlign: 'center' }}>
                            <button
                              onClick={() => handleViewDetail(activity.data.numeroReporte)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                padding: '10px 20px',
                                backgroundColor: '#3498db',
                                color: 'white',
                                border: '2px solid #3498db',
                                borderRadius: '50px',
                                fontSize: '14px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 2px 8px rgba(52, 152, 219, 0.3)'
                              }}
                            >
                              Ver Detalles →
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      </div>

      {/* Lista de Actividades con Scroll Infinito - Más Grande */}
      <div style={{ 
        padding: '0 16px',
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        minHeight: 0
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
          padding: '12px 16px',
          background: 'rgba(20, 20, 25, 0.8)',
          borderRadius: '10px',
          border: '1px solid rgba(255, 140, 0, 0.3)',
          boxShadow: '0 4px 16px rgba(255, 140, 0, 0.2)'
        }}>
          <h2 style={{ 
            margin: 0, 
            fontSize: '17px', 
            fontWeight: 'bold',
            color: '#FFA500',
            textShadow: '0 2px 8px rgba(255, 140, 0, 0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>🚛</span>
            Historial de Vehículos y Actividades
          </h2>
          {selectedActivity && (
            <button
              onClick={() => {
                setSelectedActivity(null);
                setMapCenter([18.7357, -70.1627]);
                setMapZoom(8);
              }}
              style={{
                padding: '6px 14px',
                background: 'rgba(255, 140, 0, 0.25)',
                color: '#FFA500',
                border: '1px solid rgba(255, 140, 0, 0.5)',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(255, 140, 0, 0.3)',
                transition: 'all 0.3s ease'
              }}
            >
              Mostrar Todo
            </button>
          )}
        </div>

        <div 
          ref={listRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            background: 'rgba(10, 10, 12, 0.7)',
            borderRadius: '12px',
            padding: '10px',
            minHeight: 'calc(100vh - 380px)',
            maxHeight: 'calc(100vh - 380px)',
            border: '1px solid rgba(255, 140, 0, 0.2)',
            boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.5), 0 4px 16px rgba(255, 140, 0, 0.15)'
          }}
        >
          {displayedActivities.length === 0 && !loading && (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: '#FFA500'
            }}>
              <p>No hay actividades para mostrar</p>
            </div>
          )}

          {displayedActivities.map((activity, index) => (
            <div
              key={`${activity.id}-${index}`}
              onClick={() => handleSelectActivity(activity)}
              style={{
                background: selectedActivity?.id === activity.id
                  ? 'rgba(255, 140, 0, 0.25)'
                  : 'rgba(20, 20, 25, 0.8)',
                borderRadius: '10px',
                padding: '12px',
                marginBottom: '8px',
                boxShadow: selectedActivity?.id === activity.id 
                  ? '0 6px 20px rgba(255, 140, 0, 0.5), inset 0 1px 2px rgba(255, 140, 0, 0.3)' 
                  : '0 3px 12px rgba(0, 0, 0, 0.4)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                border: selectedActivity?.id === activity.id 
                  ? '2px solid rgba(255, 140, 0, 0.7)'
                  : '1px solid rgba(255, 140, 0, 0.2)',
                transform: selectedActivity?.id === activity.id ? 'scale(1.02)' : 'scale(1)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                {/* Icono de tipo */}
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: activity.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  color: 'white',
                  fontSize: '18px',
                  fontWeight: 'bold'
                }}>
                  {activity.type === 'vehicle' ? '🚛' : '🛠'}
                </div>

                {/* Contenido */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{
                    margin: '0 0 4px 0',
                    fontSize: '15px',
                    fontWeight: 'bold',
                    color: '#FFA500',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    textShadow: '0 1px 4px rgba(255, 140, 0, 0.3)'
                  }}>
                    {activity.title}
                  </h3>
                  <p style={{
                    margin: '0 0 6px 0',
                    fontSize: '13px',
                    color: '#ddd',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {activity.subtitle}
                  </p>
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    fontSize: '12px',
                    color: '#bbb',
                    flexWrap: 'wrap'
                  }}>
                    <span>📍 {activity.location}</span>
                    <span>👤 {activity.usuario}</span>
                  </div>
                  <p style={{
                    margin: '6px 0 0 0',
                    fontSize: '11px',
                    color: '#888'
                  }}>
                    {new Date(activity.timestamp).toLocaleString('es-DO')}
                  </p>
                </div>

                {/* Indicador GPS */}
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: activity.latitud && activity.longitud ? '#4CAF50' : '#FFA500',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  fontSize: '12px'
                }}>
                  {activity.latitud && activity.longitud ? '✓' : '~'}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div style={{
              textAlign: 'center',
              padding: '20px',
              color: '#FFA500'
            }}>
              <p>Cargando más actividades...</p>
            </div>
          )}

          {!loading && !hasMore && displayedActivities.length > 0 && (
            <div style={{
              textAlign: 'center',
              padding: '20px',
              color: '#FFA500',
              fontSize: '14px'
            }}>
              <p>No hay más actividades</p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .custom-marker {
          background: transparent !important;
          border: none !important;
        }
        
        .leaflet-popup-content-wrapper {
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }
        
        .leaflet-popup-tip {
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
      `}</style>
    </div>
  );
};

export default LeafletMapView;