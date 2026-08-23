# Un solo Supabase para 10 tenants — manual portable

**Versión:** 1.0 · Agosto 2026
**Origen:** patrón extraído de Yarvis Odontológico (10 clínicas), validado
midiendo contra PostgreSQL real
**Destino de este documento:** cualquier SaaS B2B multi-tenant. Los ejemplos usan
**escuelas de patinaje**, pero el patrón es el mismo cambiando los nombres.

---

## Cómo usar este documento

Está escrito para que se lo entregues a Claude junto con la descripción de tu
dominio y te genere el schema completo. El prompt sugerido está en el **anexo A**.

Todo lo que aparece aquí está probado. Las cifras de rendimiento son mediciones
sobre 10 tenants con datos reales, no estimaciones. Las trampas marcadas con ⚠
son bugs que ya ocurrieron y costaron una auditoría completa: si las evitas desde
el día 1, te ahorras esa auditoría.

**Convención de nombres.** En Yarvis el tenant se llama `branch` (sede de la
clínica). En tu proyecto será `school` (escuela de patinaje). A lo largo del
documento uso `tenant_id` cuando hablo del patrón y `school_id` cuando muestro
código adaptado. Elige un nombre y **no lo cambies nunca**: ese identificador
aparecerá en 40 tablas, 200 policies y todo el backend.

---

## 1. La decisión de fondo: shared schema, no schema-per-tenant

Hay tres formas de hacer multi-tenant y la gente suele elegir mal por intuición.

| Modelo | Tablas con 10 tenants | Aislamiento | Migraciones |
|---|---|---|---|
| **Shared schema** (una columna `tenant_id` por fila) | **116** | RLS de PostgreSQL | 1 sentencia |
| Schema por tenant (`escuela_1.alumnos`, `escuela_2.alumnos`…) | 1.160 | separación física | 10 sentencias |
| Base de datos por tenant | 116 × 10 instancias | total | 10 despliegues |

La intuición dice que separar físicamente es más seguro. **Lo medí montando los
dos.** Esto es lo que salió:

| Métrica | Shared schema | 10 schemas |
|---|---|---|
| Tablas | 122 | **1.081** |
| Objetos en el catálogo de PostgreSQL | ~500 | 4.716 |
| Filas en `pg_attribute` | ~4.000 | 32.549 |
| Tiempo de creación | 4 s | **34,6 s** |
| Introspección (lo que hace PostgREST al recargar) | 0,03 s | 0,07 s |
| Migración de una columna | **1 sentencia** | **20 sentencias** |

Con diez tenants la degradación técnica se tolera. **El problema real es
operativo**, y lo demostré: simulé que una migración falla en un solo schema y la
base quedó con **9 escuelas con la columna nueva y 1 sin ella**.

Eso es *schema drift*. A partir de ahí el mismo código funciona para nueve
escuelas y falla para una, y cada despliegue posterior amplía la divergencia. En
shared schema no puede ocurrir: la migración es una sola sentencia, atómica.

Hay tres costos más que crecen con cada cliente:

- **PostgREST** mantiene un *schema cache* en memoria y lo reconstruye en cada
  recarga. Con 1.160 tablas las recargas se vuelven visibles.
- **GoTrue y Storage** usan un único schema `auth` y `storage`. No se replican por
  tenant, así que el aislamiento hay que resolverlo igualmente con RLS: pagas el
  costo de los schemas sin evitar el trabajo.
- **Dar de alta un cliente** pasa de un `INSERT` a ejecutar miles de líneas de
  DDL, con todo lo que puede fallar a mitad.

**Veredicto: shared schema + RLS.** El resto del documento asume esa decisión.

### 1.1 ¿Cuántos tenants aguanta?

Medido con 10 escuelas de tamaño realista (500 alumnos, 5 entrenadores, 5.000
clases al año, 3.000 registros de asistencia cada una):

| Concepto | Medido |
|---|---|
| Tamaño de la base | **36 MB** (3,7 MB por tenant) |
| `pg_dump` completo | 1,4 s |
| Restauración completa | 8,0 s |
| Lag de la réplica | 66 ms |
| Failover con `pg_promote` | 0,44 s, cero pérdida |

Proyección: 30 tenants = 109 MB, 100 tenants = 364 MB. En un disco de 160 GB eso
es el 0,2%.

**El límite no es la base de datos.** Es la RAM del stack completo de Supabase
(Kong, GoTrue, PostgREST, Realtime, Storage, Studio) más tu backend: **8,0 GB en
pico sobre 16 GB disponibles**. Dimensiona por memoria, no por disco. Con 8 GB de
RAM el stack entra en OOM.

---

## 2. La columna `tenant_id`: dónde va y dónde no

### 2.1 Clasifica tus tablas en tres grupos

Antes de escribir una línea de SQL, haz este ejercicio con tu modelo:

**Grupo A — Tablas del tenant.** Llevan `school_id NOT NULL`. Todo lo que
pertenece a una escuela concreta:

```
schools (la tabla raíz)   students          guardians
coaches                   enrollments       classes
class_sessions            attendance        payments
invoices                  evaluations       competitions
equipment                 rinks             schedules
```

**Grupo B — Catálogos globales.** NO llevan `school_id`. Son iguales para todas
las escuelas y los mantiene la plataforma:

```
catalog_skate_disciplines   (velocidad, artístico, hockey, freestyle)
catalog_belt_levels         (los niveles o categorías del deporte)
catalog_document_types      (CC, TI, cédula de extranjería)
catalog_payment_methods     (efectivo, tarjeta, PSE, Nequi)
catalog_relationships       (padre, madre, acudiente)
roles / permissions
```

**Grupo C — Tablas hija.** NO llevan `school_id` — lo heredan del padre:

```
attendance_details      → hija de attendance
invoice_items           → hija de invoices
evaluation_criteria     → hija de evaluations
class_session_students  → hija de class_sessions
```

> ⚠ **Trampa 1.** Es tentador poner `school_id` en absolutamente todo «por si
> acaso». No lo hagas en los catálogos: multiplicas 10 veces las filas de
> `catalog_disciplines` y cada escuela puede terminar con una lista distinta de
> disciplinas, que es justo lo que un catálogo global evita.
>
> En las tablas hija tampoco hace falta: heredan el aislamiento del padre (ver
> §4.3). Ponerlo es válido y hasta más rápido, pero entonces **tienes que
> mantenerlo sincronizado con un trigger**, porque si el `school_id` de la hija
> se desincroniza del padre tienes una fuga silenciosa.

### 2.2 La desnormalización es deliberada

`school_id` se repite en 40 tablas en lugar de resolverse por JOIN. Es
desnormalización a propósito:

```sql
-- ❌ Una policy con JOIN se evalúa POR CADA FILA. Con 50.000 clases es inviable.
USING (EXISTS (SELECT 1 FROM enrollments e
               JOIN students s ON s.id = e.student_id
               WHERE e.id = attendance.enrollment_id
                 AND s.school_id = auth.user_school_id()))

-- ✅ Comparación directa contra una columna indexada
USING (same_school(school_id))
```

