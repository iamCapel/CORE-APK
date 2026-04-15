// Service Worker para Firebase Cloud Messaging (FCM)
// Este archivo maneja las notificaciones push cuando la app está en segundo plano o cerrada.

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBULoCr78BEnY8ovO1AdXvrn1JYfDqud6c",
  authDomain: "coredatabase-206ac.firebaseapp.com",
  projectId: "coredatabase-206ac",
  storageBucket: "coredatabase-206ac.firebasestorage.app",
  messagingSenderId: "204486232524",
  appId: "1:204486232524:web:d705e374692a8290fb3569"
});

const messaging = firebase.messaging();

// Manejar mensajes en segundo plano (solo para navegador web)
// En Android nativo, Capacitor y FCM manejan esto automáticamente.
messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || 'Nuevo mensaje';
  const body = payload.notification?.body || '';

  self.registration.showNotification(title, {
    body,
    icon: '/images/icon-192x192.png',
    badge: '/images/icon-72x72.png',
    data: payload.data,
    vibrate: [200, 100, 200],
  });
});
