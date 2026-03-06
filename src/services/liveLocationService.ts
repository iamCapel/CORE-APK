import { Geolocation, Position } from '@capacitor/geolocation';

interface LiveLocationData {
  deviceId: string;
  username: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  accuracy: number;
  altitude?: number;
  speed?: number;
  heading?: number;
}

class LiveLocationService {
  private static instance: LiveLocationService;
  private trackingInterval: NodeJS.Timeout | null = null;
  private isTracking = false;

  private constructor() {}

  static getInstance(): LiveLocationService {
    if (!LiveLocationService.instance) {
      LiveLocationService.instance = new LiveLocationService();
    }
    return LiveLocationService.instance;
  }

  // Generar ID único para el dispositivo
  private generateDeviceId(): string {
    const stored = localStorage.getItem('device_id');
    if (stored) {
      return stored;
    }
    
    const deviceId = 'device_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    localStorage.setItem('device_id', deviceId);
    return deviceId;
  }

  // Iniciar tracking en vivo
  async startLiveTracking(username: string): Promise<void> {
    if (this.isTracking) {
      console.log('📍 Live tracking ya está activo');
      return;
    }

    try {
      console.log('📍 Iniciando live tracking para usuario:', username);
      
      // Verificar permisos de GPS
      const permissionStatus = await Geolocation.checkPermissions();
      if (permissionStatus.location !== 'granted') {
        const requestResult = await Geolocation.requestPermissions();
        if (requestResult.location !== 'granted') {
          throw new Error('Permisos de GPS denegados');
        }
      }

      this.isTracking = true;
      const deviceId = this.generateDeviceId();

      // Iniciar tracking constante
      this.trackingInterval = setInterval(async () => {
        try {
          const position: Position = await Geolocation.getCurrentPosition({
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 5000, // Aceptar posición de hasta 5 segundos
          });

          const locationData: LiveLocationData = {
            deviceId,
            username,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            timestamp: new Date().toISOString(),
            accuracy: position.coords.accuracy || 0,
            altitude: position.coords.altitude || undefined,
            speed: position.coords.speed || undefined,
            heading: position.coords.heading || undefined
          };

          // Enviar a la plataforma central
          await this.sendLocationToPlatform(locationData);
          
          console.log('📍 Ubicación enviada:', {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: locationData.timestamp
          });

        } catch (error) {
          console.error('❌ Error obteniendo ubicación:', error);
        }
      }, 5000); // Enviar cada 5 segundos

      console.log('✅ Live tracking iniciado exitosamente');
      
    } catch (error) {
      console.error('❌ Error iniciando live tracking:', error);
      throw error;
    }
  }

  // Detener tracking en vivo
  stopLiveTracking(): void {
    if (!this.isTracking) {
      console.log('📍 Live tracking no está activo');
      return;
    }

    console.log('📍 Deteniendo live tracking');
    this.isTracking = false;

    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
      this.trackingInterval = null;
    }

    console.log('✅ Live tracking detenido');
  }

  // Enviar datos de ubicación a la plataforma central
  private async sendLocationToPlatform(locationData: LiveLocationData): Promise<void> {
    try {
      // Aquí puedes implementar el envío a tu plataforma central
      // Por ejemplo: Firebase, WebSocket, API REST, etc.
      
      // Opción 1: Firebase Realtime Database
      // await this.sendToFirebase(locationData);
      
      // Opción 2: API REST
      await this.sendToApi(locationData);
      
      console.log('📡 Datos de ubicación enviados a plataforma central:', locationData);
      
    } catch (error) {
      console.error('❌ Error enviando ubicación a plataforma:', error);
    }
  }

  // Enviar a Firebase Realtime Database
  private async sendToFirebase(locationData: LiveLocationData): Promise<void> {
    // Importar dinámicamente para evitar dependencias circulares
    const { getDatabase, ref, push, set } = await import('firebase/database');
    
    const database = getDatabase();
    const locationsRef = ref(database, 'live_locations');
    
    // Crear referencia única para este dispositivo/usuario
    const userDeviceRef = push(locationsRef, {
      ...locationData,
      deviceInfo: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        timestamp: new Date().toISOString()
      }
    });

    console.log('📡 Ubicación guardada en Firebase Realtime:', userDeviceRef.key);
  }

  // Enviar a API REST (fallback)
  private async sendToApi(locationData: LiveLocationData): Promise<void> {
    try {
      const response = await fetch('https://tu-api-central.com/api/live-location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify(locationData)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('📡 Ubicación enviada por API:', result);
      
    } catch (error) {
      console.warn('⚠️ Error en API REST (puede estar offline):', error);
      // No lanzar error para que continue con Firebase
    }
  }

  // Obtener token de autenticación
  private getAuthToken(): string {
    const user = localStorage.getItem('mopc_user');
    if (user) {
      const userData = JSON.parse(user);
      return userData.authToken || userData.token || '';
    }
    return '';
  }

  // Obtener estado actual del tracking
  getTrackingStatus(): { isTracking: boolean; lastLocation?: LiveLocationData } {
    return {
      isTracking: this.isTracking,
      lastLocation: this.getLastKnownLocation()
    };
  }

  // Obtener última ubicación conocida
  private getLastKnownLocation(): LiveLocationData | undefined {
    const stored = localStorage.getItem('last_known_location');
    return stored ? JSON.parse(stored) : undefined;
  }

  // Guardar última ubicación conocida
  private setLastKnownLocation(locationData: LiveLocationData): void {
    localStorage.setItem('last_known_location', JSON.stringify(locationData));
  }

  // Obtener lista de dispositivos activos (desde Firebase)
  async getActiveDevices(): Promise<LiveLocationData[]> {
    try {
      const { getDatabase, ref, onValue } = await import('firebase/database');
      const database = getDatabase();
      const activeDevicesRef = ref(database, 'active_devices');
      
      return new Promise((resolve) => {
        onValue(activeDevicesRef, (snapshot: any) => {
          const devices: LiveLocationData[] = [];
          snapshot.forEach((childSnapshot: any) => {
            const deviceData = childSnapshot.val() as LiveLocationData;
            if (deviceData && deviceData.timestamp) {
              // Solo incluir dispositivos con actividad reciente (últimos 5 minutos)
              const deviceAge = Date.now() - new Date(deviceData.timestamp).getTime();
              if (deviceAge < 5 * 60 * 1000) { // 5 minutos
                devices.push(deviceData);
              }
            }
          });
          resolve(devices);
        });
      });
      
    } catch (error) {
      console.error('❌ Error obteniendo dispositivos activos:', error);
      return [];
    }
  }

  // Limpiar datos antiguos
  async cleanupOldLocations(): Promise<void> {
    try {
      const { getDatabase, ref, onValue, remove } = await import('firebase/database');
      const database = getDatabase();
      const locationsRef = ref(database, 'live_locations');
      
      // Obtener todas las ubicaciones
      const snapshot = await new Promise<any>((resolve) => {
        onValue(locationsRef, resolve, { onlyOnce: true });
      });
      
      const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 horas
      
      snapshot.forEach((childSnapshot: any) => {
        const locationData = childSnapshot.val() as LiveLocationData;
        if (locationData && locationData.timestamp) {
          const locationTime = new Date(locationData.timestamp).getTime();
          if (locationTime < cutoffTime) {
            remove(childSnapshot.ref);
            console.log('🗑️ Ubicación antigua eliminada:', locationData.timestamp);
          }
        }
      });
      
    } catch (error) {
      console.error('❌ Error limpiando ubicaciones antiguas:', error);
    }
  }
}

export default LiveLocationService;