### 2.3 La unicidad cambia de significado

⚠ **Trampa 2, y de las caras.** En un sistema mono-tenant escribes:

```sql
student_code VARCHAR(20) UNIQUE          -- ❌ ahora es UNIQUE GLOBAL
```

Con multi-tenant eso significa que **si la Escuela A registra el alumno `001`, la
Escuela B ya no puede**. Cada escuela quiere empezar su numeración en 1. Y peor:
un mismo niño puede estar inscrito en dos escuelas, así que el número de documento
tampoco puede ser único global.

```sql
-- ✅ Unicidad POR TENANT
CREATE UNIQUE INDEX uq_students_code_school
    ON students(school_id, student_code) WHERE student_code IS NOT NULL;

CREATE UNIQUE INDEX uq_students_document_school
    ON students(school_id, document_type_id, document_id);
```

**Decide caso por caso.** En Yarvis el número de factura sí se dejó único global,
porque la resolución de la DIAN lo exige. En tu proyecto, revisa: ¿el código de
alumno es por escuela? Casi seguro sí. ¿El número de recibo? Depende de si cada
escuela factura con su propio NIT.

---

## 3. Los claims del JWT: de dónde sale el `school_id`

El aislamiento se sostiene en una idea: **el `school_id` viaja dentro del token
firmado, nunca en el cuerpo de la petición**. Si el cliente puede enviarlo, puede
escribir en otra escuela.

Supabase lo permite con el `custom_access_token_hook` de GoTrue: una función
PL/pgSQL que se ejecuta al emitir cada token y le inyecta claims.

### 3.1 Tabla de claims

```sql
CREATE TABLE user_claims (
    user_id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    school_id          UUID REFERENCES schools(id),
    coach_id           UUID REFERENCES coaches(id),   -- si el usuario es entrenador
    role_name          TEXT NOT NULL,
    is_platform_admin  BOOLEAN NOT NULL DEFAULT FALSE,
    is_active          BOOLEAN NOT NULL DEFAULT TRUE,
    created_at         TIMESTAMPTZ DEFAULT NOW(),
    updated_at         TIMESTAMPTZ DEFAULT NOW()
);
```

Es una tabla aparte y no una vista sobre `users` a propósito: el hook se ejecuta
en el camino crítico del login y tiene que ser una lectura por clave primaria.

### 3.2 El hook

```sql
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event JSONB)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public          -- ⚠ obligatorio en SECURITY DEFINER
AS $$
DECLARE
    claims           JSONB;
    v_role           TEXT;
    v_school_id      TEXT;
    v_coach_id       TEXT;
    v_platform_admin BOOLEAN;
    v_active         BOOLEAN;
    v_school_active  BOOLEAN;
BEGIN
    SELECT uc.role_name,
           uc.school_id::TEXT,
           uc.coach_id::TEXT,
           COALESCE(uc.is_platform_admin, FALSE),
           COALESCE(uc.is_active, TRUE),
           COALESCE(s.is_active, TRUE)
      INTO v_role, v_school_id, v_coach_id, v_platform_admin, v_active, v_school_active
      FROM public.user_claims uc
      LEFT JOIN public.schools s ON s.id = uc.school_id
     WHERE uc.user_id = (event->>'user_id')::UUID;

    claims := event->'claims';

    -- Usuario sin registro de claims → sin permisos (fail-closed)
    IF v_role IS NULL THEN
        claims := jsonb_set(claims, '{user_role}', '"none"'::JSONB);
        RETURN jsonb_set(event, '{claims}', claims);
    END IF;

    -- Usuario desactivado o ESCUELA desactivada → bloqueado.
    -- Esto es lo que permite suspender una escuela morosa: pones
    -- schools.is_active = FALSE y todos sus usuarios dejan de entrar,
    -- sin borrar ni un dato.
    IF NOT v_active OR NOT v_school_active THEN
        claims := jsonb_set(claims, '{user_role}', '"blocked"'::JSONB);
        RETURN jsonb_set(event, '{claims}', claims);
    END IF;

    claims := jsonb_set(claims, '{user_role}', to_jsonb(v_role));
    claims := jsonb_set(claims, '{is_platform_admin}', to_jsonb(v_platform_admin));

    IF v_school_id IS NOT NULL THEN
        claims := jsonb_set(claims, '{school_id}', to_jsonb(v_school_id));
    END IF;
    IF v_coach_id IS NOT NULL THEN
        claims := jsonb_set(claims, '{coach_id}', to_jsonb(v_coach_id));
    END IF;

    RETURN jsonb_set(event, '{claims}', claims);
END;
$$;

-- Permisos: solo GoTrue puede ejecutarlo
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM authenticated, anon, public;
GRANT SELECT ON public.user_claims TO supabase_auth_admin;
```

**Los tres detalles que importan:**

1. **Fail-closed.** Un usuario sin fila en `user_claims` obtiene `user_role: none`
   y no ve nada. El caso por defecto es negar, no permitir.
2. **`SET search_path = public`** en una función `SECURITY DEFINER` no es opcional:
   sin eso, un atacante que pueda crear objetos en otro schema podría secuestrar
   la resolución de nombres.
3. **El interruptor de escuela** (`schools.is_active`) es tu mecanismo comercial
   para suspender un cliente moroso sin tocar sus datos.

### 3.3 Activarlo en el compose

```yaml
supabase-auth:
  environment:
    GOTRUE_HOOK_CUSTOM_ACCESS_TOKEN_ENABLED: "true"
    GOTRUE_HOOK_CUSTOM_ACCESS_TOKEN_URI: "pg-functions://postgres/public/custom_access_token_hook"
```

> ⚠ **Trampa 3.** Sin estas dos variables el hook existe pero **nunca se ejecuta**.
> El token sale sin `school_id`, todas las consultas devuelven cero filas y pasas
> medio día buscando el error en las policies. Si tras el login el JWT no trae
> `school_id`, mira esto antes que nada.

### 3.4 Funciones de lectura

```sql
CREATE OR REPLACE FUNCTION auth.jwt() RETURNS JSONB LANGUAGE sql STABLE AS $$
  SELECT COALESCE(current_setting('request.jwt.claims', true)::JSONB, '{}'::JSONB) $$;

CREATE OR REPLACE FUNCTION auth.user_role() RETURNS TEXT LANGUAGE sql STABLE AS $$
  SELECT auth.jwt()->>'user_role' $$;

CREATE OR REPLACE FUNCTION auth.user_school_id() RETURNS UUID LANGUAGE sql STABLE AS $$
  SELECT NULLIF(auth.jwt()->>'school_id','')::UUID $$;

CREATE OR REPLACE FUNCTION auth.user_coach_id() RETURNS UUID LANGUAGE sql STABLE AS $$
  SELECT NULLIF(auth.jwt()->>'coach_id','')::UUID $$;
```

