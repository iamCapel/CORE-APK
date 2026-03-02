/*
 * useReportImagesFirebase - Hook mejorado para manejo de imágenes con Firebase
 * Extiende useReportImagesWeb con integración a Firebase Storage
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import firebaseImageStorage, { ImageUploadResult } from '../services/firebaseImageStorage';

export interface ImageData {
  id: string;
  uri: string;
  url?: string;
  path?: string;
  fecha: string;
  timestamp: number;
  size?: number;
  gps?: { lat: number; lon: number };
  address?: string;
  userName?: string;
  tipoIntervencion?: string;
}

const getAddressFromCoordinates = async (lat: number, lon: number): Promise<string> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
      { headers: { 'Accept-Language': 'es' } }
    );
    const data = await response.json();
    if (data.address) {
      const parts: string[] = [];
      if (data.address.road) parts.push(data.address.road);
      if (data.address.suburb || data.address.neighbourhood) parts.push(data.address.suburb || data.address.neighbourhood);
      if (data.address.city || data.address.town || data.address.village) parts.push(data.address.city || data.address.town || data.address.village);
      if (data.address.state) parts.push(data.address.state);
      return parts.join(', ') || data.display_name;
    }
    return `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
  } catch (error) {
    console.error('Error obteniendo dirección:', error);
    return `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
  }
};

const addWatermarkToImage = async (
  imageUri: string,
  gpsData?: { lat: number; lon: number },
  address?: string,
  userName?: string,
  tipoIntervencion?: string
): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(imageUri); return; }
        const maxWidth = 1920; const maxHeight = 1080;
        let width = img.width; let height = img.height;
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.floor(width * ratio); height = Math.floor(height * ratio);
        }
        canvas.width = width; canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        const fontSize = Math.max(14, Math.floor(width / 48));
        const padding = fontSize * 0.8;
        const lineHeight = fontSize * 1.5;
        // Orden: tipo de intervención, dirección, coordenadas, usuario, fecha/hora
        let lines: string[] = [];
        if (tipoIntervencion) lines.push(`🔨 ${tipoIntervencion}`);
        if (address) {
          // Dirección puede ser larga, dividir en varias líneas si es necesario
          const maxW = width * 0.7;
          const words = address.split(' ');
          let line = '';
          for (let i = 0; i < words.length; i++) {
            const testLine = line + words[i] + ' ';
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxW && i > 0) {
              lines.push(`🏠 ${line.trim()}`);
              line = words[i] + ' ';
            } else {
              line = testLine;
            }
          }
          if (line) lines.push(`🏠 ${line.trim()}`);
        }
        if (gpsData) lines.push(`📍 ${gpsData.lat.toFixed(6)}, ${gpsData.lon.toFixed(6)}`);
        if (userName) lines.push(`👤 ${userName}`);
        const now = new Date();
        const dateStr = now.toLocaleDateString('es-DO', { year: 'numeric', month: '2-digit', day: '2-digit' });
        const timeStr = now.toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        lines.push(`📅 ${dateStr} | ⏰ ${timeStr}`);
        // Calcular altura del fondo
        const bgHeight = lineHeight * lines.length + padding * 2;
        // Fondo oscuro y transparente en la parte inferior izquierda
        ctx.save();
        ctx.globalAlpha = 1;
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.beginPath();
        ctx.moveTo(0, height - bgHeight);
        ctx.lineTo(width * 0.75, height - bgHeight);
        ctx.lineTo(width * 0.75, height);
        ctx.lineTo(0, height);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        // Texto blanco
        ctx.fillStyle = 'white';
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.textBaseline = 'top';
        let yPos = height - bgHeight + padding;
        for (const text of lines) {
          ctx.fillText(text, padding, yPos);
          yPos += lineHeight;
        }
        const finalImage = canvas.toDataURL('image/jpeg', 0.8);
        resolve(finalImage);
      } catch (error) {
        console.error('Error aplicando watermark:', error);
        resolve(imageUri);
      }
    };
    img.onerror = () => { console.error('Error cargando imagen para watermark'); resolve(imageUri); };
    img.src = imageUri;
  });
};

const dataURLtoFile = (dataURL: string, filename: string): File => {
  const arr = dataURL.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]); let n = bstr.length; const u8arr = new Uint8Array(n);
  while (n--) { u8arr[n] = bstr.charCodeAt(n); }
  return new File([u8arr], filename, { type: mime });
};

interface UseReportImagesFirebaseReturn {
  images: Record<string, ImageData[]>;
  imagesByDay: Record<string, ImageData[]>;
  currentDayImages: ImageData[];
  isLoading: boolean;
  canAddMore: boolean;
  imageCount: number;
  uploadProgress: number;
  currentDay: string;
  addImage: (uri: string, gpsData?: { lat: number; lon: number }, extraInfo?: { userName?: string; tipoIntervencion?: string }) => Promise<void>;
  addImageFromGallery: (extraInfo?: { userName?: string; tipoIntervencion?: string }) => Promise<void>;
  removeImage: (imageId: string) => Promise<void>;
  loadImages: (imagesToLoad?: Record<string, any>) => Promise<void>;
  clearAllImages: () => Promise<void>;
  getDayImages: (fecha: string) => ImageData[];
  setCurrentDay: (dayKey: string) => void;
  syncToFirebase: () => Promise<void>;
  loadFromFirebase: () => Promise<void>;
}

export const useReportImagesFirebase = (
  reportId: string,
  currentDay: string,
  maxImagesPerDay: number = 2
): UseReportImagesFirebaseReturn => {
  const [imagesByDay, setImagesByDay] = useState<Record<string, ImageData[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentDayKey, setCurrentDayKey] = useState(currentDay);

  const storageKey = `mopc_report_images_${reportId}`;

  const currentDayImages = useMemo(() => imagesByDay[currentDayKey] || [], [imagesByDay, currentDayKey]);
  const imageCount = currentDayImages.length;
  const canAddMore = imageCount < maxImagesPerDay;
  const images = imagesByDay;

  useEffect(() => { setCurrentDayKey(currentDay); }, [currentDay]);

  const getDayIndex = (dayKey: string): number | undefined => {
    const dateMatch = dayKey.match(/^\d{4}-\d{2}-\d{2}$/);
    if (dateMatch) {
      let hash = 0; for (let i = 0; i < dayKey.length; i++) { const char = dayKey.charCodeAt(i); hash = ((hash << 5) - hash) + char; hash = hash & hash; }
      return Math.abs(hash) % 1000;
    }
    if (dayKey.startsWith('dia-')) return parseInt(dayKey.replace('dia-', ''));
    return undefined;
  };

  useEffect(() => { loadImages(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [reportId]);

  const saveToStorage = useCallback((imgs: Record<string, ImageData[]>) => {
    try { localStorage.setItem(storageKey, JSON.stringify(imgs)); } catch (error) { console.error('Error guardando imágenes en localStorage:', error); }
  }, [storageKey]);

  const loadFromFirebase = useCallback(async () => {
    if (!reportId || reportId === 'temp-report') return;
    try {
      console.log('📥 Cargando imágenes desde Firebase:', reportId);
      const firebaseImages = await firebaseImageStorage.getReportImages(reportId);
      if (Object.keys(firebaseImages).length === 0) { console.log('ℹ️ No hay imágenes en Firebase para este reporte'); return; }
      const convertedImages: Record<string, ImageData[]> = {};
      for (const [dayKey, firebaseImgs] of Object.entries(firebaseImages)) {
        convertedImages[dayKey] = firebaseImgs.map((fbImg, index) => ({
          id: `firebase_${dayKey}_${index}`,
          uri: fbImg.url,
          url: fbImg.url,
          path: fbImg.path,
          fecha: dayKey,
          timestamp: fbImg.timestamp ? new Date(fbImg.timestamp).getTime() : Date.now(),
          size: fbImg.size
        }));
      }
      setImagesByDay(convertedImages);
      saveToStorage(convertedImages);
      console.log('✅ Imágenes cargadas desde Firebase:', convertedImages);
    } catch (error) { console.warn('⚠️ No se pudieron cargar imágenes desde Firebase:', error); }
  }, [reportId, saveToStorage]);

  const loadImages = useCallback(async (imagesToLoad?: Record<string, any>) => {
    try {
      setIsLoading(true);
      if (imagesToLoad) {
        console.log('📥 Cargando imágenes proporcionadas:', imagesToLoad);
        const processedImages: Record<string, ImageData[]> = {};
        for (const [dayKey, dayImages] of Object.entries(imagesToLoad)) {
          if (Array.isArray(dayImages)) {
            processedImages[dayKey] = dayImages.map((img: any, index: number) => ({
              id: img.id || `loaded_${dayKey}_${index}`,
              uri: img.uri || img.url || img,
              url: img.url,
              path: img.path,
              fecha: dayKey,
              timestamp: img.timestamp || Date.now(),
              size: img.size,
              gps: img.gps,
              address: img.address,
              userName: img.userName,
              tipoIntervencion: img.tipoIntervencion
            }));
          }
        }
        setImagesByDay(processedImages);
        saveToStorage(processedImages);
      } else {
        await loadFromFirebase();
        if (Object.keys(imagesByDay).length === 0) {
          const stored = localStorage.getItem(storageKey);
          if (stored) { const parsed = JSON.parse(stored); setImagesByDay(parsed); console.log('📥 Imágenes cargadas desde localStorage:', parsed); }
        }
      }
    } catch (error) { console.error('Error cargando imágenes:', error); }
    finally { setIsLoading(false); }
  }, [storageKey, loadFromFirebase, imagesByDay, saveToStorage]);

  const addImage = useCallback(async (uri: string, gpsData?: { lat: number; lon: number }, extraInfo?: { userName?: string; tipoIntervencion?: string }) => {
    if (!canAddMore) { alert(`Máximo ${maxImagesPerDay} imágenes por día`); return; }
    try {
      setIsLoading(true); setUploadProgress(10);
      let address: string | undefined;
      if (gpsData) { address = await getAddressFromCoordinates(gpsData.lat, gpsData.lon); setUploadProgress(20); }
      const watermarkedUri = await addWatermarkToImage(uri, gpsData, address, extraInfo?.userName, extraInfo?.tipoIntervencion);
      setUploadProgress(40);
      const dayIndex = getDayIndex(currentDay);
      let firebaseResult: ImageUploadResult | null = null;
      try {
        const imageFile = dataURLtoFile(watermarkedUri, `image_${Date.now()}.jpg`);
        firebaseResult = await firebaseImageStorage.compressAndUpload(imageFile, reportId, dayIndex);
        setUploadProgress(80);
        console.log('🔥 Imagen subida a Firebase:', firebaseResult);
      } catch (firebaseError) { console.warn('⚠️ No se pudo subir a Firebase, guardando solo localmente:', firebaseError); }

      const newImage: ImageData = {
        id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        uri: watermarkedUri,
        url: firebaseResult?.url,
        path: firebaseResult?.path,
        fecha: currentDay,
        timestamp: Date.now(),
        size: firebaseResult?.size,
        gps: gpsData,
        address: address,
        userName: extraInfo?.userName,
        tipoIntervencion: extraInfo?.tipoIntervencion
      };

      const newImages = { ...imagesByDay, [currentDayKey]: [...currentDayImages, newImage] };
      setImagesByDay(newImages); saveToStorage(newImages); setUploadProgress(100);
      console.log('✅ Imagen agregada:', newImage);
    } catch (error) { console.error('❌ Error agregando imagen:', error); alert('Error al procesar la imagen'); }
    finally { setIsLoading(false); setTimeout(() => setUploadProgress(0), 1000); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportId, currentDayKey, imagesByDay, currentDayImages, canAddMore, maxImagesPerDay, saveToStorage]);

  const addImageFromGallery = useCallback(async (extraInfo?: { userName?: string; tipoIntervencion?: string }) => {
    return new Promise<void>((resolve) => {
      const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*'; input.multiple = false;
      input.onchange = async (e: Event) => {
        const target = e.target as HTMLInputElement; const file = target.files?.[0];
        if (file) {
          const reader = new FileReader(); reader.onload = async (event) => { const uri = event.target?.result as string; await addImage(uri, undefined, extraInfo); resolve(); }; reader.readAsDataURL(file);
        } else { resolve(); }
      };
      input.click();
    });
  }, [addImage]);

  const removeImage = useCallback(async (imageId: string) => {
    try {
      let imageToRemove: ImageData | null = null; let dayToRemove: string | null = null;
      for (const [day, dayImages] of Object.entries(imagesByDay)) { const found = dayImages.find(img => img.id === imageId); if (found) { imageToRemove = found; dayToRemove = day; break; } }
      if (!imageToRemove || !dayToRemove) return;
      if (imageToRemove.path) { try { await firebaseImageStorage.deleteImage(imageToRemove.path); console.log('🗑️ Imagen eliminada de Firebase:', imageToRemove.path); } catch (error) { console.warn('⚠️ No se pudo eliminar de Firebase:', error); } }
      const newImages = { ...imagesByDay, [dayToRemove]: imagesByDay[dayToRemove].filter(img => img.id !== imageId) };
      setImagesByDay(newImages); saveToStorage(newImages); console.log('✅ Imagen eliminada:', imageId);
    } catch (error) { console.error('❌ Error eliminando imagen:', error); }
  }, [imagesByDay, saveToStorage]);

  const clearAllImages = useCallback(async () => {
    try {
      if (reportId && reportId !== 'temp-report') { try { await firebaseImageStorage.deleteReportImages(reportId); console.log('🗑️ Todas las imágenes eliminadas de Firebase'); } catch (error) { console.warn('⚠️ No se pudieron eliminar todas las imágenes de Firebase:', error); } }
      setImagesByDay({}); localStorage.removeItem(storageKey); console.log('🧹 Todas las imágenes eliminadas');
    } catch (error) { console.error('❌ Error eliminando todas las imágenes:', error); }
  }, [reportId, storageKey]);

  const getDayImages = useCallback((fecha: string): ImageData[] => { return imagesByDay[fecha] || []; }, [imagesByDay]);

  const syncToFirebase = useCallback(async () => {
    if (!reportId || reportId === 'temp-report') return;
    try {
      console.log('🔄 Sincronizando imágenes a Firebase...');
      for (const [dayKey, dayImages] of Object.entries(imagesByDay)) {
        for (const img of dayImages) {
          if (!img.url && img.uri) {
            try {
              const dayIndex = getDayIndex(dayKey);
              const imageFile = dataURLtoFile(img.uri, `sync_${img.id}.jpg`);
              const result = await firebaseImageStorage.compressAndUpload(imageFile, reportId, dayIndex);
              img.url = result.url; img.path = result.path; img.size = result.size; console.log('✅ Imagen sincronizada:', img.id);
            } catch (error) { console.warn('⚠️ Error sincronizando imagen:', img.id, error); }
          }
        }
      }
      setImagesByDay({...imagesByDay}); saveToStorage(imagesByDay); console.log('🔄 Sincronización completada');
    } catch (error) { console.error('❌ Error en sincronización:', error); }
  }, [reportId, imagesByDay, saveToStorage]);

  return {
    images,
    imagesByDay,
    currentDayImages,
    isLoading,
    canAddMore,
    imageCount,
    uploadProgress,
    addImage,
    addImageFromGallery,
    removeImage,
    loadImages,
    clearAllImages,
    getDayImages,
    syncToFirebase,
    loadFromFirebase,
    setCurrentDay: setCurrentDayKey,
    currentDay: currentDayKey
  };
};

export default useReportImagesFirebase;
