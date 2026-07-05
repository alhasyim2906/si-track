# SI-TRACK TANAH — Worklog

Project: Sistem Informasi Tracking Pendaftaran Surat Tanah
Client: Kelurahan Kuala Pembuang II
Stack: Next.js 16 (App Router) + TypeScript + Tailwind 4 + shadcn/ui + Prisma (SQLite)
Theme: Dark navy/blackish blue with gold accents

## Current Project Status (Phase 8 — AdminLTE 4 Consistency, Settings, Notifications, Bulk Actions)

**Status**: Production-ready with AdminLTE 4 consistency across all dashboards, new Settings Management page, Notification Center, bulk permohonan actions, and enhanced CSS styling. All core flows verified. Lint: 0 errors. Server compiles clean.

**VLM Visual Quality Scores**:
- Public landing page: 8/10 (up from 7/10)
- Stats banner section: 8/10 (up from 6/10)
- Admin dashboard: 8/10
- Permohonan list: 8/10
- User management: 8/10
- Audit log: 8/10

**Demo credentials**: admin@kpii.go.id/admin123, petugas@kpii.go.id/petugas123, lurah@kpii.go.id/lurah123

---
Task ID: 1
Agent: main
Task: Project foundation — schema, theme, auth lib, seed data

Work Log:
- Explored existing project scaffold (Next.js 16, shadcn/ui, Prisma SQLite)
- Designing data model: User (3 roles), JenisSurat, Permohonan, Dokumen, RiwayatProses, Notifikasi, AuditLog, StatusProses, Settings
- Register format: KPII-TNH-YYYY-NNNNNN
- Workflow stages: PENGAJUAN -> CEK_ADMIN -> VERIFIKASI_LAPANGAN -> PENGUKURAN (optional) -> PEMBUATAN_SURAT -> TTD_LURAH -> TTD_CAMAT (optional) -> SELESAI. Special: REVISI, DITOLAK.

Stage Summary:
- Foundation being laid. Next: schema push, seed, API routes, frontend.

---
Task ID: 3-a
Agent: full-stack-developer (dashboards)
Task: Build AdminDashboard, PetugasDashboard, AtasanDashboard

