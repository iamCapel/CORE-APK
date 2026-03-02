/**
 * 🔥 SERVICIO DE FIREBASE STORAGE PARA IMÁGENES
 * 
 * Este servicio maneja la subida, descarga y eliminación de imágenes
 * en Firebase Storage para los reportes.
 * 
 * ESTRUCTURA EN FIREBASE STORAGE:
 * reportes/
 *   └── DCR_2026_001/
 *       ├── dia-0/
 *       │   ├── 1707048600000_abc123.jpg
 *       │   └── 1707048660000_def456.jpg
 *       ├── dia-1/
 *       │   ├── 1707135000000_ghi789.jpg
 *       │   └── 1707135060000_jkl012.jpg
 *       └── general/
 *           └── imagen_general.jpg
 */

import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject, listAll, getMetadata } from 'firebase/storage';
import app from '../config/firebase';

const storage = getStorage(app);

/**
 * Interfaz para el resultado de subida
 */
export interface ImageUploadResult {
  /** URL de descarga de Firebase */
  url: string;
  /** Ruta completa en Firebase Storage */
  path: string;
  /** Tamaño del archivo en bytes */
  size: number;
  /** Timestamp de creación */
  timestamp: string;
}

/**
 * Opciones de compresión de imagen
 */
export interface ImageCompressionOptions {
  /** Calidad JPEG (0-1), default: 0.8 */
  quality: number;
  /** Ancho máximo en píxeles, default: 1200 */
  maxWidth: number;
  /** Alto máximo en píxeles, default: 1200 */
  maxHeight: number;
  /** Tipo de imagen de salida, default: 'image/jpeg' */
  outputType: string;
}

