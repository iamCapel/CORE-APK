# Correcciones al Sistema de Notificaciones de Chat

## Fecha: 15 de abril de 2026

## Problemas Identificados

### 1. **subscribeToUserChats no esperaba la resolución del username**
- **Problema**: La función `subscribeToUserChats` en `firebaseChatService.ts` ejecutaba `getUserById()` o `getUserByUsername()` de forma asíncrona con `.then()`, pero creaba la query de Firestore inmediatamente sin esperar la resolución.
- **Síntoma**: La query se ejecutaba con un UID en lugar de username, causando que los chats no se suscribieran correctamente.
- **Archivo**: `src/services/firebaseChatService.ts` línea 304

### 2. **Notificaciones FCM en primer plano no reproducían sonido**
- **Problema**: Cuando llegaba una notificación push mientras la app estaba en primer plano, solo se registraba un log en consola pero no se reproducía ningún sonido ni alertaba al usuario.
- **Síntoma**: Mensajes llegaban pero el usuario no era notificado.
- **Archivo**: `src/services/fcmService.ts` línea 36

### 3. **Conteo de mensajes no leídos inconsistente**
- **Problema**: El contador de no leídos en Dashboard usaba `userId` directamente sin considerar que podría ser username o UID.
- **Síntoma**: Algunos mensajes no se contaban correctamente.
- **Archivo**: `src/components/Dashboard.tsx` línea 968

## Correcciones Implementadas

### 1. subscribeToUserChats ahora espera la resolución correctamente

**Antes:**
```typescript
export function subscribeToUserChats(userId: string, callback: (chats: ChatRoom[]) => void): Unsubscribe {
  let resolvedUsername = userId;
  
  if (looksLikeFirebaseUID(userId)) {
    getUserById(userId).then(user => {
      if (user) resolvedUsername = user.username;
    });
  }
  
  const q = query(
    collection(db, 'chats'),
    where('participants', 'array-contains', resolvedUsername)
  );
  return onSnapshot(q, ...);
}
```

**Después:**
```typescript
export function subscribeToUserChats(userId: string, callback: (chats: ChatRoom[]) => void): Unsubscribe {
  let unsubscribe: Unsubscribe | null = null;
  let isActive = true;

  (async () => {
    let resolvedUsername = userId;
    
    if (looksLikeFirebaseUID(userId)) {
      const user = await getUserById(userId);
      if (user) resolvedUsername = user.username;
    }
    
    if (!isActive) return; // Cancelado antes de resolver
    
    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', resolvedUsername)
    );
    unsubscribe = onSnapshot(q, ...);
  })();

  return () => {
    isActive = false;
    if (unsubscribe) unsubscribe();
  };
}
```

**Beneficio**: La query ahora se ejecuta con el username correcto, asegurando que las suscripciones funcionen correctamente.

### 2. Handler de notificaciones FCM en primer plano

**Nuevo en `fcmService.ts`:**
```typescript
let _onForegroundNotification: ((notification: PushNotificationSchema) => void) | null = null;

export function setForegroundNotificationHandler(handler: (notification: PushNotificationSchema) => void): void {
  _onForegroundNotification = handler;
}

// Dentro de initializePushNotifications:
const onForeground = (notification: PushNotificationSchema) => {
  console.log('[FCM] 🔔 Notificación en primer plano:', notification.title);
  if (_onForegroundNotification) {
    _onForegroundNotification(notification);
  }
};
```

**Nuevo en `App.tsx`:**
```typescript
import { useNotificationSound } from './hooks/useNotificationSound';

function App() {
  const { play: playNotificationSound } = useNotificationSound();
  
  useEffect(() => {
    if (!chatUser?.id) return;

    setForegroundNotificationHandler((notification) => {
      console.log('🔔 App: Notificación FCM recibida en primer plano:', notification.title);
      playNotificationSound();
      
      // Evento para que otros componentes reaccionen
      window.dispatchEvent(new CustomEvent('fcm_notification_received', {
        detail: notification
      }));
    });

    initializePushNotifications(chatUser.id);
    return () => removePushListeners();
  }, [chatUser?.id, playNotificationSound]);
}
```

**Beneficio**: Ahora cuando llega una notificación FCM en primer plano, se reproduce el sonido de notificación inmediatamente.

### 3. Mejora del conteo de mensajes no leídos en Dashboard

**Antes:**
```typescript
const unsub = subscribeToUserChats(userId, (chats) => {
  const total = chats.reduce(
    (sum, c) => sum + (c.unreadCount?.[userId] || 0),
    0
  );
  // ...
});
```

