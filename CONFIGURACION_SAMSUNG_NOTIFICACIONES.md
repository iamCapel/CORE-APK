# Configuración de Notificaciones para Samsung Galaxy A04s

## ⚠️ PASOS CRÍTICOS PARA SAMSUNG

### 1. **Permisos de Notificaciones**
1. Ve a **Configuración** → **Notificaciones**
2. Busca **MOPC Core** en la lista
3. Asegúrate que esté **ACTIVADO**
4. Toca en **MOPC Core** y verifica:
   - ✅ **Permitir notificaciones**: ACTIVADO
   - ✅ **Categorías de notificaciones**:
     - Busca **"Mensajes de Chat"** o **"chat_messages"**
     - Asegúrate que esté ACTIVADO
     - Toca en ella y verifica:
       - **Sonido**: ACTIVADO (selecciona un tono)
       - **Vibración**: ACTIVADO
       - **Ventanas emergentes**: ACTIVADO
       - **Insignia**: ACTIVADO

### 2. **Optimización de Batería (MUY IMPORTANTE)**
Esta es la causa #1 de que las notificaciones no funcionen en Samsung:

1. Ve a **Configuración** → **Batería y cuidado del dispositivo**
2. Toca **Batería**
3. Toca los **3 puntos** (⋮) arriba a la derecha
4. Selecciona **Límites de uso en segundo plano**
5. Toca **Apps no optimizadas**
6. Cambia a **Todas las apps**
7. Busca **MOPC Core**
8. Selecciona **No optimizar**
9. Toca **Listo**

**Verificación:**
- Ve a **Configuración** → **Aplicaciones**
- Busca y toca **MOPC Core**
- Toca **Uso de batería**
- Debe decir: **"Permitir actividad en segundo plano"** y **"No optimizada"**

### 3. **Permisos de la App (Android 13+)**
Samsung con Android 13 o superior requiere permiso explícito:

1. Ve a **Configuración** → **Aplicaciones**
2. Toca **MOPC Core**
3. Toca **Permisos**
4. Busca **"Notificaciones"** en la lista
5. Asegúrate que esté **PERMITIDO**

Si no aparece, es porque la app no lo solicitó. La nueva APK que se está compilando lo solicitará automáticamente.

### 4. **Modo No Molestar**
Verifica que el modo "No molestar" no esté bloqueando las notificaciones:

1. Ve a **Configuración** → **Notificaciones**
2. Toca **No molestar**
3. Si está activado:
   - Toca **Apps que pueden ignorar No molestar**
   - Busca y activa **MOPC Core**

### 5. **Ahorro de Energía / Modo Ultra**
Si tienes activado el modo de ahorro de energía:

1. Ve a **Configuración** → **Batería y cuidado del dispositivo**
2. Toca **Batería**
3. Si **Ahorro de energía** está activado:
   - Toca **Ahorro de energía**
   - Toca **Límites en segundo plano**
   - Asegúrate que **MOPC Core** no esté en la lista de apps restringidas

### 6. **Modo Reposo (Deep Sleep)**
Samsung tiene un modo que pone apps en "reposo profundo":

1. Ve a **Configuración** → **Batería y cuidado del dispositivo**
2. Toca **Batería**
3. Toca los **3 puntos** (⋮) → **Configuración**
4. Revisa:
   - **Apps en reposo**: MOPC Core NO debe estar aquí
   - **Apps en reposo profundo**: MOPC Core NO debe estar aquí
5. Si está en alguna de estas listas, tócala y selecciona **Quitar**

---

## 🧪 Prueba de Notificaciones

Después de configurar todo lo anterior:

1. **Desinstala completamente** la app antigua
2. **Instala la nueva APK** (la que se está compilando)
3. **Abre la app** y acepta TODOS los permisos
4. **Inicia sesión**
5. **Envía un mensaje de prueba** a ti mismo desde otro usuario
6. **Cierra la app** (presiona Home, no la cierres forzadamente)
7. **Espera unos segundos** - deberías recibir la notificación

---

## 📊 Verificar que la Configuración Funcionó

### Método 1: Enviar notificación de prueba
1. Con la app abierta, envía un mensaje
2. Presiona el botón Home
3. Deberías recibir la notificación con:
   - ✅ Sonido
   - ✅ Vibración
   - ✅ Banner en pantalla
   - ✅ Icono en barra de estado

### Método 2: Revisar configuración de la app
1. **Configuración** → **Aplicaciones** → **MOPC Core**
2. Verifica:
   - **Notificaciones**: "Activado" con badge verde
   - **Uso de batería**: "No optimizada"
   - **Permisos**: "Notificaciones - Permitido"

---

## ❌ Si AÚN NO FUNCIONA

### A. Verificar que el token FCM se guardó
1. Abre la app en tu navegador web (no en el móvil)
2. Abre las **Herramientas de Desarrollo** (F12)
3. Ve a la pestaña **Console**
4. Busca un mensaje que diga: `[FCM] Token registrado: ...`

Si NO aparece, el token no se registró.

### B. Revisar los logs del dispositivo
Si tienes el dispositivo conectado a la PC:

```bash
adb logcat | findstr "FCM\|MainActivity\|NotificationManager"
```

Deberías ver:
- `MainActivity: ✅ Canal de notificaciones creado: chat_messages`
- `FCMService: 📨 Mensaje FCM recibido desde: ...`
- `FCMService: ✅ Notificación mostrada en sistema`

### C. Probar con notificación manual desde Firebase
1. Ve a [Firebase Console](https://console.firebase.google.com)
2. Selecciona tu proyecto
3. Ve a **Cloud Messaging**
4. Envía una notificación de prueba
5. Ingresa el token FCM del usuario (lo puedes ver en Firestore)

Si esta notificación SÍ llega pero las de la app NO:
- El problema está en el código que envía las notificaciones
- Revisa que `REACT_APP_NOTIFY_SECRET` esté configurado correctamente

Si esta notificación TAMPOCO llega:
- El problema está en las configuraciones del dispositivo
- Repasa todos los pasos anteriores

---

## 🔑 Configuraciones Más Comunes que Bloquean

Basado en experiencia con Samsung Galaxy A04s:

1. **🥇 #1 Causa**: Optimización de batería activada
   - **Solución**: Paso 2 completo
   
2. **🥈 #2 Causa**: App en "Reposo profundo"
   - **Solución**: Paso 6
   
3. **🥉 #3 Causa**: Canal de notificaciones desactivado
   - **Solución**: Paso 1, verificar "Mensajes de Chat"
   
4. **#4 Causa**: Modo No Molestar bloqueando la app
   - **Solución**: Paso 4

---

## ✅ Checklist Final

Antes de reportar que no funciona, verifica:

- [ ] Notificaciones de la app: ACTIVADAS
- [ ] Canal "Mensajes de Chat": ACTIVADO con sonido
- [ ] Optimización de batería: NO OPTIMIZADA
- [ ] Apps en reposo: MOPC Core NO está en la lista
- [ ] Apps en reposo profundo: MOPC Core NO está en la lista
- [ ] Permisos de notificaciones: PERMITIDO
- [ ] Actividad en segundo plano: PERMITIDA
- [ ] Modo No Molestar: Desactivado O la app está en excepciones
- [ ] App instalada de nuevo (no actualización sobre versión anterior)

---

**Fecha:** 16 de abril de 2026  
**Dispositivo:** Samsung Galaxy A04s  
**Android:** 12+  
**Versión App:** 1.1
