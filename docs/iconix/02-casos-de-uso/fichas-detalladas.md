# Fichas de Casos de Uso

Formato ICONIX: descripción breve para todos y flujo principal + alternativas para los casos críticos.

---

## CU-01 — Autenticarse

**Actor:** Administrador, Tesorero.
**Descripción breve:** El usuario ingresa sus credenciales y el sistema emite un token JWT que permite el acceso a las rutas protegidas.

**Flujo principal:**
1. El usuario ingresa `username` y `password`.
2. El sistema valida las credenciales contra la tabla `usuario`.
3. El sistema verifica que el usuario esté `ACTIVO`.
4. El sistema firma un JWT (`JWT_SECRET`) con `sub`, `rol` y `username`.
5. El sistema devuelve el token y los datos del usuario.
6. El usuario ingresa al dashboard.

**Flujos alternativos:**
- 2a. Credenciales incorrectas → error 401 "Usuario o contraseña incorrectos".
- 3a. Usuario desactivado → error 403 con motivo.

**Postcondiciones:** Existe una sesión activa (token en `localStorage`).

---

## CU-02 — Gestionar Socios

**Actor:** Administrador, Tesorero.
**Descripción breve:** Registro, consulta, edición y desactivación de socios; gestión de sus beneficiarios, documentos y código QR.

**Flujo principal:**
1. El usuario busca o lista socios (por nombre, DNI o código).
2. El usuario crea/edita un socio (datos personales, foto, documentos).
3. El sistema valida la unicidad de DNI y código.
4. El sistema registra la operación en `auditlog`.
5. El usuario puede agregar/eliminar beneficiarios y subir documentos.

**Flujos alternativos:**
- 2a. DNI o código ya existente → error de conflicto (409).
- 5a. Archivo inválido → error de validación.

---

## CU-03 — Gestionar Fondos

**Actor:** Administrador.
**Descripción breve:** Crear y configurar fondos rotatorios, afiliar/desafiliar socios y definir el capital.

**Flujo principal:**
1. El administrador crea un fondo con nombre, organización, moneda y capital.
2. El administrador afilia socios (registro en `FondoSocio` con cargo/nivel/número).
3. El sistema mantiene el `capitalDisponible` del fondo.

**Flujos alternativos:**
- 2a. Socio ya pertenece al fondo → rechazo por unicidad.

---

## CU-04 — Registrar Aportes

**Actor:** Tesorero.
**Descripción breve:** Registrar el aporte de un socio a su fondo, de tipo obligatorio, voluntario, extraordinario o multa, generando su movimiento de caja.

**Flujo principal:**
1. El tesorero selecciona socio, fondo y período.
2. El sistema verifica que el socio pertenezca al fondo y esté activo.
3. El sistema valida que no exista aporte obligatorio duplicado para ese período.
4. El tesorero ingresa tipo, monto, método de pago y comprobante.
5. El sistema registra el `Aporte` y genera el `MovimientoCaja` de ingreso.
6. El sistema devuelve el comprobante (PDF opcional).

**Flujos alternativos:**
- 3a. Aporte duplicado → rechazo con mensaje claro.
- 4a. Monto inválido (≤ 0) → rechazo.

**Postcondiciones:** El `capitalDisponible` y el saldo de caja se actualizan.

---

## CU-05 — Otorgar Préstamo

**Actor:** Tesorero.
**Descripción breve:** Desembolsar un préstamo a un socio y generar automáticamente el cronograma de cuotas (interés + amortización).

**Flujo principal:**
1. El tesorero selecciona el socio y su fondo.
2. El tesorero ingresa monto, tasa de interés, número de cuotas y fecha del primer vencimiento.
3. El sistema calcula `montoCuota` e `totalInteres`.
4. El sistema genera las `CuotaPrestamo` (capital, interés, saldo).
5. El sistema registra el desembolso como egreso de caja.
6. El préstamo queda en estado `ACTIVO`.

**Flujos alternativos:**
- 2a. Monto mayor al capital disponible → rechazo.
- 4a. Cálculo de cuota inexacto → redondeo a 2 decimales, ajustando la última cuota.

---

## CU-06 — Registrar Pago de Cuota

**Actor:** Tesorero.
**Descripción breve:** Cobrar una cuota de un préstamo y actualizar saldos y estados.

**Flujo principal:**
1. El tesorero selecciona el préstamo y su cuota pendiente.
2. El sistema valida que la cuota no esté pagada.
3. El tesorero registra monto, método de pago y comprobante.
4. El sistema actualiza `montoPagado`, `saldoPendiente` y `fechaPago`.
5. El sistema genera el movimiento de caja de ingreso.
6. Si todas las cuotas están pagadas, el préstamo pasa a `PAGADO`.

