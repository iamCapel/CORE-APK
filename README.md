# MOPC Dashboard v0.1# MOPC Dashboard



Sistema de gestión de intervenciones de campo para el Ministerio de Obras Públicas y Comunicaciones (MOPC) de República Dominicana.Dashboard de gestión para el Ministerio de Obras Públicas y Comunicaciones (MOPC) de República Dominicana.



## 🚀 Características## Características



- ✅ Sistema de roles de usuario (Técnico, Supervisor, Administrador)- 📊 Dashboard interactivo con métricas en tiempo real

- ✅ Registro de intervenciones con formularios dinámicos- 🗺️ Integración con mapas (Google Maps y Leaflet)

- ✅ Geolocalización GPS para coordenadas de intervención- 📋 Sistema de reportes y formularios

- ✅ Estructura jerárquica: Región → Provincia → Municipio → Distrito Municipal → Sector- 👥 Gestión de usuarios

- ✅ Validación de datos geográficos de República Dominicana (actualizado 2025)- 📤 Exportación de datos

- ✅ Gestión de usuarios y permisos- 🎨 Interfaz moderna y responsiva

- ✅ Dashboard con estadísticas y visualización de reportes

- ✅ Exportación de datos## Tecnologías

- ✅ Sistema de aprobación de reportes

- **React 19** con TypeScript

## 📋 Requisitos- **Chart.js** para gráficos

- **Leaflet** y **Google Maps** para mapas

- Node.js 14 o superior- **CSS3** con diseño responsivo

- npm o yarn

## Scripts Disponibles

## 🛠️ Instalación

En el directorio del proyecto, puedes ejecutar:

```bash

# Clonar el repositorio### `npm start`

git clone https://github.com/iamCapel/MOPC-Dashboard.git

Runs the app in the development mode.\

# Navegar al directorioOpen [http://localhost:3000](http://localhost:3000) to view it in the browser.

cd MOPC-Dashboard

The page will reload if you make edits.\

# Instalar dependenciasYou will also see any lint errors in the console.

npm install

### `npm test`

# Iniciar el servidor de desarrollo

npm startLaunches the test runner in the interactive watch mode.\

```See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.



El proyecto se abrirá en [http://localhost:3000](http://localhost:3000)### `npm run build`



## 👥 Usuarios de PruebaBuilds the app for production to the `build` folder.\

It correctly bundles React in production mode and optimizes the build for the best performance.

### Nivel 1: Técnico (Verde)

- **Usuario:** `tecnico`The build is minified and the filenames include the hashes.\

- **Rol:** Técnico de campoYour app is ready to be deployed!

- **Permisos:** Crear y editar sus propios reportes

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### Nivel 2: Supervisor (Azul)

- **Usuario:** `supervisor`### `npm run eject`

- **Rol:** Supervisor de proyectos

- **Permisos:** Aprobar reportes, gestionar técnicos de su región**Note: this is a one-way operation. Once you `eject`, you can’t go back!**



### Nivel 3: Administrador (Negro)If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

- **Usuario:** `admin` o `eng`

- **Rol:** Administrador del sistemaInstead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

- **Permisos:** Acceso completo al sistema

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

> **Nota:** Cualquier contraseña es válida para usuarios de prueba

## Learn More

## 📁 Estructura del Proyecto

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

```

MOPC-Dashboard/To learn React, check out the [React documentation](https://reactjs.org/).

├── public/              # Archivos públicos
├── src/
│   ├── components/      # Componentes React
│   │   ├── Dashboard.tsx
│   │   ├── ReportForm.tsx
│   │   ├── ReportsPage.tsx
│   │   └── UsersPage.tsx
│   ├── types/          # Definiciones TypeScript
│   ├── App.tsx         # Componente principal
│   └── index.tsx       # Punto de entrada
├── package.json
└── tsconfig.json
```

## 🔧 Scripts Disponibles

```bash
# Desarrollo
npm start

# Compilar para producción
npm run build

# Ejecutar tests
npm test
```

## 🌍 Regiones de República Dominicana (2025)

El sistema incluye las 11 regiones oficiales actualizadas:

1. Ozama o Metropolitana
2. Cibao Norte
3. Cibao Sur
4. Cibao Nordeste
5. Cibao Noroeste
6. Santiago
7. Valdesia
8. Enriquillo
9. El Valle
10. Yuma
11. Higuamo

## 📊 Funcionalidades Principales

### Para Técnicos
- Crear reportes de intervenciones
- Capturar coordenadas GPS
- Completar formularios con datos técnicos
- Ver sus propias estadísticas

### Para Supervisores
- Aprobar/rechazar reportes
- Ver reportes de su región
- Crear usuarios técnicos
- Exportar datos regionales

### Para Administradores
- Gestión completa del sistema
- Administrar todos los usuarios
- Acceso a todas las regiones
- Configuración del sistema

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 👨‍💻 Autor

**iamCapel**

## 📧 Contacto

Para soporte o consultas sobre el proyecto, contactar al equipo de desarrollo.

---

**MOPC Dashboard v0.1** - Sistema de Gestión de Intervenciones de Campo
