# Backlog de Historias de Usuario — Banquito Solidario

Documento de trabajo para desarrollar el sistema por historias de usuario. Este archivo es la fuente de verdad del backlog; se actualiza conforme se implementan historias.

---

## Cómo trabajamos

1. Cada historia se implementa **de punta a punta** y queda funcional sola: backend → frontend → verificación.
2. Yo propongo las historias, sus criterios de aceptación y las tareas técnicas. Tú decides el orden y aportas la **lógica de negocio** que yo no puedo inventar.
3. Se trabaja **una historia a la vez**. Cuando la pruebas y dices "lista", la movemos a *Hecho* y pasamos a la siguiente.
4. Nada destructivo (reset de BD, commits, pushes) sin tu confirmación.
5. Verificación por historia: `tsc` sin errores + prueba de la funcionalidad en el navegador / API.

## Formato de una historia

```
[ID] Como <rol>, quiero <acción> para <beneficio>

Criterios de aceptación:
- [ ] ...

Tareas técnicas:
- [ ] Backend ...
- [ ] Frontend ...
- [ ] Verificación ...
```

## Priorización

| Prioridad | Criterio |
|-----------|----------|
| P0 | Sin esto el sistema no es usable (acceso, datos) |
| P1 | Funcionalidad core de los módulos |
| P2 | Controles y validaciones de negocio |
| P3 | Pulido UX y conveniencia |

---

# Epic 1 — Acceso y Seguridad (P0)

Objetivo: que el sistema solo sea accesible con sesión iniciada, con roles y gestión de usuarios.

> **Estado actual del código:** el backend ya tiene el modelo `Usuario`, el endpoint `POST /api/configuracion/login` y el CRUD de usuarios. Pero el login **no emite JWT** (devuelve solo `{ user }`), el middleware `auth.ts` existe pero **ninguna ruta lo usa**, y el frontend **no tiene página de login** ni protección de rutas. Esta epic cierra esos huecos.

### US-01 — Iniciar sesión (P0)

**Como** miembro de la directiva, **quiero** iniciar sesión con usuario y contraseña **para** acceder al sistema de forma segura.

**Criterios de aceptación:**
- [ ] Existe una página `/login` con campos usuario y contraseña.
- [ ] Credenciales correctas (`admin` / `admin123` por defecto) redirigen al dashboard.
- [ ] Credenciales incorrectas muestran un error claro ("Usuario o contraseña incorrectos") sin redirigir.
- [ ] Una cuenta desactivada no puede iniciar sesión y muestra su motivo.
- [ ] El backend emite un **JWT** al iniciar sesión (hoy no lo hace) y lo devuelve junto al usuario.
- [ ] La sesión persiste al recargar la página (token en `localStorage`).
- [ ] El usuario puede cerrar sesión desde el menú, lo que limpia el token y devuelve a `/login`.

**Tareas técnicas:**
- [ ] Backend: `configuracionService.login` firma un JWT con `env.JWT_SECRET` e incluye `sub`, `rol` y `username` en el payload; el controller lo devuelve en la respuesta.
- [ ] Frontend: página `LoginPage` (ruta pública), store de auth en Zustand, `authApi.login()`, persistencia del token.
- [ ] Frontend: botón "Cerrar sesión" en el layout y limpieza de estado.
- [ ] Verificación: login exitoso/fallido/desactivado; recarga mantiene sesión; logout funciona.

### US-02 — Proteger las rutas del frontend (P0)

**Como** usuario, **quiero** que las páginas internas exijan sesión **para** que nadie vea datos sin autenticarse.

**Criterios de aceptación:**
- [ ] Al entrar a cualquier ruta privada sin sesión, se redirige a `/login`.
- [ ] Tras iniciar sesión, se regresa a la página que se intentaba abrir (o al dashboard).
- [ ] Un token inválido/expirado redirige a `/login` en lugar de romper la app.

**Tareas técnicas:**
- [ ] Frontend: `AuthGuard` / `RequireAuth` envolviendo las rutas del `AdminLayout` en `routes/index.tsx`.
- [ ] Frontend: interceptor de axios que ante `401` cierra sesión y redirige.
- [ ] Verificación: visitar `/socios` sin sesión → `/login`; con token expirado → `/login`.

### US-03 — Proteger la API con JWT (P0)

**Como** administrador, **quiero** que los endpoints exijan un token válido **para** que nadie sin sesión acceda a los datos.

**Criterios de aceptación:**
- [ ] Todas las rutas `/api/*` exigen `Authorization: Bearer <token>`, excepto `POST /api/configuracion/login`.
- [ ] Petición sin token → `401`.
- [ ] Token inválido o expirado → `401` con mensaje claro.
- [ ] El frontend envía el token en todas las peticiones autenticadas.

**Tareas técnicas:**
- [ ] Backend: aplicar `auth` middleware a las rutas (puede ser global en `server.ts` con excepción de login, o por router).
- [ ] Frontend: interceptor de axios que agrega el header de autorización desde el store.
- [ ] Verificación: `curl` sin token → 401; con token → 200.

