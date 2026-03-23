import React, { useEffect, useRef, useState } from 'react';
import { Wrapper, Status } from '@googlemaps/react-wrapper';
import { GOOGLE_MAPS_API_KEY, MAP_CONFIG, INTERVENTION_COLORS } from '../config/googleMapsConfig';
import { reportStorage } from '../services/reportStorage';
import ReportDetailView from './ReportDetailView';

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

interface GoogleMapViewProps {
  user: any;
  onBack: () => void;
}

interface MapProps {
  center: google.maps.LatLngLiteral;
  zoom: number;
  interventions: Intervention[];
  onViewDetail: (numeroReporte: string) => void;
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
  
  // Hermanas Mirabal
  'Villa Tapia (H.M.)': { lat: 19.3333, lng: -70.3667 },
  
  // Samaná
  'Samaná': { lat: 19.2044, lng: -69.3364 },
  'Las Terrenas': { lat: 19.3167, lng: -69.5333 },
  'Sánchez': { lat: 19.2333, lng: -69.6000 },
  
  // San José de Ocoa
  'San José de Ocoa': { lat: 18.5469, lng: -70.5000 },
  'Sabana Larga': { lat: 18.6167, lng: -70.4833 },
  'Rancho Arriba': { lat: 18.6833, lng: -70.4167 }
};

