# Artefacto 3 — Análisis de Robustez

El análisis de robustez valida que cada caso de uso sea **realizable con los objetos del dominio**, usando tres estereotipos:

- **Frontera (boundary)** — `Interfaz` de usuario (formularios, vistas, salidas).
- **Control (control)** — Lógica de aplicación que orquesta la operación.
- **Entidad (entity)** — Objetos del dominio (persistentes).

![Leyenda de estereotipos](../img/robustez-leyenda.png)

*Cada diagrama corresponde a un caso de uso. Se renderizan en colores: **azul** = frontera, **amarillo** = control, **verde** = entidad.*

## CU-01 — Autenticarse

![CU-01 Robustez](../img/cu01-autenticacion.png)

## CU-02 — Gestionar Socios

![CU-02 Robustez](../img/cu02-socios.png)

## CU-04 — Registrar Aportes

![CU-04 Robustez](../img/cu04-aportes.png)

## CU-05 — Otorgar Préstamo

![CU-05 Robustez](../img/cu05-prestamo.png)

## CU-06 — Registrar Pago de Cuota

![CU-06 Robustez](../img/cu06-pago-cuota.png)

## CU-07 — Gestionar Caja

![CU-07 Robustez](../img/cu07-caja.png)

## CU-08 — Realizar Arqueo de Caja

![CU-08 Robustez](../img/cu08-arqueo.png)

## CU-10 — Generar Reportes PDF

![CU-10 Robustez](../img/cu10-reportes.png)

## CU-11 — Consultar Estado de Cuenta

![CU-11 Robustez](../img/cu11-estado-cuenta.png)

---

### Lectura de un diagrama (ejemplo CU-04)

```
Tesorero → (Interfaz de Aporte) → [Registrar Aporte]
                                         ↓
        ┌────────────┬──────────────┬──────────────────┐
        ↓            ↓              ↓                  ↓
   FondoSocio     Aporte     MovimientoCaja    ConceptoCaja
```

El control `Registrar Aporte` no puede tocar la interfaz ni el usuario: solo orquesta entidades. Esto garantiza que el caso de uso se sostiene con el modelo de dominio y permite detectar **sustantivos faltantes** antes de diseñar las secuencias.
