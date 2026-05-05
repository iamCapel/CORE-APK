// Configuración adicional para optimización en Xiaomi Redmi
// Este archivo debe ser importado en index.tsx

/**
 * Detecta si la aplicación está corriendo en un dispositivo Xiaomi
 */
export const isXiaomiDevice = (): boolean => {
  const userAgent = navigator.userAgent.toLowerCase();
  return userAgent.includes('xiaomi') || 
         userAgent.includes('redmi') || 
         userAgent.includes('mi ') ||
         userAgent.includes('poco');
};

/**
 * Fuerza el modo de pantalla completa en la WebView
 */
export const enforceFullscreen = () => {
  if (typeof document !== 'undefined') {
    // Agregar clase para CSS
    document.documentElement.classList.add('fullscreen-mode');
    document.body.classList.add('fullscreen-mode');
    
    // Prevenir el comportamiento de pull-to-refresh en Xiaomi
    document.body.style.overscrollBehavior = 'none';
    document.documentElement.style.overscrollBehavior = 'none';
    
    // Optimizaciones de viewport para Xiaomi
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.setAttribute('content', 
        'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
      );
    }
  }
};

/**
 * Maneja el comportamiento del teclado en Xiaomi
 */
export const setupKeyboardBehavior = () => {
  if (typeof window !== 'undefined') {
    // Ajustar viewport cuando aparece el teclado
    window.addEventListener('resize', () => {
      // Forzar recalculo de altura
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    });
    
    // Inicializar valor de viewport height
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  }
};

/**
 * Previene el zoom accidental en Xiaomi
 */
export const preventAccidentalZoom = () => {
  if (typeof document !== 'undefined') {
    // Prevenir zoom con doble tap
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (event) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        event.preventDefault();
      }
      lastTouchEnd = now;
    }, { passive: false });
    
    // Prevenir zoom con pellizco
    document.addEventListener('gesturestart', (e) => {
      e.preventDefault();
    }, { passive: false });
    
    document.addEventListener('gesturechange', (e) => {
      e.preventDefault();
    }, { passive: false });
    
    document.addEventListener('gestureend', (e) => {
      e.preventDefault();
    }, { passive: false });
  }
};

/**
 * Optimiza el rendimiento para dispositivos Xiaomi
 */
export const optimizePerformance = () => {
  if (typeof window !== 'undefined') {
    // Habilitar aceleración por hardware
    document.body.style.transform = 'translateZ(0)';
    document.body.style.backfaceVisibility = 'hidden';
    document.body.style.perspective = '1000px';
    
    // Optimizar animaciones
    document.body.style.willChange = 'transform, opacity';
  }
};

/**
 * Configuración del theme color para MIUI
 */
export const setupMIUITheme = () => {
  if (typeof document !== 'undefined') {
    // Theme color para la barra de tareas de MIUI
    let themeColor = document.querySelector('meta[name="theme-color"]');
    if (!themeColor) {
      themeColor = document.createElement('meta');
      themeColor.setAttribute('name', 'theme-color');
      document.head.appendChild(themeColor);
    }
    themeColor.setAttribute('content', '#FF7A00');
    
    // Apple mobile web app capable (también funciona en algunos launchers de Xiaomi)
    let mobileWebApp = document.querySelector('meta[name="mobile-web-app-capable"]');
    if (!mobileWebApp) {
      mobileWebApp = document.createElement('meta');
      mobileWebApp.setAttribute('name', 'mobile-web-app-capable');
      document.head.appendChild(mobileWebApp);
    }
    mobileWebApp.setAttribute('content', 'yes');
  }
};

/**
 * Maneja la orientación de pantalla en Xiaomi
 */
export const handleOrientation = () => {
  if (typeof window !== 'undefined' && 'screen' in window && 'orientation' in window.screen) {
    // Bloquear en modo retrato si es necesario
    try {
      // @ts-ignore
      if (window.screen.orientation?.lock) {
        // @ts-ignore
        window.screen.orientation.lock('portrait').catch(() => {
          console.log('No se pudo bloquear la orientación');
        });
      }
    } catch (error) {
      console.log('API de orientación no soportada');
    }
  }
};

/**
 * Detecta y reporta características del dispositivo Xiaomi
 */
export const detectXiaomiFeatures = () => {
  const features = {
    isXiaomi: isXiaomiDevice(),
    userAgent: navigator.userAgent,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    pixelRatio: window.devicePixelRatio,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    platform: navigator.platform,
    hasNotch: window.innerHeight < window.screen.height,
    orientation: window.screen.orientation?.type || 'unknown'
  };
  
  console.log('📱 Xiaomi Device Features:', features);
  return features;
};

/**
 * Inicializa todas las optimizaciones para Xiaomi
 */
export const initXiaomiOptimizations = () => {
  console.log('🚀 Inicializando optimizaciones para Xiaomi Redmi...');
  
  // Detectar dispositivo
  const features = detectXiaomiFeatures();
  
  if (features.isXiaomi) {
    console.log('✅ Dispositivo Xiaomi detectado');
  }
  
  // Aplicar optimizaciones
  enforceFullscreen();
  setupKeyboardBehavior();
  preventAccidentalZoom();
  optimizePerformance();
  setupMIUITheme();
  handleOrientation();
  
  console.log('✅ Optimizaciones de Xiaomi aplicadas');
  
  return features;
};

// Exportar función de inicialización
export default initXiaomiOptimizations;
