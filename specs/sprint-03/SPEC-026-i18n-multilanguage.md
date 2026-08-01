# SPEC-026 — Soporte Multiidioma (i18n)
**Status:** `draft`  
**Agente:** AG-CLAUDE-FRONTEND  
**Sprint:** 03  
**Prioridad:** ALTA  

---

## Propósito
Permitir que toda la interfaz de la aplicación se muestre en español (por defecto), inglés, francés, italiano, alemán y portugués, habilitando el uso de la plataforma por clubs internacionales o con atletas de distintos países.

---

## Idiomas Soportados

| Código | Idioma      | Región de referencia |
|--------|-------------|----------------------|
| `es`   | Español     | Colombia (default)   |
| `en`   | Inglés      | Internacional        |
| `fr`   | Francés     | Francia              |
| `it`   | Italiano    | Italia               |
| `de`   | Alemán      | Alemania             |
| `pt`   | Portugués   | Brasil               |

---

## Acceptance Criteria

### Infraestructura
- [ ] Librería `react-i18next` + `i18next` instalada y configurada en `src/i18n/index.ts`
- [ ] Archivos JSON de traducción en `src/i18n/locales/{es,en,fr,it,de,pt}/common.json`
- [ ] Namespace `common` contiene todas las cadenas de UI (labels, botones, mensajes de error, toasts)
- [ ] Namespaces adicionales por dominio: `athletes`, `competitions`, `finance`, `documents`, `equipment`, `training`
- [ ] Fallback automático a `es` si una clave no existe en el idioma seleccionado
- [ ] Detección automática del idioma del navegador en el primer acceso
- [ ] Idioma preferido persistido en `localStorage` bajo la clave `skate-lang`
- [ ] Idioma preferido sincronizado con `profiles.language_preference` (columna nueva en DB)

### Selector de idioma
- [ ] Componente `LanguageSwitcher` visible en la barra superior del `DashboardLayout`
- [ ] Muestra la bandera + código del idioma activo (ej. 🇪🇸 ES)
- [ ] Dropdown con las 6 opciones; cambio instantáneo sin recargar página
- [ ] También disponible en la pantalla de Login (antes de autenticarse)

### Cobertura de traducción
- [ ] Todos los textos visibles en `DashboardLayout` (sidebar, títulos de sección) traducidos
- [ ] Páginas principales traducidas: Dashboard, Athletes, Training, Competitions, Finance, Documents, Equipment, Evaluations, Messages
- [ ] Formularios: labels, placeholders, textos de validación Zod traducidos
- [ ] Mensajes de Toast (éxito / error) traducidos
- [ ] Textos de estado vacío ("No hay atletas registrados", etc.) traducidos
- [ ] Fechas formateadas según locale activo usando `Intl.DateTimeFormat`
- [ ] Monedas y números formateados según locale usando `Intl.NumberFormat`

### Documentos PDF generados
- [ ] Cartas de permiso (`PermissionLetterGenerator`) generadas en el idioma activo
- [ ] Carnets de deportista (`AthleteCardGenerator`) — campos de UI en idioma activo (el contenido de datos sigue siendo el idioma del club)
- [ ] Planilla Excel (`CompetitionExcelExport`) — cabeceras de columnas en idioma activo

### Agentes IA
- [ ] Los agentes RAG y Skating responden en el idioma en que el usuario escribe (comportamiento actual — no requiere cambio)
- [ ] Los mensajes de sistema de los widgets (placeholder, sugerencias de preguntas) traducidos

---

## Cambios de Base de Datos

### Migración nueva: `20260803000000_profiles_language_preference.sql`
```sql
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS language_preference text NOT NULL DEFAULT 'es'
    CHECK (language_preference IN ('es', 'en', 'fr', 'it', 'de', 'pt'));
```
- No requiere RLS adicional — `profiles` ya tiene policies por `auth.uid()`

---

## Cambios de Frontend

### Archivos nuevos
```
src/
├── i18n/
│   ├── index.ts                        # Configuración i18next
│   └── locales/
│       ├── es/
│       │   ├── common.json
│       │   ├── athletes.json
│       │   ├── competitions.json
│       │   ├── finance.json
│       │   ├── documents.json
│       │   ├── equipment.json
│       │   └── training.json
│       ├── en/   (misma estructura)
│       ├── fr/   (misma estructura)
│       ├── it/   (misma estructura)
│       ├── de/   (misma estructura)
│       └── pt/   (misma estructura)
└── components/
    └── ui/
        └── LanguageSwitcher.tsx        # Dropdown selector de idioma
```

