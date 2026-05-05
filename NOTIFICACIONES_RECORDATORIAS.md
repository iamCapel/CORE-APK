# Sistema de Notificaciones Recordatorias - MOPC Core

## 📱 Descripción
Sistema de notificaciones locales que emite recordatorios cada 6 horas para que los usuarios reporten vehículos en la aplicación.

## ⏰ Horarios de Notificación
Las notificaciones se programan en los siguientes horarios:
- **00:00** - Medianoche
- **06:00** - Madrugada
- **12:00** - Mediodía
- **18:00** - Tarde

## 🔧 Implementación

### Archivos Creados/Modificados

#### 1. **src/services/reminderNotifications.ts**
Servicio principal que maneja:
- ✅ Solicitud de permisos de notificaciones locales
- ✅ Programación de 4 notificaciones diarias (cada 6 horas)
- ✅ Cancelación de notificaciones previas (evita duplicados)
- ✅ Configuración de listeners para acciones del usuario
- ✅ Verificación de notificaciones pendientes (debug)

**Funciones principales:**
- `scheduleReliableSixHourReminders()` - Programa las notificaciones cada 6 horas
- `cancelReminderNotifications()` - Cancela notificaciones programadas
- `setupNotificationActionListeners()` - Configura respuesta al tocar notificación
- `checkPendingNotifications()` - Verifica estado (solo desarrollo)

#### 2. **src/App.tsx**
Se agregó un nuevo `useEffect` que:
- Se activa cuando el usuario inicia sesión
- Configura los listeners de notificaciones
- Programa las notificaciones recurrentes
- Limpia los listeners al cerrar sesión

#### 3. **capacitor.config.ts**
Se agregó configuración para `LocalNotifications`:
```typescript
LocalNotifications: {
  smallIcon: "ic_stat_name",
  iconColor: "#FF7A00",
  sound: "default"
}
```

### Dependencias Instaladas
```bash
npm install @capacitor/local-notifications@^7.0.0
```

## 🚀 Funcionamiento

### Flujo de Inicialización
1. Usuario inicia sesión en la aplicación
2. Se solicitan permisos de notificaciones locales
3. Se programan 4 notificaciones diarias (una cada 6 horas)
4. Las notificaciones se repiten automáticamente cada día

### Comportamiento de Notificaciones
- **Título**: 🚗 Recordatorio MOPC Core
- **Mensaje**: "Es hora de reportar los vehículos en la aplicación"
- **Sonido**: Sonido predeterminado del sistema
- **Canal**: vehicle-reminders
- **Repetición**: Diaria en horarios fijos

### Al Tocar una Notificación
Cuando el usuario toca la notificación:
1. Se abre la aplicación
2. Se dispara un evento `open_vehicle_reports`
3. Puede usarse para navegar directamente a la vista de reportes

## 🔐 Permisos Requeridos

### Android (AndroidManifest.xml)
Los permisos ya están incluidos con el plugin:
```xml
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
```

## 🧪 Pruebas

### Verificar Notificaciones Programadas
En modo desarrollo, la aplicación automáticamente verifica las notificaciones pendientes 2 segundos después de iniciar. Revisa la consola:

```javascript
[Reminder] Notificaciones pendientes: 4
  - ID 1000: 🚗 Recordatorio MOPC Core - ...
  - ID 1001: 🚗 Recordatorio MOPC Core - ...
  - ID 1002: 🚗 Recordatorio MOPC Core - ...
  - ID 1003: 🚗 Recordatorio MOPC Core - ...
```

### Probar Manualmente
Puedes forzar una notificación inmediata modificando temporalmente los horarios en `reminderNotifications.ts`.

## 📱 Compatibilidad

### Dispositivos Optimizados
- ✅ **Xiaomi Redmi** - Configurado con `allowWhileIdle: true`
- ✅ **TCL** - Funciona con las configuraciones actuales
- ✅ **Samsung** - Compatible con canales de notificación
- ✅ **Otros Android** - Funcionalidad estándar

### Optimizaciones para Xiaomi
Las notificaciones usan `allowWhileIdle: true` para:
- Evitar que MIUI las bloquee cuando el dispositivo está en reposo
- Garantizar entrega incluso con optimización de batería agresiva
- Funcionar correctamente con Doze mode

## 🔄 Sincronización

Para aplicar los cambios después de modificar:
```bash
npm run build
npx cap sync android
npx cap run android
```

## 🛠️ Troubleshooting

### Las notificaciones no aparecen
1. Verificar permisos en: Configuración → Apps → MOPC Core → Notificaciones
2. Desactivar optimización de batería para la app (especialmente en Xiaomi)
3. Verificar que el usuario esté autenticado
4. Revisar consola para errores

### Notificaciones duplicadas
El sistema automáticamente cancela notificaciones previas antes de programar nuevas. Si persisten duplicados:
```typescript
import { cancelReminderNotifications } from './services/reminderNotifications';
await cancelReminderNotifications();
```

### Xiaomi no muestra notificaciones
1. Ir a Configuración → Apps → MOPC Core
2. Activar "Inicio automático"
3. En "Ahorro de batería" → Seleccionar "Sin restricciones"
4. En "Notificaciones" → Activar todas las categorías

## 📝 Logs

Todos los logs del sistema de notificaciones tienen el prefijo `[Reminder]`:

```
[Reminder] ✅ Permisos otorgados
[Reminder] Próxima notificación: 5/5/2026, 18:00:00
[Reminder] ✅ 4 notificaciones diarias programadas
[Reminder] 📱 Notificación tocada: {...}
```

## 🎯 Próximas Mejoras

Posibles mejoras futuras:
- [ ] Permitir al usuario personalizar horarios
- [ ] Agregar preferencias de notificación en configuración
- [ ] Estadísticas de tasa de respuesta a notificaciones
- [ ] Notificaciones inteligentes basadas en actividad del usuario
- [ ] Integración con geofencing para recordatorios basados en ubicación

## 📚 Referencias

- [Capacitor Local Notifications](https://capacitorjs.com/docs/apis/local-notifications)
- [Android Notification Channels](https://developer.android.com/develop/ui/views/notifications/channels)
- [Xiaomi Doze Mode](https://dontkillmyapp.com/xiaomi)

---

**Fecha de Implementación**: Mayo 2026  
**Versión**: 1.0  
**Plugin**: @capacitor/local-notifications@7.0.6
