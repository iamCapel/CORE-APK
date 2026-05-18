import React, { useState, useEffect } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import Dashboard from './components/Dashboard';
import { initializePushNotifications, removePushListeners, setForegroundNotificationHandler } from './services/fcmService';
import { useNotificationSound } from './hooks/useNotificationSound';
import { 
  scheduleReliableSixHourReminders, 
  setupNotificationActionListeners, 
  removeNotificationListeners,
  checkPendingNotifications
} from './services/reminderNotifications';
import { setupChatNotificationListeners } from './services/chatNotifications';

function App() {
  /* Usuario activo leído desde localStorage; se actualiza con el evento mopc_user_changed */
  const [chatUser, setChatUser] = useState<{ id?: string; username: string; name: string; profilePhoto?: string } | null>(() => {
    try {
      const raw = localStorage.getItem('mopc_user');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });

  // Hook para reproducir sonido de notificación
  const { play: playNotificationSound } = useNotificationSound();

  /* Sincronizar usuario cuando Dashboard hace login/logout */
  useEffect(() => {
    const onUserChanged = (e: Event) => {
      setChatUser((e as CustomEvent).detail);
    };
    window.addEventListener('mopc_user_changed', onUserChanged);
    return () => window.removeEventListener('mopc_user_changed', onUserChanged);
  }, []);

  /* Inicializar notificaciones push nativas cuando el usuario esté autenticado */
  useEffect(() => {
    if (!chatUser?.id) {
      removePushListeners();
      return;
    }

    try {
      // Configurar handler de notificaciones en primer plano
      setForegroundNotificationHandler((notification) => {
        console.log('🔔 App: Notificación FCM recibida en primer plano:', notification.title);
        // Reproducir sonido usando el hook existente
        playNotificationSound();
        
        // Disparar evento personalizado para que otros componentes puedan reaccionar
        window.dispatchEvent(new CustomEvent('fcm_notification_received', {
          detail: notification
        }));
      });

      initializePushNotifications(chatUser.id).catch(err => {
        console.error('Error inicializando push notifications:', err);
      });
    } catch (error) {
      console.error('Error en setup de push notifications:', error);
    }

    return () => removePushListeners();
  }, [chatUser?.id, playNotificationSound]);

  /* Inicializar notificaciones recordatorias cada 6 horas */
  useEffect(() => {
    if (!chatUser?.id) {
      // Si no hay usuario, limpiar listeners
      removeNotificationListeners();
      return;
    }

    try {
      // Configurar listeners para cuando el usuario toca una notificación
      setupNotificationActionListeners();

      // Configurar listeners para notificaciones de chat
      setupChatNotificationListeners((chatId, senderName) => {
        console.log('[App] Usuario tocó notificación de chat:', chatId);
        // Disparar evento personalizado para que BubbleFeedChat abra la conversación
        window.dispatchEvent(new CustomEvent('open_chat_from_notification', {
          detail: { chatId, senderName }
        }));
      });

      // Programar notificaciones cada 6 horas (00:00, 06:00, 12:00, 18:00)
      scheduleReliableSixHourReminders().catch(err => {
        console.error('Error programando notificaciones recordatorias:', err);
      });

      // Verificar notificaciones pendientes (debug)
      if (process.env.NODE_ENV === 'development') {
        setTimeout(() => checkPendingNotifications().catch(console.error), 2000);
      }
    } catch (error) {
      console.error('Error en setup de notificaciones recordatorias:', error);
    }

    return () => {
      removeNotificationListeners();
    };
  }, [chatUser?.id]);

  /* ── Botón atrás nativo: gestionado por Dashboard y BubbleFeedChat directamente ── */
  /* Solo web fallback (Escape) se mantiene aquí */
  useEffect(() => {
    if (Capacitor.isNativePlatform()) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const backBtn = document.querySelector<HTMLButtonElement>(
          'button.back-button, button.topbar-back-button, button.topbar-back-btn, button.topbar-back-btn-modern, button.back-btn'
        );
        backBtn?.click();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="App">
      <Dashboard />

    </div>
  );
}

export default App;