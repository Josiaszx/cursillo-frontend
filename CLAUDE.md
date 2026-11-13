# Cursillo — frontend

Frontend Angular de un proyecto de práctica. Contrato de la API: `Docs/API_FRONTEND.md`.
Diseño de referencia y alcance inicial: `Docs/GUIA_INICIAL.md` (incluye el enlace al canvas de
diseño con las 9 pantallas).

## Estado del proyecto (resumen para retomar)

**Última actualización:** 2026-11-12. Las 5 fases del plan inicial están **terminadas**; lo único
pendiente depende del backend (ver "Próximos pasos").

### Cómo trabajar
- Stack: Angular 21 (standalone, signals, `@if`/`@for`), SCSS, Vitest, gestor
  **bun**. Sin librería de UI: los componentes de `shared/ui` están hechos a mano.
- `bun run start` (`ng serve`, puerto **4200**) · `bunx ng build` · `bunx ng test --no-watch`.
- Backend en `http://localhost:5082` (URL en `src/app/core/config/api-url.ts`). Su CORS debe
  permitir `http://localhost:4200` (`Cors:OrigenesPermitidos` en el `appsettings.Development.json`
  del backend). Sin autenticación todavía.

### Estructura (`src/app`)
- `core/`: `api/` (`ApiClient`, `ApiError`, `errorInterceptor`), `models/` (interfaces de la
  API), `forms/` (mensajes de error y errores de servidor por campo), `services/`
  (`CatalogosService`, `Notificaciones`), `util/` (`paginacion`, `formato`), `config/`.
- `shared/ui/`: `app-dialog`, `app-paginador`, `app-selector-estado`, `app-icon`,
  `app-notificaciones`. Estilos globales y tokens de diseño en `src/styles.scss`.
- `layout/shell`: sidebar fijo y colapsable (barra superior bajo 640 px) + `<router-outlet>`.
- `features/`: `grupos/`, `alumnos/`, `profesores/`. Cada uno tiene su `*.service.ts`, su página
  de lista, su formulario en diálogo y (grupos y profesores) una página de detalle.

### Lo hecho, por fase
0. **Cimientos:** tokens de estilo, shell con sidebar fijo (iconos que no se mueven al colapsar,
   botón que sale a un recuadro exterior), rutas con carga perezosa, `ApiClient` + interceptor de
   errores tipado (`ApiError.codigo`, `erroresPorCampo`).
1. **Modelos y catálogos:** interfaces de la sección 5 de la API y `CatalogosService`
   (solo `tipos-clase`; los otros 4 catálogos aún no se usan en pantalla).
2. **Grupos** (`/grupos`, `/grupos/:id`): tarjetas, filtro de estado, alta/edición, habilitar,
   inhabilitar con **cascada en dos pasos** (409 `CASCADA_REQUERIDA` → diálogo con el impacto →
   reintento con `?confirmarCascada=true`). Detalle con pestañas de alumnos y clases (siempre
   todos, sin filtro; sin columna de correo).
3. **Alumnos** (`/alumnos`): tabla paginada **por la API**, búsqueda con espera de 300 ms, filtros
   de grupo y estado, alta/edición, comprobación del CI al salir del campo, reactivar inhabilitados.
4. **Profesores** (`/profesores`, `/profesores/:ci`): tarjetas, mismo patrón que alumnos,
   `TIENE_CLASES_FUTURAS` explicado con la cantidad, detalle con sus clases.
5. **Pulido:** verificado en navegador (escritorio y móvil), corregido un desborde horizontal en
   `/alumnos`, foco inicial de formularios, accesibilidad básica y tests de los flujos críticos
   (44 tests, todos en verde).