### US-04 — Roles y permisos (P1)

**Como** administrador, **quiero** restringir ciertas operaciones por rol **para** mantener el control sobre acciones sensibles (aprobar arqueos, gestionar usuarios, configurar conceptos).

**Criterios de aceptación:**
- [ ] Existen roles definidos (ej: `ADMIN`, `TESORERO`, `VOCAL`).
- [ ] El middleware `requireRol(...)` rechaza con `403` operaciones no permitidas.
- [ ] El frontend oculta menús/acciones que el rol no puede usar.
- [ ] El seed crea al menos un usuario admin y un tesorero de ejemplo.

**Tareas técnicas:**
- [ ] Backend: middleware `requireRol`, aplicado a gestión de usuarios y conceptos.
- [ ] Frontend: helper `can(rol, permiso)` y filtrado de navegación/acciones.
- [ ] Verificación: admin accede, tesorero recibe 403 y no ve el menú.

### US-05 — Gestión de usuarios (P1)

**Como** administrador, **quiero** crear, editar y desactivar usuarios con roles y contraseña **para** administrar los accesos al sistema.

**Criterios de aceptación:**
- [ ] Página que lista usuarios (búsqueda, estado, rol).
- [ ] Crear usuario: nombre, apellidos, username único, correo único (opcional), rol, contraseña.
- [ ] Editar datos del usuario y cambiar su rol/estado.
- [ ] Restablecer contraseña de un usuario.
- [ ] Desactivar/eliminar usuario (no se puede eliminar al usuario `admin`).
- [ ] El usuario no ve la contraseña de otros (solo puede reestablecerla).

**Tareas técnicas:**
- [ ] Backend: los endpoints de usuarios ya existen (`configuracionRoutes.ts`); añadir middleware de rol y validar que no se desactive al último admin.
- [ ] Frontend: páginas de listado/formulario de usuarios bajo Configuración.
- [ ] Verificación: CRUD completo contra la API.

### US-06 — Cambiar mi contraseña (P2)

**Como** usuario, **quiero** cambiar mi propia contraseña **para** proteger mi cuenta.

**Criterios de aceptación:**
- [ ] Opción "Cambiar contraseña" en el menú del usuario.
- [ ] Solicita contraseña actual + nueva (+ confirmación), valida y actualiza.
- [ ] Tras el cambio, la sesión se mantiene.

**Tareas técnicas:**
- [ ] Backend: endpoint `PUT /api/configuracion/usuarios/:id/password` ya existe; validar contraseña actual antes de cambiar.
- [ ] Frontend: modal/página de cambio de contraseña.
- [ ] Verificación: cambio exitoso y persistencia de sesión.

---

# Epic 2 — Respaldo de Datos (P0)

Objetivo: que la información (BD + archivos de `uploads/`) no se pierda.

### US-07 — Respaldo de BD y archivos (P0)

**Como** administrador, **quiero** generar un respaldo completo (BD MySQL + `uploads/`) con un comando **para** no perder datos ni fotos al resetear o mover el servidor.

**Criterios de aceptación:**
- [ ] Existe un script (`npm run backup`) que exporta la BD (dump SQL) y copia `backend/uploads/`.
- [ ] El respaldo se guarda con fecha/hora en una carpeta `backups/`.
- [ ] Existe el comando inverso de restauración (documentado o script).
- [ ] Se documenta en el README cómo restaurar.

**Tareas técnicas:**
- [ ] Script Node (`scripts/backup.js`) que usa `mysqldump` y copia la carpeta.
- [ ] Script de restauración (opcional).
- [ ] Actualizar README con instrucciones.
- [ ] Verificación: ejecutar backup, borrar un dato, restaurar, confirmar que vuelve.

---

# Epic 3 — Completar Módulos Core (P1)

Objetivo: cerrar la lógica de negocio pendiente de cada módulo.

### US-08 — Registro de aportes con validación de negocio (P1)

**Como** tesorero, **quiero** registrar aportes de un socio en su fondo con validaciones **para** evitar aportes duplicados o montos inválidos.

**Criterios de aceptación:**
- [ ] Solo se puede aportar a socios activos dentro del fondo.
- [ ] Un aporte obligatorio no se puede duplicar en el mismo periodo.
- [ ] Se valida que el monto sea mayor a 0.
- [ ] El aporte queda vinculado al `FondoSocio` correcto.

**Tareas técnicas:**
- [ ] Revisar y completar validaciones en `aporteValidation.ts` y `aporteService.ts`.
- [ ] Frontend: reflejar errores de negocio en el formulario.
- [ ] Verificación: casos duplicado/inválido rechazados con mensaje claro.

### US-09 — Cobro de cuotas de préstamo (P1)

**Como** tesorero, **quiero** registrar el pago de una cuota y que recalcule el saldo **para** llevar el estado real del crédito.

