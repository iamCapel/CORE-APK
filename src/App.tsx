import React, { useState, useEffect } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import Dashboard from './components/Dashboard';
import { initializePushNotifications, removePushListeners } from './services/fcmService';

function App() {
  /* Usuario activo leído desde localStorage; se actualiza con el evento mopc_user_changed */
  const [chatUser, setChatUser] = useState<{ id?: string; username: string; name: string; profilePhoto?: string } | null>(() => {
    try {
      const raw = localStorage.getItem('mopc_user');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });

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
    initializePushNotifications(chatUser.id);
    return () => removePushListeners();
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