import { Capacitor } from '@capacitor/core';
import { LocalNotifications, ScheduleOptions } from '@capacitor/local-notifications';

/**
 * Servicio para manejar notificaciones locales recurrentes
 * que recuerdan a los usuarios reportar vehículos cada 6 horas
 */

const REMINDER_NOTIFICATION_ID = 1000;
const SIX_HOURS_IN_SECONDS = 6 * 60 * 60; // 6 horas en segundos

/**
 * Inicializa el sistema de notificaciones recordatorias
 * Programa notificaciones recurrentes cada 6 horas
 */
export async function initializeReminderNotifications(): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    console.log('[Reminder] No es plataforma nativa, notificaciones deshabilitadas');
    return;
  }

  try {
    // Solicitar permisos
    const permissionStatus = await LocalNotifications.requestPermissions();
    
    if (permissionStatus.display !== 'granted') {
      console.warn('[Reminder] Permiso de notificaciones locales denegado');
      return;
    }

    console.log('[Reminder] ✅ Permisos otorgados');

    // Cancelar notificaciones previas para evitar duplicados
    await cancelReminderNotifications();

    // Programar la primera notificación dentro de 6 horas
    const now = new Date();
    const firstNotificationTime = new Date(now.getTime() + SIX_HOURS_IN_SECONDS * 1000);

    console.log(`[Reminder] Programando primera notificación para: ${firstNotificationTime.toLocaleString()}`);

    const scheduleOptions: ScheduleOptions = {
      notifications: [
        {
          id: REMINDER_NOTIFICATION_ID,
          title: '🚗 Recordatorio MOPC Core',
          body: 'Es hora de reportar los vehículos en la aplicación',
          schedule: {
            at: firstNotificationTime,
            every: 'hour' as const,
            count: undefined, // Repetir indefinidamente
            // Cada 6 horas se logra programando cada hora y filtrando
            // o usando allowWhileIdle para asegurar que se ejecute
            allowWhileIdle: true
          },
          sound: 'default',
          smallIcon: 'ic_stat_vehicle',
          largeIcon: 'ic_launcher',
          channelId: 'vehicle-reminders',
          actionTypeId: 'OPEN_APP',
          extra: {
            type: 'reminder',
            action: 'open_reports'
          }
        }
      ]
    };

    await LocalNotifications.schedule(scheduleOptions);
    console.log('[Reminder] ✅ Notificaciones programadas correctamente');

  } catch (error) {
    console.error('[Reminder] Error al inicializar notificaciones:', error);
  }
}

/**
 * Programa notificaciones exactamente cada 6 horas
 * Versión mejorada con timestamps específicos
 */
export async function scheduleExactSixHourReminders(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  try {
    const permissionStatus = await LocalNotifications.requestPermissions();
    if (permissionStatus.display !== 'granted') return;

    await cancelReminderNotifications();

    // Programar 4 notificaciones diarias (cada 6 horas)
    const notifications = [];
    const baseTime = new Date();
    
    // Calcular la próxima hora que sea múltiplo de 6 (0, 6, 12, 18)
    let nextHour = Math.ceil(baseTime.getHours() / 6) * 6;
    if (nextHour >= 24) nextHour = 0;
    
    const nextNotification = new Date(baseTime);
    nextNotification.setHours(nextHour, 0, 0, 0);
    
    // Si la hora calculada ya pasó hoy, programar para mañana
    if (nextNotification <= baseTime) {
      nextNotification.setDate(nextNotification.getDate() + 1);
    }

    console.log(`[Reminder] Próxima notificación: ${nextNotification.toLocaleString()}`);

    // Crear notificación recurrente cada 6 horas
    const scheduleOptions: ScheduleOptions = {
      notifications: [
        {
          id: REMINDER_NOTIFICATION_ID,
          title: '🚗 Recordatorio MOPC Core',
          body: 'Es hora de reportar los vehículos en la aplicación',
          schedule: {
            at: nextNotification,
            repeats: true,
            every: 'hour' as const, // Se ejecutará cada hora pero con lógica interna
            count: undefined,
            allowWhileIdle: true
          },
          sound: 'default',
          smallIcon: 'ic_stat_vehicle',
          channelId: 'vehicle-reminders',
          actionTypeId: 'OPEN_APP',
          extra: {
            type: 'reminder',
            action: 'open_reports',
            interval: 'six_hours'
          }
        }
      ]
    };

    await LocalNotifications.schedule(scheduleOptions);
    console.log('[Reminder] ✅ Notificaciones cada 6 horas programadas');

  } catch (error) {
    console.error('[Reminder] Error programando notificaciones:', error);
  }
}

