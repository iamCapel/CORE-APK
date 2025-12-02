# 🎯 Referencia Rápida - CORE-APK Android

## 📱 APK Compilada

**Ubicación de la APK de Debug:**

```
android/app/build/outputs/apk/debug/app-debug.apk
```

**Tamaño:** 9.5 MB  
**Tipo:** Debug (solo para pruebas)  
**Package:** com.iamcapel.coreapk

---

## 🚀 Comandos Rápidos

### Compilar APK

```bash
./build-apk.sh
```

### Compilar APK de Release

```bash
./build-apk-release.sh
```

### Verificar Configuración

```bash
./verificar-android.sh
```

### Instalar en Dispositivo

```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

### Limpiar y Recompilar

```bash
cd android && ./gradlew clean && cd .. && ./build-apk.sh
```

---

## 📦 Scripts NPM Disponibles

```bash
npm start                    # Iniciar servidor de desarrollo React
npm run build                # Compilar app React para producción
npm run build:mobile         # Compilar y sincronizar con Capacitor
npm run android:build        # Compilar APK de debug (completo)
npm run android:build:release # Compilar APK de release
npm run android:open         # Abrir proyecto en Android Studio
npm run android:run          # Ejecutar en emulador/dispositivo
npm run android:clean        # Limpiar compilación Android
npm run cap:sync             # Sincronizar web con Android
npm run cap:update           # Actualizar plugins de Capacitor
```

---

## 📂 Estructura de Archivos Importantes

```
CORE-APK/
│
├── 📱 APK COMPILADA
│   └── android/app/build/outputs/apk/debug/app-debug.apk
│
├── 🔧 SCRIPTS DE COMPILACIÓN
│   ├── build-apk.sh                    # Compilar debug
│   ├── build-apk-release.sh            # Compilar release
│   └── verificar-android.sh            # Verificar configuración
│
├── 📚 DOCUMENTACIÓN
│   ├── GUIA_COMPILACION_APK.md         # Guía completa
│   ├── README_ANDROID.md               # README Android
│   ├── CONVERSION_COMPLETADA.md        # Resumen del proceso
│   └── REFERENCIA_RAPIDA.md            # Este archivo
│
├── ⚙️ CONFIGURACIÓN
│   ├── capacitor.config.ts             # Config de Capacitor
│   ├── android/build.gradle            # Config Gradle principal
│   └── android/app/build.gradle        # Config Gradle de la app
│
├── 📦 CÓDIGO FUENTE
│   ├── src/                            # Código React
│   ├── public/                         # Assets públicos
│   └── build/                          # App compilada (web)
│
└── 🔨 HERRAMIENTAS
    ├── android-sdk/                    # Android SDK local
    ├── android/                        # Proyecto Android
    └── node_modules/                   # Dependencias npm
```

---

## 🔑 Información de la Aplicación

| Propiedad        | Valor                |
| ---------------- | -------------------- |
| **Package Name** | com.iamcapel.coreapk |
| **App Name**     | CORE-APK             |
| **Min SDK**      | 22 (Android 5.1)     |
| **Target SDK**   | 34 (Android 14)      |
| **Capacitor**    | 7.4.4                |
| **Gradle**       | 8.11.1               |
| **Java**         | 21                   |
| **Node**         | 20.19.6              |

---

## 🔐 Variables de Entorno

```bash
export ANDROID_HOME=/workspaces/CORE-APK/android-sdk
export JAVA_HOME=/usr/lib/jvm/java-21-openjdk
export PATH=$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH
```

---

## 📋 Plugins de Capacitor

| Plugin                   | Versión | Propósito          |
| ------------------------ | ------- | ------------------ |
| @capacitor/core          | 7.4.4   | Funcionalidad base |
| @capacitor/android       | 7.4.4   | Plataforma Android |
| @capacitor/geolocation   | 7.1.5   | GPS y ubicación    |
| @capacitor/splash-screen | 7.0.3   | Pantalla de inicio |

---

## 🐛 Solución Rápida de Problemas

### La compilación falla

```bash
cd android && ./gradlew clean && cd ..
./build-apk.sh
```

### Error de Java

```bash
export JAVA_HOME=/usr/lib/jvm/java-21-openjdk
```

### Error de Android SDK

```bash
export ANDROID_HOME=/workspaces/CORE-APK/android-sdk
```

### Cambios en React no se reflejan

```bash
npm run build
npx cap sync android
cd android && ./gradlew assembleDebug
```

### APK no instala en dispositivo

- Habilita "Fuentes desconocidas" en Android
- Desinstala versión anterior
- Verifica que sea Android 5.1+

---

## 📱 Instalación en Dispositivo

### Método 1: ADB (Recomendado)

```bash
# Conecta el dispositivo por USB
# Habilita Depuración USB en el dispositivo
adb devices                          # Verifica conexión
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

### Método 2: Transferencia Manual

1. Copia `android/app/build/outputs/apk/debug/app-debug.apk` a tu teléfono
2. Ábrelo con el explorador de archivos
3. Permite instalación desde fuentes desconocidas
4. Instala

### Método 3: Compartir por Email/Drive

1. Sube el APK a Google Drive / Envía por email
2. Descarga en el dispositivo Android
3. Instala

---

## 🎨 Personalización

### Cambiar Icono de la App

```
android/app/src/main/res/
├── mipmap-hdpi/ic_launcher.png
├── mipmap-mdpi/ic_launcher.png
├── mipmap-xhdpi/ic_launcher.png
├── mipmap-xxhdpi/ic_launcher.png
└── mipmap-xxxhdpi/ic_launcher.png
```

### Cambiar Nombre de la App

Edita: `android/app/src/main/res/values/strings.xml`

```xml
<string name="app_name">Tu Nombre</string>
```

### Cambiar Package Name

1. Edita `capacitor.config.ts`: `appId: 'com.tuempresa.tuapp'`
2. Ejecuta: `npx cap sync android`

---

## 📊 Tamaños de Compilación

| Tipo                        | Tamaño Aproximado |
| --------------------------- | ----------------- |
| APK Debug                   | ~9.5 MB           |
| APK Release (sin optimizar) | ~8-9 MB           |
| APK Release (optimizada)    | ~6-7 MB           |
| AAB (App Bundle)            | ~5-6 MB           |

---

## 🔄 Flujo de Desarrollo Típico

1. **Desarrollar** → Edita código en `src/`
2. **Probar** → `npm start` (navegador)
3. **Compilar** → `npm run build`
4. **Sincronizar** → `npx cap sync android`
5. **Construir APK** → `./build-apk.sh`
6. **Instalar** → `adb install ...`
7. **Probar** → Prueba en dispositivo real

---

## 📞 Enlaces Útiles

- **Documentación Capacitor**: https://capacitorjs.com/docs
- **Android Developer**: https://developer.android.com
- **Gradle**: https://gradle.org/
- **Firebase (usado en la app)**: https://firebase.google.com

---

## ✅ Checklist de Publicación

Antes de publicar en Google Play Store:

- [ ] Generar keystore de firma
- [ ] Compilar APK/AAB de release
- [ ] Probar en múltiples dispositivos
- [ ] Incrementar versionCode
- [ ] Preparar screenshots
- [ ] Escribir descripción
- [ ] Crear icono de alta resolución (512x512)
- [ ] Revisar permisos solicitados
- [ ] Configurar política de privacidad
- [ ] Crear cuenta de desarrollador Google Play ($25 único pago)

---

**Última actualización:** 2 de diciembre de 2025  
**Estado:** ✅ Proyecto completamente funcional  
**APK:** android/app/build/outputs/apk/debug/app-debug.apk (9.5 MB)
