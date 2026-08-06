# SPEC-036 — Sprint 9: Sistema de Facturación Mensual

**Sprint:** 09  
**Agente:** AG-CLAUDE-BACKEND + AG-CLAUDE-FRONTEND + AG-CLAUDE-DB  
**Estado:** done  
**Fecha:** 2026-08-05  

---

## 1. Propósito

Implementar el sistema completo de facturación mensual: generación automática de facturas para atletas el 1° de cada mes, envío por email en HTML, recordatorios de pago y marcado como pagadas. Cierra el ciclo financiero que antes solo tenía transacciones manuales.

---

## 2. Problema que resuelve

Antes de este sprint:
- Las cuotas mensuales se registraban manualmente como transacciones
- No había numeración legal de facturas
- No había envío automático de facturas por email
- Los recordatorios de pago eran push notifications sin contexto (AUTO-08)
- El frontend Finance.tsx tenía datos hardcodeados en secciones de presupuesto

---

## 3. Solución implementada

### 3.1 Base de datos (migración `20260805300000_billing_invoices.sql`)

**Cambio en `financial_transactions`:**
```sql
ALTER TABLE financial_transactions ADD COLUMN payer_identification TEXT;
```
(campo que estaba en el frontend pero faltaba en BD)

**Sequence para numeración legal:**
```sql
CREATE SEQUENCE invoice_number_seq START 1;
```

**Tabla `invoices`:**
| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID PK | |
| `invoice_number` | TEXT UNIQUE | FAC-YYYY-NNNNN (auto-generado) |
| `athlete_id` | UUID FK RESTRICT | No borrar atleta con facturas |
| `period_year` | SMALLINT | |
| `period_month` | SMALLINT | 1-12 |
| `amount` | NUMERIC(10,2) | |
| `status` | ENUM | `draft`, `sent`, `paid`, `cancelled` |
| `concept` | TEXT | Descripción de la factura |
| `pdf_url` | TEXT | URL del PDF (futuro) |
| `sent_at` | TIMESTAMPTZ | Cuando se envió el email |
| `due_date` | DATE | Fecha límite de pago |
| `paid_at` | TIMESTAMPTZ | |
| `transaction_id` | UUID FK SET NULL | Transacción asociada |
| `created_by` | UUID | Admin que generó (o NULL si auto) |

Restricción de duplicados: `UNIQUE(athlete_id, period_year, period_month)`

**RLS policies (5):**
- `admin/finance/leader` — ALL sin restricción
- `coach` — SELECT via `coach_athletes` junction
- `athlete` — SELECT solo sus propias facturas
- `parent` — SELECT via `parent_athletes.parent_user_id`

**RPCs:**
- `get_invoice_summary_by_month(p_year, p_month)` → `{total_invoices, paid, pending, cancelled, total_amount, paid_amount, pending_amount, collection_rate}`
- `mark_invoice_paid(p_invoice_id, p_transaction_id)` → `{success, invoice_number}` (atómico, con role guard)

### 3.2 Backend — Celery Tasks

**AUTO-36: `generate_monthly_fees`** (`billing_tasks.py`)
- Schedule: 1° de mes a las 07:00
- Por cada atleta `active`: crea `financial_transaction` (pending) + `invoice` (sent)
- Skips el período si ya existe (idempotente)
- Envía `invoice_email.html` al email del atleta
- Loguea en `agent_activity_log`

**AUTO-37: `send_invoice_reminder`** (`billing_tasks.py`)
- Schedule: diario a las 09:00
- Pre-vencimiento: D-5 antes de `due_date` → envía `payment_reminder_email.html` (estilo amber)
- Post-vencimiento: días 1, 8, 15, 22 (`days_overdue % 7 == 1`) → envía email con días vencidos en rojo

**Mejora a AUTO-08** (`finance_tasks.py`)
- `overdue_payment_alerts` ahora también envía `payment_reminder_email.html` por Resend
- Antes solo enviaba push notification in-app

### 3.3 Email templates (Jinja2)

| Template | Uso | Estilo |
|----------|-----|--------|
| `base_email.html` | Wrapper responsivo | Dark-blue header, footer |
| `invoice_email.html` | Factura mensual | Tabla con número, período, monto, vencimiento |
| `payment_reminder_email.html` | Pre-due (amber) o overdue (rojo) | Banner de urgencia, días vencidos |
| `payment_receipt_email.html` | Confirmación de pago | Banner verde, datos del pago |

**`helpers.py` mejorado:**
- Retry de 3 intentos con 2s de delay en 429/5xx de Resend
- `render_email_template(name, context)` con Jinja2 `Environment`
- `send_email(to, subject, html, attachments=None)` con parámetro de adjuntos

### 3.4 Frontend — Tab Facturación en Finance.tsx

**Añadido:**
- Tab "Facturación" en el TabsList
- Selector de mes/año
- 4 KPI cards: Total facturas, Pagadas (+ monto), Pendientes (+ monto), Tasa de recaudación %
- Tabla de facturas: Número, Atleta, Concepto, Importe, Estado (Badge), Vence, Acción "Marcar pagada"
- Integración con `useInvoices`, `useInvoiceSummary`, `useMarkInvoicePaid`

**`src/hooks/useInvoices.ts` (nuevo):**
- `useInvoices(year, month)` — query con JOIN a `athletes`
- `useInvoiceSummary(year, month)` — llama al RPC `get_invoice_summary_by_month`
- `useMarkInvoicePaid()` — mutation con invalidación de queries e `invoice-summary`

---

## 4. Archivos creados

| Archivo | Descripción |
|---------|-------------|
| `supabase/migrations/20260805300000_billing_invoices.sql` | tabla invoices, sequence, RPCs, RLS |
| `backend/tasks/billing_tasks.py` | AUTO-36 + AUTO-37 |
| `backend/templates/base_email.html` | Template base Jinja2 |
| `backend/templates/invoice_email.html` | Email de factura |
| `backend/templates/payment_reminder_email.html` | Email de recordatorio |
| `backend/templates/payment_receipt_email.html` | Email de recibo de pago |
| `src/hooks/useInvoices.ts` | Hooks React para facturas |

## 5. Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `backend/tasks/helpers.py` | Retry Resend, Jinja2, `attachments` param |
| `backend/tasks/finance_tasks.py` | AUTO-08 ahora envía email además de push |
| `backend/tasks/schedules.py` | AUTO-36 y AUTO-37 añadidos |
| `backend/tasks/celery_app.py` | `billing_tasks` en include list |
| `backend/config.py` | `resend_api_key` y `resend_from_email` settings |
| `src/pages/Finance.tsx` | Tab Facturación añadido |

---

## 6. Pendiente (futuro)

- Generación de PDF de factura con jsPDF y adjunto al email
- Firma electrónica de facturas (integración con proveedor legal)
- Exportación de facturas a Excel/CSV
- Facturación para cuotas de inscripción (además de mensualidades)