### Archivos modificados
- `src/main.tsx` — importar `src/i18n/index.ts` antes de renderizar
- `src/components/layout/DashboardLayout.tsx` — añadir `<LanguageSwitcher />` en el header
- `src/pages/Login.tsx` — añadir `<LanguageSwitcher />` en la esquina superior derecha
- Todos los componentes de página: sustituir strings literales por `t('clave')`
- `src/hooks/useProfile.ts` (o equivalente) — sincronizar `language_preference` con Supabase al cambiar

---

## Notas de Implementación

### Librería recomendada
```bash
npm install react-i18next i18next i18next-browser-languagedetector
```
- `i18next-browser-languagedetector` detecta el idioma del navegador en el primer acceso
- No se necesita `i18next-http-backend` — los archivos JSON se importan estáticamente para no añadir peticiones de red

### Configuración base (`src/i18n/index.ts`)
```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Importar todos los namespaces de todos los idiomas
import esCommon from './locales/es/common.json';
// ... resto de imports

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { es: { common: esCommon }, /* ... */ },
    fallbackLng: 'es',
    defaultNS: 'common',
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'skate-lang',
      caches: ['localStorage'],
    },
    interpolation: { escapeValue: false },
  });

export default i18n;
```

### Convención de claves
Usar claves descriptivas jerárquicas, no textos en español:
```json
{
  "nav": {
    "athletes": "Deportistas",
    "training": "Entrenamiento"
  },
  "actions": {
    "save": "Guardar",
    "cancel": "Cancelar",
    "delete": "Eliminar"
  },
  "status": {
    "loading": "Cargando...",
    "empty": "Sin registros"
  }
}
```

### Formato de fechas y números
```typescript
// Usar locale activo de i18n
const { i18n } = useTranslation();
const dateStr = new Intl.DateTimeFormat(i18n.language, { dateStyle: 'long' }).format(date);
const moneyStr = new Intl.NumberFormat(i18n.language, { style: 'currency', currency: 'COP' }).format(amount);
```

### Estrategia de traducción inicial
1. Crear todos los archivos `es/*.json` con las cadenas reales del español actual
2. Crear los archivos en inglés (`en/*.json`) con traducciones completas
3. Para los demás idiomas (fr, it, de, pt): traducción con IA o servicio externo — los archivos se crean con cadenas en inglés como placeholder hasta revisión por hablante nativo
4. Marcar claves no revisadas con prefijo `[DRAFT]` en el valor para identificarlas

### Agentes IA — sin cambio de backend
Los LLMs (Claude, GPT-4) detectan y responden en el idioma del mensaje del usuario de forma natural. No se requiere enviar el idioma al backend.

### Textos en PDFs
Los textos del PDF en `pdf-generator.ts` actualmente están hardcodeados en español. Deben recibir un objeto de textos traducidos:
```typescript
generatePermissionLetterPDF(data: PermissionLetterData, texts: PermissionLetterTexts)
```
donde `PermissionLetterTexts` contiene los strings de estructura del documento (no los datos del atleta).

---

## UI / Comportamiento Esperado

```
┌─────────────────────────────────────────────┐
│  🏅 SpeedSkateTrack          [🇬🇧 EN ▾]  👤  │
├─────────┬───────────────────────────────────┤
│ Sidebar │                                   │
│         │   ┌──────────────────┐            │
│ Athletes│   │ 🇪🇸 Español       │ ← activo   │
│ Training│   │ 🇬🇧 English       │            │
│ ...     │   │ 🇫🇷 Français      │            │
│         │   │ 🇮🇹 Italiano      │            │
│         │   │ 🇩🇪 Deutsch       │            │
│         │   │ 🇧🇷 Português     │            │
│         │   └──────────────────┘            │
└─────────┴───────────────────────────────────┘
```

Cambio de idioma es instantáneo — toda la UI se re-renderiza sin navegar ni recargar.

---

## Archivos a Crear/Modificar

**Nuevos:**
- `src/i18n/index.ts`
- `src/i18n/locales/{es,en,fr,it,de,pt}/{common,athletes,competitions,finance,documents,equipment,training}.json` (42 archivos)
- `src/components/ui/LanguageSwitcher.tsx`
- `supabase/migrations/20260803000000_profiles_language_preference.sql`

**Modificados:**
- `src/main.tsx`
- `src/components/layout/DashboardLayout.tsx`
- `src/pages/Login.tsx`
- `src/lib/pdf-generator.ts` (parámetro `texts` para contenido traducible)
- `src/lib/excel-generator.ts` (cabeceras de columnas)
- Todos los componentes de página (uso del hook `useTranslation`)

---

## Dependencias
- Ningún otro spec bloquea la implementación
- Debe completarse antes de cualquier entrega internacional del producto
