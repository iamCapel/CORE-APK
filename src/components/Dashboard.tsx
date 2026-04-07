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
import ChatPage from './ChatPage';
import AppLayout from './AppLayout';
import ChatList from './ChatList';
import { UserRole, applyUserTheme, getRoleBadge, normalizeRole } from '../types/userRoles';
import { userStorage } from '../services/userStorage';
import * as firebaseUserStorage from '../services/firebaseUserStorage';
import { sendPasswordResetEmail } from '../services/emailService';
import firebaseReportStorage from '../services/firebaseReportStorage';
import userPresenceService from '../services/userPresenceService';
import { chatService } from '../services/chatService';
import { MdAdd, MdBarChart, MdMap, MdPeople, MdFileUpload } from 'react-icons/md';
import { useGpsTracker } from '../hooks/useGpsTracker';
import LiveLocationService from '../services/liveLocationService';
import './Dashboard.css';
import './BottomNavigation.css';
import './MyReportsPage.css';
import './ModernDashboard.css';

/* ÔöÇÔöÇ Iconos para navegaci├│n inferior ÔöÇÔöÇ */
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

/* ÔöÇÔöÇ Icono de usuario cuadrado para la topbar ÔöÇÔöÇ */
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

/* ÔöÇÔöÇ Icono de C├ímara ÔöÇÔöÇ */
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
  { key: 'punto_inicial', label: 'Punto inicial de la intervenci├│n', type: 'text', unit: 'Coordenadas decimales' },
  { key: 'punto_alcanzado', label: 'Punto alcanzado en la intervenci├│n', type: 'text', unit: 'Coordenadas decimales' },
  { key: 'longitud_intervencion', label: 'Longitud de intervenci├│n', type: 'number', unit: 'km' },
  { key: 'limpieza_superficie', label: 'Limpieza de superficie', type: 'number', unit: 'm┬▓' },
  { key: 'perfilado_superficie', label: 'Perfilado de superficie', type: 'number', unit: 'm┬▓' },
  { key: 'compactado_superficie', label: 'Compactado de superficie', type: 'number', unit: 'm┬▓' },
  { key: 'conformacion_cunetas', label: 'Conformaci├│n de cunetas', type: 'number', unit: 'ml' },
  { key: 'extraccion_bote_material', label: 'Extracci├│n y bote de material inservible', type: 'number', unit: 'm┬│' },
  { key: 'escarificacion_superficies', label: 'Escarificaci├│n de superficies', type: 'number', unit: 'm┬▓' },
  { key: 'conformacion_plataforma', label: 'Conformaci├│n de plataforma', type: 'number', unit: 'm┬▓' },
  { key: 'zafra_material', label: 'Zafra de material', type: 'number', unit: 'm┬│' },
  { key: 'motonivelacion_superficie', label: 'Motonivelaci├│n de superficie', type: 'number', unit: 'm┬▓' },
  { key: 'suministro_extension_material', label: 'Suministro y extensi├│n de material', type: 'number', unit: 'm┬│' },
  { key: 'suministro_colocacion_grava', label: 'Suministro y colocaci├│n de grava', type: 'number', unit: 'm┬│' },
  { key: 'nivelacion_compactacion_grava', label: 'Nivelaci├│n y compactaci├│n de grava', type: 'number', unit: 'm┬▓' },
  { key: 'reparacion_alcantarillas', label: 'Reparaci├│n de alcantarillas existentes', type: 'number', unit: 'und' },
  { key: 'construccion_alcantarillas', label: 'Construcci├│n de alcantarillas', type: 'number', unit: 'und' },
  { key: 'limpieza_alcantarillas', label: 'Limpieza de alcantarillas', type: 'number', unit: 'und' },
  { key: 'limpieza_cauces', label: 'Limpieza de cauces y ca├▒adas', type: 'number', unit: 'ml' },
  { key: 'obras_drenaje', label: 'Obras de drenaje', type: 'number', unit: 'ml' },
  { key: 'construccion_terraplenes', label: 'Construcci├│n de terraplenes', type: 'number', unit: 'm┬│' },
  { key: 'relleno_compactacion', label: 'Relleno y compactaci├│n de material', type: 'number', unit: 'm┬│' },
  { key: 'conformacion_taludes', label: 'Conformaci├│n de taludes', type: 'number', unit: 'm┬▓' }
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
  'Cibao Sur': ['La Vega', 'Monse├▒or Nouel', 'S├ínchez Ram├¡rez'],
  'Cibao Nordeste': ['Duarte', 'Mar├¡a Trinidad S├ínchez', 'Saman├í', 'Hermanas Mirabal'],
  'Cibao Noroeste': ['Valverde', 'Monte Cristi', 'Dajab├│n', 'Santiago Rodr├¡guez'],
  'Santiago': ['Santiago'],
  'Valdesia': ['San Crist├│bal', 'Peravia', 'San Jos├® de Ocoa'],
  'Enriquillo': ['Barahona', 'Pedernales', 'Independencia', 'Bahoruco'],
  'El Valle': ['San Juan', 'El├¡as Pi├▒a', 'Azua'],
  'Yuma': ['La Altagracia', 'La Romana', 'El Seibo'],
  'Higuamo': ['San Pedro de Macor├¡s', 'Hato Mayor', 'Monte Plata']
};

// Municipios por Provincia de Rep├║blica Dominicana
const municipiosPorProvincia: Record<string, string[]> = {
  // Cibao Norte
  'Puerto Plata': ['Puerto Plata', 'Altamira', 'Guananico', 'Imbert', 'Los Hidalgos', 'Luper├│n', 'R├¡o San Juan', 'Villa Isabela', 'Villa Montellano'],
  'Espaillat': ['Moca', 'Cayetano Germos├®n', 'Gaspar Hern├índez', 'Jamao al Norte'],
  'Santiago': ['Santiago', 'Bison├│ (Navarrete)', 'J├ínico', 'Licey al Medio', 'Pu├▒al', 'Sabana Iglesia', 'San Jos├® de las Matas', 'Tamboril', 'Villa Gonz├ílez'],
  
  // Cibao Sur  
  'La Vega': ['La Vega', 'Constanza', 'Jarabacoa', 'Jima Abajo'],
  'Monse├▒or Nouel': ['Bonao', 'Maim├│n', 'Piedra Blanca'],
  'S├ínchez Ram├¡rez': ['Cotu├¡', 'Cevicos', 'Fantino', 'La Mata'],
  
  // Cibao Nordeste
  'Duarte': ['San Francisco de Macor├¡s', 'Arenoso', 'Castillo', 'Eugenio Mar├¡a de Hostos', 'Las Gu├íranas', 'Pimentel', 'Villa Riva'],
  'Mar├¡a Trinidad S├ínchez': ['Nagua', 'Cabrera', 'El Factor', 'R├¡o San Juan'],
  'Saman├í': ['Saman├í', 'Las Terrenas', 'S├ínchez'],
  
  // Cibao Noroeste
  'Monte Cristi': ['Monte Cristi', 'Casta├▒uelas', 'Guayub├¡n', 'Las Matas de Santa Cruz', 'Pepillo Salcedo (Manzanillo)', 'Villa V├ísquez'],
  'Dajab├│n': ['Dajab├│n', 'El Pino', 'Loma de Cabrera', 'Partido', 'Restauraci├│n'],
  'Santiago Rodr├¡guez': ['San Ignacio de Sabaneta', 'Los Alm├ícigos', 'Monci├│n'],
  'Valverde': ['Mao', 'Esperanza', 'Laguna Salada'],
  
  // Cibao Centro
  'Hermanas Mirabal': ['Salcedo', 'Tenares', 'Villa Tapia'],
  
  // Valdesia
  'San Crist├│bal': ['San Crist├│bal', 'Bajos de Haina', 'Cambita Garabitos', 'Los Cacaos', 'Sabana Grande de Palenque', 'San Gregorio de Nigua', 'Villa Altagracia', 'Yaguate'],
  'Peravia': ['Ban├¡', 'Nizao', 'Sabana Buey'],
  'San Jos├® de Ocoa': ['San Jos├® de Ocoa', 'Rancho Arriba', 'Sabana Larga'],
  
  // Enriquillo
  'Barahona': ['Barahona', 'Cabral', 'El Pe├▒├│n', 'Enriquillo', 'Fundaci├│n', 'Jaquimeyes', 'La Ci├®naga', 'Las Salinas', 'Para├¡so', 'Polo', 'Vicente Noble'],
  'Pedernales': ['Pedernales', 'Oviedo'],
  'Independencia': ['Jiman├¡', 'Crist├│bal', 'Duverg├®', 'La Descubierta', 'Mella', 'Postrer R├¡o'],
  'Bahoruco': ['Neiba', 'Galv├ín', 'Los R├¡os', 'Tamayo', 'Villa Jaragua'],
  
  // El Valle
  'Azua': ['Azua de Compostela', 'Esteban├¡a', 'Guayabal', 'Las Charcas', 'Las Yayas de Viajama', 'Padre Las Casas', 'Peralta', 'Pueblo Viejo', 'Sabana de la Mar', 'T├íbara Arriba'],
  'San Juan': ['San Juan de la Maguana', 'Bohech├¡o', 'El Cercado', 'Juan de Herrera', 'Las Matas de Farf├ín', 'Vallejuelo'],
  'El├¡as Pi├▒a': ['Comendador', 'B├ínica', 'El Llano', 'Hondo Valle', 'Juan Santiago', 'Pedro Santana'],
  
  // Higuamo
  'San Pedro de Macor├¡s': ['San Pedro de Macor├¡s', 'Consuelo', 'Guayacanes', 'Quisqueya', 'Ram├│n Santana'],
  'Hato Mayor': ['Hato Mayor del Rey', 'El Valle', 'Sabana de la Mar'],
  'El Seibo': ['El Seibo', 'Miches'],
  
  // Ozama
  'Distrito Nacional': ['Distrito Nacional'],
  'Santo Domingo': ['Santo Domingo Este', 'Santo Domingo Norte', 'Santo Domingo Oeste', 'Boca Chica', 'Los Alcarrizos', 'Pedro Brand', 'San Antonio de Guerra'],
  
  // Yuma
  'La Altagracia': ['Hig├╝ey', 'San Rafael del Yuma'],
  'La Romana': ['La Romana', 'Guaymate', 'Villa Hermosa'],
  
  // Valle
  'Monte Plata': ['Monte Plata', 'Bayaguana', 'Peralvillo', 'Sabana Grande de Boy├í', 'Yamas├í']
};

