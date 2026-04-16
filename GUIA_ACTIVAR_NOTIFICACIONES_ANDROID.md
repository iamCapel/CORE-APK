# Guía para Activar Notificaciones Push en Android

## ⚠️ IMPORTANTE: Configuración Obligatoria del Dispositivo

Las notificaciones push están **correctamente implementadas en el código**, pero los dispositivos Android (especialmente **Xiaomi, MIUI, OPPO, Vivo, Huawei**) tienen **restricciones muy agresivas** que bloquean las notificaciones por defecto.

---

## 📱 Pasos para Xiaomi / MIUI (Redmi Note 12 y similares)

### 1. **Permitir Notificaciones de la App**
1. Ir a **Configuración** → **Notificaciones y barra de estado**
2. Buscar **MOPC Core** en la lista de apps
3. Activar **Mostrar notificaciones**
4. Activar **Notificaciones emergentes**
5. Activar **Mostrar en pantalla de bloqueo**
6. Activar **Insignias de iconos**

### 2. **Configurar Ahorro de Batería (CRÍTICO)**
1. Ir a **Configuración** → **Batería y rendimiento**
2. Tocar **Ahorro de batería**
3. Buscar **MOPC Core** en la lista
4. Seleccionar **Sin restricciones**
5. ✅ **Esto es ESENCIAL para recibir notificaciones**

### 3. **Permitir Inicio Automático**
1. Ir a **Configuración** → **Apps** → **Administrar apps**
2. Buscar y tocar **MOPC Core**
3. Tocar **Inicio automático**
4. Activar el switch ✅
5. Esto permite que la app reciba notificaciones en segundo plano

### 4. **Configurar Bloqueo de Apps Recientes**
1. Ir a la pantalla de **Apps recientes** (botón cuadrado)
2. Buscar **MOPC Core**
3. Deslizar hacia abajo en la tarjeta de la app
4. Tocar el **candado** 🔒
5. Esto evita que MIUI cierre la app automáticamente

### 5. **Verificar Configuración de MIUI Optimizations**
1. Ir a **Configuración** → **Apps** → **Administrar apps**
2. Tocar los **3 puntos** arriba a la derecha
3. Seleccionar **Otras configuraciones**
4. Desactivar **Optimización de batería MIUI** (si existe la opción)

---

## 📱 Pasos para Samsung (Galaxy A04s y similares)

### 1. **Permitir Notificaciones**
1. Ir a **Configuración** → **Notificaciones**
2. Buscar **MOPC Core**
3. Activar todas las opciones de notificaciones
4. Asegurar que el canal **"Mensajes de Chat"** esté activado

### 2. **Configurar Ahorro de Batería**
1. Ir a **Configuración** → **Batería y cuidado del dispositivo**
2. Tocar **Batería**
3. Tocar **Límites de uso en segundo plano**
4. Buscar **MOPC Core**
5. Seleccionar **Sin restricciones**

### 3. **Permitir Actividad en Segundo Plano**
1. Ir a **Configuración** → **Aplicaciones**
2. Buscar **MOPC Core** → **Uso de batería**
3. Seleccionar **Permitir actividad en segundo plano**

---

## 📱 Pasos para OPPO / ColorOS

### 1. **Permitir Notificaciones**
1. Ir a **Configuración** → **Notificaciones y barra de estado**
2. Buscar **MOPC Core**
3. Activar todas las opciones

### 2. **Configurar Gestión de Energía**
1. Ir a **Configuración** → **Batería** → **App Energy Saver**
2. Buscar **MOPC Core**
3. Seleccionar **No restringir**

### 3. **Permitir Inicio Automático**
1. Ir a **Configuración** → **Privacidad** → **Administrador de permisos**
2. Seleccionar **Inicio automático**
3. Activar **MOPC Core**

---

## 📱 Pasos para Motorola / Stock Android

### 1. **Permitir Notificaciones**
1. Ir a **Configuración** → **Notificaciones**
2. Buscar **MOPC Core**
3. Activar notificaciones y todas las categorías

### 2. **Desactivar Optimización de Batería**
1. Ir a **Configuración** → **Batería**
2. Tocar los **3 puntos** → **Optimización de batería**
3. Cambiar a **Todas las apps**
4. Buscar **MOPC Core**
5. Seleccionar **No optimizar**

---

