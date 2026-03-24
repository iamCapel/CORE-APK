import { Filesystem, Directory } from '@capacitor/filesystem';

interface PhotoData {
  userName: string;
  address: string;
  latitude: number;
  longitude: number;
  timestamp: Date;
}

/**
 * Agrega marca de agua georeferenciada a una foto con tamaño de letra automático adaptativo
 */
export async function addWatermarkToPhoto(
  imageUri: string,
  data: PhotoData
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('No se pudo obtener el contexto del canvas'));
          return;
        }

        // Configurar canvas al tamaño de la imagen
        canvas.width = img.width;
        canvas.height = img.height;

        // Dibujar la imagen original
        ctx.drawImage(img, 0, 0);

        // Agregar logo MOPC como marca de agua arriba a la derecha
        const logoSize = Math.min(canvas.width * 0.08, 80); // 8% del ancho o máximo 80px
        const logoX = canvas.width - logoSize - 20; // 20px desde el borde derecho
        const logoY = 20; // 20px desde el borde superior
        
        // Dibujar círculo con gradiente para el logo MOPC
        const logoGradient = ctx.createRadialGradient(logoX + logoSize/2, logoY + logoSize/2, 0, logoX + logoSize/2, logoY + logoSize/2, logoSize/2);
        logoGradient.addColorStop(0, 'rgba(255, 140, 66, 0.9)'); // Naranja más claro
        logoGradient.addColorStop(1, 'rgba(255, 107, 0, 0.8)'); // Naranja MOPC
        
        ctx.fillStyle = logoGradient;
        ctx.beginPath();
        ctx.arc(logoX + logoSize/2, logoY + logoSize/2, logoSize/2, 0, Math.PI * 2);
        ctx.fill();
        
        // Agregar borde blanco semi-transparente
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Agregar texto "MOPC" en el centro del círculo
        ctx.fillStyle = 'white';
        ctx.font = `bold ${logoSize * 0.25}px Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;
        ctx.fillText('MOPC', logoX + logoSize/2, logoY + logoSize/2);
        
        // Resetear sombra para el resto del contenido
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        // Configuración de la marca de agua
        const padding = Math.max(20, canvas.width * 0.02); // Padding adaptativo
        const shadowBlur = 8;
        
        // Formatear datos
        const formattedDate = formatDateTime(data.timestamp);
        const formattedCoords = `${data.latitude.toFixed(6)}, ${data.longitude.toFixed(6)}`;
        
        // Textos a mostrar
        const lines = [
          data.userName,
          data.address,
          formattedCoords,
          formattedDate
        ];

        // Calcular tamaño de fuente automático basado en el ancho del canvas
        const availableWidth = canvas.width - (padding * 2);
        let fontSize = Math.min(canvas.width * 0.08, 150); // Máximo 150px o 8% del ancho
        let lineHeight = fontSize * 1.2;

        // Ajustar fontSize para que la línea más larga quepa
        ctx.font = `900 ${fontSize}px Arial, sans-serif`;
        
        // Encontrar la línea más larga
        let maxTextWidth = 0;
        for (const line of lines) {
          const textWidth = ctx.measureText(line).width;
          if (textWidth > maxTextWidth) {
            maxTextWidth = textWidth;
          }
        }

        // Si el texto más largo no cabe, reducir el fontSize
        if (maxTextWidth > availableWidth) {
          fontSize = (fontSize * availableWidth) / maxTextWidth;
          lineHeight = fontSize * 1.2;
          ctx.font = `900 ${fontSize}px Arial, sans-serif`;
        }

        // Dimensiones - Ancho completo
        const boxWidth = canvas.width; // De lado a lado
        const boxHeight = (lines.length * lineHeight) + (padding * 2);
        const boxX = 0; // Desde el borde izquierdo
        const boxY = canvas.height - boxHeight; // Parte inferior

        // Crear zona borrosa aplicando blur a la región de la imagen de fondo
        // Primero extraer la región que va a estar debajo
        const imageData = ctx.getImageData(boxX, boxY, boxWidth, boxHeight);
        
        // Aplicar blur manual simple (efecto de desenfoque)
        const blurRadius = 15;
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = boxWidth;
        tempCanvas.height = boxHeight;
        const tempCtx = tempCanvas.getContext('2d');
        if (tempCtx) {
          tempCtx.putImageData(imageData, 0, 0);
          // Aplicar filtro de blur nativo si está disponible
          tempCtx.filter = `blur(${blurRadius}px)`;
          tempCtx.drawImage(tempCanvas, 0, 0);

          // Dibujar la imagen borrosa de vuelta
          ctx.drawImage(tempCanvas, boxX, boxY);
        }

        // Dibujar capa semi-transparente encima del fondo borroso
        const gradient = ctx.createLinearGradient(boxX, boxY, boxX, boxY + boxHeight);
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0.45)'); // Más transparente
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.60)'); // Semi-transparente
        
        ctx.fillStyle = gradient;
        ctx.fillRect(boxX, boxY, boxWidth, boxHeight); // Rectángulo sin bordes redondeados

        // Resetear sombra para el texto
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = shadowBlur;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;

        // Dibujar texto con mayor grosor
        ctx.fillStyle = '#FFFFFF';
        ctx.font = `900 ${fontSize}px Arial, sans-serif`;
        ctx.textBaseline = 'top';

        lines.forEach((line, index) => {
          const textX = padding;
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