---

## 4. Row Level Security: las dos capas

Aquí está el corazón del patrón, y la trampa que más caro sale.

### 4.1 Separar «de qué escuela» de «qué rol»

Son dos preguntas distintas y **se resuelven con dos tipos de policy distintos**:

| Pregunta | Tipo de policy | Se combinan con |
|---|---|---|
| ¿Esta fila es de mi escuela? | `RESTRICTIVE` | **AND** |
| ¿Mi rol puede hacer esto? | `PERMISSIVE` (por defecto) | **OR** entre ellas |

PostgreSQL evalúa: `(permisiva1 OR permisiva2 OR …) AND (restrictiva1 AND …)`.

Eso significa que **la restrictiva de tenant nunca se puede saltar por añadir un
rol nuevo**. Puedes crear todas las policies de rol que quieras y ninguna abrirá
la puerta a otra escuela. Es la propiedad que hace este diseño seguro frente a
cambios futuros.

### 4.2 La función de aislamiento

```sql
CREATE OR REPLACE FUNCTION public.same_school(row_school_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
PARALLEL SAFE
AS $$
    SELECT row_school_id =
           NULLIF(current_setting('request.jwt.claims', TRUE)::JSONB ->> 'school_id', '')::UUID;
$$;

GRANT EXECUTE ON FUNCTION public.same_school TO authenticated, anon, service_role;
```

> ⚠ **Trampa 4 — la más cara de todas. Usa `=`, nunca `IS NOT DISTINCT FROM`.**
>
> `IS NOT DISTINCT FROM` parece mejor porque maneja NULL. **Pero no es
> indexable**: PostgreSQL no puede usar el índice btree de `school_id` y degrada
> a `Seq Scan` sobre las filas de *todas* las escuelas, filtrando después.
>
> Medido con 10 tenants (50.000 clases, 30.000 asistencias):
>
> | Consulta | `IS NOT DISTINCT FROM` | `=` | Mejora |
> |---|---|---|---|
> | Agenda del día | 28,5 ms | **0,12 ms** | **237x** |
> | Conteo de clases | 202,5 ms | 47,0 ms | 4,3x |
> | Conteo de asistencias | 121,3 ms | 26,7 ms | 4,5x |
>
> Lo grave no es la lentitud puntual: **empeora con cada tenant nuevo**. Sin
> índice, cada escuela que entra hace más lentas las consultas de todas las
> demás. Con `=`, el número de tenants deja de importar.
>
> Con `=` el aislamiento **sigue siendo fail-closed**: si el JWT no trae
> `school_id`, la comparación devuelve NULL, la policy no se cumple y no se ve
> ninguna fila. Verificado.
>
> **No marques la función `LEAKPROOF.** Aporta menos del 8% adicional y permite
> al planificador evaluar filtros del usuario *antes* del chequeo RLS, con riesgo
> de filtrar datos de otra escuela a través de mensajes de error.

### 4.3 Aplicar el aislamiento en bloque

```sql
DO $$
DECLARE
    t TEXT;
    tablas TEXT[] := ARRAY[
        'students','guardians','coaches','enrollments','classes',
        'class_sessions','attendance','payments','invoices',
        'evaluations','competitions','equipment','rinks','schedules'
        -- … todas las del Grupo A
    ];
BEGIN
    FOREACH t IN ARRAY tablas LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
        EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
        EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON %I', t);
        EXECUTE format(
            'CREATE POLICY tenant_isolation ON %I
                 AS RESTRICTIVE FOR ALL
                 TO authenticated
                 USING (public.same_school(school_id))
                 WITH CHECK (public.same_school(school_id))', t);
    END LOOP;
END $$;
```

`FORCE ROW LEVEL SECURITY` es lo que hace que las policies apliquen **también al
dueño de la tabla**, es decir al rol con el que se conecta tu backend. Sin
`FORCE`, tu API salta todo el aislamiento sin darse cuenta.

> ⚠ **Trampa 5 — una policy `RESTRICTIVE` sola no concede NADA.**
>
> Este bucle deja cada tabla con una sola policy: la restrictiva de tenant. Y una
> restrictiva **no otorga acceso, solo lo limita**. La fórmula de PostgreSQL es:
>
> ```
> (permisiva1 OR permisiva2 OR …)  AND  (restrictiva1 AND restrictiva2 AND …)
> ```
>
> Si no hay ninguna permisiva, el primer paréntesis es **falso** y no se ve nada,
> aunque la restrictiva se cumpla perfectamente.
>
> Lo reproduje montando el dominio de patinaje. Con `attendance` teniendo solo
> `tenant_isolation`:
>
> ```
> Tabla PADRE  -> 1 alumnos propios, 0 ajenos     ← students SÍ tenía permisiva
> Tabla HIJA   -> 0 visibles                       ← attendance NO tenía → cadena rota
> ERROR: Tabla hija INACCESIBLE
> ```
>
> Y con una permisiva de rol añadida a `attendance`:
>
> ```
> Tabla PADRE  -> 1 alumnos propios, 0 ajenos
> Tabla HIJA   -> 1 visibles, 0 de la otra escuela
> Escritura cruzada -> 0 filas afectadas
> >>> AISLAMIENTO OK <<<
> ```
>
> Fíjate en el efecto dominó: la hija heredaba de `attendance`, y como el padre
> era invisible, la hija también. **Un solo padre sin permisiva deja ciego todo
> su subárbol.**
>
> **Regla:** cada tabla del Grupo A necesita como mínimo DOS policies — la
> restrictiva `tenant_isolation` y al menos una permisiva de rol. La consulta de
> verificación de §4.6 detecta las que no tienen ninguna, pero **no** las que
> tienen solo la restrictiva. Usa esta otra:
>
> ```sql
> SELECT c.relname AS solo_restrictiva
> FROM pg_class c
> WHERE c.relnamespace = 'public'::regnamespace AND c.relkind='r' AND c.relrowsecurity
>   AND EXISTS (SELECT 1 FROM pg_policies p
>               WHERE p.schemaname='public' AND p.tablename=c.relname
>                 AND p.permissive='RESTRICTIVE')
>   AND NOT EXISTS (SELECT 1 FROM pg_policies p
>                   WHERE p.schemaname='public' AND p.tablename=c.relname
>                     AND p.permissive='PERMISSIVE');
> -- debe devolver 0 filas
> ```

### 4.4 Rellenar el `tenant_id` automáticamente

```sql
CREATE OR REPLACE FUNCTION public.set_school_id_from_jwt()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.school_id IS NULL THEN
        NEW.school_id := auth.user_school_id();
    END IF;
    RETURN NEW;
END;
$$;

-- aplicar como BEFORE INSERT en todas las tablas del Grupo A
```

Red de seguridad, no sustituto: el backend **igual** debe poner el `school_id`
desde los claims. El trigger evita el `NOT NULL violation` si alguien lo olvida.

### 4.5 Las policies de rol

```sql
-- Entrenador: solo sus propias clases
CREATE POLICY coach_own_classes ON classes
    FOR ALL USING (
        auth.user_role() = 'coach' AND coach_id = auth.user_coach_id()
    );

-- Recepción: lee todo lo de su escuela, escribe inscripciones y pagos
CREATE POLICY reception_read_classes ON classes
    FOR SELECT USING (auth.user_role() IN ('reception','admin'));

-- Admin de la escuela: todo dentro de su escuela
CREATE POLICY admin_full_classes ON classes
    FOR ALL USING (auth.user_role() = 'admin');
```

Fíjate: **ninguna menciona `school_id`**. No hace falta — la restrictiva
`tenant_isolation` ya se combina con AND sobre todas ellas.

### 4.6 ⚠ Trampa 6: las tablas hija, el error de los 31 casos

Esta se lleva el premio a «más días perdidos por un fallo que no da ningún error».

Cuando activas RLS en el 100% de las tablas (que es lo correcto, deny-by-default),
las tablas hija se quedan con **RLS activo y cero policies**. En PostgreSQL eso
significa que **nadie puede leerlas ni escribirlas**, ni siquiera tu backend por
culpa de `FORCE RLS`.

Y no falla con un error. **Devuelve cero filas.** El desarrollador ve una lista
vacía, revisa su código, revisa el ORM, revisa los datos con `psql` como
superusuario —donde sí están— y pierde el día.

En Yarvis quedaron así 31 tablas, entre ellas casi todas las del módulo clínico.

**La solución: heredar el acceso del padre.**

```sql
CREATE OR REPLACE FUNCTION public._policy_hereda_de_padre(
    p_hija  TEXT, p_fk TEXT, p_padre TEXT, p_pk TEXT DEFAULT 'id'
) RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE v_nombre TEXT := 'inherit_' || p_hija;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename=p_hija) THEN
        RAISE WARNING 'la tabla % no existe, se omite', p_hija; RETURN;
    END IF;
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', v_nombre, p_hija);
    EXECUTE format($f$
        CREATE POLICY %I ON public.%I FOR ALL
        USING       (EXISTS (SELECT 1 FROM public.%I p WHERE p.%I = public.%I.%I))
        WITH CHECK  (EXISTS (SELECT 1 FROM public.%I p WHERE p.%I = public.%I.%I))
    $f$, v_nombre, p_hija, p_padre, p_pk, p_hija, p_fk,
         p_padre, p_pk, p_hija, p_fk);
