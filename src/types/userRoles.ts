// Sistema de roles de usuario para MOPC Dashboard

export enum UserRole {
  TECNICO = 'tecnico',
  SUPERVISOR = 'supervisor',
  ADMIN = 'admin'
}

export interface UserPermissions {
  // Permisos de acceso a secciones
  canCreateReports: boolean;
  canEditReports: boolean;
  canDeleteReports: boolean;
  canViewAllReports: boolean;
  canApproveReports: boolean;
  
  // Permisos de usuarios
  canCreateUsers: boolean;
  canEditUsers: boolean;
  canDeleteUsers: boolean;
  canViewAllUsers: boolean;
  
  // Permisos de sistema
  canAccessSettings: boolean;
  canExportData: boolean;
  canViewAnalytics: boolean;
  canManageRegions: boolean;
  
  // Límites operacionales
  maxReportsPerDay: number;
  maxInterventionsPerReport: number;
  requiresApproval: boolean;
}

export interface UserTheme {
  name: string;
  primaryColor: string;
  primaryColorDark: string;
  secondaryColor: string;
  tertiaryColor: string;
  accentColor: string;
  shadowColor: string;
  gradientStart: string;
  gradientEnd: string;
}

export interface RoleConfig {
  role: UserRole;
  displayName: string;
  icon: string;
  permissions: UserPermissions;
  theme: UserTheme;
  description: string;
}

// Tema unificado para todos los roles (Mismo color para todos)
const unifiedTheme: UserTheme = {
  name: 'MOPC Unificado',
  primaryColor: '#1f2937', // Gray-800
  primaryColorDark: '#111827', // Gray-900
  secondaryColor: '#374151', // Gray-700
  tertiaryColor: '#f3f4f6', // Gray-100
  accentColor: '#6b7280', // Gray-500
  shadowColor: 'rgba(31, 41, 55, 0.4)',
  gradientStart: '#1f2937',
  gradientEnd: '#111827'
};

// Configuración para Usuario Técnico (Tema unificado)
const tecnicoConfig: RoleConfig = {
  role: UserRole.TECNICO,
  displayName: 'Técnico',
  icon: '🔧',
  description: 'Usuario de campo responsable de crear y registrar intervenciones',
  permissions: {
    // Permisos de reportes
    canCreateReports: true,
    canEditReports: true, // Solo sus propios reportes
    canDeleteReports: false,
    canViewAllReports: false, // Solo ve sus reportes
    canApproveReports: false,
    
    // Permisos de usuarios
    canCreateUsers: false,
    canEditUsers: false,
    canDeleteUsers: false,
    canViewAllUsers: false,
    
    // Permisos de sistema
    canAccessSettings: false,
    canExportData: false,
    canViewAnalytics: true, // Solo sus propias estadísticas
    canManageRegions: false,
    
    // Límites
    maxReportsPerDay: 20,
    maxInterventionsPerReport: 50,
    requiresApproval: true // Sus reportes requieren aprobación
  },
  theme: unifiedTheme // Usar tema unificado
};

// Configuración para Usuario Supervisor (Tema unificado)
const supervisorConfig: RoleConfig = {
  role: UserRole.SUPERVISOR,
  displayName: 'Supervisor',
  icon: '👔',
  description: 'Supervisor de proyectos con capacidad de aprobar y gestionar reportes',
  permissions: {
    // Permisos de reportes
    canCreateReports: true,
    canEditReports: true, // Puede editar reportes de su región
    canDeleteReports: true, // Puede eliminar reportes de su región
    canViewAllReports: true, // Ve todos los reportes de su región
    canApproveReports: true,
    
    // Permisos de usuarios
    canCreateUsers: true, // Solo técnicos
    canEditUsers: true, // Solo técnicos de su región
    canDeleteUsers: false,
    canViewAllUsers: true, // De su región
    
    // Permisos de sistema
    canAccessSettings: true, // Configuración limitada
    canExportData: true,
    canViewAnalytics: true, // Estadísticas de su región
    canManageRegions: false,
    
    // Límites
    maxReportsPerDay: 50,
    maxInterventionsPerReport: 100,
    requiresApproval: false // No requiere aprobación
  },
  theme: unifiedTheme // Usar tema unificado
};

// Configuración para Usuario Admin (Tema unificado)
const adminConfig: RoleConfig = {
  role: UserRole.ADMIN,
  displayName: 'Administrador',
  icon: '⚡',
  description: 'Administrador del sistema con acceso completo a todas las funcionalidades',
  permissions: {
    // Permisos de reportes
    canCreateReports: true,
    canEditReports: true, // Todos los reportes
    canDeleteReports: true, // Todos los reportes
    canViewAllReports: true, // Todos los reportes
    canApproveReports: true,
    
    // Permisos de usuarios
    canCreateUsers: true, // Todos los roles
    canEditUsers: true, // Todos los usuarios
    canDeleteUsers: true,
    canViewAllUsers: true,
    
    // Permisos de sistema
    canAccessSettings: true, // Acceso completo
    canExportData: true,
    canViewAnalytics: true, // Todas las estadísticas
    canManageRegions: true,
    
    // Límites
    maxReportsPerDay: -1, // Ilimitado
    maxInterventionsPerReport: -1, // Ilimitado
    requiresApproval: false
  },
  theme: unifiedTheme // Usar tema unificado
};

