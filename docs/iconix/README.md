# Análisis ICONIX — Banquito Solidario (Banco Comunal)

Documentación del sistema siguiendo la metodología **ICONIX** (análisis y diseño dirigido por casos de uso). Los artefactos fueron generados a partir del código real del repositorio (esquema Prisma, rutas, controladores y servicios), por lo que el análisis coincide con el sistema implementado.

## Proceso ICONIX

```
 ┌─────────────────────────────────────────────────────────────────┐
 │  REQUISITOS        ANÁLISIS          DISEÑO        IMPLEMENTACIÓN │
 │                                                                  │
 │  Modelo de      Robustez →      Diagramas de      Código        │
 │  Dominio ──▶    Análisis ──▶    Secuencia ──▶    + Pruebas      │
 │  Casos de       de Robustez     Diagrama de                     │
 │  Uso                           Clases                           │
 └─────────────────────────────────────────────────────────────────┘
```

## Artefactos

| # | Artefacto | Archivo | Contenido |
|---|-----------|---------|-----------|
| 1 | Modelo de Dominio | [`01-modelo-dominio/modelo-dominio.md`](01-modelo-dominio/modelo-dominio.md) | Clases del dominio, atributos y asociaciones |
| 2 | Modelo de Casos de Uso | [`02-casos-de-uso/casos-de-uso.md`](02-casos-de-uso/casos-de-uso.md) | Actores, diagrama y catálogo de casos de uso |
| 2b | Fichas de Casos de Uso | [`02-casos-de-uso/fichas-detalladas.md`](02-casos-de-uso/fichas-detalladas.md) | Descripciones breves y flujos principales/alternativos |
| 3 | Análisis de Robustez | [`03-analisis-robustez/analisis-robustez.md`](03-analisis-robustez/analisis-robustez.md) | Diagramas frontera/control/entidad por caso de uso |
| 4 | Diagramas de Secuencia | [`04-secuencias/secuencias.md`](04-secuencias/secuencias.md) | Secuencias de los casos de uso principales |
| 5 | Diagrama de Clases | [`05-diagrama-clases/diagrama-clases.md`](05-diagrama-clases/diagrama-clases.md) | Diseño final con atributos y operaciones |

## Imágenes (PNG)

Todas las imágenes renderizadas de los diagramas están en [`img/`](img/). Cada documento Markdown las referencia para verse directamente en GitHub, Word o Notion.

## Cómo se generaron

- **Modelo de dominio y diagrama de clases:** derivados de [`backend/prisma/schema.prisma`](../../backend/prisma/schema.prisma).
- **Casos de uso:** derivados de las rutas de [`backend/src/modules`](../../backend/src/modules) y las páginas de [`frontend/src/modules`](../../frontend/src/modules).
- **Robustez y secuencias:** de los controladores/servicios reales (p. ej. [`reportesController.ts`](../../backend/src/modules/reportes/reportesController.ts), [`creditoService.ts`](../../backend/src/modules/creditos/creditoService.ts)).

## Actor y vocabulario clave

| Término | Significado |
|---------|-------------|
| Fondo Rotatorio | Fondo comunitario de ahorro y crédito al que pertenecen los socios |
| Aporte | Cuota periódica del socio (obligatoria, voluntaria, extraordinaria o multa) |
| Préstamo | Crédito otorgado a un socio con cronograma de cuotas |
| Cuota | Pago periódico del préstamo (interés + amortización) |
| Caja | Caja de un fondo donde se registran ingresos/egresos |
| Arqueo | Verificación del saldo físico vs saldo del sistema de una caja |
