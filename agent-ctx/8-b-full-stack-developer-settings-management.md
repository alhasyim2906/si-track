# Task 8-b: Settings Management Page

## Agent: full-stack-developer

## Summary
Built the complete Settings Management page for SI-TRACK TANAH admin panel, including backend PUT API, frontend component with 4 sections, and all wiring (types, store, routing, navigation).

## Changes Made

### 1. Backend: `/src/app/api/settings/route.ts`
- Added `PUT` handler with ADMIN-only access control
- Validates `{ settings: Record<string, string> }` body
- Upserts each key-value pair via `db.settings.upsert()`
- Logs to audit trail via `writeAudit()` with `modul="SETTINGS"`
- Returns updated settings map

### 2. API Client: `/src/lib/api.ts`
- Added `updateSettings(settings)` method → PUT `/api/settings`

### 3. Frontend Component: `/src/components/app/admin/SettingsManagement.tsx`
New "use client" component with 4 sections:
- **Informasi Kelurahan**: nama, alamat, telepon, email, kode_pos
- **Pengaturan Sistem**: maintenance_mode, auto_notify, require_pengukuran, require_ttd_camat (switches), max_upload_size_mb (number)
- **Format Nomor Register**: register_prefix, register_digit_count with live preview
- **Tampilan**: app_name, app_subtitle

Features: loading skeleton, per-section save buttons, global "Simpan Semua", toast feedback, permission guard

### 4. Types: `/src/lib/types.ts`
- Added `"pengaturan"` to AppView union

### 5. Store: `/src/store/app-store.ts`
- Added `manage_settings` case → ADMIN only

### 6. Routing: `/src/app/page.tsx`
- Added `"pengaturan"` case in renderView() → SettingsManagement for ADMIN

### 7. Navigation: `/src/components/app/AppShell.tsx`
- Added Settings icon import
- Added "Pengaturan" nav item (ADMIN only)
- Added to "Manajemen" section
- Added to VIEW_LABELS

## Lint Result
0 errors, 0 warnings

## Dev Server
Compiles clean
