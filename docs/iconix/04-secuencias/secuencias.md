# Artefacto 4 — Diagramas de Secuencia

Los diagramas de secuencia detallan **cómo interactúan los objetos** para realizar cada caso de uso. Muestran los componentes reales del sistema: frontend (React), controladores, servicios y la base de datos vía Prisma.

## CU-01 — Autenticarse

![Secuencia CU-01](../img/seq01-login.png)

## CU-04 — Registrar Aportes

![Secuencia CU-04](../img/seq04-aporte.png)

## CU-05 — Otorgar Préstamo

![Secuencia CU-05](../img/seq05-prestamo.png)

## CU-06 — Registrar Pago de Cuota

![Secuencia CU-06](../img/seq06-pago-cuota.png)

## CU-07 — Gestionar Caja (movimiento)

![Secuencia CU-07](../img/seq07-caja.png)

## CU-08 — Realizar Arqueo de Caja

![Secuencia CU-08](../img/seq08-arqueo.png)

## CU-10 — Generar Reporte PDF (Playwright)

![Secuencia CU-10](../img/seq10-reporte-pdf.png)

## CU-11 — Consultar Estado de Cuenta

![Secuencia CU-11](../img/seq11-estado-cuenta.png)

---

## Patrón de arquitectura reflejado

```
Vista (React) → Controller (validación Zod) → Service (lógica de negocio) → Prisma (MySQL)
```

- Los **controladores** solo validan con Zod y delegan.
- Los **servicios** concentran la lógica y usan transacciones (`$transaction`) para operaciones atómicas (pago de cuota, desembolso, arqueo).
- Las operaciones de negocio registran **movimientos de caja** y **auditoría** de forma consistente.
