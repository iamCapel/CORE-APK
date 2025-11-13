# 🎨 Sistema de Roles y Temas - MOPC Dashboard

## 📋 Descripción General

El MOPC Dashboard implementa un sistema de **3 roles de usuario** con **entornos visuales diferenciados por colores**. Cada rol tiene permisos específicos y un tema visual único que permite identificar inmediatamente el tipo de usuario que está trabajando en el sistema.

---

## 👥 Tipos de Usuarios

### 1. 🔧 Usuario Técnico (VERDE)
**Entorno de trabajo: Verde esmeralda**

#### Características Visuales:
- **Color Principal**: `#10b981` (Verde 500)
- **Color Oscuro**: `#059669` (Verde 600)
- **Sombras**: Verde translúcido
- **Gradientes**: Verde claro a verde oscuro
- **Elementos destacados**: Bordes, botones y barras de progreso en tonos verdes

#### Permisos y Capacidades:
- ✅ **Crear reportes** de intervenciones
- ✅ **Editar reportes** (solo los propios)
- ❌ **NO puede** eliminar reportes
- ❌ **NO puede** ver reportes de otros usuarios
- ❌ **NO puede** aprobar reportes
- ❌ **NO puede** gestionar usuarios
- ✅ **Ver estadísticas** propias
- ❌ **NO tiene** acceso completo a configuración

#### Límites Operacionales:
- **Máximo 20 reportes por día**
- **Máximo 50 intervenciones por reporte**
- **Requiere aprobación** de supervisor para reportes

#### Usuarios de Prueba:
- Username: `tecnico` / Password: cualquiera
- Username: `tec1`, `tec2`, etc. / Password: cualquiera

---

### 2. 👔 Usuario Supervisor (AZUL)
**Entorno de trabajo: Azul cielo**

#### Características Visuales:
- **Color Principal**: `#3b82f6` (Azul 500)
- **Color Oscuro**: `#2563eb` (Azul 600)
- **Sombras**: Azul translúcido
- **Gradientes**: Azul claro a azul oscuro
- **Elementos destacados**: Bordes, botones y barras de progreso en tonos azules

#### Permisos y Capacidades:
- ✅ **Crear reportes** de intervenciones
- ✅ **Editar reportes** de su región
- ✅ **Eliminar reportes** de su región
- ✅ **Ver todos los reportes** de su región
- ✅ **Aprobar reportes** de técnicos
- ✅ **Crear usuarios** (solo técnicos)
- ✅ **Editar usuarios** técnicos de su región
- ❌ **NO puede** eliminar usuarios
- ✅ **Ver estadísticas** de su región
- ✅ **Exportar datos**
- ✅ **Acceso a configuración** (limitada)

#### Límites Operacionales:
- **Máximo 50 reportes por día**
- **Máximo 100 intervenciones por reporte**
- **NO requiere aprobación** para sus reportes

#### Usuarios de Prueba:
- Username: `supervisor` / Password: cualquiera
- Username: `sup1`, `sup2`, etc. / Password: cualquiera

---

### 3. ⚡ Usuario Administrador (NEGRO/OSCURO)
**Entorno de trabajo: Negro/Gris oscuro**

#### Características Visuales:
- **Color Principal**: `#1f2937` (Gris 800)
- **Color Oscuro**: `#111827` (Gris 900)
- **Sombras**: Negro/gris translúcido
- **Gradientes**: Gris oscuro a negro
- **Elementos destacados**: Diseño elegante y profesional con sidebar oscuro
- **Texto**: Blanco/gris claro sobre fondos oscuros

#### Permisos y Capacidades:
- ✅ **ACCESO TOTAL** a todas las funcionalidades
- ✅ **Crear, editar y eliminar** cualquier reporte
- ✅ **Ver todos los reportes** del sistema
- ✅ **Aprobar reportes**
- ✅ **Crear usuarios** de todos los roles
- ✅ **Editar y eliminar** cualquier usuario
- ✅ **Ver todas las estadísticas** del sistema
- ✅ **Exportar todos los datos**
- ✅ **Acceso completo a configuración**
- ✅ **Gestionar regiones** y provincias

#### Límites Operacionales:
- **Reportes ilimitados** por día
- **Intervenciones ilimitadas** por reporte
- **NO requiere aprobación**

#### Usuarios de Prueba:
- Username: `admin` / Password: cualquiera

---

## 🎨 Sistema de Temas Dinámicos

### Variables CSS por Rol

El sistema utiliza **CSS Custom Properties** (variables CSS) que se actualizan dinámicamente según el rol del usuario:

```css
/* Variables dinámicas que cambian según el rol */
--user-primary: Color principal del rol
--user-primary-dark: Color oscuro del rol
--user-secondary: Color secundario
--user-tertiary: Color terciario (fondos claros)
--user-accent: Color de acento
--user-shadow: Sombra del color del rol
--user-gradient-start: Inicio del gradiente
--user-gradient-end: Fin del gradiente
```

### Aplicación Automática de Temas

El tema se aplica automáticamente cuando:
1. El usuario inicia sesión
2. El componente Dashboard detecta el rol del usuario
3. Se llama a la función `applyUserTheme(role)` que:
   - Actualiza todas las variables CSS del `:root`
   - Agrega una clase al `<body>` (`role-tecnico`, `role-supervisor`, `role-admin`)
   - Todos los componentes heredan automáticamente los nuevos colores

---