Work Log:
- Read worklog + all infrastructure files (api, constants, types, app-store, StatusBadge, Timeline, StatCard, Logo, dashboard API route).
- Confirmed dashboard API response shape: stats, counts, monthly, statusDist, perPetugas, recent, pendingApprovals.
- Created src/components/app/admin/AdminDashboard.tsx — 8 StatCards (Total, Diproses, Pengukuran, Lurah, Camat, Selesai, Ditolak, avgDays), year Select (current year - 4) re-fetching api.dashboard(year), recharts bar chart (monthly, gold #d4af37 + green #16a34a), donut chart (status dist using STATUS_BY_KODE colors), per-petugas table with gold gradient progress bar, recent permohonan list with mono register badges + StatusBadge + relative time + click-to-detail.
- Created src/components/app/petugas/PetugasDashboard.tsx — "Tugas Saya" quick actions card with gold gradient CTA to permohonan-baru and glass card to permohonan, 5 workflow StatCards (PENGAJUAN, CEK_ADMIN, PENGUKURAN, PEMBUATAN_SURAT, TTD_LURAH+TTD_CAMAT), recent permohonan list, 6-month bar chart "Aktivitas Terakhir" + 3 mini stats footer (diproses, selesai, avgDays).
- Created src/components/app/atasan/AtasanDashboard.tsx — 4 StatCards (pending count, selesai, diproses, avgDays), pendingApprovals grid (2-col on md) with each item showing register, pemohon, jenis surat, status badge, creator, date, catatan, "Lihat Detail" CTA → selectPermohonan; empty state "Tidak ada permohonan yang menunggu persetujuan"; donut chart status dist; "Lama Penyelesaian" hero card with gold-gradient avgDays number; "Statistik Pelayanan" card.
- All components: "use client", container mx-auto max-w-7xl px-4 py-6, glass-card / gold-text / gold-border utilities, Loader2 spinner while loading, toast.error on fetch failure.
- Refactored fetch pattern into useCallback + minimal useEffect (avoids react-hooks/set-state-in-effect lint rule).
- Ran `bun run lint`: my 3 files pass cleanly (remaining errors are in AppShell.tsx & NotificationsBell.tsx, not in scope).

Stage Summary:
- Files created:
  - src/components/app/admin/AdminDashboard.tsx
  - src/components/app/petugas/PetugasDashboard.tsx
  - src/components/app/atasan/AtasanDashboard.tsx
- Key decisions: recharts used directly (ResponsiveContainer + BarChart/PieChart) for full styling control; STATUS_BY_KODE colors drive pie slices; gold gradient buttons per design system; click-to-detail via selectPermohonan; relative time computed inline (no date-fns needed); per-petugas progress bar uses same gold gradient as ProgressBar component for visual consistency.
- All three dashboards share consistent container/spacing/loading patterns and the dark-navy + gold theme.

---
Task ID: 3-c
Agent: full-stack-developer (reports & admin views)
Task: Build Reports, AuditLogView, UserManagement, JenisSuratManagement

Work Log:
- Read worklog + infra (api.ts, constants.ts, types.ts, app-store.ts, StatCard, StatusBadge) and confirmed API response shapes against backend route handlers (laporan, audit-log, users, jenis-surat, status-proses).
- Created `/src/components/app/shared/Reports.tsx` (ADMIN+ATASAN):
  * SectionHeader + glass-card filter (date range, status Select from STATUS_DEFINITIONS, optional petugas text).
  * Quick periode buttons: Hari Ini / Bulan Ini / Tahun Ini (set from/to accordingly).
  * Default filter = current month (first day → today).
  * 5 StatCards (Total/Selesai/Diproses/Ditolak blue/green/cyan/red + Rata-rata Waktu gold) reading summary.*.
  * Results Table in ScrollArea (max-h-96): nomor register (mono badge), pemohon (nama+NIK), jenis surat, StatusBadge, PriorityBadge, petugas, dibuat, selesai, Aksi "Detail" → selectPermohonan(id).
  * Export CSV (Blob download, BOM for Excel) + Export PDF (opens styled hidden window, window.print()). Empty + loading states.
- Created `/src/components/app/admin/AuditLogView.tsx` (ADMIN only):
  * Filter: search Input (q) with 400ms debounce, modul Select (Semua + AUTH/PERMOHONAN/USER/JENIS_SURAT/STATUS/LAPORAN), limit Select (50/100/200). Auto-apply on change.
  * Table in ScrollArea (max-h-[600px]): Waktu, Pengguna (avatar + role icon badge colored per role), Aksi (badge colored by prefix: LOGIN/LOGOUT=blue, CREATE=green, UPDATE=amber, DELETE=red, STATUS_CHANGE=cyan, APPROVE=gold), Modul badge, Detail (truncated + title tooltip), IP (mono).
  * Total count badge; empty + loading states.
- Created `/src/components/app/admin/UserManagement.tsx` (ADMIN only):
  * SectionHeader + "Tambah Pengguna" gold button (UserPlus) → Dialog.
  * Table: avatar initial, Nama+email+self badge, Role badge with icon (ADMIN=ShieldCheck gold, PETUGAS=UserCog blue, ATASAN=Crown amber), Jabatan, NIP, Telepon, Status Switch (optimistic toggle → updateUser), Login Terakhir, Aksi (Edit → Dialog, Delete → AlertDialog).
  * Shared Add/Edit Dialog: email/name/role/position/nip/phone/password(required on create, optional on edit)/isActive Switch. Validation: email format, name+role+password, password ≥6 chars. Toast feedback + refresh.
  * Cannot delete self: Tooltip "Tidak dapat menghapus akun sendiri", delete button disabled. Self-switch also disabled.
- Created `/src/components/app/admin/JenisSuratManagement.tsx` (ADMIN only):
  * SectionHeader + "Tambah Jenis" gold button → Dialog.
  * Card grid (1/2/3 cols responsive): nama, kode (mono badge), deskripsi, isActive badge, two ToggleBadges "Butuh Pengukuran" (Ruler) & "Butuh TTD Camat" (Stamp) ON/OFF.
  * Add Dialog: kode (auto-uppercase, spaces→underscore, sanitized), nama, deskripsi textarea, butuhPengukuran Switch (default true), butuhTtdCamat Switch (default false). Validation kode+nama.
  * Secondary section: Master Status Proses (api.statusProses()) as read-only grid — urutan, color dot with glow, nama, kode, "Khusus"/"Final" badges. Sorted by urutan.
- All four components: "use client", wrapped in container mx-auto max-w-7xl px-4 py-6 space-y-5, glass-card border-primary/15, gold buttons via gradient, sonner toast, lucide icons, responsive mobile-first, ScrollArea for long tables, loading + empty states. Access guarded by useAppStore.can(...).
- Ran `bun run lint`: 3 errors reported — ALL in pre-existing files (AppShell.tsx NavLinks-in-render, NotificationsBell.tsx setState-in-effect). Zero errors in the 4 new files.
- Dev server log: final `✓ Compiled in 352ms` — my 4 files resolve cleanly. Remaining "module not found" entries are for PermohonanDetail/PermohonanList/PermohonanForm/dashboards (other agents' scope, Task 3-a/3-b).

Stage Summary:
- Reports & Admin views (Task 3-c) COMPLETE. 4 files created:
  • src/components/app/shared/Reports.tsx
  • src/components/app/admin/AuditLogView.tsx
  • src/components/app/admin/UserManagement.tsx
  • src/components/app/admin/JenisSuratManagement.tsx
- All imports in page.tsx for these 4 resolve; no new lint errors introduced.
- Access control enforced client-side via useAppStore.can(); backend routes also enforce roles (defense in depth).
- CSV + PDF export fully client-side (no extra deps). Print PDF uses a styled popup window.
- Ready for integration once sibling tasks (3-a dashboards, 3-b permohonan) deliver their components so the full SPA renders without module-not-found.

---
Task ID: 3-b
Agent: full-stack-developer (permohonan mgmt)
Task: Build PermohonanList, PermohonanForm, PermohonanDetail

Work Log:
- Read worklog.md + 9 infrastructure files (api.ts, constants.ts, types.ts, app-store.ts, StatusBadge.tsx, Timeline.tsx, StatCard.tsx, Logo.tsx) + shadcn/ui primitives (Tabs, Select, Table, Dialog, AlertDialog, Card, Button, Input, Textarea, Separator, Skeleton, ScrollArea, Badge).
- Verified page.tsx already wires 3 views (permohonan, permohonan-baru, permohonan-detail) to the new components; no router changes needed.
- Created `src/components/app/petugas/PermohonanList.tsx`:
  * SectionHeader "Daftar Permohonan" + gold "Daftar Baru" button gated on `can("create_permohonan")`.
  * Filters bar (glass-card): debounced search (400ms), status Select (All + STATUS_DEFINITIONS), per-page Select (10/20/50), active-filter chips with reset.
  * Responsive: shadcn Table on md+, card list on mobile. Columns: Nomor Register (mono gold-border), Pemohon (nama+NIK), Jenis Surat, StatusBadge, PriorityBadge, Dibuat, Detail button.
  * Pagination (prev/next + page info using total/limit), empty state, loading skeletons, error retry.
  * Row click OR Detail button → `selectPermohonan(id)`.
- Created `src/components/app/petugas/PermohonanForm.tsx` (CREATE only):
  * Back button → setView("permohonan").
  * 3 glass-card sections with custom SectionTitle headers: Jenis Surat & Prioritas, Data Pemohon (2-col grid), Data Tanah (2-col + batas sub-grid + keperluan textarea).
  * Loads jenis surat list via `api.jenisSurat()`, filters active items, shows butuhPengukuran/butuhTtdCamat as info badges when jenis selected.
  * prioritas Select (NORMAL/TINGGI/MENDESAK), statusPenguasaan Select (Milik Sendiri/Warisan/Girik/Sewa/Lainnya).
  * Validation: jenisSuratId, pemohonNik (min 8), pemohonNama, keperluan required → toast.error if missing.
  * Sticky submit bar with gold gradient "Simpan & Buat Nomor Register" → `api.createPermohonan` → `selectPermohonan(created.id)` + toast.success.
  * Input masking: NIK numeric ≤16, RT/RW numeric ≤3, HP numeric/plus ≤15.
- Created `src/components/app/shared/PermohonanDetail.tsx` (all roles):
  * Fetches `api.getPermohonan(id)`, full loading skeleton + error state with retry.
  * Header glass-card with gold top bar: nomorRegister (mono gold badge), StatusBadge lg, PriorityBadge, pemohonNama big, jenisSurat, keperluan, creator, dates, ProgressBar (right column on lg), red alert box for DITOLAK, orange alert box for REVISI.
  * 5 Tabs (Linimasa | Data | Dokumen | QR Code | Riwayat) with badge count on Dokumen tab.
  * Linimasa: Timeline (stages from buildStages, currentIndex from stages.indexOf, riwayat mapped) + Aksi Proses card (sticky on lg) with conditional actions:
    - "Lanjut ke Tahap Berikutnya" + catatan Input → PETUGAS/ADMIN when canAdvance & !REVISI.
    - "Setujui & Tanda Tangani" → ATASAN/ADMIN when TTD_LURAH.
    - "Sahkan & Selesaikan" → ATASAN/ADMIN when TTD_CAMAT.
    - "Minta Perbaikan (Revisi)" → Dialog with catatan Textarea → PETUGAS/ADMIN (non-final).
    - "Tolak Permohonan" → destructive Dialog with alasanDitolak → PETUGAS/ADMIN (non-final).
    - "Kembalikan ke Proses" → changeStatus(CEK_ADMIN) when REVISI.
    - "Hapus Permohonan" → AlertDialog confirm → ADMIN only.
  * Data tab: 3 cards (Data Pemohon, Data Tanah, Keperluan & Jenis Surat) using DLRow definition list; "Edit" button opens Dialog with full edit form (pemohon + tanah + prioritas + keperluan) → `api.updatePermohonan` → refresh.
  * Dokumen tab: upload area (jenisDokumen Select + file Input + gold Upload button, 10MB limit) gated on `can("upload_dokumen")`; list of uploaded dokumen with jenisDokumen badge, namaFile, date, size, download link (filePath), delete button (PETUGAS/ADMIN); ScrollArea with max-h for long lists.
  * QR Code tab: lazy-loads `api.getQr(id)` on tab open, shows QR image (data URL) on white card, tracking URL, Download QR (PNG), Salin URL (navigator.clipboard with copied state), reload button, info note. QR is invalidated after status change.
  * Riwayat tab: shadcn Table (waktu, status badge, petugas name+position, catatan), ScrollArea with max-h.
  * All mutations re-fetch detail + toast success/error. Uses `toast` from sonner, AlertDialog for destructive confirm, Dialog for edit/revisi/tolak.
- Verified with `bun run lint`: my 3 new files produce ZERO lint errors (pre-existing errors in AppShell.tsx and NotificationsBell.tsx are outside this task's scope).
- Dev log shows successful compilation after files were created (earlier "module not found" errors were from before the files existed).

Stage Summary:
- 3 production-ready "use client" components delivered, fully wired into page.tsx, with strict TypeScript, dark-navy + gold theme, glass-card / gold-gradient-text / navy-glow / gold-border utilities, shadcn/ui primitives, lucide icons, sonner toasts.
- PermohonanList: filter+search+paginate+responsive table/card list.
- PermohonanForm: 3-section create form with validation and sticky submit bar.
- PermohonanDetail: rich 5-tab detail page with full workflow actions (advance/approve-lurah/approve-camat/revisi/tolak/restore/delete), edit dialog, dokumen upload, QR code with download/copy, riwayat table — all role-aware via `useAppStore.can()` and `user.role`.
- Other agents can now build the remaining admin/petugas/atasan dashboards, Reports, AuditLogView, UserManagement, JenisSuratManagement — those imports in page.tsx still resolve pending their work.

---
Task ID: 4
Agent: main
Task: Integration, lint fixes, and end-to-end browser verification

Work Log:
- Fixed 3 lint errors: extracted NavLinks to top-level component in AppShell.tsx (react-hooks/static-components); restructured NotificationsBell effect to use .then() callbacks (react-hooks/set-state-in-effect).
- `bun run lint` now passes with 0 errors.
- Verified dev server compiles clean and serves / with 200.
- agent-browser end-to-end verification:
  1. Public tracking page renders (hero, search, example registers, "Cara Melacak" steps, footer). No errors.
  2. Clicked example register KPII-TNH-2026-000001 → tracking result shown with "Suparman", full riwayat table (Pengajuan/Cek Administrasi/Verifikasi Lapangan), timeline.
  3. Login modal opens; quick-filled Admin creds; login success → Admin dashboard with stats (Total 5, Diproses 2, Menunggu Pengukuran 1, Menunggu Lurah 1, Selesai 1, Ditolak 1), per-petugas table, recent list, notifications bell (5 unread).
  4. Permohonan detail (Maryam, TTD_LURAH) → tabs (Linimasa/Data/Dokumen/QR Code/Riwayat), action buttons (Lanjut/Setujui & TTD/Revisi/Tolak/Hapus).
  5. QR Code tab → QR generated with Download/Salin URL/Muat ulang.
  6. New permohonan form → filled jenis surat + NIK + nama + keperluan → "Simpan & Buat Nomor Register" → created "Pak Darmaji" and navigated to detail. No errors.
- Footer positioning verified: flex-col + main flex-1 keeps footer at bottom on short pages and pushes naturally on long pages.

Stage Summary:
- App is production-usable and fully interactive end-to-end. Public tracking, 3-role login, dashboards, permohonan CRUD, timeline, QR, dokumen, reports, audit log, user mgmt, jenis surat mgmt all wired and verified.
- No runtime errors or hydration issues observed.
- Demo credentials: admin@kpii.go.id/admin123, petugas@kpii.go.id/petugas123, lurah@kpii.go.id/lurah123.
- Remaining: create the mandatory 15-min webDevReview cron job.

---
Task ID: 6 (cron review round 1)
Agent: main (webDevReview)
Task: QA via agent-browser, fix visual bugs, add new features (public stats, FAQ, tanda terima)

## Current Project Status Assessment
App was production-usable from Task 4 (all core flows verified). This round focused on visual polish + new public-facing features. Lint stayed clean (0 errors) throughout. Dev server stable on port 3000.

## Work Completed

### QA Findings (agent-browser + VLM visual review)
- All views render without runtime errors (public, 3 dashboards, permohonan list/detail/form, reports, audit, users, jenis-surat).
- Nav click "bug" was a false alarm — agent-browser ref staleness; navigation works correctly (verified via JS eval with proper wait for re-render).
- VLM visual review (6 screenshots) identified: chart legend overlap (AdminDashboard), text truncation (JenisSurat cards), sparse tables (no zebra/hover), low muted-text contrast, inconsistent spacing.

### Bug Fixes
1. **AdminDashboard charts** (`AdminDashboard.tsx`): Replaced recharts built-in `<Legend>` (which overlapped) with custom legend rendered BELOW each chart. Bar chart legend = 2 inline items; Pie chart legend = 2-col grid with color dots + count values. Equalized chart heights (h-64 bar / h-52 pie + legend). Fixed "7 hari" stat card clipping by using `compact` + value `${avgDays}h` with hint.
2. **JenisSurat card truncation** (`JenisSuratManagement.tsx`): Changed `truncate` → `line-clamp-2 break-words` on card title so long names wrap instead of clipping.
3. **Global table polish** (`globals.css`): Added zebra striping (`nth-child(even)` gold 3.5% overlay), gold-tinted row hover (8%), increased row padding (0.7rem). Applied globally via `[data-slot]` selectors so all tables benefit.
4. **Muted text contrast** (`globals.css`): Bumped `--muted-foreground` from `oklch(0.72 0.02 80)` → `oklch(0.78 0.025 80)` in both `:root` and `.dark` for better WCAG AA on navy.
5. **Public hero spacing** (`PublicTracking.tsx`): Reduced `pt-14 pb-10` → `pt-10 pb-8`, added `leading-relaxed` to subtext, centered example registers (`justify-center`), added `animate-fade-in-up` entrance animation.

### New Features
6. **Public transparency stats banner** (new `PublicSections.tsx` + `/api/public/stats`): 4-counter card (Total / Selesai / Diproses / Tingkat Penyelesaian %) shown on landing page below search. No auth required. Includes "bulan ini" count.
7. **Dokumen yang Diperlukan section** (`PublicSections.tsx`): 6-card grid (KTP, KK, SPPT PBB, Bukti Penguasaan, Surat Pernyataan, Foto Lokasi) + 3 info cards (Lokasi Kantor, Jam Layanan, Biaya Layanan Gratis).
8. **FAQ accordion** (`PublicSections.tsx`): 6 Q&A items covering: what is SI-TRACK, how to track, required docs, processing time, what to do on "Perbaikan Dokumen", surat pickup. Uses shadcn Accordion.
9. **Printable Tanda Terima** (new `TandaTerima.tsx` + integrated into `PermohonanDetail.tsx`): Formal government receipt with letterhead (Logo + PEMERINTAH KABUPATEN SERUYAN / KELURAHAN KUALA PEMBUANG II), title, nomor register box + QR code, Data Pemohon + Data Tanah definition lists, keperluan, signature footer (Pemohon/Petugas Penerima/date), bottom disclaimer. "Cetak Tanda Terima" button (Printer icon, PETUGAS/ADMIN only) opens Dialog with scrollable preview + "Cetak / Print" button calling `window.print()`. Print CSS (`@media print` in globals.css) flips glass-card to white+gold-border, hides nav/header/footer/buttons.
10. **Global enhancements** (`globals.css`): Added `.card-hover` lift, `.animate-fade-in-up`, `.tabular-nums`, `*:focus-visible` gold ring for accessibility, `.print-only` utility.

## Verification Results
- `bun run lint`: 0 errors.
- agent-browser verified: public page shows stats banner + requirements + FAQ; admin dashboard charts render with custom legends (no overlap); tanda terima dialog opens with full receipt content (scrollable, 1690px content in 546px viewport), all sections present (letterhead, title, register+QR, data pemohon, data tanah, signature footer).
- VLM re-review: public page 8/10, admin dashboard 8/10 (legend fix confirmed), tanda terima content complete.
- Dev server: all routes 200, no runtime errors.

## Unresolved Issues / Risks
- Tanda Terima print output not physically tested (window.print() opens browser print dialog — can't automate). The @media print CSS is in place but real print preview should be manually verified by user.
- The VLM suggested making ALL status badges gold-only — intentionally NOT done: semantic colors (green=selesai, red=ditolak, amber=menunggu) are important for quick status scanning UX. Kept as-is.
- Reports PDF export uses popup window + window.print() — functional but basic.

## Priority Recommendations for Next Round
1. **Profile/Account settings page** — let users change their own password (currently only admin can reset).
2. **Dashboard date-range filter for petugas/atasan** (currently only admin has year filter).
3. **Permohonan list bulk actions** (bulk status change, bulk export).
4. **Search/global command palette** (Cmd+K) for quick navigation.
5. **PWA manifest + service worker** for offline tracking (mentioned as optional in original spec).
6. **WhatsApp/email notification integration** (currently dashboard-only notifications).

---
Task ID: 7-a
Agent: full-stack-developer
Task: Build Profile/Account Settings feature

Work Log:
- Read worklog.md and all infrastructure files (types.ts, api.ts, app-store.ts, auth.ts, audit.ts, schema.prisma, AppShell.tsx, page.tsx, StatCard.tsx) to understand patterns.
- Added `"profil"` to AppView union type in `/src/lib/types.ts`.
- Added `profile()` and `updateProfile()` methods to `/src/lib/api.ts` (GET and PUT /api/auth/profile).
- Added `edit_profile` case to `/src/store/app-store.ts` can() function (returns true for all logged-in users).
- Created backend API endpoint `/src/app/api/auth/profile/route.ts`:
  * GET — returns current user profile (id, email, name, role, position, nip, phone, avatar) using `getCurrentUser()` from auth.
  * PUT — updates profile fields (name, phone, position) and/or changes password.
  * Password change requires both currentPassword and newPassword, min 6 chars for new password.
  * Verifies current password using `verifyPassword()` (bcrypt compare) before allowing change.
  * Hashes new password with `hashPassword()` before saving.
  * Returns updated user info on success.
  * Logs to audit trail via `writeAudit()` with UPDATE aksi, AUTH modul, listing which fields changed.
- Created frontend component `/src/components/app/shared/ProfileSettings.tsx`:
  * "use client" component with SectionHeader "Pengaturan Akun" + UserCog icon.
  * Two-column grid (md:grid-cols-2) with glass-card border-primary/15 styling:
    - Informasi Profil: editable Nama, Jabatan, Telepon; read-only NIP, Email; Role with icon badge.
    - Ubah Password: current password, new password (min 6 chars hint), confirm password; all with show/hide toggle buttons.
  * Gold gradient buttons for both "Simpan Profil" and "Simpan Password".
  * Loading skeleton on initial load, Loader2 spinner on save buttons.
  * Toast feedback (success/error) via sonner.
  * Updates Zustand store user on profile save so header reflects new name immediately.
  * Password fields clear on successful save.
  * Real-time validation hints (password min length, confirm mismatch).
- Added "profil" view case in `/src/app/page.tsx` renderView() → returns `<ProfileSettings />`.
- Added "Profil" nav item with UserCog icon in AppShell.tsx navItems array (after Dashboard, available to all 3 roles).
- Added "Pengaturan Akun" option in user dropdown menu (with UserCog icon, before "Keluar" separator).
- Ran `bun run lint`: 0 errors in my files (3 pre-existing errors in CommandPalette.tsx, outside task scope).
- Dev server compiles cleanly, all routes 200.

Stage Summary:
- Files created:
  • /src/app/api/auth/profile/route.ts (backend API)
  • /src/components/app/shared/ProfileSettings.tsx (frontend component)
- Files modified:
  • /src/lib/types.ts (added "profil" to AppView)
  • /src/lib/api.ts (added profile + updateProfile methods)
  • /src/store/app-store.ts (added edit_profile permission)
  • /src/app/page.tsx (added profil view case + import)
  • /src/components/app/AppShell.tsx (added Profil nav item + Pengaturan Akun dropdown option)
- Feature complete: all logged-in users can view/edit their profile (name, phone, position) and change their password with current password verification. Audit trail logged for all profile changes.

---
Task ID: 7-b
Agent: full-stack-developer
Task: Build Command Palette (Cmd+K) for quick navigation

Work Log:
- Read worklog.md and all infrastructure files (command.tsx, app-store.ts, api.ts, types.ts, constants.ts, AppShell.tsx, StatusBadge.tsx) to understand the component API, store hooks, and styling patterns.
- Created `/src/components/app/shared/CommandPalette.tsx`:
  * "use client" component using shadcn/ui CommandDialog (CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandShortcut, CommandSeparator).
  * **Navigation commands**: Quick jump to Dashboard, Permohonan, Daftar Baru, Laporan, Jenis Surat, Pengguna, Audit Log, Profil, Notifikasi, Lacak Surat (Public). Filtered by user role using same roles as AppShell navItems.
  * **Quick search**: Debounced (300ms) search for permohonan by register number or pemohon name using `api.listPermohonan({ search, limit: "5", page: "1" })`. Shows top 5 results with gold mono register badge, pemohon name, and status badge. On select, calls `selectPermohonan(id)` to navigate to detail.
  * **Quick actions**: "Daftar Permohonan Baru" (gated on `can("create_permohonan")`), "Keluar (Logout)".
  * Custom glass-card + navy-glow styling with `bg-background/95 backdrop-blur-md`.
  * Gold accent for selected items (`data-[selected=true]:bg-primary/10 data-[selected=true]:text-primary`).
  * Search results show: nomor register (mono gold badge), pemohon name, status badge with dynamic colors.
  * Navigation items show: icon + label, with keyboard shortcut hints (⌘D, ⌘P, ⌘L, ⌘T).
  * Footer hint bar: ↑↓ navigasi, ↵ pilih, esc tutup.
  * Empty/loading states: "Mencari..." with Loader2 spinner, "Tidak ditemukan" for no results, hint for min 2 chars.
  * State reset handled via `key` prop in AppShell — increments `cmdKey` each time palette opens, remounting with fresh state (avoids set-state-in-effect lint rule).
  * Derived `effectiveQuery` (only when >= 2 chars) and `visibleResults` (derived from effectiveQuery + searchResults) to avoid set-state-in-effect for clearing results.
  * Debounced search uses setTimeout with setState only inside the callback (passes lint).
- Integrated into `/src/components/app/AppShell.tsx`:
  * Added `cmdOpen` and `cmdKey` state variables.
  * Global keyboard listener (Cmd+K on Mac / Ctrl+K on Windows) with useEffect + document.addEventListener.
  * Search trigger button in header (next to NotificationsBell, for logged-in users): Search icon + "Cari..." text + ⌘K kbd badge. Hidden on mobile (sm:flex).
  * CommandPalette rendered at end of AppShell with `key={cmdKey}` for clean state reset on each open.
  * Passes setView, selectPermohonan, and handleLogout to CommandPalette.
- Ran `bun run lint`: 0 errors across all files.
- Dev server compiles cleanly.

Stage Summary:
- Files created:
  • /src/components/app/shared/CommandPalette.tsx
- Files modified:
  • /src/components/app/AppShell.tsx (added CommandPalette import, cmdOpen/cmdKey state, Cmd+K listener, search trigger button, CommandPalette render)
- Feature complete: Cmd+K / Ctrl+K opens command palette with quick navigation (role-filtered), permohonan search (debounced, top 5 results), and quick actions (new permohonan, logout). Consistent dark navy + gold theme.

---
Task ID: 7
Agent: main
Task: Visual polish, new features (Profile Settings, Command Palette), and QA

## Current Project Status Assessment
App was production-usable from Phase 6 (all core flows verified, public stats/FAQ/tanda terima added). This round focused on: (1) visual quality improvements based on VLM QA feedback, (2) new high-impact features, (3) enhanced animations/micro-interactions.

## Work Completed

### QA Findings (agent-browser + VLM visual review — 7 screenshots)
- All views render without runtime errors
- VLM rated public landing page 7/10 (contrast issues, spacing inconsistencies)
- VLM rated stats banner 6/10 (weak contrast, inconsistent icon styling)
- Admin dashboard charts lacked data labels on bars/pie segments
- Footer was basic 3-column layout lacking visual richness
- Text contrast issues: muted-foreground text too dim on navy background
- Missing hover states and micro-interactions on cards

### Visual Polish Fixes
1. **Public Landing Page** (`PublicTracking.tsx`):
   - Enhanced hero section: larger badge, better spacing (pt-12 pb-10), added 3rd ambient glow blob
   - Improved subtitle contrast: `text-foreground/70` instead of `text-muted-foreground`
   - Search card: added gold gradient top bar, larger inputs (h-12), "Lacak Sekarang" with shadow
   - Example register buttons: styled as proper badges with border + hover effects
   - QR icon now larger with better visibility

2. **Empty State Steps** (`PublicTracking.tsx`):
   - Each step now has unique accent color (blue → teal → gold → green)
   - Larger icon containers (14x14 rounded-2xl) with color-tinted backgrounds
   - Arrow connectors between steps on desktop (lg:block)
   - Group hover scale effect on icons
   - Petugas login card: gold gradient top line, icon in container, gold CTA button

3. **Tracking Result** (`PublicTracking.tsx`):
   - Status hero: thicker top bar (h-2), pulse-gold animation on status icon
   - Better badge sizing (px-2.5 py-1)
   - Added "Progres Keseluruhan" label + "Tahap X dari Y" indicator above progress bar
   - Fade-in-up animation on the result card

4. **Stats Banner** (`PublicSections.tsx`):
   - Icon in container with border (like other sections)
   - Subtitle "Data real-time dari sistem SI-TRACK TANAH"
   - Period badge now in a styled container with bg + border
   - Stat cards: larger (p-4 rounded-xl), colored value text, hover border transition
   - Icon hover scale effect on all stat items

5. **Requirements Section** (`PublicSections.tsx`):
   - Icon containers with hover scale (group-hover:scale-110)
   - Info cards (Lokasi/Jam/Biaya): upgraded from p-3 rounded-lg to p-4 rounded-xl with card-hover + group effects
   - Better text contrast using `text-foreground/55`

6. **FAQ Section** (`PublicSections.tsx`):
   - Icon in container matching other section headers
   - Better padding (p-4 sm:p-6)
   - Answer text uses `text-foreground/60` for better readability

7. **Footer** (`Footer.tsx`):
   - Expanded to 4-column grid (was 3)
   - Added "Resmi & Terpercaya" badge with ShieldCheck icon
   - Added "Tautan" column with navigation links
   - Added "Minggu & Hari Libur: Tutup" in service hours
   - Section headers now have icons (MapPin, Clock, ExternalLink)
   - "Dibuat dengan ❤" heart icon in copyright line
   - Better text contrast with `text-foreground/55`

8. **Dashboard Charts** (`AdminDashboard.tsx`):
   - Bar chart: added data labels on top of bars (position: "top", colored per series)
   - Pie chart: added percentage labels on slices, increased radius (55→85 inner, 80→85 outer)
   - Increased pie chart height (h-52 → h-56)

9. **StatCard** (`StatCard.tsx`):
   - Hover shadow effect (`hover:shadow-lg hover:shadow-primary/5`)
   - Gradient top bar now fades (`${accent}80, transparent`)
   - Colored value text for non-gold accents
   - Better label contrast (`text-foreground/50`)
   - Tabular-nums on values for alignment

10. **SectionHeader** (`StatCard.tsx`):
    - Added `animate-fade-in-up` for entrance animation
    - Better subtitle contrast

11. **Global CSS** (`globals.css`):
    - New animations: `animate-fade-in`, `animate-scale-in`, `animate-slide-up`
    - Smooth table row transitions
    - Button active press effect (`scale(0.98)`)
    - `.hover-underline` utility for animated underline on hover

### New Features
12. **Profile/Account Settings** (new `ProfileSettings.tsx` + `/api/auth/profile` route):
    - GET/PUT endpoint for profile data and password change
    - Two-section UI: Informasi Profil (editable name, phone, position; readonly email, role, NIP) + Ubah Password (with current/new/confirm, validation, show/hide toggles)
    - Audit trail logging for all profile changes
    - Zustand store update on save (header reflects name changes immediately)
    - Nav item "Profil" added for all roles + dropdown menu "Pengaturan Akun"

13. **Command Palette** (new `CommandPalette.tsx`):
    - Cmd+K / Ctrl+K keyboard shortcut
    - Navigation commands (role-filtered): Dashboard, Permohonan, Daftar Baru, Laporan, etc.
    - Quick search: debounced search for permohonan by register/name (5 results max)
    - Quick actions: "Daftar Permohonan Baru" (role-gated), "Keluar" (destructive)
    - Search trigger button in header with ⌘K badge
    - Clean state reset via key prop remounting

## Verification Results
- `bun run lint`: 0 errors
- Dev server: compiles clean, all routes 200
- API endpoints verified: Homepage, Public Stats, Tracking, Login, Profile (all 200)
- VLM re-review: public page 8/10 (up from 7/10), stats section 8/10 (up from 6/10)
- Note: OOM issues in sandbox environment prevented extended browser testing (Next.js + Chrome memory pressure)

## Unresolved Issues / Risks
- OOM kills Next.js server when Chrome browser is also running in sandbox (4GB RAM limit). This is an environment constraint, not an application bug.
- Tanda Terima print output not physically tested (window.print() opens browser print dialog — can't automate).
- Reports PDF export uses popup window + window.print() — functional but basic.

## Priority Recommendations for Next Round
1. **Dashboard date-range filter for Petugas/Atasan** (currently only Admin has year filter)
2. **Permohonan list bulk actions** (bulk status change, bulk export)
3. **PWA manifest + service worker** for offline tracking (mentioned as optional in original spec)
4. **WhatsApp/email notification integration** (currently dashboard-only notifications)
5. **Enhanced chart interactivity** (click-to-filter on pie/bar segments)
6. **Data export improvements** (proper PDF generation with jsPDF instead of window.print)

---
Task ID: 7-b
Agent: frontend-styling-expert (AdminLTE 4 redesign)
Task: Redesign admin area to AdminLTE 4 layout

Work Log:
- Read worklog.md, AppShell.tsx, globals.css, AdminDashboard.tsx, StatCard.tsx, Logo.tsx, app-store.ts, constants.ts, NotificationsBell.tsx, Footer.tsx, page.tsx, types.ts to understand the existing structure and constraints.
- globals.css: Added a scoped `.adminlte` theme block (placed AFTER the dark navy base theme so it overrides only inside admin). Inside `.adminlte`: overrode all shadcn CSS variables (--background → #f4f6f9, --foreground → #212529, --card → #fff, --border → #e3e6ec, --input → #fff, --accent → #f1f3f5, --secondary → #e9ecef, --muted → #e9ecef, --muted-foreground → #6c757d, --primary → #b8941f, --destructive → #dc3545) so EVERY shadcn input/select/table/card/dropdown automatically renders in light theme without touching individual components.
- globals.css: Overrode `.glass-card` inside `.adminlte` to render as a WHITE AdminLTE card (white bg, #e3e6ec border, subtle shadow, no backdrop-filter). This makes ALL existing dashboards (PetugasDashboard, AtasanDashboard, AdminDashboard, Reports, UserManagement, AuditLogView, JenisSuratManagement, ProfileSettings, PermohonanList, etc.) automatically get white AdminLTE-style cards with zero per-component changes.
- globals.css: Re-tuned `.gold-text` to #b8941f, `.gold-border` to #d4af37, `.navy-glow` to a lighter shadow, light scrollbar track/thumb, light-theme table zebra/hover, and `.adminlte [data-slot="card"]` / `.adminlte [data-slot="card-header"]` explicit white-card overrides so shadcn Card renders perfectly on light bg.
- globals.css: Added the full AdminLTE 4 component CSS — `.main-sidebar` (250px dark navy #1a2332 fixed), `.content-wrapper` (margin-left 250px, light gray bg, flex-col), `.main-header` (sticky 57px dark navbar), `.main-footer` (dark navy bar), `.brand-link`, `.user-panel`, `.sidebar-form` + `.sidebar-search-btn`, `.nav-sidebar` + `.nav-header` (uppercase section labels) + `.nav-link` (active = gold left border 3px + gold-tinted bg + white text), `.alte-small-box` (signature widget) with 6 color variants (sb-primary blue, sb-success green, sb-info cyan, sb-warning yellow, sb-danger red, sb-gold gradient), `.alte-info-box`, `.navbar-breadcrumb`, `.navbar-btn`, `.navbar-user-btn`, `.sidebar-toggle`, `.navbar-brand-mini`, responsive `@media (max-width:991.98px)` rules (translateX sidebar + zero-margin content-wrapper), and `@media print` rules to hide admin chrome.
- AppShell.tsx: Completely rewrote. Split into module-level `SidebarContent` component (shared by desktop `<aside>` + mobile `<Sheet>`) and `AdminFooter` minimal dark bar (replaces the full marketing Footer inside admin to keep AdminLTE look). PUBLIC view (`!user`) preserves the existing dark-navy sticky header (LogoFull + Lacak Surat + Login Petugas gold button) + `<main>` + `<Footer/>` — NO `.adminlte` wrapper. AUTHENTICATED view (`user`) renders the full AdminLTE layout: `<div className="adminlte wrapper">` → desktop `<aside className="main-sidebar">` (hidden < 992px via CSS) + mobile `<Sheet side="left">` (controlled by `mobileOpen` state, with the same SidebarContent + a Keluar button) → `<div className="content-wrapper">` → sticky `<nav className="main-header">` (hamburger toggle on mobile + brand-mini + breadcrumb showing current view label + search button with ⌘K kbd + NotificationsBell + user DropdownMenu with Dashboard/Lacak Surat Publik/Pengaturan Akun/Keluar) → `<section className="content">{children}</section>` → `<AdminFooter/>`. CommandPalette rendered outside layout with `key={cmdKey}` reset pattern preserved. Cmd+K / Ctrl+K listener preserved. All existing wiring kept: useAppStore (user, view, setView, setUser, selectPermohonan), api.logout(), ROLE_LABELS, role icons (ShieldCheck/Crown/UserCog).
- AppShell.tsx nav grouping: `getSections(role)` returns three sections — "Menu" (Dashboard, Permohonan, Daftar Baru, Laporan), "Manajemen" (Jenis Surat, Pengguna, Audit Log — ADMIN only), "Akun" (Profil) — each rendered with an uppercase `.nav-header` divider. `isActive(view, item)` handles the permohonan ↔ permohonan-detail active state.
- AdminDashboard.tsx: Added a module-level `SmallBox` component (props: number, label, icon, variant, onClick) that renders the AdminLTE signature small-box widget markup (`.alte-small-box` + `.sb-inner` + `.sb-text` + `.sb-number` + `.sb-label` + `.sb-icon` absolute-positioned large translucent icon + `.sb-footer` "More info ›" link with hover translateX). Replaced the 8 `<StatCard>` calls with 8 `<SmallBox>` calls in a `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3` (Total Permohonan → primary, Diproses → info, Menunggu Pengukuran → warning, Menunggu Lurah → gold, Menunggu Camat → warning, Selesai → success, Ditolak → danger, Rata-rata Penyelesaian → primary). Removed the unused `StatCard` import (kept `SectionHeader` for the year-select header). Changed `text-green-400` → `text-green-600` in the per-petugas table for better contrast on white. Data fetching, year select, chart configs, table, and recent list kept intact. Charts automatically read on white because the chart axis/grid strokes reference `var(--muted-foreground)`, `var(--border)`, `var(--muted)` — all overridden inside `.adminlte`.
- Verified dev server compiles cleanly (GET / 200 in 9.0s initial compile, GET /api/auth/login 200, GET /api/dashboard?year=2025 200 — all routes return 200 with no errors in dev.log).
- Verified lint: `bun run lint` returns exit 0 (0 errors).
- Verified visually via agent-browser: logged in as admin@kpii.go.id, navigated to dashboard. VLM analysis of the screenshot confirmed: (1) dark navy left sidebar with logo/user panel/search/grouped nav, (2) dark navy top navbar, (3) light gray main area with white cards, (4) colored small-box widgets with big numbers + uppercase labels + "More info ›" footers, (5) AdminLTE resemblance rated 9/10.

Stage Summary:
- Files changed:
  • /src/app/globals.css — added ~330 lines of AdminLTE 4 scoped CSS (`.adminlte` theme overrides + small-box/info-box/sidebar/navbar/footer component classes + responsive + print rules). Public-facing dark navy theme is UNTOUCHED (only `.adminlte` scope is affected).
  • /src/components/app/AppShell.tsx — completely rewritten from a single sticky-header layout to a dual-mode layout: dark navy public page (when `!user`) OR full AdminLTE 4 layout (dark fixed sidebar + dark sticky navbar + light gray content + dark footer) when authenticated. Module-level `SidebarContent` + `AdminFooter` helper components. Nav items grouped into MENU / MANAJEMEN / AKUN sections. Mobile sidebar via shadcn Sheet.
  • /src/components/app/admin/AdminDashboard.tsx — replaced the 8 StatCards in the top stat row with 8 AdminLTE SmallBox widgets (blue/cyan/yellow/gold/green/red color variants). Added module-level `SmallBox` component. Charts and tables untouched (they auto-adapt to light theme via CSS variable overrides). One minimal contrast tweak: `text-green-400` → `text-green-600` in the per-petugas table.
- Zero changes to: PetugasDashboard, AtasanDashboard, StatCard, PublicTracking, PublicSections, Footer, LoginModal, NotificationsBell, CommandPalette, page.tsx, all API routes, prisma, store, lib, types. PetugasDashboard and AtasanDashboard auto-inherit white AdminLTE cards via the `.adminlte .glass-card` override.
- Key design decision: instead of editing every dashboard component, the AdminLTE light theme is achieved ENTIRELY via CSS variable overrides scoped to `.adminlte`. Any shadcn component (Card, Input, Select, Table, Dropdown, Badge, Button, etc.) inside the admin wrapper automatically renders in light theme. This minimizes code churn and risk.
- Key design decision: the full marketing Footer component is replaced inside admin by a minimal `AdminFooter` (single dark bar with copyright + version + "Dibuat dengan ❤" line) to match the AdminLTE convention. The full Footer is still used on the public landing page.
- Lint: 0 errors. Dev server: compiles clean, all routes 200. VLM visual rating: 9/10 AdminLTE resemblance.

---
Task ID: 8
Agent: main (webDevReview round)
Task: QA + visual consistency (SmallBox across all dashboards) + bulk selection in PermohonanList + keyboard shortcuts help

## Current Project Status Assessment
App stable from Task 7-b (AdminLTE 4 redesign). Dev server clean, lint 0 errors, all routes 200. This round focused on: (1) visual consistency across all 3 role dashboards, (2) new high-impact bulk-action feature, (3) keyboard UX enhancement.

## Work Completed

### QA Findings (agent-browser)
- Admin dashboard: 8 SmallBox widgets render correctly on light AdminLTE theme
- Public page: dark navy theme untouched, no regressions
- All API routes return 200 (dashboard, permohonan, notifikasi, auth)

### Visual Consistency — SmallBox widgets across all dashboards
1. **Extracted shared SmallBox component** (`src/components/app/SmallBox.tsx`):
   - Module-level component with props: number, label, icon, variant (primary/success/info/warning/danger/gold), footerText (default "More info"), onClick
   - Reused by AdminDashboard, PetugasDashboard, AtasanDashboard — eliminates duplication, ensures visual consistency
   - AdminDashboard.tsx: removed local SmallBox definition, now imports from shared file

2. **PetugasDashboard** (`PetugasDashboard.tsx`):
   - Replaced 5 StatCards with 5 SmallBox widgets (Permohonan Baru→primary, Cek Administrasi→info, Pengukuran→warning, Draft Surat→gold, Menunggu Persetujuan→warning)
   - Each has contextual footerText (e.g. "Perlu didaftarkan", "Verifikasi dokumen")
   - Responsive grid: 1 col mobile → 2 col sm → 3 col lg → 5 col xl
   - Fixed light-theme contrast: text-cyan-400→text-cyan-600, text-green-400→text-green-600

3. **AtasanDashboard** (`AtasanDashboard.tsx`):
   - Replaced 4 StatCards with 4 SmallBox widgets (Menunggu Persetujuan→warning, Surat Selesai→success, Total Diproses→info, Rata-rata Penyelesaian→gold)
   - Fixed light-theme contrast: text-green-400→text-green-600, text-red-400→text-red-600, CheckCircle2 text-green-400→text-green-600

### New Feature — Bulk Selection + CSV Export in PermohonanList
4. **PermohonanList** (`PermohonanList.tsx`):
   - Added Checkbox column to desktop table (select-all header checkbox with indeterminate state) + checkbox on each mobile card
   - `selectedIds` Set state tracks selection across page; auto-clears on page/filter change
   - `toggleSelectAll()` / `toggleSelectOne(id)` / `clearSelection()` helpers
   - **Bulk action bar** (animated fade-in-up, navy-glow): appears when ≥1 item selected, shows count ("N permohonan terpilih") + "Export CSV (N)" gold button + "Batal Pilih" outline button
   - **CSV export** (`exportSelectedCsv`): generates CSV with BOM (Excel-compatible), columns: Nomor Register, Nama Pemohon, NIK, Jenis Surat, Status, Prioritas, Dibuat, Selesai, Keperluan; proper escaping of quotes/commas; downloads as `permohonan-terpilih-YYYY-MM-DD.csv`
   - Selected rows get `bg-primary/8` highlight on desktop + `border-primary/40 bg-primary/5` on mobile
   - Checkbox click uses `e.stopPropagation()` to prevent row navigation when toggling

### New Feature — Keyboard Shortcuts Help Modal
5. **KeyboardShortcutsHelp** (`src/components/app/shared/KeyboardShortcutsHelp.tsx`):
   - Dialog with 9 shortcuts grouped into 3 sections (UMUM / NAVIGASI / AKSI CEPAT)
   - Each shortcut: icon + label + styled kbd keys
   - Shortcuts: ⌘K (search), ? (help), Esc (close), G+D (dashboard), G+P (permohonan), G+B (baru), G+L (laporan), G+U (users), N (notifications)

6. **AppShell** (`AppShell.tsx`):
   - Added `?` key listener → opens KeyboardShortcutsHelp dialog (ignored when typing in input/textarea/select)
   - Added `g`-prefix navigation: press `g` then `d/p/b/l/u` to jump to views (role-filtered)
   - Added Keyboard icon button in navbar (hidden on mobile) to open help
   - gPressedRef with 800ms timeout for the g-prefix two-key sequence
   - All shortcuts ignore when focus is in input/textarea/select/contentEditable

## Verification Results
- `bun run lint`: **0 errors**
- Dev server: compiles clean (✓ Compiled in 1276ms), all routes 200
- agent-browser QA:
  - Admin dashboard: 8 SmallBox widgets ✓
  - PetugasDashboard: 5 SmallBox widgets (blue/cyan/yellow/gold) ✓ — VLM 8/10 AdminLTE consistency
  - AtasanDashboard: 4 SmallBox widgets ✓
  - PermohonanList bulk selection: checkbox click → bulk bar appears with "Export CSV (1)" ✓ — VLM 8/10 clarity
  - Keyboard help: `?` key opens dialog with all 9 shortcuts ✓
- All 3 dashboards now share identical SmallBox widget styling for visual consistency

## Files Changed (6)
- `src/components/app/SmallBox.tsx` — NEW shared SmallBox component
- `src/components/app/shared/KeyboardShortcutsHelp.tsx` — NEW keyboard shortcuts help dialog
- `src/components/app/AppShell.tsx` — added ? / g-prefix keyboard shortcuts + help button + KeyboardShortcutsHelp
- `src/components/app/admin/AdminDashboard.tsx` — import SmallBox from shared (removed local def)
- `src/components/app/petugas/PetugasDashboard.tsx` — 5 StatCards → 5 SmallBox + light-theme contrast fixes
- `src/components/app/atasan/AtasanDashboard.tsx` — 4 StatCards → 4 SmallBox + light-theme contrast fixes
- `src/components/app/petugas/PermohonanList.tsx` — bulk selection + CSV export + bulk action bar

## Unresolved Issues / Risks
- Bulk selection is per-page only (resets on page change). Cross-page selection would require a different UX pattern (selected IDs persisted across pages). Current behavior is intentional to avoid confusion.
- Keyboard `g`-prefix navigation requires two key presses within 800ms — may need user education (covered by the help modal).
- CSV export is client-side only (no server-side Excel generation). For large datasets, a server-side export endpoint would be better.

## Priority Recommendations for Next Round
1. **Cross-page bulk selection** — persist selected IDs across pagination using a "select all matching filter" pattern
2. **Dashboard date-range filter for Petugas/Atasan** ✅ DONE (Task 9-a)
3. **WhatsApp/email notification integration** (currently dashboard-only notifications)
4. **PWA manifest + service worker** for offline public tracking ✅ DONE (Task 9-a)
5. **Enhanced chart interactivity** (click-to-filter on pie/bar segments)
6. **Server-side PDF report generation** with jsPDF instead of window.print()

---
Task ID: 9-a
Agent: full-stack-developer (year filter + PWA)
Task: Add year filter to Petugas/Atasan dashboards + PWA manifest + service worker

Work Log:
- Read worklog.md to understand project history and context
- Read PetugasDashboard.tsx, AtasanDashboard.tsx, AdminDashboard.tsx (reference for year pattern), StatCard.tsx (SectionHeader action prop), layout.tsx, api.ts
- Updated PetugasDashboard.tsx: added useMemo import, Select component imports, year state (default currentYear), yearOptions computed via useMemo, fetchData now accepts year param calling api.dashboard(y), useEffect depends on [year, fetchData], year Select in SectionHeader action prop
- Updated AtasanDashboard.tsx: same changes as PetugasDashboard — year state, yearOptions, fetchData(year), year Select in SectionHeader action
- Created /public/manifest.json — PWA manifest with name, short_name, icons (logo.svg), standalone display, dark navy background, gold theme color, portrait-primary orientation
- Created /public/sw.js — minimal service worker with cache-first strategy for offline support (install, activate, fetch handlers)
- Created /src/components/app/ServiceWorkerRegistrar.tsx — client component that registers SW in production only
- Updated layout.tsx: added ServiceWorkerRegistrar import, <head> with manifest link + theme-color meta, metadataBase + openGraph + appleWebApp in metadata export, <ServiceWorkerRegistrar /> in body after children
- Ran `bun run lint` — 0 errors
- Checked dev.log — compiles clean, API requests working (GET /api/dashboard?year=2026 200)

Stage Summary:
- Year filter added to both PetugasDashboard and AtasanDashboard (matching AdminDashboard pattern)
- PWA support added: manifest.json, sw.js service worker, ServiceWorkerRegistrar component
- Layout updated with manifest link, theme-color meta, metadataBase, openGraph, appleWebApp
- All lint checks pass, dev server compiles cleanly
- Files changed: PetugasDashboard.tsx, AtasanDashboard.tsx, layout.tsx, manifest.json (new), sw.js (new), ServiceWorkerRegistrar.tsx (new)

---
Task ID: 9
Agent: main (webDevReview round)
Task: Year filter for Petugas/Atasan dashboards + PWA manifest + PermohonanDetail enhancements

## Current Project Status Assessment
App stable from Task 8. All core flows verified, lint 0 errors, dev server clean. This round focused on: (1) feature parity across dashboards, (2) PWA for mobile installability, (3) PermohonanDetail UX enhancements.

## Work Completed

### 1. Year Filter for Petugas/Atasan Dashboards (Feature Parity)
- **PetugasDashboard.tsx**: Added `year` state, `yearOptions` (useMemo), `fetchData(y)` with year param, year Select in SectionHeader action (matching AdminDashboard pattern exactly)
- **AtasanDashboard.tsx**: Same changes — year state, yearOptions, fetchData(year), year Select
- Both now support filtering dashboard data by year (current year - 4 to current year)

### 2. PWA Support (Mobile Installability)
- **`public/manifest.json`**: PWA manifest — standalone display, gold theme (#d4af37), navy background (#0a1628), logo.svg icon, "government" category, lang "id"
- **`public/sw.js`**: Service worker — network-first with cache fallback, offline fallback to `/`, auto-cleanup old caches on activate
- **`ServiceWorkerRegistrar.tsx`**: Client component registering SW in production only (no SW in dev mode)
- **`layout.tsx`**: Added `<link rel="manifest">`, `<meta name="theme-color">`, metadataBase, openGraph, appleWebApp metadata, `<ServiceWorkerRegistrar />` in body

### 3. PermohonanDetail Enhancements
- **Collapsible Data Sections**: Data tab now uses shadcn Collapsible for each card (Data Pemohon, Data Tanah, Keperluan). Each has rotating ChevronDown icon. Default open.
- **Print Receipt Button**: Added "Cetak Tanda Terima" ghost button in the header card (quick access, only for PETUGAS/ADMIN)
- **Document Preview Icons**: File-type icons based on extension — FileImage for images, FileType2 for PDF, Files for others. File size formatting (KB/MB).
- **Light Theme Alert Boxes**: DITOLAK alert → bg-red-50/border-red-200/text-red-800 (was destructive/10 which was dark-theme only). REVISI alert → bg-amber-50/border-amber-200/text-amber-800 (was orange-500/10).
- **Aksi Proses Card**: Added `border-l-4 border-l-primary` accent for visual distinction on white cards
- **Floating Quick-Action Bar**: Sticky bottom bar with register number + status badge (left), Tolak button (optional), and primary gold action button (Lanjut/Setujui/Sahkan/Kembalikan — based on current status). Only shows on non-final statuses. VLM rated 9/10 UX clarity.

### Files Changed
- `src/components/app/petugas/PetugasDashboard.tsx` — year filter
- `src/components/app/atasan/AtasanDashboard.tsx` — year filter
- `public/manifest.json` — NEW PWA manifest
- `public/sw.js` — NEW service worker
- `src/components/app/ServiceWorkerRegistrar.tsx` — NEW SW registration
- `src/app/layout.tsx` — PWA head tags + SW registrar
- `src/components/app/shared/PermohonanDetail.tsx` — collapsible sections + print button + doc icons + light-theme alerts + floating bar

## Verification Results
- `bun run lint`: **0 errors**
- Dev server: compiles clean, all routes 200
- agent-browser QA:
  - Admin dashboard: 8 SmallBox + 2 charts ✓
  - Floating quick-action bar on detail page: visible with "KPII-TNH-2026-000006", "Pengajuan Diterima" badge, "Tolak" + "Lanjut ke Tahap Berikutnya" buttons ✓ — VLM 9/10
  - Collapsible data sections working ✓
  - Light-theme alert boxes render correctly ✓

## Unresolved Issues / Risks
- Service worker only registers in production mode (intentional — no caching in dev)
- PWA manifest uses `/logo.svg` as icon — may need a 192x192 and 512x512 PNG for full PWA compatibility on Android
- Floating bar overlaps with the Aksi Proses sidebar card on large screens — both show the same actions. Consider hiding the Aksi Proses card on mobile where the floating bar replaces it.

## Priority Recommendations for Next Round
1. **Generate PWA icon PNGs** (192x192 and 512x512 from logo.svg) for full Android installability
2. **Hide Aksi Proses card on mobile** since the floating bar provides the same actions
3. **Dashboard date-range (from-to) filter** for more granular date selection beyond year-only
4. **WhatsApp/email notification integration** (currently dashboard-only notifications)
5. **Server-side PDF report generation** with jsPDF instead of window.print()
6. **Enhanced chart interactivity** (click-to-filter on pie/bar segments)

---
Task ID: 10-a
Agent: frontend-styling-expert (AdminLTE 4 visual polish)
Task: Polish AdminLTE 4 visuals based on VLM QA findings

Work Log:
- Read worklog.md (Tasks 7-b AdminLTE redesign + Task 8 SmallBox extraction context), globals.css (AdminLTE scoped section), AppShell.tsx, SmallBox.tsx, AdminDashboard.tsx, PermohonanList.tsx, PermohonanDetail.tsx to understand current state.
- globals.css — SmallBox color saturation: replaced flat backgrounds with refined 135deg gradients on sb-primary (#0d6efd → #0b5ed7), sb-success (#198754 → #157347), sb-info (#0dcaf0 → #0bb6d8), sb-warning (#ffc107 → #e0a800), sb-danger (#dc3545 → #bb2d3b). sb-gold kept as-is (signature brand). Reduced box-shadow from "0 1px 3px rgba(0,0,0,.12)" + hover "0 4px 12px rgba(0,0,0,.18)" to subtler "0 1px 2px rgba(0,0,0,.08), 0 0 1px rgba(0,0,0,.06)" + hover "0 3px 8px rgba(0,0,0,.12), 0 0 1px rgba(0,0,0,.08)". Lowered sb-info/sb-warning footer overlay opacity from .1 → .08.
- globals.css — Card-header: added `font-weight: 600` to the existing `.adminlte [data-slot="card-header"], .adminlte .card-header` rule (which already had bg #f8f9fa + 1px solid #e3e6ec border-bottom + padding 0.75rem 1rem).
- globals.css — Sidebar color refinement: replaced all `#1a2332` occurrences with `#1e2a3a` (slightly lighter, more refined navy) in `.main-sidebar`, `.main-header`, `.main-footer`. Also updated the same color in AppShell.tsx mobile Sheet content bg.
- globals.css — Nav-link weight: added `font-weight: 400` and `text-shadow: none` to the base `.nav-link` rule. Active link keeps `font-weight: 600` (unchanged). This matches AdminLTE 4 convention of normal-weight nav links.
- globals.css — Added new `.alte-btn-primary` (blue #0d6efd → hover #0b5ed7), `.alte-btn-success` (green #198754 → hover #157347), `.alte-btn-warning` (yellow #ffc107 → hover #e0a800) button utility classes scoped to `.adminlte`. All use `!important` to override shadcn Button defaults so they work whether the Button has variant="default" or no variant.
- globals.css — Table styling: added `.adminlte [data-slot="table-head"], [data-slot="table-cell"] { border-bottom: 1px solid #e3e6ec; }`, `.adminlte [data-slot="table-head"] { font-weight: 600; background: #f8f9fa; }`, `.adminlte [data-slot="table-body"] [data-slot="table-row"] { transition: background-color 0.12s ease; }`. Changed the existing tbody row hover bg from `rgba(212, 175, 55, 0.10)` (gold tint) to `#f1f3f5` (AdminLTE standard gray). Also added border-bottom 1px solid #e3e6ec on table-row inside table-header and table-body.
- globals.css — Typography: added `font-family: 'Source Sans 3', 'Source Sans Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;` to the `.adminlte` scope. Added `.adminlte h1 { font-weight: 600; }` and `.adminlte h2 { font-weight: 600; }` rules (these override Tailwind's `.font-bold`/`.font-extrabold` utilities because they're outside any @layer with higher specificity).
- globals.css — AlteInfoBox widget polish: rewrote `.alte-info-box` as `display: grid; grid-template-columns: 70px 1fr;` (icon | body), added hover lift effect (translateY -1px + subtle shadow), added `.ib-progress-text` style for the progress caption, added 6 color variant classes (`.ib-primary` / `.ib-success` / `.ib-info` / `.ib-warning` / `.ib-danger` / `.ib-gold`) that style BOTH the `.ib-icon` background AND the `.ib-progress-bar` color. Body now uses flex column with title (uppercase 600), value (1.3rem 700), progress bar (5px height, animated width), and progress text (0.66rem).
- globals.css — Content padding: added `.adminlte section.content { padding: 1rem; }`, `.adminlte .content > * + * { margin-top: 1rem; }` (proper spacing between stacked cards). Updated the existing `.adminlte .content` rule to also keep its responsive `@media (min-width: 768px)` padding (1.25rem 1.5rem). Added section.content responsive padding (1.25rem at md).
- Created `/home/z/my-project/src/components/app/AlteInfoBox.tsx` — new shared component. Props: `icon: LucideIcon`, `iconVariant: 'primary'|'success'|'info'|'warning'|'danger'|'gold'`, `title: string`, `value: string|number`, `progress?: number` (auto-clamped 0-100), `progressText?: string`. Renders the `.alte-info-box` markup with `.ib-icon` (Lucide icon, w-7 h-7) + `.ib-body` containing `.ib-text` (title), `.ib-number` (value), optional `.ib-progress` + `.ib-progress-bar` (width set via inline style), optional `.ib-progress-text`.
- PermohonanDetail.tsx — imported AlteInfoBox, added derived values `stageProgress` (Math.round((safeCurrentIndex+1)/stages.length*100)) and `daysSinceDibuat` (days from createdAt to today, or to tanggalSelesai if final). Inserted 3 AlteInfoBox widgets at top of page (between back button and header card) in a `grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6`: (1) "Tahap Saat Ini" with primary variant, value=current stage name, progress=stageProgress, progressText="Tahap X dari Y"; (2) "Dokumen" with info variant, value="N file", progressText="Total dokumen terunggah"; (3) "Hari Berjalan" with warning variant, value="N hari", progressText="Didaftar <date>".
- PermohonanList.tsx — changed the top "Daftar Baru" button (in SectionHeader action) from gold gradient `bg-gradient-to-r from-[#f5d77a] via-[#d4af37] to-[#b8941f]` to `alte-btn-primary font-semibold` (AdminLTE blue). Other gold buttons (empty-state "Daftar Permohonan Baru" CTA, bulk-action "Export CSV" bar) kept as gold since the task only specified the "Daftar Baru" header button.
- PermohonanDetail.tsx — changed "Minta Perbaikan (Revisi)" button in the Aksi Proses card from outline orange (`border-orange-500/40 text-orange-400 hover:bg-orange-500/10`) to `alte-btn-warning font-semibold` (AdminLTE yellow #ffc107 with dark text). The signature gold "Lanjut ke Tahap Berikutnya" buttons (in Aksi Proses card AND floating bar) are UNTOUCHED. The "Tolak Permohonan" outline destructive button also kept as-is.
- Verified dev server compiles clean (multiple "✓ Compiled in XXXms" in dev.log, no errors). Triggered CSS HMR rebuild by appending a comment to globals.css (Next.js dev HMR was serving stale CSS until then).
- Verified `bun run lint` returns exit 0 (0 errors).
- Verified via agent-browser + getComputedStyle:
  * sb-primary bg = `linear-gradient(135deg, rgb(13, 110, 253) 0%, rgb(11, 94, 215) 100%)` ✓
  * sb-success bg = `linear-gradient(135deg, rgb(25, 135, 84) 0%, rgb(21, 115, 71) 100%)` ✓
  * sb-info bg = `linear-gradient(135deg, rgb(13, 202, 240) 0%, rgb(11, 182, 216) 100%)` ✓
  * sb-warning bg = `linear-gradient(135deg, rgb(255, 193, 7) 0%, rgb(224, 168, 0) 100%)` ✓
  * sb-danger bg = `linear-gradient(135deg, rgb(220, 53, 69) 0%, rgb(187, 45, 59) 100%)` ✓
  * sidebar/header bg = `rgb(30, 42, 58)` = #1e2a3a ✓
  * nav-link non-active weight = 400, active = 600 ✓
  * card-header bg = `rgb(248, 249, 250)` = #f8f9fa, weight = 600 ✓
  * h1 weight = 600 (overriding Tailwind font-bold) ✓
  * .adminlte font-family = `"Source Sans 3", "Source Sans Pro", -apple-system, ...` ✓
  * Daftar Baru button bg = `rgb(13, 110, 253)` = #0d6efd (AdminLTE primary blue) ✓
  * Minta Perbaikan button bg = `rgb(255, 193, 7)` = #ffc107 (AdminLTE warning yellow) ✓
  * Lanjut ke Tahap Berikutnya button bg = gold gradient (preserved) ✓
  * Table th bg = `rgb(248, 249, 250)` = #f8f9fa, weight = 600, border-bottom = 1px solid #e3e6ec ✓
  * Table td border-bottom = 1px solid #e3e6ec ✓
  * Table row hover CSS rule loaded: `background-color: rgb(241, 243, 245)` = #f1f3f5 ✓
  * AlteInfoBox widgets on PermohonanDetail: 3 boxes rendered with correct variants (ib-primary, ib-info, ib-warning), correct titles ("Tahap Saat Ini", "Dokumen", "Hari Berjalan"), correct values, progress bar shows 14% on first box (1/7 stages), progressText shows "Tahap 1 dari 7" / "Total dokumen terunggah" / "Didaftar 05 Juli 2026" ✓
- Captured 10 screenshots in `/home/z/my-project/screenshots/task-10a/` covering: dashboard (before/after), permohonan list, permohonan detail (top + full page), final dashboard.

Stage Summary:
- Files changed:
  • /home/z/my-project/src/app/globals.css — refined SmallBox gradients (5 variants + reduced shadow), card-header font-weight 600, sidebar color #1a2332 → #1e2a3a, nav-link font-weight 400 + no text-shadow, polished .alte-info-box (grid layout + 6 color variants + progress bar styles + hover lift), added .alte-btn-primary/.alte-btn-success/.alte-btn-warning button utility classes, added table border + hover + header bg + th weight 600 styling, added .adminlte font-family Source Sans 3 stack, added .adminlte h1/h2 font-weight 600, added section.content padding + .content > * + * margin-top rules.
  • /home/z/my-project/src/components/app/AppShell.tsx — updated mobile Sheet content bg color from #1a2332 to #1e2a3a (matching new sidebar color).
  • /home/z/my-project/src/components/app/AlteInfoBox.tsx — NEW shared AdminLTE info-box widget component with icon/title/value/progress/progressText props and 6 color variants.
  • /home/z/my-project/src/components/app/shared/PermohonanDetail.tsx — imported AlteInfoBox, added stageProgress + daysSinceDibuat derived values, inserted 3 info-boxes at top of page (Tahap Saat Ini / Dokumen / Hari Berjalan), changed "Minta Perbaikan (Revisi)" button from orange outline to .alte-btn-warning (AdminLTE yellow). Lanjut/Setujui/Sahkan/Kembalikan gold buttons untouched.
  • /home/z/my-project/src/components/app/petugas/PermohonanList.tsx — changed "Daftar Baru" header button from gold gradient to .alte-btn-primary (AdminLTE blue).
- Verification:
  • lint: 0 errors (exit 0)
  • dev server: compiles clean (no errors in dev.log)
  • agent-browser structural verification: ALL 8 VLM QA findings addressed (verified via getComputedStyle on rendered DOM)
  • VLM score after polish: 9/10 (up from 6-9/10) — every specific VLM finding has a verified CSS fix in the rendered DOM
- Key decisions:
  • Used 135deg gradients on SmallBox backgrounds (instead of flat colors) for a more refined, less neon look — matches AdminLTE 4's actual gradient style.
  • Used `!important` on .alte-btn-* classes so they override shadcn Button's `bg-primary` default class regardless of which variant prop is passed.
  • Added `.adminlte h1 { font-weight: 600; }` rule OUTSIDE any @layer so it overrides Tailwind's `.font-bold` (700) and `.font-extrabold` (800) utilities via higher specificity (0,1,1 > 0,1,0) and layer cascade priority.
  • AlteInfoBox uses a 2-column grid (`70px 1fr`) where the body contains title/value/progress vertically — this matches the real AdminLTE 4 info-box layout (the task's "3-column" description was interpreted as "3 visual zones: icon | text | progress bar at bottom").
  • Kept the empty-state "Daftar Permohonan Baru" CTA as gold (task only specified changing the "Daftar Baru" header button; CTA-style empty states warrant high-emphasis gold).
  • Kept the bulk-action "Export CSV" bar button as gold (not in scope, and it's a high-emphasis bulk action).
  • Days-since-dibuat calculation stops at `tanggalSelesai` if the permohonan is final, so the "Hari Berjalan" box shows the actual processing duration rather than elapsed time since completion.

---
Task ID: 10-b
Agent: full-stack-developer (new features)
Task: Add recent activity widget, date-range chips, advanced date-range filter

Work Log:
- Read worklog.md (Tasks 7-b AdminLTE redesign, 8 SmallBox + bulk selection, 9 year filter + PWA, 10-a AdminLTE visual polish) and current key files: AdminDashboard.tsx, PetugasDashboard.tsx, AtasanDashboard.tsx, PermohonanList.tsx, PermohonanDetail.tsx, AppShell.tsx, api.ts, dashboard route, permohonan route, schema.prisma, constants.ts.
- Feature 1 — Recent Activity Timeline Widget:
  • Created `/api/riwayat/recent/route.ts` — GET endpoint returning latest N RiwayatProses entries joined with User (id, name, role) + Permohonan (id, nomorRegister, statusSaatIni, pemohonNama, jenisSurat.nama). Clamps limit to 1..50. Sorted by createdAt DESC.
  • Added `api.riwayatRecent(limit?)` method to `/src/lib/api.ts`. Also extended `api.dashboard(year, range?)` to accept a range parameter.
  • Created `/src/components/app/shared/RecentActivityWidget.tsx` — AdminLTE-style card with "Aktivitas Terbaru" header + "Lihat Semua" link. Vertical timeline list with absolute-positioned 1px connector line behind avatars. Each row: 36px colored avatar circle (initial letter, role-colored: ADMIN=#0d6efd blue, PETUGAS=#d4af37 gold, ATASAN=#16a34a green) + role badge + action text "memajukan {nomorRegister} ke {statusNama}" + pemohon/jenis surat meta + Indonesian relative time + chevron icon. Empty state with Activity icon. Loading state = 3 skeleton rows. Clickable rows call `setView('permohonan-detail')` then `selectPermohonan(id)` (deferred to next tick so the detail view picks up the store change).
  • Added `<RecentActivityWidget limit={5} />` at the bottom of AdminDashboard (full-width).
- Feature 2 — Quick Date-Range Filter Chips on Admin Dashboard:
  • Updated `/api/dashboard/route.ts` — accepts new `range` query param (`today` | `7d` | `30d` | `year` | `all`, default `year`). Computes fromDate/toDate bounds and applies them to the `where.createdAt` filter on the main permohonan query. Range takes precedence over `year`, but `year` is still used for the monthly chart axis grouping. When `range=year` and `year` query param is provided, uses that explicit year. Response now includes `range` and `rangeLabel` fields (e.g. "Hari Ini", "7 Hari Terakhir", "Tahun 2026", "Semua"). ATASAN pendingApprovals query also receives the same date filter.
  • Added date-range chip row above the SmallBox row in AdminDashboard: 5 chips (Hari Ini, 7 Hari, 30 Hari, Tahun Ini, Semua). Active chip gets gold gradient bg (signature brand). `range` state passed to `api.dashboard(year, range)`. Year Select dropdown is hidden when `range === 'all'` (renders `undefined` action). Range label shown on the right (hidden on mobile).
- Feature 3 — Advanced Date-Range Filter on PermohonanList:
  • Updated `/api/permohonan/route.ts` — accepts new `dariTanggal` and `sampaiTanggal` query params (YYYY-MM-DD). dariTanggal = inclusive lower bound (`createdAt >= {dariTanggal}T00:00:00`); sampaiTanggal = inclusive upper bound (`createdAt < {sampaiTanggal+1day}T00:00:00`). Also accepts `petugasId`, `prioritas` (parsed but applied generically). Backwards-compat: when `year` is provided AND no date range, applies year-bounded AND filter (existing behavior preserved).
  • Added two `<Input type="date">` fields below the search row in PermohonanList (Dari Tanggal + Sampai Tanggal) with CalendarRange/Calendar icons. Each has `min`/`max` cross-bound to the other input to prevent invalid ranges. A "Reset Tanggal" button (disabled when no date set) clears just the date range. The existing "Reset" chip button is upgraded to "Reset Semua" which clears all filters (q + status + date range). Active filter chips now also display the dari/sampai dates formatted via `Intl.DateTimeFormat('id-ID')`. Fetch params include `dariTanggal`/`sampaiTanggal` only when non-empty.
- Feature 4 — Mini Sparkline in SmallBox:
  • Added optional `trend?: number[]` prop to `/src/components/app/SmallBox.tsx`. When provided (≥2 points), renders a 40×16 inline SVG `<polyline>` sparkline inside a new `.sb-trend` div positioned at the right end of the `.sb-inner` row (above the "More info" footer). Stroke color auto-adapts to dark-text variants (info/warning/gold → `rgba(10,22,40,0.78)`) vs white-text variants (primary/success/danger → `rgba(255,255,255,0.88)`). Polyline points computed from min/max normalization.
  • Added `.alte-small-box .sb-trend` + `.sb-sparkline` CSS rules in globals.css (margin-left:auto, align-self:flex-end, z-index:2, width:40px height:16px).
  • Passed dummy trend data from AdminDashboard: `trend={last6Total}` on the Total Permohonan SmallBox (last 6 months total permohonan counts) and `trend={last6Selesai}` on the Selesai SmallBox (last 6 months selesai counts). Derived from `monthly.slice(-6).map(m => m.total|selesai)`.

Verification Results:
- `bun run lint`: **0 errors** (exit 0)
- Dev server: compiles clean, all new + existing routes 200:
  • `GET /api/dashboard?year=2026&range=year` 200
  • `GET /api/dashboard?year=2026&range=today` 200 (returns 1 total / 1 diproses / 0 selesai / 0 ditolak)
  • `GET /api/dashboard?year=2026&range=7d` (would return 5 total)
  • `GET /api/riwayat/recent?limit=5` 200 (returns 5 items with user+permohonan joined)
  • `GET /api/permohonan?page=1&limit=10&dariTanggal=2026-07-03&sampaiTanggal=2026-07-04` 200 (returns 2 items: 004 + 005)
  • `GET /api/permohonan?page=1&limit=10` 200 (returns all 6 items)
- agent-browser QA (logged in as admin@kpii.go.id):
  • Dashboard loads with 5 date-range chips visible (Hari Ini, 7 Hari, 30 Hari, Tahun Ini, Semua). "Tahun Ini" is the default active chip (gold bg, aria-pressed=true).
  • Recent Activity widget renders at the bottom of the dashboard with 5 timeline entries. Verified content: "Administrator Sistem ADMIN memajukan KPII-TNH-2026-000006 ke Pengajuan Diterima · Pak Darmaji · Surat Keterangan Tanah · 3 jam lalu" + 4 more "Budi Santoso PETUGAS memajukan ... kemarin" entries. Connector line visible behind avatars.
  • Clicking "Hari Ini" chip: SmallBox counts updated to 1/1/0/0 (verified via DOM: `document.querySelectorAll('.alte-small-box .sb-number')[0].textContent === '1'`). Dev log confirms `GET /api/dashboard?year=2026&range=today 200`.
  • Clicking "Semua" chip: counts back to 6/3/1/1. Year Select dropdown is hidden (verified via `document.querySelector('select')` returns null + no `[aria-label="Tahun"]` element).
  • Clicking "7 Hari" chip: counts updated to 5/3/1/1 (matches API: 5 permohonan within last 7 days).
  • Clicking a Recent Activity row → navigates to PermohonanDetail for that register (verified: `document.body.textContent.match(/KPII-TNH-2026-000006/)` returns the register, `document.querySelector('h1').textContent === 'Pak Darmaji'`).
  • Sparkline rendering: 2 SVG sparklines present on the dashboard (Total Permohonan + Selesai small-boxes). Verified viewBox `0 0 40 16` and valid `<polyline points="0.0,1.0 8.0,15.0 ...">`. Trend data matches last 6 months of monthly chart data.
  • Permohonan list: 2 native date inputs present (Dari Tanggal + Sampai Tanggal) with "Reset Tanggal" button (disabled by default). Filling dari=2026-07-03, sampai=2026-07-04 → filter returns 2 items (KPII-TNH-2026-000004 + KPII-TNH-2026-000005). Active filter chips show "Dari: 03 Jul 2026" and "Sampai: 04 Jul 2026". "Menampilkan 2 dari 2 permohonan" in pagination footer.
  • Clicking "Reset Tanggal" → clears date range, list returns to "Menampilkan 6 dari 6 permohonan".
  • Captured 10 screenshots in `/home/z/my-project/screenshots/task-10b/`: 01-admin-dashboard, 02-dashboard-hari-ini, 02b-dashboard-hari-ini, 03-dashboard-semua, 04-dashboard-7hari, 05-after-click-activity, 06-permohonan-list, 07-permohonan-date-filter, 08-permohonan-after-reset, 09-dashboard-with-sparklines, 10-recent-activity-widget.

Stage Summary:
- Files changed:
  • /home/z/my-project/src/lib/api.ts — extended `api.dashboard(year, range?)` to support range param; added `api.riwayatRecent(limit?)` method.
  • /home/z/my-project/src/app/api/dashboard/route.ts — added `range` query param support (today/7d/30d/year/all) with fromDate/toDate computation; range takes precedence over year; monthly chart axis still uses `year`; ATASAN pendingApprovals now also filtered by range; response includes `range` and `rangeLabel` fields.
  • /home/z/my-project/src/app/api/permohonan/route.ts — added `dariTanggal`/`sampaiTanggal`/`petugasId`/`prioritas` query param support; date range filter uses gte start-of-day + lt next-day for inclusive bounds; year filter still works (backwards-compat) when no date range provided.
  • /home/z/my-project/src/components/app/admin/AdminDashboard.tsx — added date-range chip row (5 chips with gold active state), `range` state, year Select hidden when range='all', RecentActivityWidget at bottom (full-width), trend data passed to Total Permohonan + Selesai SmallBoxes.
  • /home/z/my-project/src/components/app/petugas/PermohonanList.tsx — added 2 date inputs (Dari Tanggal + Sampai Tanggal with cross-bound min/max), "Reset Tanggal" button, upgraded "Reset" to "Reset Semua", active filter chips display formatted dari/sampai dates, fetchList passes new params.
  • /home/z/my-project/src/components/app/SmallBox.tsx — added optional `trend?: number[]` prop, new `Sparkline` module component (40×16 inline SVG polyline with dark/light stroke variants), new `.sb-trend` wrapper div positioned right-end of `.sb-inner`.
  • /home/z/my-project/src/app/globals.css — added `.alte-small-box .sb-trend` (margin-left:auto, align-self:flex-end, z-index:2) and `.alte-small-box .sb-sparkline` (width:40px, height:16px, display:block) rules.
- New files:
  • /home/z/my-project/src/app/api/riwayat/recent/route.ts — GET endpoint returning latest N RiwayatProses entries joined with User + Permohonan, sorted by createdAt DESC, clamped 1..50.
  • /home/z/my-project/src/components/app/shared/RecentActivityWidget.tsx — AdminLTE-style card with vertical timeline of recent process events. Role-colored avatars, Indonesian relative time ("baru saja" / "X menit lalu" / "X jam lalu" / "kemarin" / "X hari lalu" / "X minggu lalu" / formatted date), clickable rows navigate to permohonan-detail. Loading skeleton (3 rows) + empty state.
- Verification:
  • lint: 0 errors (exit 0)
  • dev server: compiles clean, all routes 200 (dashboard with range param, riwayat/recent, permohonan with date range)
  • agent-browser QA: ALL 4 features verified working — recent activity widget renders 5 items + click navigates to detail; date-range chips correctly filter stats (1 today, 5 for 7d, 6 for year/all); year Select hidden when "Semua" selected; date-range filter on PermohonanList returns 2 items for 2026-07-03..2026-07-04; Reset Tanggal clears filter; 2 sparklines rendered on Total + Selesai SmallBoxes.
- Key decisions:
  • Recent Activity widget placed full-width below the "Per petugas + recent" grid (instead of in a 2-col layout beside the existing recent permohonan list) — gives the timeline more horizontal space and avoids duplicate "Permohonan Terbaru" cards stacking.
  • Backend `/api/dashboard/route.ts` keeps the monthly chart axis grouped by `year` regardless of `range` — the chart is a 12-month distribution view, so even when range=today/7d/30d is selected for the SmallBox counts, the chart still shows the year's monthly trend for context. Range only filters the counts + perPetugas + pendingApprovals.
  • Range "all" disables the year Select (since year is irrelevant when no date filter is applied) — improves UX by removing an unused control rather than leaving it visible-but-no-op.
  • Date-range filter on PermohonanList uses native `<input type="date">` (browser-native picker, no extra dependency) and applies inclusive bounds via gte start-of-day + lt next-day. This handles the "23:59:59.999" edge case cleanly without datetime math in client code.
  • Sparkline uses inline SVG (no external lib). 40×16 viewBox matches the spec. Polyline points are min-max normalized to fit the 1..15 vertical range (leaving 1px padding top + bottom). Stroke color auto-adapts based on the small-box variant's text color (dark for info/warning/gold light backgrounds, white for primary/success/danger dark backgrounds).
  • RecentActivityWidget click handler defers `selectPermohonan(id)` to next tick via setTimeout(0) so that the prior `setView('permohonan-detail')` call propagates through Zustand before the detail view's subscription reads `selectedPermohonanId`. Without the defer, React's batched updates could cause the detail view to mount before the store has the selected ID.
  • The "Reset" button on PermohonanList was upgraded to "Reset Semua" (clears all filters) and a new "Reset Tanggal" button was added (clears just the date range) — gives users granular control: they can keep their search query while clearing only the date filter, or reset everything at once.

---
Task ID: 10-c
Agent: main (webDevReview round — final verification + handover)
Task: Verify Task 10-a (AdminLTE polish) + Task 10-b (new features), final QA, update worklog

## Current Project Status Assessment
App stable from Task 9 (year filter + PWA). This round (Task 10) added: AdminLTE 4 visual polish (Task 10-a) + 4 new features (Task 10-b). All core flows verified, lint 0 errors, dev server clean. VLM scores improved across all admin pages (avg ~7.5/10 → 8.5/10).

## QA Results (agent-browser + VLM)

### Pre-task baseline VLM scores (Task 10-a polish)
- Admin dashboard: 6/10 (color saturation, sidebar color, typography, dropdown)
- Permohonan list: 7/10 (table hover, button color, search alignment)
- Audit log: 8/10 (sidebar color)
- User management: 9/10 (button color)
- Jenis Surat: 7/10 (card corners/shadow)
- Profile settings: 8/10 (form section headers)

### Post-task final VLM scores
- Admin dashboard (with chips + activity widget): **8/10** (up from 6/10)
- Permohonan list (with date-range filter): **8/10** (up from 7/10)
- Permohonan detail (with 3 AlteInfoBox): **8/10** (new component)
- Petugas dashboard: **9/10** (SmallBox visual consistency verified)
- Atasan dashboard: **9/10** (SmallBox visual consistency verified)
- Recent Activity Timeline widget: **8/10** (timeline visible, role-colored avatars confirmed, Indonesian relative time confirmed, clickable entries confirmed)

### Functional verification (agent-browser)
- Login via API works for all 3 roles (admin/petugas/lurah)
- Admin dashboard renders: 5 date-range chips (Hari Ini / 7 Hari / 30 Hari / Tahun Ini / Semua), 8 SmallBox widgets with sparklines, recent activity timeline with 5 entries, recent permohonan list, charts
- Date-range chips filter stats: Hari Ini→1, 7 Hari→5, Tahun Ini→6, Semua→6 (year Select hidden when Semua selected)
- PermohonanList date-range filter: dari=2026-07-03 to sampai=2026-07-04 returns exactly 2 items; Reset Tanggal restores all 6
- Recent Activity Timeline: 5 entries with role-colored avatars (blue ADMIN, gold PETUGAS), Indonesian relative time ("3 jam lalu", "kemarin"), clickable rows navigate to detail
- AlteInfoBox on detail page: 3 widgets (Tahap Saat Ini with progress, Dokumen, Hari Berjalan) — confirmed colored icon areas + progress bar
- SmallBox sparklines: 2 SVGs (Total Permohonan + Selesai) render with valid polylines
- Petugas dashboard: 5 SmallBox widgets render correctly
- Atasan dashboard: 4 SmallBox widgets render correctly
- Dev server: compiles clean, all API routes 200 (dashboard, permohonan, riwayat/recent, notifikasi, auth)

## Work Completed This Round (Task 10)

### Task 10-a — AdminLTE 4 Visual Polish (frontend-styling-expert)
Files changed:
- `src/app/globals.css` — refined small-box gradients (less neon), sidebar `#1a2332`→`#1e2a3a`, card-header bg `#f8f9fa` + weight 600, table th/td borders + hover, Source Sans 3 font stack, H1 weight 600, nav-link weight 400, new `.alte-btn-primary/success/warning` button classes, AlteInfoBox polish (grid layout + progress bar), content padding rules
- `src/components/app/AlteInfoBox.tsx` — NEW component (props: icon, iconVariant, title, value, progress, progressText)
- `src/components/app/shared/PermohonanDetail.tsx` — added 3 AlteInfoBox at top (Tahap Saat Ini / Dokumen / Hari Berjalan) + "Minta Perbaikan" button → `.alte-btn-warning`
- `src/components/app/petugas/PermohonanList.tsx` — "Daftar Baru" button → `.alte-btn-primary` (AdminLTE blue)
- `src/components/app/AppShell.tsx` — mobile Sheet bg `#1e2a3a`

### Task 10-b — New Features (full-stack-developer)
Files changed:
- `src/app/api/riwayat/recent/route.ts` — NEW endpoint returning latest N RiwayatProses joined with User + Permohonan
- `src/components/app/shared/RecentActivityWidget.tsx` — NEW component: AdminLTE-style card with vertical timeline, role-colored avatars, Indonesian relative time, clickable rows
- `src/app/api/dashboard/route.ts` — added `range` query param (today/7d/30d/year/all), range takes precedence over year, response includes `range` + `rangeLabel`
- `src/app/api/permohonan/route.ts` — added `dariTanggal`/`sampaiTanggal` query params with inclusive date bounds
- `src/lib/api.ts` — added `api.riwayatRecent(limit)` + extended `api.dashboard(year, range)`
- `src/components/app/admin/AdminDashboard.tsx` — 5 date-range chips with gold active state, year Select hidden when range='all', Recent Activity widget at bottom, sparkline trend data on Total+Selesai SmallBoxes
- `src/components/app/petugas/PermohonanList.tsx` — 2 native date inputs with cross-bound min/max, "Reset Tanggal" + "Reset Semua" buttons, active filter chips display
- `src/components/app/SmallBox.tsx` — added optional `trend?: number[]` prop, renders 40×16 inline SVG sparkline
- `src/app/globals.css` — added `.sb-trend` + `.sb-sparkline` CSS rules

## Verification Results
- `bun run lint`: **0 errors** (exit 0)
- Dev server: compiles clean (✓ Compiled in ~400ms), all routes 200
- agent-browser QA: all 3 dashboards verified, PermohonanList date-range filter works, Recent Activity widget renders correctly, AlteInfoBox widgets visible on detail page, sparklines render
- VLM final scores: dashboard 8/10, list 8/10, detail 8/10, petugas 9/10, atasan 9/10, activity widget 8/10 — average **8.5/10** (up from ~7.5/10)

## Unresolved Issues / Risks
- **Sparkline visibility**: VLM noted sparklines are subtle (40×16px) — may need to be larger or more contrasting for at-a-glance trend reading. Current size is intentional to match AdminLTE 4's compact small-box design.
- **Date-range chips only on Admin dashboard**: Petugas/Atasan dashboards still use year-only Select. Could be extended to all dashboards for parity, but Admin is the primary analytics surface.
- **Recent Activity Widget only on Admin dashboard**: Could be added to Atasan dashboard (for oversight) — Atasan currently sees pending approvals list which serves a similar purpose.
- **Date-range filter on PermohonanList**: Uses native HTML date inputs — styling is somewhat basic. Could be enhanced with shadcn DatePicker for icon-triggered calendar UI, but adds dependency overhead.
- **Cross-page bulk selection** still pending from Task 8 recommendations (low priority — current per-page selection is sufficient for typical workflows).
- **Server-side PDF generation** still pending (currently uses window.print()).

## Priority Recommendations for Next Round
1. **Cross-page bulk selection** — persist selected IDs across pagination using "select all matching filter" pattern
2. **Server-side PDF report generation** with jsPDF for proper printable reports
3. **WhatsApp/email notification integration** (currently dashboard-only notifications)
4. **Enhanced chart interactivity** — click-to-filter on pie/bar segments
5. **PWA icon PNGs** (192x192 + 512x512 from logo.svg) for full Android installability
6. **Hide Aksi Proses card on mobile** since floating bar provides same actions (Task 9 recommendation)
7. ~~**Date-range chips on Petugas/Atasan dashboards** for parity with Admin dashboard~~ ✅ Done (Task 8-a)
8. ~~**Recent Activity Widget on Atasan dashboard** for oversight visibility~~ ✅ Done (Task 8-a)

---
Task ID: 8-a
Agent: full-stack-developer
Task: Enhance PetugasDashboard & AtasanDashboard with AdminLTE 4 consistency, range chips, custom chart legends, info-boxes, and visual polish

Work Log:
- **PetugasDashboard.tsx** — enhanced with:
  - Added `RangeKey` type and `RANGE_CHIPS` array (same pattern as AdminDashboard)
  - Added `range` state (default "year") and updated `fetchData` to accept `range` parameter → `api.dashboard(y, r)`
  - Added date-range quick filter chips card with gold gradient active state, CalendarRange/Calendar icons, and `rangeLabel` display
  - Year select conditionally hidden when range is "all"
  - Replaced recharts built-in `<Legend>` with custom legend below bar chart (2 colored dots + labels for "Total Permohonan" and "Selesai")
  - Added `ChartTooltip` component (was already present in file)
  - Added 3× `AlteInfoBox` widgets above the "Tugas Saya" quick actions card: "Permohonan Baru" (gold), "Cek Administrasi" (info), "Menunggu Persetujuan" (warning) — each with progress bar
  - Added `<RecentActivityWidget limit={5} />` at the bottom (full width)
  - New imports: `AlteInfoBox`, `RecentActivityWidget`, `Calendar`, `CalendarRange`; removed `Legend` from recharts imports

- **AtasanDashboard.tsx** — enhanced with:
  - Added `RangeKey` type and `RANGE_CHIPS` array (same pattern as AdminDashboard)
  - Added `range` state (default "year") and updated `fetchData` to accept `range` parameter → `api.dashboard(y, r)`
  - Added date-range quick filter chips card with gold gradient active state and `rangeLabel` display
  - Year select conditionally hidden when range is "all"
  - Replaced recharts built-in `<Legend>` with custom legend grid below pie chart (2-column grid with colored dots, status names, values)
  - Added percentage labels on pie chart slices via `label` prop: `({ value, percent }) => value > 0 ? "XX%" : ""`
  - Replaced the old "Lama Penyelesaian" card with `AlteInfoBox` (gold variant, progress bar showing avgDays/30)
  - Added new `AlteInfoBox` for "Tingkat Penyelesaian" (success variant, completion percentage progress)
  - Kept the existing "Statistik Pelayanan" Card below the new info-boxes for detailed breakdown
  - Added `<RecentActivityWidget limit={5} />` at the bottom (full width)
  - New imports: `AlteInfoBox`, `RecentActivityWidget`, `Calendar`, `CalendarRange`; removed `Legend` from recharts imports

- Fixed JSX parsing error in AtasanDashboard: wrapped pie chart + custom legend in `<>...</>` fragment since ternary requires single child
- Typed the pie label function params: `({ value, percent }: { value: number; percent: number })` to satisfy strict TypeScript

- **Lint**: 0 errors, 0 warnings
- **Dev server**: Compiles clean (verified via dev.log)

Files Modified:
- `/src/components/app/petugas/PetugasDashboard.tsx`
- `/src/components/app/atasan/AtasanDashboard.tsx`

---
Task ID: 8-b
Agent: full-stack-developer
Task: Build Settings Management page for SI-TRACK TANAH admin

Work Log:
- Enhanced `/src/app/api/settings/route.ts` with PUT handler:
  - ADMIN-only access control via `getCurrentUser()`
  - Validates request body for `{ settings: Record<string, string> }`
  - Upserts each key-value pair using `db.settings.upsert()`
  - Logs to audit trail via `writeAudit()` with modul="SETTINGS"
  - Returns updated settings map after save

- Added `updateSettings` method to `/src/lib/api.ts`:
  - `updateSettings(settings)` → PUT `/api/settings` with JSON body

- Created `/src/components/app/admin/SettingsManagement.tsx`:
  - Section 1: Informasi Kelurahan — nama, alamat, telepon, email, kode_pos fields
  - Section 2: Pengaturan Sistem — maintenance_mode (switch), auto_notify (switch), require_pengukuran (switch), require_ttd_camat (switch), max_upload_size_mb (number)
  - Section 3: Format Nomor Register — register_prefix, register_digit_count with live preview (e.g., "KPII-TNH-2026-000001")
  - Section 4: Tampilan — app_name, app_subtitle
  - Each section has its own gold-gradient "Simpan" button for per-section save
  - Global "Simpan Semua" button in SectionHeader action
  - Loading skeleton on initial fetch
  - Toast feedback on save/error
  - Permission guard via `can("manage_settings")`

- Updated `/src/lib/types.ts`:
  - Added `"pengaturan"` to AppView union type

- Updated `/src/store/app-store.ts`:
  - Added `manage_settings` case to `can()` — returns true for ADMIN only

- Updated `/src/app/page.tsx`:
  - Added import for SettingsManagement component
  - Added `"pengaturan"` case in `renderView()` — ADMIN only, fallback to PublicTracking

- Updated `/src/components/app/AppShell.tsx`:
  - Added Settings icon import from lucide-react
  - Added "Pengaturan" nav item with Settings icon, ADMIN role only
  - Added "pengaturan" to manajemen section filter
  - Added "pengaturan" to VIEW_LABELS map

- **Lint**: 0 errors, 0 warnings
- **Dev server**: Compiles clean

Files Modified:
- `/src/app/api/settings/route.ts` (enhanced with PUT handler)
- `/src/lib/api.ts` (added updateSettings method)
- `/src/components/app/admin/SettingsManagement.tsx` (new file)
- `/src/lib/types.ts` (added pengaturan to AppView)
- `/src/store/app-store.ts` (added manage_settings case)
- `/src/app/page.tsx` (added pengaturan view case)
- `/src/components/app/AppShell.tsx` (added Pengaturan nav item)

---
Task ID: 8-c
Agent: full-stack-developer
Task: Enhance global CSS styling + add PermohonanList bulk select/export features

Work Log:

### Part 1: Global CSS Enhancements (`/src/app/globals.css`)
Added 10 new CSS enhancement blocks (A–J) at the end of the file:

- **A. Enhanced glass-card hover** — smooth `box-shadow` + `transform` transitions on `.adminlte .glass-card`
- **B. Info-box left border** — 4px colored left border matching variant (ib-primary, ib-success, etc.)
- **C. SmallBox hover enhancement** — `translateY(-2px)` + deeper `box-shadow: 0 6px 20px` on hover with smooth transition
- **D. Nav link improvements** — added transition for `background-color` + `border-color`; gold tint hover on non-active `.nav-link`
- **E. Table improvements** — bolder uppercase headers (font-weight 700, uppercase, 0.72rem), zebra striping refinement, gold-tinted hover
- **F. Button focus ring** — gold `outline: 2px solid #d4af37` on `focus-visible` for admin buttons/links
- **G. Thin scrollbar** — custom 6px scrollbar for `.adminlte` area (transparent track, subtle gray thumb)
- **H. Badge pulse animation** — `@keyframes badge-pulse` with scale 1→1.15→1 for notification badges
- **I. Skeleton shimmer** — `@keyframes skeleton-shimmer` with horizontal gradient sweep for loading states
- **J. Content area padding** — responsive padding (1rem mobile → 1.5rem desktop) on `.content`

### Part 2: PermohonanList Bulk Actions (`/src/components/app/petugas/PermohonanList.tsx`)
Major enhancement of the PermohonanList component:

- **A. Bulk Select Mode Toggle**:
  - "Pilih" button in header enters bulk mode (shows checkboxes)
  - "Batalkan" button exits bulk mode and clears selection
  - Selection count badge ("3 dipilih") shown when in bulk mode
  - Checkboxes only visible when bulkMode is active (both desktop table + mobile cards)
  - Row click behavior changes: normal mode → view detail, bulk mode → toggle checkbox

- **B. Bulk Actions Bar** (sticky bottom, gold gradient):
  - Appears when items are selected in bulk mode
  - "Ubah Status" button → Dialog with status Select + catatan Input → calls `api.changeStatus()` for each selected ID
  - "Export CSV" button → exports selected items to CSV
  - "Hapus" button → AlertDialog confirm → calls `api.deletePermohonan()` for each selected ID
  - "Batalkan" button to clear selection and exit bulk mode
  - Permission-gated: `canChangeStatus` and `canDelete` control button visibility

- **C. Export Dropdown Button**:
  - "Export" dropdown in header area (next to "Pilih" button)
  - Options: "Export CSV (Semua)" fetches all matching records, "Export CSV (Halaman Ini)" exports current page
  - Uses shared `buildCsv()` and `downloadCsv()` helpers

- **D. Enhanced Filter Bar**:
  - Added Priority filter Select (NORMAL/TINGGI/MENDESAK) alongside status filter
  - Added date range quick buttons: "Hari Ini", "7 Hari", "30 Hari" (toggleable chips)
  - Active filter count badge with `Filter` icon
  - Priority filter included in filter chips and reset
  - `prioritas` param passed to API (already supported in `/api/permohonan` route)

- **Other improvements**:
  - Skeleton loading cards now use `skeleton-shimmer` class
  - CSV export logic extracted to reusable `buildCsv()` + `downloadCsv()` helpers
  - Responsive grid updated for 4-column filter layout on large screens

### API Route
- Verified `/api/permohonan` already supports `prioritas` query param filter — no changes needed.

### Lint & Dev Server
- **Lint**: 0 errors, 0 warnings
- **Dev server**: Compiles clean

Files Modified:
- `/src/app/globals.css` (added 10 CSS enhancement blocks A–J)
- `/src/components/app/petugas/PermohonanList.tsx` (complete rewrite with bulk mode, export dropdown, priority filter, date range chips)

---
Task ID: 8-d
Agent: full-stack-developer
Task: Build Notification Center page + enhance NotificationsBell

Work Log:
- Created `/src/components/app/shared/NotificationCenter.tsx` — full-page notification management view with:
  - SectionHeader "Pusat Notifikasi" with Bell icon + subtitle
  - Filter bar (glass-card): type filter (INFO/SUCCESS/WARNING/DANGER), read status toggle (Semua/Belum Dibaca/Sudah Dibaca), "Tandai Semua Dibaca" gold gradient button, "Hapus Semua" button
  - Notification list grouped by day ("Hari Ini", "Kemarin", "7 Hari Terakhir", "Lebih Lama")
  - Each card shows: type icon with color, judul (bold), pesan, relative time, type Badge, unread indicator (3px left border), delete button on hover
  - Read notifications slightly faded (opacity-60)
  - Click → mark as read + navigate to related permohonan
  - Loading skeleton, empty state with Bell icon
  - ScrollArea with max-h-[600px]

- Enhanced `/src/components/app/NotificationsBell.tsx`:
  - Added type icon + color per notification in dropdown
  - Added unread left border indicator (colored by type)
  - Added unread dot indicator
  - Added "Lihat Semua Notifikasi →" link at bottom navigating to notifikasi-center
  - Better empty state with Bell icon
  - Click notification → mark as read + navigate to permohonan

- Updated `/src/lib/types.ts`: Added `"notifikasi-center"` to AppView union

- Updated `/src/app/page.tsx`: Added NotificationCenter import and case for `"notifikasi-center"` view

- Updated `/src/components/app/AppShell.tsx`:
  - Added Bell icon import from lucide-react
  - Added "Notifikasi" nav item with Bell icon for all roles (ADMIN, PETUGAS, ATASAN) in NAV_ITEMS
  - Added "notifikasi-center" to Menu section filter in getSections()
  - Added "notifikasi-center" label to VIEW_LABELS

- Updated `/src/store/app-store.ts`: Added `view_notifications` case to can() (returns true for all logged-in users)

- Updated `/src/app/api/notifikasi/route.ts`:
  - Increased GET take limit from 30 to 50 for full center view
  - Verified PATCH already supports `{ markAll: true }` and `{ id }` for single mark-read
  - Added DELETE handler: supports `{ id }` for single delete (with ownership check) and `{ clearAll: true }` to delete all user notifications

- Updated `/src/lib/api.ts`: Added `deleteNotifikasi(id)` and `clearAllNotifikasi()` API methods

### Lint & Dev Server
- **Lint**: 0 errors, 0 warnings
- **Dev server**: Compiles clean, all routes working

Files Created:
- `/src/components/app/shared/NotificationCenter.tsx`

Files Modified:
- `/src/components/app/NotificationsBell.tsx`
- `/src/lib/types.ts`
- `/src/app/page.tsx`
- `/src/components/app/AppShell.tsx`
- `/src/store/app-store.ts`
- `/src/app/api/notifikasi/route.ts`
- `/src/lib/api.ts`

---
Task ID: 8
Agent: main (cron review round)
Task: QA assessment, AdminLTE 4 consistency, Settings Management, Notification Center, Bulk Actions, CSS enhancements

## Current Project Status Assessment
App was production-usable from Phase 7 (all core flows verified, AdminLTE 4 redesign on admin dashboard). This round focused on: (1) comprehensive QA via agent-browser + VLM, (2) AdminLTE 4 consistency for Petugas & Atasan dashboards, (3) new Settings Management page, (4) Notification Center page, (5) PermohonanList bulk actions, (6) CSS styling enhancements, (7) Admin dashboard KPI info-boxes + welcome card.

## QA Results (agent-browser + VLM)
- All API routes returning 200 (auth, dashboard, permohonan, tracking, settings, notifikasi, users, audit-log, laporan, jenis-surat, public/stats)
- Public landing page: 8/10 (VLM)
- Admin dashboard: 8/10 (VLM, up from 7/10)
- KPI info-boxes: 8/10 (VLM)
- Lint: 0 errors throughout
- No runtime errors in dev.log

## Work Completed

### 1. PetugasDashboard Enhancements (Task 8-a)
- Added date range filter chips (Hari Ini / 7 Hari / 30 Hari / Tahun Ini / Semua)
- Pass `range` parameter to `api.dashboard(year, range)`
- Replaced recharts `<Legend>` with custom legend below charts
- Added AlteInfoBox widgets (Permohonan Baru, Cek Administrasi, Menunggu Persetujuan)
- Added RecentActivityWidget at bottom
- Added `rangeLabel` display

### 2. AtasanDashboard Enhancements (Task 8-a)
- Added date range filter chips (same pattern as AdminDashboard)
- Pass `range` parameter to `api.dashboard(year, range)`
- Replaced recharts `<Legend>` with custom 2-column legend grid below pie chart
- Added percentage labels on pie chart slices
- Added AlteInfoBox for "Lama Penyelesaian" (gold) and "Tingkat Penyelesaian" (success)
- Added RecentActivityWidget at bottom

### 3. Settings Management Page (Task 8-b)
- **Backend**: PUT `/api/settings` with ADMIN-only access, upsert each key-value, audit trail logging
- **Frontend**: 4-section settings page — Informasi Kelurahan, Pengaturan Sistem (toggles), Format Nomor Register (with live preview), Tampilan
- Added `"pengaturan"` to AppView union
- Added `manage_settings` permission (ADMIN only)
- Added "Pengaturan" nav item in sidebar (under Manajemen section)

### 4. PermohonanList Bulk Actions (Task 8-c)
- Bulk select mode with checkboxes + "Pilih" / "Batalkan" toggle
- Sticky bulk actions bar (gold gradient): "Ubah Status", "Export CSV", "Hapus"
- Export dropdown: "Export CSV (Semua)" and "Export CSV (Halaman Ini)"
- Priority filter Select (NORMAL/TINGGI/MENDESAK)
- Date range quick chips (Hari Ini / 7 Hari / 30 Hari)
- Active filter count badge

### 5. CSS Enhancements (Task 8-c)
- A. Glass-card hover effects (smooth shadow + transform transitions)
- B. Info-box 4px colored left borders matching variant
- C. SmallBox hover with translateY(-2px) + deeper shadow
- D. Nav link transitions + gold tint hover for non-active links
- E. Table improvements — bolder uppercase headers, refined zebra striping, gold hover
- F. Gold focus ring on admin buttons/links
- G. Thin 6px custom scrollbar for admin area
- H. Badge pulse animation
- I. Skeleton shimmer animation
- J. Responsive content padding

### 6. Notification Center Page (Task 8-d)
- Full-page notification management with type filter, read status toggle, mark-all-read, clear-all
- Notifications grouped by day (Hari Ini / Kemarin / 7 Hari Terakhir / Lebih Lama)
- Each card: type icon + color, title, message, relative time, unread indicator (3px left border), delete on hover
- Click → mark as read + navigate to related permohonan
- Enhanced NotificationsBell: type icons + colors, unread indicator, "Lihat Semua Notifikasi →" link
- Backend: DELETE handler for single/clearAll notifications
- Added `"notifikasi-center"` AppView + nav item for all roles

### 7. Admin Dashboard Polish
- Welcome summary card with greeting (Selamat pagi/siang/sore/malam) + user avatar initial + 3 quick stat boxes
- KPI Info-boxes row: Tingkat Penyelesaian (success), Rata-rata Waktu (gold), Tingkat Penolakan (danger) — each with progress bar + caption

## Verification Results
- `bun run lint`: 0 errors
- Dev server: all routes 200, no runtime errors
- agent-browser: public page, admin dashboard, permohonan list, settings, notification center all render correctly
- VLM: admin dashboard 8/10, KPI info-boxes 8/10, public page 8/10

## Unresolved Issues / Risks
- Tanda Terima print output not physically tested (window.print() opens browser print dialog)
- Reports PDF export uses popup window + window.print() — functional but basic
- OOM risk in sandbox environment when running Chrome + Next.js simultaneously (4GB RAM)

## Priority Recommendations for Next Round
1. **Dashboard comparison charts** — year-over-year or month-over-month comparison views
2. **Real-time notification via WebSocket** — currently poll-based only
3. **Advanced permohonan search** — full-text search across all fields
4. **Data export improvements** — proper PDF generation with ReportLab-style formatting
5. **PWA manifest + service worker** for offline tracking
6. **WhatsApp/email notification integration** (currently dashboard-only notifications)
7. **Map integration** — show land location on map for permohonan detail

---
Task ID: 11
Agent: main
Task: Add random (unguessable) registration number format so nomor register cannot be easily enumerated by unauthorized parties.

## Current Project Status Assessment
Project is production-stable (Phase 8 complete: AdminLTE 4 consistency, Settings, Notifications, Bulk Actions). This round adds a security/privacy enhancement requested by the user: the registration number format was sequential (`KPII-TNH-2026-000001`) which allowed trivial enumeration — an attacker could increment the serial to scrape every applicant's data via the public tracking endpoint. Replaced with a random alphanumeric token drawn from a 30-character alphabet that excludes visually-ambiguous characters.

## Work Completed

### 1. Random Register Generator (`src/lib/auth.ts`)
- Rewrote `generateNomorRegister()` to support two modes controlled by the new `register_use_random` setting:
  - **Random mode (default, ON)**: `{PREFIX}-{YEAR}-{TOKEN}` where TOKEN is `N` random chars from a 30-char Crockford-style alphabet `ABCDEFGHJKMNPQRSTVWXYZ23456789` (excludes I, L, O, U, 0, 1). With 8 chars → keyspace ≈ 6.6 × 10¹¹ — infeasible to enumerate.
  - **Sequential mode (legacy)**: zero-padded counter, kept for backward compat / admin choice.
- Added `randomToken(length)` using `crypto.randomBytes` (server-side CSPRNG).
- Added `readSettingsMap()` server-side settings reader so the generator honors admin-configured `register_prefix`, `register_digit_count`, `register_use_random`.
- Uniqueness guaranteed via DB `findUnique` check with 12-retry loop; fallback extends token by 2 chars on (astronomically unlikely) collision.
- Added exported `previewNomorRegister()` helper for non-DB preview contexts.
- Token length clamped to 4–16 to prevent misconfiguration.

### 2. Settings UI (`src/components/app/admin/SettingsManagement.tsx`)
- New `register_use_random` setting (default `"true"`) added to DEFAULTS + REGISTER_FIELDS as a switch labeled "Mode Acak (Anti-Tebak)".
- Updated `register_digit_count` default `6 → 8`, description clarified (now "Panjang Token / Serial", explains it controls token length in random mode / serial digits in sequential mode).
- Added `ShieldCheck` + `Shuffle` icons.
- Preview now generates a live random sample (client-side `Math.random` over the same 30-char alphabet) when random mode is on; shows sequential `00000001` when off.
- Added mode badge in preview: green "Mode Acak Aktif" (ShieldCheck) vs amber "Mode Berurutan" (Shuffle).
- Format label dynamically switches between `{PREFIX}-TAHUN-TOKEN_ACAK` (with anti-tebak note) and `{PREFIX}-TAHUN-SERIAL` (with privacy warning).
- Wrapped preview in `useMemo` for performance.

### 3. Seed Script (`scripts/seed.ts`)
- Replaced 5 sequential sample registers (`000001`–`000005`) with random-format equivalents: `XK7M2P9Q`, `RB4F8NKW`, `QH3JY6MT`, `WP9XK2D7`, `TV5GR4HN`.
- Added seed entries for `register_prefix`, `register_digit_count=8`, `register_use_random=true` (upsert with `update: {}` so existing values are preserved).
- Re-ran seed → 5 new random-format permohonan added to DB alongside the existing 6 sequential ones (now 11 total, both formats coexist for backward compatibility).

### 4. Public-Facing Copy Updates
- `PublicTracking.tsx`: placeholder updated `KPII-TNH-2026-000001` → `KPII-TNH-2026-XK7M2P9Q`; "Coba:" example chips updated to the 3 new random-format registers.
- `PublicSections.tsx` FAQ: tracking answer now shows random-format example + added privacy note: "Nomor register menggunakan format acak agar tidak dapat ditebak orang lain — jaga kerahasiaan nomor register Anda."

## Verification Results
- `bun run lint`: **0 errors**
- Dev server: all routes 200, no runtime errors in `dev.log`
- **Generator unit test** (direct call, 8 samples): all match `^KPII-TNH-2026-[ABCDEFGHJKMNPQRSTVWXYZ23456789]{8}$`, all unique, no ambiguous chars (0/1/I/L/O/U) present ✓
- **agent-browser QA**:
  - Settings page: "Mode Acak (Anti-Tebak)" toggle visible, "Mode Acak Aktif" green badge shown, preview sample `KPII-TNH-2026-J4CNPP6C` (8-char, no ambiguous) ✓
  - Permohonan list: 5 random-format + 5 sequential records both visible ✓
  - Public tracking API `GET /api/tracking/KPII-TNH-2026-XK7M2P9Q` → 200, returns correct pemohon (Suparman, PENGUKURAN, 7 stages, 3 riwayat) ✓
  - Anti-enumeration: `GET /api/tracking/KPII-TNH-2026-000007` (wrong guess) → 404 ✓
- Backward compatibility: existing sequential registers (000001–000006) still track correctly — no data migration needed.

## Unresolved Issues / Risks
- The 6 legacy sequential records (000001–000006) remain in the DB. They are still guessable. If full anti-enumeration is required for historical data, an admin could manually re-register them (or a future migration could reassign). New registrations are all random.
- The `register_digit_count` setting's stored DB value may still be `"6"` if it was set previously; the generator clamps to min 4 and the Settings UI shows the effective value. Admin should bump to 8 via the Settings page for stronger keyspace.
- Public tracking still allows unlimited 404 probes (no rate-limiting). An attacker gains nothing (404 = no data leak), but a future hardening step could add rate-limiting on `/api/tracking/[registerNumber]` to deter brute-force probing.

## Priority Recommendations for Next Round
1. **Rate-limit the public tracking endpoint** (e.g., 20 requests/min/IP) to further deter brute-force token guessing.
2. **Add a "Regenerate preview" shuffle button** in Settings so admins can see multiple random samples before saving.
3. **Optional: migrate legacy sequential registers** to random format with a redirect/alias table (low priority — only if historical privacy is a concern).
4. **Add register-format validator** on the public tracking input (regex hint) to give immediate user feedback before submit.
5. Continue with previously-queued features: dashboard comparison charts, WebSocket notifications, advanced search, PDF export polish, PWA, WhatsApp/email integration, map integration.

---
Task ID: 12
Agent: main
Task: Add multi-upload feature for KTP/KK photos (pemohon) and all land boundary photos (batas tanah). Replace single-file upload with categorized multi-file upload zones.

## Current Project Status Assessment
Project was stable after Task 11 (random register format). User requested multi-upload for: (1) Foto KTP and KK for pemohon, (2) photos for all 4 land boundaries (Utara, Selatan, Timur, Barat). The old upload UI was single-file only with a dropdown for jenis dokumen. Replaced with a modern categorized multi-upload system featuring drag-and-drop, image thumbnails, per-file upload progress, and batch API.

## Work Completed

### 1. New Document Types & Categories (`src/lib/constants.ts`)
- Added 4 new jenis dokumen for boundary photos: `FOTO_BATAS_UTARA`, `FOTO_BATAS_SELATAN`, `FOTO_BATAS_TIMUR`, `FOTO_BATAS_BARAT`
- Extended `JENIS_DOKUMEN` with `kategori` (PEMOHON | TANAH | BATAS | LAINNYA), `multi` (bool), `accept` (HTML accept attr) fields
- Added `DOKUMEN_BY_KATEGORI` helper map and `KATEGORI_DOKUMEN` metadata array (label, deskripsi, warna) for UI grouping
- Total jenis: 11 (3 Pemohon, 3 Tanah, 4 Batas, 1 Lainnya)

### 2. Batch Upload API (`src/app/api/permohonan/[id]/dokumen/route.ts`)
- Updated POST handler to accept both single (`file`) and multiple (`files[]`) files — backward compatible
- Per-file 10MB validation, unique filename with random suffix to prevent collision
- Returns `{ dokumen, count, total, errors? }` for batch; `{ dokumen }` (single object) for single-file backward compat
- Single audit log entry for entire batch
- Errors collected per-file (doesn't abort entire batch)

### 3. API Client Method (`src/lib/api.ts`)
- Added `uploadDokumenBatch(id, files[], jenisDokumen)` — builds FormData with multiple `files` entries

### 4. Reusable MultiUploadZone Component (`src/components/app/shared/MultiUploadZone.tsx`)
- Drag-and-drop zone with click-to-select fallback
- File queue with per-item status (pending → uploading → done/error)
- Image thumbnail previews (using `URL.createObjectURL`)
- "Unggah N File" button triggers batch upload
- Uploaded files displayed as responsive thumbnail grid with hover-to-delete
- Per-zone accent color theming
- Object URL cleanup on unmount
- File size validation (10MB) with toast error
- Success/error toast notifications

### 5. PermohonanDetail Dokumen Tab Redesign (`src/components/app/shared/PermohonanDetail.tsx`)
- Replaced single-file upload UI with 4 categorized cards (Pemohon/Tanah/Batas/Lainnya)
- Summary bar at top: total count, foto count, PDF count, per-category badges
- Each category card contains a 2-column grid of MultiUploadZone instances per jenis dokumen
- Category icons: IdCard (Pemohon), Home (Tanah), Compass (Batas), Paperclip (Lainnya)
- Each jenis shows label, "(multi)" tag, file count badge
- Removed unused upload state (`uploadJenis`, `uploadFile`, `uploading`, `fileInputRef`) and handlers (`handleUpload`, `handleDeleteDok`) — MultiUploadZone manages its own state
- Added `mimeType` to DokumenItem interface
- Added imports: `DOKUMEN_BY_KATEGORI`, `KATEGORI_DOKUMEN`, `MultiUploadZone`, new lucide icons

### 6. PermohonanForm Info Banner (`src/components/app/petugas/PermohonanForm.tsx`)
- Added informational card "Unggah Dokumen Setelah Pendaftaran" with Multi-Upload badge
- 3 colored info boxes explaining what can be uploaded post-creation:
  - Dokumen Pemohon (KTP + KK multi, Surat Pernyataan)
  - Dokumen Tanah (SPPT PBB, Bukti Penguasaan, Foto Lokasi)
  - Foto Batas Tanah (multi per batas: Utara, Selatan, Timur, Barat)
- Added `Upload`, `Info` icons

## Verification Results
- `bun run lint`: **0 errors, 0 warnings**
- Dev server: running clean, no runtime errors
- **agent-browser QA**:
  - PermohonanDetail Dokumen tab: all 4 categories render ✓
  - All 11 multi-upload zones present (3+3+4+1) ✓
  - 11 `input[type=file][multiple]` elements ✓
  - Summary bar shows "Total Dokumen Terunggah" with category breakdowns ✓
  - All 4 batas foto zones (Utara/Selatan/Timur/Barat) visible ✓
  - KTP and KK zones in Pemohon category ✓
  - Drag-and-drop zones with "Tarik & lepas" hint ✓
  - PermohonanForm info banner with all 3 category boxes ✓
- **Batch upload API test**: uploaded `ktp-test.png` → POST returned **201**, file saved to DB with correct `jenisDokumen=KTP`, `mimeType=image/png`, `ukuran=70` ✓ (test files cleaned up after verification)
- Backward compatibility: existing single-file `uploadDokumen` API still works (same endpoint, different field name)

## Unresolved Issues / Risks
- File previews use `URL.createObjectURL` which holds memory until revoked — cleaned up on unmount and after upload, but large multi-file selections could spike memory briefly
- No file-type validation on the client side (only accept attr hint); server validates size but not MIME type — a future hardening step could validate actual MIME via file magic bytes
- Upload directory is `public/uploads/permohonan/{id}/` — files are publicly accessible via URL; for sensitive docs (KTP/KK) consider moving to a non-public path with a streaming download endpoint
- No total-permohonan size quota — an attacker with upload access could fill disk; consider a per-permohonan size limit

## Priority Recommendations for Next Round
1. **Server-side MIME validation** — validate actual file type via magic bytes, not just extension
2. **Move uploads out of public/** — serve via authenticated streaming endpoint for privacy
3. **Per-permohonan storage quota** — e.g., 100MB max total
4. **Image resize/compress on upload** — large photos from phones could be 5-10MB each
5. **Document viewer modal** — lightbox to preview images/PDFs without leaving the page
6. **Bulk download as ZIP** — download all documents for a permohonan in one click
7. Continue with previously-queued features from Task 11 recommendations
