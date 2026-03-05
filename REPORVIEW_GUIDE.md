# 📋 ReportView - Vista Detallada de Reportes

## 🎨 Descripción

El componente `ReportView` es un modal moderno con diseño **dark glass ahumado** y acentos **naranjas** que permite visualizar reportes guardados de forma detallada e interactiva.

## ✨ Características

### 🎨 Diseño Visual
- **Tema Dark**: Fondo oscuro elegante con efecto glass ahumado
- **Acentos Naranjas**: Contornos y detalles en tonos naranjas (#FF6B00)
- **Glass Morphism**: Efectos de desenfoque y transparencias modernas
- **Animaciones Suaves**: Transiciones fluidas y micro-interacciones

### 📱 Funcionalidades
- **Vista por Pestañas**: Información, Métricas, GPS e Imágenes
- **Datos Completos**: Muestra toda la información del reporte organizada
- **Navegación Intuitiva**: Fácil acceso a diferentes secciones del reporte
- **Edición Integrada**: Botón para editar directamente desde la vista
- **Responsive**: Adaptable a móviles y tablets

## 🚀 Uso Básico

### Importación
```tsx
import ReportView from './components/ReportView';
```

### Implementación
```tsx
const [showReportView, setShowReportView] = useState(false);
const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

// Abrir ReportView
const handleOpenReport = (reportId: string) => {
  setSelectedReportId(reportId);
  setShowReportView(true);
};

// Cerrar ReportView
const handleCloseReport = () => {
  setShowReportView(false);
  setSelectedReportId(null);
};

// Editar desde ReportView
const handleEditReport = (report: any) => {
  // Lógica para editar el reporte
  console.log('Editando reporte:', report);
};

// En tu JSX
{showReportView && selectedReportId && (
  <ReportView
    reportId={selectedReportId}
    onClose={handleCloseReport}
    onEdit={handleEditReport}
    user={user}
  />
)}
```

## 🎯 Integración con Dashboard

El componente ya está integrado en el Dashboard principal. Para usarlo:

1. **Desde una lista de reportes**: Agrega `onClick={() => handleOpenReportView(report.id)}`
2. **Desde notificaciones**: Conecta el ID del reporte al `handleOpenReportView`
3. **Desde búsqueda**: Mapea resultados de búsqueda a IDs de reportes

### Ejemplo en lista de reportes:
```tsx
<div className="report-item" onClick={() => handleOpenReportView(report.id)}>
  <span>{report.numeroReporte}</span>
  <span>{report.tipoIntervencion}</span>
</div>
```

## 📊 Estructura de Datos

El componente espera reportes con la siguiente estructura:

```typescript
interface Report {
  id: string;
  numeroReporte: string;
  creadoPor: string;
  fechaCreacion: string;
  region: string;
  provincia: string;
  municipio: string;
  distrito: string;
  sector: string;
  tipoIntervencion: string;
  subTipoCanal?: string;
  estado: string;
  metricData?: Record<string, any>;
  gpsData?: {
    punto_inicial?: { lat: number; lon: number };
    punto_alcanzado?: { lat: number; lon: number };
  };
  observaciones?: string;
  imagenes?: string[];
  vehiculos?: any[];
  fechaInicio?: string;
  fechaFinal?: string;
}
```

## 🎨 Personalización

### Colores (CSS Variables)
```css
:root {
  --orange-primary: #FF6B00;
  --orange-light: #FF8C33;
  --glass-bg: rgba(255, 255, 255, 0.04);
  --glass-border: rgba(255, 255, 255, 0.08);
  --dark-bg: #0a0a0c;
  --dark-surface: #111114;
}
```

### Clases CSS Principales
- `.reportview-overlay`: Contenedor principal del modal
- `.reportview-modal`: Modal con efecto glass
- `.reportview-header`: Encabezado con información del reporte
- `.reportview-tabs`: Navegación por pestañas
- `.reportview-content`: Contenido dinámico
- `.metric-card`: Tarjetas para datos métricos
- `.gps-point`: Sección de coordenadas GPS
- `.image-item`: Visualizador de imágenes

## 🔧 Props del Componente

| Prop | Tipo | Descripción |
|------|------|-------------|
| `reportId` | `string` | ID del reporte a visualizar |
| `onClose` | `() => void` | Función para cerrar el modal |
| `onEdit` | `(report: Report) => void` | Función para editar el reporte (opcional) |
| `user` | `User` | Información del usuario actual |

## 📱 Responsive Design

El componente es completamente responsive:

- **Desktop**: 900px de ancho máximo, diseño completo
- **Tablet**: 768px - ajuste de grids y espaciado
- **Móvil**: < 480px - layout apilado, botones optimizados

## 🎭 Estados y Animaciones

### Loading State
```tsx
if (loading) {
  return (
    <div className="reportview-loading">
      <div className="loading-spinner"></div>
      <p>Cargando reporte...</p>
    </div>
  );
}
```

### Error State
```tsx
if (!report) {
  return (
    <div className="reportview-error">
      <h2>❌ Reporte no encontrado</h2>
      <button onClick={onClose}>Cerrar</button>
    </div>
  );
}
```

## 🔍 Pestañas Disponibles

### 📋 Información
- Ubicación geográfica
- Detalles de intervención
- Observaciones
- Vehículos utilizados

### 📊 Métricas
- Datos cuantitativos del reporte
- Unidades de medida automáticas
- Grid de tarjetas interactivas

### 📍 GPS
- Coordenadas punto inicial
- Coordenadas punto alcanzado
- Formato geográfico preciso

### 📷 Imágenes
- Galería de imágenes del reporte
- Vista previa con zoom
- Abrir en nueva ventana

## 🚀 Mejoras Futuras

- [ ] Exportar a PDF desde ReportView
- [ ] Compartir reporte por email
- [ ] Modo pantalla completa
- [ ] Historial de cambios
- [ ] Comentarios y anotaciones
- [ ] Comparación entre reportes

## 🐛 Troubleshooting

### Problemas Comunes
1. **Reporte no carga**: Verifica que el `reportId` sea correcto
2. **Imágenes no muestran**: Confirma URLs válidas en `imagenes[]`
3. **GPS no aparece**: Revisa estructura de `gpsData`
4. **Estilos incorrectos**: Asegura importación del CSS

### Debug Tips
```tsx
// Agrega logging para debugging
console.log('ReportView - reportId:', reportId);
console.log('ReportView - user:', user);
```

## 📞 Soporte

Para issues o preguntas:
1. Revisa este guide
2. Verifica la consola del navegador
3. Contacta al equipo de desarrollo

---

**Creado con ❤️ para el equipo MOPC**  
*Diseño: Dark Glass con acentos naranjas*