END;
$$;

-- Uso: hija, columna FK, tabla padre
SELECT _policy_hereda_de_padre('attendance_details',    'attendance_id',     'attendance');
SELECT _policy_hereda_de_padre('invoice_items',         'invoice_id',        'invoices');
SELECT _policy_hereda_de_padre('evaluation_criteria',   'evaluation_id',     'evaluations');
SELECT _policy_hereda_de_padre('class_session_students','class_session_id',  'class_sessions');
```

Como el padre ya tiene sus policies de tenant y de rol, el `EXISTS` las respeta
automáticamente. Si puedes ver la clase, puedes ver su lista de asistencia; si
no, tampoco.

**Verificación obligatoria** (ponla en tu CI, ver §8):

```sql
SELECT c.relname AS tabla_inaccesible
FROM pg_class c
WHERE c.relnamespace = 'public'::regnamespace
  AND c.relkind = 'r' AND c.relrowsecurity
  AND NOT EXISTS (SELECT 1 FROM pg_policies p
                  WHERE p.schemaname='public' AND p.tablename = c.relname);
-- debe devolver 0 filas
```

---

## 5. El backend: la línea que decide si hay fuga

Con `FORCE RLS`, tu backend **también** está sujeto a las policies. Necesita
declarar quién es en cada transacción.

```python
await session.execute(
    text("SELECT set_config('request.jwt.claims', :claims, true)"),
    {"claims": claims.model_dump_json(exclude_none=True)},
)
```

> ⚠ **Trampa 7 — un carácter entre funcionar y filtrar datos.**
>
> Ese tercer parámetro en `true` significa **`SET LOCAL`**: los claims mueren al
> terminar la transacción.
>
> Con `SET` a secas (`false` o sin el parámetro) **persisten en la conexión**. Y
> como el pool reutiliza conexiones, **el `school_id` de una escuela se filtra a
> la petición siguiente, que puede ser de otra**.
>
> Es el bug más peligroso de esta arquitectura porque en desarrollo, con un solo
> usuario y poca concurrencia, no se manifiesta nunca. Aparece en producción,
> con carga, de forma intermitente.

### 5.1 El patrón completo en FastAPI

```python
async def obtener_claims(cred = Depends(HTTPBearer())) -> Claims:
    """Verifica la FIRMA del token. Nunca leer el payload sin verificar."""
    payload = jwt.decode(
        cred.credentials, settings.JWT_SECRET, algorithms=["HS256"],
        audience="authenticated", issuer=settings.JWT_ISSUER,
        options={"require": ["exp", "sub", "aud", "iss"]},
    )
    claims = Claims.model_validate(payload)   # extra="forbid", rol validado
    if claims.school_id is None and not claims.is_platform_admin:
        raise HTTPException(403, "El usuario no tiene escuela asignada")
    return claims


async def sesion_con_tenant(claims = Depends(obtener_claims)):
    async with SessionLocal() as s:
        async with s.begin():
            await s.execute(
                text("SELECT set_config('request.jwt.claims', :c, true)"),
                {"c": claims.model_dump_json(exclude_none=True)},
            )
            yield s
```

### 5.2 El `school_id` sale del token, nunca del cuerpo

```python
# ✅ CORRECTO
async def crear_alumno(datos: AlumnoCreate, claims: ClaimsDep, db: SesionTenant):
    alumno = Student(**datos.model_dump(), school_id=claims.school_id)

# ❌ NUNCA — el cliente elige en qué escuela escribe
async def crear_alumno(datos: AlumnoCreate, db: SesionTenant):
    alumno = Student(**datos.model_dump())   # datos.school_id vino del JSON
```

**Ningún esquema Pydantic de entrada puede tener un campo `school_id`.** Ponlo
como regla de revisión de código.

### 5.3 Depurar «me devuelve cero filas»

En este orden:

```sql
SELECT current_setting('request.jwt.claims', true);  -- 1. ¿hay claims?
SELECT auth.user_school_id();                        -- 2. ¿el school_id llega?
SELECT count(*) FROM pg_policies                     -- 3. ¿la tabla tiene policy?
 WHERE tablename = 'mi_tabla';