## 🧪 Verificar que las Notificaciones Funcionen

### Método 1: Prueba desde la App
1. Abre la app **MOPC Core** en tu dispositivo
2. Inicia sesión
3. **Envía un mensaje de prueba a ti mismo** desde otro usuario
4. Cierra la app o ponla en segundo plano
5. Deberías recibir una notificación push con sonido y vibración

### Método 2: Verificar en Logcat (Desarrolladores)
Conecta el dispositivo y ejecuta:
```bash
adb logcat | findstr FCM
```

Deberías ver logs como:
```
FCMService: 📨 Mensaje FCM recibido desde: ...
FCMService: 🔔 Notificación: [título]
FCMService: ✅ Notificación mostrada en sistema
MainActivity: ✅ Canal de notificaciones creado: chat_messages
```

---

## ❓ Solución de Problemas

### 🔴 Las notificaciones NO aparecen
1. **Verificar permisos de notificación:**
   - Abrir la app
   - Ir a **Configuración del dispositivo** → **Apps** → **MOPC Core** → **Permisos**
   - Verificar que **Notificaciones** esté PERMITIDO

2. **Verificar que el token FCM se guardó correctamente:**
   - Abrir las **Herramientas para desarrolladores** del navegador
   - Ver los logs de la consola
   - Debe aparecer: `[FCM] Token registrado: xxxxxx...`

3. **Verificar restricciones de batería:**
   - Asegurar que la app tenga **Sin restricciones** en ahorro de batería
   - Esto es CRÍTICO en Xiaomi/MIUI

4. **Reinstalar la app:**
   - Desinstalar completamente la app
   - Instalar de nuevo
   - Conceder todos los permisos cuando los solicite
   - Configurar las restricciones de batería nuevamente

### 🟡 Las notificaciones aparecen pero sin sonido
1. Verificar que el volumen de notificaciones del dispositivo **NO esté en silencio**
2. Ir a **Configuración** → **Notificaciones** → **MOPC Core** → **Mensajes de Chat**
3. Verificar que **Sonido** esté activado
4. Seleccionar un tono de notificación específico

### 🟡 Las notificaciones llegan con retraso
1. Esto es normal en dispositivos con ahorro de batería agresivo
2. Asegurar que la app esté en **Sin restricciones** (ver paso 2 de Xiaomi)
3. Bloquear la app en recientes (candado 🔒)

---

## 🔧 Configuraciones Técnicas Implementadas

### En el Código (ya implementado):
✅ Canal de notificaciones con **IMPORTANCE_HIGH**  
✅ Prioridad **PRIORITY_MAX** para dispositivos Xiaomi  
✅ Sonido y vibración personalizados  
✅ Notificaciones visibles en pantalla de bloqueo  
✅ BigTextStyle para mostrar texto completo  
✅ Token FCM se guarda automáticamente en Firestore  
✅ Manejo de tokens expirados (410 Gone)  

### Permisos en AndroidManifest:
✅ `POST_NOTIFICATIONS` (Android 13+)  
✅ `RECEIVE_BOOT_COMPLETED`  
✅ `INTERNET`  

---

## 📝 Notas Importantes

- **Android 13+**: El sistema solicitará permiso de notificaciones la primera vez que abras la app. **DEBES ACEPTAR**.
- **Xiaomi/MIUI**: Son los dispositivos más restrictivos. Sigue TODOS los pasos de configuración.
- **Primer mensaje**: La primera notificación puede tardar unos segundos en llegar mientras se establece la conexión FCM.
- **App cerrada**: Las notificaciones deben funcionar incluso con la app completamente cerrada (gracias a Firebase Cloud Messaging).

---

## 🆘 Si Aún No Funciona

Si después de seguir todos estos pasos las notificaciones no funcionan:

1. **Capturar logs de Logcat:**
   ```bash
   adb logcat | findstr "FCM"
   ```

2. **Verificar en Firebase Console:**
   - Ir a Firebase Console → Cloud Messaging
   - Enviar una notificación de prueba directamente desde la consola
   - Usar el token FCM del usuario

3. **Reportar el problema:**
   - Incluir modelo de dispositivo
   - Versión de Android
   - Logs de Logcat
   - Capturas de pantalla de los permisos

---

**Última actualización:** 16 de abril de 2026  
**Versión de la app:** 1.1