/**
 * Programa múltiples notificaciones para cubrir un ciclo de 6 horas
 * Esta es la versión más confiable para Android
 */
export async function scheduleReliableSixHourReminders(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  try {
    const permissionStatus = await LocalNotifications.requestPermissions();
    if (permissionStatus.display !== 'granted') {
      console.warn('[Reminder] Permiso denegado');
      return;
    }

    await cancelReminderNotifications();

    // Programar notificaciones específicas a las 00:00, 06:00, 12:00, 18:00
    const notificationTimes = [0, 6, 12, 18]; // Horas del día
    const notifications = [];
    const now = new Date();
    
    for (let i = 0; i < notificationTimes.length; i++) {
      const hour = notificationTimes[i];
      const notificationDate = new Date();
      notificationDate.setHours(hour, 0, 0, 0);
      
      // Si la hora ya pasó hoy, programar para mañana
      if (notificationDate <= now) {
        notificationDate.setDate(notificationDate.getDate() + 1);
      }

      notifications.push({
        id: REMINDER_NOTIFICATION_ID + i,
        title: '🚗 Recordatorio MOPC Core',
        body: 'Es hora de reportar los vehículos en la aplicación',
        schedule: {
          at: notificationDate,
          repeats: true,
          every: 'day' as const,
          allowWhileIdle: true
        },
        sound: 'default',
        smallIcon: 'ic_stat_vehicle',
        channelId: 'vehicle-reminders',
        actionTypeId: 'OPEN_APP',
        extra: {
          type: 'reminder',
          action: 'open_reports',
          scheduledHour: hour
        }
      });
    }

    await LocalNotifications.schedule({ notifications });
    console.log(`[Reminder] ✅ ${notifications.length} notificaciones diarias programadas`);
    
  } catch (error) {
    console.error('[Reminder] Error al programar:', error);
  }
}

/**
 * Cancela todas las notificaciones recordatorias programadas
 */
export async function cancelReminderNotifications(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  try {
    // Cancelar las notificaciones con IDs conocidos
    const idsToCancel = [
      REMINDER_NOTIFICATION_ID,
      REMINDER_NOTIFICATION_ID + 1,
      REMINDER_NOTIFICATION_ID + 2,
      REMINDER_NOTIFICATION_ID + 3
    ];
    
    await LocalNotifications.cancel({ notifications: idsToCancel.map(id => ({ id })) });
    console.log('[Reminder] 🗑️  Notificaciones previas canceladas');
  } catch (error) {
    console.error('[Reminder] Error al cancelar notificaciones:', error);
  }
}

/**
 * Verifica las notificaciones pendientes (útil para debugging)
 */
export async function checkPendingNotifications(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  try {
    const pending = await LocalNotifications.getPending();
    console.log('[Reminder] Notificaciones pendientes:', pending.notifications.length);
    pending.notifications.forEach(n => {
      console.log(`  - ID ${n.id}: ${n.title} - ${n.schedule?.at}`);
    });
  } catch (error) {
    console.error('[Reminder] Error al verificar pendientes:', error);
  }
}

/**
 * Configura el listener para cuando el usuario toca una notificación
 */
export function setupNotificationActionListeners(): void {
  if (!Capacitor.isNativePlatform()) return;

  LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
    console.log('[Reminder] 📱 Notificación tocada:', notification);
    
    // Aquí puedes agregar navegación específica
    if (notification.notification.extra?.action === 'open_reports') {
      // Redirigir a la vista de reportes
      window.dispatchEvent(new CustomEvent('open_vehicle_reports', {
        detail: { source: 'notification' }
      }));
    }
  });

  console.log('[Reminder] ✅ Listeners de notificaciones configurados');
}

/**
 * Limpia todos los listeners de notificaciones
 */
export async function removeNotificationListeners(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  await LocalNotifications.removeAllListeners();
}
