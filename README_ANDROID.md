# CORE-APK - Versión Android 📱

## ✅ Estado del Proyecto

El proyecto ha sido exitosamente convertido a una aplicación Android nativa usando Capacitor.

## 📦 Archivos Generados

- **APK de Debug**: `android/app/build/outputs/apk/debug/app-debug.apk` (9.5 MB)
- **Configuración Capacitor**: `capacitor.config.ts`
- **Proyecto Android**: Carpeta `android/`

## 🚀 Inicio Rápido

### Compilar APK de Debug (para pruebas)

```bash
./build-apk.sh
```

### Compilar APK de Release (para producción)

```bash
./build-apk-release.sh
```

**Nota**: Para release necesitas configurar primero `android/key.properties` (ver guía completa)

## 📚 Documentación

Lee la **[Guía Completa de Compilación](GUIA_COMPILACION_APK.md)** para:

- Instrucciones detalladas paso a paso
- Configuración de firma para release
- Solución de problemas comunes
- Optimización para producción
- Publicación en Google Play Store

## 🛠️ Tecnologías Utilizadas

- **React**: Framework de UI
- **Capacitor 7**: Bridge para convertir web app en app nativa
- **Android SDK 34**: Plataforma de desarrollo Android
- **Gradle 8.11**: Sistema de compilación
- **Java 21**: Lenguaje de programación

## 📱 Plugins de Capacitor Instalados

- `@capacitor/geolocation` - Acceso a GPS y ubicación
- `@capacitor/splash-screen` - Pantalla de inicio

## 🔧 Configuración del Proyecto

### ID de la Aplicación

- **Package Name**: `com.iamcapel.coreapk`
- **App Name**: `CORE-APK`

### Versión de Android

- **Min SDK**: 22 (Android 5.1)
- **Target SDK**: 34 (Android 14)
- **Compile SDK**: 34

## 📋 Requisitos del Sistema

- Node.js 20.x o superior
- Java JDK 21
- Android SDK con Platform 34
- 2 GB de espacio en disco (para compilación)

## 🔄 Flujo de Desarrollo

1. **Desarrollar** en React: `npm start`
2. **Compilar** web: `npm run build`
3. **Sincronizar** con Android: `npx cap sync android`
4. **Compilar** APK: `cd android && ./gradlew assembleDebug`

O simplemente: `./build-apk.sh` para hacer todo de una vez.

## 📱 Instalación en Dispositivo

### Opción 1: ADB (USB)

```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

### Opción 2: Transferencia directa

1. Copia el APK a tu teléfono
2. Ábrelo y permite instalación desde fuentes desconocidas
3. Instala

## 🐛 Depuración

### Ver logs en tiempo real

```bash
adb logcat | grep Capacitor
```

### Inspeccionar con Chrome DevTools

1. Conecta tu dispositivo por USB
2. Abre Chrome y ve a `chrome://inspect`
3. Selecciona tu app

## 📊 Estructura del Proyecto Android

```
android/
├── app/
│   ├── src/main/
│   │   ├── assets/public/    # Tu app React compilada
│   │   ├── java/              # Código Java/Kotlin
│   │   └── AndroidManifest.xml
│   └── build.gradle
├── build.gradle
└── capacitor-plugins/         # Plugins de Capacitor
```

## 🎯 Próximos Pasos

### Para Desarrollo

- [ ] Configurar iconos y splash screen personalizados
- [ ] Añadir más plugins de Capacitor según necesidades
- [ ] Configurar notificaciones push (opcional)
- [ ] Implementar actualizaciones OTA con Capacitor Live Updates

### Para Producción

- [ ] Generar keystore de firma
- [ ] Configurar ProGuard para ofuscación
- [ ] Optimizar tamaño del APK
- [ ] Preparar assets para Google Play (iconos, screenshots)
- [ ] Configurar versión y versionCode
- [ ] Publicar en Google Play Store

## 🔐 Permisos Solicitados

La app solicita los siguientes permisos:

- ✅ **INTERNET** - Comunicación con Firebase
- ✅ **ACCESS_FINE_LOCATION** - GPS y geolocalización
- ✅ **ACCESS_COARSE_LOCATION** - Ubicación aproximada
- ✅ **CAMERA** - Captura de fotos (si aplica)

## 📞 Soporte

Para más información, consulta:

- [Documentación Capacitor](https://capacitorjs.com/docs)
- [Guía Android Developer](https://developer.android.com)
- Archivo `GUIA_COMPILACION_APK.md` en este proyecto

## 📝 Notas Importantes

⚠️ **La APK de debug NO debe publicarse en producción**

- Solo para pruebas internas
- Firmada con clave de desarrollo
- Mayor tamaño (sin optimizaciones)

✅ **Para producción usa APK de release**

- Firmada con tu propia clave
- Optimizada y minificada
- Lista para Google Play Store

---

**Última actualización**: 2 de diciembre de 2025
**Versión de Capacitor**: 7.4.4
**Versión de Android Gradle Plugin**: 8.7.2
