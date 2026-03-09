# 📱 GUÍA PARA CONFIGURAR EL ICONO CORE

## 🎯 PASOS A SEGUIR:

### 1️⃣ GUARDAR LA IMAGEN
- Guarda la imagen que mostraste como `core-icon.png`
- Ubicación: `C:\Users\migue\OneDrive\Documentos\GitHub\CORE-APK\public\core-icon.png`
- Formato: PNG
- Tamaño recomendado: 512x512 píxeles (cuadrado)

### 2️⃣ CONFIGURACIÓN WEB (YA HECHA)
✅ `index.html` - Actualizado para usar `core-icon.png`
✅ `manifest.json` - Actualizado para usar `core-icon.png`

### 3️⃣ CONFIGURACIÓN ANDROID (MANUAL)
Para configurar el icono en Android, necesitas:

#### Opción A: Usar Android Studio
1. Abre el proyecto en Android Studio
2. Right-click en `app/res/mipmap`
3. New > Image Asset
4. Selecciona tu imagen `core-icon.png`
5. Ajusta el recorte y escala
6. Genera todos los tamaños automáticamente

#### Opción B: Manual (Recomendado)
Necesitas crear estos archivos en `android/app/src/main/res/mipmap-`:

```
mipmap-hdpi/ic_launcher.png (48x48)
mipmap-mdpi/ic_launcher.png (36x36)
mipmap-xhdpi/ic_launcher.png (72x72)
mipmap-xxhdpi/ic_launcher.png (96x96)
mipmap-xxxhdpi/ic_launcher.png (144x144)
```

Y también las versiones redondas:
```
mipmap-hdpi/ic_launcher_round.png (48x48)
mipmap-mdpi/ic_launcher_round.png (36x36)
mipmap-xhdpi/ic_launcher_round.png (72x72)
mipmap-xxhdpi/ic_launcher_round.png (96x96)
mipmap-xxxhdpi/ic_launcher_round.png (144x144)
```

### 4️⃣ HERRAMIENTAS ONLINE
Usa estas herramientas para generar los tamaños:
- https://romannurik.github.io/AndroidAssetStudio/
- https://makeappicon.com/
- https://appicon.co/

### 5️⃣ PASOS FINALES
1. Reemplaza todos los archivos de icono
2. Limpia el proyecto: `./gradlew clean`
3. Reconstruye: `./gradlew assembleDebug`
4. Instala la APK para probar

## 🎨 RECOMENDACIONES DE DISEÑO:
- **Fondo**: Transparente o blanco
- **Texto**: "CORE" visible y legible
- **Colores**: Naranja/marrón como en tu imagen
- **Sin bordes**: Deja espacio para el recorte automático
- **Alta resolución**: Mínimo 512x512 para buena calidad

## 🔄 RESULTADO ESPERADO:
- Icono de la app con tu diseño CORE
- Nombre de la app: "CORE APK"
- Consistente en web y Android