class FirebaseImageStorage {
  /**
   * 📤 SUBIR IMAGEN
   */
  async uploadImage(
    file: File | Blob,
    reportId: string,
    dayIndex?: number
  ): Promise<ImageUploadResult> {
    try {
      // Generar nombre único para la imagen
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(7);
      const dayPath = dayIndex !== undefined ? `dia-${dayIndex}` : 'general';
      const fileName = `${timestamp}_${randomStr}.jpg`;
      
      // Ruta en Firebase Storage: reportes/{reportId}/{dia}/{timestamp}.jpg
      const storagePath = `reportes/${reportId}/${dayPath}/${fileName}`;
      const storageRef = ref(storage, storagePath);
      
      console.log('📤 Subiendo imagen a:', storagePath);
      
      // Subir archivo
      const snapshot = await uploadBytes(storageRef, file);
      
      // Obtener URL de descarga
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      console.log('✅ Imagen subida exitosamente:', downloadURL);
      
      return {
        url: downloadURL,
        path: storagePath,
        size: snapshot.metadata.size,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Error subiendo imagen:', error);
      throw error;
    }
  }

  async uploadMultipleImages(
    files: (File | Blob)[],
    reportId: string,
    dayIndex?: number
  ): Promise<ImageUploadResult[]> {
    try {
      console.log(`📤 Subiendo ${files.length} imágenes...`);
      
      const uploadPromises = files.map(file => 
        this.uploadImage(file, reportId, dayIndex)
      );
      
      const results = await Promise.all(uploadPromises);
      
      console.log(`✅ ${results.length} imágenes subidas exitosamente`);
      
      return results;
    } catch (error) {
      console.error('❌ Error subiendo imágenes:', error);
      throw error;
    }
  }

  async compressImage(
    file: File,
    options?: Partial<ImageCompressionOptions>
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const opts: ImageCompressionOptions = {
        quality: 0.8,
        maxWidth: 1200,
        maxHeight: 1200,
        outputType: 'image/jpeg',
        ...options
      };

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calcular nuevas dimensiones manteniendo aspect ratio
        let { width, height } = img;
        
        if (width > opts.maxWidth) {
          height = (height * opts.maxWidth) / width;
          width = opts.maxWidth;
        }
        
        if (height > opts.maxHeight) {
          width = (width * opts.maxHeight) / height;
          height = opts.maxHeight;
        }

        canvas.width = width;
        canvas.height = height;

        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          if (blob) {
            console.log('🗜️ Imagen comprimida:', 
              `${Math.round(file.size / 1024)}KB → ${Math.round(blob.size / 1024)}KB`
            );
            resolve(blob);
          } else {
            reject(new Error('Error al comprimir imagen'));
          }
        }, opts.outputType, opts.quality);
      };

      img.onerror = () => reject(new Error('Error al cargar imagen para comprimir'));
      img.src = URL.createObjectURL(file);
    });
  }

  async compressAndUpload(
    file: File,
    reportId: string,
    dayIndex?: number,
    options?: Partial<ImageCompressionOptions>
  ): Promise<ImageUploadResult> {
    try {
      console.log('🗜️ Comprimiendo imagen...');
      const compressedFile = await this.compressImage(file, options);
      
      console.log('📤 Subiendo imagen comprimida...');
      const result = await this.uploadImage(compressedFile, reportId, dayIndex);
      
      console.log('✅ Imagen comprimida y subida exitosamente');
      return result;
    } catch (error) {
      console.error('❌ Error en comprimir y subir:', error);
      throw error;
    }
  }

  async getReportImages(
    reportId: string
  ): Promise<Record<string, ImageUploadResult[]>> {
    try {
      const reportPath = `reportes/${reportId}`;
      const reportRef = ref(storage, reportPath);
      
      console.log('📥 Cargando imágenes del reporte:', reportId);
      
      const result = await listAll(reportRef);
      const imagesByDay: Record<string, ImageUploadResult[]> = {};
      
      for (const folderRef of result.prefixes) {
        const dayKey = folderRef.name; // 'dia-0', 'dia-1', 'general', etc.
        const dayResult = await listAll(folderRef);
        
        const dayImages: ImageUploadResult[] = [];
        for (const itemRef of dayResult.items) {
          try {
            const url = await getDownloadURL(itemRef);
            const metadata = await getMetadata(itemRef);
            
            dayImages.push({
              url,
              path: itemRef.fullPath,
              size: metadata.size,
              timestamp: metadata.timeCreated
            });
          } catch (error) {
            console.warn('⚠️ Error cargando imagen:', itemRef.fullPath, error);
          }
        }
        
        if (dayImages.length > 0) {
          imagesByDay[dayKey] = dayImages;
        }
      }
      
      console.log(`✅ Cargadas ${Object.keys(imagesByDay).length} carpetas de imágenes`);
      return imagesByDay;
      
    } catch (error) {
      console.error('❌ Error obteniendo imágenes del reporte:', error);
      return {};
    }
  }

  async getDayImages(
    reportId: string,
    dayIndex?: number
  ): Promise<ImageUploadResult[]> {
    try {
      const dayPath = dayIndex !== undefined ? `dia-${dayIndex}` : 'general';
      const folderPath = `reportes/${reportId}/${dayPath}`;
      const folderRef = ref(storage, folderPath);
      
      console.log('📥 Cargando imágenes de:', folderPath);
      
      const result = await listAll(folderRef);
      const images: ImageUploadResult[] = [];
      
      for (const itemRef of result.items) {
        try {
          const url = await getDownloadURL(itemRef);
          const metadata = await getMetadata(itemRef);
          
          images.push({
            url,
            path: itemRef.fullPath,
            size: metadata.size,
            timestamp: metadata.timeCreated
          });
        } catch (error) {
          console.warn('⚠️ Error cargando imagen:', itemRef.fullPath, error);
        }
      }
      
      console.log(`✅ ${images.length} imágenes cargadas del ${dayPath}`);
      return images;
      
    } catch (error) {
      console.error('❌ Error cargando imágenes del día:', error);
      return [];
    }
  }

  async deleteImage(imagePath: string): Promise<void> {
    try {
      const imageRef = ref(storage, imagePath);
      await deleteObject(imageRef);
      console.log('🗑️ Imagen eliminada:', imagePath);
    } catch (error) {
      console.error('❌ Error eliminando imagen:', error);
      throw error;
    }
  }

  async deleteReportImages(reportId: string): Promise<void> {
    try {
      const reportPath = `reportes/${reportId}`;
      const reportRef = ref(storage, reportPath);
      
      console.log('🗑️ Eliminando todas las imágenes del reporte:', reportId);
      
      const result = await listAll(reportRef);
      
      for (const folderRef of result.prefixes) {
        const folderResult = await listAll(folderRef);
        
        for (const itemRef of folderResult.items) {
          await deleteObject(itemRef);
        }
      }
      
      console.log('✅ Todas las imágenes del reporte eliminadas');
    } catch (error) {
      console.error('❌ Error eliminando imágenes del reporte:', error);
      throw error;
    }
  }
}

export const firebaseImageStorage = new FirebaseImageStorage();
export default firebaseImageStorage;