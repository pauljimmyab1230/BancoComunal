# PLANTILLA DE TESIS â€” Sistema de GestiÃ³n de Banco Comunal

> Ejemplo completo con el mÃ³dulo de **AutenticaciÃ³n (Login)** como caso demostrativo.
> Sustituye el contenido entre corchetes `[...]` por tus datos reales.

---

## CARÃTULA

- TÃ­tulo: **"Sistema web para la gestiÃ³n de fondos rotatorios del Banco Comunal [nombre]"**
- Autor: [Tu nombre]
- Asesor: [Nombre del asesor]
- InstituciÃ³n: [Universidad]
- Grado: [IngenierÃ­a de Sistemas / ComputaciÃ³n]
- Fecha: [Mes, AÃ±o]

---

## RESUMEN

El presente proyecto desarrolla un sistema web para la gestiÃ³n integral de un banco comunal, abarcando el registro de socios, fondos rotatorios, aportes, crÃ©ditos y la administraciÃ³n de caja. El sistema fue construido bajo una arquitectura por capas (interfaz â†’ controlador â†’ servicio â†’ base de datos) aplicando la metodologÃ­a ICONIX para el anÃ¡lisis y diseÃ±o. El desarrollo se realizÃ³ con [React, Node.js, Express, Prisma y MySQL], y el backend expone una API REST protegida mediante autenticaciÃ³n con JWT y contraseÃ±as encriptadas con bcrypt.

**Palabras clave:** fondo rotatorio, banco comunal, ICONIX, API REST, arquitectura por capas.

---

## CAPÃTULO I â€” PLANTEAMIENTO DEL PROBLEMA

### 1.1 Realidad problemÃ¡tica
[3â€“5 pÃ¡rrafos: describe cÃ³mo el banco comunal lleva sus cuentas hoy (cuadernos, Excel), quÃ© errores/problemas genera (pÃ©rdida de registros, morosidad no controlada, caja desbalanceada), y por quÃ© es necesario un sistema.]

### 1.2 FormulaciÃ³n del problema
**Problema general:**
Â¿De quÃ© manera la implementaciÃ³n de un sistema web mejora la gestiÃ³n de aportes, crÃ©ditos y caja en un banco comunal?

**Problemas especÃ­ficos:**
- Â¿CÃ³mo registrar de forma confiable los aportes de los socios evitando duplicados?
- Â¿CÃ³mo controlar los cronogramas de pago y detectar cuotas vencidas?
- Â¿CÃ³mo garantizar que solo personal autorizado acceda a la informaciÃ³n?

### 1.3 Objetivos
**General:** Desarrollar un sistema web para la gestiÃ³n del banco comunal que automatice el registro de socios, fondos, aportes, crÃ©ditos y caja.

**EspecÃ­ficos:**
- Implementar el registro y control de socios y sus aportes.
- Implementar la gestiÃ³n de crÃ©ditos con generaciÃ³n automÃ¡tica de cronogramas.
- Implementar el control de caja con arqueos y proyecciones de flujo.
- Implementar autenticaciÃ³n y control de acceso por roles.

### 1.4 JustificaciÃ³n
[TecnolÃ³gica, econÃ³mica y social: por quÃ© aporta valor este sistema.]

### 1.5 Alcance y limitaciones
- **Alcance:** mÃ³dulos de socios, fondos, aportes, crÃ©ditos, caja, reportes PDF y usuarios.
- **Limitaciones:** no incluye banca mÃ³vil, no integra pasarela de pagos, los reportes dependen de Playwright.

---

## CAPÃTULO II â€” MARCO TEÃ“RICO

### 2.1 Marco conceptual
| TÃ©rmino | DefiniciÃ³n |
|---------|-----------|
| Fondo rotatorio | Fondo comunitario de ahorro y crÃ©dito al que pertenecen los socios |
| Aporte | Cuota periÃ³dica del socio (obligatoria, voluntaria, extraordinaria, multa) |
| PrÃ©stamo | CrÃ©dito otorgado con cronograma de cuotas (interÃ©s + amortizaciÃ³n) |
| Arqueo de caja | VerificaciÃ³n del saldo fÃ­sico vs. saldo del sistema |
| JWT | Token firmado que autentica y autoriza peticiones |

