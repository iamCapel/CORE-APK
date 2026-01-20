#!/bin/bash

# Script para compilar APK de Release
# IMPORTANTE: Asegúrate de tener configurado key.properties antes de ejecutar

set -e

# Configurar variables de entorno de Android
export ANDROID_HOME=/workspaces/CORE-APK/android-sdk
export PATH=$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/build-tools/34.0.0:/usr/bin:$PATH
export JAVA_HOME=/usr/lib/jvm/java-21-openjdk

# Verificar que existe el archivo de propiedades de la clave
if [ ! -f "android/key.properties" ]; then
    echo "❌ ERROR: No se encontró android/key.properties"
    echo ""
    echo "Para generar una APK de release, primero necesitas:"
    echo "1. Crear un keystore:"
    echo "   keytool -genkey -v -keystore my-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias my-key-alias"
    echo ""
    echo "2. Crear el archivo android/key.properties con el siguiente contenido:"
    echo "   storePassword=TU_PASSWORD_DEL_KEYSTORE"
    echo "   keyPassword=TU_PASSWORD_DE_LA_KEY"
    echo "   keyAlias=my-key-alias"
    echo "   storeFile=/ruta/absoluta/a/my-release-key.jks"
    echo ""
    echo "Consulta GUIA_COMPILACION_APK.md para más detalles."
    exit 1
fi

echo "=== Verificando configuración ==="
echo "Node version: $(node --version)"
echo "Java version: $(java -version 2>&1 | head -1)"
echo "ANDROID_HOME: $ANDROID_HOME"
echo ""

# Construir la aplicación React
echo "=== Construyendo aplicación React ==="
npm run build

# Sincronizar con Capacitor
echo ""
echo "=== Sincronizando con Capacitor ==="
npx cap sync android

# Compilar APK Release
echo ""
echo "=== Compilando APK Release (firmada) ==="
cd android
./gradlew assembleRelease

echo ""
echo "=== ¡APK Release compilada con éxito! ==="
echo "La APK firmada se encuentra en: android/app/build/outputs/apk/release/app-release.apk"
echo ""
echo "Tamaño del archivo:"
ls -lh app/build/outputs/apk/release/app-release.apk
echo ""
echo "Esta APK está lista para ser publicada en Google Play Store."