EXPLAIN (ANALYZE) SELECT * FROM mi_tabla;            -- 4. ¿Index Scan o Seq Scan?
```

---

## 6. Trampas del schema que no son de multi-tenant pero te van a pasar

Estas tres salieron en la auditoría y son independientes del dominio.

### 6.1 ⚠ Trampa 8: FKs declaradas antes de que exista la tabla

Si tu `schema.sql` es un archivo grande y creas `invoices` en la línea 563
referenciando `catalog_payment_methods` que está en la 2.456, **la tabla no se
crea** — y con ella caen en cascada todas las que dependían de ella.

En Yarvis eso tumbó **8 tablas** y el despliegue no abortó: siguió adelante y la
base quedó incompleta.

**Cómo detectarlo antes de que duela** (guárdalo como script):

```python
import re
src = open('database/schema.sql').read()
lines = src.split('\n')
crea = {}
for i, l in enumerate(lines, 1):
    m = re.match(r'\s*CREATE TABLE (?:IF NOT EXISTS )?([a-z_]+)', l)
    if m and m.group(1) not in crea:
        crea[m.group(1)] = i
# para cada REFERENCES, comprobar que la tabla ya se creó antes
```

**Cómo resolverlo:** mueve la tabla referenciada antes de su primer uso. Si hay
dependencia circular (A referencia a B y B a A), quita una FK del `CREATE TABLE`
y añádela después con `ALTER TABLE ... ADD CONSTRAINT`.

### 6.2 ⚠ Trampa 9: subconsultas en predicados de índice

Si tu dominio necesita un constraint de exclusión —en patinaje: **que dos clases
no se solapen en la misma pista**— vas a escribir algo así:

```sql
-- ❌ PostgreSQL lo rechaza SIEMPRE: «cannot use subquery in index predicate»
ALTER TABLE class_sessions ADD CONSTRAINT no_overlap
    EXCLUDE USING GIST (rink_id WITH =, tstzrange(start_time, end_time) WITH &&)
    WHERE (status_id NOT IN (SELECT id FROM session_statuses WHERE code='CANCELLED'));
```

El predicado de un índice parcial debe ser `IMMUTABLE` y no puede leer otras
tablas. El constraint **no se crea** y dos clases pueden solaparse sin que nada
lo impida.

**La solución: denormalizar el estado en un booleano mantenido por trigger.**

```sql
ALTER TABLE class_sessions
    ADD COLUMN occupies_rink BOOLEAN NOT NULL DEFAULT TRUE;

CREATE OR REPLACE FUNCTION sync_occupies_rink() RETURNS TRIGGER
LANGUAGE plpgsql AS $$
DECLARE v_code TEXT;
BEGIN
    SELECT code INTO v_code FROM session_statuses WHERE id = NEW.status_id;
    NEW.occupies_rink := COALESCE(v_code,'') NOT IN ('CANCELLED','POSTPONED');
    RETURN NEW;
END; $$;

CREATE TRIGGER trg_sync_occupies_rink
    BEFORE INSERT OR UPDATE OF status_id ON class_sessions
    FOR EACH ROW EXECUTE FUNCTION sync_occupies_rink();

ALTER TABLE class_sessions ADD CONSTRAINT no_overlap_rink
    EXCLUDE USING GIST (rink_id WITH =, tstzrange(start_time, end_time) WITH &&)
    WHERE (occupies_rink);
```

Requiere `CREATE EXTENSION btree_gist;` para combinar `=` con `&&`.

**Regla para el equipo:** esa columna booleana **nunca** se escribe desde la
aplicación. La mantiene el trigger. Si un endpoint la acepta como entrada, es un bug.

### 6.3 ⚠ Trampas 10 y 11: seed no idempotente y catálogos vacíos

Dos problemas que van juntos:

**a) Idempotencia.** Tu script de despliegue puede ejecutarse más de una vez. Si
los `INSERT` del seed no llevan `ON CONFLICT DO NOTHING`, el segundo despliegue
falla con decenas de errores de clave duplicada.

**b) Desalineación seed ↔ schema.** Si el seed se escribió contra una versión
distinta del schema, los `INSERT` fallan con «column X does not exist» y **los
catálogos quedan vacíos**. El síntoma es peor que un error: los desplegables de
la interfaz cargan en blanco sin ningún mensaje. En Yarvis quedaron vacíos 18.

**Prevención:** un paso de verificación en el despliegue.

```sql
DO $$
DECLARE r RECORD; n INT; vacios INT := 0;
BEGIN
    FOR r IN SELECT tablename FROM pg_tables
             WHERE schemaname='public' AND tablename LIKE 'catalog%' LOOP
        EXECUTE format('SELECT count(*) FROM %I', r.tablename) INTO n;
        IF n = 0 THEN
            RAISE WARNING 'Catálogo vacío: %', r.tablename;
            vacios := vacios + 1;
        END IF;
    END LOOP;
    IF vacios > 0 THEN
        RAISE EXCEPTION '% catálogos vacíos: los desplegables cargarían en blanco', vacios;
    END IF;
END $$;
```

**Y una recomendación de diseño:** dale a cada catálogo una columna `code`
estable (`SPEED`, `ARTISTIC`, `HOCKEY`). El backend debe referenciar por `code`,
no por UUID ni por nombre. Emparejar por nombre es frágil ante tildes, mayúsculas
y traducciones.

---

## 7. Orden de despliegue

El orden **no es una convención**: cada paso depende del anterior.

| # | Script | Si falta… |
|---|---|---|
| 1 | `schema.sql` | no hay base de datos |
| 2 | `02-catalogos-alineacion.sql` | catálogos vacíos, desplegables en blanco |
| 3 | `seed-data.sql` | sin datos paramétricos |
| 4 | `03-custom-claims.sql` | el JWT no lleva `school_id`: el multi-tenant no funciona |
| 5 | `04-multitenant-rls.sql` | **las escuelas ven los datos de las demás** |
| 6 | `06-security-hardening.sql` | `anon` conserva grants: sin login se ven datos |
| 7 | `09-policies-tablas-hijas.sql` | **N tablas quedan inaccesibles** |
| 8 | `05-test-multitenant.sql` | no se verifica el aislamiento |

Los pasos 4 a 8 corren con `ON_ERROR_STOP=1` y **abortan el despliegue** si fallan.

### 7.1 El hardening (paso 6)

```sql
-- 1. Revocar TODO al rol anon: sin login no se ve NADA vía PostgREST
REVOKE ALL ON ALL TABLES    IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon;
REVOKE USAGE ON SCHEMA public FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon;

-- 2. RLS + FORCE en el 100% de las tablas (deny-by-default)
DO $$
DECLARE r RECORD;
BEGIN
    FOR r IN SELECT tablename FROM pg_tables WHERE schemaname='public' LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', r.tablename);
        EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', r.tablename);
    END LOOP;
END $$;
```

Después de esto **es obligatorio** el paso 7, o te quedas sin acceso a las tablas
hija y a los catálogos.

### 7.2 Storage aislado por tenant

Un solo bucket privado con la escuela como primer segmento de la ruta:

```
schools/{school_id}/students/{student_id}/foto.jpg
schools/{school_id}/documents/{uuid}.pdf
```

```sql
INSERT INTO storage.buckets (id, name, public) VALUES ('schools','schools',false)
ON CONFLICT DO NOTHING;

