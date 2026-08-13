# Artefacto 2 — Modelo de Casos de Uso

El modelo de casos de uso captura la **funcionalidad observable** del sistema desde el punto de vista de los actores. Se derivó de las rutas y páginas reales del sistema.

## Actores

| Actor | Descripción | Casos de uso principales |
|-------|-------------|--------------------------|
| **Administrador** | Usuario con rol `ADMIN`. Gestiona fondos, configuración, auditoría y aprueba arqueos. | CU-01 a CU-15 |
| **Tesorero / Cajero** | Usuario operativo que registra aportes, préstamos, pagos y caja. | CU-01, CU-02, CU-04 a CU-11, CU-14, CU-15 |
| **Socio** (externo) | Miembro del banco comunal. Es origen de los datos; su estado de cuenta es consultable. | CU-11 |
| **Sistema** (soporte) | Automatiza: marca cuotas vencidas, registra auditoría, genera movimientos de caja. | CU-08, CU-11 |

## Diagrama de Casos de Uso

![Casos de Uso](../img/casos-uso.png)

*(Código fuente: [`diagrama-casos-uso.mmd`](diagrama-casos-uso.mmd))*

## Catálogo de casos de uso

| ID | Caso de uso | Actor principal | Resumen |
|----|-------------|-----------------|---------|
| CU-01 | Autenticarse | Administrador, Tesorero | Inicia sesión con usuario/contraseña y recibe un JWT |
| CU-02 | Gestionar Socios | Administrador, Tesorero | Alta/baja/modificación de socios, beneficiarios y documentos |
| CU-03 | Gestionar Fondos | Administrador | Crear/editar fondos y afiliar socios |
| CU-04 | Registrar Aportes | Tesorero | Registrar aportes (obligatorio, voluntario, extraordinario, multa) |
| CU-05 | Otorgar Préstamo | Tesorero | Desembolsar préstamo y generar el cronograma de cuotas |
| CU-06 | Registrar Pago de Cuota | Tesorero | Cobrar una cuota y recalcular saldos |
| CU-07 | Gestionar Caja | Tesorero | Administrar cajas, movimientos y transferencias |
| CU-08 | Realizar Arqueo de Caja | Tesorero (+ Admin aprueba) | Verificar saldo físico vs sistema y aprobar |
| CU-09 | Proyecciones de Flujo de Caja | Tesorero | Registrar y comparar flujo proyectado vs real |
| CU-10 | Generar Reportes PDF | Administrador, Tesorero | Emitir ficha, historiales, estado de cuenta, cronogramas, comprobantes |
| CU-11 | Consultar Estado de Cuenta | Socio / Administrador | Ver el estado financiero del socio en un fondo |
| CU-12 | Consultar Auditoría | Administrador | Revisar la trazabilidad de las operaciones |
| CU-13 | Gestionar Configuración | Administrador | Gestionar usuarios y conceptos de caja |
| CU-14 | Ver Dashboard | Administrador, Tesorero | Consultar métricas y resumen ejecutivo |
| CU-15 | Cerrar Sesión | Administrador, Tesorero | Finalizar la sesión y limpiar el token |

Ver fichas detalladas en [`fichas-detalladas.md`](fichas-detalladas.md).