const sectoresPorProvincia: Record<string, string[]> = {
  // Cibao Norte
  'Puerto Plata': ['Centro Urbano', 'Costa Dorada', 'Malecon', 'Playa Dorada', 'Cofres├¡', 'La Uni├│n', 'Las Flores', 'Villa Montellano', 'Los Reyes', 'San Marcos'],
  'Espaillat': ['Centro', 'El Carmen', 'Las Flores', 'La Javilla', 'San Antonio', 'Villa Olga', 'Los Cocos', 'Jamao', 'R├¡o Verde'],
  'Santiago': ['Centro Hist├│rico', 'Los Jardines', 'Bella Vista', 'Cienfuegos', 'La Otra Banda', 'Pueblo Nuevo', 'Villa Olga', 'Los Salados', 'Tamboril Centro', 'Sabana Iglesia'],

  // Cibao Sur
  'La Vega': ['Centro', 'Rinc├│n', 'Buenos Aires', 'Las Flores', 'Constanza Centro', 'Jarabacoa Centro', 'El Lim├│n', 'La Sabina'],
  'Monse├▒or Nouel': ['Centro de Bonao', 'Villa Sonadora', 'Pueblo Nuevo', 'Los Maestros', 'Maim├│n Centro', 'Piedra Blanca Centro'],
  'S├ínchez Ram├¡rez': ['Cotu├¡ Centro', 'Villa La Mata', 'Fantino Centro', 'Cevicos Centro', 'Los Botados', 'Villa Sonadora'],

  // Cibao Nordeste  
  'Duarte': ['Centro de San Francisco', 'Villa Riva', 'Castillo', 'Pimentel', 'Las Gu├íranas', 'Arenoso Centro', 'Hostos'],
  'Mar├¡a Trinidad S├ínchez': ['Nagua Centro', 'Cabrera Centro', 'R├¡o San Juan Centro', 'El Factor', 'Los Cacaos', 'Villa Clara'],
  'Saman├í': ['Santa B├írbara Centro', 'Las Terrenas Centro', 'S├ínchez Centro', 'Las Galeras', 'El Lim├│n'],
  'Hermanas Mirabal': ['Salcedo Centro', 'Tenares Centro', 'Villa Tapia Centro', 'La Joya', 'Villa Hermosa'],

  // Cibao Noroeste
  'Valverde': ['Mao Centro', 'Esperanza Centro', 'Laguna Salada Centro', 'Guayacanes', 'Villa Elisa'],  
  'Monte Cristi': ['Monte Cristi Centro', 'Guayub├¡n Centro', 'Casta├▒uelas Centro', 'Las Matas Centro', 'Villa V├ísquez Centro'],
  'Dajab├│n': ['Dajab├│n Centro', 'Loma de Cabrera Centro', 'Restauraci├│n Centro', 'El Pino Centro', 'Partido Centro'],
  'Santiago Rodr├¡guez': ['Sabaneta Centro', 'Monci├│n Centro', 'Villa Los Alm├ícigos Centro', 'Los Quemados', 'El Rubio'],

  // Valdesia
  'San Crist├│bal': ['Centro Hist├│rico', 'Villa Altagracia Centro', 'Haina Centro', 'Los Cacaos Centro', 'Nigua Centro', 'Cambita Centro'],
  'Peravia': ['Ban├¡ Centro', 'Matanzas Centro', 'Nizao Centro', 'Villa Sombrero', 'Catalina'],  
  'San Jos├® de Ocoa': ['Centro', 'Rancho Arriba Centro', 'Sabana Larga Centro', 'El Pinar', 'Los Fr├¡os'],

  // Enriquillo
  'Barahona': ['Barahona Centro', 'Cabral Centro', 'Enriquillo Centro', 'Para├¡so Centro', 'Las Salinas Centro', 'Vicente Noble Centro'],
  'Pedernales': ['Pedernales Centro', 'Oviedo Centro', 'Cabo Rojo', 'Manuel Goya'],
  'Independencia': ['Jiman├¡ Centro', 'Duverg├® Centro', 'La Descubierta Centro', 'Crist├│bal Centro', 'Mella Centro'],
  'Bahoruco': ['Neiba Centro', 'Galv├ín Centro', 'Tamayo Centro', 'Los R├¡os Centro', 'Villa Jaragua Centro'],

  // El Valle  
  'Azua': ['Azua Centro', 'Las Charcas Centro', 'Padre Las Casas Centro', 'Peralta Centro', 'Pueblo Viejo Centro'],
  'San Juan': ['San Juan Centro', 'Las Matas de Farf├ín Centro', 'Bohech├¡o Centro', 'El Cercado Centro', 'Juan de Herrera Centro'],
  'El├¡as Pi├▒a': ['Comendador Centro', 'B├ínica Centro', 'Hondo Valle Centro', 'Pedro Santana Centro', 'El Llano Centro'],

  // Higuamo
  'San Pedro de Macor├¡s': ['Centro Hist├│rico', 'Consuelo Centro', 'Los Llanos Centro', 'Quisqueya Centro', 'Ram├│n Santana Centro'],
  'Hato Mayor': ['Hato Mayor Centro', 'Sabana de la Mar Centro', 'El Valle Centro', 'Yerba Buena', 'Los Hatos'],
  'Monte Plata': ['Monte Plata Centro', 'Bayaguana Centro', 'Sabana Grande Centro', 'Yamas├í Centro', 'Peralvillo Centro'],

  // Yuma
  'La Altagracia': ['Hig├╝ey Centro', 'Punta Cana', 'B├ívaro', 'San Rafael del Yuma Centro', 'Miches', 'El Seibo Centro'],
  'La Romana': ['La Romana Centro', 'Casa de Campo', 'Guaymate Centro', 'Villa Hermosa Centro', 'Caleta'],
  'El Seibo': ['El Seibo Centro', 'Miches Centro', 'Pedro S├ínchez', 'Santa Luc├¡a'],

  // Ozama  
  'Distrito Nacional': ['Zona Colonial', 'Gazcue', 'Ciudad Nueva', 'San Carlos', 'Villa Juana', 'Cristo Rey', 'La Esperilla'],
  'Santo Domingo': ['Los Alcarrizos Centro', 'Pedro Brand Centro', 'San Antonio Centro', 'Boca Chica Centro', 'Pantoja', 'Villa Mella']
};

