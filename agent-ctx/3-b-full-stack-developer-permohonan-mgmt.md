# Task 3-b — Permohonan Management Module

**Agent:** full-stack-developer (permohonan mgmt)
**Date:** 2025-07-05
**Status:** ✅ Complete

## Files Created

| File | Size | Purpose |
|---|---|---|
| `src/components/app/petugas/PermohonanList.tsx` | 15.4 KB | List page with filters, table/mobile cards, pagination |
| `src/components/app/petugas/PermohonanForm.tsx` | 19.5 KB | 3-section create-only form with sticky submit bar |
| `src/components/app/shared/PermohonanDetail.tsx` | 61.7 KB | 5-tab rich detail page with full workflow actions |

## Infrastructure Consumed (NOT reinvented)

- `@/lib/api` — `listPermohonan`, `getPermohonan`, `createPermohonan`, `updatePermohonan`, `deletePermohonan`, `changeStatus`, `uploadDokumen`, `deleteDokumen`, `getQr`, `jenisSurat`
- `@/lib/constants` — `STATUS_DEFINITIONS`, `STATUS_BY_KODE`, `JENIS_DOKUMEN`, `buildStages`, `nextStatus`
- `@/lib/types` — `PermohonanListItem`
- `@/store/app-store` — `useAppStore` (view/setView/selectPermohonan/can/user)
- `@/components/app/StatusBadge` — `StatusBadge`, `PriorityBadge`
- `@/components/app/Timeline` — `Timeline`, `ProgressBar`
- `@/components/app/StatCard` — `SectionHeader`
- shadcn/ui: Card, Button, Input, Label, Textarea, Select, Table, Dialog, Tabs, Badge, Separator, Skeleton, ScrollArea, AlertDialog

## Key Implementation Notes

### PermohonanList
- Debounced search (400ms) with active filter chips + reset button
- Responsive: Table (md+) → Card list (mobile)
- `selectPermohonan(id)` from row click OR Detail button
- Empty state with optional "Daftar Baru" CTA gated by `can("create_permohonan")`

### PermohonanForm (CREATE only)
- 3 sections with custom `SectionTitle` headers
- Loads jenis surat list from `api.jenisSurat()`, shows butuhPengukuran/butuhTtdCamat as info badges
- Validation: jenisSuratId, pemohonNik (min 8), pemohonNama, keperluan required → toast.error
- Input masking: NIK numeric ≤16, RT/RW ≤3, HP ≤15
- Sticky submit bar with gold gradient button → `selectPermohonan(created.id)`

### PermohonanDetail (most complex)
- **Header card**: nomorRegister (mono gold badge), StatusBadge lg, PriorityBadge, ProgressBar (right column on lg), red alert for DITOLAK, orange alert for REVISI
- **Linimasa tab**: Timeline + "Aksi Proses" card (sticky on lg) with conditional actions:
  - `Lanjut ke Tahap Berikutnya` + catatan (PETUGAS/ADMIN when canAdvance)
  - `Setujui & Tanda Tangani` (ATASAN/ADMIN when TTD_LURAH)
  - `Sahkan & Selesaikan` (ATASAN/ADMIN when TTD_CAMAT)
  - `Minta Perbaikan (Revisi)` → Dialog with catatan (PETUGAS/ADMIN)
  - `Tolak Permohonan` → Dialog with alasanDitolak (PETUGAS/ADMIN)
  - `Kembalikan ke Proses` when REVISI → changeStatus(CEK_ADMIN)
  - `Hapus Permohonan` → AlertDialog (ADMIN only)
- **Data tab**: 3 cards with DLRow definition list + Edit Dialog (full edit form → `api.updatePermohonan`)
- **Dokumen tab**: upload area (10MB limit) + list with download/delete
- **QR Code tab**: lazy-loads `api.getQr(id)` on tab open, download PNG + copy URL, QR invalidated after status change
- **Riwayat tab**: shadcn Table with waktu/status/petugas/catatan
- All mutations re-fetch detail + toast success/error

## Lint Status
- ✅ 0 lint errors in the 3 new files
- ⚠️ 3 pre-existing lint errors in `AppShell.tsx` and `NotificationsBell.tsx` (NOT this task's scope)

## Dev Log Status
- Latest entries show successful compilation (✓ Compiled in 300ms)
- Earlier "module not found" errors were from before files existed

## What Other Agents Still Need
The page.tsx imports for these are still unmet (will be supplied by other agents):
- `src/components/app/admin/AdminDashboard.tsx`
- `src/components/app/petugas/PetugasDashboard.tsx` (NOTE: another agent already created this — seen in folder)
- `src/components/app/atasan/AtasanDashboard.tsx`
- `src/components/app/shared/Reports.tsx` (NOTE: another agent already created this — seen in folder)
- `src/components/app/admin/AuditLogView.tsx`
- `src/components/app/admin/UserManagement.tsx`
- `src/components/app/admin/JenisSuratManagement.tsx`