CREATE POLICY school_storage_select ON storage.objects FOR SELECT
    USING (bucket_id = 'schools'
           AND (storage.foldername(name))[2] = auth.user_school_id()::TEXT);
-- repetir para INSERT, UPDATE, DELETE
```

---

## 8. El CI que te ahorra la auditoría

Un job que ejecute la secuencia completa contra un PostgreSQL de servicio y falle
si algo no cuadra. **Probado contra la base rota anterior a la auditoría, detecta
los cuatro bugs bloqueantes en el primer commit.**

```yaml
jobs:
  sql:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: supabase/postgres:17.6.1.136   # trae btree_gist, pgcrypto, uuid-ossp
        env: { POSTGRES_PASSWORD: ci }
        ports: ['5432:5432']
        options: >-
          --health-cmd "pg_isready -U postgres" --health-interval 5s --health-retries 20
    steps:
      - uses: actions/checkout@v4
      - run: |   # roles y schemas que provee Supabase
          psql -v ON_ERROR_STOP=1 -c "CREATE SCHEMA IF NOT EXISTS auth;" ...
      - run: |   # la secuencia en orden
          for f in schema 02-catalogos 03-claims 04-rls 06-hardening 09-hijas; do
            psql -v ON_ERROR_STOP=1 -f "database/$f.sql"
          done
      - run: psql -v ON_ERROR_STOP=1 -f ci/assertions.sql
```

Las aserciones que importan:

```sql
DO $$
DECLARE v_tablas INT; v_sin_rls INT; v_sin_policy INT; v_anon INT; v_excl INT;
BEGIN
    SELECT count(*) INTO v_tablas FROM pg_tables WHERE schemaname='public';
    SELECT count(*) INTO v_sin_rls FROM pg_class
     WHERE relnamespace='public'::regnamespace AND relkind='r' AND NOT relrowsecurity;
    SELECT count(*) INTO v_sin_policy FROM pg_class c
     WHERE c.relnamespace='public'::regnamespace AND c.relkind='r' AND c.relrowsecurity
       AND NOT EXISTS (SELECT 1 FROM pg_policies p
                       WHERE p.schemaname='public' AND p.tablename=c.relname);
    SELECT count(*) INTO v_anon FROM information_schema.role_table_grants
     WHERE grantee='anon' AND table_schema='public';
    SELECT count(*) INTO v_excl FROM pg_constraint
     WHERE conname='no_overlap_rink' AND contype='x';

    IF v_tablas < <TU_NUMERO> THEN
        RAISE EXCEPTION 'Solo % tablas: hay FKs declaradas antes de tiempo', v_tablas;
    END IF;
    IF v_sin_rls > 0 THEN
        RAISE EXCEPTION '% tablas sin RLS: datos expuestos vía PostgREST', v_sin_rls;
    END IF;
    IF v_sin_policy > 0 THEN
        RAISE EXCEPTION '% tablas con RLS y CERO policies: la app no podrá usarlas', v_sin_policy;
    END IF;
    IF v_anon > 0 THEN
        RAISE EXCEPTION 'anon tiene % grants: sin login se verían datos', v_anon;
    END IF;
    IF v_excl = 0 THEN
        RAISE EXCEPTION 'Falta el constraint anti-solapamiento de pista';
    END IF;
END $$;
```

Y **ejecuta los scripts dos veces** en el mismo job para verificar idempotencia.

### 8.1 El test de aislamiento

Este es el que de verdad prueba que el patrón funciona:

```sql
BEGIN;
-- dos escuelas con datos
INSERT INTO schools (id, name) VALUES
  ('11111111-1111-1111-1111-111111111111','Escuela A'),
  ('22222222-2222-2222-2222-222222222222','Escuela B');
INSERT INTO students (school_id, first_name, last_name) VALUES
  ('11111111-1111-1111-1111-111111111111','Ana','A'),
  ('22222222-2222-2222-2222-222222222222','Beto','B');

-- entrar como admin de la Escuela A
SET ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  "user_role":"admin","school_id":"11111111-1111-1111-1111-111111111111"}';

DO $$
DECLARE v_propios INT; v_ajenos INT; v_mod INT;
BEGIN
    SELECT count(*) INTO v_propios FROM students
     WHERE school_id='11111111-1111-1111-1111-111111111111';
    SELECT count(*) INTO v_ajenos  FROM students
     WHERE school_id='22222222-2222-2222-2222-222222222222';
    IF v_propios <> 1 THEN RAISE EXCEPTION 'No ve sus propios alumnos'; END IF;
    IF v_ajenos  <> 0 THEN RAISE EXCEPTION 'FUGA: ve % alumnos ajenos', v_ajenos; END IF;

    -- intento de escritura cruzada
    BEGIN
        UPDATE students SET first_name='HACK'
         WHERE school_id='22222222-2222-2222-2222-222222222222';
        GET DIAGNOSTICS v_mod = ROW_COUNT;
        IF v_mod > 0 THEN RAISE EXCEPTION 'FUGA: modificó % filas ajenas', v_mod; END IF;
    EXCEPTION WHEN insufficient_privilege THEN NULL;  -- rechazo esperado
    END;
    RAISE NOTICE 'Aislamiento OK';
END $$;

RESET ROLE;
ROLLBACK;
```

**Amplíalo para cubrir las tablas hija.** Esta parte es la que detectó las
trampas 5 y 6 cuando validé el manual con el dominio de patinaje:

```sql
DECLARE v_hijas INT; v_hijas_ajenas INT;
...
    SELECT count(*) INTO v_hijas FROM attendance_details;
    SELECT count(*) INTO v_hijas_ajenas FROM attendance_details ad
     WHERE EXISTS (SELECT 1 FROM attendance a WHERE a.id = ad.attendance_id
                    AND a.school_id = '22222222-2222-2222-2222-222222222222');

    IF v_hijas_ajenas > 0 THEN RAISE EXCEPTION 'FUGA en tabla hija'; END IF;
    -- ↓ esta línea es la que encuentra los dos errores silenciosos
    IF v_hijas = 0 THEN
        RAISE EXCEPTION 'Tabla hija INACCESIBLE: revisa si le falta policy, '
                        'o si al PADRE le falta una permisiva de rol';
    END IF;