// Distritos municipales organizados por municipio
const distritosPorMunicipio: Record<string, string[]> = {
  // REGI├ôN OZAMA O METROPOLITANA
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
  'Sabana Grande de Boy├í': ['Gonzalo'],
  'Yamas├í': [],
  
  // REGI├ôN CIBAO NORTE
  // Puerto Plata
  'Puerto Plata': ['Y├ísica Arriba'],
  'Altamira': ['R├¡o Grande'],
  'Guananico': [],
  'Imbert': [],
  'Los Hidalgos': [],
  'Luper├│n': ['La Isabela', 'Belloso'],
  'Sos├║a': ['Sabaneta de Y├ísica'],
  'Villa Isabela': [],
  'Villa Montellano': [],
  
  // Espaillat
  'Moca': ['Jos├® Contreras', 'San V├¡ctor', 'Juan L├│pez'],
  'Cayetano Germos├®n': [],
  'Gaspar Hern├índez': ['Veragua'],
  'Jamao al Norte': [],
  
  // REGI├ôN SANTIAGO
  // Santiago
  'Santiago de los Caballeros': ['Pedro Garc├¡a', 'El Lim├│n'],
  'Santiago': ['Pedro Garc├¡a', 'El Lim├│n'],
  'Baitoa': [],
  'Bison├│': [],
  'Bison├│ (Navarrete)': [],
  'J├ínico': ['El Caimito'],
  'Licey al Medio': ['Las Palomas'],
  'Pu├▒al': ['Guayabal'],
  'Sabana Iglesia': [],
  'San Jos├® de las Matas': ['El Rubio', 'La Cuesta'],
  'Tamboril': ['Canca la Reyna'],
  'Villa Gonz├ílez': ['Palmar Arriba'],
  
  // REGI├ôN CIBAO SUR
  // La Vega
  'La Vega': ['R├¡o Verde Arriba', 'El Ranchito'],
  'Constanza': ['Tireo', 'La Sabina'],
  'Jarabacoa': ['Manabao', 'Buena Vista'],
  'Jima Abajo': [],
  
  // Monse├▒or Nouel
  'Bonao': ['Sabana del Puerto', 'Jayaco'],
  'Maim├│n': [],
  'Piedra Blanca': [],
  
  // S├ínchez Ram├¡rez
  'Cotu├¡': [],
  'Cevicos': ['La Cueva'],
  'Fantino': [],
  'La Mata': [],
  
  // REGI├ôN CIBAO NORDESTE
  // Duarte
  'San Francisco de Macor├¡s': ['La Pe├▒a', 'Cenov├¡'],
  'Arenoso': ['Las Coles', 'El Aguacate'],
  'Castillo': [],
  'Eugenio Mar├¡a de Hostos': ['Sabana Grande'],
  'Las Gu├íranas': [],
  'Pimentel': [],
  'Villa Riva': ['Agua Santa del Yuna'],
  
  // Mar├¡a Trinidad S├ínchez
  'Nagua': ['Las Gordas', 'San Jos├® de Matanzas'],
  'Cabrera': ['Arroyo Salado'],
  'El Factor': ['El Pozo'],
  'R├¡o San Juan': [],
  
  // Saman├í
  'Saman├í': ['El Lim├│n', 'Arroyo Barril', 'Las Galeras'],
  'Las Terrenas': [],
  'S├ínchez': [],
  
  // Hermanas Mirabal
  'Salcedo': ['Jamao Afuera', 'Blanco'],
  'Tenares': [],
  'Villa Tapia': [],
  
  // REGI├ôN CIBAO NOROESTE
  // Valverde
  'Mao': ['Guatapanal', 'Jaib├│n', 'Amina'],
  'Esperanza': ['Maizal', 'Jicom├®'],
  'Laguna Salada': ['Jaib├│n'],
  
  // Monte Cristi
  'Monte Cristi': ['Villa Elisa'],
  'Casta├▒uelas': ['Palo Verde'],
  'Guayub├¡n': ['Hatillo Palma', 'Cana Chapet├│n'],
  'Las Matas de Santa Cruz': [],
  'Pepillo Salcedo': [],
  'Pepillo Salcedo (Manzanillo)': [],
  'Villa V├ísquez': [],
  
  // Dajab├│n
  'Dajab├│n': [],
  'El Pino': [],
  'Loma de Cabrera': ['Capotillo'],
  'Partido': [],
  'Restauraci├│n': [],
  
  // Santiago Rodr├¡guez
  'Sabaneta': [],
  'San Ignacio de Sabaneta': [],
  'Monci├│n': [],
  'Villa Los Alm├ícigos': [],
  'Los Alm├ícigos': [],
  
  // REGI├ôN VALDESIA
  // San Crist├│bal
  'San Crist├│bal': [],
  'Bajos de Haina': ['El Carril'],
  'Cambita Garabitos': ['Medina'],
  'Los Cacaos': [],
  'Sabana Grande de Palenque': [],
  'San Gregorio de Nigua': [],
  'Villa Altagracia': ['San Jos├® del Puerto', 'La Guinea'],
  'Yaguate': ['Do├▒a Ana'],
  
  // Peravia
  'Ban├¡': ['El Ca├▒af├¡stol', 'Villa Fundaci├│n', 'Paya', 'Villa Sombrero', 'El Limonal', 'Los Alm├ícigos'],
  'Nizao': ['Pizarrete'],
  'Matanzas': ['Santana'],
  'Sabana Buey': [],
  
  // San Jos├® de Ocoa
  'San Jos├® de Ocoa': [],
  'Rancho Arriba': [],
  'Sabana Larga': [],
  
  // REGI├ôN ENRIQUILLO
  // Barahona
  'Barahona': [],
  'Cabral': [],
  'El Pe├▒├│n': [],
  'Enriquillo': ['Arroyo Dulce'],
  'Fundaci├│n': ['Pescader├¡a'],
  'Jaquimeyes': ['Palo Alto'],
  'La Ci├®naga': [],
  'Las Salinas': [],
  'Para├¡so': ['Los Patos', 'Canoa'],
  'Polo': [],
  'Vicente Noble': [],
  
  // Pedernales
  'Pedernales': ['Jos├® Francisco Pe├▒a G├│mez'],
  'Oviedo': ['Juancho'],
  
  // Independencia
  'Jiman├¡': ['El Lim├│n'],
  'Crist├│bal': ['Batey 8'],
  'Duverg├®': [],
  'La Descubierta': ['Boca de Cach├│n'],
  'Mella': ['La Colonia'],
  'Postrer R├¡o': ['Guayabal'],
  
  // Bahoruco
  'Neiba': [],
  'Galv├ín': ['El Palmar'],
  'Los R├¡os': ['Las Clavellinas'],
  'Tamayo': ['Cabral', 'Uvilla'],
  'Villa Jaragua': [],
  
  // REGI├ôN EL VALLE
  // San Juan
  'San Juan': ['El Rosario', 'Hato del Padre', 'La Jagua', 'Las Maguanas-Hato Nuevo'],
  'San Juan de la Maguana': ['El Rosario', 'Hato del Padre', 'La Jagua', 'Las Maguanas-Hato Nuevo'],
  'Bohech├¡o': ['Arroyo Cano', 'Yaque'],
  'El Cercado': ['Batista'],
  'Juan de Herrera': ['J├¡nova'],
  'Las Matas de Farf├ín': ['Matayaya', 'Carrera de Yegua'],
  'Vallejuelo': ['Jorjillo'],
  
  // El├¡as Pi├▒a
  'Comendador': ['Guayajayuco', 'Sabana Cruz', 'Sabana Larga', 'Guanito'],
  'B├ínica': ['Sabana Hig├╝ero', 'Sabana Cruz'],
  'El Llano': ['Guayabo'],
  'Hondo Valle': ['Rancho de la Guardia'],
  'Juan Santiago': ['Las Caobas'],
  'Pedro Santana': ['R├¡o Limpio'],
  
  // Azua
  'Azua': ['Barro Arriba', 'Las Barias-La Estancia', 'Los Jovillos'],
  'Azua de Compostela': ['Barro Arriba', 'Las Barias-La Estancia', 'Los Jovillos'],
  'Esteban├¡a': [],
  'Guayabal': [],
  'Las Charcas': [],
  'Las Yayas de Viajama': ['Villarpando'],
  'Padre Las Casas': ['Las Lagunas', 'Palmar de Ocoa'],
  'Peralta': [],
  'Pueblo Viejo': [],
  'Sabana Yegua': ['Proyeto 4'],
  'Sabana de la Mar': ['Elupina Cordero'],
  'T├íbara Arriba': ['Amiama G├│mez', 'T├íbara Abajo', 'Los Toros'],
  
  // REGI├ôN HIGUAMO
  // San Pedro de Macor├¡s
  'San Pedro de Macor├¡s': [],
  'Consuelo': [],
  'Guayacanes': ['El Puerto'],
  'Los Llanos': [],
  'Quisqueya': [],
  'Ram├│n Santana': [],
  
  // Hato Mayor
  'Hato Mayor': ['Mata Palacio', 'Guayabo Dulce'],
  'Hato Mayor del Rey': ['Mata Palacio', 'Guayabo Dulce'],
  'El Valle': [],
  'Yerba Buena': [],
  
  // REGI├ôN YUMA
  // La Altagracia
  'Hig├╝ey': ['La Otra Banda'],
  'San Rafael del Yuma': ['Boca de Yuma', 'Bayahibe'],
  
  // La Romana
  'La Romana': ['Caleta'],
  'Guaymate': [],
  'Villa Hermosa': ['Cumayasa'],
  
  // El Seibo
  'El Seibo': ['Pedro S├ínchez'],
  'Miches': ['El Cedro', 'La Gina']
};

// Mantener compatibilidad: distritosPorProvincia ahora devuelve todos los municipios de la provincia
const distritosPorProvincia: Record<string, string[]> = municipiosPorProvincia;

const opcionesIntervencion = [
  'Rehabilitaci├│n Camino Vecinal',
  'Rehabilitaci├│n acceso a mina',
  'Restauraci├│n Calles comunidad',
  'Confecci├│n de cabezal de puente',
  'Restauraci├│n de v├¡as de Comunicaci├│n',
  'Operativo de Emergencia',
  'Limpieza de alcantarillas',
  'Confecci├│n de puente',
  'Limpieza de Ca├▒ada',
  'Colocaci├│n de alcantarillas',
  'Canalizaci├│n',
  'Desalojo',
  'Habilitaci├│n Zona protegida o Espacio p├║blico'
];

const canalOptions = ['R├¡o', 'Arroyo', 'Ca├▒ada'];

