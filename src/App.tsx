import React, { useState, useEffect } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import Dashboard from './components/Dashboard';
import FloatingChat from './components/FloatingChat';

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

  /* ── Botón atrás: Capacitor (Android nativo) + web fallback ── */
  useEffect(() => {
    const handleBackButton = () => {
      document.body.classList.add('hide-back-icons');

      // Buscar cualquier botón de retroceso visible en la página actual
      const backBtn = document.querySelector<HTMLButtonElement>(
        'button.back-button, button.topbar-back-button, button.topbar-back-btn, button.topbar-back-btn-modern, button.back-btn'
      );

      if (backBtn) {
        backBtn.click();
      }

      setTimeout(() => {
        document.body.classList.remove('hide-back-icons');
      }, 500);
    };

    let capListener: { remove: () => void } | null = null;

    if (Capacitor.isNativePlatform()) {
      // En Android nativo usar el plugin de Capacitor
      CapacitorApp.addListener('backButton', ({ canGoBack }) => {
        if (canGoBack) {
          handleBackButton();
        } else {
          // Si no hay nada a donde volver, minimizar la app
          CapacitorApp.minimizeApp();
        }
      }).then((listener) => {
        capListener = listener;
      });
    } else {
      // Fallback web: popstate + Escape
      window.addEventListener('popstate', handleBackButton);
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') handleBackButton();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('popstate', handleBackButton);
        window.removeEventListener('keydown', handleKeyDown);
      };
    }

    return () => {
      capListener?.remove();
    };
  }, []);

  return (
    <div className="App">
      <Dashboard />
      {chatUser && <FloatingChat currentUser={chatUser} />}
    </div>
  );
}

export default App;