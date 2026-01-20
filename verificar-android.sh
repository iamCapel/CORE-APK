#!/bin/bash

# Script de verificación del proyecto Android
# Verifica que todo esté correctamente configurado

echo "🔍 Verificando configuración del proyecto Android..."
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para verificar
check() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $2"
        return 0
    else
        echo -e "${RED}✗${NC} $2"
        return 1
    fi
}

# Función para verificar archivo
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $2: $1"
        return 0
    else
        echo -e "${RED}✗${NC} $2: $1 ${YELLOW}(no encontrado)${NC}"
        return 1
    fi
}

# Función para verificar directorio
check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✓${NC} $2: $1"
        return 0
    else
        echo -e "${RED}✗${NC} $2: $1 ${YELLOW}(no encontrado)${NC}"
        return 1
    fi
}

echo "=== Verificando Node.js ==="
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✓${NC} Node.js instalado: $NODE_VERSION"
    
    # Verificar versión mínima (20.x)
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
    if [ $NODE_MAJOR -ge 20 ]; then
        echo -e "${GREEN}✓${NC} Versión de Node.js es compatible (≥20.x)"
    else
        echo -e "${YELLOW}⚠${NC} Se recomienda Node.js 20.x o superior"
    fi
else
    echo -e "${RED}✗${NC} Node.js no encontrado"
fi
echo ""

echo "=== Verificando Java ==="
if command -v java &> /dev/null; then
    JAVA_VERSION=$(java -version 2>&1 | head -1)
    echo -e "${GREEN}✓${NC} Java instalado: $JAVA_VERSION"
else
    echo -e "${RED}✗${NC} Java no encontrado"
fi
echo ""

echo "=== Verificando Android SDK ==="
check_dir "/workspaces/CORE-APK/android-sdk" "Android SDK"
check_dir "/workspaces/CORE-APK/android-sdk/platforms/android-34" "Platform Android 34"
check_dir "/workspaces/CORE-APK/android-sdk/build-tools/34.0.0" "Build Tools 34.0.0"
check_file "/workspaces/CORE-APK/android-sdk/cmdline-tools/latest/bin/sdkmanager" "SDK Manager"
echo ""

echo "=== Verificando proyecto Capacitor ==="
check_file "/workspaces/CORE-APK/capacitor.config.ts" "Configuración Capacitor"
check_dir "/workspaces/CORE-APK/android" "Proyecto Android"
check_file "/workspaces/CORE-APK/android/build.gradle" "Build.gradle principal"
check_file "/workspaces/CORE-APK/android/app/build.gradle" "Build.gradle de la app"
echo ""

echo "=== Verificando archivos compilados ==="
check_file "/workspaces/CORE-APK/android/app/build/outputs/apk/debug/app-debug.apk" "APK de debug"
if [ -f "/workspaces/CORE-APK/android/app/build/outputs/apk/debug/app-debug.apk" ]; then
    APK_SIZE=$(du -h "/workspaces/CORE-APK/android/app/build/outputs/apk/debug/app-debug.apk" | cut -f1)
    echo "  Tamaño: $APK_SIZE"
fi
echo ""

echo "=== Verificando scripts ==="
check_file "/workspaces/CORE-APK/build-apk.sh" "Script de compilación debug"
check_file "/workspaces/CORE-APK/build-apk-release.sh" "Script de compilación release"
if [ -x "/workspaces/CORE-APK/build-apk.sh" ]; then
    echo -e "${GREEN}✓${NC} build-apk.sh es ejecutable"
else
    echo -e "${YELLOW}⚠${NC} build-apk.sh no es ejecutable (ejecuta: chmod +x build-apk.sh)"
fi
if [ -x "/workspaces/CORE-APK/build-apk-release.sh" ]; then
    echo -e "${GREEN}✓${NC} build-apk-release.sh es ejecutable"
else
    echo -e "${YELLOW}⚠${NC} build-apk-release.sh no es ejecutable (ejecuta: chmod +x build-apk-release.sh)"
fi
echo ""

echo "=== Verificando documentación ==="
check_file "/workspaces/CORE-APK/GUIA_COMPILACION_APK.md" "Guía de compilación"
check_file "/workspaces/CORE-APK/README_ANDROID.md" "README Android"
check_file "/workspaces/CORE-APK/CONVERSION_COMPLETADA.md" "Resumen de conversión"
echo ""

echo "=== Verificando dependencias npm ==="
if [ -f "/workspaces/CORE-APK/package.json" ]; then
    if grep -q "@capacitor/core" "/workspaces/CORE-APK/package.json"; then
        echo -e "${GREEN}✓${NC} @capacitor/core en package.json"
    else
        echo -e "${RED}✗${NC} @capacitor/core no encontrado en package.json"
    fi
    
    if grep -q "@capacitor/android" "/workspaces/CORE-APK/package.json"; then
        echo -e "${GREEN}✓${NC} @capacitor/android en package.json"
    else
        echo -e "${YELLOW}⚠${NC} @capacitor/android no encontrado en package.json"
    fi
fi
echo ""

echo "=== Resumen ==="
echo ""
if [ -f "/workspaces/CORE-APK/android/app/build/outputs/apk/debug/app-debug.apk" ]; then
    echo -e "${GREEN}🎉 ¡El proyecto está correctamente configurado!${NC}"
    echo ""
    echo "Para compilar una nueva APK, ejecuta:"
    echo "  ./build-apk.sh"
    echo ""
    echo "Para instalar en un dispositivo Android:"
    echo "  adb install android/app/build/outputs/apk/debug/app-debug.apk"
    echo ""
    echo "APK actual ubicada en:"
    echo "  android/app/build/outputs/apk/debug/app-debug.apk"
else
    echo -e "${YELLOW}⚠ El proyecto está configurado pero no hay APK compilada${NC}"
    echo ""
    echo "Para compilar la APK, ejecuta:"
    echo "  ./build-apk.sh"
fi
echo ""
echo "Para más información, consulta:"
echo "  - GUIA_COMPILACION_APK.md"
echo "  - README_ANDROID.md"
echo "  - CONVERSION_COMPLETADA.md"