### Decisiones tomadas con el usuario (no revertir sin preguntar)
- El menú solo tiene **Alumnos, Grupos y Profesores**. Las otras 6 pantallas del diseño
  (Resumen, Horarios, Asistencia, Pagos, Reportes, Configuración) **no se agregan** hasta que el
  backend tenga sus endpoints. Se eliminaron del diseño los datos inventados (usuario "María
  Rojas", "Ciclo 2026", cupo de 20, turnos, docente por grupo, asistencia y pago de alumnos).
- "Docentes" del diseño es **"Profesores"** en la app (nombre de la API).
- Los diálogos **no** se cierran con un clic fuera (sí con X, Cancelar y Esc).
- Los éxitos son una tarjeta que se desvanece (2 s; 5 s en mensajes largos); los errores no.
- Cambios de gusto ya hechos: sin filtro de estado en los detalles; paginación con selector de
  tamaño y números en **todas** las listas (ver sección siguiente).

### Pendiente y próximos pasos
- **Al retomar tras trabajar en el backend:** releer `Docs/API_FRONTEND.md` (puede haber cambiado
  el contrato) y comprobar que el front sigue compilando y pasando tests.
- Pantallas bloqueadas por el backend (fases del backend según `API_FRONTEND.md` §11): aulas
  (fase 3), clases generales con filtros y su CRUD (fase 4), convocatorias y calendario de
  exámenes (fase 5), exámenes/notas/presencia/cuotas (fase 6), usuarios, login y permisos por rol
  (fase 7). Al llegar la autenticación, el token se agrega en `ApiClient`/un interceptor.
- Ideas descartadas por falta de endpoint: "próxima clase" del profesor, grupos/horas semanales
  en la ficha de profesores, cupo de grupos.
- Las escrituras (`POST/PUT/PATCH`) del backend se usaron manualmente (existe el grupo "gg" creado
  por el usuario), pero no hay tests de integración contra el backend real.
- No hay `DELETE` en la API: no crear datos de prueba en la base local sin avisar.

## Comportamiento de todas las listas

Toda lista (tarjetas o tabla) que muestre más de un puñado de registros sigue esta regla:

1. **Paginación obligatoria.** Nunca se renderiza la lista completa de una vez.
2. **Al final de la lista**, con el componente `app-paginador` (`src/app/shared/ui/paginador.ts`):
   - Texto del rango mostrado: "Mostrando 1–20 de 95".
   - **Navegación numerada** entre páginas: anterior, números, siguiente. Siempre se ven la
     primera, la última y las vecinas de la actual; los saltos se marcan con "…". El número de
     páginas **se calcula** a partir del total de elementos y del tamaño de página
     (`ceil(total / size)`); no se recibe hecho.
   - **Selector "Por página"** para elegir cuántos elementos ver: `10, 20, 50, 100`
     (`TAMANOS_PAGINA` en `src/app/core/util/paginacion.ts`; 100 es el máximo que admite la API).
     El valor por defecto es 20.
3. **Cambiar el tamaño de página vuelve a la página 1.** Cambiar un filtro (por ejemplo `estado`)
   también.
4. **Si la API pagina** (`Paginado<T>`: `/alumnos` y las listas de clases), se pasan `page` y
   `size` como parámetros y el paginador usa el `total` de la respuesta.
5. **Si la API devuelve un arreglo completo** (grupos, profesores, alumnos de un grupo), la
   paginación se hace en el cliente con `PaginacionLocal`
   (`src/app/core/util/paginacion.ts`), que además acota la página si la lista se achica.
6. Cuando el paginador va dentro de su propia tarjeta (listas de tarjetas), usar
   `[borde]="false"`; bajo una tabla se deja la línea superior por defecto.

Las listas nuevas deben reutilizar `app-paginador`; no se escriben controles de paginación a mano.

## Detalle de un grupo

Las pestañas de alumnos y clases del detalle de grupo muestran **siempre todos** los registros
(`estado=todos`), sin filtro de estado. Las filas inhabilitadas se distinguen por su insignia.

## Convenciones de la interfaz

- **Éxito vs error.** Una operación correcta se avisa con `Notificaciones.exito(texto)`
  (`src/app/core/services/notificaciones.ts`): tarjeta abajo que se desvanece a los 2 s
  (`DURACION_MENSAJE_LARGO_MS`, 5 s, solo para mensajes de varias frases). Los errores **no** se
  desvanecen: se muestran en una `.alert.alert-error` fija con botón "Cerrar" o "Reintentar".
- **Diálogos** (`app-dialog`): solo se cierran con la X, "Cancelar" o Esc; un clic fuera no los
  cierra. Mientras están abiertos la página de fondo no hace scroll. El primer campo editable
  lleva `autofocus` (al editar, el CI está deshabilitado y el foco va a "nombres").
- **Formularios de alta con CI** (alumnos, profesores): al salir del campo CI se consulta
  `GET /{recurso}/{ci}`; si existe se avisa y, si está inhabilitado, se ofrece reactivarlo.
  Los opcionales vacíos viajan como `null`, nunca como `""`.
- **Estados de una lista**: cargando ("Cargando…"), vacía (mensaje en `.estado-vacio`) y error
  (alerta con "Reintentar"). Las filas inhabilitadas se ven en gris con su insignia.
- **Responsive**: bajo 640 px el sidebar pasa a barra superior. Las tablas van dentro de
  `.tabla-wrap` (scroll horizontal propio; es `position: relative` para recortar también el
  texto `.sr-only`, que es `position: absolute`). Las rejillas usan `minmax(min(300px, 100%), 1fr)`.
- **Accesibilidad**: enlace "Saltar al contenido" en el shell, `scope` en las cabeceras de tabla,
  `aria-current` en la navegación y la paginación, etiquetas (visibles u ocultas) en todos los
  campos y filtros.

## Pruebas

- `bun run test` (Vitest). Los tests de componentes que dependen de peticiones HTTP no pueden
  usar `fixture.whenStable()` (espera a las peticiones pendientes y se cuelga): usar
  `fixture.detectChanges()` y un `setTimeout` corto, y responder con `HttpTestingController`.
- jsdom no implementa `<dialog>.showModal()`: stub con `HTMLDialogElement.prototype.showModal = vi.fn()`.
