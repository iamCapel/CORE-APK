# Funcionalidad de Cámara Georeferenciada - MOPC

## 📸 Descripción

Se ha implementado un sistema de captura fotográfica con marca de agua georeferenciada automática en el Dashboard de MOPC.

## ✨ Características

### Ícono de Cámara en el Dashboard
- **Ubicación**: En el dashboard principal, entre los botones de acción
- **Diseño**: Ícono destacado con efecto de brillo naranja
- **Acceso directo**: Un solo clic abre la cámara del dispositivo

### Captura y Procesamiento Automático
Cuando se toma una foto, el sistema automáticamente:

1. **Captura la fotografía** con alta calidad (95%)
2. **Obtiene la ubicación GPS** actual del dispositivo
3. **Consulta la dirección** mediante geocodificación inversa
4. **Agrega una marca de agua** en la esquina inferior izquierda con:
   - ✅ Nombre completo del usuario
   - ✅ Dirección completa de la ubicación
   - ✅ Coordenadas GPS (latitud, longitud)
   - ✅ Fecha completa con hora (día, fecha, hora:minutos:segundos)
5. **Guarda automáticamente** en la galería del dispositivo

### Marca de Agua

La marca de agua incluye:
- **Fondo oscuro ahumado** con transparencia para legibilidad
- **Sombra suave** que mejora la visibilidad sobre cualquier fondo
- **Borde redondeado** con diseño moderno
- **Gradiente oscuro** (rgba(0,0,0,0.75) a rgba(0,0,0,0.85))

#### Ejemplo de información mostrada:
```
Juan Pérez García
Av. Abraham Lincoln, Ensanche Piantini, Santo Domingo, Distrito Nacional
18.485932, -69.940498
Lunes, 9 de Marzo de 2026 - 14:32:45
```

## 🔧 Implementación Técnica

### Archivos Creados/Modificados:

1. **`src/services/photoWatermark.ts`** (NUEVO)
   - Servicio para agregar marca de agua a fotografías
   - Funciones de formateo de fecha y coordenadas
   - Conversión de imágenes a base64
   - Guardado en galería del dispositivo

2. **`src/components/Dashboard.tsx`** (MODIFICADO)
   - Función `handleOpenCamera()` mejorada
   - Proceso automático de captura y guardado
   - Mensajes de estado durante el procesamiento
   - Manejo de errores mejorado

3. **`src/components/Dashboard.css`** (MODIFICADO)
   - Estilos especiales para el ícono de cámara
   - Efectos de hover mejorados
   - Gradientes y sombras distintivas

4. **`package.json`** (MODIFICADO)
   - Agregado: `@capacitor/filesystem@^7.0.0`

### Plugins de Capacitor Utilizados:

- ✅ `@capacitor/camera` - Captura de fotografías
- ✅ `@capacitor/geolocation` - Obtención de coordenadas GPS
- ✅ `@capacitor/filesystem` - Guardado en galería del dispositivo

## 📱 Uso

### En Dispositivo Móvil:
1. Abrir la aplicación MOPC
2. En el dashboard principal, tocar el ícono de **Cámara**
3. Permitir acceso a la cámara y ubicación (si se solicita)
4. Tomar la fotografía
5. Esperar unos segundos mientras se procesa
6. La foto se guarda automáticamente en la galería con la marca de agua

### En Navegador Web:
1. El navegador solicitará permisos de cámara y ubicación
2. Al tomar la foto, se descargará automáticamente al equipo
3. La foto incluirá la marca de agua georeferenciada

## ⚙️ Configuración de Permisos

Para que la funcionalidad trabaje correctamente en Android, asegúrese de que el archivo `android/app/src/main/AndroidManifest.xml` incluya:

```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
```

## 🔒 Seguridad y Privacidad

- ✅ Los permisos de cámara y ubicación solo se solicitan cuando el usuario toca el ícono
- ✅ El usuario puede denegar los permisos en cualquier momento
- ✅ Las fotos se guardan localmente en el dispositivo
- ✅ Se mantiene un registro local en `localStorage` con metadatos de cada foto

## 🎯 Beneficios

1. **Verificación de campo**: Las fotos incluyen prueba de ubicación y fecha/hora
2. **Documentación automática**: No se requiere agregar manualmente la información
3. **Trazabilidad**: Cada foto queda vinculada automáticamente al usuario que la tomó
4. **Profesional**: La marca de agua tiene un diseño limpio y legible
5. **Rápido**: Proceso automático sin intervención del usuario

## 🚀 Próximos Pasos

Para compilar y probar en un dispositivo Android:

```bash
# Compilar la aplicación
npm run build

# Sincronizar con Android
npx cap sync android

# Abrir en Android Studio
npx cap open android

# Compilar APK de depuración
cd android
gradlew assembleDebug
```

## 📝 Notas Importantes

- La primera vez que use la cámara, el sistema solicitará permisos
- Asegúrese de tener activado el GPS para obtener la ubicación precisa
- La velocidad del proceso depende de la conexión a internet (para obtener la dirección)
- Si no hay conexión, se mostrarán las coordenadas en lugar de la dirección completa

---

**Fecha de implementación**: 9 de Marzo de 2026  
**Versión**: 1.0
