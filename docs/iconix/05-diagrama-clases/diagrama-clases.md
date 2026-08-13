# Artefacto 5 — Diagrama de Clases

El diagrama de clases es el **diseño final** de ICONIX: resultado de actualizar el modelo de dominio con las operaciones descubiertas durante el análisis de robustez y las secuencias. Corresponde 1:1 con el esquema de datos y los servicios implementados.

## Diagrama

![Diagrama de Clases](../img/diagrama-clases.png)

*(Código fuente editable: [`diagrama-clases.mmd`](diagrama-clases.mmd))*

## Notas de diseño

1. **Clase de asociación `FondoSocio`**: materializa la pertenencia de un socio a un fondo. Sin ella no podrían existir múltiples fondos ni quedarían vinculados correctamente los aportes y préstamos (clave única `fondoId + socioId`).
2. **Operaciones transaccionales**: `CuotaPrestamo.pagar()`, `Prestamo.crear()` y `ArqueoCaja.aprobar()` se ejecutan en transacciones Prisma que además generan `MovimientoCaja` y `AuditLog`.
3. **Reglas de negocio embebidas**:
   - `Aporte.crear()` valida que no exista un aporte obligatorio duplicado en el período.
   - `CuotaPrestamo.marcarVencidas()` corre cada 30 minutos en el servidor.
   - `ConceptoCaja.crearPorDefecto()` se ejecuta al iniciar el backend.
4. **`AuditLog` es transversal**: se registra en todas las operaciones de escritura de los módulos (socios, fondos, aportes, créditos, caja).

## Correspondencia con la implementación

| Clase | Tabla Prisma (`schema.prisma`) | Servicio |
|-------|-------------------------------|----------|
| Socio | `socio` | `socioService.ts` |
| Beneficiario | `beneficiario` | `socioService.ts` |
| DocumentoSocio | `documentosocio` | `socioService.ts` |
| Usuario | `usuario` | `configuracionService.ts` |
| FondoRotatorio | `fondorotatorio` | `fondoService.ts` |
| FondoSocio | `FondoSocio` | `fondoService.ts` |
| Aporte | `aporte` | `aporteService.ts` |
| Prestamo | `prestamo` | `creditoService.ts` |
| CuotaPrestamo | `cuotaprestamo` | `creditoService.ts` |
| Caja | `caja` | `cajaService.ts` |
| ConceptoCaja | `conceptocaja` | `cajaService.ts` |
| MovimientoCaja | `movimientocaja` | `cajaService.ts` |
| ArqueoCaja | `arqueocaja` | `cajaService.ts` |
| FlujoCajaProyectado | `flujocajaproyectado` | `cajaService.ts` |
| AuditLog | `auditlog` | `auditService.ts` |

## Aplicabilidad (ICONIX)

Si se quisiera **extender** el sistema (p. ej. módulo de remesas o intereses compuestos), este diagrama es el punto de partida: se agregan las clases en el diagrama de clases y en el modelo de dominio, se definen los casos de uso, y se validan con un diagrama de robustez antes de tocar código.
