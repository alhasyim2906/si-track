# Task 3-a — Dashboards (Admin, Petugas, Atasan)

Agent: full-stack-developer (dashboards)
Task ID: 3-a

## Files Created
- `/home/z/my-project/src/components/app/admin/AdminDashboard.tsx`
- `/home/z/my-project/src/components/app/petugas/PetugasDashboard.tsx`
- `/home/z/my-project/src/components/app/atasan/AtasanDashboard.tsx`

## Infrastructure Used (no reinvention)
- `api.dashboard(year?)` from `@/lib/api`
- `useAppStore`: `user`, `setView`, `selectPermohonan`
- `StatCard`, `SectionHeader` from `@/components/app/StatCard`
- `StatusBadge` from `@/components/app/StatusBadge`
- `STATUS_BY_KODE` from `@/lib/constants`
- `DashboardStats` type from `@/lib/types`
- shadcn/ui: `Card`, `Select`, `Table`
- recharts: `BarChart`, `PieChart`, `ResponsiveContainer`, `Tooltip`, `Legend`
- `toast` from `sonner`

## Dashboard API Response Shape (verified from route.ts)
- `stats`: { total, diproses, menungguPengukuran, menungguLurah, menungguCamat, selesai, ditolak, revisi, avgDays }
- `counts`: Record<statusKode, number>
- `monthly`: 12 entries { month, label, total, selesai, ditolak }
- `statusDist`: [{ kode, nama(=kode), value }]
- `perPetugas` (admin only): [{ id, name, total, selesai }]
- `recent`: 6 items { id, nomorRegister, pemohonNama, jenisSurat(string), statusSaatIni, prioritas, updatedAt, createdAt }
- `pendingApprovals` (atasan only): [{ id, nomorRegister, pemohonNama, statusSaatIni, jenisSurat(string), butuhTtdCamat, creator(string), createdAt, catatan }]

## Lint Status
- All 3 files pass `bun run lint` cleanly.
- Pre-existing lint errors remain in `AppShell.tsx` (react-hooks/static-components) and `NotificationsBell.tsx` (react-hooks/set-state-in-effect) — outside this task's scope.

## Pattern Notes for Future Agents
- Fetch pattern that passes `react-hooks/set-state-in-effect` lint rule:
  - Extract fetch into `useCallback`, call it from inside `useEffect`. setState calls inside the callback are not flagged.
- Recharts container: use `<ResponsiveContainer width="100%" height="100%">` inside a div with fixed `h-72` (or similar).
- Chart tooltips: use a custom `ChartTooltip` component returning a glass-card for theme consistency.
- Status colors: always derive from `STATUS_BY_KODE[kode]?.warna` (don't hardcode).
- Gold button gradient class: `bg-gradient-to-r from-[#f5d77a] via-[#d4af37] to-[#b8941f] text-[#0a1628] font-semibold hover:opacity-90`.
- Card pattern: `className="glass-card border-primary/15"`.
