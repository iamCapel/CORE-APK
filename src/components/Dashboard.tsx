import React, { useState, useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { Geolocation } from '@capacitor/geolocation';
import { Camera, CameraResultType } from '@capacitor/camera';
import { addWatermarkToPhoto, savePhotoToGallery } from '../services/photoWatermark';
import ReportsPage from './ReportsPage';
import ReportForm from './ReportForm';
import ExportPage from './ExportPage';
import UsersPage from './UsersPage';
import GoogleMapView from './GoogleMapView';
import LeafletMapView from './LeafletMapView';
import PendingReportsModal from './PendingReportsModal';
import MyReportsList from './MyReportsList';
import MyReportsListModern from './MyReportsListModern';
import MyReportsHierarchy from './MyReportsHierarchy';
import ReportViewModern from './ReportViewModern';
import UserSettingsPage from './UserSettingsPage';
import HeavyVehiclesPage from './HeavyVehiclesPage';
import AppLayout from './AppLayout';
import { UserRole, applyUserTheme, getRoleBadge, normalizeRole } from '../types/userRoles';
import { userStorage } from '../services/userStorage';
import * as firebaseUserStorage from '../services/firebaseUserStorage';
import firebaseReportStorage from '../services/firebaseReportStorage';
import { MdAdd, MdBarChart, MdMap, MdPeople, MdFileUpload } from 'react-icons/md';
import { useGpsTracker } from '../hooks/useGpsTracker';
import LiveLocationService from '../services/liveLocationService';
import './Dashboard.css';
import './BottomNavigation.css';
import './MyReportsPage.css';
import './ModernDashboard.css';

/* ── Iconos para navegación inferior ── */
const HomeIcon = ({ size = 24, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
    <polyline points="9 22 9 12 15 12 15 22"></polyline>
  </svg>
);

const CreateIcon = ({ size = 24, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

const OptionsIcon = ({ size = 24, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"></circle>
    <path d="M12 1v6m0 6v6m4.22-13.22 4.24 4.24M1.54 9.96l4.24 4.24M1.54 14.04l4.24-4.24M18.46 14.04l4.24-4.24"></path>
  </svg>
);

/* ── Icono de usuario cuadrado para la topbar ── */
const UserAvatarIcon: React.FC<{ photoUrl?: string }> = ({ photoUrl }) => {
  if (photoUrl) {
    return <img src={photoUrl} alt="Avatar" className="topbar-av-photo topbar-av-md" style={{ objectFit: 'cover' }} />;
  }
  return (
    <div className="topbar-av-photo topbar-av-md">
      <svg
        width="55%" height="55%"
        viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round"
      >
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    </div>
  );
};

// some versions of react-icons export components typed as ReactNode, which
// can confuse TypeScript when used in JSX.  Cast them to a generic
// ComponentType to keep the compiler happy.
type IconComponent = React.ComponentType<any>;
const AddIcon = MdAdd as IconComponent;
const BarChartIcon = MdBarChart as IconComponent;
const MapIcon = MdMap as IconComponent;
const PeopleIcon = MdPeople as IconComponent;
const TruckIcon = ({ size = 24, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 3h15v18H1V3zm16 0l-4 4v10l4 4V3zm-2 2v12h2V5h-2z"/>
    <rect x="9" y="7" width="6" height="6" rx="1"/>
    <path d="M9 13h6"/>
  </svg>
);
const FileUploadIcon = MdFileUpload as IconComponent;

/* ── Icono de Cámara ── */
const CameraIcon = ({ size = 24, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
    <circle cx="12" cy="13" r="4"></circle>
  </svg>
);

type Field = { key: string; label: string; type: 'text' | 'number'; unit: string };

interface User {
  username: string;
  name: string;
  profilePhoto?: string;
  fullName?: string;
  birthDate?: string;
  idCardPhoto?: string;
  profileCompleted?: boolean;
  role?: UserRole; // Agregar rol al usuario
}

const plantillaDefault: Field[] = [
  { key: 'punto_inicial', label: 'Punto inicial de la intervención', type: 'text', unit: 'Coordenadas decimales' },
  { key: 'punto_alcanzado', label: 'Punto alcanzado en la intervención', type: 'text', unit: 'Coordenadas decimales' },
  { key: 'longitud_intervencion', label: 'Longitud de intervención', type: 'number', unit: 'km' },
  { key: 'limpieza_superficie', label: 'Limpieza de superficie', type: 'number', unit: 'm²' },
  { key: 'perfilado_superficie', label: 'Perfilado de superficie', type: 'number', unit: 'm²' },
  { key: 'compactado_superficie', label: 'Compactado de superficie', type: 'number', unit: 'm²' },
  { key: 'conformacion_cunetas', label: 'Conformación de cunetas', type: 'number', unit: 'ml' },
  { key: 'extraccion_bote_material', label: 'Extracción y bote de material inservible', type: 'number', unit: 'm³' },
  { key: 'escarificacion_superficies', label: 'Escarificación de superficies', type: 'number', unit: 'm²' },
  { key: 'conformacion_plataforma', label: 'Conformación de plataforma', type: 'number', unit: 'm²' },
  { key: 'zafra_material', label: 'Zafra de material', type: 'number', unit: 'm³' },
  { key: 'motonivelacion_superficie', label: 'Motonivelación de superficie', type: 'number', unit: 'm²' },
  { key: 'suministro_extension_material', label: 'Suministro y extensión de material', type: 'number', unit: 'm³' },
  { key: 'suministro_colocacion_grava', label: 'Suministro y colocación de grava', type: 'number', unit: 'm³' },
  { key: 'nivelacion_compactacion_grava', label: 'Nivelación y compactación de grava', type: 'number', unit: 'm²' },
  { key: 'reparacion_alcantarillas', label: 'Reparación de alcantarillas existentes', type: 'number', unit: 'und' },
  { key: 'construccion_alcantarillas', label: 'Construcción de alcantarillas', type: 'number', unit: 'und' },
  { key: 'limpieza_alcantarillas', label: 'Limpieza de alcantarillas', type: 'number', unit: 'und' },
  { key: 'limpieza_cauces', label: 'Limpieza de cauces y cañadas', type: 'number', unit: 'ml' },
  { key: 'obras_drenaje', label: 'Obras de drenaje', type: 'number', unit: 'ml' },
  { key: 'construccion_terraplenes', label: 'Construcción de terraplenes', type: 'number', unit: 'm³' },
  { key: 'relleno_compactacion', label: 'Relleno y compactación de material', type: 'number', unit: 'm³' },
  { key: 'conformacion_taludes', label: 'Conformación de taludes', type: 'number', unit: 'm²' }
];

const regionesRD = [
  'Ozama o Metropolitana',
  'Cibao Norte',
  'Cibao Sur',
  'Cibao Nordeste',
  'Cibao Noroeste',
  'Santiago',
  'Valdesia',
  'Enriquillo',
  'El Valle',
  'Yuma',
  'Higuamo'
];

const provinciasPorRegion: Record<string, string[]> = {
  'Ozama o Metropolitana': ['Distrito Nacional', 'Santo Domingo'],
  'Cibao Norte': ['Puerto Plata', 'Espaillat'],
  'Cibao Sur': ['La Vega', 'Monseñor Nouel', 'Sánchez Ramírez'],
  'Cibao Nordeste': ['Duarte', 'María Trinidad Sánchez', 'Samaná', 'Hermanas Mirabal'],
  'Cibao Noroeste': ['Valverde', 'Monte Cristi', 'Dajabón', 'Santiago Rodríguez'],
  'Santiago': ['Santiago'],
  'Valdesia': ['San Cristóbal', 'Peravia', 'San José de Ocoa'],
  'Enriquillo': ['Barahona', 'Pedernales', 'Independencia', 'Bahoruco'],
  'El Valle': ['San Juan', 'Elías Piña', 'Azua'],
  'Yuma': ['La Altagracia', 'La Romana', 'El Seibo'],
  'Higuamo': ['San Pedro de Macorís', 'Hato Mayor', 'Monte Plata']
};

// Municipios por Provincia de República Dominicana
const municipiosPorProvincia: Record<string, string[]> = {
  // Cibao Norte
  'Puerto Plata': ['Puerto Plata', 'Altamira', 'Guananico', 'Imbert', 'Los Hidalgos', 'Luperón', 'Río San Juan', 'Villa Isabela', 'Villa Montellano'],
  'Espaillat': ['Moca', 'Cayetano Germosén', 'Gaspar Hernández', 'Jamao al Norte'],
  'Santiago': ['Santiago', 'Bisonó (Navarrete)', 'Jánico', 'Licey al Medio', 'Puñal', 'Sabana Iglesia', 'San José de las Matas', 'Tamboril', 'Villa González'],
  
  // Cibao Sur  
  'La Vega': ['La Vega', 'Constanza', 'Jarabacoa', 'Jima Abajo'],
  'Monseñor Nouel': ['Bonao', 'Maimón', 'Piedra Blanca'],
  'Sánchez Ramírez': ['Cotuí', 'Cevicos', 'Fantino', 'La Mata'],
  
  // Cibao Nordeste
  'Duarte': ['San Francisco de Macorís', 'Arenoso', 'Castillo', 'Eugenio María de Hostos', 'Las Guáranas', 'Pimentel', 'Villa Riva'],
  'María Trinidad Sánchez': ['Nagua', 'Cabrera', 'El Factor', 'Río San Juan'],
  'Samaná': ['Samaná', 'Las Terrenas', 'Sánchez'],
  
  // Cibao Noroeste
  'Monte Cristi': ['Monte Cristi', 'Castañuelas', 'Guayubín', 'Las Matas de Santa Cruz', 'Pepillo Salcedo (Manzanillo)', 'Villa Vásquez'],
  'Dajabón': ['Dajabón', 'El Pino', 'Loma de Cabrera', 'Partido', 'Restauración'],
  'Santiago Rodríguez': ['San Ignacio de Sabaneta', 'Los Almácigos', 'Monción'],
  'Valverde': ['Mao', 'Esperanza', 'Laguna Salada'],
  
  // Cibao Centro
  'Hermanas Mirabal': ['Salcedo', 'Tenares', 'Villa Tapia'],
  
  // Valdesia
  'San Cristóbal': ['San Cristóbal', 'Bajos de Haina', 'Cambita Garabitos', 'Los Cacaos', 'Sabana Grande de Palenque', 'San Gregorio de Nigua', 'Villa Altagracia', 'Yaguate'],
  'Peravia': ['Baní', 'Nizao', 'Sabana Buey'],
  'San José de Ocoa': ['San José de Ocoa', 'Rancho Arriba', 'Sabana Larga'],
  
  // Enriquillo
  'Barahona': ['Barahona', 'Cabral', 'El Peñón', 'Enriquillo', 'Fundación', 'Jaquimeyes', 'La Ciénaga', 'Las Salinas', 'Paraíso', 'Polo', 'Vicente Noble'],
  'Pedernales': ['Pedernales', 'Oviedo'],
  'Independencia': ['Jimaní', 'Cristóbal', 'Duvergé', 'La Descubierta', 'Mella', 'Postrer Río'],
  'Bahoruco': ['Neiba', 'Galván', 'Los Ríos', 'Tamayo', 'Villa Jaragua'],
  
  // El Valle
  'Azua': ['Azua de Compostela', 'Estebanía', 'Guayabal', 'Las Charcas', 'Las Yayas de Viajama', 'Padre Las Casas', 'Peralta', 'Pueblo Viejo', 'Sabana de la Mar', 'Tábara Arriba'],
  'San Juan': ['San Juan de la Maguana', 'Bohechío', 'El Cercado', 'Juan de Herrera', 'Las Matas de Farfán', 'Vallejuelo'],
  'Elías Piña': ['Comendador', 'Bánica', 'El Llano', 'Hondo Valle', 'Juan Santiago', 'Pedro Santana'],
  
  // Higuamo
  'San Pedro de Macorís': ['San Pedro de Macorís', 'Consuelo', 'Guayacanes', 'Quisqueya', 'Ramón Santana'],
  'Hato Mayor': ['Hato Mayor del Rey', 'El Valle', 'Sabana de la Mar'],
  'El Seibo': ['El Seibo', 'Miches'],
  
  // Ozama
  'Distrito Nacional': ['Distrito Nacional'],
  'Santo Domingo': ['Santo Domingo Este', 'Santo Domingo Norte', 'Santo Domingo Oeste', 'Boca Chica', 'Los Alcarrizos', 'Pedro Brand', 'San Antonio de Guerra'],
  
  // Yuma
  'La Altagracia': ['Higüey', 'San Rafael del Yuma'],
  'La Romana': ['La Romana', 'Guaymate', 'Villa Hermosa'],
  
  // Valle
  'Monte Plata': ['Monte Plata', 'Bayaguana', 'Peralvillo', 'Sabana Grande de Boyá', 'Yamasá']
};

const sectoresPorProvincia: Record<string, string[]> = {
  // Cibao Norte
  'Puerto Plata': ['Centro Urbano', 'Costa Dorada', 'Malecon', 'Playa Dorada', 'Cofresí', 'La Unión', 'Las Flores', 'Villa Montellano', 'Los Reyes', 'San Marcos'],
  'Espaillat': ['Centro', 'El Carmen', 'Las Flores', 'La Javilla', 'San Antonio', 'Villa Olga', 'Los Cocos', 'Jamao', 'Río Verde'],
  'Santiago': ['Centro Histórico', 'Los Jardines', 'Bella Vista', 'Cienfuegos', 'La Otra Banda', 'Pueblo Nuevo', 'Villa Olga', 'Los Salados', 'Tamboril Centro', 'Sabana Iglesia'],

  // Cibao Sur
  'La Vega': ['Centro', 'Rincón', 'Buenos Aires', 'Las Flores', 'Constanza Centro', 'Jarabacoa Centro', 'El Limón', 'La Sabina'],
  'Monseñor Nouel': ['Centro de Bonao', 'Villa Sonadora', 'Pueblo Nuevo', 'Los Maestros', 'Maimón Centro', 'Piedra Blanca Centro'],
  'Sánchez Ramírez': ['Cotuí Centro', 'Villa La Mata', 'Fantino Centro', 'Cevicos Centro', 'Los Botados', 'Villa Sonadora'],

  // Cibao Nordeste  
  'Duarte': ['Centro de San Francisco', 'Villa Riva', 'Castillo', 'Pimentel', 'Las Guáranas', 'Arenoso Centro', 'Hostos'],
  'María Trinidad Sánchez': ['Nagua Centro', 'Cabrera Centro', 'Río San Juan Centro', 'El Factor', 'Los Cacaos', 'Villa Clara'],
  'Samaná': ['Santa Bárbara Centro', 'Las Terrenas Centro', 'Sánchez Centro', 'Las Galeras', 'El Limón'],
  'Hermanas Mirabal': ['Salcedo Centro', 'Tenares Centro', 'Villa Tapia Centro', 'La Joya', 'Villa Hermosa'],

  // Cibao Noroeste
  'Valverde': ['Mao Centro', 'Esperanza Centro', 'Laguna Salada Centro', 'Guayacanes', 'Villa Elisa'],  
  'Monte Cristi': ['Monte Cristi Centro', 'Guayubín Centro', 'Castañuelas Centro', 'Las Matas Centro', 'Villa Vásquez Centro'],
  'Dajabón': ['Dajabón Centro', 'Loma de Cabrera Centro', 'Restauración Centro', 'El Pino Centro', 'Partido Centro'],
  'Santiago Rodríguez': ['Sabaneta Centro', 'Monción Centro', 'Villa Los Almácigos Centro', 'Los Quemados', 'El Rubio'],

  // Valdesia
  'San Cristóbal': ['Centro Histórico', 'Villa Altagracia Centro', 'Haina Centro', 'Los Cacaos Centro', 'Nigua Centro', 'Cambita Centro'],
  'Peravia': ['Baní Centro', 'Matanzas Centro', 'Nizao Centro', 'Villa Sombrero', 'Catalina'],  
  'San José de Ocoa': ['Centro', 'Rancho Arriba Centro', 'Sabana Larga Centro', 'El Pinar', 'Los Fríos'],

  // Enriquillo
  'Barahona': ['Barahona Centro', 'Cabral Centro', 'Enriquillo Centro', 'Paraíso Centro', 'Las Salinas Centro', 'Vicente Noble Centro'],
  'Pedernales': ['Pedernales Centro', 'Oviedo Centro', 'Cabo Rojo', 'Manuel Goya'],
  'Independencia': ['Jimaní Centro', 'Duvergé Centro', 'La Descubierta Centro', 'Cristóbal Centro', 'Mella Centro'],
  'Bahoruco': ['Neiba Centro', 'Galván Centro', 'Tamayo Centro', 'Los Ríos Centro', 'Villa Jaragua Centro'],

  // El Valle  
  'Azua': ['Azua Centro', 'Las Charcas Centro', 'Padre Las Casas Centro', 'Peralta Centro', 'Pueblo Viejo Centro'],
  'San Juan': ['San Juan Centro', 'Las Matas de Farfán Centro', 'Bohechío Centro', 'El Cercado Centro', 'Juan de Herrera Centro'],
  'Elías Piña': ['Comendador Centro', 'Bánica Centro', 'Hondo Valle Centro', 'Pedro Santana Centro', 'El Llano Centro'],

  // Higuamo
  'San Pedro de Macorís': ['Centro Histórico', 'Consuelo Centro', 'Los Llanos Centro', 'Quisqueya Centro', 'Ramón Santana Centro'],
  'Hato Mayor': ['Hato Mayor Centro', 'Sabana de la Mar Centro', 'El Valle Centro', 'Yerba Buena', 'Los Hatos'],
  'Monte Plata': ['Monte Plata Centro', 'Bayaguana Centro', 'Sabana Grande Centro', 'Yamasá Centro', 'Peralvillo Centro'],

  // Yuma
  'La Altagracia': ['Higüey Centro', 'Punta Cana', 'Bávaro', 'San Rafael del Yuma Centro', 'Miches', 'El Seibo Centro'],
  'La Romana': ['La Romana Centro', 'Casa de Campo', 'Guaymate Centro', 'Villa Hermosa Centro', 'Caleta'],
  'El Seibo': ['El Seibo Centro', 'Miches Centro', 'Pedro Sánchez', 'Santa Lucía'],

  // Ozama  
  'Distrito Nacional': ['Zona Colonial', 'Gazcue', 'Ciudad Nueva', 'San Carlos', 'Villa Juana', 'Cristo Rey', 'La Esperilla'],
  'Santo Domingo': ['Los Alcarrizos Centro', 'Pedro Brand Centro', 'San Antonio Centro', 'Boca Chica Centro', 'Pantoja', 'Villa Mella']
};

// Distritos municipales organizados por municipio
const distritosPorMunicipio: Record<string, string[]> = {
  // REGIÓN OZAMA O METROPOLITANA
  // Distrito Nacional
  'Santo Domingo': [],
  'Distrito Nacional': [],
  
  // Santo Domingo
  'Santo Domingo Este': ['San Luis', 'Mendoza', 'San Isidro'],
  'Santo Domingo Norte': ['La Victoria', 'Villa Mella'],
  'Santo Domingo Oeste': ['Hato Nuevo', 'Altos de Arroyo Hondo'],
  'Boca Chica': ['La Caleta'],
  'Los Alcarrizos': ['Palmarejo-Villa Linda'],
  'Pedro Brand': [],
  'San Antonio de Guerra': [],
  
  // Monte Plata
  'Monte Plata': ['Chirino', 'Don Juan'],
  'Bayaguana': ['Monte Bonito'],
  'Peralvillo': [],
  'Sabana Grande de Boyá': ['Gonzalo'],
  'Yamasá': [],
  
  // REGIÓN CIBAO NORTE
  // Puerto Plata
  'Puerto Plata': ['Yásica Arriba'],
  'Altamira': ['Río Grande'],
  'Guananico': [],
  'Imbert': [],
  'Los Hidalgos': [],
  'Luperón': ['La Isabela', 'Belloso'],
  'Sosúa': ['Sabaneta de Yásica'],
  'Villa Isabela': [],
  'Villa Montellano': [],
  
  // Espaillat
  'Moca': ['José Contreras', 'San Víctor', 'Juan López'],
  'Cayetano Germosén': [],
  'Gaspar Hernández': ['Veragua'],
  'Jamao al Norte': [],
  
  // REGIÓN SANTIAGO
  // Santiago
  'Santiago de los Caballeros': ['Pedro García', 'El Limón'],
  'Santiago': ['Pedro García', 'El Limón'],
  'Baitoa': [],
  'Bisonó': [],
  'Bisonó (Navarrete)': [],
  'Jánico': ['El Caimito'],
  'Licey al Medio': ['Las Palomas'],
  'Puñal': ['Guayabal'],
  'Sabana Iglesia': [],
  'San José de las Matas': ['El Rubio', 'La Cuesta'],
  'Tamboril': ['Canca la Reyna'],
  'Villa González': ['Palmar Arriba'],
  
  // REGIÓN CIBAO SUR
  // La Vega
  'La Vega': ['Río Verde Arriba', 'El Ranchito'],
  'Constanza': ['Tireo', 'La Sabina'],
  'Jarabacoa': ['Manabao', 'Buena Vista'],
  'Jima Abajo': [],
  
  // Monseñor Nouel
  'Bonao': ['Sabana del Puerto', 'Jayaco'],
  'Maimón': [],
  'Piedra Blanca': [],
  
  // Sánchez Ramírez
  'Cotuí': [],
  'Cevicos': ['La Cueva'],
  'Fantino': [],
  'La Mata': [],
  
  // REGIÓN CIBAO NORDESTE
  // Duarte
  'San Francisco de Macorís': ['La Peña', 'Cenoví'],
  'Arenoso': ['Las Coles', 'El Aguacate'],
  'Castillo': [],
  'Eugenio María de Hostos': ['Sabana Grande'],
  'Las Guáranas': [],
  'Pimentel': [],
  'Villa Riva': ['Agua Santa del Yuna'],
  
  // María Trinidad Sánchez
  'Nagua': ['Las Gordas', 'San José de Matanzas'],
  'Cabrera': ['Arroyo Salado'],
  'El Factor': ['El Pozo'],
  'Río San Juan': [],
  
  // Samaná
  'Samaná': ['El Limón', 'Arroyo Barril', 'Las Galeras'],
  'Las Terrenas': [],
  'Sánchez': [],
  
  // Hermanas Mirabal
  'Salcedo': ['Jamao Afuera', 'Blanco'],
  'Tenares': [],
  'Villa Tapia': [],
  
  // REGIÓN CIBAO NOROESTE
  // Valverde
  'Mao': ['Guatapanal', 'Jaibón', 'Amina'],
  'Esperanza': ['Maizal', 'Jicomé'],
  'Laguna Salada': ['Jaibón'],
  
  // Monte Cristi
  'Monte Cristi': ['Villa Elisa'],
  'Castañuelas': ['Palo Verde'],
  'Guayubín': ['Hatillo Palma', 'Cana Chapetón'],
  'Las Matas de Santa Cruz': [],
  'Pepillo Salcedo': [],
  'Pepillo Salcedo (Manzanillo)': [],
  'Villa Vásquez': [],
  
  // Dajabón
  'Dajabón': [],
  'El Pino': [],
  'Loma de Cabrera': ['Capotillo'],
  'Partido': [],
  'Restauración': [],
  
  // Santiago Rodríguez
  'Sabaneta': [],
  'San Ignacio de Sabaneta': [],
  'Monción': [],
  'Villa Los Almácigos': [],
  'Los Almácigos': [],
  
  // REGIÓN VALDESIA
  // San Cristóbal
  'San Cristóbal': [],
  'Bajos de Haina': ['El Carril'],
  'Cambita Garabitos': ['Medina'],
  'Los Cacaos': [],
  'Sabana Grande de Palenque': [],
  'San Gregorio de Nigua': [],
  'Villa Altagracia': ['San José del Puerto', 'La Guinea'],
  'Yaguate': ['Doña Ana'],
  
  // Peravia
  'Baní': ['El Cañafístol', 'Villa Fundación', 'Paya', 'Villa Sombrero', 'El Limonal', 'Los Almácigos'],
  'Nizao': ['Pizarrete'],
  'Matanzas': ['Santana'],
  'Sabana Buey': [],
  
  // San José de Ocoa
  'San José de Ocoa': [],
  'Rancho Arriba': [],
  'Sabana Larga': [],
  
  // REGIÓN ENRIQUILLO
  // Barahona
  'Barahona': [],
  'Cabral': [],
  'El Peñón': [],
  'Enriquillo': ['Arroyo Dulce'],
  'Fundación': ['Pescadería'],
  'Jaquimeyes': ['Palo Alto'],
  'La Ciénaga': [],
  'Las Salinas': [],
  'Paraíso': ['Los Patos', 'Canoa'],
  'Polo': [],
  'Vicente Noble': [],
  
  // Pedernales
  'Pedernales': ['José Francisco Peña Gómez'],
  'Oviedo': ['Juancho'],
  
  // Independencia
  'Jimaní': ['El Limón'],
  'Cristóbal': ['Batey 8'],
  'Duvergé': [],
  'La Descubierta': ['Boca de Cachón'],
  'Mella': ['La Colonia'],
  'Postrer Río': ['Guayabal'],
  
  // Bahoruco
  'Neiba': [],
  'Galván': ['El Palmar'],
  'Los Ríos': ['Las Clavellinas'],
  'Tamayo': ['Cabral', 'Uvilla'],
  'Villa Jaragua': [],
  
  // REGIÓN EL VALLE
  // San Juan
  'San Juan': ['El Rosario', 'Hato del Padre', 'La Jagua', 'Las Maguanas-Hato Nuevo'],
  'San Juan de la Maguana': ['El Rosario', 'Hato del Padre', 'La Jagua', 'Las Maguanas-Hato Nuevo'],
  'Bohechío': ['Arroyo Cano', 'Yaque'],
  'El Cercado': ['Batista'],
  'Juan de Herrera': ['Jínova'],
  'Las Matas de Farfán': ['Matayaya', 'Carrera de Yegua'],
  'Vallejuelo': ['Jorjillo'],
  
  // Elías Piña
  'Comendador': ['Guayajayuco', 'Sabana Cruz', 'Sabana Larga', 'Guanito'],
  'Bánica': ['Sabana Higüero', 'Sabana Cruz'],
  'El Llano': ['Guayabo'],
  'Hondo Valle': ['Rancho de la Guardia'],
  'Juan Santiago': ['Las Caobas'],
  'Pedro Santana': ['Río Limpio'],
  
  // Azua
  'Azua': ['Barro Arriba', 'Las Barias-La Estancia', 'Los Jovillos'],
  'Azua de Compostela': ['Barro Arriba', 'Las Barias-La Estancia', 'Los Jovillos'],
  'Estebanía': [],
  'Guayabal': [],
  'Las Charcas': [],
  'Las Yayas de Viajama': ['Villarpando'],
  'Padre Las Casas': ['Las Lagunas', 'Palmar de Ocoa'],
  'Peralta': [],
  'Pueblo Viejo': [],
  'Sabana Yegua': ['Proyeto 4'],
  'Sabana de la Mar': ['Elupina Cordero'],
  'Tábara Arriba': ['Amiama Gómez', 'Tábara Abajo', 'Los Toros'],
  
  // REGIÓN HIGUAMO
  // San Pedro de Macorís
  'San Pedro de Macorís': [],
  'Consuelo': [],
  'Guayacanes': ['El Puerto'],
  'Los Llanos': [],
  'Quisqueya': [],
  'Ramón Santana': [],
  
  // Hato Mayor
  'Hato Mayor': ['Mata Palacio', 'Guayabo Dulce'],
  'Hato Mayor del Rey': ['Mata Palacio', 'Guayabo Dulce'],
  'El Valle': [],
  'Yerba Buena': [],
  
  // REGIÓN YUMA
  // La Altagracia
  'Higüey': ['La Otra Banda'],
  'San Rafael del Yuma': ['Boca de Yuma', 'Bayahibe'],
  
  // La Romana
  'La Romana': ['Caleta'],
  'Guaymate': [],
  'Villa Hermosa': ['Cumayasa'],
  
  // El Seibo
  'El Seibo': ['Pedro Sánchez'],
  'Miches': ['El Cedro', 'La Gina']
};

// Mantener compatibilidad: distritosPorProvincia ahora devuelve todos los municipios de la provincia
const distritosPorProvincia: Record<string, string[]> = municipiosPorProvincia;

const opcionesIntervencion = [
  'Rehabilitación Camino Vecinal',
  'Rehabilitación acceso a mina',
  'Restauración Calles comunidad',
  'Confección de cabezal de puente',
  'Restauración de vías de Comunicación',
  'Operativo de Emergencia',
  'Limpieza de alcantarillas',
  'Confección de puente',
  'Limpieza de Cañada',
  'Colocación de alcantarillas',
  'Canalización',
  'Desalojo',
  'Habilitación Zona protegida o Espacio público'
];

const canalOptions = ['Río', 'Arroyo', 'Cañada'];

const plantillasPorIntervencion: Record<string, Field[]> = {
  'Rehabilitación Camino Vecinal': [
    { key: 'nombre_camino', label: 'Nombre del camino vecinal', type: 'text', unit: '' },
    { key: 'punto_inicial', label: 'Punto inicial de la intervención', type: 'text', unit: 'Coordenadas decimales' },
    { key: 'punto_alcanzado', label: 'Punto alcanzado en la intervención', type: 'text', unit: 'Coordenadas decimales' },
    { key: 'longitud_intervencion', label: 'Longitud de intervención', type: 'number', unit: 'km' },
    { key: 'limpieza_superficie', label: 'Limpieza de superficie de rodadura (Incluye Cunetas)', type: 'number', unit: 'm²' },
    { key: 'perfilado_superficie', label: 'Perfilado de superficie', type: 'number', unit: 'm²' },
    { key: 'extraccion_material', label: 'Extracción de material inservible', type: 'number', unit: 'm³' },
    { key: 'bote_material', label: 'Bote de material inservible', type: 'number', unit: 'm³' },
    { key: 'conformacion_plataforma', label: 'Conformación de plataforma', type: 'number', unit: 'm²' },
    { key: 'zafra_material', label: 'Zafra de material', type: 'number', unit: 'm³' },
    { key: 'motonivelacion_superficie', label: 'Motonivelación de superficie', type: 'number', unit: 'm²' },
    { key: 'suministro_extension_material', label: 'Suministro y extensión de material', type: 'number', unit: 'm³' },
    { key: 'suministro_colocacion_grava', label: 'Suministro y colocación de grava', type: 'number', unit: 'm³' },
    { key: 'nivelacion_compactacion_grava', label: 'Nivelación y compactación de grava', type: 'number', unit: 'm²' },
    { key: 'reparacion_alcantarillas', label: 'Reparación de alcantarillas existentes', type: 'number', unit: 'und' },
    { key: 'construccion_alcantarillas', label: 'Construcción de alcantarillas', type: 'number', unit: 'und' },
    { key: 'limpieza_alcantarillas', label: 'Limpieza de alcantarillas', type: 'number', unit: 'und' },
    { key: 'limpieza_cauces', label: 'Limpieza de cauces y cañadas', type: 'number', unit: 'ml' },
    { key: 'obras_drenaje', label: 'Obras de drenaje', type: 'number', unit: 'ml' },
    { key: 'construccion_terraplenes', label: 'Construcción de terraplenes', type: 'number', unit: 'm³' },
    { key: 'relleno_compactacion', label: 'Relleno y compactación de material', type: 'number', unit: 'm³' },
    { key: 'conformacion_taludes', label: 'Conformación de taludes', type: 'number', unit: 'm²' }
  ],
  'Rehabilitación acceso a mina': [{ key: 'nombre_mina', label: 'Nombre mina', type: 'text', unit: '' }, ...plantillaDefault],
  'Restauración Calles comunidad': [...plantillaDefault],
  'Confección de cabezal de puente': [...plantillaDefault],
  'Restauración de vías de Comunicación': [...plantillaDefault],
  'Operativo de Emergencia': [...plantillaDefault],
  'Limpieza de alcantarillas': [...plantillaDefault],
  'Confección de puente': [{ key: 'tipo_puente', label: 'Seleccionar tipo de puente (Alcantarilla / Viga)', type: 'text', unit: '' }, ...plantillaDefault],
  'Limpieza de Cañada': [{ key: 'nombre_canada', label: 'Nombre cañada', type: 'text', unit: '' }, ...plantillaDefault],
  'Colocación de alcantarillas': [...plantillaDefault],
  'Desalojo': [...plantillaDefault],
  'Habilitación Zona protegida o Espacio público': [...plantillaDefault],
  'Canalización:Río': [...plantillaDefault],
  'Canalización:Arroyo': [...plantillaDefault],
  'Canalización:Cañada': [...plantillaDefault]
};

const Dashboard: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const raw = localStorage.getItem('mopc_user');
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      // Normalizar role por si viene con valor antiguo de Firebase ('Administrador', etc.)
      if (parsed.role) {
        parsed.role = normalizeRole(parsed.role);
      }
      return parsed;
    } catch {
      return null;
    }
  });

  // Usar el hook de GPS
  const gpsTracker = useGpsTracker();

  const [searchValue, setSearchValue] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  // login state
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Bottom navigation state
  const [activeNav, setActiveNav] = useState('dashboard');

  // Navigation states
  const [showReportsPage, setShowReportsPage] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);
  const [showExportPage, setShowExportPage] = useState(false);
  const [showUsersPage, setShowUsersPage] = useState(false);
  const [showGoogleMapView, setShowGoogleMapView] = useState(false);
  const [showLeafletMapView, setShowLeafletMapView] = useState(false);
  const [showHierarchy, setShowHierarchy] = useState(false);
  const [showSettingsPage, setShowSettingsPage] = useState(false);
  const [showHeavyVehiclesPage, setShowHeavyVehiclesPage] = useState(false);
  const [interventionToEdit, setInterventionToEdit] = useState<any>(null);

  // ReportView states
  const [showReportView, setShowReportView] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  // GPS states
  const [isGpsEnabled, setIsGpsEnabled] = useState(false);
  const [gpsPosition, setGpsPosition] = useState<{ lat: number; lon: number } | null>(null);

  // Estado para el contador de notificaciones
  const [pendingCount, setPendingCount] = useState(0);
  const [pendingReportsList, setPendingReportsList] = useState<any[]>([]);
  const [showPendingModal, setShowPendingModal] = useState(false);
  
  // Estado para el menú desplegable del usuario
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showMyReportsModal, setShowMyReportsModal] = useState(false);
  const [showCompleteProfileModal, setShowCompleteProfileModal] = useState(false);

  // Estados del nuevo “Nivel de Estabilidad” con giroscopio
  const [showStabilityModal, setShowStabilityModal] = useState(false);
  const [stabilityScore, setStabilityScore] = useState(100);
  const [stabilityText, setStabilityText] = useState('Listo para medir');
  const [gyroData, setGyroData] = useState({ alpha: 0, beta: 0, gamma: 0 });
  const lastGyroRef = useRef<{ alpha: number; beta: number; gamma: number } | null>(null);
  const [gyroPermissionPrompted, setGyroPermissionPrompted] = useState(false);
  
  // Estados para el formulario de completar perfil
  const [profilePhoto, setProfilePhoto] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [birthDate, setBirthDate] = useState<string>('');
  const [idCardPhoto, setIdCardPhoto] = useState<string>('');
  const [idCardNumber, setIdCardNumber] = useState<string>(''); // Nuevo estado para cédula
  const [showProfileIncompleteNotification, setShowProfileIncompleteNotification] = useState(false);
  const [isProfileComplete, setIsProfileComplete] = useState(false);

  // Función para actualizar el contador de pendientes del usuario actual
  const updatePendingCount = async () => {
    try {
      // Obtener reportes con estado 'pendiente' de la colección principal
      const allPending = await firebaseReportStorage.getReportsByEstado('pendiente');
      
      // Filtrar solo los del usuario actual
      const userPending = allPending.filter(report => 
        report.usuarioId === user?.username || report.creadoPor === user?.username
      );
      
      setPendingCount(userPending.length);
      console.log(`📊 Reportes pendientes del usuario ${user?.username}:`, userPending.length);
    } catch (error) {
      console.error('❌ Error actualizando contador de pendientes:', error);
      setPendingCount(0);
    }
  };

  // Función para obtener lista detallada de reportes pendientes del usuario
  const getPendingReports = async () => {
    try {
      // Obtener reportes con estado 'pendiente' de la colección principal
      const allPending = await firebaseReportStorage.getReportsByEstado('pendiente');
      
      // Filtrar solo los del usuario actual
      const userPending = allPending.filter(report => 
        report.usuarioId === user?.username || report.creadoPor === user?.username
      );

      const formatted = userPending.map(report => {
        try {
          return {
            id: report.id,
            reportNumber: report.numeroReporte || `P-${report.id.slice(-6)}`,
            numeroReporte: report.numeroReporte || `P-${report.id.slice(-6)}`,
            timestamp: report.timestamp || report.fechaCreacion,
            estado: report.estado,
            region: report.region || 'N/A',
            provincia: report.provincia || 'N/A',
            municipio: report.municipio || 'N/A',
            distrito: report.distrito || 'N/A',
            tipoIntervencion: report.tipoIntervencion || 'No especificado',
            creadoPor: report.creadoPor || 'Desconocido'
          };
        } catch {
          return {
            id: report.id,
            reportNumber: `ERR-${Date.now().toString().slice(-6)}`,
            numeroReporte: `ERR-${Date.now().toString().slice(-6)}`,
            timestamp: new Date().toISOString(),
            estado: 'error',
            region: 'Error',
            provincia: 'Error',
            municipio: 'Error',
            tipoIntervencion: 'Error al cargar'
          };
        }
      });
      setPendingReportsList(formatted);
      return formatted;
    } catch (error) {
      console.error('❌ Error obteniendo reportes pendientes:', error);
      setPendingReportsList([]);
      return [];
    }
  };

  // Función para continuar un reporte pendiente
  const handleContinuePendingReport = async (reportId: string) => {
    try {
      console.log('📋 Cargando reporte pendiente desde Firebase:', reportId);
      
      // Cargar desde la colección principal de reportes (no desde pendingReports)
      const pendingReport = await firebaseReportStorage.getReport(reportId);
      
      console.log('📦 Datos del reporte desde Firebase:', pendingReport);
      
      if (pendingReport && pendingReport.estado === 'pendiente') {
        // Convertir el reporte completo a formato de edición
        const dataToLoad = {
          id: pendingReport.id,
          region: pendingReport.region,
          provincia: pendingReport.provincia,
          distrito: pendingReport.distrito,
          municipio: pendingReport.municipio,
          sector: pendingReport.sector,
          tipoIntervencion: pendingReport.tipoIntervencion,
          subTipoCanal: pendingReport.subTipoCanal,
          observaciones: pendingReport.observaciones,
          plantillaValues: pendingReport.metricData || {},
          autoGpsFields: pendingReport.gpsData || {},
          vehiculos: pendingReport.vehiculos || [],
          fechaInicio: pendingReport.fechaInicio || (pendingReport.fechaCreacion ? pendingReport.fechaCreacion.split('T')[0] : ''),
          fechaFinal: pendingReport.fechaFinal || '',
          fechaReporte: pendingReport.fechaCreacion ? pendingReport.fechaCreacion.split('T')[0] : '',
          estado: pendingReport.estado,
          // Restaurar datos multi-día si existen
          diasTrabajo: pendingReport.diasTrabajo || [],
          reportesPorDia: pendingReport.reportesPorDia || {},
          diaActual: pendingReport.diaActual || 0,
          _pendingReportId: pendingReport.id // ID del reporte pendiente para actualizar
        };
        
        console.log('✅ Datos a cargar en el formulario:', dataToLoad);
        
        setInterventionToEdit(dataToLoad);
        setShowPendingModal(false);
        setShowMyReportsModal(false);
        setShowReportForm(true);
        setActiveNav('crear');
      } else {
        console.error('❌ No se encontró el reporte pendiente en Firebase:', reportId);
        alert('No se pudo cargar el reporte pendiente');
      }
    } catch (error) {
      console.error('❌ Error al cargar el reporte pendiente desde Firebase:', error);
      alert('Error al cargar el reporte pendiente');
    }
  };

  // Función para cancelar/eliminar un reporte pendiente
  const handleCancelPendingReport = async (reportId: string) => {
    try {
      // Eliminar de la colección principal de Firebase
      await firebaseReportStorage.deleteReport(reportId);
      console.log('✅ Reporte pendiente eliminado de Firebase');
      await updatePendingCount();
      // Actualizar la vista del modal
      setShowPendingModal(false);
      setTimeout(() => setShowPendingModal(true), 100);
    } catch (error) {
      console.error('❌ Error eliminando reporte pendiente:', error);
      alert('Error al eliminar el reporte pendiente. Verifique su conexión a internet.');
    }
  };

  // Funciones para ReportView
  // reportIdOrNumber puede ser el ID del reporte o el número de reporte (numeroReporte)
  const handleOpenReportView = (reportIdOrNumber: string) => {
    console.log('🔍 handleOpenReportView llamado con:', reportIdOrNumber);
    console.log('🔍 Estado actual:', { showReportView, selectedReportId });
    
    setSelectedReportId(reportIdOrNumber);
    setShowReportView(true);
    
    console.log('🔍 Después de actualizar estado:', { 
      showReportView: true, 
      selectedReportId: reportIdOrNumber 
    });
  };

  const handleCloseReportView = () => {
    setShowReportView(false);
    setSelectedReportId(null);
    setActiveNav('dashboard'); // Volver al botón home
  };

  const handleEditReportFromView = (report: any) => {
    console.log('Editando reporte desde ReportViewModern:', report);
    // Convertir el reporte al formato esperado por el formulario
    const dataToLoad = {
      id: report.id,
      region: report.region,
      provincia: report.provincia,
      distrito: report.distrito,
      municipio: report.municipio,
      sector: report.sector,
      tipoIntervencion: report.tipoIntervencion,
      subTipoCanal: report.subTipoCanal,
      observaciones: report.observaciones,
      metricData: report.metricData || {},
      gpsData: report.gpsData || {},
      vehiculos: report.vehiculos || [],
      fechaInicio: report.fechaInicio || (report.fechaCreacion ? report.fechaCreacion.split('T')[0] : ''),
      fechaFinal: report.fechaFinal || '',
      fechaReporte: report.fechaCreacion ? report.fechaCreacion.split('T')[0] : '',
      estado: report.estado,
      // Restaurar datos multi-día si existen
      diasTrabajo: report.diasTrabajo || [],
      reportesPorDia: report.reportesPorDia || {},
      diaActual: report.diaActual || 0,
    };
    
    setInterventionToEdit(dataToLoad);
    setShowReportView(false);
    setShowReportForm(true);
  };

  const handleDeleteReportFromView = (reportId: string) => {
    console.log('Eliminando reporte desde ReportViewModern:', reportId);
    // Aquí puedes implementar la lógica de eliminación
    alert('Función de eliminación no implementada aún');
  };

  const handleExportReportFromView = (report: any) => {
    console.log('Exportando reporte desde ReportViewModern:', report);
    // Aquí puedes implementar la lógica de exportación
    alert('Función de exportación no implementada aún');
  };

  // Actualizar contador al cargar y cada vez que cambie localStorage
  useEffect(() => {
    updatePendingCount();
    
    // Escuchar cambios en localStorage
    const handleStorageChange = () => {
      updatePendingCount();
    };

    window.addEventListener('storage', handleStorageChange);
    
    // También verificar periódicamente por si hay cambios internos
    const interval = setInterval(updatePendingCount, 2000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Cargar reportes pendientes cuando se abre el modal
  useEffect(() => {
    if (showPendingModal) {
      console.log('📥 Modal de pendientes abierto, cargando reportes desde Firebase...');
      getPendingReports();
    }
  }, [showPendingModal]);

  // Cerrar menú desplegable al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showUserMenu && !target.closest('.user-menu-container')) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  // Verificar si el perfil del usuario está completo
  useEffect(() => {
    const checkVerification = async () => {
      if (user) {
        // Verificar si el usuario requiere verificación de perfil desde Firebase
        const firebaseUser = await firebaseUserStorage.getUserByUsername(user.username);
        
        console.log('🔍 Verificando usuario:', user.username);
        console.log('📦 Usuario Firebase:', firebaseUser);
        console.log('✅ isVerified:', firebaseUser?.isVerified);
        
        // Si el usuario no existe en Firebase, no pedir verificación (compatibilidad con localStorage)
        if (!firebaseUser) {
          console.log('ℹ️ Usuario solo en localStorage, sin verificación requerida');
          setShowProfileIncompleteNotification(false);
          setIsProfileComplete(true);
          return;
        }
        
        // Si el usuario existe en Firebase pero no está verificado
        const requiresVerification = !firebaseUser.isVerified;
        
        if (requiresVerification) {
          // Solo mostrar solicitud de verificación si isVerified es false
          const profileData = localStorage.getItem(`profile_${user.username}`);
          if (profileData) {
            const profile = JSON.parse(profileData);
            setProfilePhoto(profile.profilePhoto || '');
            setFullName(profile.fullName || '');
            setBirthDate(profile.birthDate || '');
            setIdCardPhoto(profile.idCardPhoto || '');
            
            // Verificar si todos los campos están completos
            const isComplete = profile.profilePhoto && profile.fullName && profile.birthDate && profile.idCardPhoto;
            setShowProfileIncompleteNotification(!isComplete);
            setIsProfileComplete(isComplete);
          } else {
            setShowProfileIncompleteNotification(true);
            setIsProfileComplete(false);
          }
        } else {
          // Usuario con isVerified = true no necesita verificación de perfil
          console.log('✅ Usuario verificado, ocultando notificación');
          setShowProfileIncompleteNotification(false);
          setIsProfileComplete(true);
        }
      }
    };
    
    checkVerification();
  }, [user]);

  // Iniciar tracking en vivo cuando el usuario inicie sesión
  useEffect(() => {
    if (user && user.username) {
      console.log('📍 Iniciando tracking en vivo para usuario:', user.username);
      
      const liveLocationService = LiveLocationService.getInstance();
      
      // Iniciar tracking en vivo
      liveLocationService.startLiveTracking(user.username)
        .then(() => {
          console.log('✅ Tracking en vivo iniciado exitosamente');
        })
        .catch((error) => {
          console.error('❌ Error iniciando tracking en vivo:', error);
        });

      // Limpiar tracking cuando el usuario cierre sesión
      return () => {
        console.log('📍 Deteniendo tracking en vivo para usuario:', user.username);
        liveLocationService.stopLiveTracking();
      };
    }
  }, [user]);

  // Aplicar tema según el rol del usuario
  useEffect(() => {
    if (user && user.role) {
      // Aplicar tema del rol
      applyUserTheme(user.role);
    } else {
      // Si no hay rol definido, usar rol por defecto (Admin para compatibilidad)
      applyUserTheme(UserRole.ADMIN);
    }
  }, [user]);


  // Solicitar permisos GPS al cargar la aplicación
  useEffect(() => {
    const requestGpsPermission = async () => {
      if ('geolocation' in navigator) {
        try {
          // Solicitar permiso y obtener posición inicial
          navigator.geolocation.getCurrentPosition(
            (position) => {
              setGpsPosition({
                lat: position.coords.latitude,
                lon: position.coords.longitude
              });
              setIsGpsEnabled(true);
              console.log('GPS habilitado al cargar la aplicación');
            },
            (error) => {
              console.warn('Error al obtener GPS inicial:', error.message);
              // Intentar de nuevo con opciones menos estrictas
              navigator.geolocation.getCurrentPosition(
                (position) => {
                  setGpsPosition({
                    lat: position.coords.latitude,
                    lon: position.coords.longitude
                  });
                  setIsGpsEnabled(true);
                  console.log('GPS habilitado en segundo intento');
                },
                (secondError) => {
                  console.warn('GPS no disponible:', secondError.message);
                },
                { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
              );
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 60000 }
          );
        } catch (error) {
          console.warn('Error al solicitar permisos GPS:', error);
        }
      }
    };

    requestGpsPermission();
  }, []);

  const handleBackToDashboard = () => {
    setShowReportsPage(false);
    setShowReportForm(false);
    setShowExportPage(false);
    setShowUsersPage(false);
    setShowHeavyVehiclesPage(false);
    setShowGoogleMapView(false);
    setShowLeafletMapView(false);
    setShowHierarchy(false);
    setShowSettingsPage(false);
    setInterventionToEdit(null);
    setActiveNav('dashboard');
  };

  // Manejar botón de retroceso de Android
  useEffect(() => {
    let backButtonListener: any = null;

    const handleBackButton = () => {
      console.log('🔙 Botón de retroceso presionado');

      if (showReportView) {
        console.log('🔙 Cerrando ReportViewModern');
        handleCloseReportView();
        return;
      }

      if (showMyReportsModal) {
        console.log('🔙 Cerrando Mis Reportes');
        setShowMyReportsModal(false);
        setActiveNav('dashboard');
        return;
      }

      if (showPendingModal) {
        console.log('🔙 Cerrando Reportes Pendientes');
        setShowPendingModal(false);
        setActiveNav('dashboard');
        return;
      }

      if (showCompleteProfileModal) {
        console.log('🔙 Cerrando modal completo de perfil');
        setShowCompleteProfileModal(false);
        return;
      }

      if (showReportForm) {
        console.log('🔙 Saliendo del formulario de reporte');
        if (window.confirm('¿Está seguro que desea salir del formulario? Los datos no guardados se perderán.')) {
          setShowReportForm(false);
          setInterventionToEdit(null);
          handleCloseReportView();
          return;
        }
      }

      if (showStabilityModal) {
        console.log('🔙 Cerrando modal de estabilidad');
        setShowStabilityModal(false);
        return;
      }

      if (showHeavyVehiclesPage) {
        console.log('🔙 Cerrando vista de Vehículos Pesados');
        handleBackToDashboard();
        return;
      }

      if (showReportsPage || showExportPage || showUsersPage || showGoogleMapView || showLeafletMapView || showHierarchy || showSettingsPage) {
        console.log('🔙 Volviendo al dashboard');
        handleBackToDashboard();
        return;
      }

      console.log('🔙 Ya está en el dashboard - salir de la app');
      CapacitorApp.exitApp();
    };

    if (Capacitor.isNativePlatform()) {
      CapacitorApp.addListener('backButton', handleBackButton).then(listener => {
        backButtonListener = listener;
      });
    }

    return () => {
      if (backButtonListener) {
        backButtonListener.remove();
      }
    };
  }, [showReportView, showMyReportsModal, showPendingModal, showCompleteProfileModal, showReportForm, showReportsPage, showExportPage, showUsersPage, showGoogleMapView, showLeafletMapView, showHeavyVehiclesPage, showHierarchy, showSettingsPage, showStabilityModal, handleBackToDashboard, handleCloseReportView, setInterventionToEdit]);

  // Giroscopio + Acelerómetro (modo iOS Level)
  useEffect(() => {
    let orientationListener: ((event: DeviceOrientationEvent) => void) | null = null;
    let motionListener: ((event: DeviceMotionEvent) => void) | null = null;

    const requestPermissionAndStart = async () => {
      if (typeof (DeviceOrientationEvent as any)?.requestPermission === 'function') {
        try {
          const permission = await (DeviceOrientationEvent as any).requestPermission();
          if (permission !== 'granted') {
            setStabilityText('Permiso de giroscopio denegado.');
            return;
          }
        } catch (error) {
          console.error('Error solicitando permiso de giroscopio:', error);
          setStabilityText('No se pudo solicitar permiso de giroscopio.');
          return;
        }
      }

      if (typeof (DeviceMotionEvent as any)?.requestPermission === 'function') {
        try {
          const permission = await (DeviceMotionEvent as any).requestPermission();
          if (permission !== 'granted') {
            setStabilityText('Permiso de acelerómetro denegado.');
            return;
          }
        } catch (error) {
          console.error('Error solicitando permiso de acelerómetro:', error);
          setStabilityText('No se pudo solicitar permiso de acelerómetro.');
          return;
        }
      }

      if (!window.DeviceOrientationEvent && !window.DeviceMotionEvent) {
        setStabilityText('Sensores no disponibles en este dispositivo.');
        return;
      }

      orientationListener = (event: DeviceOrientationEvent) => {
        const alpha = event.alpha ?? 0;
        const beta = event.beta ?? 0;
        const gamma = event.gamma ?? 0;

        setGyroData({ alpha, beta, gamma });
      };

      motionListener = (event: DeviceMotionEvent) => {
        const acc = event.accelerationIncludingGravity;
        if (!acc || acc.x === null || acc.y === null || acc.z === null) return;

        // Calculamos inclinación () basado en vector gravedad.
        const x = acc.x;
        const y = acc.y;
        const z = acc.z;
        const g = Math.sqrt(x * x + y * y + z * z) || 1;

        const pitch = Math.atan2(-x, Math.sqrt(y * y + z * z)) * (180 / Math.PI);
        const roll = Math.atan2(y, z) * (180 / Math.PI);

        const absRoll = Math.abs(roll);
        const absPitch = Math.abs(pitch);

        const levelDeviation = Math.sqrt(absRoll * absRoll + absPitch * absPitch);
        const levelScore = Math.max(0, Math.min(100, 100 - levelDeviation * 2));

        setStabilityScore(Math.round(levelScore));

        if (levelDeviation <= 2) setStabilityText('Nivel perfecto');
        else if (levelDeviation <= 4) setStabilityText('Casi nivel');
        else if (levelDeviation <= 8) setStabilityText('Levemente inclinado');
        else setStabilityText('Muy inclinado');

        setGyroData({ alpha: gyroData.alpha ?? 0, beta: pitch, gamma: roll });
      };

      window.addEventListener('deviceorientation', orientationListener);
      window.addEventListener('devicemotion', motionListener);
      setGyroPermissionPrompted(true);
    };

    if (showStabilityModal) {
      requestPermissionAndStart();
    } else {
      setStabilityText('Listo para medir');
      setStabilityScore(100);
    }

    return () => {
      if (orientationListener) window.removeEventListener('deviceorientation', orientationListener);
      if (motionListener) window.removeEventListener('devicemotion', motionListener);
    };
  }, [showStabilityModal, gyroData.alpha]);

  // Navigation functions
  const submitLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUser.trim() || !loginPass.trim()) {
      setLoginError('Por favor ingrese usuario y contraseña');
      return;
    }

    setIsLoading(true);
    setLoginError('');

    await new Promise(r => setTimeout(r, 1000));

    try {
      console.log('🔐 Intentando login con Firebase...');
      
      // Intentar login con Firebase
      const result = await firebaseUserStorage.loginWithUsername(loginUser, loginPass);
      
      if (result.success && result.user) {
        const validatedUser = result.user;
        
        // Verificar si la cuenta está activa
        if (!validatedUser.isActive) {
          setLoginError('⚠️ Lo sentimos, su cuenta está temporalmente desactivada. Comuníquese con su superior.');
          setIsLoading(false);
          return;
        }
        
        // Credenciales válidas y cuenta activa - usuario autenticado
        const userRole: UserRole = validatedUser.role === 'Administrador' ? UserRole.ADMIN :
                                     validatedUser.role === 'Supervisor' ? UserRole.SUPERVISOR :
                                     UserRole.TECNICO;
        
        const newUser: User = {
          username: validatedUser.username,
          name: validatedUser.name,
          role: userRole
        };
        
        localStorage.setItem('mopc_user', JSON.stringify(newUser));
        setUser(newUser);
        setLoginUser('');
        setLoginPass('');
        
        console.log(`✅ Usuario autenticado desde Firebase como: ${getRoleBadge(userRole)}`);
        setIsLoading(false);
        return;
      }
      
      // Si Firebase falla, intentar con localStorage como fallback
      console.log('⚠️ Firebase login falló, intentando con localStorage...');
      const allUsers = userStorage.getAllUsers();
      console.log('📊 Usuarios en localStorage:', allUsers.length);
      
      const validatedUser = userStorage.validateCredentials(loginUser, loginPass);
      
      if (validatedUser) {
        if (!validatedUser.isActive) {
          setLoginError('⚠️ Lo sentimos, su cuenta está temporalmente desactivada. Comuníquese con su superior.');
          setIsLoading(false);
          return;
        }
        
        const userRole: UserRole = validatedUser.role === 'Administrador' ? UserRole.ADMIN :
                                     validatedUser.role === 'Supervisor' ? UserRole.SUPERVISOR :
                                     UserRole.TECNICO;
        
        const newUser: User = {
          username: validatedUser.username,
          name: validatedUser.name,
          role: userRole
        };
        
        localStorage.setItem('mopc_user', JSON.stringify(newUser));
        setUser(newUser);
        setLoginUser('');
        setLoginPass('');
        
        console.log(`✅ Usuario autenticado desde localStorage como: ${getRoleBadge(userRole)}`);
        setIsLoading(false);
        return;
      }
      
      // Usuario no encontrado en ningún lado
      setLoginError(result.error || `❌ Usuario "${loginUser}" no encontrado`);
      setIsLoading(false);
      
    } catch (err) {
      console.error('❌ Error en login:', err);
      setLoginError('⚠️ Error del sistema. Recargue la página e intente nuevamente.');
      setIsLoading(false);
    }
  };

  // Funciones para manejar el perfil del usuario
  const handleProfilePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleIdCardPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setIdCardPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = () => {
    if (!user) return;

    // Validar que todos los campos estén completos
    if (!profilePhoto || !fullName || !idCardNumber || !idCardPhoto) {
      alert('⚠️ Por favor complete todos los campos requeridos');
      return;
    }

    // Verificar si el usuario está en userStorage
    const storedUser = userStorage.getUserByUsername(user.username);
    
    if (storedUser && storedUser.cedula) {
      // Validar que el número de cédula coincida con el registrado
      const storedCedula = storedUser.cedula;
      
      // Normalizar los números de cédula (quitar guiones, espacios, puntos)
      const normalizedInput = idCardNumber.replace(/[-.\s]/g, '');
      const normalizedStored = storedCedula.replace(/[-.\s]/g, '');
      
      if (normalizedInput !== normalizedStored) {
        alert('❌ Error de verificación');
        return;
      }
    }

    // Guardar en localStorage
    const profileData = {
      profilePhoto,
      fullName,
      birthDate,
      idCardNumber,
      idCardPhoto,
      profileCompleted: true
    };

    localStorage.setItem(`profile_${user.username}`, JSON.stringify(profileData));
    
    // Actualizar el usuario con los datos del perfil
    const updatedUser = {
      ...user,
      ...profileData
    };
    setUser(updatedUser);
    localStorage.setItem('mopc_user', JSON.stringify(updatedUser));

    // Actualizar estados de verificación de perfil
    setShowProfileIncompleteNotification(false);
    setIsProfileComplete(true);
    setShowCompleteProfileModal(false);
    alert('✅ Perfil completado exitosamente. Ahora puede acceder a todas las funcionalidades.');
  };

  const handleLogout = () => {
    setUser(null);
    try { 
      localStorage.removeItem('mopc_user'); 
    } catch {}
  };
  // bandera para alternar entre el estilo tradicional de tarjetas y
  // la nueva propuesta de iconos circulares tipo app móvil.
  const useIconButtons = true;
  // algunos iconos no estarán activos aún (Buscar, Usuarios, Exportar).
  // en lugar de eliminarlos definitivamente los oculta permitiendo
  // reactivar en el futuro simplemente cambiando esta constante.
  const hideUnusedIcons = false;

  const handleShowReports = () => {
    if (!isProfileComplete) {
      setShowCompleteProfileModal(true);
      return;
    }
    setShowHierarchy(true);
    setShowReportsPage(false);
    setShowReportForm(false);
    setShowExportPage(false);
    setShowUsersPage(false);
  };

  const handleShowReportForm = () => {
    if (!isProfileComplete) {
      setShowCompleteProfileModal(true);
      return;
    }
    setShowReportForm(true);
    setShowReportsPage(false);
    setShowExportPage(false);
    setShowUsersPage(false);
    setShowGoogleMapView(false);
    setShowLeafletMapView(false);
    setInterventionToEdit(null);
  };

  // Funciones para manejar la navegación inferior
  const handleBottomNavClick = (navId: string) => {
    setActiveNav(navId);
    
    switch (navId) {
      case 'dashboard':
        setShowReportsPage(false);
        setShowReportForm(false);
        setShowExportPage(false);
        setShowUsersPage(false);
        setShowGoogleMapView(false);
        setShowLeafletMapView(false);
        setInterventionToEdit(null);
        break;
      case 'crear':
        if (!isProfileComplete) {
          setShowCompleteProfileModal(true);
          return;
        }
        setShowReportForm(true);
        setShowReportsPage(false);
        setShowExportPage(false);
        setShowUsersPage(false);
        setShowGoogleMapView(false);
        setShowLeafletMapView(false);
        setInterventionToEdit(null);
        break;
      case 'reportes':
        // Cargar página completa de Mis Reportes
        if (!isProfileComplete) {
          setShowCompleteProfileModal(true);
          return;
        }
        setShowMyReportsModal(true);
        setShowReportsPage(false);
        setShowReportForm(false);
        setShowExportPage(false);
        setShowUsersPage(false);
        setShowGoogleMapView(false);
        setShowLeafletMapView(false);
        break;
      case 'opciones':
        setShowSettingsPage(true);
        setShowReportsPage(false);
        setShowReportForm(false);
        setShowExportPage(false);
        setShowUsersPage(false);
        setShowGoogleMapView(false);
        setShowLeafletMapView(false);
        setShowMyReportsModal(false);
        break;
    }
  };

  const handleShowExportPage = () => {
    if (!isProfileComplete) {
      setShowCompleteProfileModal(true);
      return;
    }
    setShowExportPage(true);
    setShowReportsPage(false);
    setShowReportForm(false);
    setShowUsersPage(false);
    setShowGoogleMapView(false);
    setShowLeafletMapView(false);
  };

  const handleShowUsersPage = () => {
    if (!isProfileComplete) {
      setShowCompleteProfileModal(true);
      return;
    }
    setShowUsersPage(true);
    setShowReportsPage(false);
    setShowReportForm(false);
    setShowExportPage(false);
    setShowGoogleMapView(false);
    setShowLeafletMapView(false);
  };

  const handleShowHeavyVehicles = () => {
    if (!isProfileComplete) {
      setShowCompleteProfileModal(true);
      return;
    }
    setShowHeavyVehiclesPage(true);
    setShowReportsPage(false);
    setShowReportForm(false);
    setShowExportPage(false);
    setShowUsersPage(false);
    setShowGoogleMapView(false);
    setShowLeafletMapView(false);
  };

  const handleOpenStabilityModal = () => {
    if (!isProfileComplete) {
      setShowCompleteProfileModal(true);
      return;
    }
    lastGyroRef.current = null;
    setStabilityScore(0);
    setStabilityText('Esperando datos de giroscopio...');
    setGyroPermissionPrompted(false);
    setShowStabilityModal(true);
  };

  const handleCloseStabilityModal = () => {
    setShowStabilityModal(false);
  };

  const handleShowLeafletMap = () => {
    if (!isProfileComplete) {
      setShowCompleteProfileModal(true);
      return;
    }
    setShowLeafletMapView(true);
    setShowReportsPage(false);
    setShowReportForm(false);
    setShowGoogleMapView(false);
    setShowUsersPage(false);
  };

  // Función para manejar la cámara con geolocalización en vivo, flash y giro
  const handleOpenCamera = async () => {
    if (!isProfileComplete) {
      setShowCompleteProfileModal(true);
      return;
    }

    // Detectar modelo de dispositivo para configuración específica
    const getDeviceModel = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const screenWidth = window.screen.width;
      const screenHeight = window.screen.height;
      
      // Samsung Galaxy A04s: 720x1600
      if (userAgent.includes('a04') || (screenWidth === 720 && screenHeight === 1600)) {
        return 'samsung-a04s';
      }
      // Xiaomi Redmi Note 12: 1080x2400
      else if (userAgent.includes('redmi note 12') || (screenWidth === 1080 && screenHeight === 2400)) {
        return 'xiaomi-redmi-note12';
      }
      // Xiaomi Redmi Note 12 Pro: 1080x2400
      else if (userAgent.includes('redmi note 12 pro') || (screenWidth === 1080 && screenHeight === 2400)) {
        return 'xiaomi-redmi-note12-pro';
      }
      // Samsung Galaxy A03s: 720x1600
      else if (userAgent.includes('a03') || (screenWidth === 720 && screenHeight === 1600)) {
        return 'samsung-a03s';
      }
      // Samsung Galaxy A05s: 720x1600
      else if (userAgent.includes('a05') || (screenWidth === 720 && screenHeight === 1600)) {
        return 'samsung-a05s';
      }
      // Xiaomi Redmi Note 11: 1080x2400
      else if (userAgent.includes('redmi note 11') || (screenWidth === 1080 && screenHeight === 2400)) {
        return 'xiaomi-redmi-note11';
      }
      // Default genérico
      else {
        return 'generic';
      }
    };

    const deviceModel = getDeviceModel();
    console.log('📱 Modelo detectado:', deviceModel);

    try {
      console.log('📷 Iniciando cámara con geolocalización en vivo...');
      
      // Mostrar interfaz de cámara con controles
      const cameraInterface = document.createElement('div');
      cameraInterface.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: black;
        z-index: 10000;
        display: flex;
        flex-direction: column;
      `;
      
      // Header con geolocalización en vivo
      const header = document.createElement('div');
      header.style.cssText = `
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 15px;
        text-align: center;
        font-size: 14px;
      `;
      header.innerHTML = '📍 Obteniendo ubicación...<br/><small>Por favor espere</small>';
      
      // Estados
      let currentPosition: any = null;
      let currentAddress = 'Ubicación desconocida';
      let flashMode = 'off'; // off, on, auto
      let cameraDirection = 'environment'; // environment (trasera) / user (frontal)
      let zoomLevel = 1; // 1x a 4x zoom
      let textSizeLevel = 1; // 1x a 3x tamaño de letra
      
      // Contenedor de video
      const videoContainer = document.createElement('div');
      videoContainer.style.cssText = `
        flex: 1;
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        background: black;
        overflow: hidden;
        max-height: 70vh;
      `;
      
      // Slider de zoom vertical a la izquierda (solo uno para cámara)
      const zoomSlider = document.createElement('input');
      zoomSlider.type = 'range';
      zoomSlider.min = '1';
      zoomSlider.max = '4';
      zoomSlider.step = '0.5';
      zoomSlider.value = zoomLevel.toString();
      zoomSlider.style.cssText = `
        position: absolute;
        left: 5px;
        top: 50%;
        transform: translateY(-50%) rotate(-90deg);
        width: 120px;
        height: 3px;
        background: rgba(255, 255, 255, 0.15);
        outline: none;
        border-radius: 2px;
        z-index: 10;
        -webkit-appearance: none;
        cursor: pointer;
        opacity: 0.7;
        transition: opacity 0.3s ease;
      `;
      
      // Slider para tamaño de texto (georeferencia) - lado derecho vertical
      const textSizeSlider = document.createElement('input');
      textSizeSlider.type = 'range';
      textSizeSlider.min = '1';
      textSizeSlider.max = '3';
      textSizeSlider.step = '0.5';
      textSizeSlider.value = textSizeLevel.toString();
      textSizeSlider.style.cssText = `
        position: absolute;
        right: 5px;
        top: 50%;
        transform: translateY(-50%) rotate(90deg);
        width: 100px;
        height: 3px;
        background: rgba(255, 255, 255, 0.15);
        outline: none;
        border-radius: 2px;
        z-index: 10;
        -webkit-appearance: none;
        cursor: pointer;
        opacity: 0.6;
        transition: opacity 0.3s ease;
      `;
      
      // Estilos más sutiles para los thumbs de los sliders
      const style = document.createElement('style');
      style.textContent = `
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 12px;
          height: 12px;
          background: rgba(255, 107, 0, 0.7);
          cursor: pointer;
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.5);
          box-shadow: 0 0 5px rgba(255, 107, 0, 0.3);
          transition: all 0.3s ease;
        }
        
        input[type="range"]::-moz-range-thumb {
          width: 12px;
          height: 12px;
          background: rgba(255, 107, 0, 0.7);
          cursor: pointer;
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.5);
          box-shadow: 0 0 5px rgba(255, 107, 0, 0.3);
          transition: all 0.3s ease;
        }
        
        input[type="range"]:hover::-webkit-slider-thumb {
          background: rgba(255, 107, 0, 0.9);
          box-shadow: 0 0 8px rgba(255, 107, 0, 0.5);
        }
        
        input[type="range"]:hover::-moz-range-thumb {
          background: rgba(255, 107, 0, 0.9);
          box-shadow: 0 0 8px rgba(255, 107, 0, 0.5);
        }
        
        input[type="range"]:hover {
          opacity: 1;
        }
        
        input[type="range"]::-webkit-slider-runnable-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
        }
        
        input[type="range"]::-moz-range-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
        }
        
        #textSizeIndicator {
          position: absolute;
          right: 5px;
          top: 20px;
          background: rgba(0, 0, 0, 0.6);
          color: rgba(255, 255, 255, 0.8);
          padding: 4px 8px;
          border-radius: 10px;
          font-size: 10px;
          font-weight: bold;
          z-index: 10;
          opacity: 0.8;
        }
      `;
      document.head.appendChild(style);
      
      // Logo MOPC como marca de agua arriba a la derecha del video
      const mopcWatermark = document.createElement('div');
      mopcWatermark.style.cssText = `
        position: absolute;
        top: 20px;
        right: 20px;
        width: 60px;
        height: 60px;
        background: linear-gradient(135deg, rgba(255, 107, 0, 0.8) 0%, rgba(255, 140, 66, 0.8) 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 12px;
        color: white;
        box-shadow: 0 4px 16px rgba(255, 107, 0, 0.5);
        border: 3px solid rgba(255, 255, 255, 0.3);
        z-index: 15;
        backdrop-filter: blur(4px);
      `;
      mopcWatermark.innerHTML = 'MOPC';
      
      // Overlay de georeferencia dentro del video (sin logo MOPC)
      const geoOverlay = document.createElement('div');
      geoOverlay.style.cssText = `
        position: absolute;
        bottom: 20px;
        left: 20px;
        right: 20px;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(8px);
        border-radius: 12px;
        padding: 12px 16px;
        color: white;
        font-size: 12px;
        z-index: 5;
        display: flex;
        flex-direction: column;
        gap: 4px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      `;
      
      // Nombre completo del usuario (usando fullName en lugar de username)
      const userName = document.createElement('div');
      userName.style.cssText = `
        font-weight: bold;
        font-size: 14px;
        color: #FF6B00;
        margin-bottom: 4px;
      `;
      userName.textContent = fullName || 'Miguel De Jesus Cabrera Cruz'; // Nombre completo, no username
      
      // Ubicación actual
      const locationInfo = document.createElement('div');
      locationInfo.style.cssText = `
        font-size: 11px;
        opacity: 0.9;
        line-height: 1.3;
      `;
      locationInfo.innerHTML = '📍 Obteniendo ubicación...';
      
      // Coordenadas
      const coordinatesInfo = document.createElement('div');
      coordinatesInfo.style.cssText = `
        font-size: 10px;
        opacity: 0.7;
        font-family: monospace;
      `;
      coordinatesInfo.innerHTML = 'Lat: --.------, Lon: --.------';
      
      // Ensamblar overlay (sin logo MOPC)
      geoOverlay.appendChild(userName);
      geoOverlay.appendChild(locationInfo);
      geoOverlay.appendChild(coordinatesInfo);
      
      // Video preview
      const video = document.createElement('video');
      video.style.cssText = `
        width: 100%;
        height: 100%;
        object-fit: cover;
        transform: scaleX(-1); // Corregir orientación invertida
      `;
      
      // Controles de cámara
      const controls = document.createElement('div');
      controls.style.cssText = `
        background: rgba(0, 0, 0, 0.9);
        padding: 20px;
        display: flex;
        justify-content: space-around;
        align-items: center;
      `;
      
      // Botón de flash
      const flashButton = document.createElement('button');
      flashButton.style.cssText = `
        background: rgba(255, 255, 255, 0.2);
        border: 2px solid white;
        color: white;
        padding: 15px;
        border-radius: 50%;
        font-size: 20px;
        cursor: pointer;
      `;
      flashButton.innerHTML = '⚡';
      
      // Botón de captura
      const captureButton = document.createElement('button');
      captureButton.style.cssText = `
        background: white;
        border: 3px solid white;
        color: black;
        padding: 20px;
        border-radius: 50%;
        font-size: 24px;
        cursor: pointer;
        font-weight: bold;
      `;
      captureButton.innerHTML = '📷';
      
      // Botón de giro de cámara
      const flipButton = document.createElement('button');
      flipButton.style.cssText = `
        background: rgba(255, 255, 255, 0.2);
        border: 2px solid white;
        color: white;
        padding: 15px;
        border-radius: 50%;
        font-size: 20px;
        cursor: pointer;
      `;
      flipButton.innerHTML = '🔄';
      
      // Botón de cerrar
      const closeButton = document.createElement('button');
      closeButton.style.cssText = `
        background: rgba(255, 0, 0, 0.8);
        border: 2px solid red;
        color: white;
        padding: 10px 20px;
        border-radius: 20px;
        font-size: 14px;
        cursor: pointer;
        position: absolute;
        top: 15px;
        right: 15px;
      `;
      closeButton.innerHTML = '✕';
      
      // Contenedor de controles adicionales (eliminado - ahora sliders laterales)
      // Los controles de tamaño de texto ahora están como slider lateral
      
      // Ensamblar interfaz completa
      controls.appendChild(flashButton);
      controls.appendChild(captureButton);
      controls.appendChild(flipButton);
      
      // Agregar elementos al contenedor de video
      videoContainer.appendChild(video);
      videoContainer.appendChild(zoomSlider);
      videoContainer.appendChild(textSizeSlider);
      videoContainer.appendChild(mopcWatermark); // Marca de agua MOPC
      videoContainer.appendChild(geoOverlay); // Overlay dentro del video
      videoContainer.appendChild(closeButton);
      
      cameraInterface.appendChild(videoContainer);
      cameraInterface.appendChild(controls);
      document.body.appendChild(cameraInterface);

      // Iniciar geolocalización en vivo
      const watchPositionId = await Geolocation.watchPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000
      }, async (position) => {
        currentPosition = position;
        
        // Actualizar overlay de georeferencia dentro del video
        try {
          if (!position || !position.coords) {
            locationInfo.innerHTML = '📍 Obteniendo ubicación...';
            coordinatesInfo.innerHTML = 'Lat: --.------, Lon: --.------';
            return;
          }
          
          // Actualizar coordenadas
          coordinatesInfo.innerHTML = `Lat: ${position.coords.latitude.toFixed(6)}, Lon: ${position.coords.longitude.toFixed(6)}`;
          
          // Obtener dirección con OpenStreetMap Nominatim
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}&accept-language=es`);
          if (response.ok) {
            const data = await response.json();
            if (data && data.address) {
              const addr = data.address;
              const parts = [
                addr.road || addr.pedestrian || addr.street,
                addr.suburb || addr.neighbourhood,
                addr.city || addr.town || addr.village,
                addr.state,
                addr.country
              ].filter(Boolean);
              currentAddress = parts.join(', ');
              locationInfo.innerHTML = `📍 ${currentAddress}`;
            } else {
              locationInfo.innerHTML = `📍 Ubicación desconocida`;
            }
          } else {
            locationInfo.innerHTML = `📍 Lat: ${position.coords.latitude.toFixed(6)}, Lon: ${position.coords.longitude.toFixed(6)}`;
          }
        } catch (error) {
          if (position && position.coords) {
            locationInfo.innerHTML = `📍 Lat: ${position.coords.latitude.toFixed(6)}, Lon: ${position.coords.longitude.toFixed(6)}`;
          } else {
            locationInfo.innerHTML = '📍 Error obteniendo ubicación';
          }
        }
      });
      
      // Iniciar stream de video
      try {
        const constraints: any = {
          video: {
            facingMode: 'environment', // Forzar cámara trasera
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          },
          audio: false
        };
        
        // Configuración específica según modelo
        switch (deviceModel) {
          case 'samsung-a04s':
          case 'samsung-a03s':
          case 'samsung-a05s':
            constraints.video.width = { ideal: 1280 };
            constraints.video.height = { ideal: 720 };
            break;
          case 'xiaomi-redmi-note12':
          case 'xiaomi-redmi-note12-pro':
          case 'xiaomi-redmi-note11':
            constraints.video.width = { ideal: 1920 };
            constraints.video.height = { ideal: 1080 };
            break;
        }
        
        // Agregar torch solo si está soportado
        if (flashMode === 'on') {
          constraints.video.torch = true;
        }
        
        console.log('🎥 Iniciando stream con constraints:', constraints);
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        video.srcObject = stream;
        video.play();
        
        // Función para capturar foto
        const capturePhoto = async () => {
          try {
            // Crear canvas para capturar frame del video
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            
            if (ctx) {
              // Dibujar frame actual del video
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              
              // Convertir a data URL
              const photoDataUrl = canvas.toDataURL('image/jpeg', 0.95);
              
              // Detener stream
              stream.getTracks().forEach(track => track.stop());
              
              // Detener geolocalización
              Geolocation.clearWatch({ id: watchPositionId });
              
              // Remover interfaz
              cameraInterface.remove();
              
              // Mostrar mensaje de procesamiento
              const processingMessage = document.createElement('div');
              processingMessage.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 20px 30px;
                border-radius: 10px;
                z-index: 10000;
                font-size: 16px;
                text-align: center;
              `;
              processingMessage.innerHTML = '📷 Agregando marca de agua georeferenciada...<br/><small>Por favor espere</small>';
              document.body.appendChild(processingMessage);
              
              // Aplicar marca de agua
              const watermarkedImage = await addWatermarkToPhoto(photoDataUrl, {
                userName: user?.name || 'Usuario',
                address: currentAddress,
                latitude: currentPosition.coords.latitude,
                longitude: currentPosition.coords.longitude,
                timestamp: new Date()
              });
              
              // Guardar directamente en galería
              await savePhotoToGallery(watermarkedImage, `MOPC_Photo_${new Date().toISOString().replace(/[:.]/g, '-')}.jpg`);
              
              // Remover mensaje
              processingMessage.remove();
              
              console.log('✅ Foto capturada y guardada con geolocalización en vivo');
            }
          } catch (error: any) {
            console.error('Error capturando foto:', error);
            alert('Error al capturar foto: ' + (error.message || 'Error desconocido'));
          }
        };
        
        // Función para toggle flash
        const toggleFlash = async () => {
          try {
            if (flashMode === 'off') {
              flashMode = 'on';
              flashButton.style.background = 'yellow';
              flashButton.style.color = 'black';
            } else if (flashMode === 'on') {
              flashMode = 'auto';
              flashButton.style.background = 'orange';
              flashButton.style.color = 'white';
            } else {
              flashMode = 'off';
              flashButton.style.background = 'rgba(255, 255, 255, 0.2)';
              flashButton.style.color = 'white';
            }
            
            // Reiniciar stream con nuevo flash
            stream.getTracks().forEach(track => track.stop());
            const newConstraints: any = {
              video: {
                facingMode: cameraDirection
              },
              audio: false
            };
            
            if (flashMode === 'on') {
              newConstraints.video.torch = true;
            }
            
            const newStream = await navigator.mediaDevices.getUserMedia(newConstraints);
            video.srcObject = newStream;
            video.play();
          } catch (error) {
            console.error('Error cambiando flash:', error);
          }
        };
        
        // Función para girar cámara
        const flipCamera = async () => {
          try {
            cameraDirection = cameraDirection === 'environment' ? 'user' : 'environment';
            
            // Reiniciar stream con nueva dirección
            stream.getTracks().forEach(track => track.stop());
            
            const flipConstraints: any = {
              video: {
                facingMode: cameraDirection,
                width: { ideal: 1920 },
                height: { ideal: 1080 }
              },
              audio: false
            };
            
            // Configuración específica según modelo
            switch (deviceModel) {
              case 'samsung-a04s':
              case 'samsung-a03s':
              case 'samsung-a05s':
                flipConstraints.video.width = { ideal: 1280 };
                flipConstraints.video.height = { ideal: 720 };
                break;
              case 'xiaomi-redmi-note12':
              case 'xiaomi-redmi-note12-pro':
              case 'xiaomi-redmi-note11':
                flipConstraints.video.width = { ideal: 1920 };
                flipConstraints.video.height = { ideal: 1080 };
                break;
            }
            
            if (flashMode === 'on' && cameraDirection === 'environment') {
              flipConstraints.video.torch = true;
            }
            
            console.log('🔄 Cambiando a cámara:', cameraDirection, flipConstraints);
            const newStream = await navigator.mediaDevices.getUserMedia(flipConstraints);
            video.srcObject = newStream;
            video.play();
          } catch (error) {
            console.error('Error girando cámara:', error);
          }
        };
        
        // Función para controlar zoom con un solo slider
        const adjustZoom = (value: number) => {
          zoomLevel = value;
          
          // Actualizar slider único
          zoomSlider.value = zoomLevel.toString();
          
          // Aplicar zoom usando CSS transform al video (método compatible)
          video.style.transform = `scale(${zoomLevel})`;
          video.style.transformOrigin = 'center center';
          video.style.transition = 'transform 0.3s ease';
          
          console.log('🔍 Zoom aplicado:', zoomLevel);
        };
        
        // Función para controlar tamaño de texto con slider
        const adjustTextSize = (value: number) => {
          textSizeLevel = value;
          
          // Actualizar slider
          textSizeSlider.value = textSizeLevel.toString();
          
          // Ajustar tamaño de texto del overlay
          userName.style.fontSize = `${14 * textSizeLevel}px`;
          locationInfo.style.fontSize = `${11 * textSizeLevel}px`;
          coordinatesInfo.style.fontSize = `${10 * textSizeLevel}px`;
        };
        
        // Event listeners
        captureButton.addEventListener('click', capturePhoto);
        flashButton.addEventListener('click', toggleFlash);
        flipButton.addEventListener('click', flipCamera);
        
        // Event listener de slider de zoom (solo uno)
        zoomSlider.addEventListener('input', (e) => {
          const value = parseFloat((e.target as HTMLInputElement).value);
          adjustZoom(value);
        });
        
        // Event listener de slider de tamaño de texto
        textSizeSlider.addEventListener('input', (e) => {
          const value = parseFloat((e.target as HTMLInputElement).value);
          adjustTextSize(value);
        });
        
        closeButton.addEventListener('click', () => {
          stream.getTracks().forEach(track => track.stop());
          Geolocation.clearWatch({ id: watchPositionId });
          cameraInterface.remove();
        });
        
      } catch (error) {
        console.error('Error accediendo a la cámara:', error);
        
        // Fallback a cámara Capacitor si WebRTC no funciona
        Geolocation.clearWatch({ id: watchPositionId });
        cameraInterface.remove();
        
        // Usar método original con Capacitor
        console.log('📷 Usando cámara Capacitor como fallback...');
        
        // Obtener ubicación actual
        const position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 60000
        });
        
        // Obtener dirección
        let address = 'Ubicación desconocida';
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}&zoom=18&addressdetails=1`,
            {
              headers: {
                'User-Agent': 'MOPC-App/1.0'
              }
            }
          );
          const data = await response.json();
          if (data && data.display_name) {
            address = data.display_name;
          } else if (data && data.address) {
            const addr = data.address;
            const parts = [
              addr.road,
              addr.suburb || addr.neighbourhood,
              addr.city || addr.town || addr.village,
              addr.state,
              addr.country
            ].filter(Boolean);
            address = parts.join(', ');
          }
        } catch (error) {
          address = `Lat: ${position.coords.latitude.toFixed(6)}, Lon: ${position.coords.longitude.toFixed(6)}`;
        }
        
        // Usar cámara Capacitor
        const result = await Camera.getPhoto({
          quality: 80,
          allowEditing: false,
          resultType: CameraResultType.DataUrl,
          saveToGallery: false
        });
        
        if (result.dataUrl) {
          // Aplicar marca de agua
          const watermarkedImage = await addWatermarkToPhoto(result.dataUrl, {
            userName: user?.name || 'Usuario',
            address: address,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            timestamp: new Date()
          });
          
          // Guardar directamente en galería
          await savePhotoToGallery(watermarkedImage, `MOPC_Photo_${new Date().toISOString().replace(/[:.]/g, '-')}.jpg`);
          
          console.log('✅ Foto capturada y guardada con método Capacitor');
        }
      }
      
    } catch (error: any) {
      console.error('❌ Error al tomar foto:', error);
      alert('Error al tomar foto: ' + (error.message || error.toString()));
    }
  };

  // Función para guardar foto en galería
  const handleSavePhotoToGallery = async (photoData: { photo: string; location: any; timestamp: string }) => {
    try {
      // Crear un nombre de archivo único
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `MOPC_Photo_${timestamp}.jpg`;
      
      // Guardar en localStorage como galería simulada
      const existingPhotos = JSON.parse(localStorage.getItem('mopc_photo_gallery') || '[]');
      const newPhoto = {
        id: Date.now().toString(),
        fileName,
        ...photoData,
        userName: user?.name || 'Usuario',
        savedAt: new Date().toISOString()
      };
      
      existingPhotos.push(newPhoto);
      localStorage.setItem('mopc_photo_gallery', JSON.stringify(existingPhotos));
      
      console.log('Foto guardada en galería:', newPhoto);
      
      // Aquí también se podría implementar el guardado real en el dispositivo
      // usando el plugin de File System de Capacitor si se necesita
      
    } catch (error) {
      console.error('Error guardando foto en galería:', error);
      throw error;
    }
  };

  // Si se debe mostrar la página de Mis Reportes
  if (showMyReportsModal && user) {
    return (
      <div className="my-reports-page">
        <div className="topbar-modern">
          <button 
            title="Volver al Dashboard" 
            className="topbar-back-button-modern"
            onClick={() => { setShowMyReportsModal(false); setActiveNav('dashboard'); }}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"></path>
            </svg>
          </button>
          <div className="topbar-actions-modern">
            <div className="topbar-action-button-modern" title="Recargar mis reportes">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 4v6h-6"></path>
                <path d="M1 20v-6h6"></path>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
              </svg>
            </div>
          </div>
        </div>
        
        <div className="my-reports-content">
          <MyReportsList 
            username={user.username} 
            onClose={() => { setShowMyReportsModal(false); setActiveNav('dashboard'); }}
            onContinuePendingReport={handleContinuePendingReport}
            onViewReport={handleOpenReportView}
          />
        </div>
      </div>
    );
  }

  // Si se debe mostrar la página de configuración
  if (showSettingsPage && user) {
    return (
      <UserSettingsPage 
        user={user} 
        onBack={handleBackToDashboard}
        onLogout={handleLogout}
      />
    );
  }

  // Si se debe mostrar la jerarquía de reportes
  if (showHierarchy && user) {
    return (
      <MyReportsHierarchy 
        username={user.username} 
        onClose={handleBackToDashboard}
        onViewReport={handleOpenReportView}
      />
    );
  }

  // Si se debe mostrar la página de informes
  if (showReportsPage && user) {
    return (
      <ReportsPage 
        user={user} 
        onBack={handleBackToDashboard}
        onEditReport={(reportId) => {
          // Cargar el reporte desde Firebase
          firebaseReportStorage.getReport(reportId).then((report) => {
            if (report) {
              setInterventionToEdit(report);
              setShowReportsPage(false);
              setShowReportForm(true);
            }
          }).catch((error) => {
            console.error('Error al cargar reporte para editar:', error);
            alert('Error al cargar el reporte. Por favor intente nuevamente.');
          });
        }}
      />
    );
  }

  // Si se debe mostrar la página de exportar
  if (showExportPage && user) {
    return <ExportPage user={user} onBack={handleBackToDashboard} />;
  }

  // Si se debe mostrar la página de usuarios
  if (showUsersPage && user) {
    return <UsersPage user={user} onBack={handleBackToDashboard} />;
  }

  // Si se debe mostrar la página de vehículos pesados
  if (showHeavyVehiclesPage && user) {
    return <HeavyVehiclesPage onClose={handleBackToDashboard} />;
  }

  // Si se debe mostrar el formulario de reportes
  if (showReportForm && user) {
    return (
      <ReportForm
        key={interventionToEdit?._pendingReportId || interventionToEdit?.id || 'new-report'} // ✅ Forzar remontaje
        user={user}
        onBack={handleBackToDashboard}
        plantillaDefault={plantillaDefault}
        regionesRD={regionesRD}
        provinciasPorRegion={provinciasPorRegion}
        municipiosPorProvincia={municipiosPorProvincia}
        sectoresPorProvincia={sectoresPorProvincia}
        distritosPorProvincia={distritosPorProvincia}
        distritosPorMunicipio={distritosPorMunicipio}
        opcionesIntervencion={opcionesIntervencion}
        canalOptions={canalOptions}
        plantillasPorIntervencion={plantillasPorIntervencion}
        interventionToEdit={interventionToEdit}
        isGpsEnabled={isGpsEnabled}
        gpsPosition={gpsPosition}
      />
    );
  }

  // Si se debe mostrar Google Maps
  if (showGoogleMapView && user) {
    return <GoogleMapView user={user} onBack={handleBackToDashboard} />;
  }

  // Si se debe mostrar Leaflet Maps
  if (showLeafletMapView && user) {
    return <LeafletMapView user={user} onBack={handleBackToDashboard} />;
  }

  // pantalla de login si no hay usuario
  if (!user) {
    return (
      <AppLayout>
        <div className="login-screen">
          <div className="login-container">
            <div className="login-box">
              <div className="login-header">
                <div className="login-logos">
                  <img src="/mopc-logo.png" alt="MOPC Logo" className="login-logo-left" />
                  <img src="/logo-left.png?refresh=202510180002" alt="Logo Derecho" className="login-logo-right" />
                </div>
                <h1 className="login-title">Dirección de Coordinación Regional</h1>
                <p className="login-subtitle">Sistema de Gestión de Obras Públicas</p>
              </div>

              <form className="login-form" onSubmit={submitLogin}>
            <div className="form-group">
              <label htmlFor="username">Usuario</label>
              <input
                id="username"
                type="text"
                className="form-input"
                placeholder="Ingrese su usuario"
                value={loginUser}
                onChange={e => setLoginUser(e.target.value)}
                autoComplete="username"
                autoFocus
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Contraseña</label>
              <input
                id="password"
                type="password"
                className="form-input"
                placeholder="Ingrese contraseña"
                value={loginPass}
                onChange={e => setLoginPass(e.target.value)}
                autoComplete="current-password"
                disabled={isLoading}
              />
            </div>

            {loginError && (
              <div className="error-message">
                {loginError}
              </div>
            )}

            <button 
              type="submit" 
              className="login-button"
              disabled={isLoading}
            >
              {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </form>

              <div className="login-footer">
                <p> 2025 Ministerio de Obras Públicas y Comunicaciones</p>
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="dashboard">
      {/* Topbar de notificaciones */}
      <div className="notification-topbar">
        <div className="notification-topbar-content">
          <div className="notification-topbar-left">
            <span className="app-title">MOPC</span>
          </div>
          <div className="notification-topbar-right">
            <button 
              className="notification-bell-button"
              onClick={() => setShowPendingModal(true)}
              title="Reportes Pendientes"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              {pendingCount > 0 && (
                <span className="notification-badge">
                  {pendingCount > 99 ? '99+' : pendingCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Cinta animada en el extremo superior */}
      <div className="dashboard-greeting">
        <div className="dashboard-greeting-label">VICEMINISTERIO DE COORDINACION REGIONAL</div>
      </div>

      <div className="dashboard-content">
        {/* Notificación de perfil incompleto */}
        {showProfileIncompleteNotification && (
          <div className="profile-incomplete-notification">
            <div className="notification-content">
              <span className="notification-icon">⚠️</span>
              <div className="notification-text">
                <strong>Verificar cuenta</strong>
                <p>Complete su perfil para acceder a todas las funcionalidades</p>
              </div>
              <button 
                className="notification-button"
                onClick={() => setShowCompleteProfileModal(true)}
              >
                Completar ahora
              </button>
            </div>
          </div>
        )}

        <header className="dashboard-header centered-subtitle">
          <div className="header-center">
            <h2 className="dashboard-subtitle">DIRECCION DE COORDINACION REGIONAL</h2>
          </div>
        </header>

        <div className="dashboard-main">
          {/* TODO: el diseño original usaba "cards" para cada acción.
              Para que el dashboard se parezca más a una app móvil podemos
              usar iconos circulares y etiquetas pequeñas. Se introduce el
              flag `useIconButtons` para alternar entre ambas versiones.
          */}
          {/** Presionar este valor a `true` activa el modo botón circular */}
          {useIconButtons ? (
            <div className="dashboard-icons-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
              {/* versión con botones redondos */}
              <div className={`dashboard-action ${!isProfileComplete ? 'profile-locked' : ''}`} onClick={handleShowReportForm}>
                <div className="dashboard-action-icon">
                  <AddIcon size={32} />
                </div>
                <div className="dashboard-action-label">Registrar</div>
              </div>

              {user?.role !== UserRole.TECNICO && (
                <div className={`dashboard-action ${!isProfileComplete ? 'profile-locked' : ''}`} onClick={handleShowReports}>
                  <div className="dashboard-action-icon">
                    <BarChartIcon size={32} />
                  </div>
                  <div className="dashboard-action-label">Informes</div>
                </div>
              )}

              <div className={`dashboard-action ${!isProfileComplete ? 'profile-locked' : ''}`} onClick={handleOpenCamera}>
                <div className="dashboard-action-icon">
                  <CameraIcon size={32} />
                </div>
                <div className="dashboard-action-label">Cámara</div>
              </div>

              <div className={`dashboard-action ${!isProfileComplete ? 'profile-locked' : ''}`} onClick={handleOpenStabilityModal}>
                <div className="dashboard-action-icon" style={{ fontSize: '26px' }}>
                  📏
                </div>
                <div className="dashboard-action-label">Nivel de Estabilidad</div>
              </div>

              {!hideUnusedIcons && (
                <div className={`dashboard-action ${!isProfileComplete ? 'profile-locked' : ''}`} onClick={handleShowLeafletMap}>
                  <div className="dashboard-action-icon">
                    <MapIcon size={32} />
                  </div>
                  <div className="dashboard-action-label">Buscar</div>
                </div>
              )}

              {/* Usuarios: oculto temporalmente en main, se puede volver a habilitar cambiando esta condición */}
              {user?.role !== UserRole.TECNICO && !hideUnusedIcons && false && (
                <div className={`dashboard-action ${!isProfileComplete ? 'profile-locked' : ''}`} onClick={handleShowUsersPage}>
                  <div className="dashboard-action-icon">
                    <PeopleIcon size={32} />
                  </div>
                  <div className="dashboard-action-label">Usuarios</div>
                </div>
              )}

              {user?.role !== UserRole.TECNICO && !hideUnusedIcons && (
                <div className={`dashboard-action ${!isProfileComplete ? 'profile-locked' : ''}`} onClick={handleShowHeavyVehicles}>
                  <div className="dashboard-action-icon">
                    <TruckIcon size={32} />
                  </div>
                  <div className="dashboard-action-label">Vehículos Pesados</div>
                </div>
              )}

              {!hideUnusedIcons && (
                <div className={`dashboard-action ${!isProfileComplete ? 'profile-locked' : ''}`} onClick={handleShowExportPage}>
                  <div className="dashboard-action-icon">
                    <FileUploadIcon size={32} />
                  </div>
                  <div className="dashboard-action-label">Exportar</div>
                </div>
              )}
            </div>
          ) : (
            <div className="dashboard-icons-grid">
              {/* diseño previo con tarjetas */}
              {/* Icono Registrar */}
              <div className={`dashboard-icon-card ${!isProfileComplete ? 'profile-locked' : ''}`} onClick={handleShowReportForm}>
                <div className="dashboard-icon">
                  <AddIcon size={40} />
                </div>
                <h3 className="dashboard-icon-title">Registrar</h3>
                <p className="dashboard-icon-description">
                  Registrar nuevas obras y intervenciones realizadas
                </p>
                {!isProfileComplete && <div className="locked-overlay">🔒</div>}
              </div>

              {/* Icono Informes - Oculto para usuarios técnicos */}
              {user?.role !== UserRole.TECNICO && (
                <div className={`dashboard-icon-card ${!isProfileComplete ? 'profile-locked' : ''}`} onClick={handleShowReports}>
                  <div className="dashboard-icon">
                    <BarChartIcon size={40} />
                  </div>
                  <h3 className="dashboard-icon-title">Informes y Estadísticas</h3>
                  <p className="dashboard-icon-description">
                    Ver estadísticas, reportes y análisis de todas las intervenciones
                  </p>
                  {!isProfileComplete && <div className="locked-overlay">🔒</div>}
                </div>
              )}

              {/* Icono Buscar */}
              {!hideUnusedIcons && (
                <div className={`dashboard-icon-card ${!isProfileComplete ? 'profile-locked' : ''}`} onClick={handleShowLeafletMap}>
                <div className="dashboard-icon">
                  <MapIcon size={40} />
                </div>
                <h3 className="dashboard-icon-title">Buscar</h3>
                <p className="dashboard-icon-description">
                  Buscar y visualizar intervenciones en mapa interactivo con GPS
                </p>
                {!isProfileComplete && <div className="locked-overlay">🔒</div>}
                </div>
              )}
              {/* fin condicional Buscar - no cerrar grid aquí */}

              {/* Icono Cámara - Disponible para todos los usuarios */}
              <div className={`dashboard-icon-card ${!isProfileComplete ? 'profile-locked' : ''}`} onClick={handleOpenCamera}>
                <div className="dashboard-icon">
                  <CameraIcon size={40} />
                </div>
                <h3 className="dashboard-icon-title">Cámara</h3>
                <p className="dashboard-icon-description">
                  Tomar fotografías georeferenciadas con datos de ubicación
                </p>
                {!isProfileComplete && <div className="locked-overlay">🔒</div>}
              </div>

              {/* Icono Nivel de Estabilidad con Giroscopio */}
              <div className={`dashboard-icon-card ${!isProfileComplete ? 'profile-locked' : ''}`} onClick={handleOpenStabilityModal}>
                <div className="dashboard-icon">
                  <span style={{ fontSize: '1.5rem' }}>📏</span>
                </div>
                <h3 className="dashboard-icon-title">Nivel de Estabilidad</h3>
                <p className="dashboard-icon-description">
                  Monitorea la estabilidad con el giroscopio y muestra un valor en tiempo real
                </p>
                {!isProfileComplete && <div className="locked-overlay">🔒</div>}
              </div>

              {/* Icono Usuarios - Oculto temporalmente en main */}
              {user?.role !== UserRole.TECNICO && !hideUnusedIcons && false && (
                <div className={`dashboard-icon-card ${!isProfileComplete ? 'profile-locked' : ''}`} onClick={handleShowUsersPage}>
                  <div className="dashboard-icon">
                    <PeopleIcon size={40} />
                  </div>
                  <h3 className="dashboard-icon-title">Usuarios</h3>
                  <p className="dashboard-icon-description">
                    Gestión de usuarios activos e inactivos del sistema
                  </p>
                  {!isProfileComplete && <div className="locked-overlay">🔒</div>}
                </div>
              )}

              {/* Icono Exportar - Activo */}
              {!hideUnusedIcons && (
                <div className={`dashboard-icon-card ${!isProfileComplete ? 'profile-locked' : ''}`} onClick={handleShowExportPage}>
                <div className="dashboard-icon">
                  <FileUploadIcon size={40} />
                </div>
                <h3 className="dashboard-icon-title">Exportar</h3>
                <p className="dashboard-icon-description">
                  Buscar y exportar reportes a Excel, PDF y Word
                </p>
                {!isProfileComplete && <div className="locked-overlay">🔒</div>}
              </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Barra de navegación inferior */}
      <nav className="bottom-navigation">
        <button 
          className={`nav-item ${activeNav === 'dashboard' ? 'active' : ''}`}
          onClick={() => handleBottomNavClick('dashboard')}
          title="Dashboard"
        >
          <HomeIcon size={24} />
          <span>Inicio</span>
        </button>
        
        <button 
          className={`nav-item ${activeNav === 'crear' ? 'active' : ''}`}
          onClick={() => handleBottomNavClick('crear')}
          title="Crear Reporte"
        >
          <CreateIcon size={24} />
          <span>Crear</span>
        </button>
        
        <button 
          className={`nav-item ${activeNav === 'reportes' ? 'active' : ''}`}
          onClick={() => handleBottomNavClick('reportes')}
          title="Mis Reportes"
        >
          <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10"></line>
            <line x1="12" y1="20" x2="12" y2="4"></line>
            <line x1="6" y1="20" x2="6" y2="14"></line>
          </svg>
          <span>Reportes</span>
        </button>
        
        <button 
          className={`nav-item ${activeNav === 'opciones' ? 'active' : ''}`}
          onClick={() => handleBottomNavClick('opciones')}
          title="Opciones"
        >
          <OptionsIcon size={24} />
          <span>Opciones</span>
        </button>
      </nav>

      {/* Modal de Reportes Pendientes */}
      <PendingReportsModal
        isOpen={showPendingModal}
        onClose={() => { setShowPendingModal(false); setActiveNav('dashboard'); }}
        reports={pendingReportsList}
        onContinueReport={handleContinuePendingReport}
        onCancelReport={handleCancelPendingReport}
      />

      {/* Modal Nivel de Estabilidad */}
      {showStabilityModal && (
        <div className="stability-overlay" onClick={handleCloseStabilityModal}>
          <div className="stability-modal" onClick={e => e.stopPropagation()}>
            <div className="stability-header">
              <h3>Nivel de Estabilidad</h3>
              <button className="stability-close" onClick={handleCloseStabilityModal}>Cerrar</button>
            </div>
            <div className="stability-body">
              <div className="stability-gauge-wrapper">
                <svg viewBox="0 0 100 100" className="stability-gauge">
                  <circle cx="50" cy="50" r="42" className="gauge-bg" />
                  <circle cx="50" cy="50" r="42" className="gauge-fill"
                    strokeDasharray="263"
                    strokeDashoffset={263 - (263 * stabilityScore) / 100}
                  />
                  <text x="50" y="58" textAnchor="middle" className="gauge-value">{stabilityScore}</text>
                  <text x="50" y="72" textAnchor="middle" className="gauge-label">/ 100</text>
                </svg>
              </div>
              <p className="stability-status">{stabilityText}</p>
              <div className="stability-data">
                <div>Roll (izq/der): {gyroData.gamma.toFixed(1)}°</div>
                <div>Pitch (del/atrás): {gyroData.beta.toFixed(1)}°</div>
                <div>Yaw: {gyroData.alpha.toFixed(1)}°</div>
              </div>
              {!gyroPermissionPrompted && <p className="stability-note">Activa el giroscopio cuando se te solicite para medir correctamente.</p>}
            </div>
          </div>
        </div>
      )}

      {/* Modal ReportViewModern - Vista Detallada de Reportes */}
      {showReportView && selectedReportId && (
        <>
          {console.log('🔍 Dashboard: Renderizando ReportViewModern con:', { showReportView, selectedReportId })}
          <ReportViewModern
            reportId={selectedReportId}
            onClose={handleCloseReportView}
            onEdit={handleEditReportFromView}
            onDelete={handleDeleteReportFromView}
            onExport={handleExportReportFromView}
          />
        </>
      )}

      {/* Modal de Perfil de Usuario */}
      {showProfileModal && (
        <div className="modal-overlay" onClick={() => { setShowProfileModal(false); setActiveNav('dashboard'); }}>
          <div className="modal-content profile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>👤 Mi Perfil</h2>
              <button className="modal-close" onClick={() => { setShowProfileModal(false); setActiveNav('dashboard'); }}>✕</button>
            </div>
            <div className="modal-body">
              <div className="profile-section">
                <div className="profile-avatar-large">
                  {user?.name.split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase()}
                </div>
                <div className="profile-info-group">
                  <div className="profile-info-item">
                    <label>👤 Nombre completo</label>
                    <input type="text" value={user?.name || ''} readOnly className="form-input" />
                  </div>
                  <div className="profile-info-item">
                    <label>🔑 Usuario</label>
                    <input type="text" value={user?.username || ''} readOnly className="form-input" />
                  </div>
                  <div className="profile-info-item">
                    <label>🏢 Departamento</label>
                    <input type="text" value="Dirección de Coordinación Regional" readOnly className="form-input" />
                  </div>
                  <div className="profile-info-item">
                    <label>📍 Región asignada</label>
                    <input type="text" value="Todas las regiones" readOnly className="form-input" />
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => { setShowProfileModal(false); setActiveNav('dashboard'); }}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Mis Reportes */}
      {showMyReportsModal && (
        <div className="modal-overlay" onClick={() => { setShowMyReportsModal(false); setActiveNav('dashboard'); }}>
          <div className="modal-content my-reports-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px', maxHeight: '90vh' }}>
            <div className="modal-header">
              <h2>📋 Mis Reportes</h2>
              <button className="modal-close" onClick={() => { setShowMyReportsModal(false); setActiveNav('dashboard'); }}>✕</button>
            </div>
            <div className="modal-body" style={{ padding: '20px' }}>
              <MyReportsListModern 
                username={user?.username || ''} 
                onClose={() => { setShowMyReportsModal(false); setActiveNav('dashboard'); }}
                onContinuePendingReport={handleContinuePendingReport}
                onViewReport={handleOpenReportView}
              />
            </div>
          </div>
        </div>
      )}
      {/* Modal de Completar Perfil */}
      {showCompleteProfileModal && (
        <div className="modal-overlay" onClick={() => setShowCompleteProfileModal(false)}>
          <div className="modal-content complete-profile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>✨ Completar Perfil</h2>
              <button className="modal-close" onClick={() => setShowCompleteProfileModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p className="modal-description">Complete toda su información para verificar su cuenta</p>
              
              {/* Foto de Perfil */}
              <div className="profile-field-section">
                <label className="profile-field-label">📸 Foto de Perfil *</label>
                <div className="profile-photo-upload">
                  {profilePhoto ? (
                    <div className="profile-photo-preview">
                      <img src={profilePhoto} alt="Perfil" />
                      <button className="change-photo-btn" onClick={() => setProfilePhoto('')}>
                        Cambiar
                      </button>
                    </div>
                  ) : (
                    <div className="profile-photo-placeholder">
                      <label htmlFor="profile-photo-input" className="upload-label">
                        <span className="upload-icon">📷</span>
                        <span>Click para subir foto</span>
                        <input
                          id="profile-photo-input"
                          type="file"
                          accept="image/*"
                          onChange={handleProfilePhotoUpload}
                          style={{ display: 'none' }}
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Nombre Completo */}
              <div className="profile-field-section">
                <label className="profile-field-label">👤 Nombre Completo *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej: Juan Pérez Gómez"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              {/* Número de Cédula */}
              <div className="profile-field-section">
                <label className="profile-field-label">🆔 Número de Cédula *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej: 001-1234567-8"
                  value={idCardNumber}
                  onChange={(e) => setIdCardNumber(e.target.value)}
                  maxLength={15}
                />
                <small style={{ color: '#6c757d', fontSize: '12px', marginTop: '5px', display: 'block' }}>
                  Debe coincidir con el número registrado en el sistema
                </small>
              </div>

              {/* Foto del Carnet */}
              <div className="profile-field-section">
                <label className="profile-field-label">🪪 Foto del Carnet de Identidad *</label>
                <div className="id-card-upload">
                  {idCardPhoto ? (
                    <div className="id-card-preview">
                      <img src={idCardPhoto} alt="Carnet" />
                      <button className="change-photo-btn" onClick={() => setIdCardPhoto('')}>
                        Cambiar
                      </button>
                    </div>
                  ) : (
                    <div className="id-card-placeholder">
                      <label htmlFor="id-card-input" className="upload-label">
                        <span className="upload-icon">🪪</span>
                        <span>Click para subir foto del carnet</span>
                        <input
                          id="id-card-input"
                          type="file"
                          accept="image/*"
                          onChange={handleIdCardPhotoUpload}
                          style={{ display: 'none' }}
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>

              <p className="required-fields-note">* Todos los campos son obligatorios</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowCompleteProfileModal(false)}>
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={handleSaveProfile}>
                Guardar y Verificar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </AppLayout>
  );
};

export default Dashboard;
