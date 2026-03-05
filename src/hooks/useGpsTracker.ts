import { useState, useEffect, useCallback } from 'react';
import { Geolocation, Position } from '@capacitor/geolocation';

interface GpsCoordinates {
  lat: number;
  lon: number;
}

interface GpsTrackerState {
  currentPosition: GpsCoordinates | null;
  isGpsEnabled: boolean;
  gpsStatus: string;
  isLoading: boolean;
  error: string | null;
}

export const useGpsTracker = () => {
  const [state, setState] = useState<GpsTrackerState>({
    currentPosition: null,
    isGpsEnabled: false,
    gpsStatus: 'GPS no inicializado',
    isLoading: false,
    error: null,
  });

  // Solicitar permisos y obtener posición inicial
  const initializeGps = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Verificar si el GPS está disponible
      const permissionStatus = await Geolocation.checkPermissions();
      
      if (permissionStatus.location !== 'granted') {
        // Solicitar permisos
        const requestResult = await Geolocation.requestPermissions();
        
        if (requestResult.location !== 'granted') {
          setState(prev => ({
            ...prev,
            isLoading: false,
            gpsStatus: 'Permiso de GPS denegado',
            error: 'Se requieren permisos de GPS para usar esta función',
            isGpsEnabled: false,
          }));
          return false;
        }
      }

      // Obtener posición actual
      const position: Position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      });

      const coordinates: GpsCoordinates = {
        lat: position.coords.latitude,
        lon: position.coords.longitude,
      };

      setState(prev => ({
        ...prev,
        currentPosition: coordinates,
        isGpsEnabled: true,
        gpsStatus: 'GPS activado y funcionando',
        isLoading: false,
        error: null,
      }));

      return true;
    } catch (error) {
      console.error('Error al inicializar GPS:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        gpsStatus: 'GPS no disponible',
        error: error instanceof Error ? error.message : 'Error desconocido al obtener GPS',
        isGpsEnabled: false,
      }));
      return false;
    }
  }, []);

  // Obtener posición actual (para usar en campos específicos)
  const getCurrentPosition = useCallback(async (): Promise<GpsCoordinates | null> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const position: Position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      });

      const coordinates: GpsCoordinates = {
        lat: position.coords.latitude,
        lon: position.coords.longitude,
      };

      setState(prev => ({
        ...prev,
        currentPosition: coordinates,
        isLoading: false,
        gpsStatus: 'Ubicación obtenida correctamente',
        error: null,
      }));

      return coordinates;
    } catch (error) {
      console.error('Error al obtener posición actual:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Error al obtener posición',
        gpsStatus: 'Error al obtener ubicación',
      }));
      return null;
    }
  }, []);

  // Inicializar GPS al montar el hook
  useEffect(() => {
    initializeGps();
  }, [initializeGps]);

  return {
    ...state,
    initializeGps,
    getCurrentPosition,
  };
};
