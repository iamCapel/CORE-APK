#!/bin/bash

# Configurar variables de entorno de Android
export ANDROID_HOME=/workspaces/CORE-APK/android-sdk
export PATH=$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/build-tools/34.0.0:/usr/bin:$PATH
export JAVA_HOME=/usr/lib/jvm/java-21-openjdk

# Mostrar versiones
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

# Compilar APK
echo ""
echo "=== Compilando APK ==="
cd android
./gradlew assembleDebug

echo ""
echo "=== ¡APK compilada con éxito! ==="
echo "La APK se encuentra en: android/app/build/outputs/apk/debug/app-debug.apk"
