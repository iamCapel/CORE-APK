# 🚀 Despliegue en Vercel - MOPC Dashboard

## ⚠️ Problema Común: "Usuario no encontrado"

Si después de desplegar en Vercel ves el error **"Usuario no encontrado"**, es porque el localStorage del navegador está vacío la primera vez que accedes.

## ✅ Solución

### Opción 1: Abrir la página de diagnóstico

1. Ve a: `https://tu-sitio.vercel.app/diagnostic.html`
2. Verás un reporte completo del estado del sistema
3. Si no hay usuarios, haz clic en **"Forzar Recarga"**
4. Los usuarios se cargarán automáticamente

### Opción 2: Usar la consola del navegador

1. Abre el sitio en Vercel
2. Presiona `F12` para abrir las herramientas de desarrollo
3. Ve a la pestaña **Console**
4. Busca mensajes como:
   - `🔄 Cargando usuarios predefinidos... 3`
   - `✅ Usuarios predefinidos cargados exitosamente`

Si no ves estos mensajes, recarga la página (Ctrl+F5 o Cmd+Shift+R).

### Opción 3: Limpiar y recargar

1. Ve a: `https://tu-sitio.vercel.app/reset-users.html`
2. Haz clic en **"Restablecer Usuarios Predefinidos"**
3. Vuelve al login

## 👥 Usuarios Disponibles

Después de la primera carga, estos usuarios estarán disponibles:

| Usuario | Contraseña | Rol |
|---------|-----------|-----|
| `admin` | `admin123` | Administrador |
| `capel` | `02260516` | Administrador |
| `tecnico` | `tecnico123` | Técnico |

## 🔧 Configuración de Vercel

### Variables de Entorno (NO requeridas)

Este proyecto **NO** requiere variables de entorno para funcionar. Los usuarios se cargan automáticamente desde el código.

### Build Settings

```
Framework Preset: Create React App
Build Command: npm run build
Output Directory: build
Install Command: npm install
```

### Root Directory

```
./
```

## 📊 Verificación Post-Deploy

1. **Abrir consola del navegador** (F12) y recargar
2. **Buscar logs**:
   - `✅ Usuarios ya existen en localStorage: 3` ← Todo OK
   - `🔄 Cargando usuarios predefinidos... 3` ← Cargando primera vez
   - `✅ Usuarios predefinidos cargados exitosamente` ← Éxito

3. **Verificar localStorage**:
   - Application → Local Storage → https://tu-sitio.vercel.app
   - Deberías ver:
     - `mopc_users_db`
     - `mopc_users_index`
     - `mopc_users_metadata`

## 🐛 Troubleshooting

### Error: "Usuario no encontrado" persiste

**Causa**: localStorage vacío o corrupto

**Solución**:
```javascript
// Ejecutar en la consola del navegador (F12):
localStorage.clear();
window.location.reload();
```

### Error: "Error del sistema"

**Causa**: Problema con el JSON de usuarios

**Solución**:
1. Verificar que `src/config/userstorage.json` existe
2. Verificar que el JSON es válido
3. Rebuild en Vercel

### Los usuarios desaparecen al recargar

**Causa**: Configuración de privacidad del navegador

**Solución**:
- Permitir cookies y localStorage para el sitio
- Desactivar modo incógnito/privado
- Verificar extensiones de privacidad (uBlock, Privacy Badger, etc.)

## 📱 Compatibilidad

✅ Chrome/Edge (recomendado)  
✅ Firefox  
✅ Safari  
⚠️ Modo incógnito (localStorage se borra al cerrar)

## 🔗 Enlaces Útiles

- **Diagnóstico**: `/diagnostic.html`
- **Reset Usuarios**: `/reset-users.html`
- **Dashboard**: `/`

## 💡 Notas Importantes

1. Los usuarios se almacenan **en el navegador del cliente** (localStorage)
2. **NO hay backend** para autenticación
3. Cada navegador/dispositivo necesita cargar los usuarios la primera vez
4. Los datos **NO** se sincronizan entre dispositivos
5. Limpiar caché del navegador **borrará** los usuarios (pero se recargan automáticamente)

## 🎯 Para Producción Real

Este sistema es ideal para desarrollo y demos. Para producción considera:

- Implementar backend real con base de datos
- Agregar autenticación JWT
- Usar OAuth/SSO
- Implementar rate limiting
- Agregar logs de auditoría
