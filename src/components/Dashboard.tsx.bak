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
import { subscribeToUserChats } from '../services/firebaseChatService';
import { useNotificationSound } from '../hooks/useNotificationSound';
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

/* Ã”Ã¶Ã‡Ã”Ã¶Ã‡ Iconos para navegaciâ”œâ”‚n inferior Ã”Ã¶Ã‡Ã”Ã¶Ã‡ */
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

/* Ã”Ã¶Ã‡Ã”Ã¶Ã‡ Icono de usuario cuadrado para la topbar Ã”Ã¶Ã‡Ã”Ã¶Ã‡ */
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

/* Ã”Ã¶Ã‡Ã”Ã¶Ã‡ Icono de Câ”œÃ­mara Ã”Ã¶Ã‡Ã”Ã¶Ã‡ */
const CameraIcon = ({ size = 24, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
    <circle cx="12" cy="13" r="4"></circle>
  </svg>
);

type Field = { key: string; label: string; type: 'text' | 'number'; unit: string };

interface User {
  id?: string;
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
  { key: 'punto_inicial', label: 'Punto inicial de la intervenciâ”œâ”‚n', type: 'text', unit: 'Coordenadas decimales' },
  { key: 'punto_alcanzado', label: 'Punto alcanzado en la intervenciâ”œâ”‚n', type: 'text', unit: 'Coordenadas decimales' },
  { key: 'longitud_intervencion', label: 'Longitud de intervenciâ”œâ”‚n', type: 'number', unit: 'km' },
  { key: 'limpieza_superficie', label: 'Limpieza de superficie', type: 'number', unit: 'mâ”¬â–“' },
  { key: 'perfilado_superficie', label: 'Perfilado de superficie', type: 'number', unit: 'mâ”¬â–“' },
  { key: 'compactado_superficie', label: 'Compactado de superficie', type: 'number', unit: 'mâ”¬â–“' },
  { key: 'conformacion_cunetas', label: 'Conformaciâ”œâ”‚n de cunetas', type: 'number', unit: 'ml' },
  { key: 'extraccion_bote_material', label: 'Extracciâ”œâ”‚n y bote de material inservible', type: 'number', unit: 'mâ”¬â”‚' },
  { key: 'escarificacion_superficies', label: 'Escarificaciâ”œâ”‚n de superficies', type: 'number', unit: 'mâ”¬â–“' },
  { key: 'conformacion_plataforma', label: 'Conformaciâ”œâ”‚n de plataforma', type: 'number', unit: 'mâ”¬â–“' },
  { key: 'zafra_material', label: 'Zafra de material', type: 'number', unit: 'mâ”¬â”‚' },
  { key: 'motonivelacion_superficie', label: 'Motonivelaciâ”œâ”‚n de superficie', type: 'number', unit: 'mâ”¬â–“' },
  { key: 'suministro_extension_material', label: 'Suministro y extensiâ”œâ”‚n de material', type: 'number', unit: 'mâ”¬â”‚' },
  { key: 'suministro_colocacion_grava', label: 'Suministro y colocaciâ”œâ”‚n de grava', type: 'number', unit: 'mâ”¬â”‚' },
  { key: 'nivelacion_compactacion_grava', label: 'Nivelaciâ”œâ”‚n y compactaciâ”œâ”‚n de grava', type: 'number', unit: 'mâ”¬â–“' },
  { key: 'reparacion_alcantarillas', label: 'Reparaciâ”œâ”‚n de alcantarillas existentes', type: 'number', unit: 'und' },
  { key: 'construccion_alcantarillas', label: 'Construcciâ”œâ”‚n de alcantarillas', type: 'number', unit: 'und' },
  { key: 'limpieza_alcantarillas', label: 'Limpieza de alcantarillas', type: 'number', unit: 'und' },
  { key: 'limpieza_cauces', label: 'Limpieza de cauces y caâ”œâ–’adas', type: 'number', unit: 'ml' },
  { key: 'obras_drenaje', label: 'Obras de drenaje', type: 'number', unit: 'ml' },
  { key: 'construccion_terraplenes', label: 'Construcciâ”œâ”‚n de terraplenes', type: 'number', unit: 'mâ”¬â”‚' },
  { key: 'relleno_compactacion', label: 'Relleno y compactaciâ”œâ”‚n de material', type: 'number', unit: 'mâ”¬â”‚' },
  { key: 'conformacion_taludes', label: 'Conformaciâ”œâ”‚n de taludes', type: 'number', unit: 'mâ”¬â–“' }
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
  'Cibao Sur': ['La Vega', 'Monseâ”œâ–’or Nouel', 'Sâ”œÃ­nchez Ramâ”œÂ¡rez'],
  'Cibao Nordeste': ['Duarte', 'Marâ”œÂ¡a Trinidad Sâ”œÃ­nchez', 'Samanâ”œÃ­', 'Hermanas Mirabal'],
  'Cibao Noroeste': ['Valverde', 'Monte Cristi', 'Dajabâ”œâ”‚n', 'Santiago Rodrâ”œÂ¡guez'],
  'Santiago': ['Santiago'],
  'Valdesia': ['San Cristâ”œâ”‚bal', 'Peravia', 'San Josâ”œÂ® de Ocoa'],
  'Enriquillo': ['Barahona', 'Pedernales', 'Independencia', 'Bahoruco'],
  'El Valle': ['San Juan', 'Elâ”œÂ¡as Piâ”œâ–’a', 'Azua'],
  'Yuma': ['La Altagracia', 'La Romana', 'El Seibo'],
  'Higuamo': ['San Pedro de Macorâ”œÂ¡s', 'Hato Mayor', 'Monte Plata']
};

// Municipios por Provincia de Repâ”œâ•‘blica Dominicana
const municipiosPorProvincia: Record<string, string[]> = {
  // Cibao Norte
  'Puerto Plata': ['Puerto Plata', 'Altamira', 'Guananico', 'Imbert', 'Los Hidalgos', 'Luperâ”œâ”‚n', 'Râ”œÂ¡o San Juan', 'Villa Isabela', 'Villa Montellano'],
  'Espaillat': ['Moca', 'Cayetano Germosâ”œÂ®n', 'Gaspar Hernâ”œÃ­ndez', 'Jamao al Norte'],
  'Santiago': ['Santiago', 'Bisonâ”œâ”‚ (Navarrete)', 'Jâ”œÃ­nico', 'Licey al Medio', 'Puâ”œâ–’al', 'Sabana Iglesia', 'San Josâ”œÂ® de las Matas', 'Tamboril', 'Villa Gonzâ”œÃ­lez'],
  
  // Cibao Sur  
  'La Vega': ['La Vega', 'Constanza', 'Jarabacoa', 'Jima Abajo'],
  'Monseâ”œâ–’or Nouel': ['Bonao', 'Maimâ”œâ”‚n', 'Piedra Blanca'],
  'Sâ”œÃ­nchez Ramâ”œÂ¡rez': ['Cotuâ”œÂ¡', 'Cevicos', 'Fantino', 'La Mata'],
  
  // Cibao Nordeste
  'Duarte': ['San Francisco de Macorâ”œÂ¡s', 'Arenoso', 'Castillo', 'Eugenio Marâ”œÂ¡a de Hostos', 'Las Guâ”œÃ­ranas', 'Pimentel', 'Villa Riva'],
  'Marâ”œÂ¡a Trinidad Sâ”œÃ­nchez': ['Nagua', 'Cabrera', 'El Factor', 'Râ”œÂ¡o San Juan'],
  'Samanâ”œÃ­': ['Samanâ”œÃ­', 'Las Terrenas', 'Sâ”œÃ­nchez'],
  
  // Cibao Noroeste
  'Monte Cristi': ['Monte Cristi', 'Castaâ”œâ–’uelas', 'Guayubâ”œÂ¡n', 'Las Matas de Santa Cruz', 'Pepillo Salcedo (Manzanillo)', 'Villa Vâ”œÃ­squez'],
  'Dajabâ”œâ”‚n': ['Dajabâ”œâ”‚n', 'El Pino', 'Loma de Cabrera', 'Partido', 'Restauraciâ”œâ”‚n'],
  'Santiago Rodrâ”œÂ¡guez': ['San Ignacio de Sabaneta', 'Los Almâ”œÃ­cigos', 'Monciâ”œâ”‚n'],
  'Valverde': ['Mao', 'Esperanza', 'Laguna Salada'],
  
  // Cibao Centro
  'Hermanas Mirabal': ['Salcedo', 'Tenares', 'Villa Tapia'],
  
  // Valdesia
  'San Cristâ”œâ”‚bal': ['San Cristâ”œâ”‚bal', 'Bajos de Haina', 'Cambita Garabitos', 'Los Cacaos', 'Sabana Grande de Palenque', 'San Gregorio de Nigua', 'Villa Altagracia', 'Yaguate'],
  'Peravia': ['Banâ”œÂ¡', 'Nizao', 'Sabana Buey'],
  'San Josâ”œÂ® de Ocoa': ['San Josâ”œÂ® de Ocoa', 'Rancho Arriba', 'Sabana Larga'],
  
  // Enriquillo
  'Barahona': ['Barahona', 'Cabral', 'El Peâ”œâ–’â”œâ”‚n', 'Enriquillo', 'Fundaciâ”œâ”‚n', 'Jaquimeyes', 'La Ciâ”œÂ®naga', 'Las Salinas', 'Paraâ”œÂ¡so', 'Polo', 'Vicente Noble'],
  'Pedernales': ['Pedernales', 'Oviedo'],
  'Independencia': ['Jimanâ”œÂ¡', 'Cristâ”œâ”‚bal', 'Duvergâ”œÂ®', 'La Descubierta', 'Mella', 'Postrer Râ”œÂ¡o'],
  'Bahoruco': ['Neiba', 'Galvâ”œÃ­n', 'Los Râ”œÂ¡os', 'Tamayo', 'Villa Jaragua'],
  
  // El Valle
  'Azua': ['Azua de Compostela', 'Estebanâ”œÂ¡a', 'Guayabal', 'Las Charcas', 'Las Yayas de Viajama', 'Padre Las Casas', 'Peralta', 'Pueblo Viejo', 'Sabana de la Mar', 'Tâ”œÃ­bara Arriba'],
  'San Juan': ['San Juan de la Maguana', 'Bohechâ”œÂ¡o', 'El Cercado', 'Juan de Herrera', 'Las Matas de Farfâ”œÃ­n', 'Vallejuelo'],
  'Elâ”œÂ¡as Piâ”œâ–’a': ['Comendador', 'Bâ”œÃ­nica', 'El Llano', 'Hondo Valle', 'Juan Santiago', 'Pedro Santana'],
  
  // Higuamo
  'San Pedro de Macorâ”œÂ¡s': ['San Pedro de Macorâ”œÂ¡s', 'Consuelo', 'Guayacanes', 'Quisqueya', 'Ramâ”œâ”‚n Santana'],
  'Hato Mayor': ['Hato Mayor del Rey', 'El Valle', 'Sabana de la Mar'],
  'El Seibo': ['El Seibo', 'Miches'],
  
  // Ozama
  'Distrito Nacional': ['Distrito Nacional'],
  'Santo Domingo': ['Santo Domingo Este', 'Santo Domingo Norte', 'Santo Domingo Oeste', 'Boca Chica', 'Los Alcarrizos', 'Pedro Brand', 'San Antonio de Guerra'],
  
  // Yuma
  'La Altagracia': ['Higâ”œâ•ey', 'San Rafael del Yuma'],
  'La Romana': ['La Romana', 'Guaymate', 'Villa Hermosa'],
  
  // Valle
  'Monte Plata': ['Monte Plata', 'Bayaguana', 'Peralvillo', 'Sabana Grande de Boyâ”œÃ­', 'Yamasâ”œÃ­']
};

const sectoresPorProvincia: Record<string, string[]> = {
  // Cibao Norte
  'Puerto Plata': ['Centro Urbano', 'Costa Dorada', 'Malecon', 'Playa Dorada', 'Cofresâ”œÂ¡', 'La Uniâ”œâ”‚n', 'Las Flores', 'Villa Montellano', 'Los Reyes', 'San Marcos'],
  'Espaillat': ['Centro', 'El Carmen', 'Las Flores', 'La Javilla', 'San Antonio', 'Villa Olga', 'Los Cocos', 'Jamao', 'Râ”œÂ¡o Verde'],
  'Santiago': ['Centro Histâ”œâ”‚rico', 'Los Jardines', 'Bella Vista', 'Cienfuegos', 'La Otra Banda', 'Pueblo Nuevo', 'Villa Olga', 'Los Salados', 'Tamboril Centro', 'Sabana Iglesia'],

  // Cibao Sur
  'La Vega': ['Centro', 'Rincâ”œâ”‚n', 'Buenos Aires', 'Las Flores', 'Constanza Centro', 'Jarabacoa Centro', 'El Limâ”œâ”‚n', 'La Sabina'],
  'Monseâ”œâ–’or Nouel': ['Centro de Bonao', 'Villa Sonadora', 'Pueblo Nuevo', 'Los Maestros', 'Maimâ”œâ”‚n Centro', 'Piedra Blanca Centro'],
  'Sâ”œÃ­nchez Ramâ”œÂ¡rez': ['Cotuâ”œÂ¡ Centro', 'Villa La Mata', 'Fantino Centro', 'Cevicos Centro', 'Los Botados', 'Villa Sonadora'],

  // Cibao Nordeste  
  'Duarte': ['Centro de San Francisco', 'Villa Riva', 'Castillo', 'Pimentel', 'Las Guâ”œÃ­ranas', 'Arenoso Centro', 'Hostos'],
  'Marâ”œÂ¡a Trinidad Sâ”œÃ­nchez': ['Nagua Centro', 'Cabrera Centro', 'Râ”œÂ¡o San Juan Centro', 'El Factor', 'Los Cacaos', 'Villa Clara'],
  'Samanâ”œÃ­': ['Santa Bâ”œÃ­rbara Centro', 'Las Terrenas Centro', 'Sâ”œÃ­nchez Centro', 'Las Galeras', 'El Limâ”œâ”‚n'],
  'Hermanas Mirabal': ['Salcedo Centro', 'Tenares Centro', 'Villa Tapia Centro', 'La Joya', 'Villa Hermosa'],

  // Cibao Noroeste
  'Valverde': ['Mao Centro', 'Esperanza Centro', 'Laguna Salada Centro', 'Guayacanes', 'Villa Elisa'],  
  'Monte Cristi': ['Monte Cristi Centro', 'Guayubâ”œÂ¡n Centro', 'Castaâ”œâ–’uelas Centro', 'Las Matas Centro', 'Villa Vâ”œÃ­squez Centro'],
  'Dajabâ”œâ”‚n': ['Dajabâ”œâ”‚n Centro', 'Loma de Cabrera Centro', 'Restauraciâ”œâ”‚n Centro', 'El Pino Centro', 'Partido Centro'],
  'Santiago Rodrâ”œÂ¡guez': ['Sabaneta Centro', 'Monciâ”œâ”‚n Centro', 'Villa Los Almâ”œÃ­cigos Centro', 'Los Quemados', 'El Rubio'],

  // Valdesia
  'San Cristâ”œâ”‚bal': ['Centro Histâ”œâ”‚rico', 'Villa Altagracia Centro', 'Haina Centro', 'Los Cacaos Centro', 'Nigua Centro', 'Cambita Centro'],
  'Peravia': ['Banâ”œÂ¡ Centro', 'Matanzas Centro', 'Nizao Centro', 'Villa Sombrero', 'Catalina'],  
  'San Josâ”œÂ® de Ocoa': ['Centro', 'Rancho Arriba Centro', 'Sabana Larga Centro', 'El Pinar', 'Los Frâ”œÂ¡os'],

  // Enriquillo
  'Barahona': ['Barahona Centro', 'Cabral Centro', 'Enriquillo Centro', 'Paraâ”œÂ¡so Centro', 'Las Salinas Centro', 'Vicente Noble Centro'],
  'Pedernales': ['Pedernales Centro', 'Oviedo Centro', 'Cabo Rojo', 'Manuel Goya'],
  'Independencia': ['Jimanâ”œÂ¡ Centro', 'Duvergâ”œÂ® Centro', 'La Descubierta Centro', 'Cristâ”œâ”‚bal Centro', 'Mella Centro'],
  'Bahoruco': ['Neiba Centro', 'Galvâ”œÃ­n Centro', 'Tamayo Centro', 'Los Râ”œÂ¡os Centro', 'Villa Jaragua Centro'],

  // El Valle  
  'Azua': ['Azua Centro', 'Las Charcas Centro', 'Padre Las Casas Centro', 'Peralta Centro', 'Pueblo Viejo Centro'],
  'San Juan': ['San Juan Centro', 'Las Matas de Farfâ”œÃ­n Centro', 'Bohechâ”œÂ¡o Centro', 'El Cercado Centro', 'Juan de Herrera Centro'],
  'Elâ”œÂ¡as Piâ”œâ–’a': ['Comendador Centro', 'Bâ”œÃ­nica Centro', 'Hondo Valle Centro', 'Pedro Santana Centro', 'El Llano Centro'],

  // Higuamo
  'San Pedro de Macorâ”œÂ¡s': ['Centro Histâ”œâ”‚rico', 'Consuelo Centro', 'Los Llanos Centro', 'Quisqueya Centro', 'Ramâ”œâ”‚n Santana Centro'],
  'Hato Mayor': ['Hato Mayor Centro', 'Sabana de la Mar Centro', 'El Valle Centro', 'Yerba Buena', 'Los Hatos'],
  'Monte Plata': ['Monte Plata Centro', 'Bayaguana Centro', 'Sabana Grande Centro', 'Yamasâ”œÃ­ Centro', 'Peralvillo Centro'],

  // Yuma
  'La Altagracia': ['Higâ”œâ•ey Centro', 'Punta Cana', 'Bâ”œÃ­varo', 'San Rafael del Yuma Centro', 'Miches', 'El Seibo Centro'],
  'La Romana': ['La Romana Centro', 'Casa de Campo', 'Guaymate Centro', 'Villa Hermosa Centro', 'Caleta'],
  'El Seibo': ['El Seibo Centro', 'Miches Centro', 'Pedro Sâ”œÃ­nchez', 'Santa Lucâ”œÂ¡a'],

  // Ozama  
  'Distrito Nacional': ['Zona Colonial', 'Gazcue', 'Ciudad Nueva', 'San Carlos', 'Villa Juana', 'Cristo Rey', 'La Esperilla'],
  'Santo Domingo': ['Los Alcarrizos Centro', 'Pedro Brand Centro', 'San Antonio Centro', 'Boca Chica Centro', 'Pantoja', 'Villa Mella']
};

// Distritos municipales organizados por municipio
const distritosPorMunicipio: Record<string, string[]> = {
  // REGIâ”œÃ´N OZAMA O METROPOLITANA
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
  'Sabana Grande de Boyâ”œÃ­': ['Gonzalo'],
  'Yamasâ”œÃ­': [],
  
  // REGIâ”œÃ´N CIBAO NORTE
  // Puerto Plata
  'Puerto Plata': ['Yâ”œÃ­sica Arriba'],
  'Altamira': ['Râ”œÂ¡o Grande'],
  'Guananico': [],
  'Imbert': [],
  'Los Hidalgos': [],
  'Luperâ”œâ”‚n': ['La Isabela', 'Belloso'],
  'Sosâ”œâ•‘a': ['Sabaneta de Yâ”œÃ­sica'],
  'Villa Isabela': [],
  'Villa Montellano': [],
  
  // Espaillat
  'Moca': ['Josâ”œÂ® Contreras', 'San Vâ”œÂ¡ctor', 'Juan Lâ”œâ”‚pez'],
  'Cayetano Germosâ”œÂ®n': [],
  'Gaspar Hernâ”œÃ­ndez': ['Veragua'],
  'Jamao al Norte': [],
  
  // REGIâ”œÃ´N SANTIAGO
  // Santiago
  'Santiago de los Caballeros': ['Pedro Garcâ”œÂ¡a', 'El Limâ”œâ”‚n'],
  'Santiago': ['Pedro Garcâ”œÂ¡a', 'El Limâ”œâ”‚n'],
  'Baitoa': [],
  'Bisonâ”œâ”‚': [],
  'Bisonâ”œâ”‚ (Navarrete)': [],
  'Jâ”œÃ­nico': ['El Caimito'],
  'Licey al Medio': ['Las Palomas'],
  'Puâ”œâ–’al': ['Guayabal'],
  'Sabana Iglesia': [],
  'San Josâ”œÂ® de las Matas': ['El Rubio', 'La Cuesta'],
  'Tamboril': ['Canca la Reyna'],
  'Villa Gonzâ”œÃ­lez': ['Palmar Arriba'],
  
  // REGIâ”œÃ´N CIBAO SUR
  // La Vega
  'La Vega': ['Râ”œÂ¡o Verde Arriba', 'El Ranchito'],
  'Constanza': ['Tireo', 'La Sabina'],
  'Jarabacoa': ['Manabao', 'Buena Vista'],
  'Jima Abajo': [],
  
  // Monseâ”œâ–’or Nouel
  'Bonao': ['Sabana del Puerto', 'Jayaco'],
  'Maimâ”œâ”‚n': [],
  'Piedra Blanca': [],
  
  // Sâ”œÃ­nchez Ramâ”œÂ¡rez
  'Cotuâ”œÂ¡': [],
  'Cevicos': ['La Cueva'],
  'Fantino': [],
  'La Mata': [],
  
  // REGIâ”œÃ´N CIBAO NORDESTE
  // Duarte
  'San Francisco de Macorâ”œÂ¡s': ['La Peâ”œâ–’a', 'Cenovâ”œÂ¡'],
  'Arenoso': ['Las Coles', 'El Aguacate'],
  'Castillo': [],
  'Eugenio Marâ”œÂ¡a de Hostos': ['Sabana Grande'],
  'Las Guâ”œÃ­ranas': [],
  'Pimentel': [],
  'Villa Riva': ['Agua Santa del Yuna'],
  
  // Marâ”œÂ¡a Trinidad Sâ”œÃ­nchez
  'Nagua': ['Las Gordas', 'San Josâ”œÂ® de Matanzas'],
  'Cabrera': ['Arroyo Salado'],
  'El Factor': ['El Pozo'],
  'Râ”œÂ¡o San Juan': [],
  
  // Samanâ”œÃ­
  'Samanâ”œÃ­': ['El Limâ”œâ”‚n', 'Arroyo Barril', 'Las Galeras'],
  'Las Terrenas': [],
  'Sâ”œÃ­nchez': [],
  
  // Hermanas Mirabal
  'Salcedo': ['Jamao Afuera', 'Blanco'],
  'Tenares': [],
  'Villa Tapia': [],
  
  // REGIâ”œÃ´N CIBAO NOROESTE
  // Valverde
  'Mao': ['Guatapanal', 'Jaibâ”œâ”‚n', 'Amina'],
  'Esperanza': ['Maizal', 'Jicomâ”œÂ®'],
  'Laguna Salada': ['Jaibâ”œâ”‚n'],
  
  // Monte Cristi
  'Monte Cristi': ['Villa Elisa'],
  'Castaâ”œâ–’uelas': ['Palo Verde'],
  'Guayubâ”œÂ¡n': ['Hatillo Palma', 'Cana Chapetâ”œâ”‚n'],
  'Las Matas de Santa Cruz': [],
  'Pepillo Salcedo': [],
  'Pepillo Salcedo (Manzanillo)': [],
  'Villa Vâ”œÃ­squez': [],
  
  // Dajabâ”œâ”‚n
  'Dajabâ”œâ”‚n': [],
  'El Pino': [],
  'Loma de Cabrera': ['Capotillo'],
  'Partido': [],
  'Restauraciâ”œâ”‚n': [],
  
  // Santiago Rodrâ”œÂ¡guez
  'Sabaneta': [],
  'San Ignacio de Sabaneta': [],
  'Monciâ”œâ”‚n': [],
  'Villa Los Almâ”œÃ­cigos': [],
  'Los Almâ”œÃ­cigos': [],
  
  // REGIâ”œÃ´N VALDESIA
  // San Cristâ”œâ”‚bal
  'San Cristâ”œâ”‚bal': [],
  'Bajos de Haina': ['El Carril'],
  'Cambita Garabitos': ['Medina'],
  'Los Cacaos': [],
  'Sabana Grande de Palenque': [],
  'San Gregorio de Nigua': [],
  'Villa Altagracia': ['San Josâ”œÂ® del Puerto', 'La Guinea'],
  'Yaguate': ['Doâ”œâ–’a Ana'],
  
  // Peravia
  'Banâ”œÂ¡': ['El Caâ”œâ–’afâ”œÂ¡stol', 'Villa Fundaciâ”œâ”‚n', 'Paya', 'Villa Sombrero', 'El Limonal', 'Los Almâ”œÃ­cigos'],
  'Nizao': ['Pizarrete'],
  'Matanzas': ['Santana'],
  'Sabana Buey': [],
  
  // San Josâ”œÂ® de Ocoa
  'San Josâ”œÂ® de Ocoa': [],
  'Rancho Arriba': [],
  'Sabana Larga': [],
  
  // REGIâ”œÃ´N ENRIQUILLO
  // Barahona
  'Barahona': [],
  'Cabral': [],
  'El Peâ”œâ–’â”œâ”‚n': [],
  'Enriquillo': ['Arroyo Dulce'],
  'Fundaciâ”œâ”‚n': ['Pescaderâ”œÂ¡a'],
  'Jaquimeyes': ['Palo Alto'],
  'La Ciâ”œÂ®naga': [],
  'Las Salinas': [],
  'Paraâ”œÂ¡so': ['Los Patos', 'Canoa'],
  'Polo': [],
  'Vicente Noble': [],
  
  // Pedernales
  'Pedernales': ['Josâ”œÂ® Francisco Peâ”œâ–’a Gâ”œâ”‚mez'],
  'Oviedo': ['Juancho'],
  
  // Independencia
  'Jimanâ”œÂ¡': ['El Limâ”œâ”‚n'],
  'Cristâ”œâ”‚bal': ['Batey 8'],
  'Duvergâ”œÂ®': [],
  'La Descubierta': ['Boca de Cachâ”œâ”‚n'],
  'Mella': ['La Colonia'],
  'Postrer Râ”œÂ¡o': ['Guayabal'],
  
  // Bahoruco
  'Neiba': [],
  'Galvâ”œÃ­n': ['El Palmar'],
  'Los Râ”œÂ¡os': ['Las Clavellinas'],
  'Tamayo': ['Cabral', 'Uvilla'],
  'Villa Jaragua': [],
  
  // REGIâ”œÃ´N EL VALLE
  // San Juan
  'San Juan': ['El Rosario', 'Hato del Padre', 'La Jagua', 'Las Maguanas-Hato Nuevo'],
  'San Juan de la Maguana': ['El Rosario', 'Hato del Padre', 'La Jagua', 'Las Maguanas-Hato Nuevo'],
  'Bohechâ”œÂ¡o': ['Arroyo Cano', 'Yaque'],
  'El Cercado': ['Batista'],
  'Juan de Herrera': ['Jâ”œÂ¡nova'],
  'Las Matas de Farfâ”œÃ­n': ['Matayaya', 'Carrera de Yegua'],
  'Vallejuelo': ['Jorjillo'],
  
  // Elâ”œÂ¡as Piâ”œâ–’a
  'Comendador': ['Guayajayuco', 'Sabana Cruz', 'Sabana Larga', 'Guanito'],
  'Bâ”œÃ­nica': ['Sabana Higâ”œâ•ero', 'Sabana Cruz'],
  'El Llano': ['Guayabo'],
  'Hondo Valle': ['Rancho de la Guardia'],
  'Juan Santiago': ['Las Caobas'],
  'Pedro Santana': ['Râ”œÂ¡o Limpio'],
  
  // Azua
  'Azua': ['Barro Arriba', 'Las Barias-La Estancia', 'Los Jovillos'],
  'Azua de Compostela': ['Barro Arriba', 'Las Barias-La Estancia', 'Los Jovillos'],
  'Estebanâ”œÂ¡a': [],
  'Guayabal': [],
  'Las Charcas': [],
  'Las Yayas de Viajama': ['Villarpando'],
  'Padre Las Casas': ['Las Lagunas', 'Palmar de Ocoa'],
  'Peralta': [],
  'Pueblo Viejo': [],
  'Sabana Yegua': ['Proyeto 4'],
  'Sabana de la Mar': ['Elupina Cordero'],
  'Tâ”œÃ­bara Arriba': ['Amiama Gâ”œâ”‚mez', 'Tâ”œÃ­bara Abajo', 'Los Toros'],
  
  // REGIâ”œÃ´N HIGUAMO
  // San Pedro de Macorâ”œÂ¡s
  'San Pedro de Macorâ”œÂ¡s': [],
  'Consuelo': [],
  'Guayacanes': ['El Puerto'],
  'Los Llanos': [],
  'Quisqueya': [],
  'Ramâ”œâ”‚n Santana': [],
  
  // Hato Mayor
  'Hato Mayor': ['Mata Palacio', 'Guayabo Dulce'],
  'Hato Mayor del Rey': ['Mata Palacio', 'Guayabo Dulce'],
  'El Valle': [],
  'Yerba Buena': [],
  
  // REGIâ”œÃ´N YUMA
  // La Altagracia
  'Higâ”œâ•ey': ['La Otra Banda'],
  'San Rafael del Yuma': ['Boca de Yuma', 'Bayahibe'],
  
  // La Romana
  'La Romana': ['Caleta'],
  'Guaymate': [],
  'Villa Hermosa': ['Cumayasa'],
  
  // El Seibo
  'El Seibo': ['Pedro Sâ”œÃ­nchez'],
  'Miches': ['El Cedro', 'La Gina']
};

// Mantener compatibilidad: distritosPorProvincia ahora devuelve todos los municipios de la provincia
const distritosPorProvincia: Record<string, string[]> = municipiosPorProvincia;

const opcionesIntervencion = [
  'Rehabilitaciâ”œâ”‚n Camino Vecinal',
  'Rehabilitaciâ”œâ”‚n acceso a mina',
  'Restauraciâ”œâ”‚n Calles comunidad',
  'Confecciâ”œâ”‚n de cabezal de puente',
  'Restauraciâ”œâ”‚n de vâ”œÂ¡as de Comunicaciâ”œâ”‚n',
  'Operativo de Emergencia',
  'Limpieza de alcantarillas',
  'Confecciâ”œâ”‚n de puente',
  'Limpieza de Caâ”œâ–’ada',
  'Colocaciâ”œâ”‚n de alcantarillas',
  'Canalizaciâ”œâ”‚n',
  'Desalojo',
  'Habilitaciâ”œâ”‚n Zona protegida o Espacio pâ”œâ•‘blico'
];

const canalOptions = ['Râ”œÂ¡o', 'Arroyo', 'Caâ”œâ–’ada'];

const plantillasPorIntervencion: Record<string, Field[]> = {
  'Rehabilitaciâ”œâ”‚n Camino Vecinal': [
    { key: 'nombre_camino', label: 'Nombre del camino vecinal', type: 'text', unit: '' },
    { key: 'punto_inicial', label: 'Punto inicial de la intervenciâ”œâ”‚n', type: 'text', unit: 'Coordenadas decimales' },
    { key: 'punto_alcanzado', label: 'Punto alcanzado en la intervenciâ”œâ”‚n', type: 'text', unit: 'Coordenadas decimales' },
    { key: 'longitud_intervencion', label: 'Longitud de intervenciâ”œâ”‚n', type: 'number', unit: 'km' },
    { key: 'limpieza_superficie', label: 'Limpieza de superficie de rodadura (Incluye Cunetas)', type: 'number', unit: 'mâ”¬â–“' },
    { key: 'perfilado_superficie', label: 'Perfilado de superficie', type: 'number', unit: 'mâ”¬â–“' },
    { key: 'extraccion_material', label: 'Extracciâ”œâ”‚n de material inservible', type: 'number', unit: 'mâ”¬â”‚' },
    { key: 'bote_material', label: 'Bote de material inservible', type: 'number', unit: 'mâ”¬â”‚' },
    { key: 'conformacion_plataforma', label: 'Conformaciâ”œâ”‚n de plataforma', type: 'number', unit: 'mâ”¬â–“' },
    { key: 'zafra_material', label: 'Zafra de material', type: 'number', unit: 'mâ”¬â”‚' },
    { key: 'motonivelacion_superficie', label: 'Motonivelaciâ”œâ”‚n de superficie', type: 'number', unit: 'mâ”¬â–“' },
    { key: 'suministro_extension_material', label: 'Suministro y extensiâ”œâ”‚n de material', type: 'number', unit: 'mâ”¬â”‚' },
    { key: 'suministro_colocacion_grava', label: 'Suministro y colocaciâ”œâ”‚n de grava', type: 'number', unit: 'mâ”¬â”‚' },
    { key: 'nivelacion_compactacion_grava', label: 'Nivelaciâ”œâ”‚n y compactaciâ”œâ”‚n de grava', type: 'number', unit: 'mâ”¬â–“' },
    { key: 'reparacion_alcantarillas', label: 'Reparaciâ”œâ”‚n de alcantarillas existentes', type: 'number', unit: 'und' },
    { key: 'construccion_alcantarillas', label: 'Construcciâ”œâ”‚n de alcantarillas', type: 'number', unit: 'und' },
    { key: 'limpieza_alcantarillas', label: 'Limpieza de alcantarillas', type: 'number', unit: 'und' },
    { key: 'limpieza_cauces', label: 'Limpieza de cauces y caâ”œâ–’adas', type: 'number', unit: 'ml' },
    { key: 'obras_drenaje', label: 'Obras de drenaje', type: 'number', unit: 'ml' },
    { key: 'construccion_terraplenes', label: 'Construcciâ”œâ”‚n de terraplenes', type: 'number', unit: 'mâ”¬â”‚' },
    { key: 'relleno_compactacion', label: 'Relleno y compactaciâ”œâ”‚n de material', type: 'number', unit: 'mâ”¬â”‚' },
    { key: 'conformacion_taludes', label: 'Conformaciâ”œâ”‚n de taludes', type: 'number', unit: 'mâ”¬â–“' }
  ],
  'Rehabilitaciâ”œâ”‚n acceso a mina': [{ key: 'nombre_mina', label: 'Nombre mina', type: 'text', unit: '' }, ...plantillaDefault],
  'Restauraciâ”œâ”‚n Calles comunidad': [...plantillaDefault],
  'Confecciâ”œâ”‚n de cabezal de puente': [...plantillaDefault],
  'Restauraciâ”œâ”‚n de vâ”œÂ¡as de Comunicaciâ”œâ”‚n': [...plantillaDefault],
  'Operativo de Emergencia': [...plantillaDefault],
  'Limpieza de alcantarillas': [...plantillaDefault],
  'Confecciâ”œâ”‚n de puente': [{ key: 'tipo_puente', label: 'Seleccionar tipo de puente (Alcantarilla / Viga)', type: 'text', unit: '' }, ...plantillaDefault],
  'Limpieza de Caâ”œâ–’ada': [{ key: 'nombre_canada', label: 'Nombre caâ”œâ–’ada', type: 'text', unit: '' }, ...plantillaDefault],
  'Colocaciâ”œâ”‚n de alcantarillas': [...plantillaDefault],
  'Desalojo': [...plantillaDefault],
  'Habilitaciâ”œâ”‚n Zona protegida o Espacio pâ”œâ•‘blico': [...plantillaDefault],
  'Canalizaciâ”œâ”‚n:Râ”œÂ¡o': [...plantillaDefault],
  'Canalizaciâ”œâ”‚n:Arroyo': [...plantillaDefault],
  'Canalizaciâ”œâ”‚n:Caâ”œâ–’ada': [...plantillaDefault]
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
  const [chatUnreadCount, setChatUnreadCount] = useState(0);
  const [chatBadgeAnimate, setChatBadgeAnimate] = useState(false);
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
  
  // Estado para el menâ”œâ•‘ desplegable del usuario
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showMyReportsModal, setShowMyReportsModal] = useState(false);
  const [showCompleteProfileModal, setShowCompleteProfileModal] = useState(false);

  // Estado para el chat flotante (ChatList/ChatModal)
  const [showChatList, setShowChatList] = useState(false);
  const [activeChatUser, setActiveChatUser] = useState<string | null>(null);
  const ignoreChatOpenUntilRef = useRef(0);

  // Estados del nuevo Ã”Ã‡Â£Nivel de EstabilidadÃ”Ã‡Ã˜ con giroscopio
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
  const [idCardNumber, setIdCardNumber] = useState<string>(''); // Nuevo estado para câ”œÂ®dula
  const [showProfileIncompleteNotification, setShowProfileIncompleteNotification] = useState(false);
  const [isProfileComplete, setIsProfileComplete] = useState(false);

  // Sonido de notificaci\u00f3n de chat
  const { play: playChatSound } = useNotificationSound();
  const prevChatUnreadRef = useRef<number>(-1);

  // Funci\u00f3n para actualizar el contador de pendientes del usuario actual
  const updatePendingCount = async () => {
    try {
      // Obtener reportes con estado 'pendiente' de la colecciâ”œâ”‚n principal
      const allPending = await firebaseReportStorage.getReportsByEstado('pendiente');
      
      // Filtrar solo los del usuario actual
      const userPending = allPending.filter(report => 
        report.usuarioId === user?.username || report.creadoPor === user?.username
      );
      
      setPendingCount(userPending.length);
      console.log(`Â­Æ’Ã´Ã¨ Reportes pendientes del usuario ${user?.username}:`, userPending.length);
    } catch (error) {
      console.error('Ã”Ã˜Ã® Error actualizando contador de pendientes:', error);
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

  // Funciâ”œâ”‚n para obtener lista detallada de reportes pendientes del usuario
  const getPendingReports = async () => {
    try {
      // Obtener reportes con estado 'pendiente' de la colecciâ”œâ”‚n principal
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
      console.error('Ã”Ã˜Ã® Error obteniendo reportes pendientes:', error);
      setPendingReportsList([]);
      return [];
    }
  };

  // Funciâ”œâ”‚n para continuar un reporte pendiente
  const handleContinuePendingReport = async (reportId: string) => {
    try {
      console.log('Â­Æ’Ã´Ã¯ Cargando reporte pendiente desde Firebase:', reportId);
      
      // Cargar desde la colecciâ”œâ”‚n principal de reportes (no desde pendingReports)
      const pendingReport = await firebaseReportStorage.getReport(reportId);
      
      console.log('Â­Æ’Ã´Âª Datos del reporte desde Firebase:', pendingReport);
      
      if (pendingReport && pendingReport.estado === 'pendiente') {
        // Convertir el reporte completo a formato de ediciâ”œâ”‚n
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
          // Restaurar datos multi-dâ”œÂ¡a si existen
          diasTrabajo: pendingReport.diasTrabajo || [],
          reportesPorDia: pendingReport.reportesPorDia || {},
          diaActual: pendingReport.diaActual || 0,
          _pendingReportId: pendingReport.id // ID del reporte pendiente para actualizar
        };
        
        console.log('Ã”Â£Ã  Datos a cargar en el formulario:', dataToLoad);
        
        setInterventionToEdit(dataToLoad);
        setShowPendingModal(false);
        setShowMyReportsModal(false);
        setShowReportForm(true);
        setActiveNav('crear');
      } else {
        console.error('Ã”Ã˜Ã® No se encontrâ”œâ”‚ el reporte pendiente en Firebase:', reportId);
        alert('No se pudo cargar el reporte pendiente');
      }
    } catch (error) {
      console.error('Ã”Ã˜Ã® Error al cargar el reporte pendiente desde Firebase:', error);
      alert('Error al cargar el reporte pendiente');
    }
  };

  // Funciâ”œâ”‚n para cancelar/eliminar un reporte pendiente
  const handleCancelPendingReport = async (reportId: string) => {
    try {
      // Eliminar de la colecciâ”œâ”‚n principal de Firebase
      await firebaseReportStorage.deleteReport(reportId);
      console.log('Ã”Â£Ã  Reporte pendiente eliminado de Firebase');
      await updatePendingCount();
      // Actualizar la vista del modal
      setShowPendingModal(false);
      setTimeout(() => setShowPendingModal(true), 100);
    } catch (error) {
      console.error('Ã”Ã˜Ã® Error eliminando reporte pendiente:', error);
      alert('Error al eliminar el reporte pendiente. Verifique su conexiâ”œâ”‚n a internet.');
    }
  };

  // Funciones para ReportView
  // reportIdOrNumber puede ser el ID del reporte o el nâ”œâ•‘mero de reporte (numeroReporte)
  const handleOpenReportView = (reportIdOrNumber: string) => {
    console.log('Â­Æ’Ã¶Ã¬ handleOpenReportView llamado con:', reportIdOrNumber);
    console.log('Â­Æ’Ã¶Ã¬ Estado actual:', { showReportView, selectedReportId });
    
    setSelectedReportId(reportIdOrNumber);
    setShowReportView(true);
    
    console.log('Â­Æ’Ã¶Ã¬ Despuâ”œÂ®s de actualizar estado:', { 
      showReportView: true, 
      selectedReportId: reportIdOrNumber 
    });
  };

  const handleCloseReportView = () => {
    setShowReportView(false);
    setSelectedReportId(null);
    setActiveNav('dashboard'); // Volver al botâ”œâ”‚n home
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
      // Restaurar datos multi-dâ”œÂ¡a si existen
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
    // Aquâ”œÂ¡ puedes implementar la lâ”œâ”‚gica de eliminaciâ”œâ”‚n
    alert('Funciâ”œâ”‚n de eliminaciâ”œâ”‚n no implementada aâ”œâ•‘n');
  };

  const handleExportReportFromView = (report: any) => {
    console.log('Exportando reporte desde ReportViewModern:', report);
    // Aquâ”œÂ¡ puedes implementar la lâ”œâ”‚gica de exportaciâ”œâ”‚n
    alert('Funciâ”œâ”‚n de exportaciâ”œâ”‚n no implementada aâ”œâ•‘n');
  };

  // Actualizar contador al cargar y cada vez que cambie localStorage
  useEffect(() => {
    updatePendingCount();
    
    // Escuchar cambios en localStorage
    const handleStorageChange = () => {
      updatePendingCount();
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Tambiâ”œÂ®n verificar periâ”œâ”‚dicamente por si hay cambios internos
    const interval = setInterval(updatePendingCount, 2000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Notificar a App.tsx cuando el usuario cambia (login / logout)
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('mopc_user_changed', { detail: user }));
  }, [user]);

  // Suscribir al contador de mensajes no leÃ­dos del chat
  useEffect(() => {
    if (!user) return;
    const userId = (user as any).id || user.username;
    if (!userId) return;

    const unsub = subscribeToUserChats(userId, (chats) => {
      const total = chats.reduce(
        (sum, c) => sum + (c.unreadCount?.[userId] || 0),
        0
      );
      // Reproducir sonido y activar animaciÃ³n solo si aumentaron los no leÃ­dos
      if (prevChatUnreadRef.current >= 0 && total > prevChatUnreadRef.current) {
        playChatSound();
        setChatBadgeAnimate(true);
        setTimeout(() => setChatBadgeAnimate(false), 1000);
      }
      prevChatUnreadRef.current = total;
      setChatUnreadCount(total);
    });

    return () => unsub();
  }, [user]);

  // Cargar reportes pendientes cuando se abre el modal
  useEffect(() => {
    if (showPendingModal) {
      console.log('Â­Æ’Ã´Ã‘ Modal de pendientes abierto, cargando reportes desde Firebase...');
      getPendingReports();
    }
  }, [showPendingModal]);

  // Cerrar menâ”œâ•‘ desplegable al hacer clic fuera
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

  // Verificar si el perfil del usuario estâ”œÃ­ completo
  useEffect(() => {
    const checkVerification = async () => {
      if (user) {
        // Verificar si el usuario requiere verificaciâ”œâ”‚n de perfil desde Firebase
        const firebaseUser = await firebaseUserStorage.getUserByUsername(user.username);
        
        console.log('Â­Æ’Ã¶Ã¬ Verificando usuario:', user.username);
        console.log('Â­Æ’Ã´Âª Usuario Firebase:', firebaseUser);
        console.log('Ã”Â£Ã  isVerified:', firebaseUser?.isVerified);
        
        // Si el usuario no existe en Firebase, no pedir verificaciâ”œâ”‚n (compatibilidad con localStorage)
        if (!firebaseUser) {
          console.log('Ã”Ã¤â•£Â´Â©Ã… Usuario solo en localStorage, sin verificaciâ”œâ”‚n requerida');
          setShowProfileIncompleteNotification(false);
          setIsProfileComplete(true);
          return;
        }
        
        // Si el usuario existe en Firebase pero no estâ”œÃ­ verificado
        const requiresVerification = !firebaseUser.isVerified;
        
        if (requiresVerification) {
          // Solo mostrar solicitud de verificaciâ”œâ”‚n si isVerified es false
          const profileData = localStorage.getItem(`profile_${user.username}`);
          if (profileData) {
            const profile = JSON.parse(profileData);
            setProfilePhoto(profile.profilePhoto || '');
            setFullName(profile.fullName || '');
            setBirthDate(profile.birthDate || '');
            setIdCardPhoto(profile.idCardPhoto || '');
            
            // Verificar si todos los campos estâ”œÃ­n completos
            const isComplete = profile.profilePhoto && profile.fullName && profile.birthDate && profile.idCardPhoto;
            setShowProfileIncompleteNotification(!isComplete);
            setIsProfileComplete(isComplete);
          } else {
            setShowProfileIncompleteNotification(true);
            setIsProfileComplete(false);
          }
        } else {
          // Usuario con isVerified = true no necesita verificaciâ”œâ”‚n de perfil
          console.log('Ã”Â£Ã  Usuario verificado, ocultando notificaciâ”œâ”‚n');
          setShowProfileIncompleteNotification(false);
          setIsProfileComplete(true);
        }
      }
    };
    
    checkVerification();
  }, [user]);

  // Iniciar tracking en vivo cuando el usuario inicie sesiâ”œâ”‚n
  useEffect(() => {
    if (user && user.username) {
      console.log('Â­Æ’Ã´Ã¬ Iniciando tracking en vivo para usuario:', user.username);
      
      const liveLocationService = LiveLocationService.getInstance();
      
      // Iniciar tracking en vivo
      liveLocationService.startLiveTracking(user.username)
        .then(() => {
          console.log('Ã”Â£Ã  Tracking en vivo iniciado exitosamente');
        })
        .catch((error) => {
          console.error('Ã”Ã˜Ã® Error iniciando tracking en vivo:', error);
        });

      // Limpiar tracking cuando el usuario cierre sesiâ”œâ”‚n
      return () => {
        console.log('Â­Æ’Ã´Ã¬ Deteniendo tracking en vivo para usuario:', user.username);
        liveLocationService.stopLiveTracking();
      };
    }
  }, [user]);

  // Aplicar tema segÃºn el rol del usuario e iniciar presencia web
  useEffect(() => {
    if (user && user.role) {
      // Aplicar tema del rol
      applyUserTheme(user.role);

      // Iniciar rastreo de presencia si el usuario estÃ¡ logueado
      if (user.username) {
        userPresenceService.startPresenceTracking(user.username);

        // Limpiar mensajes antiguos (>7 dÃ­as) en segundo plano
        chatService.cleanOldMessages().catch(() => {});
      }
    } else {
      // Si no hay rol definido, usar rol por defecto (Admin para compatibilidad)
      applyUserTheme(UserRole.ADMIN);

      // Detener rastreo de presencia si no hay usuario
      userPresenceService.stopPresenceTracking();
    }
  }, [user]);


  // Solicitar permisos GPS al cargar la aplicaciâ”œâ”‚n
  useEffect(() => {
    const requestGpsPermission = async () => {
      if ('geolocation' in navigator) {
        try {
          // Solicitar permiso y obtener posiciâ”œâ”‚n inicial
          navigator.geolocation.getCurrentPosition(
            (position) => {
              setGpsPosition({
                lat: position.coords.latitude,
                lon: position.coords.longitude
              });
              setIsGpsEnabled(true);
              console.log('GPS habilitado al cargar la aplicaciâ”œâ”‚n');
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

  // Manejar botâ”œâ”‚n de retroceso de Android
  useEffect(() => {
    let backButtonListener: any = null;

    const handleBackButton = () => {
      console.log('Â­Æ’Ã¶Ã– Botâ”œâ”‚n de retroceso presionado');

      // Si la câ”œÃ­mara estâ”œÃ­ abierta, cerrarla en lugar de salir de la app
      if ((window as any).cameraOpen) {
        console.log('Â­Æ’Ã¶Ã– Cerrando câ”œÃ­mara con botâ”œâ”‚n de retroceso');
        const cameraInterface = document.querySelector('[style*="z-index: 10000"]');
        if (cameraInterface) {
          cameraInterface.remove();
        }
        (window as any).cameraOpen = false;
        return;
      }

      if (showReportView) {
        console.log('Â­Æ’Ã¶Ã– Cerrando ReportViewModern');
        handleCloseReportView();
        return;
      }

      if (showMyReportsModal) {
        console.log('Â­Æ’Ã¶Ã– Cerrando Mis Reportes');
        setShowMyReportsModal(false);
        setActiveNav('dashboard');
        return;
      }

      if (showPendingModal) {
        console.log('Â­Æ’Ã¶Ã– Cerrando Reportes Pendientes');
        setShowPendingModal(false);
        setActiveNav('dashboard');
        return;
      }

      if (showCompleteProfileModal) {
        console.log('Â­Æ’Ã¶Ã– Cerrando modal completo de perfil');
        setShowCompleteProfileModal(false);
        return;
      }

      if (showReportForm) {
        console.log('Â­Æ’Ã¶Ã– Saliendo del formulario de reporte');
        if (window.confirm('â”¬â”Estâ”œÃ­ seguro que desea salir del formulario? Los datos no guardados se perderâ”œÃ­n.')) {
          setShowReportForm(false);
          setInterventionToEdit(null);
          handleCloseReportView();
          return;
        }
      }

      if (showStabilityModal) {
        console.log('Â­Æ’Ã¶Ã– Cerrando modal de estabilidad');
        setShowStabilityModal(false);
        return;
      }

      if (showHeavyVehiclesPage) {
        console.log('Â­Æ’Ã¶Ã– Cerrando vista de Vehâ”œÂ¡culos Pesados');
        handleBackToDashboard();
        return;
      }

      if (showChatPage) {
        console.log('ðŸ”™ Cerrando chat');
        setShowChatPage(false);
        setActiveNav('dashboard');
        return;
      }

      if (showReportsPage || showExportPage || showUsersPage || showGoogleMapView || showLeafletMapView || showHierarchy || showSettingsPage) {
        console.log('Â­Æ’Ã¶Ã– Volviendo al dashboard');
        handleBackToDashboard();
        return;
      }

      console.log('Â­Æ’Ã¶Ã– Ya estâ”œÃ­ en el dashboard - salir de la app');
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
  }, [showReportView, showMyReportsModal, showPendingModal, showCompleteProfileModal, showReportForm, showReportsPage, showExportPage, showUsersPage, showGoogleMapView, showLeafletMapView, showHeavyVehiclesPage, showHierarchy, showSettingsPage, showChatPage, showStabilityModal, handleBackToDashboard, handleCloseReportView, setInterventionToEdit]);

  // Giroscopio + Acelerâ”œâ”‚metro (modo iOS Level)
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
            setStabilityText('Permiso de acelerâ”œâ”‚metro denegado.');
            return;
          }
        } catch (error) {
          console.error('Error solicitando permiso de acelerâ”œâ”‚metro:', error);
          setStabilityText('No se pudo solicitar permiso de acelerâ”œâ”‚metro.');
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

        // Calculamos inclinaciâ”œâ”‚n () basado en vector gravedad.
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
      setLoginError('Por favor ingrese usuario y contraseâ”œâ–’a');
      return;
    }

    setIsLoading(true);
    setLoginError('');

    await new Promise(r => setTimeout(r, 1000));

    try {
      console.log('Â­Æ’Ã¶Ã‰ Intentando login con Firebase...');
      
      // Intentar login con Firebase
      const result = await firebaseUserStorage.loginWithUsername(loginUser, loginPass);
      
      if (result.success && result.user) {
        const validatedUser = result.user;
        
        // Verificar si la cuenta estâ”œÃ­ activa
        if (!validatedUser.isActive) {
          setLoginError('Ã”ÃœÃ¡Â´Â©Ã… Lo sentimos, su cuenta estâ”œÃ­ temporalmente desactivada. Comunâ”œÂ¡quese con su superior.');
          setIsLoading(false);
          return;
        }
        
        // Credenciales vâ”œÃ­lidas y cuenta activa - usuario autenticado
        const userRole: UserRole = validatedUser.role === 'Administrador' ? UserRole.ADMIN :
                                     validatedUser.role === 'Supervisor' ? UserRole.SUPERVISOR :
                                     UserRole.TECNICO;
        
        const newUser: User = {
          id: validatedUser.id,
          username: validatedUser.username,
          name: validatedUser.name,
          profilePhoto: validatedUser.avatar || '',
          role: userRole
        };
        
        localStorage.setItem('mopc_user', JSON.stringify(newUser));
        setUser(newUser);
        setLoginUser('');
        setLoginPass('');
        
        console.log(`Ã”Â£Ã  Usuario autenticado desde Firebase como: ${getRoleBadge(userRole)}`);
        setIsLoading(false);
        return;
      }
      
      // Si Firebase falla, intentar con localStorage como fallback
      console.log('Ã”ÃœÃ¡Â´Â©Ã… Firebase login fallâ”œâ”‚, intentando con localStorage...');
      const allUsers = userStorage.getAllUsers();
      console.log('Â­Æ’Ã´Ã¨ Usuarios en localStorage:', allUsers.length);
      
      const validatedUser = userStorage.validateCredentials(loginUser, loginPass);
      
      if (validatedUser) {
        if (!validatedUser.isActive) {
          setLoginError('Ã”ÃœÃ¡Â´Â©Ã… Lo sentimos, su cuenta estâ”œÃ­ temporalmente desactivada. Comunâ”œÂ¡quese con su superior.');
          setIsLoading(false);
          return;
        }
        
        const userRole: UserRole = validatedUser.role === 'Administrador' ? UserRole.ADMIN :
                                     validatedUser.role === 'Supervisor' ? UserRole.SUPERVISOR :
                                     UserRole.TECNICO;
        
        const newUser: User = {
          id: validatedUser.username,
          username: validatedUser.username,
          name: validatedUser.name,
          role: userRole
        };
        
        localStorage.setItem('mopc_user', JSON.stringify(newUser));
        setUser(newUser);
        setLoginUser('');
        setLoginPass('');
        
        console.log(`Ã”Â£Ã  Usuario autenticado desde localStorage como: ${getRoleBadge(userRole)}`);
        setIsLoading(false);
        return;
      }
      
      // Usuario no encontrado en ningâ”œâ•‘n lado
      setLoginError(result.error || `Ã”Ã˜Ã® Usuario "${loginUser}" no encontrado`);
      setIsLoading(false);
      
    } catch (err) {
      console.error('Ã”Ã˜Ã® Error en login:', err);
      setLoginError('Ã”ÃœÃ¡Â´Â©Ã… Error del sistema. Recargue la pâ”œÃ­gina e intente nuevamente.');
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
      setResetError('Por favor ingrese usuario y correo electrâ”œâ”‚nico.');
      return;
    }

    try {
      const candidate = await firebaseUserStorage.getUserByUsernameInsensitive(resetUsername.trim());

      if (!candidate) {
        setResetError('No se encontrâ”œâ”‚ usuario con ese nombre de usuario en Firebase. Verifique el usuario.');
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
        setResetError('No se encontrâ”œâ”‚ usuario con ese nombre de usuario en Firebase.');
        return;
      }

      if (!candidate.email) {
        setResetError('El usuario no tiene correo registrado en Firebase. Contacte al administrador.');
        return;
      }

      const localUser = userStorage.getUserByUsername(resetUsername.trim());
      const password = localUser?.password;

      if (!password) {
        setResetError('No se encontrâ”œâ”‚ la contraseâ”œâ–’a en el almacenamiento local. Si el usuario usa Firebase Auth, el administrador debe resetearla.');
        return;
      }

      const emailResult = await sendPasswordResetEmail({
        name: candidate.name || candidate.username,
        username: candidate.username,
        email: candidate.email,
        password,
        role: candidate.role || 'Tâ”œÂ®cnico'
      });

      if (!emailResult.success) {
        setResetError(emailResult.error || 'Error enviando correo de recuperaciâ”œâ”‚n');
        return;
      }

      setResetSuccess('Email enviado con â”œÂ®xito. Revise su bandeja de entrada.');
      startResendTimer();
    } catch (err: any) {
      console.error('Error enviando recuperaciâ”œâ”‚n de contraseâ”œâ–’a:', err);
      setResetError('Ocurriâ”œâ”‚ un error interno. Intente mâ”œÃ­s tarde.');
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

    // Validar que todos los campos estâ”œÂ®n completos
    if (!profilePhoto || !fullName || !idCardNumber || !idCardPhoto) {
      alert('Ã”ÃœÃ¡Â´Â©Ã… Por favor complete todos los campos requeridos');
      return;
    }

    // Verificar si el usuario estâ”œÃ­ en userStorage
    const storedUser = userStorage.getUserByUsername(user.username);
    
    if (storedUser && storedUser.cedula) {
      // Validar que el nâ”œâ•‘mero de câ”œÂ®dula coincida con el registrado
      const storedCedula = storedUser.cedula;
      
      // Normalizar los nâ”œâ•‘meros de câ”œÂ®dula (quitar guiones, espacios, puntos)
      const normalizedInput = idCardNumber.replace(/[-.\s]/g, '');
      const normalizedStored = storedCedula.replace(/[-.\s]/g, '');
      
      if (normalizedInput !== normalizedStored) {
        alert('Ã”Ã˜Ã® Error de verificaciâ”œâ”‚n');
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

    // Actualizar estados de verificaciâ”œâ”‚n de perfil
    setShowProfileIncompleteNotification(false);
    setIsProfileComplete(true);
    setShowCompleteProfileModal(false);
    alert('Ã”Â£Ã  Perfil completado exitosamente. Ahora puede acceder a todas las funcionalidades.');
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
  // la nueva propuesta de iconos circulares tipo app mâ”œâ”‚vil.
  const useIconButtons = true;
  // algunos iconos no estarâ”œÃ­n activos aâ”œâ•‘n (Buscar, Usuarios, Exportar).
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

  // Funciones para manejar la navegaciâ”œâ”‚n inferior
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
        // Cargar pâ”œÃ­gina completa de Mis Reportes
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

  // Funciâ”œâ”‚n para manejar la câ”œÃ­mara con geolocalizaciâ”œâ”‚n en vivo, flash y giro
  const handleOpenCamera = async () => {
    if (!isProfileComplete) {
      setShowCompleteProfileModal(true);
      return;
    }

    // Detectar modelo de dispositivo para configuraciâ”œâ”‚n especâ”œÂ¡fica
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
      // Default genâ”œÂ®rico
      else {
        return 'generic';
      }
    };

    const deviceModel = getDeviceModel();
    console.log('Â­Æ’Ã´â–’ Modelo detectado:', deviceModel);

    // Variable global para controlar si la câ”œÃ­mara estâ”œÃ­ abierta
    (window as any).cameraOpen = true;

    try {
      console.log('Â­Æ’Ã´Ã€ Iniciando câ”œÃ­mara con geolocalizaciâ”œâ”‚n en vivo...');

      // Limpiar guarda de foto previas para evitar duplicados indeseados
      try {
        localStorage.removeItem('mopc_photo_gallery');
      } catch (error) {
        console.warn('No se pudo limpiar gallery cache:', error);
      }
      
      // Mostrar interfaz de câ”œÃ­mara con controles
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
      
      // Header con geolocalizaciâ”œâ”‚n en vivo
      const header = document.createElement('div');
      header.style.cssText = `
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 12px;
        text-align: center;
        font-size: 14px;
      `;
      header.innerHTML = 'Â­Æ’Ã´Ã¬ Obteniendo ubicaciâ”œâ”‚n...<br/><small>Por favor espere</small>';
      
      // Estados
      let currentPosition: any = null;
      let currentAddress = 'Ubicaciâ”œâ”‚n desconocida';
      let flashMode = 'off'; // off, on, auto
      let cameraDirection = 'environment'; // environment (trasera) / user (frontal)
      let zoomLevel = 1; // 1x a 4x zoom
      let textSizeLevel = 1; // 1x a 3x tamaâ”œâ–’o de letra
      
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
      dateTimeInfo.textContent = `Â­Æ’Ã²Ã† ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
      
      const locationInfo = document.createElement('div');
      locationInfo.style.cssText = `
        font-size: 12px;
        color: white;
      `;
      locationInfo.textContent = 'Â­Æ’Ã´Ã¬ Obteniendo ubicaciâ”œâ”‚n...';
      
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
      flashButton.innerHTML = 'Ã”ÃœÃ­';
      
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
      captureButton.innerHTML = 'Â­Æ’Ã´Ã€';
      
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
      flipButton.title = 'Cambiar câ”œÃ­mara frontal/trasera';
      flipButton.innerHTML = 'Â­Æ’Ã¶Ã¤';
      flipButton.style.cssText = `
        background: rgba(255, 255, 255, 0.2);
        border: 2px solid white;
        color: white;
        padding: 12px;
        border-radius: 50%;
        font-size: 20px;
        cursor: pointer;
      `;
      flipButton.innerHTML = 'Â­Æ’Ã¶Ã¤';

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

      // Iniciar geolocalizaciâ”œâ”‚n en vivo
      const watchPositionId = await Geolocation.watchPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000
      }, async (position) => {
        currentPosition = position;
        
        // Actualizar overlay de georeferencia dentro del video
        try {
          if (!position || !position.coords) {
            locationInfo.innerHTML = 'Â­Æ’Ã´Ã¬ Obteniendo ubicaciâ”œâ”‚n...';
            coordinatesInfo.innerHTML = 'Lat: --.------, Lon: --.------';
            return;
          }
          
          // Actualizar coordenadas
          const currentTime = new Date();
          dateTimeInfo.textContent = `Â­Æ’Ã²Ã† ${currentTime.toLocaleDateString()} ${currentTime.toLocaleTimeString()}`;
          coordinatesInfo.innerHTML = `Lat: ${position.coords.latitude.toFixed(6)}, Lon: ${position.coords.longitude.toFixed(6)}`;
          
          // Obtener direcciâ”œâ”‚n con OpenStreetMap Nominatim
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
              locationInfo.innerHTML = `Â­Æ’Ã´Ã¬ ${currentAddress}`;
            } else {
              locationInfo.innerHTML = `Â­Æ’Ã´Ã¬ Ubicaciâ”œâ”‚n desconocida`;
            }
          } else {
            locationInfo.innerHTML = `Â­Æ’Ã´Ã¬ Lat: ${position.coords.latitude.toFixed(6)}, Lon: ${position.coords.longitude.toFixed(6)}`;
          }
        } catch (error) {
          const errorTime = new Date();
          dateTimeInfo.textContent = `Â­Æ’Ã²Ã† ${errorTime.toLocaleDateString()} ${errorTime.toLocaleTimeString()}`;
          if (position && position.coords) {
            locationInfo.innerHTML = `Â­Æ’Ã´Ã¬ Lat: ${position.coords.latitude.toFixed(6)}, Lon: ${position.coords.longitude.toFixed(6)}`;
          } else {
            locationInfo.innerHTML = 'Â­Æ’Ã´Ã¬ Error obteniendo ubicaciâ”œâ”‚n';
          }
        }
      });
      
      // Iniciar stream de video
      try {
        const constraints: any = {
          video: {
            facingMode: 'environment', // Forzar câ”œÃ­mara trasera
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          },
          audio: false
        };
        
        // Configuraciâ”œâ”‚n especâ”œÂ¡fica segâ”œâ•‘n modelo
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
        
        // Agregar torch solo si estâ”œÃ­ soportado
        if (flashMode === 'on') {
          constraints.video.torch = true;
        }
        
        console.log('Â­Æ’Ã„Ã‘ Iniciando stream con constraints:', constraints);
        let stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        video.srcObject = stream;
        video.play();
        
        // Funciâ”œâ”‚n para capturar foto
        const capturePhoto = async () => {
          try {
            // Evitar taps repetidos que generen duplicados
            captureButton.disabled = true;
            setTimeout(() => { captureButton.disabled = false; }, 1500);

            // Captura directa del videoContainer - solo video + overlay + logo, sin controles
            const canvas = document.createElement('canvas');
            const videoContainer = document.querySelector('[style*="flex: 1"]');
            
            if (!videoContainer) {
              console.error('No se encontrâ”œâ”‚ videoContainer');
              return;
            }
            
            const videoRect = videoContainer.getBoundingClientRect();
            canvas.width = videoRect.width;
            canvas.height = videoRect.height;
            const ctx = canvas.getContext('2d');
            
            if (ctx) {
              // Activar flash si estâ”œÃ­ en modo 'on' o 'auto'
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

              // En esta versiâ”œâ”‚n seguimos con la câ”œÃ­mara abierta para continuar tomando.
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
              processingMessage.innerHTML = 'Â­Æ’Ã´Ã€ Agregando marca de agua georeferenciada...<br/><small>Por favor espere</small>';
              document.body.appendChild(processingMessage);
              
              // Guardar directamente el fotograma tal cual viene de la vista en vivo,
              // haciendo que el usuario vea en la galerâ”œÂ¡a lo mismo que ve en la câ”œÃ­mara.
              await savePhotoToGallery(photoDataUrl, `MOPC_Photo_${new Date().toISOString().replace(/[:.]/g, '-')}.jpg`);

              // Mensaje de â”œÂ®xito dentro de la propia interfaz
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
              successMessage.textContent = 'Â­Æ’Ã´Â© Foto guardada correctamente. Sigue tomando.';
              document.body.appendChild(successMessage);

              setTimeout(() => {
                successMessage.remove();
              }, 1800);

              // Remover mensaje de procesamiento
              processingMessage.remove();

              console.log('Ã”Â£Ã  Foto capturada y guardada con geolocalizaciâ”œâ”‚n en vivo');
            }
          } catch (error: any) {
            console.error('Error capturando foto:', error);
            alert('Error al capturar foto: ' + (error.message || 'Error desconocido'));
          }
        };
        
        // Funciâ”œâ”‚n para toggle flash
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
            
            console.log('Â­Æ’Ã¶Âª Flash cambiado a:', flashMode);
            // Flash real en WebRTC no estâ”œÃ­ implementado, solo visual
          } catch (error) {
            console.error('Error cambiando flash:', error);
          }
        };
        
        // Funciâ”œâ”‚n para girar câ”œÃ­mara
        const flipCamera = async () => {
          try {
            cameraDirection = cameraDirection === 'environment' ? 'user' : 'environment';
            
            // Reiniciar stream con nueva direcciâ”œâ”‚n
            stream.getTracks().forEach(track => track.stop());
            
            const flipConstraints: any = {
              video: {
                facingMode: cameraDirection,
                width: { ideal: 1920 },
                height: { ideal: 1080 }
              },
              audio: false
            };
            
            // Configuraciâ”œâ”‚n especâ”œÂ¡fica segâ”œâ•‘n modelo
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
            
            console.log('Â­Æ’Ã¶Ã¤ Cambiando a câ”œÃ­mara:', cameraDirection, flipConstraints);
            const newStream = await navigator.mediaDevices.getUserMedia(flipConstraints);
            stream = newStream; // Actualizar variable stream
            video.srcObject = newStream;
            video.play();
          } catch (error) {
            console.error('Error girando câ”œÃ­mara:', error);
          }
        };
        
        // Funciâ”œâ”‚n para controlar zoom con un solo slider
        const adjustZoom = (value: number) => {
          zoomLevel = value;
          
          // Aplicar zoom usando CSS transform al video (mâ”œÂ®todo compatible)
          video.style.transform = `scale(${zoomLevel})`;
          video.style.transformOrigin = 'center center';
          video.style.transition = 'transform 0.3s ease';
          
          console.log('Â­Æ’Ã¶Ã¬ Zoom aplicado:', zoomLevel);
        };
        
        // Funciâ”œâ”‚n para controlar tamaâ”œâ–’o de texto con slider
        const adjustTextSize = (value: number) => {
          textSizeLevel = value;
          
          // Ajustar tamaâ”œâ–’o de texto del overlay
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
        console.error('Error accediendo a la câ”œÃ­mara:', error);
        
        // Fallback a câ”œÃ­mara Capacitor si WebRTC no funciona
        Geolocation.clearWatch({ id: watchPositionId });
        cameraInterface.remove();
        
        // Usar mâ”œÂ®todo original con Capacitor
        console.log('Â­Æ’Ã´Ã€ Usando câ”œÃ­mara Capacitor como fallback...');
        
        // Obtener ubicaciâ”œâ”‚n actual
        const position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 60000
        });
        
        // Obtener direcciâ”œâ”‚n
        let address = 'Ubicaciâ”œâ”‚n desconocida';
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
        
        // Usar câ”œÃ­mara Capacitor
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
          
          // Guardar directamente en galerâ”œÂ¡a
          await savePhotoToGallery(watermarkedImage, `MOPC_Photo_${new Date().toISOString().replace(/[:.]/g, '-')}.jpg`);
          
          console.log('Ã”Â£Ã  Foto capturada y guardada con mâ”œÂ®todo Capacitor');
        }
      }
      
    } catch (error: any) {
      console.error('Ã”Ã˜Ã® Error al tomar foto:', error);
      alert('Error al tomar foto: ' + (error.message || error.toString()));
    }
  };

  // Funciâ”œâ”‚n para guardar foto en galerâ”œÂ¡a
  const handleSavePhotoToGallery = async (photoData: { photo: string; location: any; timestamp: string }) => {
    try {
      // Crear un nombre de archivo â”œâ•‘nico
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `MOPC_Photo_${timestamp}.jpg`;
      
      // Guardar en localStorage como galerâ”œÂ¡a simulada
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
      
      console.log('Foto guardada en galerâ”œÂ¡a:', newPhoto);
      
      // Aquâ”œÂ¡ tambiâ”œÂ®n se podrâ”œÂ¡a implementar el guardado real en el dispositivo
      // usando el plugin de File System de Capacitor si se necesita
      
    } catch (error) {
      console.error('Error guardando foto en galerâ”œÂ¡a:', error);
      throw error;
    }
  };

  // Si se debe mostrar la pâ”œÃ­gina de Mis Reportes
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

  // Si se debe mostrar la pâ”œÃ­gina de configuraciâ”œâ”‚n
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

  // Si se debe mostrar la jerarquâ”œÂ¡a de reportes
  if (showHierarchy && user) {
    return (
      <MyReportsHierarchy 
        username={user.username} 
        onClose={handleBackToDashboard}
        onViewReport={handleOpenReportView}
      />
    );
  }

  // Si se debe mostrar la pâ”œÃ­gina de informes
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

  // Si se debe mostrar la pâ”œÃ­gina de exportar
  if (showExportPage && user) {
    return <ExportPage user={user} onBack={handleBackToDashboard} />;
  }

  // Si se debe mostrar la pâ”œÃ­gina de usuarios
  if (showUsersPage && user) {
    return <UsersPage user={user} onBack={handleBackToDashboard} />;
  }

  // Si se debe mostrar la pâ”œÃ­gina de vehâ”œÂ¡culos pesados
  if (showHeavyVehiclesPage && user) {
    return <HeavyVehiclesPage onClose={handleBackToDashboard} />;
  }

  // Si se debe mostrar el formulario de reportes
  if (showReportForm && user) {
    return (
      <ReportForm
        key={interventionToEdit?._pendingReportId || interventionToEdit?.id || 'new-report'} // Ã”Â£Ã  Forzar remontaje
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
                <h1 className="login-title">Direcciâ”œâ”‚n de Coordinaciâ”œâ”‚n Regional</h1>
                <p className="login-subtitle">Sistema de Gestiâ”œâ”‚n de Obras Pâ”œâ•‘blicas</p>
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
              <label htmlFor="password">Contraseâ”œâ–’a</label>
              <input
                id="password"
                type="password"
                className="form-input"
                placeholder="Ingrese contraseâ”œâ–’a"
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
              {isLoading ? 'Iniciando sesiâ”œâ”‚n...' : 'Iniciar Sesiâ”œâ”‚n'}
            </button>

            <div className="forgot-password-row">
              <button
                type="button"
                className="link-button"
                onClick={() => setShowResetModal(true)}
                disabled={isLoading}
              >
                Recuperar contraseâ”œâ–’a
              </button>
            </div>
          </form>

          {showResetModal && (
            <div className="modal-overlay" onClick={() => setShowResetModal(false)}>
              <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>Recuperar contraseâ”œâ–’a</h3>
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
                    <label htmlFor="resetEmail">Correo electrâ”œâ”‚nico</label>
                    <input
                      id="resetEmail"
                      type="email"
                      className="form-input"
                      placeholder="Ingrese su correo electrâ”œâ”‚nico"
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
                <p> 2025 Ministerio de Obras Pâ”œâ•‘blicas y Comunicaciones</p>
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <>
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
              {chatUnreadCount > 0 && (
                <span className={`chat-unread-badge ${chatBadgeAnimate ? 'chat-badge-shake' : ''}`}>
                  {chatUnreadCount > 99 ? '99+' : chatUnreadCount}
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
        {/* Notificaciâ”œâ”‚n de perfil incompleto */}
        {showProfileIncompleteNotification && (
          <div className="profile-incomplete-notification">
            <div className="notification-content">
              <span className="notification-icon">Ã”ÃœÃ¡Â´Â©Ã…</span>
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
          {/* TODO: el diseâ”œâ–’o original usaba "cards" para cada acciâ”œâ”‚n.
              Para que el dashboard se parezca mâ”œÃ­s a una app mâ”œâ”‚vil podemos
              usar iconos circulares y etiquetas pequeâ”œâ–’as. Se introduce el
              flag `useIconButtons` para alternar entre ambas versiones.
          */}
          {/** Presionar este valor a `true` activa el modo botâ”œâ”‚n circular */}
          {useIconButtons ? (
            <div className="dashboard-icons-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
              {/* versiâ”œâ”‚n con botones redondos */}
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
                <div className="dashboard-action-label">Câ”œÃ­mara</div>
              </div>

              <div className={`dashboard-action ${!isProfileComplete ? 'profile-locked' : ''}`} onClick={handleOpenStabilityModal}>
                <div className="dashboard-action-icon" style={{ fontSize: '26px' }}>
                  Â­Æ’Ã´Ã…
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

              {/* Usuarios: oculto temporalmente en main, se puede volver a habilitar cambiando esta condiciâ”œâ”‚n */}
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
                  <div className="dashboard-action-label">Vehâ”œÂ¡culos Pesados</div>
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
              {/* diseâ”œâ–’o previo con tarjetas */}
              {/* Icono Registrar */}
              <div className={`dashboard-icon-card ${!isProfileComplete ? 'profile-locked' : ''}`} onClick={handleShowReportForm}>
                <div className="dashboard-icon">
                  <AddIcon size={40} />
                </div>
                <h3 className="dashboard-icon-title">Registrar</h3>
                <p className="dashboard-icon-description">
                  Registrar nuevas obras y intervenciones realizadas
                </p>
                {!isProfileComplete && <div className="locked-overlay">Â­Æ’Ã¶Ã†</div>}
              </div>

              {/* Icono Informes - Oculto para usuarios tâ”œÂ®cnicos */}
              {user?.role !== UserRole.TECNICO && (
                <div className={`dashboard-icon-card ${!isProfileComplete ? 'profile-locked' : ''}`} onClick={handleShowReports}>
                  <div className="dashboard-icon">
                    <BarChartIcon size={40} />
                  </div>
                  <h3 className="dashboard-icon-title">Informes y Estadâ”œÂ¡sticas</h3>
                  <p className="dashboard-icon-description">
                    Ver estadâ”œÂ¡sticas, reportes y anâ”œÃ­lisis de todas las intervenciones
                  </p>
                  {!isProfileComplete && <div className="locked-overlay">Â­Æ’Ã¶Ã†</div>}
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
                {!isProfileComplete && <div className="locked-overlay">Â­Æ’Ã¶Ã†</div>}
                </div>
              )}
              {/* fin condicional Buscar - no cerrar grid aquâ”œÂ¡ */}

              {/* Icono Câ”œÃ­mara - Disponible para todos los usuarios */}
              <div className={`dashboard-icon-card ${!isProfileComplete ? 'profile-locked' : ''}`} onClick={handleOpenCamera}>
                <div className="dashboard-icon">
                  <CameraIcon size={40} />
                </div>
                <h3 className="dashboard-icon-title">Câ”œÃ­mara</h3>
                <p className="dashboard-icon-description">
                  Tomar fotografâ”œÂ¡as georeferenciadas con datos de ubicaciâ”œâ”‚n
                </p>
                {!isProfileComplete && <div className="locked-overlay">Â­Æ’Ã¶Ã†</div>}
              </div>

              {/* Icono Nivel de Estabilidad con Giroscopio */}
              <div className={`dashboard-icon-card ${!isProfileComplete ? 'profile-locked' : ''}`} onClick={handleOpenStabilityModal}>
                <div className="dashboard-icon">
                  <span style={{ fontSize: '1.5rem' }}>Â­Æ’Ã´Ã…</span>
                </div>
                <h3 className="dashboard-icon-title">Nivel de Estabilidad</h3>
                <p className="dashboard-icon-description">
                  Monitorea la estabilidad con el giroscopio y muestra un valor en tiempo real
                </p>
                {!isProfileComplete && <div className="locked-overlay">Â­Æ’Ã¶Ã†</div>}
              </div>

              {/* Icono Usuarios - Oculto temporalmente en main */}
              {user?.role !== UserRole.TECNICO && !hideUnusedIcons && false && (
                <div className={`dashboard-icon-card ${!isProfileComplete ? 'profile-locked' : ''}`} onClick={handleShowUsersPage}>
                  <div className="dashboard-icon">
                    <PeopleIcon size={40} />
                  </div>
                  <h3 className="dashboard-icon-title">Usuarios</h3>
                  <p className="dashboard-icon-description">
                    Gestiâ”œâ”‚n de usuarios activos e inactivos del sistema
                  </p>
                  {!isProfileComplete && <div className="locked-overlay">Â­Æ’Ã¶Ã†</div>}
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
                {!isProfileComplete && <div className="locked-overlay">Â­Æ’Ã¶Ã†</div>}
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
                <div>Roll (izq/der): {gyroData.gamma.toFixed(1)}â”¬â–‘</div>
                <div>Pitch (del/atrâ”œÃ­s): {gyroData.beta.toFixed(1)}â”¬â–‘</div>
                <div>Yaw: {gyroData.alpha.toFixed(1)}â”¬â–‘</div>
              </div>
              {!gyroPermissionPrompted && <p className="stability-note">Activa el giroscopio cuando se te solicite para medir correctamente.</p>}
            </div>
          </div>
        </div>
      )}

      {/* Modal ReportViewModern - Vista Detallada de Reportes */}
      {showReportView && selectedReportId && (
        <>
          {console.log('Â­Æ’Ã¶Ã¬ Dashboard: Renderizando ReportViewModern con:', { showReportView, selectedReportId })}
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
              <h2>Â­Æ’Ã¦Ã± Mi Perfil</h2>
              <button className="modal-close" onClick={() => { setShowProfileModal(false); setActiveNav('dashboard'); }}>Ã”Â£Ã²</button>
            </div>
            <div className="modal-body">
              <div className="profile-section">
                <div className="profile-avatar-large">
                  {user?.name.split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase()}
                </div>
                <div className="profile-info-group">
                  <div className="profile-info-item">
                    <label>Â­Æ’Ã¦Ã± Nombre completo</label>
                    <input type="text" value={user?.name || ''} readOnly className="form-input" />
                  </div>
                  <div className="profile-info-item">
                    <label>Â­Æ’Ã¶Ã¦ Usuario</label>
                    <input type="text" value={user?.username || ''} readOnly className="form-input" />
                  </div>
                  <div className="profile-info-item">
                    <label>Â­Æ’Ã…Ã³ Departamento</label>
                    <input type="text" value="Direcciâ”œâ”‚n de Coordinaciâ”œâ”‚n Regional" readOnly className="form-input" />
                  </div>
                  <div className="profile-info-item">
                    <label>Â­Æ’Ã´Ã¬ Regiâ”œâ”‚n asignada</label>
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
              <h2>Â­Æ’Ã´Ã¯ Mis Reportes</h2>
              <button className="modal-close" onClick={() => { setShowMyReportsModal(false); setActiveNav('dashboard'); }}>Ã”Â£Ã²</button>
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
              <h2>Ã”Â£Â¿ Completar Perfil</h2>
              <button className="modal-close" onClick={() => setShowCompleteProfileModal(false)}>Ã”Â£Ã²</button>
            </div>
            <div className="modal-body">
              <p className="modal-description">Complete toda su informaciâ”œâ”‚n para verificar su cuenta</p>
              
              {/* Foto de Perfil */}
              <div className="profile-field-section">
                <label className="profile-field-label">Â­Æ’Ã´Â© Foto de Perfil *</label>
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
                        <span className="upload-icon">Â­Æ’Ã´Ã€</span>
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
                <label className="profile-field-label">Â­Æ’Ã¦Ã± Nombre Completo *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej: Juan Pâ”œÂ®rez Gâ”œâ”‚mez"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              {/* Nâ”œâ•‘mero de Câ”œÂ®dula */}
              <div className="profile-field-section">
                <label className="profile-field-label">Â­Æ’Ã¥Ã¶ Nâ”œâ•‘mero de Câ”œÂ®dula *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej: 001-1234567-8"
                  value={idCardNumber}
                  onChange={(e) => setIdCardNumber(e.target.value)}
                  maxLength={15}
                />
                <small style={{ color: '#6c757d', fontSize: '12px', marginTop: '5px', display: 'block' }}>
                  Debe coincidir con el nâ”œâ•‘mero registrado en el sistema
                </small>
              </div>

              {/* Foto del Carnet */}
              <div className="profile-field-section">
                <label className="profile-field-label">Â­Æ’Â¬Â¬ Foto del Carnet de Identidad *</label>
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
                        <span className="upload-icon">Â­Æ’Â¬Â¬</span>
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
    </>
  );
};

export default Dashboard;