**Criterios de aceptación:**
- [ ] Pagar una cuota registra fecha de pago, método y comprobante.
- [ ] El estado del préstamo pasa a `PAGADO` cuando todas las cuotas están pagadas.
- [ ] No se puede pagar una cuota dos veces.
- [ ] La cuota impaga más antigua se paga primero (orden).

**Tareas técnicas:**
- [ ] Endpoint de pago de cuota en `creditoService.ts` con transacción.
- [ ] Frontend: botón "Registrar pago" en el detalle del crédito.
- [ ] Verificación: pago de todas las cuotas → préstamo `PAGADO`.

### US-10 — Aprobación de arqueos (P1)

**Como** administrador, **quiero** revisar y aprobar/rechazar arqueos **para** validar la conformidad de caja.

**Criterios de aceptación:**
- [ ] Un arqueo pendiente puede aprobarse (con observación opcional).
- [ ] Aprobar ajusta el saldo de la caja si hay diferencia (según regla del negocio).
- [ ] Rechazar exige observación y no altera el saldo.
- [ ] Un arqueo ya resuelto no se puede volver a aprobar.

**Tareas técnicas:**
- [ ] Revisar `cajaService.aprobarArqueo` (transaccional).
- [ ] Frontend: flujo de aprobación en `CajaDetailPage` (el `aprobadorId` hardcodeado ya se quitó; definir regla de negocio).
- [ ] Verificación: aprobar/rechazar y efectos en saldo.

### US-11 — Cierre de fondo (P2)

**Como** administrador, **quiero** cerrar un fondo rotatorio **para** finalizar su ciclo y evitar nuevas operaciones.

**Criterios de aceptación:**
- [ ] Cerrar un fondo exige confirmación y no permite nuevas operaciones sobre él.
- [ ] Solo se puede cerrar un fondo con saldo disponible en 0 o tras cuadre (regla de negocio).
- [ ] La fecha de cierre queda registrada.

**Tareas técnicas:**
- [ ] Backend: acción `cerrar` en `fondoService.ts`.
- [ ] Frontend: botón con confirmación en `FondoDetailPage`.
- [ ] Verificación: intentar operar sobre fondo cerrado → bloqueado.

### US-12 — Flujo de caja proyectado (P2)

**Como** tesorero, **quiero** registrar y comparar el flujo proyectado vs real de la caja **para** planificar la liquidez.

**Criterios de aceptación:**
- [ ] CRUD de proyecciones por caja y fecha.
- [ ] Se marca `REALIZADO` cuando hay movimiento que cubre la proyección.
- [ ] El detalle de caja muestra proyectado vs real.

**Tareas técnicas:**
- [ ] Backend: endpoints de `FlujoCajaProyectado` (modelo ya existe).
- [ ] Frontend: sección en `CajaDetailPage`.
- [ ] Verificación: crear proyección y ver su estado.

---

# Epic 4 — Pulido y UX (P3)

### US-13 — Estados de error y vacíos consistentes

**Como** usuario, **quiero** mensajes claros al fallar y estados vacíos amigables **para** entender qué pasa sin soporte técnico.

**Criterios de aceptación:**
- [ ] Toda petición fallida muestra un mensaje legible y accionable.
- [ ] Listas vacías muestran un estado vacío con acción para crear.
- [ ] Botones de envío muestran estado de carga y deshabilitan doble envío.

### US-14 — Confirmaciones en acciones destructivas

**Como** usuario, **quiero** confirmar antes de eliminar o cerrar entidades **para** evitar errores costosos.

**Criterios de aceptación:**
- [ ] Eliminar socio, fondo, caja o usuario requiere confirmación (modal).
- [ ] La confirmación describe qué se eliminará y su consecuencia.

### US-15 — Ficha del socio imprimible

**Como** directiva, **quiero** imprimir/exportar la ficha del socio **para** uso en reuniones.

**Criterios de aceptación:**
- [ ] La ficha tiene vista de impresión limpia (sin navegación).
- [ ] (Opcional) Exportar a PDF desde el navegador.

---

# Epic 5 — Respaldo externo de archivos (P3, postergable)

### US-16 — Fotos en almacenamiento externo (opcional)

**Como** administrador, **quiero** que las fotos y documentos se guarden en un servicio externo **para** no perderlos si se pierde el servidor local.

**Criterios de aceptación:**
- [ ] Subida a servicio de almacenamiento (S3/Cloudinary) en lugar de disco local.
- [ ] Las URLs de los archivos existentes siguen funcionando (migración).

---

# Hecho

| ID | Historia | Fecha |
|----|----------|-------|
| — | Migración de BD al nuevo esquema (backend + frontend) | 2026-07 |

---

# Propuesta de orden de trabajo

1. **US-01, US-02, US-03** (acceso: login + protección frontend + protección API) — P0, base de todo.
2. **US-07** (respaldo) — P0, barato y protege la información que ya tienes.
3. **US-04, US-05, US-06** (roles y gestión de usuarios).
4. **US-08 → US-12** (lógica de negocio de módulos).
5. **US-13 → US-16** (pulido).

¿Empezamos por la **US-01 (Iniciar sesión)**? Es la que destapa todo el resto.
