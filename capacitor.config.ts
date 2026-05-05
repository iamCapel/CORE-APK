import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mopc.core',
  appName: 'MOPC Core',
  webDir: 'build',
  server: {
    androidScheme: 'https',
    // Optimización para Xiaomi Redmi y TCL
    cleartext: true,
    allowNavigation: ['*']
  },
  android: {
    // Configuración específica para Xiaomi y TCL
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
    },
    // Habilitar características de hardware
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
    // Pantalla completa y compatibilidad total
    overrideUserAgent: undefined,
    appendUserAgent: 'MOPC-Core-TCL',
    backgroundColor: '#FF7A00'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1000,
      backgroundColor: "#FF7A00",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
      // Android específico
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP"
    },
    Camera: {
      permissions: ["camera", "photos"],
      resultType: "base64",
      quality: 80,
      saveToGallery: false,
      // Optimizaciones para Xiaomi
      presentationStyle: "fullscreen",
      allowEditing: false
    },
    Geolocation: {
      permissions: ["location", "coarseLocation"],
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 5000
    },
    App: {
      appendUserAgent: "MOPC-Core/1.0 Xiaomi-Optimized"
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    },
    LocalNotifications: {
      smallIcon: "ic_stat_name",
      iconColor: "#FF7A00",
      sound: "default"
    },
    // Configuraciones adicionales para compatibilidad total
    StatusBar: {
      style: "DARK",
      backgroundColor: "#00000000",
      overlaysWebView: true,
      // Pantalla completa para TCL
      androidSystemBarStyle: "DARK"
    },
    Keyboard: {
      resize: "native",
      style: "DARK",
      resizeOnFullScreen: true
    },
    // App config para pantalla completa
    FullScreen: {
      enabled: true,
      immersive: true
    }
  }
};

export default config;