### 2.2 Arquitectura por capas
La aplicaciÃ³n se organiza en cuatro capas. Cada capa tiene una responsabilidad Ãºnica:

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  CAPA DE PRESENTACIÃ“N       â”‚  React + Vite (frontend)
â”‚  Captura y muestra datos    â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚  CAPA DE CONTROLADOR        â”‚  Express (backend)
â”‚  Valida formato (Zod)       â”‚
â”‚  Traduce HTTP â†” servicio    â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚  CAPA DE SERVICIO           â”‚  LÃ³gica de negocio
â”‚  Reglas, transacciones      â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚  CAPA DE DATOS              â”‚  MySQL vÃ­a Prisma ORM
â”‚  Persistencia               â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

**Ventajas:** separaciÃ³n de responsabilidades, testabilidad, reutilizaciÃ³n, y que cambiar la BD o el frontend no rompe la lÃ³gica de negocio.

### 2.3 MetodologÃ­a ICONIX
ICONIX es una metodologÃ­a de anÃ¡lisis y diseÃ±o dirigida por casos de uso, que combina los puntos fuertes de RUP y Agile. Se compone de cuatro modelos iterativos:

1. Modelo de dominio
2. Modelo de casos de uso
3. AnÃ¡lisis de robustez
4. Diagramas de secuencia y diagrama de clases de diseÃ±o

*[Incluir aquÃ­ la referencia bibliogrÃ¡fica del libro de Rosenberg y Scott, "Applying Use Case Driven Object Modeling with UML".]*

### 2.4 Herramientas de desarrollo
| Herramienta | Uso |
|-------------|-----|
| React + Vite | Interfaz de usuario |
| Node.js + Express | API REST |
| Prisma ORM | Acceso a datos |
| MySQL | Base de datos |
| Zod | ValidaciÃ³n de entrada |
| JWT + bcrypt | AutenticaciÃ³n y seguridad |
| Playwright | GeneraciÃ³n de reportes PDF |
| Mermaid | Diagramas UML (ICONIX) |

---

## CAPÃTULO III â€” DESARROLLO DEL SISTEMA (aplicaciÃ³n de ICONIX)

*En este capÃ­tulo se presentan los 5 artefactos ICONIX. El ejemplo completo del **login** se desarrolla en cada uno.*

### 3.1 Modelo de dominio

**DescripciÃ³n:** identifica las entidades del negocio y sus relaciones, sin detalle tÃ©cnico.

![Modelo de dominio](../iconix/img/modelo-dominio.png)

**VÃ­nculo con el sistema real:** las entidades corresponden a las tablas del esquema Prisma ([`backend/prisma/schema.prisma`](../backend/prisma/schema.prisma)).

### 3.2 Modelo de casos de uso

**Diagrama de casos de uso:**

![Diagrama de casos de uso](../iconix/img/diagrama-casos-uso.png)

**CatÃ¡logo de casos de uso:**

| CÃ³digo | Caso de uso | Actor |
|--------|-------------|-------|
| CU-01 | Iniciar sesiÃ³n | Tesorero, Administrador |
| CU-02 | Gestionar socios | Tesorero |
| CU-03 | Gestionar fondos rotatorios | Administrador |
| CU-04 | Registrar aportes | Tesorero |
| CU-05 | Otorgar prÃ©stamo | Tesorero |
| CU-06 | Registrar pago de cuota | Tesorero |
| CU-07 | Gestionar caja | Tesorero |
| CU-08 | Realizar arqueo de caja | Administrador |
| CU-09 | Gestionar usuarios | Administrador |
| CU-10 | Generar reportes PDF | Tesorero, Administrador |
| CU-11 | Consultar estado de cuenta | Tesorero, Administrador |

**Ficha del caso de uso CU-01 â€” Iniciar sesiÃ³n:**

| Atributo | DescripciÃ³n |
|----------|-------------|
| Actor | Tesorero, Administrador |
| PrecondiciÃ³n | El usuario existe y estÃ¡ activo |
| Flujo principal | 1. El actor ingresa usuario y contraseÃ±a<br>2. El sistema valida las credenciales<br>3. El sistema muestra el menÃº principal segÃºn el rol |
| Flujos alternativos | **FA1:** credenciales incorrectas â†’ el sistema muestra "Usuario o contraseÃ±a incorrectos"<br>**FA2:** cuenta desactivada â†’ el sistema muestra "La cuenta estÃ¡ desactivada" |
| PoscondiciÃ³n | SesiÃ³n iniciada; el frontend recibe un token JWT |

### 3.3 AnÃ¡lisis de robustez