const plantillasPorIntervencion: Record<string, Field[]> = {
  'Rehabilitaci├│n Camino Vecinal': [
    { key: 'nombre_camino', label: 'Nombre del camino vecinal', type: 'text', unit: '' },
    { key: 'punto_inicial', label: 'Punto inicial de la intervenci├│n', type: 'text', unit: 'Coordenadas decimales' },
    { key: 'punto_alcanzado', label: 'Punto alcanzado en la intervenci├│n', type: 'text', unit: 'Coordenadas decimales' },
    { key: 'longitud_intervencion', label: 'Longitud de intervenci├│n', type: 'number', unit: 'km' },
    { key: 'limpieza_superficie', label: 'Limpieza de superficie de rodadura (Incluye Cunetas)', type: 'number', unit: 'm┬▓' },
    { key: 'perfilado_superficie', label: 'Perfilado de superficie', type: 'number', unit: 'm┬▓' },
    { key: 'extraccion_material', label: 'Extracci├│n de material inservible', type: 'number', unit: 'm┬│' },
    { key: 'bote_material', label: 'Bote de material inservible', type: 'number', unit: 'm┬│' },
    { key: 'conformacion_plataforma', label: 'Conformaci├│n de plataforma', type: 'number', unit: 'm┬▓' },
    { key: 'zafra_material', label: 'Zafra de material', type: 'number', unit: 'm┬│' },
    { key: 'motonivelacion_superficie', label: 'Motonivelaci├│n de superficie', type: 'number', unit: 'm┬▓' },
    { key: 'suministro_extension_material', label: 'Suministro y extensi├│n de material', type: 'number', unit: 'm┬│' },
    { key: 'suministro_colocacion_grava', label: 'Suministro y colocaci├│n de grava', type: 'number', unit: 'm┬│' },
    { key: 'nivelacion_compactacion_grava', label: 'Nivelaci├│n y compactaci├│n de grava', type: 'number', unit: 'm┬▓' },
    { key: 'reparacion_alcantarillas', label: 'Reparaci├│n de alcantarillas existentes', type: 'number', unit: 'und' },
    { key: 'construccion_alcantarillas', label: 'Construcci├│n de alcantarillas', type: 'number', unit: 'und' },
    { key: 'limpieza_alcantarillas', label: 'Limpieza de alcantarillas', type: 'number', unit: 'und' },
    { key: 'limpieza_cauces', label: 'Limpieza de cauces y ca├▒adas', type: 'number', unit: 'ml' },
    { key: 'obras_drenaje', label: 'Obras de drenaje', type: 'number', unit: 'ml' },
    { key: 'construccion_terraplenes', label: 'Construcci├│n de terraplenes', type: 'number', unit: 'm┬│' },
    { key: 'relleno_compactacion', label: 'Relleno y compactaci├│n de material', type: 'number', unit: 'm┬│' },
    { key: 'conformacion_taludes', label: 'Conformaci├│n de taludes', type: 'number', unit: 'm┬▓' }
  ],
  'Rehabilitaci├│n acceso a mina': [{ key: 'nombre_mina', label: 'Nombre mina', type: 'text', unit: '' }, ...plantillaDefault],
  'Restauraci├│n Calles comunidad': [...plantillaDefault],
  'Confecci├│n de cabezal de puente': [...plantillaDefault],
  'Restauraci├│n de v├¡as de Comunicaci├│n': [...plantillaDefault],
  'Operativo de Emergencia': [...plantillaDefault],
  'Limpieza de alcantarillas': [...plantillaDefault],
  'Confecci├│n de puente': [{ key: 'tipo_puente', label: 'Seleccionar tipo de puente (Alcantarilla / Viga)', type: 'text', unit: '' }, ...plantillaDefault],
  'Limpieza de Ca├▒ada': [{ key: 'nombre_canada', label: 'Nombre ca├▒ada', type: 'text', unit: '' }, ...plantillaDefault],
  'Colocaci├│n de alcantarillas': [...plantillaDefault],
  'Desalojo': [...plantillaDefault],
  'Habilitaci├│n Zona protegida o Espacio p├║blico': [...plantillaDefault],
  'Canalizaci├│n:R├¡o': [...plantillaDefault],
  'Canalizaci├│n:Arroyo': [...plantillaDefault],
  'Canalizaci├│n:Ca├▒ada': [...plantillaDefault]
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

  // password recovery state
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetUsername, setResetUsername] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  const [canResend, setCanResend] = useState(true);
  const [resendSeconds, setResendSeconds] = useState(0);

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
  const [showChatPage, setShowChatPage] = useState(false);
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

  // Estado de pantalla completa
  const [isFullScreen, setIsFullScreen] = useState(false);
  
  // Estado para el men├║ desplegable del usuario
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showMyReportsModal, setShowMyReportsModal] = useState(false);
  const [showCompleteProfileModal, setShowCompleteProfileModal] = useState(false);

  // Estado para el chat flotante (ChatList/ChatModal)
  const [showChatList, setShowChatList] = useState(false);
  const [activeChatUser, setActiveChatUser] = useState<string | null>(null);
  const ignoreChatOpenUntilRef = useRef(0);

  // Estados del nuevo ÔÇ£Nivel de EstabilidadÔÇØ con giroscopio
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
  const [idCardNumber, setIdCardNumber] = useState<string>(''); // Nuevo estado para c├®dula
  const [showProfileIncompleteNotification, setShowProfileIncompleteNotification] = useState(false);
  const [isProfileComplete, setIsProfileComplete] = useState(false);

  // Funci├│n para actualizar el contador de pendientes del usuario actual
  const updatePendingCount = async () => {
    try {
      // Obtener reportes con estado 'pendiente' de la colecci├│n principal
      const allPending = await firebaseReportStorage.getReportsByEstado('pendiente');
      
      // Filtrar solo los del usuario actual
      const userPending = allPending.filter(report => 
        report.usuarioId === user?.username || report.creadoPor === user?.username
      );
      
      setPendingCount(userPending.length);
      console.log(`­ƒôè Reportes pendientes del usuario ${user?.username}:`, userPending.length);
    } catch (error) {
      console.error('ÔØî Error actualizando contador de pendientes:', error);
      setPendingCount(0);
    }
  };

  const toggleFullScreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen?.();
        setIsFullScreen(true);
      } else {
        await document.exitFullscreen?.();
        setIsFullScreen(false);
      }
    } catch (err) {
      console.warn('No se pudo alternar pantalla completa', err);
    }
  };

  useEffect(() => {
    const onFullScreenChange = () => setIsFullScreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFullScreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullScreenChange);
  }, []);

  // Funci├│n para obtener lista detallada de reportes pendientes del usuario
  const getPendingReports = async () => {
    try {
      // Obtener reportes con estado 'pendiente' de la colecci├│n principal
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
      console.error('ÔØî Error obteniendo reportes pendientes:', error);
      setPendingReportsList([]);
      return [];
    }
  };

  // Funci├│n para continuar un reporte pendiente
  const handleContinuePendingReport = async (reportId: string) => {
    try {
      console.log('­ƒôï Cargando reporte pendiente desde Firebase:', reportId);
      
      // Cargar desde la colecci├│n principal de reportes (no desde pendingReports)
      const pendingReport = await firebaseReportStorage.getReport(reportId);
      
      console.log('­ƒôª Datos del reporte desde Firebase:', pendingReport);
      
      if (pendingReport && pendingReport.estado === 'pendiente') {
        // Convertir el reporte completo a formato de edici├│n
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
          // Restaurar datos multi-d├¡a si existen
          diasTrabajo: pendingReport.diasTrabajo || [],
          reportesPorDia: pendingReport.reportesPorDia || {},
          diaActual: pendingReport.diaActual || 0,
          _pendingReportId: pendingReport.id // ID del reporte pendiente para actualizar
        };
        
        console.log('Ô£à Datos a cargar en el formulario:', dataToLoad);
        
        setInterventionToEdit(dataToLoad);
        setShowPendingModal(false);
        setShowMyReportsModal(false);
        setShowReportForm(true);
        setActiveNav('crear');
      } else {
        console.error('ÔØî No se encontr├│ el reporte pendiente en Firebase:', reportId);
        alert('No se pudo cargar el reporte pendiente');
      }
    } catch (error) {
      console.error('ÔØî Error al cargar el reporte pendiente desde Firebase:', error);
      alert('Error al cargar el reporte pendiente');
    }
  };

  // Funci├│n para cancelar/eliminar un reporte pendiente
  const handleCancelPendingReport = async (reportId: string) => {
    try {
      // Eliminar de la colecci├│n principal de Firebase
      await firebaseReportStorage.deleteReport(reportId);
      console.log('Ô£à Reporte pendiente eliminado de Firebase');
      await updatePendingCount();
      // Actualizar la vista del modal
      setShowPendingModal(false);
      setTimeout(() => setShowPendingModal(true), 100);
    } catch (error) {
      console.error('ÔØî Error eliminando reporte pendiente:', error);
      alert('Error al eliminar el reporte pendiente. Verifique su conexi├│n a internet.');
    }
  };

  // Funciones para ReportView
  // reportIdOrNumber puede ser el ID del reporte o el n├║mero de reporte (numeroReporte)
  const handleOpenReportView = (reportIdOrNumber: string) => {
    console.log('­ƒöì handleOpenReportView llamado con:', reportIdOrNumber);
    console.log('­ƒöì Estado actual:', { showReportView, selectedReportId });
    
    setSelectedReportId(reportIdOrNumber);
    setShowReportView(true);
    
    console.log('­ƒöì Despu├®s de actualizar estado:', { 
      showReportView: true, 
      selectedReportId: reportIdOrNumber 
    });
  };

  const handleCloseReportView = () => {
    setShowReportView(false);
    setSelectedReportId(null);
    setActiveNav('dashboard'); // Volver al bot├│n home
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
      // Restaurar datos multi-d├¡a si existen
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
    // Aqu├¡ puedes implementar la l├│gica de eliminaci├│n
    alert('Funci├│n de eliminaci├│n no implementada a├║n');
  };

  const handleExportReportFromView = (report: any) => {
    console.log('Exportando reporte desde ReportViewModern:', report);
    // Aqu├¡ puedes implementar la l├│gica de exportaci├│n
    alert('Funci├│n de exportaci├│n no implementada a├║n');
  };

  // Actualizar contador al cargar y cada vez que cambie localStorage
  useEffect(() => {
    updatePendingCount();
    
    // Escuchar cambios en localStorage
    const handleStorageChange = () => {
      updatePendingCount();
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Tambi├®n verificar peri├│dicamente por si hay cambios internos
    const interval = setInterval(updatePendingCount, 2000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Cargar reportes pendientes cuando se abre el modal
  useEffect(() => {
    if (showPendingModal) {
      console.log('­ƒôÑ Modal de pendientes abierto, cargando reportes desde Firebase...');
      getPendingReports();
    }
  }, [showPendingModal]);

  // Cerrar men├║ desplegable al hacer clic fuera
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

  // Verificar si el perfil del usuario est├í completo
  useEffect(() => {
    const checkVerification = async () => {
      if (user) {
        // Verificar si el usuario requiere verificaci├│n de perfil desde Firebase
        const firebaseUser = await firebaseUserStorage.getUserByUsername(user.username);
        
        console.log('­ƒöì Verificando usuario:', user.username);
        console.log('­ƒôª Usuario Firebase:', firebaseUser);
        console.log('Ô£à isVerified:', firebaseUser?.isVerified);
        
        // Si el usuario no existe en Firebase, no pedir verificaci├│n (compatibilidad con localStorage)
        if (!firebaseUser) {
          console.log('Ôä╣´©Å Usuario solo en localStorage, sin verificaci├│n requerida');
          setShowProfileIncompleteNotification(false);
          setIsProfileComplete(true);
          return;
        }
        
        // Si el usuario existe en Firebase pero no est├í verificado
        const requiresVerification = !firebaseUser.isVerified;
        
        if (requiresVerification) {
          // Solo mostrar solicitud de verificaci├│n si isVerified es false
          const profileData = localStorage.getItem(`profile_${user.username}`);
          if (profileData) {
            const profile = JSON.parse(profileData);
            setProfilePhoto(profile.profilePhoto || '');
            setFullName(profile.fullName || '');
            setBirthDate(profile.birthDate || '');
            setIdCardPhoto(profile.idCardPhoto || '');
            
            // Verificar si todos los campos est├ín completos
            const isComplete = profile.profilePhoto && profile.fullName && profile.birthDate && profile.idCardPhoto;
            setShowProfileIncompleteNotification(!isComplete);
            setIsProfileComplete(isComplete);
          } else {
            setShowProfileIncompleteNotification(true);
            setIsProfileComplete(false);
          }
        } else {
          // Usuario con isVerified = true no necesita verificaci├│n de perfil
          console.log('Ô£à Usuario verificado, ocultando notificaci├│n');
          setShowProfileIncompleteNotification(false);
          setIsProfileComplete(true);
        }
      }
    };
    
    checkVerification();
  }, [user]);

  // Iniciar tracking en vivo cuando el usuario inicie sesi├│n
  useEffect(() => {
    if (user && user.username) {
      console.log('­ƒôì Iniciando tracking en vivo para usuario:', user.username);
      
      const liveLocationService = LiveLocationService.getInstance();
      
      // Iniciar tracking en vivo
      liveLocationService.startLiveTracking(user.username)
        .then(() => {
          console.log('Ô£à Tracking en vivo iniciado exitosamente');
        })
        .catch((error) => {
          console.error('ÔØî Error iniciando tracking en vivo:', error);
        });

      // Limpiar tracking cuando el usuario cierre sesi├│n
      return () => {
        console.log('­ƒôì Deteniendo tracking en vivo para usuario:', user.username);
        liveLocationService.stopLiveTracking();
      };
    }
  }, [user]);

  // Aplicar tema según el rol del usuario e iniciar presencia web
  useEffect(() => {
    if (user && user.role) {
      // Aplicar tema del rol
      applyUserTheme(user.role);

      // Iniciar rastreo de presencia si el usuario está logueado
      if (user.username) {
        userPresenceService.startPresenceTracking(user.username);

        // Limpiar mensajes antiguos (>7 días) en segundo plano
        chatService.cleanOldMessages().catch(() => {});
      }
    } else {
      // Si no hay rol definido, usar rol por defecto (Admin para compatibilidad)
      applyUserTheme(UserRole.ADMIN);

      // Detener rastreo de presencia si no hay usuario
      userPresenceService.stopPresenceTracking();
    }
  }, [user]);


  // Solicitar permisos GPS al cargar la aplicaci├│n
  useEffect(() => {
    const requestGpsPermission = async () => {
      if ('geolocation' in navigator) {
        try {
          // Solicitar permiso y obtener posici├│n inicial
          navigator.geolocation.getCurrentPosition(
            (position) => {
              setGpsPosition({
                lat: position.coords.latitude,
                lon: position.coords.longitude
              });
              setIsGpsEnabled(true);
              console.log('GPS habilitado al cargar la aplicaci├│n');
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

  // Manejar bot├│n de retroceso de Android
  useEffect(() => {
    let backButtonListener: any = null;

    const handleBackButton = () => {
      console.log('­ƒöÖ Bot├│n de retroceso presionado');

      // Si la c├ímara est├í abierta, cerrarla en lugar de salir de la app
      if ((window as any).cameraOpen) {
        console.log('­ƒöÖ Cerrando c├ímara con bot├│n de retroceso');
        const cameraInterface = document.querySelector('[style*="z-index: 10000"]');
        if (cameraInterface) {
          cameraInterface.remove();
        }
        (window as any).cameraOpen = false;
        return;
      }

      if (showReportView) {
        console.log('­ƒöÖ Cerrando ReportViewModern');
        handleCloseReportView();
        return;
      }

      if (showMyReportsModal) {
        console.log('­ƒöÖ Cerrando Mis Reportes');
        setShowMyReportsModal(false);
        setActiveNav('dashboard');
        return;
      }

      if (showPendingModal) {
        console.log('­ƒöÖ Cerrando Reportes Pendientes');
        setShowPendingModal(false);
        setActiveNav('dashboard');
        return;
      }

      if (showCompleteProfileModal) {
        console.log('­ƒöÖ Cerrando modal completo de perfil');
        setShowCompleteProfileModal(false);
        return;
      }

      if (showReportForm) {
        console.log('­ƒöÖ Saliendo del formulario de reporte');
        if (window.confirm('┬┐Est├í seguro que desea salir del formulario? Los datos no guardados se perder├ín.')) {
          setShowReportForm(false);
          setInterventionToEdit(null);
          handleCloseReportView();
          return;
        }
      }

      if (showStabilityModal) {
        console.log('­ƒöÖ Cerrando modal de estabilidad');
        setShowStabilityModal(false);
        return;
      }

      if (showHeavyVehiclesPage) {
        console.log('­ƒöÖ Cerrando vista de Veh├¡culos Pesados');
        handleBackToDashboard();
        return;
      }

      if (showReportsPage || showExportPage || showUsersPage || showGoogleMapView || showLeafletMapView || showHierarchy || showSettingsPage) {
        console.log('­ƒöÖ Volviendo al dashboard');
        handleBackToDashboard();
        return;
      }

      console.log('­ƒöÖ Ya est├í en el dashboard - salir de la app');
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

  // Giroscopio + Aceler├│metro (modo iOS Level)
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
            setStabilityText('Permiso de aceler├│metro denegado.');
            return;
          }
        } catch (error) {
          console.error('Error solicitando permiso de aceler├│metro:', error);
          setStabilityText('No se pudo solicitar permiso de aceler├│metro.');
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

        // Calculamos inclinaci├│n () basado en vector gravedad.
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
      setLoginError('Por favor ingrese usuario y contrase├▒a');
      return;
    }

    setIsLoading(true);
    setLoginError('');

    await new Promise(r => setTimeout(r, 1000));

    try {
      console.log('­ƒöÉ Intentando login con Firebase...');
      
      // Intentar login con Firebase
      const result = await firebaseUserStorage.loginWithUsername(loginUser, loginPass);
      
      if (result.success && result.user) {
        const validatedUser = result.user;
        
        // Verificar si la cuenta est├í activa
        if (!validatedUser.isActive) {
          setLoginError('ÔÜá´©Å Lo sentimos, su cuenta est├í temporalmente desactivada. Comun├¡quese con su superior.');
          setIsLoading(false);
          return;
        }
        
        // Credenciales v├ílidas y cuenta activa - usuario autenticado
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
        
        console.log(`Ô£à Usuario autenticado desde Firebase como: ${getRoleBadge(userRole)}`);
        setIsLoading(false);
        return;
      }
      
      // Si Firebase falla, intentar con localStorage como fallback
      console.log('ÔÜá´©Å Firebase login fall├│, intentando con localStorage...');
      const allUsers = userStorage.getAllUsers();
      console.log('­ƒôè Usuarios en localStorage:', allUsers.length);
      
      const validatedUser = userStorage.validateCredentials(loginUser, loginPass);
      
      if (validatedUser) {
        if (!validatedUser.isActive) {
          setLoginError('ÔÜá´©Å Lo sentimos, su cuenta est├í temporalmente desactivada. Comun├¡quese con su superior.');
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
        
        console.log(`Ô£à Usuario autenticado desde localStorage como: ${getRoleBadge(userRole)}`);
        setIsLoading(false);
        return;
      }
      
      // Usuario no encontrado en ning├║n lado
      setLoginError(result.error || `ÔØî Usuario "${loginUser}" no encontrado`);
      setIsLoading(false);
      
    } catch (err) {
      console.error('ÔØî Error en login:', err);
      setLoginError('ÔÜá´©Å Error del sistema. Recargue la p├ígina e intente nuevamente.');
      setIsLoading(false);
    }
  };

  const startResendTimer = () => {
    setCanResend(false);
    setResendSeconds(60);

    const interval = setInterval(() => {
      setResendSeconds(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendPasswordRecovery = async () => {
    setResetError('');
    setResetSuccess('');

    if (!resetUsername.trim() || !resetEmail.trim()) {
      setResetError('Por favor ingrese usuario y correo electr├│nico.');
      return;
    }

    try {
      const candidate = await firebaseUserStorage.getUserByUsernameInsensitive(resetUsername.trim());

      if (!candidate) {
        setResetError('No se encontr├│ usuario con ese nombre de usuario en Firebase. Verifique el usuario.');
        return;
      }

      if (candidate.email?.toLowerCase() !== resetEmail.trim().toLowerCase()) {
        setResetError('El correo no coincide con el usuario en Firebase. Verifique los datos.');
        return;
      }

      if (!candidate.email) {
        setResetError('El usuario no tiene correo registrado en Firebase. Contacte al administrador.');
        return;
      }


      if (!candidate) {
        setResetError('No se encontr├│ usuario con ese nombre de usuario en Firebase.');
        return;
      }

      if (!candidate.email) {
        setResetError('El usuario no tiene correo registrado en Firebase. Contacte al administrador.');
        return;
      }

      const localUser = userStorage.getUserByUsername(resetUsername.trim());
      const password = localUser?.password;

      if (!password) {
        setResetError('No se encontr├│ la contrase├▒a en el almacenamiento local. Si el usuario usa Firebase Auth, el administrador debe resetearla.');
        return;
      }

      const emailResult = await sendPasswordResetEmail({
        name: candidate.name || candidate.username,
        username: candidate.username,
        email: candidate.email,
        password,
        role: candidate.role || 'T├®cnico'
      });

      if (!emailResult.success) {
        setResetError(emailResult.error || 'Error enviando correo de recuperaci├│n');
        return;
      }

      setResetSuccess('Email enviado con ├®xito. Revise su bandeja de entrada.');
      startResendTimer();
    } catch (err: any) {
      console.error('Error enviando recuperaci├│n de contrase├▒a:', err);
      setResetError('Ocurri├│ un error interno. Intente m├ís tarde.');
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

    // Validar que todos los campos est├®n completos
    if (!profilePhoto || !fullName || !idCardNumber || !idCardPhoto) {
      alert('ÔÜá´©Å Por favor complete todos los campos requeridos');
      return;
    }

    // Verificar si el usuario est├í en userStorage
    const storedUser = userStorage.getUserByUsername(user.username);
    
    if (storedUser && storedUser.cedula) {
      // Validar que el n├║mero de c├®dula coincida con el registrado
      const storedCedula = storedUser.cedula;
      
      // Normalizar los n├║meros de c├®dula (quitar guiones, espacios, puntos)
      const normalizedInput = idCardNumber.replace(/[-.\s]/g, '');
      const normalizedStored = storedCedula.replace(/[-.\s]/g, '');
      
      if (normalizedInput !== normalizedStored) {
        alert('ÔØî Error de verificaci├│n');
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

    // Actualizar estados de verificaci├│n de perfil
    setShowProfileIncompleteNotification(false);
    setIsProfileComplete(true);
    setShowCompleteProfileModal(false);
    alert('Ô£à Perfil completado exitosamente. Ahora puede acceder a todas las funcionalidades.');
  };

  const handleLogout = () => {
    // Detener rastreo de presencia web
    userPresenceService.stopPresenceTracking();

    setUser(null);
    setActiveChatUser(null);
    try { 
      localStorage.removeItem('mopc_user'); 
    } catch {}
  };

  const handleOpenChatModal = (username: string) => {
    setActiveChatUser(username);
  };

  const handleCloseChatModal = () => {
    ignoreChatOpenUntilRef.current = Date.now() + 350;
    setActiveChatUser(null);
    setShowChatList(false);
  };

  const handleOpenChatList = () => {
    if (Date.now() < ignoreChatOpenUntilRef.current) return;
    setShowChatList(true);
  };

  // bandera para alternar entre el estilo tradicional de tarjetas y
  // la nueva propuesta de iconos circulares tipo app m├│vil.
  const useIconButtons = true;
  // algunos iconos no estar├ín activos a├║n (Buscar, Usuarios, Exportar).
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

  // Funciones para manejar la navegaci├│n inferior
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
        // Cargar p├ígina completa de Mis Reportes
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

  // Funci├│n para manejar la c├ímara con geolocalizaci├│n en vivo, flash y giro
  const handleOpenCamera = async () => {
    if (!isProfileComplete) {
      setShowCompleteProfileModal(true);
      return;
    }

    // Detectar modelo de dispositivo para configuraci├│n espec├¡fica
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
      // Default gen├®rico
      else {
        return 'generic';
      }
    };

    const deviceModel = getDeviceModel();
    console.log('­ƒô▒ Modelo detectado:', deviceModel);

    // Variable global para controlar si la c├ímara est├í abierta
    (window as any).cameraOpen = true;

    try {
      console.log('­ƒôÀ Iniciando c├ímara con geolocalizaci├│n en vivo...');

      // Limpiar guarda de foto previas para evitar duplicados indeseados
      try {
        localStorage.removeItem('mopc_photo_gallery');
      } catch (error) {
        console.warn('No se pudo limpiar gallery cache:', error);
      }
      
      // Mostrar interfaz de c├ímara con controles
      const cameraInterface = document.createElement('div');
      cameraInterface.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100vh;
        background: black;
        z-index: 10000;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      `;
      
      // Header con geolocalizaci├│n en vivo
      const header = document.createElement('div');
      header.style.cssText = `
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 12px;
        text-align: center;
        font-size: 14px;
      `;
      header.innerHTML = '­ƒôì Obteniendo ubicaci├│n...<br/><small>Por favor espere</small>';
      
      // Estados
      let currentPosition: any = null;
      let currentAddress = 'Ubicaci├│n desconocida';
      let flashMode = 'off'; // off, on, auto
      let cameraDirection = 'environment'; // environment (trasera) / user (frontal)
      let zoomLevel = 1; // 1x a 4x zoom
      let textSizeLevel = 1; // 1x a 3x tama├▒o de letra
      
      // LIMPIEZA RADICAL - solo elementos esenciales
      const videoContainer = document.createElement('div');
      videoContainer.style.cssText = `
        flex: 1;
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        background: black;
        overflow: hidden;
      `;
      
      const video = document.createElement('video');
      video.style.cssText = `
        width: 100%;
        height: 100%;
        object-fit: cover;
      `;
      
      // Overlay simple - solo lo necesario
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
      `;
      
      // Logo simple - solo texto
      const mopcLogo = document.createElement('div');
      mopcLogo.style.cssText = `
        position: absolute;
        top: 20px;
        right: 20px;
        font-weight: bold;
        font-size: 20px;
        color: rgba(255, 107, 0, 0.9);
        z-index: 10;
      `;
      mopcLogo.innerHTML = 'MOPC';
      
      // Elementos de texto
      const userName = document.createElement('div');
      userName.style.cssText = `
        font-weight: bold;
        font-size: 14px;
        color: #FF6B00;
      `;
      userName.textContent = user?.fullName || user?.name || user?.username || 'Miguel De Jesus Cabrera Cruz';
      
      const dateTimeInfo = document.createElement('div');
      dateTimeInfo.style.cssText = `
        font-size: 10px;
        color: rgba(255, 255, 255, 0.7);
      `;
      const now = new Date();
      dateTimeInfo.textContent = `­ƒòÆ ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
      
      const locationInfo = document.createElement('div');
      locationInfo.style.cssText = `
        font-size: 12px;
        color: white;
      `;
      locationInfo.textContent = '­ƒôì Obteniendo ubicaci├│n...';
      
      const coordinatesInfo = document.createElement('div');
      coordinatesInfo.style.cssText = `
        font-size: 10px;
        color: rgba(255, 255, 255, 0.7);
        font-family: monospace;
      `;
      coordinatesInfo.textContent = 'Lat: --.------, Lon: --.------';
      
      // Agregar solo lo necesario al overlay
      geoOverlay.appendChild(userName);
      geoOverlay.appendChild(dateTimeInfo);
      geoOverlay.appendChild(locationInfo);
      geoOverlay.appendChild(coordinatesInfo);
      
      // Agregar elementos al videoContainer
      videoContainer.appendChild(video);
      videoContainer.appendChild(geoOverlay);
      videoContainer.appendChild(mopcLogo);
      
      // Controles simples
      const controls = document.createElement('div');
      controls.style.cssText = `
        background: rgba(0, 0, 0, 0.9);
        padding: 8px;
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 20px;
        height: 70px;
        flex-shrink: 0;
      `;
      
      // Botones simples
      const flashButton = document.createElement('button');
      flashButton.style.cssText = `
        background: rgba(255, 255, 255, 0.2);
        border: 2px solid white;
        color: white;
        padding: 12px;
        border-radius: 50%;
        font-size: 20px;
        cursor: pointer;
      `;
      flashButton.title = 'Encender / Apagar flash';
      flashButton.innerHTML = 'ÔÜí';
      
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
      captureButton.title = 'Capturar foto';
      captureButton.innerHTML = '­ƒôÀ';
      
      const flipButton = document.createElement('button');
      flipButton.style.cssText = `
        background: rgba(255, 255, 255, 0.2);
        border: 2px solid white;
        color: white;
        padding: 12px;
        border-radius: 50%;
        font-size: 20px;
        cursor: pointer;
      `;
      flipButton.title = 'Cambiar c├ímara frontal/trasera';
      flipButton.innerHTML = '­ƒöä';
      flipButton.style.cssText = `
        background: rgba(255, 255, 255, 0.2);
        border: 2px solid white;
        color: white;
        padding: 12px;
        border-radius: 50%;
        font-size: 20px;
        cursor: pointer;
      `;
      flipButton.innerHTML = '­ƒöä';

      const zoomLabel = document.createElement('div');
      zoomLabel.style.cssText = `
        color: white;
        font-size: 11px;
        text-align: center;
        width: 120px;
      `;
      zoomLabel.textContent = `Zoom: ${zoomLevel.toFixed(1)}x`;

      const zoomSlider = document.createElement('input');
      zoomSlider.type = 'range';
      zoomSlider.min = '1';
      zoomSlider.max = '3';
      zoomSlider.step = '0.1';
      zoomSlider.value = String(zoomLevel);
      zoomSlider.style.cssText = `
        width: 120px;
        appearance: none;
      `;

      const textSizeLabel = document.createElement('div');
      textSizeLabel.style.cssText = `
        color: white;
        font-size: 11px;
        text-align: center;
        width: 120px;
      `;
      textSizeLabel.textContent = `Texto: ${textSizeLevel.toFixed(1)}x`;

      const textSizeSlider = document.createElement('input');
      textSizeSlider.type = 'range';
      textSizeSlider.min = '0.8';
      textSizeSlider.max = '2.0';
      textSizeSlider.step = '0.1';
      textSizeSlider.value = String(textSizeLevel);
      textSizeSlider.style.cssText = `
        width: 120px;
        appearance: none;
      `;
      
      // Ensamblar interfaz
      controls.appendChild(flashButton);      
      controls.appendChild(captureButton);
      controls.appendChild(flipButton);

      cameraInterface.appendChild(videoContainer);
      cameraInterface.appendChild(controls);
      document.body.appendChild(cameraInterface);

      const zoomContainer = document.createElement('div');
      zoomContainer.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:4px;';
      zoomContainer.appendChild(zoomLabel);
      zoomContainer.appendChild(zoomSlider);

      const textSizeContainer = document.createElement('div');
      textSizeContainer.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:4px;';
      textSizeContainer.appendChild(textSizeLabel);
      textSizeContainer.appendChild(textSizeSlider);

      controls.appendChild(zoomContainer);
      controls.appendChild(textSizeContainer);

      // Iniciar geolocalizaci├│n en vivo
      const watchPositionId = await Geolocation.watchPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000
      }, async (position) => {
        currentPosition = position;
        
        // Actualizar overlay de georeferencia dentro del video
        try {
          if (!position || !position.coords) {
            locationInfo.innerHTML = '­ƒôì Obteniendo ubicaci├│n...';
            coordinatesInfo.innerHTML = 'Lat: --.------, Lon: --.------';
            return;
          }
          
          // Actualizar coordenadas
          const currentTime = new Date();
          dateTimeInfo.textContent = `­ƒòÆ ${currentTime.toLocaleDateString()} ${currentTime.toLocaleTimeString()}`;
          coordinatesInfo.innerHTML = `Lat: ${position.coords.latitude.toFixed(6)}, Lon: ${position.coords.longitude.toFixed(6)}`;
          
          // Obtener direcci├│n con OpenStreetMap Nominatim
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
              locationInfo.innerHTML = `­ƒôì ${currentAddress}`;
            } else {
              locationInfo.innerHTML = `­ƒôì Ubicaci├│n desconocida`;
            }
          } else {
            locationInfo.innerHTML = `­ƒôì Lat: ${position.coords.latitude.toFixed(6)}, Lon: ${position.coords.longitude.toFixed(6)}`;
          }
        } catch (error) {
          const errorTime = new Date();
          dateTimeInfo.textContent = `­ƒòÆ ${errorTime.toLocaleDateString()} ${errorTime.toLocaleTimeString()}`;
          if (position && position.coords) {
            locationInfo.innerHTML = `­ƒôì Lat: ${position.coords.latitude.toFixed(6)}, Lon: ${position.coords.longitude.toFixed(6)}`;
          } else {
            locationInfo.innerHTML = '­ƒôì Error obteniendo ubicaci├│n';
          }
        }
      });
      
      // Iniciar stream de video
      try {
        const constraints: any = {
          video: {
            facingMode: 'environment', // Forzar c├ímara trasera
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          },
          audio: false
        };
        
        // Configuraci├│n espec├¡fica seg├║n modelo
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
        
        // Agregar torch solo si est├í soportado
        if (flashMode === 'on') {
          constraints.video.torch = true;
        }
        
        console.log('­ƒÄÑ Iniciando stream con constraints:', constraints);
        let stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        video.srcObject = stream;
        video.play();
        
        // Funci├│n para capturar foto
        const capturePhoto = async () => {
          try {
            // Evitar taps repetidos que generen duplicados
            captureButton.disabled = true;
            setTimeout(() => { captureButton.disabled = false; }, 1500);

            // Captura directa del videoContainer - solo video + overlay + logo, sin controles
            const canvas = document.createElement('canvas');
            const videoContainer = document.querySelector('[style*="flex: 1"]');
            
            if (!videoContainer) {
              console.error('No se encontr├│ videoContainer');
              return;
            }
            
            const videoRect = videoContainer.getBoundingClientRect();
            canvas.width = videoRect.width;
            canvas.height = videoRect.height;
            const ctx = canvas.getContext('2d');
            
            if (ctx) {
              // Activar flash si est├í en modo 'on' o 'auto'
              if (flashMode === 'on' || flashMode === 'auto') {
                try {
                  const videoTrack = stream.getVideoTracks()[0];
                  if (videoTrack) {
                    const constraints = { 
                      advanced: [{ torch: true }] 
                    } as any;
                    await videoTrack.applyConstraints(constraints);
                    
                    await new Promise(resolve => setTimeout(resolve, 200));
                    
                    const constraintsOff = { 
                      advanced: [{ torch: false }] 
                    } as any;
                    await videoTrack.applyConstraints(constraintsOff);
                  }
                } catch (flashError) {
                  console.log('Flash no disponible:', flashError);
                }
              }
              
              // Capturar el video con zoom aplicado
              ctx.save();
              ctx.translate(canvas.width / 2, canvas.height / 2);
              ctx.scale(zoomLevel, zoomLevel);
              ctx.translate(-canvas.width / 2, -canvas.height / 2);
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              ctx.restore();
              
              // Capturar HTML completo del videoContainer y dibujarlo en canvas
              const html2canvas = await import('html2canvas').then(m => m.default);
              const videoContainerCanvas = await html2canvas(videoContainer as HTMLElement, {
                backgroundColor: null,
                scale: 1,
                useCORS: true,
                allowTaint: true
              });
              
              // Dibujar el overlay y logo desde el HTML capturado
              ctx.drawImage(videoContainerCanvas, 0, 0);
              
              // Convertir a data URL
              const photoDataUrl = canvas.toDataURL('image/jpeg', 0.95);

              // En esta versi├│n seguimos con la c├ímara abierta para continuar tomando.
              // No cerramos stream ni removemos la interfaz.
              
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
              processingMessage.innerHTML = '­ƒôÀ Agregando marca de agua georeferenciada...<br/><small>Por favor espere</small>';
              document.body.appendChild(processingMessage);
              
              // Guardar directamente el fotograma tal cual viene de la vista en vivo,
              // haciendo que el usuario vea en la galer├¡a lo mismo que ve en la c├ímara.
              await savePhotoToGallery(photoDataUrl, `MOPC_Photo_${new Date().toISOString().replace(/[:.]/g, '-')}.jpg`);

              // Mensaje de ├®xito dentro de la propia interfaz
              const successMessage = document.createElement('div');
              successMessage.style.cssText = `
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 10px 16px;
                border-radius: 10px;
                z-index: 10001;
                font-size: 14px;
              `;
              successMessage.textContent = '­ƒô© Foto guardada correctamente. Sigue tomando.';
              document.body.appendChild(successMessage);

              setTimeout(() => {
                successMessage.remove();
              }, 1800);

              // Remover mensaje de procesamiento
              processingMessage.remove();

              console.log('Ô£à Foto capturada y guardada con geolocalizaci├│n en vivo');
            }
          } catch (error: any) {
            console.error('Error capturando foto:', error);
            alert('Error al capturar foto: ' + (error.message || 'Error desconocido'));
          }
        };
        
        // Funci├│n para toggle flash
        const toggleFlash = async () => {
          try {
            if (flashMode === 'off') {
              flashMode = 'on';
              flashButton.style.background = 'yellow';
              flashButton.style.color = 'black';
            } else {
              flashMode = 'off';
              flashButton.style.background = 'rgba(255, 255, 255, 0.2)';
              flashButton.style.color = 'white';
            }
            
            console.log('­ƒöª Flash cambiado a:', flashMode);
            // Flash real en WebRTC no est├í implementado, solo visual
          } catch (error) {
            console.error('Error cambiando flash:', error);
          }
        };
        
        // Funci├│n para girar c├ímara
        const flipCamera = async () => {
          try {
            cameraDirection = cameraDirection === 'environment' ? 'user' : 'environment';
            
            // Reiniciar stream con nueva direcci├│n
            stream.getTracks().forEach(track => track.stop());
            
            const flipConstraints: any = {
              video: {
                facingMode: cameraDirection,
                width: { ideal: 1920 },
                height: { ideal: 1080 }
              },
              audio: false
            };
            
            // Configuraci├│n espec├¡fica seg├║n modelo
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
            
            console.log('­ƒöä Cambiando a c├ímara:', cameraDirection, flipConstraints);
            const newStream = await navigator.mediaDevices.getUserMedia(flipConstraints);
            stream = newStream; // Actualizar variable stream
            video.srcObject = newStream;
            video.play();
          } catch (error) {
            console.error('Error girando c├ímara:', error);
          }
        };
        
        // Funci├│n para controlar zoom con un solo slider
        const adjustZoom = (value: number) => {
          zoomLevel = value;
          
          // Aplicar zoom usando CSS transform al video (m├®todo compatible)
          video.style.transform = `scale(${zoomLevel})`;
          video.style.transformOrigin = 'center center';
          video.style.transition = 'transform 0.3s ease';
          
          console.log('­ƒöì Zoom aplicado:', zoomLevel);
        };
        
        // Funci├│n para controlar tama├▒o de texto con slider
        const adjustTextSize = (value: number) => {
          textSizeLevel = value;
          
          // Ajustar tama├▒o de texto del overlay
          userName.style.fontSize = `${14 * textSizeLevel}px`;
          locationInfo.style.fontSize = `${11 * textSizeLevel}px`;
          coordinatesInfo.style.fontSize = `${10 * textSizeLevel}px`;
        };
        
        // Event listeners
        captureButton.addEventListener('click', capturePhoto);
        flashButton.addEventListener('click', toggleFlash);
        flipButton.addEventListener('click', flipCamera);

        zoomSlider.addEventListener('input', (event: Event) => {
          const value = parseFloat((event.target as HTMLInputElement).value);
          adjustZoom(value);
          zoomLabel.textContent = `Zoom: ${value.toFixed(1)}x`;
        });

        textSizeSlider.addEventListener('input', (event: Event) => {
          const value = parseFloat((event.target as HTMLInputElement).value);
          adjustTextSize(value);
          textSizeLabel.textContent = `Texto: ${value.toFixed(1)}x`;
        });
        
      } catch (error) {
        console.error('Error accediendo a la c├ímara:', error);
        
        // Fallback a c├ímara Capacitor si WebRTC no funciona
        Geolocation.clearWatch({ id: watchPositionId });
        cameraInterface.remove();
        
        // Usar m├®todo original con Capacitor
        console.log('­ƒôÀ Usando c├ímara Capacitor como fallback...');
        
        // Obtener ubicaci├│n actual
        const position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 60000
        });
        
        // Obtener direcci├│n
        let address = 'Ubicaci├│n desconocida';
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
        
        // Usar c├ímara Capacitor
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
          
          // Guardar directamente en galer├¡a
          await savePhotoToGallery(watermarkedImage, `MOPC_Photo_${new Date().toISOString().replace(/[:.]/g, '-')}.jpg`);
          
          console.log('Ô£à Foto capturada y guardada con m├®todo Capacitor');
        }
      }
      
    } catch (error: any) {
      console.error('ÔØî Error al tomar foto:', error);
      alert('Error al tomar foto: ' + (error.message || error.toString()));
    }
  };

  // Funci├│n para guardar foto en galer├¡a
  const handleSavePhotoToGallery = async (photoData: { photo: string; location: any; timestamp: string }) => {
    try {
      // Crear un nombre de archivo ├║nico
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `MOPC_Photo_${timestamp}.jpg`;
      
      // Guardar en localStorage como galer├¡a simulada
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
      
      console.log('Foto guardada en galer├¡a:', newPhoto);
      
      // Aqu├¡ tambi├®n se podr├¡a implementar el guardado real en el dispositivo
      // usando el plugin de File System de Capacitor si se necesita
      
    } catch (error) {
      console.error('Error guardando foto en galer├¡a:', error);
      throw error;
    }
  };

  // Si se debe mostrar la p├ígina de Mis Reportes
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

  // Si se debe mostrar la p├ígina de configuraci├│n
  if (showChatPage && user) {
    return (
      <ChatPage
        currentUser={user}
        onBack={() => setShowChatPage(false)}
      />
    );
  }

  if (showSettingsPage && user) {
    return (
      <UserSettingsPage 
        user={user} 
        onBack={handleBackToDashboard}
        onLogout={handleLogout}
      />
    );
  }

  // Si se debe mostrar la jerarqu├¡a de reportes
  if (showHierarchy && user) {
    return (
      <MyReportsHierarchy 
        username={user.username} 
        onClose={handleBackToDashboard}
        onViewReport={handleOpenReportView}
      />
    );
  }

  // Si se debe mostrar la p├ígina de informes
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

  // Si se debe mostrar la p├ígina de exportar
  if (showExportPage && user) {
    return <ExportPage user={user} onBack={handleBackToDashboard} />;
  }

  // Si se debe mostrar la p├ígina de usuarios
  if (showUsersPage && user) {
    return <UsersPage user={user} onBack={handleBackToDashboard} />;
  }

  // Si se debe mostrar la p├ígina de veh├¡culos pesados
  if (showHeavyVehiclesPage && user) {
    return <HeavyVehiclesPage onClose={handleBackToDashboard} />;
  }

  // Si se debe mostrar el formulario de reportes
  if (showReportForm && user) {
    return (
      <ReportForm
        key={interventionToEdit?._pendingReportId || interventionToEdit?.id || 'new-report'} // Ô£à Forzar remontaje
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
                <h1 className="login-title">Direcci├│n de Coordinaci├│n Regional</h1>
                <p className="login-subtitle">Sistema de Gesti├│n de Obras P├║blicas</p>
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
              <label htmlFor="password">Contrase├▒a</label>
              <input
                id="password"
                type="password"
                className="form-input"
                placeholder="Ingrese contrase├▒a"
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
              {isLoading ? 'Iniciando sesi├│n...' : 'Iniciar Sesi├│n'}
            </button>

            <div className="forgot-password-row">
              <button
                type="button"
                className="link-button"
                onClick={() => setShowResetModal(true)}
                disabled={isLoading}
              >
                Recuperar contrase├▒a
              </button>
            </div>
          </form>

          {showResetModal && (
            <div className="modal-overlay" onClick={() => setShowResetModal(false)}>
              <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>Recuperar contrase├▒a</h3>
                  <button className="modal-close" onClick={() => setShowResetModal(false)}>&times;</button>
                </div>
                <div className="modal-body">
                  <div className="form-group">
                    <label htmlFor="resetUsername">Usuario</label>
                    <input
                      id="resetUsername"
                      type="text"
                      className="form-input"
                      placeholder="Ingrese su usuario"
                      value={resetUsername}
                      onChange={e => setResetUsername(e.target.value)}
                      autoComplete="username"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="resetEmail">Correo electr├│nico</label>
                    <input
                      id="resetEmail"
                      type="email"
                      className="form-input"
                      placeholder="Ingrese su correo electr├│nico"
                      value={resetEmail}
                      onChange={e => setResetEmail(e.target.value)}
                      autoComplete="email"
                    />
                  </div>

                  {resetError && <div className="error-message">{resetError}</div>}
                  {resetSuccess && <div className="success-message">{resetSuccess}</div>}

                  <button
                    type="button"
                    className="login-button"
                    onClick={handleSendPasswordRecovery}
                    disabled={!canResend}
                  >
                    {canResend ? 'Enviar' : `Espere ${resendSeconds} seg para reenviar`}
                  </button>
                </div>
              </div>
            </div>
          )}

              <div className="login-footer">
                <p> 2025 Ministerio de Obras P├║blicas y Comunicaciones</p>
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
            <button
              className="notification-fullscreen-button"
              onClick={toggleFullScreen}
              title={isFullScreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {isFullScreen ? (
                  <>
                    <path d="M16 18l4 0l0 -4" />
                    <path d="M8 6l-4 0l0 4" />
                    <path d="M16 6l4 0l0 4" />
                    <path d="M8 18l-4 0l0 -4" />
                  </>
                ) : (
                  <>
                    <path d="M4 9l0 -4l4 0" />
                    <path d="M20 15l0 4l-4 0" />
                    <path d="M20 9l0 -4l-4 0" />
                    <path d="M4 15l0 4l4 0" />
                  </>
                )}
              </svg>
            </button>
            <button
              className="notification-fullscreen-button"
              onClick={() => setShowChatPage(true)}
              title="Mensajes"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Cinta animada en el extremo superior */}
      <div className="dashboard-greeting">
        <div className="dashboard-greeting-label">VICEMINISTERIO DE COORDINACION REGIONAL</div>
      </div>

      <div className="dashboard-content">
        {/* Notificaci├│n de perfil incompleto */}
        {showProfileIncompleteNotification && (
          <div className="profile-incomplete-notification">
            <div className="notification-content">
              <span className="notification-icon">ÔÜá´©Å</span>
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
          {/* TODO: el dise├▒o original usaba "cards" para cada acci├│n.
              Para que el dashboard se parezca m├ís a una app m├│vil podemos
              usar iconos circulares y etiquetas peque├▒as. Se introduce el
              flag `useIconButtons` para alternar entre ambas versiones.
          */}
          {/** Presionar este valor a `true` activa el modo bot├│n circular */}
          {useIconButtons ? (
            <div className="dashboard-icons-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
              {/* versi├│n con botones redondos */}
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
                <div className="dashboard-action-label">C├ímara</div>
              </div>

              <div className={`dashboard-action ${!isProfileComplete ? 'profile-locked' : ''}`} onClick={handleOpenStabilityModal}>
                <div className="dashboard-action-icon" style={{ fontSize: '26px' }}>
                  ­ƒôÅ
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

              {/* Usuarios: oculto temporalmente en main, se puede volver a habilitar cambiando esta condici├│n */}
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
                  <div className="dashboard-action-label">Veh├¡culos Pesados</div>
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
              {/* dise├▒o previo con tarjetas */}
              {/* Icono Registrar */}
              <div className={`dashboard-icon-card ${!isProfileComplete ? 'profile-locked' : ''}`} onClick={handleShowReportForm}>
                <div className="dashboard-icon">
                  <AddIcon size={40} />
                </div>
                <h3 className="dashboard-icon-title">Registrar</h3>
                <p className="dashboard-icon-description">
                  Registrar nuevas obras y intervenciones realizadas
                </p>
                {!isProfileComplete && <div className="locked-overlay">­ƒöÆ</div>}
              </div>

              {/* Icono Informes - Oculto para usuarios t├®cnicos */}
              {user?.role !== UserRole.TECNICO && (
                <div className={`dashboard-icon-card ${!isProfileComplete ? 'profile-locked' : ''}`} onClick={handleShowReports}>
                  <div className="dashboard-icon">
                    <BarChartIcon size={40} />
                  </div>
                  <h3 className="dashboard-icon-title">Informes y Estad├¡sticas</h3>
                  <p className="dashboard-icon-description">
                    Ver estad├¡sticas, reportes y an├ílisis de todas las intervenciones
                  </p>
                  {!isProfileComplete && <div className="locked-overlay">­ƒöÆ</div>}
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
                {!isProfileComplete && <div className="locked-overlay">­ƒöÆ</div>}
                </div>
              )}
              {/* fin condicional Buscar - no cerrar grid aqu├¡ */}

              {/* Icono C├ímara - Disponible para todos los usuarios */}
              <div className={`dashboard-icon-card ${!isProfileComplete ? 'profile-locked' : ''}`} onClick={handleOpenCamera}>
                <div className="dashboard-icon">
                  <CameraIcon size={40} />
                </div>
                <h3 className="dashboard-icon-title">C├ímara</h3>
                <p className="dashboard-icon-description">
                  Tomar fotograf├¡as georeferenciadas con datos de ubicaci├│n
                </p>
                {!isProfileComplete && <div className="locked-overlay">­ƒöÆ</div>}
              </div>

              {/* Icono Nivel de Estabilidad con Giroscopio */}
              <div className={`dashboard-icon-card ${!isProfileComplete ? 'profile-locked' : ''}`} onClick={handleOpenStabilityModal}>
                <div className="dashboard-icon">
                  <span style={{ fontSize: '1.5rem' }}>­ƒôÅ</span>
                </div>
                <h3 className="dashboard-icon-title">Nivel de Estabilidad</h3>
                <p className="dashboard-icon-description">
                  Monitorea la estabilidad con el giroscopio y muestra un valor en tiempo real
                </p>
                {!isProfileComplete && <div className="locked-overlay">­ƒöÆ</div>}
              </div>

              {/* Icono Usuarios - Oculto temporalmente en main */}
              {user?.role !== UserRole.TECNICO && !hideUnusedIcons && false && (
                <div className={`dashboard-icon-card ${!isProfileComplete ? 'profile-locked' : ''}`} onClick={handleShowUsersPage}>
                  <div className="dashboard-icon">
                    <PeopleIcon size={40} />
                  </div>
                  <h3 className="dashboard-icon-title">Usuarios</h3>
                  <p className="dashboard-icon-description">
                    Gesti├│n de usuarios activos e inactivos del sistema
                  </p>
                  {!isProfileComplete && <div className="locked-overlay">­ƒöÆ</div>}
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
                {!isProfileComplete && <div className="locked-overlay">­ƒöÆ</div>}
              </div>
              )}
            </div>
          )}
        </div>
      </div>



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
                <div>Roll (izq/der): {gyroData.gamma.toFixed(1)}┬░</div>
                <div>Pitch (del/atr├ís): {gyroData.beta.toFixed(1)}┬░</div>
                <div>Yaw: {gyroData.alpha.toFixed(1)}┬░</div>
              </div>
              {!gyroPermissionPrompted && <p className="stability-note">Activa el giroscopio cuando se te solicite para medir correctamente.</p>}
            </div>
          </div>
        </div>
      )}

      {/* Modal ReportViewModern - Vista Detallada de Reportes */}
      {showReportView && selectedReportId && (
        <>
          {console.log('­ƒöì Dashboard: Renderizando ReportViewModern con:', { showReportView, selectedReportId })}
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
              <h2>­ƒæñ Mi Perfil</h2>
              <button className="modal-close" onClick={() => { setShowProfileModal(false); setActiveNav('dashboard'); }}>Ô£ò</button>
            </div>
            <div className="modal-body">
              <div className="profile-section">
                <div className="profile-avatar-large">
                  {user?.name.split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase()}
                </div>
                <div className="profile-info-group">
                  <div className="profile-info-item">
                    <label>­ƒæñ Nombre completo</label>
                    <input type="text" value={user?.name || ''} readOnly className="form-input" />
                  </div>
                  <div className="profile-info-item">
                    <label>­ƒöæ Usuario</label>
                    <input type="text" value={user?.username || ''} readOnly className="form-input" />
                  </div>
                  <div className="profile-info-item">
                    <label>­ƒÅó Departamento</label>
                    <input type="text" value="Direcci├│n de Coordinaci├│n Regional" readOnly className="form-input" />
                  </div>
                  <div className="profile-info-item">
                    <label>­ƒôì Regi├│n asignada</label>
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
              <h2>­ƒôï Mis Reportes</h2>
              <button className="modal-close" onClick={() => { setShowMyReportsModal(false); setActiveNav('dashboard'); }}>Ô£ò</button>
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
              <h2>Ô£¿ Completar Perfil</h2>
              <button className="modal-close" onClick={() => setShowCompleteProfileModal(false)}>Ô£ò</button>
            </div>
            <div className="modal-body">
              <p className="modal-description">Complete toda su informaci├│n para verificar su cuenta</p>
              
              {/* Foto de Perfil */}
              <div className="profile-field-section">
                <label className="profile-field-label">­ƒô© Foto de Perfil *</label>
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
                        <span className="upload-icon">­ƒôÀ</span>
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
                <label className="profile-field-label">­ƒæñ Nombre Completo *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej: Juan P├®rez G├│mez"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              {/* N├║mero de C├®dula */}
              <div className="profile-field-section">
                <label className="profile-field-label">­ƒåö N├║mero de C├®dula *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej: 001-1234567-8"
                  value={idCardNumber}
                  onChange={(e) => setIdCardNumber(e.target.value)}
                  maxLength={15}
                />
                <small style={{ color: '#6c757d', fontSize: '12px', marginTop: '5px', display: 'block' }}>
                  Debe coincidir con el n├║mero registrado en el sistema
                </small>
              </div>

              {/* Foto del Carnet */}
              <div className="profile-field-section">
                <label className="profile-field-label">­ƒ¬¬ Foto del Carnet de Identidad *</label>
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
                        <span className="upload-icon">­ƒ¬¬</span>
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

      {/* Panel de Mensajes flotante */}
      <ChatList
        isOpen={showChatList}
        onClose={() => setShowChatList(false)}
        currentUsername={user.username}
        activeChatUser={activeChatUser}
        onOpenChat={handleOpenChatModal}
        onCloseChat={handleCloseChatModal}
      />
    </div>
    </AppLayout>
  );
};

export default Dashboard;
