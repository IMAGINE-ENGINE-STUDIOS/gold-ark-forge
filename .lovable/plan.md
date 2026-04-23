

## Interactive Roadmap Tool for Super Admin

Add a new **Roadmap** tab in `/super-admin` with a dynamic, expandable goal-tracking system. Super Admins and Admins can create phases (e.g. "Q3 2026"), add goals under each phase, set target dates, track progress, and reorder/expand items inline.

### Features

- **Phases** (top-level groupings like "Q2 2026", "Launch Phase")
  - Title, start date, end date, color accent
  - Collapsible/expandable cards
  - Add/edit/delete inline
- **Goals** (nested under phases)
  - Title, description, target date, status (planned / in-progress / done / blocked), priority
  - Progress slider (0–100%)
  - Sub-goals (one level of nesting) — expand to add child items
  - Drag-free reordering via up/down arrows
- **Visual timeline strip** at top showing all phases as a horizontal bar with progress fill
- **Dynamic editing**: every field is click-to-edit inline (title, dates, status). Auto-save with `useAutoSave` after 1.5s of inactivity
- **Filters**: status filter chips, "show only my goals" toggle
- **Permissions**: Admins + Super Admins can edit; Super Admins only can delete phases

### Technical Plan

**1. Database (migration)**

```sql
CREATE TABLE public.roadmap_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  color TEXT DEFAULT 'gold',
  sort_order INT NOT NULL DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.roadmap_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_id UUID NOT NULL REFERENCES public.roadmap_phases(id) ON DELETE CASCADE,
  parent_goal_id UUID REFERENCES public.roadmap_goals(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  target_date DATE,
  status TEXT NOT NULL DEFAULT 'planned',  -- planned | in_progress | done | blocked
  priority TEXT NOT NULL DEFAULT 'medium', -- low | medium | high | critical
  progress INT NOT NULL DEFAULT 0,         -- 0..100
  sort_order INT NOT NULL DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**RLS**:
- SELECT: any authenticated admin OR super_admin
- INSERT/UPDATE: admin OR super_admin
- DELETE: super_admin only (on phases); admin OR super_admin (on goals)

**2. Hook** — `src/hooks/useRoadmap.ts`
- `useRoadmapPhases()` — fetch phases + nested goals
- `useUpsertPhase()`, `useDeletePhase()`, `useReorderPhase()`
- `useUpsertGoal()`, `useDeleteGoal()`, `useReorderGoal()`
- React Query invalidation on every mutation

**3. Components** (under `src/components/super-admin/roadmap/`)
- `RoadmapBoard.tsx` — main container, timeline strip + phase list + "Add Phase" button
- `PhaseCard.tsx` — collapsible phase with header (inline-editable title/dates), goals list, "Add Goal"
- `GoalRow.tsx` — inline-editable row: title, status badge, priority dot, progress slider, target date popover (using shadcn Calendar with `pointer-events-auto`), expand chevron for sub-goals
- `RoadmapTimelineStrip.tsx` — horizontal bar showing each phase proportionally with progress fill
- `RoadmapFilters.tsx` — status + priority filter chips

**4. Wire into `SuperAdmin.tsx`**
- Add `<TabsTrigger value="roadmap">` with `Map` icon from lucide-react
- Add `<TabsContent value="roadmap"><RoadmapBoard /></TabsContent>`

### Layout

```text
┌─ Roadmap Board ────────────────────────────────────────┐
│ [Timeline strip: ▓▓░░ ▓▓▓░ ▓▓▓▓ ░░░░ ]                │
│ [Filters: All | Planned | In Progress | Done | Blocked]│
│                                                        │
│ ▼ Q2 2026  [Apr 1 → Jun 30]              [+ Goal] [⋮] │
│   ▸ ● Public launch        ━━━━━━━━░░ 80%  [Jun 15]   │
│   ▸ ◐ Vault partners       ━━━━░░░░░░ 40%  [May 30]   │
│      └─ ○ Sub: legal review                           │
│   ▸ ○ BTC anchoring v1     ░░░░░░░░░░  0%  [Jun 30]   │
│                                                        │
│ ▶ Q3 2026  [Jul 1 → Sep 30]              [+ Goal] [⋮] │
│                                                        │
│ [+ Add Phase]                                          │
└────────────────────────────────────────────────────────┘
```

Aesthetic follows existing Super Admin tab: gold accents, `bg-card/40`, `font-display` headings, primary/20 borders.

