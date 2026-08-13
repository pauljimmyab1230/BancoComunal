# Artefacto 1 — Modelo de Dominio

El modelo de dominio describe el **vocabulario del problema** (objetos del dominio del banco comunal), sin detalles de implementación. Fue derivado del esquema real en `backend/prisma/schema.prisma`.

## Diagrama

![Modelo de Dominio](../img/modelo-dominio.png)

*(Código fuente editable: [`modelo-dominio.mmd`](modelo-dominio.mmd))*

## Descripción de las clases

### Núcleo de socios
- **Socio** — Persona miembro del banco comunal. Es el actor central del sistema; su identificación es el DNI y un código único. Posee datos personales y estado (activo/inactivo).
- **Beneficiario** — Persona beneficiaria declarada por el socio (cónyuge, hijo, etc.).
- **DocumentoSocio** — Archivo adjunto del socio (DNI, certificados, etc.).

### Fondos y participación
- **FondoRotatorio** — Fondo comunitario de ahorro y crédito. Mantiene el capital inicial y disponible, moneda y estado (activo/cerrado).
- **FondoSocio** — **Clase de asociación** entre `Socio` y `FondoRotatorio`. Modela la pertenencia de un socio a un fondo: fecha de ingreso/salida, número de socio, cargo y nivel. De aquí cuelgan los aportes y préstamos del socio en ese fondo.

### Aportes y créditos
- **Aporte** — Aporte del socio en un período (tipo: `OBLIGATORIO`, `VOLUNTARIO`, `EXTRAORDINARIO`, `MULTA`). Tiene período (AAAA-MM), monto, fecha, método de pago y comprobante.
- **Prestamo** — Crédito otorgado a un socio: monto, tasa de interés, número de cuotas, cuota calculada, interés total, fecha de desembolso y estado (`ACTIVO`, `PAGADO`, `ANULADO`).
- **CuotaPrestamo** — Cada pago periódico del préstamo (interés + amortización). Guarda vencimiento, montos, saldo pendiente, fecha de pago y estado (`PENDIENTE`, `PAGADO`, `VENCIDO`, `ANULADO`).

### Caja y tesorería
- **Caja** — Caja de un fondo (principal/secundaria) con saldo inicial y actual.
- **ConceptoCaja** — Clasificación de los movimientos (ingreso/egreso) según el tipo de operación (aporte, cuota, préstamo, gasto, etc.).
- **MovimientoCaja** — Movimiento de ingreso o egreso registrado en una caja bajo un concepto.
- **ArqueoCaja** — Verificación periódica: compara saldo del sistema con el saldo físico.
- **FlujoCajaProyectado** — Proyección de ingresos/egresos futuros vs lo realmente realizado.

### Soporte
- **Usuario** — Usuario del sistema con rol (`ADMIN`, `TESORERO`, etc.) y estado.
- **AuditLog** — Trazabilidad de las operaciones: tabla afectada, operación, datos anteriores/nuevos, IP y fecha.

## Reglas de negocio relevantes (extraídas del código)

1. Un socio puede pertenecer a varios fondos (`FondoSocio` tiene unicidad `fondoId + socioId`).
2. Un aporte obligatorio no debe duplicarse en el mismo período por socio y fondo.
3. El préstamo genera sus cuotas al ser desembolsado (interés + amortización constante).
4. Cada 30 minutos el sistema marca como vencidas las cuotas cuya fecha ya pasó (`marcarCuotasVencidas`).
5. Todo movimiento de caja queda registrado bajo un concepto (`ConceptoCaja`) y afecta el saldo actual de la caja.