```

Salida real de la primera ejecución, con `attendance` sin policy permisiva:

```
Tabla PADRE  -> 1 alumnos propios, 0 ajenos
Tabla HIJA   -> 0 visibles
ERROR: Tabla hija INACCESIBLE
```

Y tras añadir la permisiva de rol al padre:

```
Tabla PADRE  -> 1 alumnos propios, 0 ajenos
Tabla HIJA   -> 1 visibles, 0 de la otra escuela
Escritura cruzada -> 0 filas afectadas
>>> AISLAMIENTO OK <<<
```

**Resultado esperado en Yarvis con 10 tenants:** la Clínica 1 ve sus 500
pacientes, 3.000 historias y 5.000 citas, y **cero** de las demás. Sin JWT: cero
filas. `UPDATE` y `DELETE` cruzados rechazados con `permission denied`.

> Corre este test **antes de escribir el primer endpoint**, no al final. Detecta
> en segundos lo que de otro modo aparece como «la lista sale vacía y no entiendo
> por qué» tres semanas después.

---

## 9. Los dos servidores: réplica y failover

Tu arquitectura de dos servidores es la misma que la de Yarvis. Lo que sigue está
medido, no estimado.

### 9.1 Qué hace cada uno

| | Primario | Réplica |
|---|---|---|
| Rol | producción | hot standby de solo lectura |
| Contiene | stack Supabase completo | PostgreSQL en recovery + almacén de backups |
| También sirve como | — | ambiente de staging |

### 9.2 Montarlo

**En el primario:**

```bash
psql -c "ALTER SYSTEM SET wal_level='replica';"
psql -c "ALTER SYSTEM SET max_wal_senders=5;"
psql -c "ALTER SYSTEM SET max_replication_slots=5;"
psql -c "CREATE ROLE replicator WITH REPLICATION LOGIN PASSWORD '...';"
psql -c "SELECT pg_create_physical_replication_slot('replica_slot');"
# pg_hba.conf: acceso de replicación SOLO desde la IP de la réplica
echo "host replication replicator <IP_REPLICA>/32 scram-sha-256" >> pg_hba.conf
ufw allow from <IP_REPLICA> to any port 5432
```

**En la réplica:**

```bash
pg_basebackup -h <IP_PRIMARIO> -U replicator -D /var/lib/postgresql/data \
              -Fp -Xs -P -R -S replica_slot
# -R crea standby.signal y escribe primary_conninfo automáticamente
```

**Verificar:**

```sql
-- en el primario
SELECT application_name, state, sync_state,
       pg_size_pretty(pg_wal_lsn_diff(sent_lsn, replay_lsn)) AS lag,
       replay_lag
  FROM pg_stat_replication;

-- en la réplica
SELECT pg_is_in_recovery();   -- debe ser true
```

**Medido en Yarvis:** clon inicial de 160 MB en 7,0 s · estado `streaming` ·
lag de 0 bytes · **latencia real de escritura→lectura: 66 ms**.

### 9.3 Failover

**Recomendación: promoción asistida, no automática.** Se evaluó Patroni + etcd y
se descartó: necesita un tercer nodo testigo, cuesta más, y un falso positivo
—una partición de red momentánea— promueve la réplica y te deja con dos
primarios escribiendo (*split-brain*), que es peor que estar caído diez minutos.

El script de failover comprueba **tres señales** antes de promover (puerto, health
endpoint, ping) y produce un puntaje de riesgo. Si el riesgo es alto —parece que
el primario sigue vivo— exige confirmación explícita.

```bash
psql -c "SELECT pg_promote(wait => true, wait_seconds => 60);"
docker compose up -d
# actualizar el DNS de Cloudflare (TTL 60s) apuntando a la nueva IP
```

**Simulacro medido**, matando el primario en sucio (`pg_ctl -m immediate`, sin
checkpoint limpio, el peor caso realista):

| Métrica | Resultado |
|---|---|
| Promoción (`pg_promote`) | **0,44 s** |
| Pérdida de datos (RPO) | **cero** — incluida la última fila escrita antes de la caída |
| Policies tras la promoción | intactas |
| RTO de punta a punta | 10-20 min (diagnóstico + decisión + stack + DNS) |

PostgreSQL está listo en menos de un segundo. Los 10-20 minutos son el
procedimiento humano completo.

### 9.4 Backups

| Operación | Medido con 10 tenants |
|---|---|
| `pg_dump -Fc` | **1,4 s** → 3,5 MB desde 36 MB de base |
| Comprimir + cifrar AES-256 | 0,4 s → 2,9 MB |
| **Restauración completa** | **8,0 s**, íntegra, con las policies |
| Exportar los datos de un solo tenant | 0,02 s |

Política sugerida: diario cifrado, retención escalonada 7 diarios / 4 semanales /
12 mensuales / 7 anuales en almacenamiento externo, más 30-60 días con rotación
en la réplica. **Prueba de restauración automática mensual** — un backup que
nunca se restauró no es un backup, es una carpeta.

La exportación selectiva por `school_id` te resuelve dos cosas que un cliente va
a pedir: entregarle sus datos si se va, y restaurar una sola escuela sin tocar a
las demás.

---

## 10. Adaptación al dominio: escuelas de patinaje

### 10.1 Traducción de conceptos

| Yarvis (odontología) | Tu proyecto (patinaje) |
|---|---|
| `branches` (clínica) | `schools` (escuela) |
| `patients` | `students` (alumnos) |
| `doctors` | `coaches` (entrenadores) |
| `dental_units` (sillas) | `rinks` / `tracks` (pistas) |
| `appointments` | `class_sessions` (sesiones de clase) |
| `clinical_records` | `student_progress` / `evaluations` |
| `treatments` (catálogo CUPS) | `catalog_programs` (programas y niveles) |
| `catalog_specialties` | `catalog_disciplines` (velocidad, artístico, hockey) |
| anti-overbooking por silla | anti-solapamiento por pista |
| `invoices` + RIPS | `invoices` + recibos de mensualidad |

### 10.2 Lo que tu dominio tiene y el de salud no

Cuatro diferencias que cambian el modelo:

**a) Menores de edad y acudientes.** Casi todos tus alumnos son menores. Necesitas
`guardians` con relación N:M a `students` (un padre con dos hijos, un niño con
padre y madre), y el consentimiento lo firma el acudiente, no el alumno.

**b) Mensualidades recurrentes, no facturación por evento.** En odontología se
factura cada procedimiento. En una escuela hay `subscriptions` con ciclo mensual,
generación automática de cobros, y **gestión de morosidad**. Es un módulo entero
que Yarvis no tiene.

```sql
CREATE TABLE subscriptions (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id     UUID NOT NULL REFERENCES schools(id),
    student_id    UUID NOT NULL REFERENCES students(id),
    program_id    UUID NOT NULL REFERENCES catalog_programs(id),
    monthly_fee   NUMERIC(12,2) NOT NULL,
    billing_day   SMALLINT NOT NULL CHECK (billing_day BETWEEN 1 AND 28),
    status        TEXT NOT NULL DEFAULT 'active',
    start_date    DATE NOT NULL,
    end_date      DATE,
    created_at    TIMESTAMPTZ DEFAULT NOW()
);
```

> `billing_day` limitado a 28: si permites el 30 o el 31, febrero rompe la
> generación automática de cobros.

**c) Asistencia masiva, no citas individuales.** Un entrenador marca 30 alumnos
en dos minutos. El modelo debe soportar inserción por lote y la interfaz una
lista con casillas, no un formulario por alumno.

**d) Competencias y progresión.** Inscripciones a torneos, resultados, cambios de
categoría. Es lo más parecido a la historia clínica en cuanto a
inmutabilidad: **un resultado de competencia no se edita**, se corrige con un
registro nuevo que referencia al anterior.

### 10.3 Lo que puedes copiar tal cual

- Toda la sección 3 (claims del JWT) cambiando `branch_id` → `school_id`
- Toda la sección 4 (RLS), incluidas las dos capas y la herencia de tablas hija
- La sección 5 (backend) sin cambios
- El anti-solapamiento de la sección 6.2, cambiando silla por pista
- Todo el orden de despliegue y el CI
- Toda la arquitectura de dos servidores

### 10.4 Lo que NO debes copiar

- La retención de 15 años de la historia clínica: no aplica
- RIPS, CUPS, CIE-10, facturación DIAN con CUFE: son de salud
- El módulo de esterilización y bioseguridad
- El nivel de paranoia con los datos sensibles **puede bajar un poco**, pero
  ojo: **manejas datos de menores de edad**, que en Colombia tienen protección
  reforzada bajo la Ley 1581. El consentimiento del acudiente es obligatorio y
  las fotos de menores en redes sociales requieren autorización expresa y
  separada. No es tan estricto como una historia clínica, pero no es un CRM
  cualquiera.

---

## 11. Checklist antes de tu primer cliente

```
BASE DE DATOS
[ ] Tablas clasificadas en Grupo A / B / C antes de escribir SQL
[ ] school_id NOT NULL en todas las del Grupo A
[ ] Índice en school_id de cada tabla del Grupo A
[ ] UNIQUE cambiados a (school_id, campo) donde corresponda
[ ] same_school() usa = y NO está marcada LEAKPROOF
[ ] RLS + FORCE en el 100% de las tablas
[ ] CERO tablas con RLS y sin policy (consulta de §4.6 devuelve 0)
[ ] CERO tablas con SOLO policy RESTRICTIVE (consulta de §4.3 devuelve 0)
[ ] Ningún grant al rol anon
[ ] Sin subconsultas en predicados de índice
[ ] Seed con ON CONFLICT DO NOTHING en todos los INSERT
[ ] Ningún catálogo vacío tras el despliegue

