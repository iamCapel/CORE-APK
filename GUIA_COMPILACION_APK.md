# Guía de Compilación de APK para Android

Este documento explica cómo compilar la aplicación CORE-APK como una aplicación Android nativa.

## 📋 Requisitos Previos

- Node.js 20.x o superior
- Java JDK 21
- Android SDK instalado
- Gradle (se descarga automáticamente)

## 🚀 Compilación Rápida

### APK de Debug (Para pruebas)

Ejecuta el script automatizado:

```bash
./build-apk.sh
```

La APK se generará en: `android/app/build/outputs/apk/debug/app-debug.apk`

### Instalación Manual

Si prefieres hacerlo paso a paso:

1. **Construir la aplicación React:**

   ```bash
   npm run build
   ```

2. **Sincronizar con Capacitor:**

   ```bash
   npx cap sync android
   ```

3. **Compilar la APK:**
   ```bash
   cd android
   export ANDROID_HOME=/workspaces/CORE-APK/android-sdk
   export JAVA_HOME=/usr/lib/jvm/java-21-openjdk
   export PATH=$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/build-tools/34.0.0:$PATH
   ./gradlew assembleDebug
   ```

## 📦 APK de Release (Para producción)

### 1. Generar Keystore

Primero necesitas crear una clave para firmar la APK:

```bash
keytool -genkey -v -keystore my-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias my-key-alias
```

Guarda el archivo `my-release-key.jks` en un lugar seguro y **NO LO SUBAS AL REPOSITORIO**.

### 2. Configurar Gradle

Crea el archivo `android/key.properties`:

```properties
storePassword=TU_PASSWORD_DEL_KEYSTORE
keyPassword=TU_PASSWORD_DE_LA_KEY
keyAlias=my-key-alias
storeFile=/ruta/absoluta/a/my-release-key.jks
```

### 3. Actualizar build.gradle

Edita `android/app/build.gradle` y agrega antes del bloque `android`:

```groovy
def keystorePropertiesFile = rootProject.file("key.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}
```

Y dentro del bloque `android`, agrega en `buildTypes`:

```groovy
release {
    signingConfig signingConfigs.release
    minifyEnabled false
    proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
}
```

Y antes de `buildTypes`, agrega:

```groovy
signingConfigs {
    release {
        keyAlias keystoreProperties['keyAlias']
        keyPassword keystoreProperties['keyPassword']
        storeFile file(keystoreProperties['storeFile'])
        storePassword keystoreProperties['storePassword']
    }
}
```

### 4. Compilar APK Release

```bash
cd android
./gradlew assembleRelease
```

La APK firmada se generará en: `android/app/build/outputs/apk/release/app-release.apk`

## 📱 Instalación en Dispositivo Android

### Método 1: USB (ADB)

1. Habilita "Opciones de desarrollador" en tu dispositivo Android
2. Activa "Depuración USB"
3. Conecta tu dispositivo por USB
4. Ejecuta:
   ```bash
   adb install android/app/build/outputs/apk/debug/app-debug.apk
   ```

### Método 2: Transferencia directa

1. Copia el archivo APK a tu dispositivo Android
2. Abre el archivo APK desde el explorador de archivos
3. Permite la instalación desde "fuentes desconocidas" si se solicita
4. Instala la aplicación

## 🔄 Actualizar Configuración de Capacitor

Si necesitas cambiar el ID de la aplicación o el nombre:

Edita `capacitor.config.ts`:

```typescript
const config: CapacitorConfig = {
  appId: "com.tuempresa.tuapp", // Cambia esto
  appName: "Tu App", // Cambia esto
  webDir: "build",
};
```

Luego sincroniza:

```bash
npx cap sync android
```

## 🛠️ Solución de Problemas

### Error: "Could not find Java 21"

Asegúrate de que la variable `JAVA_HOME` apunte a Java 21:

```bash
export JAVA_HOME=/usr/lib/jvm/java-21-openjdk
```

### Error: "Android SDK not found"

Configura la variable `ANDROID_HOME`:

```bash
export ANDROID_HOME=/workspaces/CORE-APK/android-sdk
```

### Limpiar compilación

Si tienes problemas, limpia y recompila:

```bash
cd android
./gradlew clean
cd ..
./build-apk.sh
```

## 📊 Estructura del Proyecto Android

```
android/
├── app/
│   ├── src/
│   │   └── main/
│   │       ├── assets/
│   │       │   └── public/          # Archivos web de la app React
│   │       ├── java/
│   │       └── AndroidManifest.xml  # Configuración de la app
│   ├── build.gradle                 # Configuración de compilación
│   └── build/
│       └── outputs/
│           └── apk/
│               ├── debug/
│               │   └── app-debug.apk
│               └── release/
│                   └── app-release.apk
├── build.gradle                     # Configuración global
└── gradle.properties                # Propiedades de Gradle
```

## 🔐 Permisos de la Aplicación

La aplicación solicita los siguientes permisos (configurados en `AndroidManifest.xml`):

- **INTERNET**: Para comunicación con Firebase y APIs
- **ACCESS_FINE_LOCATION**: Para geolocalización
- **ACCESS_COARSE_LOCATION**: Para geolocalización aproximada
- **CAMERA**: Para capturar fotos en reportes

## 🎯 Optimización para Producción

### Reducir tamaño del APK

1. **Habilitar ProGuard** en `android/app/build.gradle`:

   ```groovy
   buildTypes {
       release {
           minifyEnabled true
           shrinkResources true
       }
   }
   ```

2. **Generar App Bundle** (recomendado para Google Play):

   ```bash
   cd android
   ./gradlew bundleRelease
   ```

   El archivo AAB se generará en: `android/app/build/outputs/bundle/release/app-release.aab`

### Optimizar imágenes

Reduce el tamaño de las imágenes en `public/images/` antes de compilar.

## 📝 Notas Importantes

- La APK de debug está firmada con una clave de desarrollo y **NO** debe publicarse en Google Play
- Para publicar en Google Play Store necesitas una APK de release firmada con tu propia clave
- Guarda tu keystore en un lugar seguro; si lo pierdes, no podrás actualizar tu aplicación
- El primer build puede tardar varios minutos; los siguientes serán más rápidos
- Asegúrate de que tu aplicación React funcione correctamente en navegador antes de compilar

## 🔗 Referencias

- [Documentación de Capacitor](https://capacitorjs.com/docs)
- [Guía de Android Studio](https://developer.android.com/studio/build)
- [Publicar en Google Play](https://support.google.com/googleplay/android-developer/answer/9859152)
