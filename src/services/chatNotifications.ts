import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

/**
 * Servicio para gestionar notificaciones locales de mensajes de chat
 * Muestra notificaciones cuando llegan mensajes y el usuario no está activo en esa conversación
 */

const CHAT_NOTIFICATION_BASE_ID = 2000;
const notificationIdMap = new Map<string, number>();
let nextNotificationId = CHAT_NOTIFICATION_BASE_ID;

/**
 * Genera un ID único para cada chat
 */
function getChatNotificationId(chatId: string): number {
  if (notificationIdMap.has(chatId)) {
    return notificationIdMap.get(chatId)!;
  }
  const id = nextNotificationId++;
  notificationIdMap.set(chatId, id);
  return id;
}

/**
 * Muestra una notificación local cuando llega un mensaje nuevo
 * @param senderName Nombre del remitente
 * @param messageText Texto del mensaje
 * @param chatId ID del chat (para agrupar notificaciones)
 * @param senderPhoto URL de la foto del remitente (opcional)
 */
export async function showChatMessageNotification(
  senderName: string,
  messageText: string,
  chatId: string,
  senderPhoto?: string
): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    console.log('[ChatNotifications] Web - usando notificación del navegador');
    // En web, usar notificaciones del navegador si están disponibles
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(`💬 ${senderName}`, {
          body: truncateMessage(messageText),
          icon: senderPhoto || '/images/chat-icon.png',
          tag: chatId, // Agrupa notificaciones del mismo chat
        });
      } catch (error) {
        console.warn('[ChatNotifications] Error mostrando notificación web:', error);
      }
    }
    return;
  }

  try {
    // Verificar permisos (ya deberían estar otorgados por reminderNotifications)
    const permStatus = await LocalNotifications.checkPermissions();
    if (permStatus.display !== 'granted') {
      console.warn('[ChatNotifications] Permisos no otorgados');
      return;
    }

    const notificationId = getChatNotificationId(chatId);
    const body = truncateMessage(messageText);

    console.log('[ChatNotifications] 💬 Mostrando notificación:', {
      id: notificationId,
      sender: senderName,
      preview: body.substring(0, 30)
    });

    await LocalNotifications.schedule({
      notifications: [
        {
          id: notificationId,
          title: `💬 ${senderName}`,
          body: body,
          schedule: {
            at: new Date(Date.now() + 500), // Pequeño delay para asegurar que se muestre
            allowWhileIdle: true
          },
          sound: 'default',
          smallIcon: 'ic_stat_chat',
          largeIcon: senderPhoto,
          channelId: 'chat_messages',
          actionTypeId: 'OPEN_CHAT',
          extra: {
            type: 'chat_message',
            chatId: chatId,
            senderName: senderName,
            action: 'open_chat'
          },
          // Configuración adicional para Android
          ongoing: false,
          autoCancel: true,
        }
      ]
    });

    console.log('[ChatNotifications] ✅ Notificación programada');

  } catch (error) {
    console.error('[ChatNotifications] Error al mostrar notificación:', error);
  }
}

/**
 * Cancela todas las notificaciones de un chat específico
 * Útil cuando el usuario abre la conversación
 */
export async function cancelChatNotifications(chatId: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  try {
    const notificationId = getChatNotificationId(chatId);
    await LocalNotifications.cancel({
      notifications: [{ id: notificationId }]
    });
    console.log('[ChatNotifications] 🗑️  Notificaciones canceladas para chat:', chatId);
  } catch (error) {
    console.error('[ChatNotifications] Error al cancelar notificaciones:', error);
  }
}

/**
 * Cancela todas las notificaciones de chat
 */
export async function cancelAllChatNotifications(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  try {
    const notificationIds = Array.from(notificationIdMap.values());
    if (notificationIds.length === 0) return;

    await LocalNotifications.cancel({
      notifications: notificationIds.map(id => ({ id }))
    });
    console.log('[ChatNotifications] 🗑️  Todas las notificaciones de chat canceladas');
  } catch (error) {
    console.error('[ChatNotifications] Error al cancelar todas las notificaciones:', error);
  }
}

/**
 * Configura listeners para acciones de notificaciones de chat
 * Se debe llamar una vez al iniciar la app
 */
export function setupChatNotificationListeners(
  onChatNotificationTapped: (chatId: string, senderName: string) => void
): void {
  if (!Capacitor.isNativePlatform()) return;

  LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
    const extra = notification.notification.extra;
    
    if (extra?.type === 'chat_message' && extra?.chatId) {
      console.log('[ChatNotifications] 📱 Usuario tocó notificación de chat:', extra.chatId);
      
      // Cancelar la notificación
      cancelChatNotifications(extra.chatId);
      
      // Llamar al callback para abrir el chat
      onChatNotificationTapped(extra.chatId, extra.senderName || 'Usuario');
    }
  });

  console.log('[ChatNotifications] ✅ Listeners de notificaciones de chat configurados');
}

/**
 * Trunca el mensaje a 120 caracteres para la notificación
 */
function truncateMessage(text: string): string {
  // Manejar imágenes
  if (text.startsWith('[img]')) {
    return '📷 Imagen';
  }
  
  // Truncar texto largo
  if (text.length > 120) {
    return text.substring(0, 120) + '...';
  }
  
  return text;
}

/**
 * Verifica si se deben mostrar notificaciones para un chat específico
 * @param chatId ID del chat
 * @param isConversationOpen Si la conversación está abierta actualmente
 * @param isAppInForeground Si la app está en primer plano
 */
export function shouldShowNotification(
  chatId: string,
  isConversationOpen: boolean,
  isAppInForeground: boolean
): boolean {
  // No mostrar si el usuario está activamente viendo esa conversación
  if (isConversationOpen) {
    return false;
  }

  // En Android, siempre mostrar notificaciones incluso si la app está en primer plano
  // El usuario podría estar en otra pantalla
  return true;
}

/**
 * Solicita permisos de notificaciones si no están otorgados
 * Se puede llamar proactivamente cuando el usuario inicia un chat
 */
export async function requestChatNotificationPermissions(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    // En web, solicitar permiso del navegador
    if ('Notification' in window && Notification.permission === 'default') {
      try {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
      } catch (error) {
        console.error('[ChatNotifications] Error al solicitar permisos web:', error);
        return false;
      }
    }
    return Notification.permission === 'granted';
  }

  try {
    const permStatus = await LocalNotifications.requestPermissions();
    return permStatus.display === 'granted';
  } catch (error) {
    console.error('[ChatNotifications] Error al solicitar permisos:', error);
    return false;
  }
}
