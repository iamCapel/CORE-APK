/**
 * Servicio para agregar marca de agua georeferenciada a fotografías
 * Incluye: nombre de usuario, dirección, coordenadas y fecha/hora
 */

export interface WatermarkData {
  userName: string;
  address: string;
  latitude: number;
  longitude: number;
  timestamp: Date;
}

/**
 * Agrega una marca de agua con información georeferenciada a una imagen
 * @param imageUri URI o base64 de la imagen original
 * @param data Datos para la marca de agua
 * @returns Promise con la URI de la imagen con marca de agua en formato base64
 */
export async function addWatermarkToPhoto(
  imageUri: string,
  data: WatermarkData
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        // Crear canvas con las dimensiones de la imagen
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('No se pudo obtener el contexto del canvas'));
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;

        // Dibujar la imagen original
        ctx.drawImage(img, 0, 0);

        // Configuración de la marca de agua
        const padding = 20;
        const lineHeight = 28;
        const fontSize = 22;
        const shadowBlur = 15;
        
        // Formatear la fecha
        const formattedDate = formatDateTime(data.timestamp);
        const formattedCoords = `${data.latitude.toFixed(6)}, ${data.longitude.toFixed(6)}`;
        
        // Textos a mostrar
        const lines = [
          data.userName,
          data.address,
          formattedCoords,
          formattedDate
        ];

        // Calcular dimensiones del cuadro de texto
        ctx.font = `bold ${fontSize}px Arial, sans-serif`;
        const maxWidth = Math.max(...lines.map(line => ctx.measureText(line).width));
        const boxWidth = maxWidth + (padding * 2);
        const boxHeight = (lines.length * lineHeight) + (padding * 2);

        // Posición en la esquina inferior izquierda
        const boxX = 15;
        const boxY = canvas.height - boxHeight - 15;

        // Dibujar sombra ahumada oscura (fondo semi-transparente)
        const gradient = ctx.createLinearGradient(boxX, boxY, boxX, boxY + boxHeight);
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0.75)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.85)');
        
        ctx.fillStyle = gradient;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
        ctx.shadowBlur = shadowBlur;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 3;
        
        // Dibujar rectángulo con bordes redondeados
        roundRect(ctx, boxX, boxY, boxWidth, boxHeight, 8);
        ctx.fill();

        // Resetear sombra para el texto
        ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;

        // Dibujar texto
        ctx.fillStyle = '#FFFFFF';
        ctx.font = `bold ${fontSize}px Arial, sans-serif`;
        ctx.textBaseline = 'top';

        lines.forEach((line, index) => {
          const textX = boxX + padding;
          const textY = boxY + padding + (index * lineHeight);
          ctx.fillText(line, textX, textY);
        });

        // Convertir canvas a base64
        const watermarkedImage = canvas.toDataURL('image/jpeg', 0.95);
        resolve(watermarkedImage);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Error al cargar la imagen'));
    };

    // Cargar la imagen
    img.src = imageUri;
  });
}

/**
 * Dibuja un rectángulo con bordes redondeados
 */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/**
 * Formatea fecha y hora en formato legible
 */
function formatDateTime(date: Date): string {
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const dayName = days[date.getDay()];
  const day = date.getDate();
  const monthName = months[date.getMonth()];
  const year = date.getFullYear();
  
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${dayName}, ${day} de ${monthName} de ${year} - ${hours}:${minutes}:${seconds}`;
}

/**
 * Convierte una URI de imagen a base64
 */
export async function imageUriToBase64(uri: string): Promise<string> {
  return new Promise((resolve, reject) => {
    fetch(uri)
      .then(response => response.blob())
      .then(blob => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      })
      .catch(reject);
  });
}

/**
 * Guarda una imagen base64 en el sistema de archivos usando Capacitor
 */
export async function savePhotoToGallery(
  base64Data: string,
  fileName: string
): Promise<void> {
  try {
    // Para Capacitor, usamos el plugin de Filesystem
    const { Filesystem, Directory } = await import('@capacitor/filesystem');
    
    // Remover el prefijo "data:image/jpeg;base64," si existe
    const base64 = base64Data.replace(/^data:image\/\w+;base64,/, '');
    
    // Guardar en el directorio de fotos
    await Filesystem.writeFile({
      path: fileName,
      data: base64,
      directory: Directory.Documents // o Directory.External para galería
    });
    
    console.log('Foto guardada exitosamente:', fileName);
  } catch (error) {
    console.error('Error al guardar foto:', error);
    throw error;
  }
}
