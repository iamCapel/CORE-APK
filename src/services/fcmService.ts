import { Capacitor } from '@capacitor/core';
import { PushNotifications, Token, ActionPerformed, PushNotificationSchema } from '@capacitor/push-notifications';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

let _removeListeners: (() => void) | null = null;
let _onForegroundNotification: ((notification: PushNotificationSchema) => void) | null = null;

/**
 * Establece un callback para manejar notificaciones en primer plano.
 * Se debe llamar antes de initializePushNotifications para capturar notificaciones.
 */
export function setForegroundNotificationHandler(handler: (notification: PushNotificationSchema) => void): void {
  _onForegroundNotification = handler;
}

/**
 * Inicializa las notificaciones push para el dispositivo.
 * Solicita permiso, registra el token FCM y lo guarda en Firestore.
 */
export async function initializePushNotifications(userId: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  try {
    // Eliminar listeners anteriores si existen
    removePushListeners();

    // Solicitar permiso
    const { receive } = await PushNotifications.requestPermissions();
    if (receive !== 'granted') {
      console.warn('[FCM] Permiso de notificaciones denegado');
      return;
    }

    // Registrar en FCM
    await PushNotifications.register();

    // Guardar token cuando se recibe
    const onRegistration = async (token: Token) => {
      try {
        console.log('[FCM] Token registrado:', token.value.substring(0, 20) + '...');
        await saveFcmToken(userId, token.value);
      } catch (err) {
        console.error('[FCM] Error guardando token:', err);
      }
    };

    // Notificación recibida mientras la app está en primer plano
    const onForeground = (notification: PushNotificationSchema) => {
      try {
        console.log('[FCM] 🔔 Notificación en primer plano:', notification.title);
        // Llamar al handler personalizado si está definido
        if (_onForegroundNotification) {
          _onForegroundNotification(notification);
        }
      } catch (err) {
        console.error('[FCM] Error en foreground handler:', err);
      }
    };

    // Usuario tocó una notificación
    const onActionPerformed = (action: ActionPerformed) => {
      try {
        console.log('[FCM] Notificación tocada:', action.notification.data);
        // Aquí se puede agregar navegación al chat específico si se desea
      } catch (err) {
        console.error('[FCM] Error en action handler:', err);
      }
    };

    PushNotifications.addListener('registration', onRegistration);
    PushNotifications.addListener('registrationError', (err) => {
      console.error('[FCM] Error de registro:', err.error);
    });
    PushNotifications.addListener('pushNotificationReceived', onForeground);
    PushNotifications.addListener('pushNotificationActionPerformed', onActionPerformed);

    _removeListeners = () => {
      PushNotifications.removeAllListeners();
    };
  } catch (error) {
    console.error('[FCM] Error inicializando notificaciones push:', error);
  }
}

/**
 * Elimina todos los listeners de notificaciones push.
 */
export function removePushListeners(): void {
  if (_removeListeners) {
    _removeListeners();
    _removeListeners = null;
  }
}

/**
 * Guarda el token FCM del dispositivo en el documento del usuario en Firestore.
 */
export async function saveFcmToken(userId: string, token: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'users', userId), { fcmToken: token });
  } catch (error) {
    console.error('[FCM] Error guardando token:', error);
  }
}

/**
 * Borra el token FCM del usuario (logout).
 */
export async function clearFcmToken(userId: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'users', userId), { fcmToken: null });
  } catch (error) {
    console.error('[FCM] Error borrando token:', error);
  }
}