const Map: React.FC<MapProps> = ({ center, zoom, interventions, onViewDetail }) => {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);

  useEffect(() => {
    if (ref.current && !mapRef.current) {
      mapRef.current = new window.google.maps.Map(ref.current, {
        center,
        zoom,
        mapTypeId: 'roadmap',
        styles: [
          {
            featureType: 'administrative',
            elementType: 'geometry',
            stylers: [{ visibility: 'off' }]
          },
          {
            featureType: 'poi',
            stylers: [{ visibility: 'off' }]
          }
        ]
      });
    }
  }, [center, zoom]);

  useEffect(() => {
    if (mapRef.current) {
      // Limpiar marcadores existentes
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];

      // Agregar nuevos marcadores
      interventions.forEach((intervention, index) => {
        let position: google.maps.LatLngLiteral;

        // Usar coordenadas GPS si están disponibles
        if (intervention.latitud && intervention.longitud) {
          position = { lat: intervention.latitud, lng: intervention.longitud };
        } else {
          // Usar coordenadas del municipio
          const municipioCoords = municipioCoordinates[intervention.municipio];
          if (municipioCoords) {
            position = municipioCoords;
          } else {
            // Coordenadas por defecto (Santo Domingo)
            position = { lat: 18.4861, lng: -69.9312 };
          }
        }

        // Definir colores por tipo de intervención
        const getMarkerColor = (tipo: string) => {
          // Buscar coincidencia en INTERVENTION_COLORS
          for (const [key, color] of Object.entries(INTERVENTION_COLORS)) {
            if (tipo.includes(key)) return color;
          }
          return INTERVENTION_COLORS.default;
        };

        const marker = new window.google.maps.Marker({
          position,
          map: mapRef.current,
          title: `${intervention.tipoIntervencion} - ${intervention.municipio}`,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            fillColor: getMarkerColor(intervention.tipoIntervencion),
            fillOpacity: 0.8,
            strokeColor: '#FFFFFF',
            strokeWeight: 2,
            scale: 8
          }
        });

        // Crear ventana de información
        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="font-family: Arial, sans-serif; max-width: 300px;">
              <h3 style="margin: 0 0 10px 0; color: #2c3e50; font-size: 16px;">
                ${intervention.tipoIntervencion}
              </h3>
              <div style="font-size: 14px; line-height: 1.5;">
                ${intervention.numeroReporte ? `<p style="margin: 5px 0; padding: 5px 10px; background-color: #3498db; color: white; border-radius: 4px; font-weight: bold; text-align: center;">📋 ${intervention.numeroReporte}</p>` : ''}
                <p style="margin: 5px 0;"><strong>📍 Ubicación:</strong></p>
                <p style="margin: 2px 0 10px 20px; color: #555;">
                  ${intervention.region} → ${intervention.provincia}<br>
                  ${intervention.distrito} → ${intervention.municipio}<br>
                  Sector: ${intervention.sector}
                </p>
                <p style="margin: 5px 0;"><strong>👤 Usuario:</strong> ${intervention.usuario}</p>
                <p style="margin: 5px 0;"><strong>📅 Fecha:</strong> ${new Date(intervention.timestamp).toLocaleDateString('es-DO')}</p>
                ${intervention.latitud && intervention.longitud ? 
                  `<p style="margin: 5px 0;"><strong>📌 GPS:</strong> ${intervention.latitud.toFixed(6)}, ${intervention.longitud.toFixed(6)}</p>` : 
                  `<p style="margin: 5px 0; color: #e74c3c;"><strong>📌 GPS:</strong> Ubicación aproximada</p>`
                }
                <div style="margin-top: 15px; text-align: center;">
                  <button
                    id="view-detail-btn-${intervention.id}"
                    style="
                      display: inline-flex;
                      align-items: center;
                      justify-content: center;
                      gap: 8px;
                      padding: 10px 20px;
                      background-color: #3498db;
                      color: white;
                      border: 2px solid #3498db;
                      border-radius: 50px;
                      font-size: 14px;
                      font-weight: bold;
                      cursor: pointer;
                      transition: all 0.3s ease;
                      box-shadow: 0 2px 8px rgba(52, 152, 219, 0.3);
                    "
                    onmouseover="this.style.backgroundColor='#2980b9'; this.style.transform='scale(1.05)';"
                    onmouseout="this.style.backgroundColor='#3498db'; this.style.transform='scale(1)';"
                  >
                    Ir
                    <span style="font-size: 16px;">→</span>
                  </button>
                </div>
              </div>
            </div>
          `
        });

        marker.addListener('click', () => {
          infoWindow.open(mapRef.current, marker);
          
          // Agregar listener al botón después de que se abra el InfoWindow
          setTimeout(() => {
            const btn = document.getElementById(`view-detail-btn-${intervention.id}`);
            if (btn && intervention.numeroReporte) {
              btn.onclick = () => onViewDetail(intervention.numeroReporte!);
            }
          }, 100);
        });

        markersRef.current.push(marker);
      });

      // Ajustar vista para mostrar todos los marcadores
      if (interventions.length > 0) {
        const bounds = new window.google.maps.LatLngBounds();
        markersRef.current.forEach(marker => {
          const position = marker.getPosition();
          if (position) bounds.extend(position);
        });
        mapRef.current.fitBounds(bounds);
        
        // Establecer zoom máximo
        const listener = window.google.maps.event.addListener(mapRef.current, 'bounds_changed', () => {
          if (mapRef.current && mapRef.current.getZoom() && mapRef.current.getZoom()! > 15) {
            mapRef.current.setZoom(15);
          }
          window.google.maps.event.removeListener(listener);
        });
      }
    }
  }, [interventions]);

  return <div ref={ref} style={{ width: '100%', height: '100%' }} />;
};

const render = (status: Status) => {
  switch (status) {
    case Status.LOADING:
      return <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '500px',
        fontSize: '18px',
        color: '#666'
      }}>
        🌍 Cargando Google Maps...
      </div>;
    case Status.FAILURE:
      return <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '500px',
        fontSize: '18px',
        color: '#e74c3c',
        flexDirection: 'column'
      }}>
        <div>❌ Error al cargar Google Maps</div>
        <div style={{ fontSize: '14px', marginTop: '10px' }}>
          Verifique la clave API y la conexión a internet
        </div>
      </div>;
    case Status.SUCCESS:
      return <div>✅ Google Maps cargado correctamente</div>;
    default:
      return <div>🔄 Inicializando...</div>;
  }
};

const GoogleMapView: React.FC<GoogleMapViewProps> = ({ user, onBack }) => {
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [allTypes, setAllTypes] = useState<string[]>([]);
  const [showDetailView, setShowDetailView] = useState(false);
  const [selectedReportNumber, setSelectedReportNumber] = useState<string>('');

  useEffect(() => {
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

    // Obtener tipos únicos de intervenciones
    const typeSet = new Set();
    interventionsData.forEach((i: Intervention) => typeSet.add(i.tipoIntervencion));
    const types = Array.from(typeSet) as string[];
    setAllTypes(types);
    setSelectedTypes(types); // Mostrar todos por defecto
  }, [user]);

  // Filtrar por tipo y búsqueda
  const filteredInterventions = interventions.filter(intervention => {
    const matchesType = selectedTypes.includes(intervention.tipoIntervencion);
    if (!searchQuery.trim()) return matchesType;
    
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      intervention.numeroReporte?.toLowerCase().includes(query) ||
      intervention.municipio?.toLowerCase().includes(query) ||
      intervention.provincia?.toLowerCase().includes(query) ||
      intervention.sector?.toLowerCase().includes(query) ||
      intervention.tipoIntervencion?.toLowerCase().includes(query);
    
    return matchesType && matchesSearch;
  });

  const toggleType = (type: string) => {
    setSelectedTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const center = MAP_CONFIG.center;
  const zoom = MAP_CONFIG.zoom;

  const getTypeColor = (tipo: string) => {
    for (const [key, color] of Object.entries(INTERVENTION_COLORS)) {
      if (tipo.includes(key)) return color;
    }
    return INTERVENTION_COLORS.default;
  };

  const handleViewDetail = (numeroReporte: string) => {
    setSelectedReportNumber(numeroReporte);
    setShowDetailView(true);
  };

  const handleBackToMap = () => {
    setShowDetailView(false);
    setSelectedReportNumber('');
  };

  if (showDetailView && selectedReportNumber) {
    return <ReportDetailView numeroReporte={selectedReportNumber} onBack={handleBackToMap} />;
  }

  return (
    <div className="dashboard">
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

      <div className="dashboard-content">
        <div className="map-search-container">
          <input
            type="text"
            className="map-search-input"
            placeholder="🔍 Buscar por # reporte, municipio, provincia..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button 
              className="map-search-clear"
              onClick={() => setSearchQuery('')}
            >
              ×
            </button>
          )}
        </div>
        <div style={{ width: '100%', height: '400px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', overflow: 'hidden', marginBottom: '16px' }}>
          <Wrapper apiKey={GOOGLE_MAPS_API_KEY} render={render}>
            <Map center={center} zoom={zoom} interventions={filteredInterventions} onViewDetail={handleViewDetail} />
          </Wrapper>
        </div>
      </div>
    </div>
  );
};

export default GoogleMapView;