// Mapa de configuraciones por rol
export const ROLE_CONFIGS: Record<UserRole, RoleConfig> = {
  [UserRole.TECNICO]: tecnicoConfig,
  [UserRole.SUPERVISOR]: supervisorConfig,
  [UserRole.ADMIN]: adminConfig
};

// Mapa de normalización para roles que vienen de Firebase con valor diferente
const ROLE_NORMALIZATION: Record<string, UserRole> = {
  'administrador': UserRole.ADMIN,
  'admin': UserRole.ADMIN,
  'supervisor': UserRole.SUPERVISOR,
  'tecnico': UserRole.TECNICO,
  'técnico': UserRole.TECNICO,
};

// Normaliza cualquier string de rol al UserRole correspondiente
export function normalizeRole(role: string | undefined): UserRole {
  if (!role) return UserRole.TECNICO;
  return ROLE_NORMALIZATION[role.toLowerCase()] || UserRole.TECNICO;
}

// Función para obtener configuración por rol (con fallback seguro)
export function getRoleConfig(role: UserRole | string | undefined): RoleConfig {
  const normalized = normalizeRole(role as string);
  return ROLE_CONFIGS[normalized] || ROLE_CONFIGS[UserRole.TECNICO];
}

// Función para verificar permisos
export function hasPermission(
  role: UserRole,
  permission: keyof UserPermissions
): boolean {
  const config = getRoleConfig(role);
  return config.permissions[permission] as boolean;
}

// Función para aplicar tema de usuario
export function applyUserTheme(role: UserRole): void {
  // Validar que el rol sea válido, si no usar ADMIN
  let safeRole = role;
  if (!role || !(role in ROLE_CONFIGS)) {
    safeRole = UserRole.ADMIN;
  }
  const theme = getRoleConfig(safeRole).theme;
  const root = document.documentElement;
  
  // Aplicar variables CSS dinámicas
  root.style.setProperty('--user-primary', theme.primaryColor);
  root.style.setProperty('--user-primary-dark', theme.primaryColorDark);
  root.style.setProperty('--user-secondary', theme.secondaryColor);
  root.style.setProperty('--user-tertiary', theme.tertiaryColor);
  root.style.setProperty('--user-accent', theme.accentColor);
  root.style.setProperty('--user-shadow', theme.shadowColor);
  root.style.setProperty('--user-gradient-start', theme.gradientStart);
  root.style.setProperty('--user-gradient-end', theme.gradientEnd);
  
  // Agregar clase de rol al body para estilos condicionales
  document.body.classList.remove('role-tecnico', 'role-supervisor', 'role-admin');
  document.body.classList.add(`role-${role}`);
}

// Función para obtener límites del rol
export function getRoleLimits(role: UserRole) {
  const config = getRoleConfig(role);
  return {
    maxReportsPerDay: config.permissions.maxReportsPerDay,
    maxInterventionsPerReport: config.permissions.maxInterventionsPerReport,
    requiresApproval: config.permissions.requiresApproval
  };
}

// Función para verificar si un usuario puede realizar una acción
export function canPerformAction(
  userRole: UserRole,
  action: keyof UserPermissions,
  context?: {
    isOwnReport?: boolean;
    targetUserRole?: UserRole;
    region?: string;
  }
): boolean {
  const config = getRoleConfig(userRole);
  const hasBasePermission = config.permissions[action] as boolean;
  
  // Lógica adicional según el contexto
  if (!hasBasePermission) return false;
  
  // Técnicos solo pueden editar sus propios reportes
  if (userRole === UserRole.TECNICO && action === 'canEditReports') {
    return context?.isOwnReport ?? false;
  }
  
  // Supervisores solo pueden crear técnicos
  if (userRole === UserRole.SUPERVISOR && action === 'canCreateUsers') {
    return context?.targetUserRole === UserRole.TECNICO;
  }
  
  return true;
}

// Interfaz extendida de usuario con rol
export interface UserWithRole {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  region?: string;
  province?: string;
  email?: string;
  phone?: string;
  createdAt: string;
  isActive: boolean;
  avatar?: string;
}

// Función helper para crear badge de rol
export function getRoleBadge(role: UserRole): string {
  const config = getRoleConfig(role);
  return `${config.icon} ${config.displayName}`;
}