BACKEND
[ ] set_config(..., true)  ← el tercer parámetro en true, verificado
[ ] Ningún esquema de entrada acepta school_id
[ ] JWT verificado con firma, issuer, audience y require exp
[ ] Test: usuario de la Escuela A no ve ni modifica datos de la B

INFRAESTRUCTURA
[ ] Réplica en streaming con lag medido
[ ] Simulacro de failover ejecutado y cronometrado
[ ] Restauración de backup probada de verdad
[ ] Prueba de carga midiendo RAM (el límite es memoria, no disco)

CI
[ ] Job que corre la secuencia SQL completa y falla ante cualquier desviación
[ ] Test de aislamiento en el pipeline
[ ] Los scripts se ejecutan dos veces (idempotencia)
```

---

## Anexo A — Prompt para Claude

Copia esto en tu otro proyecto junto con este documento:

```
Adjunto el manual "Un solo Supabase para 10 tenants". Es un patrón validado
midiendo contra PostgreSQL real en un proyecto anterior.

Mi proyecto: SaaS de gestión para escuelas de patinaje. Hasta 10 escuelas en un
solo Supabase self-hosted, dos servidores (primario + réplica).

Mi dominio incluye: [describe tus entidades — alumnos, acudientes, entrenadores,
pistas, clases, asistencia, mensualidades, competencias, evaluaciones…]

Necesito que:

1. Clasifiques mis tablas en los tres grupos de la sección 2.1 (tenant,
   catálogo global, tabla hija) y me expliques cada decisión dudosa.
2. Generes el schema.sql completo respetando el orden de dependencias de FK
   (§6.1) y con los índices en school_id.
3. Generes los scripts de multi-tenant (claims, RLS, policies de rol, tablas
   hija) adaptando el código del manual a mis nombres.
4. Identifiques dónde aplica el patrón anti-solapamiento (§6.2) — al menos en
   las pistas.
5. Revises qué UNIQUE deben pasar a (school_id, campo) y cuáles se quedan
   globales, justificando cada uno.
6. Generes el test de aislamiento (§8.1) con mis tablas.
7. Generes las aserciones del CI (§8) con el número de tablas de mi schema.

Aplica TODAS las trampas marcadas con ⚠ del manual. Especialmente:
- same_school() con = , nunca IS NOT DISTINCT FROM
- set_config con el tercer parámetro en true
- ninguna tabla con RLS y cero policies
- ninguna tabla con SOLO la policy restrictiva de tenant: cada una necesita
  ademas al menos una permisiva de rol, o devuelve 0 filas
- ninguna subconsulta en predicado de índice
- ON CONFLICT DO NOTHING en todo el seed

Si algo de mi dominio no encaja con el patrón, dímelo en vez de forzarlo.
```

---

## Anexo B — Resumen de las trampas

| # | Trampa | Síntoma | Sección |
|---|---|---|---|
| 1 | `tenant_id` en catálogos o tablas hija | filas duplicadas ×10, o desincronización | 2.1 |
| 2 | `UNIQUE` global en vez de por tenant | el segundo cliente no puede registrar nada | 2.3 |
| 3 | Hook sin activar en el compose | el JWT no trae `school_id`, todo devuelve 0 filas | 3.3 |
| 4 | `IS NOT DISTINCT FROM` en la función de tenant | Seq Scan; **237x más lento** y empeora con cada cliente | 4.2 |
| 5 | Tabla con solo policy `RESTRICTIVE` | 0 filas; **deja ciego todo el subárbol de hijas** | 4.3 |
| 6 | Tablas hija con RLS y sin policy | 0 filas **sin ningún error** | 4.6 |
| 7 | `SET` en vez de `SET LOCAL` | **fuga entre tenants** por reutilización del pool | 5 |
| 8 | FK a una tabla declarada después | tablas que no se crean, en cascada | 6.1 |
| 9 | Subconsulta en predicado de índice | el constraint no existe; solapamientos sin control | 6.2 |
| 10 | Seed sin `ON CONFLICT` | el segundo despliegue falla | 6.3 |
| 11 | Catálogos vacíos por desalineación | desplegables en blanco, sin mensaje | 6.3 |

**Las trampas 4, 5, 6 y 7 no se manifiestan en desarrollo.** Con un solo tenant,
poca concurrencia y datos de prueba, todo parece funcionar. Aparecen en
producción. Hay que evitarlas por disciplina, no por prueba y error.

Las trampas 5 y 6 las descubrí montando el dominio de patinaje para validar este
manual: el test de aislamiento de §8.1 las detectó en la primera ejecución. Ese
test vale su peso en oro — ponlo en el CI antes de escribir el primer endpoint.