**DescripciÃ³n:** valida que los casos de uso sean realizables, clasificando cada elemento como **frontera (interfaz)**, **control** u **entidad**. No introduce objetos inventados.

![Leyenda de estereotipos](../iconix/img/robustez-leyenda.png)

**Ejemplo â€” Robustez de CU-01 (Iniciar sesiÃ³n):**

![Robustez CU-01](../iconix/img/cu01-autenticacion.png)

**Lectura:** el actor interactÃºa con el formulario de login (frontera), el control *ValidarCredenciales* consulta a la entidad *Usuario*, y en caso de Ã©xito el control *GenerarToken* devuelve el JWT. El diagrama confirma que el caso de uso es realizable y muestra los objetos que participarÃ¡n.

### 3.4 Diagramas de secuencia

**DescripciÃ³n:** detallan la interacciÃ³n entre los objetos a lo largo del tiempo. AquÃ­ se materializa la arquitectura por capas.

**Ejemplo â€” Secuencia CU-01 (Iniciar sesiÃ³n):**

![Secuencia CU-01](../iconix/img/seq01-login.png)

**ExplicaciÃ³n textual del flujo:**
1. La **interfaz** envÃ­a `POST /api/configuracion/login` con usuario y contraseÃ±a.
2. El **controlador** valida el formato con Zod (`loginSchema`) y delega en el servicio.
3. El **servicio** busca el usuario en la BD; si no existe o la cuenta estÃ¡ desactivada, lanza error.
4. El **servicio** compara la contraseÃ±a con `bcrypt.compare` (la contraseÃ±a estÃ¡ hasheada).
5. Si es correcta, actualiza `ultimoAcceso` y firma un **token JWT** con `{ userId, username, rol }`.
6. El token regresa por la cadena hasta la interfaz; el frontend lo guarda para las peticiones siguientes.

### 3.5 Diagrama de clases de diseÃ±o

**DescripciÃ³n:** resultado final del diseÃ±o: el modelo de dominio actualizado con atributos y operaciones reales (mÃ©todos de los servicios).

![Diagrama de clases](../iconix/img/diagrama-clases.png)

**VÃ­nculo con la implementaciÃ³n:**

| Clase | Tabla Prisma | Servicio |
|-------|--------------|----------|
| Usuario | `usuario` | `configuracionService.ts` |
| Socio | `socio` | `socioService.ts` |
| Aporte | `aporte` | `aporteService.ts` |
| Prestamo | `prestamo` | `creditoService.ts` |
| Caja | `caja` | `cajaService.ts` |

---

## CAPÃTULO IV â€” IMPLEMENTACIÃ“N DE LA SOLUCIÃ“N

### 4.1 Arquitectura general del sistema

```
Browser (React)
   â”‚  HTTPS + JWT
   â–¼
Express API â”€â”€â–º [Router â†’ Controlador â†’ Servicio â†’ Prisma â†’ MySQL]
   â”‚
   â””â”€â”€ Playwright (generaciÃ³n de PDF)
```

### 4.2 Estructura del proyecto

```
backend/
  src/
    modules/
      socios/       (controlador, servicio, validaciÃ³n, rutas)
      fondos/
      aportes/
      creditos/
      caja/
      reportes/
      configuracion/
    middeware/auth.ts   (verificaciÃ³n de JWT)
    ...
  prisma/schema.prisma
frontend/
  src/
    modules/          (pÃ¡ginas y componentes por mÃ³dulo)
```

### 4.3 Ejemplo de implementaciÃ³n â€” AutenticaciÃ³n (login)

**Controlador** â€” valida el formato y delega:

```ts
async login(req: Request, res: Response, next: NextFunction) {
  const { username, password } = loginSchema.parse(req.body)
  const result = await configuracionService.login(username, password)
  res.json(result)
}
```

**Servicio** â€” aplica la lÃ³gica y reglas de negocio:

```ts
async login(username: string, password: string) {
  const usuario = await prisma.usuario.findUnique({ where: { username } })
  if (!usuario) throw new HttpError(400, 'Usuario o contraseÃ±a incorrectos')
  if (usuario.estado !== 'ACTIVO') throw new HttpError(400, 'La cuenta estÃ¡ desactivada')

  const validPassword = await bcrypt.compare(password, usuario.password)
  if (!validPassword) throw new HttpError(400, 'Usuario o contraseÃ±a incorrectos')

  await prisma.usuario.update({ where: { id: usuario.id }, data: { ultimoAcceso: new Date() } })

  const token = jwt.sign(
    { userId: usuario.id, username: usuario.username, rol: usuario.rol },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] },
  )

  return { token, user: { id: usuario.id, nombres: usuario.nombres, username: usuario.username, rol: usuario.rol } }
}
```

