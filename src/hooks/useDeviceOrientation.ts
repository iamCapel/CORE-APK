import { useState, useEffect } from 'react';

export type DeviceOrientation = 'portrait' | 'landscape-left' | 'landscape-right';

export interface OrientationData {
  orientation: DeviceOrientation;
  angle: number;
}

/**
 * Hook para detectar la orientación del dispositivo
 * Usa la API nativa de Screen Orientation para detectar cambios
 */
export const useDeviceOrientation = (): OrientationData => {
  const [orientationData, setOrientationData] = useState<OrientationData>(() => {
    return getOrientationData();
  });

  useEffect(() => {
    const handleOrientationChange = () => {
      setOrientationData(getOrientationData());
    };

    // Escuchar cambios de orientación usando la API de Screen Orientation
    if (window.screen?.orientation) {
      window.screen.orientation.addEventListener('change', handleOrientationChange);
    }

    // Fallback usando evento orientationchange
    window.addEventListener('orientationchange', handleOrientationChange);
    
    // También escuchar cambios de tamaño de ventana
    window.addEventListener('resize', handleOrientationChange);

    return () => {
      if (window.screen?.orientation) {
        window.screen.orientation.removeEventListener('change', handleOrientationChange);
      }
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleOrientationChange);
    };
  }, []);

  return orientationData;
};

/**
 * Obtiene los datos actuales de orientación del dispositivo
 */
function getOrientationData(): OrientationData {
  let angle = 0;
  let orientation: DeviceOrientation = 'portrait';

  // Primero intentar con Screen Orientation API (más moderno y preciso)
  if (window.screen?.orientation) {
    const type = window.screen.orientation.type;
    angle = window.screen.orientation.angle;

    if (type.includes('landscape-primary')) {
      orientation = 'landscape-right';
    } else if (type.includes('landscape-secondary')) {
      orientation = 'landscape-left';
    } else {
      orientation = 'portrait';
    }
  } 
  // Fallback a window.orientation (API antigua pero ampliamente soportada)
  else if (typeof window.orientation !== 'undefined') {
    angle = window.orientation;
    
    if (angle === 90) {
      orientation = 'landscape-right';
    } else if (angle === -90 || angle === 270) {
      orientation = 'landscape-left';
    } else {
      orientation = 'portrait';
    }
  }
  // Último fallback: usar dimensiones de la ventana
  else {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    if (width > height) {
      // Asumimos landscape-right por defecto
      orientation = 'landscape-right';
      angle = 90;
    } else {
      orientation = 'portrait';
      angle = 0;
    }
  }

  return { orientation, angle };
}

/**
 * Obtiene la orientación actual del dispositivo de forma imperativa
 * (sin necesidad de usar como hook)
 */
export const getCurrentOrientation = (): OrientationData => {
  return getOrientationData();
};

/**
 * Obtiene la rotación CSS necesaria para compensar la orientación
 */
export const getRotationTransform = (orientation: DeviceOrientation): string => {
  switch (orientation) {
    case 'landscape-right':
      return 'rotate(90deg)';
    case 'landscape-left':
      return 'rotate(-90deg)';
    case 'portrait':
    default:
      return 'rotate(0deg)';
  }
};

/**
 * Obtiene el ángulo de rotación en grados
 */
export const getRotationAngle = (orientation: DeviceOrientation): number => {
  switch (orientation) {
    case 'landscape-right':
      return 90;
    case 'landscape-left':
      return -90;
    case 'portrait':
    default:
      return 0;
  }
};
