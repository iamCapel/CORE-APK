import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mopc.core',
  appName: 'MOPC Core',
  webDir: 'build',
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#1a1a1a",
      showSpinner: true,
      splashFullScreen: true,
      splashImmersive: true
    },
    Camera: {
      permissions: ["camera", "photos"]
    },
    Geolocation: {
      permissions: ["location", "coarseLocation"]
    }
  }
};

export default config;