**Middleware de protecciÃ³n** â€” verifica el token en cada peticiÃ³n:

```ts
// middeware/auth.ts (fragmento conceptual)
const payload = jwt.verify(token, env.JWT_SECRET)   // valida firma y expiraciÃ³n
req.userId = payload.userId                          // inyecta el usuario autenticado
```

**ExplicaciÃ³n de seguridad (lo que el jurado valora):**
- Las contraseÃ±as **nunca se guardan en texto plano**: se almacenan con el hash de **bcrypt** (salt de 12 rondas), y la verificaciÃ³n usa `bcrypt.compare`.
- La sesiÃ³n se maneja con **JWT** firmado con `JWT_SECRET`; cada peticiÃ³n posterior lo envÃ­a en el header `Authorization: Bearer <token>`.
- El middleware `auth.ts` valida firma y expiraciÃ³n en cada peticiÃ³n y **no permite el acceso si el token no es vÃ¡lido**.
- Los roles (`Tesorero`, `Administrador`) viajan dentro del token y controlan el acceso a los mÃ³dulos.

---

## CAPÃTULO V â€” PRUEBAS

### 5.1 Plan de pruebas
| # | Caso de prueba | Entrada | Resultado esperado |
|---|----------------|---------|--------------------|
| P01 | Login exitoso | Usuario y contraseÃ±a correctos | Token JWT y acceso al sistema |
| P02 | ContraseÃ±a incorrecta | Usuario correcto, contraseÃ±a errada | Error "Usuario o contraseÃ±a incorrectos" |
| P03 | Usuario inexistente | Usuario no registrado | Error "Usuario o contraseÃ±a incorrectos" |
| P04 | Cuenta desactivada | Usuario con estado INACTIVO | Error "La cuenta estÃ¡ desactivada" |
| P05 | Acceso sin token | PeticiÃ³n a una ruta protegida | HTTP 401 no autorizado |
| P06 | Token expirado | Token vencido | HTTP 401 no autorizado |
| P07 | Aporte duplicado | Mismo periodo y tipo | Rechazo con mensaje de validaciÃ³n |
| P08 | Arqueo con diferencia | Saldo fÃ­sico â‰  saldo sistema | Registro de diferencia y estado pendiente |

### 5.2 Resultados
[Tabla con: prueba ejecutada, resultado obtenido (aprobado/fallido), observaciones.]

### 5.3 Evidencias
[Capturas de pantalla del sistema: login, mensajes de error, mÃ³dulos principales.]

---

## CAPÃTULO VI â€” CONCLUSIONES Y RECOMENDACIONES

### 6.1 Conclusiones
- La aplicaciÃ³n de la metodologÃ­a ICONIX permitiÃ³ [verificar la factibilidad de los casos de uso antes de implementar / documentar el diseÃ±o de forma trazable con el cÃ³digo].
- La arquitectura por capas garantizÃ³ [mantenibilidad, seguridad, separaciÃ³n de responsabilidades].
- El uso de JWT + bcrypt asegurÃ³ [que solo personal autorizado acceda al sistema].

### 6.2 Recomendaciones
- Implementar [mÃ³dulo de remesas / banca mÃ³vil] como trabajo futuro.
- Realizar copias de seguridad periÃ³dicas de la base de datos.
- AÃ±adir pruebas automatizadas (unitarias e integrales) al flujo de aportes y crÃ©ditos.

---

## ANEXOS

- **Anexo A:** diagramas ICONIX completos (`docs/iconix/`).
- **Anexo B:** script de la base de datos ([`BD/`](../BD)).
- **Anexo C:** manual de usuario.
- **Anexo D:** manual de instalaciÃ³n (requisitos, variables de entorno, pasos de despliegue).

---

## REFERENCIAS BIBLIOGRÃFICAS

1. Rosenberg, D. y Scott, K. *Applying Use Case Driven Object Modeling with UML*. Addison-Wesley, 2001.
2. [Libro de anÃ¡lisis y diseÃ±o orientado a objetos que uses en tu universidad.]
3. [DocumentaciÃ³n oficial de React, Node.js, Prisma o MySQL.]

