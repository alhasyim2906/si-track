# Task 8-c: Enhance global CSS styling + add PermohonanList bulk select/export features

## Agent: full-stack-developer
## Status: Completed

## Summary

### Part 1: Global CSS Enhancements (globals.css)
Added 10 CSS enhancement blocks (A–J):
- A. Enhanced glass-card hover (transition + shadow)
- B. Info-box left border color matching variant (4px)
- C. SmallBox hover (translateY + deeper shadow)
- D. Nav link improvements (transition + gold tint hover)
- E. Table improvements (bolder uppercase headers, zebra, hover)
- F. Button focus ring (gold outline)
- G. Thin scrollbar for admin area (6px, transparent track)
- H. Badge pulse animation
- I. Skeleton shimmer animation
- J. Content area responsive padding

### Part 2: PermohonanList Bulk Actions
- Bulk select mode toggle ("Pilih"/"Batalkan" buttons)
- Selection count badge
- Checkboxes only visible in bulk mode
- Sticky gold-gradient bulk action bar with:
  - "Ubah Status" → Dialog (status Select + catatan Input)
  - "Export CSV" → exports selected items
  - "Hapus" → AlertDialog confirm → bulk delete
- Export dropdown in header (Export All / Export Current Page)
- Priority filter Select (NORMAL/TINGGI/MENDESAK)
- Date range quick chips (Hari Ini, 7 Hari, 30 Hari)
- Active filter count badge
- Permission-gated actions (canChangeStatus, canDelete)

### API Route
- `/api/permohonan` already supports `prioritas` param — no changes needed

### Quality
- Lint: 0 errors, 0 warnings
- Dev server: compiles clean

## Files Modified
- `/src/app/globals.css`
- `/src/components/app/petugas/PermohonanList.tsx`