**Flujos alternativos:**
- 2a. Cuota ya pagada → rechazo (no se cobra dos veces).
- 6a. La cuota estaba vencida → se registra el pago y desaparece del listado de vencidas.

---

## CU-07 — Gestionar Caja

**Actor:** Tesorero.
**Descripción breve:** Administrar cajas por fondo, registrar movimientos de ingreso/egreso bajo conceptos y transferir entre cajas.

**Flujo principal:**
1. El tesorero consulta el detalle de una caja (saldo, movimientos, arqueos, proyecciones).
2. El tesorero registra un movimiento con concepto, tipo, monto y método.
3. El sistema actualiza el saldo actual de la caja según `afectaSaldo` del concepto.
4. El tesorero puede transferir fondos entre cajas (registro dual egreso+ingreso).

**Flujos alternativos:**
- 3a. Egreso mayor al saldo → rechazo.

---

## CU-08 — Realizar Arqueo de Caja

**Actor:** Tesorero (realiza), Administrador (aprueba).
**Descripción breve:** Verificar que el saldo físico coincida con el del sistema y aprobar/rechazar el cuadre.

**Flujo principal:**
1. El tesorero registra el arqueo con el saldo físico.
2. El sistema calcula la diferencia vs el saldo del sistema.
3. El administrador aprueba o rechaza el arqueo (con observación).
4. Al aprobar, el saldo de la caja se ajusta si hubo diferencia.

**Flujos alternativos:**
- 3a. Rechazo → no altera el saldo, exige observación.
- 4a. Arqueo ya resuelto → no se vuelve a procesar.

---

## CU-09 — Proyecciones de Flujo de Caja

**Actor:** Tesorero.
**Descripción breve:** Registrar ingresos/egresos proyectados por caja y fecha; el sistema marca `REALIZADO` cuando hay movimiento que cubre la proyección.

---

## CU-10 — Generar Reportes PDF

**Actor:** Administrador, Tesorero.
**Descripción breve:** Generar documentos imprimibles con Playwright/Chromium:
- Ficha del socio, historial de aportes, historial de créditos, **estado de cuenta del socio**.
- Cronograma de cuotas, comprobante de aporte, padrón de socios del fondo, resumen del fondo, historial de aportes del fondo.

**Flujo principal:**
1. El usuario solicita un reporte desde el detalle del socio, crédito o fondo.
2. El sistema construye el HTML del documento con los datos reales.
3. El sistema renderiza el HTML a PDF y lo devuelve.
4. El navegador muestra el PDF en una pestaña nueva.

**Flujos alternativos:**
- 2a. Socio no encontrado / no pertenece al fondo → error 404/400.

---

## CU-11 — Consultar Estado de Cuenta

**Actor:** Socio (externo), Administrador.
**Descripción breve:** Ver el estado financiero del socio en un fondo a la fecha de corte: capital aportado, saldo por préstamos, intereses por pagar y saldo neto, más el detalle de aportes, préstamos, cuotas próximas y movimientos.

**Flujo principal:**
1. El usuario selecciona el socio y el fondo.
2. El sistema calcula capital aportado, saldos e intereses pendientes.
3. El sistema agrupa aportes por año y lista préstamos, cuotas y movimientos.
4. El sistema muestra/exporta el estado de cuenta.

**Postcondiciones:** `Saldo neto = Capital aportado − (saldo por préstamos + intereses por pagar)`.

---

## CU-12 — Consultar Auditoría

**Actor:** Administrador.
**Descripción breve:** Revisar el historial de operaciones registrado en `auditlog` (tabla, registro, operación, datos anteriores/nuevos, IP).

---

## CU-13 — Gestionar Configuración

**Actor:** Administrador.
**Descripción breve:** Gestionar usuarios (crear, editar, cambiar rol/contraseña, desactivar) y conceptos de caja.

**Flujos alternativos:**
- No se puede desactivar al último usuario administrador.

---

## CU-14 — Ver Dashboard

**Actor:** Administrador, Tesorero.
**Descripción breve:** Consultar métricas globales y el resumen ejecutivo (socios, fondos, cartera, morosidad).

---

## CU-15 — Cerrar Sesión

**Actor:** Administrador, Tesorero.
**Descripción breve:** El usuario cierra la sesión; el sistema limpia el token y redirige a `/login`.
