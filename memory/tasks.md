# Task Tracking: Labels & Subtasks Implementation

## Status: Completed

### Backend & Schema

- [x] **Schema**: Define `labels` and `subtasks` tables in `convex/schema.ts`.
- [x] **Schema**: Add `labelIds` to `tasks` table.
- [x] **API**: Create `convex/labels.ts` (list, create, delete).
- [x] **API**: Create `convex/subtasks.ts` (list, create, toggle, remove).
- [x] **API**: Update `convex/tasks.ts` `update` mutation to handle `labelIds`.

### Frontend Components

- [x] **UI Primitives**: Add `Popover`, `Command`, `Checkbox`, `Input` from text/registry.
- [x] **Component**: Create `SubtaskList.tsx` with progress calculation.
- [x] **Component**: Create `TaskDetailModal.tsx` as the main editing interface.
- [x] **Feature**: Implement Label Picker with Search.
- [x] **Feature**: Implement "Create Label" flow with Color Picker.
- [x] **Update**: Modify `TaskItem.tsx` to display badges and progress.
- [x] **Update**: Modify `ProjectPage.tsx` to include Label Filter.

### Verification & Polish

- [x] **Linting**: Fix unused variables and imports.
- [x] **Accessibility**: Add `onKeyDown` and ARIA roles to clickable divs (`TaskItem`, `TaskDetailModal`).
- [x] **Bug Fix**: Fix syntax error in `ProjectPage.tsx` (stray characters).
- [x] **Bug Fix**: Fix `autoFocus` lint error in Label Creator.

## Future / Pending

- [ ] **Feature**: Drag and Drop reordering for Subtasks.
- [ ] **Feature**: Edit existing Label (Rename/Recolor).
- [ ] **Refactor**: Extract `LabelBadge` component for reuse.