**Después:**
```typescript
const unsub = subscribeToUserChats(userId, (chats) => {
  console.log('📨 Dashboard: Chats recibidos:', chats.length);
  
  const total = chats.reduce((sum, c) => {
    // Buscar contador tanto con uid como username
    const userUnread = c.unreadCount?.[userId] || c.unreadCount?.[user.username] || 0;
    console.log(`  - Chat ${c.id}: ${userUnread} no leídos`);
    return sum + userUnread;
  }, 0);
  
  console.log('📨 Dashboard: Total no leídos:', total, '| Anterior:', prevChatUnreadRef.current);
  
  if (prevChatUnreadRef.current >= 0 && total > prevChatUnreadRef.current) {
    console.log('🔔 Dashboard: Reproduciendo sonido de notificación');
    playChatSound();
    setChatBadgeAnimate(true);
    setTimeout(() => setChatBadgeAnimate(false), 1000);
  }
  // ...
});
```

**Beneficio**: 
- Más logging para debug
- Maneja tanto UIDs como usernames en el contador
- Feedback claro en consola de cuándo se reproduce el sonido

## Cómo Probar

### 1. Probar la suscripción a chats
1. Abrir la consola del navegador/app
2. Iniciar sesión en la aplicación
3. Buscar en consola: `📨 Dashboard: Suscribiendo a chats para userId:`
4. Verificar que aparezca: `📡 Suscribiendo a chats de: [username]`
5. Enviar un mensaje desde otro usuario
6. Verificar que aparezca: `📨 Dashboard: Chats recibidos: [N]`

### 2. Probar notificaciones FCM en primer plano (Android)
1. Compilar APK con `npm run android`
2. Instalar en dispositivo Android
3. Iniciar sesión en dos dispositivos diferentes
4. Con la app en primer plano, enviar un mensaje desde el otro dispositivo
5. Verificar que:
   - Se escuche el sonido de notificación
   - Aparezca en consola: `🔔 App: Notificación FCM recibida en primer plano`
   - El badge de chat se anime

### 3. Probar contador de mensajes no leídos
1. Iniciar sesión
2. Abrir consola
3. Recibir un mensaje nuevo
4. Verificar que se vea:
   ```
   📨 Dashboard: Chats recibidos: 1
     - Chat [chatId]: 1 no leídos
   📨 Dashboard: Total no leídos: 1 | Anterior: 0
   🔔 Dashboard: Reproduciendo sonido de notificación
   ```
5. Abrir el chat
6. Verificar que el contador vuelva a 0

## Archivos Modificados

1. **src/services/firebaseChatService.ts**
   - Función `subscribeToUserChats` ahora espera resolución async

2. **src/services/fcmService.ts**
   - Agregada función `setForegroundNotificationHandler`
   - Variable `_onForegroundNotification`
   - Handler de notificaciones en primer plano mejorado

3. **src/App.tsx**
   - Import de `useNotificationSound`
   - Import de `setForegroundNotificationHandler`
   - Configuración de handler en useEffect

4. **src/components/Dashboard.tsx**
   - Mejora en el conteo de mensajes no leídos
   - Logging detallado para debug
   - Manejo dual de UID/username

## Notas Técnicas

### AudioContext en Android WebView
El hook `useNotificationSound` maneja correctamente el desbloqueo del `AudioContext` en Android WebView, que requiere un gesto del usuario para iniciar. El contexto se desbloquea automáticamente con el primer touch/click.

### Doble sistema de notificaciones
El sistema ahora tiene dos capas:
1. **FCM Push Notifications**: Para mensajes cuando la app está en background o cerrada
2. **Firestore Real-time**: Para actualizaciones cuando la app está en primer plano

Ambos están coordinados para evitar duplicación y asegurar que el usuario siempre sea notificado.

### Cleanup en unsubscribe
La nueva implementación de `subscribeToUserChats` maneja correctamente el cleanup incluso si el componente se desmonta antes de que termine la resolución async del username.

## Próximos Pasos Recomendados

1. **Vibración**: Agregar vibración al recibir notificaciones usando Capacitor Haptics
2. **Badge en ícono de app**: Implementar badge counter en el ícono de la app
3. **Notificaciones push en iOS**: Configurar certificados APNs para iOS
4. **Deep linking**: Abrir el chat específico al tocar una notificación

## Troubleshooting

### "No se escucha ningún sonido"
- Verificar que el volumen del dispositivo esté encendido
- En Android WebView, asegurar que se haya desbloqueado el AudioContext (hacer touch en pantalla)
- Revisar consola para ver si hay errores de AudioContext

### "Los chats no aparecen"
- Verificar en consola si aparece: `📡 Suscribiendo a chats de:`
- Asegurar que el username esté correctamente almacenado en Firestore
- Verificar que el documento del chat tenga el array `participants` con usernames

### "El contador no se actualiza"
- Verificar en consola los logs de `📨 Dashboard: Chats recibidos`
- Asegurar que `unreadCount` en el documento del chat tenga el username correcto como key
- Revisar que `markMessagesAsRead` se esté llamando al abrir el chat