## 🔧 Implementación Técnica

### 1. Archivo de Configuración: `src/types/userRoles.ts`

Define:
- **Enum `UserRole`**: Tipos de roles disponibles
- **Interface `UserPermissions`**: Permisos granulares
- **Interface `UserTheme`**: Configuración de colores por rol
- **Const `ROLE_CONFIGS`**: Configuración completa de cada rol
- **Funciones helpers**:
  - `getRoleConfig(role)`: Obtiene configuración del rol
  - `hasPermission(role, permission)`: Verifica permisos
  - `applyUserTheme(role)`: Aplica tema visual
  - `getRoleBadge(role)`: Obtiene badge con icono y nombre
  - `canPerformAction(role, action, context)`: Verifica acción con contexto

### 2. Modificaciones en `Dashboard.tsx`

```typescript
// Import del sistema de roles
import { UserRole, applyUserTheme, getRoleConfig, getRoleBadge } from '../types/userRoles';

// Extender interface User con rol
interface User {
  username: string;
  name: string;
  role?: UserRole;
  // ... otros campos
}

// useEffect para aplicar tema cuando el usuario cambie
useEffect(() => {
  if (user && user.role) {
    applyUserTheme(user.role);
  }
}, [user]);

// Asignar rol en el login
const newUser: User = {
  username: loginUser,
  name: userName,
  role: userRole // UserRole.TECNICO, SUPERVISOR o ADMIN
};
```

### 3. Estilos en `App.css`

```css
/* Clases de rol aplicadas al body */
body.role-tecnico { /* Variables verdes */ }
body.role-supervisor { /* Variables azules */ }
body.role-admin { /* Variables oscuras */ }

/* Estilos específicos por rol */
body.role-tecnico .topbar { background: linear-gradient(...verde...); }
body.role-supervisor .topbar { background: linear-gradient(...azul...); }
body.role-admin .topbar { background: linear-gradient(...oscuro...); }
```

---

## 🚀 Uso del Sistema

### Iniciar Sesión con Diferentes Roles

1. **Como Técnico**:
   - Usuario: `tecnico` o `tec1`, `tec2`, etc.
   - Verás el entorno **VERDE**

2. **Como Supervisor**:
   - Usuario: `supervisor` o `sup1`, `sup2`, etc.
   - Verás el entorno **AZUL**

3. **Como Administrador**:
   - Usuario: `admin`
   - Verás el entorno **OSCURO**

### Visualización del Rol

El rol del usuario se muestra en:
1. **Badge en el menú desplegable** (esquina superior derecha)
2. **Console log** al iniciar sesión: `✅ Usuario autenticado como: 🔧 Técnico`
3. **Colores de toda la interfaz** (topbar, sidebar, botones, cards)

---

## 📊 Comparativa de Permisos

| Permiso | Técnico 🔧 | Supervisor 👔 | Admin ⚡ |
|---------|-----------|--------------|--------|
| Crear reportes | ✅ | ✅ | ✅ |
| Editar reportes propios | ✅ | ✅ | ✅ |
| Editar reportes de otros | ❌ | ✅ (región) | ✅ (todos) |
| Eliminar reportes | ❌ | ✅ (región) | ✅ (todos) |
| Aprobar reportes | ❌ | ✅ | ✅ |
| Crear usuarios | ❌ | ✅ (técnicos) | ✅ (todos) |
| Gestionar usuarios | ❌ | ✅ (limitado) | ✅ (total) |
| Ver estadísticas | ✅ (propias) | ✅ (región) | ✅ (todas) |
| Exportar datos | ❌ | ✅ | ✅ |
| Configuración | ❌ | ✅ (limitada) | ✅ (total) |
| Límite reportes/día | 20 | 50 | ∞ |
| Límite intervenciones | 50 | 100 | ∞ |
| Requiere aprobación | ✅ | ❌ | ❌ |

---

## 🎯 Próximos Pasos

1. **Creación de Usuarios**: Implementar formulario para crear usuarios con roles específicos
2. **Gestión de Permisos**: Panel de administración para asignar/modificar roles
3. **Validación de Acciones**: Implementar verificación de permisos en cada acción
4. **Registro de Auditoría**: Tracking de acciones por rol para seguridad
5. **Autenticación Real**: Integrar con backend para autenticación segura

---

## ⚠️ Notas Importantes

- El sistema actual usa **autenticación simulada** (cualquier contraseña funciona)
- Los roles se asignan automáticamente según el username en el login
- En producción, el rol debe venir del **backend/base de datos**
- Los permisos están definidos pero **no están validados en todas las acciones** aún
- El tema visual es **completamente funcional** y se aplica automáticamente

---

## 🔐 Seguridad

Para implementación en producción:
1. Validar permisos en **backend** (no confiar solo en frontend)
2. Usar **JWT tokens** con información de rol
3. Verificar permisos antes de cada **operación crítica**
4. Implementar **logging** de acciones por rol
5. Usar **autenticación real** con contraseñas hasheadas

---

## 📝 Ejemplo de Verificación de Permisos

```typescript
import { canPerformAction, UserRole } from './types/userRoles';

// Verificar si un usuario puede eliminar un reporte
const canDelete = canPerformAction(
  user.role,
  'canDeleteReports',
  { isOwnReport: false }
);

if (canDelete) {
  // Permitir eliminación
} else {
  // Mostrar error de permisos
}
```

---

Desarrollado con ❤️ para MOPC Dashboard
