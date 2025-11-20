# 🔄 Guía de Sincronización con GitHub

## 📘 ¿Por qué no aparecían los cambios?

Cuando trabajas con Git, hay **3 niveles** donde pueden estar tus cambios:

1. **Workspace Local** (tu computadora/Codespaces) ← Aquí estaban tus cambios ayer
2. **Commit Local** (guardado en Git local) ← Los guardamos con `git commit`
3. **GitHub (remoto)** ← No estaban aquí, por eso no los viste en casa

**El problema:** Hicimos `git commit` pero NO hicimos `git push`, entonces los cambios solo estaban en este Codespace.

---

## ✅ SOLUCIÓN - Flujo de Trabajo Correcto

### Cada vez que termines de trabajar:

```bash
# 1. Ver qué archivos cambiaron
git status

# 2. Agregar los cambios al staging
git add .
# O agregar archivos específicos:
# git add src/components/Dashboard.tsx

# 3. Crear un commit con mensaje descriptivo
git commit -m "Descripción de los cambios"

# 4. 🔴 IMPORTANTE: Subir a GitHub
git push origin main
```

### Cuando abras el proyecto desde otro computador:

```bash
# Descargar los últimos cambios de GitHub
git pull origin main
```

---

## 🚀 Comandos Git Esenciales

### Ver el estado actual
```bash
git status                  # Ver archivos modificados
git log --oneline -5        # Ver últimos 5 commits
git remote -v               # Ver repositorio remoto configurado
```

### Guardar cambios
```bash
git add .                   # Agregar TODOS los archivos
git add <archivo>           # Agregar un archivo específico
git commit -m "mensaje"     # Crear commit
git push origin main        # Subir a GitHub ⭐ IMPORTANTE
```

### Actualizar desde GitHub
```bash
git pull origin main        # Descargar cambios de GitHub
```

### Resolver conflictos (si trabajas desde 2 computadoras)
```bash
# Si hiciste cambios en casa y aquí sin sincronizar:
git fetch origin            # Ver qué hay en GitHub
git pull origin main        # Intentar fusionar
# Si hay conflictos, Git te dirá qué archivos resolver
```

---

## 📋 Flujo de Trabajo Recomendado

### 🏠 Trabajando desde Casa (Codespaces Online)

```bash
# 1. Al abrir el proyecto
git pull origin main

# 2. Trabajar normalmente...

# 3. Al terminar (SIEMPRE)
git add .
git commit -m "Cambios desde casa: [descripción]"
git push origin main  # 🔴 NO OLVIDAR
```

### 💻 Trabajando desde Otro Computador

```bash
# 1. Al abrir el proyecto
git pull origin main

# 2. Trabajar normalmente...

# 3. Al terminar (SIEMPRE)
git add .
git commit -m "Cambios desde trabajo: [descripción]"
git push origin main  # 🔴 NO OLVIDAR
```

---

## 🛡️ Prevenir Pérdida de Cambios

### Checklist antes de cerrar Codespaces:

- [ ] `git status` - ¿Hay cambios sin guardar?
- [ ] `git add .` - Agregar cambios
- [ ] `git commit -m "mensaje"` - Crear commit
- [ ] `git push origin main` - **SUBIR A GITHUB** ⭐
- [ ] Verificar en GitHub.com que aparecen los cambios

### Verificación en GitHub.com:
1. Ir a https://github.com/iamCapel/MOPC-v0.1
2. Ver que el último commit aparezca
3. Verificar la fecha/hora del último commit

---

## 🔧 Configuración Útil

### Alias para hacer todo en un comando:
```bash
# Agregar al archivo ~/.bashrc o ~/.zshrc
alias gsave='git add . && git commit -m "Auto-save" && git push origin main'

# Usar:
gsave  # Guarda y sube todo automáticamente
```

### Configurar Git (primera vez):
```bash
git config --global user.name "Tu Nombre"
git config --global user.email "tu@email.com"
```

---

## ⚠️ Situaciones Comunes

### "No aparecen mis cambios en otro computador"
```bash
# En el otro computador:
git pull origin main
```

### "Hice cambios en 2 lugares y hay conflicto"
```bash
git pull origin main
# Git te mostrará los archivos en conflicto
# Editar los archivos y elegir qué cambios mantener
git add .
git commit -m "Resolver conflictos"
git push origin main
```

### "Olvidé hacer push y ya cerré Codespaces"
- Los cambios se pierden si no hiciste commit
- Si hiciste commit pero no push, estarán en ese Codespace cuando lo reabras

### "Quiero ver qué cambios hay en GitHub sin descargarlos"
```bash
git fetch origin
git log HEAD..origin/main  # Ver commits que están en GitHub pero no aquí
```

---

## 📊 Estado Actual de tu Proyecto

```
✅ Commit creado: 4f7a368
✅ Subido a GitHub: main -> main
✅ Visible en: https://github.com/iamCapel/MOPC-v0.1
```

**Cambios incluidos:**
- Sistema de autenticación completo
- Calendario de reportes
- Filtrado por roles
- 19 archivos modificados/creados
- Build listo para deployment

---

## 🎯 Regla de Oro

**NUNCA cierres Codespaces sin hacer:**
```bash
git push origin main
```

Puedes crear un script automático:

```bash
# Crear archivo: ~/auto-push.sh
#!/bin/bash
cd /workspaces/MOPC-v0.1
git add .
git commit -m "Auto-save: $(date)"
git push origin main
echo "✅ Cambios guardados en GitHub"
```

```bash
# Hacer ejecutable:
chmod +x ~/auto-push.sh

# Usar antes de cerrar:
~/auto-push.sh
```

---

## 📞 Ayuda Rápida

### Verificar si hay cambios pendientes:
```bash
git status
```

### Ver si estás sincronizado con GitHub:
```bash
git fetch origin
git status
# Dirá: "Your branch is up to date" o "Your branch is ahead of 'origin/main'"
```

### Forzar actualización desde GitHub (CUIDADO: sobrescribe cambios locales):
```bash
git fetch origin
git reset --hard origin/main
```

---

## ✨ Resumen Ejecutivo

### Al TERMINAR de trabajar:
```bash
git add . && git commit -m "Descripción" && git push origin main
```

### Al EMPEZAR a trabajar:
```bash
git pull origin main
```

### Verificar estado:
```bash
git status
```

---

**Fecha de creación:** 20 de noviembre de 2025  
**Última actualización:** Commit 4f7a368 subido exitosamente a GitHub

---

## 🔗 Enlaces Útiles

- Tu repositorio: https://github.com/iamCapel/MOPC-v0.1
- Documentación Git: https://git-scm.com/doc
- GitHub Guides: https://guides.github.com/

---

**Nota:** Todos los cambios que hicimos ayer ya están en GitHub. Cuando abras Codespaces desde casa, haz `git pull origin main` y aparecerán todos los archivos nuevos.
