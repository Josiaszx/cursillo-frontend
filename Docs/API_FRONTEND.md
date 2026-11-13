# API del cursillo — guía para el frontend

Todo lo que el front necesita para consumir la API **tal como está hoy**: catálogos,
grupos, profesores y alumnos. Lo que aún no existe está en la [sección 11](#11-lo-que-todavía-no-existe).

> **Estado de las pruebas.** Las lecturas (`GET`) están verificadas contra la base local.
> Las escrituras (`POST`, `PUT`, `PATCH`) están implementadas pero **todavía no se han
> ejecutado**: si alguna no se comporta como dice este documento, es un error del backend.

---

## 1. Conexión

| | |
|---|---|
| URL base (desarrollo) | `http://localhost:5082` |
| Formato | JSON en peticiones y respuestas (`Content-Type: application/json`) |
| Autenticación | **Ninguna todavía.** Todos los endpoints están abiertos. |
| CORS | Solo se permite el origen `http://localhost:5173`. Si el front usa otro puerto, se cambia en `appsettings.Development.json` del backend (`Cors:OrigenesPermitidos`). |
| Contrato OpenAPI | `http://localhost:5082/openapi/v1.json` (sirve para generar tipos) |
| Probar a mano | `http://localhost:5082/scalar` |

**Recomendación:** centralizar todas las llamadas en un solo cliente HTTP. Cuando llegue la
autenticación, el token se añadirá ahí y no en cada pantalla.

---

## 2. Convenciones generales

- **Nombres en camelCase** (`anioConvocatoria`, `grupoId`).
- **Rutas** en español, minúsculas y con guiones (`/tipos-clase`).
- **Fechas** como `"2024-07-31"` y **horas** como `"09:00:00"`. Son hora local de Paraguay;
  no llevan zona horaria ni hay que convertirlas.
- **Los valores de catálogo viajan como número** (su `id`), nunca como texto.
- **Alumnos y profesores se identifican por su CI**, no por un id autogenerado. El CI no se
  puede cambiar una vez creado.
- **No existe `DELETE`** para grupos, profesores ni alumnos: se inhabilitan.
- **`PUT` reemplaza todos los campos editables.** Un campo opcional que no se envía se
  guarda como `null`; hay que enviar el objeto completo.
- Los campos opcionales vacíos se envían como `null` o se omiten, **no como `""`**
  (un correo `""` falla la validación).
- Los campos desconocidos del cuerpo se ignoran.
- Un id que no es numérico en la ruta (`/grupos/abc`) responde 404.

---

## 3. Errores

Toda respuesta de error tiene el mismo cuerpo. `detalles` siempre es un objeto, vacío si
no hay nada que añadir.

```json
{ "codigo": "GRUPO_INHABILITADO", "mensaje": "El grupo \"Grupo A\" está inhabilitado.", "detalles": { "grupoId": 1 } }
```

- **`codigo`** es estable: es lo que el front debe usar para decidir qué hacer.
- **`mensaje`** está en español y se puede mostrar al usuario tal cual.

| HTTP | `codigo` | Cuándo | `detalles` |
|---|---|---|---|
| 400 | `VALIDACION` | Datos de entrada inválidos | `{ campo: [mensajes] }` |
| 404 | `NO_ENCONTRADO` | El recurso o la ruta no existen | `{}` |
| 405 | `METODO_NO_PERMITIDO` | Método HTTP no admitido en esa ruta | `{}` |
| 409 | `YA_EXISTE` | Ya existe un registro habilitado con esa clave | `{ id }` |
| 409 | `YA_EXISTE_INHABILITADO` | Ya existe, pero está inhabilitado | `{ id }` |
| 409 | `GRUPO_INHABILITADO` | El grupo implicado está inhabilitado | `{ grupoId }` |
| 409 | `CASCADA_REQUERIDA` | Inhabilitar el grupo requiere confirmación | `{ impacto: { alumnos, clases } }` |
| 409 | `TIENE_CLASES_FUTURAS` | El profesor tiene clases por dictar | `{ clasesFuturas }` |
| 415 | `FORMATO_NO_SOPORTADO` | El cuerpo no se envió como JSON | `{}` |
| 500 | `ERROR_INTERNO` | Error inesperado del servidor | `{}` |

### Errores de validación (400)

`detalles` tiene una entrada por campo inválido, con el nombre del campo en camelCase tal
como se envió, y una lista de mensajes. Sirve para pintar el error junto a cada campo.

```json
{
  "codigo": "VALIDACION",
  "mensaje": "Hay datos inválidos en la solicitud.",
  "detalles": {
    "nombres": ["Es obligatorio."],
    "edad": ["Debe estar entre 5 y 120."],
    "correo": ["No es un correo válido."]
  }
}
```

Casos especiales de la clave:

- Parámetros de consulta inválidos usan su propio nombre: `estado`, `page`, `size`, `grupoId`.
- Un JSON mal formado o un cuerpo ausente usa la clave `cuerpo`.
- Un valor de tipo equivocado (texto donde va un número) da `"El formato del valor no es válido."`.

---

## 4. Parámetros comunes de las listas

### `estado`

Disponible en todas las listas de grupos, profesores, alumnos y clases.

| Valor | Devuelve |
|---|---|
| `habilitados` | Solo los habilitados. **Es el valor por defecto.** |
| `inhabilitados` | Solo los inhabilitados |
| `todos` | Ambos |

No distingue mayúsculas. Cualquier otro valor responde 400 con la clave `estado`.

Todos los objetos de estas entidades traen el campo `habilitado` (`true` o `false`).
**El detalle por id siempre devuelve el registro, aunque esté inhabilitado.**

### Paginación: `page` y `size`

Solo la usan la lista de alumnos y las listas de clases. Las demás devuelven un arreglo
completo.

| Parámetro | Por defecto | Límites |
|---|---|---|
| `page` | `1` | 1 o mayor |
| `size` | `20` | Entre 1 y 100 |

Fuera de esos límites responde 400 (no se recorta). Respuesta:

```json
{ "items": [ ], "page": 1, "size": 20, "total": 95, "totalPages": 5 }
```

Una página más allá de la última devuelve `items` vacío, no un error.

---

## 5. Modelos

Tipos de las respuestas, en TypeScript.

```ts
interface ItemCatalogo { id: number; nombre: string }

interface Grupo {
  id: number;
  nombre: string;
  anioConvocatoria: number | null;
  numeroConvocatoria: number | null;
  cantidadAlumnos: number;      // alumnos habilitados del grupo; lo calcula el servidor
  habilitado: boolean;
}

interface GrupoRef { id: number; nombre: string; habilitado: boolean }

interface Profesor {
  ci: number;
  nombres: string;
  apellidos: string;
  edad: number | null;
  correo: string | null;
  telefono: string | null;
  habilitado: boolean;
}

interface ProfesorRef { ci: number; nombres: string; apellidos: string; habilitado: boolean }

interface Alumno {
  ci: number;
  nombres: string;
  apellidos: string;
  edad: number | null;
  correo: string | null;
  telefono: string | null;
  grupo: GrupoRef;
  habilitado: boolean;
}

interface AulaRef { id: number; nombre: string }

interface Clase {
  id: number;
  fecha: string | null;         // "2024-07-31"
  horaInicio: string | null;    // "09:00:00"
  horaFin: string | null;
  aula: AulaRef | null;
  grupo: GrupoRef | null;
  tipoClase: ItemCatalogo | null;
  profesor: ProfesorRef | null;
  habilitado: boolean;
}

interface Paginado<T> { items: T[]; page: number; size: number; total: number; totalPages: number }

interface ErrorApi { codigo: string; mensaje: string; detalles: Record<string, unknown> }
```

En `Clase`, un grupo o un profesor inhabilitado **aparece igual**, con `habilitado: false`,
para poder marcarlo en pantalla. Solo es `null` lo que la clase no tiene asignado.

---

## 6. Catálogos

Solo lectura, sin parámetros. Devuelven `ItemCatalogo[]`. Sirven para llenar desplegables
sin escribir las constantes en el front; cambian muy poco, así que se pueden cargar una vez.

| Endpoint | Valores actuales |
|---|---|
| `GET /tipos-clase` | 1 examen · 2 teoria · 3 practica · 4 teoria/practica |
| `GET /catalogos/disponibilidades-aula` | 1 disponible · 2 fuera de servicio |
| `GET /catalogos/tipos-presencia` | 1 ausente · 2 presente · 3 n/a · 4 ausencia justificada |
| `GET /catalogos/estados-pago-cuota` | 1 pagado · 2 pendiente · 3 vencido |
| `GET /catalogos/roles` | 1 admin · 2 usuario |

```json
[ { "id": 1, "nombre": "examen" }, { "id": 2, "nombre": "teoria" } ]
```

Hoy solo `tipos-clase` se usa en pantalla (aparece dentro de `Clase`). Los otros cuatro
quedan listos para las pantallas de aulas, presencia, cuotas y usuarios.

---

## 7. Grupos

| Método y ruta | Qué hace | Respuesta |
|---|---|---|
| `GET /grupos?estado=` | Lista, ordenada por nombre | 200 `Grupo[]` |
| `GET /grupos/{id}` | Detalle | 200 `Grupo` |
| `GET /grupos/{id}/alumnos?estado=` | Alumnos del grupo, por apellido | 200 `Alumno[]` |
| `GET /grupos/{id}/clases?estado=&page=&size=` | Clases del grupo, en orden cronológico | 200 `Paginado<Clase>` |
| `POST /grupos` | Crea | 201 `Grupo` |
| `PUT /grupos/{id}` | Edita | 200 `Grupo` |
| `PATCH /grupos/{id}/inhabilitar?confirmarCascada=` | Inhabilita, ver [7.2](#72-inhabilitar-un-grupo-cascada-con-confirmación) | 200 |
| `PATCH /grupos/{id}/habilitar` | Habilita solo el grupo | 200 `Grupo` |

Todas responden 404 `NO_ENCONTRADO` si el grupo no existe.

### 7.1 Crear y editar

Mismo cuerpo para `POST` y `PUT`:

```json
{ "nombre": "Grupo F", "anioConvocatoria": 2025, "numeroConvocatoria": 1 }
```

| Campo | Obligatorio | Regla |
|---|---|---|
| `nombre` | Sí | Hasta 100 caracteres |
| `anioConvocatoria` | No | Entre 2000 y 2100 |
| `numeroConvocatoria` | No | Entre 1 y 20 |

- `cantidadAlumnos` y `habilitado` **no se envían**: el primero se calcula y el segundo
  solo cambia con habilitar o inhabilitar.
- La combinación nombre + año + número no se puede repetir (sin distinguir mayúsculas).
  Si ya existe responde 409 `YA_EXISTE` o `YA_EXISTE_INHABILITADO`, con el `id` del grupo
  existente en `detalles`.
- `POST` responde 201 con el grupo creado y la cabecera `Location: /grupos/{id}`.

### 7.2 Inhabilitar un grupo (cascada con confirmación)

Inhabilitar un grupo inhabilita también a sus alumnos y clases habilitados. Por eso es un
flujo en dos pasos.

**Paso 1.** `PATCH /grupos/{id}/inhabilitar`, sin parámetros.

- Si el grupo no tiene alumnos ni clases habilitados, se inhabilita y responde 200.
- Si los tiene, **no cambia nada** y responde 409:

```json
{
  "codigo": "CASCADA_REQUERIDA",
  "mensaje": "Inhabilitar el grupo también inhabilitará sus alumnos y clases.",
  "detalles": { "impacto": { "alumnos": 15, "clases": 66 } }
}
```

**Paso 2.** El front muestra un diálogo con esos números ("Se inhabilitarán 15 alumnos y
66 clases. ¿Continuar?"). Si el usuario acepta:

`PATCH /grupos/{id}/inhabilitar?confirmarCascada=true`

```json
{
  "grupo": { "id": 1, "nombre": "Grupo A", "anioConvocatoria": 2024, "numeroConvocatoria": 1, "cantidadAlumnos": 0, "habilitado": false },
  "afectados": { "alumnos": 15, "clases": 66 }
}
```

Si el usuario cancela, simplemente no se hace la segunda llamada.

Notas:

- La respuesta 200 de este endpoint **siempre** tiene la forma `{ grupo, afectados }`,
  también en el paso 1 (con `afectados` en cero).
- Se puede enviar `confirmarCascada=true` directamente, pero entonces el usuario no ve el
  impacto antes de aceptar.

### 7.3 Habilitar un grupo

`PATCH /grupos/{id}/habilitar` habilita **solo el grupo**. Sus alumnos y clases siguen
inhabilitados y hay que habilitarlos uno por uno. Conviene avisarlo en pantalla: tras
habilitar, el grupo aparece con `cantidadAlumnos: 0`.

---

## 8. Profesores

| Método y ruta | Qué hace | Respuesta |
|---|---|---|
| `GET /profesores?estado=` | Lista, por apellido | 200 `Profesor[]` |
| `GET /profesores/{ci}` | Detalle | 200 `Profesor` |
| `GET /profesores/{ci}/clases?estado=&page=&size=` | Sus clases, en orden cronológico | 200 `Paginado<Clase>` |
| `POST /profesores` | Crea | 201 `Profesor` |
| `PUT /profesores/{ci}` | Edita | 200 `Profesor` |
| `PATCH /profesores/{ci}/inhabilitar` | Inhabilita | 200 `Profesor` |
| `PATCH /profesores/{ci}/habilitar` | Habilita | 200 `Profesor` |

Todas responden 404 `NO_ENCONTRADO` si no existe un profesor con ese CI.

### Crear y editar

`POST /profesores`:

```json
{ "ci": 200011, "nombres": "Laura", "apellidos": "Giménez", "edad": 38, "correo": "lgimenez@example.com", "telefono": "0981123456" }
```

`PUT /profesores/{ci}` usa el mismo cuerpo **sin `ci`** (va en la ruta y no se puede cambiar).

| Campo | Obligatorio | Regla |
|---|---|---|
| `ci` | Sí (solo al crear) | Número positivo |
| `nombres` | Sí | Hasta 100 caracteres |
| `apellidos` | Sí | Hasta 100 caracteres |
| `edad` | No | Entre 5 y 120 |
| `correo` | No | Formato de correo, hasta 150 caracteres |
| `telefono` | No | Hasta 30 caracteres |

Si el CI ya existe, `POST` responde 409 `YA_EXISTE` o `YA_EXISTE_INHABILITADO`
(ver [Crear sobre un registro inhabilitado](#crear-sobre-un-registro-inhabilitado)).

### Inhabilitar

Se rechaza si el profesor tiene clases habilitadas futuras (de un día posterior a hoy, o de
hoy y aún sin terminar):

```json
{
  "codigo": "TIENE_CLASES_FUTURAS",
  "mensaje": "El profesor tiene clases futuras habilitadas. Reasígnelas o inhabilítelas antes.",
  "detalles": { "clasesFuturas": 4 }
}
```

Habilitar un profesor siempre está permitido.

---

## 9. Alumnos

| Método y ruta | Qué hace | Respuesta |
|---|---|---|
| `GET /alumnos?estado=&grupoId=&buscar=&page=&size=` | Lista paginada, por apellido | 200 `Paginado<Alumno>` |
| `GET /alumnos/{ci}` | Detalle | 200 `Alumno` |
| `POST /alumnos` | Crea | 201 `Alumno` |
| `PUT /alumnos/{ci}` | Edita | 200 `Alumno` |
| `PATCH /alumnos/{ci}/inhabilitar` | Inhabilita (siempre permitido) | 200 `Alumno` |
| `PATCH /alumnos/{ci}/habilitar` | Habilita | 200 `Alumno` |

Todas responden 404 `NO_ENCONTRADO` si no existe un alumno con ese CI.

### Filtros de la lista

| Parámetro | Efecto |
|---|---|
| `grupoId` | Solo los alumnos de ese grupo |
| `buscar` | Texto contenido en el CI, los nombres, los apellidos o "nombres apellidos" |

`buscar` no distingue mayúsculas, pero **sí distingue acentos**: `diaz` no encuentra
"Díaz". Los filtros se combinan entre sí y con `estado`.

Ejemplo: `GET /alumnos?buscar=camila&grupoId=2&page=1&size=10`

### Crear y editar

`POST /alumnos`:

```json
{ "ci": 100096, "nombres": "Sofía", "apellidos": "Benítez", "edad": 19, "correo": null, "telefono": "0971000000", "grupoId": 2 }
```

`PUT /alumnos/{ci}` usa el mismo cuerpo **sin `ci`**. Sirve también para cambiar de grupo.

| Campo | Obligatorio | Regla |
|---|---|---|
| `ci` | Sí (solo al crear) | Número positivo |
| `nombres`, `apellidos` | Sí | Hasta 100 caracteres |
| `edad` | No | Entre 5 y 120 |
| `correo` | No | Formato de correo, hasta 150 caracteres |
| `telefono` | No | Hasta 30 caracteres |
| `grupoId` | Sí | Un grupo existente y habilitado |

Errores propios:

| Situación | Respuesta |
|---|---|
| El CI ya existe (solo `POST`) | 409 `YA_EXISTE` o `YA_EXISTE_INHABILITADO`, con `detalles.id` |
| `grupoId` no existe | 400 `VALIDACION`, con la clave `grupoId` |
| El grupo está inhabilitado | 409 `GRUPO_INHABILITADO`, con `detalles.grupoId` |

En `PUT`, el grupo solo se valida **si cambia**: se pueden corregir los datos personales
de un alumno cuyo grupo está inhabilitado, siempre que se envíe su mismo `grupoId`.

### Habilitar

Se rechaza con 409 `GRUPO_INHABILITADO` si el grupo del alumno está inhabilitado. Primero
hay que habilitar el grupo, o mover al alumno a otro con `PUT`.

Para el selector de grupo en los formularios, usar `GET /grupos` (solo habilitados).

---

## 10. Comportamientos comunes

### Crear sobre un registro inhabilitado

Al crear un alumno, profesor o grupo cuya clave ya existe:

- **409 `YA_EXISTE`**: ya hay uno habilitado. Mostrar el mensaje.
- **409 `YA_EXISTE_INHABILITADO`**: existe pero está inhabilitado. `detalles.id` trae su
  identificador (el CI en alumnos y profesores). El front puede ofrecer **reactivarlo**:
  si el usuario acepta, llamar a `PATCH /{recurso}/{id}/habilitar`.

Reactivar no actualiza los datos: conserva los que tenía. Si hace falta cambiarlos, hacer
un `PUT` después.

### Habilitar e inhabilitar son idempotentes

Repetir la operación sobre un registro que ya está en ese estado responde 200 con el
recurso actual, sin error. No hace falta comprobar el estado antes de llamar.

### Después de una escritura

`POST`, `PUT` y `PATCH` devuelven el recurso actualizado, así que se puede refrescar la
fila sin volver a pedir la lista. La excepción es la cascada de grupo: tras confirmarla hay
que recargar las listas de alumnos y de clases que estén en pantalla.

### Sugerencias de interfaz

- Un selector de estado (habilitados, inhabilitados, todos) en cada lista.
- Distinguir visualmente las filas con `habilitado: false`, y mostrar el botón "Habilitar"
  o "Inhabilitar" según corresponda.
- En las listas de clases, marcar el grupo o el profesor cuando traen `habilitado: false`.

---

## 11. Lo que todavía no existe

Estas pantallas no se pueden conectar aún. El contrato puede cambiar hasta que se
implementen, así que no conviene adelantarlas.

| Funcionalidad | Fase del backend |
|---|---|
| Aulas: gestión, aulas libres por horario, ocupación por día | 3 |
| Clases: lista general con filtros, crear, editar, habilitar e inhabilitar | 4 |
| Convocatorias y su calendario de exámenes | 5 |
| Exámenes y notas; presencia; cuotas | 6 |
| Cuotas, notas y presencias de un alumno (`/alumnos/{ci}/...`) | 6 |
| Usuarios, inicio de sesión y permisos por rol | 7 |

Lo que **sí** queda fijo para todo lo que venga: el formato de errores, el parámetro
`estado`, la paginación con `page` y `size`, y el patrón `PATCH .../habilitar` e
`.../inhabilitar`.
